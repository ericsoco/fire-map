import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

import { loadAllFiresForYear } from '../state/fires-reducer';
import { selectAllFiresForYearRequest } from '../state/fires-selectors';

// TODO: host in dist and load at runtime rather than this parcel magic
// Use alias for transformer-raw (specified in .parcelrc),
// per https://github.com/parcel-bundler/parcel/issues/1080#issuecomment-557240449
import fires2010 from 'url:~/static/data/fires/2010/California/allPerimeters.geojson';
import fires2011 from 'url:~/static/data/fires/2011/California/allPerimeters.geojson';
import fires2012 from 'url:~/static/data/fires/2012/California/allPerimeters.geojson';
import fires2013 from 'url:~/static/data/fires/2013/California/allPerimeters.geojson';
import fires2014 from 'url:~/static/data/fires/2014/California/allPerimeters.geojson';
import fires2015 from 'url:~/static/data/fires/2015/California/allPerimeters.geojson';
import fires2016 from 'url:~/static/data/fires/2016/California/allPerimeters.geojson';
import fires2017 from 'url:~/static/data/fires/2017/California/allPerimeters.geojson';
import fires2018 from 'url:~/static/data/fires/2018/California/allPerimeters.geojson';
import fires2019 from 'url:~/static/data/fires/2019/California/allPerimeters.geojson';

const FIRES_FOR_YEAR = {
  2010: fires2010,
  2011: fires2011,
  2012: fires2012,
  2013: fires2013,
  2014: fires2014,
  2015: fires2015,
  2016: fires2016,
  2017: fires2017,
  2018: fires2018,
  2019: fires2019,
};

/**
 * Sort perimeters in reverse chronological order
 */
function sortPerimetersByDate(a, b) {
  return (
    new Date(b.properties.DATE_ || b.properties.perDatTime) -
    new Date(a.properties.DATE_ || a.properties.perDatTime)
  );
}

/**
 * Map perimeters to fire name and
 * sort reverse chronologically within each.
 */
function mapByFire(data) {
  const byFire = data.features.reduce((map, feature) => {
    const name = feature.properties.FIRE_NAME || feature.properties.fireName;
    if (name && !map[name]) {
      map[name] = [];
    }
    map[name].push(feature);
    return map;
  }, {});
  Object.keys(byFire).forEach(name => {
    byFire[name] = byFire[name].sort(sortPerimetersByDate);
  });
  return byFire;
}

/**
 * Loads all perimeters of each fire in the requested year.
 * Note: Result is not GeoJSON, it is a map of perimeters by fire name.
 */
export default function useAllFiresForYearRequest(year) {
  // Process the selected year request if it has not yet been started
  const request = useSelector(selectAllFiresForYearRequest(year));

  const firesForYear = FIRES_FOR_YEAR[year];
  const dispatch = useDispatch();

  useEffect(() => {
    // Request only if not already in-flight
    if (!request) {
      dispatch(loadAllFiresForYear.start({ year }));
      axios(firesForYear)
        .then(response => {
          dispatch(
            loadAllFiresForYear.success({
              year,
              data: mapByFire(response.data),
            })
          );
        })
        .catch(error => {
          dispatch(loadAllFiresForYear.failure({ year, error }));
        });
    }
  }, [dispatch, firesForYear, year, request]);

  return request;
}
