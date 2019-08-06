// Type definitions for panel
// Project: panel
// Definitions by: Mixpanel (https://mixpanel.com)
import {VNode} from 'snabbdom/vnode';
import {WebComponent} from 'webcomponent';

export {h} from 'snabbdom/h';

export class StateStore<State> {
  constructor(options: { store?: StateStore<State> });

  /** A readonly version of controller's state */
  readonly state: State;

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
  readonly state: State;

  /** An initial default property bag for the controller's state implemented as get defaultState() */
  readonly defaultState: State;

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

declare namespace Component {
  interface Helpers {
    [helper: string]: any;
  }

  interface Hooks<State> {
    /** Function called before an update is applied */
    preUpdate?: (stateUpdate: Partial<State>) => void;

    /** Function called after an update is applied */
    postUpdate?: (stateUpdate: Partial<State>) => void;

    [hookName: string]: (params: any) => void;
  }

  interface TemplateScope<State, AppState = {}, Attrs = AnyAttrs> {
    /** AppState of the root panel component */
    $app: AppState;

    /** Attributes parsed from component's html attributes using attrsSchema */
    $attr<A extends keyof Attrs>(attr: A): Attrs[A];

    /** A reference to the component itself */
    $component: Component<State, AppState, unknown, Attrs>;

    /** Helpers defined in component config */
    $helpers: Helpers;
  }

  interface ConfigOptions<State, AppState, Attrs> {
    /** Function transforming state object to virtual dom tree */
    template(scope: TemplateScope<State, AppState, Attrs> & State): VNode;

    /** Component-specific Shadow DOM stylesheet */
    css?: string;

    /** An initial default value for the component's state property */
    defaultState?: State;

    /**
     * A state object to share with nested descendant components. If not set, root component
     * shares entire state object with all descendants. Only applicable to app root components.
     */
    appState?: AppState;

    /** Properties and functions injected automatically into template state object */
    helpers?: Helpers;

    /** Extra rendering/lifecycle callbacks */
    hooks?: Hooks<State>;

    /** Object mapping string route expressions to handler functions */
    routes?: {[route: string]: Function};

    /** Whether to apply updates to DOM immediately, instead of batching to one update per frame */
    updateSync?: boolean;

    /** Whether to use Shadow DOM */
    useShadowDom?: boolean;
  }
}

export interface AttrSchema {
  /** Type of the attribute. One of 'string' | 'number' | 'boolean' | 'json' */
  type: string;

  /** Default value if the attr is not defined */
  default?: any;

  /** Description of attribute, what it does e.t.c */
  description?: string;

  /** Possible values of an attribute. e.g ['primary', 'secondary'] */
  enum?: Array<string>;

  /** When setAttribute is invoked, console.warn that attr is deprecated e.g 'use xyz instead' */
  deprecatedMsg?: string;

  /**
   * For a type: `json` attr, the typescript interface that corresponds to it.
   * Can be used to auto-generate Attrs interface
   */
  interface?: string;
}

export interface AnyAttrs {
  [attr: string]: any;
}

export type ConfigOptions<State, AppState = {}, Attrs = AnyAttrs> = Component.ConfigOptions<State, AppState, Attrs>;

export class Component<State, AppState = {}, App = unknown, Attrs = AnyAttrs> extends WebComponent {
  /** The first Panel Component ancestor in the DOM tree; null if this component is the root */
  $panelParent: Component<unknown>;

  /**
   * Attributes schema that defines the component's html attributes and their types
   * Panel auto parses attribute changes into this.attrs object and $attrs template helper
   */
  static attrsSchema: {[attr: string]: (string | AttrSchema )};

  /** A reference to the top-level component */
  app: App;

  /** State object to share with nested descendant components */
  appState: AppState;

  /** Refers to the outer-most element in the template file for shadow DOM components. Otherwise, el refers to the component itself. */
  el: HTMLElement;

  /** A flag that represents whether the component is currently connected and initialized */
  initialized: boolean;

  /** Defines the state of the component, including all the properties required for rendering */
  state: State;

  /** Defines standard component configuration */
  config: ConfigOptions<State, AppState, Attrs>;

  /**
   * Template helper functions defined in config object, and exposed to template code as $helpers.
   * This getter uses the component's internal config cache.
   */
  helpers: ConfigOptions<State, AppState>['helpers'];

  /** Gets the attribute value. Throws an error if attr not defined in attrsSchema */
  attr<A extends keyof Attrs>(attr: A): Attrs[A];

  /** Attributes parsed from component's html attributes using attrsSchema */
  attrs(): Attrs;

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
  getConfig<K extends keyof ConfigOptions<State, AppState>>(key: K): ConfigOptions<State, AppState>[K];

  /**
   * Executes the route handler matching the given URL fragment, and updates
   * the URL, as though the user had navigated explicitly to that address.
   */
  navigate(fragment: string, stateUpdate?: Partial<State>): void;

  /** Run a user-defined hook with the given parameters */
  runHook: (
    hookName: keyof ConfigOptions<State, AppState>['hooks'],
    options: {cascade: boolean, exclude: Component<any, any>},
    params: any,
  ) => void;

  /** Sets a value in the component's configuration map after element initialization */
  setConfig<K extends keyof ConfigOptions<State, AppState>>(key: K, val: ConfigOptions<State, AppState>[K]): void;

  /**
   * To be overridden by subclasses, defining conditional logic for whether
   * a component should rerender its template given the state to be applied.
   * In most cases this method can be left untouched, but can provide improved
   * performance when dealing with very many DOM elements.
   */
  shouldUpdate(state: State): boolean;

  /**
   * Applies a state update specifically to app state shared across components.
   * In apps which don't specify `appState` in the root component config, all
   * state is shared across all parent and child components and the standard
   * update() method should be used instead.
   */
  updateApp(stateUpdate?: Partial<AppState>): void;

  /**
   * Applies a state update, triggering a re-render check of the component as
   * well as any other components sharing the same state. This is the primary
   * means of updating the DOM in a Panel application.
   */
  update(stateUpdate?: Partial<State>): void;
}
