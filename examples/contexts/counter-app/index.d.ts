// import from the same repo. in a different repo you'd use:
// import { Component } from 'panel';
import {Component} from '../../../lib';
import {AppContextRegistry, Counter} from '../contexts';

export class LightCounterApp extends Component<any, any, any, any, AppContextRegistry> {
  get config(): {
    template: any;
    contexts: ['counter', 'darkMode'];
    defaultContexts: {
      counter: Counter;
      darkMode: boolean;
    };
  };
}

export class DarkCounterApp extends Component<any, any, any, any, AppContextRegistry> {
  get config(): {
    template: any;
    contexts: ['counter', 'darkMode'];
    defaultContexts: {
      counter: Counter;
      darkMode: boolean;
    };
  };
}
