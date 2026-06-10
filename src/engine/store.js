// store.js - Local state management replacing the Python backend

import { reactive } from 'vue';
import { MAJOR_DNA, MINOR_DNA } from './data.js';
import { KEY_REGISTRY, transpose_dna } from './tonality.js';
import { v_to_tuple, tuple_to_v, get_chord_siblings } from './utils.js';
import { get_chord_candidates } from './candidates.js';
import { evaluate_voicing } from './rules.js';
import { build_full_dag, calculate_best_voicing } from './dag.js';
import { categorize_chords } from './formatter.js';

export const store = reactive({
  mode: "FREE",
  key_name: "C 大调 (C Major)",
  target_melody: [],
  history: [],
  pending_note: null,
  categories: { diatonic: {}, tonicization: {} },
  playbackIndex: null,
  debug_message: null,
  is_completed: false
});

const GLOBAL_DAG_CACHE = {};

function get_key_info() {
  const ki = {...KEY_REGISTRY[store.key_name]};
  ki.app_mode = store.mode;
  return ki;
}

function get_active_dna() {
  const key_info = get_key_info();
  const base_db = key_info.type === "MAJOR" ? MAJOR_DNA : MINOR_DNA;
  return transpose_dna(base_db, key_info.shift);
}

function get_cached_dag(key_name, target_melody, active_dna_db, key_info) {
  if (!target_melody || target_melody.length === 0) return null;
  const cache_key = `${key_name}_${target_melody.join(",")}`;
  if (cache_key in GLOBAL_DAG_CACHE) return GLOBAL_DAG_CACHE[cache_key];
  const dag = build_full_dag(target_melody, active_dna_db, key_info);
  if (Object.keys(GLOBAL_DAG_CACHE).length > 50) {
    delete GLOBAL_DAG_CACHE[Object.keys(GLOBAL_DAG_CACHE)[0]];
  }
  GLOBAL_DAG_CACHE[cache_key] = dag;
  return dag;
}

function score_initial(v, shift) {
  const v_shift = shift <= 3 ? shift : shift - 12;
  const ideal_S = 72 + v_shift;
  const ideal_A = 65 + v_shift;
  const ideal_T = 60 + v_shift;
  const ideal_B = 48 + v_shift;
  return Math.abs(v.S - ideal_S) * 1.5 + Math.abs(v.A - ideal_A) + Math.abs(v.T - ideal_T) + Math.abs(v.B - ideal_B);
}

