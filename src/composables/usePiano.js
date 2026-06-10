// composables/usePiano.js - Piano keyboard data generation

import { ref } from 'vue';

const MIDI_START = 57;
const MIDI_END = 84;
const WHITE_KEY_WIDTH = 26;
const BLACK_KEY_WIDTH = 16;
const WHITE_KEY_INDICES = [0, 2, 4, 5, 7, 9, 11];

export function usePiano() {
  const keys = ref([]);

  let whiteIndex = 0;
  for (let midi = MIDI_START; midi <= MIDI_END; midi++) {
    const isBlack = !WHITE_KEY_INDICES.includes(midi % 12);
    if (isBlack) {
      keys.value.push({
        midi,
        isBlack: true,
        x: whiteIndex * WHITE_KEY_WIDTH - 8,
        label: ''
      });
    } else {
      const octave = Math.floor(midi / 12) - 1;
      const isC = midi % 12 === 0;
      keys.value.push({
        midi,
        isBlack: false,
        x: whiteIndex * WHITE_KEY_WIDTH,
        label: isC ? `C${octave}` : ''
      });
      whiteIndex++;
    }
  }

  function midiToNoteName(midi) {
    const names = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
    const octave = Math.floor(midi / 12) - 1;
    return `${names[midi % 12]}${octave}`;
  }

  function parseMelodyStr(text) {
    const noteNames = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    const tokens = text.match(/([A-Ga-g])(bb|b|♭|##|x|#|♯)?\s*(\d)/g);
    if (!tokens) return [];

    return tokens.map(token => {
      const match = token.match(/([A-Ga-g])(bb|b|♭|##|x|#|♯)?\s*(\d)/);
      const base = noteNames[match[1].toUpperCase()];
      let alt = 0;
      if (match[2]) {
        if (['#', '♯'].includes(match[2])) alt = 1;
        else if (['##', 'x'].includes(match[2])) alt = 2;
        else if (['b', '♭'].includes(match[2])) alt = -1;
        else if (match[2] === 'bb') alt = -2;
      }
      return (parseInt(match[3], 10) + 1) * 12 + base + alt;
    });
  }

  return {
    keys,
    midiToNoteName,
    parseMelodyStr
  };
}
