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
  gridLeft: 44,
  gridRight: 770,
  gridTop: 105,
  gridBottom: 335,
  laneHeight: 46,
  protectedZoneX: 790,
  spawnX: 58,
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
    color: '#ff6f91',
  },
  runner: {
    label: 'Runner',
    hp: 1,
    xp: 2,
    radius: 12,
    speedMultiplier: 1.45,
    color: '#ffb86b',
  },
  tank: {
    label: 'Shield',
    hp: 2,
    xp: 2,
    radius: 17,
    speedMultiplier: 1,
    shieldSpeedMultiplier: 0.58,
    color: '#9ae6b4',
    shieldColor: '#7dd3fc',
  },
  elite: {
    label: 'Elite',
    hp: 3,
    xp: 5,
    radius: 18,
    speedMultiplier: 0.82,
    color: '#c084fc',
  },
};

let audioCtx = null;
let musicTimer = 0;
let musicStep = 0;

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
  // Mild reduction from V2.2, focused on early-stage readability.
  return 6 + Math.floor(stage * 2.35);
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

    const delay = i * Math.max(0.54, 1.14 - GAME.stage * 0.032) + Math.random() * 0.32;
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
  const cellCount = 10;
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
  ctx.fillRect(GAME.protectedZoneX, GAME.gridTop, 42, GAME.gridBottom - GAME.gridTop);

  ctx.fillStyle = '#d8f6ff';
  drawText('ZONE', GAME.protectedZoneX + 21, GAME.gridTop - 20, 16, 'center');
}

function drawWords() {
  for (const lane of GAME.lanes) {
    const word = lane.word;
    const typed = GAME.input;
    const isTarget = word.startsWith(typed) && typed.length > 0;
    const danger = getLaneDanger(lane.index);
    const wordX = GAME.protectedZoneX + 54;

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
    ctx.fillStyle = danger > 0.72 ? '#ff3f6c' : monster.type.color;

    if (!monster.active) {
      continue;
    }

    if (monster.typeKey === 'runner') {
      ctx.beginPath();
      ctx.moveTo(monster.x + monster.radius, monster.y);
      ctx.lineTo(monster.x - monster.radius, monster.y - monster.radius);
      ctx.lineTo(monster.x - monster.radius, monster.y + monster.radius);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(monster.x, monster.y, monster.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    if (monster.typeKey === 'tank' && monster.hp === monster.maxHp) {
      ctx.strokeStyle = monster.type.shieldColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(monster.x, monster.y, monster.radius + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (monster.typeKey === 'elite') {
      ctx.strokeStyle = '#f0abfc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(monster.x, monster.y, monster.radius + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (monster.hp > 1) {
      ctx.fillStyle = '#071018';
      drawText(String(monster.hp), monster.x, monster.y, 13, 'center');
    }

    ctx.fillStyle = '#3b1020';
    ctx.beginPath();
    ctx.arc(monster.x - 5, monster.y - 4, 2.5, 0, Math.PI * 2);
    ctx.arc(monster.x + 5, monster.y - 4, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLasers() {
  for (const laser of GAME.lasers) {
    ctx.strokeStyle = laser.color;
    ctx.globalAlpha = laser.ttl / 0.16;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(laser.x1, laser.y);
    ctx.lineTo(laser.x2, laser.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawComboBar() {
  const x = 330;
  const y = 67;
  const width = 300;
  const height = 18;
  const color = comboColor();

  ctx.fillStyle = 'rgba(16, 29, 42, 0.88)';
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width * comboProgress(), height);
  ctx.fillStyle = color;
  drawText(`X${GAME.combo.level}`, x - 18, y + height / 2, 20, 'right');
}

function drawHud() {
  ctx.fillStyle = '#d8f6ff';
  drawText(`Stage ${GAME.stage}`, 30, 35, 22);
  drawText(`Score ${GAME.score}`, 155, 35, 22);
  drawText(`Accuracy ${getAccuracy()}%`, 310, 35, 22);
  drawText(`Kills ${GAME.telemetry.monstersKilled}`, 510, 35, 22);
  drawComboBar();

}

function drawFloatingTexts() {
  for (const floatingText of GAME.floatingTexts) {
    ctx.fillStyle = `rgba(255, 247, 168, ${clamp(floatingText.ttl, 0, 1)})`;
    drawText(floatingText.text, floatingText.x, floatingText.y, 18, 'center');
  }
}

function drawOverlay() {
  if (!GAME.gameStarted) {
    ctx.fillStyle = 'rgba(7, 16, 24, 0.86)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#d8f6ff';
    drawText('ZONE TYPERS', WIDTH / 2, 142, 46, 'center');
    ctx.fillStyle = '#8eb3c5';
    drawText('Type the word beside a lane to fire into that lane.', WIDTH / 2, 210, 22, 'center');
    drawText('Stop monsters before they reach the protected zone.', WIDTH / 2, 246, 22, 'center');
    drawText('Correct kills build the score multiplier. Two mistakes reset it.', WIDTH / 2, 282, 22, 'center');
    ctx.fillStyle = '#fff7a8';
    drawText('Press Enter to start', WIDTH / 2, 354, 26, 'center');
    return;
  }

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
    ctx.fillStyle = 'rgba(7, 16, 24, 0.82)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#ff8ca3';
    drawText('ZONE BREACHED', WIDTH / 2, 98, 44, 'center');
    ctx.fillStyle = '#d8f6ff';
    drawText(`Final Score: ${GAME.score}`, WIDTH / 2, 148, 24, 'center');
    drawText(`Stage: ${GAME.telemetry.highestStage}  Accuracy: ${getAccuracy()}%  Kills: ${GAME.telemetry.monstersKilled}`, WIDTH / 2, 184, 20, 'center');

    ctx.fillStyle = '#8eb3c5';
    drawText('Press Enter to restart', WIDTH / 2, 236, 22, 'center');
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
