/* global module, __resourceQuery, __webpack_require__ */

// ExtractTextPlugin doesn't go through HMR system as css text is extracted into separate file
// The trick is to refresh the css when there is a webpackHotUpdate
// See: https://github.com/webpack-contrib/extract-text-webpack-plugin/issues/30#issuecomment-219852782
export default function enableCssReload(cssPaths) {
  // Get the hotEmitter used by HMR
  const hotEmitter = __webpack_require__(`./node_modules/webpack/hot/emitter.js`);
  hotEmitter.on(`webpackHotUpdate`, newHash => {
    const links = document.getElementsByTagName(`link`);
    for (const link of links) {
      for (const cssPath of cssPaths) {
        const linkHref = link.href;
        if (linkHref.match(cssPath)) {
          const cssMatch = linkHref.match(/(^.*\.css)(#h=\w+)?$/);
          if (cssMatch) {
            // Append new hash as hash param to css url to trigger style refresh
            // We use #h=.. so if style hasn't changed then server replies with 304 No modified
            // Which is much faster than a full stylesheet cycle
            // i.e parse -> calculate -> layout-> repaint
            console.info(`[HMR Panel] Refreshing ${cssPath}`);
            link.href = `${cssMatch[1]}#h=${newHash}`;
          }
        }
      }
    }
  });
}

if (module.hot) {
  // Use resourceQuery to get list of enabled css paths
  if (__resourceQuery && typeof __resourceQuery === `string`) {
    const cssPaths = __resourceQuery.substr(1).split(`,`);
    for (const cssPath of cssPaths) {
      if (cssPath.match(/\.css$/)) {
        console.info(`[HMR Panel] Enabling CSS reload for ${cssPath}`);
      } else {
        throw new Error(`[HMR Panel] ${cssPath} is not a .css file`);
      }
    }

    enableCssReload(cssPaths);
  } else {
    throw new Error(`[HMR Panel] Need cssPaths in resourceQuery e.g 'css-reload-client?styleA.css,styleB.css'`);
  }
}
