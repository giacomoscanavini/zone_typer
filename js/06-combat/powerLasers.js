'use strict';

function closestMonsterLaneIndex() {
  const targets = GAME.monsters
    .filter((monster) => monster.alive && monster.active && monster.x < GAME.protectedZoneX)
    .sort((a, b) => b.x - a.x);

  if (targets.length === 0) {
    return Math.floor(Math.random() * GAME.lanes.length);
  }

  return targets[0].laneIndex;
}

function firePowerLaserAtLane(laneIndex, color = '#ff5edb') {
  const lane = GAME.lanes[laneIndex];
  if (!lane) {
    return;
  }

  const monstersInLane = GAME.monsters
    .filter((monster) => monster.alive && monster.active && monster.laneIndex === laneIndex && monster.x < GAME.protectedZoneX)
    .sort((a, b) => b.x - a.x);
  const target = monstersInLane[0];

  queueLaserProjectile(lane, target ? [target] : [], color, {
    label: 'zap',
    speed: 3000,
    ttl: 0.58,
    length: 62,
  });

  GAME.telemetry.lasersFired += 1;
  lane.flashTimer = 0.22;
}

function fireBonusLaserFromPower(correctLaneIndex) {
  if (!isPowerActive('laser') || GAME.lanes.length === 0) {
    return;
  }

  let randomLane = Math.floor(Math.random() * GAME.lanes.length);
  if (GAME.lanes.length > 1 && randomLane === correctLaneIndex) {
    randomLane = (randomLane + 1 + Math.floor(Math.random() * (GAME.lanes.length - 1))) % GAME.lanes.length;
  }

  firePowerLaserAtLane(randomLane, '#ffd34d');
}
