# GitHub 上传与协作设置指南

## 项目：Sposobin（股票分析系统）

---

## 第一步：在 GitHub 上创建私有仓库

1. 打开 https://github.com/new
2. 填写仓库名称：`Sposobin`
3. **务必选择 "Private"（私有）** — 这是关键！私有仓库确保只有被邀请的人才能看到代码。
4. 不要勾选任何初始化选项（因为本地已有代码）
5. 点击 "Create repository"

---

## 第二步：在本地初始化 Git 并推送到 GitHub

打开终端（CMD 或 PowerShell），执行以下命令：

```bash
# 进入项目目录
cd C:\Users\MSI-II\Desktop\py_stock\Sposobin

# 初始化 Git 仓库
git init

# 添加所有文件到暂存区
git add .

# 创建第一个提交
git commit -m "初始提交：股票分析系统"

# 添加远程仓库（替换 YOUR_USERNAME 为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/Sposobin.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

> **注意**：如果之前已经初始化过 Git，可以跳过 `git init`，直接 `git add .` 和 `git commit`。

---

## 第三步：邀请协作者（让他们能编辑但不能下载）

这是你需求的核心部分。**重要提示**：GitHub 本身没有"可以编辑但不能下载"的权限。但以下是你能做的最接近的方案：

### 方法 A：通过 GitHub Web 界面邀请（推荐）

1. 进入仓库页面 → **Settings** → **Collaborators and teams**
2. 点击 **"Add people"**
3. 输入对方的 GitHub 用户名或邮箱
4. 在权限选择中：
   - 如果选 **Write**（写入）：对方可以推送代码、创建分支，**但也可以克隆/下载代码**
   - 如果选 **Triage**（分类）：对方可以查看 Issue、PR，**但不能推送代码，也不能直接下载**
   - 如果选 **Read**（读取）：对方只能查看，**不能编辑也不能下载**（但可以看到代码内容）

### 方法 B：通过 GitHub CLI 命令

```bash
# 安装 GitHub CLI 后，先登录
gh auth login

# 邀请协作者（设置权限为 write/triage/read）
gh api repos/YOUR_USERNAME/Sposobin/collaborators/COLLABORATOR_USERNAME -X PUT -f permission=write
```

---

## 第四步：配置分支保护（强制通过 PR 协作）

如果你希望协作者只能通过 Pull Request 提交代码（不能直接推送到 main 分支）：

1. 进入仓库 → **Settings** → **Branches** → **Add branch protection rule**
2. 在 "Branch name pattern" 中输入：`main`
3. 勾选以下选项：
   - ✅ **Require a pull request before merging**（需要 PR 才能合并）
   - ✅ **Require approvals**（需要审核）
   - ✅ **Dismiss stale pull request approvals when new commits are pushed**
   - ✅ **Require status checks**（可选）
4. 点击 **Create**

---

## 第五步：限制下载的额外措施

### ⚠️ 现实说明

GitHub 的权限模型是这样的：
| 权限级别 | 查看代码 | 下载 ZIP | Git Clone | 推送代码 |
|---------|---------|---------|-----------|---------|
| Read    | ✅      | ✅      | ✅        | ❌      |
| Triage  | ✅      | ✅      | ✅        | ❌      |
| Write   | ✅      | ✅      | ✅        | ✅      |
| Maintain| ✅      | ✅      | ✅        | ✅      |
| Admin   | ✅      | ✅      | ✅        | ✅      |

**任何能查看代码的人理论上都可以下载**（通过 Download ZIP 或 git clone）。

### 最佳替代方案：使用 GitHub Codespaces

GitHub Codespaces 允许协作者**在云端编辑代码**，而**不需要将代码下载到本地**：

1. 进入仓库 → **Settings** → **Codespaces**
2. 启用 Codespaces
3. 创建一个 `.devcontainer/devcontainer.json` 配置文件（见下方）
4. 协作者点击仓库页面的 **"Code"** → **"Open with Codespaces"**
5. 他们在浏览器中编辑代码，代码始终留在 GitHub 服务器上
6. **可以限制 Codespaces 的导出/下载功能**

### 创建 Codespaces 配置

```bash
mkdir .devcontainer
```

### 限制下载的实际可行策略

如果要**最大程度保护代码**，建议组合使用：

1. ✅ **私有仓库** — 基础保护
2. ✅ **只给 Read 权限** — 协作者只能看代码，不能直接修改
3. ✅ **通过 Issue + PR 流程协作** — 协作者提 Issue 描述修改，你实现
4. ✅ **或使用 Codespaces** — 在线编辑，不下载到本地
5. ✅ **签署 NDA（保密协议）** — 法律层面约束

---

## 快速操作命令汇总

```bash
# 如果你的项目尚未初始化 Git
cd C:\Users\MSI-II\Desktop\py_stock\Sposobin
git init
git add .
git commit -m "初始提交"
git remote add origin https://github.com/YOUR_USERNAME/Sposobin.git
git branch -M main
git push -u origin main

# 邀请协作者（替换为真实的 GitHub 用户名）
gh api repos/YOUR_USERNAME/Sposobin/collaborators/username123 -X PUT -f permission=write
```
