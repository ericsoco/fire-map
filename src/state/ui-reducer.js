import reduceReducers from 'reduce-reducers';
import { createAction, handleActions } from 'redux-actions';

import { reduceOver } from '../utils/request-utils';
import fireDataConfig from '~/static/config/fire-data-config.json';

export const DATE_DOMAIN = {
  min: new Date(fireDataConfig.states[0].years[0], 0),
  max: new Date(fireDataConfig.states[0].years.slice(-1)[0], 11, 31),
};

export const INITIAL_STATE = {
  currentDate: DATE_DOMAIN.min,
};

export const setCurrentDate = createAction('SET_CURRENT_DATE');

const reducer = handleActions(
  {
    [setCurrentDate]: (state, { payload }) => ({
      ...state,
      currentDate: payload,
    }),
  },
  INITIAL_STATE
);

export default reduceReducers(null, reducer) |> reduceOver('ui');
