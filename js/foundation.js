'use strict';

/* canvas, drawing context, canvas dimensions */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const VERSION = 'v6.3';

const COMBO = {
    maxLevel: 5,
    thresholds: [0, 10, 18, 30, 46],
    colors: {
        1: '#ffffff',
        2: '#00bbff',
        3: '#59ff00',
        4: '#ea02ff',
        5: '#ffae00',
    }
}

/* define GAME state */
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

/* helpers */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomChoice(items) {
  return items[Math.floor(Math.random() * items.length)];
}
