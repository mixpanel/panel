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

  // hot reloading of templates works by exporting a wrapped closure function that references templateFn
  // when we receive a new module update, we swap templateFn reference to new template function
  // this means components that use the template don't need to change their function reference
  // we just need to call their .update()
  return `
    const getTemplateFn = (mod) => mod.__esModule ? mod.template : mod;
    let templateFn = getTemplateFn(require(${moduleId}));
    module.hot.accept(${moduleId}, () => {
      templateFn = getTemplateFn(require(${moduleId}))
      const updatePanelElems = require('panel/hot/update-panel-elems');
      updatePanelElems('${elemName}', elem => true);
    });
    const wrappedTemplateFn = function() {return templateFn.apply(this, arguments)};
    if (templateModule.__esModule) {
      module.exports = {...templateModule, __esModule: true, template: wrappedTemplateFn};
    } else {
      module.exports = wrappedTemplateFn;
    }
  `;
};
