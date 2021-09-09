/**
 * Manages Virtual DOM -> DOM rendering cycle
 * @module dom-patcher
 * @private
 */

import {
  init as initSnabbdom,
  attributesModule,
  h,
  datasetModule,
  eventListenersModule,
  propsModule,
  styleModule,
  classModule,
} from 'snabbdom';

import delayedClassModule from 'snabbdom-delayed-class';

const patch = initSnabbdom([
  datasetModule,
  attributesModule,
  classModule,
  propsModule,
  styleModule,
  eventListenersModule,
  delayedClassModule,
]);

export const EMPTY_DIV = h(`div`);
export {h};

export class DOMPatcher {
  constructor(initialState, renderFunc, options = {}) {
    this.updateMode = options.updateMode || `async`;

    this.state = Object.assign({}, initialState);
    this.renderFunc = renderFunc;
    this.vnode = this.renderFunc(this.state);

    // prepare root element
    const tagName = this.vnode.sel.split(/[#.]/)[0];
    const classMatches = this.vnode.sel.match(/\.[^.#]+/g);
    const idMatch = this.vnode.sel.match(/#[^.#]+/);
    this.el = document.createElement(tagName);
    if (classMatches) {
      this.el.className = classMatches.map((c) => c.slice(1)).join(` `);
      // this attribute setting ensures that svg elements behave as expected and will ensure
      // compatibility with different snabbdom versions
      this.el.setAttribute(`class`, this.el.className);
    }
    if (idMatch) {
      this.el.id = idMatch[0].slice(1);
    }

    patch(this.el, this.vnode);
    if (this.el === this.vnode.elm) {
      const insertHook = this.vnode.data.hook && this.vnode.data.hook.insert;
      if (insertHook) {
        // since Snabbdom recycled our newly-created root element (this.el) rather
        // than creating its own element, it doesn't fire the insert hook, so we're
        // going to fake it out and call it ourselves
        insertHook(this.vnode);
      }
    }
    this.el = this.vnode.elm;
  }

  update(newState) {
    if (this.rendering) {
      console.error(`Applying new DOM update while render is already in progress!`);
    }

    this.pendingState = newState;
    switch (this.updateMode) {
      case `async`:
        if (!this.pending) {
          this.pending = true;
          requestAnimationFrame(() => this.render());
        }
        break;
      case `sync`:
        this.render();
        break;
    }
  }

  render() {
    // if disconnected, don't render
    if (!this.renderFunc) {
      return;
    }

    this.rendering = true;
    this.pending = false;
    this.state = this.pendingState;
    const newVnode = this.renderFunc(this.state);
    this.rendering = false;

    patch(this.vnode, newVnode);
    this.vnode = newVnode;
    this.el = this.vnode.elm;
  }

  disconnect() {
    const vnode = this.vnode;
    this.renderFunc = null;
    this.state = null;
    this.vnode = null;
    this.el = null;
    // patch with empty vnode to clear out listeners in tree
    // this ensures we don't leave dangling DetachedHTMLElements blocking GC
    patch(vnode, {sel: vnode.sel, key: vnode.key});
  }
}
