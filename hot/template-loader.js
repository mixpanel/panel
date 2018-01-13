/* eslint-env commonjs */
const loaderUtils = require(`loader-utils`);
const helpers = require(`./loader-helpers`);

// Used in non-HMR mode, do nothing
module.exports = source => source;

module.exports.pitch = function(remainingReq) {
  const options = loaderUtils.getOptions(this) || {};

  // Don't pitch if not in HMR mode
  if (!options.hmr) {
    return;
  }

  const moduleId = loaderUtils.stringifyRequest(this, `!!` + remainingReq);
  const elemName = helpers.getElemName(this.resourcePath);

  return `
    const updatePanelElems = require('panel-hot/update-panel-elems');
    module.exports = require(${moduleId});
    module.hot.accept(${moduleId}, function() {
      const newTemplate = module.exports = require(${moduleId});
      updatePanelElems('${elemName}', function (elem) {
        elem._config.template = newTemplate;
      })
    });
    `.trim().replace(/^ {4}/gm, ``);
};
