## Why

当前战斗已经有 AI 队伍、Boss、手机触控和远程预览，但 BattleScene 仍依赖硬编码 seeded units 直接开打，缺少真正的“本地双队验证入口”。这会卡住下一阶段最关键的产品验证：玩家是否能在开战前配置两支队伍、进入同一局 mission、并在结果页看到双方收益与撤离结算。要继续验证伪联机关系模型，先把双队 setup 流程补起来。

## What Changes

- 新增本地双队编队 / 出战入口，允许在进入 BattleScene 前生成两支队伍
- BattleScene 改为消费 match setup 数据，而不是直接硬编码 seeded units
- 新增局后结果摘要，显示双方生还、撤离、目标完成与收益转换
- 保持现有 mission / AI / mobile touch / Pages 流程继续可用

## Capabilities

### New Capabilities
- `local-dual-squad-setup`: Defines a local pre-battle setup flow for two squads and a post-battle result summary.

### Modified Capabilities
- `tactical-battle-system`: Battles may start from validated squad setup data instead of only hardcoded scene fixtures.

## Impact

- Affected code: `frontend/src/scenes/`, `frontend/src/core/`, possible new `frontend/src/ui/` or setup state files
- Affected systems: squad assembly flow, battle scene initialization, match result summary
- No backend dependency required
