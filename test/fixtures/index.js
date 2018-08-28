import {AttrApp} from './attr-app';
import {AttrsReflectionApp} from './attrs-reflection-app';
import {BreakableApp} from './breakable-app';
import {ControlledApp} from './controlled-app';
import {CssNoShadowApp} from './css-no-shadow-app';
import {NestedApp, NestedChild} from './nested-app';
import {NestedPartialStateParent, NestedPartialStateChild} from './nested-partial-state-app';
import {ProxyApp, EventProducer} from './proxy-app';
import {ShadowDomApp} from './shadow-dom-app';
import {SimpleApp} from './simple-app';

customElements.define(`attr-app`, AttrApp);
customElements.define(`attrs-reflection-app`, AttrsReflectionApp);
customElements.define(`breakable-app`, BreakableApp);
customElements.define(`controlled-app`, ControlledApp);
customElements.define(`css-no-shadow-app`, CssNoShadowApp);
customElements.define(`event-producer`, EventProducer);
customElements.define(`nested-app`, NestedApp);
customElements.define(`nested-child`, NestedChild);
customElements.define(`nested-partial-state-parent`, NestedPartialStateParent);
customElements.define(`nested-partial-state-child`, NestedPartialStateChild);
customElements.define(`proxy-app`, ProxyApp);
customElements.define(`shadow-dom-app`, ShadowDomApp);
customElements.define(`simple-app`, SimpleApp);
