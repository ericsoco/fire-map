import reduceReducers from 'reduce-reducers';

import fires, { INITIAL_STATE as firesState } from './fires-reducer';

export const ROOT_STATE = {
  fires: firesState,
};

export default reduceReducers(null, fires);
