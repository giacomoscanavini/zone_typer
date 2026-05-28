'use strict';

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
