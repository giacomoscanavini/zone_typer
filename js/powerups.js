'use strict';

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
