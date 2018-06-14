export class StateStore<State> {
  constructor(options: { store?: StateStore<State> });

  /* A readonly version of controller's state */
  readonly state: State;

  /** Update the state by passing in a property bag */
  update(props?: Partial<State>): void;

  /**
   * @internal Subscribe to state updates via a listener callback.
   * Only use for rendering and debugging purposes
   * */
  subscribeUpdates(listener: (props: Partial<State>) => void): void;

  /** @internal Unsubscribe the listener callback that was passed to subscribeUpdates */
  unsubscribeUpdates(listener: (props: Partial<State>) => void): void;
}

export class StateController<State> {
  constructor(options: {store?: StateStore<State>});

  /* A readonly version of controller's state */
  readonly state: State;

  /* An initial default property bag for the controller's state implemented as get defaultState()*/
  readonly defaultState: State;

  /** Update the state by passing in a property bag */
  _update(props?: Partial<State>): void;

  /**
   * @internal Subscribe to state updates via a listener callback.
   * panel component uses this to trigger dom update pipeline
   * Only use for rendering and debugging purposes
   * */
  subscribeUpdates(listener: (props: Partial<State>) => void): void;

  /** @internal Unsubscribe the listener callback that was passed to subscribeUpdates */
  unsubscribeUpdates(listener: (props: Partial<State>) => void): void;
}
