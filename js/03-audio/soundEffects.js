'use strict';

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

function playPowerupSound(key) {
  const sounds = {
    freeze: () => playChord([880, 1175, 1760], 0.22, 'sine', 0.05),
    laser: () => playSweep(1400, 260, 0.22, 'sawtooth', 0.055),
    lower: () => playSweep(740, 370, 0.18, 'triangle', 0.045),
    kill: () => playSweep(95, 35, 0.34, 'square', 0.075),
    alpha: () => playChord([440, 554, 659, 880], 0.22, 'triangle', 0.052),
    wind: () => playSweep(260, 760, 0.32, 'sine', 0.045),
    drill: () => {
      playSweep(130, 1040, 0.2, 'sawtooth', 0.05);
      setTimeout(() => playSweep(1040, 210, 0.12, 'square', 0.035), 95);
    },
  };
  (sounds[key] || (() => playChord([520, 780], 0.16, 'triangle', 0.04)))();
}
