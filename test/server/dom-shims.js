import '../../lib/isorender/dom-shims';

import chai, {expect} from 'chai';
import sinon from 'sinon';

import sinonChai from 'sinon-chai';
chai.use(sinonChai);

import nextAnimationFrame from './nextAnimationFrame';
import {SimpleApp} from '../fixtures/simple-app';
import {ShadowDomApp} from '../fixtures/shadow-dom-app';

customElements.define(`my-app`, SimpleApp);
customElements.define(`shadow-dom-app`, ShadowDomApp);

describe(`customElements registry`, function () {
  describe(`.get()`, function () {
    it(`returns component class`, function () {
      expect(customElements.get(`my-app`)).to.equal(SimpleApp);
    });
  });

  describe(`.define()`, function () {
    it(`throws an error if called twice with the same tag name`, function () {
      expect(() => customElements.define(`my-app`, SimpleApp)).to.throw(
        `Registration failed for type 'my-app'. A type with that name is already registered.`,
      );
    });
  });
});

describe(`customElement with shadowDom`, function () {
  it(`el contains shadow-root`, function () {
    const elem = document.createElement(`shadow-dom-app`);
    expect(elem.el.tagName).to.equal(`shadow-root`);
    expect(elem.el).to.equal(elem.shadowRoot);
  });

  it(`renders component`, async function () {
    const elem = document.createElement(`shadow-dom-app`);
    elem.connectedCallback();
    await nextAnimationFrame();

    expect(elem.el.innerHTML).to.equal(`<style>:host { color: blue; }</style><div class="foo"><p>Hello</p></div>`);
  });
});

describe(`customElement callbacks`, function () {
  it(`calls connectedCallback and disconnectedCallback when adding/removing from DOM`, async function () {
    const elem = document.createElement(`my-app`);
    const connectedCallbackSpy = sinon.spy(elem, `connectedCallback`);
    const disconnectedCallbackSpy = sinon.spy(elem, `disconnectedCallback`);

    expect(elem.isConnected).to.not.exist;

    // fake adding to DOM
    document.body = document.createElement(`body`);
    document.body.appendChild(elem);

    await nextAnimationFrame();
    expect(connectedCallbackSpy).to.have.been.called;
    expect(elem.isConnected).to.be.true;

    document.body.removeChild(elem);
    expect(disconnectedCallbackSpy).to.have.been.called;
  });

  it(`calls attributeChangedCallback when adding/removing attributes`, function () {
    const elem = document.createElement(`attrs-reflection-app`);
    const attributeChangedCallbackSpy = sinon.spy(elem, `attributeChangedCallback`);

    elem.connectedCallback();

    elem.setAttribute(`str-attr`, `hello`);
    expect(elem.hasAttribute(`str-attr`)).to.be.true;
    expect(attributeChangedCallbackSpy).to.have.been.calledWith(`str-attr`, null, `hello`);

    elem.removeAttribute(`str-attr`);
    expect(elem.hasAttribute(`str-attr`)).to.be.false;
    expect(attributeChangedCallbackSpy).to.have.been.calledWith(`str-attr`, `hello`, null);
  });
});
