/**
 * 和弦名称格式化与分类模块
 *
 * 本模块处理和弦名称的显示格式化以及功能分组:
 *   - format_chord_name: 将内部和弦标识（如 "D₇不完全"）转换为乐谱显示格式
 *   - categorize_chords: 将和弦按功能组分类（主/下属/属/重属/变音/离调）
 *
 * 分类体系基于斯波索宾和声学的功能组理论:
 *   自然音阶: 主功能、下属功能、属功能、导功能
 *   离调体系: 副属和弦、副下属和弦、重属与变和弦
 */

/**
 * 格式化和弦名称为显示字符串
 * @param {string} name - 内部和弦标识符
 * @returns {string} 格式化后的显示名称
 *
 * 转换规则:
 *   - "不完全" → "ᵢₙᶜ" (不完整和弦标记)
 *   - "双三" → "ᵈᵘᵃˡ" (双三和弦标记)
 *   - "♭⁵" → "♭5" (降五度)
 *   - "♮⁵" → "♮5" (还原五度)
 *   - 保留离调标记（如 /II, /VI）
 */
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

/**
 * 将和弦列表按功能组分类
 * @param {string[]} chords - 和弦名称数组
 * @returns {Object} {diatonic: {}, tonicization: {}}
 *   - diatonic: 自然音阶功能组
 *   - tonicization: 离调体系
 *
 * 分类逻辑:
 *   1. 离调和弦（包含 "/"）：
 *      - D/Dᵥᵢᵢ开头 → 副属和弦
 *      - S/s/Sᵢᵢ/sᵢᵢ开头 → 副下属和弦
 *   2. 重属与变和弦（DD/N/It/Ger/Fr）→ 归入离调体系
 *   3. 其他和弦 → 自然音阶和弦
 *      - 按功能前缀分配到对应分组
 */
export function categorize_chords(chords) {
  // 自然音阶功能组定义
  const diatonic = {
    '主功能组': [],          // 主和弦及其变形
    '下属功能组': [],        // 下属和弦及平行调
    '属功能组': [],         // 属和弦及终止四六
    '导功能组': [],                // 导七和弦系列
    '特殊变音与扩展和弦': []     // 其他特殊和弦
  };

  const tonicization = {};  // 离调和弦动态分组

  for (const chord of chords) {
    // ===== 离调和弦分类 =====
    if (chord.includes('/')) {
      const target_deg = chord.split('/')[1];
      if (chord.startsWith('D') || chord.startsWith('Dᵥᵢᵢ')) {
        // 副属和弦: D/VI, Dᵥᵢᵢ₇/II 等
        const cat = `${target_deg}级副属和弦`;
        if (!tonicization[cat]) tonicization[cat] = [];
        tonicization[cat].push(chord);
      } else if (chord.startsWith('S') || chord.startsWith('s') || chord.startsWith('Sᵢᵢ') || chord.startsWith('sᵢᵢ')) {
        // 副下属和弦: S/II, sᵢᵢ₆/VI 等
        const cat = `${target_deg}级副下属和弦`;
        if (!tonicization[cat]) tonicization[cat] = [];
        tonicization[cat].push(chord);
      }
    }
    // ===== 重属与变和弦 → 归入离调体系 =====
    else if (chord.startsWith('DD') || chord.startsWith('N') || chord.startsWith('It') || chord.startsWith('Ger') || chord.startsWith('Fr')) {
      const cat = '重属与变和弦';
      if (!tonicization[cat]) tonicization[cat] = [];
      tonicization[cat].push(chord);
    }
    // ===== 自然音阶和弦分类 =====
    else {
      if (chord.startsWith('Dᵥᵢᵢ')) {
        diatonic['导功能组'].push(chord);
      } else if (chord.startsWith('T') || chord.startsWith('t') || chord.startsWith('DT')) {
        diatonic['主功能组'].push(chord);
      } else if (chord.startsWith('S') || chord.startsWith('s') || chord.startsWith('VI') || chord.startsWith('♭VI')) {
        diatonic['下属功能组'].push(chord);
      } else if (chord.startsWith('D') || chord.startsWith('K') || chord.startsWith('VII') || chord.startsWith('♭VII')) {
        diatonic['属功能组'].push(chord);
      } else {
        diatonic['特殊变音与扩展和弦'].push(chord);
      }
    }
  }

  // 过滤掉空分组，保持UI整洁
  const filtered_diatonic = {};
  for (const [k, v] of Object.entries(diatonic)) {
    if (v.length > 0) filtered_diatonic[k] = v;
  }

  return { diatonic: filtered_diatonic, tonicization };
}
