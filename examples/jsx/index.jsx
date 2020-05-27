// import from the same repo. in a different repo you'd use:
// import { Component } from 'panel';
import { Component, jsx } from '../../lib';

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
