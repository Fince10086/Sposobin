<template>
  <header class="app-header">
    <h1>斯波索宾和声引擎</h1>

    <div class="mode-group">
      <button 
        v-for="mode in modes" 
        :key="mode.key"
        :class="['mode-btn', { active: store.mode === mode.key }]"
        @click="store.mode = mode.key; $emit('mode-change')"
      >
        {{ mode.label }}
      </button>
    </div>

    <div class="header-actions">
      <button @click="$emit('show-about')" class="header-btn">关于</button>
      <button @click="$emit('show-update')" class="header-btn">更新</button>
    </div>
  </header>
</template>

<script setup>
import { store } from '../../engine/store.js';

defineEmits(['mode-change', 'show-about', 'show-update']);

const modes = [
  { key: 'FREE', label: '自由' },
  { key: 'SOPRANO', label: '高音题' },
  { key: 'COMPOSE', label: '旋律写作' },
];
</script>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  gap: 16px;
}

h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.02em;
  white-space: nowrap;
}

.mode-group {
  display: flex;
  gap: 0;
}

.mode-btn {
  color: #000;
  cursor: pointer;
  background: #fff;
  border: 2px solid #000;
  padding: 6px 16px;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  transition: background .15s, color .15s;
}

.mode-btn:first-child {
  border-radius: 4px 0 0 4px;
}

.mode-btn:last-child {
  border-radius: 0 4px 4px 0;
}

.mode-btn + .mode-btn {
  margin-left: -2px;
}

.mode-btn:hover:not(.active) {
  background: #f0f0f0;
  position: relative;
  z-index: 1;
}

.mode-btn.active {
  color: #fff;
  background: #000;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.header-btn {
  color: #000;
  cursor: pointer;
  background: #fff;
  border: 2px solid #000;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  transition: background .15s;
}

.header-btn:hover {
  background: #f0f0f0;
}
</style>
