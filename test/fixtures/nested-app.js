import {Component, h} from '../../lib';

export class NestedApp extends Component {
  get config() {
    return {
      defaultState: {
        title: `test`,
      },

      hooks: {
        preUpdate: () => this.nestedPreTitle = this.state.title,
        postUpdate: () => this.nestedPostTitle = this.state.title,
      },

      template: state => h(`div`, {class: {'nested-foo': true}}, [
        h(`h1`, `Nested app: ${state.title}`),
        this.child(`nested-child`, {attrs: {'state-animal': `llama`}}),
      ]),
    };
  }
}

export class NestedChild extends Component {
  get config() {
    return {
      template: state => h(`div`, {class: {'nested-foo-child': true}}, [
        h(`p`, `parent title: ${state.title}`),
        h(`p`, `animal: ${state.animal}`),
      ]),
    };
  }
}
