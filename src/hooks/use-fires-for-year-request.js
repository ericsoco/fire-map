import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

import { loadFiresForYear } from '../state/fires-reducer';
import { selectFiresForYearRequest } from '../state/fires-selectors';

// TODO: host these online rather than this parcel magic
import fires2010 from 'url:~/static/data/fires/2010/2010.geojson';
import fires2011 from 'url:~/static/data/fires/2011/2011.geojson';
import fires2012 from 'url:~/static/data/fires/2012/2012.geojson';
import fires2013 from 'url:~/static/data/fires/2013/2013.geojson';
import fires2014 from 'url:~/static/data/fires/2014/2014.geojson';
import fires2015 from 'url:~/static/data/fires/2015/2015.geojson';
import fires2016 from 'url:~/static/data/fires/2016/2016.geojson';
import fires2017 from 'url:~/static/data/fires/2017/2017.geojson';
import fires2018 from 'url:~/static/data/fires/2018/2018.geojson';

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
};

export default function useFiresForYearRequest(year) {
  //
  // TODO: change this to:
  // - a) load the year merged fire file immediately
  // - b) load all years before year in some smart way
  //

  const firesForYear = FIRES_FOR_YEAR[year];
  const dispatch = useDispatch();
  const request = useSelector(selectFiresForYearRequest(year));

  // Request only if not already in-flight
  useEffect(() => {
    if (!request) {
      dispatch(loadFiresForYear.start({ year }));
      axios(firesForYear)
        .then(response => {
          dispatch(loadFiresForYear.success({ year, data: response.data }));
        })
        .catch(error => {
          dispatch(loadFiresForYear.failure({ year, error }));
        });
    }
  }, [dispatch, request]);

  return request;
}
