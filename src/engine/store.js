/**
 * 全局状态管理模块
 *
 * 本模块是整个应用的核心状态控制器，采用Vue3的reactive实现响应式状态管理。
 * 负责协调三种工作模式（FREE/SOPRANO/COMPOSE）的状态流转，
 * 并调用底层引擎（候选生成、DAG构建、规则评估）完成和声推演。
 *
 * 状态设计:
 *   - mode: 当前工作模式
 *   - key_name: 当前调性名称
 *   - target_melody: 高音题/写作模式的目标旋律数组
 *   - history: 和声进行历史记录（和弦名+声部配置）
 *   - pending_note: 写作模式等待确认的旋律音
 *   - categories: 下一拍可用的和弦候选分类
 *   - playbackIndex: 当前播放位置（用于播放头动画）
 *   - debug_message: 调试/诊断信息
 *   - is_completed: 高音题模式是否完成
 *
 * DAG缓存:
 *   使用全局缓存(GLOBAL_DAG_CACHE)存储已构建的DAG，
 *   避免同一旋律序列的重复计算，提升高音题模式响应速度。
 */

import { reactive } from 'vue';
import { MAJOR_DNA, MINOR_DNA } from './data/index.js';
import { KEY_REGISTRY, transpose_dna } from './tonality/index.js';
import { vToTuple, tupleToV, getChordSiblings, categorizeChords } from './utils/index.js';
import { getChordCandidates } from './core/candidateEngine.js';
import { evaluateVoicing } from './rules/index.js';
import { buildFullDag } from './core/dagBuilder.js';
import { calculateBestVoicing } from './core/viterbi.js';

// ===== 响应式全局状态 =====
export const store = reactive({
  mode: "FREE",                           // 默认工作模式: 自由探索
  key_name: "C 大调",                   // 默认调性: C大调
  target_melody: [],                      // 目标旋律（高音题/写作模式）
  target_bass: [],                        // 目标低音旋律（低音题模式）
  history: [],                            // 和声进行历史
  pending_note: null,                     // 待确认旋律音（写作模式）
  categories: { diatonic: {}, tonicization: {} },  // 可用和弦候选分类
  playbackIndex: null,                    // 当前播放索引
  debug_message: null,                    // 调试诊断信息
  is_completed: false                     // 是否已完成高音题推演
});

/** DAG缓存对象，以 "调性_旋律" 为键存储已构建的DAG */
const GLOBAL_DAG_CACHE = {};

/**
 * 获取当前调性的完整信息
 * @returns {Object} 调性信息对象（含类型、偏移、根音等+应用模式）
 */
function get_key_info() {
  const ki = {...KEY_REGISTRY[store.key_name]};
  ki.app_mode = store.mode;
  return ki;
}

/**
 * 获取当前调性下的激活DNA数据库
 * @returns {Object} 已转调至当前调性的DNA数据库
 *
 * 根据当前调性类型（大调/小调）选择基础DNA，
 * 然后应用调性偏移量进行转调。
 */
function get_active_dna() {
  const key_info = get_key_info();
  const base_db = key_info.type === "MAJOR" ? MAJOR_DNA : MINOR_DNA;
  return transpose_dna(base_db, key_info.shift);
}

/**
 * 获取或构建缓存的DAG
 * @param {string} key_name - 调性名称
 * @param {number[]} target_melody - 目标旋律
 * @param {Object} active_dna_db - 激活的DNA数据库
 * @param {Object} key_info - 调性信息
 * @returns {Array|null} DAG层数组或null
 *
 * 缓存策略:
 *   - 以 "调性_MIDI1,MIDI2,..." 为键
 *   - 缓存上限50条，超出时删除最早的一条（FIFO）
 */
