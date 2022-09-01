function updateParams(oldVnode, vnode) {
  const elm = vnode.elm;
  // common guards used in snabbdom-attr-module
  const oldParams = oldVnode.data.params;
  const params = vnode.data.params;
  if (oldParams === params) return;
  if (!oldParams && !params) return;

  if (elm.setParams) {
    elm.setParams(params);
  }
}
export const paramsModule = {create: updateParams, update: updateParams};
