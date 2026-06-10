<template>
  <section 
    :class="['piano-section', { 
      disabled: store.mode === 'FREE',
      inactive: store.mode === 'SOPRANO' && store.history.length > 0 
    }]"
  >
    <div class="piano-wrapper">
      <div class="piano">
        <div 
          v-for="note in pianoKeys" 
          :key="note.midi"
          :class="['piano-key', note.isBlack ? 'black' : 'white']"
          :style="{ left: note.x + 'px' }"
          @click="handleClick(note.midi)"
        >
          <span v-if="note.label" class="key-label">{{ note.label }}</span>
        </div>
      </div>
    </div>

    <div v-if="store.mode === 'SOPRANO'" class="soprano-controls">
      <button 
        @click="handleUndo" 
        class="btn btn-undo"
        :disabled="store.target_melody.length === 0 || store.history.length > 0"
        title="撤销最后一个音"
      >
        ←
      </button>
      <button 
        @click="$emit('start-soprano')" 
        class="btn btn-generate"
        :disabled="store.target_melody.length === 0"
      >
        生成
      </button>
    </div>
  </section>
</template>

<script setup>
import { store } from '../../engine/store.js';
import { usePiano } from '../../composables/usePiano.js';

const { keys: pianoKeys } = usePiano();

const emit = defineEmits(['piano-click', 'start-soprano', 'undo-note']);

function handleClick(midi) {
  if (store.mode === 'FREE') return;
  if (store.mode === 'SOPRANO' && store.history.length > 0) return;
  emit('piano-click', midi);
}

function handleUndo() {
  if (store.target_melody.length > 0 && store.history.length === 0) {
    emit('undo-note');
  }
}
</script>

<style scoped>
.piano-section {
  background: #fff;
  padding: 12px 0;
  display: flex;
  align-items: center;
  gap: 16px;
}

.piano-section.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.piano-section.disabled .piano-key {
  cursor: not-allowed;
  pointer-events: none;
}

.piano-section.inactive {
  opacity: 0.4;
}

.piano-section.inactive .piano-key {
  cursor: not-allowed;
  pointer-events: none;
}

.piano-wrapper {
  background: #fff;
  padding: 8px;
}

.piano {
  position: relative;
  height: 100px;
  width: 440px;
}

.piano-key {
  position: absolute;
  cursor: pointer;
  border: 1px solid #000;
  border-radius: 0 0 2px 2px;
  transition: background .1s;
  box-sizing: border-box;
}

.piano-key.white {
  width: 26px;
  height: 100px;
  background: #fff;
  z-index: 1;
}

.piano-key.white:hover {
  background: #f0f0f0;
}

.piano-key.black {
  width: 16px;
  height: 60px;
  background: #000;
  z-index: 2;
}

.piano-key.black:hover {
  background: #333;
}

.key-label {
  position: absolute;
  bottom: 4px;
  left: 0;
  width: 100%;
  text-align: center;
  font-size: 9px;
  color: #666;
  font-weight: 600;
}

.soprano-controls {
  display: flex;
  gap: 0;
}

.btn {
  color: #000;
  cursor: pointer;
  background: #fff;
  border: 2px solid #000;
  padding: 6px 16px;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  transition: background .15s;
}

.btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn:hover:not(:disabled) {
  background: #f0f0f0;
  position: relative;
  z-index: 1;
}

.btn-undo {
  border-radius: 4px 0 0 4px;
  min-width: 40px;
  padding: 6px 8px;
}

.btn-generate {
  border-radius: 0 4px 4px 0;
  margin-left: -2px;
}
</style>
