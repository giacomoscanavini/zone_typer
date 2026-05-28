'use strict';

function roundRect(x, y, width, height, radius = 10, fill = true, stroke = false) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function drawPanel(x, y, width, height, color = '#35f6ff', alpha = 0.12) {
  ctx.save();
  ctx.fillStyle = `rgba(5, 8, 24, 0.78)`;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  roundRect(x, y, width, height, 14, true, true);
  ctx.shadowBlur = 0;
  ctx.fillStyle = color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
  ctx.restore();
}

function drawNeonText(text, x, y, size = 18, align = 'left', color = '#eafcff', glow = 8) {
  ctx.save();
  ctx.font = `700 ${size}px "Trebuchet MS", Arial`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawText(text, x, y, size = 18, align = 'left') {
  ctx.font = `700 ${size}px "Trebuchet MS", Arial`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}
