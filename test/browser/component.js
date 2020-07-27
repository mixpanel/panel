import {nextAnimationFrame, sleep} from 'domsuite';

import {BreakableApp} from '../fixtures/breakable-app';
import {compactHtml} from '../utils';

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
    expect(renderErrorEvent.detail.message).to.contain(errorMessage);
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
