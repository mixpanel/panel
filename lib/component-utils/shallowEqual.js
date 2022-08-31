/**
 * reference from https://github.com/facebook/react/blob/b36f7223573c23da8ed794fcac81c607c389fe5f/packages/shared/shallowEqual.js
 * with slight modifications
 * Performs equality by iterating through keys on an object and returning false
 * when any key has values which are not strictly equal between the arguments.
 * Returns true when the values of all keys are strictly equal.
 */
export default function shallowEqual(objA, objB) {
  if (Object.is(objA, objB)) {
    return true;
  }

  if (typeof objA !== `object` || objA === null || typeof objB !== `object` || objB === null) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  // Test for A's keys different from B.
  for (let i = 0; i < keysA.length; i++) {
    const currentKey = keysA[i];
    if (!objB.hasOwnProperty(currentKey) || !Object.is(objA[currentKey], objB[currentKey])) {
      return false;
    }
  }

  return true;
}
