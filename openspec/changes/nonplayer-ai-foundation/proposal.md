## Why

当前 MVP 已经证明战斗、任务揭示、撤离和构筑闭环能跑，但还没有验证这个项目最关键的差异点：单人玩家能否通过 bot 队伍、Boss、野怪完成合作 / 竞争 / 反转的高频玩法验证。现在需要先建立统一的非玩家行为系统，用规则评分层把这些非玩家单位跑起来，而不是过早引入真联机或 LLM 决策。

## What Changes

- 新增统一非玩家行为系统，给 bot 队伍、Boss、野怪提供同一套规则评分决策框架
- 定义 AI 决策上下文、候选动作、评分权重和 profile 数据结构
- 支持第二支队伍由 bot profile 托管，用现有三类 mission 验证合作、竞争、反转流程
- 支持首波规则评分层 Boss 行为，用于验证合作需求、阶段压力和撤离张力
- 为后续野怪 / 中立单位层预留同一套 planner 接口，但不在本 change 内要求做完整内容扩展
- 明确 LLM-enhanced Boss AI 为未来增强项，不进入本 change 范围

## Capabilities

### New Capabilities
- `nonplayer-behavior-system`: Defines the unified rule-scored AI foundation for bot squads, bosses, and future wild enemies in tactical runs.

### Modified Capabilities
- `tactical-battle-system`: Battles must support AI-controlled non-player turns through a shared planner without changing core turn-order rules.

## Impact

- Affected code: `frontend/src/scenes/`, `frontend/src/core/`, new `frontend/src/ai/` modules, and focused tests
- Affected behavior: battle turns for non-player units, second-squad bot validation, boss behavior execution
- No new external dependency is required for MVP
- LLM model integration remains explicitly out of scope for this change
