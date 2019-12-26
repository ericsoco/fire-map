import React from 'react';
import PropTypes from 'prop-types';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { StaticMap } from 'react-map-gl';

import { stateConfigs } from '../constants';
import useFiresForYearRequest from '../hooks/use-fires-for-year-request';
import { isLoading, isLoaded } from '../utils/request-utils';

import LoadingIcon from './loading-icon';

const basemap = 'mapbox://styles/mapbox/light-v8';
// const basemap = 'mapbox://styles/mapbox/outdoors-v11';

function getFireName(perimeter) {
  return (
    perimeter.features[0].properties.FIRE_NAME ||
    perimeter.features[0].properties.fireName
  );
}
function getFireDate(perimeter) {
  return (
    perimeter.features[0].properties.DATE_ ||
    perimeter.features[0].properties.perDatTime
  );
}
function getFireSizeAcres(perimeter) {
  return (
    perimeter.features[0].properties.ACRES ||
    perimeter.features[0].properties.GISACRES
  );
}
function getFireSizeSqMiles(perimeter) {
  return (
    (perimeter.features[0].properties.ACRES ||
      perimeter.features[0].properties.GISACRES) / 640
  );
}

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
        {isLoaded(firesForYearRequest) && (
          <GeoJsonLayer
            id="geojson-layer"
            data={firesForYearRequest.data}
            visible={d => getFireDate(d) > currentDate}
            updateTriggers={{
              visible: [currentDate],
            }}
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
      {isLoading(firesForYearRequest) && <LoadingIcon withBackground />}
    </div>
  );
}

Map.propTypes = {
  currentDate: PropTypes.instanceOf(Date),
  stateCode: PropTypes.string,
};
