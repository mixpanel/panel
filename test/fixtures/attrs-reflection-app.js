import {Component, h} from '../../lib';

export class AttrsReflectionApp extends Component {
  static get attrsSchema() {
    return {
      'str-attr': {type: `string`, default: `placeholder`},
      'bool-attr': `boolean`,
      'number-attr': `number`,
      'json-attr': `json`,
    };
  }
  get config() {
    return {
      template: scope => h(`div`, {class: {'attrs-reflection-app': true}},
        Object.entries(scope.$attrs).map(([attr, val]) => h(`p`, `${attr}: ${JSON.stringify(val)}`)),
      ),
      defaultState: {
        str: this.attrs[`str-attr`],
      },
    };
  }
}
