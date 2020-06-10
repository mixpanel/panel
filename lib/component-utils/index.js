/**
 * Optional component wrappers and utilities for state management;
 * exported in the main {@link panel} module for convenience.
 * @module component-utils
 * @example
 * // direct top-level import
 * import {ProxyComponent, StateController} from 'panel';
 * // module import
 * import {ComponentUtils} from 'panel';
 * const {ProxyComponent, StateController} = ComponentUtils;
 */

import StateController from './state-controller';
import StateStore from './state-store';

export default {
  /** {@link StateController} class, to be subclassed by apps */
  StateController,

  /** A simple subscribable state store */
  StateStore,
};
