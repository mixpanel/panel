import {Component, h} from '../../lib';

export class AttrReflectionApp extends Component {
  get config() {
    return {
      // eslint-disable-next-line no-unused-vars
      template: state => h(`div`, {class: {'attr-app': true}}, [
        h(`p`, `Value of attribute wombats: ${this.getAttribute(`wombats`)}`),
      ]),
    };
  }

  static get observedAttributes() {
    return [`wombats`];
  }
}
