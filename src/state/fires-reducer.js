import reduceReducers from 'reduce-reducers';
import { createRPCActions, createRPCReducer } from 'fusion-rpc-redux';

import {
  loadingRequest,
  loadedRequest,
  errorRequest,
  reduceOver,
} from './request-utils';

export const INITIAL_STATE = {
  single: {},
  merged: {},
};

export const loadFiresForYear = createRPCActions('loadFiresForYear');
const loadFiresForYearReducer = createRPCReducer('loadFiresForYear', {
  start: (state, { payload: { year } }) => ({
    ...state,
    single: {
      [year]: loadingRequest(year),
    },
  }),
  success: (state, { payload: { year, data } }) => ({
    ...state,
    single: {
      [year]: loadedRequest(year, data),
    },
  }),
  failure: (state, { payload: { year, error } }) => ({
    ...state,
    single: {
      [year]: errorRequest(year, error),
    },
  }),
});

const MERGE_REQUEST = {};
export const loadMergedFires = createRPCActions('loadMergedFires');
const loadMergedFiresReducer = createRPCReducer('loadMergedFires', {
  start: state => ({
    ...state,
    merged: loadingRequest(MERGE_REQUEST),
  }),
  success: (state, { payload: { data } }) => ({
    ...state,
    merged: loadedRequest(MERGE_REQUEST, data),
  }),
  failure: (state, { payload: { error } }) => ({
    ...state,
    merged: errorRequest(MERGE_REQUEST, error),
  }),
});

export default reduceOver('fires')(
  reduceReducers(null, loadFiresForYearReducer, loadMergedFiresReducer)
);
