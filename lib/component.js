import cuid from 'cuid';
import WebComponent from 'webcomponent';

import {EMPTY_DIV, DOMPatcher, h} from './dom-patcher';
import Router from './router';
import * as hookHelpers from './component-utils/hook-helpers';
import {Perf} from './component-utils/perf';
import shallowEqual from './component-utils/shallowEqual';

const DOCUMENT_FRAGMENT_NODE = 11;
const ATTR_TYPE_DEFAULTS = {
  string: ``,
  boolean: false,
  number: 0,
  json: null,
};
const PARAM_TYPES = new Set([Array, String, Boolean, Number, Object, Function, Map, Set]);
const stylesheetCache = new Map(); // key is the component constructor, value is a CSSStyleSheet instance

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
  child(tagName, config = {}) {
    config.props = Object.assign({}, config.props, {
      $panelParentID: this.panelID,
    });
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
   * Helper function which will queue a function to be run once the component has been
   * initialized and added to the DOM. If the component has already had its connectedCallback
   * run, the function will run immediately.
   *
   * It can optionally return a function to be enqueued to be run just before the component is
   * removed from the DOM. This occurs during the disconnectedCallback lifecycle.
   * @param {function} fn - callback to be run after the component has been added to the DOM. If this
   * callback returns another function, the returned function will be run when the component disconnects from the DOM.
   * @example
   * myApp.onConnected(() => {
   *   const handleResize = () => calculateSize();
   *   document.body.addEventListener(`resize`, handleResize);
   *   return () => document.body.removeEventListener(`resize`, handleResize);
   * });
   */
  onConnected(fn) {
    if (this.initialized) {
      this._maybeEnqueueResult(fn.call(this));
    }
    this._connectedQueue.push(fn);
  }

  _maybeEnqueueResult(result) {
    if (result && typeof result === `function`) {
      result.removeAfterExec = true;
      this._disconnectedQueue.push(result);
    }
  }

  /**
   * Helper function which will queue a function to be run just before the component is
   * removed from the DOM. This occurs during the disconnectedCallback lifecycle.
   *
   * @param {function} fn - callback to be run just before the component is removed from the DOM
   * @example
   * connectedCallback() {
   *   const shiftKeyListener = () => {
   *     if (ev.keyCode === SHIFT_KEY_CODE) {
   *       const doingRangeSelect = ev.type === `keydown` && this.isMouseOver && this.lastSelectedRowIdx !== null;
   *       if (this.state.doingRangeSelect !== doingRangeSelect) {
   *         this.update({doingRangeSelect});
   *       }
   *     }
   *   }
   *   document.body.addEventListener(`keydown`, shiftKeyListener);
   *   this.onDisconnected(() => {
   *     document.body.removeEventListener(`keydown`, shiftKeyListener);
   *   });
   * }
   */
  onDisconnected(fn) {
    this._disconnectedQueue.push(fn);
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
   *
   * @deprecated use shouldComponentUpdate instead
   * @param {object} state - state object to be used when rendering
   * @returns {boolean} whether or not to render/update this component
   * @example
   * shouldUpdate(state) {
   *   // don't need to rerender if result set ID hasn't changed
   *   return state.largeResultSetID !== this._cachedResultID;
   * }
   */
  // eslint-disable-next-line no-unused-vars
  shouldUpdate(state) {
    return true;
  }

  /**
   *
   * Same API as react's `shouldComponentUpdate` usage
   * if child component implements this method, parent implmentation wil be discarded
   * NOTE: never call `super` in child `shouldComponentUpdate`
   *
   * there a slight difference with react: `params` or `state` could sometimes be null indicating that
   * the update is not related to `params` or `state`
   *
   * @param {object} params - new params object to be used when rendering
   * @param {object} state - state object to be used when rendering
   * @return {boolean}
   * @example
   * shouldComponentUpdate(params, state) {
   *   if (params.bookmark.id === this.params.bookmark.id) {
   *     return false;
   *   }
   *   return !shallowEqual(params, this.params);
   * }
   */
  shouldComponentUpdate(params, state) {
    if (params) {
      return !shallowEqual(params, this.params);
    }
    return this.shouldUpdate(state);
  }

  /**
   * Applies a state update, triggering a re-render check of the component as
   * well as any other components sharing the same state. This is the primary
   * means of updating the DOM in a Panel application.
   * @param {object|function} [stateUpdate={}] - keys and values of entries to update in
   * the component's state object
   * @example
   * myWidget.update({name: 'Bob'});
   */
  update(stateUpdate = {}) {
    this.timings.lastUpdateAt = Perf.getNow();

    const stateUpdateResult = typeof stateUpdate === `function` ? stateUpdate(this.state) : stateUpdate;
    return this._updateStore(stateUpdateResult, {
      store: `state`,
      cascade: this.isStateShared,
    });
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
  updateApp(stateUpdate = {}) {
    return this._updateStore(stateUpdate, {store: `appState`, cascade: true});
  }

  constructor() {
    super();
    this.timings = {
      createdAt: Perf.getNow(),
    };

    this.panelID = cuid();

    // to enforce naviagate always point to this class
    this.navigate = this.navigate.bind(this);

    this._connectedQueue = [];
    this._disconnectedQueue = [];

    this._attrs = {};
    this._syncAttrs(); // constructor sync ensures default properties are present on this._attrs

    this._config = Object.assign(
      {},
      {
        css: ``,
        params: {},
        defaultParams: {},
        defaultContexts: {},
        contexts: [],
        helpers: {},
        routes: {},
        template: () => {
          throw Error(`No template provided by Component subclass`);
        },
        updateSync: false,
        useShadowDom: false,
        slowThreshold: 20,
      },
      this.config,
    );

    this._initializeParams();

    this._contexts = new Set(this.getConfig(`contexts`));

    // initialize shared state store, either in `appState` or default to `state`
    // appState and isStateShared of child components will be overwritten by parent/root
    // when the component is connected to the hierarchy
    this.state = Object.assign({}, this.getConfig(`defaultState`));
    this.appState = this.getConfig(`appState`);

    if (!this.appState) {
      this.appState = {};
      this.isStateShared = true;
    } else {
      this.isStateShared = false;
    }

    if (this.getConfig(`useShadowDom`)) {
      this.el = this.attachShadow({mode: `open`});
      this.applyStaticStyle(this.getConfig(`css`));
    } else if (this.getConfig(`css`)) {
      throw Error(`"useShadowDom" config option must be set in order to use "css" config.`);
    } else {
      this.el = this;
    }

    this.postRenderCallback = (elapsedMs) => {
      this.timings.lastRenderAt = Perf.getNow();
      if (elapsedMs > this.getConfig(`slowThreshold`)) {
        const shouldBroadcast =
          !this.lastSlowRender || // SHOULD because we've never slow rendered
          this.lastSlowRender.time - Perf.getNow() > 3000 || // SHOULD because last time was more than three seconds ago
          elapsedMs > (this.slowestRenderMs || 0); // SHOULD because this time is slower

        if (shouldBroadcast) {
          const comparedToLast = this.lastSlowRender
            ? {
                // bit of a hack to get the number to only 2 digits of precision
                comparedToLast: +((elapsedMs - this.lastSlowRender.elapsedMs) / this.lastSlowRender.elapsedMs).toFixed(
                  2,
                ),
                comparedToSlowest: +((elapsedMs - this.slowestRenderMs) / this.slowestRenderMs).toFixed(2),
              }
            : undefined;

          this.lastSlowRender = {
            time: Perf.getNow(),
            elapsedMs,
          };
          this.slowestRenderMs = Math.max(this.slowestRenderMs || 0, elapsedMs);
          this.dispatchEvent(
            new CustomEvent(`slowRender`, {
              detail: Object.assign(comparedToLast || {}, {elapsedMs, component: this.toString()}),
              bubbles: true,
              composed: true,
            }),
          );
        }
      }
    };
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
    this.timings.initializingStartedAt = Perf.getNow();

    for (const attrsSchemaKey of Object.keys(this._attrsSchema)) {
      if (
        !Object.prototype.hasOwnProperty.call(this._attrs, attrsSchemaKey) &&
        this._attrsSchema[attrsSchemaKey].required
      ) {
        throw new Error(`${this}: is missing required attr '${attrsSchemaKey}'`);
      }
    }

    this.$panelChildren = new Set();

    if (typeof this.$panelParentID !== `undefined`) {
      this.isPanelChild = true;
      // find $panelParent
      for (let node = this.parentNode; node && !this.$panelParent; node = node.parentNode) {
        if (node.nodeType === DOCUMENT_FRAGMENT_NODE) {
          // handle shadow-root
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
      // flush any queued appState changes
      this.appState = Object.assign(this.$panelRoot.appState, this.appState);

      // if child element state is shared, point
      // state to parent's state object and flush any
      // queued state changes to the parent state
      this.isStateShared = this.$panelRoot.isStateShared;
      if (this.isStateShared) {
        this.state = Object.assign(this.$panelRoot.state, this.state);
      }
    } else {
      this.isPanelRoot = true;
      this.$panelRoot = this;
      this.$panelParent = null;
    }
    this.app = this.$panelRoot;

    Object.assign(this.state, this.getJSONAttribute(`data-state`), this._stateFromAttributes());

    if (Object.keys(this.getConfig(`routes`)).length) {
      this.router = new Router(this, {historyMethod: this.historyMethod});
      this.navigate(window.location.hash);
    }

    for (const contextName of this.getConfig(`contexts`)) {
      const context = this.getContext(contextName);
      // Context classes can implement an optional `bindToComponent` callback that executes each time the component is connected to the DOM
      if (context.bindToComponent) {
        context.bindToComponent(this);
      }
    }

    this.domPatcher = new DOMPatcher(this.state, this._render.bind(this), {
      updateMode: this.getConfig(`updateSync`) ? `sync` : `async`,
      postRenderCallback: this.postRenderCallback,
    });
    this.el.appendChild(this.domPatcher.el);

    for (let i = 0; i < this._connectedQueue.length; i++) {
      const connectedCallbackFn = this._connectedQueue[i];
      try {
        this._maybeEnqueueResult(connectedCallbackFn.call(this));
      } catch (err) {
        console.warn(`error running onConnected function`, err);
      }
    }

    this.initialized = true;
    this.initializing = false;
    this.timings.initializingCompletedAt = Perf.getNow();
    this.dispatchEvent(
      new CustomEvent(`componentInitialized`, {
        detail: {
          elapsedMs: this.timings.initializingCompletedAt - this.timings.initializingStartedAt,
          component: this.toString(),
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  disconnectedCallback() {
    if (!this.initialized) {
      return;
    }

    for (let i = 0; i < this._disconnectedQueue.length; i++) {
      const disconnectedCallbackFn = this._disconnectedQueue[i];
      try {
        disconnectedCallbackFn.call(this);
      } catch (err) {
        console.warn(`error running onDisconnected function`, err);
      }
    }

    this._disconnectedQueue = this._disconnectedQueue.filter((fn) => !fn.removeAfterExec);

    for (const contextName of this.getConfig(`contexts`)) {
      const context = this.getContext(contextName);
      // Context classes can implement an optional `unbindFromComponent` callback that executes each time the component is disconnected from the DOM
      if (context.unbindFromComponent) {
        context.unbindFromComponent(this);
      }
    }

    if (this.router) {
      this.router.unregisterListeners();
    }

    if (this.$panelParent) {
      this.$panelParent.$panelChildren.delete(this);
    }

    if (this.domPatcher) {
      this.el.removeChild(this.domPatcher.el);
      this.domPatcher.disconnect();
    }

    this.domPatcher = null;
    this._rendered = null;
    this.initialized = false;

    // if a child component is added via child() and has keys, snabbdom uses parentEl.insertBefore
    // which disconnects the element and immediately connects it at another position.
    // usually the child's disconnectedCallback is called before the parent's
    // but in that case the parents are removed from dom before the children
    // which causes a $panelParent not found exception for the grandchildren.
    // we clean up parent references in an async manner so we can handle that situation.
    Promise.resolve().then(() => {
      // only clear references if element hasn't been re-initialized
      if (!this.initialized) {
        this.$panelRoot = null;
        this.$panelParent = null;
        this.appState = null;
        this.app = null;
      }
    });
  }

  /**
   * Attributes schema that defines the component's html attributes and their types
   * Panel auto parses attribute changes into attrs() object and $attr template helper
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
    this.timings.lastAttributeChangedAt = Perf.getNow();
    this._updateAttr(attr);

    if (attr === `style-override`) {
      this._applyStyleOverride(newVal);
    }

    if (this.initialized) {
      this.update();
    }
  }

  applyStaticStyle(styleSheetText, {ignoreCache = false} = {}) {
    if (styleSheetText) {
      if (this.el.adoptedStyleSheets) {
        // Attempt to cache the styles using Constructible StyleSheets if the feature is supported.
        // Note: this technique avoids the Flash of Unstyled Content that alternative approaches like <link> tags will encounter
        const componentKey = this.constructor;
        let cachedStyleSheet = stylesheetCache.get(componentKey);
        if (!cachedStyleSheet) {
          cachedStyleSheet = new CSSStyleSheet();
          cachedStyleSheet.replaceSync(styleSheetText);
          stylesheetCache.set(componentKey, cachedStyleSheet);
        } else if (ignoreCache) {
          cachedStyleSheet.replaceSync(styleSheetText);
        }
        if (!this.staticStyleSheet) {
          this.staticStyleSheet = cachedStyleSheet;
          this.el.adoptedStyleSheets = [this.staticStyleSheet, ...this.el.adoptedStyleSheets.slice(1)];
        }
      } else {
        if (!this.staticStyleTag) {
          this.staticStyleTag = document.createElement(`style`);
          this.el.insertBefore(this.staticStyleTag, this.el.childNodes[0] || null);
        }
        this.staticStyleTag.innerHTML = styleSheetText;
      }
    }
  }

  _applyStyleOverride(styleOverride) {
    if (this.getConfig(`useShadowDom`)) {
      if (this.el.adoptedStyleSheets) {
        if (!this.styleOverrideStyleSheet) {
          this.styleOverrideStyleSheet = new CSSStyleSheet();
          this.el.adoptedStyleSheets = this.el.adoptedStyleSheets.concat(this.styleOverrideStyleSheet);
        }
        this.styleOverrideStyleSheet.replaceSync(styleOverride || ``);
      } else {
        if (!this.styleOverrideTag) {
          this.styleOverrideTag = document.createElement(`style`);
          this.el.appendChild(this.styleOverrideTag);
        }
        this.styleOverrideTag.innerHTML = styleOverride || ``;
      }
    }
  }

  _logError() {
    console.error(...arguments);
  }

  toString() {
    try {
      return `${(this.tagName || ``).toLowerCase()}#${this.panelID}`;
    } catch (e) {
      return `UNKNOWN COMPONENT`;
    }
  }

  _render(state) {
    if (this.shouldComponentUpdate(null, state)) {
      try {
        this._rendered = this.getConfig(`template`).call(
          this,
          Object.assign({}, state, {
            $app: this.appState,
            $component: this,
            $helpers: this.helpers,
            $attr: this.attr.bind(this),
            $hooks: hookHelpers,
          }),
        );
      } catch (error) {
        this._logError(`Error while rendering`, this, `\n`, error);
        this.dispatchEvent(
          new CustomEvent(`renderError`, {
            detail: {error, component: this},
            bubbles: true,
            composed: true,
          }),
        );
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
      for (const child of this.$panelChildren) {
        if (options.exclude !== child) {
          child.runHook(hookName, options, ...params);
        }
      }
    }
  }

  _stateFromAttributes() {
    const state = {};

    // this.attributes is a NamedNodeMap, without normal iterators
    for (let ai = 0; ai < this.attributes.length; ai++) {
      const attr = this.attributes[ai];
      const attrMatch = attr.name.match(/^state-(.+)/);
      if (attrMatch) {
        const num = Number(attr.value);
        state[attrMatch[1]] = isNaN(num) ? attr.value : num;
      }
    }

    return state;
  }

  /**
   * Validates attrsSchema and syncs element attributes defined in attrsSchema
   */
  _syncAttrs() {
    // maintain local validated map where all schema keys are defined
    this._attrsSchema = {};
    const attrsSchema = this.constructor.attrsSchema;

    for (const attr of Object.keys(attrsSchema)) {
      // convert type shorthand to object
      let attrSchema = attrsSchema[attr];
      if (typeof attrSchema === `string`) {
        attrSchema = {type: attrSchema};
      }

      // Ensure attr type is valid
      const attrType = attrSchema.type;
      if (!ATTR_TYPE_DEFAULTS.hasOwnProperty(attrType)) {
        throw new Error(
          `Invalid type: ${attrType} for attr: ${attr} in attrsSchema. ` +
            `Only (${Object.keys(ATTR_TYPE_DEFAULTS)
              .map((v) => `'${v}'`)
              .join(` | `)}) is valid.`,
        );
      }

      if (attrSchema.default && attrSchema.required) {
        throw new Error(`${this}: attr '${attr}' cannot have both required and default`);
      }

      const attrSchemaObj = {
        type: attrType,
        default: attrSchema.hasOwnProperty(`default`) ? attrSchema.default : ATTR_TYPE_DEFAULTS[attrType],
        required: attrSchema.hasOwnProperty(`required`) ? attrSchema.required : false,
      };

      // convert enum to a set for perf
      if (attrSchema.hasOwnProperty(`enum`)) {
        const attrEnum = attrSchema.enum;
        if (!Array.isArray(attrEnum)) {
          throw new Error(`Enum not an array for attr: ${attr}`);
        }

        const enumSet = new Set(attrEnum);
        enumSet.add(attrSchema.default);
        attrSchemaObj.enumSet = enumSet;
      }

      this._attrsSchema[attr] = attrSchemaObj;
      this._updateAttr(attr);
      // updated at end so we don't console.warn on initial sync
      attrSchemaObj.deprecatedMsg = attrSchema.deprecatedMsg;
    }

    return this._attrs;
  }

  /**
   * Parses html attribute using type information from attrsSchema and updates this._attrs
   * @param {string} attr - attribute name
   */
  _updateAttr(attr) {
    const attrsSchema = this._attrsSchema;
    if (attrsSchema.hasOwnProperty(attr)) {
      const attrSchema = attrsSchema[attr];
      const attrType = attrSchema.type;
      let attrValue = null;

      if (attrSchema.deprecatedMsg) {
        console.warn(`${this}: attr '${attr}' is deprecated. ${attrSchema.deprecatedMsg}`);
      }

      if (!this.hasAttribute(attr)) {
        if (attrType === `boolean` && (attrSchema.default || attrSchema.required)) {
          throw new Error(
            `${this}: boolean attr '${attr}' cannot have required or default, since its value is derived from whether dom element has the attribute, not its value`,
          );
        }

        if (attrSchema.required) {
          // Early return because a required attribute has no explicit value
          return;
        }
        attrValue = attrSchema.default;
      } else if (attrType === `string`) {
        attrValue = this.getAttribute(attr);
        const enumSet = attrSchema.enumSet;

        if (enumSet && !enumSet.has(attrValue)) {
          throw new Error(
            `Invalid value: '${attrValue}' for attr: ${attr}. ` +
              `Only (${Array.from(enumSet)
                .map((v) => `'${v}'`)
                .join(` | `)}) is valid.`,
          );
        }
      } else if (attrType === `boolean`) {
        attrValue = this.isAttributeEnabled(attr);
      } else if (attrType === `number`) {
        attrValue = this.getNumberAttribute(attr);
      } else if (attrType === `json`) {
        attrValue = this.getJSONAttribute(attr);
      }

      this._attrs[attr] = attrValue;
    }
  }

  /**
   * gets the parsed value of an attribute
   * @param {string} attr - attribute name
   */
  attr(attr) {
    if (attr in this._attrs) {
      return this._attrs[attr];
    } else {
      throw new TypeError(`${this}: attr '${attr}' is not defined in attrsSchema`);
    }
  }

  /**
   * Returns the parsed attrs as a key-value POJO
   * @returns {object} parsed attribute values from attrsSchema
   */
  attrs() {
    return this._attrs;
  }

  /**
   * parse and validate config.params and create a param schema on the component
   */
  _initializeParams() {
    // the real value for the params
    this._params = {};
    // maintain local validated map where all schema keys are defined
    this._paramSchemas = {};
    const paramSchemas = this.getConfig(`params`);
    const defaultParams = this.getConfig(`defaultParams`);

    for (let [paramName, paramSchema] of Object.entries(paramSchemas)) {
      // convert type shorthand to object
      if (!paramSchema.type) {
        paramSchema = {type: paramSchema};
      }

      // Ensure param type is valid
      const type = paramSchema.type;
      if (!PARAM_TYPES.has(type)) {
        const typeString = typeof type === `function` ? type.name : String(type);
        throw new Error(
          `Invalid type: ${typeString} for param: ${paramName} in paramSchema. ` +
            `Only (${Array.from(PARAM_TYPES.keys())
              .map((v) => `'${v.name}'`)
              .join(` | `)}) is valid.`,
        );
      }

      const paramSchemaObj = {
        type,
        required: Boolean(paramSchema.required),
        default: defaultParams[paramName],
      };

      // set default value for the params
      this._params[paramName] = paramSchemaObj.default;

      this._paramSchemas[paramName] = paramSchemaObj;
    }

    return this._paramSchemas;
  }

  get params() {
    return this._params;
  }

  setParams(params) {
    const shouldComponentUpdate = this.shouldComponentUpdate(params, this.state);
    const updateOptions = {
      cascade: false,
    };
    // no extra params allowed if not defined in schema
    for (const paramName of Object.keys(params)) {
      if (!this._paramSchemas[paramName]) {
        throw new Error(`extra param '${paramName}' on ${this.constructor.name} is not defined in schema`);
      }
    }
    // if param defined on schema, the key must be preset on the params
    for (const [paramName, paramSchema] of Object.entries(this._paramSchemas)) {
      if (!params.hasOwnProperty(paramName) && paramSchema.required) {
        throw new Error(
          `param '${paramName}' on ${this.constructor.name} is defined as required param in schema but absent on component definition`,
        );
      }
      const paramValue = params[paramName];
      // set default value if empty value passed in
      if (paramSchema.default && (paramValue === null || paramValue === undefined)) {
        params[paramName] = paramSchema.default;
      }
    }
    const newParams = Object.freeze(Object.assign({}, params));

    if (this.initialized && shouldComponentUpdate) {
      this.runHook(`preUpdate`, updateOptions, null, newParams);
    }
    this._params = newParams;
    if (this.initialized && shouldComponentUpdate) {
      this.domPatcher.update(this.state);
      this.runHook(`postUpdate`, updateOptions, null, newParams);
    }
  }

  // update helpers

  // Update a given state store (this.state or this.appState), with option
  // to 'cascade' the update across other linked components
  _updateStore(stateUpdate, options = {}) {
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
  updateSelfAndChildren(stateUpdate, options = {}) {
    if (!this.initialized) {
      return;
    }

    const {store, cascade} = options;
    Object.assign(this[store], stateUpdate);
    if (store !== `state` || this.shouldComponentUpdate(null, this[store])) {
      this.domPatcher.update(this.state);

      if (cascade) {
        for (const child of this.$panelChildren) {
          if (options.exclude !== child) {
            child.updateSelfAndChildren(stateUpdate, options);
          }
        }
      }
    }
  }

  _findNearestContextAncestor() {
    if (!this.isConnected) {
      throw new Error(`Cannot determine context before component is connected to the DOM`);
    }

    let node = this.parentNode;
    while (node) {
      if (node._getAvailableContexts) {
        return node;
      }
      if (node.nodeType === DOCUMENT_FRAGMENT_NODE) {
        // handle shadow-root
        node = node.host;
      } else {
        node = node.parentNode;
      }
    }
    return null;
  }

  _findAndMergeContextsFromAncestors() {
    const contextAncestor = this._findNearestContextAncestor();
    const defaultContexts = Object.assign({}, this.getConfig(`defaultContexts`));

    if (contextAncestor) {
      // ancestor contexts must override locally defined defaults
      return Object.assign(defaultContexts, contextAncestor._getAvailableContexts());
    }

    return defaultContexts;
  }

  _getAvailableContexts() {
    if (!this._cachedContexts) {
      this._cachedContexts = this._findAndMergeContextsFromAncestors();
    }
    return this._cachedContexts;
  }

  /**
   * Returns the default context of the highest (ie. closest to the document root) ancestor component
   * that has configured a default context for the context name. If no ancestor context is found, it will
   * return the component's own default context.
   *
   * @param {string} contextName - name of context
   * @returns {object} context object
   */
  getContext(contextName) {
    if (!contextName) {
      throw new Error(`@contextName is null or empty`);
    }

    if (!this._contexts.has(contextName)) {
      throw new Error(`@contextName must be declared in the "contexts" config array`);
    }

    const availableContexts = this._getAvailableContexts();
    if (!(contextName in availableContexts)) {
      throw new Error(
        `A "${contextName}" context is not available. Check that this component or a DOM ancestor has provided this context in its "defaultContexts" Panel config.`,
      );
    }

    return availableContexts[contextName];
  }
}

export default Component;
