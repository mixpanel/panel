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

  const moduleId = loaderUtils.stringifyRequest(this, `!!` + remainingReq);
  const styleId = JSON.stringify(this.resourcePath);

  return `
    const updateStyle = require('panel/hot/update-style');
    const style = require(${moduleId});
    module.hot.accept(${moduleId}, function() {
      const newStyle = require(${moduleId});
      updateStyle(newStyle.toString(), ${styleId});
    });
    module.exports = style;
    `.trim().replace(/^ {4}/gm, ``);
};
