import {Component, h} from '../../lib';

export class NestedKeyedChildrenApp extends Component {
  static get attrsSchema() {
    return {'letters': `json`};
  }

  get config() {
    return {
      appState: {
        letterToWord: {
          a: `alpha`,
          b: `bravo`,
          c: `charlie`,
          d: `delta`,
          e: `echo`,
        },
      },

      template: ({$attr}) => h(`div`, {class: {'letter-lookup-app': true}}, $attr(`letters`).map(letter => (
        this.child(`nested-keyed-child1`, {key: letter, attrs: {letter}})
      ))),
    };
  }
}

export class NestedKeyedChild1 extends Component {
  static get attrsSchema() {
    return {'letter': `string`};
  }

  get config() {
    return {
      template: ({$attr}) => h(`div`, {class: {'letter-kookup-child1': true}}, [
        this.child(`nested-keyed-child2`, {attrs: {letter: $attr(`letter`)}}),
      ]),
    };
  }
}

export class NestedKeyedChild2 extends Component {
  static get attrsSchema() {
    return {'letter': `string`};
  }

  get config() {
    return {
      template: ({$attr}) => h(`div`, {class: {'letter-kookup-child2': true}}, [
        h(`p`, this.appState.letterToWord[$attr(`letter`)]),
      ]),
    };
  }
}
