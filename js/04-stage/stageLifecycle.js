'use strict';

function startStage() {
  rebuildLanes();
  GAME.monsters = [];
  GAME.lasers = [];
  GAME.floatingTexts = [];
  GAME.input = '';
  GAME.gameOver = false;
  GAME.stageComplete = false;
  GAME.stageMessageTimer = 1.15;
  GAME.telemetry.highestStage = Math.max(GAME.telemetry.highestStage, GAME.stage);

  const count = monsterCountForStage(GAME.stage);
  const speed = baseSpeedForStage(GAME.stage);

  const laneLoad = Array(GAME.lanes.length).fill(0);

  for (let i = 0; i < count; i += 1) {
    const minLoad = Math.min(...laneLoad);
    const candidateLanes = laneLoad
      .map((load, index) => ({ load, index }))
      .filter((item) => item.load === minLoad)
      .map((item) => item.index);
    const laneIndex = randomChoice(candidateLanes);
    laneLoad[laneIndex] += 1;

    const delay = i * Math.max(1.0, 1.72 - GAME.stage * 0.018) + Math.random() * 0.48;
    GAME.monsters.push(createMonster(laneIndex, delay, speed));
  }
}

function restartGame() {
  GAME.score = 0;
  GAME.stage = 1;
  GAME.wrongSpeedTimer = 0;
  GAME.screenShake = 0;
  GAME.combo = { level: 1, xp: 0, consecutiveErrors: 0 };
  GAME.powerInventory = [];
  GAME.powerChoices = [];
  GAME.pendingStageStartTimer = 0;
  GAME.activePowers = {};
  GAME.stageClearedMessageTimer = 0;
  GAME.clearedStageNumber = 0;
  GAME.powerChoiceOffered = false;
  GAME.gameOverSoundPlayed = false;
  GAME.nextMonsterId = 1;
  GAME.telemetry = createTelemetry();
  startStage();
}

function findCompletedLane() {
  return GAME.lanes.find((lane) => lane.word === GAME.input);
}

function replaceLaneWord(lane) {
  const usedWords = GAME.lanes.filter((item) => item.index !== lane.index).map((item) => item.word);
  const blockedWords = [lane.word, lane.previousWord].filter(Boolean);
  lane.previousWord = lane.word;
  lane.word = pickLaneWord(usedWords, blockedWords);
}
