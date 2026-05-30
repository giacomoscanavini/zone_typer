'use strict';

let audioCtx = null;
let musicTimer = 0;
let musicStep = 0;


/* audio engine */
function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playTone(frequency, duration = 0.08, type = 'square', volume = 0.035, destination = null) {
  if (!audioCtx) {
    return;
  }

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const out = destination || audioCtx.destination;
  const now = audioCtx.currentTime;
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(out);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function playSweep(startFrequency, endFrequency, duration = 0.18, type = 'sawtooth', volume = 0.04) {
  if (!audioCtx) {
    return;
  }

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const now = audioCtx.currentTime;
  osc.type = type;
  osc.frequency.setValueAtTime(startFrequency, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + duration);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function playChord(frequencies, duration = 0.18, type = 'triangle', volume = 0.028) {
  const perNoteVolume = volume / Math.max(1, frequencies.length);
  frequencies.forEach((frequency) => playTone(frequency, duration, type, perNoteVolume));
}

/* gameplay sound effects */
function playLaserSound() {
  playSweep(920 + GAME.combo.level * 45, 210, 0.11, 'sawtooth', 0.032);
  setTimeout(() => playTone(1480, 0.035, 'square', 0.014), 28);
}

function playDeathSound() {
  playSweep(180, 55, 0.16, 'square', 0.045);
  setTimeout(() => playTone(92, 0.08, 'triangle', 0.025), 55);
}

function playGameOverSound() {
  playSweep(420, 70, 0.42, 'sawtooth', 0.07);
  setTimeout(() => playTone(52, 0.28, 'square', 0.055), 150);
  setTimeout(() => playChord([65, 82, 98], 0.32, 'triangle', 0.05), 310);
}

function playMultiplierSound() {
  playChord([520, 660, 880], 0.13, 'triangle', 0.055);
  setTimeout(() => playTone(1180, 0.08, 'triangle', 0.025), 80);
}

function playStageClearSound() {
  playChord([392, 494, 659], 0.14, 'triangle', 0.055);
  setTimeout(() => playChord([523, 659, 784], 0.18, 'triangle', 0.06), 120);
}

/* background music loop logic */
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
