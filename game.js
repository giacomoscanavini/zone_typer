'use strict';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const GAME = {
  gridLeft: 155,
  gridRight: 730,
  gridTop: 105,
  gridBottom: 335,
  laneHeight: 38,
  protectedZoneX: 750,
  spawnX: 135,
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
  screenShake: 0,
  telemetry: null,
};

const WORDS_BY_TIER = {
  easy: [
    'arc', 'beam', 'bolt', 'core', 'dust', 'echo', 'flux', 'grid',
    'halo', 'ion', 'nova', 'rift', 'unit', 'wave', 'zone', 'spark'
  ],
  medium: [
    'laser', 'pulse', 'quark', 'tower', 'vector', 'xenon', 'yield',
    'matrix', 'shield', 'plasma', 'signal', 'rocket', 'orbit', 'drone'
  ],
  hard: [
    'reactor', 'magnet', 'photon', 'engine', 'binary', 'cipher',
    'charge', 'meteor', 'tunnel', 'sensor', 'crystal', 'fusion'
  ],
  expert: [
    'cosmic', 'planet', 'quantum', 'gravity', 'neutron', 'satellite',
    'asteroid', 'terminal', 'protocol', 'singularity', 'ionization',
    'acceleration', 'transmission', 'containment'
  ],
};

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
  return 7 + stage * 3;
}

function baseSpeedForStage(stage) {
  return 24 + stage * 3.6;
}

function createTelemetry() {
  return {
    startedAt: performance.now(),
    keypresses: 0,
    correctLetters: 0,
    wrongLetters: 0,
    wordsCompleted: 0,
    monstersKilled: 0,
    lasersFired: 0,
    breachesByLane: Array(GAME.maxLanes).fill(0),
    deathsByLane: Array(GAME.maxLanes).fill(0),
    highestStage: 1,
  };
}

function getAccuracy() {
  const total = GAME.telemetry.correctLetters + GAME.telemetry.wrongLetters;
  if (total === 0) {
    return 100;
  }
  return Math.round((GAME.telemetry.correctLetters / total) * 100);
}

function getLaneDanger(laneIndex) {
  const active = GAME.monsters.filter((monster) => monster.alive && monster.laneIndex === laneIndex);
  if (active.length === 0) {
    return 0;
  }

  const closest = active.reduce((best, monster) => Math.max(best, monster.x), GAME.spawnX);
  const progress = (closest - GAME.spawnX) / (GAME.protectedZoneX - GAME.spawnX);
  return clamp(progress, 0, 1);
}

function isWordTooSimilar(word, usedWords) {
  return usedWords.some((used) => (
    used === word || used.startsWith(word) || word.startsWith(used) || used[0] === word[0]
  ));
}

function wordPoolForStage(stage) {
  if (stage <= 2) {
    return WORDS_BY_TIER.easy;
  }

  if (stage <= 4) {
    return [...WORDS_BY_TIER.easy, ...WORDS_BY_TIER.medium];
  }

  if (stage <= 7) {
    return [...WORDS_BY_TIER.medium, ...WORDS_BY_TIER.hard];
  }

  return [...WORDS_BY_TIER.hard, ...WORDS_BY_TIER.expert];
}

function pickLaneWord(usedWords = []) {
  const pool = wordPoolForStage(GAME.stage);
  const options = pool.filter((word) => !isWordTooSimilar(word, usedWords));
  const fallback = pool.filter((word) => !usedWords.includes(word));
  return randomChoice(options.length > 0 ? options : fallback.length > 0 ? fallback : pool);
}

function updateBoardLayout(laneCount) {
  const boardHeight = GAME.laneHeight * laneCount;
  GAME.gridTop = (HEIGHT - boardHeight) / 2;
  GAME.gridBottom = GAME.gridTop + boardHeight;
}

function createLane(index, total, usedWords) {
  const laneHeight = GAME.laneHeight;
  const y = GAME.gridTop + index * laneHeight + laneHeight / 2;
  const word = pickLaneWord(usedWords);
  usedWords.push(word);

  return {
    index,
    y,
    top: GAME.gridTop + index * laneHeight,
    bottom: GAME.gridTop + (index + 1) * laneHeight,
    word,
    flashTimer: 0,
    wrongTimer: 0,
  };
}

function rebuildLanes() {
  const count = laneCountForStage(GAME.stage);
  updateBoardLayout(count);
  const usedWords = [];
  GAME.lanes = Array.from({ length: count }, (_, index) => createLane(index, count, usedWords));
}

