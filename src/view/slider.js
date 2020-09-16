import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDebouncedCallback } from 'use-debounce';
import PropTypes from 'prop-types';
import MUISlider from '@material-ui/core/slider';
import {
  PauseCircleOutlineRounded,
  PlayCircleOutlineRounded,
} from '@material-ui/icons';
import { withStyles } from '@material-ui/core/styles';
import MUITooltip from '@material-ui/core/Tooltip';
import styled from 'styled-components';

import {
  setCurrentDate,
  startPlayback,
  stopPlayback,
  DATE_DOMAIN,
} from '../state/ui-reducer';
import { selectPlaybackStart } from '../state/ui-selectors';
import useInterval from '../hooks/use-interval';
import useFireMetadata from '../hooks/use-fire-metadata';
import SliderBarChart, { HEIGHT as BAR_CHART_HEIGHT } from './slider-bar-chart';

const Container = styled.div`
  grid-column: 2 / 3;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Button = styled.button`
  border-radius: 0.25rem;
  padding: 1rem;
  font-size: 1rem;
  cursor: pointer;
`;

const SliderContainer = styled.div`
  position: relative;
  width: 100%;
  margin: 0 1rem -1.5rem 0;
`;

const SLIDER_COLOR = [235, 146, 103];
const SLIDER_TRACK_WIDTH = 2;
const StyledMUISlider = withStyles({
  root: {
    height: SLIDER_TRACK_WIDTH,
    color: `rgb(${SLIDER_COLOR.join()})`,
    padding: `${BAR_CHART_HEIGHT} 0 1rem 0`,
  },
  thumb: {
    height: 20,
    width: 20,
    backgroundColor: 'rgb(255, 255, 255, 0.65)',
    border: '2px solid currentColor',
    marginTop: -8,
    marginLeft: -10,
    '&:focus, &:hover, &$active': {
      boxShadow: 'inherit',
    },
  },
  active: {},
  valueLabel: {
    left: 'calc(-50% + 10px)',
    top: -22,
    '& *': {
      background: 'transparent',
      color: '#000',
    },
  },
  mark: {
    height: 2 * SLIDER_TRACK_WIDTH,
    width: 2 * SLIDER_TRACK_WIDTH,
    marginTop: -SLIDER_TRACK_WIDTH,
    borderRadius: 2 * SLIDER_TRACK_WIDTH,
    border: `1px solid rgb(${SLIDER_COLOR.join()})`,
    background: 'none',
  },
  markLabel: {
    top: `calc(${BAR_CHART_HEIGHT} + 0.75rem)`,
  },
  track: {
    height: SLIDER_TRACK_WIDTH,
    borderRadius: 0.5 * SLIDER_TRACK_WIDTH,
  },
  rail: {
    height: SLIDER_TRACK_WIDTH,
    borderRadius: SLIDER_TRACK_WIDTH,
  },
})(MUISlider);

const StyledTooltip = withStyles(theme => ({
  tooltip: {
    backgroundColor: theme.palette.common.white,
    color: 'rgba(0, 0, 0, 0.87)',
    boxShadow: theme.shadows[1],
    fontSize: 11,
  },
}))(MUITooltip);

function SliderTooltip({ children, open, value }) {
  return (
    <StyledTooltip
      open={open}
      enterTouchDelay={0}
      placement="bottom"
      title={formatDateTooltip(value)}
    >
      {children}
    </StyledTooltip>
  );
}
SliderTooltip.propTypes = {
  children: PropTypes.element.isRequired,
  open: PropTypes.bool.isRequired,
  value: PropTypes.number.isRequired,
};

function deriveTicks({ min, max }) {
  let ticks = [];

  // Start and end at either Jan 1 or Jul 1, before min / after max
  let start = new Date(min.getFullYear(), min.getMonth());
  start.setMonth(min.getMonth() < 6 ? 0 : 6);
  let end = new Date(max.getFullYear(), max.getMonth());
  end.setMonth(max.getMonth() < 6 ? 6 : 12);

  for (let d = start; d <= end; d.setMonth(d.getMonth() + 6)) {
    ticks.push({
      value: d.getTime(),
      label: formatDateTick(d),
    });
  }
  return ticks;
}
const ticks = deriveTicks(DATE_DOMAIN);

function formatDateTick(date) {
  return date.getMonth() === 0
    ? date.toLocaleDateString(undefined, {
        year: 'numeric',
      })
    : '';
}

function formatDateTooltip(ts) {
  return new Date(ts).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// One day per tick
const TIME_PER_TICK = 24 * 60 * 60 * 1000;
// 60 ticks / sec = 1 year every ~6 seconds
const PLAYBACK_INTERVAL = 33;

/**
 * Flatten metadata across all years into a single array
 * and process for consumption by simple-bar-chart (@nivo/bar)
 */
function processMetadata(metadataRequests) {
  if (!metadataRequests) return [];
  return Object.keys(metadataRequests).reduce(
    (metadata, year) =>
      metadata.concat(
        metadataRequests[year].data.acresPerMonth.map((acres, i) => ({
          date: `${year}-${i}`,
          value: acres,
        }))
      ),
    []
  );
}

// TODO: added debouncing to make dynamic loading smoother
// and avoid unnecessary/duplicate requests. but...
// i don't think there's actually a risk of that,
// and more responsive UI calls for removing debounce.
// Give that a shot and see how it feels.
export default function Slider({ currentDate }) {
  const [sliderValue, setSliderValue] = useState(currentDate.getTime());
  const dispatch = useDispatch();

  const metadata = useFireMetadata();
  const barChartData = useMemo(() => processMetadata(metadata), [metadata]);

  const [debouncedSetDate] = useDebouncedCallback(value => {
    // console.log('debounced setCurrentDate to value:', value);
    dispatch(setCurrentDate(value));
  }, 1);
  const onSliderChange = (event, value) => {
    // Immediately update slider thumb position and stop playback
    setSliderValue(value);
    dispatch(stopPlayback());
    // Update currentDate on a debounce
    debouncedSetDate(new Date(value));
  };

  // TODO: abstract this into its own component / hook
  const playbackStart = useSelector(selectPlaybackStart());
  useInterval(
    () => {
      if (playbackStart) {
        const elapsedTime = performance.now() - playbackStart.time;
        const nextDateTime = Math.min(
          playbackStart.date.getTime() +
            (elapsedTime / PLAYBACK_INTERVAL) * TIME_PER_TICK,
          DATE_DOMAIN.max.getTime()
        );
        dispatch(setCurrentDate(new Date(nextDateTime)));
        setSliderValue(nextDateTime);

        if (nextDateTime >= DATE_DOMAIN.max.getTime()) {
          dispatch(stopPlayback());
        }
      }
    },
    playbackStart ? PLAYBACK_INTERVAL : null
  );

  const onPlayButtonClick = playbackStart
    ? () => dispatch(stopPlayback())
    : () =>
        dispatch(startPlayback({ date: currentDate, time: performance.now() }));

  return (
    <Container>
      <Button onClick={onPlayButtonClick}>
        {playbackStart ? (
          <PauseCircleOutlineRounded />
        ) : (
          <PlayCircleOutlineRounded />
        )}
      </Button>
      <SliderContainer>
        <SliderBarChart data={barChartData} currentDate={currentDate} />
        <StyledMUISlider
          min={DATE_DOMAIN.min.getTime()}
          max={DATE_DOMAIN.max.getTime()}
          marks={ticks}
          value={sliderValue}
          valueLabelDisplay={'auto'}
          ValueLabelComponent={SliderTooltip}
          onChange={onSliderChange}
          aria-labelledby={'continuous-slider'}
        />
      </SliderContainer>
    </Container>
  );
}

Slider.propTypes = {
  currentDate: PropTypes.instanceOf(Date),
};