function get_cached_dag(key_name, target_melody, active_dna_db, key_info, targetVoice = 'S') {
  if (!target_melody || target_melody.length === 0) return null;
  const cache_key = `${key_name}_${targetVoice}_${target_melody.join(",")}`;
  if (cache_key in GLOBAL_DAG_CACHE) return GLOBAL_DAG_CACHE[cache_key];
  const dag = buildFullDag(target_melody, active_dna_db, key_info, targetVoice);
  if (Object.keys(GLOBAL_DAG_CACHE).length > 50) {
    delete GLOBAL_DAG_CACHE[Object.keys(GLOBAL_DAG_CACHE)[0]];
  }
  GLOBAL_DAG_CACHE[cache_key] = dag;
  return dag;
}

/**
 * 计算声部配置的初始位置评分
 * @param {Object} v - 声部配置 {S, A, T, B}
 * @param {number} shift - 调性偏移量（半音）
 * @returns {number} 评分值（越小越接近理想位置）
 *
 * 理想位置公式:
 *   S=72+shift, A=65+shift, T=60+shift, B=48+shift
 * S声部权重1.5倍，因为旋律声部位置更重要。
 */
function scoreInitial(v, shift) {
  const v_shift = shift <= 3 ? shift : shift - 12;
  const ideal_S = 72 + v_shift;
  const ideal_A = 65 + v_shift;
  const ideal_T = 60 + v_shift;
  const ideal_B = 48 + v_shift;
  return Math.abs(v.S - ideal_S) * 1.5 + Math.abs(v.A - ideal_A) + Math.abs(v.T - ideal_T) + Math.abs(v.B - ideal_B);
}

/**
 * DAG模式通用处理：用户选择和弦
 * @param {Array} dagLayers - DAG层数组
 * @param {string} targetChord - 用户选择的和弦
 * @param {number} shift - 调性偏移
 */
function processDagSelection(dagLayers, targetChord, shift) {
  const step = store.history.length;
  let validStates = [];
  if (step === 0) {
    validStates = Object.values(dagLayers[0]).filter(s => s.chord === targetChord);
  } else {
    const lastH = store.history[store.history.length - 1];
    const lastKey = `${lastH.chord}|${JSON.stringify(vToTuple(lastH.voices))}`;
    const stateData = dagLayers[step - 1][lastKey];
    if (stateData) {
      validStates = [...stateData.next].map(k => dagLayers[step][k]).filter(s => s && s.chord === targetChord);
    }
  }
  if (validStates.length > 0) {
    validStates.sort((a, b) => scoreInitial(tupleToV(a.tuple), shift) - scoreInitial(tupleToV(b.tuple), shift));
    const best = validStates[0];
    store.history.push({chord: best.chord, voices: tupleToV(best.tuple)});
  }
}

/**
 * DAG连通性诊断探针
 * @param {number[]} targetSequence - 目标旋律序列
 * @param {Object} activeDnaDb - DNA数据库
 * @param {Object} keyInfo - 调性信息
 * @param {string} targetVoice - 固定声部 ('S' 或 'B')
 * @returns {string} 诊断日志
 */
