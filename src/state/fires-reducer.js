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

export const FIRE_RESOLUTION = {
  HIGH: 'high',
  LOW: 'low',
};

/**
 * Get an actually-unique identifier for a fire by concatenating
 * the "unique" ID (which is not unique) with the name.
 */
export function getFireId(fire) {
  return `${fire.properties.uniquefireidentifier}-${getFireName(fire)}`;
}

export function getFireDate(fire) {
  // GeoMAC props:
  // - DATE_
  // - perDatTime
  return fire.properties.perimeterdatetime
    ? new Date(fire.properties.perimeterdatetime)
    : null;
}

export function getFireName(fire) {
  // GeoMAC props:
  // - FIRE_NAME
  // - fireName
  return fire.properties.incidentname;
}

export function getFireAcres(fire) {
  // GeoMAC props:
  // - ACRES
  // - GISACRES
  // - gisAcres
  return parseInt(fire.properties.gisacres);
}

export const loadAllFiresForYear = createRPCActions('loadAllFiresForYear');
const loadAllFiresForYearReducer =
  createRPCReducer('loadAllFiresForYear', {
    start: (state, { payload: { year, resolution } }) => ({
      ...state,
      [year]: {
        ...state[year],
        all: {
          ...(state[year]?.all || {}),
          [resolution]: loadingRequest(year),
        },
      },
    }),
    success: (state, { payload: { year, resolution, data } }) => ({
      ...state,
      [year]: {
        ...state[year],
        all: {
          ...(state[year]?.all || {}),
          [resolution]: loadedRequest(year, data),
        },
      },
    }),
    failure: (state, { payload: { year, resolution, error } }) => ({
      ...state,
      [year]: {
        ...state[year],
        all: {
          ...(state[year]?.all || {}),
          [resolution]: errorRequest(year, error),
        },
      },
    }),
  }) |> reduceOver('years');

export const loadCompleteFiresForYear = createRPCActions(
  'loadCompleteFiresForYear'
);
const loadCompleteFiresForYearReducer =
  createRPCReducer('loadCompleteFiresForYear', {
    start: (state, { payload: { year, resolution } }) => ({
      ...state,
      [year]: {
        ...state[year],
        complete: {
          ...(state[year]?.complete || {}),
          [resolution]: loadingRequest(year),
        },
      },
    }),
    success: (state, { payload: { year, resolution, data } }) => ({
      ...state,
      [year]: {
        ...state[year],
        complete: {
          ...(state[year]?.complete || {}),
          [resolution]: loadedRequest(year, data),
        },
      },
    }),
    failure: (state, { payload: { year, resolution, error } }) => ({
      ...state,
      [year]: {
        ...state[year],
        complete: {
          ...(state[year]?.complete || {}),
          [resolution]: errorRequest(year, error),
        },
      },
    }),
  }) |> reduceOver('years');

export const loadFireMetadataForYear = createRPCActions(
  'loadFireMetadataForYear'
);
const loadFireMetadataForYearReducer =
  createRPCReducer('loadFireMetadataForYear', {
    start: (state, { payload: { year } }) => ({
      ...state,
      [year]: {
        ...state[year],
        metadata: loadingRequest(year),
      },
    }),
    success: (state, { payload: { year, data } }) => ({
      ...state,
      [year]: {
        ...state[year],
        metadata: loadedRequest(year, data),
      },
    }),
    failure: (state, { payload: { year, error } }) => ({
      ...state,
      [year]: {
        ...state[year],
        metadata: errorRequest(year, error),
      },
    }),
  }) |> reduceOver('years');

export default reduceReducers(
  null,
  loadAllFiresForYearReducer,
  loadCompleteFiresForYearReducer,
  loadFireMetadataForYearReducer
) |> reduceOver('fires');
