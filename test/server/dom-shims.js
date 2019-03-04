/* eslint-env mocha */

import '../../lib/isorender/dom-shims';

import {expect} from 'chai';

import {SimpleApp} from '../fixtures/simple-app';

customElements.define(`my-app`, SimpleApp);

describe(`customElements registry`, function() {
  describe(`.get()`, function() {
    it(`returns component class`, function() {
      expect(customElements.get(`my-app`)).to.equal(SimpleApp);
    });
  });

  describe(`.define()`, function() {
    it(`throws an error if called twice with the same tag name`, function() {
      expect(() => customElements.define(`my-app`, SimpleApp))
        .to.throw(`Registration failed for type 'my-app'. A type with that name is already registered.`); });
  });
});
