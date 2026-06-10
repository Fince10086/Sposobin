/**
 * 工具函数统一导出模块
 *
 * 本模块集中导出引擎层使用的所有通用工具函数:
 *   - v_to_tuple / tuple_to_v: 声部对象的序列化与反序列化
 *   - get_chord_siblings: 获取和弦的兄弟姐妹（同功能不同转位）
 *   - format_chord_name: 和弦名称格式化（显示用）
 *   - categorize_chords: 和弦功能分组分类
 *
 * 通过统一入口导入可简化模块依赖管理。
 */

export { v_to_tuple, tuple_to_v, get_chord_siblings } from './voicing.js';
export { format_chord_name, categorize_chords } from './formatter.js';
