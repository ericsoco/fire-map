import React, { useState } from 'react';
import styled from 'styled-components';

import Map from './map';

const Title = styled.h1`
  color: ${p => p.theme.color};
  ${p => p.theme.mixins.h1};
`;
const Overlay = styled.div`
  position: absolute;
  padding: 1rem;
`;
const Button = styled.button`
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 0.25rem;
  padding: 0.5rem;
  margin-right: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
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

export default function App() {
  const [currentDate, setCurrentDate] = useState(dates[0]);
  return (
    <div>
      <Map currentDate={currentDate} />
      <Overlay>
        <Title>{`${currentDate.getFullYear()}`}</Title>
        {
          <div>
            {dates.map(date => (
              <Button
                key={date.getFullYear()}
                onClick={() => setCurrentDate(date)}
              >
                {date.getFullYear()}
              </Button>
            ))}
          </div>
        }
      </Overlay>
    </div>
  );
}
