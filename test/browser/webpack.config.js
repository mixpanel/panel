/* eslint-env node */
const path = require(`path`);
const webpack = require(`webpack`);

const webpackConfig = {
  mode: `development`,
  devtool: `source-map`,
  entry: path.join(__dirname, `index.js`),
  output: {
    path: path.join(__dirname, `build`),
    filename: `bundle.js`,
    pathinfo: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: `babel-loader`,
        },
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      process: {
        env: {
          NODE_ENV: JSON.stringify(`test`),
        },
      },
    }),
  ],
  watch: process.env.WATCH,
};

module.exports = webpackConfig;
