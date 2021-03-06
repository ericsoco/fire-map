import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { selectCurrentDate } from '../state/ui-selectors';

import { stateConfigs } from '../constants';
import Map from './map';
import Slider from './slider';

const Overlay = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;

  padding: 1rem 1rem 4rem 1rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
`;
const Title = styled.h1`
  color: ${p => p.theme.color};
  ${p => p.theme.mixins.h1};
  margin-bottom: 1rem;
  pointer-events: auto;
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
    day: '2-digit',
  })}`;
}

export default function App({ match }) {
  const stateConfig = getStateConfig(match.params);
  const currentDate = useSelector(selectCurrentDate());

  return (
    <div>
      <Map stateCode={stateConfig.code} currentDate={currentDate} />
      <Overlay>
        <Title>{`${stateConfig.name} Wildfires through ${formatDate(
          currentDate
        )}`}</Title>
        <Slider currentDate={currentDate} />
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
