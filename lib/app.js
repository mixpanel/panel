import create from 'virtual-dom/create-element';
import diff from 'virtual-dom/diff';
import patch from 'virtual-dom/patch';
import EventDelegator from 'dom-delegator';
import MainLoop from 'main-loop';

import Router from './router';

new EventDelegator(); // start event listener

export default class App {
  constructor(elID, initialState={}) {
    this.el = document.getElementById(elID);
    this.state = initialState;
    this.router = new Router(this);

    const screens = this.SCREENS;
    for (let k in screens) {
      screens[k].setApp(this);
    }
    this._render = state => screens[this.state.$screen].render(state);
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

  get state() {
    return this.loop.state;
  }

  update(propsUpdate={}) {
    const updateHash = '$fragment' in propsUpdate && propsUpdate.$fragment !== this.state.$fragment;

    Object.assign(this.state, propsUpdate);
    if (this.loop) {
      this.loop.update(this.state);
    } else {
      this.loop = MainLoop(this.state, this._render, {create, diff, patch});
      this.el.appendChild(this.loop.target);
    }

    if (updateHash) {
      window.history.replaceState(null, null, `#${this.state.$fragment}`);
    }
  }
}
