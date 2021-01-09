export class Counter {
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
