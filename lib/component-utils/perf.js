/**
 * Attempt to use a high resolution timestamp when in the browswer environment, but fallback to Date.now
 * When the performance API is not available.
 */
export function getNow() {
  if (typeof performance !== `undefined`) {
    return performance.now();
  }
  return Date.now();
}
