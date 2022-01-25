function stripHash(fragment) {
  return fragment.replace(/^#*/, ``);
}

function decodedFragmentsEqual(currFragment, newFragment) {
  // decodeURIComponent since hash fragments are encoded while being
  // written to url, making `#bar baz` and `#bar%20baz` effectively the same.
  // This can result in hash update loops if the client passes in decoded hash.
  return decodeURIComponent(currFragment) === decodeURIComponent(newFragment);
}

// https://github.com/jashkenas/backbone/blob/d682061a/backbone.js#L1476-L1479
// Cached regular expressions for matching named param parts and splatted
// parts of route strings.
const optionalParam = /\((.*?)\)/g;
const namedParam = /(\(\?)?:\w+/g;
const splatParam = /\*\w+/g;
const escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g; // eslint-disable-line no-useless-escape
function compileRouteExpression(routeExpr) {
  // https://github.com/jashkenas/backbone/blob/d682061a/backbone.js#L1537-L1547
  const expr = routeExpr
    .replace(escapeRegExp, `\\$&`)
    .replace(optionalParam, `(?:$1)?`)
    .replace(namedParam, (match, optional) => (optional ? match : `([^/?]+)`))
    .replace(splatParam, `([^?]*?)`);
  return new RegExp(`^` + expr + `(?:\\?([\\s\\S]*))?$`);
}

function getCompiledHashRoutes(routeDefs) {
  return Object.keys(routeDefs).map((hashRouteExpr) => {
    let handler = routeDefs[hashRouteExpr];
    if (typeof handler === `string`) {
      // reference to another handler rather than its own function
      handler = routeDefs[handler];
    }

    return {
      expr: compileRouteExpression(hashRouteExpr),
      handler,
    };
  });
}

export default class Router {
  constructor(app, options = {}) {
    // allow injecting window dep
    this.window = options.window || window;

    this.app = app;
    const routeDefs = this.app.getConfig(`routes`);

    // by default assume we are at the root path
    this.basePathExpr = new RegExp(`/$`);

    // check if using new path-routing configuration
    if (`paths` in routeDefs && Array.isArray(routeDefs.paths)) {
      if (routeDefs.basePath) {
        this.basePathExpr = compileRouteExpression(routeDefs.basePath);
      }

      this.compiledRoutes = routeDefs.paths.map((path) => {
        return {
          pathExpr: compileRouteExpression(path.pathName),
          hashRoutes: getCompiledHashRoutes(path.hashRoutes),
        };
      });
    } else {
      this.compiledRoutes = [
        {
          // match any path if none are provided
          pathExpr: compileRouteExpression(`*`),
          hashRoutes: getCompiledHashRoutes(routeDefs),
        },
      ];
    }

    this.registerListeners(options.historyMethod || `pushState`);
  }

  registerListeners(historyMethod) {
    this.navigateToHash = () => this.navigate(this.window.location.hash);
    this.window.addEventListener(`popstate`, this.navigateToHash);

    this.historyMethod = historyMethod;
    this.origChangeStateMethod = this.window.history[this.historyMethod];

    this.window.history[this.historyMethod] = (...args) => {
      this.origChangeStateMethod.apply(this.window.history, args);
      this.navigateToHash();
      // fire "pushstate" or "replacestate" event so external action can be taken on url change
      // these events are meant to be congruent with native "popstate" event
      this.app.dispatchEvent(new CustomEvent(this.historyMethod.toLowerCase()));
    };
  }

  unregisterListeners() {
    this.window.removeEventListener(`popstate`, this.navigateToHash);
    this.window.history[this.historyMethod] = this.origChangeStateMethod;
  }

  // alias for navigateToHash to maintain backwards compatibility.
  navigate(fragment, stateUpdate = {}) {
    return this.navigateToHash(fragment, stateUpdate);
  }

  navigateToHash(fragment, stateUpdate = {}) {
    const currentPath = this.getRelativePathFromWindow();
    for (const {pathExpr, hashRoutes} of this.compiledRoutes) {
      const matches = pathExpr.exec(currentPath);
      if (matches) {
        this.invokeHashRouteHandler(fragment, hashRoutes, stateUpdate);
      }
    }

    // no route matched
    console.error(`No path route found matching ${currentPath}`);
  }

  invokeHashRouteHandler(fragment, compiledHashRoutes, stateUpdate = {}) {
    fragment = stripHash(fragment);
    if (decodedFragmentsEqual(this.app.state.$fragment, fragment) && !Object.keys(stateUpdate).length) {
      return;
    }

    stateUpdate.$fragment = fragment;
    for (const route of compiledHashRoutes) {
      const matches = route.expr.exec(fragment);
      if (matches) {
        // extract params
        // https://github.com/jashkenas/backbone/blob/d682061a/backbone.js#L1553-L1558
        let params = matches.slice(1);
        params = params.map((param, i) => {
          // Don't decode the search params.
          if (i === params.length - 1) {
            return param || null;
          }
          return param ? decodeURIComponent(param) : null;
        });

        const routeHandler = route.handler;
        if (!routeHandler) {
          throw `No route handler defined for #${fragment}`;
        }
        const routeStateUpdate = routeHandler.call(this.app, stateUpdate, ...params);
        if (routeStateUpdate) {
          // don't update if route handler returned a falsey result
          this.app.update(Object.assign({}, stateUpdate, routeStateUpdate));
        }
        return;
      }
    }

    // no route matched
    console.error(`No route found matching #${fragment}`);
  }

  replaceHash(fragment, {historyMethod = null} = {}) {
    historyMethod = historyMethod || this.historyMethod;
    fragment = stripHash(fragment);
    if (!decodedFragmentsEqual(stripHash(this.window.location.hash), fragment)) {
      this.window.history[historyMethod](null, null, `#${fragment}`);
    }
  }

  getRelativePathFromWindow() {
    return this.window.location.pathname.replace(this.basePathExpr, ``) || `/`;
  }
}
