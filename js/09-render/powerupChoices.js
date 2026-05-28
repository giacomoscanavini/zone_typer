'use strict';

function drawPowerupChoices() {
  if (!GAME.stageComplete || GAME.powerChoices.length === 0) {
    return;
  }

  drawPanel(WIDTH / 2 - 430, HEIGHT / 2 - 98, 860, 354, '#ffd34d');
  drawNeonText('CHOOSE A POWERUP', WIDTH / 2, HEIGHT / 2 - 54, 32, 'center', '#ffd34d', 16);
  drawNeonText('press 1, 2, or 3', WIDTH / 2, HEIGHT / 2 - 18, 18, 'center', '#eafcff', 7);

  for (let i = 0; i < GAME.powerChoices.length; i += 1) {
    const power = POWERUPS[GAME.powerChoices[i]];
    const cardWidth = 236;
    const cardHeight = 166;
    const x = WIDTH / 2 - 282 + i * 282;
    const y = HEIGHT / 2 + 106;
    drawPanel(x - cardWidth / 2, y - cardHeight / 2, cardWidth, cardHeight, power.color, 0.16);
    drawNeonText(`[${i + 1}]`, x - 86, y - 50, 18, 'center', '#eafcff', 8);

    ctx.save();
    ctx.font = '36px "Trebuchet MS", Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(power.icon, x, y - 45);
    ctx.restore();

    drawNeonText(power.keyword, x, y - 4, 22, 'center', power.color, 9);
    drawNeonText(`${power.duration || 'instant'}${power.duration ? 's' : ''}`, x, y + 28, 13, 'center', '#eafcff', 5);
    drawNeonText(power.description, x, y + 58, 11, 'center', '#eafcff', 4);
  }

  drawNeonText('type the word to play that power', WIDTH / 2, HEIGHT / 2 + 228, 17, 'center', '#ffd34d', 8);
}
