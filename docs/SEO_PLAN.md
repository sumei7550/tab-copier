# Tab Copier SEO 规划

> 状态：策略假设，不是关键词研究数据或效果预测。当前没有 Search Console、关键词工具、网站域名或已验证产品事实；不记录搜索量、难度、排名或预期流量。

## 目标与测量

目标路径：相关搜索 → 解答用户需求的页面 → 点击 Chrome Web Store 安装。主要可观测指标为自然搜索展示、点击、查询词/落地页、索引状态以及商店 CTA 点击。安装完成数若无法从商店或合规的分析机制归因，就不得以 CTA 点击代替安装数。

## 意图分组与关键词到页面映射

下列英文查询是根据产品主题提出的待验证候选词；语言和查询需求需在目标市场确认。它们没有经过搜索量或 SERP 数据验证。

| 意图组 | 候选查询（假设） | 页面 | 优先级 | 进入页面的前置条件 |
|---|---|---|---|---|
| 品牌/安装 | Tab Copier extension；Tab Copier Chrome | `/` | P0 | 核对品牌名、商店页标题、CTA URL |
| 任务型：复制多个标签 | copy Chrome tabs；copy multiple tabs Chrome；copy all tabs Chrome | `/copy-chrome-tabs` | P1 | 产品确实支持对应范围；区分 all/current-window/selected |
| 格式型：Markdown | copy Chrome tabs as Markdown；Chrome tabs to Markdown | `/chrome-tabs-to-markdown` | P1 | Markdown 格式和输出样例经当前版本确认 |
| 格式型：标题和链接 | copy tab titles and URLs；copy tabs as links | `/copy-tab-urls` 或首页专节 | P2 | 确认格式准确；页面内容能解决独立需求 |
| 操作教程 | how to copy all open tabs in Chrome；how to copy multiple Chrome tabs | `/guides/copy-open-chrome-tabs` | P2 | 产品限制/步骤已验证；教程有原创截图和替代方案说明 |
| 隐私/权限 | Chrome extension copy tabs privacy；Tab Copier permissions | `/privacy` + 首页 FAQ | P1（信任建设） | 开发者核实权限、数据流、政策；不作无证据承诺 |
| 导出/会话管理 | export Chrome tabs；save Chrome tabs | 暂不建页 | 暂缓 | 先确认是否只是复制到剪贴板；不可把复制包装成文件导出或会话恢复 |

避免关键词蚕食：仅当页面有独立、充分、真实内容时才拆出落地页；否则保留在首页的章节/FAQ。P1 页面属于候选，需结合真实 SERP 与内容能力再定，不是必须全部上线。

## 页面优先级

- **P0：** 首页（品牌、真实产品定位、截图、功能、使用步骤、FAQ、安装 CTA），隐私页（以真实数据实践为准），基础技术索引配置。
- **P1：** 一个满足产品事实的非品牌高意图页面（优先评估 Markdown 页面或复制标签页页面），不要为了覆盖词而发布薄内容。
- **P2：** 第二个独立任务页、原创操作教程。须先确认搜索结果中确有不同意图且能提供独立价值。
- **暂不做：** 大量城市/行业变体、自动生成博客、泛用“最佳扩展”对比页、未经核实的功能专题。

## 竞品分析方法

候选样本仅用于研究页面方式，不等于已完成竞品分析：

| 样本 | 当前可验证线索 | 下一步观察 |
|---|---|---|
| [Tab Copy](https://tabcopy.com/) | 搜索索引显示有产品官网，支持多种格式、可配置功能；这是功能更广的相邻产品 | 首页承诺、文档结构、截图、页面标题/内链、CTA；不照搬其能力 |
| [Copy as Markdown](https://chromewebstore.google.com/) | 名称曾在历史规划中作为候选；本轮未确认确切产品 URL、官网或当前状态 | 搜索其商店条目，记录准确品牌/URL后再纳入 |
| OneTab | 名称是标签管理相邻工具；本轮未核验官网与当前页面 | 评估任务是否相邻，避免把会话保存误认为复制 |
| Session Buddy | 名称是标签/会话管理相邻工具；本轮未核验官网与当前页面 | 只比较信息架构和信任表达，不比较不相干功能 |

对每个样本记录日期、域名、SERP 查询、标题/H1、目标意图、页面类型、CTA、证据资产、FAQ、结构化数据、索引页面及差异点。区分直接观察与主观推断；不推断竞品流量或转化率。首轮建议人工检查 3 个直接竞品 + 2 个相邻工具，再决定是否创建专题页。

## 关键词研究与验证流程

1. 先确定目标国家/语言，再用 Google Search Console（有站后）、Keyword Planner 或其他关键词工具取样；记录工具、地区、日期、查询范围和数据限制。
2. 手工检查每组候选词的当前 SERP：结果类型、意图、排名页面、扩展商店/教程占比、精选摘要等；SERP 随地区与时间变化。
3. 以产品可证明的能力和 SERP 意图共同筛选词。只有独特内容能满足意图时才建独立 URL。
4. 上线后按月复核 Search Console 的查询、页面、国家、展示、点击、CTR、平均排名及索引覆盖；用 CTA 点击作站内代理指标，并明确其不等同安装。

## 技术 SEO 计划

- 每个可索引页面服务一个清晰意图；独立 title、meta description、H1、规范 URL、可读正文与真实内部链接。
- Next.js App Router Metadata API 管理 metadata、Open Graph；生成并检查 `robots.txt` 和 `sitemap.xml`。官方文档说明 Metadata API 与文件约定：[Next.js metadata](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)、[Next.js sitemap](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)。
- Sitemap 提交有助于发现 URL，但不保证抓取或索引；遵循 [Google Sitemap 指南](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)。在 Search Console 验证域名、提交 sitemap、检查 URL Inspection/索引状态，并观察 Performance report：[Search Console 入门](https://developers.google.com/search/docs/monitor-debug/search-console-start?hl=en)。
- 页面正文应可抓取、移动端可用、加载迅速；检查状态码、canonical、重定向、404、robots/noindex、社交分享预览、图片替代文本、可访问性。
- 结构化数据仅在符合页面真实内容与 Google 规则时添加（首页可评估 SoftwareApplication/Organization/WebSite；FAQ 不以获得富媒体结果为保证）。用 Rich Results Test 与 Search Console 报告验证；标记必须与用户可见内容一致。
- 不承诺排名、索引时间、富结果或流量。通过 Vercel 预览与正式域名分别检查；部署、域名与 GSC 验证需用户授权时再执行。

## 验证日志（已验证数据 vs 假设）

- **已验证：** 用户提供了 Chrome Web Store URL；该地址本次无法直接读取。工作区未发现可访问的源码或现有网站项目。
- **已验证：** Tab Copy 有官网，搜索索引可见产品介绍（[Tab Copy 官网](https://tabcopy.com/)）；它是相邻竞品，不是目标产品。
- **假设：** 本文件所有关键词、目标页面和优先级；没有搜索量、难度、排名、流量或 SERP 充分性数据。
- **待验证：** 目标语言/市场、查询需求、当前 SERP、品牌搜索情况、商店安装转化、域名与 Search Console 权限。
