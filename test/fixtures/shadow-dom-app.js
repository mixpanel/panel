import {Component, h} from '../../lib';

export class ShadowDomApp extends Component {
  get config() {
    return {
      css: `:host { color: blue; }`,
      template: () => h(`div`, {class: {foo: true}}, [h(`p`, `Hello`)]),

      useShadowDom: true,
    };
  }
}
