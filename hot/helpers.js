const path = require(`path`);

// A no-op which passes source through. Used in non-HMR mode
module.exports.noopLoader = function(source) {
  return source;
};

// Retreive elemName for hot injection from path convention
//
// elem name patterns look like this
//    ./src/.../${elemName}/index.jade
// OR ./src/.../${elemName}.jade
module.exports.getElemName = function(resourcePath) {
  let elemName = path.parse(resourcePath).name;
  if (elemName === `index`) {
    const pathParts = this.resourcePath.split(`/`);
    elemName = pathParts[pathParts.length - 2];
  }

  return elemName;
};
