import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

import { loadAllFiresForYear } from '../state/fires-reducer';
import {
  selectAllFiresForYearRequests,
  selectFiresBeforeYearRequest,
  selectFiresForYearRequest,
} from '../state/fires-selectors';
import { isLoaded } from '../utils/request-utils';

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

const FIRST_YEAR = 2010;
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

function getNextRequest(year, allRequests) {
  let prevYear = year - 1;
  let nextRequest = allRequests[prevYear];
  while (isLoaded(nextRequest) && prevYear >= FIRST_YEAR) {
    prevYear--;
    nextRequest = allRequests[prevYear];
  }
  return prevYear < FIRST_YEAR
    ? null
    : { request: nextRequest, year: prevYear };
}

/**
 * Loads all perimeters of each fire in the requested year.
 */
export default function useAllFiresForYearRequest(selectedYear) {
  // Process the selected year request if it has not yet been started
  const selectedYearRequest = useSelector(
    selectAllFiresForYearRequest(selectedYear)
  );

  //
  // TODO NEXT:
  // have to figure out how to pull in all perimeters.
  // this may end up an extremely heavy data load;
  // definitely will need to reprocess data at higher compression
  // (tho may leave complete perims less-compressed...TBD)
  // may need to generate manifest as part of scraping process
  // that runtime here can pull, since browser can't access filesystem.
  // then, replace `firesForYear` with list of perimeters to load,
  // load them all in parallel, and dispatch success when all requests
  // have resolved (allow some failures).
  // finally, call this hook from map.js and render what it returns.
  //

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
    } else if (isLoaded(request)) {
      // When this request completes:
      if (nextRequest) {
        // Start the next request if one is queued and not yet started
        if (!nextRequest.request) setQueuedYear(nextRequest.year);
      } else {
        // Else, reset the queue
        setQueuedYear(null);
      }
    }
  }, [dispatch, firesForYear, year, request, nextRequest]);

  return selectedYearRequest;
}
