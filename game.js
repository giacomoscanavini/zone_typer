'use strict';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const GAME = {
  gridLeft: 210,
  gridRight: 835,
  gridTop: 105,
  gridBottom: 565,
  protectedZoneX: 850,
  spawnX: 190,
  maxLanes: 8,
  input: '',
  score: 0,
  stage: 1,
  lanes: [],
  monsters: [],
  lasers: [],
  floatingTexts: [],
  gameOver: false,
  stageComplete: false,
  stageMessageTimer: 0,
  wrongSpeedTimer: 0,
  lastTime: 0,
};

const WORDS = [
  'arc', 'beam', 'bolt', 'core', 'dust', 'echo', 'flux', 'grid', 'halo',
  'ion', 'laser', 'nova', 'pulse', 'quark', 'rift', 'spark', 'tower', 'unit',
  'vector', 'wave', 'xenon', 'yield', 'zone', 'matrix', 'shield', 'plasma',
  'signal', 'rocket', 'orbit', 'drone', 'reactor', 'magnet', 'photon', 'engine',
  'binary', 'cipher', 'charge', 'meteor', 'tunnel', 'sensor'
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomChoice(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function laneCountForStage(stage) {
  return clamp(3 + Math.floor((stage - 1) / 2), 3, GAME.maxLanes);
}

function monsterCountForStage(stage) {
  return 6 + stage * 3;
}

function baseSpeedForStage(stage) {
  return 26 + stage * 4;
}

function createLane(index, total) {
  const laneHeight = (GAME.gridBottom - GAME.gridTop) / total;
  const y = GAME.gridTop + index * laneHeight + laneHeight / 2;

  return {
    index,
    y,
    top: GAME.gridTop + index * laneHeight,
    bottom: GAME.gridTop + (index + 1) * laneHeight,
    word: randomChoice(WORDS),
  };
}

function rebuildLanes() {
  const count = laneCountForStage(GAME.stage);
  GAME.lanes = Array.from({ length: count }, (_, index) => createLane(index, count));
}

function startStage() {
  rebuildLanes();
  GAME.monsters = [];
  GAME.lasers = [];
  GAME.floatingTexts = [];
  GAME.input = '';
  GAME.gameOver = false;
  GAME.stageComplete = false;
  GAME.stageMessageTimer = 1.4;

  const count = monsterCountForStage(GAME.stage);
  const speed = baseSpeedForStage(GAME.stage);

  for (let i = 0; i < count; i += 1) {
    const laneIndex = Math.floor(Math.random() * GAME.lanes.length);
    const delay = i * Math.max(0.55, 1.25 - GAME.stage * 0.05) + Math.random() * 0.5;

    GAME.monsters.push({
      laneIndex,
      x: GAME.spawnX - delay * speed * 1.8,
      y: GAME.lanes[laneIndex].y,
      radius: 17,
      hp: 1,
      maxHp: 1,
      speed,
      alive: true,
    });
  }
}

function restartGame() {
  GAME.score = 0;
  GAME.stage = 1;
  GAME.wrongSpeedTimer = 0;
  startStage();
}

function findCompletedLane() {
  return GAME.lanes.find((lane) => lane.word === GAME.input.toLowerCase());
}

function fireLaser(lane) {
  const monstersInLane = GAME.monsters
    .filter((monster) => monster.alive && monster.laneIndex === lane.index && monster.x < GAME.protectedZoneX)
    .sort((a, b) => b.x - a.x);

  const target = monstersInLane[0];

  GAME.lasers.push({
    laneIndex: lane.index,
    y: lane.y,
    x1: GAME.gridLeft,
    x2: GAME.protectedZoneX,
    ttl: 0.16,
  });

  if (target) {
    target.hp -= 1;
    GAME.floatingTexts.push({ text: '-1', x: target.x, y: target.y - 18, ttl: 0.5 });

    if (target.hp <= 0) {
      target.alive = false;
      GAME.score += 100;
      GAME.floatingTexts.push({ text: '+100', x: target.x, y: target.y - 35, ttl: 0.7 });
    }
  }

  lane.word = randomChoice(WORDS);
  GAME.input = '';
}

function handleLetter(letter) {
  if (GAME.gameOver) {
    return;
  }

  const candidate = (GAME.input + letter).toLowerCase();
  const hasPrefix = GAME.lanes.some((lane) => lane.word.startsWith(candidate));

  if (!hasPrefix) {
    GAME.wrongSpeedTimer = 2.0;
    GAME.floatingTexts.push({ text: 'speed up!', x: WIDTH / 2 - 30, y: 78, ttl: 0.9 });
    return;
  }

  GAME.input = candidate;
  const completedLane = findCompletedLane();

  if (completedLane) {
    fireLaser(completedLane);
  }
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && GAME.gameOver) {
    restartGame();
    return;
  }

  if (event.key === 'Backspace') {
    GAME.input = GAME.input.slice(0, -1);
    event.preventDefault();
    return;
  }

  if (/^[a-zA-Z]$/.test(event.key)) {
    handleLetter(event.key);
  }
});

