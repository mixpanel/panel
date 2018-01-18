/* eslint-env commonjs */
function getAllElementsByTagName(elemName) {
  // TODO: /deep/ is deprecated, move to recursive strategy
  return document.querySelectorAll(`body /deep/ ${elemName}`);
}

module.exports = function updatePanelElems(elemName, updateFn) {
  const elems = getAllElementsByTagName(elemName);
  let numUpdated = 0;

  for (const elem of elems) {
    if (elem.panelID) {
      if (updateFn.call(null, elem)) {
        const update = elem._update || elem.update;
        numUpdated += update.apply(elem) ? 1 : 0;
      }
    } else {
      console.warn(`[HMR Panel] ${elemName} is not a panel component`);
    }
  }

  if (numUpdated > 0) {
    console.info(`[HMR Panel] Updated ${elems.length} ${elemName} elems`);
  } else if (!elems.length) {
    console.warn(`[HMR Panel] No ${elemName} elems found`);
    console.warn(`[HMR Panel] Exepect file path to be '.../<elemName>/index.js' or '.../<elemName>.js'`);
  }

  return numUpdated;
};
