import {Component, h} from '../../lib';

export class RequiredAttrsSchemaApp extends Component {
  static get attrsSchema() {
    return {
      'str-attr': {type: `string`, required: true},
    };
  }
  get config() {
    return {
      template: () => h(`div`, `Shouldn't render!`),
    };
  }
}
