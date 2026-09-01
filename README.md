# 宏翔商道企业导航

宏翔商道企业服务平台把企业导航和服务状态页统一在一个 React 代码库中：导航站提供企业系统、政务、知识产权、信用、AI 与公众平台入口，状态站通过服务端接口展示 UptimeRobot 监控数据。

## 技术栈

- React 19 + TypeScript
- Vite 8
- Ant Design 6 + `@ant-design/icons`
- YAML + Zod：内容维护与构建时配置校验
- Vercel Functions + UptimeRobot API：状态数据代理与缓存
- JOSE：可选的状态页密码保护
- Vitest + Testing Library：单元和组件测试
- Playwright + axe：浏览器回归与无障碍测试

项目不依赖 Astro、Tailwind 或 React Router。Vite 输出导航页和状态页两个 HTML 入口，`api/` 中的 Vercel Functions负责隐藏 UptimeRobot API Key。

## 本地开发

环境要求：Node.js `>=20.19.0`、npm。

```bash
npm ci
npm run dev
```

开发服务器地址为 <http://127.0.0.1:4321/>，状态页为 <http://127.0.0.1:4321/status>。本地没有 UptimeRobot API Key 时，状态接口会返回与生产契约相同的演示数据。构建产物可以用下面的命令预览：

```bash
npm run build
npm run preview
```

## 内容维护

`src/config/site.yaml` 是唯一的站点内容源，集中维护站点信息、SEO、状态分组、搜索引擎和导航链接。状态分组通过 UptimeRobot 监控名称的前缀匹配；当前约定为 `A` 企业服务、`B` 项目服务、`J` 公共服务，未匹配项目自动进入“其他服务”。修改后重新启动开发服务器或执行构建，Vite 插件会在启动和构建时用 Zod 校验：

- 分类、二级分类、链接和 URL 不能重复；
- URL 必须是 `http` 或 `https`；
- 搜索引擎引用必须存在且已启用；
- 状态分组 ID 和前缀不能重复；
- 本地 Logo 和图标必须存在于 `public/`；
- 未填写的链接 `status` 默认为 `available`，`tags` 默认为空数组，ID 会由名称生成稳定值。

链接支持 `available`、`maintenance`、`unavailable`、`beta` 和 `deprecated` 状态。`tags` 与 `status` 保留在数据契约中，其中 `tags` 参与站内搜索，但二者都不会渲染为目录项里的标签或状态徽标。新增本地图片时，请把文件放进 `public/`，并在 YAML 中使用以 `/` 开头的路径。

## 功能约定

- 桌面端使用 Ant Design `Layout.Header` 和横向 `Menu`；小于 `lg`（992px）时使用 `Drawer` 复用分类导航。
- 首页使用紧凑的两列企业目录；每个入口只显示图标、名称、说明和进入箭头，不展示内容标签或状态标签。
- 首页顶部搜索区通过搜索源下拉统一站内与全网搜索。站内搜索名称、描述和数据标签；全网搜索支持 Bing、Google、百度和 GitHub，并始终保留明确的搜索按钮。
- 主题和搜索偏好保存在浏览器 localStorage；外链统一使用新标签页和 `noopener noreferrer`。
- `/status` 展示当前状态，`/status/history` 展示 60 天历史；`status.elexvx.com/` 与 `status.elexvx.com/history` 使用同一套 React 组件。
- 状态页每 5 分钟自动刷新，也支持手动刷新；桌面端展示历史可用性条带，移动端优先显示状态和组件列表。

## UptimeRobot 与环境变量

复制 `.env.example` 并在 Vercel Project Settings 中设置：

- `UPTIMEROBOT_API_KEY`：必填，仅服务端可见；兼容旧变量 `API_KEY`。
- `UPTIMEROBOT_API_URL`：可选，默认 `https://api.uptimerobot.com/v2/`。
- `COUNT_DAYS`：可选，默认 60。
- `SITE_PASSWORD`、`SITE_SECRET_KEY`：可选；两者配置后启用状态页密码保护。

严禁使用 `VITE_` 前缀保存 UptimeRobot密钥，否则变量会被打进浏览器代码。

## 质量门禁

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
npm audit --audit-level=high
```

首次运行 Playwright 时，如果本机没有 Chromium：

```bash
npx playwright install chromium
```

单元测试使用 `tests/`，浏览器测试位于 `tests/e2e/`。E2E 测试会 stub `window.open`，不会真实打开企业外链或搜索引擎。

## SEO、PWA 与部署

构建时 `src/config/sitePlugin.ts` 从 YAML 分别为导航页和状态页注入 title、description、canonical、Open Graph、Twitter 和 JSON-LD，并生成两套 sitemap/manifest。`public/` 只保留 Logo、应用图标和 OG 图片等真实静态资源。

更新品牌文案后可执行 `npm run generate:og` 重新生成 1200×630 的社交分享图；该命令同样读取 `src/config/site.yaml`，不会维护第二份标题或描述。

Vercel 使用仓库中的 `vercel.json`：

- 安装：`npm ci`
- 构建：`npm run build`
- 输出目录：`dist`
- 框架：Vite

站点正式地址为 <https://nav.elexvx.com/>。部署前请先完成全部质量门禁，并确认 YAML 中的外链和品牌资源仍然有效。

在同一个 Vercel 项目中绑定 `nav.elexvx.com` 与 `status.elexvx.com`。`vercel.json` 根据 Host 将状态域名根路径交给状态 HTML 入口；React 同时识别域名和路径，因此导航域名的 `/status` 与状态域名根路径会进入同一页面。迁移域名前应先验收 Preview Deployment，再将 `status.elexvx.com` 从旧项目调整到新项目。

## 许可证

MIT License。
