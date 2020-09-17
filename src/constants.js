/**
 * Configs per state, in case this thing ever supports more than just CA.
 */
export const stateConfigs = {
  CA: {
    name: 'California',
    key: 'California',
    mapInit: {
      longitude: -119.5,
      latitude: 37.8,
      zoom: 6,
      pitch: 0,
      bearing: 0,
    },
    mapInitOblique: {
      longitude: -118.5,
      latitude: 36.8,
      zoom: 6,
      pitch: 40,
      bearing: 10,
    },
  },
};
