// composables/useAudio.js - Unified audio engine

import { ref } from 'vue';
import * as Tone from 'tone';

let mainLimiter = null;
let globalSynth = null;

const isInitialized = ref(false);

const SYNTH_CONFIG = {
  oscillator: { type: 'custom', partials: [1, 0.5] },
  envelope: { attack: 0.05, decay: 0.2, sustain: 0.8, release: 1.5 },
  volume: -14
};

function ensureEngine() {
  if (!mainLimiter) {
    mainLimiter = new Tone.Limiter(-1).toDestination();
  }
  if (!globalSynth) {
    globalSynth = new Tone.PolySynth(Tone.Synth, SYNTH_CONFIG).connect(mainLimiter);
  }
  isInitialized.value = true;
}

export function useAudio() {
  async function playSingleChord(voices) {
    await Tone.start();
    ensureEngine();
    const freqs = Object.values(voices).map(midi => Tone.Frequency(midi, 'midi').toFrequency());
    globalSynth.triggerAttackRelease(freqs, '2n');
  }

  async function playSequence(history, onStep = null) {
    if (history.length === 0) return;
    await Tone.start();
    ensureEngine();

    const seqSynth = new Tone.PolySynth(Tone.Synth, SYNTH_CONFIG).connect(mainLimiter);
    const now = Tone.now();
    const duration = 1.0;

    history.forEach((item, index) => {
      const freqs = Object.values(item.voices).map(midi => Tone.Frequency(midi, 'midi').toFrequency());
      seqSynth.triggerAttackRelease(freqs, duration, now + index * duration);
      if (onStep) {
        setTimeout(() => onStep(index), index * duration * 1000);
      }
    });

    const cleanupDelay = (history.length * duration + 2) * 1000;
    setTimeout(() => {
      seqSynth.dispose();
      if (onStep) setTimeout(() => onStep(null), duration * 1000);
    }, cleanupDelay);
  }

  return {
    isInitialized,
    playSingleChord,
    playSequence
  };
}
