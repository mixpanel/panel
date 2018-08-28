import {Component, h} from '../../lib';

export class AttrsReflectionApp extends Component {
  static get attrsSchema() {
    return {
      theme: {type: `string`},
      enabled: {type: `boolean`, propName: `isEnabled`},

    };
  }
  get config() {
    return {
      template: scope => h(`div`, {class: {'attrs-reflection-app': true}}, [
        h(`p`, `Value of attribute wombats: ${scope.$attrs.wombats}`),
      ]),
    };
  }
}
