/* eslint-env commonjs */
module.exports = function updateCssHref(cssLinkHref) {
  const cssLink = document.querySelector(`link[href][rel=stylesheet][href*='${cssLinkHref}']`);
  if (cssLink) {
    // Add hash param to css url to trigger style refresh
    // We use #t=.. so if css hasn't changed then webpack-dev-server can reply with a 304 Not modified
    // Which does a no-op for style calculation and paint
    const cssUrl = cssLink.getAttribute(`href`).split(`#`)[0];
    cssLink.setAttribute(`href`, `${cssUrl}#t=${new Date().getTime()}`);
    console.info(`[HMR Panel] Refreshed ${cssUrl}`);
  } else {
    console.warn(`[HMR Panel] Could not find stylesheet matching '${cssLinkHref}' in document`);
  }
};
