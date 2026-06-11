# 斯波索宾和声写作引擎

基于 Vue 3 + Vite 的斯波索宾和声算法推演前端，支持高音题、低音题、旋律写作和自由探索四种工作模式。

## 技术栈

- **前端框架**：Vue 3 (Composition API)
- **构建工具**：Vite 8
- **音频合成**：Tone.js (Web Audio API)
- **渲染引擎**：原生 SVG 五线谱渲染
- **样式方案**：CSS Variables + Scoped CSS，极简黑白风格

## 功能模式

| 模式 | 说明 |
|------|------|
| **自由模式 (FREE)** | 无约束探索和声网络，系统自动优化声部进行 |
| **高音题 (SOPRANO)** | 输入高音旋律，为每个音选择合适的和弦功能 |
| **低音题 (BASS)** | 输入低音旋律，为每个低音选择合适的和弦功能 |
| **旋律写作 (COMPOSE)** | 逐音输入旋律并选择和弦，实时校验声部进行 |

## 核心特性

- **严格规则引擎**：基于《斯波索宾和声学》的四部和声法则，包括平行五八度拦截、声部交叉/超越限制、隐伏五八度检测、增减音程过滤、七音预备与解决等
- **DAG + Viterbi 算法**：构建有向无环图进行全局路径搜索，使用动态规划寻找最优声部进行
- **连通性诊断**：自动检测旋律序列是否存在合法和声路径，定位断链节点
- **状态回溯**：点击五线谱上的历史节点可回退到任意位置重新选择
- **实时音频试听**：支持四部和声的实时播放
- **转调支持**：切换调性时自动转调当前作品（支持大小调切换的和弦功能映射）
- **竖屏适配**：支持移动端竖屏浏览

## 项目结构

```
src/
├── components/
│   ├── display/
│   │   ├── ScoreRenderer.vue    # SVG 五线谱渲染器
│   │   └── DebugTerminal.vue    # DAG 连通性诊断终端
│   ├── input/
│   │   └── PianoSection.vue     # 钢琴键盘输入组件
│   ├── layout/
│   │   ├── AppHeader.vue        # 顶部标题栏与模式选择
│   │   └── ChordPalette.vue     # 和弦候选面板
│   └── modal/
│       └── AboutModal.vue       # 帮助说明弹窗
├── composables/
│   ├── useAudio.js              # 音频合成与播放控制
│   └── usePlayback.js           # 序列播放逻辑
├── constants/
│   ├── limits.js                # 声部音域、间距限制等常量
│   └── modes.js                 # 起始候选和弦配置
├── engine/
│   ├── core/
│   │   ├── candidateEngine.js   # 和弦候选生成（直接构造算法）
│   │   ├── dagBuilder.js        # DAG 构建器
│   │   ├── transposer.js        # 调性转调核心
│   │   └── viterbi.js           # Viterbi 全局优化
│   ├── data/
│   │   └── network.js           # 大小调 DNA 数据库
│   ├── rules/
│   │   └── voiceLeading.js      # 声部进行规则评估
│   ├── tonality/
│   │   └── registry.js          # 调性注册表与拼写处理
│   ├── utils/
│   │   ├── formatter.js         # 和弦名称格式化
│   │   └── voicing.js           # 声部序列化工具
│   ├── index.js                 # 引擎导出
│   └── store.js                 # 全局状态管理
├── views/
│   └── HarmonyWorkspace.vue     # 主工作区布局
└── main.js                      # 应用入口
```

## 安装与运行

```bash
# 安装依赖
npm install

# 开发服务器
npm run dev

# 生产构建
npm run build

# 预览生产构建
npm run preview
```

## 部署

项目构建输出为纯静态文件（`dist/` 目录），可直接部署到任何静态托管服务：

```bash
npm run build
# 将 dist/ 目录部署至 Vercel / Netlify / GitHub Pages / Cloudflare Pages 等
```

## 浏览器支持

- 需要支持 Web Audio API
- 推荐使用桌面端浏览器以获得最佳体验

## 许可证

MIT License
