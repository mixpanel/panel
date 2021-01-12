// import from the same repo. in a different repo you'd use:
// import { Component } from 'panel';
import {Component} from '../../../lib';
import {AppContextRegistry, Counter} from '../contexts';

export class CounterButton extends Component<any, any, any, any, AppContextRegistry> {
  get config(): {
    template: any;
    contexts: ['darkMode', 'counter'];
    helpers: {
      getDarkMode: () => boolean;
      getCounter: () => Counter;
    };
  };
}
