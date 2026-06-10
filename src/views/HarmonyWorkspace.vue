<template>
  <div class="workspace">
    <AppHeader 
      @mode-change="handleModeChange" 
      @show-about="showAboutModal('help')"
      @show-update="showAboutModal('update')"
    />

    <div class="main-layout">
      <div class="left-area">
        <section class="score-section">
          <div class="toolbar">
            <select v-model="store.key_name" @change="handleReset" class="key-select">
              <option v-for="key in keys" :key="key" :value="key">{{ key }}</option>
            </select>
            <div class="toolbar-actions">
              <button 
                @click="handlePlaySequence" 
                class="btn" 
                :class="{ active: isPlaying }"
                :disabled="store.history.length === 0"
              >
                {{ isPlaying ? '停止' : '试听' }}
              </button>
              <button @click="handleReset" class="btn">清空</button>
            </div>
          </div>

          <ScoreRenderer />
        </section>

        <PianoSection
          @piano-click="handlePianoClick"
          @start-soprano="handleStartSoprano"
        />
      </div>

      <div class="right-area">
        <ChordPalette @select-chord="handleSelectChord" />
      </div>
    </div>

    <AboutModal 
      :visible="showAboutModalFlag" 
      :initial-tab="aboutModalTab" 
      @close="closeAboutModal" 
    />
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
const { startPlayback, resetPlayback, isPlaying } = usePlayback();
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
.workspace {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.main-layout {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.left-area {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.right-area {
  flex: 0 0 300px;
  min-width: 0;
}

.score-section {
  background: #fff;
  overflow: hidden;
}

.toolbar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 12px;
}

.toolbar-actions {
  display: flex;
  gap: 0;
}

.key-select {
  padding: 6px 12px;
  border-radius: var(--radius);
  border: 2px solid var(--border);
  background: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: var(--font);
  color: var(--fg);
  cursor: pointer;
  outline: none;
  transition: background .15s;
}

.key-select:hover {
  background: var(--hover);
}

.btn {
  color: var(--fg);
  cursor: pointer;
  background: #fff;
  border: 2px solid var(--border);
  padding: 6px 12px;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: var(--font);
  transition: background .15s, color .15s;
}

.btn:first-child {
  border-radius: var(--radius) 0 0 var(--radius);
  margin-right: -2px;
}

.btn:last-child {
  border-radius: 0 var(--radius) var(--radius) 0;
}

.btn:only-child {
  border-radius: var(--radius);
  margin-right: 0;
}

.btn:hover:not(:disabled):not(.active) {
  background: var(--hover);
  position: relative;
  z-index: 1;
}

.btn.active {
  color: #fff;
  background: var(--fg);
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar-actions .btn:first-child {
  border-radius: var(--radius) 0 0 var(--radius);
}

.toolbar-actions .btn:last-child {
  border-radius: 0 var(--radius) var(--radius) 0;
}
</style>
