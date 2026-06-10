<template>
  <section class="categories-panel">
    <div v-if="isEmpty" class="empty-state-msg glass-card">
      <div class="empty-icon">?</div>
      <h3>{{ emptyTitle }}</h3>
      <p>{{ emptyDescription }}</p>
    </div>

    <div class="panels-grid" v-else>
      <div class="left-panel modern-panel" v-if="hasDiatonic">
        <h3 class="panel-header">自然音阶系统</h3>
        <div v-for="(chords, title) in store.categories.diatonic" :key="title" class="category-row">
          <div class="cat-title">{{ title }}</div>
          <div class="chord-btn-group">
            <button v-for="c in chords" :key="c" @click="$emit('select-chord', c)" class="modern-chord-btn">{{ c }}</button>
          </div>
        </div>
      </div>

      <div class="right-panel modern-panel" v-if="hasTonicization">
        <h3 class="panel-header" style="color: #8B5CF6;">离调与半音体系</h3>
        <div v-for="(chords, title) in store.categories.tonicization" :key="title" class="category-row">
          <div class="cat-title">{{ title }}</div>
          <div class="chord-btn-group">
            <button v-for="c in chords" :key="c" @click="$emit('select-chord', c)" class="modern-chord-btn tonic-btn">{{ c }}</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { store } from '../../engine/store.js';

const isEmpty = computed(() =>
  Object.keys(store.categories.diatonic).length === 0 &&
  Object.keys(store.categories.tonicization).length === 0
);

const hasDiatonic = computed(() => Object.keys(store.categories.diatonic).length > 0);
const hasTonicization = computed(() => Object.keys(store.categories.tonicization).length > 0);

const emptyTitle = computed(() => {
  if (store.mode === 'SOPRANO') {
    return store.target_melody.length > 0 ? '引擎计算中或当前无可用连通路径' : '等待旋律输入';
  }
  if (store.mode === 'COMPOSE') return '请点击上方键盘选定起始音';
  return '引擎校验中，当前路径封锁';
});

const emptyDescription = computed(() => {
  if (store.mode === 'SOPRANO' && store.target_melody.length > 0) {
    return '请查看下方弹出的调试终端以诊断阻断位置。';
  }
  return '请按规则完成前置操作以激活推演算法。';
});

defineEmits(['select-chord']);
</script>

<style scoped>
.categories-panel { margin-bottom: 20px; }
.empty-state-msg { text-align: center; padding: 40px 20px; }
.empty-icon { font-size: 48px; margin-bottom: 16px; }
.empty-state-msg h3 { color: var(--text-main); margin: 0 0 8px 0; font-size: 16px; }
.empty-state-msg p { color: var(--text-muted); font-size: 14px; margin: 0; }
.panels-grid { display: flex; gap: 24px; }
.modern-panel { flex: 1; background: #F8FAFC; border-radius: var(--radius-lg); padding: 20px; border: 1px solid var(--border); }
.panel-header { margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: var(--primary); }
.category-row { margin-bottom: 20px; }
.cat-title { font-size: 13px; font-weight: 600; color: var(--text-muted); margin-bottom: 10px; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; text-transform: uppercase; }
.chord-btn-group { display: flex; flex-wrap: wrap; gap: 8px; }
.modern-chord-btn { background: white; border: 1px solid #BAE6FD; color: #0284C7; padding: 8px 16px; border-radius: 8px; font-family: Georgia, serif; font-size: 16px; font-weight: bold; cursor: pointer; transition: 0.2s; box-shadow: var(--shadow-sm); }
.modern-chord-btn:hover { background: #F0F9FF; transform: translateY(-2px); box-shadow: 0 4px 6px rgba(14, 165, 233, 0.1); border-color: #7DD3FC; }
.tonic-btn { border-color: #DDD6FE; color: #6D28D9; }
.tonic-btn:hover { background: #F5F3FF; border-color: #C4B5FD; box-shadow: 0 4px 6px rgba(139, 92, 246, 0.1); }

@media screen and (max-width: 768px) {
  .panels-grid { flex-direction: column; gap: 16px; }
}
</style>
