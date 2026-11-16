# Tab Copier 关键词研究

## 研究范围与方法

- **日期：** 2026-10-22。
- **市场/语言：** 先做英语（Google 英文结果，国家定位不稳定/未能锁定）与简体中文（中文查询，地域不稳定/未能锁定）探索。不可将两种语言视作直译关系。没有确定目标国家，因此不是国家级需求测量。
- **证据等级：** A = 官方源码/官方产品页面直接证据；B = 可访问的搜索结果页或官方文档定性观察；C = 第三方索引/讨论；H = 关键词表达假设/待量化。该等级表示证据来源强弱，不表示搜索量大小。
- **工具限制：** 使用公开 Web 搜索工具检索并打开部分页面；它不是可复现的 Google 地区/设备/登录状态 SERP 快照，不能完整确认排名顺序、PAA、广告、自动补全或相关搜索。Google Keyword Planner、Ahrefs、Semrush、Search Console 未连接/不可访问。无搜索量、趋势、CPC、KD 或排名数据。
- **重要边界：** 自动补全或结果中出现关键词只证明存在相关表达线索，不证明需求规模。第三方扩展用户量不等于关键词搜索量。结果数量不作为难度指标。
- **产品约束：** 以 [`PRODUCT_FACTS.md`](PRODUCT_FACTS.md) 为准。当前代码可复制 Markdown、纯 URL、标题+URL、HTML，不支持文件下载、CSV/JSON、会话保存恢复。

## 搜索需求证据记录

| 词/主题 | 市场/语言 | 来源及日期 | 实际可见证据/指标 | 类型/可信度 | 缺失 |
|---|---|---|---|---|---|
| copy all tabs / copy all Chrome tabs / copy Chrome tabs | 英语；全球化未定位 | Web 搜索，2026-10-22；CWS 页面 | 搜索结果出现多款直接同类扩展、教程视频和官方 Chrome 的批量书签替代路径。没有查询量 | SERP/结果样本定性，B-C | 国家/设备无稳定定位；完整排名/PAA、搜索量、趋势 |
| copy tab URLs / copy multiple tab URLs | 英语 | Web 搜索，2026-10-22 | 出现 CopyTabs、TabScribe、Copy All Tabs、Tab Link Copier 等 CWS 条目及第三方目录；表达有产品/内容供给线索 | 定性，B-C | 需求规模和商业竞争数据 |
| Chrome tabs to Markdown / copy tabs as Markdown | 英语 | Web 搜索，2026-10-22；GitHub README；CWS | 多个扩展明示 Markdown 输出，Copy as Markdown 开源 README 有当前窗口所有/高亮标签导出能力。未获得该精确查询的可复现前十 SERP | 定性，B | 精确词量、地区 SERP、工具难度 |
| how to copy all open tabs in Chrome | 英语 | 搜索结果 + Google Chrome tips（2026-10-22） | 有教程型视频；Google 官方页面支持“一次收藏全部标签页”，这是替代任务而非复制 URL 文本 | 定性，B | PAA、教程排名和需求规模 |
| 复制 Chrome 标签页链接 / Chrome 标签页批量复制链接 | 简体中文 | Web 搜索，2026-10-22 | 返回中文 CWS 单页复制 Markdown 链接的扩展、中文博客关于批量标签链接扩展的说明、Quicker “获取标签页”动作 | 定性，B-C | 中国/其他中文地区分别的 SERP、量、趋势 |
| Chrome 标签页转 Markdown / 复制标签页标题和网址 | 简体中文 | Web 搜索，2026-10-22 | “复制网页为 Markdown 链接”结果聚焦单个当前页；一篇旧博客讲多标签页为 Markdown。表明同词可能混合单页链接与多标签页两种意图 | 定性，B-C | 精确需求及 SERP 意图比例 |
| Tab Copier 品牌词 | 英语/中文 | 搜索扩展 ID、品牌，2026-10-22 | 搜索可发现 Chrome-Stats 第三方索引，但官网/CWS 原页不可由工具读取；没有品牌查询量数据 | 索引线索，C | CWS 官方可见性、品牌量、品牌流量 |
| export/save browser tabs | 英语 | Google 官方 Chrome tips + 同类产品页 | 官方 Chrome 有 Bookmark All Tabs；同类扩展将 export 用于剪贴板，也有产品用于文件/会话，意图混杂 | 定性，B | 逐词/国家 SERP、需求和意图份额 |
| 导出/保存浏览器标签页、书签所有标签页 | 中文 | 本轮只获得少量检索样本 | 未形成可信需求数据；候选表达须另行以不同中文地区分别取样 | 假设，H | SERP、用户用词、量化工具 |

## 候选关键词库（未量化）

这些词是完整探索池，不是最终目标词，也不隐含搜索量。方括号表示需要进一步本地化验证的变体。

### 英语：直接功能

- copy Chrome tabs; copy all Chrome tabs; copy multiple Chrome tabs; copy open tabs; copy tabs from Chrome; copy tabs URLs; copy tab URLs; copy URLs from multiple tabs; copy all tab links; copy selected tabs; copy links from selected tabs; copy browser tabs to clipboard; Chrome tab URL copier; bulk copy tab links; copy tabs with titles; copy tab titles and URLs; copy page titles and links.

### 英语：输出格式/目的地

- copy Chrome tabs as Markdown; Chrome tabs to Markdown; export tabs to Markdown; Markdown links from tabs; copy tabs as plain text; copy tabs as HTML links; copy all tabs as links; copy tab URLs and titles; save tab links to notes; paste Chrome tabs into Notion; paste tabs into Obsidian.

