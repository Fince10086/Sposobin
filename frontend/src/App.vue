<template>
  <div class="app-container">
    <header class="app-header">
      <div class="top-right-actions">
        <button @click="showUpdateReportModal = true" class="modern-btn btn-primary update-top-btn">
          <span class="icon">🚀</span> 更新公告
        </button>
      </div>

      <div class="logo-area">
        <h1>Sposobin Engine <span class="badge">1.1</span></h1>
        <p class="subtitle">斯波索宾和声写作台</p>
        
        <div class="author-credits">
          <img src="https://github.com/Huaishu61.png" alt="青槐树的诗" class="github-avatar" />
          作者：<span class="author-name">青槐树的诗</span>
          <span class="divider">|</span>
          <a href="https://space.bilibili.com/381857406" target="_blank" class="author-link bilibili-link">
            <span class="link-icon">📺</span> B站主页
          </a>
          <span class="divider">|</span>
          <a href="https://github.com/Huaishu61" target="_blank" class="author-link github-link">
            <span class="link-icon">🐙</span> GitHub
          </a>
          <span class="divider">|</span>
          <span class="author-link qq-link">
            <span class="link-icon">👥</span> QQ群：850900762
          </span>
        </div>
      </div>
    </header>

    <div class="main-layout">
      <section class="control-panel glass-card">
        <div class="form-group">
          <label class="form-label">
            工作模式 (App Mode)
            <button @click="openHelpModal" class="help-trigger-btn" title="查看当前工作模式引导说明">❓</button>
          </label>
          <div class="segmented-control">
            <input type="radio" id="mode-free" name="mode" value="FREE" v-model="store.mode" @change="reset_state">
            <label for="mode-free">自由模式</label>
            <input type="radio" id="mode-soprano" name="mode" value="SOPRANO" v-model="store.mode" @change="reset_state">
            <label for="mode-soprano">高音题模式</label>
            <input type="radio" id="mode-compose" name="mode" value="COMPOSE" v-model="store.mode" @change="reset_state">
            <label for="mode-compose">旋律写作模式</label>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">全局调性 (Tonality)</label>
          <select v-model="store.key_name" @change="reset_state" class="modern-select">
            <option v-for="key in keys" :key="key" :value="key">{{ key }}</option>
          </select>
        </div>
      </section>

      <transition name="fade">
        <section v-if="store.mode !== 'FREE'" class="soprano-panel glass-card highlight-border">
          <div class="piano-wrapper">
            <div class="piano">
              <div v-for="note in pianoKeys" :key="note.midi" 
                   :class="['piano-key', note.isBlack ? 'black' : 'white']"
                   :style="{ left: note.x + 'px' }"
                   @click="onPianoClick(note.midi)">
                <span v-if="note.label" class="key-label">{{ note.label }}</span>
              </div>
            </div>
          </div>
          
          <div v-if="store.mode === 'SOPRANO'" class="soprano-input-area">
            <input type="text" v-model="melodyInput" class="modern-input" placeholder="输入序列，如 C5 Eb5 G5..." />
            <button @click="startSoprano" class="modern-btn btn-primary">
              <span class="icon">⚡</span> 生成推演路径
            </button>
          </div>
        </section>
      </transition>

      <section class="score-section glass-card">
        <div class="toolbar">
          <div class="btn-group">
            <button @click="playSequenceWithPlayhead" class="modern-btn btn-success">
              <span class="icon">▶</span> 试听序列
            </button>
            <button @click="reset_state" class="modern-btn btn-danger">
              <span class="icon">🗑️</span> 清空画板
            </button>
          </div>
          <div class="hint-text">
            <span>💡 提示：点击五线谱上的和弦可将其 <b>断点回退</b></span>
          </div>
        </div>

        <div class="score-container" ref="scoreContainerRef">
          <svg :width="Math.max(900, store.renderData.nodes.length * 85 + 150)" height="270" class="score-svg">
            <g class="staff-lines">
              <line v-for="i in 5" :key="'t'+i" x1="50" :y1="30 + i*10" x2="100%" :y2="30 + i*10" stroke="#94A3B8" stroke-width="1" />
              <line v-for="i in 5" :key="'b'+i" x1="50" :y1="160 + i*10" x2="100%" :y2="160 + i*10" stroke="#94A3B8" stroke-width="1" />
              <line x1="50" y1="40" x2="50" y2="210" stroke="#94A3B8" stroke-width="2" />
            </g>
            
            <text x="35" y="70" font-size="42" fill="#64748B" font-family="'Segoe UI Symbol'" dominant-baseline="central" text-anchor="middle">𝄞</text>
            <text x="35" y="180" font-size="38" fill="#64748B" font-family="'Segoe UI Symbol'" dominant-baseline="central" text-anchor="middle">𝄢</text>

            <g v-for="(sig, i) in store.renderData.sigs" :key="'sig'+i">
              <text :x="75 + i * 12" :y="sig.t_y" :dy="getAccDy(sig.sym)" font-size="26" fill="#334155" font-family="'Segoe UI Symbol'" dominant-baseline="central" text-anchor="middle">{{ sig.sym }}</text>
              <text :x="75 + i * 12" :y="sig.b_y" :dy="getAccDy(sig.sym)" font-size="26" fill="#334155" font-family="'Segoe UI Symbol'" dominant-baseline="central" text-anchor="middle">{{ sig.sym }}</text>
            </g>

            <g v-for="(node, index) in store.renderData.nodes" :key="index" 
               :transform="`translate(${95 + (store.renderData.sigs.length * 12) + index * 85}, 0)`"
               :class="{ 'clickable-node': node.type === 'history' }"
               @click="node.type === 'history' ? rewindTo(node.original_index) : null">
              
              <rect v-if="node.type === 'history'" x="-25" y="10" width="50" height="230" rx="8" class="hover-bg" />

              <text v-if="node.type === 'history'" x="0" y="20" text-anchor="middle" font-weight="bold" font-family="Georgia, serif" font-size="18" fill="#E11D48">{{ node.chord_display }}</text>
              
              <g v-for="note in node.notes" :key="note.v">
                <ellipse :cx="note.x" :cy="note.y" rx="8" ry="5.5" 
                         :fill="node.type === 'history' ? '#0F172A' : (node.type === 'pending' ? '#F59E0B' : 'transparent')"
                         :stroke="node.type === 'target' ? '#CBD5E1' : (node.type === 'pending' ? '#D97706' : 'none')"
                         :stroke-dasharray="node.type === 'target' ? '2,2' : 'none'" />
                <line :x1="note.x + (note.v === 'S' || note.v === 'T' ? 7 : -7)" :y1="note.y" 
                      :x2="note.x + (note.v === 'S' || note.v === 'T' ? 7 : -7)" :y2="note.v === 'S' || note.v === 'T' ? note.y - 25 : note.y + 25" 
                      :stroke="node.type === 'history' ? '#0F172A' : (node.type === 'pending' ? '#F59E0B' : '#CBD5E1')"
                      :stroke-dasharray="node.type === 'target' ? '2,2' : 'none'" stroke-width="1.5" />
                <text v-if="note.acc" :x="note.acc_x" :y="note.y" :dy="getAccDy(note.acc)" font-size="24" font-weight="bold" fill="#0F172A" font-family="'Segoe UI Symbol'" dominant-baseline="central">{{ note.acc }}</text>
                <line v-for="ly in note.ledgers" :key="ly" :x1="note.x - 13" :y1="ly" :x2="note.x + 13" :y2="ly" :stroke="node.type === 'target' ? '#CBD5E1' : '#0F172A'" stroke-width="1.5" />
              </g>
            </g>

            <g class="playhead-layer" v-if="store.history.length > 0 || store.target_melody.length > 0 || store.pending_note">
              <line :x1="playheadX" y1="15" :x2="playheadX" y2="235" stroke="#10B981" stroke-width="2" stroke-dasharray="4,2" />
              <polygon :points="`${playheadX-6},15 ${playheadX+6},15 ${playheadX},25`" fill="#10B981" />
            </g>
          </svg>
        </div>
      </section>

      <section class="categories-panel">
        <div v-if="Object.keys(store.categories.diatonic).length === 0 && Object.keys(store.categories.tonicization).length === 0" class="empty-state-msg glass-card">
          <div class="empty-icon">🧩</div>
          <h3>{{ store.mode === 'SOPRANO' ? (store.target_melody.length > 0 ? '引擎计算中或当前无可用连通路径' : '等待旋律输入') : (store.mode === 'COMPOSE' ? '请点击上方键盘选定起始音' : '引擎校验中，当前路径封锁') }}</h3>
          <p v-if="store.mode === 'SOPRANO' && store.target_melody.length > 0">请查看下方弹出的调试终端以诊断阻断位置。</p>
          <p v-else>请按规则完成前置操作以激活推演算法。</p>
        </div>

        <div class="panels-grid" v-else>
          <div class="left-panel modern-panel" v-if="Object.keys(store.categories.diatonic).length > 0">
            <h3 class="panel-header">自然音阶系统 (Diatonic)</h3>
            <div v-for="(chords, title) in store.categories.diatonic" :key="title" class="category-row">
              <div class="cat-title">{{ title }}</div>
              <div class="chord-btn-group">
                <button v-for="c in chords" :key="c" @click="sendAction(c)" class="modern-chord-btn">{{ c }}</button>
              </div>
            </div>
          </div>
          <div class="right-panel modern-panel" v-if="Object.keys(store.categories.tonicization).length > 0">
            <h3 class="panel-header" style="color: #8B5CF6;">离调与半音体系 (Chromatic)</h3>
            <div v-for="(chords, title) in store.categories.tonicization" :key="title" class="category-row">
              <div class="cat-title">{{ title }}</div>
              <div class="chord-btn-group">
                <button v-for="c in chords" :key="c" @click="sendAction(c)" class="modern-chord-btn tonic-btn">{{ c }}</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <transition name="modal">
      <div v-if="showUpdateReportModal" class="help-overlay" @click="closeUpdateReportModal">
        <div class="help-window" style="width: 560px;" @click.stop>
          <div class="help-header" style="background: linear-gradient(135deg, #0284C7, #0EA5E9); color: white;">
            <h3 style="color: white; display: flex; align-items: center; gap: 8px;">🚀 斯波索宾和声写作台 · 1.1 Pro 升级报告</h3>
            <button class="close-help-btn" style="color: rgba(255,255,255,0.8);" @click="closeUpdateReportModal">✕</button>
          </div>
          <div class="help-body" style="gap: 16px; max-height: 65vh; overflow-y: auto;">
            <div class="update-section">
              <h4 class="update-section-title">🏛️ 平台核心功能概述</h4>
              <p class="update-text">本平台是将经典的<b>斯波索宾《和声学》</b>体系进行完全数字化代码化的智能推演工程。严密把控平行五八度、声部交叉、四部音域约束及非法解决；提供自由级进探索、指定旋律高音题推演、旋律随心写作三大专业模式。</p>
            </div>
            
            <div class="update-section">
              <h4 class="update-section-title" style="color: #F59E0B;">🚀 1.1 Pro 重磅更新：高阶和声网络扩展与线性流动重构</h4>
              <ul class="update-list">
                <li><strong>线性对位引擎重构：</strong>彻底修复并重写了经过与辅助和弦的底层逻辑。完美支持经过四六和弦、自然音七和弦转位（如三四和弦）及二级六和弦的教科书级全平稳线性进行。</li>
                <li><strong>副功能与离调网络大扩充：</strong>全面实装“副下属和弦”体系；打通了 DTIII → D/VI、SII → DD 等复杂离调路径；首次开放向那不勒斯和弦（N6）的离调进行。</li>
                <li><strong>变音与特性和弦解锁：</strong>新增对属七和弦附加六音的全面支持与严格物理解决法则；解除增六和弦（It, Ger, Fr）死板的低音束缚；打通导七和弦各转位的特殊属性路径。</li>
                <li><strong>基础连通性修复：</strong>解决 S6 → D6 连接异常、同和弦转换跳进错误，以及 T6 → N6 后路径突然断链等致命缺陷。</li>
              </ul>
            </div>
            
            <div class="update-section">
              <h4 class="update-section-title" style="color: #10B981;">✨ 1.0 正式版重磅更新汇总</h4>
              <ul class="update-list">
                <li><b>🚄 零延迟云端状态算力缓存</b>：重构底层无状态算法，新增有状态指纹缓存。高音题推演拒绝每次重复刷新动态规划，实现客户端级别秒回。</li>
                <li><b>🎛️ 换调枷锁全面解禁</b>：彻底破除高音题与写作模式下的换调锁死，全模式自由调整 26 种大小调性，换调联动自动熔断画板。</li>
                <li><b>🛡️ 独家数字音频过载防爆保护</b>：前端集成  压限芯片与单通道 Headroom 空间控制，任凭快速点击叠加，声音绝不斩波破音。</li>
                <li><b>📊 会话快照与教材错题云提报</b>：终端断链诊断区及右上角新增一键反馈，可打包旋律与级进快照呈报至受密钥保护的后台面板（）。</li>
              </ul>
            </div>
          </div>
          <div class="help-footer">
            <button class="modern-btn btn-primary" style="background: #0EA5E9; width: 100%; padding-top: 12px; padding-bottom: 12px;" @click="closeUpdateReportModal">我知道了，开启和声推演</button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="modal">
      <div v-if="showHelpModal" class="help-overlay" @click="showHelpModal = false">
        <div class="help-window" @click.stop>
          <div class="help-header">
            <h3>{{ modeHelpData[currentHelpMode]?.title }}</h3>
            <button class="close-help-btn" @click="showHelpModal = false">✕</button>
          </div>
          <div class="help-body">
            <div v-for="(rule, idx) in modeHelpData[currentHelpMode]?.rules" :key="idx" class="help-rule-line">
              {{ rule }}
            </div>
          </div>
          <div class="help-footer">
            <button class="modern-btn btn-primary" @click="showHelpModal = false">开始使用</button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="modal">
      <div v-if="store.debug_message" class="terminal-overlay" @click="closeDebugModal">
        <div class="terminal-window" @click.stop>
          <div class="terminal-header">
            <div class="mac-dots">
              <span class="dot red" @click="closeDebugModal"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
            </div>
            <div class="terminal-title">bash - DAG_Debugger - 80x24</div>
          </div>
          <div class="terminal-body">
            <pre>{{ store.debug_message }}</pre>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch, nextTick } from 'vue';
