import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

import {
  FIRE_RESOLUTION,
  loadCompleteFiresForYear,
} from '../state/fires-reducer';
import {
  selectAllFires,
  selectCompleteFiresForYearRequest,
} from '../state/fires-selectors';
import { isLoaded } from '../utils/request-utils';

import fires2000 from 'url:~/static/data/fires/2000/CA/finalH3Perimeters.geojson';
import fires2001 from 'url:~/static/data/fires/2001/CA/finalH3Perimeters.geojson';
import fires2002 from 'url:~/static/data/fires/2002/CA/finalH3Perimeters.geojson';
import fires2003 from 'url:~/static/data/fires/2003/CA/finalH3Perimeters.geojson';
import fires2004 from 'url:~/static/data/fires/2004/CA/finalH3Perimeters.geojson';
import fires2005 from 'url:~/static/data/fires/2005/CA/finalH3Perimeters.geojson';
import fires2006 from 'url:~/static/data/fires/2006/CA/finalH3Perimeters.geojson';
import fires2007 from 'url:~/static/data/fires/2007/CA/finalH3Perimeters.geojson';
import fires2008 from 'url:~/static/data/fires/2008/CA/finalH3Perimeters.geojson';
import fires2009 from 'url:~/static/data/fires/2009/CA/finalH3Perimeters.geojson';
import fires2010 from 'url:~/static/data/fires/2010/CA/finalH3Perimeters.geojson';
import fires2011 from 'url:~/static/data/fires/2011/CA/finalH3Perimeters.geojson';
import fires2012 from 'url:~/static/data/fires/2012/CA/finalH3Perimeters.geojson';
import fires2013 from 'url:~/static/data/fires/2013/CA/finalH3Perimeters.geojson';
import fires2014 from 'url:~/static/data/fires/2014/CA/finalH3Perimeters.geojson';
import fires2015 from 'url:~/static/data/fires/2015/CA/finalH3Perimeters.geojson';
import fires2016 from 'url:~/static/data/fires/2016/CA/finalH3Perimeters.geojson';
import fires2017 from 'url:~/static/data/fires/2017/CA/finalH3Perimeters.geojson';
import fires2018 from 'url:~/static/data/fires/2018/CA/finalH3Perimeters.geojson';
import fires2019 from 'url:~/static/data/fires/2019/CA/finalH3Perimeters.geojson';

import firesLow2000 from 'url:~/static/data/fires/2000/CA/finalH3Perimeters-low.geojson';
import firesLow2001 from 'url:~/static/data/fires/2001/CA/finalH3Perimeters-low.geojson';
import firesLow2002 from 'url:~/static/data/fires/2002/CA/finalH3Perimeters-low.geojson';
import firesLow2003 from 'url:~/static/data/fires/2003/CA/finalH3Perimeters-low.geojson';
import firesLow2004 from 'url:~/static/data/fires/2004/CA/finalH3Perimeters-low.geojson';
import firesLow2005 from 'url:~/static/data/fires/2005/CA/finalH3Perimeters-low.geojson';
import firesLow2006 from 'url:~/static/data/fires/2006/CA/finalH3Perimeters-low.geojson';
import firesLow2007 from 'url:~/static/data/fires/2007/CA/finalH3Perimeters-low.geojson';
import firesLow2008 from 'url:~/static/data/fires/2008/CA/finalH3Perimeters-low.geojson';
import firesLow2009 from 'url:~/static/data/fires/2009/CA/finalH3Perimeters-low.geojson';
import firesLow2010 from 'url:~/static/data/fires/2010/CA/finalH3Perimeters-low.geojson';
import firesLow2011 from 'url:~/static/data/fires/2011/CA/finalH3Perimeters-low.geojson';
import firesLow2012 from 'url:~/static/data/fires/2012/CA/finalH3Perimeters-low.geojson';
import firesLow2013 from 'url:~/static/data/fires/2013/CA/finalH3Perimeters-low.geojson';
import firesLow2014 from 'url:~/static/data/fires/2014/CA/finalH3Perimeters-low.geojson';
import firesLow2015 from 'url:~/static/data/fires/2015/CA/finalH3Perimeters-low.geojson';
import firesLow2016 from 'url:~/static/data/fires/2016/CA/finalH3Perimeters-low.geojson';
import firesLow2017 from 'url:~/static/data/fires/2017/CA/finalH3Perimeters-low.geojson';
import firesLow2018 from 'url:~/static/data/fires/2018/CA/finalH3Perimeters-low.geojson';
import firesLow2019 from 'url:~/static/data/fires/2019/CA/finalH3Perimeters-low.geojson';

const FIRST_YEAR = 2000;
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
 * Loads the last perimeter of each fire in the requested year, and then
 * serially loads years backwards through time until the first available year;
 * returns requests both for selected year and prior years as they load.
 */
export default function useCompleteFiresForYearRequest(
  selectedYear,
  resolution
) {
  const [queuedYear, setQueuedYear] = useState(null);

  // Process the selected year request if it has not yet been started,
  // else process the queued year request
  const selectedYearRequest = useSelector(
    selectCompleteFiresForYearRequest(selectedYear, resolution)
  );
  const queuedYearRequest = useSelector(
    selectCompleteFiresForYearRequest(queuedYear, resolution)
  );
  const allFireRequests = useSelector(selectAllFires());

  // Note: this was a selector, but couldn't get memoization working,
  // so moved it to a useMemo hook here.
  const allCompleteRequests = useMemo(
    () =>
      Object.keys(allFireRequests).reduce(
        (completeFires, year) => ({
          ...completeFires,
          [year]: allFireRequests[year].complete?.[resolution],
        }),
        {}
      ),
    [allFireRequests, resolution]
  );

  // Retrieve all fires from the specified year back to the first empty year,
  // whether due to not-yet-loaded data or the beginning of the available data,
  // arranged in chronological order.
  // Note: this was a selector, but couldn't get memoization working,
  // so moved it to a useMemo hook here.
  const priorYearRequests = useMemo(() => {
    const getRequest = year => allCompleteRequests[year] || null;
    let nextYear = selectedYear - 1;
    let years = [];
    let request;
    while ((request = getRequest(nextYear)) !== null) {
      years.unshift(request);
      nextYear--;
    }
    return years;
  }, [allCompleteRequests, selectedYear]);

  const readyForNext = isLoaded(selectedYearRequest) && queuedYear;
  const request = readyForNext ? queuedYearRequest : selectedYearRequest;
  const year = readyForNext ? queuedYear : selectedYear;

  // If a previous year has not yet been loaded,
  // queue it for load after this year
  const nextRequest = getNextRequest(year, allCompleteRequests);

  const firesForYear =
    resolution === FIRE_RESOLUTION.HIGH
      ? FIRES_FOR_YEAR[year]
      : FIRES_LOW_FOR_YEAR[year];

  const dispatch = useDispatch();

  useEffect(() => {
    // Request only if not already in-flight
    if (!request) {
      dispatch(loadCompleteFiresForYear.start({ year, resolution }));
      axios(firesForYear)
        .then(response => {
          dispatch(
            loadCompleteFiresForYear.success({
              year,
              resolution,
              data: response.data,
            })
          );
        })
        .catch(error => {
          dispatch(
            loadCompleteFiresForYear.failure({ year, resolution, error })
          );
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
  }, [dispatch, firesForYear, year, resolution, request, nextRequest]);

  // Return the request for the currently-selected year;
  // also return previous years as they resolve in the background.
  return {
    selectedYearRequest,
    priorYearRequests,
  };
}
