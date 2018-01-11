/* eslint-env commonjs */
module.exports = function updateStyle(newCss, styleId) {
  let elem = document.getElementById(styleId);
  if (elem) {
    elem.textContent = newCss;
    console.info(`[HMR Panel] Updated ${styleId}`);
  } else {
    elem = document.createElement(`style`);
    elem.setAttribute(`type`, `text/css`);
    elem.id = styleId;
    elem.textContent = newCss;
    document.head.appendChild(elem);
  }
};
