// Type definitions for panel
// Project: panel
// Definitions by: Mixpanel (https://mixpanel.com)
import {VNode} from 'snabbdom/vnode';
import WebComponent from 'webcomponent';

export {h} from 'snabbdom/h';
export {jsx} from 'snabbdom-jsx-lite';

export class StateStore<State> {
  constructor(options: {store?: StateStore<State>});

  /** A readonly version of controller's state */
  get state(): State;

  /** Update the state by passing in a property bag */
  update(props?: Partial<State>): void;

  /**
   * @internal Subscribe to state updates via a listener callback.
   * Only use for rendering and debugging purposes
   */
  subscribeUpdates(listener: (props: Partial<State>) => void): void;

  /** @internal Unsubscribe the listener callback that was passed to subscribeUpdates */
  unsubscribeUpdates(listener: (props: Partial<State>) => void): void;
}

export class StateController<State> {
  constructor(options: {store?: StateStore<State>});

  /** A readonly version of controller's state */
  get state(): State;

  /** An initial default property bag for the controller's state */
  get defaultState(): State;

  /** Update the state by passing in a property bag */
  _update(props?: Partial<State>): void;

  /**
   * @internal Subscribe to state updates via a listener callback.
   * panel component uses this to trigger dom update pipeline
   * Only use for rendering and debugging purposes
   */
  subscribeUpdates(listener: (props: Partial<State>) => void): void;

  /** @internal Unsubscribe the listener callback that was passed to subscribeUpdates */
  unsubscribeUpdates(listener: (props: Partial<State>) => void): void;
}

export interface PanelHelpers {
  [helper: string]: any;
}

export interface PanelHooks<State> {
  /** Function called before an update is applied */
  preUpdate?: (stateUpdate: Partial<State>) => void;

  /** Function called after an update is applied */
  postUpdate?: (stateUpdate: Partial<State>) => void;

  [hookName: string]: (params: any) => void;
}

export interface ConfigOptions<StateT, AppStateT = unknown> {
  /** Function transforming state object to virtual dom tree */
  template(scope?: StateT): VNode;

  /** Component-specific Shadow DOM stylesheet */
  css?: string;

  /** An initial default value for the component's state property */
  defaultState?: StateT;

  /**
   * A state object to share with nested descendant components. If not set, root component
   * shares entire state object with all descendants. Only applicable to app root components.
   */
  appState?: AppStateT;

  /** Properties and functions injected automatically into template state object */
  helpers?: PanelHelpers;

  /** Extra rendering/lifecycle callbacks */
  hooks?: PanelHooks<StateT>;

  /** Object mapping string route expressions to handler functions */
  routes?: {[route: string]: Function};

  /** Whether to apply updates to DOM immediately, instead of batching to one update per frame */
  updateSync?: boolean;

  /** Whether to use Shadow DOM */
  useShadowDom?: boolean;
}

export interface AttrSchema {
  /** Type of the attribute. One of 'string' | 'number' | 'boolean' | 'json' */
  type: string;

  /** Default value if the attr is not defined */
  default?: any;

  /** Description of attribute, what it does e.t.c */
  description?: string;

  /** Possible values of an attribute. e.g ['primary', 'secondary'] */
  enum?: string[];

  /** When setAttribute is invoked, console.warn that attr is deprecated e.g 'use xyz instead' */
  deprecatedMsg?: string;

  /**
   * For a type: `json` attr, the typescript type that corresponds to it.
   * Can be used to auto-generate Attrs interface
   */
  tsType?: string;

  /**
   * Explicitly require an attribute to be passed, useful when no default value can be inferred.
   */
  required?: boolean;
}

export type AttrsSchema<T> = {
  [attr in keyof T]: string | AttrSchema;
};

export interface AnyAttrs {
  [attr: string]: any;
}

export class Component<StateT, AttrsT = AnyAttrs, AppStateT = unknown, AppT = unknown> extends WebComponent {
  /** The first Panel Component ancestor in the DOM tree; null if this component is the root */
  $panelParent: Component<unknown>;

