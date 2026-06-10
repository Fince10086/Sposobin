// engine/rules/resolution.js - Chord-specific resolution and constraint rules

import { INVALID_COST } from '../../constants/limits.js';

export function checkChordConstraints(newVoices, targetChord, keyInfo) {
  // D⁶ / D₇⁶ / DD₇⁶: 6th must be in soprano
  if (['D⁶', 'D₇⁶', 'DD₇⁶'].includes(targetChord)) {
    const addedSixthStep = targetChord.includes('DD')
      ? (keyInfo.root_step + 6) % 7
      : (keyInfo.root_step + 2) % 7;
    // Need spelling info - this check requires spell_midi, moved to main evaluate
  }

  // D₉ / D₉♭: 9th must be in soprano
  if (['D₉', 'D₉♭'].includes(targetChord)) {
    const rootPc = keyInfo.root_pc;
    const ninthPc = targetChord === 'D₉' ? (rootPc + 2) % 12 : (rootPc + 1) % 12;
    if (newVoices.S % 12 !== ninthPc) return INVALID_COST;
    if (newVoices.S - newVoices.B < 14) return INVALID_COST;
  }

  return 0;
}

export function checkNinthResolution(oldVoices, newVoices, lastChord, targetChord) {
  if (['D₉', 'D₉♭'].includes(lastChord) && ['D₉', 'D₉♭'].includes(targetChord)) {
    if (Math.abs(newVoices.S - oldVoices.S) !== 0) return INVALID_COST;
  }
  return 0;
}

export function checkAugmentedSixthResolution(oldVoices, newVoices, lastChord, newSpells, keyInfo) {
  if (!lastChord.startsWith('It⁺⁶') && !lastChord.startsWith('Ger⁺⁶') && !lastChord.startsWith('Fr⁺⁶')) {
    return 0;
  }

  const b6Step = (keyInfo.root_step + 5) % 7;
  const sharp4Step = (keyInfo.root_step + 3) % 7;
  const domStep = (keyInfo.root_step + 4) % 7;

  for (const v of ['S', 'A', 'T', 'B']) {
    const oldStep = newSpells.last[v][1];
    if (oldStep === b6Step) {
      const newStep = newSpells.current[v][1];
      if (newStep !== domStep || (newVoices[v] - oldVoices[v] !== -1)) return INVALID_COST;
    }
    if (oldStep === sharp4Step) {
      const newStep = newSpells.current[v][1];
      if (newStep !== domStep || (newVoices[v] - oldVoices[v] !== 1)) return INVALID_COST;
    }
  }
  return 0;
}

export function checkN6Resolution(oldVoices, newVoices, lastChord, targetChord, newSpells, keyInfo) {
  if (lastChord !== 'N₆' || !['D', 'D₇', 'D₇不完全', 'D₆', 'K₆₄'].includes(targetChord)) {
    return 0;
  }

  const flat2Step = (keyInfo.root_step + 1) % 7;
  const leadStep = (keyInfo.root_step + 6) % 7;
  const tonicStep = keyInfo.root_step;

  for (const v of ['S', 'A', 'T', 'B']) {
    const oldStep = newSpells.last[v][1];
    if (oldStep === flat2Step) {
      const newStep = newSpells.current[v][1];
      if (![leadStep, tonicStep].includes(newStep)) return INVALID_COST;
      if (newVoices[v] >= oldVoices[v]) return INVALID_COST;
    }
  }
  return 0;
}

export function checkSeventhResolution(oldVoices, newVoices, lastChord, targetChord, newSpells, keyInfo) {
  const seventhChords = ['D₇', 'D₅₆', 'D₃₄', 'D₂', 'Dᵥᵢᵢ₇', 'Dᵥᵢᵢ₅₆', 'Dᵥᵢᵢ₃₄', 'Dᵥᵢᵢ₂', 'D₇不完全', 'D₇⁶'];
  const targetTonics = ['T', 'T不完全', 'T₆', 't', 't不完全', 't₆', 'VI', 'VI₆', 'VI_阻碍'];

  if (!seventhChords.includes(lastChord) || !targetTonics.includes(targetChord)) return 0;

  // Seventh (4th scale degree) must resolve down by step
  for (const v of ['S', 'A', 'T', 'B']) {
    const oldStep = newSpells.last[v][1];
    if (oldStep === (keyInfo.root_step + 3) % 7) {
      const newStep = newSpells.current[v][1];
      if (newStep !== (keyInfo.root_step + 2) % 7) return INVALID_COST;
    }
  }
  return 0;
}

