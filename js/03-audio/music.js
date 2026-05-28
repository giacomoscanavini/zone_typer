'use strict';

function updateMusic(dt) {
  if (!audioCtx || GAME.gameOver || !GAME.gameStarted) {
    return;
  }

  musicTimer -= dt;
  if (musicTimer > 0) {
    return;
  }

  const bassLine = [82.41, 98.0, 110.0, 146.83, 123.47, 110.0, 98.0, 73.42];
  const leadLine = [329.63, 392.0, 493.88, 587.33, 523.25, 493.88, 392.0, 293.66];
  const step = musicStep % bassLine.length;
  const intensity = GAME.stage >= 7 ? 1.18 : GAME.stage >= 4 ? 1.08 : 1;
  playTone(bassLine[step], 0.105, 'triangle', 0.018 * intensity);

  if (musicStep % 2 === 0) {
    playTone(leadLine[step], 0.07, 'square', 0.009 * intensity);
  }

  if (musicStep % 8 === 4) {
    playTone(196.0, 0.045, 'sawtooth', 0.008 * intensity);
  }

  musicStep += 1;
  musicTimer = 0.22;
}
