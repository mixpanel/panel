// @ts-check
import {Component} from '../../lib';
import {template} from './attrs-reflection-template';

const STR_ATTR = {
  HELLO: `hello`,
  WORLD: `world`,
  BLEH: `💩🤒🤢☠️ -> 👻🎉💐🎊😱😍`,
};

/** @typedef {{str: string}} State */
/** @typedef {{'str-attr': string, 'bool-attr': boolean, 'number-attr': number, 'json-attr': any }} Attrs */
/** @typedef {import('../../lib/index.d').ConfigOptions<State>} ConfigOptions*/

/** @extends {Component<State, Attrs>} */
export class AttrsReflectionApp extends Component {
  static get attrsSchema() {
    return {
      'str-attr': {
        type: `string`,
        default: STR_ATTR.HELLO,
        enum: Object.values(STR_ATTR),
      },
      'bool-attr': `boolean`,
      'number-attr': `number`,
      'json-attr': `json`,
    };
  }

  /** @returns {ConfigOptions} */
  get config() {
    return {
      template,
      defaultState: {
        // Typescript will infer attr(`str-attr`) returns a string.
        // Changing to 'bad-attr' will fail npm run type-check
        str: this.attr(`str-attr`),
      },
    };
  }
}
