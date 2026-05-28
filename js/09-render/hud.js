'use strict';

function drawComboBar() {
  const x = 440;
  const y = 74;
  const width = 420;
  const height = 24;
  const color = comboColor();

  ctx.save();
  ctx.fillStyle = 'rgba(5, 8, 24, 0.9)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  roundRect(x, y, width, height, 8, true, true);
  ctx.fillStyle = color;
  roundRect(x + 3, y + 3, (width - 6) * comboProgress(), height - 6, 6, true, false);
  ctx.restore();
  drawNeonText(`X${GAME.combo.level}`, x - 24, y + height / 2, 27, 'right', color, 14);
}


function drawPowerupIcon(power, x, y, slotSize = 52) {
  const center = slotSize / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(5, 8, 24, 0.86)';
  ctx.strokeStyle = power ? power.color : 'rgba(170, 183, 196, 0.55)';
  ctx.lineWidth = 2;
  ctx.shadowColor = power ? power.color : '#aab7c4';
  ctx.shadowBlur = power ? 12 : 2;
  roundRect(x, y, slotSize, slotSize, 12, true, true);
  ctx.restore();

  if (!power) {
    drawNeonText('?', x + center, y + center, 22, 'center', '#aab7c4', 3);
    return;
  }

  ctx.save();
  ctx.font = '25px "Trebuchet MS", Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(power.icon, x + center, y + 21);
  ctx.restore();
  drawNeonText(power.keyword, x + center, y + 42, 9, 'center', power.color, 5);
}

function drawPowerupHud() {
  const slotSize = 52;
  const gap = 14;
  const totalWidth = MAX_POWERUP_SLOTS * slotSize + (MAX_POWERUP_SLOTS - 1) * gap;
  const x = WIDTH / 2 - totalWidth / 2;
  const y = Math.min(GAME.gridBottom + 118, HEIGHT - slotSize - 8);

  drawNeonText('POWERS', x - 18, y + slotSize / 2, 13, 'right', '#ffd34d', 8);

  for (let i = 0; i < MAX_POWERUP_SLOTS; i += 1) {
    const key = GAME.powerInventory[i];
    drawPowerupIcon(key ? POWERUPS[key] : null, x + i * (slotSize + gap), y, slotSize);
  }
}

function drawActivePowerTimers() {
  const active = Object.entries(GAME.activePowers);
  if (active.length === 0) {
    return;
  }

  let y = 126;
  for (const [key, timeLeft] of active) {
    const power = POWERUPS[key];
    drawNeonText(`${power.icon} ${power.name} ${timeLeft.toFixed(1)}s`, WIDTH / 2, y, 17, 'center', power.color, 8);
    y += 22;
  }
}

function drawHud() {
  drawPanel(26, 20, 182, 108, '#ff38c8');
  drawNeonText('ZONE', 48, 48, 27, 'left', '#ff38c8', 14);
  drawNeonText('TYPERS', 48, 77, 27, 'left', '#35f6ff', 14);
  drawNeonText(VERSION, 50, 104, 13, 'left', '#eafcff', 6);

  drawNeonText('SCORE', WIDTH / 2, 22, 20, 'center', '#ff5edb', 12);
  drawNeonText(String(GAME.score).padStart(7, '0'), WIDTH / 2, 50, 38, 'center', '#ffd34d', 15);
  drawComboBar();
  drawPowerupHud();
  drawActivePowerTimers();

  drawPanel(1094, 20, 154, 116, '#35f6ff');
  drawNeonText(`STAGE ${String(GAME.stage).padStart(2, '0')}`, 1114, 49, 20, 'left', '#35f6ff', 10);
  drawNeonText(`ACC ${getAccuracy()}%`, 1114, 78, 17, 'left', '#eafcff', 6);
  drawNeonText(`KILLS ${GAME.telemetry.monstersKilled}`, 1114, 106, 17, 'left', '#eafcff', 6);
}

function drawFloatingTexts() {
  for (const floatingText of GAME.floatingTexts) {
    ctx.globalAlpha = clamp(floatingText.ttl, 0, 1);
    drawNeonText(floatingText.text, floatingText.x, floatingText.y, 18, 'center', '#ffd34d', 8);
    ctx.globalAlpha = 1;
  }
}

