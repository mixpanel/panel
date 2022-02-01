import {join} from 'path';

function stripHash(fragment) {
  return fragment.replace(/^#*/, ``);
}

function decodedStringsEqual(currFragment, newFragment) {
  // decodeURIComponent since URI components are encoded while being
  // written to url, making `bar baz` and `bar%20baz` effectively the same.
  // This can result in update loops if the client passes in decoded path or hash.
  return decodeURIComponent(currFragment) === decodeURIComponent(newFragment);
}

// https://github.com/jashkenas/backbone/blob/d682061a/backbone.js#L1476-L1479
// Cached regular expressions for matching named param parts and splatted
// parts of route strings.
const optionalParam = /\((.*?)\)/g;
const namedParam = /(\(\?)?:\w+/g;
const splatParam = /\*\w+/g;
const escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g; // eslint-disable-line no-useless-escape
function compileRouteExpression(routeExpr, end = true) {
  // https://github.com/jashkenas/backbone/blob/d682061a/backbone.js#L1537-L1547
  const expr = routeExpr
    .replace(escapeRegExp, `\\$&`)
    .replace(optionalParam, `(?:$1)?`)
    .replace(namedParam, (match, optional) => (optional ? match : `([^/?]+)`))
    .replace(splatParam, `([^?]*?)`);

  return new RegExp(`^` + expr + `(?:\\?([\\s\\S]*))?${end ? `$` : ``}`);
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

function extractParamsFromMatches(matches) {
  // https://github.com/jashkenas/backbone/blob/d682061a/backbone.js#L1553-L1558
  const params = matches.slice(1);
  return params.map((param, i) => {
    // Don't decode the search params.
    if (i === params.length - 1) {
      return param || null;
    }
    return param ? decodeURIComponent(param) : null;
  });
}

export function isPathRouteConfig(routeDefs) {
  return `paths` in routeDefs && Array.isArray(routeDefs.paths);
}

export default class Router {
  constructor(app, options = {}) {
    // allow injecting window dep
    this.window = options.window || window;

    this.app = app;
    const routeDefs = this.app.getConfig(`routes`);

    // by default assume we are at the root path
    this.basePathExpr = new RegExp(`^/$`);

    this.isPathRouteConfig = isPathRouteConfig(routeDefs);
    if (this.isPathRouteConfig) {
      if (routeDefs.basePath) {
        this.basePathExpr = compileRouteExpression(routeDefs.basePath, false);
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
          pathExpr: new RegExp(`.*`),
          hashRoutes: getCompiledHashRoutes(routeDefs),
        },
      ];
    }

    this.registerListeners(options.historyMethod || `pushState`);
  }

  registerListeners(historyMethod) {
    this.handleNavigation = () => {
      this.pathNavigate(this.getRelativePathFromWindow(), this.window.location.hash);
    };

    this.window.addEventListener(`popstate`, this.handleNavigation);

    this.historyMethod = historyMethod;
    this.origChangeStateMethod = this.window.history[this.historyMethod];

    this.window.history[this.historyMethod] = (...args) => {
      this.origChangeStateMethod.apply(this.window.history, args);
      this.handleNavigation();
      // fire "pushstate" or "replacestate" event so external action can be taken on url change
      // these events are meant to be congruent with native "popstate" event
      this.app.dispatchEvent(new CustomEvent(this.historyMethod.toLowerCase()));
    };
  }

  unregisterListeners() {
    this.window.removeEventListener(`popstate`, this.handleNavigation);
    this.window.history[this.historyMethod] = this.origChangeStateMethod;
  }

  // alias for hashNavigate to maintain backwards compatibility.
  navigate(fragment, stateUpdate = {}) {
    return this.hashNavigate(fragment, stateUpdate);
  }

  hashNavigate(fragment, stateUpdate = {}) {
    const currentPath = this.getRelativePathFromWindow();
    for (const {pathExpr, hashRoutes} of this.compiledRoutes) {
      const matches = pathExpr.exec(currentPath);
      if (matches) {
        this.invokeHashRouteHandler(fragment, hashRoutes, stateUpdate);
        return;
      }
    }

    // no route matched
    console.error(`No path route found matching ${currentPath}`);
  }

  pathNavigate(path, fragment = ``, stateUpdate = {}) {
    const basePathMatch = this.window.location.pathname.match(this.basePathExpr);
    if (!basePathMatch) {
      console.error(`Provided basePath does not match location: ${this.window.location.pathname}`);
      return;
    }

    stateUpdate.$path = path;
    for (const {pathExpr, hashRoutes} of this.compiledRoutes) {
      const matches = pathExpr.exec(path);
      if (matches) {
        const params = extractParamsFromMatches(matches);
        this.invokeHashRouteHandler(fragment, hashRoutes, stateUpdate, params);
        return;
      }
    }
  }

  invokeHashRouteHandler(fragment, compiledHashRoutes, stateUpdate = {}, pathParams = []) {
    fragment = stripHash(fragment);
    if (decodedStringsEqual(this.app.state.$fragment, fragment) && !Object.keys(stateUpdate).length) {
      return;
    }

    stateUpdate.$fragment = fragment;
    for (const route of compiledHashRoutes) {
      const matches = route.expr.exec(fragment);
      if (matches) {
        const hashParams = extractParamsFromMatches(matches);

        const routeHandler = route.handler;
        if (!routeHandler) {
          throw `No route handler defined for #${fragment}`;
        }

        let routeStateUpdate;
        // for path routing config, our handler should expect separated path and hash params
        if (this.isPathRouteConfig) {
          routeStateUpdate = routeHandler.call(this.app, stateUpdate, pathParams, hashParams);
        } else {
          routeStateUpdate = routeHandler.call(this.app, stateUpdate, ...hashParams);
        }

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

  replaceLocation({path = null, historyMethod = null, fragment = null} = {}) {
    historyMethod = historyMethod || this.historyMethod;

    const basePathMatch = this.window.location.pathname.match(this.basePathExpr);
    // const fullPath = `${basePathMatch[0]}${path}`.replace(/\/$/, ``); // remove trailing slash, can we do this better?
    const fullPath = join(basePathMatch[0], path || ``);

    let url = ``;
    if (path && !decodedStringsEqual(this.window.location.pathname, fullPath)) {
      url += fullPath;
    }
    if (fragment && !decodedStringsEqual(stripHash(this.window.location.hash), stripHash(fragment))) {
      url += `#${stripHash(fragment)}`;
    }

    if (url) {
      this.window.history[historyMethod](null, null, url);
    }
  }

  getRelativePathFromWindow() {
    return this.window.location.pathname.replace(this.basePathExpr, ``).replace(/^\/?/, `/`);
  }
}
