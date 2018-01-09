/* global module, require */
const loaderUtils = require(`loader-utils`);
const path = require(`path`);

// loader is a no-op which passes source through. Used in non-HMR mode
module.exports = function(source) {
  return source;
};

module.exports.pitch = function(remainingReq) {
  const options = loaderUtils.getOptions(this) || {};

  // Don't pitch if not in HMR mode
  if (!options.hmr) {
    return;
  }

  const moduleId = loaderUtils.stringifyRequest(this, `!!` + remainingReq);

  // elem name patterns look like this
  //    ./src/.../${elemName}/index.jade
  // OR ./src/.../${elemName}.jade

  let elemName = path.parse(this.resourcePath).name;
  if (elemName === `index`) {
    const pathParts = this.resourcePath.split(`/`);
    elemName = pathParts[pathParts.length - 2];
  }

  return `
    const updateTemplate = require('panel/hot/update-template');
    module.hot.accept(${moduleId}, function() {
      const newTemplate = module.exports = require(${moduleId});
      updateTemplate(newTemplate, '${elemName}');
    });
    module.exports = require(${moduleId});
    `.trim().replace(/^ {4}/gm, ``);
};
