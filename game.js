'use strict';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;



const POWERUPS = {
  freeze: {
    keyword: 'freeze',
    name: 'Freeze',
    icon: '🧊',
    color: '#9befff',
    duration: 7,
    description: 'Freeze monsters',
  },
  laser: {
    keyword: 'laser',
    name: 'Laser',
    icon: '🦆',
    color: '#ff5edb',
    duration: 7,
    description: '+1 random laser',
  },
  lower: {
    keyword: 'lower',
    name: 'Lower',
    icon: '🐣',
    color: '#ffd34d',
    duration: 10,
    description: 'Lowercase words',
  },
  kill: {
    keyword: 'kill',
    name: 'Kill',
    icon: '💥',
    color: '#ff3b5f',
    duration: 0,
    description: 'Clear screen',
  },
  alpha: {
    keyword: 'alpha',
    name: 'Alpha',
    icon: '🧼',
    color: '#55e079',
    duration: 10,
    description: 'Letters only',
  },
  wind: {
    keyword: 'wind',
    name: 'Wind',
    icon: '🌬️',
    color: '#9befff',
    duration: 7,
    description: 'Push monsters back',
  },
  drill: {
    keyword: 'drill',
    name: 'Drill',
    icon: '🪛',
    color: '#c084fc',
    duration: 7,
    description: 'Pierce same lane',
  },
};

const POWERUP_KEYS = Object.keys(POWERUPS);
const MAX_POWERUP_SLOTS = 3;
const POWERUP_KEYWORDS = new Set(POWERUP_KEYS.map((key) => POWERUPS[key].keyword));

