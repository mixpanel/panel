/* eslint-env mocha */
/* global expect */

import nextAnimationFrame from '../nextAnimationFrame';

describe(`Controlled App`, function() {
  let el;

  beforeEach(async function() {
    document.body.innerHTML = ``;
    el = document.createElement(`controlled-app`);
    document.body.appendChild(el);
    await nextAnimationFrame();
  });

  it(`does not allow update on component`, function() {
    expect(() => el.update({foo: `not bar`})).to.throw(/update\(\) not allowed from component. Use controller/);
  });

  it(`Behaves like normal component`, async function() {
    let count = 0;
    expect(el.controller.state).to.be.eql({count});
    expect(el.textContent).to.contain(`Counter: ${count}`);

    el.querySelector(`button.incr`).click();
    count += 1;
    expect(el.controller.state).to.be.eql({count});
    await nextAnimationFrame();
    expect(el.textContent).to.contain(`Counter: ${count}`);
  });
});
