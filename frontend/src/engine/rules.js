// rules.js - Voice-leading rule enforcement and penalty scoring

import { spell_midi } from './tonality.js';

const INVALID_COST = 999999;

export function evaluate_voicing(old_voices, new_voices, last_chord_name, target_chord_name, key_info) {
  const new_S = new_voices.S;
  const new_A = new_voices.A;
  const new_T = new_voices.T;
  const new_B = new_voices.B;

  if (key_info.app_mode !== "COMPOSE") {
    if (!(57 <= new_S && new_S <= 84)) return INVALID_COST;
    if (!(53 <= new_A && new_A <= 74)) return INVALID_COST;
    if (!(45 <= new_T && new_T <= 69)) return INVALID_COST;
    if (!(36 <= new_B && new_B <= 64)) return INVALID_COST;
  }

  if (!(new_S >= new_A && new_A >= new_T && new_T > new_B)) return INVALID_COST;
  if ((new_S - new_A) > 12 || (new_A - new_T) > 12) return INVALID_COST;

  const old_pcs_set = new Set(['S', 'A', 'T', 'B'].map(v => old_voices[v] % 12));
  const new_pcs_set = new Set(['S', 'A', 'T', 'B'].map(v => new_voices[v] % 12));
  let commonCount = 0;
  for (const x of old_pcs_set) if (new_pcs_set.has(x)) commonCount++;
  const is_same_chord = commonCount >= 3;

  let voice_overlap_penalty = 0;
  if (!is_same_chord) {
    if (new_S < old_voices.A) voice_overlap_penalty += 5000;
    if (new_A > old_voices.S || new_A < old_voices.T) voice_overlap_penalty += 5000;
    if (new_T > old_voices.A || new_T < old_voices.B) voice_overlap_penalty += 5000;
    if (new_B > old_voices.T) voice_overlap_penalty += 5000;
    if (voice_overlap_penalty >= 10000) return INVALID_COST;
  }

  const directions = [];
  for (const v of ['S', 'A', 'T', 'B']) {
    const diff = new_voices[v] - old_voices[v];
    directions.push(diff > 0 ? 1 : (diff < 0 ? -1 : 0));
  }

  let all_same_dir_penalty = 0;
  if (directions.filter(d => d === 0).length === 0) {
    if (directions.every(d => d === 1) || directions.every(d => d === -1)) {
      all_same_dir_penalty = 3000;
    }
  }

  const bass_diff = new_B - old_voices.B;
  const bass_leap = Math.abs(bass_diff);
  let bass_penalty = 0;
  const is_bass_dim5_down = (bass_diff === -6);

  if (bass_leap > 12 || [10, 11].includes(bass_leap) || (bass_leap === 6 && !is_bass_dim5_down)) return INVALID_COST;
  else if (bass_leap === 6 && is_bass_dim5_down) bass_penalty += 80;
  else if ([8, 9].includes(bass_leap)) bass_penalty += 50;
  else bass_penalty += bass_leap * 0.5;

  const old_spells = {};
  const new_spells = {};
  for (const v of ['S', 'A', 'T', 'B']) {
    old_spells[v] = spell_midi(old_voices[v], key_info, last_chord_name);
    new_spells[v] = spell_midi(new_voices[v], key_info, target_chord_name);
  }

  if (["D⁶", "D₇⁶", "DD₇⁶"].includes(target_chord_name)) {
    const added_6th_step = target_chord_name.includes("DD")
      ? (key_info.root_step + 6) % 7
      : (key_info.root_step + 2) % 7;
    const s_step = new_spells.S[1];
    if (s_step !== added_6th_step) return INVALID_COST;
  }

  if (["D₉", "D₉♭"].includes(target_chord_name)) {
    const root_pc = key_info.root_pc;
    const ninth_pc = target_chord_name === "D₉" ? (root_pc + 2) % 12 : (root_pc + 1) % 12;
    if (new_voices.S % 12 !== ninth_pc) return INVALID_COST;
    if (new_voices.S - new_voices.B < 14) return INVALID_COST;
  }

  if (["D₉", "D₉♭"].includes(last_chord_name) && ["D₉", "D₉♭"].includes(target_chord_name)) {
    if (Math.abs(new_S - old_voices.S) !== 0) return INVALID_COST;
  }

  const leap_S = Math.abs(new_S - old_voices.S);
  const leap_A = Math.abs(new_A - old_voices.A);
  const leap_T = Math.abs(new_T - old_voices.T);

  let is_amnesty_S = false;
  if (
    ["D₃₄", "D₅₆", "D₇", "D⁶", "DD₃₄♭⁵", "DD₂♭⁵", "DD₅₆♭⁵", "DD₇♭⁵", "D₇不完全"].includes(last_chord_name) &&
    ["T", "T不完全", "D", "D₇", "K₆₄", "t", "t不完全"].includes(target_chord_name)
  ) {
    if ([5, 7, 0].includes(leap_S)) is_amnesty_S = true;
  }

  if (
    ["D₇⁶", "DD₇⁶"].includes(last_chord_name) &&
    ["T", "T不完全", "t", "t不完全", "D", "D₇", "D₇不完全"].includes(target_chord_name)
  ) {
    if ([3, 4].includes(leap_S) && new_voices.S < old_voices.S) is_amnesty_S = true;
  }

  for (const v of ['S', 'A', 'T', 'B']) {
    const leap = Math.abs(new_voices[v] - old_voices[v]);
    if (leap === 0) continue;

    const old_step = old_spells[v][1];
    const new_step = new_spells[v][1];

    const step_diff = Math.abs(new_step - old_step);
    const norm_step = Math.min(step_diff, 7 - step_diff);
    const norm_ic = Math.min(leap % 12, 12 - (leap % 12));

    let is_unclassical_interval = false;
    if (norm_step === 1 && ![1, 2].includes(norm_ic)) is_unclassical_interval = true;
    else if (norm_step === 2 && ![3, 4].includes(norm_ic)) is_unclassical_interval = true;
    else if (norm_step === 3 && norm_ic !== 5) is_unclassical_interval = true;
    else if (norm_step === 0 && ![0, 1].includes(norm_ic)) is_unclassical_interval = true;

    if (last_chord_name === "N₆" && target_chord_name.startsWith("D")) {
      if (norm_step === 2 && norm_ic === 2) is_unclassical_interval = false;
    }

    if (is_unclassical_interval) {
      if (v === 'B' && leap === 6 && new_voices[v] < old_voices[v]) {
        // pass
      } else if (v === 'S') {
        // pass
      } else {
        return INVALID_COST;
      }
    }

    if ((leap >= 9 && leap <= 11) || leap > 12) {
      if (v !== 'S') return INVALID_COST;
    }
  }

  if (last_chord_name.startsWith("It⁺⁶") || last_chord_name.startsWith("Ger⁺⁶") || last_chord_name.startsWith("Fr⁺⁶")) {
    const b6_step = (key_info.root_step + 5) % 7;
    const sharp4_step = (key_info.root_step + 3) % 7;
    const dom_step = (key_info.root_step + 4) % 7;

    for (const v of ['S', 'A', 'T', 'B']) {
      const old_step = old_spells[v][1];
      if (old_step === b6_step) {
        const new_step = new_spells[v][1];
        if (new_step !== dom_step || (new_voices[v] - old_voices[v] !== -1)) return INVALID_COST;
      }
      if (old_step === sharp4_step) {
        const new_step = new_spells[v][1];
        if (new_step !== dom_step || (new_voices[v] - old_voices[v] !== 1)) return INVALID_COST;
      }
    }
  }

  if (last_chord_name === "N₆" && ["D", "D₇", "D₇不完全", "D₆", "K₆₄"].includes(target_chord_name)) {
    const flat2_step = (key_info.root_step + 1) % 7;
    const lead_step = (key_info.root_step + 6) % 7;
    const tonic_step = key_info.root_step;

    for (const v of ['S', 'A', 'T', 'B']) {
      const old_step = old_spells[v][1];
      if (old_step === flat2_step) {
        const new_step = new_spells[v][1];
        if (![lead_step, tonic_step].includes(new_step)) return INVALID_COST;
        if (new_voices[v] >= old_voices[v]) return INVALID_COST;
      }
    }
  }

  let parallel_penalty = 0;

  const is_64_context = [target_chord_name, last_chord_name].some(c => ["S₆₄", "s₆₄", "D₆₄", "T₆₄", "t₆₄"].includes(c));

  if (is_64_context) {
    if (![0, 1, 2].includes(bass_leap)) return INVALID_COST;
    for (const v of ['S', 'A', 'T']) {
      const v_leap = Math.abs(new_voices[v] - old_voices[v]);
      if (v_leap > 2) return INVALID_COST;
    }
  }

  if ([1, 2].includes(bass_leap)) {
    for (const v of ['S', 'A', 'T']) {
      const v_diff = new_voices[v] - old_voices[v];
      if (v_diff !== 0 && (v_diff * bass_diff) > 0) {
        const new_interval = Math.abs(new_voices[v] - new_B) % 12;
        if ([0, 5, 7].includes(new_interval)) {
          return INVALID_COST;
        } else {
          parallel_penalty += 500;
        }
      }
    }
  }

  const is_auxiliary_linear =
    (["S", "s", "S₆", "s₆", "Sᵢᵢ₆", "sᵢᵢ₆"].includes(last_chord_name) && ["T₆", "t₆"].includes(target_chord_name)) ||
    (["T₆", "t₆"].includes(last_chord_name) && ["S", "s", "S₆", "s₆", "Sᵢᵢ₆", "sᵢᵢ₆"].includes(target_chord_name));

  if (is_auxiliary_linear) {
    for (const v of ['S', 'A', 'T']) {
      if (Math.abs(new_voices[v] - old_voices[v]) > 2) return INVALID_COST;
    }
  }

  if (
    ["D₇", "D₅₆", "D₃₄", "D₂", "D₇不完全", "D₇⁶"].includes(last_chord_name) &&
    ["T", "T不完全", "T₆", "t", "t不完全", "t₆", "VI", "VI₆", "VI_阻碍"].includes(target_chord_name)
  ) {
    for (const v of ['S', 'A', 'T', 'B']) {
      const old_step = old_spells[v][1];
      if (old_step === (key_info.root_step + 3) % 7) {
        const new_step = new_spells[v][1];
        if (new_step !== (key_info.root_step + 2) % 7) return INVALID_COST;
      }
    }
  }

  if (
    ["D", "D₆", "D₇", "D₅₆", "D₃₄", "D₂", "Dᵥᵢᵢ₆", "Dᵥᵢᵢ₇", "D₇不完全", "D₇⁶"].includes(last_chord_name) &&
    ["T", "T不完全", "T₆", "t", "t不完全", "t₆", "VI", "VI₆", "VI_阻碍"].includes(target_chord_name)
  ) {
    for (const v of ['S', 'B']) {
      const old_step = old_spells[v][1];
      if (old_step === (key_info.root_step + 6) % 7) {
        const new_step = new_spells[v][1];
        if (last_chord_name === "D₆" && target_chord_name === "VI" && v === 'S' && new_step === (key_info.root_step + 5) % 7) continue;
        if (new_step !== key_info.root_step) return INVALID_COST;
      }
    }
  }

  if (last_chord_name === "K₆₄" && ["D", "D₆", "D₇", "D₅₆", "D₃₄", "D₂", "D₉", "D₉♭"].includes(target_chord_name)) {
    for (const v of ['S', 'A', 'T']) {
      const old_step = old_spells[v][1];
      if (old_step === key_info.root_step) {
        const new_step = new_spells[v][1];
        if (new_step !== (key_info.root_step + 6) % 7) return INVALID_COST;
      }
      if (old_step === (key_info.root_step + 2) % 7) {
        const new_step = new_spells[v][1];
        if (![(key_info.root_step + 1) % 7, (key_info.root_step + 3) % 7].includes(new_step)) return INVALID_COST;
      }
    }
  }

  if (last_chord_name.startsWith("T") && target_chord_name.startsWith("DD") && target_chord_name.includes("♭⁵")) {
    for (const v of ['S', 'A', 'T', 'B']) {
      const root_pc = key_info.root_pc;
      const t_third = (root_pc + (key_info.type === "MINOR" ? 3 : 4)) % 12;
      const dd_third = (root_pc + 6) % 12;
      if (old_voices[v] % 12 === t_third && new_voices[v] % 12 === dd_third) return INVALID_COST;
    }
  }

  let false_relation_penalty = 0;
  for (let step = 0; step < 7; step++) {
    const old_alts = {};
    const new_alts = {};
    for (const v of ['S', 'A', 'T', 'B']) {
      if (old_spells[v][1] === step) old_alts[v] = old_spells[v][2];
      if (new_spells[v][1] === step) new_alts[v] = new_spells[v][2];
    }
    for (const [v1, alt1] of Object.entries(old_alts)) {
      for (const [v2, alt2] of Object.entries(new_alts)) {
        if (alt1 !== alt2 && v1 !== v2) {
          if (!(v2 in old_alts) || old_alts[v2] !== alt1) {
            false_relation_penalty += INVALID_COST;
          }
        }
      }
    }
  }

  if (["D₇⁶", "DD₇⁶"].includes(last_chord_name)) {
    const is_dd = last_chord_name === "DD₇⁶";
    const target_tonics = is_dd
      ? ["D", "D₇", "D₇不完全", "D₆", "K₆₄"]
      : ["T", "T不完全", "T₆", "t", "t不完全", "t₆"];
    if (target_tonics.includes(target_chord_name)) {
      const old_s_step = old_spells.S[1];
      const new_s_step = new_spells.S[1];
      const target_root_step = (key_info.root_step + (is_dd ? 4 : 0)) % 7;
      if (new_s_step !== target_root_step || (![3, 4].includes(old_voices.S - new_voices.S))) return INVALID_COST;
    }
    if (!is_dd && ["VI", "VI₆", "VI_阻碍"].includes(target_chord_name)) {
      if (old_voices.S !== new_voices.S) return INVALID_COST;
    }
    if (
      (!is_dd && ["D₇", "D₇不完全"].includes(target_chord_name)) ||
      (is_dd && ["DD₇", "DD₇不完全"].includes(target_chord_name))
    ) {
      if (old_voices.B !== new_voices.B || old_voices.T !== new_voices.T || old_voices.A !== new_voices.A) return INVALID_COST;
      const s_diff = old_voices.S - new_voices.S;
      if (![1, 2].includes(s_diff) || s_diff > 2) return INVALID_COST;
    }
  }

  const voice_names = ['S', 'A', 'T', 'B'];
  for (let i = 0; i < voice_names.length; i++) {
    for (let j = i + 1; j < voice_names.length; j++) {
      const v1 = voice_names[i];
      const v2 = voice_names[j];
      const o1 = old_voices[v1];
      const o2 = old_voices[v2];
      const n1 = new_voices[v1];
      const n2 = new_voices[v2];

      if (o1 === n1 && o2 === n2) continue;

      const v1_diff = n1 - o1;
      const v2_diff = n2 - o2;

      const is_parallel_motion = (v1_diff * v2_diff) > 0;
      const is_contrary_motion = (v1_diff * v2_diff) < 0;

      const old_interval = Math.abs(o1 - o2) % 12;
      const new_interval = Math.abs(n1 - n2) % 12;

      if (old_interval === 0 && new_interval === 0) {
        if (is_parallel_motion) parallel_penalty += 10000;
        else if (is_contrary_motion) parallel_penalty += 10000;
      }

      if (old_interval === 7 && new_interval === 7) {
        if (is_parallel_motion) {
          if (last_chord_name.includes("Ger") && ["D", "D₆", "D₇", "D₇不完全"].includes(target_chord_name)) {
            // pass
          } else {
            parallel_penalty += 10000;
          }
        } else if (is_contrary_motion) {
          parallel_penalty += 10000;
        }
      }

      if (is_parallel_motion && old_interval === 6 && new_interval === 7) parallel_penalty += 2000;

      if (v1 === 'S' && v2 === 'B') {
        if (new_interval === 0 || new_interval === 7) {
          if (is_parallel_motion && Math.abs(n1 - o1) >= 3) parallel_penalty += 10000;
        }
      }
    }
  }

  if (parallel_penalty >= 5000) return INVALID_COST;

  let unison_penalty = 0;
  if (new_S === new_A) unison_penalty += 20;
  if (new_A === new_T) unison_penalty += 15;
  if (new_T === new_B) unison_penalty += 20;

  if (unison_penalty > 0) {
    if (target_chord_name.includes("ᵥᵢᵢ") || target_chord_name.includes("⁺⁶") || target_chord_name.includes("DD")) {
      unison_penalty *= 4;
    }
  }

  const rare_sevenths = ["T₇", "t₇", "VI₇", "DTᵢᵢᵢ₇", "S₇", "s₇"];
  let stylistic_penalty = 0;

  if (rare_sevenths.includes(target_chord_name)) {
    stylistic_penalty += 2000;
    if (leap_S > 2 || leap_A > 2 || leap_T > 2) return INVALID_COST;
  }

  if (rare_sevenths.includes(last_chord_name)) {
    let has_step_down = false;
    for (const v of ['S', 'A', 'T', 'B']) {
      const diff = old_voices[v] - new_voices[v];
      if (diff === 1 || diff === 2) {
        has_step_down = true;
        break;
      }
    }
    if (!has_step_down) return INVALID_COST;
  }

  let melody_penalty = 0;
  if (is_amnesty_S) melody_penalty = 0;
  else if (leap_S === 0) {
    if (is_same_chord) melody_penalty = 2.0;
    else melody_penalty = 0.0;
  } else if ([1, 2].includes(leap_S)) melody_penalty = 0.0;
  else if ([3, 4, 5].includes(leap_S)) {
    if (is_same_chord) melody_penalty = 1.0;
    else melody_penalty = leap_S * 1.5;
  } else {
    melody_penalty = leap_S * 2.0;
  }

  let inner_penalty = 0;
  for (const leap of [leap_A, leap_T]) {
    if (leap === 0) inner_penalty += 0.0;
    else if ([1, 2].includes(leap)) inner_penalty += leap * 0.5;
    else if ([3, 4].includes(leap)) inner_penalty += leap * 1.2;
    else inner_penalty += leap * 2.0;
  }

  return bass_penalty + melody_penalty + inner_penalty + parallel_penalty + false_relation_penalty + all_same_dir_penalty + voice_overlap_penalty + unison_penalty + stylistic_penalty + (is_amnesty_S ? 20 : 0);
}
