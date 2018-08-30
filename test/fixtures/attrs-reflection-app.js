import {Component, h} from '../../lib';

export class AttrsReflectionApp extends Component {
  static get attrsSchema() {
    return {
      'str-attr': {type: `string`},
      'bool-attr': {type: `boolean`, default: true},
      'number-attr': {type: `number`, default: 0},
      'json-attr': {type: `json`},
    };
  }
  get config() {
    return {
      template: scope => h(`div`, {class: {'attrs-reflection-app': true}},
        Object.entries(scope.$attrs).map(([attr, val]) => h(`p`, `${attr}: ${JSON.stringify(val)}`)),
      ),
    };
  }
}
