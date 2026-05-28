'use strict';

function fireLaser(lane) {
  playLaserSound();
  const monstersInLane = GAME.monsters
    .filter((monster) => monster.alive && monster.active && monster.laneIndex === lane.index && monster.x < GAME.protectedZoneX)
    .sort((a, b) => b.x - a.x);

  const drillActive = isPowerActive('drill');
  const targets = drillActive ? monstersInLane : monstersInLane.slice(0, 1);

  queueLaserProjectile(lane, targets, drillActive ? POWERUPS.drill.color : comboColor(), {
    mode: drillActive ? 'drill' : 'single',
    label: drillActive ? 'drill' : '-1',
    speed: 2800,
    ttl: 0.62,
    length: drillActive ? 78 : 58,
  });

  GAME.telemetry.lasersFired += 1;
  GAME.telemetry.wordsCompleted += 1;
  lane.flashTimer = 0.22;
  GAME.screenShake = Math.max(GAME.screenShake, drillActive ? 4.2 : 2.5);

  if (targets.length === 0) {
    GAME.floatingTexts.push({ text: 'clear', x: GAME.gridLeft + 45, y: lane.y - 20, ttl: 0.55 });
  }

  replaceLaneWord(lane);
  GAME.input = '';
}
