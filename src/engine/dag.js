// dag.js - DAG construction and Viterbi pathfinding

import { get_chord_candidates } from './candidates.js';
import { evaluate_voicing } from './rules.js';
import { v_to_tuple, tuple_to_v, get_chord_siblings } from './utils.js';

export function build_full_dag(target_melody, dna_db, key_info) {
  const layers = [];
  const start_candidates = ["T", "T₆", "D", "D₆", "S", "S₆", "D₇", "t", "t₆", "s", "s₆"];

  let current_layer = {};
  for (const c of start_candidates) {
    if (!(c in dna_db)) continue;
    for (const v of get_chord_candidates(c, dna_db, target_melody[0])) {
      current_layer[`${c}|${JSON.stringify(v_to_tuple(v))}`] = {next: new Set(), prev: new Set(), chord: c, tuple: v_to_tuple(v)};
    }
  }
  if (Object.keys(current_layer).length === 0) {
    for (const c of Object.keys(dna_db)) {
      for (const v of get_chord_candidates(c, dna_db, target_melody[0])) {
        current_layer[`${c}|${JSON.stringify(v_to_tuple(v))}`] = {next: new Set(), prev: new Set(), chord: c, tuple: v_to_tuple(v)};
      }
    }
  }
  layers.push(current_layer);

  for (let i = 1; i < target_melody.length; i++) {
    const next_layer = {};
    const tgt_s = target_melody[i];

    const all_possible_next_chords = new Set();
    for (const state_key of Object.keys(layers[layers.length - 1])) {
      const c_name = layers[layers.length - 1][state_key].chord;
      for (const nxt of dna_db[c_name]?.next || []) {
        all_possible_next_chords.add(nxt);
        for (const sib of get_chord_siblings(nxt, dna_db)) all_possible_next_chords.add(sib);
      }
      for (const sib of get_chord_siblings(c_name, dna_db)) all_possible_next_chords.add(sib);
    }

    const cand_cache = {};
    for (const nxt_c of all_possible_next_chords) {
      if (nxt_c in dna_db) {
        cand_cache[nxt_c] = get_chord_candidates(nxt_c, dna_db, tgt_s);
      }
    }

    for (const [state_key, node_data] of Object.entries(layers[layers.length - 1])) {
      const c_name = node_data.chord;
      const v_tup = node_data.tuple;
      const possible_nexts = new Set();
      for (const nxt of dna_db[c_name]?.next || []) {
        possible_nexts.add(nxt);
        for (const sib of get_chord_siblings(nxt, dna_db)) possible_nexts.add(sib);
      }
      for (const sib of get_chord_siblings(c_name, dna_db)) possible_nexts.add(sib);

      for (const nxt_c of possible_nexts) {
        if (!(nxt_c in dna_db)) continue;
        for (const nxt_v of cand_cache[nxt_c] || []) {
          if (evaluate_voicing(tuple_to_v(v_tup), nxt_v, c_name, nxt_c, key_info) < 999999) {
            const nxt_key = `${nxt_c}|${JSON.stringify(v_to_tuple(nxt_v))}`;
            if (!(nxt_key in next_layer)) {
              next_layer[nxt_key] = {next: new Set(), prev: new Set(), chord: nxt_c, tuple: v_to_tuple(nxt_v)};
            }
            next_layer[nxt_key].prev.add(state_key);
            node_data.next.add(nxt_key);
          }
        }
      }
    }

    layers.push(next_layer);
    if (Object.keys(next_layer).length === 0) {
      const prev_layer = layers[layers.length - 2];
      const fallback_cands = {};
      for (const nxt_c of Object.keys(dna_db)) {
        fallback_cands[nxt_c] = get_chord_candidates(nxt_c, dna_db, tgt_s);
      }
      for (const [state_key, node_data] of Object.entries(prev_layer)) {
        const c_name = node_data.chord;
        const v_tup = node_data.tuple;
        for (const nxt_c of Object.keys(dna_db)) {
          if (!(nxt_c in dna_db)) continue;
          for (const nxt_v of fallback_cands[nxt_c] || []) {
            if (evaluate_voicing(tuple_to_v(v_tup), nxt_v, c_name, nxt_c, key_info) < 999999) {
              const nxt_key = `${nxt_c}|${JSON.stringify(v_to_tuple(nxt_v))}`;
              if (!(nxt_key in next_layer)) {
                next_layer[nxt_key] = {next: new Set(), prev: new Set(), chord: nxt_c, tuple: v_to_tuple(nxt_v)};
              }
              next_layer[nxt_key].prev.add(state_key);
              node_data.next.add(nxt_key);
            }
          }
        }
      }
      if (Object.keys(next_layer).length === 0) return null;
      layers.pop();
      layers.push(next_layer);
    }
  }

  const valid_final_chords = new Set(["T", "T不完全", "T双三", "t", "t不完全"]);
  const invalid_finals = [];
  for (const state_key of Object.keys(layers[layers.length - 1])) {
    if (!valid_final_chords.has(layers[layers.length - 1][state_key].chord)) {
      invalid_finals.push(state_key);
    }
  }

  for (const inv_state of invalid_finals) {
    if (layers.length > 1) {
      for (const prev_state of layers[layers.length - 1][inv_state].prev) {
        layers[layers.length - 2][prev_state].next.delete(inv_state);
      }
    }
    delete layers[layers.length - 1][inv_state];
  }

  if (Object.keys(layers[layers.length - 1]).length === 0) return null;

  for (let i = layers.length - 1; i > 0; i--) {
    const dead_states = [];
    for (const [state_key, data] of Object.entries(layers[i])) {
      if (i !== layers.length - 1 && data.next.size === 0) {
        dead_states.push(state_key);
      }
    }
    for (const dead of dead_states) {
      for (const prev_state of layers[i][dead].prev) {
        layers[i - 1][prev_state].next.delete(dead);
      }
      delete layers[i][dead];
    }
  }

  const dead_starts = [];
  for (const [state_key, data] of Object.entries(layers[0])) {
    if (layers.length > 1 && data.next.size === 0) {
      dead_starts.push(state_key);
    }
  }
  for (const dead of dead_starts) {
    delete layers[0][dead];
  }

  if (Object.keys(layers[0]).length === 0) return null;
  return layers;
}

