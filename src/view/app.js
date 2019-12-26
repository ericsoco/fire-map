import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { stateConfigs } from '../constants';
import Map from './map';

const Title = styled.h1`
  color: ${p => p.theme.color};
  ${p => p.theme.mixins.h1};
  margin-bottom: 1rem;
`;
const Overlay = styled.div`
  position: absolute;
  padding: 1rem;
`;
const Button = styled.button`
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 0.25rem;
  padding: 0.5rem;
  margin: 0 0.5rem 0.5rem 0;
  font-size: 1rem;
  cursor: pointer;
  width: 100px;
`;

const dates = [
  new Date('2010-08-01'),
  new Date('2011-08-01'),
  new Date('2012-08-01'),
  new Date('2013-08-01'),
  new Date('2014-08-01'),
  new Date('2015-08-01'),
  new Date('2016-08-01'),
  new Date('2017-08-01'),
  new Date('2018-08-01'),
];

function getStateConfig(routeParams) {
  const code = (
    routeParams.stateCode || Object.keys(stateConfigs)[0]
  ).toUpperCase();
  return {
    code,
    name: stateConfigs[code].name,
  };
}

export default function App({ match }) {
  const stateConfig = getStateConfig(match.params);
  const [currentDate, setCurrentDate] = useState(dates[0]);
  return (
    <div>
      <Map stateCode={stateConfig.code} currentDate={currentDate} />
      <Overlay>
        <Title>{`${
          stateConfig.name
        } Wildfires through ${currentDate.getFullYear()}`}</Title>
        {new Array(5).fill(0).map((_, i) => (
          <div key={`buttons-${i}`}>
            {dates.map(date => {
              const d = new Date(date.getTime());
              d.setMonth(d.getMonth() + i);
              const label = `${d.getFullYear()}.${d.toLocaleDateString(
                'en-US',
                {
                  month: 'short',
                }
              )}`;
              return (
                <Button key={label} onClick={() => setCurrentDate(d)}>
                  {label}
                </Button>
              );
            })}
          </div>
        ))}
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