function startStage() {
  rebuildLanes();
  GAME.monsters = [];
  GAME.lasers = [];
  GAME.floatingTexts = [];
  GAME.input = '';
  GAME.gameOver = false;
  GAME.stageComplete = false;
  GAME.stageMessageTimer = 1.15;
  GAME.telemetry.highestStage = Math.max(GAME.telemetry.highestStage, GAME.stage);

  const count = monsterCountForStage(GAME.stage);
  const speed = baseSpeedForStage(GAME.stage);

  for (let i = 0; i < count; i += 1) {
    const laneIndex = Math.floor(Math.random() * GAME.lanes.length);
    const delay = i * Math.max(0.58, 1.30 - GAME.stage * 0.045) + Math.random() * 0.45;

    GAME.monsters.push({
      laneIndex,
      x: GAME.spawnX - delay * speed * 1.85,
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
  GAME.screenShake = 0;
  GAME.telemetry = createTelemetry();
  startStage();
}

function findCompletedLane() {
  return GAME.lanes.find((lane) => lane.word === GAME.input.toLowerCase());
}

function replaceLaneWord(lane) {
  const usedWords = GAME.lanes.filter((item) => item.index !== lane.index).map((item) => item.word);
  lane.word = pickLaneWord(usedWords);
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
    x2: GAME.protectedZoneX - 4,
    ttl: 0.16,
  });

  GAME.telemetry.lasersFired += 1;
  GAME.telemetry.wordsCompleted += 1;
  lane.flashTimer = 0.22;
  GAME.screenShake = Math.max(GAME.screenShake, 2.5);

  if (target) {
    target.hp -= 1;
    GAME.floatingTexts.push({ text: '-1', x: target.x, y: target.y - 18, ttl: 0.5 });

    if (target.hp <= 0) {
      target.alive = false;
      GAME.score += 100;
      GAME.telemetry.monstersKilled += 1;
      GAME.telemetry.deathsByLane[lane.index] += 1;
      GAME.floatingTexts.push({ text: '+100', x: target.x, y: target.y - 35, ttl: 0.7 });
    }
  } else {
    GAME.floatingTexts.push({ text: 'clear', x: GAME.gridLeft + 45, y: lane.y - 20, ttl: 0.55 });
  }

  replaceLaneWord(lane);
  GAME.input = '';
}

function markWrongInput() {
  GAME.wrongSpeedTimer = 1.6;
  GAME.screenShake = Math.max(GAME.screenShake, 4);
  GAME.floatingTexts.push({ text: 'speed up!', x: WIDTH / 2 - 30, y: 78, ttl: 0.75 });

  for (const lane of GAME.lanes) {
    if (lane.word.startsWith(GAME.input)) {
      lane.wrongTimer = 0.28;
    }
  }
}

function handleLetter(letter) {
  if (GAME.gameOver) {
    return;
  }

  const candidate = (GAME.input + letter).toLowerCase();
  const hasPrefix = GAME.lanes.some((lane) => lane.word.startsWith(candidate));
  GAME.telemetry.keypresses += 1;

  if (!hasPrefix) {
    GAME.telemetry.wrongLetters += 1;
    markWrongInput();
    return;
  }

  GAME.telemetry.correctLetters += 1;
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

function updateTimers(dt) {
  if (GAME.stageMessageTimer > 0) {
    GAME.stageMessageTimer -= dt;
  }

  if (GAME.wrongSpeedTimer > 0) {
    GAME.wrongSpeedTimer -= dt;
  }

  if (GAME.screenShake > 0) {
    GAME.screenShake -= 12 * dt;
  }

  for (const lane of GAME.lanes) {
    lane.flashTimer = Math.max(0, lane.flashTimer - dt);
    lane.wrongTimer = Math.max(0, lane.wrongTimer - dt);
  }
}

function update(dt) {
  updateTimers(dt);

  if (!GAME.gameOver) {
    const speedMultiplier = GAME.wrongSpeedTimer > 0 ? 1.42 : 1;

    for (const monster of GAME.monsters) {
      if (!monster.alive) {
        continue;
      }

      monster.x += monster.speed * speedMultiplier * dt;

      if (monster.x + monster.radius >= GAME.protectedZoneX) {
        GAME.gameOver = true;
        GAME.telemetry.breachesByLane[monster.laneIndex] += 1;
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

  for (const lane of GAME.lanes) {
    const danger = getLaneDanger(lane.index);
    const flashAlpha = lane.flashTimer > 0 ? 0.14 : 0;
    const warningAlpha = danger > 0.68 ? (danger - 0.68) * 0.7 : 0;

    ctx.fillStyle = `rgba(93, 240, 255, ${flashAlpha})`;
    ctx.fillRect(GAME.gridLeft, lane.top, laneWidth, lane.bottom - lane.top);

    ctx.fillStyle = `rgba(255, 111, 145, ${warningAlpha})`;
    ctx.fillRect(GAME.gridLeft, lane.top, laneWidth, lane.bottom - lane.top);
  }

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
    const danger = getLaneDanger(lane.index);
    const wordX = GAME.protectedZoneX + 62;

    if (isTarget) {
      ctx.fillStyle = lane.wrongTimer > 0 ? 'rgba(255, 111, 145, 0.35)' : 'rgba(255, 247, 168, 0.16)';
      ctx.fillRect(wordX - 8, lane.y - 20, WIDTH - wordX - 14, 40);
    }

    ctx.fillStyle = lane.wrongTimer > 0 ? '#ff8ca3' : isTarget ? '#fff7a8' : danger > 0.72 ? '#ffb6c4' : '#d8f6ff';
    drawText(word, wordX, lane.y, 25, 'left');

    if (isTarget) {
      ctx.fillStyle = '#50e6ff';
      drawText(typed, wordX, lane.y, 25, 'left');
    }
  }
}

function drawMonsters() {
  for (const monster of GAME.monsters) {
    const danger = getLaneDanger(monster.laneIndex);
    ctx.fillStyle = danger > 0.72 ? '#ff3f6c' : '#ff6f91';
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
  drawText(`Score ${GAME.score}`, 155, 35, 22);
  drawText(`Accuracy ${getAccuracy()}%`, 310, 35, 22);
  drawText(`Kills ${GAME.telemetry.monstersKilled}`, 510, 35, 22);

  const inputY = Math.min(HEIGHT - 42, GAME.gridBottom + 42);
  const inputText = `Input: ${GAME.input || '...'}`;

  ctx.fillStyle = 'rgba(16, 29, 42, 0.82)';
  ctx.fillRect(WIDTH / 2 - 185, inputY - 24, 370, 48);
  ctx.strokeStyle = GAME.wrongSpeedTimer > 0 ? '#ffb86b' : '#2b647e';
  ctx.lineWidth = 1;
  ctx.strokeRect(WIDTH / 2 - 185, inputY - 24, 370, 48);

  ctx.fillStyle = GAME.wrongSpeedTimer > 0 ? '#ffb86b' : '#d8f6ff';
  drawText(inputText, WIDTH / 2, inputY, 26, 'center');
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
    drawText(`STAGE ${GAME.stage}`, WIDTH / 2, HEIGHT / 2 - 18, 42, 'center');
    ctx.fillStyle = '#8eb3c5';
    drawText('protect the zone', WIDTH / 2, HEIGHT / 2 + 28, 22, 'center');
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
    drawText('ZONE BREACHED', WIDTH / 2, HEIGHT / 2 - 62, 44, 'center');
    ctx.fillStyle = '#d8f6ff';
    drawText(`Final Score: ${GAME.score}`, WIDTH / 2, HEIGHT / 2 - 14, 24, 'center');
    drawText(`Stage: ${GAME.telemetry.highestStage}  Accuracy: ${getAccuracy()}%  Kills: ${GAME.telemetry.monstersKilled}`, WIDTH / 2, HEIGHT / 2 + 22, 20, 'center');
    drawText('Press Enter to restart', WIDTH / 2, HEIGHT / 2 + 62, 20, 'center');
  }
}

function render() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  const shake = Math.max(0, GAME.screenShake);
  const offsetX = shake > 0 ? (Math.random() - 0.5) * shake : 0;
  const offsetY = shake > 0 ? (Math.random() - 0.5) * shake : 0;

  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, '#071018');
  gradient.addColorStop(1, '#0d2433');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.save();
  ctx.translate(offsetX, offsetY);
  drawGrid();
  drawWords();
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

restartGame();
requestAnimationFrame((timestamp) => {
  GAME.lastTime = timestamp;
  requestAnimationFrame(loop);
});
