/**
 * Geospatial Multi-Agency Coordination (GeoMAC -- https://www.geomac.gov/)
 * hosts US wildfire perimeter data back through 2010, but offers it only
 * as an HTML file index. This file scrapes the GeoMAC site given specified
 * filters, looking for .shp + .dbf + .prj shapefile bundles.
 *
 * ## Usage
 * ### Fetch fires for a specific state + year:
 * `yarn fetch-fires <year> <state> [dest]`
 * E.g. `yarn fetch-fires 2018 California static/data/fires`
 * ### Fetch all fires described by config:
 * `yarn fetch-fires <configPath> [dest]`
 * E.g. `yarn fetch-fires static/config/fetch-fire-data-config static/data/fires`
 */
const axios = require('axios');
const cheerio = require('cheerio');
const chalk = require('chalk');
const fs = require('fs');
const https = require('https');
const mapshaper = require('mapshaper');
const mkdirp = require('mkdirp');
const scale = require('d3-scale');

const HOST = 'https://rmgsc.cr.usgs.gov';
const ROOT_DIR = `${HOST}/outgoing/GeoMAC`;
const YEAR_DIR_SUFFIX = '_fire_data';
const DEFAULT_DEST = 'static/data/fires';
const getPath = ({ year, state }) =>
  `${ROOT_DIR}/${year}${YEAR_DIR_SUFFIX}/${state}`;

const BODY_404 = /File not found: Link broken/;
const BACK_LINK_TEXT = /To Parent Directory/;
const ACTIVE_PERIM_NAME = /(ActivePerim)/;
const SHP_FILE = /(\.shp)$/;
const SHAPEFILE_EXTS = ['shp', 'dbf', 'prj'];
const FILE_ALREADY_EXISTS = 'already exists';

main();

