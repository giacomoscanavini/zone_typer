'use strict';

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
