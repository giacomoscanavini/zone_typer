'use strict';

/* reusable drawing helpers */
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


/* city background */
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


/* lanes, grid, words, input panel */
function drawGrid() {
  const laneWidth = GAME.gridRight - GAME.gridLeft;
  const cellCount = 12;
  const cellWidth = laneWidth / cellCount;

  ctx.save();
  ctx.shadowColor = '#ff38c8';
  ctx.shadowBlur = 18;
  ctx.strokeStyle = '#ff38c8';
  ctx.lineWidth = 2;
  roundRect(GAME.gridLeft - 14, GAME.gridTop - 14, laneWidth + 92, GAME.gridBottom - GAME.gridTop + 28, 18, false, true);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = 'rgba(3, 6, 18, 0.82)';
  roundRect(GAME.gridLeft, GAME.gridTop, laneWidth, GAME.gridBottom - GAME.gridTop, 8, true, false);

  const floorGrad = ctx.createLinearGradient(GAME.gridLeft, GAME.gridTop, GAME.gridRight, GAME.gridBottom);
  floorGrad.addColorStop(0, 'rgba(44, 17, 55, 0.36)');
  floorGrad.addColorStop(0.55, 'rgba(8, 15, 35, 0.82)');
  floorGrad.addColorStop(1, 'rgba(18, 34, 62, 0.56)');
  ctx.fillStyle = floorGrad;
  roundRect(GAME.gridLeft, GAME.gridTop, laneWidth, GAME.gridBottom - GAME.gridTop, 8, true, false);

  for (const lane of GAME.lanes) {
    const danger = getLaneDanger(lane.index);
    const flashAlpha = lane.flashTimer > 0 ? 0.24 : 0;
    const warningAlpha = danger > 0.68 ? (danger - 0.68) * 0.95 : 0;

    ctx.fillStyle = `rgba(53, 246, 255, ${flashAlpha})`;
    ctx.fillRect(GAME.gridLeft, lane.top, laneWidth, lane.bottom - lane.top);

    ctx.fillStyle = `rgba(255, 56, 200, ${warningAlpha})`;
    ctx.fillRect(GAME.gridLeft, lane.top, laneWidth, lane.bottom - lane.top);
  }

  ctx.strokeStyle = 'rgba(53, 246, 255, 0.22)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= cellCount; i += 1) {
    const x = GAME.gridLeft + i * cellWidth;
    ctx.beginPath();
    ctx.moveTo(x, GAME.gridTop);
    ctx.lineTo(x, GAME.gridBottom);
    ctx.stroke();
  }

  for (const lane of GAME.lanes) {
    ctx.strokeStyle = 'rgba(255, 56, 200, 0.62)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(GAME.gridLeft, lane.top);
    ctx.lineTo(GAME.gridRight, lane.top);
    ctx.stroke();

    ctx.fillStyle = 'rgba(10, 6, 28, 0.86)';
    ctx.strokeStyle = '#8f4dff';
    ctx.shadowColor = '#8f4dff';
    ctx.shadowBlur = 8;
    roundRect(GAME.gridLeft - 48, lane.y - 19, 34, 38, 8, true, true);
    ctx.shadowBlur = 0;
    drawNeonText(String(lane.index + 1), GAME.gridLeft - 31, lane.y, 20, 'center', '#d8b4ff', 8);
  }

  const lastLane = GAME.lanes[GAME.lanes.length - 1];
  ctx.strokeStyle = 'rgba(255, 56, 200, 0.62)';
  ctx.beginPath();
  ctx.moveTo(GAME.gridLeft, lastLane.bottom);
  ctx.lineTo(GAME.gridRight, lastLane.bottom);
  ctx.stroke();

  ctx.save();
  const zoneGrad = ctx.createLinearGradient(GAME.protectedZoneX, GAME.gridTop, GAME.protectedZoneX + 60, GAME.gridTop);
  zoneGrad.addColorStop(0, 'rgba(53, 246, 255, 0.26)');
  zoneGrad.addColorStop(1, 'rgba(53, 246, 255, 0.02)');
  ctx.fillStyle = zoneGrad;
  ctx.fillRect(GAME.protectedZoneX, GAME.gridTop, 58, GAME.gridBottom - GAME.gridTop);
  ctx.strokeStyle = '#35f6ff';
  ctx.shadowColor = '#35f6ff';
  ctx.shadowBlur = 16;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(GAME.protectedZoneX, GAME.gridTop - 4);
  ctx.lineTo(GAME.protectedZoneX, GAME.gridBottom + 4);
  ctx.stroke();
  ctx.restore();

  drawNeonText('ZONE', GAME.protectedZoneX + 31, GAME.gridTop - 25, 17, 'center', '#35f6ff', 12);
  ctx.restore();
}


