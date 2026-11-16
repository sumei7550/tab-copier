# SEO 研究日志

## 2026-10-22 — 首轮产品核验与关键词探索

### 检查的仓库内容

- 当前目录 `E:\susm-program\tab-copier`，Git 分支 `main`；开始时 `main...origin/main` 干净，已有 `docs/` 为未跟踪状态，内容未覆盖。
- 项目实际是 Chrome 扩展仓库（不是官网）：`README.md`、`manifest.json`、`popup.html/js/css`、`options.html/js/css`、`privacy.html`、`i18n.js`、`_locales/*/messages.json`、`store-assets/LISTING_COPY.md`、促销图、图标、`LICENSE`。
- 发现现有预研文件 `docs/PRODUCT_FACTS.md`、`docs/SEO_PLAN.md`、`docs/WEBSITE_MVP.md`。新研究放在独立 `docs/seo/`，避免覆盖已有文件。
- 没有 Next.js package、网站页面、域名配置、GSC 属性/导出；不能做现有站点技术 SEO 审计。

### 检查的产品页面/数据源

- 用户提供的 [Tab Copier Chrome Web Store URL](https://chromewebstore.google.com/detail/tab-copier-copy-tabs-as-m/jokakblbincnhdmnhabpmdpobheebajf)：Web 工具尝试打开失败（Internal Error/不可访问）；官方标题、分类、当前版本、评分/评论、用户数、权限、隐私申报与截图尚未确认。
- [Chrome-Stats 对应扩展索引](https://chrome-stats.com/d/jokakblbincnhdmnhabpmdpobheebajf)：可读，数据页显示抓取于 2026-10-21；其功能描述、权限/版本/开发者/更新时间与链接是第三方记录，不能代替商店官方证据。页面展示第三方估算用户数 15（该数值仅此数据源/抓取时点，不当作官方安装数或关键词需求）。
- 本地源码显示 manifest 权限 `tabs`, `storage`；Chrome-Stats 列 `tabs`, `storage`, `clipboardWrite`，形成冲突待人工验证。
- 检查隐私页与代码网络 API 搜索；页面有强隐私声明，源码搜索未见远程 API，但尚非发布版动态网络审计。
- [Chrome 官方 tips](https://www.google.com/chrome/tips/)：官方说明 Bookmark All Tabs，可作为书签保存替代路径，不等于复制链接文本。
- [CopyTabs CWS](https://chromewebstore.google.com/detail/copytabs-%E2%80%94-copy-all-tab-u/cbnfohifbnileedacgnbokdoeodnknfh)：读取商品描述和部分页面；展示 CWS 直竞争品及安装路径。检索时页面称 5 users、0 ratings，仅是此商品页当前抓取值，样本新且不是需求测量。
- [TabScribe 官网](https://tabscribe.auraflame.tech/) / [CWS](https://chromewebstore.google.com/detail/tabscribe-%E2%80%94-one-click-tab/jlochdcehejdkemnmlkphhkjnadegcgm)：观察其多格式、跨窗口、会话组/文件导出定位，产品能力更广。
- [Copy as Markdown GitHub README](https://github.com/yorkxin/copy-as-markdown)：检查标签清单 Markdown 及快捷键行为。
- [Tab Copy 官网](https://tabcopy.com/) 打开后正文未充分提取，不做细节断言。
- 中文样本：[复制网页为Markdown链接 CWS](https://chromewebstore.google.com/detail/copy-url-and-title-as-mar/hgcnlmeldjplppaaifjmdemcdkihamoe?hl=zh-CN)、[中文扩展介绍文章](https://networm.me/2021/05/30/chrome-copy-link-extensions/)、[Quicker 获取标签页动作](https://getquicker.net/Sharedaction?code=cad4688c-ec09-4aa5-0613-08d838181f56)。文章较旧，不代表当前 SERP。

### 搜索查询范围

英语探索：`copy all tabs Chrome extension`, `copy Chrome tabs as Markdown`, `copy tab URLs`, `copy URLs from multiple Chrome tabs`, `how to copy all tabs Chrome`, `export/save browser tabs`, 以及竞品/格式/研究场景变体。

简体中文探索：`复制 Chrome 标签页 URL 扩展`, `Chrome 标签页 批量 复制 链接`, `Chrome 标签页转 Markdown`, `复制网页为 Markdown`，扩展到批量提取、标题网址、保存/导出等表达。

### 重要发现/限度

- SERP 样本中确有多款 CWS 直接竞品，说明产品/安装意图现实存在；这不提供词量或难度。
- 英语和中文 SERP 都出现格式/范围差异；中文结果混合当前网页 Markdown 与批量标签页复制，需分别确认意图。
- Google 官方 Bookmark All Tabs 是“保存”意图的替代方案；Tab Copier 的当前代码侧重复制到剪贴板。
- Web 搜索工具未提供位置固定、可复现的 Google 完整 SERP；没有可引用的稳定广告/PAA/自动补全快照。
- Keyword Planner、Ahrefs、Semrush、GSC 未连接/不可访问。未获得任何关键词月搜索量、趋势、CPC、KD 或自然排名数据。
- 中国大陆、美国、英国等国家级语言变体尚未分开测量；这使最终机会优先级只能定性。

### 待人工验证

1. 用 Chrome 浏览器打开官方商店 URL；采集英语/简体中文页标题、描述、类目、官方用户数、评分及评论数/样例、更新信息、屏幕截图、权限和开发者 Data safety 表单，并记国家/语言/日期。
2. 下载/读取线上发布 CRX 或在浏览器中实测当前 UI；比较与工作树 commit 的功能/权限，确认 clipboardWrite 权限差异和预览功能差异。
3. 确认隐私政策版本、在线发布包网络请求、数据保留、是否收费和最低浏览器版本。
4. 目标市场决策后，用 Google Ads Keyword Planner 导出英文美国、英文英国、中文大陆等独立词表/量区间；如有 Ahrefs/Semrush 账号再独立记录相应数据库和 KD 定义，不购买订阅。
5. 在固定国家/语言/设备的 Google 浏览器逐词记录前十、广告、CWS、官网、教程、论坛、视频、PAA 与相关搜索；保存日期和截图。
6. 官网尚不存在，GSC 现无数据；站点验证后再形成查询×页面基线，勿把扩展用户数/CTA 点击当搜索需求或安装。

### 文档结果

- `docs/seo/PRODUCT_FACTS.md`
- `docs/seo/KEYWORD_RESEARCH.md`
- `docs/seo/KEYWORD_MAP_DRAFT.md`
- `docs/seo/RESEARCH_LOG.md`

本阶段只交付研究文档；未改扩展生产代码、未开发网站、未部署/推送。

## 2026-10-22 — 第二阶段：美国基准与国家对比准备

- 继承第一阶段源码事实与候选词库，没有重新执行产品全面核验。默认市场设为英语美国基准、英国/加拿大/澳大利亚对比、全球英语补充、简体中文辅助。
- Google 浏览器查询 [`copy all tabs chrome`](https://www.google.com/search?q=copy+all+tabs+chrome&gl=us&hl=en&num=10) 与 [`copy chrome tabs as markdown`](https://www.google.com/search?q=copy+chrome+tabs+as+markdown&gl=us&hl=en&num=10)，记录可见 Web 结果顺序及视频/论坛/相关搜索模块。浏览器最终落在 `google.com.hk`，故为“美国参数样本”，不是已固定美国地理位置的排名。第三条起 Google 显示流量验证页；没有继续自动抓取或解决验证。`copy tab urls chrome` 未得到可用结果。
- 对比 [Super User 问题](https://superuser.com/questions/117754/how-can-one-copy-urls-from-all-open-tabs-in-a-google-chrome-or-other-browser-w)、[Google Chrome tips](https://www.google.com/chrome/tips/)、[Copy All Tabs CWS](https://chromewebstore.google.com/detail/copy-all-tabs/cdoannkbdlomokpmegnfjigbcihjpdnl)、[Copy as Markdown CWS](https://chromewebstore.google.com/detail/copy-as-markdown/fkeaekngjflipcockcnpobkpbbfbhmdn)、[Copy All URLs 官网](https://copyallurls.com/)、[Umbrella 官网](https://tabs.clasicwebtools.com/)，另查中文 [CWS](https://chromewebstore.google.com/detail/copy-all-urls/jmlbphjlncpbgojfjelfgbnhjelcnedm?hl=zh-CN) 与 [Copy Tab List 文章](https://tmdm.cn/copy-tab-list-chrome-extension/)。这些页面证明用户问题和产品供给，不能衡量关键词需求量。
- 尝试通过浏览器打开 Tab Copier 官方 [CWS 条目](https://chromewebstore.google.com/detail/tab-copier-copy-tabs-as-m/jokakblbincnhdmnhabpmdpobheebajf?hl=en-US)，浏览器工具返回不可访问；CWS 发布版本/权限/评价继续待人工核实。
- 查 [Google Ads Keyword Planner 官方帮助](https://support.google.com/google-ads/answer/7337243)：关键词清单 CSV 只需 `Keyword` 一列；[指标定义](https://support.google.com/google-ads/answer/3022575)说明平均月搜索量的定位与近似变体口径、广告 Competition 与自然竞争不同。
- 未取得 Google Ads、Semrush、Ahrefs、GSC 登录后的任何数据；美国、英国、加拿大、澳大利亚、全球英语、简体中文的月量/趋势/KD 均为缺失。没有可证的国家机会大小比较。Google 的流量验证阻止了同条件四国 SERP 采样。
- 建立 [`KEYWORD_PLANNER_IMPORT.csv`](KEYWORD_PLANNER_IMPORT.csv) 单列候选词，供已有 Google Ads 账户导入。英语和中文须分批提取、各自设定语言/地点；不创建广告活动，不把空值解释为零。
- 下一轮人工工作：取得目标国家 Keyword Planner 导出，保存月份/地区/语言/Search Network/近似变体口径；在固定国家位置手工记录高相关词自然前十和模块；复核 CWS 当前发布包。完成后才可将本轮定性优先级升级为正式机会排序。

### 工具可用性补充

- Google Ads 已登录浏览器中的当前账号显示没有 Google Ads 账号；没有创建新账号，Keyword Planner 不可用。
- Semrush 免费 Keyword Checker 显示当日查询余额 `0 / 5`，且未登录；未取得本项目指标。
- Ahrefs 免费 Keyword Difficulty Checker 对美国 `copy all tabs chrome` 提交后未返回指标；不把空白当零。
- Search Console 已有属性属于其他站点，不属于 Tab Copier，未使用其数据。

## 2026-10-22 — 第三阶段：完全免费工具复核

- 已阅读 `PRODUCT_FACTS.md`、`KEYWORD_RESEARCH.md`、`KEYWORD_MAP_DRAFT.md`、`RESEARCH_LOG.md` 与 108 行 `KEYWORD_PLANNER_IMPORT.csv`，沿用已有事实与候选库，聚焦两组核心词。
- 浏览器直接读取 Google Trends Explore，参数：Google 网页搜索、所有类别、过去 5 年（页面下载请求对应 2021-10-22–2026-10-22）、搜索字词非主题；分别设置 US、GB、CA、AU。第一组 `copy all tabs / copy chrome tabs / copy tab URLs` 的图表平均相对指数依次为 US `15/3/0`、GB `0/1/1`、CA `0/0/0`、AU `1/0/1`。第二组 `copy all tabs / chrome tabs to markdown / copy tabs as markdown / copy chrome tabs as markdown / tabs to markdown` 为 US `16/0/0/0/0`、GB `0/1/0/0/0`、CA `0/0/0/0/1`、AU `1/0/1/1/0`。完整复核链接见 `KEYWORD_RESEARCH.md` 的第三阶段表。
- Google Trends 中文辅助：CN 参数、词组 `复制所有标签页 / 批量复制标签页链接 / Chrome 标签页转 Markdown`，图表平均指数 `1/0/0`，地区和相关查询提示数据不足；不能代表大陆总体搜索需求。
- 核对 [Google Trends FAQ](https://support.google.com/trends/answer/4365533)：样本、按地区/时间归一化、0–100 缩放；低搜索量词可显示 0，低量尖峰有噪声。不同国家/两组趋势指数未直接互比，也未推算月搜索量或增长率。
- 尝试通过图表的 CSV 下载按钮保存美国周序列，浏览器显示 `ERR_BLOCKED_BY_CLIENT`；没有通过其他方式绕过。只记录页面显示的取整平均值和可复核 Explore URL。
- 复查上阶段已有的美国参数 Google SERP 样本；本轮公开 Web 检索又确认 [Copy All Urls CWS](https://chromewebstore.google.com/detail/copy-all-urls/blcikocpcipackegcmopdblojpembinp)、[Copy All URLs 官网](https://copyallurls.com/)、[Copy as Markdown GitHub](https://github.com/yorkxin/copy-as-markdown)、[TabScribe 官网](https://tabscribe.auraflame.tech/)的产品供给。它们不提供国家级自然排名或词量。
- 用户问题证据：[Super User 批量复制标签 URL 提问](https://superuser.com/questions/117754/how-can-one-copy-urls-from-all-open-tabs-in-a-google-chrome-or-other-browser-w)及 [Reddit 表格导出提问](https://www.reddit.com/r/excel/comments/gcoqjp)。仅证明任务真实出现，不等于当前搜索量。
- Google 直接搜索上一轮触发流量验证；本轮未重复尝试绕过。未取得英、加、澳固定地点 SERP 或统一地点自动补全快照；公开 Web 检索结果不冒充 Google 地区排名。Trends 相关查询对低量词亦显示数据不足。
- Ahrefs 免费核心词 KD 上轮未返回，Semrush 免费查询余额上轮为 0/5；本轮未重复绕过限制。无可核实的月搜索量、自然 KD、Tab Copier 官网 GSC 表现。所有这些项目标注“免费渠道无法验证”。
- 仅追加更新三份研究文档；未改变插件代码、官网、配置、付款方式或广告账户，也未购买订阅、推送或部署。
