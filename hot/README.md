# Using panel hot loaders with webpack

## Sample webpack config

```js
const {HOT} = process.env;
const isDevServer = process.argv.some(s => s.includes(`webpack-dev-server`));

const webpackConfig = {
  entry {
    app: '.src/index.js'
  },
  output: {
    filename: '[name].js',
  },
  loaders: {
    rules :[
      { test: /\.jade$/, use: [
        { loader: `panel/hot/template-loader`},
        { loader: `babel-loader`, options: {
          presets: [`es2015`],
        }},
        { loader: `virtual-jade-loader`, options: {
          vdom: `snabbdom`,
          runtime: `var h = require("panel").h;`,
        }},
      ]},
      { test: /\.styl$/, use: [
        {
          loader: `panel/hot/style-loader`,
          options: {
            // enables or disables the loader
            hot: true,
            // transforms a path derived element name into something else
            // allows for more flexible naming convention
            elementNameTransform: (name, path) => `mp-${name}`,
          },
        },
        { loader: `css-loader`},
        { loader: `stylus-loader`},
      ]},
      { test: /\.js$/, use: [
        { loader: `babel-loader`, options: {
          presets: [`es2015`],
        }},
      ]},
    ]
  },
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
  ]
};

if (isDevServer && HOT) {
  webpackConfig.devServer.hot = true;
  webpackConfig.plugins.push(new webpack.NamedModulesPlugin());
  webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
}
```

Panel hot loaders only activate if `webpackConfig.devServer.hot === true` otherwise they do a no-op and behave like they are non-existent
