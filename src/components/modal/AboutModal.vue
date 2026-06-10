<template>
  <transition name="modal">
    <div v-if="visible" class="modal-overlay" @click="$emit('close')">
      <div class="modal-window" @click.stop>
        <div class="modal-header">
          <div class="modal-tabs">
            <button 
              v-for="tab in tabs" 
              :key="tab.key"
              :class="['tab-btn', { active: activeTab === tab.key }]"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>
          <button class="close-btn" @click="$emit('close')">×</button>
        </div>

        <div class="modal-body">
          <!-- 更新日志 -->
          <div v-if="activeTab === 'update'" class="tab-content">
            <div class="section">
              <h4>平台概述</h4>
              <p>将经典的<b>斯波索宾《和声学》</b>体系进行完全数字化代码化的智能推演工程。</p>
            </div>
            <div class="section">
              <h4 class="highlight">1.1 Pro 更新内容</h4>
              <ul>
                <li>线性对位引擎重构：彻底修复经过与辅助和弦的底层逻辑</li>
                <li>副功能与离调网络大扩充：全面实装副下属和弦体系</li>
                <li>变音与特性和弦解锁：新增对属七和弦附加六音的支持</li>
                <li>基础连通性修复：解决 S6 → D6 连接异常等缺陷</li>
              </ul>
            </div>
          </div>

          <!-- 使用帮助 -->
          <div v-if="activeTab === 'help'" class="tab-content">
            <div class="mode-selector">
              <button 
                v-for="mode in modes" 
                :key="mode.key"
                :class="['mode-btn', { active: activeMode === mode.key }]"
                @click="activeMode = mode.key"
              >
                {{ mode.label }}
              </button>
            </div>
            <div class="help-content">
              <p v-for="(rule, idx) in currentRules" :key="idx">{{ rule }}</p>
            </div>
          </div>

          <!-- 关于 -->
          <div v-if="activeTab === 'about'" class="tab-content">
            <div class="section">
              <h4>斯波索宾和声引擎</h4>
              <p>基于斯波索宾和声学理论的智能和声写作辅助工具。</p>
            </div>
            <div class="section">
              <h4>作者</h4>
              <p>青槐树的诗</p>
              <div class="author-links">
                <a href="https://space.bilibili.com/381857406" target="_blank">B站</a>
                <a href="https://github.com/Huaishu61" target="_blank">GitHub</a>
                <span>QQ群：850900762</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  visible: Boolean,
  initialTab: { type: String, default: 'help' },
  initialMode: { type: String, default: 'FREE' }
});
defineEmits(['close']);

const activeTab = ref(props.initialTab);
const activeMode = ref(props.initialMode);

watch(() => props.initialTab, (newTab) => {
  if (newTab) activeTab.value = newTab;
});

watch(() => props.initialMode, (newMode) => {
  if (newMode) activeMode.value = newMode;
});

const tabs = [
  { key: 'help', label: '使用帮助' },
  { key: 'update', label: '更新日志' },
  { key: 'about', label: '关于' },
];

const modes = [
  { key: 'FREE', label: '自由' },
  { key: 'SOPRANO', label: '高音题' },
  { key: 'COMPOSE', label: '旋律写作' },
];

const helpData = {
  FREE: [
    '核心设定：完全无拘无束地自由探索斯波索宾功能级进。',
    '1. 切换调性：通过上方工具栏选择全局调性，换调会自动清空当前画板。',
    '2. 选择和弦：在右侧候选面板中点击功能按钮，引擎自动计算四部和声排列并在五线谱上显示。',
    '3. 状态回溯：直接在五线谱上点击任意历史和弦，可将其后所有步骤回退并重新选择。',
    '4. 试听与清空：使用工具栏按钮试听当前序列或清空画板。'
  ],
  SOPRANO: [
    '核心设定：给定高音部旋律，为每个音选择合适的和弦功能。',
    '1. 输入旋律：使用钢琴键盘（A3-C6 范围）逐音输入高音旋律，灰色音符会立即显示在五线谱上。',
    '2. 撤销与生成：点击 ← 撤销最后一个音，确认无误后点击 生成 构建推演路径。',
    '3. 填补和弦：生成后从右侧候选面板为每个旋律音选择合适的和弦，系统会自动优化声部进行。',
    '4. 诊断：若某处声部进行无法解开，系统会弹出调试终端显示阻断位置和原因。',
    '5. 状态回溯：五线谱上点击任意历史节点可回退到该位置重新选择。'
  ],
  COMPOSE: [
    '核心设定：主旋律与和弦配置双重交互前进。',
    '1. 输入旋律音：使用钢琴键盘（A3-C6 范围）点击当前步骤所需的旋律音，灰色音符显示在五线谱上。',
    '2. 动态过滤：输入旋律音后，右侧候选面板自动过滤，只显示包含该音的合法和弦。',
    '3. 固化步进：从候选面板选择和弦固化四部声部位置，然后继续输入下一个旋律音。',
    '4. 状态回溯：五线谱上点击任意历史节点可回退到该位置重新选择。'
  ]
};

const currentRules = computed(() => helpData[activeMode.value] || helpData.FREE);
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-window {
  width: 560px;
  max-width: 100%;
  max-height: 80vh;
  background: #fff;
  border: 2px solid #000;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.modal-tabs {
  display: flex;
  gap: 0;
}

.tab-btn {
  padding: 5px 14px;
  border: 2px solid #000;
  background: #fff;
  color: #000;
  font-size: 0.8125rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background .15s, color .15s;
}

.tab-btn:first-child {
  border-radius: 4px 0 0 4px;
}

.tab-btn:last-child {
  border-radius: 0 4px 4px 0;
}

.tab-btn + .tab-btn {
  margin-left: -2px;
}

.tab-btn:hover:not(.active) {
  background: #f0f0f0;
  position: relative;
  z-index: 1;
}

.tab-btn.active {
  background: #000;
  color: #fff;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  color: #000;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background .15s;
}

.close-btn:hover {
  background: #f0f0f0;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section h4 {
  margin: 0 0 8px 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #000;
}

.section h4.highlight {
  color: #333;
}

.section p {
  margin: 0;
  font-size: 0.8125rem;
  color: #333;
  line-height: 1.6;
}

.section ul {
  margin: 8px 0 0 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section li {
  font-size: 0.8125rem;
  color: #333;
  line-height: 1.5;
}

.mode-selector {
  display: flex;
  gap: 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #ccc;
}

.mode-btn {
  padding: 5px 12px;
  border: 2px solid #000;
  background: #fff;
  color: #000;
  font-size: 0.8125rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
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
  background: #000;
  color: #fff;
}

.help-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.help-content p {
  font-size: 0.875rem;
  line-height: 1.6;
  color: #333;
  margin: 0;
}

.author-links {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.author-links a,
.author-links span {
  font-size: 0.8125rem;
  color: #000;
  text-decoration: none;
}

.author-links a:hover {
  text-decoration: underline;
}

.modal-enter-active, .modal-leave-active {
  transition: opacity .2s;
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
}

/* thin scrollbar */
.modal-body::-webkit-scrollbar {
  width: 3px;
}

.modal-body::-webkit-scrollbar-track {
  background: transparent;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #000;
}
</style>
