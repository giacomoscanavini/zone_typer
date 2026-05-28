'use strict';

function stripToAlphabeticText(word) {
  const cleaned = word
    .replace(/[^A-Za-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length > 0 ? cleaned : 'letters';
}

function applyWordPowerEffects(word) {
  let result = word;

  if (isPowerActive('alpha')) {
    result = stripToAlphabeticText(result);
  }

  if (isPowerActive('lower')) {
    result = result.toLowerCase();
  }

  return result;
}

function transformCurrentLaneWords() {
  const usedWords = [];
  for (const lane of GAME.lanes) {
    lane.previousWord = lane.word;
    lane.word = applyWordPowerEffects(lane.word);

    if (usedWords.includes(lane.word) || lane.word.length === 0) {
      lane.word = pickLaneWord(usedWords, [lane.previousWord]);
    }
    usedWords.push(lane.word);
  }
}
