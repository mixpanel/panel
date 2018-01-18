/* eslint-env commonjs */
const loaderUtils = require(`loader-utils`);
const helpers = require(`./loader-helpers`);

// Used in non-HMR mode, do nothing
module.exports = source => source;

module.exports.pitch = function(remainingReq) {
  if (!helpers.isDevServerHot(this.options)) {
    return;
  }

  const moduleId = loaderUtils.stringifyRequest(this, `!!` + remainingReq);
  const elemName = helpers.getElemName(this.resourcePath);

  return `
    let template = require(${moduleId});
    module.hot.accept(${moduleId}, () => {
      template = require(${moduleId});
      const updatePanelElems = require('panel/hot/update-panel-elems');
      updatePanelElems('${elemName}', elem => true);
    });
    module.exports = function() {return template.apply(this, arguments)};
    `.trim().replace(/^ {4}/gm, ``);
};