function runDagProbe(targetSequence, activeDnaDb, keyInfo, targetVoice) {
  const logs = [];
  const label = targetVoice === 'B' ? '低音题' : '';
  logs.push(`=== 启动 DAG 连通性诊断探针 ${label} ===`);
  logs.push(`调性: ${keyInfo.type} / 根音偏移: ${keyInfo.shift}`);
  logs.push(`目标${targetVoice === 'B' ? '低音' : ''}序列 (MIDI): ${targetSequence.join(", ")}`);
  logs.push("-".repeat(50));

  let currentLayer = {};
  let startIndex = 0;
  if (store.history.length === 0) {
    const startChord = keyInfo.type === "MAJOR" ? "T" : "t";
    const cands = targetVoice === 'B'
      ? getChordCandidates(startChord, activeDnaDb, null, targetSequence[0])
      : getChordCandidates(startChord, activeDnaDb, targetSequence[0]);
    for (const v of cands) {
      currentLayer[`${startChord}|${JSON.stringify(vToTuple(v))}`] = new Set([startChord]);
    }
    logs.push(`[节点 0] 目标 MIDI=${targetSequence[0]}, 初始 '${startChord}' 合法状态数: ${Object.keys(currentLayer).length}`);
  } else {
    const lastH = store.history[store.history.length - 1];
    startIndex = store.history.length;
    currentLayer[`${lastH.chord}|${JSON.stringify(vToTuple(lastH.voices))}`] = new Set([lastH.chord]);
    logs.push(`基于已有状态集，从第 ${startIndex} 个节点继续推演...`);
  }

  for (let i = (store.history.length > 0 ? startIndex + 1 : 1); i < targetSequence.length; i++) {
    const nextLayerLocal = {};
    const tgt = targetSequence[i];
    const allPossibleNexts = new Set();
    for (const stateKey of Object.keys(currentLayer)) {
      const cName = stateKey.split("|")[0];
      for (const nxt of activeDnaDb[cName]?.next || []) allPossibleNexts.add(nxt);
    }
    const candCache = {};
    for (const nxtChord of allPossibleNexts) {
      if (nxtChord in activeDnaDb) {
        candCache[nxtChord] = targetVoice === 'B'
          ? getChordCandidates(nxtChord, activeDnaDb, null, tgt)
          : getChordCandidates(nxtChord, activeDnaDb, tgt);
      }
    }
    for (const [stateKey] of Object.entries(currentLayer)) {
      const cName = stateKey.split("|")[0];
      const vTup = JSON.parse(stateKey.split("|")[1]);
      const possibleNexts = activeDnaDb[cName]?.next || [];
      for (const nxtChord of possibleNexts) {
        if (!(nxtChord in activeDnaDb)) continue;
        for (const nxtV of candCache[nxtChord] || []) {
          if (evaluateVoicing(tupleToV(vTup), nxtV, cName, nxtChord, keyInfo) < 999999) {
            nextLayerLocal[`${nxtChord}|${JSON.stringify(vToTuple(nxtV))}`] = true;
          }
        }
      }
    }
    logs.push(`[节点 ${i}] 目标 MIDI=${tgt}, 存活的合法连接状态数: ${Object.keys(nextLayerLocal).length}`);
    if (Object.keys(nextLayerLocal).length === 0) {
      logs.push("-".repeat(50));
      logs.push("❌ 连通性异常：路径已断开");
      logs.push(`中断点: 节点 ${i} (目标 MIDI: ${tgt})`);
      logs.push(`在上一个节点 (MIDI: ${targetSequence[i-1]}) 时，可用的合法配置包含：`);
      const survivingChords = {};
      for (const stateKey of Object.keys(currentLayer)) {
        const cName = stateKey.split("|")[0];
        survivingChords[cName] = (survivingChords[cName] || 0) + 1;
      }
      for (const [c, count] of Object.entries(survivingChords)) {
        logs.push(` - ${c}: ${count} 个有效声部排列`);
      }
      break;
    }
    currentLayer = nextLayerLocal;
  }
  return logs.join("\n");
}

/**
 * 从DAG中提取下一拍可用和弦
 * @param {Array} dag - DAG层数组
 * @param {Array} history - 历史记录
 * @param {number} targetLength - 目标序列长度
 * @returns {string[]} 下一拍可用和弦列表
 */
function extractNextChordsFromDag(dag, history, targetLength) {
  if (history.length === 0) {
    return [...new Set(Object.values(dag[0]).map(s => s.chord))];
  } else if (history.length < targetLength) {
    const lastItem = history[history.length - 1];
    const lastKey = `${lastItem.chord}|${JSON.stringify(vToTuple(lastItem.voices))}`;
    const stateData = dag[history.length - 1][lastKey];
    if (stateData) {
      return [...new Set([...stateData.next].map(k => dag[history.length][k]).filter(Boolean).map(s => s.chord))];
    }
  }
  return [];
}

