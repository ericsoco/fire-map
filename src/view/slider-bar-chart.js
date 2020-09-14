import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const ChartContainer = styled.div`
  position: absolute;
  bottom: 1rem;
  left: 0;
  width: 100%;
  height: 3rem;
`;

export default function SliderBarChart({ currentDate, data }) {
  console.log({ currentDate, data });
  // TODO: import or just copy BaseBar
  return <ChartContainer></ChartContainer>;
}

SliderBarChart.propTypes = {
  currentDate: PropTypes.instanceOf(Date),
  data: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.number })),
};
