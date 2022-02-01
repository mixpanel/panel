import {expect} from 'chai';
import {nextAnimationFrame, retryable} from 'domsuite';

import {Component, h} from '../../lib';

export class RouterApp extends Component {
  get config() {
    return {
      defaultState: {
        text: `Hello world`,
        additionalText: ``,
      },
      routes: {
        foo: () => ({text: `Foobar!`}),
        'widget/:id': (stateUpdate, id) => Object.assign({text: `Widget ${id}`}, stateUpdate),
        'multiparam/:param1/lala:param2': (stateUpdate, param1, param2) => ({
          text: `param1: ${param1} param2: ${param2}`,
        }),
        'optional/:required(/:optional)': (stateUpdate, required, optional) => ({
          text: optional ? `Two params: ${required} and ${optional}` : `One param: ${required}`,
        }),
        'alias-to-foo': `foo`,
        'alias-with-params/:param1/:param2': `multiparam/:param1/lala:param2`,
        'numeric/:num': (stateUpdate, num) => (isNaN(num) ? false : {text: `Number: ${num}`}),
        '': () => ({text: `Default route!`}),
      },
      template: (state) => h(`p`, [`${state.text}${state.additionalText}`]),
    };
  }
}
customElements.define(`router-app`, RouterApp);

export class PathRouterApp extends Component {
  get config() {
    return {
      defaultState: {
        text: `Hello world`,
        additionalText: ``,
      },
      routes: {
        basePath: `/foo/:id(/)`,
        paths: [
          {
            pathName: `/`,
            hashRoutes: {
              '': () => ({text: `Default route!`}),
              bar: () => ({text: `Bar route!`}),
            },
          },
          {
            pathName: `/widget/:id(/)`,
            hashRoutes: {
              '': (stateUpdate, [id]) => Object.assign({text: `Widget ${id}`}, stateUpdate),
              'param/:param': (stateUpdate, [id], [param]) =>
                Object.assign({text: `Widget ${id} with param ${param}`}, stateUpdate),
              'optional/:required(/:optional)': (stateUpdate, [id], [required, optional]) => ({
                text: optional
                  ? `ID: ${id}, two params: ${required} and ${optional}`
                  : `ID: ${id}, one param: ${required}`,
              }),
            },
          },
          {
            pathName: `/widget/:id/*restOfPath`,
            hashRoutes: {
              '': (stateUpdate, [id, restOfPath]) => Object.assign({text: `Widget ${id} ${restOfPath}`}),
            },
          },
          {
            pathName: `/optional/:required(/:optional)`,
            hashRoutes: {
              '': (stateUpdate, [required, optional]) => ({
                text: optional ? `Two params: ${required} and ${optional}` : `One param: ${required}`,
              }),
              ':required(/:optional)': (stateUpdate, [requiredPath, optionalPath], [requiredHash, optionalHash]) => ({
                text: `From path: ${requiredPath}${
                  optionalPath ? `, ${optionalPath}` : ``
                }. From hash: ${requiredHash}${optionalHash ? `, ${optionalHash}` : ``}.`,
              }),
            },
          },
          {
            pathName: `/numeric/:num`,
            hashRoutes: {
              '': (stateUpdate, [num]) => (isNaN(num) ? false : {text: `Number: ${num}`}),
            },
          },
        ],
      },
      template: (state) => h(`p`, [`${state.text}${state.additionalText}`]),
    };
  }
}

customElements.define(`path-router-app`, PathRouterApp);

