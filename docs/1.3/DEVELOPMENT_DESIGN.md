# 1.3 开发设计 · 自动激活

2026-11-27 修订；替代此前页面领码/手动输入激活码方案。依据 ../RELEASE_1.3_PLAN.md。状态：可开始工程开发，外部沙盒/Live 能力尚未实际验证。

## 架构与支付选择

website/ 为独立 Next.js App Router 项目，Route Handlers 使用 Node.js runtime，部署 Vercel。扩展仍为原生 HTML/CSS/JS，新增 MV3 service worker 统一购买会话、授权缓存、额度与迁移；网站不进入扩展 dist。Supabase PostgreSQL 为唯一主库；无需用户登录、邮箱服务或 Redis。

PayPal.cn 中国个人卖家为商户接入方式，账号由用户提供，不写入产品/前端；实际收款身份通过服务端 PAYPAL_MERCHANT_ID 和凭据配置。先按官方中国集成指引做 Sandbox REST Checkout + Webhook。中国产品入口不代表 API 在 paypal.cn；按环境固定 api-m.sandbox.paypal.com / api-m.paypal.com。不允许从客户端传入任意支付 API 地址，不混用 IPN 协议。现有个人卖家审核和 Live 权限另行验证，不因沙盒可用就认定能正式收费。

## 购买与自动激活

1. 扩展生成随机 installationId（不是硬件指纹），调用服务端创建 purchase_session。取得 256 bit 私密 pollToken，仅保存 chrome.storage.local；服务端存哈希。匿名会话创建限流，不能以 installationId 验证身份。
2. 创建同时返回一次性 checkoutTicket，扩展打开官网 /checkout#ticket=...。票据 10 分钟过期，页面通过 POST 兑换安全 HttpOnly/Secure/SameSite 会话后立即清除 fragment；购买页面不加载第三方分析，no-referrer，日志不记录票据。兑换只建立网站购买会话，不给网页插件授权凭证。
3. 用户选择套餐，网站会话调用创建订单接口，价格、币种、环境和商户身份由服务端固定；创建有幂等键。购买会话绑定 PayPal 订单。网页跳转/SDK 打开批准页面。
4. 买家批准后由服务端捕获；主动查询和验签 Webhook 驱动同一个幂等状态机。只有核实 capture completed、正确商户/金额/币种/环境及未撤销后，事务写 paid 并创建一份 license。
5. 网站显示付款和自动激活进度；弹窗关闭也不影响订单。插件打开时立即以 pollToken 查询，购买中后台有限重试（指数退避，最长 10 分钟，之后显示“重新检查”）；不依赖 MV3 常驻或无限轮询。
6. 扩展 POST /api/purchases/:id/activate，携带 pollToken 和 installationId。原子创建 activation，首次成功时设置 first_activated_at 及到期时间。以 pollToken、同一安装重试只返回同一 activation，不延长时间。此接口在原购买会话内允许恢复丢失的激活响应。
7. 返回扩展内部 refreshToken 与签名 entitlement，不在网页显示。内部 refreshToken 可由服务端从会话秘密派生，或单独加密保存支持安全重试，主校验值存哈希。激活确认后 pollToken 保留 7 天供重试，之后使用 refreshToken。未激活已支付订单的私密购买会话最多保留 90 天，之后走人工恢复；保留时间通过服务端状态判断，订单记录不自动删除。

网站与插件分别持不同凭证，公开 clientId/orderId 不能领授权；CORS/Origin 仅为补充检查，不能代替鉴权。所有支付、激活响应 no-store，禁止授权凭证出现在 URL 查询参数或埋点。

## 接口合约

| API | 身份与用途 |
| --- | --- |
| POST /api/purchases | 创建匿名购买会话；限流，返回 pollToken/checkoutTicket（各自独立） |
| POST /api/checkout/exchange | 消费一次性票据，建立网站安全会话；拒绝重放 |
| POST /api/orders | 网站会话 + plan + 幂等键；服务端固定价格，返回批准地址 |
| POST /api/orders/:id/capture | 网站会话；捕获并核实，不允许捕获他人订单 |
| POST /api/paypal/webhook | 官方验签及可信交易核查，重复/乱序通知幂等处理 |
| GET /api/checkout/status | 网站会话；只返回付款/激活状态，不返回授权秘密 |
| POST /api/purchases/:id/status | pollToken；返回非敏感状态，不能通过订单号公开查询 |
| POST /api/purchases/:id/activate | pollToken + installationId；幂等自动激活 |
| POST /api/licenses/refresh | refreshToken + installationId；核实授权并刷新签名权益 |
| POST /api/recovery/exchange | 本地恢复请求秘密 + 单次恢复票据；绑定申请安装并恢复 |

