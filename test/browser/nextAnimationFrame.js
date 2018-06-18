export default function nextAnimationFrame() {
  return new Promise(resolve => requestAnimationFrame(resolve));
}
