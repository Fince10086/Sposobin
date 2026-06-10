<template>
  <header class="app-header">
    <div class="header-left">
      <h1>
        <span>斯波索宾和声</span>
        <span>写作引擎</span>
      </h1>
      <div class="author-info">
        <div class="author-line">
          <span class="author-label">作者：</span>
          <a href="https://space.bilibili.com/381857406" target="_blank" class="author-link">青槐树的诗</a>
          <a href="https://space.bilibili.com/5915081" target="_blank" class="author-link">肥皂Fince</a>
        </div>
        <a href="https://github.com/Fince10086/Sposobin" target="_blank" class="author-link">Github</a>
        <span class="author-text">QQ群：850900762</span>
      </div>
    </div>

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

  </header>
</template>

<script setup>
import { store } from '../../engine/store.js';

defineEmits(['mode-change']);

const modes = [
  { key: 'FREE', label: '自由模式' },
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

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

h1 {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.6875rem;
  line-height: 1.4;
}

.author-line {
  display: flex;
  align-items: center;
  gap: 4px;
}

.author-label,
.author-text {
  color: #666;
}

.author-link {
  color: #000;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.author-link:hover {
  opacity: 0.6;
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


</style>
