'use strict';

function createMonster(laneIndex, delay, speed) {
  const typeKey = pickMonsterType(GAME.stage);
  const type = MONSTER_TYPES[typeKey];
  return {
    id: GAME.nextMonsterId++,
    typeKey,
    type,
    laneIndex,
    x: GAME.spawnX,
    y: GAME.lanes[laneIndex].y,
    radius: type.radius,
    hp: type.hp,
    maxHp: type.hp,
    speed,
    spawnDelay: delay,
    active: false,
    alive: true,
  };
}
