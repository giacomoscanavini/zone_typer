'use strict';

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
