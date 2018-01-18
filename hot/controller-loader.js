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
    module.hot.accept(${moduleId}, () => {
      const newExports = module.exports = require(${moduleId});
      Object.assign(oldExports, newExports);
      const updatePanelElems = require('panel/hot/update-panel-elems');
      updatePanelElems('${elemName}', (elem) => {
        Object.setPrototypeOf(elem.controller, newExports.default.prototype);
        return true;
      });
    });
    const oldExports = module.exports = require(${moduleId});
    `.trim().replace(/^ {4}/gm, ``);
};
