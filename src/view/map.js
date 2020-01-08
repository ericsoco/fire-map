import React from 'react';
import PropTypes from 'prop-types';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { StaticMap } from 'react-map-gl';
import { scalePow } from 'd3-scale';

import { stateConfigs } from '../constants';
import useFiresForYearRequest from '../hooks/use-fires-for-year-request';
import { isLoading, isLoaded } from '../utils/request-utils';

import LoadingIcon from './loading-icon';

const basemap = 'mapbox://styles/mapbox/light-v8';
// const basemap = 'mapbox://styles/mapbox/outdoors-v11';

const DAY = 24 * 60 * 60 * 1000;
const alphaScale = scalePow()
  .domain([0, 28 * DAY])
  .range([200, 50])
  .clamp(true)
  .exponent(0.5);

function getFireName(perimeter) {
  return perimeter.properties.FIRE_NAME || perimeter.properties.fireName;
}
function getFireDate(perimeter) {
  // TODO: validate date strings
  return new Date(
    perimeter.properties.DATE_ || perimeter.properties.perDatTime
  );
}
function getFireSizeAcres(perimeter) {
  return perimeter.properties.ACRES || perimeter.properties.GISACRES;
}
function getFireSizeSqMiles(perimeter) {
  return (perimeter.properties.ACRES || perimeter.properties.GISACRES) / 640;
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
            updateTriggers={{
              getFillColor: [currentDate],
            }}
            pickable={true}
            stroked={false}
            filled={true}
            extruded={false}
            lineWidthScale={20}
            lineWidthMinPixels={2}
            getFillColor={d => {
              const age = currentDate - getFireDate(d);
              const alpha = age >= 0 ? alphaScale(age) : 0;
              return [255, 80, 60, alpha];
            }}
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
