# The Fires Last Time: A Historical California Wildfire Map

## Installing

```
nvm use
yarn
```


## Preparing data

To fetch + process all data in one step, run:
```
yarn prepare-data
```
Depending on your internet connection this may take upwards of 20-30 minutes.

Data source: [Wildland Fire Open Data](https://data-nifc.opendata.arcgis.com/), a project of the [National Interagency Fire Center (NIFC)](https://www.nifc.gov/).

### Manual data prep

**1.** Fetch fire perimeter data for all years + states in `static/data/fire-data-config.json`:

```
yarn fetch-all-fires
```

**1a.** Fetch fires for a specific state + year if necessary for backfilling / debugging:

```
yarn fetch-fires --year=2018 --state=CA
```

**2.** Process metadata for fire perimeters:

```
yarn process-all-fires
```

**2a.** Process fires for a specific state + year if necessary for backfilling / debugging:

```
yarn process-fires --year=2018 --state=CA
```

### Deprecated: GeoMAC data prep

A previous iteration of this project scraped data from [Geospatial Multi-Agency Coordination (GeoMAC)](https://www.geomac.gov/). As of May 1, 2020, cleaned, normalized GeoMAC data are now hosted by NIFC. GeoMAC data prep is as follows:

1. Fetch + process the fire perimeter data:

```
yarn geomac-fetch-all-fires
```

(Note, GeoMAC's server sometimes issues 404s when trying to download, and the scraper is not as robust as it could be. You may need to run more than once to pick up all fire perimeters.)

2. Merge fires per state + year:

```
yarn geomac-merge-all-fires
```

3. Process metadata for fire perimeters:

```
yarn geomac-process-all-fires
```

Alternative: run `yarn geomac-prepare-data` to try to run all the above steps automatically. Depending on your internet connection this may take upwards of 20-30 minutes.


## Running

First, follow the steps above to fetch + process fire perimeter data.
Then, run the application:

```
yarn start
```

## Adding data years

The codebase uses Parcel's [tilde path resolution](https://v2.parceljs.org/features/module-resolution/#tilde-paths) to pacakge external data files alongside the bundled application and make them available for runtime XHR loading (via `axios`). These assets exist within `static/data`, and are `import`ed explicitly in hooks:

- `use-all-fires-for-year-request`
- `use-complete-fires-for-year-request`
- `use-fire-metadata`

To add a new year of data:

- Add the year to `static/config/fire-data-config.json`
- `import` the datasets corresponding to the new year in each of the above hooks, and add that import to the `<*>_FOR_YEAR` map below the `import`s.
