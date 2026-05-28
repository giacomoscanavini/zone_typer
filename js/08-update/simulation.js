'use strict';

function update(dt) {
  updateTimers(dt);
  updateMusic(dt);

  if (GAME.gameStarted && !GAME.gameOver) {
    const speedMultiplier = GAME.wrongSpeedTimer > 0 ? 1.42 : 1;

    for (const monster of GAME.monsters) {
      if (!monster.alive) {
        continue;
      }

      if (!monster.active) {
        monster.spawnDelay -= dt;
        if (monster.spawnDelay > 0) {
          continue;
        }
        monster.active = true;
        monster.x = GAME.spawnX;
      }

      const shieldPenalty = monster.typeKey === 'tank' && monster.hp === monster.maxHp
        ? monster.type.shieldSpeedMultiplier
        : monster.type.speedMultiplier;
      if (!isPowerActive('freeze')) {
        monster.x += monster.speed * shieldPenalty * speedMultiplier * dt;
      }

      if (isPowerActive('wind')) {
        monster.x = Math.max(GAME.spawnX, monster.x - 96 * dt);
      }

      if (monster.x + monster.radius >= GAME.protectedZoneX) {
        if (!GAME.gameOverSoundPlayed) {
          playGameOverSound();
          GAME.gameOverSoundPlayed = true;
        }
        GAME.gameOver = true;
        GAME.telemetry.breachesByLane[monster.laneIndex] += 1;
      }
    }

    GAME.monsters = GAME.monsters.filter((monster) => monster.alive);

    if (GAME.monsters.length === 0 && !GAME.stageComplete) {
      GAME.stageComplete = true;
      GAME.clearedStageNumber = GAME.stage;
      GAME.stageClearedMessageTimer = 1.25;
      GAME.powerChoiceOffered = false;
      playStageClearSound();
      GAME.pendingStageStartTimer = 0;
    }

    if (GAME.stageComplete && GAME.stageClearedMessageTimer <= 0 && !GAME.powerChoiceOffered) {
      GAME.powerChoiceOffered = true;
      offerPowerupChoices();
    }

    if (GAME.stageComplete && GAME.powerChoices.length === 0 && GAME.pendingStageStartTimer > 0) {
      GAME.pendingStageStartTimer -= dt;
      if (GAME.pendingStageStartTimer <= 0) {
        GAME.stage += 1;
        startStage();
      }
    }
  }

  for (const laser of GAME.lasers) {
    laser.ttl -= dt;
    laser.x -= laser.speed * dt;
    laser.impactResolved = resolveLaserImpact(laser);
  }

  GAME.lasers = GAME.lasers.filter((laser) => (
    !laser.impactResolved && laser.ttl > 0 && laser.x > GAME.gridLeft - 90
  ));

  for (const floatingText of GAME.floatingTexts) {
    floatingText.ttl -= dt;
    floatingText.y -= 26 * dt;
  }

  GAME.floatingTexts = GAME.floatingTexts.filter((floatingText) => floatingText.ttl > 0);
}
