function updateParams(oldVnode, vnode) {
  const elm = vnode.elm;
  const oldParams = oldVnode.data.params;
  const params = vnode.data.params;
  if (!oldParams && !params) return;
  if (oldParams === params) return;
  if (elm._setParams) {
    elm._setParams(params || {});
  }
}
export const paramsModule = {create: updateParams, update: updateParams};
