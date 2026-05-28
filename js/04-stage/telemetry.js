'use strict';

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
