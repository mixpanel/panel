/* eslint-env node */
const HtmlWebpackPlugin = require(`html-webpack-plugin`);
const path = require(`path`);

const webpackConfig = {
  entry: `./index.jsx`,
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: `babel`,
        query: {
          presets: [`es2015`],
        },
      },
      {
        test: /\.jsx$/,
        exclude: /node_modules/,
        loader: `babel`,
        query: {
          plugins: [[`transform-react-jsx`, {pragma: `jsx`}]],
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
};

module.exports = webpackConfig;