### 英语：问题解决/替代方式

- how to copy all open tabs in Chrome; how to copy multiple tab URLs; how to copy links from Chrome tabs; how to save all open tabs as links; save Chrome tabs without bookmarks; export open Chrome tabs; bookmark all tabs Chrome; get URLs from all open tabs; share all open tabs; Chrome built-in copy all tabs links.

### 英语：竞品/比较/场景

- Tab Copier extension; Tab Copier Chrome; Tab Copier alternative; Copy as Markdown tabs; CopyTabs extension; Copy All URLs Chrome extension; tab URL copier comparison; copy research tabs to notes; collect article links from tabs; copy documentation tabs; copy study links; copy tabs for research; copy browser tabs into Markdown notes.

### 简体中文：独立表达候选（非英译结论）

- Chrome 标签页链接批量复制；浏览器多个标签网址复制；复制所有打开的标签页网址；复制当前窗口标签链接；选中多个标签页复制链接；标签页标题和网址一起复制；网页链接列表复制；Chrome 标签转 Markdown；标签页链接转 Markdown；网页标题链接 Markdown；浏览器标签页导出；保存打开的网页链接；批量提取标签页网址；Chrome 标签页书签全部保存；如何复制多个网页链接；如何保存所有打开网页；分享一组浏览器标签；研究资料网页链接整理；标签页网址复制插件；Chrome 批量复制链接插件；Tab Copier 插件；Tab Copier 替代品。

## Google SERP 及竞品观察

> 观察日期 2026-10-22。Web 搜索结果可随地区、语言、登录、设备、时效改变；以下是工具返回的样本，不应当成严格的当前排名前十。

| 代表查询/页面 | 结果类型与观察 | 意图及启示 |
|---|---|---|
| copy all tabs / copy tab URLs | Chrome Web Store 商品页占样本显著位置，同时有产品官网、GitHub、视频与第三方目录 | 明确工具/安装意图与教程意图并存；首页/产品页可承接安装，不应假设一个教程页可以替代产品落地页 |
| copy Chrome tabs as Markdown | CWS 扩展、GitHub README、独立官网都出现；竞品强调输出格式、跨窗口、快捷键、其他格式、会话恢复等 | Markdown 是可识别子意图，但“Markdown”也可能指单个网页链接复制器。页面须清晰限定为打开标签集合 |
| how to copy all open tabs in Chrome | 视频教程及 Google 官方 Chrome tips；官方替代路径是 Bookmark All Tabs，能保存书签而非提供纯文本 URL 列表 | 教程页只有提供准确的原生书签方法、扩展方案比较、真实步骤截图时才有差异价值；搜索量未证实 |
| 复制网页为 Markdown 链接（中文） | Chrome Web Store 单页扩展，强调当前标签 Markdown；中文文章强调多标签选择导出 Markdown | 需要区分“当前网页链接”与“多个标签页链接”两种查询意图。中文 SEO 不应照翻英文标题 |
| CopyTabs / TabScribe 等 CWS | 官方商店摘要直述格式、作用范围、隐私、安装步骤；CWS 页面含 Add to Chrome | 这些页面是直接竞品样本，说明商店本身是 SERP 重要竞争形态；官网应提供真实 UI/差异与直接 CWS 安装路径 |

### 竞品样本（来自结果，不代表全部市场）

