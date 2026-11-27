# Tab Copier 1.3 · 沙盒工程

这是独立于已上线 1.2 的 Next.js 工程。仅允许 Sandbox，Live 主动返回 LIVE_DISABLED，不用于发布收费。根目录 popup/options/manifest 已开始接入此后端，dist 仍保留原构建，不作为 1.3 发布包。

## 已实现的第一阶段

- 套餐页与付款结果页，无激活码展示。
- 服务端购买会话、单次网页票据、创建/捕获 PayPal Orders v2 订单、Webhook 官方验签。
- Supabase 事务核款、同订单唯一授权、首次激活起算、幂等重试、单安装绑定。
- 内部刷新凭证、Ed25519 签名授权，最长 72 小时离线且不超过套餐到期时间。
- 独立 dev-extension：开始购买、检查并自动激活、验签与刷新，以及生成恢复请求/邮件模板/兑换恢复授权，不修改正式插件。
- 受保护的管理员 CLI：核实沙盒真实交易后签发一次性恢复链接，不提供公开管理员接口，不自动给用户发邮件。
- 付款结构/金额/币种/收款方校验单元测试。

## 本地启动

Node.js 20.9+（本次使用 24）。在此目录执行：

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

1. 新建独立 Supabase 测试项目，按顺序检查并执行 supabase/migrations/001_sandbox.sql、002_manual_recovery.sql、003_resume_checkout.sql、004_purchase_contact.sql 和 005_transaction_aliases.sql。已执行过 001–004 的数据库只执行 005；保留现有订单与授权。迁移已通过本地 PostgreSQL/WASM 验证，远程执行需在 Supabase SQL Editor 完成。
2. 在 .env.local 配置沙盒应用 Client ID/Secret、沙盒商户 ID、Webhook ID、Supabase URL/服务端密钥。真实卖家邮箱不能替代这些值，沙盒卖家与正式个人卖家是不同环境。
3. 执行 `node scripts/create-sandbox-keys.mjs` 生成本地 Ed25519 密钥和派生密钥。工具仅写入未追踪的 .env.local，拒绝覆盖已有密钥；sandbox-public-key.pem 供调试扩展使用。不要把私钥放调试扩展或 NEXT_PUBLIC_ 变量。设置 ENTITLEMENT_KEY_ID=sandbox-v1。
4. Webhook 配置可从公网访问的沙盒 Vercel URL，订阅 PAYMENT.CAPTURE.COMPLETED / REFUNDED / REVERSED，APP_URL 与部署 origin 一致。localhost 本身不能接收 PayPal 通知。
5. Chrome 加载 dev-extension/ 为单独调试扩展；保存公钥，开始购买，使用沙盒买家完成付款后，返回调试扩展点击检查并自动激活。

调试扩展只允许 localhost:3000。验证 Vercel 时须在 dev-extension/manifest.json 的 host_permissions 和 popup.js 的 base 中设置你的确切沙盒域名；不要用通配所有网站。此调试扩展不能提交商店。

## 配置和安全边界

- 默认没有真实凭据，也不读取系统中的其他项目凭据。
- .env.local/.vercel/node_modules/.next 被根 .gitignore 排除。
- 密钥变更需考虑已创建会话的可恢复性；派生令牌密钥不能随意重置。
- SQL 表启用 RLS，撤销 anon/authenticated 访问；存储过程仅 service_role 可调用。
- 收款先核实商户/金额/币种/最终 capture 状态，网页返回和公开订单号不能解锁。
- 事件先入库；处理失败返回非成功状态，供 PayPal 重试。尚未交付定时对账、持久失败告警与人工对账工具，不能仅依赖通知重试上线收费。
- 活跃请求限流按分钟 DB 原子计数；部署在 Vercel 外需重新配置可信代理来源，不能盲信客户端 IP。

## 人工恢复操作（沙盒）

最新查询支持购买邮箱/PayPal 邮箱候选选择、卖家号及已核实买家号关联，需执行 `005_transaction_aliases.sql`。PayPal 付款邮箱来自已验证的交易响应；管理员页有成对接口验证入口。详见 `../docs/1.3/TRANSACTION_LOOKUP_VERIFICATION.md`，本地测试不代表真实账号已获得报表查询权限。

推荐使用受管理员验证保护的 `/admin/recovery` 页面，直接使用 Vercel 已有服务端配置。首次只需执行 `004_purchase_contact.sql`，生成并配置 `ADMIN_PASSWORD_HASH` 后重新部署；详细步骤见 `../docs/1.3/ADMIN_RECOVERY.md`。下面的本机命令工具仍保留，适用于已配置本地服务端环境的操作员，不再是必经流程。

