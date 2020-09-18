# TODO

## Overview
- [ ] 2020 data
- [X] switch data source from GeoMAC to NIFC
- [ ] data loading strategy
- [ ] design
- [ ] deploy, get feedback
- [ ] narrative
- [ ] polish


## Application
### geojson loading strategy
  - rather than load many files, just load one / one merged per year
    and set visibility of each feature based on its datestamp 🤦‍♀️
  - however, have to consider bundle size, really want to lazy load...
  - [X] yeah ok, so load each year as single merged file, on-demand
  - [ ] even some of these are heavy, simplify geometry more
        note: increased simplification once,
        from: .domain([10, 500]).range([30, 3]).exponent(0.25)
        to: .domain([5, 350]).range([20, 2]).exponent(0.15)
        but still end up with very heavy (10+MB) merged files.
        may need to consider other strategies...
  - [ ] load (serially?) in the background after app init
        NOTE: use-complete-fires already does this, only it loads backwards from selected date...
  - [X] ohhh wait, each fire folder has multiple perimeters per fire.
        don't have that in merged fires :/
        looks like we are going to have to load all geojsons for each fire,
        tho we only need to load those near the currentDate...

### fires layer
  - [X] perf: handle incremental loads with one layer / data payload
        https://deck.gl/#/documentation/developer-guide/performance-optimization?section=use-updatetriggers#handle-incremental-data-loading
  - [X] only render most recent perimeter for each fire
  - [ ] ^^ not sure about best perf strategy; may need to do filtering
        in getFillColor instead of passing new array every time
        (generated in extractLatestPerimeters)...
  - [ ] memoize properly, not using useState, per comments in map.js
  - [ ] look into Date comparison optimizations in - map.js::extractLatestPerimeters - use-all-fires-for-year-request.js::sortPerimetersByDate
  - [X] handle requests for years beyond the last gracefully:
        don't blank out whole fire layer because of null request

