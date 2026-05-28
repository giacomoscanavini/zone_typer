'use strict';

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
