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
          const newStyleText = newStyle.toString();
          if (elem.el.adoptedStyleSheets) {
            if (newStyleText) {
              const newStylesheet = new CSSStyleSheet();
              newStylesheet.replaceSync(newStyleText);
              elem.el.adoptedStyleSheets = [newStylesheet, ...elem.el.adoptedStyleSheets.slice(1)];
            } else if (elem.getConfig('css')) {
              elem.el.adoptedStyleSheets = elem.el.adoptedStyleSheets.slice(1);
            }
          } else {
            elem.el.querySelector('style').textContent = newStyleText;
          }
          return true;
        }
      });
    });
    module.exports = require(${moduleId});
  `;
};