import * as Tone from 'tone';
import { store, sync_state, reset_state } from './engine/store.js';
import { KEY_REGISTRY } from './engine/tonality.js';

const keys = Object.keys(KEY_REGISTRY);

const melodyInput = ref("");
const scoreContainerRef = ref(null);

const showUpdateReportModal = ref(false);
const showHelpModal = ref(false);
const currentHelpMode = ref("FREE");
const seenModes = reactive({ FREE: false, SOPRANO: false, COMPOSE: false });

let mainLimiter = null;
let globalSynth = null;

function initAudioEngine() {
  if (!mainLimiter) {
    mainLimiter = new Tone.Limiter(-1).toDestination();
  }
  if (!globalSynth) {
    globalSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "custom", partials: [1, 0.5] },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.8, release: 1.5 },
      volume: -14 
    }).connect(mainLimiter);
  }
}

const modeHelpData = {
  FREE: {
    title: "🎵 自由模式 · 使用规则",
    rules: [
      "💡 核心设定：完全无拘无束地自由探索斯波索宾功能级进。",
      "1. 解锁控制：你可以在该模式下任意切换左侧全局调性（换调将自动清空画板）。",
      "2. 极速算力：点击下方亮起的功能按钮，引擎会秒级为你算出教科书级的四部和声声部排列。",
      "3. 状态回溯：直接在五线谱上点击任意历史和弦，可以直接将其执行「断点回退」修改。"
    ]
  },
  SOPRANO: {
    title: "⚡ 高音题模式 · 使用规则",
    rules: [
      "💡 核心设定：经典旋律逆向配和声。给定指定高音曲线，寻求完美通路。",
      "1. 输入准备：请在下方的输入框中键入形如 'C5 E5 G5' 的音高文本，或直接在上方钢琴键盘点击弹奏录入音符。",
      "2. 路径生成：确定旋律后点击「生成推演路径」，引擎会为其全自动算出一条极其牢固的连通拓扑 DAG 图结构。",
      "3. 路径演进：根据下方弹出的候选功能按钮步步向前。如果某一处的声部进行导致断裂无法解开，系统会自动亮起终端帮你诊断违反了哪条传统古典音乐法则。"
    ]
  },
  COMPOSE: {
    title: "🎹 旋律写作模式 · 使用规则",
    rules: [
      "💡 核心设定：主旋律随心写作，和功能级进配置双重交互前进。",
      "1. 写作顺序：每一步都必须「先」在上方黄色钢琴键盘上点击选定当前步骤所需的「旋律音高」。",
      "2. 动态过滤：当敲定旋律音后（谱面上出现黄色问号节点），下方的候选功能组按钮会自动被引擎过滤并呈现出适合该音符的全部合法和弦。",
      "3. 固化步进：点击对应和弦即可固化四部声部位置，并等待输入下一个旋律音. 所有声部进行均实时接受平行五八度与错位硬性阻断校验。"
    ]
  }
};

