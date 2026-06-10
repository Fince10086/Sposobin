<template>
  <div class="app-container">
    <AppHeader @show-update="showUpdateReportModal = true" />

    <div class="main-layout">
      <ControlPanel @reset="handleReset" @show-help="openHelpModal" />

      <transition name="fade">
        <PianoSection
          v-if="store.mode !== 'FREE'"
          @piano-click="handlePianoClick"
          @start-soprano="handleStartSoprano"
        />
      </transition>

      <section class="score-section glass-card">
        <div class="toolbar">
          <div class="btn-group">
            <button @click="handlePlaySequence" class="modern-btn btn-success">
              <span class="icon">▶</span> 试听序列
            </button>
            <button @click="handleReset" class="modern-btn btn-danger">
              <span class="icon">🗑️</span> 清空画板
            </button>
          </div>
          <div class="hint-text">
            <span>💡 提示：点击五线谱上的和弦可将其 <b>断点回退</b></span>
          </div>
        </div>

        <ScoreRenderer />
      </section>

      <ChordPalette @select-chord="handleSelectChord" />
    </div>

    <UpdateModal :visible="showUpdateReportModal" @close="closeUpdateReportModal" />
    <HelpModal :visible="showHelpModal" :title="helpTitle" :rules="helpRules" @close="showHelpModal = false" />
    <DebugTerminal @close="store.debug_message = null" />
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue';
import { store, sync_state, reset_state } from '../engine/store.js';
import { useAudio } from '../composables/useAudio.js';
import { usePlayback } from '../composables/usePlayback.js';
import { usePiano } from '../composables/usePiano.js';

import AppHeader from '../components/layout/AppHeader.vue';
import ControlPanel from '../components/layout/ControlPanel.vue';
import PianoSection from '../components/input/PianoSection.vue';
import ChordPalette from '../components/layout/ChordPalette.vue';
import ScoreRenderer from '../ScoreRenderer.vue';
import UpdateModal from '../components/modal/UpdateModal.vue';
import HelpModal from '../components/modal/HelpModal.vue';
import DebugTerminal from '../components/display/DebugTerminal.vue';

const { playSingleChord } = useAudio();
const { startPlayback, resetPlayback } = usePlayback();
const { midiToNoteName } = usePiano();

const showUpdateReportModal = ref(false);
const showHelpModal = ref(false);
const seenModes = reactive({ FREE: false, SOPRANO: false, COMPOSE: false });

const helpData = {
  FREE: {
    title: '🎵 自由模式 · 使用规则',
    rules: [
      '💡 核心设定：完全无拘无束地自由探索斯波索宾功能级进。',
      '1. 解锁控制：你可以在该模式下任意切换左侧全局调性（换调将自动清空画板）。',
      '2. 极速算力：点击下方亮起的功能按钮，引擎会秒级为你算出教科书级的四部和声声部排列。',
      '3. 状态回溯：直接在五线谱上点击任意历史和弦，可以直接将其执行「断点回退」修改。'
    ]
  },
  SOPRANO: {
    title: '⚡ 高音题模式 · 使用规则',
    rules: [
      '💡 核心设定：经典旋律逆向配和声。给定指定高音曲线，寻求完美通路。',
      '1. 输入准备：请在下方的输入框中键入形如 \'C5 E5 G5\' 的音高文本，或直接在上方钢琴键盘点击弹奏录入音符。',
      '2. 路径生成：确定旋律后点击「生成推演路径」，引擎会为其全自动算出一条极其牢固的连通拓扑 DAG 图结构。',
      '3. 路径演进：根据下方弹出的候选功能按钮步步向前。如果某一处的声部进行导致断裂无法解开，系统会自动亮起终端帮你诊断违反了哪条传统古典音乐法则。'
    ]
  },
  COMPOSE: {
    title: '🎹 旋律写作模式 · 使用规则',
    rules: [
      '💡 核心设定：主旋律随心写作，和功能级进配置双重交互前进。',
      '1. 写作顺序：每一步都必须「先」在上方黄色钢琴键盘上点击选定当前步骤所需的「旋律音高」。',
      '2. 动态过滤：当敲定旋律音后（谱面上出现黄色问号节点），下方的候选功能组按钮会自动被引擎过滤并呈现出适合该音符的全部合法和弦。',
      '3. 固化步进：点击对应和弦即可固化四部声部位置，并等待输入下一个旋律音。所有声部进行均实时接受平行五八度与错位硬性阻断校验。'
    ]
  }
};