describe(`hash-only Router`, function () {
  beforeEach(async function () {
    document.body.innerHTML = ``;
    window.location = `#`;
    window.history.replaceState(null, null, `/`);
    this.routerApp = document.createElement(`router-app`);
    document.body.appendChild(this.routerApp);

    await nextAnimationFrame();
  });

  it(`is not initialized when component has no routes defined`, function () {
    const simpleApp = document.createElement(`simple-app`);
    document.body.appendChild(simpleApp);
    expect(simpleApp).not.to.have.property(`router`);

    expect(this.routerApp.router).to.be.ok;
  });

  it(`is present when component has routes defined`, function () {
    expect(this.routerApp.router).to.be.ok;
  });

  it(`runs index route handler when window location is empty`, function () {
    expect(this.routerApp.textContent).to.equal(`Default route!`);
  });

  it(`reacts to location hash changes`, async function () {
    window.location.hash = `#foo`;
    await retryable(() => expect(this.routerApp.textContent).to.equal(`Foobar!`));
  });

  it(`passes params to route handlers`, async function () {
    window.location.hash = `#widget/15`;
    await retryable(() => expect(this.routerApp.textContent).to.equal(`Widget 15`));

    window.location.hash = `#multiparam/angry/lalallama`;
    await retryable(() => expect(this.routerApp.textContent).to.equal(`param1: angry param2: llama`));
  });

  it(`supports optional params`, async function () {
    window.location.hash = `#optional/wombat`;
    await retryable(() => expect(this.routerApp.textContent).to.equal(`One param: wombat`));

    window.location.hash = `#optional/wombat/32`;
    await retryable(() => expect(this.routerApp.textContent).to.equal(`Two params: wombat and 32`));
  });

  it(`supports route redirects/aliases`, async function () {
    expect(this.routerApp.textContent).to.equal(`Default route!`);
    window.location.hash = `#alias-to-foo`;
    await retryable(() => expect(this.routerApp.textContent).to.equal(`Foobar!`));
  });

  it(`supports params in redirects/aliases`, async function () {
    expect(this.routerApp.textContent).to.equal(`Default route!`);
    window.location.hash = `#alias-with-params/foo/bar`;
    await retryable(() => expect(this.routerApp.textContent).to.equal(`param1: foo param2: bar`));
  });

  it(`unregisters listeners when component is disconnected`, function () {
    window.location.hash = `#foo`;
    expect(this.routerApp.state.text).to.equal(`Foobar!`);
    window.location.hash = `#`;
    expect(this.routerApp.state.text).to.equal(`Default route!`);

    document.body.removeChild(this.routerApp);

    window.location.hash = `#foo`;
    expect(this.routerApp.state.text).to.equal(`Default route!`);
  });

  describe(`navigate()`, function () {
    it(`switches to the manually specified route`, async function () {
      this.routerApp.router.navigate(`foo`);
      await retryable(() => expect(this.routerApp.textContent).to.equal(`Foobar!`));
    });

    it(`updates the URL`, function () {
      expect(window.location.hash).not.to.equal(`#foo`);
      this.routerApp.router.navigate(`foo`);
      expect(window.location.hash).to.equal(`#foo`);
    });

    it(`does not update the URL if hash is the same`, function () {
      const historyLength = window.history.length;

      this.routerApp.router.navigate(`foo`);
      expect(window.history.length).to.equal(historyLength + 1);
      this.routerApp.router.navigate(`foo`);
      expect(window.history.length).to.equal(historyLength + 1);

      // ensure window.location.hash is properly URI-decoded for comparison,
      // otherwise `widget/bar baz` !== `widget/bar%20baz` may be compared
      // resulting in possible circular redirect loop
      this.routerApp.router.navigate(`widget/bar baz`);
      expect(window.history.length).to.equal(historyLength + 2);
      this.routerApp.router.navigate(`widget/bar baz`);
      expect(window.history.length).to.equal(historyLength + 2);
      this.routerApp.router.navigate(`widget/bar%20baz`);
      expect(window.history.length).to.equal(historyLength + 2);
    });

    it(`supports passing state updates to the route handler`, async function () {
      this.routerApp.router.navigate(`widget/5`, {
        additionalText: ` and more!`,
      });
      await retryable(() => expect(this.routerApp.textContent).to.equal(`Widget 5 and more!`));
    });

    it(`does not apply updates when the route handler returns a falsey result`, async function () {
      this.routerApp.router.navigate(`numeric/42`);
      await retryable(() => expect(this.routerApp.textContent).to.equal(`Number: 42`));

      this.routerApp.router.navigate(`numeric/notanumber`);
      await nextAnimationFrame();
      await nextAnimationFrame();
      await nextAnimationFrame();
      expect(this.routerApp.textContent).to.equal(`Number: 42`);
    });
  });

  describe(`replaceLocation()`, function () {
    it(`updates the URL`, function () {
      expect(window.location.hash).not.to.equal(`#foo`);
      this.routerApp.router.replaceLocation({fragment: `foo`});
      expect(window.location.hash).to.equal(`#foo`);
    });

    it(`does not update the URL if hash is the same`, function () {
      const historyLength = window.history.length;

      this.routerApp.router.replaceLocation({fragment: `foo`});
      expect(window.history.length).to.equal(historyLength + 1);
      this.routerApp.router.replaceLocation({fragment: `foo`});
      expect(window.history.length).to.equal(historyLength + 1);

      // ensure window.location.hash is properly URI-decoded for comparison,
      // otherwise `widget/bar baz` !== `widget/bar%20baz` may be compared
      // resulting in possible circular redirect loop
      this.routerApp.router.replaceLocation({fragment: `widget/bar baz`});
      expect(window.history.length).to.equal(historyLength + 2);
      this.routerApp.router.replaceLocation({fragment: `widget/bar baz`});
      expect(window.history.length).to.equal(historyLength + 2);
      this.routerApp.router.replaceLocation({fragment: `widget/bar%20baz`});
      expect(window.history.length).to.equal(historyLength + 2);
    });

    it(`uses pushState by default and adds a history entry`, function () {
      const historyLength = window.history.length;

      this.routerApp.router.replaceLocation({fragment: `foo`});
      expect(window.history.length).to.equal(historyLength + 1);
      this.routerApp.router.replaceLocation({fragment: `widget/bar baz`});
      expect(window.history.length).to.equal(historyLength + 2);
    });

    it(`can use replaceState to avoid adding a history entry`, function () {
      const historyLength = window.history.length;

      this.routerApp.router.replaceLocation({fragment: `foo`, historyMethod: `replaceState`});
      expect(window.history.length).to.equal(historyLength);
      this.routerApp.router.replaceLocation({fragment: `widget/bar baz`, historyMethod: `replaceState`});
      expect(window.history.length).to.equal(historyLength);
    });
  });
});

