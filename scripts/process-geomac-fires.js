/**
 * Calculate metadata used by application, including:
 * - area burned per month
 *
 * ## Usage
 * ### Process metadata for a specific state + year:
 * `yarn process-fires <year> <state> [src]`
 * E.g. `yarn process-fires 2018 California static/data/fires`
 * ### process all fires described by config:
 * `yarn process-fires <configPath> [src]`
 * E.g. `yarn process-fires static/config/fetch-fire-data-config static/data/fires`
 */
const chalk = require('chalk');
const fs = require('fs');

const DEFAULT_SRC = 'static/data/fires';

main();

function main() {
  const config = getConfig(process.argv[2]);

  if (config) {
    // Process all fires described by config
    const src = process.argv[3] || DEFAULT_SRC;
    processFiresPerConfig(config, src);
  } else {
    // Process fires for a specific state + year
    const params = {
      year: process.argv[2],
      state: process.argv[3],
      src: process.argv[4] || DEFAULT_SRC,
    };
    processFiresForStateYear(params, err => {
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

function processFiresPerConfig(config, src) {
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
      processFiresForStateYear({ ...stateYear, src }, next);
    } else {
      console.log(chalk.bold(chalk.cyan(`✅ All fires processed.`)));
      process.exitCode = 0;
    }
  };

  next();
}

function processFiresForStateYear(params, cb) {
  console.log(
    chalk.bold(`🏭 processing files for ${params.state}/${params.year}`)
  );
  const { src, year, state } = params;
  const path = `${src}/${year}/${state}`;
  const filepath = `${path}/allPerimeters.geojson`;
  let allPerimeters;
  try {
    allPerimeters = JSON.parse(fs.readFileSync(filepath), 'utf8');
  } catch (error) {
    logError(`❌ Error reading ${filepath}: ${error.message}`);
    return;
  }

  // generate array of months, each element containing a map of perimeter summaries
  // ({ name, lastDate, acres }) by perimeter name
  const acresPerPerimeterPerMonth = allPerimeters.features.reduce(
    (months, perimeter) => {
      const perimeterSummary = getPerimeterSummary(perimeter);
      if (!perimeterSummary) return months;

      const month = perimeterSummary.date.getMonth();
      const monthMap = months[month];
      const existingPerimeter = monthMap[perimeterSummary.name];

      if (
        !existingPerimeter ||
        existingPerimeter.date < perimeterSummary.date
      ) {
        months[month][perimeterSummary.name] = perimeterSummary;
      }

      return months;
    },
    new Array(12).fill().map(Object)
  );

  const acresPerMonth = acresPerPerimeterPerMonth.map(perimeters =>
    Object.keys(perimeters).reduce(
      (sumAcres, name) => sumAcres + perimeters[name].acres,
      0
    )
  );

  const metadata = {
    acresPerMonth,
  };

  // Use json5 extension to enable parcel resolution with transformer-raw;
  // mapping '.json' to transfomer-raw in .parcelrc doesn't work ¯\_(ツ)_/¯
  const outputFile = `${src}/${year}/${state}/metadata.json5`;
  fs.writeFileSync(outputFile, JSON.stringify(metadata, null, 2));

  console.log(chalk.bold(chalk.cyan(`✅ metadata written to ${outputFile}.`)));

  cb();
}

function getPerimeterSummary(perimeter) {
  const name = perimeter.properties.FIRE_NAME || perimeter.properties.fireName;
  const date = new Date(
    perimeter.properties.DATE_ || perimeter.properties.perDatTime
  );
  const acres = parseInt(
    perimeter.properties.ACRES ||
      perimeter.properties.GISACRES ||
      perimeter.properties.gisAcres
  );

  return name && isFinite(date) && isFinite(acres)
    ? {
        name,
        date,
        acres,
      }
    : null;
}

//
// utils
//

function logError(error) {
  error.message = chalk.red(error.message);
  console.error(error);
}
