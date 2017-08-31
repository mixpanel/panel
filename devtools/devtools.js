/* global chrome */
// The function below is executed in the context of the inspected page.
function getPanelElementState() {
  if (!window[`__$panelDevToolsReady`] && window.document.body) {
    // Chrome extension api doesn't let us know when expression has been edited
    // Work around is to refresh the UI with latest state on mouseenter
    window.document.body.addEventListener(`mouseenter`, getPanelElementState);
    window[`__$panelDevToolsReady`] = true;
  }

  // $0 is not available if called via event listeners
  const selectedElem = window[`$0`] || window[`__$panelDevToolsLastSelectedElem`];

  if (selectedElem && selectedElem.update && selectedElem.state) {
    window[`__$panelDevToolsLastSelectedElem`] = selectedElem;
    selectedElem.update(); // Force a refresh so UI reflects latest state
    return selectedElem.state;
  }

  // No panel component selected, remove references
  window[`__$panelDevToolsLastSelectedElem`] = null;
  return {error: `component state not found`};
}

chrome.devtools.panels.elements.createSidebarPane(`Panel State`, function(sidebar) {
  function updateTabExpression() {
    // setExpression just shows result of a nested expression that is editable
    // Chrome doesn't expose an API to detect when the result is changed by manual editing
    // The work around is to unselect the element and re-select it so $0.update() is called
    sidebar.setExpression(`(` + getPanelElementState.toString() + `)()`);
  }

  chrome.devtools.panels.elements.onSelectionChanged.addListener(updateTabExpression);
  updateTabExpression();
});
