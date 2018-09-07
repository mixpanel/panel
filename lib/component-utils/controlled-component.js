import Component from '../component';
import {EMPTY_DIV} from '../dom-patcher';

/**
 * @deprecated
 * ControlledComponent is deprecated. Compose with a normal component and controller
 *
 * @example
 * constructor() {
 *   super(...arguments);
 *   this.controller = new ExampleController({store: this});
 *   this.setConfig(`defaultState`, this.controller.defaultState);
 * }
 */


export default class ControlledComponent extends Component {
  constructor() {
    super(...arguments);
    this.controller = this.getConfig(`controller`);
    if (!this.controller) {
      throw Error(`"controller" must be set in config of a ControlledComponent`);
    }
    // Don't allow component's update directly
    this._update = this.update;
    this.update = () => { throw new Error(`update() not allowed from component. Use controller`); };
    this._updateListener = () => this._update();
    this.controller.subscribeUpdates(this._updateListener);
  }

  disconnectedCallback() {
    if (!this.initialized) {
      return;
    }

    super.disconnectedCallback();
    this.controller.unsubscribeUpdates(this._updateListener);
  }

  attributeChangedCallback(attr) {
    // super.attributeChangedCallback class calls this.update() which will throw an error
    this._updateAttr(attr);
    if (this.initialized) {
      this._update();
    }
  }

  _render() {
    if (this.shouldUpdate()) {
      try {
        // Pass in $controller to jade.
        // Template should use something like $controller.getDisplayX() to get the state it needs
        this._rendered = this.getConfig(`template`)({
          $component: this,
          $helpers: this.helpers,
          $controller: this.controller,
          $attrs: this.attrs,
        });
      } catch (e) {
        this.logError(`Error while rendering ${this.toString()}`, this, e.stack);
      }
    }
    return this._rendered || EMPTY_DIV;
  }
}
