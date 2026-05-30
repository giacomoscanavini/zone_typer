'use strict';

/* powerup definitions, keywords, and keyword detection */
const POWERUPS = {
    alpha: {
        keyword: 'alpha',
        name: 'Alpha',
        icon: '🐺',
        color: '#a6f2ac',
        duration: 12,
        description: 'Lowercase Only!',
    },
    freeze: {
        keyword: 'freeze',
        name: 'Freeze',
        icon: '❄️',
        color: '#a6f2ed',
        duration: 7,
        description: 'Freeze Enemies!',
    },
    gust: {
        keyword: 'gust',
        name: 'Gust',
        icon: '💨',
        color: '#3f65ef',
        duration: 7,
        description: 'Drag Monsters Back!',
    },
    laser: {
        keyword: 'laser',
        name: '2',
        icon: '‼️',
        color: '#e9a6f2',
        duration: 7,
        description: '+1 Random Laser!',
    },
    lower: {
        keyword: 'lower',
        name: 'Lower',
        icon: '👇',
        color: '#a6f2ed',
        duration: 7,
        description: 'Lowercase Only!',
    },
    nuke: {
        keyword: 'nuke',
        name: 'Nuke',
        icon: '☢️',
        color: '#f8ff22',
        duration: 0,
        description: 'Nuke-em All!',
    },
    pierce: {
        keyword: 'pierce',
        name: 'Pierce',
        icon: '💘',
        color: '#c83a3a',
        duration: 10,
        description: 'Piercing Shots!',
    },
};

const POWERUP_KEYS = Object.keys(POWERUPS);
const MAX_POWERUPS_SLOTS = 3;
const POWERUPS_KEYWORDS = new Set(POWERUP_KEYS.map((key) => POWERUPS[key].keyword));

function containsPowerupKeyword(word) {
    const normalized = word.toLowerCase();
    return [...POWERUPS_KEYWORDS].some((keyword) => normalized.includes(keyword));
}

/* audio functions defined in audio.js 
   powerups sounds */
function playPowerupSound(key) {
  const sounds = {
    alpha: () => playChord([440, 554, 659, 880], 0.22, 'triangle', 0.052),
    freeze: () => playChord([880, 1175, 1760], 0.22, 'sine', 0.05),
    gust: () => playSweep(260, 760, 0.32, 'sine', 0.045),
    laser: () => playSweep(1400, 260, 0.22, 'sawtooth', 0.055),
    lower: () => playSweep(740, 370, 0.18, 'triangle', 0.045),
    nuke: () => playSweep(95, 35, 0.34, 'square', 0.075),
    pierce: () => {
      playSweep(130, 1040, 0.2, 'sawtooth', 0.05);
      setTimeout(() => playSweep(1040, 210, 0.12, 'square', 0.035), 95);
    },
  };
  (sounds[key] || (() => playChord([520, 780], 0.16, 'triangle', 0.04)))();
}


/* active-power lookup */
function activatePowerup(keyword) {
  const key = removeHeldPowerupByKeyword(keyword);
  if (!key) {
    return false;
  }

  const power = POWERUPS[key];
  GAME.input = '';
  GAME.floatingTexts.push({ text: `${power.icon} ${power.name.toUpperCase()}!`, x: WIDTH / 2, y: 126, ttl: 1.0 });
  GAME.screenShake = Math.max(GAME.screenShake, key === 'nuke' ? 9 : 4.5);
  playPowerupSound(key);

  if (key === 'nuke') {
    killVisibleMonsters();
    return true;
  }

  GAME.activePowers[key] = Math.max(GAME.activePowers[key] || 0, power.duration);

  if (key === 'lower' || key === 'alpha') {
    transformCurrentLaneWords();
  }

  return true;
}



/* instant and timed power activation */
function isPowerActive(key) {
  return (GAME.activePowers[key] || 0) > 0;
}



/* lowercase and alphabetic-only transformations */
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


/* choice offering, selection, and removal */
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
  if (GAME.powerInventory.length >= MAX_POWERUPS_SLOTS) {
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
  if (!key || GAME.powerInventory.length >= MAX_POWERUPS_SLOTS) {
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