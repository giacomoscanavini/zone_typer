'use strict';

const MONSTER_TYPES = {
  basic: {
    label: 'Basic',
    hp: 1,
    xp: 1,
    radius: 15,
    speedMultiplier: 1,
    color: '#ff3b5f',
  },
  runner: {
    label: 'Runner',
    hp: 1,
    xp: 2,
    radius: 12,
    speedMultiplier: 1.45,
    color: '#ff8f2e',
  },
  tank: {
    label: 'Shield',
    hp: 2,
    xp: 2,
    radius: 17,
    speedMultiplier: 1,
    shieldSpeedMultiplier: 0.58,
    color: '#ffd34d',
    shieldColor: '#37f6ff',
  },
  elite: {
    label: 'Elite',
    hp: 3,
    xp: 5,
    radius: 18,
    speedMultiplier: 0.82,
    color: '#b65cff',
  },
};
