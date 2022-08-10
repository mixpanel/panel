import '../../lib/isorender/dom-shims';

import sinon from 'sinon';
import {expect} from 'chai';
import {ParamParentApp, ParamChild} from '../fixtures/params-app';
import nextAnimationFrame from './nextAnimationFrame';
import {compactHtml} from '../utils';

customElements.define(`param-child`, ParamChild);
customElements.define(`param-parent-app`, ParamParentApp);

describe(`panel-params`, () => {
  beforeEach(() => {
    document.body = document.createElement(`body`);
  });

  it(`mounts a parent-child component`, async () => {
    const el = new ParamParentApp();
    el.connectedCallback();
    document.body.appendChild(el);
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

  it.only(`hooks will be run`, async () => {
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
});
