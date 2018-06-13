import {Component, h} from '../../lib';

export class CssNoShadowApp extends Component {
  get config() {
    return {
      css: `color: blue;`,
      template: () => h(`div`, {class: {foo: true}}, [
        h(`p`, `Hello`),
      ]),
    };
  }
}
