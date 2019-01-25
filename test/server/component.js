/* eslint-env mocha */
import '../../lib/isorender/dom-shims';

import {expect, config} from 'chai';

import {SimpleApp} from '../fixtures/simple-app';
import {NestedApp, NestedChild} from '../fixtures/nested-app';
import {AttrsReflectionApp} from '../fixtures/attrs-reflection-app';
import {BadAttrsSchemaApp} from '../fixtures/bad-attrs-schema-app';
import nextAnimationFrame from './nextAnimationFrame';
import {compactHtml} from '../utils';

config.truncateThreshold = 0; // nicer deep equal errors
customElements.define(`nested-app`, NestedApp);
customElements.define(`nested-child`, NestedChild);
customElements.define(`simple-app`, SimpleApp);
customElements.define(`attrs-reflection-app`, AttrsReflectionApp);

describe(`Server-side component renderer`, function() {
  it(`can register and create components with document.createElement`, function() {
    const el = document.createElement(`simple-app`);
    expect(el.state).to.eql({});
    el.connectedCallback();
    expect(el.state).to.eql({foo: `bar`, baz: `qux`});
  });

  it(`supports class instantiation`, function() {
    const el = new SimpleApp();
    expect(el.state).to.eql({});
    el.connectedCallback();
    expect(el.state).to.eql({foo: `bar`, baz: `qux`});
  });

  it(`renders a simple component`, async function() {
    const el = new SimpleApp();
    el.connectedCallback();

    await nextAnimationFrame();

    const html = el.innerHTML;
    expect(html.toLowerCase()).to.contain(`<div class="foo">`);
    expect(html).to.contain(`Value of foo: bar`);
    expect(html).to.contain(`Foo capitalized: Bar`);
  });

  it(`renders updates`, async function() {
    const el = new SimpleApp();
    el.connectedCallback();

    await nextAnimationFrame();

    expect(el.textContent).to.contain(`Value of foo: bar`);
    expect(el.textContent).to.contain(`Foo capitalized: Bar`);
    el.update({foo: `new value`});

    await nextAnimationFrame();

    expect(el.textContent).to.contain(`Value of foo: new value`);
    expect(el.textContent).to.contain(`Foo capitalized: New value`);
  });

  it(`renders nested components`, async function() {
    const el = new NestedApp();
    el.connectedCallback();

    await nextAnimationFrame();

    // check DOM structure
    expect(el.childNodes).to.have.lengthOf(1);
    expect(el.childNodes[0].className).to.equal(`nested-foo`);
    expect(el.childNodes[0].childNodes).to.have.lengthOf(2);

    const nestedChild = el.childNodes[0].childNodes[1];
    expect(nestedChild.childNodes).to.have.lengthOf(1);
    expect(nestedChild.childNodes[0].className).to.equal(`nested-foo-child`);
    expect(nestedChild.childNodes[0].childNodes).to.have.lengthOf(2);

    // check content/HTML output
    const html = el.innerHTML;
    expect(html.toLowerCase()).to.contain(`<div class="nested-foo">`);
    expect(html).to.contain(`Nested app: test`);
    expect(html.toLowerCase()).to.contain(`<div class="nested-foo-child">`);
    expect(html).to.contain(`parent title: test`);
    expect(html).to.contain(`animal: llama`);
  });

  it(`updates nested components`, async function() {
    const el = new NestedApp();
    el.connectedCallback();

    await nextAnimationFrame();

    const nestedChild = el.childNodes[0].childNodes[1];
    expect(nestedChild.state.title).to.equal(`test`);
    nestedChild.update({title: `meow`});

    await nextAnimationFrame();

    expect(el.state.title).to.equal(`meow`);
    expect(el.innerHTML).to.contain(`Nested app: meow`);
    expect(nestedChild.innerHTML).to.contain(`parent title: meow`);
    el.update({title: `something else`});

    await nextAnimationFrame();

    expect(nestedChild.innerHTML).to.contain(`parent title: something else`);
  });

  it(`renders attributes`, async function() {
    const el = new AttrsReflectionApp();
    el.connectedCallback();
    await nextAnimationFrame();

    expect(el.innerHTML).to.equal(compactHtml(`
      <div class="attrs-reflection-app">
        <p>str-attr: "hello"</p>
        <p>bool-attr: false</p>
        <p>number-attr: 0</p>
        <p>json-attr: null</p>
      </div>
    `));
  });

  it(`reacts to attribute updates`, async function() {
    const el = new AttrsReflectionApp();
    el.connectedCallback();
    await nextAnimationFrame();

    el.setAttribute(`str-attr`, `world`);
    el.setAttribute(`bool-attr`, `false`);
    el.setAttribute(`number-attr`, `500843`);
    el.setAttribute(`json-attr`, `{"foo": "bae"}`);

    expect(el.attrs).to.deep.equal({
      'str-attr': `world`,
      'bool-attr': false,
      'number-attr': 500843,
      'json-attr': {foo: `bae`},
    });

    await nextAnimationFrame();

    expect(el.innerHTML).to.equal(compactHtml(`
      <div class="attrs-reflection-app">
        <p>str-attr: "world"</p>
        <p>bool-attr: false</p>
        <p>number-attr: 500843</p>
        <p>json-attr: {"foo":"bae"}</p>
      </div>
    `));
  });

  it(`handles malformed attribute updates`, async function() {
    const el = new AttrsReflectionApp();
    el.setAttribute(`str-attr`, `💩🤒🤢☠️ -> 👻🎉💐🎊😱😍`);
    el.setAttribute(`bool-attr`, ``);
    el.setAttribute(`number-attr`, `500843 abra cadabra`);
    el.setAttribute(`json-attr`, `{"foo": not %%^ json`);
    el.connectedCallback();

    expect(el.attrs).to.deep.equal({
      'str-attr': `💩🤒🤢☠️ -> 👻🎉💐🎊😱😍`,
      'bool-attr': true,
      'number-attr': null,
      'json-attr': null,
    });

    await nextAnimationFrame();

    expect(el.innerHTML).to.equal(compactHtml(`
      <div class="attrs-reflection-app">
        <p>str-attr: "💩🤒🤢☠️ -&gt; 👻🎉💐🎊😱😍"</p>
        <p>bool-attr: true</p>
        <p>number-attr: null</p>
        <p>json-attr: null</p>
      </div>
    `));
  });

  it(`throws error for invalid value in an enum attr`, function() {
    const el = new AttrsReflectionApp();

    expect(() => el.setAttribute(`str-attr`, `boo!`)).to.throw(
      `Invalid value: 'boo!' for attr: str-attr. Only ('hello' | 'world' | '💩🤒🤢☠️ -> 👻🎉💐🎊😱😍') is valid.`
    );
  });

  it(`throws error if there is a malformed attrsSchema type`, function() {
    expect(() => new BadAttrsSchemaApp()).to.throw(
      `Invalid type: bool for attr: bad-attr in attrsSchema. Only ('string' | 'boolean' | 'number' | 'json') is valid.`
    );
  });
});
