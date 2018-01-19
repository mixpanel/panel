/* eslint-env commonjs */
const path = require(`path`);

// Retrieve elemName for hot injection from path convention
//
// elem name patterns look like this
//    ./src/.../${elemName}/index.<ext>
//    ./src/.../${elemName}/template.<ext>
//    ./src/.../${elemName}/style.<ext> or styles.<ext>
//    ./src/.../${elemName}/controller.<ext>
// OR ./src/.../${elemName}.<ext>
//
// this means multiple element definitions in a single file won't work

module.exports.getElemName = function(resourcePath) {
  const pathInfo = path.parse(resourcePath);
  let elemName = pathInfo.name;
  if (/^(index|template|styles?|controller)$/.test(pathInfo.name)) {
    const pathParts = resourcePath.split(`/`);
    elemName = pathParts[pathParts.length - 2];
  }

  return elemName;
};

module.exports.isDevServerHot = function(webpackOpts) {
  return webpackOpts.devServer && webpackOpts.devServer.hot;
};
