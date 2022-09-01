import sinon from 'sinon';
import {expect} from 'chai';
import {
  ExtraParamPassInChild,
  ParamChild,
  ParamParentApp,
  NonPrimitiveTypeParamClass,
  NonPrimitiveTypeParamString,
  RequiredParam,
  ShouldComponentUpdateParamsApp,
} from '../fixtures/params-app';
import {nextAnimationFrame, compactHtml} from '../utils';

customElements.define(`param-child`, ParamChild);
customElements.define(`param-parent-app`, ParamParentApp);
customElements.define(`extra-param-pass-in-child`, ExtraParamPassInChild);
customElements.define(`non-primitive-type-param-class`, NonPrimitiveTypeParamClass);
customElements.define(`non-primitive-type-param-string`, NonPrimitiveTypeParamString);
customElements.define(`should-component-update-params-app`, ShouldComponentUpdateParamsApp);
customElements.define(`required-param`, RequiredParam);

describe(`Panel Params`, function () {
  beforeEach(function () {
    document.body = document.createElement(`body`);
  });

  afterEach(function () {
    sinon.restore();
  });

  it(`mounts a parent-child component`, async function () {
    const el = new ParamParentApp();
    el.connectedCallback();
    document.body.appendChild(el);
    await nextAnimationFrame();
    await nextAnimationFrame();
    expect(el.childNodes[0].innerHTML).to.equal(
      compactHtml(`
      <div>
        <div id="str"></div>
        <div id="num">0</div>
        <div id="bool"></div>
        <div id="obj">{}</div>
        <div id="arr">[]</div>
        <div id="map">{}</div>
        <div id="set">{}</div>
      </div>
    `),
    );
  });

  it(`updates child whenever parent is updated`, async function () {
    const el = new ParamParentApp();
    el.connectedCallback();
    document.body.appendChild(el);
    await nextAnimationFrame();
    el.update({str: `abc`, num: 5, bool: true});
    await nextAnimationFrame();
    await nextAnimationFrame();
    expect(el.childNodes[0].innerHTML).to.equal(
      compactHtml(`
      <div>
        <div id="str">abc</div>
        <div id="num">5</div>
        <div id="bool">true</div>
        <div id="obj">{}</div>
        <div id="arr">[]</div>
        <div id="map">{}</div>
        <div id="set">{}</div>
      </div>
    `),
    );
  });

  it(`respects shouldComponentUpdate`, async function () {
    const el = new ShouldComponentUpdateParamsApp();
    el.connectedCallback();
    document.body.appendChild(el);
    await nextAnimationFrame();
    expect(el.innerHTML).to.equal(
      compactHtml(`
      <div>{"id":1,"info":"info"}</div>
    `),
    );
    el.setParams({bookmark: {id: 1, info: `updated`}});
    await nextAnimationFrame();
    expect(el.innerHTML).to.equal(
      compactHtml(`
      <div>{"id":1,"info":"info"}</div>
    `),
    );
    el.setParams({bookmark: {id: 2, info: `updated`}});
    await nextAnimationFrame();
    expect(el.innerHTML).to.equal(
      compactHtml(`
      <div>{"id":2,"info":"updated"}</div>
    `),
    );
  });

  it(`respects defaultParams`, async function () {
    const el = new ParamParentApp();
    el.connectedCallback();
    document.body.appendChild(el);
    await nextAnimationFrame();
    expect(el.childNodes[0].params.defaultString).to.equal(`defaultString`);
    expect(el.childNodes[0].params.noDefaultString).to.equal(undefined);
  });

  it(`required param must be presented on component delclarition`, function () {
    const el = new RequiredParam();
    el.setConfig(`updateSync`, true);
    expect(() => el.connectedCallback()).to.throw(
      Error,
      `param 'requiredString' on ParamChild is defined as required param in schema but absent on component definition`,
    );
  });

  it(`throws error if non primitive used in param schema(class)`, function () {
    expect(() => new NonPrimitiveTypeParamClass()).to.throw(
      Error,
      `Invalid type: NonPrimitiveTypeParamClass for param: A in paramSchema. Only ('Array' | 'String' | 'Boolean' | 'Number' | 'Object' | 'Function' | 'Map' | 'Set') is valid.`,
    );
  });

  it(`throws error if non primitive used in param schema(string)`, function () {
    expect(() => new NonPrimitiveTypeParamString()).to.throw(
      Error,
      `Invalid type: json for param: A in paramSchema. Only ('Array' | 'String' | 'Boolean' | 'Number' | 'Object' | 'Function' | 'Map' | 'Set') is valid.`,
    );
  });

  it(`throws error if unkown param is passed in child`, function () {
    const el = new ExtraParamPassInChild();
    el.setConfig(`updateSync`, true);
    expect(() => el.connectedCallback()).to.throw(Error, `extra param 'extra' on ParamChild is not defined in schema`);
  });

  it(`run hooks`, async function () {
    const el = new ParamParentApp();
    el.connectedCallback();
    document.body.appendChild(el);
    const child = el.childNodes[0];
    await nextAnimationFrame();
    child._config.hooks = {preUpdate: sinon.stub()};
    el.update({str: `abc`, num: 5, bool: true});
    await nextAnimationFrame();
    await nextAnimationFrame();
    expect(child.getConfig(`hooks`).preUpdate.callCount).to.equal(1);
    // no state for the child
    expect(child.getConfig(`hooks`).preUpdate.firstCall.args[0]).to.equal(null);
    // preUpdate hook
    expect(child.getConfig(`hooks`).preUpdate.firstCall.args[1].str).to.equal(`abc`);
    expect(child.getConfig(`hooks`).preUpdate.firstCall.args[1].num).to.equal(5);
    expect(child.getConfig(`hooks`).preUpdate.firstCall.args[1].bool).to.equal(true);
  });

  it(`runs hooks with current param values`, async function () {
    const el = new ParamParentApp();
    el.connectedCallback();
    document.body.appendChild(el);
    const child = el.childNodes[0];
    await nextAnimationFrame();
    child._config.hooks = {
      preUpdate(stateUpdate, paramsUpdate) {
        expect(child.params.str).to.equal(``);
        expect(paramsUpdate.str).to.equal(`abc`);
      },
    };
    el.update({str: `abc`, num: 5, bool: true});
    await nextAnimationFrame();
  });
});
