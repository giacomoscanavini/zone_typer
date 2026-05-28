'use strict';

window.addEventListener('keydown', (event) => {
  ensureAudio();

  if (event.key === 'Enter' && !GAME.gameStarted) {
    GAME.gameStarted = true;
    GAME.stageMessageTimer = 0.9;
    return;
  }

  if (event.key === 'Enter' && GAME.gameOver) {
    restartGame();
    GAME.gameStarted = true;
    return;
  }

  if (GAME.stageComplete && GAME.powerChoices.length > 0 && ['1', '2', '3'].includes(event.key)) {
    selectPowerupChoice(Number(event.key) - 1);
    event.preventDefault();
    return;
  }

  if (event.key === 'Backspace') {
    GAME.input = GAME.input.slice(0, -1);
    event.preventDefault();
    return;
  }

  if (isPlayableCharacter(event.key)) {
    handleCharacter(event.key);
    event.preventDefault();
  }
});
