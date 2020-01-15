import reduceReducers from 'reduce-reducers';
import { createAction, handleActions } from 'redux-actions';

import { reduceOver } from '../utils/request-utils';
// import fireDataConfig from '~/static/config/fire-data-config.json';

// export const DATE_DOMAIN = {
//   min: new Date(fireDataConfig.states[0].years[0], 0),
//   max: new Date(fireDataConfig.states[0].years.slice(-1)[0], 11, 31),
// };

// Uhh, the above _was_ working. Not sure what borked.
export const DATE_DOMAIN = {
  min: new Date(2010, 0),
  max: new Date(2019, 11, 31),
};

export const INITIAL_STATE = {
  currentDate: DATE_DOMAIN.min,
  playbackStart: null,
};

export const setCurrentDate = createAction('SET_CURRENT_DATE');
export const startPlayback = createAction('START_PLAYBACK');
export const stopPlayback = createAction('STOP_PLAYBACK');

const reducer = handleActions(
  {
    [setCurrentDate]: (state, { payload }) => ({
      ...state,
      currentDate: payload,
    }),
    [startPlayback]: (state, { payload: { date, time } }) => ({
      ...state,
      playbackStart: { date, time },
    }),
    [stopPlayback]: state => ({
      ...state,
      playbackStart: null,
    }),
  },
  INITIAL_STATE
);

export default reduceReducers(null, reducer) |> reduceOver('ui');
