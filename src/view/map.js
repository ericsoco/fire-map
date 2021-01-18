import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import DeckGL from '@deck.gl/react';
// import { GeoJsonLayer } from '@deck.gl/layers';
import { H3HexagonLayer } from '@deck.gl/geo-layers';
import GL from '@luma.gl/constants';
import { StaticMap } from 'react-map-gl';
import { scalePow } from 'd3-scale';
import styled from 'styled-components';

import { stateConfigs } from '../constants';
import useAllFiresForYearRequest from '../hooks/use-all-fires-for-year-request';
import useCompleteFiresForYearRequest from '../hooks/use-complete-fires-for-year-request';
import {
  FIRE_RESOLUTION,
  getFireAcres,
  getFireDate,
  getFireName,
} from '../state/fires-reducer';
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
const ALPHA_RANGE = { max: 240, min: 100 };
const alphaScale = scalePow()
  .domain([0, 16 * 7 * DAY])
  .range([ALPHA_RANGE.max, ALPHA_RANGE.min])
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
  let features = firesRequests
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

  let latestPerimeters = Object.keys(data).reduce((lastPerimeters, name) => {
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

// TODO: where to put this?
const isH3 = true;

export default function Map({ currentDate, stateCode }) {
  const initialViewState = getInitialViewState(stateCode);
  const [viewState, setViewState] = useState(initialViewState);
  const [hoverInfo, setHoverInfo] = useState(null);

  const resolution =
    viewState.zoom >= 7.5 ? FIRE_RESOLUTION.HIGH : FIRE_RESOLUTION.LOW;

  const year = currentDate.getFullYear();
  const time = currentDate.getTime();

  const allFiresForYearRequest = useAllFiresForYearRequest(year, resolution);
  const completeFiresForYearRequests = useCompleteFiresForYearRequest(
    year,
    resolution
  );
  const { priorYearRequests } = completeFiresForYearRequests;
  const previousYearRequest = priorYearRequests[priorYearRequests.length - 1];

  const priorYearsData = useMemo(
    () => flattenPerimeters(priorYearRequests.slice(0, -1)),
    [priorYearRequests]
  );
  const previousYearData = useMemo(
    () => flattenPerimeters(previousYearRequest ? [previousYearRequest] : []),
    [previousYearRequest]
  );
  const currentYearData = useMemo(
    () => extractLatestPerimeters(allFiresForYearRequest, time),
    [allFiresForYearRequest, time]
  );

  priorYearsData.features.reduce((acc, f) => {
    const name = getFireName(f);
    const existing = acc[name];
    const features = existing ? [...existing.features, f] : [f];
    const entry = {
      count: features.length,
      features,
    };
    if (existing) {
      console.log(`dupe at [${name}]: `, entry);
    }
    acc[name] = entry;
    return acc;
  }, {});

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

        {isLoaded(previousYearRequest) &&
          // Layer for all years before previous:
          // renders only the last perimeter of each fire,
          // with fixed alpha for all perimeters.
          priorYearsData.features.map(feature => {
            const name = getFireName(feature);
            return (
              <H3HexagonLayer
                id={`priorYears-${name}`}
                key={name}
                data={feature.geometry}
                updateTriggers={{
                  getFillColor: [currentDate],
                }}
                stroked={false}
                filled={true}
                extruded={false}
                lineWidthScale={20}
                lineWidthMinPixels={2}
                getHexagon={d => d}
                getFillColor={
                  name === 'Morgan'
                    ? [0, 128, 255]
                    : [...colors.FIRE, ALPHA_RANGE.min]
                }
                getLineColor={[...colors.FIRE, 255]}
                parameters={layerParameters}
                pickable={true}
                onHover={
                  isH3
                    ? info => setHoverInfo({ ...info, object: feature })
                    : setHoverInfo
                }
              />
            );
          })
        /*
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
            getFillColor={[...colors.FIRE, ALPHA_RANGE.min]}
            getLineColor={[...colors.FIRE, 255]}
            // debug: set stroked={true}
            // getLineColor={[0, 255, 0, 255]}
            parameters={layerParameters}
            pickable={true}
            onHover={setHoverInfo}
          />
          */
        }

        {isLoaded(previousYearRequest) &&
          // Layer for previous year:
          // renders only the last perimeter of each fire,
          // with scaled alpha for all perimeters
          previousYearData.features.map(feature => {
            const name = getFireName(feature);
            const age = currentDate - getFireDate(feature);
            const alpha = age >= 0 ? alphaScale(age) : 0;
            return (
              <H3HexagonLayer
                id={`prevYear-${name}`}
                key={name}
                data={feature.geometry}
                updateTriggers={{
                  getFillColor: [currentDate],
                }}
                stroked={false}
                filled={true}
                extruded={false}
                lineWidthScale={20}
                lineWidthMinPixels={1}
                getHexagon={d => d}
                getFillColor={
                  name === 'Morgan' ? [0, 128, 255] : [...colors.FIRE, alpha]
                }
                getLineColor={[...colors.FIRE, 255]}
                parameters={layerParameters}
                pickable={true}
                onHover={
                  isH3
                    ? info => setHoverInfo({ ...info, object: feature })
                    : setHoverInfo
                }
              />
            );
          })
        /*
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
            lineWidthMinPixels={1}
            getFillColor={d => {
              const age = currentDate - getFireDate(d);
              const alpha = age >= 0 ? alphaScale(age) : 0;
              return [...colors.FIRE, alpha];
            }}
            getLineColor={[...colors.FIRE, 255]}
            // debug: set stroked={true}
            // getLineColor={[0, 0, 255, 255]}
            parameters={layerParameters}
            pickable={true}
            onHover={setHoverInfo}
          />
          */
        }

        {isLoaded(allFiresForYearRequest) &&
          // Layer for currently-selected year:
          // renders most-recent perimeter for each fire,
          // with scaled alpha for all perimeters
          // TODO: render _only_ the most recent perimeter for each fire
          currentYearData.features.map(feature => {
            const name = getFireName(feature);
            const age = currentDate - getFireDate(feature);
            const alpha = age >= 0 ? alphaScale(age) : 0;
            return (
              <H3HexagonLayer
                id={`currentYear-${name}`}
                key={name}
                data={feature.geometry}
                updateTriggers={{
                  getFillColor: [currentDate],
                }}
                stroked={false}
                filled={true}
                extruded={false}
                lineWidthScale={20}
                lineWidthMinPixels={2}
                getHexagon={d => d}
                getFillColor={
                  name === 'Morgan' ? [0, 128, 255] : [...colors.FIRE, alpha]
                }
                getLineColor={[...colors.FIRE, 255]}
                parameters={layerParameters}
                pickable={true}
                onHover={
                  isH3
                    ? info => setHoverInfo({ ...info, object: feature })
                    : setHoverInfo
                }
              />
            );
          })
        /*
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
          */
        }
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
