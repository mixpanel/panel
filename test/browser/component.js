import sinon from 'sinon';
import {expect} from 'chai';
import {nextAnimationFrame, sleep} from 'domsuite';
import {BreakableApp} from '../fixtures/breakable-app';
import {compactHtml} from '../utils';
import {LightTheme, DarkTheme} from '../fixtures/simple-contexts';
import * as Perf from '../../lib/component-utils/perf';

describe(`Simple Component instance`, function () {
  let el;

  beforeEach(function () {
    document.body.innerHTML = ``;
    el = document.createElement(`simple-app`);
  });

  describe(`toString()`, function () {
    it(`includes the tag name`, function () {
      expect(el.toString()).to.contain(`simple-app`);
    });
  });

  describe(`panelID`, function () {
    it(`is unique for each component instance`, function () {
      const ids = Array(5)
        .fill()
        .map(() => document.createElement(`simple-app`))
        .map((el) => el.panelID);
      expect(ids).to.have.lengthOf(new Set(ids).size);
    });
  });

  describe(`config`, function () {
    it(`returns config object via getter`, function () {
      expect(el.config).to.be.an.instanceof(Object);
      expect(el.config.helpers).to.be.an.instanceof(Object);
    });

    it(`exposes helpers via a top-level getter`, function () {
      expect(el.helpers).to.be.an.instanceof(Object);
      expect(el.helpers.capitalize).to.be.an.instanceof(Function);
    });
  });

  context(`before attached to DOM`, function () {
    it(`does not affect the DOM`, async function () {
      expect(document.querySelector(`.foo`)).to.be.null;
      await nextAnimationFrame();
      expect(document.querySelector(`.foo`)).to.be.null;
    });

    it(`allows state setting`, async function () {
      el.state = {foo: `not bar`};
      document.body.appendChild(el);
      expect(el.state.foo).to.equal(`not bar`);
      await nextAnimationFrame();
      expect(el.state.foo).to.equal(`not bar`);
    });

    it(`allows updates and applies them when attached`, async function () {
      el.update({foo: `not bar`});
      document.body.appendChild(el);
      expect(el.state.foo).to.equal(`not bar`);
      await nextAnimationFrame();
      expect(el.state.foo).to.equal(`not bar`);
      expect(el.textContent).to.contain(`Value of foo: not bar`);
      expect(el.textContent).to.contain(`Foo capitalized: Not bar`);
    });

    it(`caches the last template once rendered`, async function () {
      expect(el._rendered).to.be.undefined;
      document.body.appendChild(el);
      await nextAnimationFrame();
      expect(el._rendered).to.be.an(`object`);
    });
  });

  context(`when attached to DOM`, function () {
    beforeEach(async function () {
      document.body.appendChild(el);
      await nextAnimationFrame();
    });

    it(`renders its template`, function () {
      expect(document.getElementsByClassName(`foo`)).to.have.lengthOf(1);
      expect(el.children).to.have.lengthOf(1);
      expect(el.children[0].className).to.equal(`foo`);
    });

    it(`injects default state into templates`, function () {
      expect(el.textContent).to.contain(`Value of foo: bar`);
    });

    it(`injects helpers into templates`, function () {
      expect(el.textContent).to.contain(`Foo capitalized: Bar`);
    });

    it(`re-renders when state is updated`, async function () {
      expect(el.textContent).to.contain(`Value of foo: bar`);
      expect(el.textContent).to.contain(`Foo capitalized: Bar`);
      el.update({foo: `new value`});
      await nextAnimationFrame();
      expect(el.textContent).to.contain(`Value of foo: new value`);
      expect(el.textContent).to.contain(`Foo capitalized: New value`);
    });

    it(`re-renders when state is updated with update function`, async function () {
      expect(el.textContent).to.contain(`Value of foo: bar`);
      expect(el.textContent).to.contain(`Foo capitalized: Bar`);
      el.update(() => ({foo: `new value`}));
      await nextAnimationFrame();
      expect(el.textContent).to.contain(`Value of foo: new value`);
      expect(el.textContent).to.contain(`Foo capitalized: New value`);
    });

    it(`re-renders when state is updated with function accessing existing state`, async function () {
      expect(el.textContent).to.contain(`Value of foo: bar`);
      expect(el.textContent).to.contain(`Foo capitalized: Bar`);
      el.update((state) => ({foo: `new ${state.foo}`}));
      await nextAnimationFrame();
      expect(el.textContent).to.contain(`Value of foo: new bar`);
      expect(el.textContent).to.contain(`Foo capitalized: New bar`);
    });

    it(`does not re-render if shouldUpdate() returns false`, async function () {
      expect(el.textContent).to.contain(`Value of foo: bar`);
      el.update({foo: `meow`});
      await nextAnimationFrame();
      expect(el.textContent).to.contain(`Value of foo: bar`); // no change
      el.update({foo: `something else`});
      await nextAnimationFrame();
      expect(el.textContent).to.contain(`Value of foo: something else`);
    });

    it(`passes full state context to shouldUpdate()`, async function () {
      expect(el.textContent).to.contain(`Value of baz: qux`);
      el.update({baz: `llamas`});
      await nextAnimationFrame();
      expect(el.textContent).to.contain(`Value of baz: llamas`);
    });

    it(`fires update hooks`, function () {
      expect(el.preFoo).to.be.undefined;
      expect(el.postFoo).to.be.undefined;
      el.update({foo: `llamas`});
      expect(el.preFoo).to.equal(`bar`);
      expect(el.postFoo).to.equal(`llamas`);
    });

    context(`root element special cases`, function () {
      it(`fires Snabbdom insert hook when the root element gets patched in place instead of inserted`, function () {
        el = document.createElement(`insert-hook-without-key`);
        expect(el.insertHookCalled).not.to.be.ok;
        document.body.appendChild(el);
        expect(el.insertHookCalled).to.be.true;
      });

      it(`uses Snabbdom's new root element if the patch process creates one`, async function () {
        el = document.createElement(`insert-hook-with-key`);
        expect(el.insertHookCalled).not.to.be.ok;
        document.body.appendChild(el);
        expect(el.insertHookCalled).to.be.true;
        await nextAnimationFrame();
        expect(el.textContent).to.contain(`Hello I'm in a keyed root element`);
      });
    });
  });

  context(`when detached from DOM`, function () {
    it(`cleans up references to be GC friendly`, async function () {
      document.body.appendChild(el);
      await nextAnimationFrame();
      document.body.removeChild(el);
      await nextAnimationFrame();

      expect(el.$panelRoot).to.be.null;
      expect(el.$panelParent).to.be.null;
      expect(el.appState).to.be.null;
      expect(el.app).to.be.null;
      expect(el.domPatcher).to.be.null;
      expect(el._rendered).to.be.null;
      expect(el.initialized).to.equal(false);
    });
  });

  context(`when detached and re-attached to DOM multiple times`, function () {
    it(`renders its template`, async function () {
      document.body.appendChild(el);
      await nextAnimationFrame();

      for (let i = 0; i < 5; ++i) {
        document.body.removeChild(el);
        await nextAnimationFrame();
        document.body.appendChild(el);
        await nextAnimationFrame();
      }

      expect(document.querySelector(`simple-app`)).to.equal(el);
      expect(el.textContent).to.equal([`Value of foo: bar`, `Value of baz: qux`, `Foo capitalized: Bar`].join(``));
    });
  });

  context(`when detached and attached via keyed children`, function () {
    beforeEach(async function () {
      document.body.innerHTML = ``;
      el = document.createElement(`nested-keyed-children-app`);
      el.setAttribute(`letters`, JSON.stringify([`a`, `b`, `c`, `d`, `e`]));
      document.body.appendChild(el);
      await nextAnimationFrame();
    });

    it(`renders its template after children change position`, async function () {
      expect(el.textContent).to.equal([`alpha`, `bravo`, `charlie`, `delta`, `echo`].join(``));

      el.setAttribute(`letters`, JSON.stringify([`e`, `c`, `a`, `d`, `b`]));
      await nextAnimationFrame();

      expect(el.textContent).to.equal([`echo`, `charlie`, `alpha`, `delta`, `bravo`].join(``));

      el.setAttribute(`letters`, JSON.stringify([`d`, `b`, `a`]));
      await nextAnimationFrame();

      expect(el.textContent).to.equal([`delta`, `bravo`, `alpha`].join(``));
    });

    it(`doesn't clear parent references if immediately added back`, async function () {
      const childEl = el.querySelector(`nested-keyed-child1`);
      const parentEl = childEl.parentElement;

      parentEl.removeChild(childEl);
      expect(childEl.$panelParent).to.be.ok;
      expect(childEl.app).to.equal(el);

      parentEl.appendChild(childEl);
      expect(childEl.$panelParent).to.be.ok;
      expect(childEl.app).to.equal(el);

      await nextAnimationFrame();
      expect(childEl.$panelParent).to.be.ok;
      expect(childEl.app).to.equal(el);
    });

    it(`clears parent references after a frame`, async function () {
      const childEl = el.querySelector(`nested-keyed-child1`);
      const parentEl = childEl.parentElement;

      parentEl.removeChild(childEl);
      expect(childEl.$panelParent).to.be.ok;
      expect(childEl.app).to.equal(el);

      await nextAnimationFrame();
      expect(childEl.$panelParent).to.be.null;
      expect(childEl.app).to.be.null;

      // add child back otherwise vdom sync will barf
      parentEl.appendChild(childEl);
    });
  });

  context(`when using shadow DOM`, function () {
    beforeEach(async function () {
      el = document.createElement(`shadow-dom-app`);
      document.body.appendChild(el);
      await nextAnimationFrame();
    });

    it(`creates and uses a shadow root`, function () {
      expect(el.el).not.to.equal(el);
      expect(el.shadowRoot).to.be.ok;
    });

    it(`successfully finds the panel root when top level uses shadow dom`, async function () {
      const childEl = document.createElement(`nested-child`);
      await nextAnimationFrame();
      childEl.$panelParentID = el.panelID;
      el.shadowRoot.appendChild(childEl);
      await nextAnimationFrame();
      childEl.connectedCallback();
      expect(childEl.$panelRoot).to.equal(el);
    });

    it(`successfully finds the panel root when a nested child uses shadow dom`, async function () {
      const rootEl = document.createElement(`nested-app`);
      document.body.appendChild(rootEl);
      await nextAnimationFrame();
      const level1El = document.createElement(`shadow-dom-app`);
      level1El.$panelParentID = rootEl.panelID;
      rootEl.appendChild(level1El);
      await nextAnimationFrame();
      const level2El = document.createElement(`nested-child`);
      level2El.$panelParentID = level1El.panelID;
      level1El.shadowRoot.appendChild(level2El);
      await nextAnimationFrame();
      expect(level2El.$panelParent).to.equal(level1El);
      expect(level2El.$panelRoot).to.equal(rootEl);
    });

    it(`renders its template`, function () {
      expect(el.children).to.have.lengthOf(0);
      expect(el.shadowRoot.children[1].className).to.equal(`foo`);
    });

    it(`applies the styles`, function () {
      expect(el.shadowRoot.children[0].innerHTML).to.equal(`color: blue;`);
    });

    context(`when applying override styles`, function () {
      it(`appends the overriding styles to the default styles`, async function () {
        el.setAttribute(`style-override`, `background: red;`);
        await nextAnimationFrame();
        expect(el.shadowRoot.children[0].innerHTML).to.equal(`color: blue;background: red;`);
      });

      it(`it applies the styles even if the component isn't attached to the DOM`, function () {
        el = document.createElement(`shadow-dom-app`);
        el.setAttribute(`style-override`, `background: red;`);
        expect(el.shadowRoot.children[0].innerHTML).to.equal(`color: blue;background: red;`);
      });
    });
  });
});

