import reduceReducers from 'reduce-reducers';

import fires, { INITIAL_STATE as firesState } from './fires-reducer';
import ui, { INITIAL_STATE as uiState } from './ui-reducer';

export const ROOT_STATE = {
  fires: firesState,
  ui: uiState,
};

export default reduceReducers(null, fires, ui);
