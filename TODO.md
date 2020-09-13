# TODO

## Data

- [ ] get 2020 data (fuck 2020.)
- [ ] invalid data
      how best to handle? prob want to remove perimeters with "geometry": null
      in data processing step, but this is non-trivial as data processing deals
      with files, without peeking into their contents.
  - [ ] 2012 has bad value(s) -- ??
  - [ ] Brannan (2014) has `null` geometry
  - [ ] Gasquet Complex (2015) has `null` geometry
  - [ ] Cabin (2017) has `null` geometry
- [ ] OOB data:
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
        note: increased simplification once,
        from: .domain([10, 500]).range([30, 3]).exponent(0.25)
        to: .domain([5, 350]).range([20, 2]).exponent(0.15)
        but still end up with very heavy (10+MB) merged files.
        may need to consider other strategies...
  - [x] ohhh wait, each fire folder has multiple perimeters per fire.
        don't have that in merged fires :/
        looks like we are going to have to load all geojsons for each fire,
        tho we only need to load those near the currentDate...
- [ ] fires layer
  - [x] perf: handle incremental loads with one layer / data payload
        https://deck.gl/#/documentation/developer-guide/performance-optimization?section=use-updatetriggers#handle-incremental-data-loading
  - [x] only render most recent perimeter for each fire
  - [ ] ^^ not sure about best perf strategy; may need to do filtering
        in getFillColor instead of passing new array every time
        (generated in extractLatestPerimeters)...
  - [ ] memoize properly, not using useState, per comments in map.js
  - [ ] look into Date comparison optimizations in - map.js::extractLatestPerimeters - use-all-fires-for-year-request.js::sortPerimetersByDate
  - [x] handle requests for years beyond the last gracefully:
        don't blank out whole fire layer because of null request
- [ ] slider
  - [x] debounce according to distance moved; longer lag for fast motion to make lazy-loading work better
  - [ ] consider coloring segments of slider by year depending if data loaded for that year (like buffering/progress bar)
  - [ ] label with notable fires (bigger than X acres, biggest per year, etc)
    - [ ] link labels to zoom map to fire (?)
  - [ ] add bar chart of monthly acres burned
    - [ ] how to calculate?
    - [ ] write script to pre-calculate and write to a file; load on init
  - stuff from email (diverging bar chart for pre)
- [ ] other layers
  - [ ] developed area / urban areas (just via basemap?)
  - [ ] rain (data layer, not likely a geo layer)
        diverging bar chart, showing deviation from norm (sim concept to SST)
  - [ ] nasa satellite hotspot detection
        https://earthdata.nasa.gov/earth-observation-data/near-real-time/firms/active-fire-data#tab-content-6
- [ ] intro
  - [ ] dedication to firefighters
- [ ] bugs
  - [ ] why do title + slider disappear while LoadingIcon visible?
- [ ] map
  - [ ] Animate viewport from flat/top-down view to oblique view;
        oblique view (w/ pitch + bearing) is too foreign a perspective to start with
- [ ] other / ideas
  - [ ] encode polygon height to:
    - number of times an area has burned?
    - days-length of fire?
    - Elevation of each starts high, then dies down after fire is contained, like a burning fire. Could even fade from red to grey (ash), tho this won’t work well for additive blending...or maybe it will? Existing greys should push red into...hm, maybe pink. Maybe instead of grey, a greyish yellow?
  - [ ] additive blending to highlight overlapping perimeters?
        Invert basemap colors (maintain terrain on dark tiles?) to enable additive blending? Stack fires w/additive (once showing only most recent perimeter for each fire)
  - [ ] hex aggregation
    - [ ] reduce perimeters to h3 hexes at low zoom, for perf?
  - [x] is 2019 data available yet?
  - [ ] label megafires (> 100k acres) on slider
    - [ ] zoom to first megafire in dataset
  - [ ] search for fire by name (a la LA Times map)
  - [ ] differential bundling for older browser support
        https://v2.parceljs.org/getting-started/webapp/#differential-serving

### Current next steps:

- [x] Finish data loading strategy for all years / years before current
- [x] Maybe go back and refactor scraper/merger accordingly
  - [x] compress all perimeters for each fire into a single FeatureCollection
        with each perimeter as a separate Feature
  - [x] consider compressing all perimeters for year into a single
        FeatureCollection in order to load only one file / year
  - [x] simplify geometry even more...
- [x] Do not display geojson features with datestamps > currentDate
      Use getFillColor/LineColor, or some other GeoJsonLayer, as a callback?
      e.g. getFillColor={feature => feature.datestamp > foo...}
  - [x] Display all fires up to currentDate, not just those for current year
- [ ] RFP
  - [ ] publish site to gh-pages / transmote
  - [ ] refine prototype
    - [x] enable basic picking + tooltips
    - [ ] style tooltips
    - [ ] style controls
    - [x] add playback controls
          implement in a way that a segment can be cued + played to tell stories,
          e.g. encircling of Ojai by Thomas Fire - start time - stop time - playback speed - metadata (title, desc, etc)
    - [x] rotate map to oblique view with north to left, south to right
    - [x] load all perimeters, not just last, to show fires growing
  - [ ] write
    - [x] inspiration / reason
    - [x] narrative
    - [ ] current prototype
    - [ ] aspirations
      - [ ] features:
        - other datasets
        - zoom to fires (create GIFs for RFP)
          - [ ] ojai/thomas
          - [ ] paradise/??
          - [ ] sonoma/?? - 2017. 2019
        - ...?
      - [ ] technical:
        - improve loading
        - reduce bundle size (5.9MB???)
        - all open-source, including data scraper
        - deployment target: desktop-first, but could possibly be adapted to mobile
          - load less data / omit smaller fires
          - focus more on highlighting individual fires and less on open-ended map exploration
  - [x] send to cfp@parametric.press, Subject: [Pitch] The Fires Next Time: California Wildfires Map