function update(dt) {
  if (GAME.stageMessageTimer > 0) {
    GAME.stageMessageTimer -= dt;
  }

  if (GAME.wrongSpeedTimer > 0) {
    GAME.wrongSpeedTimer -= dt;
  }

  if (!GAME.gameOver) {
    const speedMultiplier = GAME.wrongSpeedTimer > 0 ? 1.55 : 1;

    for (const monster of GAME.monsters) {
      if (!monster.alive) {
        continue;
      }

      monster.x += monster.speed * speedMultiplier * dt;

      if (monster.x + monster.radius >= GAME.protectedZoneX) {
        GAME.gameOver = true;
      }
    }

    GAME.monsters = GAME.monsters.filter((monster) => monster.alive);

    if (GAME.monsters.length === 0 && !GAME.stageComplete) {
      GAME.stageComplete = true;
      GAME.stage += 1;
      setTimeout(startStage, 950);
    }
  }

  for (const laser of GAME.lasers) {
    laser.ttl -= dt;
  }

  GAME.lasers = GAME.lasers.filter((laser) => laser.ttl > 0);

  for (const floatingText of GAME.floatingTexts) {
    floatingText.ttl -= dt;
    floatingText.y -= 26 * dt;
  }

  GAME.floatingTexts = GAME.floatingTexts.filter((floatingText) => floatingText.ttl > 0);
}