- [CopyTabs — Copy All Tab URLs as Markdown（Chrome Web Store）](https://chromewebstore.google.com/detail/copytabs-%E2%80%94-copy-all-tab-u/cbnfohifbnileedacgnbokdoeodnknfh)：CWS 页面强调 URL、标题、多种格式、预览、当前/全部窗口及反向打开链接；页面抓取显示 5 users、0 ratings（极小的新样本，不能据此推断需求）；页面隐私表述与“handles web history”披露并列，需谨慎阅读。
- [TabScribe 官网](https://tabscribe.auraflame.tech/) 与 [CWS 页面](https://chromewebstore.google.com/detail/tabscribe-%E2%80%94-one-click-tab/jlochdcehejdkemnmlkphhkjnadegcgm)：官网覆盖 Markdown/JSON/HTML/文本、保存恢复 tab groups、文件导出，按研究者/学生/开发者场景写内容。其功能比 Tab Copier 广，不能照搬。
- [Copy as Markdown GitHub 项目](https://github.com/yorkxin/copy-as-markdown)：支持页面选区/链接/图片及当前窗口 all/highlighted tabs 的 Markdown 链接清单；README 清楚解释快捷键可自行配置。既是功能相近的开源项目，也是开发者可信度/教程型结果。
- [Tab Copy](https://tabcopy.com/)：本次打开后内容未充分呈现（仅 33 行结果且未提取正文）；不做页面细节结论。
- [Chrome 官方 tips](https://www.google.com/chrome/tips/)：可 Bookmark All Tabs；这为“保存标签”提供原生替代方案，但不等价于将 URL 复制为文本。
- 中文 SERP 样本：[复制网页为Markdown链接 CWS](https://chromewebstore.google.com/detail/copy-url-and-title-as-mar/hgcnlmeldjplppaaifjmdemcdkihamoe?hl=zh-CN)、[Chrome 拷贝标签页链接扩展文章](https://networm.me/2021/05/30/chrome-copy-link-extensions/)、[Quicker 获取标签页动作](https://getquicker.net/Sharedaction?code=cad4688c-ec09-4aa5-0613-08d838181f56)。文章年代较旧，不能代表当前排名或需求。

## 需求、竞争与转化结论

| 集群 | 需求证据 | 匹配度 | SERP/竞争观察 | 转化价值 | 建议 |
|---|---|---:|---|---:|---|
| 复制多标签页 URL/链接 | 多款 CWS 和搜索样本直接对应；无量化数据 | 高 | 同类扩展供应明确，竞争真实存在；CWS 占比高 | 高：用户需安装工具完成任务 | 优先考虑首页核心主题；先查官方 CWS 商店页是否对品牌/非品牌查询显示 |
| 标签页转 Markdown | CWS、独立官网、GitHub 均明确展示 | 高 | 结果有明确格式型扩展，但包含单页复制 Markdown 的意图混淆 | 高 | 优先考虑首页专题区；独立页需 Google SERP 证明其意图与主复制主题有分离价值，并用实际输出样例 |
| 标题+URL / 纯文本 / HTML 输出 | 产品直接支持，竞品页面存在类似选项 | 高 | 大多是主“复制标签”任务内的功能修饰词 | 中高 | 合并在首页/同一功能页，不为每个格式单独建页 |
| 如何复制所有打开的 Chrome 标签 | 视频/教程结果、官方书签替代方案 | 高（任务本身） | 教程意图与安装意图不同；已有视频结果 | 中高 | 进一步验证；若写，作为一篇完整教程，含原生书签方案、剪贴板局限、扩展步骤，不拆多个近似教程 |
| 导出/保存浏览器标签 | 有浏览器原生书签及多类会话/文件产品，意图混杂 | 中/低 | SERP 可能偏向导出文件、会话管理、备份 | 中 | 暂缓独立页；文案解释 Tab Copier 输出到剪贴板，不暗示文件导出/恢复 |
| 竞品品牌/替代词 | 搜索样本可发现相邻产品，无任何量化数据 | 低至中 | 品牌导航/商店页主导；商标和比较内容维护成本高 | 低/不确定 | 暂缓竞品落地页；不做未经测试的“最佳替代”比较 |
| 研究/学习/开发场景 | 竞品营销文案与用户讨论提及这些情境 | 中 | 多为产品页中的场景模块，而非独立 SERP 意图证据 | 中 | 首页内举真实工作流即可；不按职业/场景批量建薄页 |
| 简体中文直接词 | 中文 CWS、博客、工具动作样本存在 | 中（表达线索） | 查询意图会混合当前页 Markdown、复制多标签、书签 | 高 | 进一步验证中国大陆与繁体中文/台湾分别的 SERP；有本地化内容能力后优先首页中文版本，不建词变体页 |
| Tab Copier 品牌词 | 第三方索引记录及本地代码品牌名 | 低（品牌认知未知） | 商店原页面不可访问，官网不存在/未知 | 高（若发生） | 品牌信息放首页；需求待 GSC/Keyword Planner 验证 |

## 数据限制与待完成验证

- 本阶段**没有**获得可靠关键词搜索量、月趋势、KD、CPC、搜索点击份额或国家级市场比较。关键词研究在“需求量化”方面尚未完成；不以定性结果冒充完成。
- Google Web 工具搜索不是地点可复现的浏览器 SERP。需人工在目标国家的 Google 结果中记录前 10 个自然结果、广告、CWS、PAA、视频、相关搜索及日期/设备/语言。
- 未访问 Google 自动补全/PAA 的结构化结果，也没有把其作为需求证明。
- Keyword Planner：需可用 Google Ads 账户/权限，并导出 country、language、network、时间范围、平均月搜索量区间/趋势等原始字段。不要因账号创建而假定可见到精确数据。
- Ahrefs/Semrush：如已有账号，按相同目标国家单独导出 volume、KD 定义、时间和数据库；不同工具不可直接混比。不得为本研究购买订阅。
- GSC：当前无官网/属性/数据，不能提供现有搜索词或点击数据。上线且验证域名后累积数据。
- 手工 SERP 截图需覆盖目标国家和英语市场（建议美国/英国单独看）、中国大陆简体中文；台湾繁体中文若计划支持也单列，不能用简体数据代表。

## 下一步研究建议

1. 先由产品方确认优先市场（建议英语美国、英语英国、简体中文中国大陆分开；这是待决策假设）。
2. 先完成 PRODUCT_FACTS 中 CWS/权限/发布包核验，之后才冻结用于广告工具调研的功能词。
3. 使用 Keyword Planner 及可用第三方工具导出完整候选词的量化字段；将数据和工具口径一起归档，绝不推算缺值。
4. 选每个意图组 3–5 个代表查询，在指定地点用未登录/固定设备浏览器手工记录 SERP 和自动补全/PAA。
5. 目标官网上线后接入 GSC；按查询×页面×国家观察展示/点击，直到有足够时间序列，再决定专题页。

---

# 第二阶段补充：市场基准与机会验证（2026-10-22）

本节更新第一阶段的“目标国家待定”：研究默认英语为主，美国为基准，英国、加拿大、澳大利亚与全球英语为对比，简体中文为辅助。这些是取样设置，不是市场价值结论。第一阶段未定位国家的样本仍保留为历史记录；以下结论优先于第一阶段同主题的暂定排序。

## 实际数据可得性与国家对比

Google Ads Keyword Planner、Semrush、Ahrefs 和 GSC 登录数据本次未取得；因此下表的月搜索量、趋势、KD 全部为**未验证**。Google Ads 官方说明：Avg. monthly searches 统计所选月份、地区和 Search Network 下一个关键词及近似变体的平均搜索次数；默认跨 12 个月且搜索量经过取整。其“Competition”衡量的是广告主竞争，不是自然排名难度：[Keyword Planner 指标定义](https://support.google.com/google-ads/answer/3022575)。不同国家结果必须独立导出，不能将四国相加充当“全球英语”。

| 市场 | 语言/定位 | 已获指标 | 已获 SERP | 可作判断 | 不能作判断 |
|---|---|---|---|---|---|
| 美国基准 | `hl=en&gl=us`；实际浏览器跳转到 google.com.hk | 月搜索量/趋势/KD/CPC 均无 | 2 条查询的可见 Google 结果页样本，见下表 | 意图和页面类型初判，可信度中低 | 美国真实本地固定位置排名/需求规模 |
| 英国 | 英语，计划 `gl=gb` | 无 | 无可复现地区 SERP | 仅可复用产品功能判断 | 与美国需求/竞争差异 |
| 加拿大 | 英语，计划 `gl=ca` | 无 | 无可复现地区 SERP | 同上 | 与美国需求/竞争差异；英语与法语混合效应 |
| 澳大利亚 | 英语，计划 `gl=au` | 无 | 无可复现地区 SERP | 同上 | 与美国需求/竞争差异 |
| 全球英语 | 英语，多国家 | 无 | 仅第一阶段未定位的 Web 检索线索 | 可建立广义候选词池 | 全球搜索量或国家占比 |
| 简体中文辅助 | 简体中文，地区尚未锁定 | 无 | 第一阶段及本阶段中文 Web 检索线索 | 有“批量复制标签网址”等本地表达线索 | 中国大陆搜索量/排名与英文词直接可比性 |

直接访问 Google 搜索时，首次 `copy all tabs chrome` 和 `copy chrome tabs as markdown` 能读到结果页；随后的查询出现 Google 流量验证页。没有解决验证，也没有将未显示的结果视为已核实。用户电脑的 Chrome Web Store Tab Copier 原页打开亦返回不可访问，因此线上商品页产品事实仍依赖第一阶段列出的待核项。公开 Web 搜索工具可返回索引结果，却不能控制同等地区/设备/登录条件，故只用于补充页面存在与内容，不代替下表的排名。

### 美国参数 Google SERP 样本（自然结果与模块）

记录日期 2026-10-22。URL 中明确传入 `gl=us&hl=en&num=10`，浏览器实际域名为 `google.com.hk`。下面的“顺序”是页面可见顺序；视频/论坛等模块插入其中，不能把它转换为严格的 1–10 自然排名。Google 结果随用户与地点变化；可信度中低。

| 查询 | 可见顺序/页面与 URL | 页面类型 | 解决的问题与局限 |
|---|---|---|---|
| [`copy all tabs chrome`](https://www.google.com/search?q=copy+all+tabs+chrome&gl=us&hl=en&num=10) | 首个 Web 结果：[Copy All URLs (Free) CWS](https://chromewebstore.google.com/detail/copy-all-urls-free/pnbocjclllbkfkkchadljokjclnpakia) | 商店/安装 | 一次复制打开标签页 URL，直接安装路径 |
| 同上 | 接着：[Super User 提问](https://superuser.com/questions/117754/how-can-one-copy-urls-from-all-open-tabs-in-a-google-chrome-or-other-browser-w) | 论坛问答 | 说明用户需要把多个标签 URL 放进邮件/剪贴板，并提供书签管理器绕行方案；历史提问不等于当前词量 |
| 同上 | 随后视频模块：[Copy ALL Chrome Tabs at Once](https://www.youtube.com/watch?v=i73DF6WW2QU) 等 | 视频教程 | 比较扩展与浏览器自带收藏；视频模块影响点击布局 |
| 同上 | 随后 Web 结果：[Google Chrome Help 讨论](https://support.google.com/chrome/thread/188720240/feature-request-on-chrome-chromium-copy-multiple-url-link-s-from-tab-s?hl=en)、[Tab Copy CWS](https://chromewebstore.google.com/detail/tab-copy/micdllihgoppmejpecmkilggmaagfdmb?hl=en-US)、[CopyTab URLs CWS](https://chromewebstore.google.com/detail/copytab-urls/lolhdpcjpflggojkdoamneplianpomnl)、MakeUseOf 教程（浏览器未提供可核实的完整 URL，因此只记页面类型） | 官方讨论/商店/教程 | 页面类型混合，说明“复制文本”与“如何做到”意图并存；不能凭该样本计算类型占比 |
| 同上 | 页面底部“People also search for”：`Copy all tabs URL extension`、`Copy tab URLs Chrome extension`、`Copy URL all tabs` 等 | 相关搜索提示 | 扩展候选表达；只证明 Google 在此会话展示建议，不证明搜索量 |
| [`copy chrome tabs as markdown`](https://www.google.com/search?q=copy+chrome+tabs+as+markdown&gl=us&hl=en&num=10) | 首个 Web 结果：[Copy as Markdown CWS](https://chromewebstore.google.com/detail/copy-as-markdown/fkeaekngjflipcockcnpobkpbbfbhmdn) | 商店/安装 | 复制单页内容/链接与当前窗口标签清单，功能更宽，可能混合单页和多页意图 |
| 同上 | 结果中可见 [Tab Copier CWS](https://chromewebstore.google.com/detail/tab-copier-copy-tabs-as-m/jokakblbincnhdmnhabpmdpobheebajf)、[Export Open Tabs CWS](https://chromewebstore.google.com/detail/export-open-tabs-copy-url/hedllffbgmkaihfdmbojgjpodcljmagm)，以及 Reddit/Obsidian 讨论模块、旧版 Chrome 商店/Softonic 项 | 商店/讨论/目录 | 格式词有安装倾向；Tab Copier 原页能在该样本显示，但未记录为稳定排名，也不推断点击或流量 |

**SERP 可见缺口与切入点（推断）：** “复制全部标签页”结果同时提供扩展和书签绕行教程。一个准确解释“复制文本列表 vs 收藏书签”的指南可能有内容价值，但现有问答/教程已解决部分问题，不能称为空白。“Markdown”结果部分产品兼做单页内容剪辑；Tab Copier 可清楚说明“多个已打开标签页的标题+URL 转为 Markdown 链接”，配真实输出样例与当前/全部窗口限制。竞争者也有此能力，因此这属于表达清晰度机会，而非独占功能或排名保证。

## 竞品与产品满足度更新

| 样本及来源（2026-10-22） | 直接观察 | 对 Tab Copier 的影响 |
|---|---|---|
| [Copy All Tabs CWS](https://chromewebstore.google.com/detail/copy-all-tabs/cdoannkbdlomokpmegnfjigbcihjpdnl) | 页面明确列 URL-only、Title+URL、Markdown、HTML 和固定标签排除，和本产品四种输出高度相似 | 四格式不是独特卖点。需要真实选择/筛选流程或可信隐私说明形成实际差异；不能仅凭“格式多”建四页 |
| [Copy All URLs 官网](https://copyallurls.com/) | 覆盖 tab/group/window/all、URL/Markdown/CSV/JSON/HTML，多格式并有 CWS 安装 CTA | “all URLs”任务直接相关，但它含 Tab Copier 不支持的组与文件/结构化格式，不应追逐这些词 |
| [Umbrella 官网](https://tabs.clasicwebtools.com/) | 具备全窗口、选择、自动复制、自定义格式与粘贴恢复 | 更广的会话/工作流功能会分走“save/restore tabs”需求；Tab Copier 当前只解决剪贴板复制 |
| [Copy as Markdown CWS](https://chromewebstore.google.com/detail/copy-as-markdown/fkeaekngjflipcockcnpobkpbbfbhmdn) | 同时满足选区/页面内容、链接及标签列表的 Markdown 需求；商店可直接安装 | “copy as Markdown”单独词意图过宽；要锁定“tabs as Markdown links” |
| [Super User 用户提问](https://superuser.com/questions/117754/how-can-one-copy-urls-from-all-open-tabs-in-a-google-chrome-or-other-browser-w) | 公开提问直接描述批量复制标签 URL 进剪贴板/邮件的痛点，问答有无需扩展的书签路径 | 属于需求真实性的**用户问题证据**，但其浏览/投票数不能换算为当前关键词月搜量 |
| [Google Chrome tips](https://www.google.com/chrome/tips/) | 官方支持 Bookmark All Tabs | “save tabs”常指书签；Tab Copier 不是书签或会话保存器 |
| 中文样本：[复制所有网址 CWS](https://chromewebstore.google.com/detail/copy-all-urls/jmlbphjlncpbgojfjelfgbnhjelcnedm?hl=zh-CN)、[Copy Tab List 介绍](https://tmdm.cn/copy-tab-list-chrome-extension/) | 用“复制所有网址”“标签列表”“所有窗口”等本地表达；CWS 页面说明多格式 | 扩展中文候选词，但没有中国大陆 SERP/量，暂作辅助市场验证 |

CWS 页面上的用户数/评分即使可见，也只代表扩展商品表现，不代表查询词量；本轮不把它们用于机会评分。

## 第二阶段关键词扩展与证据层级

新增候选：`copy all tabs URL extension`, `copy all tabs links`, `copy open tab URLs`, `copy URLs of all open tabs`, `copy multiple Chrome tabs URLs`, `get URLs from open tabs`, `copy selected Chrome tabs`, `copy tabs from all windows`, `copy Chrome tabs to clipboard`, `copy browser tab links`, `copy tabs as a list`, `tab link list extension`, `how to share multiple Chrome tabs`, `how to copy a list of links from tabs`, `Chrome bookmark all tabs vs copy URLs`, `copy research links from tabs`；中文新增 `复制所有网址`、`复制 Chrome 窗口标签列表`、`批量复制所有标签页 URL`、`多个网页链接复制成列表`。来源为 Google 可见相关搜索、CWS 标题/描述、用户问答和中文商店/文章用语；各词的独立搜索需求**尚未量化**。完整候选供 Google Ads 检索的单列 CSV 见 [`KEYWORD_PLANNER_IMPORT.csv`](KEYWORD_PLANNER_IMPORT.csv)。CSV 没有搜索量、趋势或难度列，空缺就是未验证，不代表零。

| 证据层级 | 可用于什么 | 本轮例子 | 不可推出什么 |
|---|---|---|---|
| 直接用户问题 | 说明具体任务真实出现过 | Super User 询问一次复制所有标签 URL 并分享 | 现在的月搜索量、国别分布、购买/安装率 |
| Google 可见 SERP | 说明此时此浏览器某查询的结果类型、顺序 | 上述美国参数两条查询 | 稳定美国排名、难度、词量 |
| CWS/竞品内容 | 说明市场供给和功能表达 | Copy All Tabs、Copy as Markdown、Copy All URLs | 搜索需求大小或 Tab Copier 差异化已成立 |
| 相关搜索/文章用词 | 扩展候选词表 | copy all tabs URL extension、复制所有网址 | 每个变体都有独立搜索量 |
| Keyword Planner/SEO 工具 | 本轮无 | 待导入 CSV | 不得填数值或评级 |

## 聚类机会排序（定性，需量化复核）

| 集群 | 需求证据 | 产品匹配/安装意图 | 竞争与差异机会 | 判断/可信度 |
|---|---|---|---|---|
| **复制全部/多个打开标签的 URL 与链接** | Google 结果中有 CWS、问答、视频、教程；用户问题直接 | 高/高 | 同类商店页密集、已有解法；可用真实选择/范围/输出演示降低理解成本 | **优先验证与投入**；中（意图），低（规模/难度） |
| **将多个标签复制为 Markdown 链接** | Google 美国参数样本有 CWS/讨论，含 Tab Copier 商品页 | 高/高 | “Copy as Markdown”部分指页面内容；清楚界定多标签 URL 链接及输出样例 | **优先验证与投入**；中（意图），低（规模/难度） |
| **如何复制/分享多个打开标签** | Google 样本显示问答/视频/官方讨论 | 高/中 | 可解释原生书签方法与剪贴板列表差异；但已有教程 | **有潜力但证据不足**；中低 |
| **标题+URL、纯 URL、HTML、列表** | 产品支持，CWS 同类表达 | 高/高 | 多为同一工具选择格式，独立内容薄 | **合并到现有页面**；中 |
| **“复制所有网址”中文直接词** | 中文 CWS 和文章用语；未测大陆地区 | 高/潜在高 | 本地表达与“当前页”混淆，需中文 SERP | **有潜力但证据不足**；低 |
| **保存/导出标签、书签、会话恢复** | Google/Chrome 官方与竞品功能真实存在 | 剪贴板部分匹配；文件/会话低 | 意图易落在备份/恢复/文件，产品满足度低 | **暂缓投入**或**与当前产品不匹配**；中 |
| **竞品品牌/替代** | 品牌/比较有可见产品，词量未知 | 中低/不确定 | 商店/品牌官网主导，差异证据不足 | **暂缓投入**；低 |
| **研究、开发、学习职业变体** | 竞品和用户问题提到场景 | 中/中 | 缺独立 SERP 意图；内容易重复 | **合并到首页场景**；低 |

**页面建议：** 首页承接“复制多个/全部 Chrome 标签页 URL”并展示 Markdown、标题+URL、URL-only、HTML 和范围选择。Markdown 有足够功能相关性，先作为首页完整章节；只有美国/英加澳的量化需求、SERP 意图分离和原创内容足够时才考虑独立页。一篇“如何复制打开标签页 URL”的教程可候选，但需要验证教程型查询量与实际结果；以原生书签替代方法、真实扩展步骤和边界说明提供完整回答。简体中文优先验证本地首页表达，不按英词机械翻译。以上均为研究建议，不是建站指令。

## 可执行的下一轮定量验证

1. [Google Ads 官方帮助](https://support.google.com/google-ads/answer/7337243)要求上传文件只有 `Keyword` 一列。将 [`KEYWORD_PLANNER_IMPORT.csv`](KEYWORD_PLANNER_IMPORT.csv)按英语与中文分别取子集导入 Keyword Planner 的 **Get search volume and forecasts**；不要创建广告活动。
2. 对英语词分别设置美国、英国、加拿大、澳大利亚，再单独取全球英语范围；每次导出原始 CSV，注明 Google Search 或含 Search Partners、语言、月度范围、平均月搜索量、竞争（广告）、出价范围和月趋势。中国大陆简体中文独立运行并标记 Google 覆盖限制。
3. 汇总时保留工具返回的区间、四舍五入、近似变体合并等原始口径；零/破折号不等于无需求。若可访问 Ahrefs/Semrush，另列各自 volume/KD 定义和数据库日期，不横向拼接成统一“难度”。
4. 在固定设备/国家位置手工复核每个高意图集群至少 3 个词的自然前十、广告、视频、PAA、相关搜索，保存截图和直接 URL；本轮 Google 流量验证解除前不重复自动查询。

### 登录工具可用性复核（2026-10-22）

- Google Ads：在已有 Google 浏览器会话打开 Keyword Planner 官方入口后，页面显示“您没有任何 Google Ads 账号。您是否希望创建一个新账号？”；未创建账号或广告活动，故无 Keyword Planner 指标。
- Semrush：已有浏览器页为 [免费 Keyword Checker](https://www.semrush.com/analytics/keywordoverview/)；页面显示未登录且当日 `0 / 5` 免费查询余额，本轮没有获得 Tab Copier 词的搜索量、KD 或趋势。
- Ahrefs：已有浏览器页为 [免费 Keyword Difficulty Checker](https://ahrefs.com/keyword-difficulty/)；以 United States 选择器提交 `copy all tabs chrome`，页面更新了查询 URL，但未显示该词的 KD、量或结果。该空白不能记作 KD=0 或搜索量=0。
- GSC：浏览器中的 Search Console 属性指向另一个网站，不能作为 Tab Copier 官网数据。未读取或挪用其查询指标。

---

# 第三阶段补充：完全免费渠道复核（2026-10-22）

本节按用户最新范围聚焦 `copy all tabs / copy chrome tabs / copy tab URLs` 和 `chrome tabs to markdown / copy tabs as markdown`，并以美国为基准，分别查看英国、加拿大、澳大利亚与简体中文。只使用公开免费页面；不把第一、二阶段的候选词当作已定目标词。本节结论覆盖前文可能更乐观的页面优先级措辞。

## 指标口径与方法

- **Google Trends：** Google 网页搜索、所有类别、过去 5 年（页面下载请求显示 2021-10-22 至 2026-10-22）、各国分别设置 `geo`。对比对象为输入的 **Search term**（具体词组），不是 Google 主题。记录图表“平均值”一行的整数，仅供**同一个国家、同一组对比、同一时间范围**内理解相对关注度。两组词各自重设 0–100 尺度，所以连同一国家的跨组指数也不能直接比较。
- [Google 官方 Trends FAQ](https://support.google.com/trends/answer/4365533)说明：数据基于搜索样本，按地区/时间总搜索进行归一化，再缩放到 0–100；低频词可显示 0，低量时的孤立尖峰可能是统计噪声。**0 不等于零次搜索，15 不等于每月 15 次，也不能拿美国 15 与英国 1 直接比较市场规模。**
- 官方 [Trends 导出说明](https://support.google.com/trends/answer/4365538)支持下载图表 CSV；本轮点击美国图表 CSV 按钮时浏览器阻止下载（`ERR_BLOCKED_BY_CLIENT`），故未取得原始周序列 CSV。以下数值是页面显示的取整平均值，置信度低到中；未计算年同比或稳定增长率。
- **估算搜索量：** 免费渠道本轮无可核实的核心词月搜索量。**自然排名难度：** 免费 Ahrefs 上轮对本项目核心词未返回 KD，Semrush 免费额度为 0；本轮没有重复尝试限制或付费/登录入口。**真实网站表现：** Tab Copier 官网无本项目 GSC 查询数据；竞品商店用户数不能替代本项目流量或词量。

## Google Trends：直接记录的相对数据

下表每格按标题中的词序列出页面显示的 5 年平均相对指数。**不同国家/不同组不共用尺度**；数值非常低时优先判为“无足够分辨力”，不要据此排序市场。查询日期均为 2026-10-22，语言为所输入的英语词组，界面语言为 zh-CN，不影响输入词组。

| 地区及可复核页面 | 组 A：`copy all tabs` / `copy chrome tabs` / `copy tab URLs` | 组 B：`copy all tabs` / `chrome tabs to markdown` / `copy tabs as markdown` / `copy chrome tabs as markdown` / `tabs to markdown` | 解读与可信度 |
|---|---|---|---|
| [美国 A](https://trends.google.com/trends/explore?date=today%205-y&geo=US&q=copy%20all%20tabs,copy%20chrome%20tabs,copy%20tab%20URLs) / [美国 B](https://trends.google.com/trends/explore?date=today%205-y&geo=US&q=copy%20all%20tabs,chrome%20tabs%20to%20markdown,copy%20tabs%20as%20markdown,copy%20chrome%20tabs%20as%20markdown,tabs%20to%20markdown) | **15 / 3 / 0** | **16 / 0 / 0 / 0 / 0** | 同组内 `copy all tabs` 有明显更可见的相对信号；Markdown 精确词低于图表可辨阈值。前者中低，后者低 |
| [英国 A](https://trends.google.com/trends/explore?date=today%205-y&geo=GB&q=copy%20all%20tabs,copy%20chrome%20tabs,copy%20tab%20URLs) / [英国 B](https://trends.google.com/trends/explore?date=today%205-y&geo=GB&q=copy%20all%20tabs,chrome%20tabs%20to%20markdown,copy%20tabs%20as%20markdown,copy%20chrome%20tabs%20as%20markdown,tabs%20to%20markdown) | **0 / 1 / 1** | **0 / 1 / 0 / 0 / 0** | 全部处在 0–1 范围，不作词/国家排序；低 |
| [加拿大 A](https://trends.google.com/trends/explore?date=today%205-y&geo=CA&q=copy%20all%20tabs,copy%20chrome%20tabs,copy%20tab%20URLs) / [加拿大 B](https://trends.google.com/trends/explore?date=today%205-y&geo=CA&q=copy%20all%20tabs,chrome%20tabs%20to%20markdown,copy%20tabs%20as%20markdown,copy%20chrome%20tabs%20as%20markdown,tabs%20to%20markdown) | **0 / 0 / 0** | **0 / 0 / 0 / 0 / 1** | 低于可稳定解读的范围；低 |
| [澳大利亚 A](https://trends.google.com/trends/explore?date=today%205-y&geo=AU&q=copy%20all%20tabs,copy%20chrome%20tabs,copy%20tab%20URLs) / [澳大利亚 B](https://trends.google.com/trends/explore?date=today%205-y&geo=AU&q=copy%20all%20tabs,chrome%20tabs%20to%20markdown,copy%20tabs%20as%20markdown,copy%20chrome%20tabs%20as%20markdown,tabs%20to%20markdown) | **1 / 0 / 1** | **1 / 0 / 1 / 1 / 0** | 0–1 范围，不能当作 Markdown 在澳洲更有需求；低 |

同一美国词 `copy all tabs` 在 A/B 中分别显示 15/16，体现两组的归一化和取整差异，不应视作两次不同的月量。Google Trends 的“相关查询”模块对美国 A 三词显示数据不足；其他低量词未提供可用于可靠扩词的相关查询。没有基于这些低量图表声称上升趋势。

**简体中文辅助样本：** [中国大陆参数的 Trends 对比](https://trends.google.com/trends/explore?date=today%205-y&geo=CN&q=%E5%A4%8D%E5%88%B6%E6%89%80%E6%9C%89%E6%A0%87%E7%AD%BE%E9%A1%B5,%E6%89%B9%E9%87%8F%E5%A4%8D%E5%88%B6%E6%A0%87%E7%AD%BE%E9%A1%B5%E9%93%BE%E6%8E%A5,Chrome%20%E6%A0%87%E7%AD%BE%E9%A1%B5%E8%BD%AC%20Markdown) 输入 `复制所有标签页 / 批量复制标签页链接 / Chrome 标签页转 Markdown`，平均指数 **1 / 0 / 0**；地区细分和相关查询均提示“没有足够的相关数据”。这只说明该 Google Trends 设置下数据无法分辨，不能推断简体中文用户没有需求，尤其不能代表中国大陆整体搜索市场。

## 免费 SERP 与用户需求证据

- **可见 Google SERP 排列：** 第二阶段保留的美国参数 `copy all tabs chrome` 页面先显示 [Copy All URLs (Free) 商店页](https://chromewebstore.google.com/detail/copy-all-urls-free/pnbocjclllbkfkkchadljokjclnpakia)，再见 [Super User 问题](https://superuser.com/questions/117754/how-can-one-copy-urls-from-all-open-tabs-in-a-google-chrome-or-other-browser-w)，并插入视频模块和其他商店/教程结果。`copy chrome tabs as markdown` 首个可见 Web 结果是 [Copy as Markdown 商店页](https://chromewebstore.google.com/detail/copy-as-markdown/fkeaekngjflipcockcnpobkpbbfbhmdn)，同页可见 Tab Copier 商店结果。浏览器落在 `google.com.hk`，这是 **`gl=us` 参数样本**，不是经位置核准的美国自然排名；详见上文逐项 URL。
- **本轮公开 Web 检索（2026-10-22，未锁地区，结果顺序不视作 Google 排名）：** `copy all tabs chrome URLs extension` 与 `copy tab URLs chrome extension` 找到 [Copy All Urls 商店页](https://chromewebstore.google.com/detail/copy-all-urls/blcikocpcipackegcmopdblojpembinp) 和 [Copy All URLs 官网](https://copyallurls.com/)；`copy chrome tabs markdown links extension` / `chrome tabs to markdown extension` 找到 [Copy as Markdown GitHub README](https://github.com/yorkxin/copy-as-markdown) 和 [TabScribe 官网](https://tabscribe.auraflame.tech/)。这些页面直接展示“打开的标签 URL 列表”和“多标签 Markdown 链接”任务，且产品/商店页有安装路径。它们是**供给和意图佐证**，不证明任何单词的搜索量、自然难度或国家排名。
- **真实用户问题：** [Super User](https://superuser.com/questions/117754/how-can-one-copy-urls-from-all-open-tabs-in-a-google-chrome-or-other-browser-w) 明确询问把所有打开标签 URL 一次放入剪贴板/邮件；[Reddit 电子表格问题](https://www.reddit.com/r/excel/comments/gcoqjp)询问把多个 Chrome 标签 URL 快速放入表格。前者支持“分享链接列表”任务，后者涉及表格输出但不代表 Tab Copier 支持 CSV 文件。帖文年龄、浏览数、投票数均不作当前月搜索量。
- **竞争切入边界：** 直接竞品已有纯 URL、Markdown、筛选和跨窗口等功能；Tab Copier 应把可核实的“选择多个打开标签 → 复制可粘贴列表”讲清楚，并提供真实输出示例和商店安装链接。没有证据证明本产品在功能或排名上具有独占优势。
- **其他国家的 Google SERP：** 继上一轮 Google 流量验证后，本轮没有通过换账号/工具或重复请求绕过限制；英国、加拿大、澳大利亚固定地点自然结果顺序仍**免费渠道无法验证**。公开 Web 检索不具国家定位，不能冒充四国 SERP。
- **Google 自动补全：** 本轮没有取得可复核的地点一致自动补全快照；先前 Google 页底部的相关搜索仅作候选词线索，不作需求大小证据。未用自动补全绕过 Google 的流量验证。

## 机会判断与页面合并

| 关键词组 | 可确认的需求证据 | 产品/安装匹配 | 数据缺口 | 当前动作 |
|---|---|---|---|---|
| `copy all tabs`、`copy chrome tabs`、`copy tab URLs` 与清楚的 Chrome/URL 变体 | 美国 Trends 同组相对信号（只对第一词有可辨性）、Google 参数 SERP、直接用户问题和竞品商店页 | **高**：当前窗口/所有窗口、选择标签、剪贴板复制 | 免费渠道无月量/KD；四国固定地点 SERP 无；竞品有相似功能 | **优先首页主题**。标题/正文应明确“多个打开的 Chrome 标签”和“复制链接列表”，避免泛词 `copy all tabs` 独自承担全部语义 |
| `chrome tabs to markdown`、`copy tabs as markdown` 及多标签链接变体 | Google 参数 SERP 有商店页；产品源码支持 Markdown；Trends 精确词基本无法辨识 | **高**：格式与安装意图吻合，但 `copy as markdown` 也指单页内容 | 无可靠量、趋势方向和独立 SERP 差异证据 | **首页完整格式章节**；Markdown 独立页保持候选，不因“0”放弃，也不据此开页 |
| “如何复制/分享全部标签” | 问答、教程、视频，任务已证实 | 中高：可用步骤说明；原生书签方法也能解决部分保存需求 | 教程词量与四国 SERP 缺失 | **候选一篇指南**，现阶段不批准单独上线 |
| 标题+URL、纯 URL、HTML、中文职业/场景变体 | 代码支持或场景表达存在 | 高/中 | 独立需求证据缺失 | **合并首页**，不按格式/场景批量建页 |
| 文件导出、CSV/JSON、会话恢复及泛竞品替代词 | 竞品覆盖，但当前产品不具备这些能力 | 低或不匹配 | 无需先查词量即可判定产品满足度不足 | **暂缓/不适合当前产品** |

当前**没有任何核心词**达到“有可靠月搜索量 + 国家 SERP + 可解释自然竞争”的最终机会证明标准。免费渠道最扎实的结论是任务真实、产品匹配和结果类型；四国市场规模排序、趋势增长和自然排名难度继续标记为**免费渠道无法验证**。
