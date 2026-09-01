# 宏翔商道企业导航

宏翔商道企业服务导航是一个静态 React 单页应用，为团队提供统一的企业系统、政务、知识产权、信用、AI 与公众平台入口。

## 技术栈

- React 19 + TypeScript
- Vite 8
- Ant Design 6 + `@ant-design/icons`
- YAML + Zod：内容维护与构建时配置校验
- Vitest + Testing Library：单元和组件测试
- Playwright + axe：浏览器回归与无障碍测试

项目不依赖 Astro、Tailwind、React Router 或后端服务；Vercel 直接部署 Vite 的 `dist` 静态产物。

## 本地开发

环境要求：Node.js `>=20.19.0`、npm。

```bash
npm ci
npm run dev
```

开发服务器地址为 <http://127.0.0.1:4321/>。构建产物可以用下面的命令预览：

```bash
npm run build
npm run preview
```

## 内容维护

`src/config/site.yaml` 是唯一的站点内容源，集中维护站点信息、SEO、搜索引擎和导航链接。修改后重新启动开发服务器或执行构建，Vite 插件会在启动和构建时用 Zod 校验：

- 分类、二级分类、链接和 URL 不能重复；
- URL 必须是 `http` 或 `https`；
- 搜索引擎引用必须存在且已启用；
- 本地 Logo 和图标必须存在于 `public/`；
- 未填写的链接 `status` 默认为 `available`，`tags` 默认为空数组，ID 会由名称生成稳定值。

链接支持 `available`、`maintenance`、`unavailable`、`beta` 和 `deprecated` 状态。`tags` 与 `status` 保留在数据契约中，其中 `tags` 参与站内搜索，但二者都不会渲染为目录项里的标签或状态徽标。新增本地图片时，请把文件放进 `public/`，并在 YAML 中使用以 `/` 开头的路径。

## 功能约定

- 桌面端使用 Ant Design `Layout.Header` 和横向 `Menu`；小于 `lg`（992px）时使用 `Drawer` 复用分类导航。
- 首页使用紧凑的两列企业目录；每个入口只显示图标、名称、说明和进入箭头，不展示内容标签或状态标签。
- 首页顶部搜索区通过搜索源下拉统一站内与全网搜索。站内搜索名称、描述和数据标签；全网搜索支持 Bing、Google、百度和 GitHub，并始终保留明确的搜索按钮。
- 主题和搜索偏好保存在浏览器 localStorage；外链统一使用新标签页和 `noopener noreferrer`。
- 页面只提供首页和分类 hash 锚点，不引入路由或动态 API。

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

构建时 `src/config/sitePlugin.ts` 从 YAML 注入 title、description、canonical、Open Graph、Twitter 和 JSON-LD，并同步生成 `robots.txt`、`sitemap.xml` 与 `site.webmanifest`，避免站点名称、域名或描述出现多处配置。`public/` 只保留 Logo、应用图标和 OG 图片等真实静态资源。

更新品牌文案后可执行 `npm run generate:og` 重新生成 1200×630 的社交分享图；该命令同样读取 `src/config/site.yaml`，不会维护第二份标题或描述。

Vercel 使用仓库中的 `vercel.json`：

- 安装：`npm ci`
- 构建：`npm run build`
- 输出目录：`dist`
- 框架：Vite

站点正式地址为 <https://nav.elexvx.com/>。部署前请先完成全部质量门禁，并确认 YAML 中的外链和品牌资源仍然有效。

## 许可证

MIT License。
