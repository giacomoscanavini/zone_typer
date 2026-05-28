'use strict';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const COMBO = {
  maxLevel: 5,
  thresholds: [0, 10, 18, 30, 46],
  colors: {
    1: '#aab7c4',
    2: '#55e079',
    3: '#50e6ff',
    4: '#c084fc',
    5: '#ffd166',
  },
};

const GAME = {
  gridLeft: 252,
  gridRight: 1010,
  gridTop: 156,
  gridBottom: 506,
  laneHeight: 62,
  protectedZoneX: 1032,
  spawnX: 270,
  maxLanes: 8,
  input: '',
  score: 0,
  stage: 1,
  lanes: [],
  monsters: [],
  lasers: [],
  floatingTexts: [],
  gameStarted: false,
  gameOver: false,
  stageComplete: false,
  stageMessageTimer: 0,
  wrongSpeedTimer: 0,
  lastTime: 0,
  screenShake: 0,
  telemetry: null,
  combo: {
    level: 1,
    xp: 0,
    consecutiveErrors: 0,
  },
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
    'acceleration', 'transmission', 'containment', 'synchronization'
  ],
};

const MONSTER_TYPES = {
  basic: {
    label: 'Basic',
    hp: 1,
    xp: 1,
    radius: 15,
    speedMultiplier: 1,
    color: '#ff3b5f',
  },
  runner: {
    label: 'Runner',
    hp: 1,
    xp: 2,
    radius: 12,
    speedMultiplier: 1.45,
    color: '#ff8f2e',
  },
  tank: {
    label: 'Shield',
    hp: 2,
    xp: 2,
    radius: 17,
    speedMultiplier: 1,
    shieldSpeedMultiplier: 0.58,
    color: '#ffd34d',
    shieldColor: '#37f6ff',
  },
  elite: {
    label: 'Elite',
    hp: 3,
    xp: 5,
    radius: 18,
    speedMultiplier: 0.82,
    color: '#b65cff',
  },
};

let audioCtx = null;
let musicTimer = 0;
let musicStep = 0;

const SPRITES = {};
for (const [key, src] of Object.entries({
  basic: 'assets/sprites/monster-basic.png',
  runner: 'assets/sprites/monster-runner.png',
  tank: 'assets/sprites/monster-tank.png',
  elite: 'assets/sprites/monster-elite.png',
})) {
  const image = new Image();
  image.src = src;
  SPRITES[key] = image;
}

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
  // Reduced spawn volume in V3.2 for better sprite readability.
  return 4 + Math.floor(stage * 1.55);
}

function baseSpeedForStage(stage) {
  return 24 + stage * 3.6;
}

function getComboThreshold() {
  return COMBO.thresholds[GAME.combo.level] || 999999;
}

function comboColor() {
  return COMBO.colors[GAME.combo.level];
}

function comboProgress() {
  if (GAME.combo.level >= COMBO.maxLevel) {
    return 1;
  }
  return clamp(GAME.combo.xp / getComboThreshold(), 0, 1);
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
  const active = GAME.monsters.filter((monster) => monster.alive && monster.active && monster.laneIndex === laneIndex);
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

function pickLaneWord(usedWords = [], blockedWords = []) {
  const pool = wordPoolForStage(GAME.stage);
  const blocked = new Set([...usedWords, ...blockedWords]);
  const options = pool.filter((word) => !blocked.has(word) && !isWordTooSimilar(word, usedWords));
  const fallback = pool.filter((word) => !blocked.has(word));
  return randomChoice(options.length > 0 ? options : fallback.length > 0 ? fallback : pool);
}

function pickMonsterType(stage) {
  const roll = Math.random();

  if (stage >= 8 && roll < 0.08) {
    return 'elite';
  }

  if (stage >= 5 && roll < 0.24) {
    return 'tank';
  }

  if (stage >= 3 && roll < 0.36) {
    return 'runner';
  }

  if (stage >= 4 && roll < 0.48) {
    return 'tank';
  }

  return 'basic';
}

function updateBoardLayout(laneCount) {
  const boardHeight = GAME.laneHeight * laneCount;
  GAME.gridTop = (HEIGHT - boardHeight) / 2;
  GAME.gridBottom = GAME.gridTop + boardHeight;
}

function createLane(index, usedWords) {
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
    previousWord: null,
    flashTimer: 0,
    wrongTimer: 0,
  };
}

function rebuildLanes() {
  const count = laneCountForStage(GAME.stage);
  updateBoardLayout(count);
  const usedWords = [];
  GAME.lanes = Array.from({ length: count }, (_, index) => createLane(index, usedWords));
}

