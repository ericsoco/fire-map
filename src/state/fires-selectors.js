export function selectAllFiresForYearRequests() {
  return state => state.fires.years;
}

export function selectFiresForYearRequest(year) {
  return state => state.fires.years[year] || null;
}

/**
 * Retrieve all fires from the specified year back to the first empty year,
 * whether due to not-yet-loaded data or the beginning of the available data,
 * arranged in chronological order.
 * Note: this selector is not pure;
 * use it with shallowEqual for memoized results.
 */
export function selectFiresBeforeYearRequest(year) {
  return state => {
    let nextYear = year - 1;
    let request;
    let years = [];
    while ((request = selectFiresForYearRequest(nextYear)(state)) !== null) {
      years.unshift(request);
      nextYear--;
    }
    return years;
  };
}
