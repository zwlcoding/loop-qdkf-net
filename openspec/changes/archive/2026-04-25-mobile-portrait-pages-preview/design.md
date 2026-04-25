## Context

当前前端原型的核心玩法闭环已经存在，但运行壳层仍偏桌面开发视角：Vite 配置没有针对 GitHub Pages 设置基础路径，前端没有明确的手机竖屏视口策略，也没有稳定的远程预览地址。结果是手机浏览器模式下布局和可读性不稳定，而你又明确希望后续每次完成 spec 后能直接在手机刷新页面验收效果。

当前约束：
- 以手机竖屏为第一目标
- 不能破坏现有前端 build/test
- GitHub Pages 预览应尽量自动化，基于当前 GitHub 仓库和 `main` 分支即可访问
- 这份 change 先解决运行壳层和部署链路，不扩展战斗玩法本身

## Goals / Non-Goals

**Goals:**
- 明确竖屏移动端是当前原型的主运行形态
- 让游戏在常见手机宽度下保持可读、可点、可继续验证玩法
- 为 HUD、日志、调试信息建立移动端收口规则，而不是继续默认桌面布局
- 配置 GitHub Pages 自动部署，让主分支更新后能刷新手机页面直接看效果
- 保持桌面预览仍可用，但从属于移动端优先策略

**Non-Goals:**
- 不在本 change 内完成完整视觉重做
- 不在本 change 内引入真联机、LLM Boss 或新玩法系统
- 不追求所有手机型号的完美适配；先覆盖主流竖屏场景
- 不把 GitHub Pages 当成生产环境，只作为验收预览链路

## Decisions

### Decision 1: Use a portrait-first runtime shell instead of ad hoc scene-specific tweaks
- **Decision:** 把手机竖屏适配定义为运行壳层能力，统一处理 viewport、舞台尺寸、safe area、主 UI 排布，而不是在 BattleScene 里散着补样式。
- **Why:** 这样后续新增场景和 HUD 才能复用，不会每个页面都重新补洞。
- **Alternatives considered:**
  - **Patch only BattleScene HUD positions:** 能暂时缓解，但后续很快再次漂移。
  - **Keep desktop-first and rely on browser zoom:** 与项目方向相反，手机验收体验差。

### Decision 2: Keep the Phaser game inside a bounded mobile canvas container
- **Decision:** 使用明确的 portrait container / scaling policy，把 Phaser 舞台限制在适合手机纵向的区域内，并让 HUD 根据容器尺寸而不是桌面窗口硬编码定位。
- **Why:** 手机竖屏真正的问题是可读性与可点击区域，而不是单纯缩小整页。
- **Alternatives considered:**
  - **Let Phaser fill the full viewport without layout constraints:** 容易导致 HUD 挤压、遮挡、点击目标过小。

### Decision 3: Deploy preview from GitHub Actions to GitHub Pages
- **Decision:** 新增 GitHub Actions workflow，在 push 到主分支后构建 `frontend` 并发布到 GitHub Pages。
- **Why:** 这是最低摩擦的远程验收链路，不需要额外服务器。
- **Alternatives considered:**
  - **Manual local preview only:** 不能解决手机高频验收问题。
  - **Third-party static hosting first:** 比 GitHub Pages 更重，也没必要。

### Decision 4: Use repository-aware base path configuration for Vite
- **Decision:** 为 Pages 构建设置与仓库名匹配的 base path，避免静态资源在子路径下失效。
- **Why:** 当前 repo 不是 user/organization root pages，必须处理子路径部署。
- **Alternatives considered:**
  - **Keep Vite base empty:** 在 GitHub Pages 子路径下很容易资源 404。

## Risks / Trade-offs

- **竖屏收口后桌面观感变差** → 桌面只要求可用，不要求继续作为主视觉目标
- **HUD 信息太多，移动端仍拥挤** → 优先保证关键任务信息和操作区；次级调试信息可折叠或下沉
- **GitHub Pages base path 配错导致白屏** → 用仓库名校验 build 产物路径，并在部署后立即验证
- **主分支每次 push 自动部署增加等待时间** → 可接受，换来手机端稳定验收链路

## Migration Plan

1. 先提交并推送当前仓库基线，确保远程仓库包含现有原型
2. 实现 mobile portrait runtime change，修正 viewport 和布局
3. 配置 GitHub Pages workflow 与 Vite base path
4. push 到 GitHub 后验证 Pages URL 可访问
5. 之后每次完成并归档 change，都通过该 URL 直接验收手机效果

## Verification Status

- GitHub Actions workflow `Deploy frontend to GitHub Pages` 已成功运行：`24919106526`
- 预览地址 `https://zwlcoding.github.io/loop-qdkf-net/` 已可打开，可作为后续手机验收入口
- 当前部署基线对应 `main` 上的提交：`ab1cab8`

## Open Questions

- 是否需要同时提供一个简单的“横屏不推荐”提示，还是直接强制竖屏布局即可
- 调试面板在手机端是默认隐藏还是保留折叠入口
- 是否要把 Pages 预览固定在 `main`，还是后续再补 preview branch / PR preview 机制
