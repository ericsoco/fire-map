/**
 * Geospatial Multi-Agency Coordination (GeoMAC -- https://www.geomac.gov/)
 * hosts US wildfire perimeter data back through 2010, but offers it only
 * as an HTML file index. This file scrapes the GeoMAC site given specified
 * filters, looking for .zip shapefiles.
 *
 * ## Usage
 * ### Fetch fires for a specific state + year:
 * `yarn fetch-fires <year> <state> [dest]``
 * E.g. `yarn fetch-files 2018 California static/data/fires`
 * ### Fetch all fires described by config:
 * `yarn fetch-fires <configPath> [dest]``
 * E.g. `yarn fetch-files static/config/fetch-fire-data-config static/data/fires`
 */
const axios = require('axios');
const cheerio = require('cheerio');
const chalk = require('chalk');
const fs = require('fs');
const https = require('https');
const mkdirp = require('mkdirp');

const HOST = 'https://rmgsc.cr.usgs.gov';
const ROOT_DIR = `${HOST}/outgoing/GeoMAC`;
const YEAR_DIR_SUFFIX = '_fire_data';
const DEFAULT_DEST = 'static/data/fires';
const getPath = ({ year, state }) =>
  `${ROOT_DIR}/${year}${YEAR_DIR_SUFFIX}/${state}`;

const BODY_404 = /File not found: Link broken/;
const BACK_LINK_TEXT = /To Parent Directory/;
const ZIP_FILE = /(\.zip)$/;

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
      dest: process.argv[4] || DEFAULT_DEST,
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
      console.log(chalk.bold(chalk.cyan(`✅  All data fetched.`)));
      process.exitCode = 0;
    }
  };

  next();
}

function fetchFiresForStateYear(params, cb) {
  const path = getPath(params);
  console.log(chalk.bold(`☁️  fetching from: ${path}`));
  console.log(chalk.bold(`⬇️  destination path: ${params.dest}`));

  axios(path)
    .then(response => parseStatePage({ ...params, path }, response, cb))
    .catch(logError);
}

function parseStatePage(params, response, cb) {
  const html = response.data;
  const $ = cheerio.load(html);

  if (BODY_404.test(html)) {
    cb(new Error(`🤷 404: Invalid path: ${params.path}`));
  }

  const links = $('a')
    // Do not follow back pagination link
    .filter((i, el) => !BACK_LINK_TEXT.test($(el).text()))
    // Convert to JS array for serial processing
    .toArray();

  const next = () => {
    if (links.length) {
      const fireNode = $(links.shift());
      const fire = fireNode.text();
      axios(getAbsoluteURL(fireNode.attr('href')))
        .then(response => parseFirePage({ ...params, fire }, response, next))
        .catch(logError);
    } else {
      console.log(
        chalk.bold(
          chalk.cyan(`✅  All data fetched for ${params.state}/${params.year}`)
        )
      );
      cb();
    }
  };

  next();
}

function parseFirePage(params, response, cb) {
  const { dest, year, state, fire } = params;
  const destPath = `${dest}/${year}/${state}/${fire}`;
  mkdirp(destPath, (err, made) => {
    if (err) {
      throw new Error(
        `❌ could not create folder: ${destPath}. Error:\n${err.message}`
      );
    }
    if (made) {
      console.log(`📂 creating new folder: ${destPath}`);
    }

    const html = response.data;
    const $ = cheerio.load(html);
    const zipLinks = $('a').filter((i, el) => ZIP_FILE.test($(el).text()));
    const count = { done: 0, total: zipLinks.length };

    if (count.total === 0) {
      cb();
    }

    zipLinks.each((i, el) => {
      const filename = $(el).text();
      const filepath = $(el).attr('href');
      download(getAbsoluteURL(filepath), `${destPath}/${filename}`, err => {
        if (err) {
          if (err === FILE_ALREADY_EXISTS) {
            console.log(
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

        // Call cb() when all zipfiles have been consumed
        count.done++;
        if (count.done >= count.total) {
          cb();
        }
      });
    });
  });
}

//
// utils
//

function logError(error) {
  console.error(chalk.red(error));
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
