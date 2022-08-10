function updateParams(oldVnode, vnode) {
  let key;
  let cur;
  let old;
  const elm = vnode.elm;
  let oldParams = oldVnode.data.params;
  let params = vnode.data.params;
  if (!oldParams && !params) return;
  if (oldParams === params) return;
  oldParams = oldParams || {};
  params = params || {};
  for (key in params) {
    cur = params[key];
    old = oldParams[key];
    if (old !== cur && elm.params) {
      elm.params[key] = cur;
    } else {
      elm[key] = cur;
    }
  }
}
export const paramsModule = {create: updateParams, update: updateParams};