function wordTextSize(word) {
  if (word.length > 18) return 12;
  if (word.length > 14) return 14;
  if (word.length > 10) return 16;
  if (word.length > 7) return 18;
  return 22;
}

function drawWords() {
  for (const lane of GAME.lanes) {
    const word = lane.word;
    const typed = GAME.input;
    const isTarget = word.startsWith(typed) && typed.length > 0;
    const danger = getLaneDanger(lane.index);
    const wordX = GAME.protectedZoneX + 63;
    const panelWidth = 184;
    const panelColor = isTarget ? '#ffd34d' : danger > 0.72 ? '#ff38c8' : '#35f6ff';

    ctx.save();
    ctx.fillStyle = isTarget ? 'rgba(255, 211, 77, 0.10)' : 'rgba(5, 8, 24, 0.78)';
    ctx.strokeStyle = panelColor;
    ctx.lineWidth = isTarget ? 2.5 : 1.5;
    ctx.shadowColor = panelColor;
    ctx.shadowBlur = isTarget ? 14 : 7;
    roundRect(wordX - panelWidth / 2, lane.y - 21, panelWidth, 42, 8, true, true);
    ctx.restore();

    drawNeonText(word, wordX, lane.y, wordTextSize(word), 'center', lane.wrongTimer > 0 ? '#ff7a9d' : isTarget ? '#ffd34d' : '#eafcff', 8);
  }
}


function drawInputUnderGrid() {
  const inputText = GAME.input.length > 0 ? GAME.input : 'TYPE A LANE WORD';
  const y = Math.min(GAME.gridBottom + 58, HEIGHT - 28);
  const width = 520;
  const x = WIDTH / 2 - width / 2;
  const color = GAME.input.length > 0 ? '#ffd34d' : '#35f6ff';

  ctx.save();
  ctx.fillStyle = 'rgba(5, 8, 24, 0.86)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  roundRect(x, y - 22, width, 44, 10, true, true);
  ctx.restore();

  drawNeonText('INPUT', x + 58, y, 16, 'center', '#9befff', 8);
  drawNeonText(inputText, x + 292, y, GAME.input.length > 16 ? 18 : 24, 'center', color, 12);
}


/* sprites, health, shields, labels */
function drawMonsterEye(x, y, color = '#fff6b0') {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#050515';
  ctx.beginPath();
  ctx.arc(x + 1, y, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMonsterSprite(monster, color) {
  const image = SPRITES[monster.typeKey];
  const size = monster.typeKey === 'runner' ? 58 : monster.typeKey === 'tank' ? 68 : monster.typeKey === 'elite' ? 66 : 64;

  if (image && image.complete && image.naturalWidth > 0) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, -size / 2, -size / 2, size, size);
    ctx.restore();
    return;
  }

  // Fallback if image assets are not available.
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, monster.radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawMonsterHealth(monster) {
  if (monster.maxHp <= 1) return;

  const width = 34;
  const height = 5;
  const x = -width / 2;
  const y = monster.radius + 22;
  ctx.save();
  ctx.fillStyle = 'rgba(2, 5, 15, 0.82)';
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  roundRect(x, y, width, height, 3, true, true);
  ctx.fillStyle = monster.hp === monster.maxHp ? '#35f6ff' : '#ff4b6e';
  roundRect(x + 1, y + 1, (width - 2) * (monster.hp / monster.maxHp), height - 2, 2, true, false);
  ctx.restore();
}

function drawShieldBreakCue(monster) {
  if (monster.typeKey !== 'tank' || monster.hp !== monster.maxHp) return;

  const pulse = 0.55 + Math.sin(performance.now() / 120) * 0.18;
  ctx.save();
  ctx.strokeStyle = `rgba(53, 246, 255, ${pulse})`;
  ctx.shadowColor = '#35f6ff';
  ctx.shadowBlur = 18;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, monster.radius + 18, -0.6, Math.PI * 1.65);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, monster.radius + 22, Math.PI * 0.25, Math.PI * 0.88);
  ctx.stroke();
  ctx.restore();
}