export function checkLeadingToneResolution(oldVoices, newVoices, lastChord, targetChord, newSpells, keyInfo) {
  const dominantChords = ['D', 'D₆', 'D₇', 'D₅₆', 'D₃₄', 'D₂', 'Dᵥᵢᵢ₆', 'Dᵥᵢᵢ₇', 'D₇不完全', 'D₇⁶'];
  const targetTonics = ['T', 'T不完全', 'T₆', 't', 't不完全', 't₆', 'VI', 'VI₆', 'VI_阻碍'];

  if (!dominantChords.includes(lastChord) || !targetTonics.includes(targetChord)) return 0;

  for (const v of ['S', 'B']) {
    const oldStep = newSpells.last[v][1];
    if (oldStep === (keyInfo.root_step + 6) % 7) {
      const newStep = newSpells.current[v][1];
      // Exception: D₆ → VI, S can go to 5th scale degree
      if (lastChord === 'D₆' && targetChord === 'VI' && v === 'S' && newStep === (keyInfo.root_step + 5) % 7) {
        continue;
      }
      if (newStep !== keyInfo.root_step) return INVALID_COST;
    }
  }
  return 0;
}

export function checkCadential64Resolution(oldVoices, newVoices, lastChord, targetChord, newSpells, keyInfo) {
  if (lastChord !== 'K₆₄' || !['D', 'D₆', 'D₇', 'D₅₆', 'D₃₄', 'D₂', 'D₉', 'D₉♭'].includes(targetChord)) {
    return 0;
  }

  for (const v of ['S', 'A', 'T']) {
    const oldStep = newSpells.last[v][1];
    if (oldStep === keyInfo.root_step) {
      const newStep = newSpells.current[v][1];
      if (newStep !== (keyInfo.root_step + 6) % 7) return INVALID_COST;
    }
    if (oldStep === (keyInfo.root_step + 2) % 7) {
      const newStep = newSpells.current[v][1];
      if (![(keyInfo.root_step + 1) % 7, (keyInfo.root_step + 3) % 7].includes(newStep)) return INVALID_COST;
    }
  }
  return 0;
}

export function checkTtoDDFlat5(oldVoices, newVoices, lastChord, targetChord, keyInfo) {
  if (!lastChord.startsWith('T') || !targetChord.startsWith('DD') || !targetChord.includes('♭⁵')) {
    return 0;
  }

  const rootPc = keyInfo.root_pc;
  const tThird = (rootPc + (keyInfo.type === 'MINOR' ? 3 : 4)) % 12;
  const ddThird = (rootPc + 6) % 12;

  for (const v of ['S', 'A', 'T', 'B']) {
    if (oldVoices[v] % 12 === tThird && newVoices[v] % 12 === ddThird) {
      return INVALID_COST;
    }
  }
  return 0;
}

export function checkFalseRelations(newSpells) {
  let penalty = 0;

  for (let step = 0; step < 7; step++) {
    const oldAlts = {};
    const newAlts = {};

    for (const v of ['S', 'A', 'T', 'B']) {
      if (newSpells.last[v][1] === step) oldAlts[v] = newSpells.last[v][2];
      if (newSpells.current[v][1] === step) newAlts[v] = newSpells.current[v][2];
    }

    for (const [v1, alt1] of Object.entries(oldAlts)) {
      for (const [v2, alt2] of Object.entries(newAlts)) {
        if (alt1 !== alt2 && v1 !== v2) {
          if (!(v2 in oldAlts) || oldAlts[v2] !== alt1) {
            penalty += INVALID_COST;
          }
        }
      }
    }
  }

  return penalty;
}

export function checkD7_6Rules(oldVoices, newVoices, lastChord, targetChord, newSpells, keyInfo) {
  if (!['D₇⁶', 'DD₇⁶'].includes(lastChord)) return 0;

  const isDD = lastChord === 'DD₇⁶';
  const targetTonics = isDD
    ? ['D', 'D₇', 'D₇不完全', 'D₆', 'K₆₄']
    : ['T', 'T不完全', 'T₆', 't', 't不完全', 't₆'];

  if (targetTonics.includes(targetChord)) {
    const oldSStep = newSpells.last.S[1];
    const newSStep = newSpells.current.S[1];
    const targetRootStep = (keyInfo.root_step + (isDD ? 4 : 0)) % 7;
    if (newSStep !== targetRootStep || (![3, 4].includes(oldVoices.S - newVoices.S))) {
      return INVALID_COST;
    }
  }

  if (!isDD && ['VI', 'VI₆', 'VI_阻碍'].includes(targetChord)) {
    if (oldVoices.S !== newVoices.S) return INVALID_COST;
  }

  const sameFamilyTargets = !isDD ? ['D₇', 'D₇不完全'] : ['DD₇', 'DD₇不完全'];
  if (sameFamilyTargets.includes(targetChord)) {
    if (oldVoices.B !== newVoices.B || oldVoices.T !== newVoices.T || oldVoices.A !== newVoices.A) {
      return INVALID_COST;
    }
    const sDiff = oldVoices.S - newVoices.S;
    if (![1, 2].includes(sDiff) || sDiff > 2) return INVALID_COST;
  }

  return 0;
}

export function checkD6Constraint(newVoices, targetChord, newSpells, keyInfo) {
  if (!['D⁶', 'D₇⁶', 'DD₇⁶'].includes(targetChord)) return 0;

  const addedSixthStep = targetChord.includes('DD')
    ? (keyInfo.root_step + 6) % 7
    : (keyInfo.root_step + 2) % 7;

  if (newSpells.current.S[1] !== addedSixthStep) return INVALID_COST;
  return 0;
}
