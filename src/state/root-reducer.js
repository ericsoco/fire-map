import reduceReducers from 'reduce-reducers';

import fires, { INITIAL_STATE as firesState } from './fires-reducer';

const ROOT_STATE = {
  fires: firesState,
};

export default reduceReducers(ROOT_STATE, fires);
