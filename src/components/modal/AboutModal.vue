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
            <div class="help-rules">
              <div v-for="(rule, idx) in currentRules" :key="idx" class="rule-line">
                {{ rule }}
              </div>
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

const props = defineProps({ visible: Boolean, initialTab: { type: String, default: 'help' } });
defineEmits(['close']);

const activeTab = ref(props.initialTab);

watch(() => props.initialTab, (newTab) => {
  if (newTab) activeTab.value = newTab;
});

const activeMode = ref('FREE');

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
    '1. 解锁控制：你可以在该模式下任意切换全局调性（换调将自动清空画板）。',
    '2. 极速算力：点击下方亮起的功能按钮，引擎会秒级为你算出教科书级的四部和声声部排列。',
    '3. 状态回溯：直接在五线谱上点击任意历史和弦，可以直接将其执行断点回退修改。'
  ],
  SOPRANO: [
    '核心设定：经典旋律逆向配和声。给定指定高音曲线，寻求完美通路。',
    '1. 输入准备：请在下方的输入框中键入形如 C5 Eb5 G5 的音高文本，或直接在上方钢琴键盘点击弹奏录入音符。',
    '2. 路径生成：确定旋律后点击生成推演路径，引擎会为其全自动算出一条极其牢固的连通拓扑 DAG 图结构。',
    '3. 路径演进：根据下方弹出的候选功能按钮步步向前。如果某一处的声部进行导致断裂无法解开，系统会自动亮起终端帮你诊断违反了哪条传统古典音乐法则。'
  ],
  COMPOSE: [
    '核心设定：主旋律随心写作，和功能级进配置双重交互前进。',
    '1. 写作顺序：每一步都必须先在上方黄色钢琴键盘上点击选定当前步骤所需的旋律音高。',
    '2. 动态过滤：当敲定旋律音后（谱面上出现黄色问号节点），下方的候选功能组按钮会自动被引擎过滤并呈现出适合该音符的全部合法和弦。',
    '3. 固化步进：点击对应和弦即可固化四部声部位置，并等待输入下一个旋律音。所有声部进行均实时接受平行五八度与错位硬性阻断校验。'
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
  border-bottom: 2px solid #000;
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

.help-rules {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rule-line {
  font-size: 0.8125rem;
  line-height: 1.6;
  color: #333;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 4px;
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
