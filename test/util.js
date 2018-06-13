import raf from 'raf';

const requestAnimationFrame = ((window && window.requestAnimationFrame) || raf);
export const nextAnimationFrame = () => new Promise(requestAnimationFrame);
