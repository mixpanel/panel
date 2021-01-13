/* eslint-env node */

module.exports = [
  require(`babel-register`)({
    ignore: [/node_modules\/(?!snabbdom)/],
  }),
];
