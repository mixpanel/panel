import cuid from 'cuid';
import WebComponent from 'webcomponent';

import {EMPTY_DIV, DOMPatcher, h} from './dom-patcher';
import Router from './router';

const DOCUMENT_FRAGMENT_NODE = 11;

/**
 * Definition of a Panel component/app, implemented as an HTML custom element.
 * App logic and configuration is defined by extending this class. Instantiating
 * a component is typically not done by calling the constructor directly, but
 * either by including the tag in HTML markup, or by using the DOM API method
 * [document.createElement]{@link https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement}.
 *
 * @example <caption>Defining a Panel component</caption>
 * class MyWidget extends Component {
 *   get config() {
 *     return {
 *       // options go here
 *     };
 *   }
 *
 *   myMethod() {
 *     // etc
 *   }
 * }
 *
 * @example <caption>Registering the custom element definition for the DOM</caption>
 * customElements.define('my-widget', MyWidget);
 *
 * @example <caption>Adding an instance of the element to the DOM</caption>
 * <my-widget some-attr></my-widget>
 *
 * @extends WebComponent
 */
class Component extends WebComponent {

  /**
   * Defines standard component configuration.
   * @type {object}
   * @property {function} template - function transforming state object to virtual dom tree
   * @property {object} [helpers={}] - properties and functions injected automatically into template state object
   * @property {object} [routes={}] - object mapping string route expressions to handler functions
   * @property {object} [appState={}] - (app root component only) state object to share with nested descendant components;
   * if not set, root component shares entire state object with all descendants
   * @property {object} [defaultState={}] - default entries for component state
   * @property {object} [hooks={}] - extra rendering/lifecycle callbacks
   * @property {function} [hooks.preUpdate] - called before an update is applied
   * @property {function} [hooks.postUpdate] - called after an update is applied
   * @property {boolean} [updateSync=false] - whether to apply updates to DOM
   * immediately, instead of batching to one update per frame
   * @property {boolean} [useShadowDom=false] - whether to use Shadow DOM
   * @property {string} [css=''] - component-specific Shadow DOM stylesheet
   * @example
   * get config() {
   *   return {
   *     template: state => h('.name', `My name is ${name}`),
   *     routes: {
   *       'wombat/:wombatId': (stateUpdate={}, wombatId) => {
   *         // route handler implementation
   *       },
   *     },
   *   };
   * }
   */
  get config() {
    return {};
  }

  /**
   * Template helper functions defined in config object, and exposed to template code
   * as $helpers. This getter uses the component's internal config cache.
   * @type {object}
   * @example
   * {
   *   myHelper: () => 'some return value',
   * }
   */
  get helpers() {
    return this.getConfig(`helpers`);
  }

  /**
   * For use inside view templates, to create a child Panel component nested under this
   * component, which will share its state object and update cycle.
   * @param {string} tagName - the HTML element tag name of the custom element
   * to be created
   * @param {object} [config={}] - snabbdom node config (second argument of h())
   * @returns {object} snabbdom vnode
   * @example
   * {template: state => h('.header', this.child('my-child-widget'))}
   */
  child(tagName, config={}) {
    config.props = Object.assign({}, config.props, {$panelParentID: this.panelID});
    return h(tagName, config);
  }

  /**
   * Searches the component's Panel ancestors for the first component of the
   * given type (HTML tag name).
   * @param {string} tagName - tag name of the parent to search for
   * @returns {object} Panel component
   * @throws Throws an error if no parent component with the given tag name is found.
   * @example
   * myWidget.findPanelParentByTagName('my-app');
   */
  findPanelParentByTagName(tagName) {
    tagName = tagName.toLowerCase();
    for (let node = this.$panelParent; node; node = node.$panelParent) {
      if (node.tagName.toLowerCase() === tagName) {
        return node;
      }
    }
    throw Error(`${tagName} not found`);
  }

  /**
   * Fetches a value from the component's configuration map (a combination of
   * values supplied in the config() getter and defaults applied automatically).
   * @param {string} key - key of config item to fetch
   * @returns value associated with key
   * @example
   * myWidget.getConfig('css');
   */
  getConfig(key) {
    return this._config[key];
  }

  /**
   * Executes the route handler matching the given URL fragment, and updates
   * the URL, as though the user had navigated explicitly to that address.
   * @param {string} fragment - URL fragment to navigate to
   * @param {object} [stateUpdate={}] - update to apply to state object when
   * routing
   * @example
   * myApp.navigate('wombat/54', {color: 'blue'});
   */
  navigate() {
    this.$panelRoot.router.navigate(...arguments);
  }

  /**
   * Sets a value in the component's configuration map after element
   * initialization.
   * @param {string} key - key of config item to set
   * @param val - value to associate with key
   * @example
   * myWidget.setConfig('template', () => h('.new-template', 'Hi'));
   */
  setConfig(key, val) {
    this._config[key] = val;
  }

