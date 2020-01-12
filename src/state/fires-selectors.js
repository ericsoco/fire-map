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