function createMonster(laneIndex, delay, speed) {
  const typeKey = pickMonsterType(GAME.stage);
  const type = MONSTER_TYPES[typeKey];
  return {
    typeKey,
    type,
    laneIndex,
    x: GAME.spawnX,
    y: GAME.lanes[laneIndex].y,
    radius: type.radius,
    hp: type.hp,
    maxHp: type.hp,
    speed,
    spawnDelay: delay,
    active: false,
    alive: true,
  };
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

  const laneLoad = Array(GAME.lanes.length).fill(0);

  for (let i = 0; i < count; i += 1) {
    const minLoad = Math.min(...laneLoad);
    const candidateLanes = laneLoad
      .map((load, index) => ({ load, index }))
      .filter((item) => item.load === minLoad)
      .map((item) => item.index);
    const laneIndex = randomChoice(candidateLanes);
    laneLoad[laneIndex] += 1;

    const delay = i * Math.max(0.86, 1.58 - GAME.stage * 0.026) + Math.random() * 0.42;
    GAME.monsters.push(createMonster(laneIndex, delay, speed));
  }
}

function restartGame() {
  GAME.score = 0;
  GAME.stage = 1;
  GAME.wrongSpeedTimer = 0;
  GAME.screenShake = 0;
  GAME.combo = { level: 1, xp: 0, consecutiveErrors: 0 };
  GAME.telemetry = createTelemetry();
  startStage();
}

function findCompletedLane() {
  return GAME.lanes.find((lane) => lane.word === GAME.input.toLowerCase());
}

