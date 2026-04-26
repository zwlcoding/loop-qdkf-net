# Design: Mission Extraction Loop

## Architecture

### Game Flow
```
MainMenu → MissionSelect → BattleSetup → Battle → ExtractionDecision → ResultSummary → MainMenu
                                    ↑                    ↓
                                    └── ContinueBattle ←─┘ (if not extracting)
```

### Data Model
```typescript
// 任务定义
interface Mission {
  id: string
  name: string
  description: string
  difficulty: 'easy' | 'normal' | 'hard'
  rewards: Reward[]
  unlockCondition?: UnlockCondition
}

// 运行进度
interface RunProgress {
  missionId: string
  currentTurn: number
  extractionAvailable: boolean
  extractionTurn: number  // 最早可提取回合
  squadStates: SquadState[]
  collectedRewards: Reward[]
}

// 奖励
interface Reward {
  type: 'resource' | 'experience' | 'unlock'
  itemId: string
  amount: number
}
```

### 提取机制
- **提取条件**：战斗进行到指定回合（如第 5 回合后）
- **提取方式**：玩家主动选择结束战斗
- **提取判定**：
  - 成功：存活单位 ≥ 1，且满足任务目标
  - 失败：全灭或未满足目标
- **风险**：继续战斗可能获得更多奖励，但也可能全灭

### 进度保存
- 使用 localStorage 保存 RunProgress
- 每次提取结算后自动保存
- 启动时检查是否有未完成的运行

## Component Design

### MissionSelectScene
- 显示可用任务列表
- 显示任务难度、奖励预览
- 锁定未解锁的任务
- 选择任务后进入 BattleSetup

### ExtractionManager
- 监听战斗回合数
- 提取条件满足时通知 UI
- 处理提取判定逻辑
- 结算奖励

### ProgressManager
- save(progress: RunProgress): void
- load(): RunProgress | null
- clear(): void
- hasUnfinishedRun(): boolean

## Integration Points
- `BattleScene.ts`: 集成 ExtractionManager，回合结束时检查提取条件
- `BattleResultSummary.ts`: 扩展为完整奖励结算
- `BootScene.ts`: 启动时检查未完成运行
- `SetupScene.ts`: 添加"继续运行"选项

## Mobile Considerations
- 任务选择：大按钮，垂直排列
- 提取按钮：战斗 UI 中明显位置
- 奖励结算：全屏展示，清晰易读
