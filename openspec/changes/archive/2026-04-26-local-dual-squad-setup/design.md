## Context

现在 BattleScene 已经能跑 mission、bot squad、boss、手机触控，但进入战斗的流程仍是假数据直灌：`createTestUnits()` 直接生成 A/B 队和可选 boss。这对内部原型够用，但对下一阶段验证不够，因为你无法明确地从“编队 -> 入局 -> 结果结算”看完整闭环，也没法确认双队 setup 是否真的支撑合作 / 竞争 / 反转验证。

## Goals / Non-Goals

**Goals:**
- 提供最小可用的本地双队 setup 入口
- BattleScene 改为从 setup state 启动，而不是只用硬编码 seeded units
- 在局后给出双方结果摘要，便于快速验收关系模型
- 保持现有 AI / mission / mobile controls 兼容

**Non-Goals:**
- 不做正式联网房间系统
- 不做复杂账号/存档系统
- 不做完整编队美术大改
- 不做深度 fog-of-war 系统

## Decisions

### Decision 1: Use a minimal pre-battle setup scene/state instead of building a full meta layer first
- **Decision:** 先做轻量本地 setup scene 或 setup overlay，生成两支通过校验的队伍，再启动 BattleScene。
- **Why:** 先验证出战前双队配置和入局闭环，不需要先造完整 meta 系统。

### Decision 2: Move seeded unit creation behind a battle setup data contract
- **Decision:** BattleScene 不再直接作为 seeded fixture 的唯一来源，而是消费 battle setup data；测试 fixture 仍可通过同一数据接口构造。
- **Why:** 这样后续本地双队、伪联机、甚至未来房间系统都能复用。

### Decision 3: Add a lightweight result summary instead of a full progression screen
- **Decision:** 先做一页局后结果摘要，展示双方生还、撤离、目标完成、收益转换。
- **Why:** 下一阶段要的是验证闭环，不是做完整 meta progression UI。

## Risks / Trade-offs

- setup UI 太简陋可能仍不够友好 → 第一版先保证可用和可验证
- BattleScene 初始化改造容易影响现有测试 → 用 battle setup contract + focused tests 锁住
- 结果页如果过轻可能信息不够 → 优先保证双方 outcome 可见，再慢慢扩展

## Migration Plan

1. 定义双队 battle setup 数据结构与校验入口
2. 增加最小编队/出战入口
3. BattleScene 改为消费 setup 数据初始化单位
4. 增加结果摘要
5. 跑测试/build，并继续用手机 Pages 验证

## Open Questions

- 第一版 setup 是单独 Scene 还是在 Boot/overlay 中完成更合适
- 结果页是否直接回到 setup，还是保留“再来一局”快捷入口
