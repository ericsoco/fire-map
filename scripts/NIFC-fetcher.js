/**
 * The National Interagency Fire Center's Wildland Fire Open Data project
 * (https://data-nifc.opendata.arcgis.com/) hosts an API
 * for fetching wildfire perimeter data.
 *
 * ## Usage
 * ### Fetch fires for a specific state + year:
 * `yarn fetch-fires <year> <state> [dest]`
 * E.g. `yarn fetch-fires 2018 CA static/data/fires`
 * ### Fetch all fires described by config:
 * `yarn fetch-fires <configPath> [dest]`
 * E.g. `yarn fetch-fires static/config/fetch-fire-data-config static/data/fires`
 */
const axios = require('axios');
const chalk = require('chalk');
const fs = require('fs');
const querystring = require('query-string');
const { argv } = require('yargs');
const arcgisUtils = require('@esri/arcgis-to-geojson-utils');
const simplify = require('@turf/simplify');
const { featureToH3Set } = require('geojson2h3');

const DEFAULT_DEST = 'static/data/fires';
const ARCGIS_FILENAME = 'arcgis.json';
const RAW_GEOJSON_FILENAME = 'rawPerimeters.geojson';
const ALL_PERIMETERS_FILENAME = 'allPerimeters.geojson';
const FINAL_PERIMETERS_FILENAME = 'finalPerimeters.geojson';
const ALL_PERIMETERS_LOW_RES_FILENAME = 'allPerimeters-low.geojson';
const FINAL_PERIMETERS_LOW_RES_FILENAME = 'finalPerimeters-low.geojson';
const H3_PERIMETERS_FILENAME = 'h3Perimeters.geojson';
const H3_LOW_RES_PERIMETERS_FILENAME = 'h3Perimeters-low.geojson';

const BASE_PATH =
  'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services';
const LAYER_NAME_PREFIX = 'Historic_Geomac_Perimeters_';
const QUERY_PREFIX = 'FeatureServer/0/query';
const SELECT_FIELDS = [
  'uniquefireidentifier',
  'fireyear',
  'incidentname',
  'perimeterdatetime',
  'gisacres',
  'state',
  'latest',
];
const ORDER_BY_FIELDS = ['incidentname', 'perimeterdatetime'];
function getURL({ year, state }) {
  const path = `${BASE_PATH}/${LAYER_NAME_PREFIX}${year}/${QUERY_PREFIX}`;
  const query = querystring.stringify({
    where: `state = '${state}'${maybeApplyFilter({ year, state })}`,
    outFields: SELECT_FIELDS.join(),
    orderByFields: ORDER_BY_FIELDS.join(),
    outSR: '4326',
    f: 'json',
  });
  return `${path}?${query}`;
}

const ADDITIONAL_FILTERS = [
  // `gisacres >= 100`,
  // `gisacres <= 99999999`,
  `latest = 'Y'`,
];
function maybeApplyFilter({ year, state }) {
  // CA/2015 times out without additional filters
  return year === '2015' && state === 'CA'
    ? ADDITIONAL_FILTERS.map(f => ` AND ${f}`).join('')
    : '';
}

main();

async function main() {
  const params = {
    config: getConfig(argv.config),
    year: argv.year,
    state: argv.state,
    dest: argv.dest || DEFAULT_DEST,
    // Perimeters smaller than this are filtered out of final output
    acres: argv.acres || 100,
    acresLowRes: argv.acresLowRes || 10000,
    simplify: argv.simplify || 0.001,
    simplifyLowRes: argv.simplifyLowRes || 0.01,
    reprocess: argv.reprocess || false,
  };

  if (params.config) {
    // Fetch all fires described by config
    await fetchFiresPerConfig(params);
  } else {
    // Fetch fires for a specific year
    await fetchFiresForStateYear(params);
  }
}

function getConfig(maybeConfig) {
  if (fs.existsSync(maybeConfig)) {
    try {
      const config = JSON.parse(fs.readFileSync(maybeConfig));
      return config;
    } catch (error) {
      return false;
    }
  }
  return false;
}

async function fetchFiresPerConfig(params) {
  const { config } = params;
  // Create flattened list of all state + year pairs,
  // in order to serially fetch them
  let stateYears = config.states.reduce(
    (acc, state) =>
      acc.concat(state.years.map(year => ({ state: state.code, year }))),
    []
  );

  async function next() {
    if (stateYears.length) {
      const stateYear = stateYears.shift();
      await fetchFiresForStateYear({ ...params, ...stateYear });
      next();
    } else {
      console.log(chalk.bold(chalk.cyan(`✅ All data fetched.`)));
    }
  }

  await next();
}

