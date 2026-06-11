/**
 * MIDI 文件导出器
 *
 * 将当前和声进行导出为标准 MIDI 文件 (SMF Format 1)。
 * 使用原生 JS 写入二进制 SMF 格式，无需外部库。
 */

import { KEY_REGISTRY } from '../engine/tonality/index.js';

/** 时间分辨率: 960 ticks/四分音符 */
const TICKS_PER_QUARTER = 960;
/** 全音符 ticks (4 拍) */
const TICKS_PER_WHOLE = TICKS_PER_QUARTER * 4;
/** 默认 BPM */
const DEFAULT_BPM = 120;
/** 每拍微秒数 */
const MICROSECONDS_PER_BEAT = Math.round(60_000_000 / DEFAULT_BPM);

/**
 * 将整数写入 Uint8Array（大端序）
 */
function writeUint16BE(arr, offset, value) {
  arr[offset] = (value >> 8) & 0xFF;
  arr[offset + 1] = value & 0xFF;
}

function writeUint24BE(arr, offset, value) {
  arr[offset] = (value >> 16) & 0xFF;
  arr[offset + 1] = (value >> 8) & 0xFF;
  arr[offset + 2] = value & 0xFF;
}

function writeUint32BE(arr, offset, value) {
  arr[offset] = (value >> 24) & 0xFF;
  arr[offset + 1] = (value >> 16) & 0xFF;
  arr[offset + 2] = (value >> 8) & 0xFF;
  arr[offset + 3] = value & 0xFF;
}

/**
 * 写入可变长度值 (Variable Length Quantity)
 * 返回写入的字节数
 */
function writeVLQ(arr, offset, value) {
  const bytes = [];
  let v = value;
  do {
    bytes.unshift((v & 0x7F) | 0x80);
    v >>= 7;
  } while (v > 0);
  bytes[bytes.length - 1] &= 0x7F; // 最后一个字节最高位为0
  for (let i = 0; i < bytes.length; i++) {
    arr[offset + i] = bytes[i];
  }
  return bytes.length;
}

/**
 * 构建一个音轨的数据
 * @param {Array} events - 事件数组，每个事件: { delta, data: Uint8Array }
 * @returns {Uint8Array} 完整的音轨块
 */
function buildTrack(events) {
  // 计算总长度
  let totalLen = 0;
  for (const ev of events) {
    totalLen += 4; // 最大VLQ长度（保守估计）
    totalLen += ev.data.length;
  }

  const track = new Uint8Array(8 + totalLen);
  // MTrk header
  track[0] = 0x4D; track[1] = 0x54; track[2] = 0x72; track[3] = 0x6B;

  let pos = 8;
  for (const ev of events) {
    const vlqLen = writeVLQ(track, pos, ev.delta);
    pos += vlqLen;
    track.set(ev.data, pos);
    pos += ev.data.length;
  }

  // 写入实际长度
  writeUint32BE(track, 4, pos - 8);
  return track.slice(0, pos);
}

/**
 * 创建 Meta 事件数据
 */
function metaEvent(type, data) {
  const result = new Uint8Array(2 + 1 + data.length);
  result[0] = 0xFF;
  result[1] = type;
  result[2] = data.length;
  result.set(data, 3);
  return result;
}

/**
 * 创建 MIDI 音符事件
 * @param {number} channel - 通道号 (0-15)
 * @param {boolean} on - true=Note On, false=Note Off
 * @param {number} note - MIDI 音符编号
 * @param {number} velocity - 力度 (0-127)
 */
function noteEvent(channel, on, note, velocity) {
  return new Uint8Array([
    on ? (0x90 | channel) : (0x80 | channel),
    note & 0x7F,
    velocity & 0x7F
  ]);
}

/**
 * 导出为 MIDI 文件
 * @param {Array} history - 和声进行历史 [{chord, voices: {S,A,T,B}}]
 * @param {string} keyName - 调性名称
 * @param {string} filename - 输出文件名
 */
export function exportToMidi(history, keyName, filename = 'sposobin_export.mid') {
  if (!history || history.length === 0) return;

  const keyInfo = KEY_REGISTRY[keyName] || KEY_REGISTRY['C 大调'];
  const sf = keyInfo.sig_type === 'flat' ? -keyInfo.sigs : keyInfo.sigs;
  const mi = keyInfo.type === 'MINOR' ? 1 : 0;

  // ===== Track 0: Meta Track =====
  const metaEvents = [];

  // Track Name
  metaEvents.push({ delta: 0, data: metaEvent(0x03, new TextEncoder().encode('Meta')) });

  // Time Signature: 4/4
  metaEvents.push({ delta: 0, data: metaEvent(0x58, new Uint8Array([4, 2, 24, 8])) });

  // Key Signature
  metaEvents.push({ delta: 0, data: metaEvent(0x59, new Uint8Array([sf & 0xFF, mi])) });

  // Set Tempo (120 BPM)
  const tempoBytes = new Uint8Array([
    (MICROSECONDS_PER_BEAT >> 16) & 0xFF,
    (MICROSECONDS_PER_BEAT >> 8) & 0xFF,
    MICROSECONDS_PER_BEAT & 0xFF
  ]);
  metaEvents.push({ delta: 0, data: metaEvent(0x51, tempoBytes) });

  // End of Track
  metaEvents.push({ delta: TICKS_PER_WHOLE * history.length, data: metaEvent(0x2F, new Uint8Array(0)) });

  const metaTrack = buildTrack(metaEvents);

  // ===== Track 1-4: S/A/T/B =====
  const voiceOrder = ['S', 'A', 'T', 'B'];
  const voiceNames = ['Soprano', 'Alto', 'Tenor', 'Bass'];
  const tracks = [metaTrack];

  for (let vi = 0; vi < 4; vi++) {
    const voice = voiceOrder[vi];
    const events = [];

    // Track Name
    events.push({ delta: 0, data: metaEvent(0x03, new TextEncoder().encode(voiceNames[vi])) });

    // 每个和弦四拍（全音符）
    for (let i = 0; i < history.length; i++) {
      const note = history[i].voices[voice];

      // Note On (velocity=80) — 紧跟在 Note Off 之后（delta=0）
      events.push({ delta: 0, data: noteEvent(vi, true, note, 80) });
      // Note Off (velocity=0) — 四拍后停止
      events.push({ delta: TICKS_PER_WHOLE, data: noteEvent(vi, false, note, 0) });
    }

    // End of Track
    events.push({ delta: 0, data: metaEvent(0x2F, new Uint8Array(0)) });

    tracks.push(buildTrack(events));
  }

  // ===== 构建文件头 =====
  const header = new Uint8Array(14);
  header[0] = 0x4D; header[1] = 0x54; header[2] = 0x68; header[3] = 0x64; // MThd
  writeUint32BE(header, 4, 6); // header length
  writeUint16BE(header, 8, 1); // format 1 (多轨)
  writeUint16BE(header, 10, 5); // 5 tracks (1 meta + 4 voices)
  writeUint16BE(header, 12, TICKS_PER_QUARTER); // ticks per quarter

  // ===== 合并所有数据 =====
  let totalSize = header.length;
  for (const t of tracks) totalSize += t.length;

  const file = new Uint8Array(totalSize);
  let pos = 0;
  file.set(header, pos); pos += header.length;
  for (const t of tracks) {
    file.set(t, pos);
    pos += t.length;
  }

  // ===== 触发下载 =====
  const blob = new Blob([file], { type: 'audio/midi' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
