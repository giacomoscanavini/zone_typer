'use strict';

/* monster type probability rules */
function pickMonsterType(stage) {
    const roll = Math.random();

    if (stage <= 1){
        return 'basic';
    }
    if (stage == 2){
        if (roll <= 0.05){ return 'runner'; } 
        else { return 'basic'; }
    }
    if (stage == 3){
        if (roll <= 0.15){ return 'runner'; } 
        else { return 'basic'; }
    }
    if (stage == 4){
        if (roll <= 0.30){ return 'runner'; } 
        else { return 'basic'; }
    }
    if (stage == 5){
        if (roll <= 0.05){ return 'tank'; } 
        else if (roll > 0.05 && roll <= 0.35){ return 'runner'; }
        else { return 'basic'; }
    }
    if (stage == 6){
        if (roll <= 0.15){ return 'tank'; } 
        else if (roll > 0.15 && roll <= 0.45){ return 'runner'; }
        else { return 'basic'; }
    }
    if (stage == 7){
        if (roll <= 0.20){ return 'tank'; } 
        else if (roll > 0.20 && roll <= 0.50){ return 'runner'; }
        else { return 'basic'; }
    }
    if (stage == 8){
        if (roll <= 0.25){ return 'tank'; } 
        else if (roll > 0.25 && roll <= 0.55){ return 'runner'; }
        else { return 'basic'; }
    }
    if (stage == 9){
        if (roll <= 0.05){ return 'elite'; } 
        else if (roll > 0.05 && roll <= 0.30){ return 'tank'; }
        else if (roll > 0.30 && roll <= 0.60){ return 'runner'; }
        else { return 'basic'; }
    }
    if (stage == 10){
        if (roll <= 0.10){ return 'elite'; } 
        else if (roll > 0.10 && roll <= 0.35){ return 'tank'; }
        else if (roll > 0.35 && roll <= 0.65){ return 'runner'; }
        else { return 'basic'; }
    }
    if (stage > 10 && stage < 15){
        if (roll <= 0.15){ return 'elite'; } 
        else if (roll > 0.15 && roll <= 0.40){ return 'tank'; }
        else if (roll > 0.40 && roll <= 0.70){ return 'runner'; }
        else { return 'basic'; }
    }
    if (stage >= 15 && stage < 20){
        if (roll <= 0.25){ return 'elite'; } 
        else if (roll > 0.25 && roll <= 0.60){ return 'tank'; }
        else if (roll > 0.60 && roll <= 0.80){ return 'runner'; }
        else { return 'basic'; }
    }
    if (stage >= 20 && stage < 25){
        if (roll <= 0.40){ return 'elite'; } 
        else if (roll > 0.40 && roll <= 0.80){ return 'tank'; }
        else if (roll > 0.80 && roll <= 0.90){ return 'runner'; }
        else { return 'basic'; }
    }
    if (stage >= 25){
        if (roll <= 0.97){ return 'elite'; } 
        else if (roll > 0.97 && roll <= 0.98){ return 'tank'; }
        else if (roll > 0.98 && roll <= 0.99){ return 'runner'; }
        else { return 'basic'; }
    }
};

/* create next monster */
function createMonster(laneIndex, delay, speed) {
    const typeKey = pickMonsterType(GAME.stage);
    const type = MONSTER_TYPES[typeKey];
    return {
        id: GAME.nextMonsterId++,
        typeKey, 
        type, 
        laneIndex,
        x: GAME.spawnX,
        y: GAME.lanes[laneIndex].y,
        radius: type.radius,
        hp: type.hp,
        maxHp: type.hp,
        speed, 
        spawnDelay: delay,
        active: false, 
        alive: true,
    };
}


/* difficulty and combo build-up of stage */
function laneCountForStage(stage) {
    return clamp(3 + Math.floor((stage - 1) / 3), 3, GAME.maxLanes);
}

function monsterCountForStage(stage) {
    return 4 + Math.floor(stage * 1.25);
}

function baseSpeedForStage(stage) {
    return 22 + stage * 2.8;
}

function getComboThreshold() {
    return COMBO.thresholds[GAME.combo.level] || 999999;
}

function comboColor() {
    return COMBO.colors[GAME.combo.level];
}

function comboProgress() {
    if (GAME.combo.level >= COMBO.maxLevel) {
        return 1;
    }
    return clamp(GAME.combo.xp / getComboThreshold(), 0, 1);
}

/* handle lanes per stage */
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


/* stage start, restart, completed lane lookup, word replacement */
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


