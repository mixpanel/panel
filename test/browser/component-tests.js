/* eslint-env mocha */
/* global sinon, expect */
/* eslint no-unused-expressions:0 */

describe(`Simple Component instance`, function() {
  let el;

  beforeEach(function() {
    document.body.innerHTML = ``;
    el = document.createElement(`simple-app`);
  });

  describe(`toString()`, function() {
    it(`includes the tag name`, function() {
      expect(el.toString()).to.contain(`SIMPLE-APP`);
    });
  });

  describe(`panelID`, function() {
    it(`is unique for each component instance`, function() {
      const ids = Array(5).fill()
        .map(() => document.createElement(`simple-app`))
        .map(el => el.panelID);
      expect(ids).to.have.lengthOf(new Set(ids).size);
    });
  });

  describe(`config`, function() {
    it(`returns config object via getter`, function() {
      expect(el.config).to.be.an.instanceof(Object);
      expect(el.config.helpers).to.be.an.instanceof(Object);
    });

    it(`exposes helpers via a top-level getter`, function() {
      expect(el.helpers).to.be.an.instanceof(Object);
      expect(el.helpers.capitalize).to.be.an.instanceof(Function);
    });
  });

  context(`before attached to DOM`, function() {
    it(`does not affect the DOM`, function(done) {
      expect(document.getElementsByClassName(`foo`)).to.be.empty;
      window.requestAnimationFrame(() => {
        expect(document.getElementsByClassName(`foo`)).to.be.empty;
        done();
      });
    });

    it(`allows state setting`, function(done) {
      el.state = {foo: `not bar`};
      document.body.appendChild(el);
      expect(el.state.foo).to.equal(`not bar`);
      window.requestAnimationFrame(() => {
        expect(el.state.foo).to.equal(`not bar`);
        done();
      });
    });

    it(`allows updates and applies them when attached`, function(done) {
      el.update({foo: `not bar`});
      document.body.appendChild(el);
      expect(el.state.foo).to.equal(`not bar`);
      window.requestAnimationFrame(() => {
        expect(el.state.foo).to.equal(`not bar`);
        expect(el.textContent).to.contain(`Value of foo: not bar`);
        expect(el.textContent).to.contain(`Foo capitalized: Not bar`);
        done();
      });
    });

    it(`caches the last template once rendered`, function(done) {
      expect(el._rendered).to.be.undefined;
      document.body.appendChild(el);
      window.requestAnimationFrame(() => {
        expect(el._rendered).to.be.an(`object`);
        done();
      });
    });
  });

  context(`when attached to DOM`, function() {
    beforeEach(function(done) {
      document.body.appendChild(el);
      window.requestAnimationFrame(() => {
        done();
      });
    });

    it(`renders its template`, function() {
      expect(document.getElementsByClassName(`foo`)).to.have.lengthOf(1);
      expect(el.children).to.have.lengthOf(1);
      expect(el.children[0].className).to.equal(`foo`);
    });

    it(`injects default state into templates`, function() {
      expect(el.textContent).to.contain(`Value of foo: bar`);
    });

    it(`injects helpers into templates`, function() {
      expect(el.textContent).to.contain(`Foo capitalized: Bar`);
    });

    it(`re-renders when state is updated`, function(done) {
      expect(el.textContent).to.contain(`Value of foo: bar`);
      expect(el.textContent).to.contain(`Foo capitalized: Bar`);
      el.update({foo: `new value`});
      window.requestAnimationFrame(() => {
        expect(el.textContent).to.contain(`Value of foo: new value`);
        expect(el.textContent).to.contain(`Foo capitalized: New value`);
        done();
      });
    });

    it(`does not re-render if shouldUpdate() returns false`, function(done) {
      expect(el.textContent).to.contain(`Value of foo: bar`);

      el.update({foo: `meow`});
      window.requestAnimationFrame(() => {
        expect(el.textContent).to.contain(`Value of foo: bar`); // no change

        el.update({foo: `something else`});
        window.requestAnimationFrame(() => {
          expect(el.textContent).to.contain(`Value of foo: something else`);
          done();
        });
      });
    });
  });

  context(`when using shadow DOM`, function() {
    beforeEach(function(done) {
      el = document.createElement(`shadow-dom-app`);
      document.body.appendChild(el);
      window.requestAnimationFrame(() => {
        done();
      });
    });

    it(`creates and uses a shadow root`, function() {
      expect(el.el).not.to.equal(el);
      expect(el.shadowRoot).to.be.ok;
    });

    it(`successfully finds the panel root when top level uses shadow dom`, function(done) {
      const childEl = document.createElement(`nested-child`);
      window.requestAnimationFrame(() => {
        childEl.$panelParentID = el.panelID;
        el.shadowRoot.appendChild(childEl);
        window.requestAnimationFrame(() => {
          childEl.attachedCallback();
          expect(childEl.$panelRoot).to.equal(el);
          done();
        });
      });
    });

    it(`successfully finds the panel root when a nested child uses shadow dom`, function(done) {
      const rootEl = document.createElement(`nested-app`);
      document.body.appendChild(rootEl);
      window.requestAnimationFrame(() => {
        const level1El = document.createElement(`shadow-dom-app`);
        level1El.$panelParentID = rootEl.panelID;
        rootEl.appendChild(level1El);
        window.requestAnimationFrame(() => {
          const level2El = document.createElement(`nested-child`);
          level2El.$panelParentID = level1El.panelID;
          level1El.shadowRoot.appendChild(level2El);
          window.requestAnimationFrame(() => {
            expect(level2El.$panelParent).to.equal(level1El);
            expect(level2El.$panelRoot).to.equal(rootEl);
            done();
          });
        });
      });
    });

    it(`renders its template`, function() {
      expect(document.getElementsByClassName(`foo`)).to.have.lengthOf(0);
      expect(el.children).to.have.lengthOf(0);
      expect(el.shadowRoot.children[1].className).to.equal(`foo`);
    });

    it(`applies the styles`, function() {
      expect(el.shadowRoot.children[0].innerHTML).to.equal(`color: blue;`);
    });

    context(`when applying override styles`, function() {
      it(`appends the overriding styles to the default styles`, function(done) {
        el.setAttribute(`style-override`, `background: red;`);
        window.requestAnimationFrame(() => {
          expect(el.shadowRoot.children[0].innerHTML).to.equal(`color: blue;background: red;`);
          done();
        });
      });

      it(`it applies the styles even if the component isn't attached to the DOM`, function() {
        el = document.createElement(`shadow-dom-app`);
        el.setAttribute(`style-override`, `background: red;`);
        expect(el.shadowRoot.children[0].innerHTML).to.equal(`color: blue;background: red;`);
      });
    });
  });
});

