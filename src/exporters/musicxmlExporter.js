/**
 * MusicXML 文件导出器 — 钢琴大谱表格式
 *
 * 将当前和声进行导出为压缩的 MusicXML (.mxl) 文件。
 * 使用钢琴大谱表（Grand Staff）：高音谱表含 S/A，低音谱表含 T/B。
 * 每个和弦写成全音符，填满一小节（4/4 拍）。
 * 使用 <backup> 实现多声部独立时间线。
 */

import { zipSync, strToU8 } from 'fflate';
import { KEY_REGISTRY, spell_midi } from '../engine/tonality/index.js';

/** 一个小节 = 4 拍，divisions=1 时 quarter=1，故全音符 duration=4 */
const WHOLE_DURATION = 4;

/**
 * 转义 XML 特殊字符
 */
function xmlEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * 生成单个音符的 MusicXML
 */
function noteXml(midi, keyInfo, voiceNum, staffNum) {
  const [letter, , alt, octave] = spell_midi(midi, keyInfo, '');
  const alterTag = alt !== 0 ? `<alter>${alt}</alter>` : '';

  return `
      <note>
        <pitch>
          <step>${letter}</step>${alterTag}
          <octave>${octave}</octave>
        </pitch>
        <duration>${WHOLE_DURATION}</duration>
        <type>whole</type>
        <voice>${voiceNum}</voice>
        <staff>${staffNum}</staff>
      </note>`;
}

/**
 * 生成 backup 标签（回退到小节开头）
 */
function backupXml(duration) {
  return `
      <backup>
        <duration>${duration}</duration>
      </backup>`;
}

/**
 * 导出为 MusicXML (.mxl) 文件
 * @param {Array} history - 和声进行历史
 * @param {string} keyName - 调性名称
 * @param {string} filename - 输出文件名
 */
export function exportToMusicXML(history, keyName, filename = 'sposobin_export.mxl') {
  if (!history || history.length === 0) return;

  const keyInfo = KEY_REGISTRY[keyName] || KEY_REGISTRY['C 大调'];
  const keyInfoWithMode = { ...keyInfo, app_mode: 'FREE' };
  const fifths = keyInfo.sig_type === 'flat' ? -keyInfo.sigs : keyInfo.sigs;
  const mode = keyInfo.type === 'MINOR' ? 'minor' : 'major';

  // 声部定义：voice 编号, staff 编号, MIDI 键名
  const voices = [
    { key: 'S', voice: 1, staff: 1 },
    { key: 'A', voice: 2, staff: 1 },
    { key: 'T', voice: 3, staff: 2 },
    { key: 'B', voice: 4, staff: 2 },
  ];

  let measuresXml = '';

  for (let i = 0; i < history.length; i++) {
    const item = history[i];
    const isFirst = i === 0;
    const measureNum = i + 1;

    // 第一小节的 attributes
    let attrsXml = '';
    if (isFirst) {
      attrsXml = `
      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>${fifths}</fifths>
          <mode>${mode}</mode>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <staves>2</staves>
        <clef number="1">
          <sign>G</sign>
          <line>2</line>
        </clef>
        <clef number="2">
          <sign>F</sign>
          <line>4</line>
        </clef>
      </attributes>`;
    }

    // 和弦标记
    const markXml = `
      <direction placement="above">
        <direction-type>
          <words default-y="40" font-size="11">${xmlEscape(item.chord)}</words>
        </direction-type>
      </direction>`;

    // 四个声部的音符，用 backup 分隔
    let notesXml = '';
    for (let vi = 0; vi < voices.length; vi++) {
      const v = voices[vi];
      if (vi > 0) {
        notesXml += backupXml(WHOLE_DURATION);
      }
      notesXml += noteXml(item.voices[v.key], keyInfoWithMode, v.voice, v.staff);
    }

    measuresXml += `
    <measure number="${measureNum}">${attrsXml}${markXml}${notesXml}
    </measure>`;
  }

  // 完整 MusicXML
  const scoreXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1">
      <part-name>Piano</part-name>
      <part-abbreviation>Pno.</part-abbreviation>
    </score-part>
  </part-list>
  <part id="P1">${measuresXml}
  </part>
</score-partwise>`;

  // META-INF/container.xml
  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container>
  <rootfiles>
    <rootfile full-path="score.xml"/>
  </rootfiles>
</container>`;

  // 使用 fflate 压缩为 ZIP
  const zipData = zipSync({
    'META-INF/container.xml': strToU8(containerXml),
    'score.xml': strToU8(scoreXml),
  });

  // 触发下载
  const blob = new Blob([zipData], { type: 'application/vnd.recordare.musicxml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
