import serverNextAnimationFrame from './server/nextAnimationFrame';

export function compactHtml(htmlStr) {
  return htmlStr.trim().replace(/>\s+</gm, `><`);
}

export function nextAnimationFrame() {
  if (typeof requestAnimationFrame !== `undefined`) {
    return new Promise((resolve) => requestAnimationFrame(resolve));
  }
  return serverNextAnimationFrame();
}
