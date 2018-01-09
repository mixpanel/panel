/* global module, require */
const loaderUtils = require(`loader-utils`);
const path = require(`path`);

// If pitch returns nothing, then loader fn below will get called
// for non-hmr mode, pass through source and do a no-op
module.exports = function(source) {
  return source;
};

function updateTemplate(newTemplate, elemName) {
  const elems = document.getElementsByTagName(`${elemName}`);
  for (const elem of elems) {
    if (elem._config && elem.update) {
      elem._config.template = newTemplate;
      const update = elem._update || elem.update;
      update.call(elem);
    } else {
      console.warn(`${elemName} is not a panel component`);
    }
  }
  console.info(`[Panel HMR] Updated ${elems.length} ${elemName} elems`);
}

module.exports.pitch = function(remainingReq) {
  const options = loaderUtils.getOptions(this) || {};

  // Don't pitch if not in HMR mode
  if (!options.hmr) {
    return;
  }

  const moduleId = loaderUtils.stringifyRequest(this, `!!` + remainingReq);

  // elem name patterns look like this
  //    ./src/.../${elemName}/index.jade
  // OR ./src/.../${elemName}.jade

  const filePath = this.request.split(`!`).pop();
  let elemName = path.parse(filePath).name;
  if (elemName === `index`) {
    const pathParts = filePath.split(path.sep);
    elemName = pathParts[pathParts.length -2];
  }

  // Add leading indent to stringified function for readability
  const updateTemplateStr = updateTemplate.toString().replace(/^/gm, `      `).trim();
  return `
    if (module.hot) {
      ${updateTemplateStr};
      module.hot.accept(${moduleId}, function() {
        const newTemplate = require(${moduleId});
        updateTemplate(newTemplate, '${elemName}');
      });
    }
    module.exports = require(${moduleId});
    `.trim().replace(/^ {4}/gm, ``);
};
