import {Component, h} from '../../lib';

export class AttrApp extends Component {
  static get attrsSchema() {
    return {
      wombats: {type: `number`},
    };
  }
  get config() {
    return {
      template: scope => h(`div`, {class: {'attr-app': true}}, [
        h(`p`, `Value of attribute wombats: ${scope.$attrs.wombats}`),
      ]),
    };
  }
}
