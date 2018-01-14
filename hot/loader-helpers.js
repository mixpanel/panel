/* eslint-env commonjs */
const path = require(`path`);

// Retreive elemName for hot injection from path convention
//
// elem name patterns look like this
//    ./src/.../${elemName}/index.jade
// OR ./src/.../${elemName}.jade
module.exports.getElemName = function(resourcePath) {
  const pathInfo = path.parse(resourcePath);
  let elemName = pathInfo.name;
  if (elemName === `index` || (pathInfo.base === `controller.js`)) {
    const pathParts = resourcePath.split(`/`);
    elemName = pathParts[pathParts.length - 2];
  }

  return elemName;
};

module.exports.isDevServerHot = function(webpackOpts) {
  return webpackOpts.devServer && webpackOpts.devServer.hot;
};
