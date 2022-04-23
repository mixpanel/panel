/* eslint-env node */
const {playwrightLauncher} = require(`@web/test-runner-playwright`);
const {createSauceLabsLauncher} = require(`@web/test-runner-saucelabs`);
const {chromeLauncher} = require(`@web/test-runner-chrome`);
const SAUCE_LAB = parseInt(process.env.SAUCE_LAB, 10) === 1;

let browsers = [chromeLauncher(), playwrightLauncher({product: `firefox`})];

if (SAUCE_LAB) {
  const sauceLabsCapabilities = {
    name: `Saucelab tests`,
    // if you are running tests in a CI, the build id might be available as an
    // environment variable. this is useful for identifying test runs
    // this is for example the name for github actions
    build: `panel ${process.env.GITHUB_REF || `local`} build ${process.env.GITHUB_RUN_NUMBER || ``}`,
  };
  // configure the local Sauce Labs proxy, use the returned function to define the
  // browsers to test
  const sauceLabsLauncher = createSauceLabsLauncher(
    {
      // your username and key for Sauce Labs, you can get this from your Sauce Labs account
      // it's recommended to store these as environment variables
      user: process.env.SAUCE_USERNAME,
      key: process.env.SAUCE_ACCESS_KEY,
      // the Sauce Labs datacenter to run your tests on, defaults to 'us-west-1'
      // region: 'eu-central-1',
    },
    sauceLabsCapabilities,
  );
  browsers = [
    sauceLabsLauncher({
      browserName: `chrome`,
      browserVersion: `latest`,
      platformName: `macOS 10.15`,
    }),
    // using legacy protocol
    sauceLabsLauncher({
      browserName: `chrome`,
      version: `72`,
      platform: `macOS 10.13`,
    }),
    sauceLabsLauncher({
      browserName: `firefox`,
      browserVersion: `latest`,
      platformName: `macOS 10.15`,
    }),
    sauceLabsLauncher({
      browserName: `firefox`,
      browserVersion: `72`,
      platformName: `macOS 10.13`,
    }),
    sauceLabsLauncher({
      browserName: `MicrosoftEdge`,
      browserVersion: `latest`,
      platformName: `Windows 10`,
    }),
    sauceLabsLauncher({
      browserName: `MicrosoftEdge`,
      browserVersion: `79`,
      platformName: `Windows 10`,
    }),
    sauceLabsLauncher({
      browserName: `safari`,
      browserVersion: `latest`,
      platformName: `macOS 10.15`,
    }),
    sauceLabsLauncher({
      browserName: `safari`,
      browserVersion: `12`,
      platformName: `macOS 10.13`,
    }),
  ];
}

module.exports = {
  nodeResolve: true,
  staticLogging: true,
  testFramework: {
    config: {
      ui: `bdd`,
      timeout: `2000`,
    },
  },
  files: `test/browser/build/bundle.js`,
  browsers,
};
