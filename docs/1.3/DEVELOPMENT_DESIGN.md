# 1.3 开发设计

状态：设计稿；不代表服务已配置或接口已实现。需求依据 ../RELEASE_1.3_PLAN.md，界面依据 UI_DESIGN.md。

## 架构与边界

扩展继续使用原生 HTML/CSS/JS。新增 MV3 service worker 管理授权缓存、配额串行更新和安装迁移。popup/options 共用 entitlement 与 formatter 模块；预览和复制均从相同结构化输出模型生成，DOM 使用 textContent、安全链接及转义，不拼接未净化标题/组名。

使用 Next.js App Router 构建精简官网及后端，部署于 Vercel；支付、领码、激活和 Webhook 接口采用 Route Handlers，使用 Node.js runtime。Supabase PostgreSQL 为主存储。无登录、不发邮件。浏览器只能调用有限业务接口，不能取得 Supabase 服务密钥、PayPal Secret 或签名私钥。沙盒与正式环境独立部署配置、数据库和签名信任域。

Next.js 项目建议独立放在仓库 website/，与根目录 Chrome 扩展分开构建；Vercel Root Directory 指向 website，扩展打包不得包含网站依赖或服务端文件。后端依赖仅在服务端模块导入，秘密不得使用 NEXT_PUBLIC_ 前缀。Route Handlers 不依赖进程内存、常驻进程或本地磁盘保存订单/锁/授权；跨请求状态放 Supabase。领取和授权响应显式 no-store，支付 Webhook 保留验签所需的原始请求数据。Next.js 具体版本和依赖在实现时按官方文档核实后锁定。

## 插件模块

| 模块 | 职责 |
| --- | --- |
| scope | active tab、当前组、窗口、全部窗口查询；按 windowId/index 保持稳定顺序 |
| entitlement | free/pro/expired/unknown/legacy 状态；统一 feature gate |
| quota | 本设备按日 3 次，复制成功后提交扣次；防并发重复扣减 |
| formatter | plain Markdown/bullet/ordered/task、URL、titleUrl、HTML；可选组标题 |
| license client | 激活/刷新、可信时间和签名校验、离线缓存 |
| migration | 检测升级安装，处理旧默认 bullet/去重开关；策略待产品确定 |

新增 tabGroups 权限用于组名读取，tabs API 查询活动标签 groupId；新增授权 API 主机权限只针对实际域名。安装引导可读 action.getUserSettings，不自动固定。最终权限以当前 Chrome API 文档和 SDK 实现复核。

免费选择付费功能时只打开升级入口，不改变实际复制配置。到期回退必须先更新预览并提示，不允许显示有序预览却复制普通 Markdown。网络未知状态与未购买不同；有效缓存可用，缓存不可用时显示重试，不隐式认定用户未付款。

剪贴板与存储不是跨系统事务：service worker 先发放带短期租约的复制许可，popup 成功写剪贴板后按 operationId 提交，失败释放许可。关闭 popup/worker 中断的租约自动恢复；恢复依据在实现时明确。该方案仍是本地软限制，崩溃和清数据不可保证严格防绕过。

## 服务端 API 合约草案

| API | 输入/鉴权 | 行为 |
| --- | --- | --- |
| POST /api/orders | plan 枚举；创建限流 | 服务端固定金额/币种，返回 approvalUrl、领取凭证；创建失败可安全重试 |
| POST /api/orders/:id/capture | 领取会话；CSRF/Origin 校验 | 捕获订单并核实收款结果；重复调用不重复授权 |
| POST /api/paypal/webhook | PayPal 签名验证 | 验证通知并主动核查交易，记录成功/退款/撤销；禁止凭事件体直接信任金额 |
| POST /api/orders/:id/claim | 领取凭证置于请求体或安全会话 | pending 返回可重查状态；paid 返回同一激活码；返回 no-store |
| POST /api/licenses/activate | 激活码、随机安装标识 | 原子首次激活，返回签名权益及 serverTime；无效、撤销、到期可区分 |
| POST /api/licenses/refresh | 激活产生的高强度刷新凭证 | 核实当前授权，轮换凭证并返回签名权益；限流 |

接口错误采用可翻译的 code 与 retryable，不回传堆栈。领取秘密不能放查询参数、分析事件或日志；回调 URL 只有订单标识，原购买浏览器以安全会话证明领取权。跨浏览器领取通过用户主动输入领取凭证；真实流程不得只依赖订单号。跨站支付、CORS 和 cookie SameSite 需联调验证。

## 数据结构与一致性

orders：id UUID、plan、amount_minor 整数、currency、environment、provider_order_id UNIQUE、provider_capture_id UNIQUE、payer_ref（仅限试用限制需要）、status、claim_token_hash、paid_at、created_at。状态为 created/approved/pending/paid/refunded/reversed；approved 不发授权。

licenses：id UUID、order_id UNIQUE FK、code_hash UNIQUE、code_ciphertext、first_activated_at、expires_at nullable、revoked_at、refresh_token_hash。code_ciphertext 用独立服务端密钥加密以支持重复领取；日志屏蔽原码。首次激活事务锁定记录并按 DB 时间设期限；后续激活不得重置。

必要唯一约束和事务存储过程由迁移脚本管理。支付确认先核实环境、收款方、套餐金额、币种、capture 完成及未退款，再在事务中置 paid 和创建授权。乱序旧成功通知不能覆盖 revoked/refunded。并发体验购买须在付款前检查资格，确认时再次原子校验；重复已收款体验订单的人工/退款处理规则待确定。

暂不增加用户表。多设备上限、换机和重复购买的权益合并方案尚未确定，不能声称已具备单次试用的跨账号防绕过能力。

## 安全、运营与恢复

激活码使用至少 128 bit 安全随机值；激活/领取接口分层限流并防枚举，响应避免泄露交易详情。允许匿名访问的表默认拒绝读取写入，服务端 service role 最小化使用范围。可用 Supabase 原子计数/短期记录实现限流，不因此强制添加 Redis。

签名权益包含 licenseId、环境、功能、issuedAt、expiresAt、offlineUntil、keyId；扩展只持公钥，不能自己延长权益。离线宽限具体时长待确认；退款在下次联网验证生效，不能承诺离线即时撤销。

领取码不等于用户身份；人工恢复需核实真实支付记录，不接受单张截图作为证明。备份与恢复演练、密钥轮换和告警渠道在正式发布前配置。上报仅含非敏感状态/计数，ext_/web_ 分开，支付成功与激活成功分别记录、去重。

## 实施与未决项

先完成沙盒：最小购买页 → create/capture/webhook → Supabase → claim → 扩展最小激活。再完成主 UI、权益、迁移与多语言；最后正式账户验证与发布。

实施前需冻结：老用户是否保留旧权益、设备使用规则、离线宽限、续购如何计算、体验重复付款处理、支持渠道。正式账户权限不阻塞沙盒开发；未通过正式核款/退款/生产存储验证不得开放真实收费。
