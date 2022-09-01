function updateParams(oldVnode, vnode) {
  const elm = vnode.elm;
  if (elm.setParams && vnode.data && vnode.data.params) {
    elm.setParams(vnode.data.params);
  }
}
export const paramsModule = {create: updateParams, update: updateParams};
