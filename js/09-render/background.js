'use strict';

function drawCityBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, '#07051f');
  sky.addColorStop(0.52, '#09091a');
  sky.addColorStop(1, '#02030a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.save();
  ctx.globalAlpha = 0.9;
  for (let i = 0; i < 42; i += 1) {
    const x = i * 34 + ((i * 19) % 17);
    const h = 70 + ((i * 47) % 160);
    const y = HEIGHT - 80 - h;
    ctx.fillStyle = i % 3 === 0 ? 'rgba(11, 28, 58, 0.72)' : 'rgba(9, 18, 43, 0.62)';
    ctx.fillRect(x, y, 24 + (i % 4) * 10, h);
    ctx.fillStyle = i % 2 === 0 ? 'rgba(53,246,255,0.28)' : 'rgba(255,56,200,0.26)';
    for (let wy = y + 14; wy < HEIGHT - 96; wy += 22) {
      if ((wy + i) % 3 !== 0) ctx.fillRect(x + 6, wy, 4, 7);
      if ((wy + i) % 4 !== 0) ctx.fillRect(x + 16, wy, 4, 7);
    }
  }
  ctx.globalAlpha = 1;

  const floor = ctx.createLinearGradient(0, HEIGHT - 92, 0, HEIGHT);
  floor.addColorStop(0, 'rgba(18, 9, 38, 0.88)');
  floor.addColorStop(1, '#03030b');
  ctx.fillStyle = floor;
  ctx.fillRect(0, HEIGHT - 95, WIDTH, 95);
  ctx.strokeStyle = 'rgba(255,56,200,0.28)';
  ctx.lineWidth = 1;
  for (let x = -WIDTH; x < WIDTH * 2; x += 58) {
    ctx.beginPath();
    ctx.moveTo(x, HEIGHT);
    ctx.lineTo(WIDTH / 2 + (x - WIDTH / 2) * 0.14, HEIGHT - 95);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(53,246,255,0.18)';
  for (let y = HEIGHT - 8; y > HEIGHT - 95; y -= 17) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
  ctx.restore();
}
