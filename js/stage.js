'use strict';

function laneCountForStage(stage) {
  return clamp(3 + Math.floor((stage - 1) / 3), 3, GAME.maxLanes);
}

function monsterCountForStage(stage) {
  return 4 + Math.floor(stage * 1.25);
}

function baseSpeedForStage(stage) {
  return 22 + stage * 2.8;
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
  if (stage <= 3) {
    return WORDS_BY_TIER.lowercase;
  }

  if (stage <= 6) {
    return [...WORDS_BY_TIER.lowercase, ...WORDS_BY_TIER.capitalized];
  }

  if (stage <= 9) {
    return [...WORDS_BY_TIER.capitalized, ...WORDS_BY_TIER.numbers];
  }

  if (stage <= 12) {
    return [...WORDS_BY_TIER.numbers, ...WORDS_BY_TIER.symbols];
  }

  if (stage <= 15) {
    return [...WORDS_BY_TIER.symbols, ...WORDS_BY_TIER.phrases];
  }

  return [...WORDS_BY_TIER.phrases, ...WORDS_BY_TIER.expert];
}

function pickLaneWord(usedWords = [], blockedWords = []) {
  const pool = wordPoolForStage(GAME.stage);
  const blocked = new Set([...usedWords, ...blockedWords]);
  const usablePool = pool
    .filter((word) => !containsPowerupKeyword(word))
    .map((word) => applyWordPowerEffects(word))
    .filter((word) => word.length > 0 && !containsPowerupKeyword(word));
  const options = usablePool.filter((word) => !blocked.has(word) && !isWordTooSimilar(word, usedWords));
  const fallback = usablePool.filter((word) => !blocked.has(word));
  return randomChoice(options.length > 0 ? options : fallback.length > 0 ? fallback : usablePool);
}

function pickMonsterType(stage) {
  const roll = Math.random();

  if (stage >= 11 && roll < 0.07) {
    return 'elite';
  }

  if (stage >= 7 && roll < 0.20) {
    return 'tank';
  }

  if (stage >= 4 && roll < 0.30) {
    return 'runner';
  }

  if (stage >= 8 && roll < 0.42) {
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
    id: GAME.nextMonsterId++,
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

    const delay = i * Math.max(1.0, 1.72 - GAME.stage * 0.018) + Math.random() * 0.48;
    GAME.monsters.push(createMonster(laneIndex, delay, speed));
  }
}

function restartGame() {
  GAME.score = 0;
  GAME.stage = 1;
  GAME.wrongSpeedTimer = 0;
  GAME.screenShake = 0;
  GAME.combo = { level: 1, xp: 0, consecutiveErrors: 0 };
  GAME.powerInventory = [];
  GAME.powerChoices = [];
  GAME.pendingStageStartTimer = 0;
  GAME.activePowers = {};
  GAME.stageClearedMessageTimer = 0;
  GAME.clearedStageNumber = 0;
  GAME.powerChoiceOffered = false;
  GAME.gameOverSoundPlayed = false;
  GAME.nextMonsterId = 1;
  GAME.telemetry = createTelemetry();
  startStage();
}

function findCompletedLane() {
  return GAME.lanes.find((lane) => lane.word === GAME.input);
}

function replaceLaneWord(lane) {
  const usedWords = GAME.lanes.filter((item) => item.index !== lane.index).map((item) => item.word);
  const blockedWords = [lane.word, lane.previousWord].filter(Boolean);
  lane.previousWord = lane.word;
  lane.word = pickLaneWord(usedWords, blockedWords);
}
