# 服务状态子级缩进设计验收

**Findings**

- 当前没有遗留的 P0、P1 或 P2 设计问题。
- 分组标题保持原始基线，组内服务的状态点与文字建立清晰的子级缩进，状态条、百分比和操作列均未移动。

**Comparison Target**

- Source visual truth: `/tmp/elexvx-status-indent-before.png`
- Implementation screenshot: `/tmp/elexvx-status-indent-after.png`
- Combined comparison: `/tmp/elexvx-status-indent-comparison.svg.png`
- Mobile implementation screenshot: `/tmp/elexvx-status-indent-mobile-after.png`
- Route/state: `/status`, light theme, first service group expanded.

**Viewport and Normalization**

- Desktop source and implementation viewport: 1280 × 720.
- Mobile implementation viewport: 390 × 844.
- Source and implementation were captured from the same local route and data state; only the update timestamp changed between captures.

**Full-view Comparison Evidence**

- Before: “企业服务”和组内“企业官网”文字起点分别为 x=69px、x=70px，层级视觉上基本齐平。
- After: 分组文字仍为 x=69px，组内服务文字移动到 x=94px，形成 25px 的可见层级差。
- 分组状态条仍从 x=347px 开始，服务状态条仍从 x=348px 开始；左右端点保持对齐。
- 桌面端与移动端均没有横向溢出。

**Focused-region Evidence**

- `/tmp/elexvx-status-indent-comparison.svg.png` 将修复前后放入同一比较输入。
- 子级身份区域只增加内侧缩进，没有改变共享的 280px 身份列，也没有挤压状态历史条。
- 移动端使用 12px 内部缩进；实际分组与子级文字起点差为 25px，兼顾层级和窄屏空间。

**Required Fidelity Surfaces**

- Fonts and typography: 字体、字号、字重及单行截断规则保持不变。
- Spacing and layout rhythm: 桌面子级内缩 24px，移动端子级内缩 12px；行高、分隔线和卡片节奏不变。
- Colors and visual tokens: 健康、警告、异常和未知状态颜色不变。
- Image quality and asset fidelity: 本次不涉及图片或品牌资产修改。
- Copy and content: 服务名称、检测说明、可用率与状态数据不变。

**Interaction and Accessibility Evidence**

- 桌面 1440 × 900 与移动 390 × 844 状态页端到端检查通过。
- 状态条标签、展开分组、历史页面入口和外部链接行为保持不变。
- Axe 无违规；桌面和移动端均无横向溢出。
- 新增回归断言要求子级名称相对分组名称缩进 20–30px，并继续验证分组/服务状态条端点对齐。

**Comparison History**

1. [P2] 分组标题与组内服务文字几乎处于同一水平起点，无法清楚表达父子层级。
   - Fix: 只对 `.monitorIdentity` 增加桌面 24px、移动 12px 的内侧缩进。
   - Post-fix evidence: 桌面文字起点差从 1px 增加到 25px，状态条坐标保持不变。
2. [P2] 若直接缩进整行，会破坏之前验收通过的状态条对齐。
   - Fix: 缩进限定在身份单元内部，并保留 280px 网格列宽。
   - Post-fix evidence: 分组与服务状态条左右端点偏差仍不超过 1px。

**Implementation Checklist**

- [x] 分组标题保持原位。
- [x] 组内服务状态点和文字统一缩进。
- [x] 状态条、百分比和操作列保持对齐。
- [x] 移动端使用更紧凑的层级缩进。
- [x] 增加层级缩进回归测试。
- [x] 视觉比较与无溢出检查通过。

**Open Questions**

- None.

**Follow-up Polish**

- None required for this scope.

final result: passed
