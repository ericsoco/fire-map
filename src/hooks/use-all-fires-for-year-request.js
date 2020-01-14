import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

import { loadAllFiresForYear } from '../state/fires-reducer';
import { selectAllFiresForYearRequest } from '../state/fires-selectors';

// TODO: host in dist and load at runtime rather than this parcel magic
import fires2010 from 'url:~/static/data/fires/2010/allPerimeters_California_2010.geojson';
import fires2011 from 'url:~/static/data/fires/2011/allPerimeters_California_2011.geojson';
import fires2012 from 'url:~/static/data/fires/2012/allPerimeters_California_2012.geojson';
import fires2013 from 'url:~/static/data/fires/2013/allPerimeters_California_2013.geojson';
import fires2014 from 'url:~/static/data/fires/2014/allPerimeters_California_2014.geojson';
import fires2015 from 'url:~/static/data/fires/2015/allPerimeters_California_2015.geojson';
import fires2016 from 'url:~/static/data/fires/2016/allPerimeters_California_2016.geojson';
import fires2017 from 'url:~/static/data/fires/2017/allPerimeters_California_2017.geojson';
import fires2018 from 'url:~/static/data/fires/2018/allPerimeters_California_2018.geojson';
import fires2019 from 'url:~/static/data/fires/2019/allPerimeters_California_2019.geojson';

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
 * Loads all perimeters of each fire in the requested year.
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
          dispatch(loadAllFiresForYear.success({ year, data: response.data }));
        })
        .catch(error => {
          dispatch(loadAllFiresForYear.failure({ year, error }));
        });
    }
  }, [dispatch, firesForYear, year, request]);

  return request;
}
