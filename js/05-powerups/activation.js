'use strict';

function activatePowerup(keyword) {
  const key = removeHeldPowerupByKeyword(keyword);
  if (!key) {
    return false;
  }

  const power = POWERUPS[key];
  GAME.input = '';
  GAME.floatingTexts.push({ text: `${power.icon} ${power.name.toUpperCase()}!`, x: WIDTH / 2, y: 126, ttl: 1.0 });
  GAME.screenShake = Math.max(GAME.screenShake, key === 'kill' ? 9 : 4.5);
  playPowerupSound(key);

  if (key === 'kill') {
    killVisibleMonsters();
    return true;
  }

  GAME.activePowers[key] = Math.max(GAME.activePowers[key] || 0, power.duration);

  if (key === 'lower' || key === 'alpha') {
    transformCurrentLaneWords();
  }

  return true;
}