  /**
   * To be overridden by subclasses, defining conditional logic for whether
   * a component should rerender its template given the state to be applied.
   * In most cases this method can be left untouched, but can provide improved
   * performance when dealing with very many DOM elements.
   * @param {object} state - state object to be used when rendering
   * @returns {boolean} whether or not to render/update this component
   * @example
   * shouldUpdate(state) {
   *   // don't need to rerender if result set ID hasn't changed
   *   return state.largeResultSetID !== this._cachedResultID;
   * }
   */
  shouldUpdate(state) { // eslint-disable-line no-unused-vars
    return true;
  }

  /**
   * Applies a state update, triggering a re-render check of the component as
   * well as any other components sharing the same state. This is the primary
   * means of updating the DOM in a Panel application.
   * @param {object} [stateUpdate={}] - keys and values of entries to update in
   * the component's state object
   * @example
   * myWidget.update({name: 'Bob'});
   */
  update(stateUpdate={}) {
    return this._updateStore(stateUpdate, {store: `state`, cascade: this.isStateShared});
  }

  /**
   * Applies a state update specifically to app state shared across components.
   * In apps which don't specify `appState` in the root component config, all
   * state is shared across all parent and child components and the standard
   * update() method should be used instead.
   * @param {object} [stateUpdate={}] - keys and values of entries to update in
   * the app's appState object
   * @example
   * myWidget.updateApp({name: 'Bob'});
   */
  updateApp(stateUpdate={}) {
    return this._updateStore(stateUpdate, {store: `appState`, cascade: true});
  }

  constructor() {
    super();

    this.panelID = cuid();
    this._config = Object.assign({}, {
      css: ``,
      helpers: {},
      routes: {},
      template: () => { throw Error(`No template provided by Component subclass`); },
      updateSync: false,
      useShadowDom: false,
    }, this.config);

    // initialize shared state store, either in `appState` or default to `state`
    // appState and isStateShared of child components will be overwritten by parent/root
    // when the component is connected to the hierarchy
    this.state = {};
    this.attrs = {};
    this.appState = this.getConfig(`appState`);
    if (!this.appState) {
      this.appState = {};
      this.isStateShared = true;
    } else {
      this.isStateShared = false;
    }

    if (this.getConfig(`useShadowDom`)) {
      this.el = this.attachShadow({mode: `open`});
      this.styleTag = document.createElement(`style`);
      this.styleTag.innerHTML = this.getConfig(`css`);
      this.el.appendChild(this.styleTag);
    } else if (this.getConfig(`css`)) {
      throw Error(`"useShadowDom" config option must be set in order to use "css" config.`);
    } else {
      this.el = this;
    }
  }

  connectedCallback() {
    if (this.initialized) {
      return;
    }

    // Prevent re-entrant calls to connectedCallback.
    // This can happen in some (probably erroneous) cases with Firefox+polyfills.
    if (this.initializing) {
      return;
    }
    this.initializing = true;

    this.$panelChildren = new Set();

    if (typeof this.$panelParentID !== `undefined`) {
      this.isPanelChild = true;
      // find $panelParent
      for (let node = this.parentNode; node && !this.$panelParent; node = node.parentNode) {
        if (node.nodeType === DOCUMENT_FRAGMENT_NODE) { // handle shadow-root
          node = node.host;
        }
        if (node.panelID === this.$panelParentID) {
          this.$panelParent = node;
          this.$panelRoot = node.$panelRoot;
        }
      }
      if (!this.$panelParent) {
        throw Error(`panelParent ${this.$panelParentID} not found`);
      }
      this.$panelParent.$panelChildren.add(this);

      // share either appState or all of state
      Object.assign(this.$panelRoot.appState, this.appState); // flush any queued appState changes
      this.appState = this.$panelRoot.appState;
      this.isStateShared = this.$panelRoot.isStateShared;
      this.state = this.isStateShared ? this.$panelRoot.state : {};

    } else {
      this.isPanelRoot = true;
      this.$panelRoot = this;
      this.$panelParent = null;
    }
    this.app = this.$panelRoot;

    const newState = Object.assign(
      {},
      this.getConfig(`defaultState`),
      this.state,
      this.getJSONAttribute(`data-state`),
      this._stateFromAttributes()
    );

    Object.assign(this.state, newState);
    Object.keys(this.constructor.attrsSchema).forEach(attr => this._updateAttr(attr));

    if (Object.keys(this.getConfig(`routes`)).length) {
      this.router = new Router(this, {historyMethod: this.historyMethod});
      this.navigate(window.location.hash);
    }

    this.domPatcher = new DOMPatcher(this.state, this._render.bind(this), {
      updateMode: this.getConfig(`updateSync`) ? `sync`: `async`,
    });
    this.el.appendChild(this.domPatcher.el);
    this.initialized = true;
    this.initializing = false;
  }

  disconnectedCallback() {
    if (!this.initialized) {
      return;
    }

    if (this.$panelParent) {
      this.$panelParent.$panelChildren.delete(this);
    }
    if (this.domPatcher) {
      this.el.removeChild(this.domPatcher.el);
    }
    this.domPatcher = null;
    this.initialized = false;
  }

