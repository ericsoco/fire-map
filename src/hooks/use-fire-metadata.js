import { useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import axios from 'axios';

import { loadFireMetadataForYear } from '../state/fires-reducer';
import { selectAllFireMetadata } from '../state/fires-selectors';
import { LOADED } from '../utils/request-utils';

import metadata2000 from 'url:~/static/data/fires/2000/CA/metadata.json5';
import metadata2001 from 'url:~/static/data/fires/2001/CA/metadata.json5';
import metadata2002 from 'url:~/static/data/fires/2002/CA/metadata.json5';
import metadata2003 from 'url:~/static/data/fires/2003/CA/metadata.json5';
import metadata2004 from 'url:~/static/data/fires/2004/CA/metadata.json5';
import metadata2005 from 'url:~/static/data/fires/2005/CA/metadata.json5';
import metadata2006 from 'url:~/static/data/fires/2006/CA/metadata.json5';
import metadata2007 from 'url:~/static/data/fires/2007/CA/metadata.json5';
import metadata2008 from 'url:~/static/data/fires/2008/CA/metadata.json5';
import metadata2009 from 'url:~/static/data/fires/2009/CA/metadata.json5';
import metadata2010 from 'url:~/static/data/fires/2010/CA/metadata.json5';
import metadata2011 from 'url:~/static/data/fires/2011/CA/metadata.json5';
import metadata2012 from 'url:~/static/data/fires/2012/CA/metadata.json5';
import metadata2013 from 'url:~/static/data/fires/2013/CA/metadata.json5';
import metadata2014 from 'url:~/static/data/fires/2014/CA/metadata.json5';
import metadata2015 from 'url:~/static/data/fires/2015/CA/metadata.json5';
import metadata2016 from 'url:~/static/data/fires/2016/CA/metadata.json5';
import metadata2017 from 'url:~/static/data/fires/2017/CA/metadata.json5';
import metadata2018 from 'url:~/static/data/fires/2018/CA/metadata.json5';
import metadata2019 from 'url:~/static/data/fires/2019/CA/metadata.json5';

const METADATA_FOR_YEAR = {
  2000: metadata2000,
  2001: metadata2001,
  2002: metadata2002,
  2003: metadata2003,
  2004: metadata2004,
  2005: metadata2005,
  2006: metadata2006,
  2007: metadata2007,
  2008: metadata2008,
  2009: metadata2009,
  2010: metadata2010,
  2011: metadata2011,
  2012: metadata2012,
  2013: metadata2013,
  2014: metadata2014,
  2015: metadata2015,
  2016: metadata2016,
  2017: metadata2017,
  2018: metadata2018,
  2019: metadata2019,
};
const YEARS = Object.keys(METADATA_FOR_YEAR);
const fireMetadataSelector = selectAllFireMetadata(YEARS);

/**
 * Loads all fire metadata.
 * Returns all fire metadata concatenated into a single object
 * if all metadata have loaded; else returns null.
 */
export default function useFireMetadata() {
  // Retrieve requests for each year, using shallow-equal comparison
  // instead of referential equality, as selectAllFireMetadata
  // creates a map of {year: request} on the fly
  const requests = useSelector(fireMetadataSelector, shallowEqual);

  const dispatch = useDispatch();

  useEffect(() => {
    YEARS.forEach(year => {
      // Request only if not already in-flight
      if (!requests[year]) {
        dispatch(loadFireMetadataForYear.start({ year }));
        axios(METADATA_FOR_YEAR[year])
          .then(response => {
            dispatch(
              loadFireMetadataForYear.success({
                year,
                data: response.data,
              })
            );
          })
          .catch(error => {
            dispatch(loadFireMetadataForYear.failure({ year, error }));
          });
      }
    });
  }, [dispatch, requests]);

  return Object.values(requests).every(req => req?.status === LOADED)
    ? requests
    : null;
}
