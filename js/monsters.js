'use strict';

/* monster stats and display metadata */
const MONSTER_TYPES = {
    basic: {
        label: 'Basic',
        hp: 1,
        xp: 1,
        radius: 15, 
        speedMultiplier: 0.9,
        color: '#ff0000',
    },
    runner: {
        label: 'Runner',
        hp: 1,
        xp: 2,
        radius: 12, 
        speedMultiplier: 1.2,
        color: '#ea00ff',
    },
    tank: {
        label: 'Shield',
        hp: 2,
        xp: 2,
        radius: 17, 
        speedMultiplier: 1,
        shieldSpeedMultiplier: 0.45,
        color: '#ffbf00',
        shieldColor: '#979191',
    },
    elite: {
        label: 'Elite',
        hp: 3,
        xp: 5,
        radius: 18, 
        speedMultiplier: 0.75,
        color: '#00ff1e',
    },
};

/* monster sprites source */
const SPRITES = {};
for (const [key, src] of Object.entries({
  basic: 'assets/sprites/monster-basic.png',
  runner: 'assets/sprites/monster-runner.png',
  tank: 'assets/sprites/monster-tank.png',
  elite: 'assets/sprites/monster-elite.png',
})) {
  const image = new Image();
  image.src = src;
  SPRITES[key] = image;
}