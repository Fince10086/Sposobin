// engine/rules/intervals.js - Interval validity and jump checks

import { INVALID_COST, BASS_LEAP_LIMITS, RARE_SEVENTH_PENALTY } from '../../constants/limits.js';

export function checkBassLeap(oldVoices, newVoices) {
  const bassDiff = newVoices.B - oldVoices.B;
  const bassLeap = Math.abs(bassDiff);
  const isDim5Down = (bassDiff === -6);

  if (bassLeap > BASS_LEAP_LIMITS.absoluteMax) return INVALID_COST;
  if (BASS_LEAP_LIMITS.forbidden.includes(bassLeap)) return INVALID_COST;
  if (bassLeap === 6 && !isDim5Down) return INVALID_COST;

  if (bassLeap === 6 && isDim5Down) return BASS_LEAP_LIMITS.diminishedPenalty;
  if (BASS_LEAP_LIMITS.majorPenalty.includes(bassLeap)) return BASS_LEAP_LIMITS.majorLeapPenalty;
  return bassLeap * BASS_LEAP_LIMITS.minorPenaltyPerSemitone;
}

export function checkIntervalValidity(oldVoices, newVoices, lastChord, targetChord, newSpells) {
  const amnestyS = checkMelodyAmnesty(lastChord, targetChord, oldVoices, newVoices);

  for (const v of ['S', 'A', 'T', 'B']) {
    const leap = Math.abs(newVoices[v] - oldVoices[v]);
    if (leap === 0) continue;

    const oldStep = newSpells.last[v][1];
    const newStep = newSpells.current[v][1];

    const stepDiff = Math.abs(newStep - oldStep);
    const normStep = Math.min(stepDiff, 7 - stepDiff);
    const normIc = Math.min(leap % 12, 12 - (leap % 12));

    let isUnclassical = false;
    if (normStep === 1 && ![1, 2].includes(normIc)) isUnclassical = true;
    else if (normStep === 2 && ![3, 4].includes(normIc)) isUnclassical = true;
    else if (normStep === 3 && normIc !== 5) isUnclassical = true;
    else if (normStep === 0 && ![0, 1].includes(normIc)) isUnclassical = true;

    // N6 → D exception
    if (lastChord === 'N₆' && targetChord.startsWith('D')) {
      if (normStep === 2 && normIc === 2) isUnclassical = false;
    }

    if (isUnclassical) {
      if (v === 'B' && leap === 6 && newVoices[v] < oldVoices[v]) {
        // Allow diminished fifth in bass
      } else if (v === 'S' && amnestyS) {
        // Allow for soprano in certain resolutions
      } else {
        return INVALID_COST;
      }
    }

    if ((leap >= 9 && leap <= 11) || leap > 12) {
      if (v !== 'S') return INVALID_COST;
    }
  }

  return 0;
}

function checkMelodyAmnesty(lastChord, targetChord, oldVoices, newVoices) {
  const leapS = Math.abs(newVoices.S - oldVoices.S);

  // V7 → T resolution amnesty
  const v7Resolutions = ['D₃₄', 'D₅₆', 'D₇', 'D⁶', 'DD₃₄♭⁵', 'DD₂♭⁵', 'DD₅₆♭⁵', 'DD₇♭⁵', 'D₇不完全'];
  const tonicTargets = ['T', 'T不完全', 'D', 'D₇', 'K₆₄', 't', 't不完全'];
  if (v7Resolutions.includes(lastChord) && tonicTargets.includes(targetChord)) {
    if ([5, 7, 0].includes(leapS)) return true;
  }

  // D7⁶ → T resolution amnesty
  if (['D₇⁶', 'DD₇⁶'].includes(lastChord) &&
      ['T', 'T不完全', 't', 't不完全', 'D', 'D₇', 'D₇不完全'].includes(targetChord)) {
    if ([3, 4].includes(leapS) && newVoices.S < oldVoices.S) return true;
  }

  return false;
}

export function checkRareSevenths(lastChord, targetChord, oldVoices, newVoices) {
  const rareSevenths = ['T₇', 't₇', 'VI₇', 'DTᵢᵢᵢ₇', 'S₇', 's₇'];
  let penalty = 0;

  if (rareSevenths.includes(targetChord)) {
    penalty += RARE_SEVENTH_PENALTY;
    const leapS = Math.abs(newVoices.S - oldVoices.S);
    const leapA = Math.abs(newVoices.A - oldVoices.A);
    const leapT = Math.abs(newVoices.T - oldVoices.T);
    if (leapS > 2 || leapA > 2 || leapT > 2) return INVALID_COST;
  }

  if (rareSevenths.includes(lastChord)) {
    let hasStepDown = false;
    for (const v of ['S', 'A', 'T', 'B']) {
      const diff = oldVoices[v] - newVoices[v];
      if (diff === 1 || diff === 2) {
        hasStepDown = true;
        break;
      }
    }
    if (!hasStepDown) return INVALID_COST;
  }

  return penalty;
}

export function calculateMelodyPenalty(oldVoices, newVoices, isSameChord, amnestyS) {
  if (amnestyS) return 20;

  const leapS = Math.abs(newVoices.S - oldVoices.S);

  if (leapS === 0) return isSameChord ? 2.0 : 0.0;
  if ([1, 2].includes(leapS)) return 0.0;
  if ([3, 4, 5].includes(leapS)) return isSameChord ? 1.0 : leapS * 1.5;
  return leapS * 2.0;
}

export function calculateInnerPenalty(oldVoices, newVoices) {
  let penalty = 0;
  for (const v of ['A', 'T']) {
    const leap = Math.abs(newVoices[v] - oldVoices[v]);
    if (leap === 0) continue;
    if ([1, 2].includes(leap)) penalty += leap * 0.5;
    else if ([3, 4].includes(leap)) penalty += leap * 1.2;
    else penalty += leap * 2.0;
  }
  return penalty;
}
