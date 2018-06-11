import {Component, h} from '../../lib';

export class NestedPartialStateParent extends Component {
  get config() {
    return {
      appState: {
        title: `test`,
      },
      defaultState: {
        nonSharedStateExample: `I am parent`,
        parentOnlyState: `hello`,
        title: `parent-specific title`,
      },

      template: state => h(`div`, {class: {'nested-partial-parent': true}}, [
        h(`h1`, `Nested partial shared state app title: ${state.$app.title}`),
        h(`p`, `component-specific title: ${state.title}`),
        h(`p`, `parent: parentOnlyState: ${state.parentOnlyState}`),
        h(`p`, `parent: childOnlyState: ${state.childOnlyState}`),
        h(`p`, `parent: nonSharedStateExample: ${state.nonSharedStateExample}`),
        this.child(`nested-partial-state-child`),
      ]),
    };
  }
}

export class NestedPartialStateChild extends Component {
  get config() {
    return {
      defaultState: {
        nonSharedStateExample: `I am child`,
        childOnlyState: `world`,
        title: `child-specific title`,
      },

      template: state => h(`div`, {class: {'nested-partial-child': true}}, [
        h(`p`, `shared title: ${state.$app.title}`),
        h(`p`, `component-specific title: ${state.title}`),
        h(`p`, `childOnlyState: ${state.childOnlyState}`),
        h(`p`, `child: parentOnlyState: ${state.parentOnlyState}`),
        h(`p`, `child: nonSharedStateExample: ${state.nonSharedStateExample}`),
      ]),
    };
  }
}
