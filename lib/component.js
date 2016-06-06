import MainLoop from 'main-loop';
import create from 'virtual-dom/create-element';
import diff from 'virtual-dom/diff';
import patch from 'virtual-dom/patch';
import h from 'virtual-dom/virtual-hyperscript';
import WebComponent from 'webcomponent';

import Router from './router';

let panelID = 1;

export default class Component extends WebComponent {
  createdCallback() {
    this.panelID = panelID++;
    this._config = Object.assign({}, {
      css: '',
      helpers: {},
      routes: {},
      template: () => { throw Error('No template provided by Component subclass'); },
      useShadowDom: false,
    }, this.config);
    this.state = {};
    if (this.getConfig('useShadowDom')) {
      this.el = this.createShadowRoot();
      this.styleTag = document.createElement('style');
      this.styleTag.innerHTML = this.getConfig('css');
      this.el.appendChild(this.styleTag);
    } else if (this.getConfig('css')) {
      throw Error('"useShadowDom" config option must be set in order to use "css" config.');
    } else {
      this.el = this;
    }
  }

  attachedCallback() {
    this.$panelChildren = new Set();

    const parentID = Number(this.getAttribute('panel-parent'));
    if (parentID) {
      this.isPanelChild = true;
      // find $panelParent
      for (let el = this.parentElement; el && !this.$panelParent; el = el.parentElement) {
        if (el.panelID === parentID) {
          this.$panelParent = el;
          this.$panelRoot = el.$panelRoot;
        }
      }
      if (!this.$panelParent) {
        throw `panel-parent ${parentID} not found`;
      }
      this.$panelParent.$panelChildren.add(this);
      this.state = this.$panelRoot.state;
    } else {
      this.isPanelRoot = true;
      this.$panelRoot = this;
      this.router = new Router(this, {historyMethod: this.historyMethod});
    }
    this.app = this.$panelRoot;

    const newState = Object.assign(
      {},
      this.getConfig('defaultState'),
      this.state,
      this.getJSONAttribute('data-state'),
      this._stateFromAttributes()
    );
    Object.assign(this.state, newState);

    this.loop = MainLoop(this.state, this._render.bind(this), {create, diff, patch});
    this.el.appendChild(this.loop.target);

    if (Object.keys(this.getConfig('routes')).length) {
      this.navigate(window.location.hash);
    }

    this.initialized = true;
  }

  detachedCallback() {
    this.$panelParent && this.$panelParent.$panelChildren.delete(this);
  }

  attributeChangedCallback(attr, oldVal, newVal) {
    if (attr === 'style-override') {
      this._applyStyles(newVal);
    }
    if (this.isPanelRoot && this.initialized) {
      this.update();
    }
  }

  _applyStyles(styleOverride) {
    if (this.getConfig('useShadowDom')) {
      this.styleTag.innerHTML = this.getConfig('css') + (styleOverride || '');
    }
  }

  child(tagName, attrs={}) {
    attrs = Object.assign({}, attrs);
    attrs.attributes = Object.assign({}, attrs.attributes, {'panel-parent': this.panelID});
    return h(tagName, attrs);
  }

  getConfig(item) {
    return this._config[item];
  }

  navigate() {
    this.$panelRoot.router.navigate(...arguments);
  }

  setConfig(item, val) {
    this._config[item] = val;
  }

  // override to provide conditional logic
  // for whether a component's loop should receive
  // state updates
  shouldUpdate(state) {
    return true;
  }

  update(stateUpdate={}) {
    if (!this.initialized) {
      Object.assign(this.state, stateUpdate);
    } else if (this.isPanelRoot) {
      const updateHash = '$fragment' in stateUpdate && stateUpdate.$fragment !== this.state.$fragment;

      Object.assign(this.state, stateUpdate);
      this.updateSelfAndChildren(this.state);

      if (updateHash) {
        this.router.replaceHash(this.state.$fragment);
      }
    } else {
      this.$panelRoot.update(stateUpdate);
    }
  }

  updateSelfAndChildren(state) {
    if (this.initialized && this.shouldUpdate(state)) {
      this.loop.update(state);
      for (let child of this.$panelChildren) {
        child.updateSelfAndChildren(state);
      }
    }
  }

  _render(state) {
    return this.getConfig('template')(Object.assign({}, state, {
      $component: this,
      $helpers: this.getConfig('helpers'),
    }));
  }

  _stateFromAttributes() {
    let state = {};

    // this.attributes is a NamedNodeMap, without normal iterators
    for (let ai = 0; ai < this.attributes.length; ai++) {
      let attr = this.attributes[ai];
      let attrMatch = attr.name.match(/^state-(.+)/);
      if (attrMatch) {
        let num = Number(attr.value);
        state[attrMatch[1]] = isNaN(num) ? attr.value : num;
      }
    }

    return state;
  }
}
