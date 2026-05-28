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
const VERSION = 'V6.2';

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
  nextMonsterId: 1,
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
    'transistor', 'warehouse',
    'apricot', 'boulder', 'canyon', 'compass', 'dynamo', 'ember', 'fable',
    'goblin', 'hazard', 'island', 'lantern', 'machine', 'marble', 'noodle',
    'obelisk', 'pirate', 'raccoon', 'saffron', 'temple', 'unicorn', 'velvet',
    'waffle', 'yonder', 'zircon', 'architecture', 'constellation',
    'documentation', 'encryption', 'extraordinary', 'kaleidoscope',
    'miscommunication', 'observatory', 'photosynthesis', 'responsibility',
    'spectrometer', 'thermodynamics', 'transformation', 'unpredictable'
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
    'CyberneticRelay', 'DigitalFortress', 'GalacticTerminal', 'MechanicalDragon',
    'AmberGarden', 'BoulderCity', 'CopperBridge', 'CrystalMarket',
    'DigitalLibrary', 'EmeraldEngine', 'FloatingHarbor', 'GoldenCircuit',
    'JupiterGarden', 'KineticPuzzle', 'LunarArchive', 'MarbleFactory',
    'NebulaStation', 'ObsidianCastle', 'PrismNavigator', 'QuartzMachine',
    'RobotSymphony', 'SilverTerminal', 'ThunderGarden', 'VelvetComet',
    'WonderfulSatellite', 'ZirconObservatory'
  ],
  numbers: [
    'a1', 'b2', 'c3', 'd4', 'x9', 'z7', '3d', '4g', '7up', '9ball',
    'arc7', 'beam2', 'bolt9', 'core42', 'data8', 'echo5', 'grid3', 'ion2',
    'node11', 'nova6', 'orbit8', 'pulse9', 'sector4', 'zone12', 'Atlas7',
    'Base64', 'Core99', 'Delta5', 'Grid24', 'Nova8', 'Atlas404', 'Beacon13',
    'Circuit88', 'Dragon3000', 'Echo2026', 'Falcon512', 'Gamma101', 'Harbor77',
    'IonDrive5', 'Jupiter12', 'Kernel900', 'Meteor64', 'Nebula31', 'Orbit2048',
    'Packet256', 'Quantum108', 'Rocket404', 'Signal360', 'Terminal808',
    'Vector144', 'Voyager1977', 'Waypoint300', 'Xenon1234', 'Zeppelin88',
    'Apollo17', 'Beacon204', 'Cipher700', 'Comet55', 'Dynamo202',
    'Ember19', 'Fable303', 'Galaxy909', 'Harbor202', 'Island404',
    'Jacket81', 'Kinetic66', 'Lantern707', 'Marble515', 'Nimbus333',
    'Obelisk616', 'Pirate808', 'Quartz919', 'Robot121', 'Saffron454',
    'Temple202', 'Unicorn313', 'Velvet626', 'Yonder747', 'Zircon858',
    'Constellation1001', 'Documentation2024', 'Observatory4096'
  ],
  symbols: [
    'arc!', 'beam?', 'bolt#', 'core$', 'data%', 'echo+', 'flux*', 'grid-',
    'ion_2', 'node.js', 'nova@7', 'pulse+', 'ray/gun', 'rift?', 'scan.io',
    'spark!', 'star*9', 'warp-speed', 'x-ray', 'zone!', 'Atlas#1', 'Beta+2',
    'Core-X', 'Grid_7', 'Neo:Zone', 'Pulse.Max', 'atlas.exe', 'beacon++',
    'byte_shift', 'circuit.io', 'cloud-sync', 'data.portal', 'echo_unit',
    'firewall!', 'gamma-ray', 'hyper.link', 'ion-core', 'jolt+bolt',
    'kernel_32', 'mega.byte', 'neon@night', 'orbit/path', 'packet-drop',
    'quantum?', 'rocket.run', 'signal++', 'turbo-mode', 'vector.max',
    'warp_drive', 'xeno-file', 'zero.day',
    'amber-core', 'boulder.exe', 'cipher++', 'comet.path', 'dynamo_mode',
    'ember@dusk', 'fable.io', 'galaxy-map', 'harbor.node', 'island+gate',
    'jacket.zip', 'kinetic.wave', 'lantern:code', 'marble_box',
    'nimbus.cloud', 'obelisk.run', 'pirate.flag', 'quartz#9',
    'robot.unit', 'saffron.byte', 'temple.sync', 'unicorn.vault',
    'velvet@moon', 'yonder/path', 'zircon++', 'architecture.v2',
    'documentation#42', 'observatory.link'
  ],
  phrases: [
    'red alert', 'blue beam', 'dark grid', 'data stream', 'fire wall',
    'moon base', 'night shift', 'power core', 'quick scan', 'safe zone',
    'sector seven', 'star field', 'storm front', 'warp drive', 'zero hour',
    'Atlas Base', 'Beta Test', 'Code Red', 'Delta Wave', 'Grid Lock',
    'Hyper Beam', 'Nova Prime', 'ancient circuit', 'binary bridge',
    'cosmic tunnel', 'digital harbor', 'electric orchard', 'fuzzy keyboard',
    'galactic pancake', 'hidden terminal', 'jumpy robot', 'lunar elevator',
    'magnetic banana', 'neon fortress', 'orange protocol', 'pixel parade',
    'quantum bakery', 'radioactive toaster', 'silent asteroid', 'turbo cactus',
    'ultra checkpoint', 'virtual thunder', 'wandering comet', 'yellow submarine',
    'zero gravity pizza',
    'amber garden', 'boulder canyon', 'copper bridge', 'crystal market',
    'digital library', 'emerald engine', 'floating harbor', 'golden circuit',
    'jupiter garden', 'kinetic puzzle', 'lunar archive', 'marble factory',
    'nebula station', 'obsidian castle', 'prism navigator', 'quartz machine',
    'robot symphony', 'silver terminal', 'thunder garden', 'velvet comet',
    'wonderful satellite', 'zircon observatory', 'very confused robot',
    'polite space goblin', 'accidental noodle parade', 'cosmic waffle factory'
  ],
  expert: [
    'Quantum-7', 'Signal_42', 'Star Gate 9', 'Core#Atlas', 'Data.Stream',
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
    'xylophone powered robot', 'zero latency thunderstorm',
    'architectural kaleidoscope', 'bureaucratic space penguin',
    'catastrophic noodle incident', 'constellation navigation panel',
    'documentation emergency protocol', 'electrostatic marmalade engine',
    'extraterrestrial sandwich machine', 'interplanetary luggage carousel',
    'microcontroller symphony orchestra', 'photosynthetic robot gardener',
    'responsibility assignment matrix', 'spectrometer calibration ritual',
    'thermodynamic pancake simulator', 'transformation sequence complete',
    'unpredictable asteroid cafeteria'
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
