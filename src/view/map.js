import React, { useMemo, useState } from 'react';
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
import { getFireAcres, getFireDate, getFireName } from '../state/fires-reducer';
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

function getFireDisplayName(perimeter) {
  const name = getFireName(perimeter);
  return (name || '')
    .split(' ')
    .map(
      word => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`
    )
    .join(' ');
}
function formatFireDate(date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  });
}
function getInitialViewState(stateCode) {
  return stateConfigs[stateCode].mapInit;
}

/**
 * Flatten multiple GeoJSON requests into a single FeatureCollection
 */
function flattenPerimeters(firesRequests) {
  const features = firesRequests
    .filter(isLoaded)
    .map(request => request.data.features)
    .reduce((values, array) => [...values, ...array], []);

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Extract only the latest (relative to currentTime) perimeter
 * of each fire, and flatten results into a features array
 */
function extractLatestPerimeters(allFiresRequest, currentTime) {
  const data = isLoaded(allFiresRequest) ? allFiresRequest.data : {};

  const latestPerimeters = Object.keys(data).reduce((lastPerimeters, name) => {
    const latestPerimeterForFire = data[name].find(d => {
      const date = getFireDate(d);
      return date && date <= currentTime;
    });
    if (latestPerimeterForFire) {
      lastPerimeters.push(latestPerimeterForFire);
    }
    return lastPerimeters;
  }, []);
  return {
    type: 'FeatureCollection',
    features: latestPerimeters,
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
      <FireName>{getFireDisplayName(object)}</FireName>
      {date && <FireDate>{formatFireDate(date)}</FireDate>}
      <FireSize>{`${getFireAcres(object)} acres`}</FireSize>
    </Tooltip>
  );
}

export default function Map({ currentDate, stateCode }) {
  const initialViewState = getInitialViewState(stateCode);
  const [viewState, setViewState] = useState(initialViewState);
  const [hoverInfo, setHoverInfo] = useState(null);

  // const [priorYearsData, setPriorYearsData] = useState({
  //   type: 'FeatureCollection',
  //   features: [],
  // });
  // const [previousYearData, setPreviousYearData] = useState({
  //   type: 'FeatureCollection',
  //   features: [],
  // });
  // const [currentYearData, setCurrentYearData] = useState({
  //   type: 'FeatureCollection',
  //   features: [],
  // });

  const year = currentDate.getFullYear();
  const time = currentDate.getTime();

  const allFiresForYearRequest = useAllFiresForYearRequest(year);
  const { priorYearRequests } = useCompleteFiresForYearRequest(year);
  const previousYearRequest = priorYearRequests.pop();

  const priorYearsData = useMemo(() => {
    console.log('>>>>> calc priorYearsData');
    return flattenPerimeters(priorYearRequests);
    // TODO: ensure referential equality on priorYearRequests
    // when derived from same `year`, else use only `year` as dep
  }, [priorYearRequests]);

  const previousYearData = useMemo(() => {
    console.log('>>>>> calc previousYearData');
    // TODO: I think this is memoizing as expected
    return flattenPerimeters(previousYearRequest ? [previousYearRequest] : []);
  }, [previousYearRequest]);

  const currentYearData = useMemo(() => {
    console.log('>>>>> calc currentYearData');
    // TODO: I think (?) this is memoizing as expected,
    // tho this matters less as it's always changing
    return extractLatestPerimeters(allFiresForYearRequest, time);
    // TODO: ensure referential equality on allFiresForYearRequest
    // when derived from same `year`, else use only `year` as dep
  }, [allFiresForYearRequest, time]);

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
