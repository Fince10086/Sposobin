# 🎹 基于动态规划的传统和声算法推演引擎 (Classical Harmony DP-Engine)

![Python Version](https://img.shields.io/badge/Python-3.8%2B-blue.svg)
![UI](https://img.shields.io/badge/GUI-Tkinter-orange.svg)
![Algorithm](https://img.shields.io/badge/Algorithm-DP%20%7C%20DAG%20%7C%20Viterbi-success.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

本项目是一个采用 Python 构建的严格规则导向型（Rule-based）四部和声算法推演框架。系统将《斯波索宾和声学》的学术理论抽象为数学约束模型，结合**动态规划（Dynamic Programming）**与**有向无环图（DAG）**算法，实现了对四部和声（Soprano, Alto, Tenor, Bass）声部进行（Voice Leading）的严密校验与自动化状态空间搜索。

## ✨ 核心特性 (Core Features)

* **🧠 核心算法引擎 (Viterbi & DAG)**
  * 利用动态规划构建全局有向无环图（DAG），在目标旋律的边界约束下，穷举并搜索符合严格和声法则的最佳全局路径。
  * 采用惩罚函数（Penalty Function）评估声部平稳性，最小化状态转移代价。
* **🏛️ 严苛的古典法则约束 (Strict Academic Voice-Leading)**
  * **硬性阻断机制**：严格规避平行五度/八度、隐伏五八度、声部交叉与声部超越。
  * **增减音程过滤器**：基于自然音级与物理半音的同构数学模，精准拦截非古典风格的横向增减音程（如增四度、减五度跳进），并支持模进（Sequence）与半音阶过渡的合法豁免。
  * **副七和弦风格约束**：内置严格的七音预备（平稳/延留）与解决（下行级进）机制。
  * **特性和弦校验**：支持增六和弦（It⁺⁶, Ger⁺⁶, Fr⁺⁶）的扩张解决、那不勒斯六和弦（N₆）的特性解决以及终止四六和弦（K₆₄）的低音法则。
* **🛠️ 多模式工程流 (Multi-Mode Workflow)**
  * **高音题模式 (Soprano Harmonization)**：输入目标旋律序列，引擎自动完成状态空间生成、连通性校验并输出最优全局解。
  * **旋律写作模式 (Interactive Composition)**：基于前端界面的交互式音符录入，引擎实时评估连通性并动态剪枝，仅保留理论合法的分支路径。
* **📊 连通性诊断探针 (Diagnostic Probe)**
  * 内置断链诊断控制台，精准定位导致 DP 路径断裂的“死端节点（Dead Ends）”，输出各层级的状态存活分布图。
* **🎼 矢量级谱面渲染 (Vector Score Rendering)**
  * 自主构建的双轨五线谱渲染器，支持同音异名（Enharmonic Spelling）的自动纠正映射（如 $D_{VII7}/III$ 自动转换为重升号 `x`），并支持自适应加线与符干排版。

## 🏗️ 架构设计 (System Architecture)

系统采用高度解耦的模块化架构，算法逻辑与表示层严格分离：

```text
├── main.py        # 主入口：状态机管理与 Tkinter UI 主事件循环
├── engine.py      # 求解器：候选集生成、DAG 图构建与 Viterbi 路径寻优
├── rules.py       # 规则引擎：计算转移罚分（Penalty），执行违规进行拦截
├── dna.py         # 数据字典：定义和弦功能网络（T-S-D 序进）、所需音级与图形坐标系
├── tonality.py    # 调性数学模型：处理音阶偏移、半音映射与同音异名处理逻辑
├── renderer.py    # 渲染器：处理 Canvas 矢量绘图、音符排版与记号对齐
└── player.py      # 音频合成层：将和声状态数组实时转换为 PCM 序列并输出波形

```

## 🚀 部署与运行 (Deployment)

### 依赖环境

本项目**无任何外部第三方依赖**，完全基于 Python 标准库构建。

* 操作系统：Windows / macOS / Linux (Windows 平台音频合成支持最佳)
* 运行时：Python 3.8+

### 启动命令

克隆代码库后，直接通过 Python 解释器执行主程序：

```bash
git clone [https://github.com/yourusername/Classical-Harmony-Engine.git](https://github.com/yourusername/Classical-Harmony-Engine.git)
cd Classical-Harmony-Engine
python main.py

```

## 📖 交互手册 (User Manual)

1. **全局配置**：在顶部下拉菜单中初始化全局调性参数（支持 24 大小调体系）。
2. **模式切换**：
* **自由模式**：在底层和弦网络中进行自由游走，探索合法的状态转移路径。
* **高音题模式**：利用文本框（支持高级拼写如 `Fx4`）或可视化钢琴键盘录入连续的旋律序列，触发算法进行全局路径推演。
* **旋律写作模式**：逐节点推进，系统将实时计算转移矩阵，动态更新当前可用的和声节点集合。


3. **回溯与声学验证**：点击 Canvas 上的任一历史节点，系统状态机将执行回溯（Backtracking）。点击“试听全曲”调用底层波形生成器验证四部和声的物理声学效果。

## 🔬 算法复杂度分析 (Algorithmic Analysis)

对于长度为 $N$ 的旋律序列，系统状态空间搜索的理论时间复杂度为 $\mathcal{O}(|C|^N \times |V|^N)$（其中 $C$ 为和弦库规模，$V$ 为单和弦合法声部排列数）。
为保证 UI 线程的毫秒级实时响应，引擎实现了以下核心优化：

1. **启发式剪枝 (Heuristic Pruning)**：在 `rules.py` 的状态评估阶段，针对致命级和声违规（如平行五八度）直接赋予无穷大惩罚值（`999999`），提前终止无效分支。
2. **状态合并机制 (State Memoization)**：利用动态规划的无后效性特征，在 `engine.py` 层将具有相同 `(和弦标识, 声部排列结构)` 的转移节点合并，仅保留到达该状态的最小代价（Min Cost）前驱引用。
3. **反向死端清除 (Dead-end Backtracking)**：DAG 拓扑构建完成后，执行反向图遍历，销毁所有无法连通至全局终止状态（T/t 功能组）的孤立节点。

## 📄 开源协议 (License)

本项目采用 [MIT License](https://www.google.com/search?q=LICENSE) 协议开源。欢迎提交 Pull Request 或用于学术算法研究与二次开发。

```

```
