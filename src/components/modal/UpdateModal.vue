<template>
  <transition name="modal">
    <div v-if="visible" class="help-overlay" @click="$emit('close')">
      <div class="help-window update-window" @click.stop>
        <div class="help-header update-header">
          <h3>🚀 斯波索宾和声写作台 · 1.1 Pro 升级报告</h3>
          <button class="close-help-btn" @click="$emit('close')">✕</button>
        </div>
        <div class="help-body update-body">
          <div class="update-section">
            <h4 class="update-section-title">🏛️ 平台核心功能概述</h4>
            <p class="update-text">本平台是将经典的<b>斯波索宾《和声学》</b>体系进行完全数字化代码化的智能推演工程。</p>
          </div>

          <div class="update-section">
            <h4 class="update-section-title highlight">🚀 1.1 Pro 重磅更新</h4>
            <ul class="update-list">
              <li><strong>线性对位引擎重构：</strong>彻底修复并重写了经过与辅助和弦的底层逻辑。</li>
              <li><strong>副功能与离调网络大扩充：</strong>全面实装"副下属和弦"体系。</li>
              <li><strong>变音与特性和弦解锁：</strong>新增对属七和弦附加六音的全面支持。</li>
              <li><strong>基础连通性修复：</strong>解决 S6 → D6 连接异常等致命缺陷。</li>
            </ul>
          </div>
        </div>
        <div class="help-footer">
          <button class="modern-btn btn-primary full-width" @click="$emit('close')">我知道了，开启和声推演</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
defineProps({ visible: Boolean });
defineEmits(['close']);
</script>

<style scoped>
.help-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.help-window { width: 480px; max-width: 90vw; background: var(--surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); overflow: hidden; border: 1px solid var(--border); display: flex; flex-direction: column; animation: helpPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.update-window { width: 560px; }
.update-header { background: linear-gradient(135deg, #0284C7, #0EA5E9); color: white; }
.update-header h3 { color: white; display: flex; align-items: center; gap: 8px; }
.update-body { gap: 16px; max-height: 65vh; overflow-y: auto; }
@keyframes helpPopIn { from { opacity: 0; transform: translateY(15px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
.help-header { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
.help-header h3 { margin: 0; font-size: 16px; font-weight: 700; color: var(--text-main); }
.close-help-btn { background: none; border: none; cursor: pointer; font-size: 18px; color: var(--text-muted); transition: color 0.2s; }
.update-header .close-help-btn { color: rgba(255,255,255,0.8); }
.close-help-btn:hover { color: var(--danger); }
.help-body { padding: 22px 20px; display: flex; flex-direction: column; gap: 14px; }
.help-footer { padding: 14px 20px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; background: #F8FAFC; }
.modern-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; border-radius: 10px; font-weight: 600; font-size: 14px; border: none; cursor: pointer; transition: all 0.2s; font-family: inherit; }
.btn-primary { background: var(--primary); color: white; }
.btn-primary:hover { background: var(--primary-hover); box-shadow: 0 4px 12px rgba(14, 165, 233, 0.2); }
.full-width { width: 100%; padding-top: 12px; padding-bottom: 12px; background: #0EA5E9; }
.update-section { border-bottom: 1px dashed var(--border); padding-bottom: 14px; text-align: left; }
.update-section:last-child { border: none; padding: 0; }
.update-section-title { font-size: 14px; font-weight: 700; color: #0284C7; margin: 0 0 8px 0; }
.update-section-title.highlight { color: #F59E0B; }
.update-text { font-size: 13px; color: #475569; line-height: 1.6; margin: 0; }
.update-list { list-style-type: disc; padding-left: 18px; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.update-list li { font-size: 13px; color: #334155; line-height: 1.5; }
.modal-enter-active, .modal-leave-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: translateY(20px) scale(0.95); }

@media screen and (max-width: 768px) {
  .help-window, .update-window { width: 90vw !important; max-width: none; }
}
</style>
