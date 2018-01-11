/* eslint-env commonjs */
const path = require(`path`);

// Retreive elemName for hot injection from path convention
//
// elem name patterns look like this
//    ./src/.../${elemName}/index.jade
// OR ./src/.../${elemName}.jade
module.exports.getElemName = function(resourcePath) {
  let elemName = path.parse(resourcePath).name;
  if (elemName === `index`) {
    const pathParts = resourcePath.split(`/`);
    elemName = pathParts[pathParts.length - 2];
  }

  return elemName;
};
