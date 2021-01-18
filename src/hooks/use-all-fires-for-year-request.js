import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

import {
  FIRE_RESOLUTION,
  getFireDate,
  getFireName,
  loadAllFiresForYear,
} from '../state/fires-reducer';
import { selectAllFiresForYearRequest } from '../state/fires-selectors';

import fires2000 from 'url:~/static/data/fires/2000/CA/allH3Perimeters.geojson';
import fires2001 from 'url:~/static/data/fires/2001/CA/allH3Perimeters.geojson';
import fires2002 from 'url:~/static/data/fires/2002/CA/allH3Perimeters.geojson';
import fires2003 from 'url:~/static/data/fires/2003/CA/allH3Perimeters.geojson';
import fires2004 from 'url:~/static/data/fires/2004/CA/allH3Perimeters.geojson';
import fires2005 from 'url:~/static/data/fires/2005/CA/allH3Perimeters.geojson';
import fires2006 from 'url:~/static/data/fires/2006/CA/allH3Perimeters.geojson';
import fires2007 from 'url:~/static/data/fires/2007/CA/allH3Perimeters.geojson';
import fires2008 from 'url:~/static/data/fires/2008/CA/allH3Perimeters.geojson';
import fires2009 from 'url:~/static/data/fires/2009/CA/allH3Perimeters.geojson';
import fires2010 from 'url:~/static/data/fires/2010/CA/allH3Perimeters.geojson';
import fires2011 from 'url:~/static/data/fires/2011/CA/allH3Perimeters.geojson';
import fires2012 from 'url:~/static/data/fires/2012/CA/allH3Perimeters.geojson';
import fires2013 from 'url:~/static/data/fires/2013/CA/allH3Perimeters.geojson';
import fires2014 from 'url:~/static/data/fires/2014/CA/allH3Perimeters.geojson';
import fires2015 from 'url:~/static/data/fires/2015/CA/allH3Perimeters.geojson';
import fires2016 from 'url:~/static/data/fires/2016/CA/allH3Perimeters.geojson';
import fires2017 from 'url:~/static/data/fires/2017/CA/allH3Perimeters.geojson';
import fires2018 from 'url:~/static/data/fires/2018/CA/allH3Perimeters.geojson';
import fires2019 from 'url:~/static/data/fires/2019/CA/allH3Perimeters.geojson';

import firesLow2000 from 'url:~/static/data/fires/2000/CA/allH3Perimeters-low.geojson';
import firesLow2001 from 'url:~/static/data/fires/2001/CA/allH3Perimeters-low.geojson';
import firesLow2002 from 'url:~/static/data/fires/2002/CA/allH3Perimeters-low.geojson';
import firesLow2003 from 'url:~/static/data/fires/2003/CA/allH3Perimeters-low.geojson';
import firesLow2004 from 'url:~/static/data/fires/2004/CA/allH3Perimeters-low.geojson';
import firesLow2005 from 'url:~/static/data/fires/2005/CA/allH3Perimeters-low.geojson';
import firesLow2006 from 'url:~/static/data/fires/2006/CA/allH3Perimeters-low.geojson';
import firesLow2007 from 'url:~/static/data/fires/2007/CA/allH3Perimeters-low.geojson';
import firesLow2008 from 'url:~/static/data/fires/2008/CA/allH3Perimeters-low.geojson';
import firesLow2009 from 'url:~/static/data/fires/2009/CA/allH3Perimeters-low.geojson';
import firesLow2010 from 'url:~/static/data/fires/2010/CA/allH3Perimeters-low.geojson';
import firesLow2011 from 'url:~/static/data/fires/2011/CA/allH3Perimeters-low.geojson';
import firesLow2012 from 'url:~/static/data/fires/2012/CA/allH3Perimeters-low.geojson';
import firesLow2013 from 'url:~/static/data/fires/2013/CA/allH3Perimeters-low.geojson';
import firesLow2014 from 'url:~/static/data/fires/2014/CA/allH3Perimeters-low.geojson';
import firesLow2015 from 'url:~/static/data/fires/2015/CA/allH3Perimeters-low.geojson';
import firesLow2016 from 'url:~/static/data/fires/2016/CA/allH3Perimeters-low.geojson';
import firesLow2017 from 'url:~/static/data/fires/2017/CA/allH3Perimeters-low.geojson';
import firesLow2018 from 'url:~/static/data/fires/2018/CA/allH3Perimeters-low.geojson';
import firesLow2019 from 'url:~/static/data/fires/2019/CA/allH3Perimeters-low.geojson';

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

const FIRES_LOW_FOR_YEAR = {
  2000: firesLow2000,
  2001: firesLow2001,
  2002: firesLow2002,
  2003: firesLow2003,
  2004: firesLow2004,
  2005: firesLow2005,
  2006: firesLow2006,
  2007: firesLow2007,
  2008: firesLow2008,
  2009: firesLow2009,
  2010: firesLow2010,
  2011: firesLow2011,
  2012: firesLow2012,
  2013: firesLow2013,
  2014: firesLow2014,
  2015: firesLow2015,
  2016: firesLow2016,
  2017: firesLow2017,
  2018: firesLow2018,
  2019: firesLow2019,
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
export default function useAllFiresForYearRequest(year, resolution) {
  // Process the selected year request if it has not yet been started
  const request = useSelector(selectAllFiresForYearRequest(year, resolution));

  const firesForYear =
    resolution === FIRE_RESOLUTION.HIGH
      ? FIRES_FOR_YEAR[year]
      : FIRES_LOW_FOR_YEAR[year];
  const dispatch = useDispatch();

  useEffect(() => {
    // Request only if not already in-flight
    if (!request) {
      dispatch(loadAllFiresForYear.start({ year, resolution }));
      axios(firesForYear)
        .then(response => {
          dispatch(
            loadAllFiresForYear.success({
              year,
              resolution,
              data: mapByFire(response.data),
            })
          );
        })
        .catch(error => {
          dispatch(loadAllFiresForYear.failure({ year, resolution, error }));
        });
    }
  }, [dispatch, firesForYear, year, resolution, request]);

  return request;
}
