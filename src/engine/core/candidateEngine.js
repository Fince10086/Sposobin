// engine/core/candidateEngine.js - Direct construction chord candidate generation
// Replaces the O(C(n,3)) combination approach with targeted range iteration

import { AVAILABLE_NOTES } from '../data/index.js';

const NOTE_SET = new Set(AVAILABLE_NOTES);

/**
 * Check if two multisets (represented as arrays) match the required pitch classes
 * with max_count constraints.
 */
function matchesRequired(pcs, requiredSet, maxCounts) {
  const counts = {};
  for (const pc of pcs) {
    counts[pc] = (counts[pc] || 0) + 1;
    if (counts[pc] > (maxCounts[pc] || 4)) return false;
  }
  const actualSet = new Set(pcs);
  if (actualSet.size !== requiredSet.size) return false;
  for (const pc of actualSet) {
    if (!requiredSet.has(pc)) return false;
  }
  return true;
}

/**
 * Generate valid voicings for a chord.
 * @param {string} chordName - Chord identifier
 * @param {Object} dnaDb - DNA database
 * @param {number|null} targetS - Fixed soprano pitch (null for free mode)
 * @returns {Array} Array of {S, A, T, B} voicing objects
 */
export function getChordCandidates(chordName, dnaDb, targetS = null) {
  const dna = dnaDb[chordName];
  if (!dna) return [];

  const candidates = [];
  const requiredSet = dna.required;
  const maxCounts = dna.max_counts || {};

  for (const bass of dna.bass_options) {
    if (!NOTE_SET.has(bass)) continue;
    const bassPc = bass % 12;
    if (!requiredSet.has(bassPc)) continue;

    if (targetS !== null) {
      // Fixed soprano: directly search A and T in valid ranges
      const sPc = targetS % 12;
      if (!requiredSet.has(sPc)) continue;
      if (targetS <= bass) continue;

      const minA = Math.max(bass + 1, targetS - 12);
      for (let a = targetS; a >= minA; a--) {
        if (!NOTE_SET.has(a)) continue;
        const aPc = a % 12;
        const minT = bass + 1;
        const maxT = Math.min(a, a - 1); // T <= A, but we need A - T <= 12 which is always true if a >= minA
        // Actually A-T can be at most 12, and since a >= targetS - 12 and t >= bass + 1,
        // the max leap is when a is at max and t is at min. We should just check.
        for (let t = minT; t <= a; t++) {
          if (!NOTE_SET.has(t)) continue;
          if (a - t > 12) continue;

          const pcs = [sPc, aPc, t % 12, bassPc];
          if (matchesRequired(pcs, requiredSet, maxCounts)) {
            candidates.push({ S: targetS, A: a, T: t, B: bass });
          }
        }
      }
    } else {
      // Free mode: search all valid S, A, T combinations
      // S must be in available notes, > bass, and within range
      const minS = bass + 1;
      const maxS = Math.min(84, 95); // Upper reasonable bound

      for (let s = minS; s <= maxS; s++) {
        if (!NOTE_SET.has(s)) continue;
        const sPc = s % 12;
        if (!requiredSet.has(sPc)) continue;

        const minA = Math.max(bass + 1, s - 12);
        for (let a = s; a >= minA; a--) {
          if (!NOTE_SET.has(a)) continue;
          const aPc = a % 12;

          const minT = bass + 1;
          const maxT = Math.min(a, a); // T <= A
          for (let t = minT; t <= maxT; t++) {
            if (!NOTE_SET.has(t)) continue;
            if (a - t > 12) continue;

            const pcs = [sPc, aPc, t % 12, bassPc];
            if (matchesRequired(pcs, requiredSet, maxCounts)) {
              candidates.push({ S: s, A: a, T: t, B: bass });
            }
          }
        }
      }
    }
  }

  return candidates;
}
