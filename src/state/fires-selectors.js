export function selectFiresForYearRequest(year) {
  return state => state.fires.years[year] || null;
}
