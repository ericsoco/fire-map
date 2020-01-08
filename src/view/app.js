import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { stateConfigs } from '../constants';
import Map from './map';
import Slider, { dates } from './slider';

const Title = styled.h1`
  color: ${p => p.theme.color};
  ${p => p.theme.mixins.h1};
  margin-bottom: 1rem;
`;
const Overlay = styled.div`
  position: absolute;
  padding: 1rem;
`;

function getStateConfig(routeParams) {
  const code = (
    routeParams.stateCode || Object.keys(stateConfigs)[0]
  ).toUpperCase();
  return {
    code,
    name: stateConfigs[code].name,
  };
}

function formatDate(date) {
  return `${date.getFullYear()}.${date.toLocaleDateString('en-US', {
    month: 'short',
  })}`;
}

export default function App({ match }) {
  const stateConfig = getStateConfig(match.params);
  const [currentDate, setCurrentDate] = useState(dates[0]);
  return (
    <div>
      <Map stateCode={stateConfig.code} currentDate={currentDate} />
      <Overlay>
        <Title>{`${stateConfig.name} Wildfires through ${formatDate(
          currentDate
        )}`}</Title>
        <Slider currentDate={currentDate} setCurrentDate={setCurrentDate} />
      </Overlay>
    </div>
  );
}

App.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      stateCode: PropTypes.string,
    }),
  }),
};
