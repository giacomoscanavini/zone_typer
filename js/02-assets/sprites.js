'use strict';

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
