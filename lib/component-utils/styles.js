const stylesheetCache = new Map(); // key is the tag name, value is a CSSStyleSheet instance

/**
 * Apply CSS to a ShadowRoot, caching the CSS styles by the ShadowRoot host's tag name where possible.
 * @example
 * class MyComponent extends HTMLElement {
 *    constructor() {
 *      this.el = this.attachShadow({mode: `open`});
 *      attachStaticStyles(this.el, `:host > * { background: white }`);
 *    }
 *  }
 */
export function attachStaticStyles(attachedShadowRoot, styleText) {
  if (styleText) {
    if (attachedShadowRoot.adoptedStyleSheets) {
      // Attempt to cache the styles using Constructible StyleSheets if the feature is supported.
      // Note: this technique avoids the Flash of Unstyled Content that alternative approaches like <link> tags will encounter
      const tagName = attachedShadowRoot.host.localName;
      let stylesheet = stylesheetCache.get(tagName);
      if (!stylesheet) {
        stylesheet = new CSSStyleSheet();
        stylesheet.replaceSync(styleText);
        stylesheetCache.set(tagName, stylesheet);
      }
      attachedShadowRoot.adoptedStyleSheets = [stylesheet];
    } else {
      const styleTag = document.createElement(`style`);
      styleTag.innerHTML = styleText;
      attachedShadowRoot.appendChild(styleTag);
    }
  }
}