export function sync_state(action_chord = null) {
  const key_info = get_key_info();
  const active_dna_db = get_active_dna();
  const shift = key_info.shift;

  store.debug_message = null;
  store.is_completed = false;

  if (action_chord) {
    const target_chord = action_chord;

    if (store.mode === "SOPRANO" && store.target_melody.length > 0) {
      const dag_layers = get_cached_dag(store.key_name, store.target_melody, active_dna_db, key_info);
      if (dag_layers) {
        const step = store.history.length;
        let valid_states = [];
        if (step === 0) {
          valid_states = Object.values(dag_layers[0]).filter(s => s.chord === target_chord);
        } else {
          const last_h = store.history[store.history.length - 1];
          const last_key = `${last_h.chord}|${JSON.stringify(v_to_tuple(last_h.voices))}`;
          const state_data = dag_layers[step - 1][last_key];
          if (state_data) {
            valid_states = [...state_data.next].map(k => dag_layers[step][k]).filter(s => s && s.chord === target_chord);
          }
        }
        if (valid_states.length > 0) {
          valid_states.sort((a, b) => score_initial(tuple_to_v(a.tuple), shift) - score_initial(tuple_to_v(b.tuple), shift));
          const best = valid_states[0];
          store.history.push({chord: best.chord, voices: tuple_to_v(best.tuple)});
        }
      }
    } else if (store.mode === "COMPOSE" && store.pending_note !== null) {
      const tgt_s = store.pending_note;
      let valid_states = [];
      if (store.history.length === 0) {
        for (const v of get_chord_candidates(target_chord, active_dna_db, tgt_s)) {
          valid_states.push([target_chord, v_to_tuple(v)]);
        }
      } else {
        const last_c = store.history[store.history.length - 1].chord;
        const last_v = store.history[store.history.length - 1].voices;
        for (const nxt_v of get_chord_candidates(target_chord, active_dna_db, tgt_s)) {
          if (evaluate_voicing(last_v, nxt_v, last_c, target_chord, key_info) < 999999) {
            valid_states.push([target_chord, v_to_tuple(nxt_v)]);
          }
        }
      }
      if (valid_states.length > 0) {
        valid_states.sort((a, b) => score_initial(tuple_to_v(a[1]), shift) - score_initial(tuple_to_v(b[1]), shift));
        const best = valid_states[0];
        store.history.push({chord: best[0], voices: tuple_to_v(best[1])});
        store.target_melody.push(store.pending_note);
        store.pending_note = null;
      }
    } else if (store.mode === "FREE") {
      if (store.history.length === 0) {
        const cands = get_chord_candidates(target_chord, active_dna_db, null);
        if (cands.length > 0) {
          cands.sort((a, b) => score_initial(a, shift) - score_initial(b, shift));
          store.history.push({chord: target_chord, voices: cands[0]});
        }
      } else {
        const chord_sequence = store.history.map(item => item.chord).concat(target_chord);
        const initial_voicing = store.history[0].voices;
        const global_path = calculate_best_voicing(chord_sequence, initial_voicing, active_dna_db, key_info, null);
        if (global_path) {
          store.history = chord_sequence.map((c, i) => ({chord: c, voices: global_path[i]}));
        }
      }
    }
  }

  let next_chords = [];

  if (store.mode === "SOPRANO" && store.target_melody.length > 0) {
    if (store.history.length === store.target_melody.length) {
      store.is_completed = true;
    }

    const dag = get_cached_dag(store.key_name, store.target_melody, active_dna_db, key_info);
    if (!dag || dag.length < store.target_melody.length) {
      const logs = [];
      logs.push("=== 启动 DAG 连通性诊断探针 ===");
      logs.push(`调性: ${key_info.type} / 根音偏移: ${key_info.shift}`);
      logs.push(`目标序列 (MIDI): ${store.target_melody.join(", ")}`);
      logs.push("-".repeat(50));

      let current_layer = {};
      let start_index = 0;
      if (store.history.length === 0) {
        const start_chord = key_info.type === "MAJOR" ? "T" : "t";
        const cands = get_chord_candidates(start_chord, active_dna_db, store.target_melody[0]);
        for (const v of cands) {
          current_layer[`${start_chord}|${JSON.stringify(v_to_tuple(v))}`] = new Set([start_chord]);
        }
        logs.push(`[节点 0] 目标 MIDI=${store.target_melody[0]}, 初始 '${start_chord}' 合法状态数: ${Object.keys(current_layer).length}`);
      } else {
        const last_h = store.history[store.history.length - 1];
        start_index = store.history.length;
        current_layer[`${last_h.chord}|${JSON.stringify(v_to_tuple(last_h.voices))}`] = new Set([last_h.chord]);
        logs.push(`基于已有状态集，从第 ${start_index} 个节点继续推演...`);
      }

      for (let i = (store.history.length > 0 ? start_index + 1 : 1); i < store.target_melody.length; i++) {
        const next_layer_local = {};
        const tgt_s = store.target_melody[i];
        const all_possible_nexts = new Set();
        for (const state_key of Object.keys(current_layer)) {
          const c_name = state_key.split("|")[0];
          for (const nxt of active_dna_db[c_name]?.next || []) all_possible_nexts.add(nxt);
        }
        const cand_cache = {};
        for (const nxt_chord of all_possible_nexts) {
          if (nxt_chord in active_dna_db) cand_cache[nxt_chord] = get_chord_candidates(nxt_chord, active_dna_db, tgt_s);
        }
        for (const [state_key] of Object.entries(current_layer)) {
          const c_name = state_key.split("|")[0];
          const v_tup = JSON.parse(state_key.split("|")[1]);
          const possible_nexts = active_dna_db[c_name]?.next || [];
          for (const nxt_chord of possible_nexts) {
            if (!(nxt_chord in active_dna_db)) continue;
            for (const nxt_v of cand_cache[nxt_chord] || []) {
              if (evaluate_voicing(tuple_to_v(v_tup), nxt_v, c_name, nxt_chord, key_info) < 999999) {
                next_layer_local[`${nxt_chord}|${JSON.stringify(v_to_tuple(nxt_v))}`] = true;
              }
            }
          }
        }
        logs.push(`[节点 ${i}] 目标 MIDI=${tgt_s}, 存活的合法连接状态数: ${Object.keys(next_layer_local).length}`);
        if (Object.keys(next_layer_local).length === 0) {
          logs.push("-".repeat(50));
          logs.push("❌ 连通性异常：路径已断开");
          logs.push(`中断点: 节点 ${i} (目标 MIDI: ${tgt_s})`);
          logs.push(`在上一个节点 (MIDI: ${store.target_melody[i-1]}) 时，可用的合法配置包含：`);
          const surviving_chords = {};
          for (const state_key of Object.keys(current_layer)) {
            const c_name = state_key.split("|")[0];
            surviving_chords[c_name] = (surviving_chords[c_name] || 0) + 1;
          }
          for (const [c, count] of Object.entries(surviving_chords)) {
            logs.push(` - ${c}: ${count} 个有效声部排列`);
          }
          break;
        }
        current_layer = next_layer_local;
      }
      store.debug_message = logs.join("\n");
    } else {
      if (store.history.length === 0) {
        next_chords = [...new Set(Object.values(dag[0]).map(s => s.chord))];
      } else if (store.history.length < store.target_melody.length) {
        const last_item = store.history[store.history.length - 1];
        const last_key = `${last_item.chord}|${JSON.stringify(v_to_tuple(last_item.voices))}`;
        const state_data = dag[store.history.length - 1][last_key];
        if (state_data) {
          next_chords = [...new Set([...state_data.next].map(k => dag[store.history.length][k]).filter(Boolean).map(s => s.chord))];
        }
      }
    }
  } else if (store.history.length === 0) {
    if (store.mode === "COMPOSE" && store.pending_note !== null) {
      for (const c_name of Object.keys(active_dna_db)) {
        if (get_chord_candidates(c_name, active_dna_db, store.pending_note).length > 0) {
          next_chords.push(c_name);
        }
      }
    } else if (store.mode === "FREE") {
      next_chords = Object.keys(active_dna_db);
    }
  } else {
    const last_item = store.history[store.history.length - 1];

    if (store.mode === "COMPOSE") {
      if (store.pending_note !== null) {
        const last_c = last_item.chord;
        const last_v = last_item.voices;
        const possible_nexts = new Set();
        for (const nxt of active_dna_db[last_c]?.next || []) {
          possible_nexts.add(nxt);
          for (const sib of get_chord_siblings(nxt, active_dna_db)) possible_nexts.add(sib);
        }
        for (const sib of get_chord_siblings(last_c, active_dna_db)) possible_nexts.add(sib);

        for (const nxt_c of possible_nexts) {
          if (!(nxt_c in active_dna_db)) continue;
          for (const nxt_v of get_chord_candidates(nxt_c, active_dna_db, store.pending_note)) {
            if (evaluate_voicing(last_v, nxt_v, last_c, nxt_c, key_info) < 999999) {
              next_chords.push(nxt_c);
              break;
            }
          }
        }
      }
    } else if (store.mode === "FREE") {
      const last_c = last_item.chord;
      const last_v = last_item.voices;
      const possible_nexts = new Set();
      for (const nxt of active_dna_db[last_c]?.next || []) {
        possible_nexts.add(nxt);
        for (const sib of get_chord_siblings(nxt, active_dna_db)) possible_nexts.add(sib);
      }
      for (const sib of get_chord_siblings(last_c, active_dna_db)) possible_nexts.add(sib);

      for (const nxt_c of possible_nexts) {
        if (!(nxt_c in active_dna_db)) continue;
        for (const nxt_v of get_chord_candidates(nxt_c, active_dna_db, null)) {
          if (evaluate_voicing(last_v, nxt_v, last_c, nxt_c, key_info) < 999999) {
            next_chords.push(nxt_c);
            break;
          }
        }
      }
    }
  }

  let is_dead_end = false;
  if (store.history.length > 0 && !store.is_completed && !store.debug_message) {
    if (store.mode !== "COMPOSE" && next_chords.length === 0) {
      is_dead_end = true;
    } else if (store.mode === "COMPOSE" && store.pending_note !== null && next_chords.length === 0) {
      is_dead_end = true;
    }
  }

  if (is_dead_end) {
    store.debug_message = "⚠️ 死胡同警告：当前的声部排列导致前方无路可走！\n\n【诊断信息】\n引擎已经穷尽了所有合法的和声连接，但在严格遵守声部进行法则的前提下，无法找到下一步的合法排列。\n\n👉 建议：直接点击乐谱上历史节点进行【状态回退】！";
  }

  store.categories = categorize_chords(next_chords);
}

export function reset_state() {
  store.history = [];
  store.target_melody = [];
  store.pending_note = null;
  store.playbackIndex = null;
  store.debug_message = null;
  store.is_completed = false;
  sync_state();
}
