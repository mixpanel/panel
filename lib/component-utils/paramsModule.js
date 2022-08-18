function updateParams(oldVnode, vnode) {
  const elm = vnode.elm;
  if (elm._setParams) {
    elm._setParams(vnode.data.params || {});
  }
}
export const paramsModule = {create: updateParams, update: updateParams};
