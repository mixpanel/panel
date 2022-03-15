/* eslint-env commonjs */
const loaderUtils = require(`loader-utils`);
const helpers = require(`./loader-helpers`);

// Used in non-HMR mode, do nothing
module.exports = (source) => source;

module.exports.pitch = function (request) {
  const options = helpers.getOptions(this);
  const moduleId = loaderUtils.stringifyRequest(this, `!!${request}`);
  const elemName = helpers.getElemName(this.resourcePath, options);

  if (!options.hot) {
    return `module.exports = require(${moduleId});`;
  }

  return `
    module.hot.accept(${moduleId}, function() {
      const newStyle = require(${moduleId});
      const updatePanelElems = require('panel/hot/update-panel-elems');
      updatePanelElems('${elemName}', elem => {
        if (elem.getConfig('useShadowDom')) {
          elem.applyStaticStyle(newStyle.toString(), {ignoreCache: true});
          return true;
        }
      });
    });
    module.exports = require(${moduleId});
  `;
};
