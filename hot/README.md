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
        { loader: `panel/hot/style-loader`},
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
  resolveLoader: {
    alias: {
      'panel-controller': `panel/hot/controller-loader`,
    },
  },
};

if (isDevServer && HOT) {
  webpackConfig.devServer.hot = true;
  webpackConfig.plugins.push(new webpack.NamedModulesPlugin());
  webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
}
```

Panel hot loaders only activate if `webpackConfig.devServer.hot === true` otherwise they do a no-op and behave like they are non-existent


## Inside a panel component

```js
import {Component} from 'panel';
// Ensure controller uses a `export default class SampleController`
import SampleController from 'panel-controller!./controller';
import template from './index.jade';
import './index.styl';

customElements.define('sample-component', class SampleComponent extends Component {
  get config() {
    return {
      template,
    };
  }

  constructor() {
    super(...arguments);
    this.controller = new SampleController({store: this});
  }
}
```

Or using a ControlledComponent

```js
import {ControlledComponent} from 'panel';
import SampleController from 'panel-controller!./controller';
import template from './index.jade';
import './index.styl';

customElements.define('sample-component', class SampleComponent extends ControlledComponent {
  get config() {
    return {
      template,
      // new instance of class is used after hot mode replacement when element is created
      controller: new SampleController(),
    };
  }
}
```
