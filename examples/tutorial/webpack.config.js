/* eslint-env node */
const HtmlWebpackPlugin = require(`html-webpack-plugin`);
const path = require(`path`);

const webpackConfig = {
  entry: `./index.js`,
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
        test: /\.jade$/,
        exclude: /node_modules/,
        loaders: [`babel?presets[]=es2015`, `virtual-jade`],
      },
      {
        test: /\.js$/,
        exclude: /node_modules\/(?!snabbdom)/,
        loader: `babel`,
        query: {
          presets: [`es2015`],
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: `head`,
      template: `index.template.html`,
    }),
  ],
  resolveLoader: {
    root: path.join(__dirname, `node_modules`),
  },
  virtualJadeLoader: {
    vdom: `snabbdom`,
    runtime: `var h = require("snabbdom/h").h;`,
  },
};

module.exports = webpackConfig;
