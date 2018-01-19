/* eslint-env commonjs */

// 'That's not enough, we need to go deeper'
// NOTE: document.querySelectorAll(`body /deep/ ${elemName}`) is deprecated, so we use recursion
function findPanelElemsByTagName(rootElem, elemName) {
  const results = [];

  for (const elem of rootElem.querySelectorAll(`*`)) {
    if (elem.panelID && elem.tagName.toLowerCase() === elemName) {
      results.push(elem);
    }
    if (elem.shadowRoot) {
      for (const shadowElem of findPanelElemsByTagName(elem.shadowRoot, elemName)) {
        results.push(shadowElem);
      }
    }
  }

  return results;
}

module.exports = function updatePanelElems(elemName, updateFn) {
  let numUpdated = 0;
  const elems = findPanelElemsByTagName(document.body, elemName);

  for (const elem of elems) {
    if (updateFn.call(null, elem)) {
      const update = elem._update || elem.update;
      numUpdated += update.apply(elem) ? 1 : 0;
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