function containsPowerupKeyword(word) {
  const normalized = word.toLowerCase();
  return [...POWERUP_KEYWORDS].some((keyword) => normalized.includes(keyword));
}
const VERSION = 'V6.0';

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
  powerInventory: [],
  powerChoices: [],
  pendingStageStartTimer: 0,
  activePowers: {},
  stageClearedMessageTimer: 0,
  clearedStageNumber: 0,
  powerChoiceOffered: false,
  gameOverSoundPlayed: false,
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
  lowercase: [
    'arc', 'ant', 'ash', 'bay', 'bee', 'bit', 'box', 'bud', 'cat', 'cave',
    'code', 'coin', 'core', 'dash', 'data', 'deck', 'delta', 'drift', 'dust',
    'echo', 'field', 'fire', 'flash', 'flow', 'flux', 'gate', 'ghost', 'glow',
    'grid', 'halo', 'ion', 'jet', 'key', 'leaf', 'light', 'loop', 'maze',
    'moon', 'node', 'nova', 'orbit', 'path', 'pixel', 'pulse', 'quake',
    'ray', 'rift', 'rocket', 'scan', 'signal', 'spark', 'star', 'storm',
    'tower', 'unit', 'vector', 'wave', 'xenon', 'zone', 'anchor', 'binary',
    'circuit', 'crystal', 'engine', 'galaxy', 'harbor', 'jungle', 'meteor',
    'nebula', 'packet', 'planet', 'portal', 'ranger', 'satellite', 'tunnel',
    'velocity', 'voyager', 'whisper', 'zeppelin', 'algorithm', 'backspace',
    'blueprint', 'calibrate', 'dashboard', 'endpoint', 'firewall', 'frequency',
    'hologram', 'interface', 'keyboard', 'labyrinth', 'navigation', 'overflow',
    'processor', 'quarantine', 'resonance', 'spaceship', 'telemetry', 'terminal',
    'transistor', 'warehouse'
  ],
  capitalized: [
    'Arc', 'Beam', 'Bolt', 'Core', 'Delta', 'Echo', 'Flux', 'Grid', 'Halo',
    'Ion', 'Nova', 'Orbit', 'Pulse', 'Quark', 'Rift', 'Rocket', 'Signal',
    'Spark', 'Tower', 'Vector', 'Wave', 'Zone', 'FireWall', 'HyperLoop',
    'MoonBase', 'NightShift', 'PowerCore', 'StarGate', 'SunRay', 'Asteroid',
    'BitCrusher', 'CloudCity', 'DataVault', 'EchoTower', 'GammaRay', 'IronPlanet',
    'JumboByte', 'MegaPortal', 'NeonRunner', 'OrbitForge', 'PixelCastle',
    'QuantumGate', 'RocketPilot', 'SolarArray', 'TurboTunnel', 'UltraVector',
    'VaultKeeper', 'WarpEngine', 'ZenithTower', 'AstroNavigation', 'BinaryBridge',
    'CyberneticRelay', 'DigitalFortress', 'GalacticTerminal', 'MechanicalDragon'
  ],
  numbers: [
    'a1', 'b2', 'c3', 'd4', 'x9', 'z7', '3d', '4g', '7up', '9ball',
    'arc7', 'beam2', 'bolt9', 'core42', 'data8', 'echo5', 'grid3', 'ion2',
    'node11', 'nova6', 'orbit8', 'pulse9', 'sector4', 'zone12', 'Alpha7',
    'Base64', 'Core99', 'Delta5', 'Grid24', 'Nova8', 'Atlas404', 'Beacon13',
    'Circuit88', 'Dragon3000', 'Echo2026', 'Falcon512', 'Gamma101', 'Harbor77',
    'IonDrive5', 'Jupiter12', 'Kernel900', 'Meteor64', 'Nebula31', 'Orbit2048',
    'Packet256', 'Quantum108', 'Rocket404', 'Signal360', 'Terminal808',
    'Vector144', 'Voyager1977', 'Waypoint300', 'Xenon1234', 'Zeppelin88'
  ],
  symbols: [
    'arc!', 'beam?', 'bolt#', 'core$', 'data%', 'echo+', 'flux*', 'grid-',
    'ion_2', 'node.js', 'nova@7', 'pulse+', 'ray/gun', 'rift?', 'scan.io',
    'spark!', 'star*9', 'warp-speed', 'x-ray', 'zone!', 'Alpha#1', 'Beta+2',
    'Core-X', 'Grid_7', 'Neo:Zone', 'Pulse.Max', 'atlas.exe', 'beacon++',
    'byte_shift', 'circuit.io', 'cloud-sync', 'data.portal', 'echo_unit',
    'firewall!', 'gamma-ray', 'hyper.link', 'ion-core', 'jolt+bolt',
    'kernel_32', 'mega.byte', 'neon@night', 'orbit/path', 'packet-drop',
    'quantum?', 'rocket.run', 'signal++', 'turbo-mode', 'vector.max',
    'warp_drive', 'xeno-file', 'zero.day'
  ],
  phrases: [
    'red alert', 'blue beam', 'dark grid', 'data stream', 'fire wall',
    'moon base', 'night shift', 'power core', 'quick scan', 'safe zone',
    'sector seven', 'star field', 'storm front', 'warp drive', 'zero hour',
    'Alpha Base', 'Beta Test', 'Code Red', 'Delta Wave', 'Grid Lock',
    'Hyper Beam', 'Nova Prime', 'ancient circuit', 'binary bridge',
    'cosmic tunnel', 'digital harbor', 'electric orchard', 'fuzzy keyboard',
    'galactic pancake', 'hidden terminal', 'jumpy robot', 'lunar elevator',
    'magnetic banana', 'neon fortress', 'orange protocol', 'pixel parade',
    'quantum bakery', 'radioactive toaster', 'silent asteroid', 'turbo cactus',
    'ultra checkpoint', 'virtual thunder', 'wandering comet', 'yellow submarine',
    'zero gravity pizza'
  ],
  expert: [
    'Quantum-7', 'Signal_42', 'Star Gate 9', 'Core#Alpha', 'Data.Stream',
    'Phase Shift', 'Zero Hour!', 'Binary Pulse', 'Cyber Shield', 'Hyper Vector',
    'Magnetic Field', 'Neon Protocol', 'Orbit Path 12', 'Plasma Reactor',
    'Quantum Tunnel', 'Signal Boost+', 'Solar Flare!', 'Vector Matrix',
    'Zone Control', 'containment field', 'ionization wave', 'synchronization',
    'transmission relay', 'acceleration node', 'authentication gateway',
    'biomechanical keyboard', 'cryptographic cactus', 'electromagnetic cupcake',
    'hyperdimensional portal', 'interstellar debugging', 'microprocessor orchestra',
    'neural network parade', 'parallel universe map', 'quantized banana split',
    'recursive moon elevator', 'spectacular syntax error', 'transcontinental modem',
    'unreasonably tiny spaceship', 'virtual reality avalanche', 'whimsical data warehouse',
    'xylophone powered robot', 'zero latency thunderstorm'
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


function isPowerActive(key) {
  return (GAME.activePowers[key] || 0) > 0;
}

function stripToAlphabeticText(word) {
  const cleaned = word
    .replace(/[^A-Za-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length > 0 ? cleaned : 'letters';
}

function applyWordPowerEffects(word) {
  let result = word;

  if (isPowerActive('alpha')) {
    result = stripToAlphabeticText(result);
  }

  if (isPowerActive('lower')) {
    result = result.toLowerCase();
  }

  return result;
}

function transformCurrentLaneWords() {
  const usedWords = [];
  for (const lane of GAME.lanes) {
    lane.previousWord = lane.word;
    lane.word = applyWordPowerEffects(lane.word);

    if (usedWords.includes(lane.word) || lane.word.length === 0) {
      lane.word = pickLaneWord(usedWords, [lane.previousWord]);
    }
    usedWords.push(lane.word);
  }
}

function heldPowerKeywordsStartingWith(text) {
  return GAME.powerInventory
    .map((key) => POWERUPS[key].keyword)
    .filter((keyword) => keyword.startsWith(text));
}

function hasHeldPowerKeyword(keyword) {
  return GAME.powerInventory.some((key) => POWERUPS[key].keyword === keyword);
}

function getRandomPowerupChoices() {
  const pool = [...POWERUP_KEYS];
  const choices = [];

  while (choices.length < 3 && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    choices.push(pool.splice(index, 1)[0]);
  }

  return choices;
}

function offerPowerupChoices() {
  if (GAME.powerInventory.length >= MAX_POWERUP_SLOTS) {
    GAME.powerChoices = [];
    GAME.floatingTexts.push({ text: 'POWER FULL', x: WIDTH / 2, y: 118, ttl: 0.9 });
    GAME.pendingStageStartTimer = 1.0;
    playTone(180, 0.12, 'square', 0.03);
    return;
  }

  GAME.powerChoices = getRandomPowerupChoices();
}

function selectPowerupChoice(choiceIndex) {
  if (!GAME.stageComplete || GAME.powerChoices.length === 0) {
    return false;
  }

  const key = GAME.powerChoices[choiceIndex];
  if (!key || GAME.powerInventory.length >= MAX_POWERUP_SLOTS) {
    return false;
  }

  GAME.powerInventory.push(key);
  GAME.powerChoices = [];
  const power = POWERUPS[key];
  GAME.floatingTexts.push({ text: `${power.icon} ${power.keyword}`, x: WIDTH / 2, y: 118, ttl: 1.15 });
  playTone(880, 0.08, 'triangle', 0.04);
  setTimeout(() => playTone(1180, 0.08, 'triangle', 0.035), 80);
  GAME.pendingStageStartTimer = 0.5;
  playChord([660, 880], 0.12, 'triangle', 0.045);
  return true;
}

function removeHeldPowerupByKeyword(keyword) {
  const index = GAME.powerInventory.findIndex((key) => POWERUPS[key].keyword === keyword);
  if (index === -1) {
    return null;
  }
  return GAME.powerInventory.splice(index, 1)[0];
}

function activatePowerup(keyword) {
  const key = removeHeldPowerupByKeyword(keyword);
  if (!key) {
    return false;
  }

  const power = POWERUPS[key];
  GAME.input = '';
  GAME.floatingTexts.push({ text: `${power.icon} ${power.name.toUpperCase()}!`, x: WIDTH / 2, y: 126, ttl: 1.0 });
  GAME.screenShake = Math.max(GAME.screenShake, key === 'kill' ? 9 : 4.5);
  playPowerupSound(key);

  if (key === 'kill') {
    killVisibleMonsters();
    return true;
  }

  GAME.activePowers[key] = Math.max(GAME.activePowers[key] || 0, power.duration);

  if (key === 'lower' || key === 'alpha') {
    transformCurrentLaneWords();
  }

  return true;
}

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

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playTone(frequency, duration = 0.08, type = 'square', volume = 0.035, destination = null) {
  if (!audioCtx) {
    return;
  }

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const out = destination || audioCtx.destination;
  const now = audioCtx.currentTime;
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(out);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function playSweep(startFrequency, endFrequency, duration = 0.18, type = 'sawtooth', volume = 0.04) {
  if (!audioCtx) {
    return;
  }

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const now = audioCtx.currentTime;
  osc.type = type;
  osc.frequency.setValueAtTime(startFrequency, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + duration);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function playChord(frequencies, duration = 0.18, type = 'triangle', volume = 0.028) {
  const perNoteVolume = volume / Math.max(1, frequencies.length);
  frequencies.forEach((frequency) => playTone(frequency, duration, type, perNoteVolume));
}

function playLaserSound() {
  playSweep(920 + GAME.combo.level * 45, 210, 0.11, 'sawtooth', 0.032);
  setTimeout(() => playTone(1480, 0.035, 'square', 0.014), 28);
}

function playDeathSound() {
  playSweep(180, 55, 0.16, 'square', 0.045);
  setTimeout(() => playTone(92, 0.08, 'triangle', 0.025), 55);
}

function playGameOverSound() {
  playSweep(420, 70, 0.42, 'sawtooth', 0.07);
  setTimeout(() => playTone(52, 0.28, 'square', 0.055), 150);
  setTimeout(() => playChord([65, 82, 98], 0.32, 'triangle', 0.05), 310);
}

function playMultiplierSound() {
  playChord([520, 660, 880], 0.13, 'triangle', 0.055);
  setTimeout(() => playTone(1180, 0.08, 'triangle', 0.025), 80);
}

function playStageClearSound() {
  playChord([392, 494, 659], 0.14, 'triangle', 0.055);
  setTimeout(() => playChord([523, 659, 784], 0.18, 'triangle', 0.06), 120);
}

function playPowerupSound(key) {
  const sounds = {
    freeze: () => playChord([880, 1175, 1760], 0.22, 'sine', 0.05),
    laser: () => playSweep(1400, 260, 0.22, 'sawtooth', 0.055),
    lower: () => playSweep(740, 370, 0.18, 'triangle', 0.045),
    kill: () => playSweep(95, 35, 0.34, 'square', 0.075),
    alpha: () => playChord([440, 554, 659, 880], 0.22, 'triangle', 0.052),
    wind: () => playSweep(260, 760, 0.32, 'sine', 0.045),
    drill: () => {
      playSweep(130, 1040, 0.2, 'sawtooth', 0.05);
      setTimeout(() => playSweep(1040, 210, 0.12, 'square', 0.035), 95);
    },
  };
  (sounds[key] || (() => playChord([520, 780], 0.16, 'triangle', 0.04)))();
}

function updateMusic(dt) {
  if (!audioCtx || GAME.gameOver || !GAME.gameStarted) {
    return;
  }

  musicTimer -= dt;
  if (musicTimer > 0) {
    return;
  }

  const bassLine = [82.41, 98.0, 110.0, 146.83, 123.47, 110.0, 98.0, 73.42];
  const leadLine = [329.63, 392.0, 493.88, 587.33, 523.25, 493.88, 392.0, 293.66];
  const step = musicStep % bassLine.length;
  const intensity = GAME.stage >= 7 ? 1.18 : GAME.stage >= 4 ? 1.08 : 1;
  playTone(bassLine[step], 0.105, 'triangle', 0.018 * intensity);

  if (musicStep % 2 === 0) {
    playTone(leadLine[step], 0.07, 'square', 0.009 * intensity);
  }

  if (musicStep % 8 === 4) {
    playTone(196.0, 0.045, 'sawtooth', 0.008 * intensity);
  }

  musicStep += 1;
  musicTimer = 0.22;
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

  const drillActive = isPowerActive('drill');
  const targets = drillActive ? monstersInLane : monstersInLane.slice(0, 1);

  GAME.lasers.push({
    laneIndex: lane.index,
    y: lane.y,
    x1: GAME.gridLeft,
    x2: GAME.protectedZoneX - 4,
    ttl: 0.16,
    color: drillActive ? POWERUPS.drill.color : comboColor(),
  });

  GAME.telemetry.lasersFired += 1;
  GAME.telemetry.wordsCompleted += 1;
  lane.flashTimer = 0.22;
  GAME.screenShake = Math.max(GAME.screenShake, drillActive ? 4.2 : 2.5);

  if (targets.length > 0) {
    for (const target of targets) {
      target.hp -= 1;
      GAME.floatingTexts.push({ text: drillActive ? 'drill' : '-1', x: target.x, y: target.y - 18, ttl: 0.5 });

      if (target.hp <= 0) {
        awardMonsterKill(target);
      }
    }
  } else {
    GAME.floatingTexts.push({ text: 'clear', x: GAME.gridLeft + 45, y: lane.y - 20, ttl: 0.55 });
  }

  replaceLaneWord(lane);
  GAME.input = '';
}


function awardMonsterKill(monster, label = null) {
  const gainedScore = scoreForKill(monster);
  monster.alive = false;
  GAME.score += gainedScore;
  GAME.telemetry.monstersKilled += 1;
  GAME.telemetry.deathsByLane[monster.laneIndex] += 1;
  GAME.floatingTexts.push({ text: label || `+${gainedScore}`, x: monster.x, y: monster.y - 35, ttl: 0.7 });
  addComboXp(monster.type.xp);
  playDeathSound();
}

function killVisibleMonsters() {
  const targets = GAME.monsters.filter((monster) => monster.alive && monster.active);

  if (targets.length === 0) {
    GAME.floatingTexts.push({ text: 'NO TARGETS', x: WIDTH / 2, y: 154, ttl: 0.75 });
    return;
  }

  for (const monster of targets) {
    awardMonsterKill(monster);
  }

  GAME.floatingTexts.push({ text: `BOOM x${targets.length}`, x: WIDTH / 2, y: 154, ttl: 0.85 });
}

function closestMonsterLaneIndex() {
  const targets = GAME.monsters
    .filter((monster) => monster.alive && monster.active && monster.x < GAME.protectedZoneX)
    .sort((a, b) => b.x - a.x);

  if (targets.length === 0) {
    return Math.floor(Math.random() * GAME.lanes.length);
  }

  return targets[0].laneIndex;
}

function firePowerLaserAtLane(laneIndex, color = '#ff5edb') {
  const lane = GAME.lanes[laneIndex];
  if (!lane) {
    return;
  }

  const monstersInLane = GAME.monsters
    .filter((monster) => monster.alive && monster.active && monster.laneIndex === laneIndex && monster.x < GAME.protectedZoneX)
    .sort((a, b) => b.x - a.x);
  const target = monstersInLane[0];

  GAME.lasers.push({
    laneIndex,
    y: lane.y,
    x1: GAME.gridLeft,
    x2: GAME.protectedZoneX - 4,
    ttl: 0.18,
    color,
  });

  GAME.telemetry.lasersFired += 1;
  lane.flashTimer = 0.22;

  if (target) {
    target.hp -= 1;
    GAME.floatingTexts.push({ text: 'zap', x: target.x, y: target.y - 18, ttl: 0.45 });
    if (target.hp <= 0) {
      awardMonsterKill(target);
    }
  }
}

function fireBonusLaserFromPower(correctLaneIndex) {
  if (!isPowerActive('laser') || GAME.lanes.length === 0) {
    return;
  }

  let randomLane = Math.floor(Math.random() * GAME.lanes.length);
  if (GAME.lanes.length > 1 && randomLane === correctLaneIndex) {
    randomLane = (randomLane + 1 + Math.floor(Math.random() * (GAME.lanes.length - 1))) % GAME.lanes.length;
  }

  firePowerLaserAtLane(randomLane, '#ffd34d');
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

function handleCharacter(character) {
  ensureAudio();

  if (!GAME.gameStarted || GAME.gameOver || GAME.stageComplete) {
    return;
  }

  const candidate = GAME.input + character;
  const laneHasPrefix = GAME.lanes.some((lane) => lane.word.startsWith(candidate));
  const powerHasPrefix = heldPowerKeywordsStartingWith(candidate).length > 0;
  GAME.telemetry.keypresses += 1;

  if (!laneHasPrefix && !powerHasPrefix) {
    GAME.telemetry.wrongLetters += 1;
    markWrongInput();
    return;
  }

  GAME.telemetry.correctLetters += 1;
  recordInputSuccess();
  GAME.input = candidate;
  playTone(330, 0.025, 'square', 0.012);

  if (hasHeldPowerKeyword(GAME.input) && activatePowerup(GAME.input)) {
    return;
  }

  const completedLane = findCompletedLane();

  if (completedLane) {
    const completedLaneIndex = completedLane.index;
    fireLaser(completedLane);
    fireBonusLaserFromPower(completedLaneIndex);
  }
}

function isPlayableCharacter(key) {
  return key.length === 1 && /^[ -~]$/.test(key);
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

  if (GAME.stageComplete && GAME.powerChoices.length > 0 && ['1', '2', '3'].includes(event.key)) {
    selectPowerupChoice(Number(event.key) - 1);
    event.preventDefault();
    return;
  }

  if (event.key === 'Backspace') {
    GAME.input = GAME.input.slice(0, -1);
    event.preventDefault();
    return;
  }

  if (isPlayableCharacter(event.key)) {
    handleCharacter(event.key);
    event.preventDefault();
  }
});

function updateTimers(dt) {
  if (GAME.stageMessageTimer > 0) {
    GAME.stageMessageTimer -= dt;
  }

  if (GAME.stageClearedMessageTimer > 0) {
    GAME.stageClearedMessageTimer -= dt;
  }

  if (GAME.wrongSpeedTimer > 0) {
    GAME.wrongSpeedTimer -= dt;
  }

  if (GAME.screenShake > 0) {
    GAME.screenShake -= 12 * dt;
  }

  for (const key of Object.keys(GAME.activePowers)) {
    GAME.activePowers[key] = Math.max(0, GAME.activePowers[key] - dt);
    if (GAME.activePowers[key] === 0) {
      delete GAME.activePowers[key];
    }
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
      if (!isPowerActive('freeze')) {
        monster.x += monster.speed * shieldPenalty * speedMultiplier * dt;
      }

      if (isPowerActive('wind')) {
        monster.x = Math.max(GAME.spawnX, monster.x - 96 * dt);
      }

      if (monster.x + monster.radius >= GAME.protectedZoneX) {
        if (!GAME.gameOverSoundPlayed) {
          playGameOverSound();
          GAME.gameOverSoundPlayed = true;
        }
        GAME.gameOver = true;
        GAME.telemetry.breachesByLane[monster.laneIndex] += 1;
      }
    }

    GAME.monsters = GAME.monsters.filter((monster) => monster.alive);

    if (GAME.monsters.length === 0 && !GAME.stageComplete) {
      GAME.stageComplete = true;
      GAME.clearedStageNumber = GAME.stage;
      GAME.stageClearedMessageTimer = 1.25;
      GAME.powerChoiceOffered = false;
      playStageClearSound();
      GAME.pendingStageStartTimer = 0;
    }

    if (GAME.stageComplete && GAME.stageClearedMessageTimer <= 0 && !GAME.powerChoiceOffered) {
      GAME.powerChoiceOffered = true;
      offerPowerupChoices();
    }

    if (GAME.stageComplete && GAME.powerChoices.length === 0 && GAME.pendingStageStartTimer > 0) {
      GAME.pendingStageStartTimer -= dt;
      if (GAME.pendingStageStartTimer <= 0) {
        GAME.stage += 1;
        startStage();
      }
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

function drawOverlay() {
  if (!GAME.gameStarted) {
    ctx.fillStyle = 'rgba(3, 3, 12, 0.82)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawPanel(WIDTH / 2 - 310, 138, 620, 356, '#ff38c8');
    drawNeonText('ZONE TYPERS', WIDTH / 2, 202, 56, 'center', '#ff38c8', 22);
    drawNeonText('ARCADE DEFENSE', WIDTH / 2, 252, 25, 'center', '#35f6ff', 16);
    drawNeonText('Type the exact lane text to fire into that lane.', WIDTH / 2, 318, 22, 'center', '#eafcff', 8);
    drawNeonText('Stop monsters before they breach the glowing zone.', WIDTH / 2, 354, 22, 'center', '#eafcff', 8);
    drawNeonText('Later stages add capitals, numbers, symbols, and spaces.', WIDTH / 2, 390, 22, 'center', '#ffd34d', 8);
    drawNeonText('Clear stages to collect up to 3 silly powerups.', WIDTH / 2, 424, 19, 'center', '#eafcff', 7);
    drawNeonText('Type a held power keyword to use it.', WIDTH / 2, 452, 18, 'center', '#eafcff', 7);
    drawNeonText('PRESS ENTER', WIDTH / 2, 490, 31, 'center', '#35f6ff', 20);
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
      drawNeonText('nice typing', WIDTH / 2, HEIGHT / 2 + 42, 20, 'center', '#ffd34d', 9);
    } else if (GAME.powerChoices.length > 0) {
      drawPowerupChoices();
    } else {
      drawNeonText('NEXT STAGE', WIDTH / 2, HEIGHT / 2 - 18, 48, 'center', '#35f6ff', 20);
      drawNeonText('incoming', WIDTH / 2, HEIGHT / 2 + 32, 20, 'center', '#ffd34d', 9);
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
