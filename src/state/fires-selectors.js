export function selectAllFiresForYearRequests() {
  return state => state.fires.years;
}

export function selectFiresForYearRequest(year) {
  return state => state.fires.years[year] || null;
}
