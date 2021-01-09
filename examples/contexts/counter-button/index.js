// import from the same repo. in a different repo you'd use:
// import { Component } from 'panel';
import {Component} from '../../../lib';

import {Counter} from '../contexts';

import template from './index.jade';

class CounterButton extends Component {
  get config() {
    return {
      template,
      contexts: [`darkMode`, `counter`],
    };
  }
};

customElements.define(`counter-button`, CounterButton);
