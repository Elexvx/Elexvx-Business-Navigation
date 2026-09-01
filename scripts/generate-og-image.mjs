import { readFile, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';

import { chromium } from '@playwright/test';
import { parse as parseYaml } from 'yaml';

const projectRoot = process.cwd();
const configPath = resolve(projectRoot, 'src/config/site.yaml');
const config = parseYaml(await readFile(configPath, 'utf8'));

if (!config?.site || !config?.seo || !Array.isArray(config.navigation)) {
  throw new Error('src/config/site.yaml 缺少生成分享图所需的 site、seo 或 navigation 配置。');
}
if (!config.site.logo.startsWith('/') || !config.seo.defaultImage.startsWith('/')) {
  throw new Error('分享图生成要求 site.logo 与 seo.defaultImage 使用 public/ 下的本地路径。');
}

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const logoPath = resolve(projectRoot, 'public', config.site.logo.slice(1));
const outputPath = resolve(projectRoot, 'public', config.seo.defaultImage.slice(1));
const logoMime = extname(logoPath).toLowerCase() === '.webp' ? 'image/webp' : 'image/png';
const logoData = (await readFile(logoPath)).toString('base64');
const categories = config.navigation
  .slice(0, 6)
  .map(({ category }) => `<span>${escapeHtml(category)}</span>`)
  .join('');

const html = `<!doctype html>
<html lang="${escapeHtml(config.site.language ?? 'zh-CN')}">
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; }
      html, body { width: 1200px; height: 630px; margin: 0; overflow: hidden; }
      body {
        position: relative;
        display: grid;
        grid-template-columns: 1.08fr 0.92fr;
        color: #10213f;
        background:
          radial-gradient(circle at 88% 9%, rgba(64, 150, 255, .24), transparent 31%),
          linear-gradient(135deg, #f8fbff 0%, #eef5ff 54%, #e2efff 100%);
        font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      }
      body::before {
        content: "";
        position: absolute;
        inset: 0;
        opacity: .34;
        background-image: radial-gradient(#8ebaff 1px, transparent 1px);
        background-size: 24px 24px;
        mask-image: linear-gradient(90deg, transparent 10%, #000 72%, #000);
      }
      .copy {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 64px 36px 58px 76px;
      }
      .brand {
        display: flex;
        align-items: center;
        width: max-content;
        margin-bottom: 31px;
        padding: 10px 18px 10px 10px;
        font-size: 21px;
        font-weight: 700;
        color: #17345f;
        background: rgba(255, 255, 255, .9);
        border: 1px solid rgba(22, 119, 255, .14);
        border-radius: 16px;
        box-shadow: 0 12px 32px rgba(25, 75, 148, .1);
      }
      .brand img { width: 76px; height: 50px; margin-right: 13px; object-fit: cover; border-radius: 10px; }
      .eyebrow { margin-bottom: 14px; color: #1768d2; font-size: 20px; font-weight: 700; letter-spacing: .14em; }
      h1 { margin: 0; font-size: 64px; line-height: 1.13; letter-spacing: -.04em; }
      h1 strong { color: #1677ff; font-weight: 800; }
      p { max-width: 590px; margin: 23px 0 27px; color: #53647d; font-size: 20px; line-height: 1.7; }
      .url { display: flex; align-items: center; gap: 10px; color: #31547f; font-size: 18px; font-weight: 600; }
      .url::before { content: ""; width: 30px; height: 3px; background: #1677ff; border-radius: 99px; }
      .visual {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 60px 62px 60px 25px;
      }
      .panel {
        width: 100%;
        padding: 30px;
        background: rgba(255, 255, 255, .88);
        border: 1px solid rgba(22, 119, 255, .13);
        border-radius: 28px;
        box-shadow: 0 32px 80px rgba(34, 80, 145, .18);
        backdrop-filter: blur(16px);
        transform: rotate(-1.4deg);
      }
      .panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px; }
      .panel-title { font-size: 22px; font-weight: 800; }
      .status { display: flex; align-items: center; gap: 8px; color: #64748b; font-size: 14px; }
      .status::before { content: ""; width: 9px; height: 9px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 0 5px #dcfce7; }
      .search { height: 52px; margin-bottom: 24px; padding: 0 18px; color: #789; font-size: 16px; line-height: 52px; background: #f5f8fc; border: 1px solid #e4ebf4; border-radius: 12px; }
      .categories { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .categories span {
        display: flex;
        align-items: center;
        min-height: 57px;
        padding: 0 15px;
        color: #203b63;
        font-size: 17px;
        font-weight: 650;
        background: #fff;
        border: 1px solid #dce8f7;
        border-radius: 12px;
      }
      .categories span::before {
        content: "";
        width: 25px;
        height: 25px;
        margin-right: 11px;
        background: linear-gradient(135deg, #1677ff, #69b1ff);
        border-radius: 8px;
        box-shadow: inset 0 0 0 7px rgba(255, 255, 255, .82);
      }
    </style>
  </head>
  <body>
    <main class="copy">
      <div class="brand"><img src="data:${logoMime};base64,${logoData}" alt="" />${escapeHtml(config.site.name)}</div>
      <div class="eyebrow">企业服务 · 一站直达</div>
      <h1>${escapeHtml(config.site.name)}<br /><strong>${escapeHtml(config.site.shortName)}</strong></h1>
      <p>${escapeHtml(config.site.description)}</p>
      <div class="url">${escapeHtml(new URL(config.site.url).hostname)}</div>
    </main>
    <aside class="visual" aria-hidden="true">
      <div class="panel">
        <div class="panel-head"><span class="panel-title">常用服务</span><span class="status">服务可访问</span></div>
        <div class="search">搜索企业系统、政务服务或关键词</div>
        <div class="categories">${categories}</div>
      </div>
    </aside>
  </body>
</html>`;

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const image = await page.screenshot({ type: 'png', fullPage: false });
  await writeFile(outputPath, image);
  console.log(`已生成 ${outputPath}`);
} finally {
  await browser.close();
}
