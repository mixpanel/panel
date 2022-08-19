import {Panel, jsx} from '../../lib';

export class ParamParentApp extends Panel {
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
        requiredString: `requiredString`,
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
            requiredString: this.state.requiredString,
          },
        }),
    };
  }
}

const shouldUpdate = (newVal, oldVal) => newVal !== oldVal;

export class ParamChild extends Panel {
  get config() {
    return {
      defaultParams: {
        defaultString: `defaultString`,
      },
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
        defaultString: String,
        noDefaultString: String,
        requiredString: {
          type: String,
          required: true,
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

export class ParamDefaultAndRequired extends Panel {
  get config() {
    return {
      defaultParams: {
        requiredString: `requiredString`,
      },
      params: {
        requiredString: {
          type: String,
          required: true,
        },
      },
      template: () => jsx(`div`),
    };
  }
}
