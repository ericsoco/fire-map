import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
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

export default function App() {
  const dispatch = useDispatch();
  const rootState = useSelector(state => state.root);
  return (
    <div>
      <Map />
      <Overlay>
        <Title>{`Hello App (${rootState})`}</Title>
        {/*
        <div>
          <Button onClick={() => dispatch(useMergedFires.start())}>
            {'+'}
          </Button>
          <Button
            onClick={() => dispatch(loadFiresForYear.start({ year: 2010 }))}
          >
            {'-'}
          </Button>
        </div>
        */}
      </Overlay>
    </div>
  );
}
