import React, { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Slider as MUISlider } from '@material-ui/core';

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

export const dates = [
  new Date('2010-08-02'),
  new Date('2011-08-02'),
  new Date('2012-08-02'),
  new Date('2013-08-02'),
  new Date('2014-08-02'),
  new Date('2015-08-02'),
  new Date('2016-08-02'),
  new Date('2017-08-02'),
  new Date('2018-08-02'),
];

// TODO: resolve timezone issue requiring dates to be -02 instead of -01
// (maybe no longer an issue after moving from labeled buttons to slider?)
export const DATE_DOMAIN = [new Date('2010-08-02'), new Date('2020-01-02')];

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

function formatDate(date) {
  return `${date.getFullYear()}.${date.toLocaleDateString('en-US', {
    month: 'short',
  })}`;
}

export default function Slider({ currentDate, setCurrentDate }) {
  const [sliderValue, setSliderValue] = useState(currentDate.getTime());
  const [debouncedSetDate] = useDebouncedCallback(value => {
    // console.log('debounced setCurrentDate to value:', value);
    setCurrentDate(value);
  }, 100);
  const onChange = (event, value) => {
    // Immediately update slider thumb position
    setSliderValue(value);
    // Update currentDate on a debounce
    debouncedSetDate(new Date(value));
  };

  return (
    <MUISlider
      min={DATE_DOMAIN[0].getTime()}
      max={DATE_DOMAIN[1].getTime()}
      marks={ticks}
      value={sliderValue}
      onChange={onChange}
      aria-labelledby={'continuous-slider'}
    />
  );
  /*
  return new Array(5).fill(0).map((_, i) => (
    <div key={`buttons-${i}`}>
      {dates.map(date => {
        const d = new Date(date.getTime());
        d.setMonth(d.getMonth() + i);
        const label = formatDate(d);
        return (
          <Button
            key={label}
            onClick={() => setCurrentDate(d)}
            isCurrent={d.getTime() === currentDate.getTime()}
          >
            {label}
          </Button>
        );
      })}
    </div>
  ));
  */
}

Slider.propTypes = {
  currentDate: PropTypes.instanceOf(Date),
  setCurrentDate: PropTypes.func,
};