function openHelpModal() {
  currentHelpMode.value = store.mode;
  showHelpModal.value = true;
}

function closeUpdateReportModal() {
  showUpdateReportModal.value = false;
  if (!seenModes[store.mode]) {
    currentHelpMode.value = store.mode;
    showHelpModal.value = true;
    seenModes[store.mode] = true;
  }
}

watch(() => store.mode, (newMode) => {
  if (!seenModes[newMode] && !showUpdateReportModal.value) {
    currentHelpMode.value = newMode;
    showHelpModal.value = true;
    seenModes[newMode] = true;
  }
});

const pianoKeys = [];
let whiteIndex = 0;
for (let m = 57; m <= 84; m++) {
  const isBlack = ![0, 2, 4, 5, 7, 9, 11].includes(m % 12);
  if (isBlack) { pianoKeys.push({ midi: m, isBlack: true, x: whiteIndex * 26 - 8 }); } 
  else { pianoKeys.push({ midi: m, isBlack: false, x: whiteIndex * 26, label: m % 12 === 0 ? `C${Math.floor(m/12)-1}` : '' }); whiteIndex++; }
}

const playheadX = computed(() => {
  const spacing = 85;
  const startX = 95 + (store.renderData.sigs.length * 12);
  if (store.playbackIndex !== null) return startX + store.playbackIndex * spacing;
  let idx = store.history.length;
  if (store.target_melody.length > 0 && idx < store.target_melody.length) return startX + idx * spacing;
  return startX + Math.max(0, store.history.length - 1) * spacing;
});