describe(`Simple Component instance with attrsSchema`, function () {
  let el;

  beforeEach(async function () {
    document.body.innerHTML = ``;
    el = document.createElement(`attrs-reflection-app`);
    el.setAttribute(`str-attr`, `world`);

    document.body.appendChild(el);
    await nextAnimationFrame();
  });

  it(`renders template`, function () {
    expect(el.innerHTML).to.equal(
      compactHtml(`
      <div class="attrs-reflection-app">
        <p>str-attr: "world"</p>
        <p>bool-attr: false</p>
        <p>number-attr: 0</p>
        <p>json-attr: null</p>
      </div>
    `),
    );
  });

  it(`updates attrs`, function () {
    expect(el.attrs()).to.deep.equal({
      'str-attr': `world`,
      'bool-attr': false,
      'number-attr': 0,
      'json-attr': null,
    });
  });

  it(`reacts to attr updates`, async function () {
    el.setAttribute(`str-attr`, `💩🤒🤢☠️ -> 👻🎉💐🎊😱😍`);
    el.setAttribute(`bool-attr`, `false`);
    el.setAttribute(`number-attr`, `500843`);
    el.setAttribute(`json-attr`, `{"foo": "bae"}`);

    expect(el.attrs()).to.deep.equal({
      'str-attr': `💩🤒🤢☠️ -> 👻🎉💐🎊😱😍`,
      'bool-attr': false,
      'number-attr': 500843,
      'json-attr': {foo: `bae`},
    });

    await nextAnimationFrame();

    expect(el.innerHTML).to.equal(
      compactHtml(`
    <div class="attrs-reflection-app">
      <p>str-attr: "💩🤒🤢☠️ -&gt; 👻🎉💐🎊😱😍"</p>
      <p>bool-attr: false</p>
      <p>number-attr: 500843</p>
      <p>json-attr: {"foo":"bae"}</p>
    </div>
  `),
    );
  });

  it(`can query schema from customElements registry`, async function () {
    const component = customElements.get(`attrs-reflection-app`);
    expect(component.attrsSchema).to.deep.equal({
      'str-attr': {
        type: `string`,
        default: `hello`,
        enum: [`hello`, `world`, `💩🤒🤢☠️ -> 👻🎉💐🎊😱😍`],
      },
      'bool-attr': `boolean`,
      'number-attr': `number`,
      'json-attr': `json`,
    });

    expect(component.observedAttributes).to.deep.equal([
      `style-override`,
      `str-attr`,
      `bool-attr`,
      `number-attr`,
      `json-attr`,
    ]);
  });

  it(`has default attrs present after createElement`, function () {
    el = document.createElement(`attrs-reflection-app`);
    expect(el.attrs()).to.deep.equal({
      'str-attr': `hello`,
      'bool-attr': false,
      'number-attr': 0,
      'json-attr': null,
    });
    // _config is initialised in constructor. defaultState should be able to access el.attrs()
    expect(el._config.defaultState.str).to.equal(`hello`);
  });
});

