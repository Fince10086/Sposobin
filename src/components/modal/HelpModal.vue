<template>
  <transition name="modal">
    <div v-if="visible" class="help-overlay" @click="$emit('close')">
      <div class="help-window" @click.stop>
        <div class="help-header">
          <h3>{{ title }}</h3>
          <button class="close-help-btn" @click="$emit('close')">✕</button>
        </div>
        <div class="help-body">
          <div v-for="(rule, idx) in rules" :key="idx" class="help-rule-line">
            {{ rule }}
          </div>
        </div>
        <div class="help-footer">
          <button class="modern-btn btn-primary" @click="$emit('close')">开始使用</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
defineProps({
  visible: Boolean,
  title: String,
  rules: Array
});
defineEmits(['close']);
</script>

<style scoped>
.help-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.help-window { width: 480px; max-width: 90vw; background: var(--surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); overflow: hidden; border: 1px solid var(--border); display: flex; flex-direction: column; animation: helpPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes helpPopIn { from { opacity: 0; transform: translateY(15px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
.help-header { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: #F8FAFC; }
.help-header h3 { margin: 0; font-size: 16px; font-weight: 700; color: var(--text-main); }
.close-help-btn { background: none; border: none; cursor: pointer; font-size: 18px; color: var(--text-muted); transition: color 0.2s; }
.close-help-btn:hover { color: var(--danger); }
.help-body { padding: 22px 20px; display: flex; flex-direction: column; gap: 14px; }
.help-rule-line { font-size: 14px; line-height: 1.6; color: #334155; text-align: left; }
.help-footer { padding: 14px 20px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; background: #F8FAFC; }
.modern-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; border-radius: 10px; font-weight: 600; font-size: 14px; border: none; cursor: pointer; transition: all 0.2s; font-family: inherit; }
.btn-primary { background: var(--primary); color: white; }
.btn-primary:hover { background: var(--primary-hover); box-shadow: 0 4px 12px rgba(14, 165, 233, 0.2); }

@media screen and (max-width: 768px) {
  .help-window { width: 90vw !important; max-width: none; }
}
</style>