describe(`Nested Component instance`, function() {
  let el, childEl;

  context(`before child is rendered`, function() {
    beforeEach(function() {
      document.body.innerHTML = ``;
      childEl = null;
      el = document.createElement(`nested-app`);
    });

    it(`successfully finds the panel root`, function(done) {
      document.body.appendChild(el);
      window.requestAnimationFrame(() => {
        childEl = document.createElement(`nested-child`);
        childEl.$panelParentID = el.panelID;
        el.appendChild(childEl);
        window.requestAnimationFrame(() => {
          expect(childEl.$panelRoot).to.equal(el);
          done();
        });
      });
    });

    it(`successfully finds a panel parent node by a given tag name`, function(done) {
      document.body.appendChild(el);
      window.requestAnimationFrame(() => {
        childEl = document.createElement(`nested-child`);
        childEl.$panelParentID = el.panelID;
        el.appendChild(childEl);
        window.requestAnimationFrame(() => {
          expect(childEl.findPanelParentByTagName(`nested-app`)).to.equal(el);
          done();
        });
      });
    });

    it(`passes state updates from child to parent`, function() {
      el.attachedCallback();
      childEl = document.createElement(`nested-child`);
      childEl.$panelParentID = el.panelID;
      childEl.$panelParent = childEl.$panelRoot = el;
      childEl.attachedCallback();
      childEl.update({animal: `capybara`});
      expect(el.state.animal).to.equal(`capybara`);
    });
  });

  context(`when attached to DOM`, function() {
    beforeEach(function(done) {
      document.body.innerHTML = ``;
      el = document.createElement(`nested-app`);
      document.body.appendChild(el);
      window.requestAnimationFrame(() => {
        childEl = el.getElementsByTagName(`nested-child`)[0];
        done();
      });
    });

    it(`renders the parent component`, function() {
      expect(document.getElementsByClassName(`nested-foo`)).to.have.lengthOf(1);
      expect(el.children).to.have.lengthOf(1);
      expect(el.children[0].className).to.equal(`nested-foo`);
    });

    it(`renders the child component`, function() {
      expect(document.getElementsByClassName(`nested-foo-child`)).to.have.lengthOf(1);
      expect(childEl.children[0].className).to.equal(`nested-foo-child`);
    });

    it(`passes parent state to the child component`, function() {
      expect(childEl.textContent).to.include(`parent title: test`);
    });

    it(`passes attributes to the child component`, function() {
      expect(childEl.textContent).to.include(`animal: llama`);
    });

    it(`passes state updates from parent to child`, function(done) {
      expect(childEl.textContent).to.include(`animal: llama`);
      el.update({animal: `capybara`});
      window.requestAnimationFrame(() => {
        expect(childEl.textContent).to.include(`animal: capybara`);
        done();
      });
    });

    it(`passes state updates from child to parent`, function(done) {
      expect(el.textContent).to.include(`Nested app: test`);
      expect(childEl.textContent).to.include(`parent title: test`);
      childEl.update({title: `new title`});
      window.requestAnimationFrame(() => {
        expect(el.textContent).to.include(`Nested app: new title`);
        expect(childEl.textContent).to.include(`parent title: new title`);
        done();
      });
    });
  });
});