describe(`Nested Component instance`, function () {
  let el, childEl;

  context(`before child is rendered`, function () {
    beforeEach(function () {
      document.body.innerHTML = ``;
      childEl = null;
      el = document.createElement(`nested-app`);
    });

    it(`successfully finds the panel root`, async function () {
      document.body.appendChild(el);
      await nextAnimationFrame();
      childEl = document.createElement(`nested-child`);
      childEl.$panelParentID = el.panelID;
      el.appendChild(childEl);
      await nextAnimationFrame();
      expect(childEl.$panelRoot).to.equal(el);
    });

    it(`successfully finds a panel parent node by a given tag name`, async function () {
      document.body.appendChild(el);
      await nextAnimationFrame();
      childEl = document.createElement(`nested-child`);
      childEl.$panelParentID = el.panelID;
      el.appendChild(childEl);
      await nextAnimationFrame();
      expect(childEl.findPanelParentByTagName(`nested-app`)).to.equal(el);
    });

    it(`flushes child state updates to parent`, function () {
      el.connectedCallback();
      expect(el.state).to.not.have.property(`childAnimal`);
      childEl = document.createElement(`nested-child`);
      childEl.$panelParentID = el.panelID;
      childEl.$panelParent = childEl.$panelRoot = el;
      // state updates happening in child menu should be flushed to parent when connected
      childEl.setAttribute(`child-animal`, `attribute-animal`);
      childEl.update({animal: `capybara`});
      childEl.connectedCallback();

      expect(childEl.state).to.include({
        animal: `capybara`,
        childAnimal: `attribute-animal`,
      });
      expect(el.state).to.include({
        animal: `capybara`,
        childAnimal: `attribute-animal`,
      });
    });
  });

  context(`when attached to DOM`, function () {
    beforeEach(async function () {
      document.body.innerHTML = ``;
      el = document.createElement(`nested-app`);
      document.body.appendChild(el);
      await nextAnimationFrame();
      childEl = el.getElementsByTagName(`nested-child`)[0];
    });

    it(`renders the parent component`, function () {
      expect(document.getElementsByClassName(`nested-foo`)).to.have.lengthOf(1);
      expect(el.children).to.have.lengthOf(1);
      expect(el.children[0].className).to.equal(`nested-foo`);
    });

    it(`renders the child component`, function () {
      expect(document.getElementsByClassName(`nested-foo-child`)).to.have.lengthOf(1);
      expect(childEl.children[0].className).to.equal(`nested-foo-child`);
    });

    it(`passes parent state to the child component`, function () {
      expect(childEl.textContent).to.include(`parent title: test`);
    });

    it(`flushes child state to parent state`, function () {
      expect(childEl.textContent).to.include(`child animal: fox`);
    });

    it(`passes attributes to the child component`, function () {
      expect(childEl.textContent).to.include(`animal: llama`);
    });

    it(`passes state updates from parent to child`, async function () {
      expect(childEl.textContent).to.include(`animal: llama`);
      el.update({animal: `capybara`});
      await nextAnimationFrame();
      expect(childEl.textContent).to.include(`animal: capybara`);
    });

    it(`passes state updates from child to parent`, async function () {
      expect(el.textContent).to.include(`Nested app: test`);
      expect(childEl.textContent).to.include(`parent title: test`);
      childEl.update({title: `new title`});
      await nextAnimationFrame();
      expect(el.textContent).to.include(`Nested app: new title`);
      expect(childEl.textContent).to.include(`parent title: new title`);
    });

    it(`fires parent update hooks when child updates`, function () {
      expect(el.nestedPreTitle).to.be.undefined;
      expect(el.nestedPostTitle).to.be.undefined;
      childEl.update({title: `new title`});
      expect(el.nestedPreTitle).to.equal(`test`);
      expect(el.nestedPostTitle).to.equal(`new title`);
    });
  });
});

