import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

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

function formatDate(date) {
  return `${date.getFullYear()}.${date.toLocaleDateString('en-US', {
    month: 'short',
  })}`;
}

export default function Slider({ currentDate, setCurrentDate }) {
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
}

Slider.propTypes = {
  currentDate: PropTypes.instanceOf(Date),
  setCurrentDate: PropTypes.func,
};
