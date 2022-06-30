/* eslint-env node */
/**
 * Node.js polyfill for rendering Panel components without a browser.
 * Makes the following objects globally available:
 * Comment, document, Document, Element, HTMLElement, Node, requestAnimationFrame, Text.
 * Most of the available DOM API functionality is provided by
 * [html-element]{@link https://github.com/1N50MN14/html-element}, with some patches for
 * the Web Components API.
 *
 * @module isorender/dom-shims
 *
 * @example <caption>Rendering app HTML to stdout</caption>
 * import 'panel/isorender/dom-shims';
 * import { Component } from 'panel';
 * customElements.define('my-widget', class extends Component {
 *   // app definition
 * });
 * const myWidget = document.createElement('my-widget');
 * document.body.appendChild(myWidget);
 * requestAnimationFrame(() => console.log(myWidget.outerHTML));
 */

import 'html-element/global-shim';

// make raf globally available unless a requestAnimationFrame implementation
// is already there
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// run a callback for every node of the DOM (sub)tree rooted at the given root node
function walkDomTree(root, callback) {
  // basic breadth-first tree traversal (non-recursive)
  const breadthQueue = [root];
  while (breadthQueue.length > 0) {
    const node = breadthQueue.shift();
    callback(node);
    for (const child of Array.from(node.childNodes || [])) {
      breadthQueue.push(child);
    }
    if (node.shadowRoot) {
      for (const child of Array.from(node.shadowRoot.childNodes || [])) {
        breadthQueue.push(child);
      }
    }
  }
}

// patch DOM insertion functions to call connectedCallback on Custom Elements
[`appendChild`, `insertBefore`, `replaceChild`].forEach((funcName) => {
  const origFunc = Element.prototype[funcName];
  Element.prototype[funcName] = function () {
    const child = origFunc.apply(this, arguments);
    if (this.isConnected) {
      walkDomTree(child, function (node) {
        if (!node.isConnected) {
          node.isConnected = true;
          if (node.connectedCallback) {
            node.connectedCallback();
          }
        }
      });
    }
  };
});

// patch removeChild to call disconnectedCallback
const origRemoveChild = Element.prototype.removeChild;
Element.prototype.removeChild = function (child) {
  origRemoveChild.call(this, child);
  if (this.isConnected) {
    walkDomTree(child, function (node) {
      if (node.isConnected) {
        node.isConnected = false;
        if (node.disconnectedCallback) {
          node.disconnectedCallback();
        }
      }
    });
  }
  return child;
};

Node.DOCUMENT_FRAGMENT_NODE = 11;

// html-element does not provide hasAttribute
Element.prototype.hasAttribute = function (name) {
  return this.getAttribute(name) !== null;
};

// html-element only provides Element (with a lot of the HTMLElement API baked in).
// Use HTMLElement as our Web Components-ready extension.
class HTMLElement extends Element {
  setAttribute(name, value) {
    const oldValue = this.getAttribute(name);
    super.setAttribute(...arguments);
    this.__onAttrChanged(name, oldValue, value);
  }

  removeAttribute(name) {
    const oldValue = this.getAttribute(name);
    super.removeAttribute(...arguments);
    this.__onAttrChanged(name, oldValue, null);
  }

  attachShadow() {
    this.shadowRoot = document.createElement(`shadow-root`);
    this.shadowRoot.nodeType = Node.DOCUMENT_FRAGMENT_NODE;
    this.shadowRoot.host = this;
    if (this.isConnected) {
      this.shadowRoot.isConnected = true;
    }
    return this.shadowRoot;
  }

  __attrIsObserved(name) {
    if (!this.__observedAttrs) {
      this.__observedAttrs = this.constructor.observedAttributes || [];
    }
    return this.__observedAttrs.includes(name);
  }

  __onAttrChanged(name, oldValue, newValue) {
    if (this.attributeChangedCallback && this.__attrIsObserved(name)) {
      this.attributeChangedCallback && this.attributeChangedCallback(name, oldValue, newValue);
    }
  }
}

global.HTMLElement = HTMLElement;

// Document patches for Custom Elements

const customElementsRegistry = (global._customElementsRegistry = global._customElementsRegistry || {});

const originalCreateElement = Document.prototype.createElement;
Document.prototype.createElement = function (tagName) {
  tagName = tagName.toLowerCase();
  const customElClass = customElementsRegistry[tagName];
  let el;
  if (customElClass) {
    el = new customElClass();
    el.nodeName = el.tagName = tagName;
  } else {
    el = originalCreateElement(...arguments);
  }
  if (tagName === `body`) {
    el.isConnected = true;
  }
  return el;
};

global.customElements = global.customElements || {
  get(tagName) {
    return customElementsRegistry[tagName];
  },

  define(tagName, proto) {
    tagName = tagName.toLowerCase();
    if (customElementsRegistry[tagName]) {
      throw new Error(`Registration failed for type '${tagName}'. A type with that name is already registered.`);
    } else {
      customElementsRegistry[tagName] = proto;
    }
  },
};