function drawMonsterLabel(monster, color) {
  const labels = {
    basic: 'DEMON',
    runner: 'BOT',
    tank: monster.hp === monster.maxHp ? 'SHIELD' : 'TANK',
    elite: 'SKULL',
  };

  ctx.save();
  ctx.globalAlpha = 0.82;
  ctx.fillStyle = 'rgba(5, 8, 24, 0.72)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  roundRect(-28, -42, 56, 16, 4, true, true);
  ctx.restore();
  drawNeonText(labels[monster.typeKey], 0, -34, 9, 'center', color, 5);
}

function drawMonsters() {
  for (const monster of GAME.monsters) {
    if (!monster.active) continue;

    const danger = getLaneDanger(monster.laneIndex);
    const baseColor = monster.typeKey === 'basic' ? '#ff3e55'
      : monster.typeKey === 'runner' ? '#35dfff'
      : monster.typeKey === 'tank' ? '#ffd34d'
      : '#c084fc';
    const color = danger > 0.72 ? '#ff2f6d' : baseColor;
    const bob = Math.sin(performance.now() / 170 + monster.x * 0.05) * 2;

    ctx.save();
    ctx.translate(monster.x, monster.y + bob);


    drawMonsterSprite(monster, color);
    drawShieldBreakCue(monster);
    drawMonsterHealth(monster);

    ctx.restore();
  }
}


/* laser effects */
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



/* score, combo, inventory, active timers, floating text */ 
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
  const totalWidth = MAX_POWERUPS_SLOTS * slotSize + (MAX_POWERUPS_SLOTS - 1) * gap;
  const x = WIDTH / 2 - totalWidth / 2;
  const y = Math.min(GAME.gridBottom + 118, HEIGHT - slotSize - 8);

  drawNeonText('POWERS', x - 18, y + slotSize / 2, 13, 'right', '#ffd34d', 8);

  for (let i = 0; i < MAX_POWERUPS_SLOTS; i += 1) {
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
  const timerX = GAME.gridLeft + 120;
  for (const [key, timeLeft] of active) {
    const power = POWERUPS[key];
    drawNeonText(`${power.icon} ${power.name} ${timeLeft.toFixed(1)}s`, timerX, y, 17, 'center', power.color, 8);
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
    drawNeonText(
      floatingText.text,
      floatingText.x,
      floatingText.y,
      floatingText.size || 18,
      'center',
      floatingText.color || '#ffd34d',
      floatingText.glow || 8
    );
    ctx.globalAlpha = 1;
  }
}



/* powerup selection cards */
function drawPowerupChoices() {
  if (!GAME.stageComplete || GAME.powerChoices.length === 0) {
    return;
  }

  drawPanel(WIDTH / 2 - 430, HEIGHT / 2 - 98, 860, 354, '#ffd34d');
  drawNeonText('CHOOSE A POWERUP', WIDTH / 2, HEIGHT / 2 - 54, 32, 'center', '#ffd34d', 16);
  drawNeonText('press 1, 2, or 3', WIDTH / 2, HEIGHT / 2 - 18, 18, 'center', '#eafcff', 7);

  for (let i = 0; i < GAME.powerChoices.length; i += 1) {
    const power = POWERUPS[GAME.powerChoices[i]];
    const cardWidth = 236;
    const cardHeight = 166;
    const x = WIDTH / 2 - 282 + i * 282;
    const y = HEIGHT / 2 + 106;
    drawPanel(x - cardWidth / 2, y - cardHeight / 2, cardWidth, cardHeight, power.color, 0.16);
    drawNeonText(`[${i + 1}]`, x - 86, y - 50, 18, 'center', '#eafcff', 8);

    ctx.save();
    ctx.font = '36px "Trebuchet MS", Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(power.icon, x, y - 45);
    ctx.restore();

    drawNeonText(power.keyword, x, y - 4, 22, 'center', power.color, 9);
    drawNeonText(`${power.duration || 'instant'}${power.duration ? 's' : ''}`, x, y + 28, 13, 'center', '#eafcff', 5);
    drawNeonText(power.description, x, y + 58, 11, 'center', '#eafcff', 4);
  }

  drawNeonText('type the word to play that power', WIDTH / 2, HEIGHT / 2 + 228, 17, 'center', '#ffd34d', 8);
}



