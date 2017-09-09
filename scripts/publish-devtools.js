/**
 * Usage: node scripts/publish-devtools.js
 */
/* global require, __dirname */
/*eslint no-console: off */
const promisify = require(`promisify-node`);
const fs = require(`fs`);
const fsPath = require(`path`);
const readlineSync = require(`readline-sync`);
const zipFolder = promisify(require(`zip-folder`));
const WebstoreApi = require(`chrome-store-api`).Webstore;
const TokenManager = require(`chrome-store-api`).TokenManager;

const googleOauthUrl = `https://accounts.google.com/o/oauth2`;
const redirectUri = `urn:ietf:wg:oauth:2.0:oob`; // cli app
const webstoreClientId = `839233470602-9vanoggafqre5cpcav7su73dn339ejcb.apps.googleusercontent.com`;
const webstoreClientSecret = `DQA9I0jEDJsh7ndGGjqyd70-`;
const webstoreExtensionId = `mooaaejpdfdebnddpokcdimcobepahlg`;
const devtoolsDir = fsPath.resolve(`${__dirname}/../devtools`);
const devtoolsZipPath = `${devtoolsDir}.zip`;
const manifestPath = `${devtoolsDir}/manifest.json`;

// Main wrapped in async since top-level await is not supported
(async function() {
  try{
    // Write new version to manifest
    const manifest = JSON.parse(fs.readFileSync(manifestPath, `utf-8`));
    console.log(`Current manifest:\n`, manifest);

    const newVersion = readlineSync.question(`Enter new version: `);
    manifest.version = newVersion;
    console.log(`New manifest:\n`, manifest);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, `  `), `utf-8`);

    // Zip file
    await zipFolder(devtoolsDir, devtoolsZipPath);
    console.log(`\nBundling to a zip file`);
    const zipContents = fs.readFileSync(devtoolsZipPath);
    fs.unlinkSync(devtoolsZipPath); // Delete generated zip

    // Authenticate with webstore
    console.log(`NOTE: Only users of mixpanel-chrome-extensions@googlegroups.com can publish this item.`);
    console.log(`Paste following url in browser, authenticate and paste generate code\n`);
    console.log(`${googleOauthUrl}/auth?response_type=code&scope=https://www.googleapis.com/auth/chromewebstore&client_id=${webstoreClientId}&redirect_uri=${redirectUri}`);
    const oauthCode = readlineSync.question(`\ncode: `);
    const api = new WebstoreApi(new TokenManager(oauthCode, webstoreClientId, webstoreClientSecret));

    // Upload new item and publish
    console.log(`\nUploading and publishing ...`);
    await api.update(webstoreExtensionId, zipContents);
    await api.publish(webstoreExtensionId);
    console.log(`Published. Item should be available in a few minutes`);
    console.log(`Check status at https://chrome.google.com/webstore/developer/dashboard`);

  } catch (err) {
    console.error(err);
  }
})();

