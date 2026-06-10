<template>
  <div class="app-container">
    <AppHeader 
      @mode-change="handleModeChange" 
      @show-about="showAboutModal('help')"
      @show-update="showAboutModal('update')"
    />

    <div class="main-layout">
      <transition name="fade">
        <PianoSection
          v-if="store.mode !== 'FREE'"
          @piano-click="handlePianoClick"
          @start-soprano="handleStartSoprano"
        />
      </transition>

      <section class="score-section glass-card">
        <div class="toolbar">
          <div class="toolbar-left">
            <select v-model="store.key_name" @change="handleReset" class="key-select">
              <option v-for="key in keys" :key="key" :value="key">{{ key }}</option>
            </select>
          </div>
          <div class="toolbar-right">
            <button @click="handlePlaySequence" class="btn btn-primary" :disabled="store.history.length === 0">
              试听序列
            </button>
            <button @click="handleReset" class="btn btn-danger">
              清空
            </button>
          </div>
        </div>

        <ScoreRenderer />
      </section>

      <ChordPalette @select-chord="handleSelectChord" />
    </div>

    <AboutModal :visible="showAboutModalFlag" :initial-tab="aboutModalTab" @close="closeAboutModal" />
    <DebugTerminal @close="store.debug_message = null" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { store, sync_state, reset_state } from '../engine/store.js';
import { KEY_REGISTRY } from '../engine/tonality/index.js';
import { useAudio } from '../composables/useAudio.js';
import { usePlayback } from '../composables/usePlayback.js';
import { usePiano } from '../composables/usePiano.js';

import AppHeader from '../components/layout/AppHeader.vue';
import PianoSection from '../components/input/PianoSection.vue';
import ChordPalette from '../components/layout/ChordPalette.vue';
import ScoreRenderer from '../ScoreRenderer.vue';
import AboutModal from '../components/modal/AboutModal.vue';
import DebugTerminal from '../components/display/DebugTerminal.vue';

const { playSingleChord } = useAudio();
const { startPlayback, resetPlayback } = usePlayback();
const { midiToNoteName } = usePiano();

const keys = Object.keys(KEY_REGISTRY);

const showAboutModalFlag = ref(false);
const aboutModalTab = ref('help');

function showAboutModal(tab = 'help') {
  aboutModalTab.value = tab;
  showAboutModalFlag.value = true;
}

function closeAboutModal() {
  showAboutModalFlag.value = false;
}

function handleModeChange() {
  reset_state();
}

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
    // The PianoSection component handles its own input state
  } else {
    playSingleChord({ S: midi });
  }
}

function handleStartSoprano(inputText) {
  // Parse melody and trigger soprano mode
  // This needs to be handled - the piano section has its own input
}

function handleSelectChord(chord) {
  sync_state(chord);
  if (store.history.length > 0) {
    playSingleChord(store.history[store.history.length - 1].voices);
  }
}

onMounted(() => {
  document.title = '斯波索宾和声引擎';
  const hasSeenUpdate = localStorage.getItem('seenUpdateReport1.1');
  if (!hasSeenUpdate) {
    showAboutModal('update');
    localStorage.setItem('seenUpdateReport1.1', 'true');
  }
  sync_state();
});
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

@font-face {
  font-family: 'Bravura';
  src: url('/fonts/Bravura.woff2') format('woff2');
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
  --radius-lg: 12px;
  --radius-md: 8px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.05);
  --shadow-lg: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01);
}

body {
  font-family: 'Inter', system-ui, sans-serif;
  background-color: var(--bg-color);
  color: var(--text-main);
  margin: 0;
  padding: 16px 0;
  -webkit-font-smoothing: antialiased;
}

.app-container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }

.glass-card {
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
  padding: 16px;
  margin-bottom: 16px;
}

.score-section { margin-bottom: 16px; }

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.key-select {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  font-size: 13px;
  font-family: 'Inter', system-ui, sans-serif;
  color: var(--text-main);
  cursor: pointer;
  outline: none;
  transition: 0.2s;
}

.key-select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.btn:active { transform: scale(0.96); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-danger {
  background: white;
  color: var(--danger);
  border: 1px solid #FECACA;
}

.btn-danger:hover {
  background: #FEF2F2;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media screen and (max-width: 768px) {
  .toolbar { flex-direction: column; gap: 8px; align-items: stretch; }
  .toolbar-left, .toolbar-right { width: 100%; }
  .toolbar-right { justify-content: stretch; }
  .toolbar-right .btn { flex: 1; }
  .key-select { width: 100%; }
}
</style>
