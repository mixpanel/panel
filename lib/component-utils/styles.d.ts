/**
 * Apply CSS to a ShadowRoot, caching the CSS styles by tag name where possible.
 * @example
 * class MyComponent extends HTMLElement {
 *    constructor() {
 *      this.el = this.attachShadow({mode: `open`});
 *      attachStaticStyles(this.el, `:host > * { background: white }`);
 *    }
 *  }
 */
export function attachStaticStyles(attachedShadowRoot: ShadowRoot, styleText: string): void;
