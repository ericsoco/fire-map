# TODO

## Data

- [ ] OOB data:
  - [ ] 2012 has bad value(s)
  - [ ] Halstead (2012)
  - [ ] Hay Canyon (2015)
  - [ ] China Cap (2014)
- [ ] scraper
  - [ ] only report 'All data fetched' when actually done
  - [ ] retry failed downloads
  - [ ] refactor to focus on generating one merged file / year
  - [ ] consider making one all-year/all-fires file at low-res (high simplification),
        to display on site init
  - [x] fix mapshaper 'Command expects a single value' error

## Application

- [ ] geojson loading strategy --
  - rather than load many files, just load one / one merged per year
    and set visibility of each feature based on its datestamp 🤦‍♀️
  - however, have to consider bundle size, really want to lazy load...
  - [ ] yeah ok, so load each year as single merged file, on-demand
  - [ ] even some of these are heavy, simplify geometry more
- [ ] slider
  - [ ] debounce according to distance moved; longer lag for fast motion to make lazy-loading work better
  - [ ] consider coloring segments of slider by year depending if data loaded for that year (like buffering/progress bar)
  - [ ] label with notable fires (bigger than X acres, biggest per year, etc)
- [ ] other layers
  - [ ] developed area / urban areas (just via basemap?)
  - [ ] rain (data layer, not likely a geo layer)

### Current next steps:

- [ ] Finish data loading strategy for all years / years before current
  - [ ] Maybe go back and refactor scraper/merger accordingly
- [ ] Do not display geojson features with datestamps > currentDate
