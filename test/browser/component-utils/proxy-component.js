/* eslint-env mocha */
/* global expect */

describe(`ProxyComponent`, function() {
  let el;

  beforeEach(function(done) {
    document.body.innerHTML = ``;
    el = document.createElement(`proxy-app`);
    el.setAttribute(`data-foo`, `bar`);
    document.body.appendChild(el);
    window.requestAnimationFrame(() => done());
  });

  it(`renders the target element with attributes`, function() {
    const child = document.querySelector(`event-producer`);
    expect(child).to.not.eq(null);
    expect(child.getAttribute(`data-foo`)).to.eq(`bar`);
  });

  it(`re-dispatches events from child that are not composed`, function(done) {
    el.addEventListener(`nonComposedEvent`, () => done());
    el.setAttribute(`send-non-composed`, ``);
  });

  it(`bubbles composed events`, function(done) {
    el.addEventListener(`composedEvent`, () => done());
    el.setAttribute(`send-composed`, ``);
  });

  it(`re-calculates the target on update`, function() {
    el.setAttribute(`href`, `#local-link`);

    expect(document.querySelector(`a`)).to.not.eq(null);
    expect(document.querySelector(`event-producer`)).to.eq(null);
  });
});
