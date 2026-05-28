'use strict';

function isPowerActive(key) {
  return (GAME.activePowers[key] || 0) > 0;
}
