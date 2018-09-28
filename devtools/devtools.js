/* global chrome */
// The function below is executed in the context of the inspected page.
// Event listener global scope is different to inspector scope, so we test for window[`$0`]
function getPanelElementState() {
  if (!window[`__$panelDevToolsReady`] && window[`$0`] && window.document.body) {
    // Chrome extension api doesn't let us know when expression has been edited
    // Work around is to refresh the UI with latest state on mouseenter
    window.document.body.addEventListener(`mouseenter`, getPanelElementState);
    window[`__$panelDevToolsReady`] = true;
  }

  // $0 is not available if called via event listeners
  let panelElem = window[`$0`] || window[`__$panelDevToolsLastElem`];

  // Go through ancestors to find a panel element. panelID is used as signifier for a panel component
  // This is so user can right click -> inspect element anywhere inside a panel component and see its debug info
  while (panelElem) {
    if (!panelElem.panelID) {
      // using getRootNode().host to jump through shadow dom boundaries as well
      panelElem = panelElem.parentElement || panelElem.getRootNode().host;
    }
    else {
      window[`__$panelDevToolsLastElem`] = panelElem;
      const debugInfo = Object.create(null); // Don't show extra __proto__ key in extension tab
      debugInfo.$component = panelElem; // so it appears first
      debugInfo.config = panelElem.config;
      debugInfo.constructor = panelElem.constructor; // so we can right-click +'show function definition'

      // Force an update so UI refreshes to latest edited state
      if (panelElem.controller && panelElem.controller._update) {
        panelElem.controller._update();
        debugInfo.state = panelElem.controller.state;
        debugInfo.controller = panelElem.controller;
      }
      else if (panelElem.update) {
        panelElem.update();
        debugInfo.state = panelElem.state;
      }

      if (!panelElem.isStateShared && panelElem.appState) {
        debugInfo.appState = panelElem.appState;
      }

      if (panelElem.attrs && Object.keys(panelElem.attrs).length) {
        debugInfo.attrs = panelElem.attrs;
        debugInfo.attrsSchema = panelElem.constructor.attrsSchema;
      }

      return debugInfo;
    }
  }

  // No panel component selected, remove references
  window[`__$panelDevToolsLastElem`] = null;
  return {error: `No panel component found`};
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
