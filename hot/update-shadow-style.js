/* eslint-env commonjs */
module.exports = function updateStyle(newStyle, elemName) {
  const elems = document.querySelectorAll(`body /deep/ ${elemName}`);
  let numUpdated = 0;
  for (const elem of elems) {
    if (elem._config && elem.update) {
      elem.el.querySelector(`style`).textContent = newStyle;
      numUpdated++;
    } else {
      console.warn(`[HMR Panel] ${elemName} is not a panel component`);
    }
  }
  if (numUpdated > 0) {
    console.info(`[HMR Panel] Updated ${elems.length} ${elemName} elems`);
  } else {
    console.error(`[HMR Panel] custom element: ${elemName} not found`);
    console.error(`[HMR Panel] Exepect '.../<elemName>/index.styl' or '.../<elemName>.styl'`);
  }
};
