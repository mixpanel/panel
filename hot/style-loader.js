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
  let moduleSource = ``;
  let isShadowCss = options.shadow || /\b(inline|shadow)\b/.test(this.resourceQuery);

  if (isShadowCss) {
    const elemName = helpers.getElemName(this.resourcePath);
    moduleSource = `
      const updatePanelElems = require('panel-hot/update-panel-elems');
      module.exports = require(${moduleId});
      module.hot.accept(${moduleId}, function() {
        const newStyle = module.exports = require(${moduleId});
        updatePanelElems('${elemName}', function (elem) {
          elem.el.querySelector('style').textContent = newStyle;
        })
      });
    `;
  } else {
    let styleId = this.resourcePath;
    moduleSource = `
      const updateStyle = require('panel-hot/update-style');
      module.exports = require(${moduleId});
      module.hot.accept(${moduleId}, function () {
        const newStyle = module.exports = require(${moduleId});
        updateStyle(newStyle.toString(), ${JSON.stringify(styleId)});
      });
    `;
  }

  return moduleSource.trim().replace(/^ {6}/gm, ``);
};
