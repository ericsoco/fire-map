import React from 'react';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { StaticMap } from 'react-map-gl';

import useMergedFiresRequest from '../hooks/use-merged-fires-request';
import { LOADED } from '../state/request-utils';

const initialViewState = {
  longitude: -121.25,
  latitude: 37.6,
  zoom: 6,
  pitch: 0,
  bearing: 0,
};

// const basemap = 'mapbox://styles/mapbox/light-v8';
const basemap = 'mapbox://styles/mapbox/outdoors-v11';

export default function Map() {
  const mergedFiresRequest = useMergedFiresRequest();
  // TODO: handle all three mergedFiresRequest.status-es
  return (
    <DeckGL initialViewState={initialViewState} controller={true}>
      <StaticMap
        mapboxApiAccessToken={process.env.MapboxAccessToken}
        mapStyle={basemap}
      />
      {mergedFiresRequest && mergedFiresRequest.status === LOADED ? (
        <GeoJsonLayer
          id="geojson-layer"
          data={mergedFiresRequest.data}
          pickable={true}
          stroked={false}
          filled={true}
          extruded={false}
          lineWidthScale={20}
          lineWidthMinPixels={2}
          getFillColor={[255, 80, 60, 150]}
          getLineColor={[255, 80, 60, 255]}
        />
      ) : null}
    </DeckGL>
  );
}
