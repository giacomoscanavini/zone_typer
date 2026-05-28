'use strict';

function render() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  const shake = Math.max(0, GAME.screenShake);
  const offsetX = shake > 0 ? (Math.random() - 0.5) * shake : 0;
  const offsetY = shake > 0 ? (Math.random() - 0.5) * shake : 0;

  drawCityBackground();

  ctx.save();
  ctx.translate(offsetX, offsetY);
  drawGrid();
  drawWords();
  drawInputUnderGrid();
  drawLasers();
  drawMonsters();
  drawFloatingTexts();
  ctx.restore();

  drawHud();
  drawOverlay();
}

function loop(timestamp) {
  const dt = Math.min((timestamp - GAME.lastTime) / 1000, 0.05);
  GAME.lastTime = timestamp;

  update(dt);
  render();
  requestAnimationFrame(loop);
}
