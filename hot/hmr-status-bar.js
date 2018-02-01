/**
 * Shows a thin bar at the top of the page that changes colors
 * when webpack status changes from idle -> compiling -> error / warning
 * A nice unobtrusive webpack status notification system
 */

const webpackEventColors = {
  ok: `#39d183`, // green (connected and idle)
  invalid: `#a081ea`, // purple (compiling)
  warnings: `#dd731d`, // orange
  errors: `#e4567b`, // red
  close: `#9bacbf`, // grey (socket disconnected)
};

window.addEventListener(`message`, event => {
  const webpackPrefix = `webpack`;
  const eventType = event.data.type;
  if (eventType && eventType.startsWith(webpackPrefix)) {
    const webpackEvent = eventType.substr(webpackPrefix.length).toLowerCase();
    const bodyStyle = window.document.body.style;
    bodyStyle.borderTop = `2px solid ${webpackEventColors[webpackEvent]}`;
  }
});

