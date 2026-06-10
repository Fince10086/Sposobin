<template>
  <header class="app-header">
    <div class="header-left">
      <h1>斯波索宾和声引擎</h1>
    </div>

    <div class="header-center">
      <div class="segmented-control">
        <input type="radio" id="mode-free" name="mode" value="FREE" v-model="store.mode" @change="$emit('mode-change')">
        <label for="mode-free">自由</label>
        <input type="radio" id="mode-soprano" name="mode" value="SOPRANO" v-model="store.mode" @change="$emit('mode-change')">
        <label for="mode-soprano">高音题</label>
        <input type="radio" id="mode-compose" name="mode" value="COMPOSE" v-model="store.mode" @change="$emit('mode-change')">
        <label for="mode-compose">旋律写作</label>
      </div>
    </div>

    <div class="header-right">
      <div class="header-actions">
        <button @click="$emit('show-about')" class="header-btn">关于</button>
        <button @click="$emit('show-update')" class="header-btn">更新</button>
      </div>
      <div class="author-info">
        <span class="author-name">青槐树的诗</span>
        <div class="author-links">
          <a href="https://space.bilibili.com/381857406" target="_blank" class="link">B站</a>
          <a href="https://github.com/Huaishu61" target="_blank" class="link">GitHub</a>
          <span class="link muted">QQ: 850900762</span>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { store } from '../../engine/store.js';

defineEmits(['mode-change', 'show-about', 'show-update']);
</script>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.header-left h1 {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-main);
  margin: 0;
  letter-spacing: -0.3px;
  white-space: nowrap;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 0 20px;
}

.segmented-control {
  display: flex;
  background: #F1F5F9;
  padding: 3px;
  border-radius: 8px;
}

.segmented-control input[type="radio"] {
  display: none;
}

.segmented-control label {
  padding: 6px 16px;
  cursor: pointer;
  border-radius: 6px;
  font-weight: 500;
  font-size: 13px;
  color: var(--text-muted);
  transition: all 0.2s ease;
  white-space: nowrap;
}

.segmented-control input[type="radio"]:checked + label {
  background: white;
  color: var(--primary);
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.header-actions {
  display: flex;
  gap: 6px;
}

.header-btn {
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: white;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.header-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.author-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.author-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-main);
}

.author-links {
  display: flex;
  gap: 8px;
  align-items: center;
}

.link {
  font-size: 11px;
  color: var(--primary);
  text-decoration: none;
  transition: opacity 0.2s;
}

.link:hover {
  opacity: 0.7;
  text-decoration: underline;
}

.link.muted {
  color: var(--text-muted);
}

@media screen and (max-width: 768px) {
  .app-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .header-left {
    text-align: center;
  }

  .header-center {
    padding: 0;
    justify-content: center;
  }

  .segmented-control label {
    padding: 6px 12px;
    font-size: 12px;
  }

  .header-right {
    align-items: center;
    flex-direction: row;
    justify-content: space-between;
  }

  .author-info {
    align-items: flex-start;
  }
}
</style>