describe(`Rendering exception`, function() {
  let el;

  beforeEach(function(done) {
    document.body.innerHTML = ``;
    el = document.createElement(`breakable-app`);
    el.logError = sinon.spy();
    document.body.appendChild(el);
    window.requestAnimationFrame(() => {
      done();
    });
  });

  it(`does not prevent component from initializing`, function() {
    expect(el.initialized).to.be.ok;
  });

  it(`logs an error`, function() {
    expect(el.logError.getCall(0).args[0]).to.contain(`Error while rendering`);
    expect(el.logError.getCall(0).args[0]).to.contain(`BREAKABLE-APP`);
  });

  it(`does not prevent further updates from rendering`, function(done) {
    expect(el.textContent).not.to.contain(`Value of foo.bar`);
    el.update({foo: {bar: `later success`}});
    window.requestAnimationFrame(() => {
      expect(el.textContent).to.contain(`Value of foo.bar: later success`);
      done();
    });
  });
});

describe(`Controlled App`, function() {
  let el;

  beforeEach(function(done) {
    document.body.innerHTML = ``;
    el = document.createElement(`controlled-app`);
    document.body.appendChild(el);
    window.requestAnimationFrame(() => done());
  });

  it(`does not allow update on component`, function() {
    expect(() => el.update({foo: `not bar`})).to.throw(/update\(\) not allowed from component. Use controller/);
  });

  it(`Behaves like normal component`, function(done) {
    let count = 0;
    expect(el.controller.state).to.be.eql({count});
    expect(el.textContent).to.contain(`Counter: ${count}`);

    el.querySelector(`button.incr`).click();
    count += 1;
    expect(el.controller.state).to.be.eql({count});

    window.requestAnimationFrame(() => {
      expect(el.textContent).to.contain(`Counter: ${count}`);
      done();
    });
  });
});

