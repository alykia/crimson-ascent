import { Game } from './core/Game.js';

const canvas = document.getElementById('game-canvas');
const uiRoot = document.getElementById('ui-layer');

const game = new Game(canvas, uiRoot);
game.start();

document.addEventListener('visibilitychange', () => {
  if (document.hidden) game.loop.stop();
  else game.loop.start();
});

if (import.meta.env?.DEV) {
  window.__crimson = game;
}