  /**
   * Attributes schema that defines the component's html attributes and their types
   * Panel auto parses attribute changes into this.attrs object and $attrs template helper
   */
  static get attrsSchema(): {[attr: string]: string | AttrSchema};

  /** A reference to the top-level component */
  app: AppT;

  /** State object to share with nested descendant components */
  appState: AppStateT;

  /** Refers to the outer-most element in the template file for shadow DOM components. Otherwise, el refers to the component itself. */
  el: HTMLElement;

  /** A flag that represents whether the component is currently connected and initialized */
  initialized: boolean;

  /** Defines the state of the component, including all the properties required for rendering */
  state: StateT;

  /** Defines standard component configuration */
  get config(): ConfigOptions<StateT, AppStateT>;

  /**
   * Template helper functions defined in config object, and exposed to template code as $helpers.
   * This getter uses the component's internal config cache.
   */
  get helpers(): this['config']['helpers'];

  /** Gets the attribute value. Throws an error if attr not defined in attrsSchema */
  attr<A extends keyof AttrsT>(attr: A): AttrsT[A];

  /** Attributes parsed from component's html attributes using attrsSchema */
  attrs(): AttrsT;

  /**
   * For use inside view templates, to create a child Panel component nested under this
   * component, which will share its state object and update cycle.
   */
  child(tagName: string, config?: object): VNode;

  /**
   * Searches the component's Panel ancestors for the first component of the
   * given type (HTML tag name).
   */
  findPanelParentByTagName(tagName: string): Component<any>;

  /**
   * Fetches a value from the component's configuration map (a combination of
   * values supplied in the config() getter and defaults applied automatically).
   */
  getConfig<K extends keyof ConfigOptions<StateT, AppStateT>>(key: K): this['config'][K];

  /** Sets a value in the component's configuration map after element initialization */
  setConfig<K extends keyof ConfigOptions<StateT, AppStateT>>(key: K, val: ConfigOptions<StateT, AppStateT>[K]): void;

  /**
   * Executes the route handler matching the given URL fragment, and updates
   * the URL, as though the user had navigated explicitly to that address.
   */
  navigate(fragment: string, stateUpdate?: Partial<StateT>): void;

  /** Run a user-defined hook with the given parameters */
  runHook: (
    hookName: keyof ConfigOptions<StateT, AppStateT>['hooks'],
    options: {cascade: boolean; exclude: Component<any, any>},
    params: any,
  ) => void;

  /**
   * To be overridden by subclasses, defining conditional logic for whether
   * a component should rerender its template given the state to be applied.
   * In most cases this method can be left untouched, but can provide improved
   * performance when dealing with very many DOM elements.
   */
  shouldUpdate(state: StateT): boolean;

  /**
   * Applies a state update specifically to app state shared across components.
   * In apps which don't specify `appState` in the root component config, all
   * state is shared across all parent and child components and the standard
   * update() method should be used instead.
   */
  updateApp(stateUpdate?: Partial<AppStateT>): void;

  /**
   * Applies a state update, triggering a re-render check of the component as
   * well as any other components sharing the same state. This is the primary
   * means of updating the DOM in a Panel application.
   */
  update(stateUpdate?: Partial<StateT> | ((state: StateT) => Partial<StateT>)): void;

  /**
   * Helper function which will queue a function to be run once the component has been
   * initialized and added to the DOM. If the component has already had its connectedCallback
   * run, the function will run immediately.
   *
   * It can optionally return a function to be enqueued to be run just before the component is
   * removed from the DOM. This occurs during the disconnectedCallback lifecycle.
   */
  onConnected(callback: () => void | (() => void)): void;

  /**
   * Helper function which will queue a function to be run just before the component is
   * removed from the DOM. This occurs during the disconnectedCallback lifecycle.
   */
  onDisconnected(callback: () => void): void;
}
