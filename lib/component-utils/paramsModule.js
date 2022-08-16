function updateParams(oldVnode, vnode) {
  let key;
  const elm = vnode.elm;
  let oldParams = oldVnode.data.params;
  let params = vnode.data.params;
  if (!oldParams && !params) return;
  if (oldParams === params) return;
  oldParams = oldParams || {};
  params = params || {};
  if (elm._setParams) {
    elm._setParams(params);
  } else {
    for (key in params) {
      const cur = params[key];
      const old = oldParams[key];
      if (cur !== old) {
        elm[key] = cur;
      }
    }
  }
}
export const paramsModule = {create: updateParams, update: updateParams};
