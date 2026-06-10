// utils.js - Helper functions for voicing transformations and chord siblings

export function v_to_tuple(v) {
  return [v.S, v.A, v.T, v.B];
}

export function tuple_to_v(t) {
  return {S: t[0], A: t[1], T: t[2], B: t[3]};
}

export function get_chord_siblings(chord_name, dna_db) {
  if (chord_name.includes("₆₄") || chord_name.includes("⁺⁶") || chord_name === "N₆") {
    return [];
  }

  function get_core(c) {
    const parts = c.split('/');
    let core = parts[0];
    const target = parts.length > 1 ? "/" + parts[1] : "";
    const suffixes = ["₆₄", "₅₆", "₃₄", "不完全", "双三", "₆", "₇", "₉", "₂", "⁶"];
    for (const suffix of suffixes) {
      core = core.replace(suffix, "");
    }
    return core + target;
  }

  const my_core = get_core(chord_name);
  const is_seventh_family = ["₇", "₅₆", "₃₄", "₂", "₉"].some(x => chord_name.includes(x));
  const siblings = new Set();

  for (const k of Object.keys(dna_db)) {
    if (k.includes("₆₄") || k.includes("⁺⁶") || k === "N₆") continue;
    if (get_core(k) === my_core) {
      if (is_seventh_family && !["₇", "₅₆", "₃₄", "₂", "₉"].some(x => k.includes(x))) {
        continue;
      }
      siblings.add(k);
    }
  }
  return [...siblings];
}