const helpTitle = ref(helpData.FREE.title);
const helpRules = ref(helpData.FREE.rules);

function openHelpModal() {
  const mode = store.mode;
  helpTitle.value = helpData[mode]?.title || helpData.FREE.title;
  helpRules.value = helpData[mode]?.rules || helpData.FREE.rules;
  showHelpModal.value = true;
}

function closeUpdateReportModal() {
  showUpdateReportModal.value = false;
  if (!seenModes[store.mode]) {
    openHelpModal();
    seenModes[store.mode] = true;
  }
}

watch(() => store.mode, (newMode) => {
  if (!seenModes[newMode] && !showUpdateReportModal.value) {
    helpTitle.value = helpData[newMode]?.title;
    helpRules.value = helpData[newMode]?.rules;
    showHelpModal.value = true;
    seenModes[newMode] = true;
  }
});

function handleReset() {
  resetPlayback();
  reset_state();
}

async function handlePlaySequence() {
  if (store.history.length === 0) return;
  await startPlayback(store.history);
}

function handlePianoClick(midi) {
  if (store.mode === 'COMPOSE') {
    store.pending_note = midi;
    sync_state();
  } else if (store.mode === 'SOPRANO') {
    const input = midiToNoteName(midi);
    // The PianoSection component handles its own input state,
    // but for soprano mode we need to pass it back somehow
    // For now, we'll just play it if in free mode
  } else {
    playSingleChord({ S: midi });
  }
}

function handleStartSoprano(inputText) {
  // Parse melody and trigger soprano mode
  // This needs to be handled - the piano section has its own input
  // We need to expose the melody input from PianoSection or handle it here
}

function handleSelectChord(chord) {
  sync_state(chord);
  if (store.history.length > 0) {
    playSingleChord(store.history[store.history.length - 1].voices);
  }
}

onMounted(() => {
  document.title = 'Sposobin Engine 1.1 - 斯波索宾和声写作台';
  const hasSeenUpdate = localStorage.getItem('seenUpdateReport1.1');
  if (!hasSeenUpdate) {
    showUpdateReportModal.value = true;
    localStorage.setItem('seenUpdateReport1.1', 'true');
  } else {
    helpTitle.value = helpData.FREE.title;
    helpRules.value = helpData.FREE.rules;
    showHelpModal.value = true;
    seenModes.FREE = true;
  }
  sync_state();
});
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

@font-face {
  font-family: 'Bravura';
  src: url('./fonts/Bravura.woff2') format('woff2');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

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

body {
  font-family: 'Inter', system-ui, sans-serif;
  background-color: var(--bg-color);
  color: var(--text-main);
  margin: 0;
  padding: 20px 0;
  -webkit-font-smoothing: antialiased;
}

.app-container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
.glass-card {
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
  padding: 20px;
  margin-bottom: 20px;
}

.score-section { margin-bottom: 20px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.btn-group { display: flex; gap: 12px; }
.hint-text { font-size: 13px; color: var(--text-muted); background: #F8FAFC; padding: 6px 12px; border-radius: 99px; }
.modern-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; border-radius: 10px; font-weight: 600; font-size: 14px; border: none; cursor: pointer; transition: all 0.2s; font-family: inherit; }
.modern-btn:active { transform: scale(0.96); }
.btn-success { background: var(--success); color: white; }
.btn-success:hover { background: #059669; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); }
.btn-danger { background: white; color: var(--danger); border: 1px solid #FECACA; }
.btn-danger:hover { background: #FEF2F2; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media screen and (max-width: 768px) {
  .toolbar { flex-direction: column; gap: 12px; align-items: stretch; }
  .btn-group { display: flex; width: 100%; }
  .btn-group .modern-btn { flex: 1; }
  .hint-text { text-align: center; }
}
</style>
