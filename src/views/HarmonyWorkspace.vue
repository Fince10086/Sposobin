<template>
  <div class="workspace">
    <AppHeader 
      @mode-change="handleModeChange" 
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
              <template v-if="store.mode === 'SOPRANO'">
                <button 
                  @click="handleUndoNote" 
                  class="btn btn-undo"
                  :disabled="store.target_melody.length === 0 || store.history.length > 0"
                  title="撤销最后一个音"
                >
                  ←
                </button>
                <button 
                  @click="handleStartSoprano" 
                  class="btn btn-generate"
                  :disabled="store.target_melody.length === 0"
                >
                  生成
                </button>
              </template>
              <button @click="showAboutModal()" class="btn btn-help">?</button>
            </div>
          </div>

          <ScoreRenderer />
        </section>

        <PianoSection
          @piano-click="handlePianoClick"
        />
      </div>

      <div class="right-area">
        <ChordPalette @select-chord="handleSelectChord" />
      </div>
    </div>

    <AboutModal 
      :visible="showAboutModalFlag" 
      :initial-mode="store.mode"
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

import AppHeader from '../components/layout/AppHeader.vue';
import PianoSection from '../components/input/PianoSection.vue';
import ChordPalette from '../components/layout/ChordPalette.vue';
import ScoreRenderer from '../ScoreRenderer.vue';
import AboutModal from '../components/modal/AboutModal.vue';
import DebugTerminal from '../components/display/DebugTerminal.vue';

const { playSingleChord } = useAudio();
const { startPlayback, resetPlayback, isPlaying } = usePlayback();

const keys = Object.keys(KEY_REGISTRY);

const showAboutModalFlag = ref(false);

function showAboutModal() {
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
    // 添加音符到目标旋律
    store.target_melody.push(midi);
  } else {
    playSingleChord({ S: midi });
  }
}

function handleUndoNote() {
  if (store.target_melody.length > 0) {
    store.target_melody.pop();
  }
}

function handleStartSoprano() {
  // 构建DAG并获取候选和弦
  sync_state();
}

function handleSelectChord(chord) {
  sync_state(chord);
  if (store.history.length > 0) {
    playSingleChord(store.history[store.history.length - 1].voices);
  }
}

onMounted(() => {
  document.title = '斯波索宾和声引擎';
  const hasSeenHelp = localStorage.getItem('seenHelp1.1');
  if (!hasSeenHelp) {
    showAboutModal();
    localStorage.setItem('seenHelp1.1', 'true');
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

.toolbar-actions {
  display: flex;
  border: 2px solid #000;
  border-radius: 4px;
  overflow: hidden;
}

.toolbar-actions .btn {
  color: #000;
  cursor: pointer;
  background: #fff;
  border: none;
  border-right: 2px solid #000;
  border-radius: 0;
  padding: 6px 12px;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  transition: background .15s, color .15s;
}

.toolbar-actions .btn:last-child {
  border-right: none;
}

.toolbar-actions .btn:hover:not(:disabled):not(.active) {
  background: #f0f0f0;
}

.toolbar-actions .btn.active {
  color: #fff;
  background: #000;
}

.toolbar-actions .btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar-actions .btn.btn-help {
  padding: 6px 10px;
  font-weight: 700;
}
</style>
