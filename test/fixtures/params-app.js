import {Component, jsx} from '../../lib';

export class ParamParentApp extends Component {
  get config() {
    return {
      defaultState: {
        obj: {},
        str: ``,
        bool: false,
        num: 0,
        arr: [],
        map: new Map(),
        set: new Set(),
      },

      template: () =>
        jsx(`param-child`, {
          params: {
            obj: this.state.obj,
            num: this.state.num,
            str: this.state.str,
            bool: this.state.bool,
            arr: this.state.arr,
            map: this.state.map,
            set: this.state.set,
          },
        }),
    };
  }
}

const shouldUpdate = (newVal, oldVal) => newVal !== oldVal;

export class ParamChild extends Component {
  get config() {
    return {
      params: {
        obj: {
          type: Object,
          shouldUpdate,
        },
        str: String,
        bool: Boolean,
        num: Number,
        arr: {
          type: Array,
          shouldUpdate,
        },
        map: {
          type: Map,
          shouldUpdate,
        },
        set: {
          type: Set,
          shouldUpdate,
        },
      },
      template: () =>
        jsx(`div`, {}, [
          jsx(`div`, {sel: `#str`}, this.params.str),
          jsx(`div`, {sel: `#num`}, this.params.num),
          jsx(`div`, {sel: `#bool`}, this.params.bool),
          jsx(`div`, {sel: `#obj`}, JSON.stringify(this.params.obj)),
          jsx(`div`, {sel: `#arr`}, JSON.stringify(this.params.arr)),
          jsx(`div`, {sel: `#map`}, JSON.stringify(this.params.map)),
          jsx(`div`, {sel: `#set`}, JSON.stringify(this.params.set)),
        ]),
    };
  }
}