/* start, stage, clear, and game-over overlays */
function drawOverlay() {
  if (!GAME.gameStarted) {
    ctx.fillStyle = 'rgba(3, 3, 12, 0.82)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawPanel(WIDTH / 2 - 310, 138, 620, 356, '#ff38c8');
    drawNeonText('ZONE TYPER', WIDTH / 2, 202, 56, 'center', '#ff00fb', 24);
    drawNeonText('Arcade Defense', WIDTH / 2, 252, 25, 'center', '#35f6ff', 16);
    drawNeonText('Type the word in a lane to fire in that lane', WIDTH / 2, 318, 22, 'center', '#ffd000', 8);
    drawNeonText('Stop monsters before they breach your zone', WIDTH / 2, 354, 22, 'center', '#eafcff', 8);
    drawNeonText('Clear a stage to collect a Power up!', WIDTH / 2, 424, 19, 'center', '#ffd000', 8);
    drawNeonText('Use a power up by typing its keyword', WIDTH / 2, 452, 18, 'center', '#eafcff', 8);
    drawNeonText('PRESS ENTER to start!', WIDTH / 2, 490, 31, 'center', '#35f6ff', 20);
    return;
  }

  if (GAME.stageMessageTimer > 0) {
    ctx.fillStyle = 'rgba(3, 3, 12, 0.50)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawNeonText(`STAGE ${GAME.stage}`, WIDTH / 2, HEIGHT / 2 - 18, 50, 'center', '#ffd34d', 20);
    drawNeonText('PROTECT THE ZONE', WIDTH / 2, HEIGHT / 2 + 34, 23, 'center', '#35f6ff', 12);
  }

  if (GAME.stageComplete) {
    ctx.fillStyle = 'rgba(3, 3, 12, 0.45)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (GAME.stageClearedMessageTimer > 0) {
      drawNeonText(`STAGE ${GAME.clearedStageNumber} CLEARED`, WIDTH / 2, HEIGHT / 2 - 8, 48, 'center', '#35f6ff', 20);
      drawNeonText('Nice Typing!', WIDTH / 2, HEIGHT / 2 + 42, 20, 'center', '#ffd34d', 9);
    } else if (GAME.powerChoices.length > 0) {
      drawPowerupChoices();
    } else {
      drawNeonText('NEXT STAGE', WIDTH / 2, HEIGHT / 2 - 18, 48, 'center', '#35f6ff', 20);
      drawNeonText('Incoming...', WIDTH / 2, HEIGHT / 2 + 32, 20, 'center', '#ffd34d', 9);
    }
  }

  if (GAME.gameOver) {
    ctx.fillStyle = 'rgba(3, 3, 12, 0.86)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawPanel(WIDTH / 2 - 330, 120, 660, 310, '#ff38c8');
    drawNeonText('ZONE BREACHED', WIDTH / 2, 184, 48, 'center', '#ff3b5f', 20);
    drawNeonText(`FINAL SCORE ${GAME.score}`, WIDTH / 2, 242, 27, 'center', '#ffd34d', 12);
    drawNeonText(`STAGE ${GAME.telemetry.highestStage}   ACC ${getAccuracy()}%   KILLS ${GAME.telemetry.monstersKilled}`, WIDTH / 2, 288, 21, 'center', '#eafcff', 8);
    drawNeonText('PRESS ENTER TO RESTART', WIDTH / 2, 358, 25, 'center', '#35f6ff', 16);
  }
}



/* render and animation-frame loop */
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