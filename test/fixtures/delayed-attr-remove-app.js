/* eslint-disable multiline-ternary */
// @ts-check
import {Component, h} from '../../lib';
import {delayedAttrRemove} from '../../lib/component-utils/hook-helpers';

export class DelayedAttrRemoveApp extends Component {
  static get attrsSchema() {
    return {
      open: `boolean`,
    };
  }

  get config() {
    return {
      template: ({$attr}) =>
        h(
          `div`,
          [
            $attr(`open`)
              ? h(
                  `my-modal`,
                  {
                    attrs: {open: true},
                    hook: {remove: delayedAttrRemove(`open`, `false`, 50)},
                  },
                  `modal body!`,
                )
              : null,
          ].filter(Boolean),
        ),
    };
  }
}
