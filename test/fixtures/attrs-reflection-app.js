// @ts-check
import {Component, jsx} from '../../lib';

const STR_ATTR = {
  HELLO: `hello`,
  WORLD: `world`,
  BLEH: `💩🤒🤢☠️ -> 👻🎉💐🎊😱😍`,
};

/** @typedef {{str: string}} State */
/** @typedef {{'str-attr': string, 'bool-attr': boolean, 'number-attr': number, 'json-attr': any }} Attrs */
/** @typedef {import('../../lib/index.d').ConfigOptions<State, {}, Attrs>} ConfigOptions*/

/** @this {AttrsReflectionApp}
 * fixture example with `this` implicitly bound to the component instance
 */
function template() {
  return jsx(
    `div`,
    {class: {'attrs-reflection-app': true}},
    Object.keys(this.attrs()).map(
      /** @param attr {keyof Attrs} */
      (attr) => jsx(`p`, null, `${attr}: ${JSON.stringify(this.attr(attr))}`),
    ),
  );
}

/** @extends {Component<State, unknown, unknown, Attrs>} */
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
