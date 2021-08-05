/* eslint-env node */
const HtmlWebpackPlugin = require(`html-webpack-plugin`);
const path = require(`path`);

const webpackConfig = {
  entry: `./index.js`,
  module: {
    loaders: [
      {
        test: /\.jade$/,
        exclude: /node_modules/,
        loaders: [`babel?presets[]=es2015`, `virtual-jade`],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: `babel`,
        query: {
          presets: [`es2015`],
        },
      },
      {
        test: /\.styl$/,
        exclude: /node_modules/,
        loader: `css!autoprefixer!stylus`,
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
    runtime: `var h = require("snabbdom").h;`,
    propsWrapper: `props`,
    rawProps: true,
  },
};

module.exports = webpackConfig;