describe(`Nested Component instance with partially shared state`, function () {
  let parentEl, childEl;

  context(`before child is rendered`, function () {
    beforeEach(function () {
      document.body.innerHTML = ``;
      childEl = null;
      parentEl = document.createElement(`nested-partial-state-parent`);
    });

    it(`passes shared app state updates from child to parent`, function () {
      parentEl.connectedCallback();
      childEl = document.createElement(`nested-partial-state-child`);
      childEl.$panelParentID = parentEl.panelID;
      childEl.$panelParent = childEl.$panelRoot = parentEl;
      // app state updates happening in child menu should be flushed to parent when connected
      childEl.setAttribute(`child-animal`, `attribute-animal`);
      childEl.updateApp({title: `new title!`});
      childEl.connectedCallback();
      expect(parentEl.appState).to.include({
        title: `new title!`,
        childAnimal: `attribute-animal`,
      });
    });
  });

  context(`when attached to DOM`, function () {
    beforeEach(async function () {
      document.body.innerHTML = ``;
      parentEl = document.createElement(`nested-partial-state-parent`);
      document.body.appendChild(parentEl);
      await nextAnimationFrame();
      childEl = parentEl.getElementsByTagName(`nested-partial-state-child`)[0];
    });

    it(`passes only shared app state to the child component`, function () {
      expect(parentEl.textContent).to.include(`Nested partial shared state app title: test`);
      expect(parentEl.textContent).to.include(`component-specific title: parent-specific title`);
      expect(parentEl.textContent).to.include(`parent: parentOnlyState: hello`);
      expect(childEl.textContent).to.include(`shared title: test`);
      expect(childEl.textContent).to.include(`component-specific title: child-specific title`);
      expect(childEl.textContent).to.include(`child: parentOnlyState: undefined`);
    });

    it(`flushes shared app state from child to parent`, function () {
      expect(childEl.textContent).to.include(`shared child animal: fox`);
    });

    it(`passes only shared app state updates from parent to child`, async function () {
      expect(childEl.textContent).to.include(`shared title: test`);
      expect(parentEl.textContent).to.include(`parent: nonSharedStateExample: I am parent`);
      expect(childEl.textContent).to.include(`child: nonSharedStateExample: I am child`);

      parentEl.updateApp({title: `llamas!`});
      parentEl.update({
        parentOnlyState: `goodbye`,
        nonSharedStateExample: `updated parent`,
      });
      await nextAnimationFrame();
      // shared app state changed
      expect(parentEl.textContent).to.include(`Nested partial shared state app title: llamas!`);
      expect(childEl.textContent).to.include(`shared title: llamas!`);

      // component-specific state entries didn't change
      expect(parentEl.textContent).to.include(`component-specific title: parent-specific title`);
      expect(childEl.textContent).to.include(`component-specific title: child-specific title`);

      expect(parentEl.textContent).to.include(`parent: parentOnlyState: goodbye`);
      expect(childEl.textContent).to.include(`child: parentOnlyState: undefined`);

      expect(parentEl.textContent).to.include(`parent: nonSharedStateExample: updated parent`);
      expect(childEl.textContent).to.include(`child: nonSharedStateExample: I am child`);
    });

    it(`passes only shared app state updates from child to parent`, async function () {
      expect(parentEl.textContent).to.include(`Nested partial shared state app title: test`);
      expect(childEl.textContent).to.include(`shared title: test`);
      expect(childEl.textContent).to.include(`childOnlyState: world`);

      expect(parentEl.textContent).to.include(`parent: nonSharedStateExample: I am parent`);
      expect(childEl.textContent).to.include(`child: nonSharedStateExample: I am child`);

      childEl.updateApp({title: `new title`});
      childEl.update({
        childOnlyState: `mooo`,
        nonSharedStateExample: `updated child`,
      });
      await nextAnimationFrame();
      // shared app state changed
      expect(parentEl.textContent).to.include(`Nested partial shared state app title: new title`);
      expect(childEl.textContent).to.include(`shared title: new title`);

      // component-specific state entries didn't change
      expect(parentEl.textContent).to.include(`component-specific title: parent-specific title`);
      expect(childEl.textContent).to.include(`component-specific title: child-specific title`);

      expect(parentEl.textContent).to.include(`parent: parentOnlyState: hello`);
      expect(childEl.textContent).to.include(`childOnlyState: mooo`);

      expect(parentEl.textContent).to.include(`parent: nonSharedStateExample: I am parent`);
      expect(childEl.textContent).to.include(`child: nonSharedStateExample: updated child`);
    });

    it(`supports state in parent and child with the same keys as shared app state but independent values`, async function () {
      expect(parentEl.textContent).to.include(`parent: nonSharedStateExample: I am parent`);
      expect(childEl.textContent).to.include(`child: nonSharedStateExample: I am child`);

      parentEl.update({nonSharedStateExample: `updated parent`});
      await nextAnimationFrame();
      expect(parentEl.textContent).to.include(`parent: nonSharedStateExample: updated parent`);
      expect(childEl.textContent).to.include(`child: nonSharedStateExample: I am child`);

      childEl.update({nonSharedStateExample: `updated child`});
      await nextAnimationFrame();
      expect(parentEl.textContent).to.include(`parent: nonSharedStateExample: updated parent`);
      expect(childEl.textContent).to.include(`child: nonSharedStateExample: updated child`);

      expect(parentEl.state.nonSharedStateExample).to.eql(`updated parent`);
      expect(childEl.state.nonSharedStateExample).to.eql(`updated child`);
    });
  });
});

