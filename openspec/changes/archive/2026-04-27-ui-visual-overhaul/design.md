# UI 与视觉升级 - 设计规格

## 设计系统 Theme.ts

### 色彩体系
```typescript
export const COLORS = {
  bg: {
    primary: 0x0f172a,    // 主背景 - 深蓝黑
    secondary: 0x1e293b,  // 次背景 - 卡片/面板
    card: 0x1e293b,       // 卡片背景
    hover: 0x334155,      // 悬停状态
    overlay: 0x020617cc,  // 遮罩层
  },
  text: {
    primary: 0xf8fafc,    // 主文字 - 白色
    secondary: 0xe2e8f0,  // 次文字 - 浅灰
    muted: 0x94a3b8,      // 弱化文字
    dim: 0x64748b,        // 更弱化
  },
  accent: {
    blue: 0x3b82f6,       // 主强调色
    blueLight: 0x93c5fd,  // 浅蓝
    blueDark: 0x1d4ed8,   // 深蓝
    green: 0x22c55e,      // 成功/简单
    yellow: 0xeab308,     // 警告/普通
    red: 0xef4444,        // 危险/困难
    purple: 0xa855f7,     // 特殊
  },
  border: {
    subtle: 0x334155,     // 细微边框
    strong: 0x475569,     // 强调边框
    accent: 0x3b82f680,   // 蓝色边框
  },
  terrain: {
    plain: 0x4ade80,      // 草地绿
    mountain: 0xa3744c,   // 山地棕
    urban: 0x6b7280,      // 城市灰
    forest: 0x166534,     // 森林深绿
    water: 0x2563eb,      // 水域蓝
  },
  difficulty: {
    easy: 0x22c55e,
    normal: 0xeab308,
    hard: 0xef4444,
  },
  squad: {
    alpha: 0x1d4ed8,      // 蓝队
    bravo: 0xb91c1c,      // 红队
    enemy: 0xb45309,      // 敌方
  }
};
```

### 字体规范
```typescript
export const FONTS = {
  title: { family: 'monospace', sizes: { sm: '24px', md: '32px', lg: '40px', xl: '56px' } },
  body: { family: 'monospace', sizes: { xs: '11px', sm: '12px', md: '14px', lg: '16px' } },
  ui: { family: 'monospace', sizes: { sm: '13px', md: '15px', lg: '18px' } },
  hud: { family: 'monospace', sizes: { sm: '11px', md: '13px', lg: '15px' } },
};
```

### 按钮组件
- 圆角矩形背景
- 悬停：背景色变亮 20%
- 点击：背景色变暗 10% + 缩放 0.95
- 过渡动画：150ms ease

### 面板组件
- 圆角矩形背景
- 半透明深色填充
- 细边框描边
- 可选标题栏

## 角色精灵图规格

### 风格定义
- **类型**：像素风 Q 版（chibi）
- **尺寸**：64x64 像素（含透明边距）
- **色调**：暗色调奇幻，与游戏深蓝背景协调
- **视角**：正面略俯视（适合等距地图）

### Vanguard（先锋）
- 重甲，蓝灰色调
- 大盾牌 + 单手剑
- 厚重感，站姿稳定

### Skirmisher（游击）
- 轻甲，绿灰色调
- 双持短刀/匕首
- 纤细敏捷，站姿前倾

### Controller（控场）
- 法袍，紫色调
- 法杖 + 符文环绕
- 神秘感，站姿从容

### Support（支援）
- 轻甲，白色/浅蓝色调
- 医疗包 + 法杖
- 温暖感，站姿友好

### Caster（输出）
- 法袍，深紫色调
- 法球/魔法能量
- 强大感，站姿自信

## 地形贴图规格

### 风格定义
- **类型**：等距视角像素风
- **尺寸**：128x128 像素（等距菱形）
- **色调**：与角色风格统一的暗色调奇幻

### Plain（平原）
- 绿色草地纹理
- 有小草/花朵点缀
- 边缘自然过渡

### Mountain（山地）
- 棕色岩石质感
- 有高度感/立体感
- 岩石纹理

### Urban（城市）
- 灰色石板/地砖
- 有建筑废墟元素
- 工业感

### Forest（森林）
- 深绿色
- 有树木/灌木元素
- 密林感

### Water（水域）
- 蓝色水面
- 有波纹/反光
- 动态感

## 2.5D 等距视角

### 网格变换
- 原始网格：矩形 (x, y)
- 等距投影：菱形 (isoX, isoY)
- 变换公式：
  - isoX = (x - y) * tileWidth / 2
  - isoY = (x + y) * tileHeight / 2

### 高度表现
- 高度值通过 Y 轴偏移表现
- 高处的 tile 在视觉上更靠上
- 高度差 > 1 时添加侧面纹理

### 阴影系统
- 角色在地面投射椭圆阴影
- 阴影大小随高度变化
- 阴影透明度 0.3-0.5

## UI 组件规格

### 主菜单
- 标题：大号字体 + 发光效果
- 背景：渐变深蓝
- 按钮：居中排列，有间距
- 动画：标题呼吸效果，按钮悬停放大

### 任务选择
- 卡片：圆角矩形 + 难度色条
- 悬停：边框发光 + 轻微上移
- 点击：缩放反馈
- 锁定：灰色半透明 + 锁图标

### 战斗 HUD
- 行动面板：底部居中
- 回合信息：左上角
- 日志：右侧滚动
- 单位信息：跟随单位显示

### 结算界面
- 奖励列表：居中面板
- 统计数据：分栏显示
- 按钮：返回主菜单
