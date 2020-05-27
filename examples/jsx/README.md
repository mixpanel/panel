# Using JSX with Panel

The example in this directory notates the basic 'counter app' from the [README](https://github.com/mixpanel/panel/blob/master/README.md) but using [JSX](https://facebook.github.io/jsx/) to inline the template:

```jsx
import { Component, jsx } from 'panel';

customElements.define('counter-app', class extends Component {
  get config() {
    return {
      defaultState: {count: 1},

      helpers: {
        decr: () => this.changeCounter(-1),
        incr: () => this.changeCounter(1),
      },

      template: props =>
        <div sel=".counter">
          <div sel=".val">
            Counter: {props.count}
          </div>
          <div sel=".controls">
            <button sel=".decr" on={{click: props.$helpers.decr}}>-</button>
            <button sel=".incr" on={{click: props.$helpers.incr}}>+</button>
          </div>
        </div>
    };
  }

  changeCounter(offset) {
    this.update({count: this.state.count + offset});
  }
});
```

To install and run the example from this directory: `npm install && npm start`. The page will be served on `localhost:8080` by Webpack dev server.

### Notes

For transpiling JSX to JavaScript, this example uses the standard Babel plugin [transform-react-jsx](https://babeljs.io/docs/plugins/transform-react-jsx/). In order for the plugin's output to interface correctly with `snabbdom` instead of `React`, we use the [`snabbdom-jsx-lite`](https://github.com/nojvek/snabbdom-jsx-lite) package and configure the Babel plugin to use the `jsx` function re-exported by `panel`.
