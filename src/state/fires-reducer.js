import reduceReducers from 'reduce-reducers';
import { createRPCActions, createRPCReducer } from 'fusion-rpc-redux';

import {
  loadingRequest,
  loadedRequest,
  errorRequest,
  reduceOver,
} from '../utils/request-utils';

export const INITIAL_STATE = {
  years: {},
};

export const loadFiresForYear = createRPCActions('loadFiresForYear');
const loadFiresForYearReducer =
  createRPCReducer('loadFiresForYear', {
    start: (state, { payload: { year } }) => ({
      ...state,
      [year]: loadingRequest(year),
    }),
    success: (state, { payload: { year, data } }) => ({
      ...state,
      [year]: loadedRequest(year, data),
    }),
    failure: (state, { payload: { year, error } }) => ({
      ...state,
      [year]: errorRequest(year, error),
    }),
  }) |> reduceOver('years');

export default reduceReducers(null, loadFiresForYearReducer)
  |> reduceOver('fires');
