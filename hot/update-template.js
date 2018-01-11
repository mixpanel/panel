/* eslint-env commonjs */
module.exports = function updateTemplate(newTemplate, elemName) {
  const elems = document.querySelectorAll(`body /deep/ ${elemName}`);
  let numUpdated = 0;
  for (const elem of elems) {
    if (elem._config && elem.update) {
      elem._config.template = newTemplate;
      const update = elem._update || elem.update;
      update.call(elem);
      numUpdated++;
    } else {
      console.warn(`[HMR Panel] ${elemName} is not a panel component`);
    }
  }
  if (numUpdated > 0) {
    console.info(`[HMR Panel] Updated ${elems.length} ${elemName} elems`);
  } else {
    console.error(`[HMR Panel] custom element: ${elemName} not found`);
    console.error(`[HMR Panel] Exepect '.../<elemName>/index.jade' or '.../<elemName>.jade'`);
  }
};
