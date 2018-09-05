import {Component, h} from '../../lib';

export class BadAttrsSchemaApp extends Component {
  static get attrsSchema() {
    return {
      'str-attr': `string`,
      'bad-attr': `bool`,
    };
  }
  get config() {
    return {
      template: () => h(`div`, `Shouldn't render!`),
    };
  }
}
