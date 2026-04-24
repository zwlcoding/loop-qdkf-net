## Why

当前原型虽然已能在桌面浏览器运行，但手机浏览器模式下没有做好移动端适配，也没有一个稳定的远程预览地址。这直接阻碍了你用手机高频验收效果，与“手游优先、竖屏优先”的项目方向冲突，因此需要先插入一个更高优先级的 change 来收口移动端竖屏体验并打通 GitHub Pages 预览链路。

## What Changes

- 新增竖屏移动端运行壳层，明确原型以手机竖屏为第一目标布局
- 收口视口、缩放、舞台尺寸、HUD 布局和安全边距，使主要交互在手机竖屏下可读可点
- 新增 GitHub Pages 预览发布能力，让 `main` 分支更新后自动构建并发布前端原型
- 为 Vite 构建增加适配 GitHub Pages 的基础路径与静态部署配置
- 保持桌面浏览器仍可访问，但不再以桌面横屏作为主设计目标

## Capabilities

### New Capabilities
- `mobile-portrait-runtime`: Defines portrait-first mobile runtime behavior, viewport policy, safe-area handling, and readable HUD/layout constraints for the prototype.
- `web-preview-deployment`: Defines a stable static-preview deployment path for the frontend prototype using GitHub Pages.

### Modified Capabilities
- `tactical-battle-system`: Battle scenes must remain playable when rendered through the portrait-first mobile runtime shell.

## Impact

- Affected code: `frontend/src/`, `frontend/index.html`, `frontend/vite.config.ts`, possible CSS/bootstrap files, and GitHub Actions workflow files under `.github/workflows/`
- Affected systems: runtime layout, viewport/meta handling, build output pathing, deployment pipeline
- External dependency impact: GitHub Pages / GitHub Actions configuration only; no new runtime package is required
