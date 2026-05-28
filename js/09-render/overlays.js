'use strict';

function drawOverlay() {
  if (!GAME.gameStarted) {
    ctx.fillStyle = 'rgba(3, 3, 12, 0.82)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawPanel(WIDTH / 2 - 310, 138, 620, 356, '#ff38c8');
    drawNeonText('ZONE TYPERS', WIDTH / 2, 202, 56, 'center', '#ff38c8', 22);
    drawNeonText('ARCADE DEFENSE', WIDTH / 2, 252, 25, 'center', '#35f6ff', 16);
    drawNeonText('Type the exact lane text to fire into that lane.', WIDTH / 2, 318, 22, 'center', '#eafcff', 8);
    drawNeonText('Stop monsters before they breach the glowing zone.', WIDTH / 2, 354, 22, 'center', '#eafcff', 8);
    drawNeonText('Later stages add capitals, numbers, symbols, and spaces.', WIDTH / 2, 390, 22, 'center', '#ffd34d', 8);
    drawNeonText('Clear stages to collect up to 3 silly powerups.', WIDTH / 2, 424, 19, 'center', '#eafcff', 7);
    drawNeonText('Type a held power keyword to use it.', WIDTH / 2, 452, 18, 'center', '#eafcff', 7);
    drawNeonText('PRESS ENTER', WIDTH / 2, 490, 31, 'center', '#35f6ff', 20);
    return;
  }

  if (GAME.stageMessageTimer > 0) {
    ctx.fillStyle = 'rgba(3, 3, 12, 0.50)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawNeonText(`STAGE ${GAME.stage}`, WIDTH / 2, HEIGHT / 2 - 18, 50, 'center', '#ffd34d', 20);
    drawNeonText('PROTECT THE ZONE', WIDTH / 2, HEIGHT / 2 + 34, 23, 'center', '#35f6ff', 12);
  }

  if (GAME.stageComplete) {
    ctx.fillStyle = 'rgba(3, 3, 12, 0.45)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (GAME.stageClearedMessageTimer > 0) {
      drawNeonText(`STAGE ${GAME.clearedStageNumber} CLEARED`, WIDTH / 2, HEIGHT / 2 - 8, 48, 'center', '#35f6ff', 20);
      drawNeonText('nice typing', WIDTH / 2, HEIGHT / 2 + 42, 20, 'center', '#ffd34d', 9);
    } else if (GAME.powerChoices.length > 0) {
      drawPowerupChoices();
    } else {
      drawNeonText('NEXT STAGE', WIDTH / 2, HEIGHT / 2 - 18, 48, 'center', '#35f6ff', 20);
      drawNeonText('incoming', WIDTH / 2, HEIGHT / 2 + 32, 20, 'center', '#ffd34d', 9);
    }
  }

  if (GAME.gameOver) {
    ctx.fillStyle = 'rgba(3, 3, 12, 0.86)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawPanel(WIDTH / 2 - 330, 120, 660, 310, '#ff38c8');
    drawNeonText('ZONE BREACHED', WIDTH / 2, 184, 48, 'center', '#ff3b5f', 20);
    drawNeonText(`FINAL SCORE ${GAME.score}`, WIDTH / 2, 242, 27, 'center', '#ffd34d', 12);
    drawNeonText(`STAGE ${GAME.telemetry.highestStage}   ACC ${getAccuracy()}%   KILLS ${GAME.telemetry.monstersKilled}`, WIDTH / 2, 288, 21, 'center', '#eafcff', 8);
    drawNeonText('PRESS ENTER TO RESTART', WIDTH / 2, 358, 25, 'center', '#35f6ff', 16);
  }
}
