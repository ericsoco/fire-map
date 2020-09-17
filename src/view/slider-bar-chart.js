import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { ResponsiveBar } from '@nivo/bar';

import { colors } from './style/theme';

export const HEIGHT = '3rem';
const ChartContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: ${HEIGHT};
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
  layout: 'vertical',
  indexBy: 'date',
  keys: ['value'],
  theme: {
    tooltip: {
      container: {
        background: 'rgba(0,0,0,0)',
        borderRadius: 0,
        boxShadow: 'none',
        padding: 0,
      },
    },
  },
};

export default function SliderBarChart({ currentIndex, data }) {
  return (
    <ChartContainer>
      <ResponsiveBar
        {...barProps}
        data={data}
        colors={({ index }) =>
          index - 1 < currentIndex
            ? `rgba(${colors.SLIDER.join()}, 1)`
            : index - 1 === currentIndex
            ? `rgba(${colors.FIRE.join()}, 1)`
            : `rgba(${colors.SLIDER.join()}, 0.35)`
        }
      />
    </ChartContainer>
  );
}

SliderBarChart.propTypes = {
  currentIndex: PropTypes.number,
  data: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.number })),
};
