'use strict';

function updateBoardLayout(laneCount) {
  const boardHeight = GAME.laneHeight * laneCount;
  GAME.gridTop = (HEIGHT - boardHeight) / 2;
  GAME.gridBottom = GAME.gridTop + boardHeight;
}

function createLane(index, usedWords) {
  const laneHeight = GAME.laneHeight;
  const y = GAME.gridTop + index * laneHeight + laneHeight / 2;
  const word = pickLaneWord(usedWords);
  usedWords.push(word);

  return {
    index,
    y,
    top: GAME.gridTop + index * laneHeight,
    bottom: GAME.gridTop + (index + 1) * laneHeight,
    word,
    previousWord: null,
    flashTimer: 0,
    wrongTimer: 0,
  };
}

function rebuildLanes() {
  const count = laneCountForStage(GAME.stage);
  updateBoardLayout(count);
  const usedWords = [];
  GAME.lanes = Array.from({ length: count }, (_, index) => createLane(index, usedWords));
}
