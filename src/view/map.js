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
import { colors } from './style/theme';

import LoadingIcon from './loading-icon';

const StyledContainer = styled.div`
  canvas {
    mix-blend-mode: multiply;
  }
`;

const Tooltip = styled.div`
  position: absolute;
  z-index: 1;
  width: 16rem;
  height: 6rem;
  left: ${p => p.left}px;
  top: ${p => p.top}px;
  padding: 1rem;
  background-color: #ffffff;
  color: #000000;
  pointer-events: none;
`;

const FireName = styled.h2`
  font-size: 1.5rem;
`;
const FireDate = styled.h3`
  font-size: 1rem;
  margin-bottom: 0.5rem;
`;
const FireSize = styled.div`
  font-size: 1rem;
`;

const performAdditiveBlending = false;
const layerParameters = {
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
};

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
  const name = perimeter.properties.FIRE_NAME || perimeter.properties.fireName;
  return (name || '')
    .split(' ')
    .map(
      word => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`
    )
    .join(' ');
}
function getFireDate(perimeter) {
  // TODO: validate date strings
  return new Date(
    perimeter.properties.DATE_ || perimeter.properties.perDatTime
  );
}
/*
function getFireDateRange(perimeter, data) {
  // TODO: implement
}
*/
function formatFireDate(date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  });
}
function getFireSizeAcres(perimeter) {
  return parseInt(
    perimeter.properties.ACRES ||
      perimeter.properties.GISACRES ||
      perimeter.properties.gisAcres
  );
}
/*
function getFireSizeSqMiles(perimeter, numDigits = 20) {
  return (
    parseFloat(perimeter.properties.ACRES || perimeter.properties.GISACRES) /
    640
  ).toFixed(numDigits);
}
*/
function getInitialViewState(stateCode) {
  return stateConfigs[stateCode].mapInit;
}

/**
 * Flatten multiple GeoJSON requests into a single FeatureCollection,
 * setting data to a new object when data have changed,
 * else passing through the previous object to maintaining strict equality
 * to benefit deck.gl rendering performance.
 *
 * TODO: this is not right...
 * makes sense to memoize, but there's no need for the extra render
 * caused by the setData() call. change this to a more standard
 * memoization strategy (useMemo perhaps?) with memo condition being
 * the number of features.
 */
function writeData(firesRequests, destGeoJSON, setData) {
  const features = firesRequests
    .filter(isLoaded)
    .map(request => request.data.features)
    .reduce((values, array) => [...values, ...array], []);

  // If number of features has changed, force an update
  // by setting the data to a new object
  if (features.length !== destGeoJSON.features.length) {
    setData({
      type: 'FeatureCollection',
      features,
    });
  }

  return destGeoJSON;
}

/**
 * Extract only the latest perimeter of each fire,
 * and flatten results into a features array
 */
function extractLatestPerimeters(allFiresRequest, currentDate) {
  if (!isLoaded(allFiresRequest)) {
    return allFiresRequest;
  }

  const latestPerimeters = Object.keys(allFiresRequest.data).reduce(
    (lastPerimeters, name) => {
      const latestPerimeterForFire = allFiresRequest.data[name].find(d => {
        const dateStr = d.properties.DATE_ || d.properties.perDatTime;
        return dateStr && new Date(dateStr) <= currentDate;
      });
      if (latestPerimeterForFire) {
        lastPerimeters.push(latestPerimeterForFire);
      }
      return lastPerimeters;
    },
    []
  );
  return {
    ...allFiresRequest,
    data: {
      type: 'FeatureCollection',
      features: latestPerimeters,
    },
  };
}

// TODO: move tooltip and associated utils to separate module
function renderTooltip(hoverInfo) {
  if (!hoverInfo || !hoverInfo.picked || !hoverInfo.object) {
    return null;
  }
  const { object, x, y } = hoverInfo;
  const date = getFireDate(object);
  return (
    <Tooltip left={x} top={y}>
      <FireName>{getFireName(object)}</FireName>
      {date && <FireDate>{formatFireDate(date)}</FireDate>}
      <FireSize>{`${getFireSizeAcres(object)} acres`}</FireSize>
    </Tooltip>
  );
}

export default function Map({ currentDate, stateCode }) {
  const initialViewState = getInitialViewState(stateCode);
  const [viewState, setViewState] = useState(initialViewState);
  const [hoverInfo, setHoverInfo] = useState(null);

  const [priorYearsData, setPriorYearsData] = useState({
    type: 'FeatureCollection',
    features: [],
  });
  const [previousYearData, setPreviousYearData] = useState({
    type: 'FeatureCollection',
    features: [],
  });
  const [currentYearData, setCurrentYearData] = useState({
    type: 'FeatureCollection',
    features: [],
  });

  const allFiresForYearRequest = useAllFiresForYearRequest(
    currentDate.getFullYear()
  );
  const { priorYearRequests } = useCompleteFiresForYearRequest(
    currentDate.getFullYear()
  );
  const previousYearRequest = priorYearRequests.pop();

  writeData(priorYearRequests, priorYearsData, setPriorYearsData);
  writeData(
    previousYearRequest ? [previousYearRequest] : [],
    previousYearData,
    setPreviousYearData
  );
  writeData(
    [extractLatestPerimeters(allFiresForYearRequest, currentDate)],
    currentYearData,
    setCurrentYearData
  );

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

        {isLoaded(priorYearRequests[priorYearRequests.length - 1]) && (
          // Layer for all years before previous:
          // renders only the last perimeter of each fire,
          // with fixed alpha for all perimeters
          <GeoJsonLayer
            id="priorYears"
            data={priorYearsData}
            updateTriggers={{
              getFillColor: [currentDate],
            }}
            stroked={false}
            filled={true}
            extruded={false}
            lineWidthScale={20}
            lineWidthMinPixels={2}
            getFillColor={[...colors.FIRE, 100]}
            getLineColor={[...colors.FIRE, 255]}
            parameters={layerParameters}
            pickable={true}
            onHover={setHoverInfo}
          />
        )}

        {isLoaded(previousYearRequest) && (
          // Layer for previous year:
          // renders only the last perimeter of each fire,
          // with scaled alpha for all perimeters
          <GeoJsonLayer
            id="prevYear"
            data={previousYearData}
            updateTriggers={{
              getFillColor: [currentDate],
            }}
            stroked={false}
            filled={true}
            extruded={false}
            lineWidthScale={20}
            lineWidthMinPixels={2}
            getFillColor={d => {
              const age = currentDate - getFireDate(d);
              const alpha = age >= 0 ? alphaScale(age) : 0;
              return [...colors.FIRE, alpha];
            }}
            getLineColor={[...colors.FIRE, 255]}
            parameters={layerParameters}
            pickable={true}
            onHover={setHoverInfo}
          />
        )}

        {isLoaded(allFiresForYearRequest) && (
          // Layer for currently-selected year:
          // renders most-recent perimeter for each fire,
          // with scaled alpha for all perimeters
          // TODO: render _only_ the most recent perimeter for each fire
          <GeoJsonLayer
            id="currentYear"
            data={currentYearData}
            updateTriggers={{
              getFillColor: [currentDate],
            }}
            stroked={false}
            filled={true}
            extruded={false}
            lineWidthScale={20}
            lineWidthMinPixels={2}
            getFillColor={d => {
              const age = currentDate - getFireDate(d);
              const alpha = age >= 0 ? alphaScale(age) : 0;
              return [...colors.FIRE, alpha];
            }}
            getLineColor={[...colors.FIRE, 255]}
            parameters={layerParameters}
            pickable={true}
            onHover={setHoverInfo}
          />
        )}
        {renderTooltip(hoverInfo)}
      </DeckGL>
      {isLoading(allFiresForYearRequest) && <LoadingIcon withBackground />}
    </StyledContainer>
  );
}

Map.propTypes = {
  currentDate: PropTypes.instanceOf(Date),
  stateCode: PropTypes.string,
};
