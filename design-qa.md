# 服务状态条对齐设计验收

**Findings**

- 当前没有遗留的 P0、P1 或 P2 设计问题。
- [P3] 总览条与服务条的右边缘仍存在约 1 CSS px 的抗锯齿/边框取整差异，不构成可见错位，也不会随内容变化累积。

**Comparison Target**

- Source visual truth: `/var/folders/k4/mgjk9gsj2q16n5_csyg45bp40000gn/T/codex-clipboard-463560c2-ae45-456b-8630-55fc090e30be.png`
- Full implementation screenshot: `/tmp/elexvx-status-alignment-after.png`
- Focused implementation screenshot: `/tmp/elexvx-status-alignment-focused-after.png`
- Combined comparison: `/tmp/elexvx-status-alignment-comparison-square.svg.png`
- Route/state: `http://127.0.0.1:4321/status`, light theme, healthy demo data, first service group expanded.

**Viewport and Normalization**

- Source crop: 1326 × 1342 px; it is a user-provided focused crop rather than a complete browser viewport.
- Implementation browser viewport: 1280 × 720 CSS px at device pixel ratio 2.
- Full implementation capture: 1265 × 1200 px; focused capture: 1200 × 360 px.
- The in-app browser screenshot API emitted CSS-pixel-sized captures, so no extra 2× downsampling was applied.
- The combined 1840 × 1840 px comparison places the source crop and focused implementation in one image. Because the source is a marked crop, comparison is limited to the availability-bar alignment surface rather than page-wide scale.

**Full-view Comparison Evidence**

- `/tmp/elexvx-status-alignment-after.png` confirms the status card, expanded service group, row dividers, uptime values and external-link controls remain intact after the grid change.
- Typography, colors, status semantics, image assets and copy are unchanged by this alignment-only fix.
- The status card has no horizontal overflow at desktop or mobile viewports.

**Focused-region Evidence**

- `/tmp/elexvx-status-alignment-comparison-square.svg.png` places the marked source region and the revised bar region into one visual comparison input.
- The reference calls for every 60-day strip to share the same left and right endpoints.
- Browser measurements after the fix: group strip `x=477.0`, `right=1092.0`; first monitor strip `x=477.195`, `right=1091.0` at the 1280 px viewport.
- All expanded monitor rows reuse the same grid tracks and therefore repeat the same measured endpoints.

**Required Fidelity Surfaces**

- Fonts and typography: unchanged Ant Design/system Chinese font stack; no new wrapping, clipping or weight drift.
- Spacing and layout rhythm: group and monitor rows now share the same identity, availability and uptime tracks; monitor actions are isolated from those tracks.
- Colors and visual tokens: existing healthy, warning, error and unknown semantic colors are unchanged.
- Image quality and asset fidelity: no image or logo changes were made.
- Copy and content: service names, cadence, percentages and navigation copy are unchanged.

**Interaction and Accessibility Evidence**

- Tested desktop 1440 × 900 and mobile 390 × 844 through Playwright.
- Tested group rendering, history navigation, mobile hierarchy and horizontal-overflow guards.
- Availability strips retain their labelled `role="img"`; external service links remain keyboard accessible.
- Axe reports zero violations in the status-page end-to-end test.
- Browser console and page-error collection returned no application errors.

**Comparison History**

1. [P2] Aggregate bars and monitor bars used different grid definitions, gaps and content padding; production measurement showed `x=461/right=1052` versus `x=454/right=1033`.
   - Fix: corrected the Ant Design 6 collapse-body selector, unified the three content tracks, and removed the external action from the sizing grid.
   - Post-fix evidence: `x=477/right=1092` versus `x=477.195/right=1091` in the focused local capture.
2. [P2] The layout had no automated guard against this regression.
   - Fix: added an end-to-end assertion requiring the aggregate and first monitor strip endpoints to remain within 1 CSS px.
   - Post-fix evidence: 5/5 Playwright tests passed at desktop and mobile breakpoints.

**Implementation Checklist**

- [x] Align aggregate and per-service availability strips.
- [x] Keep uptime and external-link controls aligned.
- [x] Preserve compact mobile rows and hide strips below 768 px.
- [x] Add endpoint-alignment regression coverage.
- [x] Typecheck, lint, unit tests, build, Playwright and Axe pass.

**Open Questions**

- None.

**Follow-up Polish**

- None required for this scope.

final result: passed
