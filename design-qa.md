# 服务状态页设计验收

**Findings**

- 当前没有遗留的 P0、P1 或 P2 设计问题。
- [P3] 设计稿中的抽象图标未直接用于成品；实现保留了项目现有的 Elexvx 品牌 Logo。这是品牌资产约束下的有意差异，不影响布局与功能。
- [P3] 设计稿使用示意分组和组件数量，实现展示 UptimeRobot 的真实分组契约与当前 9 个监控项，因此文案和行数会随监控配置变化。

**Comparison Target**

- Source visual truth: `design/status-page-reference.png`
- Desktop implementation: `design/qa/status-desktop-normalized.jpg`
- Mobile implementation: `design/qa/status-mobile-postfix.jpg`
- Combined comparison: `design/qa/status-desktop-comparison-normalized.png`
- Route/state: `http://127.0.0.1:4321/status`, light theme, healthy demo data, first service group expanded.

**Viewport and Normalization**

- Source image: 1610 × 977 px. Its desktop board occupies the left 1218 × 977 px; that region was normalized to 1200 × 965 px for the desktop comparison.
- Desktop browser viewport: 1215 × 977 CSS px. The page content viewport is 1200 px wide after the browser scrollbar; the screenshot is 1200 × 965 px.
- Mobile browser viewport: 390 × 844 CSS px. The content viewport is 375 px wide after the browser scrollbar; the screenshot is 375 × 812 px.
- Browser device pixel ratio was 2. The in-app browser screenshot API emitted CSS-pixel-sized captures, so no additional 2× downsampling was applied to implementation screenshots.
- The source mobile design includes a phone bezel while the implementation capture is content-only. Mobile evidence is therefore used for responsive hierarchy and overflow validation, not bezel-level pixel comparison.

**Full-view Comparison Evidence**

- `design/qa/status-desktop-comparison-normalized.png` places the normalized source desktop board and implementation at the same 1200 × 965 content size.
- Layout hierarchy matches the selected direction: compact brand header, green overall-status alert, bordered system-status surface, grouped availability history, monitor rows, history action, and restrained footer.
- Typography uses the Ant Design/system Chinese font stack with coherent title, group, monitor, metadata, and numeric hierarchy. No clipping or unintended wrapping was found.
- Spacing preserves the source rhythm while allowing the expanded real monitor group to use more vertical space. Desktop main width is 1000 px and header content width is 1120 px.
- Colors map to Ant Design tokens with a white/light-gray surface system, blue actions, green healthy state, amber warning history, and accessible gray secondary text.
- The only visible raster brand asset is the existing Elexvx Logo. It remains sharp at its displayed size and is not replaced by CSS art, emoji, or a handcrafted SVG.
- Copy is product-specific and coherent: current health, last update, service groups, monitor cadence, history, subscription, footer, and ICP information.

**Focused-region Evidence**

- A separate crop was not required because the normalized full-view comparison retains the header, alert typography, 60-day bars, row dividers, icons, and action controls at readable size.
- Mobile-specific details were checked separately in `design/qa/status-mobile-postfix.jpg`: the subscription label is visible, the availability strips and percentages are intentionally removed from narrow group headers, monitor rows remain tappable, and there is no horizontal overflow.

**Interaction and Accessibility Evidence**

- Tested group expand/collapse, refresh, subscription modal open/close, history navigation, return navigation, navigation-site-to-status routing, and theme isolation.
- Verified desktop 1440 × 900, normalized desktop 1215 × 977, and mobile 390 × 844 layouts.
- `documentElement.scrollWidth` equals `clientWidth` at desktop and mobile sizes.
- Browser console contained no error or warning entries from the application after the final reload.
- Axe passes in the Playwright end-to-end suite; the page now includes a visually hidden level-one heading, semantic buttons/links, labelled status graphics, focusable controls, and mobile tap targets.

**Comparison History**

1. [P2] Status page inherited the navigation site's saved dark theme, diverging from the approved light status design.
   - Fix: status routes now force Ant Design's light algorithm without overwriting the navigation site's stored theme preference.
   - Post-fix evidence: `design/qa/status-desktop-normalized.jpg` and the combined normalized comparison.
2. [P2] At 390 px the responsive rule hid the “订阅通知” label, leaving an ambiguous icon-only control.
   - Fix: removed the label-hiding rule while keeping the refresh action hidden on mobile.
   - Post-fix evidence: `design/qa/status-mobile-postfix.jpg`.
3. [P2] Axe reported that the status page had no level-one heading.
   - Fix: added a route-aware, visually hidden `h1` for current status and history states.
   - Post-fix evidence: final Playwright run, 5/5 tests passed with zero Axe violations.

**Implementation Checklist**

- [x] Desktop layout and visual hierarchy match the approved design direction.
- [x] Mobile hierarchy, overflow, and tap targets verified.
- [x] Current status, grouped monitors, 60-day availability, history, refresh, and subscription state implemented.
- [x] Light status theme is isolated from the navigation site's persisted theme.
- [x] SEO metadata, canonical routes, status sitemap, manifest, and Vercel host routing generated.
- [x] Typecheck, lint, unit tests, build, Playwright/Axe, clean install, and dependency audit pass.

**Open Questions**

- None for the local implementation. Production cutover still requires the existing UptimeRobot API key to be configured in Vercel and `status.elexvx.com` to be assigned to this Vercel project.

**Follow-up Polish**

- Email or Feishu incident subscription delivery can be connected later; the current control transparently reports that the channel is not yet active.

final result: passed