watch(playheadX, async (newX) => {
  await nextTick(); 
  if (!scoreContainerRef.value) return;
  const container = scoreContainerRef.value;
  const containerWidth = container.clientWidth;
  const goldenRatioOffset = containerWidth * 0.382; 
  const targetScrollLeft = newX - goldenRatioOffset;
  if (targetScrollLeft > 0) { container.scrollTo({ left: targetScrollLeft, behavior: 'smooth' }); } 
  else { container.scrollTo({ left: 0, behavior: 'smooth' }); }
});

function getAccDy(sym) {
  if (!sym) return 0;
  if (sym.includes('♭')) return -6; 
  if (sym.includes('♯')) return 1;  
  return 0; 
}

function parseMelodyStr(text) {
  const noteNames = { 'C':0, 'D':2, 'E':4, 'F':5, 'G':7, 'A':9, 'B':11 };
  const tokens = text.match(/([A-Ga-g])(bb|b|♭|##|x|#|♯)?\s*(\d)/g);
  if (!tokens) return [];
  return tokens.map(token => {
    const match = token.match(/([A-Ga-g])(bb|b|♭|##|x|#|♯)?\s*(\d)/);
    const base = noteNames[match[1].toUpperCase()];
    let alt = 0;
    if (match[2]) {
      if (['#', '♯'].includes(match[2])) alt = 1;
      else if (['##', 'x'].includes(match[2])) alt = 2;
      else if (['b', '♭'].includes(match[2])) alt = -1;
      else if (match[2] === 'bb') alt = -2;
    }
    return (parseInt(match[3], 10) + 1) * 12 + base + alt;
  });
}

function rewindTo(index) {
  store.history = store.history.slice(0, index + 1);
  store.pending_note = null;
  sync_state();
}

function closeDebugModal() {
  store.debug_message = null;
}

async function playSingleChord(voices) {
  await Tone.start();
  initAudioEngine();
  const freqs = Object.values(voices).map(midi => Tone.Frequency(midi, "midi").toFrequency());
  globalSynth.triggerAttackRelease(freqs, "2n");
}

async function playSequenceWithPlayhead() {
  if (store.history.length === 0) return;
  await Tone.start();
  initAudioEngine();
  Tone.Transport.cancel(); 
  const seqSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "custom", partials: [1, 0.5] },
    envelope: { attack: 0.05, decay: 0.2, sustain: 0.8, release: 1.5 },
    volume: -14
  }).connect(mainLimiter);
  const now = Tone.now();
  const duration = 1.0; 
  store.history.forEach((item, index) => {
    const freqs = Object.values(item.voices).map(midi => Tone.Frequency(midi, "midi").toFrequency());
    seqSynth.triggerAttackRelease(freqs, duration, now + index * duration);
    setTimeout(() => {
      store.playbackIndex = index;
      if (index === store.history.length - 1) setTimeout(() => { store.playbackIndex = null; }, duration * 1000);
    }, index * duration * 1000);
  });
  setTimeout(() => { seqSynth.dispose(); }, (store.history.length * duration + 2) * 1000);
}

function onPianoClick(midi) {
  if (store.mode === 'COMPOSE') {
    store.pending_note = midi;
    sync_state();
  } else if (store.mode === 'SOPRANO') {
    const noteNames = ["C","C#","D","Eb","E","F","F#","G","Ab","A","Bb","B"];
    melodyInput.value += (melodyInput.value ? " " : "") + `${noteNames[midi%12]}${Math.floor(midi/12)-1}`;
  } else {
    playSingleChord({'S': midi}); 
  }
}

function startSoprano() {
  store.target_melody = parseMelodyStr(melodyInput.value);
  if (store.target_melody.length > 0) sync_state();
}

function sendAction(c) { 
  sync_state(c); 
  if (store.history.length > 0) {
    playSingleChord(store.history[store.history.length - 1].voices);
  }
}

onMounted(() => {
  document.title = "Sposobin Engine 1.0 - 斯波索宾和声写作台";
  const hasSeenUpdate = localStorage.getItem("seenUpdateReport1.0");
  if (!hasSeenUpdate) {
    showUpdateReportModal.value = true;
    localStorage.setItem("seenUpdateReport1.0", "true");
  } else {
    currentHelpMode.value = "FREE";
    showHelpModal.value = true;
    seenModes.FREE = true;
  }
  sync_state();
});
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  --bg-color: #F1F5F9;
  --surface: #FFFFFF;
  --primary: #0EA5E9;
  --primary-hover: #0284C7;
  --text-main: #1E293B;
  --text-muted: #64748B;
  --border: #E2E8F0;
  --danger: #EF4444;
  --success: #10B981;
  --radius-lg: 16px;
  --radius-md: 8px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.05);
  --shadow-lg: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01);
}