1. 用户在调试扩展点击“恢复购买”，系统内部准备恢复，然后自行发邮件至 sumei7550@outlook.com；插件不发自动邮件，不提交邮箱给恢复接口。
2. 管理员人工核实支付归属，不能只看邮箱/交易号/截图。邮件自动带支持序列号；取得该序列号、实际 capture ID，填写不含私人信息的操作备注。
3. 在受信任本机的 website/ 目录使用服务端沙盒配置运行：

```powershell
node --env-file=.env.local --experimental-strip-types scripts/issue-recovery.mjs --support-id TC-INSTALLATION_UUID --capture-id PAYPAL_CAPTURE_ID --ownership-verified --note "Sandbox support case verified"
```

工具再次向 PayPal 核查交易并调用受限 RPC；数据库拒绝过期/退款授权。输出的恢复链接含短期秘密，只手动发给核实后的购买者，不能保存到公共日志或工单截图。

4. 用户打开链接并点击“确认恢复”，再到原申请的插件点击“完成恢复”。单独 GET/邮件预览不会确认。只有拥有该恢复请求本地秘密的插件能兑换；确认后最长 24 小时内可兑换，已兑换的响应丢失可在 1 小时内幂等重取。
5. 新设备激活与撤销旧设备在同一事务内完成；不重置已有 first_activated_at/expires_at。无效/过期链接或授权需人工回复，不能重新开启已退款授权。

付款前填写购买联系邮箱，新订单保存至 `orders.purchase_email`；历史订单无邮箱仍可恢复。邮箱未经验证，不作为购买归属证明，不自动发邮件。上线前必须执行 004 迁移，管理员页面与购买页均依赖该字段。

检查本地配置是否齐全（不输出密钥、不连接外部服务）：

```powershell
node --env-file=.env.local scripts/check-config.mjs
```

## 尚未实现，不得称为完整 1.3

正式收费开关、争议事件/部分退款细分处理、定时对账与失败事件恢复、完整续购规则、确认后的老用户迁移、完整多语言/生产隐私披露、真实 Chrome 和远程支付联调。这些仍按 docs/1.3 计划推进。

当前离线/单设备是沙盒建议默认值，未替用户确认最终权益。体验重复付款转 review，需人工退款流程，目前只实现阻止重复授权，尚未实现自动退款。

## 检查

```powershell
npm test
npm run build
```

测试包含付款校验、调试扩展实际验签函数及 PostgreSQL/WASM 存储过程；本地数据库模拟 Supabase 角色，不能证明远程 RLS/项目配置、多连接竞态或 PayPal 通知正常。执行真实沙盒/退款/并发与故障联调并保留脱敏证据后，才能进入 Live 验证。

部署 Vercel Root Directory 设置为 website，先用隔离的沙盒部署和数据库。部署操作、数据库迁移与真实支付需要明确执行，不会因构建自动完成。

普通问题反馈也自动携带同一支持序列号，只需填写问题描述，不需要点击恢复购买或提供交易信息。序列号是公开定位信息，不具备恢复权限。

## 主插件 1.3 沙盒构建

现在可从仓库根目录执行：

```powershell
node scripts/build-extension.mjs
```

输出 build/extension-sandbox/，加载这个目录验证免费 UI。未配置签名公钥时升级入口保持不可用，不伪造 Pro。主插件已有四种范围、去重与列表权益、后台配额、签名缓存、购买重查/后台有限重试和联系客服/恢复流程。

后端配置好后，从仓库根目录构建实际沙盒联调包：

```powershell
node scripts/build-extension.mjs --api-base https://YOUR-SANDBOX.vercel.app --public-key website/sandbox-public-key.pem
```

构建只复制白名单文件，并在生成包中固定 API 和公钥；网站源码、node_modules、私钥和 .env 不进入扩展包。API 主机为可选权限，在用户主动升级/恢复时申请。最低 Chrome 120。此输出不是上架包。

主插件复制由 MV3 worker 串行授权并分配本地复制许可，剪贴板成功才提交；预览和复制共用 extension/core.mjs，设为 Pro 的功能不能只靠设置页布尔值开启。当前老安装保留策略是待确认建议值，不可直接正式发布。新增范围标签覆盖现有语言，完整计费/客服文案目前优先中英文，其余存在英文回退，发布前补齐。
