<template>
  <transition name="modal">
    <div v-if="store.debug_message" class="terminal-overlay" @click="$emit('close')">
      <div class="terminal-window" @click.stop>
        <div class="terminal-header">
          <div class="mac-dots">
            <span class="dot red" @click="$emit('close')"></span>
            <span class="dot yellow"></span>
            <span class="dot green"></span>
          </div>
          <div class="terminal-title">bash - DAG_Debugger - 80x24</div>
        </div>
        <div class="terminal-body">
          <pre>{{ store.debug_message }}</pre>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { store } from '../../engine/store.js';
defineEmits(['close']);
</script>

<style scoped>
.terminal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 999; }
.terminal-window { width: 700px; max-width: 90vw; background: #1E1E1E; border-radius: 10px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); overflow: hidden; border: 1px solid #333; }
.terminal-header { background: #2D2D2D; padding: 12px 16px; display: flex; align-items: center; position: relative; }
.mac-dots { display: flex; gap: 8px; position: absolute; }
.dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; cursor: pointer; transition: 0.2s; }
.dot:hover { opacity: 0.8; }
.dot.red { background: #FF5F56; }
.dot.yellow { background: #FFBD2E; }
.dot.green { background: #27C93F; }
.terminal-title { width: 100%; text-align: center; color: #999; font-size: 13px; font-family: monospace; }
.terminal-body { padding: 20px; max-height: 60vh; overflow-y: auto; }
.terminal-body pre { font-family: 'Consolas', 'Monaco', monospace; font-size: 14px; color: #D4D4D4; line-height: 1.5; margin: 0; white-space: pre-wrap; }
.modal-enter-active, .modal-leave-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: translateY(20px) scale(0.95); }

@media screen and (max-width: 768px) {
  .terminal-window { width: 90vw !important; max-width: none; margin: 0 auto; }
  .terminal-body pre { font-size: 12px; }
}
</style>
