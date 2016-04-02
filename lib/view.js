export default class View {
  constructor(parent, initialState={}) {
    this.parent = parent;
    this.initialState = initialState;
    this._template = this.TEMPLATE;
    this._views = this.VIEWS;
    this._viewRenderers = Object.keys(this._views).reduce((renderers, vname) => {
      const view = this._views[vname];
      return Object.assign({}, renderers, {[vname]: view.render.bind(view)});
    }, {});
  }

  get TEMPLATE() {
    throw 'TEMPLATE must be provided by subclass';
  }

  get VIEWS() {
    return {};
  }

  get templateHandlers() {
    return {};
  }

  get templateHelpers() {
    return {};
  }

  render(state) {
    return this._template(
      Object.assign({}, state, {
        handlers: this.templateHandlers,
        helpers: this.templateHelpers,
        state,
        views: this._viewRenderers,
      })
    );
  }

  postRender() {
    this.onRendered && this.onRendered();

    for (let k in this._views) {
      this._views[k].postRender();
    }
  }

  setApp(app) {
    this.app = app;
    Object.assign(app.state, this.initialState);
    Object.keys(this._views).forEach(v => this._views[v].setApp(app));
  }
}
