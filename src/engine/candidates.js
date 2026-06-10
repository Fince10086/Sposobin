// candidates.js - Chord candidate generation

import { AVAILABLE_NOTES } from './data.js';

function* combinationsWithReplacement(iterable, r) {
  const pool = Array.from(iterable);
  const n = pool.length;
  if (r > n) return;
  const indices = new Array(r).fill(0);
  yield indices.map(i => pool[i]);
  while (true) {
    let i = r - 1;
    while (i >= 0 && indices[i] === n - 1) i--;
    if (i < 0) return;
    indices[i]++;
    for (let j = i + 1; j < r; j++) indices[j] = indices[i];
    yield indices.map(k => pool[k]);
  }
}

export function get_chord_candidates(chord_name, dna_db, target_s = null) {
  const dna = dna_db[chord_name];
  if (!dna) return [];
  const bass_candidates = dna.bass_options;
  const required_classes = dna.required;
  const max_counts = dna.max_counts || {};

  const candidates = [];
  for (const new_bass of bass_candidates) {
    if (target_s !== null) {
      const new_S = target_s;
      const lower_bound_A = new_S - 12;
      const valid_A = AVAILABLE_NOTES.filter(a => lower_bound_A <= a && a <= new_S);
      for (const new_A of valid_A) {
        const lower_bound_T = new_A - 12;
        const valid_T = AVAILABLE_NOTES.filter(t => lower_bound_T <= t && t <= new_A && t > new_bass);
        for (const new_T of valid_T) {
          const all_pcs = [new_S % 12, new_A % 12, new_T % 12, new_bass % 12];
          if (!setsEqual(new Set(all_pcs), required_classes)) continue;
          let fail_max_counts = false;
          for (const [pc, max_allowed] of Object.entries(max_counts)) {
            if (all_pcs.filter(p => p === parseInt(pc)).length > max_allowed) {
              fail_max_counts = true;
              break;
            }
          }
          if (!fail_max_counts) {
            candidates.push({S: new_S, A: new_A, T: new_T, B: new_bass});
          }
        }
      }
    } else {
      for (const combo of combinationsWithReplacement(AVAILABLE_NOTES, 3)) {
        const [new_S, new_A, new_T] = [...combo].sort((a, b) => b - a);
        if (new_S < new_A || new_A < new_T || new_T <= new_bass) continue;
        if ((new_S - new_A) > 12 || (new_A - new_T) > 12) continue;
        const all_pcs = [new_S % 12, new_A % 12, new_T % 12, new_bass % 12];
        if (!setsEqual(new Set(all_pcs), required_classes)) continue;
        let fail_max_counts = false;
        for (const [pc, max_allowed] of Object.entries(max_counts)) {
          if (all_pcs.filter(p => p === parseInt(pc)).length > max_allowed) {
            fail_max_counts = true;
            break;
          }
        }
        if (fail_max_counts) continue;
        candidates.push({S: new_S, A: new_A, T: new_T, B: new_bass});
      }
    }
  }
  return candidates;
}

function setsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}
