/**
 * Merge together the final perimeter for each fire in a state+year,
 * and write the resulting GeoJSON file to the state + year folder
 * as `_merged_.geojson`.
 *
 * ## Usage
 * ### Merge perimeters for a specific state + year:
 * `yarn merge-fires <year> <state> [src]`
 * E.g. `yarn merge-fires 2018 California static/data/fires`
 * ### Merge all fires described by config:
 * `yarn merge-fires <configPath> [src]`
 * E.g. `yarn merge-fires static/config/fetch-fire-data-config static/data/fires`
 */
const chalk = require('chalk');
const fs = require('fs');
const geojsonMerge = require('@mapbox/geojson-merge');

const DEFAULT_SRC = 'static/data/fires';
const OUTPUT_FILENAME = '_merged_.geojson';
const GEOJSON_FILE = /(\.geojson)$/;

main();

function main() {
  const config = getConfig(process.argv[2]);

  if (config) {
    // Merge all fires described by config
    const src = process.argv[3] || DEFAULT_SRC;
    mergeFiresPerConfig(config, src);
  } else {
    // Merge fires for a specific state + year
    const params = {
      year: process.argv[2],
      state: process.argv[3],
      src: process.argv[4] || DEFAULT_SRC,
    };
    mergeFiresForStateYear(params, err => {
      if (err) {
        process.exitCode = 1;
        throw err;
      }
      process.exitCode = 0;
    });
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

function mergeFiresPerConfig(config, src) {
  // Create flattened list of all state + year pairs,
  // in order to serially fetch them
  let stateYears = config.states.reduce(
    (acc, state) =>
      acc.concat(state.years.map(year => ({ state: state.name, year }))),
    []
  );

  const next = () => {
    if (stateYears.length) {
      const stateYear = stateYears.shift();
      mergeFiresForStateYear({ ...stateYear, src }, next);
    } else {
      console.log(chalk.bold(chalk.cyan(`✅ All fires merged.`)));
      process.exitCode = 0;
    }
  };

  next();
}

function mergeFiresForStateYear(params, cb) {
  console.log(
    chalk.bold(`📦 merging files for ${params.state}/${params.year}`)
  );
  const { src, year, state } = params;
  const path = `${src}/${year}/${state}`;
  const fireFolders = fs
    .readdirSync(path)
    .filter(file => fs.statSync(`${path}/${file}`).isDirectory());

  // Get the last perimeter for each fire and map to the fire name
  const finalPerimeters = fireFolders.reduce((perims, folder) => {
    const geoJSONFiles = fs
      .readdirSync(`${path}/${folder}`)
      .filter(file => GEOJSON_FILE.test(file));
    return geoJSONFiles.length > 0
      ? {
          ...perims,
          [folder]: `${path}/${folder}/${geoJSONFiles.slice(-1)[0]}`,
        }
      : perims;
  }, {});

  mergePerimeters(finalPerimeters, path, err => {
    if (err) {
      logError(err);
    } else {
      console.log(
        chalk.bold(
          chalk.cyan(`✅ All fires merged for ${params.state}/${params.year}`)
        )
      );
    }
    cb();
  });
}

// Merge fire perimeters into a single `_merged_.geojson` at specified path
function mergePerimeters(perimeters, path, cb) {
  try {
    const mergedStream = geojsonMerge.mergeFeatureCollectionStream(
      Object.values(perimeters)
    );
    const file = fs.createWriteStream(`${path}/${OUTPUT_FILENAME}`);
    file.on('finish', () => file.close(cb));
    mergedStream.pipe(file);
  } catch (err) {
    err.message = `❌ Error merging perimeters: ${err.message}`;
    cb(err);
  }
}

//
// utils
//

function logError(error) {
  error.message = chalk.red(error.message);
  console.error(error);
}
