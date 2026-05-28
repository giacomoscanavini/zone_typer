'use strict';

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
