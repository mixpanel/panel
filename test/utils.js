export function compactHtml(htmlStr) {
  return htmlStr.trim().replace(/>\s+</gm, `><`);
}

export {default as nextAnimationFrame} from './server/nextAnimationFrame';
