import {VNode} from 'snabbdom/vnode';

/**
 * A simple remove hook generator for snabbdom so we remove an element after it's finished its closing animation.
 * The attr value is immediately set and after waitMs, it's removed from dom.
 * @example hook={remove: delayedAttrRemove(`open`, `false`)}
 */
export function delayedAttrRemove(
  attr: string,
  value: string | number | boolean,
  waitMs?: number,
): (vnode: VNode, removeCallback: () => void) => void;