describe(`Rendering exception`, function () {
  let el;
  let renderErrorSpy;

  beforeEach(async function () {
    document.body.innerHTML = ``;
    el = document.createElement(`breakable-app`);
    renderErrorSpy = sinon.spy();
    el.addEventListener(`renderError`, renderErrorSpy);
    el._logError = sinon.spy();
    document.body.appendChild(el);
    await nextAnimationFrame();
  });

  it(`does not prevent component from initializing`, function () {
    expect(el.initialized).to.be.ok;
  });

  it(`logs error and emits renderError event`, function () {
    const errorMessage = `Error while rendering`;
    expect(el._logError.getCall(0).args[0]).to.equal(errorMessage);

    const renderErrorEvent = renderErrorSpy.getCall(0).args[0];
    expect(renderErrorEvent.detail.error).to.be.instanceof(Error);
    expect(renderErrorEvent.detail.component).to.be.instanceof(BreakableApp);
  });

  it(`does not prevent further updates from rendering`, async function () {
    expect(el.textContent).not.to.contain(`Value of foo.bar`);
    el.update({foo: {bar: `later success`}});
    await nextAnimationFrame();
    expect(el.textContent).to.contain(`Value of foo.bar: later success`);
  });
});

describe(`slowRendering`, function () {
  let el;
  let slowRenderSpy;

  function stubNow(timings) {
    const getNowStub = sinon.stub(Perf, `getNow`);

    timings.forEach((val, idx, all) => {
      if (idx === all.length - 1) {
        getNowStub.returns(val);
      } else {
        getNowStub.onCall(idx).returns(val);
      }
    });

    return getNowStub;
  }

  beforeEach(async function () {
    document.body.innerHTML = ``;
    el = document.createElement(`simple-app`);
    slowRenderSpy = sinon.spy();
    el.addEventListener(`slowRender`, slowRenderSpy);
    document.body.appendChild(el);
    await nextAnimationFrame();
  });

  afterEach(() => {
    sinon.restore();
  });

  it(`emits slowRender event`, async function () {
    expect(slowRenderSpy.callCount).to.equal(0);
    stubNow([
      5, // update time
      5, // before render
      el.getConfig(`slowThreshold`), // after render
      el.getConfig(`slowThreshold`), // postRenderCallback time
      el.getConfig(`slowThreshold`), // update time
      el.getConfig(`slowThreshold`), // before render
      el.getConfig(`slowThreshold`) * 2 + 1, // after render
    ]);

    // force re-render
    el.update();
    await nextAnimationFrame();
    expect(slowRenderSpy.callCount).to.equal(0);

    // force re-render
    el.update();
    await nextAnimationFrame();
    expect(slowRenderSpy.callCount).to.equal(1);
    expect(slowRenderSpy.getCall(0).args[0].detail).to.deep.equal({
      elapsedMs: el.getConfig(`slowThreshold`) + 1,
      component: el.toString(),
    });
  });

  it(`swallows multiple slowRender events that happen within 3 seconds`, async function () {
    expect(slowRenderSpy.callCount).to.equal(0);

    stubNow([
      5, // updated at
      5, // before first redner
      100, // after first render
      100, // postRenderCallback time
      100, // current time slow render was emitted

      100, // updated at
      100, // before second render
      150, // after second render
      150, // postRenderCallback time
      150, // compare current time to last slow render

      3000, // updated at
      3000, // before third render
      3150,
    ]);

    el.update();
    await nextAnimationFrame();
    expect(slowRenderSpy.callCount).to.equal(1);
    expect(slowRenderSpy.getCall(0).args[0].detail).to.deep.equal({elapsedMs: 95, component: el.toString()});

    el.update();
    await nextAnimationFrame();
    // re-render happened within 3 seconds and took 50ms
    expect(slowRenderSpy.callCount).to.equal(1);

    el.update();
    await nextAnimationFrame();
    expect(slowRenderSpy.callCount).to.equal(2);
    expect(slowRenderSpy.getCall(1).args[0].detail).to.deep.equal({
      elapsedMs: 150,
      component: el.toString(),
      comparedToLast: 0.58,
      comparedToSlowest: 0.58,
    });
  });

  it(`allows multiple slowRender events within 3 seconds if the render time is worse than the current slowest time`, async function () {
    expect(slowRenderSpy.callCount).to.equal(0);
    stubNow([
      1, // update at
      1, // before first
      101, // after first
      101, // postRenderCallback time
      101, // get current time slow render was emitted

      100, // update at
      100, // before second render
      200, // after second render
      200, // postRenderCallback time
      200, // compare current time to last slow render

      2000, // update at
      2000, // before third render
      2101,
    ]);

    el.update();
    await nextAnimationFrame();
    expect(slowRenderSpy.callCount).to.equal(1);
    expect(slowRenderSpy.getCall(0).args[0].detail).to.deep.equal({elapsedMs: 100, component: el.toString()});

    el.update();
    await nextAnimationFrame();
    // re-render happened within 3 seconds and took 100ms
    expect(slowRenderSpy.callCount).to.equal(1);

    el.update();
    await nextAnimationFrame();
    // re-render happened within 3 seconds and took 101ms
    expect(slowRenderSpy.callCount).to.equal(2);
    expect(slowRenderSpy.getCall(1).args[0].detail).to.deep.equal({
      elapsedMs: 101,
      component: el.toString(),
      comparedToLast: 0.01,
      comparedToSlowest: 0.01,
    });
  });
});

