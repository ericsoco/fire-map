import React from 'react';
import PropTypes from 'prop-types';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { StaticMap } from 'react-map-gl';

import { stateConfigs } from '../constants';
import useFiresForYearRequest from '../hooks/use-fires-for-year-request';
import { LOADED, LOADING } from '../utils/request-utils';

import LoadingIcon from './loading-icon';

const basemap = 'mapbox://styles/mapbox/light-v8';
// const basemap = 'mapbox://styles/mapbox/outdoors-v11';

function getInitialViewState(stateCode) {
  return {
    ...stateConfigs[stateCode].mapInit,
    pitch: 0,
    bearing: 0,
  };
}

export default function Map({ currentDate, stateCode }) {
  const initialViewState = getInitialViewState(stateCode);
  const firesForYearRequest = useFiresForYearRequest(currentDate.getFullYear());
  // TODO: handle all status === ERROR
  return (
    <div>
      <DeckGL initialViewState={initialViewState} controller={true}>
        <StaticMap
          mapboxApiAccessToken={process.env.MapboxAccessToken}
          mapStyle={basemap}
        />
        {firesForYearRequest && firesForYearRequest.status === LOADED && (
          <GeoJsonLayer
            id="geojson-layer"
            data={firesForYearRequest.data}
            pickable={true}
            stroked={false}
            filled={true}
            extruded={false}
            lineWidthScale={20}
            lineWidthMinPixels={2}
            getFillColor={[255, 80, 60, 150]}
            getLineColor={[255, 80, 60, 255]}
          />
        )}
      </DeckGL>
      {firesForYearRequest && firesForYearRequest.status === LOADING && (
        <LoadingIcon withBackground />
      )}
    </div>
  );
}

Map.propTypes = {
  currentDate: PropTypes.instanceOf(Date),
  stateCode: PropTypes.string,
};
