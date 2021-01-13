/* eslint-env node */
const path = require(`path`);

const webpackConfig = {
  entry: path.join(__dirname, `index.js`),
  output: {
    path: path.join(__dirname, `build`),
    filename: `bundle.js`,
    pathinfo: true,
  },
  resolve: {
    alias: {
      /**
       * snabbdom 1.0.x use the package.json exports field to
       * define module exports, support for this field is landing
       * in webpack 5, until then we alias the snabbdom exports
       * more info https://github.com/webpack/webpack/pull/10953
       */
      snabbdom: `snabbdom/build/package`,
    },
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules\/(?!domsuite|snabbdom)/,
        loader: `babel`,
        query: {
          plugins: [`syntax-async-functions`, `transform-regenerator`],
          presets: [`es2015`],
        },
      },
    ],
  },
  watch: process.env.WATCH,
};

module.exports = webpackConfig;
