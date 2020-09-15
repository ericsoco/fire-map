import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { ResponsiveBar } from '@nivo/bar';

// import { getPointTooltipProps } from './slider-tooltip';

const ChartContainer = styled.div`
  position: absolute;
  bottom: 1rem;
  left: 0;
  width: 100%;
  height: 3rem;
`;

const barProps = {
  margin: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  axisBottom: null,
  axisLeft: null,
  enableGridX: false,
  enableGridY: false,
  enableLabel: false,
  legends: [],
  animate: true,
  motionStiffness: 90,
  motionDamping: 15,
  minValue: 0,
  maxValue: 'auto',
  padding: 0.1,
  isInteractive: true,
  colors: ['rgb(235, 146, 103)'],
  xScale: {
    type: 'time',
    format: '%m %Y',
    precision: 'month',
  },
  xFormat: 'time:%Y-%m',
  yScale: {
    type: 'linear',
    min: 0,
    max: 'auto',
  },
  // theme: {
  //   tooltip: {
  //     container: {
  //       background: rgba(0,0,0,0),
  //       borderRadius: 0,
  //       boxShadow: none,
  //       padding: 0
  //     }
  //   }
  // },
  layout: 'vertical',
  indexBy: 'date',
  keys: ['value'],
};

export default function SliderBarChart({ currentDate, data }) {
  console.log({ currentDate, data });
  // TODO: highlight currentDate
  // TODO: tooltip
  return (
    <ChartContainer>
      <ResponsiveBar
        data={data}
        {...barProps} /*{...getPointTooltipProps()}*/
      />
    </ChartContainer>
  );
}

SliderBarChart.propTypes = {
  currentDate: PropTypes.instanceOf(Date),
  data: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.number })),
};
