# Harmonic Web Application

一个基于Riemann和声理论的Web版和声分析系统。将原始的Tkinter桌面应用完整转换为现代Web应用，保留所有功能。

## 功能特性

### 完整功能保留
- ✅ **三种编辑模式**
  - 自由模式（FREE）：任意构建和声进行
  - 高音题模式（SOPRANO）：基于给定旋律生成四部和声
  - 旋律写作模式（COMPOSE）：完整旋律创作与和声分配

- ✅ **完整的和声DNA数据库**
  - 大调系统 (MAJOR_DNA) - 所有可能的和弦转位和功能进行
  - 小调系统 (MINOR_DNA) - 包含和声小调的完整规则
  - 次属和弦、借用和弦、变化和弦等特殊功能

- ✅ **专业声部写作规则**
  - 音域限制（SATB四声部标准范围）
  - 禁止的声部跳进（forbidden leaps）
  - 平行五八度检测
  - 声部交叉检查（voice crossing）
  - 同度惩罚（unison penalty）
  - 假关系检测（false relation）

- ✅ **动态规划算法**
  - DAG (有向无环图) 构建
  - 最优声部连接搜索
  - 成本函数优化
  - 回退策略（当无有效进行时启动全库搜索）

- ✅ **多调性支持**
  - 所有12个大调
  - 所有12个小调
  - 自动转调处理

- ✅ **MIDI到五线谱转换**
  - MIDI音高与标准音名的互转
  - 异名同音处理（enharmonic spelling）
  - 调性特定的音符标记

- ✅ **Web Audio API集成**
  - 四部和声合成
  - 实时播放
  - WAV格式生成
  - Base64编码音频传输

### 技术架构

#### 后端 (Flask)
- `app.py` - Flask应用主程序，REST API实现
- `engine.py` - 核心声部连接算法
- `rules.py` - 声部写作法则评估
- `dna.py` - 和声DNA数据库
- `tonality.py` - 调性管理与音符拼写
- `player.py` - Web Audio生成

#### 前端 (HTML/CSS/JavaScript)
- `index.html` - 页面结构
- `style.css` - 响应式设计
- `script.js` - 交互逻辑和API调用

### 项目结构
```
prototype/
├── backend/
│   ├── app.py              # Flask应用
│   ├── dna.py              # 和声数据库
│   ├── engine.py           # 算法引擎
│   ├── rules.py            # 法则评估
│   ├── tonality.py         # 调性管理
│   ├── player.py           # 音频生成
│   ├── requirements.txt    # Python依赖
│   ├── templates/
│   │   └── index.html      # 主页面
│   └── static/
│       ├── style.css       # 样式表
│       └── script.js       # 前端脚本
```

## 安装与运行

### 前置要求
- Python 3.8+
- pip 或 conda
- 现代Web浏览器

### 安装步骤

1. **进入backend目录**
```bash
cd prototype/backend
```

2. **创建Python虚拟环境（推荐）**
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/macOS
python3 -m venv venv
source venv/bin/activate
```

3. **安装依赖**
```bash
pip install -r requirements.txt
```

4. **运行Flask服务器**
```bash
python app.py
```

5. **打开浏览器**
访问 `http://localhost:5000`

## 使用指南

### 基本操作

1. **选择模式和调性**
   - 在顶部选择编辑模式（自由/高音题/旋律写作）
   - 从下拉菜单选择调性

2. **输入旋律**
   - 点击钢琴键盘输入旋律，或
   - 在文本框输入音符名称 (如: C4 D4 E4)

3. **生成和声**
   - 点击 "生成和声" 按钮
   - 系统将自动计算最优的四部和声

4. **播放与调整**
   - 点击 "▶ 播放" 听取生成的和声
   - 使用 "撤销" 和 "清空" 编辑旋律

### 三种模式说明

#### 自由模式（FREE）
- 任意构建和声进行
- 自由选择和弦类型
- 系统验证法则合规性

#### 高音题模式（SOPRANO）  
- 给定旋律（高音）
- 自动生成下三声部（中音、男高音、男低音）
- 适用于作曲教学

#### 旋律写作模式（COMPOSE）
- 放松音域限制
- 允许更多创意表现
- 适用于自由创作

