// import from the same repo. in a different repo you'd use:
// import { Component, PanelLifecycleContext } from 'panel';
import {Component, PanelLifecycleContext} from '../../lib';

export class Counter implements PanelLifecycleContext {
  public bindToComponent(component: Component<any>): void;
  public unbindFromComponent(component: Component<any>): void;
  public increment(): void;
  public getCount(): number;
}

export interface AppContextRegistry {
  counter: Counter;
  darkMode: boolean;
}