function replaceLaneWord(lane) {
  const usedWords = GAME.lanes.filter((item) => item.index !== lane.index).map((item) => item.word);
  const blockedWords = [lane.word, lane.previousWord].filter(Boolean);
  lane.previousWord = lane.word;
  lane.word = pickLaneWord(usedWords, blockedWords);
}

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playTone(frequency, duration = 0.08, type = 'square', volume = 0.035) {
  if (!audioCtx) {
    return;
  }

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playLaserSound() {
  playTone(660 + GAME.combo.level * 55, 0.075, 'sawtooth', 0.028);
}

function playDeathSound() {
  playTone(130, 0.12, 'square', 0.04);
  setTimeout(() => playTone(92, 0.08, 'square', 0.03), 45);
}

function playMultiplierSound() {
  playTone(520, 0.06, 'triangle', 0.035);
  setTimeout(() => playTone(720, 0.07, 'triangle', 0.035), 65);
}

function updateMusic(dt) {
  if (!audioCtx || GAME.gameOver) {
    return;
  }

  musicTimer -= dt;
  if (musicTimer > 0) {
    return;
  }

  const notes = [110, 146.8, 164.8, 220, 196, 164.8, 146.8, 123.5];
  const note = notes[musicStep % notes.length] * (GAME.stage >= 5 ? 1.5 : 1);
  playTone(note, 0.055, 'square', 0.012);
  musicStep += 1;
  musicTimer = 0.25;
}

function addComboXp(amount) {
  if (GAME.combo.level >= COMBO.maxLevel) {
    GAME.combo.xp = getComboThreshold();
    return;
  }

  GAME.combo.xp += amount;
  while (GAME.combo.level < COMBO.maxLevel && GAME.combo.xp >= getComboThreshold()) {
    GAME.combo.xp -= getComboThreshold();
    GAME.combo.level += 1;
    GAME.floatingTexts.push({ text: `X${GAME.combo.level}`, x: WIDTH / 2, y: 86, ttl: 0.8 });
    GAME.screenShake = Math.max(GAME.screenShake, 3.2);
    playMultiplierSound();
  }

  if (GAME.combo.level >= COMBO.maxLevel) {
    GAME.combo.xp = getComboThreshold();
  }
}

function resetComboFully() {
  GAME.combo.level = 1;
  GAME.combo.xp = 0;
  GAME.combo.consecutiveErrors = 0;
  GAME.floatingTexts.push({ text: 'COMBO RESET', x: WIDTH / 2, y: 86, ttl: 0.75 });
}

function downgradeCombo() {
  GAME.combo.level = Math.max(1, GAME.combo.level - 1);
  GAME.combo.xp = 0;
  GAME.floatingTexts.push({ text: `X${GAME.combo.level}`, x: WIDTH / 2, y: 86, ttl: 0.6 });
}

function recordInputSuccess() {
  GAME.combo.consecutiveErrors = 0;
}

function recordInputError() {
  GAME.combo.consecutiveErrors += 1;
  if (GAME.combo.consecutiveErrors >= 2) {
    resetComboFully();
  } else {
    downgradeCombo();
  }
}

function scoreForKill(monster) {
  return 100 * GAME.combo.level * monster.type.xp;
}

function fireLaser(lane) {
  playLaserSound();
  const monstersInLane = GAME.monsters
    .filter((monster) => monster.alive && monster.active && monster.laneIndex === lane.index && monster.x < GAME.protectedZoneX)
    .sort((a, b) => b.x - a.x);

  const target = monstersInLane[0];

  GAME.lasers.push({
    laneIndex: lane.index,
    y: lane.y,
    x1: GAME.gridLeft,
    x2: GAME.protectedZoneX - 4,
    ttl: 0.16,
    color: comboColor(),
  });

  GAME.telemetry.lasersFired += 1;
  GAME.telemetry.wordsCompleted += 1;
  lane.flashTimer = 0.22;
  GAME.screenShake = Math.max(GAME.screenShake, 2.5);

  if (target) {
    target.hp -= 1;
    GAME.floatingTexts.push({ text: '-1', x: target.x, y: target.y - 18, ttl: 0.5 });

    if (target.hp <= 0) {
      const gainedScore = scoreForKill(target);
      target.alive = false;
      GAME.score += gainedScore;
      GAME.telemetry.monstersKilled += 1;
      GAME.telemetry.deathsByLane[lane.index] += 1;
      GAME.floatingTexts.push({ text: `+${gainedScore}`, x: target.x, y: target.y - 35, ttl: 0.7 });
      addComboXp(target.type.xp);
      playDeathSound();
    }
  } else {
    GAME.floatingTexts.push({ text: 'clear', x: GAME.gridLeft + 45, y: lane.y - 20, ttl: 0.55 });
  }

  replaceLaneWord(lane);
  GAME.input = '';
}

function markWrongInput() {
  recordInputError();
  GAME.wrongSpeedTimer = 1.6;
  GAME.screenShake = Math.max(GAME.screenShake, 4);
  GAME.floatingTexts.push({ text: 'speed up!', x: WIDTH / 2 - 30, y: 112, ttl: 0.75 });
  playTone(78, 0.12, 'sawtooth', 0.035);

  for (const lane of GAME.lanes) {
    if (lane.word.startsWith(GAME.input)) {
      lane.wrongTimer = 0.28;
    }
  }
}

function handleLetter(letter) {
  ensureAudio();

  if (!GAME.gameStarted || GAME.gameOver) {
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
  recordInputSuccess();
  GAME.input = candidate;
  playTone(330, 0.025, 'square', 0.012);
  const completedLane = findCompletedLane();

  if (completedLane) {
    fireLaser(completedLane);
  }
}

window.addEventListener('keydown', (event) => {
  ensureAudio();

  if (event.key === 'Enter' && !GAME.gameStarted) {
    GAME.gameStarted = true;
    GAME.stageMessageTimer = 0.9;
    return;
  }

  if (event.key === 'Enter' && GAME.gameOver) {
    restartGame();
    GAME.gameStarted = true;
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
  updateMusic(dt);

  if (GAME.gameStarted && !GAME.gameOver) {
    const speedMultiplier = GAME.wrongSpeedTimer > 0 ? 1.42 : 1;

    for (const monster of GAME.monsters) {
      if (!monster.alive) {
        continue;
      }

      if (!monster.active) {
        monster.spawnDelay -= dt;
        if (monster.spawnDelay > 0) {
          continue;
        }
        monster.active = true;
        monster.x = GAME.spawnX;
      }

      const shieldPenalty = monster.typeKey === 'tank' && monster.hp === monster.maxHp
        ? monster.type.shieldSpeedMultiplier
        : monster.type.speedMultiplier;
      monster.x += monster.speed * shieldPenalty * speedMultiplier * dt;

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

function drawText(text, x, y, size = 18, align = 'left') {
  ctx.font = `700 ${size}px "Trebuchet MS", Arial`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

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

function drawWords() {
  for (const lane of GAME.lanes) {
    const word = lane.word;
    const typed = GAME.input;
    const isTarget = word.startsWith(typed) && typed.length > 0;
    const danger = getLaneDanger(lane.index);
    const wordX = GAME.protectedZoneX + 78;
    const panelColor = isTarget ? '#ffd34d' : danger > 0.72 ? '#ff38c8' : '#35f6ff';

    ctx.save();
    ctx.fillStyle = isTarget ? 'rgba(255, 211, 77, 0.10)' : 'rgba(5, 8, 24, 0.78)';
    ctx.strokeStyle = panelColor;
    ctx.lineWidth = isTarget ? 2.5 : 1.5;
    ctx.shadowColor = panelColor;
    ctx.shadowBlur = isTarget ? 14 : 7;
    roundRect(wordX - 14, lane.y - 21, 150, 42, 8, true, true);
    ctx.restore();

    drawNeonText(word.toUpperCase(), wordX + 60, lane.y, 22, 'center', lane.wrongTimer > 0 ? '#ff7a9d' : isTarget ? '#ffd34d' : '#eafcff', 8);

  }
}


function drawInputUnderGrid() {
  const inputText = GAME.input.length > 0 ? GAME.input.toUpperCase() : 'TYPE A LANE WORD';
  const y = Math.min(GAME.gridBottom + 38, HEIGHT - 34);
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
  drawNeonText(inputText, x + 292, y, 24, 'center', color, 12);
}

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

    // Soft elliptical grounding shadow.
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#00040c';
    ctx.beginPath();
    ctx.ellipse(0, monster.radius + 19, monster.radius + 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawMonsterSprite(monster, color);
    drawShieldBreakCue(monster);
    drawMonsterHealth(monster);

    ctx.restore();
  }
}

function drawLasers() {
  for (const laser of GAME.lasers) {
    const alpha = laser.ttl / 0.16;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = laser.color;
    ctx.shadowColor = laser.color;
    ctx.shadowBlur = 22;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(laser.x1, laser.y);
    ctx.lineTo(laser.x2, laser.y);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(laser.x1, laser.y);
    ctx.lineTo(laser.x2, laser.y);
    ctx.stroke();
    ctx.restore();
  }
}

function drawComboBar() {
  const x = 440;
  const y = 74;
  const width = 420;
  const height = 24;
  const color = comboColor();

  drawNeonText('COMBO', x + width / 2, y - 22, 16, 'center', '#9befff', 8);
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

function drawHud() {
  drawPanel(26, 20, 290, 92, '#ff38c8');
  drawNeonText('ZONE', 56, 48, 30, 'left', '#ff38c8', 16);
  drawNeonText('TYPERS', 56, 80, 30, 'left', '#35f6ff', 16);
  drawNeonText('V3.2', 254, 82, 13, 'left', '#eafcff', 6);

  drawNeonText('SCORE', WIDTH / 2, 22, 20, 'center', '#ff5edb', 12);
  drawNeonText(String(GAME.score).padStart(7, '0'), WIDTH / 2, 50, 38, 'center', '#ffd34d', 15);
  drawComboBar();

  drawPanel(980, 20, 268, 92, '#35f6ff');
  drawNeonText(`STAGE ${String(GAME.stage).padStart(2, '0')}`, 1006, 49, 21, 'left', '#35f6ff', 10);
  drawNeonText(`ACC ${getAccuracy()}%`, 1006, 78, 18, 'left', '#eafcff', 6);
  drawNeonText(`KILLS ${GAME.telemetry.monstersKilled}`, 1134, 78, 18, 'left', '#eafcff', 6);
}

function drawFloatingTexts() {
  for (const floatingText of GAME.floatingTexts) {
    ctx.globalAlpha = clamp(floatingText.ttl, 0, 1);
    drawNeonText(floatingText.text, floatingText.x, floatingText.y, 18, 'center', '#ffd34d', 8);
    ctx.globalAlpha = 1;
  }
}

function drawOverlay() {
  if (!GAME.gameStarted) {
    ctx.fillStyle = 'rgba(3, 3, 12, 0.82)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawPanel(WIDTH / 2 - 310, 138, 620, 356, '#ff38c8');
    drawNeonText('ZONE TYPERS', WIDTH / 2, 202, 56, 'center', '#ff38c8', 22);
    drawNeonText('ARCADE DEFENSE', WIDTH / 2, 252, 25, 'center', '#35f6ff', 16);
    drawNeonText('Type the word beside a lane to fire into that lane.', WIDTH / 2, 318, 22, 'center', '#eafcff', 8);
    drawNeonText('Stop monsters before they breach the glowing zone.', WIDTH / 2, 354, 22, 'center', '#eafcff', 8);
    drawNeonText('Kills build the score multiplier. Two mistakes reset it.', WIDTH / 2, 390, 22, 'center', '#ffd34d', 8);
    drawNeonText('PRESS ENTER', WIDTH / 2, 456, 31, 'center', '#35f6ff', 20);
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
    drawNeonText('STAGE CLEAR', WIDTH / 2, HEIGHT / 2, 48, 'center', '#35f6ff', 20);
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

restartGame();
requestAnimationFrame((timestamp) => {
  GAME.lastTime = timestamp;
  requestAnimationFrame(loop);
});
