import {ProxyComponent, Component, h} from '../../lib';

export class ProxyApp extends ProxyComponent {
  get localConfig() {
    return {
      // forces a re-render in test context
      updateSync: true,
    };
  }

  getTargetElementTag() {
    // This element will change its behavior if passed an href.
    return this.getAttribute(`href`) ? `a` : `event-producer`;
  }

  get observedEvents() {
    return [`nonComposedEvent`, `composedEvent`];
  }

  static get observedAttributes() {
    return [`href`].concat(EventProducer.observedAttributes);
  }
}

export class EventProducer extends Component {
  get config() {
    return {
      template: () => h(`div`, `I make things happen!`),
      useShadowDom: true,
    };
  }

  attributeChangedCallback(name) {
    if (name === `send-non-composed`) {
      this.dispatchEvent(new CustomEvent(`nonComposedEvent`, {bubbles: true, composed: false}));
    } else if (name === `send-composed`) {
      this.dispatchEvent(new CustomEvent(`composedEvent`, {bubbles: true, composed: true}));
    }
  }

  static get observedAttributes() {
    return [`send-non-composed`, `send-composed`];
  }
}
