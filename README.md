# 摩斯电码挑战 📻

面向无线电爱好者、解谜玩家与摩斯电码初学者的**纯前端游戏化练习工具**。用趣味闯关替代枯燥的传统摩斯训练，帮助你在「玩」中建立听码与识码的手感。

> MVP 已实现三大核心功能；多人竞速、自定义词库、ARRL 标准练习为二期规划，本期未实现。

## ✨ 功能

1. **双向互转 + 蜂鸣播放**
   - 文本 ⇄ 摩斯电码实时互转。
   - 基于 Web Audio API 实时合成蜂鸣声，无需任何音频素材文件。
   - 可调 **音调(Hz)**、**音量**、**速度(WPM)**。
2. **闯关模式**（两种题型，难度渐进）
   - 🔊 **听音猜词**：听蜂鸣声，从选项中选出正确单词。
   - 👁️ **看码猜词**：看摩斯电码，选出正确单词。
   - 关卡随进度提升**播放速度**与**词库难度**，并**关内每题再加速**。
   - 作答后**即时对错反馈**，结算面板显示正确率、得分与星级。
3. **进度持久化（localStorage）**
   - 保存每关**最佳成绩、最佳正确率、星级**与**解锁进度**。
   - 正确率达到 60% 自动解锁下一关。

## 🧱 技术栈

- **Vite + React + TypeScript**：纯静态、无后端。
- **Tailwind CSS**：简洁直观的响应式界面。
- **Web Audio API**：实时生成摩斯蜂鸣。
- **vite-plugin-pwa**：生成 Service Worker，**离线可用**、可「添加到主屏幕」。
- **localStorage**：关卡进度与设置持久化。
- 桌面端 **键盘操作** 与移动端 **触屏操作** 均可用。

## 📁 目录结构

```
morse-challenge/
├── index.html                 # 入口 HTML
├── package.json               # 依赖与脚本
├── vite.config.ts             # Vite + PWA 配置
├── tsconfig.json / tsconfig.node.json
├── tailwind.config.js / postcss.config.js
├── public/
│   ├── favicon.svg
│   └── icons/                 # PWA 图标（由脚本生成）
├── scripts/
│   └── gen-icons.mjs          # 无依赖生成 PNG 图标
└── src/
    ├── main.tsx               # React 挂载入口
    ├── App.tsx                # 顶层状态/导航/标签切换
    ├── index.css              # 全局样式与组件类
    ├── lib/
    │   ├── morse.ts           # 摩斯编解码核心
    │   ├── audio.ts           # Web Audio 蜂鸣播放器
    │   ├── wordbank.ts        # 分层词库
    │   ├── levels.ts          # 关卡配置（难度递进）
    │   └── storage.ts         # localStorage 读写与解锁逻辑
    └── components/
        ├── Header.tsx         # 顶部栏 + 设置入口
        ├── SettingsModal.tsx  # 音调/音量/速度设置
        ├── Converter.tsx      # 双向转换 + 播放
        ├── LevelSelect.tsx    # 关卡网格 + 进度概览
        └── ChallengeRound.tsx # 闯关逻辑 + 即时反馈
```

## 🚀 本地运行

```bash
npm install
npm run dev        # 启动开发服务器（默认 http://localhost:5173）
```

若 `public/icons` 下缺少图标（如克隆后未生成），可运行：

```bash
npm run gen:icons  # 生成 PWA 所需 PNG 图标
```

类型检查：`npm run typecheck`

## 🌐 构建与部署（GitHub Pages）

```bash
npm run build      # 产物输出到 dist/
npm run preview    # 本地预览构建产物
```

将 `dist/` 目录内容部署到 GitHub Pages 即可：

- **Project Pages（推荐）**：仓库 Settings → Pages → Source 选 GitHub Actions，添加如下工作流（`.github/workflows/deploy.yml`）：

  ```yaml
  name: Deploy
  on:
    push:
      branches: [main]
  jobs:
    build:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: 20, cache: npm }
        - run: npm ci
        - run: npm run build
        - uses: actions/upload-pages-artifact@v3
          with: { path: dist }
    deploy:
      needs: build
      runs-on: ubuntu-latest
      permissions: { pages: write, id-token: write }
      environment:
        name: github-pages
        url: ${{ steps.deployment.outputs.page_url }}
      steps:
        - uses: actions/deploy-pages@v4
  ```

- 由于 `vite.config.ts` 已设置 `base: './'`，构建产物使用**相对路径**，无论部署到根域名还是子路径（`user.github.io/repo`）均可正确加载。

> PWA（Service Worker）在部署到 **https**（或 localhost）后生效，刷新一次即可离线访问、可「安装到主屏幕」。

## ⌨️ 操作说明

**转换页**
- 输入文本/电码，实时显示互转结果。
- 【▶ 播放】生成蜂鸣；播放中再次点击可**停止**。
- 快捷键：`Ctrl/⌘ + Enter` 播放文本。

**闯关页**
- 数字键 `1–9`：选择对应选项。
- `空格`：重播当前题蜂鸣。
- `回车`：作答后进入下一题。
- 移动端：直接点击大号按钮与选项卡片。

## 🗺️ 二期规划（本期未实现）

- 多人竞速 / 排行榜
- 自定义词库导入
- ARRL 标准练习课程（Koch/CW 渐进法）
- 更丰富的题型与节奏训练