## API 端点

### 初始化会话
```
POST /api/init
Content-Type: application/json
Body: {"key": "g 小调 (g minor)", "mode": "FREE"}
```

### 生成和声
```
POST /api/generate-voicing
Content-Type: application/json
Body: {
  "session_id": "123456",
  "soprano_notes": [60, 62, 64, 65]
}
```

### 获取所有调性
```
GET /api/keys
```

### 更改调性
```
POST /api/change-key
Content-Type: application/json
Body: {"session_id": "123456", "key": "C 大调"}
```

### 更改模式
```
POST /api/change-mode
Content-Type: application/json
Body: {"session_id": "123456", "mode": "SOPRANO"}
```

## 算法说明

### 核心算法流程

1. **初始化**
   - 从允许的起始和弦中生成所有可能的四部配置
   - 每个配置包含四部音符的MIDI值

2. **DAG构建**
   - 对于旋律的每个音高，构建一层可能的和弦配置
   - 根据`dna.py`中定义的和弦进行规则连接
   - 使用动态规划评估每个连接的成本

3. **声部规则评估**
   ```
   总成本 = 低音跳进代价 
           + 旋律跳进代价
           + 内声部跳进代价
           + 平行五八度代价
           + 假关系代价
           + 方向相同代价
           + 声部交叉代价
           + 同度代价
   ```

4. **最优路径选择**
   - 反向遍历DAG（从最后一步到第一步）
   - 删除不能到达有效终止和弦的状态
   - 选择累积成本最小的路径

5. **回退策略**
   - 若无有效路径，启动全库搜索
   - 允许任何和弦到任何和弦的转移
   - 仅由声部法则做最终判断

## 数据格式

### 和弦配置（Voice Configuration）
```json
{
  "S": 72,    // 高音（Soprano）- MIDI值
  "A": 65,    // 中音（Alto）
  "T": 60,    // 男高音（Tenor）
  "B": 48     // 男低音（Bass）
}
```

### 生成结果
```json
{
  "chord": "T",
  "voices": {"S": 72, "A": 65, "T": 60, "B": 48},
  "note_names": {"S": "C5", "A": "F4", "T": "C4", "B": "C3"}
}
```

## 扩展与自定义

### 添加新的和弦
在`dna.py`中的`MAJOR_DNA`或`MINOR_DNA`中添加：
```python
"NewChord": {
    "next": ["T", "D", ...],           # 可进行的后续和弦
    "bass_options": [36, 48],          # 可能的低音
    "required": {0, 4, 7},             # 必需的音类（PC集）
    "max_counts": {4: 1, 7: 1}         # 各音类的最大出现次数
}
```

### 调整规则权重
修改`rules.py`中的惩罚系数：
```python
bass_penalty = bass_leap * 0.5         # 调整低音跳进权重
all_same_dir_penalty = 3000            # 调整方向相同权重
```

### 改变音频参数
在`player.py`中修改：
```python
bpm = 65                    # 改变速度
duration_per_chord = ...    # 改变每个和弦的时长
```

## 已知限制

1. **性能**
   - 旋律序列过长（>20音符）可能较慢
   - 建议单次最多20音符左右

2. **浏览器兼容性**
   - 需要Web Audio API支持
   - 建议使用Chrome, Firefox, Safari最新版

3. **音频合成**
   - 简化的四部混合（每部分平等音量）
   - 不支持MIDI外接设备

## 问题排查

### 页面无法加载
- 检查Flask服务是否运行：`http://localhost:5000`
- 查看浏览器控制台错误信息

### 生成失败 "此题无解"
- 尝试不同的起始音
- 切换到不同的调性
- 使用更多音符来减少限制

### 音频无声
- 检查浏览器音量设置
- 确保允许网站使用音频
- 在浏览器安全设置中允许混合内容

## 许可证

MIT License - 自由使用和修改

## 参考资源

- Riemann Harmony Theory
- Kostka, Payne, Almén - Tonal Harmony
- Web Audio API Documentation
- Flask Documentation

## 贡献

欢迎提交问题报告和功能请求！

---

**作者**: Harmonic Web Project
**最后更新**: 2026年6月
