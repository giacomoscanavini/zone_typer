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
