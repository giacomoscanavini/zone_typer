'use strict';

function isWordTooSimilar(word, usedWords) {
  return usedWords.some((used) => (
    used === word || used.startsWith(word) || word.startsWith(used) || used[0] === word[0]
  ));
}

function wordPoolForStage(stage) {
  if (stage <= 3) {
    return WORDS_BY_TIER.lowercase;
  }

  if (stage <= 6) {
    return [...WORDS_BY_TIER.lowercase, ...WORDS_BY_TIER.capitalized];
  }

  if (stage <= 9) {
    return [...WORDS_BY_TIER.capitalized, ...WORDS_BY_TIER.numbers];
  }

  if (stage <= 12) {
    return [...WORDS_BY_TIER.numbers, ...WORDS_BY_TIER.symbols];
  }

  if (stage <= 15) {
    return [...WORDS_BY_TIER.symbols, ...WORDS_BY_TIER.phrases];
  }

  return [...WORDS_BY_TIER.phrases, ...WORDS_BY_TIER.expert];
}

function pickLaneWord(usedWords = [], blockedWords = []) {
  const pool = wordPoolForStage(GAME.stage);
  const blocked = new Set([...usedWords, ...blockedWords]);
  const usablePool = pool
    .filter((word) => !containsPowerupKeyword(word))
    .map((word) => applyWordPowerEffects(word))
    .filter((word) => word.length > 0 && !containsPowerupKeyword(word));
  const options = usablePool.filter((word) => !blocked.has(word) && !isWordTooSimilar(word, usedWords));
  const fallback = usablePool.filter((word) => !blocked.has(word));
  return randomChoice(options.length > 0 ? options : fallback.length > 0 ? fallback : usablePool);
}
