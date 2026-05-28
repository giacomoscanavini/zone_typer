'use strict';

restartGame();
requestAnimationFrame((timestamp) => {
  GAME.lastTime = timestamp;
  requestAnimationFrame(loop);
});
