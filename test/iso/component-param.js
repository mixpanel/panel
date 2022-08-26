import sinon from 'sinon';
import {expect} from 'chai';
import {
  DefaultAndRequiredParam,
  ExtraParamPassInChild,
  ParamChild,
  ParamParentApp,
  NonPrimitiveTypeParamClass,
  NonPrimitiveTypeParamString,
  ShouldComponentUpdateParamsApp,
} from '../fixtures/params-app';
import {nextAnimationFrame, compactHtml} from '../utils';

customElements.define(`param-child`, ParamChild);
customElements.define(`param-parent-app`, ParamParentApp);
customElements.define(`param-required-and-default-app`, DefaultAndRequiredParam);
customElements.define(`extra-param-pass-in-child`, ExtraParamPassInChild);
customElements.define(`non-primitive-type-param-class`, NonPrimitiveTypeParamClass);
customElements.define(`non-primitive-type-param-string`, NonPrimitiveTypeParamString);
customElements.define(`should-component-update-params-app`, ShouldComponentUpdateParamsApp);

describe(`panel-params`, () => {
  beforeEach(() => {
    document.body = document.createElement(`body`);
  });

  it(`mounts a parent-child component`, async () => {
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

  it(`updates parent will cause update in child`, async () => {
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

  it(`respects shouldComponentUpdate`, async () => {
    const el = new ShouldComponentUpdateParamsApp();
    el.connectedCallback();
    document.body.appendChild(el);
    await nextAnimationFrame();
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

  it(`respects defaultParams`, async () => {
    const el = new ParamParentApp();
    el.connectedCallback();
    document.body.appendChild(el);
    await nextAnimationFrame();
    expect(el.childNodes[0].params.defaultString).to.equal(`defaultString`);
    expect(el.childNodes[0].params.noDefaultString).to.equal(undefined);
  });

  it(`respects required field`, () => {
    const el = new ParamParentApp();
    el.setConfig(`updateSync`, true);
    el.connectedCallback();
    document.body.appendChild(el);
    expect(() => el.update({requiredString: undefined})).to.throw(
      Error,
      `param 'requiredString' in ParamChild is required, undefined passed in`,
    );
  });

  it(`respects required field`, () => {
    expect(() => new DefaultAndRequiredParam()).to.throw(
      Error,
      `param 'requiredString' in DefaultAndRequiredParam cannot have both required and default`,
    );
  });

  it(`throws error if non primitive used in param schema(class)`, () => {
    expect(() => new NonPrimitiveTypeParamClass()).to.throw(
      Error,
      `Invalid type: NonPrimitiveTypeParamClass for param: A in paramSchema. Only ('Array' | 'String' | 'Boolean' | 'Number' | 'Object' | 'Function' | 'Map' | 'Set') is valid.`,
    );
  });

  it(`throws error if non primitive used in param schema(string)`, () => {
    expect(() => new NonPrimitiveTypeParamString()).to.throw(
      Error,
      `Invalid type: json for param: A in paramSchema. Only ('Array' | 'String' | 'Boolean' | 'Number' | 'Object' | 'Function' | 'Map' | 'Set') is valid.`,
    );
  });

  it(`throws error if unkown param pass in child`, () => {
    const el = new ExtraParamPassInChild();
    el.setConfig(`updateSync`, true);
    expect(() => el.connectedCallback()).to.throw(Error, `extra param 'extra' on ParamChild is not defined in schema`);
  });

  it(`hooks will be run`, async () => {
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
    expect(child.getConfig(`hooks`).preUpdate.firstCall.args[0]).to.deep.equal({});
    // preUpdate hook
    expect(child.getConfig(`hooks`).preUpdate.firstCall.args[1].str).to.equal(`abc`);
    expect(child.getConfig(`hooks`).preUpdate.firstCall.args[1].num).to.equal(5);
    expect(child.getConfig(`hooks`).preUpdate.firstCall.args[1].bool).to.equal(true);
    sinon.restore();
  });

  it(`hooks run with current param values`, async () => {
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
