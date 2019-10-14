/* eslint-disable multiline-ternary */
import {Component, h} from '../../lib';


export class DelayedAttrRemoveApp extends Component {
  static get attrsSchema() {
    return {
      open: `boolean`,
    };
  }

  get config() {
    return {
      template: ({$hooks, $attr}) => h(`div`, [
        $attr(`open`) ?
          h(
            `my-modal`,
            {
              attrs: {open: true},
              hook: {remove: $hooks.delayedAttrRemove(`open`, `false`, 50)},
            },
            `modal body!`,
          )
          : null,
      ].filter(Boolean)),
    };
  }
}
