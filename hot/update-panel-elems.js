/* eslint-env commonjs */
module.exports = function updatePanelElems(elemName, updateFn) {
  const elems = document.querySelectorAll(`body /deep/ ${elemName}`);
  let numUpdated = 0;
  for (const elem of elems) {
    if (elem.panelID) {
      if (updateFn) {
        updateFn.call(null, elem);
      }
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
    console.warn(`[HMR Panel] No ${elemName} elems updated`);
    console.warn(`[HMR Panel] Exepect file path to be '.../<elemName>/index.js' or '.../<elemName>.js'`);
  }
};
