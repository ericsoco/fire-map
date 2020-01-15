export function selectCurrentDate() {
  return state => state.ui.currentDate;
}

export function selectPlaybackStart() {
  return state => state.ui.playbackStart;
}