context(`$hooks`, function () {
  describe(`.delayedAttrRemove`, function () {
    it(`sets attr immediately and removes element after delay`, async function () {
      document.body.innerHTML = ``;
      const bodyText = `modal body!`;
      const el = document.createElement(`delayed-attr-remove-app`);
      document.body.appendChild(el);

      el.setAttribute(`open`, `true`);
      await nextAnimationFrame();
      expect(el.textContent).to.contain(bodyText);

      el.setAttribute(`open`, `false`);
      await nextAnimationFrame();
      expect(el.textContent).to.contain(bodyText);
      expect(el.querySelector(`my-modal`).getAttribute(`open`)).to.equal(`false`);

      await sleep(50);
      expect(el.textContent).not.to.contain(bodyText);
      expect(el.querySelector(`my-modal`)).to.be.null;
    });
  });
});

describe(`Lifecycle Helpers`, function () {
  let el;
  let spy;

  beforeEach(function () {
    document.body.innerHTML = ``;
    el = document.createElement(`simple-app`);
    spy = sinon.spy();
  });

  describe(`onConnected`, function () {
    it(`doesn't fire until connectedCallback`, async function () {
      el.onConnected(spy);

      expect(spy.callCount).to.equal(0);

      document.body.appendChild(el);
      await nextAnimationFrame();
      expect(spy.callCount).to.equal(1);
    });

    it(`supports additional calls enqueued in the callback`, async function () {
      el.onConnected(() => {
        spy();
        el.onConnected(spy);
      });
      document.body.appendChild(el);
      await nextAnimationFrame();

      expect(spy.callCount).to.equal(2);
    });

    it(`immediately fires if connectedCallback has run`, async function () {
      document.body.appendChild(el);
      await nextAnimationFrame();

      el.onConnected(spy);
      expect(spy.callCount).to.equal(1);
    });

    it(`can return a function to run on disconnectedCallback`, async function () {
      document.body.appendChild(el);
      await nextAnimationFrame();

      el.onConnected(() => spy);
      expect(spy.callCount).to.equal(0);

      document.body.innerHTML = ``;
      await nextAnimationFrame();
      expect(spy.callCount).to.equal(1);
    });

    it(`function context is bound to the component`, async function () {
      document.body.appendChild(el);
      await nextAnimationFrame();

      el.onConnected(function () {
        this.update({baz: 42});
      });
      await nextAnimationFrame();

      expect(el.textContent).to.contain(`baz: 42`);
    });

    it(`runs each time the component is added the DOM`, async function () {
      el.onConnected(spy);
      document.body.appendChild(el);
      await nextAnimationFrame();
      expect(spy.callCount).to.equal(1);

      document.body.removeChild(el);
      await nextAnimationFrame();
      document.body.appendChild(el);
      await nextAnimationFrame();
      expect(spy.callCount).to.equal(2);
    });

    it(`runs 'delayed' callback each time the component is added to the DOM`, async function () {
      document.body.appendChild(el);
      await nextAnimationFrame();
      el.onConnected(spy);
      expect(spy.callCount).to.equal(1);

      document.body.removeChild(el);
      await nextAnimationFrame();
      document.body.appendChild(el);
      await nextAnimationFrame();
      expect(spy.callCount).to.equal(2);
    });

    it(`calls the returned function each time the component is removed from the DOM`, async function () {
      document.body.appendChild(el);
      await nextAnimationFrame();

      el.onConnected(() => spy);
      expect(spy.callCount).to.equal(0);

      document.body.removeChild(el);
      await nextAnimationFrame();
      expect(spy.callCount).to.equal(1);

      document.body.appendChild(el);
      await nextAnimationFrame();
      document.body.removeChild(el);
      await nextAnimationFrame();

      expect(spy.callCount).to.equal(2);
    });
  });

  describe(`onDisconnected`, function () {
    it(`runs on disconnectedCallback`, async function () {
      document.body.appendChild(el);
      await nextAnimationFrame();

      el.onDisconnected(spy);
      expect(spy.callCount).to.equal(0);

      document.body.innerHTML = ``;
      await nextAnimationFrame();
      expect(spy.callCount).to.equal(1);
    });

    it(`runs each time the component is removed from the DOM`, async function () {
      el.onDisconnected(spy);
      document.body.appendChild(el);
      await nextAnimationFrame();
      document.body.removeChild(el);
      await nextAnimationFrame();
      expect(spy.callCount).to.equal(1);

      document.body.appendChild(el);
      await nextAnimationFrame();
      document.body.removeChild(el);
      await nextAnimationFrame();
      expect(spy.callCount).to.equal(2);
    });
  });
});

describe(`Component with required attrs`, function () {
  let el;

  beforeEach(function () {
    document.body.innerHTML = ``;
    el = document.createElement(`required-attrs-schema-app`);
  });

  it(`renders successfully when the attrs are provided`, async function () {
    el.setAttribute(`str-attr`, `here`);
    document.body.appendChild(el);
    await nextAnimationFrame();

    expect(el.innerHTML).to.equal(compactHtml(`<div>Shouldn't render with missing attribute!</div>`));
  });
});