async function fetchFiresForStateYear(params) {
  const url = getURL(params);

  const { dest, year, state, reprocess } = params;
  const destPath = `${dest}/${year}/${state}`;
  console.log(chalk.bold(`⬇️  destination path: ${destPath}`));

  try {
    const createdPath = await fs.promises.mkdir(destPath, { recursive: true });
    if (createdPath) {
      console.info(`📂 created new folder: ${destPath}`);
    }
  } catch (err) {
    throw new Error(
      `❌ could not create folder: ${destPath}. Error:\n${err.message}`
    );
  }

  if (!reprocess) {
    try {
      await downloadArcGIS(url, destPath);
    } catch (err) {
      logError(
        new Error(
          `❌ Error downloading ${year}/${state} from ${url}:\n${err.message}`
        )
      );
    }
  }

  try {
    const arcgis = fs.readFileSync(`${destPath}/${ARCGIS_FILENAME}`);
    if (arcgis.exceededTransferLimit) {
      console.warn(
        `Response was too large for ${year}/${state} and service returned \`exceededTransferLimit\`. Implement paginated fetch instead. See: https://developers.arcgis.com/rest/services-reference/query-map-service-layer-.htm`
      );
    }

    const geojson = arcgisUtils.arcgisToGeoJSON(JSON.parse(arcgis));
    const parsedGeojson = JSON.stringify(geojson, null, 2);
    fs.writeFileSync(`${destPath}/${RAW_GEOJSON_FILENAME}`, parsedGeojson);

    // Clone geojson before mutating, to process a second time at low-res
    const geojsonLow = JSON.parse(JSON.stringify(geojson));
    processPerimeters(destPath, geojson, params, { lowRes: false });
    processPerimeters(destPath, geojsonLow, params, { lowRes: true });
  } catch (err) {
    logError(err);
  }
}

async function downloadArcGIS(url, destPath) {
  console.log(chalk.bold(`☁️  fetching from: ${url}`));
  const arcgisDestPath = `${destPath}/${ARCGIS_FILENAME}`;
  const writer = fs.createWriteStream(arcgisDestPath);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

//
// utils
//

function logError(error) {
  error.message = chalk.red(error.message);
  console.error(error);
}

/**
 * Filter out invalid / too-small perimeters, and use `mapshaper` on remaining
 * perimeters to simplify geometry ~~proportional to the num of coordinates~~.
 * NOTE: mutates geojson input (for performance).
 *
 * NOTE: calculating and executing simplification per-feature will require:
 * - breaking the FeatureCollection up into one file per feature
 * - calculating simplification percent per feature
 * - simplifying each feature
 * - merging back into single FeatureCollection
 * Therefore, just applying a fixed simplification for each collection for now.
 */
function processPerimeters(folder, mutableGeojson, params, { lowRes }) {
  const minAcres = lowRes ? params.acresLowRes : params.acres;
  mutableGeojson.features = mutableGeojson.features.filter(
    f =>
      Boolean(f.geometry) &&
      Boolean(f.properties.incidentname) &&
      f.properties.gisacres > minAcres
  );
  simplify(mutableGeojson, {
    tolerance: lowRes ? params.simplifyLowRes : params.simplify,
    highQuality: true,
    mutate: true,
  });

  // All perimeters in the year
  const allFilename = lowRes
    ? ALL_PERIMETERS_LOW_RES_FILENAME
    : ALL_PERIMETERS_FILENAME;
  const allGeojson = JSON.stringify(mutableGeojson, null, 2);
  fs.writeFileSync(`${folder}/${allFilename}`, allGeojson);

  console.info(
    `🗜 Filtered and simplified GeoJSON and wrote to ${folder}/${allFilename}`
  );

  // All perimeters, transcribed to H3 hexagons formatted for deck.gl use
  const h3Filename = lowRes
    ? H3_LOW_RES_PERIMETERS_FILENAME
    : H3_PERIMETERS_FILENAME;
  const h3Resolution = lowRes ? 6 : 8;
  let h3Features = JSON.parse(allGeojson);
  h3Features = {
    features: h3Features.features
      .map(f => ({
        geometry: featureToH3Set(f, h3Resolution),
        properties: f.properties,
      }))
      .filter(f => f.geometry.length > 0),
  };
  fs.writeFileSync(`${folder}/${h3Filename}`, JSON.stringify(h3Features));

  console.info(`⬡ Hexified GeoJSON and wrote to ${folder}/${h3Filename}`);

  mutableGeojson.features = mutableGeojson.features.filter(
    f => f.properties.latest === 'Y'
  );
  const finalFilename = lowRes
    ? FINAL_PERIMETERS_LOW_RES_FILENAME
    : FINAL_PERIMETERS_FILENAME;
  const finalGeojson = JSON.stringify(mutableGeojson, null, 2);
  fs.writeFileSync(`${folder}/${finalFilename}`, finalGeojson);

  console.info(`💾 Wrote final perimeters to ${folder}/${finalFilename}`);
}
