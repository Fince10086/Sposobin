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
            <div class="content-section">
              <h4>平台概述</h4>
              <p>将经典的<b>斯波索宾《和声学》</b>体系进行完全数字化代码化的智能推演工程。</p>
            </div>
            <div class="content-section">
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
            <div class="content-section">
              <h4>斯波索宾和声引擎</h4>
              <p>基于斯波索宾和声学理论的智能和声写作辅助工具。</p>
            </div>
            <div class="content-section">
              <h4>作者</h4>
              <p>青槐树的诗</p>
              <div class="author-links">
                <a href="https://space.bilibili.com/381857406" target="_blank">B站主页</a>
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
  { key: 'FREE', label: '自由模式' },
  { key: 'SOPRANO', label: '高音题模式' },
  { key: 'COMPOSE', label: '旋律写作模式' },
];

const helpData = {
  FREE: [
    '核心设定：完全无拘无束地自由探索斯波索宾功能级进。',
    '1. 解锁控制：你可以在该模式下任意切换左侧全局调性（换调将自动清空画板）。',
    '2. 极速算力：点击下方亮起的功能按钮，引擎会秒级为你算出教科书级的四部和声声部排列。',
    '3. 状态回溯：直接在五线谱上点击任意历史和弦，可以直接将其执行「断点回退」修改。'
  ],
  SOPRANO: [
    '核心设定：经典旋律逆向配和声。给定指定高音曲线，寻求完美通路。',
    '1. 输入准备：请在下方的输入框中键入形如 C5 Eb5 G5 的音高文本，或直接在上方钢琴键盘点击弹奏录入音符。',
    '2. 路径生成：确定旋律后点击「生成推演路径」，引擎会为其全自动算出一条极其牢固的连通拓扑 DAG 图结构。',
    '3. 路径演进：根据下方弹出的候选功能按钮步步向前。如果某一处的声部进行导致断裂无法解开，系统会自动亮起终端帮你诊断违反了哪条传统古典音乐法则。'
  ],
  COMPOSE: [
    '核心设定：主旋律随心写作，和功能级进配置双重交互前进。',
    '1. 写作顺序：每一步都必须「先」在上方黄色钢琴键盘上点击选定当前步骤所需的「旋律音高」。',
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
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-window {
  width: 560px;
  max-width: 90vw;
  max-height: 80vh;
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes popIn {
  from { opacity: 0; transform: translateY(15px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #F8FAFC;
}

.modal-tabs {
  display: flex;
  gap: 4px;
}

.tab-btn {
  padding: 6px 14px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: var(--text-main);
  background: rgba(0,0,0,0.03);
}

.tab-btn.active {
  background: white;
  color: var(--primary);
  box-shadow: var(--shadow-sm);
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px;
  color: var(--text-muted);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(0,0,0,0.05);
  color: var(--danger);
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

.content-section h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--primary);
}

.content-section h4.highlight {
  color: #F59E0B;
}

.content-section p {
  margin: 0;
  font-size: 13px;
  color: #475569;
  line-height: 1.6;
}

.content-section ul {
  margin: 8px 0 0 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.content-section li {
  font-size: 13px;
  color: #334155;
  line-height: 1.5;
}

.mode-selector {
  display: flex;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.mode-btn {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: white;
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.mode-btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.help-rules {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rule-line {
  font-size: 13px;
  line-height: 1.6;
  color: #334155;
  padding: 8px 12px;
  background: #F8FAFC;
  border-radius: 6px;
}

.author-links {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.author-links a,
.author-links span {
  font-size: 13px;
  color: var(--primary);
  text-decoration: none;
}

.author-links a:hover {
  text-decoration: underline;
}

.modal-enter-active, .modal-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

@media screen and (max-width: 768px) {
  .modal-window {
    width: 90vw;
    max-width: none;
  }
}
</style>