## 人工恢复：不发自动邮件

恢复入口固定联系 sumei7550@outlook.com；提供 mailto、复制邮箱与复制模板，不自动发送任何邮件。模板包含购买邮箱、PayPal 交易号、问题描述及插件生成的恢复请求编号。邮件应用不可用时，用户自行在网页邮箱发送。不得发送 PayPal 密码或内部 refreshToken。

“生成恢复请求编号”只创建短期 recovery session，客户端持有秘密，服务端存哈希；不采集邮箱、不发通知、不构成恢复申请表单，限流。管理员核实真实支付数据，优先向支付记录邮箱确认归属；自填邮箱或截图不能单独授权。

管理员通过受保护 CLI 使用服务端管理凭据，绑定恢复请求生成 24 小时有效、一次性恢复链接，手动邮件发给已核实用户；无需公开后台页面。链接在浏览器确认后用 POST 消费，不因 GET/邮件扫描器预览而失效；恢复秘密仅位于 fragment 且立即清除。插件以自身请求秘密查询/兑换，网页不取得内部授权令牌。恢复请求绑定新 installationId，同一恢复操作原子撤销旧 activation、创建新 activation，额度判断也在事务内。完成后原许可证有效期不变，已过期/退款/撤销授权不能恢复有效。

## 存储模型

| 表 | 关键字段/约束 |
| --- | --- |
| orders | UUID、plan、amount_minor 整数、USD、environment、provider_order_id UNIQUE、provider_capture_id UNIQUE、payer_ref/必要付款邮箱、status、paid_at |
| licenses | order_id UNIQUE FK、plan、first_activated_at、expires_at nullable、revoked_at；不再有用户激活码 |
| activations | license_id FK、installation_id、refresh_token_hash、revoked_at；同 license/installation 只允许一个当前记录 |
| purchase_sessions | poll_token_hash、ticket_hash、订单关联、expires_at、encrypted_retry_material；短期秘密仅服务端加密存储 |
| recovery_tokens | license_id、目标 recovery session、ticket_hash、expires_at、consumed_at；管理员审批后产生 |
| payment_events | provider_event_id UNIQUE、处理状态/重试信息；可靠入库后再应答，失败任务可重试 |

事务保证订单与授权同提交、同支付不重复发放、首激活只设置一次、恢复不超设备数。已退款/reversed 不能被延迟成功通知置回 paid。争议暂挂与最终撤销区分；自动部分退款先暂停对应授权并转人工核实，不擅自缩短天数。事件不能在持久化前返回成功然后依赖 Vercel 响应后的不可靠后台任务；入库失败返回可重试错误，定时任务重试已入库未完成事件。

## 建议的实施默认值（尚非用户明确确认）

- 单授权 1 个活动安装，换机人工恢复时替换旧安装。多设备自助管理不在 1.3。
- 签名 entitlement 包含 environment、activationId、功能、issuedAt、expiresAt、offlineUntil、keyId；公钥在扩展，私钥只在服务端。正常每 12 小时刷新，离线最多 72 小时，且不超过套餐 expiresAt；退款在联网刷新或缓存过期时生效。
- 旧安装暂按建议保留原不限次数、去重和列表样式，新增标签组需 Pro；最终迁移决策须在插件发布前确认，不能静默改变已提供权益。
- 有效定期授权/买断期间阻止同一安装重复购买；恢复凭证丢失用户先恢复再续购。到期后允许新订单，首次激活重新计算新订单有效期，不合并多个订单剩余天数。
- 体验按可信付款方标识限制一次；可先做安装级前置提示。访客付款方标识不稳定时不宣称严格限购。收款后发现重复体验订单，暂停发放，人工退款处理，不能既收钱又永久无提示拒绝。
- 人工恢复不承诺具体 SLA；对外写“人工核查后回复”，支持邮件是长期维护渠道。

这些默认值可用于模块与沙盒测试，但涉及权益的最终口径需在上线前确认，不阻塞独立支付链路开发。

## 复制功能与额度

scope/formatter/entitlement/quota 共用模块供 popup/options 使用。四种范围以打开 popup 前的 active tab 为准。预览与复制同一输出模型，标题/组名转义，禁止 HTML 注入。免费 Markdown 每行一个链接；Pro 才有列表与去重。未知网络状态不能直接当作未购买。到期降级需更新预览并说明。

配额本地软限制按日 3 次；worker 串行发放复制许可，成功写剪贴板后按 operationId 幂等提交，失败释放，租约到期回收。无法对清数据/崩溃做到强付费墙，不做硬件指纹。新增 tabGroups 与实际授权域名最小权限，13 个 locale 同步。固定工具栏只做引导。

