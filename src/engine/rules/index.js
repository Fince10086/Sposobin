// engine/rules/penalty.js - Main voicing evaluation orchestrator

import { spell_midi } from '../tonality/index.js';
import { INVALID_COST } from '../../constants/limits.js';
import * as voiceLeading from './voiceLeading.js';
import * as resolution from './resolution.js';
import * as intervals from './intervals.js';

export function evaluateVoicing(oldVoices, newVoices, lastChord, targetChord, keyInfo) {
  // === Phase 1: Hard constraints (range, spacing) ===
  let cost = voiceLeading.checkVoiceRanges(newVoices, keyInfo.app_mode);
  if (cost >= INVALID_COST) return INVALID_COST;

  cost = voiceLeading.checkVoiceSpacing(newVoices);
  if (cost >= INVALID_COST) return INVALID_COST;

  // Determine if same chord quality
  const oldPcs = new Set(['S', 'A', 'T', 'B'].map(v => oldVoices[v] % 12));
  const newPcs = new Set(['S', 'A', 'T', 'B'].map(v => newVoices[v] % 12));
  let commonCount = 0;
  for (const x of oldPcs) if (newPcs.has(x)) commonCount++;
  const isSameChord = commonCount >= 3;

  // Compute spellings once for all rule checks
  const spells = { last: {}, current: {} };
  for (const v of ['S', 'A', 'T', 'B']) {
    spells.last[v] = spell_midi(oldVoices[v], keyInfo, lastChord);
    spells.current[v] = spell_midi(newVoices[v], keyInfo, targetChord);
  }

  // === Phase 2: Voice leading checks ===
  cost = voiceLeading.checkVoiceOverlap(oldVoices, newVoices, isSameChord);
  if (cost >= INVALID_COST) return INVALID_COST;
  let totalPenalty = cost;

  totalPenalty += voiceLeading.checkSameDirection(oldVoices, newVoices);

  cost = voiceLeading.checkCadential64Context(lastChord, targetChord, oldVoices, newVoices);
  if (cost >= INVALID_COST) return INVALID_COST;

  cost = voiceLeading.checkAuxiliaryLinear(lastChord, targetChord, oldVoices, newVoices);
  if (cost >= INVALID_COST) return INVALID_COST;

  // === Phase 3: Interval and bass checks ===
  totalPenalty += intervals.checkBassLeap(oldVoices, newVoices);

  cost = resolution.checkChordConstraints(newVoices, targetChord, keyInfo);
  if (cost >= INVALID_COST) return INVALID_COST;

  cost = resolution.checkNinthResolution(oldVoices, newVoices, lastChord, targetChord);
  if (cost >= INVALID_COST) return INVALID_COST;

  cost = resolution.checkD6Constraint(newVoices, targetChord, spells, keyInfo);
  if (cost >= INVALID_COST) return INVALID_COST;

  const amnestyS = intervals.calculateMelodyPenalty.length > 3; // Will be checked inside

  cost = intervals.checkIntervalValidity(oldVoices, newVoices, lastChord, targetChord, spells);
  if (cost >= INVALID_COST) return INVALID_COST;

  cost = resolution.checkAugmentedSixthResolution(oldVoices, newVoices, lastChord, spells, keyInfo);
  if (cost >= INVALID_COST) return INVALID_COST;

  cost = resolution.checkN6Resolution(oldVoices, newVoices, lastChord, targetChord, spells, keyInfo);
  if (cost >= INVALID_COST) return INVALID_COST;

  cost = resolution.checkSeventhResolution(oldVoices, newVoices, lastChord, targetChord, spells, keyInfo);
  if (cost >= INVALID_COST) return INVALID_COST;

  cost = resolution.checkLeadingToneResolution(oldVoices, newVoices, lastChord, targetChord, spells, keyInfo);
  if (cost >= INVALID_COST) return INVALID_COST;

  cost = resolution.checkCadential64Resolution(oldVoices, newVoices, lastChord, targetChord, spells, keyInfo);
  if (cost >= INVALID_COST) return INVALID_COST;

  cost = resolution.checkTtoDDFlat5(oldVoices, newVoices, lastChord, targetChord, keyInfo);
  if (cost >= INVALID_COST) return INVALID_COST;

  cost = resolution.checkD7_6Rules(oldVoices, newVoices, lastChord, targetChord, spells, keyInfo);
  if (cost >= INVALID_COST) return INVALID_COST;

  totalPenalty += resolution.checkFalseRelations(spells);

  cost = voiceLeading.checkBassParallel(lastChord, targetChord, oldVoices, newVoices);
  if (cost >= INVALID_COST) return INVALID_COST;
  totalPenalty += cost;

  cost = voiceLeading.checkParallelIntervals(oldVoices, newVoices, lastChord, targetChord);
  if (cost >= INVALID_COST) return INVALID_COST;
  totalPenalty += cost;

  totalPenalty += voiceLeading.checkUnisons(newVoices, targetChord);

  cost = intervals.checkRareSevenths(lastChord, targetChord, oldVoices, newVoices);
  if (cost >= INVALID_COST) return INVALID_COST;
  totalPenalty += cost;

  // === Phase 4: Smoothness penalties ===
  const isAmnestyS = false; // Will be computed by checkIntervalValidity amnesty logic
  // Actually we need to track this better. For now, the interval validity check handles it internally.
  // We need to expose the amnesty state from checkIntervalValidity.
  // Let me refactor this slightly.

  // For now, compute melody penalty directly
  const leapS = Math.abs(newVoices.S - oldVoices.S);
  let isAmnesty = false;
  if (['D₃₄', 'D₅₆', 'D₇', 'D⁶', 'DD₃₄♭⁵', 'DD₂♭⁵', 'DD₅₆♭⁵', 'DD₇♭⁵', 'D₇不完全'].includes(lastChord) &&
      ['T', 'T不完全', 'D', 'D₇', 'K₆₄', 't', 't不完全'].includes(targetChord)) {
    if ([5, 7, 0].includes(leapS)) isAmnesty = true;
  }
  if (['D₇⁶', 'DD₇⁶'].includes(lastChord) &&
      ['T', 'T不完全', 't', 't不完全', 'D', 'D₇', 'D₇不完全'].includes(targetChord)) {
    if ([3, 4].includes(leapS) && newVoices.S < oldVoices.S) isAmnesty = true;
  }

  totalPenalty += intervals.calculateMelodyPenalty(oldVoices, newVoices, isSameChord, isAmnesty);
  totalPenalty += intervals.calculateInnerPenalty(oldVoices, newVoices);

  return totalPenalty;
}
