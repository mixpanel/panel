/* eslint-env commonjs */
const loaderUtils = require(`loader-utils`);
const helpers = require(`./loader-helpers`);

// Used in non-HMR mode, do nothing
module.exports = source => source;

module.exports.pitch = function(remainingReq) {
  if (!helpers.isDevServerHot(this.options)) {
    return;
  }

  const moduleId = loaderUtils.stringifyRequest(this, `!!${remainingReq}`);
  const elemName = helpers.getElemName(this.resourcePath);

  return `
    module.hot.accept(${moduleId}, function() {
      const updatePanelElems = require('panel-hot/update-panel-elems');
      const oldExport = module.exports;
      const newExport = module.exports = require(${moduleId});
      oldExport.default = newExport.default;
      updatePanelElems('${elemName}', function(elem) {
        Object.setPrototypeOf(elem.controller, newExport.default.prototype);
      })
    });
    module.exports = require(${moduleId});
    `.trim().replace(/^ {4}/gm, ``);
};
