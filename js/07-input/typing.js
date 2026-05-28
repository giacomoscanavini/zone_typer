'use strict';

function markWrongInput() {
  recordInputError();
  GAME.wrongSpeedTimer = 1.6;
  GAME.screenShake = Math.max(GAME.screenShake, 4);
  GAME.floatingTexts.push({ text: 'speed up!', x: WIDTH / 2 - 30, y: 112, ttl: 0.75 });
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
