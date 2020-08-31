import {Component, h} from '../../lib';

export class RequiredAttrsSchemaApp extends Component {
  static get attrsSchema() {
    return {
      'str-attr': {type: `string`, required: true},
    };
  }
  get config() {
    return {
      template: () => h(`div`, `Shouldn't render with missing attribute!`),
    };
  }
}

export class BadBooleanRequiredAttrsSchemaApp extends Component {
  static get attrsSchema() {
    return {
      'bool-attr': {type: `boolean`, required: true},
    };
  }

  get config() {
    return {
      template: () => h(`div`, `Shouldn't render!`),
    };
  }
}

export class BadDefaultRequiredAttrsSchemaApp extends Component {
  static get attrsSchema() {
    return {
      'greeting-attr': {type: `string`, default: `hello`, required: true},
    };
  }

  get config() {
    return {
      template: () => h(`div`, `Shouldn't render!`),
    };
  }
}
