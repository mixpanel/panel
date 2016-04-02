import create from 'virtual-dom/create-element';
import diff from 'virtual-dom/diff';
import patch from 'virtual-dom/patch';
import EventDelegator from 'dom-delegator';
import MainLoop from 'main-loop';

import Router from './router';
import View from './view';

new EventDelegator(); // start event listener

export default class App {
  constructor(elID, initialState={}, options={}) {
    this.el = document.getElementById(elID);
    this.state = initialState;
    this.router = new Router(this, options);

    this._screens = this.SCREENS;
    for (let k in this._screens) {
      this._screens[k].setApp(this);
    }
    this._render = state => this._screens[this.state.$screen].render(state);
  }

  get ROUTES() {
    return {};
  }

  get SCREENS() {
    throw 'SCREENS must be provided by subclass';
  }

  navigate() {
    this.router.navigate(...arguments);
  }

  update(stateUpdate={}) {
    const updateHash = '$fragment' in stateUpdate && stateUpdate.$fragment !== this.state.$fragment;

    Object.assign(this.state, stateUpdate);
    if (this.loop) {
      this.loop.update(this.state);
    } else {
      this.loop = MainLoop(this.state, this._render, {create, diff, patch});
      this.el.appendChild(this.loop.target);
    }

    if (updateHash) {
      this.router.replaceHash(this.state.$fragment);
    }

    for (let k in this._screens) {
      this._screens[k].postRender();
    }
  }

  // shortcut to create views which don't need any handlers/helpers
  viewFromTemplate(templateFunc) {
    return new (class extends View {
      get TEMPLATE() {
        return templateFunc;
      }
    })();
  }
}