body { font-family: 'Inter', system-ui, sans-serif; background-color: var(--bg-color); color: var(--text-main); margin: 0; padding: 20px 0; -webkit-font-smoothing: antialiased; }
.app-container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }

.app-header { margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }

.logo-area { text-align: left; }

.top-right-actions { display: flex; gap: 8px; z-index: 50; flex-wrap: wrap; justify-content: flex-end; }
.update-top-btn { border-radius: 8px !important; box-shadow: var(--shadow-sm); padding: 8px 16px !important; font-size: 13px !important; }
.update-top-btn { background: #0EA5E9; color: white; }
.update-top-btn:hover { background: #0284C7; }

.logo-area h1 { font-size: 28px; font-weight: 700; color: var(--text-main); margin: 0 0 8px 0; letter-spacing: -0.5px;}
.badge { font-size: 12px; background: linear-gradient(135deg, #F59E0B, #EF4444); color: white; padding: 4px 10px; border-radius: 99px; vertical-align: middle; margin-left: 8px; font-weight: 600; }
.subtitle { color: var(--text-muted); font-size: 16px; font-weight: 500; margin: 0 0 8px 0; letter-spacing: 0.5px; }

.author-credits { font-size: 13px; color: var(--text-muted); display: flex; align-items: center; justify-content: flex-start; gap: 8px; margin-top: 12px; }
.author-name { font-weight: 600; color: var(--text-main); }
.divider { color: #CBD5E1; }
.author-link { text-decoration: none; font-weight: 500; display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 6px; transition: all 0.2s; }
.bilibili-link { color: #F472B6; background-color: #FDF2F8; }
.bilibili-link:hover { color: #DB2777; background-color: #FCE7F3; text-decoration: underline; }
.github-link { color: #334155; background-color: #F1F5F9; }
.github-link:hover { color: #0F172A; background-color: #E2E8F0; text-decoration: underline; }
.qq-link { color: #0284C7; background-color: #F0F9FF; font-weight: 600; }
.link-icon { font-size: 12px; }
.github-avatar { width: 24px; height: 24px; border-radius: 50%; border: 1.5px solid #CBD5E1; object-fit: cover; box-shadow: var(--shadow-sm); }

.help-trigger-btn { background: none; border: none; cursor: pointer; font-size: 14px; margin-left: 6px; padding: 0; display: inline-flex; align-items: center; justify-content: center; opacity: 0.7; transition: opacity 0.2s; vertical-align: middle; }
.help-trigger-btn:hover { opacity: 1; transform: scale(1.1); }
.help-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.help-window { width: 480px; max-width: 90vw; background: var(--surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); overflow: hidden; border: 1px solid var(--border); display: flex; flex-direction: column; animation: helpPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes helpPopIn { from { opacity: 0; transform: translateY(15px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
.help-header { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: #F8FAFC; }
.help-header h3 { margin: 0; font-size: 16px; font-weight: 700; color: var(--text-main); }
.close-help-btn { background: none; border: none; cursor: pointer; font-size: 18px; color: var(--text-muted); transition: color 0.2s; }
.close-help-btn:hover { color: var(--danger); }
.help-body { padding: 22px 20px; display: flex; flex-direction: column; gap: 14px; }
.help-rule-line { font-size: 14px; line-height: 1.6; color: #334155; text-align: left; }
.help-footer { padding: 14px 20px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; background: #F8FAFC; }

.update-section { border-bottom: 1px dashed var(--border); padding-bottom: 14px; text-align: left; }
.update-section:last-child { border: none; padding: 0; }
.update-section-title { font-size: 14px; font-weight: 700; color: #0284C7; margin: 0 0 8px 0; }
.update-text { font-size: 13px; color: #475569; line-height: 1.6; margin: 0; }
.update-list { list-style-type: disc; padding-left: 18px; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.update-list li { font-size: 13px; color: #334155; line-height: 1.5; }

.glass-card { background: var(--surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--border); padding: 20px; margin-bottom: 20px; }
.highlight-border { border-color: #FCD34D; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.05); }
.control-panel { display: flex; gap: 30px; align-items: center; justify-content: center; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-label { font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }

.segmented-control { display: flex; background: #F1F5F9; padding: 4px; border-radius: 10px; }
.segmented-control input[type="radio"] { display: none; }
.segmented-control label { padding: 8px 20px; cursor: pointer; border-radius: 8px; font-weight: 500; font-size: 14px; color: var(--text-muted); transition: all 0.2s ease; }
.segmented-control input[type="radio"]:checked + label { background: white; color: var(--primary); box-shadow: var(--shadow-sm); }

.modern-select { padding: 10px 16px; border-radius: 10px; border: 1px solid var(--border); background: var(--surface); font-size: 14px; font-family: 'Inter'; color: var(--text-main); cursor: pointer; outline: none; transition: 0.2s; }
.modern-select:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1); }

.soprano-panel { display: flex; align-items: center; gap: 30px; background: #FEF3C7; }
.piano-wrapper { background: white; padding: 10px; border-radius: 12px; border: 1px solid #FDE68A; }
.piano { position: relative; height: 105px; width: 450px; }
.piano-key { position: absolute; cursor: pointer; border: 1px solid #334155; border-radius: 0 0 4px 4px; transition: 0.1s; box-sizing: border-box;}
.piano-key.white { width: 26px; height: 105px; background: white; z-index: 1; }
.piano-key.white:active { background: #E2E8F0; }
.piano-key.black { width: 16px; height: 60px; background: #1E293B; z-index: 2; }
.piano-key.black:active { background: #475569; }
.key-label { position: absolute; bottom: 5px; left: 0; width: 100%; text-align: center; font-size: 10px; color: #94A3B8; font-weight: 500;}

.soprano-input-area { display: flex; flex-direction: column; gap: 12px; flex: 1; }
.modern-input { padding: 12px 16px; border-radius: 10px; border: 1px solid #FCD34D; font-family: monospace; font-size: 15px; outline: none; transition: 0.2s; width: 100%; box-sizing: border-box; }
.modern-input:focus { border-color: #F59E0B; box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1); }

.modern-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; border-radius: 10px; font-weight: 600; font-size: 14px; border: none; cursor: pointer; transition: all 0.2s; font-family: inherit;}
.modern-btn:active { transform: scale(0.96); }
.btn-primary { background: var(--primary); color: white; }
.btn-primary:hover { background: var(--primary-hover); box-shadow: 0 4px 12px rgba(14, 165, 233, 0.2); }
.btn-success { background: var(--success); color: white; }
.btn-success:hover { background: #059669; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); }
.btn-danger { background: white; color: var(--danger); border: 1px solid #FECACA; }
.btn-danger:hover { background: #FEF2F2; }

.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.btn-group { display: flex; gap: 12px; }
.hint-text { font-size: 13px; color: var(--text-muted); background: #F8FAFC; padding: 6px 12px; border-radius: 99px; }
.score-container { overflow-x: auto; overflow-y: hidden; background: white; border-radius: var(--radius-md); border: 1px solid var(--border); user-select: none; }
.score-svg { display: block; }
.clickable-node { cursor: pointer; }
.clickable-node .hover-bg { fill: transparent; transition: 0.2s; }
.clickable-node:hover .hover-bg { fill: rgba(14, 165, 233, 0.05); }

.panels-grid { display: flex; gap: 24px; }
.modern-panel { flex: 1; background: #F8FAFC; border-radius: var(--radius-lg); padding: 20px; border: 1px solid var(--border); }
.panel-header { margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: var(--primary); }
.category-row { margin-bottom: 20px; }
.cat-title { font-size: 13px; font-weight: 600; color: var(--text-muted); margin-bottom: 10px; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; text-transform: uppercase;}
.chord-btn-group { display: flex; flex-wrap: wrap; gap: 8px; }
.modern-chord-btn { background: white; border: 1px solid #BAE6FD; color: #0284C7; padding: 8px 16px; border-radius: 8px; font-family: Georgia, serif; font-size: 16px; font-weight: bold; cursor: pointer; transition: 0.2s; box-shadow: var(--shadow-sm); }
.modern-chord-btn:hover { background: #F0F9FF; transform: translateY(-2px); box-shadow: 0 4px 6px rgba(14, 165, 233, 0.1); border-color: #7DD3FC;}
.tonic-btn { border-color: #DDD6FE; color: #6D28D9; }
.tonic-btn:hover { background: #F5F3FF; border-color: #C4B5FD; box-shadow: 0 4px 6px rgba(139, 92, 246, 0.1); }

.terminal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 999; }
.terminal-window { width: 700px; max-width: 90vw; background: #1E1E1E; border-radius: 10px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); overflow: hidden; border: 1px solid #333; }
.terminal-header { background: #2D2D2D; padding: 12px 16px; display: flex; align-items: center; position: relative; }
.mac-dots { display: flex; gap: 8px; position: absolute; }
.dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; cursor: pointer; transition: 0.2s;}
.dot:hover { opacity: 0.8; }
.dot.red { background: #FF5F56; }
.dot.yellow { background: #FFBD2E; }
.dot.green { background: #27C93F; }
.terminal-title { width: 100%; text-align: center; color: #999; font-size: 13px; font-family: monospace; }
.terminal-body { padding: 20px; max-height: 60vh; overflow-y: auto; }
.terminal-body pre { font-family: 'Consolas', 'Monaco', monospace; font-size: 14px; color: #D4D4D4; line-height: 1.5; margin: 0; white-space: pre-wrap; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.modal-enter-active, .modal-leave-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: translateY(20px) scale(0.95); }

/* =========================================
   📱 移动端适配 (Mobile Responsiveness)
   ========================================= */
@media screen and (max-width: 768px) {
  .app-header {
    flex-direction: column-reverse;
    align-items: center;
  }
  .logo-area {
    text-align: center;
  }
  .author-credits {
    justify-content: center;
  }
  .top-right-actions {
    position: static;
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
    width: 100%;
  }
  .author-credits {
    flex-wrap: wrap;
    line-height: 2;
  }
  .divider {
    display: none;
  }
  .control-panel {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  .segmented-control {
    flex-wrap: wrap;
    justify-content: center;
  }
  .segmented-control label {
    flex: 1;
    text-align: center;
    padding: 8px 10px;
    font-size: 13px;
  }
  .soprano-panel {
    flex-direction: column;
    gap: 20px;
    padding: 16px;
  }
  .piano-wrapper {
    width: 100%;
    overflow-x: auto;
    padding: 10px 0;
    -webkit-overflow-scrolling: touch;
  }
  .toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  .btn-group {
    display: flex;
    width: 100%;
  }
  .btn-group .modern-btn {
    flex: 1;
  }
  .panels-grid {
    flex-direction: column;
    gap: 16px;
  }
  .help-window, 
  .terminal-window {
    width: 90vw !important;
    max-width: none;
    margin: 0 auto;
  }
  .terminal-body pre {
    font-size: 12px;
  }
}
</style>
