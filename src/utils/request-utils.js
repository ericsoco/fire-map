export const LOADING = 'LOADING';
export const LOADED = 'LOADED';
export const ERROR = 'ERROR';

export function loadingRequest(request) {
  return {
    request,
    status: LOADING,
    data: null,
    error: null,
  };
}

export function loadedRequest(request, data) {
  return {
    request,
    status: LOADED,
    data,
    error: null,
  };
}

export function errorRequest(request, error) {
  return {
    request,
    status: ERROR,
    data: null,
    error,
  };
}

export function isLoading(request) {
  return request && request.status === LOADING;
}

export function isLoaded(request) {
  return request && request.status === LOADED;
}

export function didError(request) {
  return request && request.status === ERROR;
}

export function reduceOver(branch) {
  return reducer => (state, action) => ({
    ...state,
    [branch]: reducer(state[branch], action),
  });
}
