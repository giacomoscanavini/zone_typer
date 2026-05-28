'use strict';

const POWERUPS = {
  freeze: {
    keyword: 'freeze',
    name: 'Freeze',
    icon: '🧊',
    color: '#9befff',
    duration: 7,
    description: 'Freeze monsters',
  },
  laser: {
    keyword: 'laser',
    name: 'Laser',
    icon: '🦆',
    color: '#ff5edb',
    duration: 7,
    description: '+1 random laser',
  },
  lower: {
    keyword: 'lower',
    name: 'Lower',
    icon: '🐣',
    color: '#ffd34d',
    duration: 10,
    description: 'Lowercase words',
  },
  kill: {
    keyword: 'kill',
    name: 'Kill',
    icon: '💥',
    color: '#ff3b5f',
    duration: 0,
    description: 'Clear screen',
  },
  alpha: {
    keyword: 'alpha',
    name: 'Alpha',
    icon: '🧼',
    color: '#55e079',
    duration: 10,
    description: 'Letters only',
  },
  wind: {
    keyword: 'wind',
    name: 'Wind',
    icon: '🌬️',
    color: '#9befff',
    duration: 7,
    description: 'Push monsters back',
  },
  drill: {
    keyword: 'drill',
    name: 'Drill',
    icon: '🪛',
    color: '#c084fc',
    duration: 7,
    description: 'Pierce same lane',
  },
};

const POWERUP_KEYS = Object.keys(POWERUPS);
const MAX_POWERUP_SLOTS = 3;
const POWERUP_KEYWORDS = new Set(POWERUP_KEYS.map((key) => POWERUPS[key].keyword));

function containsPowerupKeyword(word) {
  const normalized = word.toLowerCase();
  return [...POWERUP_KEYWORDS].some((keyword) => normalized.includes(keyword));
}
