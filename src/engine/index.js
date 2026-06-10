/**
 * 引擎层统一导出模块
 *
 * 本模块作为整个和声推演引擎的公共API入口，集中导出所有核心功能:
 *   - 状态管理: store, sync_state, reset_state
 *   - 候选生成: getChordCandidates
 *   - DAG构建: buildFullDag
 *   - 路径搜索: calculateBestVoicing
 *   - 规则评估: evaluateVoicing
 *   - 调性处理: KEY_REGISTRY, transpose_dna, spell_midi
 *   - 数据访问: MAJOR_DNA, MINOR_DNA, PITCH_Y, AVAILABLE_NOTES
 *   - 工具函数: v_to_tuple, tuple_to_v, get_chord_siblings, format_chord_name, categorize_chords
 *
 * 外部模块（Vue组件、composables）应通过此入口访问引擎功能，
 * 而非直接导入深层模块，以降低耦合度。
 */

export { store, sync_state, reset_state } from './store.js';
export { getChordCandidates } from './core/candidateEngine.js';
export { buildFullDag } from './core/dagBuilder.js';
export { calculateBestVoicing } from './core/viterbi.js';
export { evaluateVoicing } from './rules/index.js';
export { KEY_REGISTRY, transpose_dna, spell_midi } from './tonality/index.js';
export { MAJOR_DNA, MINOR_DNA, PITCH_Y, AVAILABLE_NOTES } from './data/index.js';
export { v_to_tuple, tuple_to_v, get_chord_siblings, format_chord_name, categorize_chords } from './utils/index.js';
