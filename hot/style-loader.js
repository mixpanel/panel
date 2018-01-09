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
  let styleId = JSON.stringify(this.resourcePath);
  let updateModule = `panel/hot/update-style`;

  let isShadowCss = options.shadow || /\b(inline|shadow)\b/.test(this.resourceQuery);
  if (isShadowCss) {
    styleId = helpers.getElemName(this.resourcePath);
    updateModule = `panel/hot/update-shadow-style`;
  }

  return `
    const updateStyle = require('${updateModule}}');
    module.exports = require(${moduleId});
    module.hot.accept(${moduleId}, function() {
      const newStyle = module.exports = require(${moduleId});
      updateStyle(newStyle.toString(), ${styleId});
    });
    `.trim().replace(/^ {4}/gm, ``);
};
