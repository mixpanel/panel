module.exports = {
  "plugins": [
    ["babel-plugin-virtual-jade", {
      "vdom": "snabbdom",
      "runtime": "var h = require('../../lib').h;"
    }],
    "syntax-async-functions",
    "transform-regenerator"
  ],
  "ignore": [/node_modules\/(?!snabbdom)/],
  "presets": ["es201ss5"]
};
