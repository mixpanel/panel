/* global module */

module.exports = function updateTemplate(newTemplate, elemName) {
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
  if (elems.length > 0) {
    console.info(`[HMR Panel] Updated ${elems.length} ${elemName} elems`);
  } else {
    console.error(`[HMR Panel] custom element: ${elemName} not found`);
    console.error(`[HMR Panel] Exepect '.../<elemName>/index.jade' or '.../<elemName>.jade'`);
  }
};
