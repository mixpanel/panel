/* global module, require */
const loaderUtils = require(`loader-utils`);

// loader is a no-op which passes source through. Used in non-HMR mode
module.exports = function(source) {
  return source;
};

module.exports.pitch = function(remainingReq) {
  const options = loaderUtils.getOptions(this) || {};

  // Don't pitch if not in HMR mode
  if (!options.hmr) {
    return;
  }

  // const isShadow = !!options.shadow;

  const moduleId = loaderUtils.stringifyRequest(this, `!!` + remainingReq);
  const styleId = JSON.stringify(this.resourcePath);

  return `
    const updateStyle = require('panel/hot/update-style');
    module.exports = require(${moduleId});
    module.hot.accept(${moduleId}, function() {
      const newStyle = module.exports = require(${moduleId});
      updateStyle(newStyle.toString(), ${styleId});
    });
    `.trim().replace(/^ {4}/gm, ``);
};
