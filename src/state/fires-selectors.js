export function selectAllFiresForYearRequest(year) {
  return state => state.fires.years[year]?.all || null;
}

export function selectCompleteFiresRequests() {
  return state =>
    Object.keys(state.fires.years).reduce(
      (completeFires, year) => ({
        ...completeFires,
        [year]: state.fires.years[year].complete,
      }),
      {}
    );
}

export function selectCompleteFiresForYearRequest(year) {
  return state => state.fires.years[year]?.complete || null;
}

/**
 * Retrieve all fires from the specified year back to the first empty year,
 * whether due to not-yet-loaded data or the beginning of the available data,
 * arranged in chronological order.
 */
export function selectCompleteFiresBeforeYearRequest(year) {
  return state => {
    let nextYear = year - 1;
    let request;
    let years = [];
    while (
      (request = selectCompleteFiresForYearRequest(nextYear)(state)) !== null
    ) {
      years.unshift(request);
      nextYear--;
    }
    return years;
  };
}

/**
 * Returns all fire metadata requests hashed by year.
 * Note that this selector does not guarantee referential equality,
 * and so must be used with e.g. a shallow-equals comparator.
 */
export function selectAllFireMetadata(years) {
  return state => {
    return years.reduce((map, year) => {
      map[year] = selectFireMetadataForYear(year)(state);
      return map;
    }, {});
  };
}

/**
 * Retrieve fire metadata for a specific year.
 */
export function selectFireMetadataForYear(year) {
  return state => state.fires.years[year]?.metadata || null;
}
