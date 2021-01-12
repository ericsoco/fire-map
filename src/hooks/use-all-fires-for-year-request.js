import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

import {
  getFireDate,
  getFireName,
  loadAllFiresForYear,
} from '../state/fires-reducer';
import { selectAllFiresForYearRequest } from '../state/fires-selectors';

import fires2000 from 'url:~/static/data/fires/2000/CA/allPerimeters.geojson';
import fires2001 from 'url:~/static/data/fires/2001/CA/allPerimeters.geojson';
import fires2002 from 'url:~/static/data/fires/2002/CA/allPerimeters.geojson';
import fires2003 from 'url:~/static/data/fires/2003/CA/allPerimeters.geojson';
import fires2004 from 'url:~/static/data/fires/2004/CA/allPerimeters.geojson';
import fires2005 from 'url:~/static/data/fires/2005/CA/allPerimeters.geojson';
import fires2006 from 'url:~/static/data/fires/2006/CA/allPerimeters.geojson';
import fires2007 from 'url:~/static/data/fires/2007/CA/allPerimeters.geojson';
import fires2008 from 'url:~/static/data/fires/2008/CA/allPerimeters.geojson';
import fires2009 from 'url:~/static/data/fires/2009/CA/allPerimeters.geojson';
import fires2010 from 'url:~/static/data/fires/2010/CA/allPerimeters.geojson';
import fires2011 from 'url:~/static/data/fires/2011/CA/allPerimeters.geojson';
import fires2012 from 'url:~/static/data/fires/2012/CA/allPerimeters.geojson';
import fires2013 from 'url:~/static/data/fires/2013/CA/allPerimeters.geojson';
import fires2014 from 'url:~/static/data/fires/2014/CA/allPerimeters.geojson';
import fires2015 from 'url:~/static/data/fires/2015/CA/allPerimeters.geojson';
import fires2016 from 'url:~/static/data/fires/2016/CA/allPerimeters.geojson';
import fires2017 from 'url:~/static/data/fires/2017/CA/allPerimeters.geojson';
import fires2018 from 'url:~/static/data/fires/2018/CA/allPerimeters.geojson';
import fires2019 from 'url:~/static/data/fires/2019/CA/allPerimeters.geojson';

const FIRES_FOR_YEAR = {
  2000: fires2000,
  2001: fires2001,
  2002: fires2002,
  2003: fires2003,
  2004: fires2004,
  2005: fires2005,
  2006: fires2006,
  2007: fires2007,
  2008: fires2008,
  2009: fires2009,
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
  return new Date(getFireDate(b)) - new Date(getFireDate(a));
}

/**
 * Map perimeters to fire name and
 * sort reverse chronologically within each.
 */
function mapByFire(data) {
  const byFire = data.features.reduce((map, feature) => {
    const name = getFireName(feature);
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
