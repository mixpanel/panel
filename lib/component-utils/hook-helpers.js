/**
 * A simple remove hook generator so we remove an element after it's finished its closing animation.
 * The attr value is immediately set and after waitMs it's removed from dom.
 * @example hook={remove: $hooks.delayedAttrRemove(`open`, `false`)}
 */
export function delayedAttrRemove(attr, value, waitMs = 500) {
  return function(vnode, callback) {
    vnode.elm.setAttribute(attr, value);
    setTimeout(callback, waitMs);
  };
}
