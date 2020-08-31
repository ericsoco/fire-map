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
 * Extract GeoJSON features from a list of requests.
 */
function getFeatures(firesRequests) {
  return firesRequests
    .filter(isLoaded)
    .map(request => request.data.features)
    .reduce((values, array) => [...values, ...array], []);
}

/**
 * Flatten multiple GeoJSON requests into a single FeatureCollection,
 * returning as a new object only if the GeoJSON features have changed.
 * Else, returns the current GeoJSON object unmodified,
 * to improve deck.gl rendering performance.
 */
function writeData(firesRequests, existingGeoJSON) {
  const features = getFeatures(firesRequests);

  // If number of features has changed, return the new features.
  // Else, pass through the existing GeoJSON.
  return features.length !== existingGeoJSON.features.length
    ? {
        type: 'FeatureCollection',
        features,
      }
    : existingGeoJSON;
}

/**
 * Return all perimeters, flattened into a features array.
 * Adds a flag to each, indicating if it is the last perimeter for that fire.
 */
function getAllPerimetersWithLastFlag(allFiresRequest, currentDate) {
  if (!isLoaded(allFiresRequest)) {
    return allFiresRequest;
  }

  //
  // TODO NEXT:
  // Trying to figure out how to performantly render only the last perimeter
  // of each fire, given a `currentDate`. Need to keep the array strict equal
  // across lifecycles, but set a flag for each perimeter,
  // then check that flag in getFillColor.
  //
  // One option:
  // write the flattened arrays for each year beforehand (i.e. change/replace
  // use-all-fires::mapByFire), with `isLast` flag set to `false` on every
  // perimeter. Then, this function mutates objects in that array directly,
  // writing the `isLast` flag to each. This strategy maintains strict equality
  // on the `data` array (currentYearFeatures / currentYearData) and
  // provides a flag for use in getFillColor.
  //
  // Note: in addition to `isLast`, write a unix timestamp to each perimeter
  // as well, to speed the `currentDate` comparison below.
  // In fact, should normalize date and name immediately on data load
  // as well, and remove accessors like getFireDate / getFireName.
  //

  /*
  const latestPerimeters = Object.keys(allFiresRequest.data).reduce(
    (lastPerimeters, name) => {
      // Perimeters for each fire already sorted in reverse chron order
      const perimeters = allFiresRequest.data[name].map(d => {
        const dateStr = d.properties.DATE_ || d.properties.perDatTime;
        return {
          ...d,
          isLast: dateStr && new Date(dateStr) <= currentDate;
        } 
        

          ...d,
          isLast: 
      });

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
  */
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
      // Perimeters for each fire already sorted in reverse chron order
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

  const { priorYearsRequests } = useCompleteFiresForYearRequest(
    currentDate.getFullYear()
  );
  const previousYearRequest = priorYearsRequests.pop();
  const allFiresForYearRequest = useAllFiresForYearRequest(
    currentDate.getFullYear()
  );

  const priorYearsFeatures = getFeatures(priorYearsRequests);
  const numPriorYearsFeatures = priorYearsFeatures.length;
  const priorYearsData = useMemo(() => {
    // If number of features has changed, return the new features.
    // Else, pass through the existing GeoJSON.
    return {
      type: 'FeatureCollection',
      features: priorYearsFeatures,
    };
  }, [numPriorYearsFeatures]);

  const previousYearFeatures = getFeatures(
    previousYearRequest ? [previousYearRequest] : []
  );
  const numPreviousYearFeatures = previousYearFeatures.length;
  const previousYearData = useMemo(() => {
    // If number of features has changed, return the new features.
    // Else, pass through the existing GeoJSON.
    return {
      type: 'FeatureCollection',
      features: previousYearFeatures,
    };
  }, [numPreviousYearFeatures]);

  // const currentYearFeatures = getFeatures([
  //   extractLatestPerimeters(allFiresForYearRequest, currentDate),
  // ]);
  const currentYearFeatures = getFeatures([
    getAllPerimetersWithLastFlag(allFiresForYearRequest),
  ]);
  const numCurrentYearFeatures = currentYearFeatures.length;
  const currentYearData = useMemo(() => {
    // If number of features has changed, return the new features.
    // Else, pass through the existing GeoJSON.
    return {
      type: 'FeatureCollection',
      features: currentYearFeatures,
    };
  }, [numCurrentYearFeatures]);

  // writeData(priorYearsRequests, priorYearsData, setPriorYearsData);
  // writeData(
  //   previousYearRequest ? [previousYearRequest] : [],
  //   previousYearData,
  //   setPreviousYearData
  // );
  // writeData(
  //   [extractLatestPerimeters(allFiresForYearRequest, currentDate)],
  //   currentYearData,
  //   setCurrentYearData
  // );

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

        {isLoaded(priorYearsRequests[priorYearsRequests.length - 1]) && (
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
