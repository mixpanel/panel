import requestAnimationFrame from 'raf';

function addOrRemoveClass(el, className, add) {
  el.classList[add ? 'add' : 'remove'](className);
}

function nextFrame(fn) {
  requestAnimationFrame(function() {
    requestAnimationFrame(fn);
  });
}

function changeClassNextFrame(el, className, add) {
  nextFrame(function() {
    addOrRemoveClass(el, className, add);
  });
}

function updateClass(oldVnode, newVnode) {
  const el = newVnode.elm;
  let oldClass = oldVnode.data.class;
  let newClass = newVnode.data.class;

  if (!oldClass && !newClass) {
    return;
  }
  oldClass = oldClass || {};
  newClass = newClass || {};

  // remove classes which are no longer in vnode class obj
  for (const name in oldClass) {
    if (!(name in newClass)) {
      el.classList.remove(name);
    }
  }

  // handle new classes, taking into account special delayed classes
  const oldHasDelay = 'delayed' in oldClass;
  for (const name in newClass) {
    const val = newClass[name];

    if (typeof val === 'object') {

      // special 'delayed'/'remove' class objects
      if (name === 'delayed') {
        for (const delayedName in val) {
          const delayedVal = val[delayedName];
          if (!oldHasDelay || delayedVal !== oldClass.delayed[delayedName]) {
            changeClassNextFrame(el, delayedName, delayedVal);
          }
        }
      }

    } else if (val !== oldClass[name]) {

      // normal class string, handle immediately
      addOrRemoveClass(el, name, val);

    }
  }
}

function applyRemoveClass(vnode, rmFunc) {
  const classObj = vnode.data.class;
  const toRemove = classObj && classObj.remove;
  if (typeof toRemove !== 'object') {
    rmFunc();
    return;
  }

  const el = vnode.elm;
  let delayRemove = 0;
  for (const name in toRemove) {
    const val = toRemove[name];
    if (name === 'delayRemove') {
      delayRemove = val;
    } else {
      addOrRemoveClass(el, name, val);
    }
  }

  setTimeout(rmFunc, delayRemove);
}

export default {
  create: updateClass,
  update: updateClass,
  remove: applyRemoveClass,
};