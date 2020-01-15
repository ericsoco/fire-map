import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDebouncedCallback } from 'use-debounce';
import PropTypes from 'prop-types';
import { Slider as MUISlider } from '@material-ui/core';
import {
  PauseCircleOutlineRounded,
  PlayCircleOutlineRounded,
} from '@material-ui/icons';
import styled from 'styled-components';

import {
  setCurrentDate,
  startPlayback,
  stopPlayback,
  DATE_DOMAIN,
} from '../state/ui-reducer';
import { selectPlaybackStart } from '../state/ui-selectors';
import useInterval from '../hooks/use-interval';

const Button = styled.button`
  background-color: ${p =>
    p.isCurrent ? 'rgba(153, 153, 255, 0.5)' : 'rgba(255, 255, 255, 0.5)'};
  border-radius: 0.25rem;
  padding: 0.5rem;
  margin: 0 0.5rem 0.5rem 0;
  font-size: 1rem;
  cursor: pointer;
  width: 100px;
`;

const ticks = [
  new Date('2010-07-02'),
  new Date('2010-08-02'),
  new Date('2010-09-02'),
  new Date('2010-10-02'),
  new Date('2010-11-02'),
  new Date('2010-12-02'),
  new Date('2011-01-02'),
  new Date('2011-03-02'),
  new Date('2011-07-02'),
  new Date('2011-08-02'),
  new Date('2011-09-02'),
  new Date('2011-10-02'),
  new Date('2011-11-02'),
  new Date('2011-12-02'),
  new Date('2012-01-02'),
  new Date('2012-03-02'),
  new Date('2012-07-02'),
  new Date('2012-08-02'),
  new Date('2012-09-02'),
  new Date('2012-10-02'),
  new Date('2012-11-02'),
  new Date('2012-12-02'),
  new Date('2013-01-02'),
  new Date('2013-03-02'),
  new Date('2013-07-02'),
  new Date('2013-08-02'),
  new Date('2013-09-02'),
  new Date('2013-10-02'),
  new Date('2013-11-02'),
  new Date('2013-12-02'),
  new Date('2014-01-02'),
  new Date('2014-03-02'),
  new Date('2014-07-02'),
  new Date('2014-08-02'),
  new Date('2014-09-02'),
  new Date('2014-10-02'),
  new Date('2014-11-02'),
  new Date('2014-12-02'),
  new Date('2015-01-02'),
  new Date('2015-03-02'),
  new Date('2015-07-02'),
  new Date('2015-08-02'),
  new Date('2015-09-02'),
  new Date('2015-10-02'),
  new Date('2015-11-02'),
  new Date('2015-12-02'),
  new Date('2016-01-02'),
  new Date('2016-03-02'),
  new Date('2016-07-02'),
  new Date('2016-08-02'),
  new Date('2016-09-02'),
  new Date('2016-10-02'),
  new Date('2016-11-02'),
  new Date('2016-12-02'),
  new Date('2017-01-02'),
  new Date('2017-03-02'),
  new Date('2017-07-02'),
  new Date('2017-08-02'),
  new Date('2017-09-02'),
  new Date('2017-10-02'),
  new Date('2017-11-02'),
  new Date('2017-12-02'),
  new Date('2018-01-02'),
  new Date('2018-03-02'),
  new Date('2018-07-02'),
  new Date('2018-08-02'),
  new Date('2018-09-02'),
  new Date('2018-10-02'),
  new Date('2018-11-02'),
  new Date('2018-12-02'),
  new Date('2019-01-02'),
  new Date('2019-03-02'),
  new Date('2019-07-02'),
  new Date('2019-08-02'),
  new Date('2019-09-02'),
  new Date('2019-10-02'),
  new Date('2019-11-02'),
  new Date('2019-12-02'),
  new Date('2020-01-02'),
].map(d => ({
  value: d.getTime(),
  label: formatDateTick(d),
}));

function formatDateTick(date) {
  return date.getMonth() === 0
    ? `'${`${date.getFullYear()}`.slice(-2)}`
    : date.getMonth() === 2
    ? '→'
    : date.getMonth() % 3 === 0
    ? `${date.toLocaleDateString('en-US', { month: 'short' })}`
    : '';
}

// TODO: added debouncing to make dynamic loading smoother
// and avoid unnecessary/duplicate requests. but...
// i don't think there's actually a risk of that,
// and more responsive UI calls for removing debounce.
// Give that a shot and see how it feels.
export default function Slider({ currentDate }) {
  const [sliderValue, setSliderValue] = useState(currentDate.getTime());
  const dispatch = useDispatch();

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
  // One day per tick
  const TIME_PER_TICK = 24 * 60 * 60 * 1000;
  // 60 ticks / sec = 1 year every ~6 seconds
  const PLAYBACK_INTERVAL = 33;
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
    <>
      <Button onClick={onPlayButtonClick}>
        {playbackStart ? (
          <PauseCircleOutlineRounded />
        ) : (
          <PlayCircleOutlineRounded />
        )}
      </Button>
      <MUISlider
        min={DATE_DOMAIN.min.getTime()}
        max={DATE_DOMAIN.max.getTime()}
        marks={ticks}
        value={sliderValue}
        onChange={onSliderChange}
        aria-labelledby={'continuous-slider'}
      />
    </>
  );
}

Slider.propTypes = {
  currentDate: PropTypes.instanceOf(Date),
};
