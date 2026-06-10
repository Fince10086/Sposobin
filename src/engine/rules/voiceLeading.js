// engine/rules/voiceLeading.js - Voice leading rule checks

import { INVALID_COST, VOICE_RANGES, SPACING_LIMITS, PARALLEL_PENALTIES, VOICE_OVERLAP_PENALTY, VOICE_OVERLAP_MAX, ALL_SAME_DIRECTION_PENALTY, UNISON_PENALTIES } from '../../constants/limits.js';

export function checkVoiceRanges(voices, appMode) {
  if (appMode === 'COMPOSE') return 0;
  for (const [v, range] of Object.entries(VOICE_RANGES)) {
    if (voices[v] < range.min || voices[v] > range.max) return INVALID_COST;
  }
  return 0;
}

export function checkVoiceSpacing(voices) {
  const { S, A, T, B } = voices;
  if (!(S >= A && A >= T && T > B)) return INVALID_COST;
  if ((S - A) > SPACING_LIMITS.maxOctaveBetweenSA) return INVALID_COST;
  if ((A - T) > SPACING_LIMITS.maxOctaveBetweenAT) return INVALID_COST;
  return 0;
}

export function checkVoiceOverlap(oldVoices, newVoices, isSameChord) {
  if (isSameChord) return 0;
  let penalty = 0;
  const { S: nS, A: nA, T: nT, B: nB } = newVoices;
  const { S: oS, A: oA, T: oT, B: oB } = oldVoices;

  if (nS < oA) penalty += VOICE_OVERLAP_PENALTY;
  if (nA > oS || nA < oT) penalty += VOICE_OVERLAP_PENALTY;
  if (nT > oA || nT < oB) penalty += VOICE_OVERLAP_PENALTY;
  if (nB > oT) penalty += VOICE_OVERLAP_PENALTY;

  return penalty >= VOICE_OVERLAP_MAX ? INVALID_COST : penalty;
}

export function checkSameDirection(oldVoices, newVoices) {
  const diffs = ['S', 'A', 'T', 'B'].map(v => {
    const d = newVoices[v] - oldVoices[v];
    return d > 0 ? 1 : (d < 0 ? -1 : 0);
  });

  if (diffs.filter(d => d === 0).length === 0) {
    if (diffs.every(d => d === 1) || diffs.every(d => d === -1)) {
      return ALL_SAME_DIRECTION_PENALTY;
    }
  }
  return 0;
}

export function checkCadential64Context(lastChord, targetChord, oldVoices, newVoices) {
  const is64 = [lastChord, targetChord].some(c => ['S₆₄', 's₆₄', 'D₆₄', 'T₆₄', 't₆₄'].includes(c));
  if (!is64) return 0;

  const bassLeap = Math.abs(newVoices.B - oldVoices.B);
  if (![0, 1, 2].includes(bassLeap)) return INVALID_COST;

  for (const v of ['S', 'A', 'T']) {
    if (Math.abs(newVoices[v] - oldVoices[v]) > 2) return INVALID_COST;
  }
  return 0;
}

export function checkAuxiliaryLinear(lastChord, targetChord, oldVoices, newVoices) {
  const isAux =
    (['S', 's', 'S₆', 's₆', 'Sᵢᵢ₆', 'sᵢᵢ₆'].includes(lastChord) && ['T₆', 't₆'].includes(targetChord)) ||
    (['T₆', 't₆'].includes(lastChord) && ['S', 's', 'S₆', 's₆', 'Sᵢᵢ₆', 'sᵢᵢ₆'].includes(targetChord));

  if (!isAux) return 0;

  for (const v of ['S', 'A', 'T']) {
    if (Math.abs(newVoices[v] - oldVoices[v]) > 2) return INVALID_COST;
  }
  return 0;
}

export function checkParallelIntervals(oldVoices, newVoices, lastChord, targetChord) {
  let penalty = 0;
  const voiceNames = ['S', 'A', 'T', 'B'];

  for (let i = 0; i < voiceNames.length; i++) {
    for (let j = i + 1; j < voiceNames.length; j++) {
      const v1 = voiceNames[i];
      const v2 = voiceNames[j];
      const o1 = oldVoices[v1], o2 = oldVoices[v2];
      const n1 = newVoices[v1], n2 = newVoices[v2];

      if (o1 === n1 && o2 === n2) continue;

      const d1 = n1 - o1;
      const d2 = n2 - o2;
      const sameDir = (d1 * d2) > 0;
      const contraDir = (d1 * d2) < 0;

      const oldInt = Math.abs(o1 - o2) % 12;
      const newInt = Math.abs(n1 - n2) % 12;

      // Parallel octaves/unisons
      if (oldInt === 0 && newInt === 0) {
        if (sameDir || contraDir) penalty += PARALLEL_PENALTIES.octaveUnison;
      }

      // Parallel fifths
      if (oldInt === 7 && newInt === 7) {
        if (sameDir) {
          if (lastChord.includes('Ger') && ['D', 'D₆', 'D₇', 'D₇不完全'].includes(targetChord)) {
            // Allow German sixth exception
          } else {
            penalty += PARALLEL_PENALTIES.fifth;
          }
        } else if (contraDir) {
          penalty += PARALLEL_PENALTIES.fifth;
        }
      }

      // Hidden fifths (parallel motion to a fifth)
      if (sameDir && oldInt === 6 && newInt === 7) {
        penalty += PARALLEL_PENALTIES.hiddenFifth;
      }

      // S-B hidden octaves/fifths with large leaps
      if (v1 === 'S' && v2 === 'B') {
        if ((newInt === 0 || newInt === 7) && sameDir && Math.abs(n1 - o1) >= 3) {
          penalty += PARALLEL_PENALTIES.octaveUnison;
        }
      }
    }
  }

  return penalty >= PARALLEL_PENALTIES.maxAllowed ? INVALID_COST : penalty;
}

export function checkBassParallel(lastChord, targetChord, oldVoices, newVoices) {
  const bassLeap = Math.abs(newVoices.B - oldVoices.B);
  if (![1, 2].includes(bassLeap)) return 0;

  const bassDiff = newVoices.B - oldVoices.B;
  let penalty = 0;

  for (const v of ['S', 'A', 'T']) {
    const vDiff = newVoices[v] - oldVoices[v];
    if (vDiff !== 0 && (vDiff * bassDiff) > 0) {
      const newInterval = Math.abs(newVoices[v] - newVoices.B) % 12;
      if ([0, 5, 7].includes(newInterval)) {
        return INVALID_COST;
      } else {
        penalty += 500;
      }
    }
  }
  return penalty;
}

export function checkUnisons(voices, targetChord) {
  const { S, A, T, B } = voices;
  let penalty = 0;
  if (S === A) penalty += UNISON_PENALTIES.SA;
  if (A === T) penalty += UNISON_PENALTIES.AT;
  if (T === B) penalty += UNISON_PENALTIES.TB;

  if (penalty > 0 &&
      (targetChord.includes('ᵥᵢᵢ') || targetChord.includes('⁺⁶') || targetChord.includes('DD'))) {
    penalty *= 4;
  }
  return penalty;
}
