'use strict';

function drawLasers() {
  for (const laser of GAME.lasers) {
    const alpha = Math.max(0, Math.min(1, laser.ttl / laser.maxTtl));
    const headX = laser.x;
    const tailX = laser.x + laser.length;
    const wobble = Math.sin((1 - alpha) * 24) * 3;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    ctx.shadowColor = laser.color;
    ctx.shadowBlur = 24;

    const gradient = ctx.createLinearGradient(headX, laser.y, tailX, laser.y);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.28, laser.color);
    gradient.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(headX, laser.y + wobble);
    ctx.lineTo(tailX, laser.y - wobble);
    ctx.stroke();

    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(headX, laser.y + wobble, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = laser.color;
    ctx.globalAlpha = alpha * 0.45;
    ctx.beginPath();
    ctx.arc(headX + 10, laser.y - wobble, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
