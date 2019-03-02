/* eslint-env mocha */
import '../../lib/isorender/dom-shims';

import {expect} from 'chai';

import {SimpleApp} from '../fixtures/simple-app';

customElements.define(`my-app`, SimpleApp);

describe(`customElements registry`, function() {
  it(`.get() returns component class`, function() {
    expect(customElements.get(`my-app`)).to.eql(SimpleApp);
  });

  it(`double .define() throws an error`, function() {
    expect(() => customElements.define(`my-app`, SimpleApp))
      .to.throw(`CustomElementRegistryError: 'my-app' name has already been registered`);
  });
});
