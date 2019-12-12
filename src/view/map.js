import React from 'react';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { StaticMap } from 'react-map-gl';

import kincadeTest from '~/static/data/ca_kincade_20191024_2358_dd83.json';

const initialViewState = {
  longitude: -122.77884,
  latitude: 38.79746,
  zoom: 11,
  pitch: 0,
  bearing: 0,
};

export default function Map() {
  return (
    <DeckGL initialViewState={initialViewState} controller={true}>
      <StaticMap mapboxApiAccessToken={process.env.MapboxAccessToken} />
      <GeoJsonLayer
        id="geojson-layer"
        data={kincadeTest}
        pickable={true}
        stroked={false}
        filled={true}
        extruded={true}
        lineWidthScale={20}
        lineWidthMinPixels={2}
        getFillColor={[160, 160, 180, 200]}
        getLineColor={[0, 0, 0, 255]}
      />
    </DeckGL>
  );
}
