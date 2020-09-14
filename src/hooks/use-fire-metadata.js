import { useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import axios from 'axios';

import { loadFireMetadataForYear } from '../state/fires-reducer';
import { selectAllFireMetadata } from '../state/fires-selectors';
import { LOADED } from '../utils/request-utils';

// TODO: host in dist and load at runtime rather than this parcel magic
// Use alias for transformer-raw (specified in .parcelrc),
// per https://github.com/parcel-bundler/parcel/issues/1080#issuecomment-557240449
import metadata2010 from 'url:~/static/data/fires/2010/California/metadata.json';
import metadata2011 from 'url:~/static/data/fires/2011/California/metadata.json';
import metadata2012 from 'url:~/static/data/fires/2012/California/metadata.json';
import metadata2013 from 'url:~/static/data/fires/2013/California/metadata.json';
import metadata2014 from 'url:~/static/data/fires/2014/California/metadata.json';
import metadata2015 from 'url:~/static/data/fires/2015/California/metadata.json';
import metadata2016 from 'url:~/static/data/fires/2016/California/metadata.json';
import metadata2017 from 'url:~/static/data/fires/2017/California/metadata.json';
import metadata2018 from 'url:~/static/data/fires/2018/California/metadata.json';
import metadata2019 from 'url:~/static/data/fires/2019/California/metadata.json';

const METADATA_FOR_YEAR = {
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

/**
 * Loads all fire metadata.
 * Returns all fire metadata concatenated into a single object
 * if all metadata have loaded; else returns null.
 */
export default function useFireMetadata() {
  const years = Object.keys(METADATA_FOR_YEAR);

  // Retrieve requests for each year, using shallow-equal comparison
  // instead of referential equality, as selectAllFireMetadata
  // creates a map of {year: request} on the fly
  const requests = useSelector(selectAllFireMetadata(years), shallowEqual);

  const dispatch = useDispatch();

  useEffect(() => {
    years.forEach(year => {
      console.log(`${year}: `, requests[year]);
      // Request only if not already in-flight
      if (!requests[year]) {
        console.log('>>>>> requesting metadata for year:', year);
        console.log('>>>>> axios loading:', METADATA_FOR_YEAR[year]);
        // TODO NEXT: axios seems to be unable to load; confirmed parcel transforms this differently
        // as it's JSON instead of geoJSON; it's already parsed at this point.
        // how to load at runtime instead of parsing directly?
        // maybe use extension other than json / specify transformer-raw for json?
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
  }, [dispatch, years, requests]);

  return Object.values(requests).every(req => req?.status === LOADED)
    ? requests
    : null;
}
