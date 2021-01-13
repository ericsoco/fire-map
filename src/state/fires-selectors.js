export function selectAllFires() {
  return state => state.fires.years;
}

export function selectAllFiresForYearRequest(year, resolution) {
  return state => state.fires.years[year]?.all?.[resolution] || null;
}

export function selectCompleteFiresForYearRequest(year, resolution) {
  return state => state.fires.years[year]?.complete?.[resolution] || null;
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
