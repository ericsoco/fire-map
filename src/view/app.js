import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { DECREMENT, INCREMENT } from '../state/root-reducer';

const Title = styled.h1`
  color: ${p => p.theme.color};
`;

export default function App() {
  const dispatch = useDispatch();
  const rootState = useSelector(state => state.root);
  return (
    <div>
      <Title>{`Hello App (${rootState})`}</Title>
      <div>
        <button onClick={() => dispatch({ type: INCREMENT })}>{'+'}</button>
        <button onClick={() => dispatch({ type: DECREMENT })}>{'-'}</button>
      </div>
    </div>
  );
}
