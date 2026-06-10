<template>
  <section :class="['piano-section', { disabled: store.mode === 'FREE' }]">
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

    <div v-if="store.mode === 'SOPRANO'" class="soprano-input">
      <input 
        type="text" 
        v-model="melodyInput" 
        class="text-input" 
        placeholder="C5 Eb5 G5 ..." 
      />
      <button @click="$emit('start-soprano', melodyInput)" class="btn">生成</button>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { store } from '../../engine/store.js';
import { usePiano } from '../../composables/usePiano.js';

const { keys: pianoKeys } = usePiano();
const melodyInput = ref('');

const emit = defineEmits(['piano-click', 'start-soprano']);

function handleClick(midi) {
  if (store.mode === 'FREE') return;
  emit('piano-click', midi);
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

.soprano-input {
  display: flex;
  gap: 0;
  flex: 1;
}

.text-input {
  flex: 1;
  padding: 6px 12px;
  border: 2px solid #000;
  border-radius: 4px 0 0 4px;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: var(--font, 'Outfit', sans-serif);
  outline: none;
  background: #fff;
}

.text-input:focus {
  background: #f8f8f8;
}

.btn {
  color: #000;
  cursor: pointer;
  background: #fff;
  border: 2px solid #000;
  border-radius: 0 4px 4px 0;
  margin-left: -2px;
  padding: 6px 16px;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  transition: background .15s;
}

.btn:hover {
  background: #f0f0f0;
  position: relative;
  z-index: 1;
}
</style>
