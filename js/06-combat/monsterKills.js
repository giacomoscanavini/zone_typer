'use strict';

function awardMonsterKill(monster, label = null) {
  const gainedScore = scoreForKill(monster);
  monster.alive = false;
  GAME.score += gainedScore;
  GAME.telemetry.monstersKilled += 1;
  GAME.telemetry.deathsByLane[monster.laneIndex] += 1;
  GAME.floatingTexts.push({ text: label || `+${gainedScore}`, x: monster.x, y: monster.y - 35, ttl: 0.7 });
  addComboXp(monster.type.xp);
  playDeathSound();
}

function killVisibleMonsters() {
  const targets = GAME.monsters.filter((monster) => monster.alive && monster.active);

  if (targets.length === 0) {
    GAME.floatingTexts.push({ text: 'NO TARGETS', x: WIDTH / 2, y: 154, ttl: 0.75 });
    return;
  }

  for (const monster of targets) {
    awardMonsterKill(monster);
  }

  GAME.floatingTexts.push({ text: `BOOM x${targets.length}`, x: WIDTH / 2, y: 154, ttl: 0.85 });
}
