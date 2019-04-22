// @ts-check
import {Component, h} from '../../lib';

const STR_ATTR = {
  HELLO: `hello`,
  WORLD: `world`,
  BLEH: `💩🤒🤢☠️ -> 👻🎉💐🎊😱😍`,
};

/**
 * @typedef {Object} State
 * @property {string} str
 */

/** @extends {Component<State>} */
export class AttrsReflectionApp extends Component {
  static get attrsSchema() {
    return {
      'str-attr': {type: `string`, default: STR_ATTR.HELLO, enum: Object.values(STR_ATTR)},
      'bool-attr': `boolean`,
      'number-attr': `number`,
      'json-attr': `json`,
    };
  }

  get config() {
    return {
      template: scope => h(`div`, {class: {'attrs-reflection-app': true}},
        Object.keys(scope.$component.attrs()).map(attr => h(`p`, `${attr}: ${JSON.stringify(scope.$attr(attr))}`)),
      ),
      defaultState: {
        str: this.attr(`str-attr`),
      },
    };
  }
}