## 配置与落地门槛

开发需要 Sandbox Client ID/Secret、Webhook ID、沙盒卖家商户 ID、Supabase 项目及服务端凭据、Vercel 项目和权益签名密钥。秘密仅放本地未追踪 env 与 Vercel 服务端环境变量，不通过聊天索要私钥；商户邮箱不替代 Client Secret 或 merchant ID。

Vercel 免费套餐商用资格、Supabase 暂停/备份策略、真实支持入口、隐私/商店披露在生产前确认。官方资料：https://www.paypal.cn/portal/landing/individual-seller-baidu 、https://www.paypal.cn/portal/developer/integration 。

结论：架构和流程可落地，可开始本地工程及沙盒实现；未配置凭据时可以实现模块但不能声称联调成功。Live 账户资格与完整真实付款/退款验证是上线门槛，而非开始沙盒开发的门槛。

## 客服入口更新（2026-11-27）

统一入口名称为“联系客服”，支持功能问题、付款与恢复购买。弹窗主操作“打开邮件应用”，通过 mailto 预填 sumei7550@outlook.com、主题“Tab Copier 客服支持”和可编辑问题模板；用户自行填写并发送，不自动发送。模板中付款邮箱和 PayPal 交易号仅在涉及付款/恢复时填写。不自动附带浏览数据、秘密凭证或付款详情。

保留复制邮箱和复制模板，处理默认邮件应用未配置的场景；不能承诺 mailto 在所有设备都能打开。“恢复购买”作为次要操作保留，上方说明“已购买？恢复 Pro 权益。”。点击先验证本设备凭证：有效则恢复；无凭证则引导联系客服；网络故障仅提示重试，不判断未购买。恢复本质仍是人工核实后的单次链接流程，不因改名降低鉴权。测试需核对中文主题/正文 URL 编码、用户确认发送、无邮件客户端备用入口、键盘焦点和恢复流程不变。

## 去重入口及规则（2026-11-27 确认）

- 弹窗保留“移除重复 URL · Pro”；设置页为“默认移除重复 URL · Pro”。两处映射同一个 removeDuplicates 偏好，修改后同步，不创建互相覆盖的第二套值。正式实现跨页面用 storage.onChanged 同步。
- 进入设置或查看去重选项不弹付费；免费用户尝试开启才显示 Pro 说明，可看套餐或取消。取消不保存开启状态；Pro 直接切换并更新预览。权益判断在处理输出的公共模块执行，不能仅凭按钮/本地布尔值放行；旧用户按最终迁移政策例外处理。
- 顺序：候选范围/筛选/勾选 → 按 removeTracking 处理 URL → 开启且有权益时去重 → 生成预览和复制文本。对相同的处理后完整 URL 保留第一条，不按标题/域名/网页内容合并，不新增参数排序、hash 删除或路径大小写折叠。
- 开启时显示“已排除 N 个重复链接 · 将复制 M 条”，无重复显示 0；选中数量保持真实勾选数，与输出数量分开。关闭后保留所有已选项。
- 列表保留原始候选以便用户决定选哪个标题；去重作用于已选输出，不提前永久隐藏重复候选。这是相比 1.2 加载时去重的有意调整。Pro 到期或无有效权益后，保留偏好但停止执行并同步预览。
- 搜索属于查找，去重属于输出整理；本版不新增复杂高级过滤菜单。
- 原型含一对仅追踪参数不同的示例链接，可切换 Pro、去重和追踪清理查看效果；模拟设置不跨刷新持久化。

## 支持序列号统一（最新交互）

普通反馈与恢复购买统一使用本安装的公开支持序列号 TC-随机安装标识。自动生成并随邮件/复制模板附带，用户不手动生成或填写；序列号不是付款、授权或购买归属证明，不是硬件指纹，重装可能变化。普通反馈只填问题描述，不要求交易信息，不请求恢复服务。点击“恢复购买”时才在内部建立私密恢复会话，UI 不再展示单独恢复编号；管理员用支持序列号定位有效会话，仍需独立核实付款归属。找不到会话时要求点击恢复购买，不凭序列号直接发授权。恢复接口仍使用独立私密凭证。

## 联系客服文案简化

不在用户页面展示安装标识或“支持序列号”及其解释。普通反馈和恢复邮件后台自动附带同一安装标识，邮件字段称“参考编号”；复制模板同样附带。页面仅保留联系、复制和恢复操作，成功反馈只说明已复制/请填写问题，不突出编号。测试需确保移除展示后没有遗留 DOM 引用，邮件/模板仍包含定位信息。该标识仍不能代替授权或付款归属验证。