### slider
  - [ ] align bars w/ slider
      (requires fixing 2020 data)
  - [ ] verify data against CALFIRE (e.g. https://www.fire.ca.gov/incidents/2018/)
    - [ ] now using final perimeters to determine acres / month; a better solution would be to check last month's perimeters against this month and subtract to calculate differential per perimeter across month boundaries.
  - [ ] tooltip: use 🔥 emoji to indicate relative amount of fire, either with number of chars or font size
  - [ ] label with notable fires (megafires (> 100k acres), biggest per year, etc)
    - [ ] link labels to zoom map + slider to fire (?)
  - [ ] consider coloring segments of slider by year depending if data loaded for that year (like buffering/progress bar)
  - [X] debounce according to distance moved; longer lag for fast motion to make lazy-loading work better
  - [X] add bar chart of monthly acres burned
    - [X] how to calculate?
    - [X] write script to pre-calculate and write to a file; load on init
    - [X] 2019 not calculated correctly...same issue in other years?
    - [X] NEXT: fix bar chart / slider interaction:
      - [X] create interaction layer / hit area that sits over both bar chart and slider. this layer is a second nivo chart, with all bars full-height but transparent, and handles interaction events.
        - [X] fix memoization / metadata selector not ref equal, causing tooltip remounting
        - [X] remove debouncing?
        - [X] tooltips
              use nivo's tooltip handler, but render tooltips in fixed location (per-bar), below slider track
              display: - month, year - num acres burned
        - [X] interaction handlers
              hover is handled by nivo; have to add handling for mouseDown/Move/Up to set currentDate.
        - [X] delete slider-tooltip.js and any other cruft
    - [X] just like slider (track / rail), make bars to left of current date solid, bars to right translucent
    - [X] refine slider value tooltip styling
    - [X] finish tooltip / date formatting
      - [X] slider hit area blocks bottom part of bar chart
      - [X] slice-style tooltip hover; don't require hovering directly on bar
            NOTE: may want to decouple tooltip interaction from nivo, just implement manually

### intro / narrative
  - [ ] dedication to firefighters
  - [ ] instructions
    - press play, sit back and watch (callouts appear at notable moments)
    - explore: scrub manually (callouts appear only over slider)
  - [ ] zoom to first megafire in dataset and add callout

### design
- [ ] light / dark?
- [ ] mobile layout?

### map
  - [ ] basemap
    - [ ] dark, w/ terrain?
    - [ ] developed area / urban areas
  - [ ] hex aggregation
    - [ ] reduce perimeters to h3 hexes at low zoom, for perf?
  - [-] Animate viewport from flat/top-down view to oblique view;
        oblique view (w/ pitch + bearing) is too foreign a perspective to start with

### other / ideas
  - [ ] encode polygon height to:
    - number of times an area has burned?
    - days-length of fire?
    - Elevation of each starts high, then dies down after fire is contained, like a burning fire. Could even fade from red to grey (ash), tho this won’t work well for additive blending...or maybe it will? Existing greys should push red into...hm, maybe pink. Maybe instead of grey, a greyish yellow?
  - [ ] additive blending to highlight overlapping perimeters?
        Invert basemap colors (maintain terrain on dark tiles?) to enable additive blending? Stack fires w/additive (once showing only most recent perimeter for each fire)
  - [X] is 2019 data available yet?
  - [ ] search for fire by name (a la LA Times map)
  - [ ] differential bundling for older browser support
        https://v2.parceljs.org/getting-started/webapp/#differential-serving
  - [ ] rain (data layer, not likely a geo layer)
        diverging bar chart, showing deviation from norm (sim concept to SST)
  - [ ] nasa satellite hotspot detection
        https://earthdata.nasa.gov/earth-observation-data/near-real-time/firms/active-fire-data#tab-content-6


## Data
- [ ] get 2020 data (fuck 2020.)
- [X] switch data source from GeoMAC to NIFC
      https://data-nifc.opendata.arcgis.com/
  - Historic GeoMAC perimeters 2000 - 2019:
    https://data-nifc.opendata.arcgis.com/datasets/historic-geomac-perimeters-2000/
    thru
    https://data-nifc.opendata.arcgis.com/datasets/historic-geomac-perimeters-2019/
  - GeoMAC final perimeters 2000 - 2018:
    https://data-nifc.opendata.arcgis.com/datasets/historic-geomac-perimeters-combined-2000-2018/
  - Interagency fire perims 1800s - 2018
    https://data-nifc.opendata.arcgis.com/datasets/interagency-fire-perimeter-history-all-years
  - More recent (2020/19, as of 9/17/2020) perimeters, with updates;
    can get pretty current, and daily, perimeters here:
    https://data-nifc.opendata.arcgis.com/datasets/archived-wildfire-perimeters-2
    - [X] update scraper to hit API URL:
      https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/Historic_Geomac_Perimeters_2000/FeatureServer/0/query?where=1%3D1&outFields=gisacres,incidentname,state,perimeterdatetime,fireyear,latest,uniquefireidentifier&outSR=4326&f=json
      Can use same query params for each year, 2000 - 2019.
    - [X] do some filtering to clear our bad values and fires < X (100?) acres.
          can review datasets on web to get a sense of data distribution and where filters should be set.
- [X] invalid data
      how best to handle? prob want to remove perimeters with "geometry": null
      in data processing step, but this is non-trivial as data processing deals
      with files, without peeking into their contents.
      -> Solved by using NIFC data instead of GeoMAC
  - [X] 2012 has bad value(s) -- ??
  - [X] Brannan (2014) has `null` geometry
  - [X] Gasquet Complex (2015) has `null` geometry
  - [X] Cabin (2017) has `null` geometry
  - [X] OOB data:
    - [X] Halstead (2012)
    - [X] Hay Canyon (2015)
    - [X] China Cap (2014)
  - [X] scraper
    - [X] only report 'All data fetched' when actually done
    - [X] retry failed downloads
    - [X] refactor to focus on generating one merged file / year
    - [X] consider making one all-year/all-fires file at low-res (high simplification), to display on site init
  - [X] fix mapshaper 'Command expects a single value' error


## Bugs
- [ ] title + slider disappear while LoadingIcon visible
- [ ] 2020 data not scraping correctly
  - [ ] bar chart doesn't align with slider
- [ ] Can we remove `extractLatestPerimeters` and use preprocessed finalPerimeters instead?


## RFP / DONE
- [X] Finish data loading strategy for all years / years before current
- [X] Maybe go back and refactor scraper/merger accordingly
  - [X] compress all perimeters for each fire into a single FeatureCollection
        with each perimeter as a separate Feature
  - [X] consider compressing all perimeters for year into a single
        FeatureCollection in order to load only one file / year
  - [X] simplify geometry even more...
- [X] Do not display geojson features with datestamps > currentDate
      Use getFillColor/LineColor, or some other GeoJsonLayer, as a callback?
      e.g. getFillColor={feature => feature.datestamp > foo...}
  - [X] Display all fires up to currentDate, not just those for current year
- [X] RFP
  - [X] publish site to gh-pages / transmote
  - [X] refine prototype
    - [X] enable basic picking + tooltips
    - [X] add playback controls
          implement in a way that a segment can be cued + played to tell stories,
          e.g. encircling of Ojai by Thomas Fire - start time - stop time - playback speed - metadata (title, desc, etc)
    - [X] rotate map to oblique view with north to left, south to right
    - [X] load all perimeters, not just last, to show fires growing
  - [X] write
    - [X] inspiration / reason
    - [X] narrative
    - [X] current prototype
    - [X] aspirations
      - [X] features:
        - other datasets
        - zoom to fires (create GIFs for RFP)
          - [X] ojai/thomas
          - [X] paradise/??
          - [X] sonoma/?? - 2017. 2019
        - ...?
      - [X] technical:
        - improve loading
        - reduce bundle size (5.9MB???)
        - all open-source, including data scraper
        - deployment target: desktop-first, but could possibly be adapted to mobile
          - load less data / omit smaller fires
          - focus more on highlighting individual fires and less on open-ended map exploration
  - [X] send to cfp@parametric.press, Subject: [Pitch] The Fires Next Time: California Wildfires Map