context(`Component with contexts`, function () {
  describe(`getContext()`, function () {
    beforeEach(async function () {
      document.body.innerHTML = ``;
      await nextAnimationFrame();
    });

    it(`returns own default context without context ancestor`, async function () {
      const widget = document.createElement(`default-light-themed-widget`);
      document.body.appendChild(widget);

      await nextAnimationFrame();
      expect(widget.getContext(`theme`)).to.be.an.instanceof(LightTheme);
      expect(widget.el.lastElementChild.className).to.equal(`light`);
    });

    it(`returns default context from wrapper component`, async function () {
      const darkApp = document.createElement(`dark-app`);
      document.body.appendChild(darkApp);

      await nextAnimationFrame();
      const theme = darkApp.el.querySelector(`default-light-themed-widget`).getContext(`theme`);
      expect(theme).to.be.an.instanceof(DarkTheme);
    });

    it(`returns default context from shadow DOM wrapper component`, async function () {
      const darkApp = document.createElement(`shadow-dom-dark-app`);
      document.body.appendChild(darkApp);

      await nextAnimationFrame();
      const widget = darkApp.el.querySelector(`default-light-themed-widget`);
      expect(widget.getContext(`theme`)).to.be.an.instanceof(DarkTheme);
      expect(widget.el.lastElementChild.className).to.equal(`dark`);
    });

    it(`returns default context from slotted wrapper component`, async function () {
      const darkApp = document.createElement(`slotted-dark-app`);
      document.body.appendChild(darkApp);

      const widget = document.createElement(`default-light-themed-widget`);
      darkApp.appendChild(widget);

      await nextAnimationFrame();
      expect(widget.getContext(`theme`)).to.be.an.instanceof(DarkTheme);
      expect(widget.el.lastElementChild.className).to.equal(`dark`);
    });

    it(`returns default context from root component`, async function () {
      const darkApp = document.createElement(`slotted-dark-app`);
      document.body.appendChild(darkApp);

      const lightApp = document.createElement(`slotted-light-app`);
      darkApp.appendChild(lightApp);

      const widget = document.createElement(`themed-widget`);
      lightApp.appendChild(widget);

      await nextAnimationFrame();
      expect(widget.getContext(`theme`)).to.be.an.instanceof(DarkTheme);
      expect(widget.el.lastElementChild.className).to.equal(`dark`);
    });

    it(`returns differently named contexts from different context ancestors`, async function () {
      const darkApp = document.createElement(`slotted-dark-app`);
      document.body.appendChild(darkApp);

      const invertedLightApp = document.createElement(`slotted-inverted-light-app`);
      darkApp.appendChild(invertedLightApp);

      const widget = document.createElement(`multi-themed-widget`);
      invertedLightApp.appendChild(widget);

      await nextAnimationFrame();
      expect(widget.getContext(`theme`)).to.be.an.instanceof(DarkTheme);
      expect(widget.getContext(`invertedTheme`)).to.be.an.instanceof(LightTheme);
      expect(Array.from(widget.el.lastElementChild.classList)).to.have.members([`light`, `dark`]);
    });

    it(`returns same context as other components sharing the same root component`, async function () {
      const darkApp = document.createElement(`slotted-dark-app`);
      document.body.appendChild(darkApp);

      const widget = document.createElement(`themed-widget`);
      darkApp.appendChild(widget);

      const siblingWidget = document.createElement(`slotted-light-app`);
      darkApp.appendChild(siblingWidget);

      const nephewWidget = document.createElement(`themed-widget`);
      siblingWidget.appendChild(nephewWidget);

      await nextAnimationFrame();
      expect(widget.getContext(`theme`)).to.be.an.instanceof(DarkTheme);
      expect(widget.getContext(`theme`)).to.equal(siblingWidget.getContext(`theme`));
      expect(widget.getContext(`theme`)).to.equal(nephewWidget.getContext(`theme`));
      expect(widget.el.lastElementChild.className).to.equal(`dark`);
      expect(siblingWidget.el.lastElementChild.className).to.equal(`dark`);
      expect(nephewWidget.el.lastElementChild.className).to.equal(`dark`);
    });

    it(`throws error when context name is not declared in config`, async function () {
      const darkApp = document.createElement(`slotted-dark-app`);
      document.body.appendChild(darkApp);

      const widget = document.createElement(`default-light-themed-widget`);
      darkApp.appendChild(widget);

      await nextAnimationFrame();
      expect(() => widget.getContext(`asdf`)).to.throw();
    });

    it(`throws error when context name is null or empty`, async function () {
      const widget = document.createElement(`default-light-themed-widget`);
      document.body.appendChild(widget);

      await nextAnimationFrame();
      expect(() => widget.getContext(``)).to.throw();
      expect(() => widget.getContext()).to.throw();
      expect(() => widget.getContext(null)).to.throw();
    });

    it(`throws error when called before component is connected`, async function () {
      const widget = document.createElement(`default-light-themed-widget`);

      await nextAnimationFrame();
      expect(() => widget.getContext(`theme`)).to.throw();
    });
  });

  describe(`lifecycle`, function () {
    beforeEach(async function () {
      document.body.innerHTML = ``;
      await nextAnimationFrame();
    });

    it(`fails to connect when a context declared in config does not have a default context by itself or from any context ancestor`, async function () {
      // modern browsers with native Custom Elements support will emit a global error event
      const errors = [];
      window.uncaughtErrorFilter = (errorEvent) => {
        errors.push(errorEvent.message);
        return true;
      };

      try {
        const widget = document.createElement(`themed-widget`);
        document.body.appendChild(widget);
      } catch (err) {
        // older browsers that rely on a Custom Elements polyfill will throw an error directly
        errors.push(err.message);
      }
      await nextAnimationFrame();

      expect(errors).to.have.lengthOf(1);
      expect(errors[0]).to.contain(`A "theme" context is not available`);

      delete window.uncaughtErrorFilter;
    });

    it(`executes bindToComponent callback when connected`, async function () {
      const widget1 = document.createElement(`slotted-load-counter-widget`);
      const counter = widget1.getConfig(`defaultContexts`).loadCounter;
      const bindToComponentSpy = sinon.spy(counter, `bindToComponent`);
      document.body.appendChild(widget1);
      await nextAnimationFrame();
      expect(counter.getCount()).to.equal(1);
      expect(bindToComponentSpy).to.have.callCount(1);
      expect(bindToComponentSpy.getCall(0).args[0]).to.equal(widget1);

      const widget2 = document.createElement(`slotted-load-counter-widget`);
      widget1.appendChild(widget2);
      await nextAnimationFrame();
      expect(counter.getCount()).to.equal(2);
      expect(bindToComponentSpy).to.have.callCount(2);
      expect(bindToComponentSpy.getCall(1).args[0]).to.equal(widget2);

      const widget3 = document.createElement(`slotted-load-counter-widget`);
      widget2.appendChild(widget3);
      await nextAnimationFrame();
      expect(counter.getCount()).to.equal(3);
      expect(bindToComponentSpy).to.have.callCount(3);
      expect(bindToComponentSpy.getCall(2).args[0]).to.equal(widget3);

      bindToComponentSpy.restore();
    });

    it(`executes bindToComponent callback each time the same component is repeatedly connected`, async function () {
      const app = document.createElement(`slotted-load-counter-widget`);
      const counter = app.getConfig(`defaultContexts`).loadCounter;
      const bindToComponentSpy = sinon.spy(counter, `bindToComponent`);
      document.body.appendChild(app);
      await nextAnimationFrame();
      expect(counter.getCount()).to.equal(1);
      expect(bindToComponentSpy).to.have.callCount(1);
      expect(bindToComponentSpy.getCall(0).args[0]).to.equal(app);

      const widget = document.createElement(`slotted-load-counter-widget`);
      app.appendChild(widget);
      await nextAnimationFrame();
      expect(counter.getCount()).to.equal(2);
      expect(bindToComponentSpy).to.have.callCount(2);
      expect(bindToComponentSpy.getCall(1).args[0]).to.equal(widget);

      app.removeChild(widget);
      await nextAnimationFrame();
      app.appendChild(widget);
      await nextAnimationFrame();
      expect(counter.getCount()).to.equal(2);
      expect(bindToComponentSpy).to.have.callCount(3);
      expect(bindToComponentSpy.getCall(2).args[0]).to.equal(widget);

      app.removeChild(widget);
      await nextAnimationFrame();
      app.appendChild(widget);
      await nextAnimationFrame();
      expect(counter.getCount()).to.equal(2);
      expect(bindToComponentSpy).to.have.callCount(4);
      expect(bindToComponentSpy.getCall(3).args[0]).to.equal(widget);

      bindToComponentSpy.restore();
    });

    it(`executes unbindFromComponent callback when disconnected`, async function () {
      const widget1 = document.createElement(`slotted-load-counter-widget`);
      document.body.appendChild(widget1);

      const widget2 = document.createElement(`slotted-load-counter-widget`);
      widget1.appendChild(widget2);

      const widget3 = document.createElement(`slotted-load-counter-widget`);
      widget2.appendChild(widget3);

      await nextAnimationFrame();
      const counter = widget1.getContext(`loadCounter`);
      const unbindFromComponentSpy = sinon.spy(counter, `unbindFromComponent`);
      expect(counter.getCount()).to.equal(3);

      widget3.remove();
      await nextAnimationFrame();
      expect(counter.getCount()).to.equal(2);
      expect(unbindFromComponentSpy).to.have.callCount(1);
      expect(unbindFromComponentSpy.getCall(0).args[0]).to.equal(widget3);

      widget2.remove();
      await nextAnimationFrame();
      expect(counter.getCount()).to.equal(1);
      expect(unbindFromComponentSpy).to.have.callCount(2);
      expect(unbindFromComponentSpy.getCall(1).args[0]).to.equal(widget2);

      widget1.remove();
      await nextAnimationFrame();
      expect(counter.getCount()).to.equal(0);
      expect(unbindFromComponentSpy).to.have.callCount(3);
      expect(unbindFromComponentSpy.getCall(2).args[0]).to.equal(widget1);

      unbindFromComponentSpy.restore();
    });

    it(`executes unbindFromComponent callback each time the same component is repeatedly disconnected`, async function () {
      const app = document.createElement(`slotted-load-counter-widget`);
      const counter = app.getConfig(`defaultContexts`).loadCounter;
      const unbindFromComponentSpy = sinon.spy(counter, `unbindFromComponent`);
      document.body.appendChild(app);
      await nextAnimationFrame();

      const widget = document.createElement(`slotted-load-counter-widget`);
      app.appendChild(widget);
      await nextAnimationFrame();
      app.removeChild(widget);
      await nextAnimationFrame();
      expect(counter.getCount()).to.equal(1);
      expect(unbindFromComponentSpy).to.have.callCount(1);
      expect(unbindFromComponentSpy.getCall(0).args[0]).to.equal(widget);

      app.appendChild(widget);
      await nextAnimationFrame();
      app.removeChild(widget);
      await nextAnimationFrame();
      expect(counter.getCount()).to.equal(1);
      expect(unbindFromComponentSpy).to.have.callCount(2);
      expect(unbindFromComponentSpy.getCall(1).args[0]).to.equal(widget);

      app.appendChild(widget);
      await nextAnimationFrame();
      app.removeChild(widget);
      await nextAnimationFrame();
      expect(counter.getCount()).to.equal(1);
      expect(unbindFromComponentSpy).to.have.callCount(3);
      expect(unbindFromComponentSpy.getCall(2).args[0]).to.equal(widget);

      unbindFromComponentSpy.restore();
    });
  });
});
