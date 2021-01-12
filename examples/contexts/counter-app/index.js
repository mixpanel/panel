// import from the same repo. in a different repo you'd use:
// import { Component } from 'panel';
import {Component} from '../../../lib';

import {Counter} from '../contexts';

import template from './index.jade';

class LightCounterApp extends Component {
  get config() {
    return {
      template,
      contexts: [`counter`, `darkMode`],
      defaultContexts: {
        counter: new Counter(),
        darkMode: false,
      },
      helpers: {
        isDarkModeEnabled: () => this.getContext(`darkMode`),
        getCount: () => this.getContext(`counter`).getCount(),
      },
    };
  }
}

customElements.define(`light-counter-app`, LightCounterApp);

class DarkCounterApp extends Component {
  get config() {
    return {
      template,

      contexts: [`counter`, `darkMode`],
      defaultContexts: {
        counter: new Counter(),
        darkMode: true,
      },
      helpers: {
        isDarkModeEnabled: () => this.getContext(`darkMode`),
        getCount: () => this.getContext(`counter`).getCount(),
      },
    };
  }
}

customElements.define(`dark-counter-app`, DarkCounterApp);
