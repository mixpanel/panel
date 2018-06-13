import {Component, h} from '../../lib';

export class AttrReflectionApp extends Component {
  get config() {
    return {
      template: () => h(`div`, {class: {'attr-app': true}}, [
        h(`p`, `Value of attribute wombats: ${this.getAttribute(`wombats`)}`),
      ]),
    };
  }

  static get observedAttributes() {
    return [`wombats`];
  }
}
