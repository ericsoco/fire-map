import React, { useState } from 'react';
import PropTypes from 'prop-types';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { StaticMap } from 'react-map-gl';
import { scalePow } from 'd3-scale';

import { stateConfigs } from '../constants';
import useCompleteFiresForYearRequest from '../hooks/use-complete-fires-for-year-request';
import { isLoading, isLoaded } from '../utils/request-utils';

import LoadingIcon from './loading-icon';

const basemap = 'mapbox://styles/mapbox/light-v8';

const DAY = 24 * 60 * 60 * 1000;
const alphaScale = scalePow()
  .domain([0, 16 * 7 * DAY])
  .range([240, 100])
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
  return stateConfigs[stateCode].mapInit;
}

export default function Map({ currentDate, stateCode }) {
  const initialViewState = getInitialViewState(stateCode);
  const [viewState, setViewState] = useState(initialViewState);
  const {
    selectedYearRequest,
    previousYearRequests,
  } = useCompleteFiresForYearRequest(currentDate.getFullYear());

  // Flatten all loaded GeoJSON features into a single FeatureCollection
  let features = previousYearRequests.filter(isLoaded);
  features = features.map(request => request.data.features);
  features = features.concat(
    isLoaded(selectedYearRequest) ? [selectedYearRequest.data.features] : []
  );
  features = features.reduce((values, array) => [...values, ...array], []);
  let featureCollection = {
    type: 'FeatureCollection',
    features,
  };

  // TODO: handle status === ERROR
  return (
    <div>
      <DeckGL
        controller={true}
        viewState={viewState}
        onViewStateChange={({ viewState }) => setViewState(viewState)}
        onViewportChange={v => console.log(v)}
      >
        <StaticMap
          mapboxApiAccessToken={process.env.MapboxAccessToken}
          mapStyle={basemap}
        />
        {isLoaded(selectedYearRequest) && (
          <GeoJsonLayer
            id="geojson-layer"
            data={featureCollection}
            updateTriggers={{
              getFillColor: [currentDate],
            }}
            pickable={false}
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
      {isLoading(selectedYearRequest) && <LoadingIcon withBackground />}
    </div>
  );
}

Map.propTypes = {
  currentDate: PropTypes.instanceOf(Date),
  stateCode: PropTypes.string,
};