  /**
   * Attributes schema that defines the component's html attributes and their types
   * Panel auto parses attribute changes into this.attrs object and $attrs template helper
   *
   * @typedef {object} AttrSchema
   * @prop {'string' | 'number' | 'boolean' | 'json'} type - type of the attribute
   *       if not set, the attr parser will interpret it as 'string'
   * @prop {string} default - value if the attr is not defined
   * @prop {number} description - description of the attribute, what it does e.t.c
   *
   * @type {Object.<string, AttrSchema>}
   */
  static get attrsSchema() {
    return {};
  }

  static get observedAttributes() {
    return [`style-override`].concat(Object.keys(this.attrsSchema));
  }

  attributeChangedCallback(attr, oldVal, newVal) {
    this._updateAttr(attr);

    if (attr === `style-override`) {
      this._applyStyles(newVal);
    }

    if (this.isPanelRoot && this.initialized) {
      this.update();
    }
  }

  _applyStyles(styleOverride) {
    if (this.getConfig(`useShadowDom`)) {
      this.styleTag.innerHTML = this.getConfig(`css`) + (styleOverride || ``);
    }
  }

  logError() {
    console.error(...arguments);
  }

  toString() {
    try {
      return `${this.tagName}#${this.panelID}`;
    } catch (e) {
      return `UNKNOWN COMPONENT`;
    }
  }

  _render(state) {
    if (this.shouldUpdate(state)) {
      try {
        this._rendered = this.getConfig(`template`)(Object.assign({}, state, {
          $app: this.appState,
          $component: this,
          $helpers: this.helpers,
          $attrs: this.attrs,
        }));
      } catch (e) {
        this.logError(`Error while rendering ${this.toString()}`, this, e.stack);
      }
    }
    return this._rendered || EMPTY_DIV;
  }

  // run a user-defined hook with the given params, if configured
  // cascade down tree hierarchy if option is set
  runHook(hookName, options, ...params) {
    if (!this.initialized) {
      return;
    }

    const hook = (this.getConfig(`hooks`) || {})[hookName];
    if (hook) {
      hook(...params);
    }
    if (options.cascade) {
      for (let child of this.$panelChildren) {
        if (options.exclude !== child) {
          child.runHook(hookName, options, ...params);
        }
      }
    }
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

  /**
   * Parses html attribute using type information from attrsSchema and updates this.attrs
   * @param {string} attr - attribute name
   */
  _updateAttr(attr) {
    const attrsSchema = this.constructor.attrsSchema;
    if (attrsSchema.hasOwnProperty(attr)) {
      const attrSchema = attrsSchema[attr];
      const attrType = attrSchema.type || `string`;
      let attrValue = null;

      if (!this.hasAttribute(attr) && attrSchema.hasOwnProperty(`default`)) {
        attrValue = attrSchema.default;
      } else if (attrType === `string`) {
        attrValue = this.getAttribute(attr);
      } else if (attrType === `boolean`) {
        attrValue = this.isAttributeEnabled(attr);
      } else if (attrType === `number`) {
        attrValue = this.getNumberAttribute(attr);
      } else if (attrType === `json`) {
        attrValue = this.getJSONAttribute(attr);
      }

      this.attrs[attr] = attrValue;
    }
  }

  // update helpers

  // Update a given state store (this.state or this.appState), with option
  // to 'cascade' the update across other linked components
  _updateStore(stateUpdate, options={}) {
    const {cascade, store} = options;
    if (!this.initialized) {

      // just update store without patching DOM etc
      Object.assign(this[store], stateUpdate);

    } else {

      // update DOM, router, descendants etc.
      const updateHash = `$fragment` in stateUpdate && stateUpdate.$fragment !== this[store].$fragment;
      const cascadeFromRoot = cascade && !this.isPanelRoot;
      const updateOptions = {cascade, store};
      const rootOptions = {exclude: this, cascade, store};

      this.runHook(`preUpdate`, updateOptions, stateUpdate);
      if (cascadeFromRoot) {
        this.$panelRoot.runHook(`preUpdate`, rootOptions, stateUpdate);
      }

      this.updateSelfAndChildren(stateUpdate, updateOptions);
      if (cascadeFromRoot) {
        this.$panelRoot.updateSelfAndChildren(stateUpdate, rootOptions);
      }
      if (updateHash) {
        this.router.replaceHash(this[store].$fragment);
      }

      this.runHook(`postUpdate`, updateOptions, stateUpdate);
      if (cascadeFromRoot) {
        this.$panelRoot.runHook(`postUpdate`, rootOptions, stateUpdate);
      }
    }
  }

  // Apply the given update down the component hierarchy from this node,
  // optionally excluding one node's subtree. This is useful for applying
  // a full state update to one component while sending only "shared" state
  // updates to the app root.
  updateSelfAndChildren(stateUpdate, options={}) {
    if (!this.initialized) {
      return;
    }

    const {store, cascade} = options;
    Object.assign(this[store], stateUpdate);
    if (store !== `state` || this.shouldUpdate(this[store])) {
      this.domPatcher.update(this.state);

      if (cascade) {
        for (let child of this.$panelChildren) {
          if (options.exclude !== child) {
            child.updateSelfAndChildren(stateUpdate, options);
          }
        }
      }
    }
  }
}

export default Component;
