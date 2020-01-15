import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useDebouncedCallback } from 'use-debounce';
import PropTypes from 'prop-types';
import { Slider as MUISlider } from '@material-ui/core';

import { setCurrentDate, DATE_DOMAIN } from '../state/ui-reducer';

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
    // setCurrentDate(value);
    dispatch(setCurrentDate(value));
  }, 1);
  const onChange = (event, value) => {
    // Immediately update slider thumb position
    setSliderValue(value);
    // Update currentDate on a debounce
    debouncedSetDate(new Date(value));
  };

  return (
    <MUISlider
      min={DATE_DOMAIN.min.getTime()}
      max={DATE_DOMAIN.max.getTime()}
      marks={ticks}
      value={sliderValue}
      onChange={onChange}
      aria-labelledby={'continuous-slider'}
    />
  );
}

Slider.propTypes = {
  currentDate: PropTypes.instanceOf(Date),
};
