// engine/utils/formatter.js - Chord formatting and categorization

export function format_chord_name(name) {
  let clean_name = name.replace(/♮⁵/g, '').replace(/♭⁵/g, '');
  const parts = clean_name.split('/');
  const base_name = parts[0];
  const suffix = parts.length > 1 ? '/' + parts[1] : '';
  let core = base_name;
  if (base_name.includes('不完全')) {
    const core_str = base_name.replace(/不完全/g, '').replace(/₇/g, '').replace(/₉/g, '');
    core = core_str + 'ᵢₙᶜ';
  } else if (base_name.includes('双三')) {
    core = 'Tᵈᵘᵃˡ';
  }
  if (name.includes('♭⁵') || (base_name.includes('♭') && !base_name.includes('VI'))) {
    core += name.includes('♭⁵') ? '♭5' : '♭';
  } else if (name.includes('♮⁵')) {
    core += '♮5';
  }
  return core + suffix;
}

export function categorize_chords(chords) {
  const diatonic = {
    '主功能组 (T / t / DT)': [],
    '下属功能组 (S / s / VI)': [],
    '变和弦组 (N / +6)': [],
    '属功能组 (D / K / VII)': [],
    '导功能组 (Dᵥᵢᵢ)': [],
    '重属功能组 (DD)': [],
    '特殊变音与扩展和弦 (Others)': []
  };
  const tonicization = {};

  for (const chord of chords) {
    if (chord.includes('/') && !chord.startsWith('It') && !chord.startsWith('Ger') && !chord.startsWith('Fr')) {
      const target_deg = chord.split('/')[1];
      if (chord.startsWith('D') || chord.startsWith('Dᵥᵢᵢ')) {
        const cat = `副属和弦 (至 ${target_deg} 级)`;
        if (!tonicization[cat]) tonicization[cat] = [];
        tonicization[cat].push(chord);
      } else if (chord.startsWith('S') || chord.startsWith('s') || chord.startsWith('Sᵢᵢ') || chord.startsWith('sᵢᵢ')) {
        const cat = `副下属和弦 (至 ${target_deg} 级)`;
        if (!tonicization[cat]) tonicization[cat] = [];
        tonicization[cat].push(chord);
      }
    } else {
      if (chord.startsWith('N') || chord.startsWith('It') || chord.startsWith('Ger') || chord.startsWith('Fr')) {
        diatonic['变和弦组 (N / +6)'].push(chord);
      } else if (chord.startsWith('DD')) {
        diatonic['重属功能组 (DD)'].push(chord);
      } else if (chord.startsWith('Dᵥᵢᵢ')) {
        diatonic['导功能组 (Dᵥᵢᵢ)'].push(chord);
      } else if (chord.startsWith('T') || chord.startsWith('t') || chord.startsWith('DT')) {
        diatonic['主功能组 (T / t / DT)'].push(chord);
      } else if (chord.startsWith('S') || chord.startsWith('s') || chord.startsWith('VI') || chord.startsWith('♭VI')) {
        diatonic['下属功能组 (S / s / VI)'].push(chord);
      } else if (chord.startsWith('D') || chord.startsWith('K') || chord.startsWith('VII') || chord.startsWith('♭VII')) {
        diatonic['属功能组 (D / K / VII)'].push(chord);
      } else {
        diatonic['特殊变音与扩展和弦 (Others)'].push(chord);
      }
    }
  }

  const filtered_diatonic = {};
  for (const [k, v] of Object.entries(diatonic)) {
    if (v.length > 0) filtered_diatonic[k] = v;
  }

  return { diatonic: filtered_diatonic, tonicization };
}
