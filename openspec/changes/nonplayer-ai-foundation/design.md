## Context

当前前端原型的战斗系统、任务揭示、撤离逻辑、底盘和模块系统都已完成并归档，但 `BattleScene` 仍直接硬编码测试队伍，非玩家单位没有统一决策系统。项目下一阶段的核心风险不是底层战斗规则，而是多人关系模型和 PvE 压力是否成立：单人玩家能否和 bot 协作、竞争、反转；Boss 是否能成为任务锚点；后续野怪是否能作为第三方压力接入。

现阶段的约束很明确：
- 只做规则评分层
- 不接真联机
- 不接 LLM 决策
- 不引入复杂搜索树
- 需要可测试、可重放、可调参

## Goals / Non-Goals

**Goals:**
- 建立统一 AI foundation，让 bot 队伍、Boss、未来野怪复用同一套 planner
- 让第二支队伍能被最小 profile 托管，验证合作 / 竞争 / 反转 mission
- 让 Boss 能在规则评分层上执行可读、可压迫、可验证的行为
- 保持现有 TurnManager / ActionResolver / MissionManager 的核心规则不被重写
- 用 focused tests 锁住评分、profile 切换和关键行为结果

**Non-Goals:**
- 不做真联机或房间系统
- 不做 LLM-enhanced Boss AI
- 不做复杂路径搜索树、多回合规划或高级心理战
- 不做完整野怪内容扩容；本 change 只预留统一接口和最小可复用结构
- 不在本 change 内完成编队 UI 或大规模视觉升级

## Decisions

### Decision 1: Use a unified rule-scored planner instead of separate AI code paths
- **Decision:** Introduce `frontend/src/ai/` with shared primitives: `DecisionContext`, `ActionCandidate`, `ScoreWeights`, `AiPlanner`, `AiProfiles`.
- **Why:** bot 队伍、Boss、野怪本质上都在同一个战场上根据任务、关系、位置和风险选动作；先统一 planner 能避免三套分散逻辑。
- **Alternatives considered:**
  - **Separate bot/boss/wild enemy logic:** 初期看似快，但很快会重复、分叉、难调参。
  - **Behavior tree or search tree first:** 超出当前验证阶段需求，调试成本高。

### Decision 2: Keep AI outputs as scored intents, not direct unrestricted commands
- **Decision:** Planner 只从合法动作候选集中选最高分动作，由现有 battle/core 层负责合法性、范围、冷却和执行。
- **Why:** 这样能复用现有战斗护栏，避免 AI 直接绕开规则；也为未来 LLM 只输出高层意图保留接口。
- **Alternatives considered:**
  - **AI directly mutates battle state:** 风险高，测试和回放困难。
  - **AI directly issues raw movement/skill commands without guardrails:** 容易出现非法动作和调试困难。

### Decision 3: Ship bot squad profiles before full boss/wild enemy content expansion
- **Decision:** Implementation order is planner foundation -> bot squad profiles -> boss profile integration -> future wild enemy reuse.
- **Why:** 单人高频验证多人关系是当前最重要风险，bot 队伍最直接服务这个目标；Boss 紧随其后验证合作需求和阶段压力；野怪放后续复用。
- **Alternatives considered:**
  - **Boss first:** 有价值，但不如 bot squad 直接解决单人验证问题。
  - **Wild enemy first:** 更像调味层，不应先于 bot/Boss。

### Decision 4: Model relationship changes as profile or weight switching, not a new combat mode
- **Decision:** `reversal_squad` 等关系变化通过 mission state 驱动 profile/weight 切换，不新增独立回合制子系统。
- **Why:** 反转本质上是目标优先级变化，不该重写核心战斗循环。
- **Alternatives considered:**
  - **Separate reversal combat mode:** 复杂且会重复 battle logic。

## Risks / Trade-offs

- **评分维度过少导致 bot 太蠢** → 先覆盖 objective / survival / threat / position / escape / support 六类评分，并用 focused tests 锁住基本行为
- **评分维度过多导致调参失控** → 第一版 profile 只允许少量权重差异，不做复杂行为树
- **BattleScene 集成过快导致测试脆弱** → 先在 `frontend/src/ai/` 与 core 层写 focused tests，再做最小场景接入
- **Boss 行为不够“像 Boss”** → 第一版只要求可读和有压迫，不要求高智商；保留后续增强空间
- **未来 LLM 需求污染当前设计** → 当前 planner 明确是规则层；LLM 仅作为未来高层意图扩展，不进入本 change

## Migration Plan

1. 新增 `frontend/src/ai/` 基础模块和 focused tests
2. 把第二支队伍接到 planner，让 mission 模板在本地 bot 对局中可跑
3. 接入最小 Boss profile，验证 mission 锚点与压力行为
4. 保持 `npm test` 和 `npm run build` 通过
5. 归档 change 后，再进入下一轮野怪层或编队入口 UI 的 spec

## Open Questions

- 第二支队伍是否在本 change 内继续沿用 BattleScene seeded roster，还是顺手抽成轻量 squad setup data source
- Boss 第一版是否需要专属 profile 外再加简单阶段阈值脚本，还是完全靠 context + weights 就够
- 野怪的最小接口是否要在本 change 内做空实现，还是只在 planner 设计里保留扩展点
