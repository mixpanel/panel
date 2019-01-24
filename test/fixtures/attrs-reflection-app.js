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
        Object.entries(scope.$attrs).map(([attr, val]) => h(`p`, `${attr}: ${JSON.stringify(val)}`)),
      ),
      defaultState: {
        str: this.attrs[`str-attr`],
      },
    };
  }
}
