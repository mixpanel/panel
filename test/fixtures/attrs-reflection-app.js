// @ts-check
import {Component, h} from '../../lib';

const STR_ATTR = {
  HELLO: `hello`,
  WORLD: `world`,
  BLEH: `💩🤒🤢☠️ -> 👻🎉💐🎊😱😍`,
};

/** @typedef {{str: string}} State */
/** @typedef {{'str-attr': string, 'bool-attr': boolean, 'number-attr': number, 'json-attr': any }} Attrs */
/** @typedef {import('../../lib/index.d').ConfigOptions<State, {}, Attrs>} ConfigOptions*/

/** @extends {Component<State, unknown, unknown, Attrs>} */
export class AttrsReflectionApp extends Component {
  static get attrsSchema() {
    return {
      'str-attr': {type: `string`, default: STR_ATTR.HELLO, enum: Object.values(STR_ATTR)},
      'bool-attr': `boolean`,
      'number-attr': `number`,
      'json-attr': `json`,
    };
  }

  /** @returns {ConfigOptions} */
  get config() {
    return {
      template: scope => h(`div`, {class: {'attrs-reflection-app': true}},
        Object.keys(scope.$component.attrs()).map(
          /** @param attr {keyof Attrs} */
          attr => h(`p`, `${attr}: ${JSON.stringify(scope.$attr(attr))}`)
        ),
      ),
      defaultState: {
        // Typescript will infer attr(`str-attr`) returns a string.
        // Changing to 'bad-attr' will fail npm run type-check
        str: this.attr(`str-attr`),
      },
    };
  }
}
