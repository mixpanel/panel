/* eslint-env node */

const path = require(`path`);

process.env.CHROME_BIN = require(`puppeteer`).executablePath();
process.env.FIREFOX_BIN = require(`playwright`).firefox.executablePath();
const SAUCE = parseInt(process.env.SAUCE, 10) >= 1;

// Check out https://saucelabs.com/platforms for all browser/platform combos
const sauceLaunchers = {
  sl_chrome_latest: {
    base: `SauceLabs`,
    browserName: `chrome`,
    browserVersion: `latest`,
    platformName: `macOS 12`,
    'sauce:options': {
      extendedDebugging: true,
    },
  },
  sl_chrome_old: {
    base: `SauceLabs`,
    browserName: `chrome`,
    browserVersion: `90`,
    platformName: `macOS 10.13`,
    'sauce:options': {
      extendedDebugging: true,
    },
  },
  sl_firefox_latest: {
    base: `SauceLabs`,
    browserName: `firefox`,
    browserVersion: `latest`,
    platformName: `macOS 12`,
    'sauce:options': {
      extendedDebugging: true,
    },
  },
  sl_firefox_old: {
    base: `SauceLabs`,
    browserName: `firefox`,
    browserVersion: `91`,
    platformName: `macOS 10.13`,
    'sauce:options': {
      extendedDebugging: true,
    },
  },
  sl_safari_latest: {
    base: `SauceLabs`,
    browserName: `safari`,
    browserVersion: `latest`,
    platformName: `macOS 12`,
  },
  sl_safari_old: {
    base: `SauceLabs`,
    browserName: `safari`,
    browserVersion: `13`,
    platformName: `macOS 10.13`,
  },
  sl_edge_latest: {
    base: `SauceLabs`,
    browserName: `MicrosoftEdge`,
    browserVersion: `latest`,
    platformName: `Windows 10`,
  },
  sl_edge_old: {
    base: `SauceLabs`,
    browserName: `MicrosoftEdge`,
    browserVersion: `90`,
    platformName: `Windows 10`,
  },
};

const sauceBrowsers = Object.keys(sauceLaunchers);

// shared config for all unit tests
module.exports = function (config) {
  config.set({
    frameworks: [`mocha`],
    preprocessors: {
      '**/*.js': [`sourcemap`],
    },
    basePath: path.resolve(__dirname, `test/browser/build`),
    retryLimit: 2,
    files: [`bundle.js`],
    client: {
      clientDisplayNone: true,
      mocha: {
        timeout: 30000, // 300s
      },
    },
    sauceLabs: {
      public: `team`,
      build: `panel ${process.env.GITHUB_REF || `local`} build ${process.env.GITHUB_RUN_NUMBER || ``}`,
      testName: `Panel tests`,
    },
    plugins: [
      require(`karma-mocha`),
      require(`karma-spec-reporter`),
      require(`karma-chrome-launcher`),
      require(`karma-firefox-launcher`),
      require(`karma-sauce-launcher`),
      require(`karma-sourcemap-loader`),
    ],
    browsers: SAUCE ? sauceBrowsers : [`ChromeHeadless`, `Firefox`],
    reporters: SAUCE ? [`spec`, `saucelabs`] : [`spec`],
    singleRun: true,
    customLaunchers: {
      ...sauceLaunchers,
      ChromeHeadless: {
        base: `Chrome`,
        flags: [
          `--headless`,
          `--disable-gpu`,
          `--disable-dev-shm-usage`,
          `--remote-debugging-port=9222`,
          `--window-size=1280,800`,
          `--no-sandbox`,
        ],
      },
      FirefoxHeadless: {
        base: `Firefox`,
        flags: [`-headless`],
      },
    },
  });
};
