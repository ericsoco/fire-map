import React, { forwardRef, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'd3-format';
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
import { colors } from './style/theme';
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

const SliderTooltipContent = styled.div`
  padding: 0.5rem;
  font-size: 0.75rem;
  p:last-child {
    padding-top: 0.25rem;
    font-size: 1rem;
  }
  span {
    font-weight: bold;
    margin-right: 0.25rem;
  }
`;

const SLIDER_TRACK_WIDTH = 2;
const StyledMUISlider = withStyles({
  root: {
    height: SLIDER_TRACK_WIDTH,
    color: `rgb(${colors.SLIDER.join()})`,
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
  mark: {
    height: 2 * SLIDER_TRACK_WIDTH,
    width: 2 * SLIDER_TRACK_WIDTH,
    marginTop: -SLIDER_TRACK_WIDTH,
    borderRadius: 2 * SLIDER_TRACK_WIDTH,
    border: `1px solid rgb(${colors.SLIDER.join()})`,
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
    opacity: 0.35,
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
const step = 24 * 60 * 60 * 1000;

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
    month: 'long',
  });
}

const formatAcres = format('.2s');

// One day per tick
const TIME_PER_TICK = 24 * 60 * 60 * 1000;
// 60 ticks / sec = 1 year every ~6 seconds
const PLAYBACK_INTERVAL = 33;

function formatBarChartDate(year, month) {
  return `${year}-${month}`;
}

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
          date: formatBarChartDate(year, i),
          value: acres,
          ts: new Date(year, i).getTime(),
        }))
      ),
    []
  );
}

function getCurrentBarIndex(barChartData, ts) {
  const d = new Date(ts);
  const dateStr = formatBarChartDate(d.getFullYear(), d.getMonth());
  return barChartData.findIndex(({ date }) => date === dateStr);
}

function getAcresForDate(data, ts) {
  let i = 0;
  let datum = data[i++];
  if (!datum || ts < datum.ts) return null;
  while (datum && ts > datum.ts) {
    datum = data[i++];
  }
  return datum?.value ? formatAcres(datum.value) : null;
}

export default function Slider({ currentDate }) {
  const [isHovered, setIsHovered] = useState(false);
  const [sliderValue, setSliderValue] = useState(currentDate.getTime());
  const dispatch = useDispatch();

  const metadata = useFireMetadata();
  const barChartData = useMemo(() => processMetadata(metadata), [metadata]);
  const currentBarIndex = getCurrentBarIndex(barChartData, sliderValue);

  const onSliderChange = (event, value) => {
    // Immediately update slider thumb position and stop playback
    setSliderValue(value);
    dispatch(stopPlayback());
    dispatch(setCurrentDate(new Date(value)));
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

  // Tooltip component inlined + memoized here to provide access
  // to barChartData for tooltip generation
  const MemoizedTooltip = useMemo(() => {
    const WrappedTooltip = forwardRef(({ children, open, value }, ref) => {
      const acres = getAcresForDate(barChartData, value);
      return (
        <StyledTooltip
          ref={ref}
          open={open}
          enterTouchDelay={0}
          placement="bottom"
          title={
            <SliderTooltipContent>
              <p>{formatDateTooltip(value)}</p>
              {acres && (
                <p>
                  <span>{acres}</span>
                  {'acres 🔥'}
                </p>
              )}
            </SliderTooltipContent>
          }
        >
          {children}
        </StyledTooltip>
      );
    });
    WrappedTooltip.displayName = 'WrappedTooltip';
    WrappedTooltip.propTypes = {
      children: PropTypes.element.isRequired,
      open: PropTypes.bool.isRequired,
      value: PropTypes.number.isRequired,
    };
    return WrappedTooltip;
  }, [barChartData]);

  const showTooltip = playbackStart || isHovered;

  return (
    <Container
      onMouseOver={() => setIsHovered(true)}
      onMouseOut={() => setIsHovered(false)}
    >
      <Button onClick={onPlayButtonClick}>
        {playbackStart ? (
          <PauseCircleOutlineRounded />
        ) : (
          <PlayCircleOutlineRounded />
        )}
      </Button>
      <SliderContainer>
        <SliderBarChart data={barChartData} currentIndex={currentBarIndex} />
        <StyledMUISlider
          min={DATE_DOMAIN.min.getTime()}
          max={DATE_DOMAIN.max.getTime()}
          marks={ticks}
          step={step}
          value={sliderValue}
          valueLabelDisplay={showTooltip ? 'on' : 'auto'}
          ValueLabelComponent={MemoizedTooltip}
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
