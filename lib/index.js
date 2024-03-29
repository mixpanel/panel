/**
 * Entry point for Panel apps and components
 * @module panel
 * @example
 * import { Component } from 'panel';
 * customElements.define('my-widget', class extends Component {
 *   // app definition
 * });
 */

import Component from './component';
import ComponentUtils from './component-utils';
import shallowEqual from './component-utils/shallowEqual';
import {h} from './dom-patcher';
import {jsx} from 'snabbdom-jsx-lite';

const {StateController, StateStore} = ComponentUtils;

const ParamComponent = Component;

export {
  /** {@link ParamComponent} newer class with modified generic types */
  ParamComponent,
  /** {@link Component} class, to be subclassed by apps */
  Component,
  /** {@link component-utils} wrappers and utilities */
  ComponentUtils,
  /** {@link StateController} class, to be subclassed by apps */
  StateController,
  /** A simple subscribable state store */
  StateStore,
  /** helper function for `shouldComponentUpdate` callback */
  shallowEqual,
  /**
   * [snabbdom]{@link https://github.com/snabbdom/snabbdom} function to create Hyperscript nodes,
   * exported here for user convenience
   */
  h,
  /**
   * `jsx` is similar to snabbdom's `h` function but supports jsx(tag, props, ...children) interface to create Hyperscript nodes.
   * exported besides h for user convenience.
   */
  jsx,
};
