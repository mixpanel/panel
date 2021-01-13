/**
 * Manages Virtual DOM -> DOM rendering cycle
 * @module dom-patcher
 * @private
 */

import {init as initSnabbdom} from 'snabbdom/init';
import {h} from 'snabbdom/h';

import {attributesModule} from 'snabbdom/modules/attributes';
import {datasetModule} from 'snabbdom/modules/dataset';
import snabbDelayedClass from 'snabbdom-delayed-class';
import {eventListenersModule} from 'snabbdom/modules/eventlisteners';
import {propsModule} from 'snabbdom/modules/props';
import {styleModule} from 'snabbdom/modules/style';

const patch = initSnabbdom([
  attributesModule,
  datasetModule,
  snabbDelayedClass,
  eventListenersModule,
  propsModule,
  styleModule,
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
    }
    if (idMatch) {
      this.el.id = idMatch[0].slice(1);
    }

    patch(this.el, this.vnode);
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
  }

  disconnect() {
    const vnode = this.vnode;
    this.renderFunc = null;
    this.state = null;
    this.vnode = null;
    this.el = null;
    // patch with empty vnode to clear out listeners in tree
    // this ensures we don't leave dangling DetachedHTMLElements blocking GC
    patch(vnode, {sel: vnode.sel});
  }
}