/* word selection, avoid duplicates, and staged complexity */
function normalizeWordForSelection(word) {
    return word.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function wordComplexityScore(word) {
    const lettersOnlyLength = word.replace(/\s+/g, '').length;
    const uppercaseCount = (word.match(/[A-Z]/g) || []).length;
    const digitCount = (word.match(/[0-9]/g) || []).length;
    const symbolCount = (word.match(/[^A-Za-z0-9\s]/g) || []).length;
    const wordCount = word.trim().split(/\s+/).filter(Boolean).length;

    return (
        lettersOnlyLength
        + uppercaseCount * 0.7
        + digitCount * 1.2
        + symbolCount * 1.5
        + Math.max(0, wordCount - 1) * 3
    );
}

function stageWordRules(stage) {
    if (stage <= 1) {
        return { tiers: ['lowercase'], minScore: 0, maxScore: 4 };
    }
    if (stage === 2) {
        return { tiers: ['lowercase'], minScore: 3.5, maxScore: 5 };
    }
    if (stage === 3) {
        return { tiers: ['lowercase'], minScore: 4, maxScore: 6 };
    }
    if (stage === 4) {
        return { tiers: ['lowercase', 'capitalized'], minScore: 4.5, maxScore: 7 };
    }
    if (stage === 5) {
        return { tiers: ['lowercase', 'capitalized'], minScore: 5, maxScore: 9 };
    }
    if (stage === 6) {
        return { tiers: ['lowercase', 'capitalized'], minScore: 6, maxScore: 12 };
    }
    if (stage === 7) {
        return { tiers: ['capitalized', 'numbers'], minScore: 7, maxScore: 10 };
    }
    if (stage === 8) {
        return { tiers: ['capitalized', 'numbers'], minScore: 8, maxScore: 13 };
    }
    if (stage === 9) {
        return { tiers: ['capitalized', 'numbers'], minScore: 9, maxScore: 16 };
    }
    if (stage === 10) {
        return { tiers: ['numbers', 'symbols'], minScore: 12, maxScore: 16 };
    }
    if (stage === 11) {
        return { tiers: ['numbers', 'symbols'], minScore: 13, maxScore: 18 };
    }
    if (stage === 12) {
        return { tiers: ['numbers', 'symbols'], minScore: 14, maxScore: 20 };
    }
    if (stage === 13) {
        return { tiers: ['symbols', 'phrases'], minScore: 15, maxScore: 20 };
    }
    if (stage === 14) {
        return { tiers: ['symbols', 'phrases'], minScore: 16, maxScore: 23 };
    }
    if (stage === 15) {
        return { tiers: ['symbols', 'phrases'], minScore: 17, maxScore: 26 };
    }

    return { tiers: ['phrases', 'expert'], minScore: 15 + (stage - 16) * 0.6, maxScore: 30 + (stage - 16) * 1.5 };
}

function isWordTooSimilar(word, usedWords) {
    const normalized = normalizeWordForSelection(word);

    return usedWords.some((used) => {
        const usedNormalized = normalizeWordForSelection(used);

        return (
            used === word
            || usedNormalized === normalized
            || usedNormalized.startsWith(normalized)
            || normalized.startsWith(usedNormalized)
            || usedNormalized.includes(normalized)
            || normalized.includes(usedNormalized)
            || usedNormalized[0] === normalized[0]
        );
    });
}

function wordPoolForStage(stage) {
    const rules = stageWordRules(stage);
    const rawPool = rules.tiers.flatMap((tier) => WORDS_BY_TIER[tier]);
    const filteredPool = rawPool.filter((word) => {
        const score = wordComplexityScore(word);
        return score >= rules.minScore && score <= rules.maxScore;
    });

    return filteredPool.length > 0 ? filteredPool : rawPool;
}

function pickLaneWord(usedWords = [], blockedWords = []) {
    const pool = wordPoolForStage(GAME.stage);
    const blocked = new Set(
        [...usedWords, ...blockedWords].map((word) => normalizeWordForSelection(word))
    );
    const usablePool = pool
        .filter((word) => !containsPowerupKeyword(word))
        .map((word) => applyWordPowerEffects(word))
        .filter((word) => word.length > 0 && !containsPowerupKeyword(word));
    const options = usablePool.filter((word) => (
        !blocked.has(normalizeWordForSelection(word))
        && !isWordTooSimilar(word, usedWords)
    ));
    const fallback = usablePool.filter((word) => !blocked.has(normalizeWordForSelection(word)));

    return randomChoice(options.length > 0 ? options : fallback.length > 0 ? fallback : usablePool);
}


/* telemetry, accuracy, and lane danger */
function createTelemetry() {
    return {
        startedAt: performance.now(),
        keypresses: 0,
        correctLetters: 0,
        wrongLetters: 0,
        wordsCompleted: 0,
        monstersKilled: 0,
        lasersFired: 0,
        breachesByLane: Array(GAME.maxLanes).fill(0),
        deathsByLane: Array(GAME.maxLanes).fill(0),
        highestStage: 1,
    };
}

function getAccuracy() {
    const total = GAME.telemetry.correctLetters + GAME.telemetry.wrongLetters;
    if (total === 0) {
        return 100;
    }
    return Math.round((GAME.telemetry.correctLetters / total) * 100);
}

function getLaneDanger(laneIndex) {
    const active = GAME.monsters.filter((monster) => monster.alive && monster.active && monster.laneIndex === laneIndex);
    if (active.length === 0) {
        return 0;
    }

    const closest = active.reduce((best, monster) => Math.max(best, monster.x), GAME.spawnX);
    const progress = (closest - GAME.spawnX) / (GAME.protectedZoneX - GAME.spawnX);
    return clamp(progress, 0, 1);
}