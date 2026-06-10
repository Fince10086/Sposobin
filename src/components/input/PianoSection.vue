<template>
  <section v-if="store.mode !== 'FREE'" class="soprano-panel glass-card highlight-border">
    <div class="piano-wrapper">
      <div class="piano">
        <div v-for="note in pianoKeys" :key="note.midi"
             :class="['piano-key', note.isBlack ? 'black' : 'white']"
             :style="{ left: note.x + 'px' }"
             @click="$emit('piano-click', note.midi)">
          <span v-if="note.label" class="key-label">{{ note.label }}</span>
        </div>
      </div>
    </div>

    <div v-if="store.mode === 'SOPRANO'" class="soprano-input-area">
      <input type="text" v-model="melodyInput" class="modern-input" placeholder="输入序列，如 C5 Eb5 G5..." />
      <button @click="$emit('start-soprano', melodyInput)" class="modern-btn btn-primary">
        <span class="icon">⚡</span> 生成推演路径
      </button>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { store } from '../../engine/store.js';
import { usePiano } from '../../composables/usePiano.js';

const { keys: pianoKeys } = usePiano();
const melodyInput = ref('');

defineEmits(['piano-click', 'start-soprano']);
</script>

<style scoped>
.soprano-panel { display: flex; align-items: center; gap: 30px; background: #FEF3C7; margin-bottom: 20px; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--border); padding: 20px; }
.highlight-border { border-color: #FCD34D; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.05); }
.piano-wrapper { background: white; padding: 10px; border-radius: 12px; border: 1px solid #FDE68A; }
.piano { position: relative; height: 105px; width: 450px; }
.piano-key { position: absolute; cursor: pointer; border: 1px solid #334155; border-radius: 0 0 4px 4px; transition: 0.1s; box-sizing: border-box; }
.piano-key.white { width: 26px; height: 105px; background: white; z-index: 1; }
.piano-key.white:active { background: #E2E8F0; }
.piano-key.black { width: 16px; height: 60px; background: #1E293B; z-index: 2; }
.piano-key.black:active { background: #475569; }
.key-label { position: absolute; bottom: 5px; left: 0; width: 100%; text-align: center; font-size: 10px; color: #94A3B8; font-weight: 500; }
.soprano-input-area { display: flex; flex-direction: column; gap: 12px; flex: 1; }
.modern-input { padding: 12px 16px; border-radius: 10px; border: 1px solid #FCD34D; font-family: monospace; font-size: 15px; outline: none; transition: 0.2s; width: 100%; box-sizing: border-box; }
.modern-input:focus { border-color: #F59E0B; box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1); }
.modern-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; border-radius: 10px; font-weight: 600; font-size: 14px; border: none; cursor: pointer; transition: all 0.2s; font-family: inherit; }
.modern-btn:active { transform: scale(0.96); }
.btn-primary { background: var(--primary); color: white; }
.btn-primary:hover { background: var(--primary-hover); box-shadow: 0 4px 12px rgba(14, 165, 233, 0.2); }

@media screen and (max-width: 768px) {
  .soprano-panel { flex-direction: column; gap: 20px; padding: 16px; }
  .piano-wrapper { width: 100%; overflow-x: auto; padding: 10px 0; -webkit-overflow-scrolling: touch; }
}
</style>
