function updateParams(oldVnode, vnode) {
  const elm = vnode.elm;
  if (elm.setParams) {
    elm.setParams(vnode.data.params || {});
  }
}
export const paramsModule = {create: updateParams, update: updateParams};
