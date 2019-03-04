/* eslint-env mocha */
import '../../lib/isorender/dom-shims';

import {expect} from 'chai';

import {SimpleApp} from '../fixtures/simple-app';

customElements.define(`my-app`, SimpleApp);

describe(`customElements registry`, function() {
  describe(`.get()`, function() {
    it(`returns component class`, function() {
      expect(customElements.get(`my-app`)).to.eql(SimpleApp);
    });
  });

  describe(`.define()`, function() {
    it(`called twice throws an error`, function() {
      expect(() => customElements.define(`my-app`, SimpleApp))
        .to.throw(`Registration failed for type 'my-app'. A type with that name is already registered.`); });
  });
});
