# 服务状态左侧列宽设计验收

**Findings**

- 当前没有遗留的 P0、P1 或 P2 设计问题。
- 左侧身份列由约 410px 收窄并限制为 280px，服务名称和检测说明均完整显示，没有横向越界。

**Comparison Target**

- Source visual truth: `/tmp/elexvx-status-left-column-before.png`
- Implementation screenshot: `/tmp/elexvx-status-left-column-after.png`
- Combined comparison: `/tmp/elexvx-status-left-column-comparison.svg.png`
- Route/state: `/status`, light theme, desktop, first service group expanded.

**Viewport and Normalization**

- Source and implementation CSS viewport: 1280 × 720.
- Source and implementation focused captures: 1220 × 500 px.
- Browser device pixel ratio: 2; the in-app screenshot API emitted CSS-pixel-sized captures, so no density conversion was required.
- The source capture uses production data while the implementation capture uses local demo data. Comparison is intentionally limited to the shared row geometry, left-column width, status-strip alignment and overflow behavior; service counts are not treated as visual drift.

**Full-view Comparison Evidence**

- Both captures retain the Ant Design status card, group hierarchy, dividers, availability strips, percentages, external-link actions, history action and footer.
- The fix changes only the shared identity-column track. Typography, semantic colors, brand assets, copy style and component structure remain unchanged.
- No desktop or mobile horizontal overflow is present.

**Focused-region Evidence**

- `/tmp/elexvx-status-left-column-comparison.svg.png` places the 410px and 280px states in one comparison input.
- Before: group identity width 410px; monitor identity width 409.2px; availability strip began at x=477.
- After: group and monitor identity widths are both 280px; availability strips begin at x=347–348 and retain matching right endpoints at x=1091–1092.
- The new layout removes approximately 130px of unused left-column space without truncating the longest visible service name.

**Required Fidelity Surfaces**

- Fonts and typography: unchanged Ant Design/system Chinese stack; names and metadata remain single-line and readable.
- Spacing and layout rhythm: shared group/monitor identity track is capped at 280px; availability and uptime tracks remain aligned.
- Colors and visual tokens: healthy, warning, error and unknown state tokens are unchanged.
- Image quality and asset fidelity: no image or logo changes.
- Copy and content: no content-contract changes.

**Interaction and Accessibility Evidence**

- Desktop 1440 × 900 and mobile 390 × 844 end-to-end checks passed.
- Group visibility, history navigation, compact mobile hierarchy and overflow guards passed.
- Axe reports zero violations; labelled availability graphics and keyboard-accessible external links are preserved.
- Browser console contains no errors or warnings after the revised local render.

**Comparison History**

1. [P2] The flexible identity track expanded to about 410px, creating an oversized left region and pushing the availability history too far right.
   - Fix: introduced a shared 280px identity-column token for group and monitor grids.
   - Post-fix evidence: focused capture and browser measurements show 280px identity tracks with no text clipping.
2. [P2] The previous regression test guarded bar-to-bar alignment but did not constrain excessive left-column growth.
   - Fix: added a 1440px viewport assertion that prevents the status strip from drifting beyond the intended horizontal position.
   - Post-fix evidence: 5/5 Playwright tests passed.

**Implementation Checklist**

- [x] Limit left identity column to 280px.
- [x] Preserve group and monitor bar alignment.
- [x] Preserve percentages and external-link actions.
- [x] Preserve compact mobile layout.
- [x] Typecheck, lint, unit tests, build, Playwright and Axe pass.

**Open Questions**

- None.

**Follow-up Polish**

- None required for this scope.

final result: passed
