'use strict';

function queueLaserProjectile(lane, targets, color, options = {}) {
  const targetIds = targets.map((target) => target.id);
  const targetX = targets[0] ? targets[0].x : GAME.gridLeft + 22;

  GAME.lasers.push({
    laneIndex: lane.index,
    y: lane.y,
    x: GAME.protectedZoneX - 8,
    targetX,
    targetIds,
    mode: options.mode || 'single',
    label: options.label || '-1',
    speed: options.speed || 2800,
    ttl: options.ttl || 0.62,
    maxTtl: options.ttl || 0.62,
    length: options.length || 58,
    color,
  });
}

function findLiveMonsterById(id) {
  return GAME.monsters.find((monster) => monster.id === id && monster.alive && monster.active);
}

function resolveLaserImpact(laser) {
  if (laser.targetIds.length === 0) {
    return false;
  }

  const targets = laser.targetIds
    .map((id) => findLiveMonsterById(id))
    .filter(Boolean);

  if (targets.length === 0) {
    return true;
  }

  const impactTarget = targets[0];
  if (laser.x > impactTarget.x) {
    return false;
  }

  for (const target of targets) {
    target.hp -= 1;
    GAME.floatingTexts.push({ text: laser.label, x: target.x, y: target.y - 18, ttl: 0.5 });

    if (target.hp <= 0) {
      awardMonsterKill(target);
    }
  }

  return true;
}
