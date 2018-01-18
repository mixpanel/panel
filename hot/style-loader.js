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
  const resourcePath = this.resourcePath;
  const elemName = helpers.getElemName(resourcePath);

  return `
    module.hot.accept(${moduleId}, function() {
      const updateStyle = require('panel-hot/update-style');
      const updatePanelElems = require('panel-hot/update-panel-elems');
      const newStyle = module.exports = require(${moduleId});
      updatePanelElems('${elemName}', function(elem) {
        if (elem.getConfig('useShadowDom')) {
          elem.el.querySelector('style').textContent = newStyle.toString();
        } else {
          updateStyle(newStyle.toString(), ${JSON.stringify(resourcePath)});
        }
      })
    });
    module.exports = require(${moduleId});
  `.trim().replace(/^ {4}/gm, ``);
};
