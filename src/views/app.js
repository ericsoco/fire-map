import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { DECREMENT, INCREMENT } from '../state/root-reducer';

export default function App() {
  const dispatch = useDispatch();
  const rootState = useSelector(state => state.root);
  return (
    <div>
      <div>{`Hello App (${rootState})`}</div>
      <div>
        <button onClick={() => dispatch({ type: INCREMENT })}>{'+'}</button>
        <button onClick={() => dispatch({ type: DECREMENT })}>{'-'}</button>
      </div>
    </div>
  );
}
