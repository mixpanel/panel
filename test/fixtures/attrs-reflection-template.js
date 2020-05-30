// @ts-check
import {jsx} from '../../lib';

/** @typedef {import('./attrs-reflection-app').AttrsReflectionApp} AttrsReflectionApp*/
/** @typedef {import('./attrs-reflection-app').Attrs} Attrs*/

/** @this {AttrsReflectionApp}
 * fixture example of external template with `this` implicitly bound
 */
export function template() {
  return jsx(
    `div`,
    {class: {'attrs-reflection-app': true}},
    Object.keys(this.attrs()).map(
      /** @param attr {keyof Attrs} */
      (attr) => jsx(`p`, null, `${attr}: ${JSON.stringify(this.attr(attr))}`),
    ),
  );
}
