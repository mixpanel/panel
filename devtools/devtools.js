// The function below is executed in the context of the inspected page.
var panel_getState = function() {
  if ($0 && $0.update && $0.state) {
    $0.update(); // Force a refresh so we can set state and see an update after a re-select
    return $0.state;
  }

  // TODO: Add window.document.body.addEventListener("mouseenter", update) hook
  return {error: "component state not found"};
}

chrome.devtools.panels.elements.createSidebarPane("Panel State", function(sidebar) {
  function updateElementProperties() {
    // setExpression just shows result of a nested expression that is editable
    // Chrome doesn't expose an API to detect when the result is changed by manual editing
    // The work around is to unselect the element and re-select it so $0.update() is called
    sidebar.setExpression("(" + panel_getState.toString() + ")()");
  }

  chrome.devtools.panels.elements.onSelectionChanged.addListener(updateElementProperties);
  updateElementProperties();
});
