# Tab Copier 产品事实核实

> 核实日期：2026-10-22。证据范围：当前工作区源码/静态文件、用户提供的 Chrome Web Store URL、公开搜索索引。源码能确认当前工作树实现，不能证明线上发布包与其一致。下文标注“源码确认”均限定此范围。

## 已验证事实

| 主题 | 事实 | 证据 |
|---|---|---|
| 产品 | Chrome 扩展项目，Manifest V3；manifest 版本为 1.1.0，默认 locale 为 en | [`manifest.json`](../../manifest.json) |
| 复制范围 | 默认查询当前窗口标签；打开“所有窗口”后查询全部窗口 | [`popup.js`](../../popup.js) `chrome.tabs.query({currentWindow: ...})`，`popup.html` scope toggle |
| 选择 | 展示可用标签，可逐项选择和全选/取消全选 | [`popup.js`](../../popup.js) `selectedIds` / `selectAllBtn` |
| 输出格式 | Markdown 链接、纯 URL、标题换行 URL、HTML `<a>` 链接 | [`popup.html`](../../popup.html) option values；[`popup.js`](../../popup.js) `outputFor` |
| 筛选 | 搜索标题或 URL；排除固定标签、去重 URL、移除特定常见追踪参数可配置 | [`popup.js`](../../popup.js)、[`options.js`](../../options.js) |
| 系统页处理 | `chrome:`, `edge:`, `about:`, `devtools:` 开头的 URL 在列表中排除 | [`popup.js`](../../popup.js) `isSystemUrl`。不要泛化为所有不可复制页面类型 |
| 预览 | 当前 UI 显示标签列表及选择状态；未发现复制前生成文本预览的组件。旧商店索引称有 preview，与当前工作树 UI 不符 | [`popup.html`](../../popup.html)、[`popup.js`](../../popup.js)；[Chrome-Stats 页面](https://chrome-stats.com/d/jokakblbincnhdmnhabpmdpobheebajf)（第三方） |
| 快捷键 | manifest 声明 `_execute_action` 建议快捷键 Alt+Shift+C（Mac: MacAlt+Shift+C），允许在 Chrome shortcuts 页面修改；这是打开 popup 的快捷键，不是直接复制 | [`manifest.json`](../../manifest.json)、[`options.html`](../../options.html) |
| 设置存储 | 复制格式、范围、过滤选项写入 `chrome.storage.local` | [`popup.js`](../../popup.js)、[`options.js`](../../options.js) |
| 本地化 | `_locales` 有 en、zh_CN、zh_TW、ja、ko、es、de、fr、ru、th、ms、id、pt_BR | [`_locales/`](../../_locales/) |
| 隐私声明 | 随附隐私页称不收集/不传输浏览数据，仅本地保存偏好设置，并提供 GitHub Issues 联系渠道 | [`privacy.html`](../../privacy.html)，这是项目发布的声明，不等于独立审计结果 |
| 代码网络线索 | 在扩展源码中搜索未发现 `fetch`、XHR、WebSocket 或远端 API 调用；popup HTML 有 Ko-fi 外链，隐私页有 GitHub 外链。静态搜索不能替代运行时网络审计 | `rg` 检索 `popup.js`, `options.js`, `i18n.js`, HTML 文件 |
| 许可 | 仓库含 MIT License | [`LICENSE`](../../LICENSE) |

## 有证据支持的推断

- 用户任务是把一个或多个打开的网页标签转为可粘贴的链接文本；“标签页管理器”“会话恢复器”“文件导出器”不符合已检查实现。
- 研究笔记、文档、聊天中整理链接是合理使用场景，但具体目标用户构成尚无用户研究证据。
- 产品与“copy tabs / copy tab URLs / tabs to Markdown”意图匹配；“export”容易让人理解为下载文件，标题/正文宜优先用 copy，只有明确解释 clipboard 输出时谨慎使用 export。
- 中文界面与简体中文商店 locale 存在；这不代表中文查询需求已获验证。

## 未知及冲突

1. **线上商店事实未能直接核验：** Chrome Web Store 原始页面由研究浏览工具返回不可访问。标题、描述、分类、版本、发布日期、评价、评分、官方用户数、截图和数据安全表单仍需在浏览器人工打开核对。
2. **权限清单不一致：** 当前 [`manifest.json`](../../manifest.json) 只列 `tabs`, `storage`；Chrome-Stats 索引列出 `tabs`, `storage`, `clipboardWrite`。从源码看使用 `navigator.clipboard.writeText`。应从线上 CRX/官方详情确认实际发布包权限及版本，不宣传“仅一个权限”。
3. **线上实现不确定：** 当前工作树代码不一定与 CWS 当前发布包一致。Chrome-Stats 记录 version 1.1.0、更新时间 2026-08-04、抓取数据截至 2026-10-21；均为第三方记录，非官方核验。
4. **隐私强声明：** 仓库隐私页和 README 声称不收集、不传输标签信息；源码中未见主动网络请求，但还需核查线上包、依赖、商店 Data safety 表单和运行时网络，才能把绝对承诺用于营销页。
5. **预览冲突：** 第三方索引说“Preview before copying”，当前 popup 只有选择清单，没有复制文本预览。不可作为官网卖点，直到线上产品实测确认。
6. 价格/付费、受支持 Chrome 最低版本、开发者法律主体、支持渠道 SLA、用户规模、评分、评价、商标授权和产品分析数据未知。
7. 当前工作区没有 Next.js/网站项目、域名、Search Console 配置或 GSC 数据；官网技术方向仅为背景计划。

## 可宣传卖点（限源码对应版本且发布包确认后）

- 选择当前窗口或所有窗口中的标签页并复制。
- Markdown、URL 列表、标题与 URL、HTML 链接四种格式。
- 按标题/网址筛选；可排除固定标签、重复网址及指定常见追踪参数。
- 快捷键打开扩展弹窗（实际快捷键可在 Chrome 设置）。
- 随包提供多语言 UI。

隐私、本地处理等表述需将发布包权限、线上隐私政策和数据安全披露交叉核实后使用。

## 禁止未经证实的宣传

- CSV/JSON、文件下载/导出、保存或恢复会话、标签组导出、云同步、跨浏览器支持、Notion 自动集成。
- “一键直接复制”或快捷键触发复制；代码快捷键打开弹窗，仍需选择并点击复制。
- “复制前预览文本”（与当前 UI 不符）、读取页面正文/提取文章内容。
- 免费/永久免费、零遥测/绝对安全、完全离线、100% 隐私、仅一项权限、精确效率提升。
- 用户数、评分、排名、增长或安装量，除非从当前官方商店页取得带日期证据。

## 人工核验清单

- 浏览器登录状态下打开用户提供的 CWS URL；记录页面标题、开发者、分类、版本、更新时间、用户数、评分/评论、截图、描述、权限和数据安全申报，日期/语言/地区一并记录。
- 比对线上发布包与当前 Git commit：manifest 权限、版本、popup 行为和隐私声明；必要时运行时观察网络请求。
- 确认 Chrome Web Store 官网、产品商标/域名、联系地址、是否免费及隐私政策链接归属。
- 若后续需要真实搜索量与国家差异，提供 Google Ads Keyword Planner 或第三方工具的目标国家/语言导出；新站建立后接入 GSC 并累积数据。
