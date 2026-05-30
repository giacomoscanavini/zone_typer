'use strict';


/* handle combo XP, reset/downgrade, scoring formula */
function addComboXp(amount) {
  if (GAME.combo.level >= COMBO.maxLevel) {
    GAME.combo.xp = getComboThreshold();
    return;
  }

  GAME.combo.xp += amount;
  while (GAME.combo.level < COMBO.maxLevel && GAME.combo.xp >= getComboThreshold()) {
    GAME.combo.xp -= getComboThreshold();
    GAME.combo.level += 1;
    GAME.floatingTexts.push({
      text: `X${GAME.combo.level}`,
      x: WIDTH / 2,
      y: 122,
      ttl: 0.8,
      size: Math.min(46, 18 + GAME.combo.level * 6),
      glow: Math.min(20, 8 + GAME.combo.level * 3),
    });
    GAME.screenShake = Math.max(GAME.screenShake, 3.2);
    playMultiplierSound();
  }

  if (GAME.combo.level >= COMBO.maxLevel) {
    GAME.combo.xp = getComboThreshold();
  }
}

function resetComboFully() {
  GAME.combo.level = 1;
  GAME.combo.xp = 0;
  GAME.combo.consecutiveErrors = 0;
  GAME.floatingTexts.push({ text: 'COMBO RESET', x: WIDTH / 2, y: 86, ttl: 0.75 });
}

function downgradeCombo() {
  GAME.combo.level = Math.max(1, GAME.combo.level - 1);
  GAME.combo.xp = 0;
  GAME.floatingTexts.push({ text: `X${GAME.combo.level}`, x: WIDTH / 2, y: 122, ttl: 0.6, size: 22, glow: 9 });
}

function recordInputSuccess() {
  GAME.combo.consecutiveErrors = 0;
}

function recordInputError() {
  GAME.combo.consecutiveErrors += 1;
  if (GAME.combo.consecutiveErrors >= 2) {
    resetComboFully();
  } else {
    downgradeCombo();
  }
}

function scoreForKill(monster) {
  return 100 * GAME.combo.level * monster.type.xp;
}


/* laser creation and impact resolution */
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




/* monster death, kill reward and screen-clear behavior */
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


/* standard lane laser firing */
function fireLaser(lane) {
  playLaserSound();
  const monstersInLane = GAME.monsters
    .filter((monster) => monster.alive && monster.active && monster.laneIndex === lane.index && monster.x < GAME.protectedZoneX)
    .sort((a, b) => b.x - a.x);

  const pierceActive = isPowerActive('pierce');
  const targets = pierceActive ? monstersInLane : monstersInLane.slice(0, 1);

  queueLaserProjectile(lane, targets, pierceActive ? POWERUPS.pierce.color : comboColor(), {
    mode: pierceActive ? 'pierce' : 'single',
    label: pierceActive ? 'pierce' : '-1',
    speed: 2800,
    ttl: 0.62,
    length: pierceActive ? 78 : 58,
  });

  GAME.telemetry.lasersFired += 1;
  GAME.telemetry.wordsCompleted += 1;
  lane.flashTimer = 0.22;
  GAME.screenShake = Math.max(GAME.screenShake, pierceActive ? 4.2 : 2.5);

  if (targets.length === 0) {
    GAME.floatingTexts.push({ text: 'clear', x: GAME.gridLeft + 45, y: lane.y - 20, ttl: 0.55 });
  }

  replaceLaneWord(lane);
  GAME.input = '';
}


/* modified laser firing with powerup */
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
