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
  const loaderOpts = loaderUtils.getOptions(this) || {};
  let moduleSource = ``;
  let isShadowCss = loaderOpts.shadow || /\b(inline|shadow)\b/.test(this.resourceQuery);

  if (isShadowCss) {
    const elemName = helpers.getElemName(this.resourcePath);
    moduleSource = `
      module.hot.accept(${moduleId}, function() {
        const updatePanelElems = require('panel-hot/update-panel-elems');
        const newStyle = module.exports = require(${moduleId});
        updatePanelElems('${elemName}', function(elem) {
          elem.el.querySelector('style').textContent = newStyle;
        })
      });
      module.exports = require(${moduleId});
    `;
  } else {
    let styleId = this.resourcePath;
    moduleSource = `
      module.hot.accept(${moduleId}, function() {
        const updateStyle = require('panel-hot/update-style');
        const newStyle = module.exports = require(${moduleId});
        updateStyle(newStyle.toString(), ${JSON.stringify(styleId)});
      });
      module.exports = require(${moduleId});
    `;
  }

  return moduleSource.trim().replace(/^ {6}/gm, ``);
};
