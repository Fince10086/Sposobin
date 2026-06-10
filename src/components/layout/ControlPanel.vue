<template>
  <section class="control-panel glass-card">
    <div class="form-group">
      <label class="form-label">
        工作模式 (App Mode)
        <button @click="$emit('show-help')" class="help-trigger-btn" title="查看当前工作模式引导说明">❓</button>
      </label>
      <div class="segmented-control">
        <input type="radio" id="mode-free" name="mode" value="FREE" v-model="store.mode" @change="$emit('reset')">
        <label for="mode-free">自由模式</label>
        <input type="radio" id="mode-soprano" name="mode" value="SOPRANO" v-model="store.mode" @change="$emit('reset')">
        <label for="mode-soprano">高音题模式</label>
        <input type="radio" id="mode-compose" name="mode" value="COMPOSE" v-model="store.mode" @change="$emit('reset')">
        <label for="mode-compose">旋律写作模式</label>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">全局调性 (Tonality)</label>
      <select v-model="store.key_name" @change="$emit('reset')" class="modern-select">
        <option v-for="key in keys" :key="key" :value="key">{{ key }}</option>
      </select>
    </div>
  </section>
</template>

<script setup>
import { store } from '../../engine/store.js';
import { KEY_REGISTRY } from '../../engine/tonality/index.js';

const keys = Object.keys(KEY_REGISTRY);
defineEmits(['reset', 'show-help']);
</script>

<style scoped>
.control-panel { display: flex; gap: 30px; align-items: center; justify-content: center; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-label { font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
.help-trigger-btn { background: none; border: none; cursor: pointer; font-size: 14px; margin-left: 6px; padding: 0; display: inline-flex; align-items: center; justify-content: center; opacity: 0.7; transition: opacity 0.2s; vertical-align: middle; }
.help-trigger-btn:hover { opacity: 1; transform: scale(1.1); }
.segmented-control { display: flex; background: #F1F5F9; padding: 4px; border-radius: 10px; }
.segmented-control input[type="radio"] { display: none; }
.segmented-control label { padding: 8px 20px; cursor: pointer; border-radius: 8px; font-weight: 500; font-size: 14px; color: var(--text-muted); transition: all 0.2s ease; }
.segmented-control input[type="radio"]:checked + label { background: white; color: var(--primary); box-shadow: var(--shadow-sm); }
.modern-select { padding: 10px 16px; border-radius: 10px; border: 1px solid var(--border); background: var(--surface); font-size: 14px; font-family: 'Inter'; color: var(--text-main); cursor: pointer; outline: none; transition: 0.2s; }
.modern-select:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1); }

@media screen and (max-width: 768px) {
  .control-panel { flex-direction: column; gap: 16px; align-items: stretch; }
  .segmented-control { flex-wrap: wrap; justify-content: center; }
  .segmented-control label { flex: 1; text-align: center; padding: 8px 10px; font-size: 13px; }
}
</style>