function drawText(text, x, y, size = 18, align = 'left') {
  ctx.font = `${size}px Arial`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function drawGrid() {
  ctx.strokeStyle = '#1d4d63';
  ctx.lineWidth = 1;

  const laneWidth = GAME.gridRight - GAME.gridLeft;
  const cellCount = 8;
  const cellWidth = laneWidth / cellCount;

  for (let i = 0; i <= cellCount; i += 1) {
    const x = GAME.gridLeft + i * cellWidth;
    ctx.beginPath();
    ctx.moveTo(x, GAME.gridTop);
    ctx.lineTo(x, GAME.gridBottom);
    ctx.stroke();
  }

  for (const lane of GAME.lanes) {
    ctx.beginPath();
    ctx.moveTo(GAME.gridLeft, lane.top);
    ctx.lineTo(GAME.gridRight, lane.top);
    ctx.stroke();
  }

  const lastLane = GAME.lanes[GAME.lanes.length - 1];
  ctx.beginPath();
  ctx.moveTo(GAME.gridLeft, lastLane.bottom);
  ctx.lineTo(GAME.gridRight, lastLane.bottom);
  ctx.stroke();

  ctx.fillStyle = 'rgba(31, 205, 255, 0.12)';
  ctx.fillRect(GAME.protectedZoneX, GAME.gridTop, 46, GAME.gridBottom - GAME.gridTop);

  ctx.fillStyle = '#d8f6ff';
  drawText('ZONE', GAME.protectedZoneX + 23, GAME.gridTop - 20, 16, 'center');
}

function drawWords() {
  for (const lane of GAME.lanes) {
    const word = lane.word;
    const typed = GAME.input;
    const isTarget = word.startsWith(typed) && typed.length > 0;

    ctx.fillStyle = isTarget ? '#fff7a8' : '#d8f6ff';
    drawText(word, 38, lane.y, 24, 'left');

    if (isTarget) {
      ctx.fillStyle = '#50e6ff';
      drawText(typed, 38, lane.y, 24, 'left');
    }
  }
}

function drawMonsters() {
  for (const monster of GAME.monsters) {
    ctx.fillStyle = '#ff6f91';
    ctx.beginPath();
    ctx.arc(monster.x, monster.y, monster.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3b1020';
    ctx.beginPath();
    ctx.arc(monster.x - 6, monster.y - 4, 3, 0, Math.PI * 2);
    ctx.arc(monster.x + 6, monster.y - 4, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLasers() {
  for (const laser of GAME.lasers) {
    ctx.strokeStyle = `rgba(93, 240, 255, ${laser.ttl / 0.16})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(laser.x1, laser.y);
    ctx.lineTo(laser.x2, laser.y);
    ctx.stroke();
  }
}

function drawHud() {
  ctx.fillStyle = '#d8f6ff';
  drawText(`Stage ${GAME.stage}`, 30, 35, 22);
  drawText(`Score ${GAME.score}`, 170, 35, 22);
  drawText(`Lanes ${GAME.lanes.length}`, 330, 35, 22);

  ctx.fillStyle = GAME.wrongSpeedTimer > 0 ? '#ffb86b' : '#8eb3c5';
  drawText(`Input: ${GAME.input || '...'}`, 30, 78, 18);
}

function drawFloatingTexts() {
  for (const floatingText of GAME.floatingTexts) {
    ctx.fillStyle = `rgba(255, 247, 168, ${clamp(floatingText.ttl, 0, 1)})`;
    drawText(floatingText.text, floatingText.x, floatingText.y, 18, 'center');
  }
}

function drawOverlay() {
  if (GAME.stageMessageTimer > 0) {
    ctx.fillStyle = 'rgba(7, 16, 24, 0.55)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#d8f6ff';
    drawText(`STAGE ${GAME.stage}`, WIDTH / 2, HEIGHT / 2, 42, 'center');
  }

  if (GAME.stageComplete) {
    ctx.fillStyle = 'rgba(7, 16, 24, 0.45)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#d8f6ff';
    drawText('STAGE CLEAR', WIDTH / 2, HEIGHT / 2, 40, 'center');
  }

  if (GAME.gameOver) {
    ctx.fillStyle = 'rgba(7, 16, 24, 0.78)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#ff8ca3';
    drawText('ZONE BREACHED', WIDTH / 2, HEIGHT / 2 - 32, 44, 'center');
    ctx.fillStyle = '#d8f6ff';
    drawText(`Final Score: ${GAME.score}`, WIDTH / 2, HEIGHT / 2 + 18, 24, 'center');
    drawText('Press Enter to restart', WIDTH / 2, HEIGHT / 2 + 58, 20, 'center');
  }
}

function render() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, '#071018');
  gradient.addColorStop(1, '#0d2433');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawGrid();
  drawWords();
  drawLasers();
  drawMonsters();
  drawHud();
  drawFloatingTexts();
  drawOverlay();
}

function loop(timestamp) {
  const dt = Math.min((timestamp - GAME.lastTime) / 1000, 0.05);
  GAME.lastTime = timestamp;

  update(dt);
  render();
  requestAnimationFrame(loop);
}

restartGame();
requestAnimationFrame((timestamp) => {
  GAME.lastTime = timestamp;
  requestAnimationFrame(loop);
});
