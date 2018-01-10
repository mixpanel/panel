const loaderUtils = require(`loader-utils`);
const helpers = require(`./helpers`);

// Used in non-HMR mode, do nothing
module.exports = helpers.noopLoader;

module.exports.pitch = function(remainingReq) {
  const options = loaderUtils.getOptions(this) || {};

  // Don't pitch if not in HMR mode
  if (!options.hmr) {
    return;
  }

  const moduleId = loaderUtils.stringifyRequest(this, `!!` + remainingReq);
  const elemName = helpers.getElemName(this.resourcePath);

  return `
    const updateTemplate = require('panel/hot/update-template');
    module.exports = require(${moduleId});
    module.hot.accept(${moduleId}, function() {
      const newTemplate = module.exports = require(${moduleId});
      updateTemplate(newTemplate, '${elemName}');
    });
    `.trim().replace(/^ {4}/gm, ``);
};
