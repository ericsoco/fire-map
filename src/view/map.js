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

const staticData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-119.46006240879002, 35.83368519862416],
            [-119.46458997806226, 35.83353498892022],
            [-119.46461321483787, 35.836688844155994],
            [-119.46186485831102, 35.835766588532415],
            [-119.46006240879002, 35.83368519862416],
          ],
        ],
      },
      properties: {
        UNIT_ID: 'CA-CND',
        FIRE_NUM: 'FE1R',
        FIRE_NAME: 'Allensworth',
        DATE_: '2010-05-28T00:00:00.000Z',
        TIME_: '0000',
        COMMENTS: '',
        AGENCY: 'BLM',
        ACTIVE: 'N',
        FIRE: '',
        YEAR_: '2010',
        LOAD_DATE: '2010-06-02T00:00:00.000Z',
        ACRES: 25.85,
      },
    },
  ],
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
function getFireDateRange(perimeter, data) {
  // TODO: implement
}
function formatFireDate(date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  });
}
function getFireSizeAcres(perimeter) {
  return parseInt(perimeter.properties.ACRES || perimeter.properties.GISACRES);
}
function getFireSizeSqMiles(perimeter, numDigits = 20) {
  return (
    parseFloat(perimeter.properties.ACRES || perimeter.properties.GISACRES) /
    640
  ).toFixed(numDigits);
}

function getInitialViewState(stateCode) {
  return stateConfigs[stateCode].mapInit;
}

/**
 * Flatten multiple GeoJSON requests into a single FeatureCollection,
 * setting data to a new object when data have changed,
 * else passing through the previous object to maintaining strict equality
 * to benefit deck.gl rendering performance.
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
  writeData([allFiresForYearRequest], currentYearData, setCurrentYearData);

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
            id="prevYears"
            data={priorYearsData}
            updateTriggers={{
              getFillColor: [currentDate],
            }}
            stroked={false}
            filled={true}
            extruded={false}
            lineWidthScale={20}
            lineWidthMinPixels={2}
            getFillColor={[255, 80, 60, 100]}
            getLineColor={[255, 80, 60, 255]}
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
            id="prevYears"
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
              return [255, 80, 60, alpha];
            }}
            getLineColor={[255, 80, 60, 255]}
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
              return [255, 80, 60, alpha];
            }}
            getLineColor={[255, 80, 60, 255]}
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
