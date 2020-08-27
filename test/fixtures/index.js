import {AttrsReflectionApp} from './attrs-reflection-app';
import {BadAttrsSchemaApp} from './bad-attrs-schema-app';
import {BreakableApp} from './breakable-app';
import {CssNoShadowApp} from './css-no-shadow-app';
import {DelayedAttrRemoveApp} from './delayed-attr-remove-app';
import {NestedApp, NestedChild} from './nested-app';
import {NestedKeyedChildrenApp, NestedKeyedChild1, NestedKeyedChild2} from './nested-keyed-children-app';
import {NestedPartialStateParent, NestedPartialStateChild} from './nested-partial-state-app';
import {BadBooleanRequiredAttrsSchemaApp, RequiredAttrsSchemaApp} from './required-attrs-schema-app';
import {ShadowDomApp} from './shadow-dom-app';
import {SimpleApp} from './simple-app';

customElements.define(`attrs-reflection-app`, AttrsReflectionApp);
customElements.define(`bad-attrs-schema-app`, BadAttrsSchemaApp);
customElements.define(`bad-required-attrs-schema-app`, BadBooleanRequiredAttrsSchemaApp);
customElements.define(`breakable-app`, BreakableApp);
customElements.define(`css-no-shadow-app`, CssNoShadowApp);
customElements.define(`delayed-attr-remove-app`, DelayedAttrRemoveApp);
customElements.define(`nested-app`, NestedApp);
customElements.define(`nested-child`, NestedChild);
customElements.define(`nested-keyed-children-app`, NestedKeyedChildrenApp);
customElements.define(`nested-keyed-child1`, NestedKeyedChild1);
customElements.define(`nested-keyed-child2`, NestedKeyedChild2);
customElements.define(`nested-partial-state-parent`, NestedPartialStateParent);
customElements.define(`nested-partial-state-child`, NestedPartialStateChild);
customElements.define(`required-attrs-schema-app`, RequiredAttrsSchemaApp);
customElements.define(`shadow-dom-app`, ShadowDomApp);
customElements.define(`simple-app`, SimpleApp);
