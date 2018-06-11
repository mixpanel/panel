import Component from '../component';
import {h} from '../dom-patcher';


/**
 * Definition of a generic Component which proxies attributes and events
 * between itself and a variable child component.
 *
 * @extends Component
 */
class ProxyComponent extends Component {
  get config() {
    return Object.assign({
      template: ({$component}) => {
        return h($component.getTargetElementTag(), {
          attrs: $component.getAttributes(),
          on: $component._getProxiedEventHandlers(),
        });
      },
    }, this.localConfig);
  }

  /**
   * Override this to extend the default configuration.
   *
   * @see Component#config
   */
  get localConfig() {
    return {};
  }

  /**
   * Override to determine which tag to instantiate as the child.
   *
   * This is where all switching logic should go.
   *
   * @returns {string} - tag name of the component to instantiate
   *
   * @example <caption>a URL based feature flag</caption>
   * class MyWidget extends ProxyComponent {
   *   getTargetElementTag() {
   *     if (window.location.search.includes('enable_beta') {
   *       return 'my-widget-v2';
   *     }
   *
   *     return 'my-widget-v1'
   *   }
   * }
   */
  getTargetElementTag() {
    throw new Error(`You must override getTargetElementTag().`);
  }

  _getProxiedEventHandlers() {
    const handler = this.proxyEventHandler.bind(this);
    return this.observedEvents.reduce((acc, ev) => {
      acc[ev] = handler;
      return acc;
    }, {});
  }

  /**
   * Override this method to stop events from being bubbled through this element.
   * @param {Event} ev - event to check
   * @returns {boolean} whether event should bubble through
   *
   * @example <caption>filter specific events out</caption>
   * class MyWidget extends ProxyComponent {
   *   allowEvent(ev) {
   *     // don't propagate click events for the v2 component
   *     return this.getTargetElementTag() !== `my-widget-v2` && ev.type !== `click`;
   *   }
   * }
   */
  allowEvent(ev) { // eslint-disable-line no-unused-vars
    return true;
  }

  // Proxied events will be stripped of their native attributes and re-wrapped as CustomEvents. Callers
  // should assume that only `detail` remains intact.
  proxyEventHandler(ev) {
    if (!this.allowEvent(ev)) {
      return false;
    }

    if (!ev.bubbles) {
      this.dispatchEvent(new CustomEvent(ev.type, ev));
    }

    return true;
  }

  // Return a map of attributes to pass to the child.
  getAttributes() {
    const attributes = {};
    for (let i = 0; i < this.attributes.length; i++) {
      const attr = this.attributes[i];
      attributes[attr.name] = attr.value;
    }

    return attributes;
  }

  /**
   * Defines the names of events which will be emitted by the wrapped component.
   * Bubbling events will bubble through, but non-composed events from ShadowDOM
   * elements will not and will be re-dispatched from the proxy.
   * @type {string[]}
   */
  get observedEvents() {
    return [];
  }
}

export default ProxyComponent;
