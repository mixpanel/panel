# Using Contexts to share configuration & state

A Panel component can be configured with Contexts to share configuration & state in its DOM tree instead of manually passing them into each component as props/attrs.

To configure a component to provide contexts to all components in its DOM tree (including itself), set `defaultContexts` in its `config` object:
```js
get config() {
  return {
    defaultContexts: {
      counter: new Counter(),
      darkMode: true,
    },
  };
}
```

Components must declare the names of any contexts it intends to use in its `config` object:
```js
get config() {
  return {
    contexts: [`counter`, `darkMode`],
  };
}
```

Once you've declared the context names, you can retrieve a context object/value by calling `Component.getContext(contextName)` (or `$component.getContext(contextName)` in jade):
```jade
-- /* index.jade */
div Current count is #{$component.getContext(`counter`).getCount()})
```

Any object or value can be a context, but you can optionally define callback properties you can define that Panel recognizes and invokes during the component lifecycle:
```js
class Counter {
  constructor() {
    this._count = 0;
    this._connectedComponents = new Set();
  }
  increment() {
    this._count++;
    for (const component of this._connectedComponents) {
      component.update();
    }
  }
  getCount() {
    return this._count;
  }

  // optional callback property that executes each time a component using this context is connected to the DOM
  bindToComponent(component) {
    this._connectedComponents.add(component);
  }

  // optional callback property that executes each time a component using this context is disconnected from the DOM
  unbindFromComponent(component) {
    this._connectedComponents.delete(component);
  }
}
```

To install and run the example from this directory: `npm install && npm start`. The page will be served on `localhost:8080` by Webpack dev server.
