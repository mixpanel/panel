import raf from 'raf';

export const nextAnimationFrame = () => new Promise(raf);
