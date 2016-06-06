import { Component } from '../../lib';
import h from 'virtual-dom/virtual-hyperscript';

var ShadowDomApp = document.registerElement('css-no-shadow-app', class extends Component {
  get config() {
    return {
      css: 'color: blue;',

      template: state => h('.foo', [
        h('p', `Hello`),
      ]),
    };
  }
});
