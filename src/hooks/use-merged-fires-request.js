import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

import { loadMergedFires } from '../state/fires-reducer';
import { selectMergedFiresRequest } from '../state/fires-selectors';

// TODO: load merged fires from each year rather than single merged fire
import MERGED_FIRE_PATH from 'url:~/static/data/_test-fires/2010-18-no-2012.geojson';

export default function useMergedFiresRequest() {
  const dispatch = useDispatch();
  const request = useSelector(selectMergedFiresRequest);

  // Request only if not already in-flight
  useEffect(() => {
    if (!request) {
      dispatch(loadMergedFires.start());
      axios(MERGED_FIRE_PATH)
        .then(response => {
          dispatch(loadMergedFires.success({ data: response.data }));
        })
        .catch(error => {
          dispatch(loadMergedFires.failure({ error }));
        });
    }
  }, [dispatch, request]);

  return request;
}
