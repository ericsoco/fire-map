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
  - [x] yeah ok, so load each year as single merged file, on-demand
  - [ ] even some of these are heavy, simplify geometry more
  - [ ] ohhh wait, each fire folder has multiple perimeters per fire.
        don't have that in merged fires :/
        looks like we are going to have to load all geojsons for each fire,
        tho we only need to load those near the currentDate...
- [ ] slider
  - [ ] debounce according to distance moved; longer lag for fast motion to make lazy-loading work better
  - [ ] consider coloring segments of slider by year depending if data loaded for that year (like buffering/progress bar)
  - [ ] label with notable fires (bigger than X acres, biggest per year, etc)
    - [ ] link labels to zoom map to fire (?)
  - stuff from email (diverging bar chart for pre)
- [ ] other layers
  - [ ] developed area / urban areas (just via basemap?)
  - [ ] rain (data layer, not likely a geo layer)
        diverging bar chart, showing deviation from norm (sim concept to SST)
  - [ ] nasa satellite hotspot detection
        https://www.nytimes.com/interactive/2020/01/02/climate/australia-fires-map.html
- [ ] intro
  - [ ] dedication to firefighters
- [ ] other / ideas
  - [ ] encode polygon height to:
    - number of times an area has burned?
    - days-length of fire?

### Current next steps:

- [x] Finish data loading strategy for all years / years before current
- [ ] Maybe go back and refactor scraper/merger accordingly
- [x] Do not display geojson features with datestamps > currentDate
      Use getFillColor/LineColor, or some other GeoJsonLayer, as a callback?
      e.g. getFillColor={feature => feature.datestamp > foo...}
  - [x] Display all fires up to currentDate, not just those for current year
- [ ] RFP
  - [ ] publish site to gh-pages / transmote
  - [ ] refine prototype
    - [ ] add playback controls
    - [x] rotate map to oblique view with north to left, south to right
    - [ ] load all perimeters, not just last, to show fires growing
  - [ ] write
    - [ ] inspiration / reason
    - [ ] narrative
    - [ ] current prototype
    - [ ] aspirations
      - [ ] features:
        - other datasets
        - zoom to fires
        - ...?
      - [ ] technical:
        - improve loading
        - all open-source, including data scraper
  - [ ] send to cfp@parametric.press, Subject: [Pitch: California Wildfires Map]
