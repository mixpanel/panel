import sinon from 'sinon';
import {expect} from 'chai';
import {ParamParentApp, ParamChild, ParamDefaultAndRequired} from '../fixtures/params-app';
import {nextAnimationFrame, compactHtml} from '../utils';

customElements.define(`param-child`, ParamChild);
customElements.define(`param-parent-app`, ParamParentApp);
customElements.define(`param-required-and-default-app`, ParamDefaultAndRequired);

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

  it(`respect defaultParams`, async () => {
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
    try {
      el.update({requiredString: undefined});
    } catch (e) {
      expect(e).to.be.instanceOf(Error);
      expect(e.message).to.equal(`param 'requiredString' in ParamChild is required, undefined passed in`);
    }
  });

  it(`respects required field`, () => {
    try {
      new ParamDefaultAndRequired();
    } catch (e) {
      expect(e).to.be.instanceOf(Error);
      expect(e.message).to.equal(
        `param 'requiredString' in ParamDefaultAndRequired cannot have both required and default`,
      );
    }
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