export function calculate_best_voicing(chord_sequence, initial_voicing, dna_db, key_info, target_melody = null) {
  const dp = [];
  dp.push({
    [`${chord_sequence[0]}|${JSON.stringify(v_to_tuple(initial_voicing))}`]: {cost: 0, prev: null, chord: chord_sequence[0], tuple: v_to_tuple(initial_voicing)}
  });

  for (let i = 1; i < chord_sequence.length; i++) {
    const current_chord = chord_sequence[i];
    const last_chord = chord_sequence[i - 1];
    const next_layer = {};
    const target_s = target_melody && i < target_melody.length ? target_melody[i] : null;
    const candidates = get_chord_candidates(current_chord, dna_db, target_s);

    for (const [prev_key, prev_data] of Object.entries(dp[dp.length - 1])) {
      const prev_c = prev_data.chord;
      const prev_v = tuple_to_v(prev_data.tuple);
      for (const curr_v of candidates) {
        const cost = evaluate_voicing(prev_v, curr_v, prev_c, current_chord, key_info);
        if (cost < 999999) {
          const total_cost = prev_data.cost + cost;
          const curr_key = `${current_chord}|${JSON.stringify(v_to_tuple(curr_v))}`;
          if (!(curr_key in next_layer) || total_cost < next_layer[curr_key].cost) {
            next_layer[curr_key] = {cost: total_cost, prev: prev_key, chord: current_chord, tuple: v_to_tuple(curr_v)};
          }
        }
      }
    }
    if (Object.keys(next_layer).length === 0) return null;
    dp.push(next_layer);
  }

  let best_final_key = null;
  let best_cost = Infinity;
  for (const [key, data] of Object.entries(dp[dp.length - 1])) {
    if (data.cost < best_cost) {
      best_cost = data.cost;
      best_final_key = key;
    }
  }

  const path = [];
  let curr_key = best_final_key;
  for (let i = dp.length - 1; i >= 0; i--) {
    path.push(tuple_to_v(dp[i][curr_key].tuple));
    curr_key = dp[i][curr_key].prev;
    if (curr_key === null && i > 0) return null;
  }
  path.reverse();
  return path;
}