/**
 * 同步状态 —— 核心状态机方法
 * @param {string|null} action_chord - 用户选择的和弦名称（null表示仅刷新候选）
 *
 * 本方法是整个应用的核心状态机，处理三种模式的全部状态流转:
 *
 * 1. FREE模式（自由探索）:
 *    - 首拍: 选择最优初始声部排列
 *    - 后续: 使用Viterbi算法全局重优化整个序列
 *
 * 2. SOPRANO/BASS模式（高音题/低音题）:
 *    - 首拍: 从DAG初始层中选取匹配目标旋律的配置
 *    - 后续: 沿DAG路径前进，选择最优配置
 *    - 自动构建DAG并缓存
 *
 * 3. COMPOSE模式（旋律写作）:
 *    - 用户先选择旋律音（pending_note）
 *    - 系统筛选出包含该旋律音的合法和弦候选
 *    - 用户选择和弦后固化该步
 */
export function syncState(action_chord = null) {
  const key_info = get_key_info();
  const active_dna_db = get_active_dna();
  const shift = key_info.shift;

  store.debug_message = null;
  store.is_completed = false;

  // ===== 处理用户选择和弦动作 =====
  if (action_chord) {
    const target_chord = action_chord;

    if (store.mode === "SOPRANO" && store.target_melody.length > 0) {
      const dagLayers = get_cached_dag(store.key_name, store.target_melody, active_dna_db, key_info);
      if (dagLayers) processDagSelection(dagLayers, target_chord, shift);
    } else if (store.mode === "BASS" && store.target_bass.length > 0) {
      const dagLayers = get_cached_dag(store.key_name, store.target_bass, active_dna_db, key_info, 'B');
      if (dagLayers) processDagSelection(dagLayers, target_chord, shift);
    } else if (store.mode === "COMPOSE" && store.pending_note !== null) {
      // --- COMPOSE模式: 固定旋律音，筛选合法和弦 ---
      const tgt_s = store.pending_note;
      let valid_states = [];
      if (store.history.length === 0) {
        // 首拍: 无需检查声部进行，直接筛选包含该旋律音的和弦
        for (const v of getChordCandidates(target_chord, active_dna_db, tgt_s)) {
          valid_states.push([target_chord, vToTuple(v)]);
        }
      } else {
        // 后续: 需要检查与前和弦的声部进行是否合法
        const last_c = store.history[store.history.length - 1].chord;
        const last_v = store.history[store.history.length - 1].voices;
        for (const nxt_v of getChordCandidates(target_chord, active_dna_db, tgt_s)) {
          if (evaluateVoicing(last_v, nxt_v, last_c, target_chord, key_info) < 999999) {
            valid_states.push([target_chord, vToTuple(nxt_v)]);
          }
        }
      }
      if (valid_states.length > 0) {
        valid_states.sort((a, b) => scoreInitial(tupleToV(a[1]), shift) - scoreInitial(tupleToV(b[1]), shift));
        const best = valid_states[0];
        store.history.push({chord: best[0], voices: tupleToV(best[1])});
        store.target_melody.push(store.pending_note);
        store.pending_note = null;
      }
    } else if (store.mode === "FREE") {
      // --- FREE模式: 自由探索和声网络 ---
      if (store.history.length === 0) {
        // 首拍: 选择最舒适的初始声部排列
        const cands = getChordCandidates(target_chord, active_dna_db, null);
        if (cands.length > 0) {
          cands.sort((a, b) => scoreInitial(a, shift) - scoreInitial(b, shift));
          store.history.push({chord: target_chord, voices: cands[0]});
        }
      } else {
        // 后续: 使用Viterbi全局优化整个序列
        const chord_sequence = store.history.map(item => item.chord).concat(target_chord);
        const initial_voicing = store.history[0].voices;
        const global_path = calculateBestVoicing(chord_sequence, initial_voicing, active_dna_db, key_info, null);
        if (global_path) {
          store.history = chord_sequence.map((c, i) => ({chord: c, voices: global_path[i]}));
        }
      }
    }
  }

  // ===== 计算下一拍可用的和弦候选 =====
  let next_chords = [];

  if (store.mode === "SOPRANO" && store.target_melody.length > 0) {
    if (store.history.length === store.target_melody.length) {
      store.is_completed = true;
    }
    const dag = get_cached_dag(store.key_name, store.target_melody, active_dna_db, key_info);
    if (!dag || dag.length < store.target_melody.length) {
      store.debug_message = runDagProbe(store.target_melody, active_dna_db, key_info, 'S');
    } else {
      next_chords = extractNextChordsFromDag(dag, store.history, store.target_melody.length);
    }
  } else if (store.mode === "BASS" && store.target_bass.length > 0) {
    if (store.history.length === store.target_bass.length) {
      store.is_completed = true;
    }
    const dag = get_cached_dag(store.key_name, store.target_bass, active_dna_db, key_info, 'B');
    if (!dag || dag.length < store.target_bass.length) {
      store.debug_message = runDagProbe(store.target_bass, active_dna_db, key_info, 'B');
    } else {
      next_chords = extractNextChordsFromDag(dag, store.history, store.target_bass.length);
    }
  } else if (store.history.length === 0) {
    // 首拍候选计算
    if (store.mode === "COMPOSE" && store.pending_note !== null) {
      // 筛选包含当前旋律音的和弦
      for (const c_name of Object.keys(active_dna_db)) {
        if (getChordCandidates(c_name, active_dna_db, store.pending_note).length > 0) {
          next_chords.push(c_name);
        }
      }
    } else if (store.mode === "FREE") {
      // 自由模式下所有和弦都可用
      next_chords = Object.keys(active_dna_db);
    }
  } else {
    // 后续拍候选计算
    const last_item = store.history[store.history.length - 1];

    if (store.mode === "COMPOSE") {
      if (store.pending_note !== null) {
        // 有旋律音时: 从前一和弦的合法连接中筛选包含该旋律音的
        const last_c = last_item.chord;
        const last_v = last_item.voices;
        const possible_nexts = new Set();
        for (const nxt of active_dna_db[last_c]?.next || []) {
          possible_nexts.add(nxt);
          for (const sib of getChordSiblings(nxt, active_dna_db)) possible_nexts.add(sib);
        }
        for (const sib of getChordSiblings(last_c, active_dna_db)) possible_nexts.add(sib);

        for (const nxt_c of possible_nexts) {
          if (!(nxt_c in active_dna_db)) continue;
          for (const nxt_v of getChordCandidates(nxt_c, active_dna_db, store.pending_note)) {
            if (evaluateVoicing(last_v, nxt_v, last_c, nxt_c, key_info) < 999999) {
              next_chords.push(nxt_c);
              break;
            }
          }
        }
      }
    } else if (store.mode === "FREE") {
      // 自由模式: 从DNA连接关系+声部进行规则中筛选
      const last_c = last_item.chord;
      const last_v = last_item.voices;
      const possible_nexts = new Set();
      for (const nxt of active_dna_db[last_c]?.next || []) {
        possible_nexts.add(nxt);
        for (const sib of getChordSiblings(nxt, active_dna_db)) possible_nexts.add(sib);
      }
      for (const sib of getChordSiblings(last_c, active_dna_db)) possible_nexts.add(sib);

      for (const nxt_c of possible_nexts) {
        if (!(nxt_c in active_dna_db)) continue;
        for (const nxt_v of getChordCandidates(nxt_c, active_dna_db, null)) {
          if (evaluateVoicing(last_v, nxt_v, last_c, nxt_c, key_info) < 999999) {
            next_chords.push(nxt_c);
            break;
          }
        }
      }
    }
  }

  // ===== 死胡同检测 =====
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

  // 更新UI可用的和弦候选分类
  store.categories = categorizeChords(next_chords);
}

/**
 * 重置全局状态
 * 清空所有和声历史、旋律输入和状态标记，恢复到初始状态。
 */
export function resetState() {
  store.history = [];
  store.target_melody = [];
  store.target_bass = [];
  store.pending_note = null;
  store.playbackIndex = null;
  store.debug_message = null;
  store.is_completed = false;
  syncState();
}