function main() {
  const config = getConfig(process.argv[2]);

  if (config) {
    // Fetch all fires described by config
    const dest = process.argv[3] || DEFAULT_DEST;
    fetchFiresPerConfig(config, dest);
  } else {
    // Fetch fires for a specific state + year
    const params = {
      year: process.argv[2],
      state: process.argv[3],
      fire: process.argv[4],
      dest: process.argv[5] || DEFAULT_DEST,
    };
    fetchFiresForStateYear(params, err => {
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

function fetchFiresPerConfig(config, dest) {
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
      fetchFiresForStateYear({ ...stateYear, dest }, next);
    } else {
      console.log(chalk.bold(chalk.cyan(`✅ All data fetched.`)));
      process.exitCode = 0;
    }
  };

  next();
}

function fetchFiresForStateYear(params, cb) {
  const path = getPath(params);
  console.log(chalk.bold(`☁️ fetching from: ${path}`));
  console.log(chalk.bold(`⬇️ destination path: ${params.dest}`));

  axios(path)
    .then(response => scrapeStatePage({ ...params, path }, response, cb))
    .catch(logError);
}

function scrapeStatePage(params, response, onPageComplete) {
  const html = response.data;
  const $ = cheerio.load(html);

  if (BODY_404.test(html)) {
    onPageComplete(new Error(`🤷 404: Invalid path: ${params.path}`));
  }

  const links = $('a')
    .filter(
      params.fire
        ? // If `fire` param passed, fetch only that fire
          (i, el) => $(el).text() === params.fire
        : // Else, fetch all valid fires on this page
          (i, el) =>
            // Do not follow back pagination link
            !BACK_LINK_TEXT.test($(el).text()) &&
            // Scrape only individual fire archives, not active perimeters
            !ACTIVE_PERIM_NAME.test($(el).text())
    )
    // Convert to JS array for serial processing
    .toArray();

  if (params.fire && links.length === 0) {
    onPageComplete(new Error(`🤷 Invalid fire name: ${params.fire}`));
  }

  const next = () => {
    if (links.length) {
      const fireNode = $(links.shift());
      const fire = fireNode.text();
      axios(getAbsoluteURL(fireNode.attr('href')))
        .then(response => scrapeFirePage({ ...params, fire }, response, next))
        .catch(logError);
    } else {
      console.log(
        chalk.bold(
          chalk.cyan(`✅ All data fetched for ${params.state}/${params.year}`)
        )
      );
      onPageComplete();
    }
  };

  next();
}

const NULL_GEOMETRY_FILES = [
  'ca_brannan_20140605_1000_dd83',
  'ca_gasquet_complex_divide_20150804_0956_dd83',
  'ca_gasquet_complex_divide_20150804_2137_dd83',
  'ca_cabin_20170811_0000_dd83',
];

// TODO: what is going on with this one file?
const ERROR_FILES = ['ca_route_complex_20150813_2230_dd83'];

function scrapeFirePage(params, response, onPageComplete) {
  const { dest, year, state, fire } = params;
  const destPath = `${dest}/${year}/${state}/${fire}`;
  mkdirp(destPath, (err, made) => {
    if (err) {
      throw new Error(
        `❌ could not create folder: ${destPath}. Error:\n${err.message}`
      );
    }
    if (made) {
      console.info(`📂 creating new folder: ${destPath}`);
    }

    const html = response.data;
    const $ = cheerio.load(html);
    const allLinkNames = $('a')
      .map((i, el) => $(el).text())
      .toArray();
    const allLinkNamesSet = new Set(allLinkNames);
    const shpLinkNames = allLinkNames
      .filter(name => SHP_FILE.test(name))
      .map(name => name.slice(0, -4));

    // Find only the perimeters for which all necessary files are available
    const validPerimeterNames = shpLinkNames.filter(name =>
      SHAPEFILE_EXTS.every(ext => allLinkNamesSet.has(`${name}.${ext}`))
    );

    const perimeterCount = { done: 0, total: validPerimeterNames.length };
    if (perimeterCount.total === 0) {
      onPageComplete();
    }

    validPerimeterNames.forEach(name => {
      const fileCount = { done: 0, total: SHAPEFILE_EXTS.length };
      SHAPEFILE_EXTS.forEach(ext => {
        const filename = `${name}.${ext}`;
        const remoteFilepath = getAbsoluteURL(
          `${response.request.path}/${filename}`
        );
        download(remoteFilepath, `${destPath}/${filename}`, err => {
          if (err) {
            if (err === FILE_ALREADY_EXISTS) {
              console.info(
                chalk.dim(chalk.green(`↳ File already exists: ${filename}`))
              );
            } else {
              logError(
                new Error(`❌ Error downloading ${filename}:\n${err.message}`)
              );
            }
          } else {
            console.log(chalk.green(`↳ Downloaded: ${filename}`));
          }

          // Once all shapefiles have been downloaded, process them
          fileCount.done++;
          if (fileCount.done >= fileCount.total) {
            try {
              const hasNullGeometry = NULL_GEOMETRY_FILES.includes(name);
              const willThrow = ERROR_FILES.includes(name);
              if (!hasNullGeometry && !willThrow) {
                processPerimeter(destPath, name);
              } else {
                const warning = hasNullGeometry
                  ? `Skipping file with null geometry: ${name}`
                  : `Skipping file that throws uncaught error from processPerimeter: ${name}`;
                console.warn(warning);
              }
            } catch (processError) {
              logError(processError);
            }

            // Call onPageComplete() when all perimeters have been downloaded + processed
            perimeterCount.done++;
            if (perimeterCount.done >= perimeterCount.total) {
              onPageComplete();
            }
          }
        });
      });
    });
  });
}

//
// utils
//

function logError(error) {
  error.message = chalk.red(error.message);
  console.error(error);
}

// GeoMAC links are all relative to the host URL, e.g.
// /outgoing/GeoMAC/2018_fire_data/California/Camp/ca_camp_20181108_1754_dd83.zip
function getAbsoluteURL(href) {
  return `${HOST}${href}`;
}

// Adapted from https://stackoverflow.com/a/22907134/222356
function download(url, dest, cb) {
  if (fs.existsSync(dest)) {
    cb(FILE_ALREADY_EXISTS);
    return;
  }

  const file = fs.createWriteStream(dest);
  https
    .get(url, response => {
      response.pipe(file);
      // close() is async; call cb after close completes
      file.on('finish', () => file.close(cb));
    })
    .on('error', err => {
      // Delete the unsuccessfully created file
      fs.unlink(dest, err => cb(err));
      cb(err);
    });
}

/**
 * Use `mapshaper` to generate a geojson file from a .shp, .dbf, and .prj file,
 * simplifying geometry proportional to the .shp filesize.
 */
function processPerimeter(folder, perimeterName) {
  const filePrefix = `${folder}/${perimeterName}`;

  SHAPEFILE_EXTS.forEach(ext => {
    if (!fs.existsSync(`${filePrefix}.${ext}`)) {
      throw new Error(
        `❓ Missing .${ext} file for perimeter: ${perimeterName}`
      );
    }
  });

  const shapefile = `${filePrefix}.shp`;
  const simplifyPercent = calculateSimplifyPercent(shapefile);

  try {
    mapshaper.runCommands(
      `-i "${shapefile}" -simplify ${simplifyPercent}% -o "${filePrefix}.geojson" format=geojson`,
      err => {
        if (err) {
          debugger;
          throw err;
        }
        console.info(
          `🗜 Mapshaped ${filePrefix} to GeoJSON and simplified to ${simplifyPercent}%`
        );
      }
    );
  } catch (err) {
    err.message = `❌ Error processing perimeter: ${perimeterName}: ${err.message}`;
    throw err;
  }
}

function calculateSimplifyPercent(shapefile) {
  const simplifyScale = scale
    .scalePow()
    .domain([5, 350])
    .range([20, 2])
    .exponent(0.15)
    .clamp(true);
  const sizeKB = fs.statSync(shapefile).size / 1024;
  const percent = simplifyScale(sizeKB);
  return Math.round(percent * 100) / 100;
}
