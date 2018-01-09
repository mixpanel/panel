/* global module */

module.exports = function updateController(newController, elemName) {
  const elems = document.getElementsByTagName(`${elemName}`);
  const elemsToUpdate = [];
  for (const elem of elems) {
    if (elem.controller && elem.update) {
      // Unsubscribe from old controller
      const oldController = elem.controller;
      oldController.unsubscribeUpdates(elem._updateListener);

      // Add new controller, subscribe and update
      elem.controller = elem._config.controller = newController;
      newController.subscribeUpdates(elem._updateListener);
      elemsToUpdate.push(elem);
    } else {
      console.error(`${elemName} is not a panel ControlledComponent`);
    }
  }

  // Update all elements after controller is swapped
  for (const elem of elemsToUpdate) {
    elem._update();
  }

  if (elemsToUpdate.length > 0) {
    console.info(`[HMR Panel] Updated ${elems.length} ${elemName} elems`);
  } else {
    console.warn(`[HMR Panel] custom panel element: ${elemName} not found`);
  }
};
