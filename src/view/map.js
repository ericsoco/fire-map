import React, { useState } from 'react';
import PropTypes from 'prop-types';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import GL from '@luma.gl/constants';
import { StaticMap } from 'react-map-gl';
import { scalePow } from 'd3-scale';
import styled from 'styled-components';

import { stateConfigs } from '../constants';
import useAllFiresForYearRequest from '../hooks/use-all-fires-for-year-request';
import useCompleteFiresForYearRequest from '../hooks/use-complete-fires-for-year-request';
import { isLoading, isLoaded } from '../utils/request-utils';

import LoadingIcon from './loading-icon';

const StyledContainer = styled.div`
  canvas {
    mix-blend-mode: multiply;
  }
`;

const performAdditiveBlending = false;
// https://docs.mapbox.com/api/maps/#styles
const basemap = performAdditiveBlending
  ? 'mapbox://styles/mapbox/dark-v10'
  : 'mapbox://styles/mapbox/light-v10';

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

/**
 * Flatten multiple GeoJSON requests into a single FeatureCollection
 */
function flattenData(firesRequests) {
  const features = firesRequests
    .filter(isLoaded)
    .map(request => request.data.features)
    .reduce((values, array) => [...values, ...array], []);
  return {
    type: 'FeatureCollection',
    features,
  };
}

export default function Map({ currentDate, stateCode }) {
  const initialViewState = getInitialViewState(stateCode);
  const [viewState, setViewState] = useState(initialViewState);
  const allFiresForYearRequest = useAllFiresForYearRequest(
    currentDate.getFullYear()
  );
  const {
    selectedYearRequest,
    previousYearRequests,
  } = useCompleteFiresForYearRequest(currentDate.getFullYear());

  const data = flattenData([...previousYearRequests, allFiresForYearRequest]);

  // TODO: handle status === ERROR
  return (
    <StyledContainer>
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
            id="fires"
            data={data}
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
            parameters={{
              // prevent z-fighting flicker
              [GL.DEPTH_TEST]: false,
              ...(performAdditiveBlending
                ? {
                    // additive blending
                    [GL.BLEND]: true,
                    [GL.BLEND_SRC_RGB]: GL.ONE,
                    [GL.BLEND_DST_RGB]: GL.ONE,
                    [GL.BLEND_EQUATION]: GL.FUNC_ADD,
                  }
                : {}),
            }}
          />
        )}
      </DeckGL>
      {isLoading(selectedYearRequest) && <LoadingIcon withBackground />}
    </StyledContainer>
  );
}

Map.propTypes = {
  currentDate: PropTypes.instanceOf(Date),
  stateCode: PropTypes.string,
};
