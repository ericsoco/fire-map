import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

import { loadFiresForYear } from '../state/fires-reducer';
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
 * Loads the requested year, and then serially loads years
 * backwards through time until the first available year;
 * returns requests both for selected year and prior years as they load.
 */
export default function useFiresForYearRequest(selectedYear) {
  const [queuedYear, setQueuedYear] = useState(null);

  // Process the selected year request if it has not yet been started,
  // else process the queued year request
  const selectedYearRequest = useSelector(
    selectFiresForYearRequest(selectedYear)
  );
  const queuedYearRequest = useSelector(selectFiresForYearRequest(queuedYear));
  const readyForNext = isLoaded(selectedYearRequest) && queuedYear;
  const request = readyForNext ? queuedYearRequest : selectedYearRequest;
  const year = readyForNext ? queuedYear : selectedYear;

  // If a previous year has not yet been loaded,
  // queue it for load after this year
  const nextRequest = getNextRequest(
    year,
    useSelector(selectAllFiresForYearRequests())
  );

  const firesForYear = FIRES_FOR_YEAR[year];
  const dispatch = useDispatch();

  useEffect(() => {
    // Request only if not already in-flight
    if (!request) {
      dispatch(loadFiresForYear.start({ year }));
      axios(firesForYear)
        .then(response => {
          dispatch(loadFiresForYear.success({ year, data: response.data }));
        })
        .catch(error => {
          dispatch(loadFiresForYear.failure({ year, error }));
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

  // Return the request for the currently-selected year;
  // also return previous years as they resolve in the background.
  return {
    selectedYearRequest: selectedYearRequest,
    previousYearRequests: useSelector(
      selectFiresBeforeYearRequest(selectedYear)
    ),
  };
}