describe.only(`path + hash Router`, function () {
  beforeEach(async function () {
    document.body.innerHTML = ``;
    window.location = `#`;
    window.history.replaceState(null, null, `/foo/123`);
    this.routerApp = document.createElement(`path-router-app`);
    document.body.appendChild(this.routerApp);

    await nextAnimationFrame();
  });

  it(`runs index route handler when at root`, function () {
    expect(this.routerApp.textContent).to.equal(`Default route!`);
  });

  it(`runs index route handler when at root with trailing slash`, async function () {
    window.history.pushState(null, null, `/foo/123/`);
    await nextAnimationFrame();
    expect(this.routerApp.textContent).to.equal(`Default route!`);
  });

  it(`reacts to hash route changes at root`, async function () {
    window.location.hash = `#bar`;
    await retryable(() => expect(this.routerApp.textContent).to.equal(`Bar route!`));
  });

  it(`passes path params to route handlers`, async function () {
    window.history.pushState(null, null, `/foo/123/widget/15`);
    await retryable(() => expect(this.routerApp.textContent).to.equal(`Widget 15`));
  });

  it(`passes path params to route handlers with trailing slash`, async function () {
    window.history.pushState(null, null, `/foo/123/widget/15/`);
    await retryable(() => expect(this.routerApp.textContent).to.equal(`Widget 15`));
  });

  it(`passes path and hash params to route handlers`, async function () {
    window.history.pushState(null, null, `/foo/123/widget/15#param/foobar`);
    await retryable(() => expect(this.routerApp.textContent).to.equal(`Widget 15 with param foobar`));
  });

  it(`supports splat params`, async function () {
    window.history.pushState(null, null, `/foo/123/widget/15/project/10/view/app`);
    await retryable(() => expect(this.routerApp.textContent).to.equal(`Widget 15 project/10/view/app`));
  });

  it(`supports optional path params`, async function () {
    window.history.pushState(null, null, `/foo/123/optional/wombat`);
    await retryable(() => expect(this.routerApp.textContent).to.equal(`One param: wombat`));

    window.history.pushState(null, null, `/foo/123/optional/wombat/32`);
    await retryable(() => expect(this.routerApp.textContent).to.equal(`Two params: wombat and 32`));
  });

  it(`supports path params with optional hash params`, async function () {
    window.history.pushState(null, null, `/foo/123/widget/21#optional/wombat`);
    await retryable(() => expect(this.routerApp.textContent).to.equal(`ID: 21, one param: wombat`));

    window.history.pushState(null, null, `/foo/123/widget/21#optional/wombat/32`);
    await retryable(() => expect(this.routerApp.textContent).to.equal(`ID: 21, two params: wombat and 32`));
  });

  it(`supports optional path params with optional hash params`, async function () {
    window.history.pushState(null, null, `/foo/123/optional/wombat#bar`);
    await retryable(() => expect(this.routerApp.textContent).to.equal(`From path: wombat. From hash: bar.`));

    window.history.pushState(null, null, `/foo/123/optional/wombat/32#bar`);
    await retryable(() => expect(this.routerApp.textContent).to.equal(`From path: wombat, 32. From hash: bar.`));

    window.history.pushState(null, null, `/foo/123/optional/wombat#bar/21`);
    await retryable(() => expect(this.routerApp.textContent).to.equal(`From path: wombat. From hash: bar, 21.`));

    window.history.pushState(null, null, `/foo/123/optional/wombat/32#bar/21`);
    await retryable(() => expect(this.routerApp.textContent).to.equal(`From path: wombat, 32. From hash: bar, 21.`));
  });

  describe(`pathNavigate()`, function () {
    it(`switches to the manually specified route`, async function () {
      this.routerApp.router.pathNavigate(`/widget/30`);
      await retryable(() => expect(this.routerApp.textContent).to.equal(`Widget 30`));
    });

    it(`updates the URL`, function () {
      expect(window.location.pathname).not.to.equal(`/foo/123/widget/30`);
      this.routerApp.router.pathNavigate(`/widget/30`);
      expect(window.location.pathname).to.equal(`/foo/123/widget/30`);
    });

    it(`does not update the URL if hash is the same`, function () {
      const historyLength = window.history.length;

      this.routerApp.router.pathNavigate(`/widget/30`);
      expect(window.history.length).to.equal(historyLength + 1);
      this.routerApp.router.pathNavigate(`/widget/30`);
      expect(window.history.length).to.equal(historyLength + 1);

      // ensure window.location.hash is properly URI-decoded for comparison,
      // otherwise `widget/bar baz` !== `widget/bar%20baz` may be compared
      // resulting in possible circular redirect loop
      this.routerApp.router.pathNavigate(`/widget/bar baz`);
      expect(window.history.length).to.equal(historyLength + 2);
      this.routerApp.router.pathNavigate(`/widget/bar baz`);
      expect(window.history.length).to.equal(historyLength + 2);
      this.routerApp.router.pathNavigate(`/widget/bar%20baz`);
      expect(window.history.length).to.equal(historyLength + 2);
    });

    it(`supports passing state updates to the route handler`, async function () {
      this.routerApp.router.pathNavigate(`/widget/5`, ``, {
        additionalText: ` and more!`,
      });
      await retryable(() => expect(this.routerApp.textContent).to.equal(`Widget 5 and more!`));
    });

    it(`supports passing in fragments`, async function () {
      this.routerApp.router.pathNavigate(`/widget/5`, `param/foo`);
      await retryable(() => expect(this.routerApp.textContent).to.equal(`Widget 5 with param foo`));
    });

    it(`does not apply updates when the route handler returns a falsey result`, async function () {
      this.routerApp.router.pathNavigate(`/numeric/42`);
      await retryable(() => expect(this.routerApp.textContent).to.equal(`Number: 42`));

      this.routerApp.router.pathNavigate(`/numeric/notanumber`);
      await nextAnimationFrame();
      await nextAnimationFrame();
      await nextAnimationFrame();
      expect(this.routerApp.textContent).to.equal(`Number: 42`);
    });
  });

  describe(`replaceLocation()`, function () {
    it(`updates the URL`, function () {
      expect(window.location.pathname).not.to.equal(`/foo/123/widget/30`);
      this.routerApp.router.replaceLocation({path: `/widget/30`});
      expect(window.location.pathname).to.equal(`/foo/123/widget/30`);
    });

    it(`does not update the URL if path is the same`, function () {
      const historyLength = window.history.length;

      this.routerApp.router.replaceLocation({path: `/widget/30`});
      expect(window.history.length).to.equal(historyLength + 1);
      this.routerApp.router.replaceLocation({path: `/widget/30`});
      expect(window.history.length).to.equal(historyLength + 1);

      this.routerApp.router.replaceLocation({path: `/widget/bar baz`});
      expect(window.history.length).to.equal(historyLength + 2);
      this.routerApp.router.replaceLocation({path: `/widget/bar baz`});
      expect(window.history.length).to.equal(historyLength + 2);
      this.routerApp.router.replaceLocation({path: `/widget/bar%20baz`});
      expect(window.history.length).to.equal(historyLength + 2);
    });

    it(`uses pushState by default and adds a history entry`, function () {
      const historyLength = window.history.length;

      this.routerApp.router.replaceLocation({path: `/widget/15`});
      expect(window.history.length).to.equal(historyLength + 1);
      this.routerApp.router.replaceLocation({path: `/widget/bar baz`});
      expect(window.history.length).to.equal(historyLength + 2);
    });

    it(`adds a history entry when updating hash fragment`, function () {
      const historyLength = window.history.length;

      this.routerApp.router.replaceLocation({path: `/widget/15`});
      expect(window.history.length).to.equal(historyLength + 1);
      this.routerApp.router.replaceLocation({path: `/widget/bar baz`});
      expect(window.history.length).to.equal(historyLength + 2);
      this.routerApp.router.replaceLocation({path: `/widget/bar baz`, fragment: `param/foobar`});
      expect(window.history.length).to.equal(historyLength + 3);
    });

    it(`can use replaceState to avoid adding a history entry`, async function () {
      const historyLength = window.history.length;

      this.routerApp.router.replaceLocation({path: `/`, historyMethod: `replaceState`});
      expect(window.history.length).to.equal(historyLength);
      this.routerApp.router.replaceLocation({path: `/widget/bar baz`, historyMethod: `replaceState`});
      expect(window.history.length).to.equal(historyLength);
    });
  });
});
