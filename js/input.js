'use strict';

/* browser keydown listener */
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


/* character validation,
   input accumulation, 
   wrong-input penalties, 
   completed-word detection */
function markWrongInput() {
  recordInputError();
  GAME.wrongSpeedTimer = 1.6;
  GAME.screenShake = Math.max(GAME.screenShake, 4);
  GAME.floatingTexts.push({ text: 'Speed up!', x: WIDTH / 2 - 30, y: 112, ttl: 0.75 });
  playTone(78, 0.12, 'sawtooth', 0.035);

  for (const lane of GAME.lanes) {
    if (lane.word.startsWith(GAME.input)) {
      lane.wrongTimer = 0.28;
    }
  }
}

function handleCharacter(character) {
  ensureAudio();

  if (!GAME.gameStarted || GAME.gameOver || GAME.stageComplete) {
    return;
  }

  const candidate = GAME.input + character;
  const laneHasPrefix = GAME.lanes.some((lane) => lane.word.startsWith(candidate));
  const powerHasPrefix = heldPowerKeywordsStartingWith(candidate).length > 0;
  GAME.telemetry.keypresses += 1;

  if (!laneHasPrefix && !powerHasPrefix) {
    GAME.telemetry.wrongLetters += 1;
    markWrongInput();
    return;
  }

  GAME.telemetry.correctLetters += 1;
  recordInputSuccess();
  GAME.input = candidate;
  playTone(330, 0.025, 'square', 0.012);

  if (hasHeldPowerKeyword(GAME.input) && activatePowerup(GAME.input)) {
    return;
  }

  const completedLane = findCompletedLane();

  if (completedLane) {
    const completedLaneIndex = completedLane.index;
    fireLaser(completedLane);
    fireBonusLaserFromPower(completedLaneIndex);
  }
}

function isPlayableCharacter(key) {
  return key.length === 1 && /^[ -~]$/.test(key);
}