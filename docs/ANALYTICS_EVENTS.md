# Mixpanel 埋点事件表

更新时间：2026-11-16

项目：Mixpanel project `4083983`

本文将扩展与网站的事件分开命名，方便在同一 Mixpanel 项目中筛选各端数据。

## 命名和公共字段

| 规则 | 约定 |
|---|---|
| Chrome 扩展事件 | `ext_` + 小写 snake_case，例如 `ext_popup_opened` |
| 网站事件 | `web_` + 小写 snake_case，例如 `web_page_viewed` |
| 公共事件属性 | `distinct_id`、`time`、`$insert_id`、`extension_version`（扩展事件）、`ui_language`、`$os` |
| 地理位置 | 扩展请求使用 `ip=1`，由 Mixpanel 根据请求 IP 推断国家/地区；IP 不作为自定义事件属性发送 |
| 隐私边界 | 不发送标签标题、URL、页面内容、筛选输入文本、姓名、邮箱或其他页面表单内容 |

扩展使用设备上的随机 ID；网站应先使用网站自己的匿名 ID。若将来要跨扩展和网站关联用户，需另行设计并披露身份关联方式，不要直接复用不同端的 ID。

## Chrome 扩展事件（当前实现）

| Mixpanel 事件名 | 触发时机 | 事件属性 | 状态 |
|---|---|---|---|
| `ext_popup_opened` | 打开扩展弹窗 | `eligible_tab_count`、`format`、Markdown 时的 `markdown_style`、`all_windows` | 已接入 |
| `ext_all_windows_toggled` | 切换“所有窗口” | `all_windows`、`surface` | 已接入 |
| `ext_format_changed` | 更改输出格式 | `format`、`surface` | 已接入 |
| `ext_markdown_style_changed` | 更改 Markdown 列表样式 | `markdown_style`（`bullet` / `ordered` / `task`）、`surface` | 已接入 |
| `ext_tab_selection_changed` | 勾选或取消勾选单个标签 | `is_selected`、`selected_count`、`eligible_tab_count`、`surface` | 已接入 |
| `ext_tab_selection_bulk_changed` | 全选或取消全选 | `action`（`select_all` / `deselect_all`）、`selected_count`、`eligible_tab_count`、`visible_tab_count`、`filter_active`、`surface` | 已接入 |
| `ext_preview_refresh_clicked` | 点击预览区刷新 | `selected_count`、`format`、Markdown 时的 `markdown_style`、`surface` | 已接入 |
| `ext_tabs_copied` | 尝试复制所选标签 | `format`、Markdown 时的 `markdown_style`、`selected_count`、`eligible_tab_count`、`all_windows`、`filter_active`、`success` | 已接入 |
| `ext_copy_blocked` | 未选标签时点击复制 | `reason`、`format` | 已接入 |
| `ext_coffee_link_clicked` | 点击 Buy me a coffee | `destination`（`ko-fi`）、`surface` | 已接入 |
| `ext_settings_opened` | 打开设置页 | 无额外属性 | 已接入 |
| `ext_settings_saved` | 修改设置 | `format`、`all_windows`、`exclude_pinned`、`remove_duplicates`、`remove_tracking` | 已接入 |

公共字段由 `analytics.js` 自动加入。`token` 是 Mixpanel 上报所需字段，不会显示为业务分析属性。`$os` 显式提供操作系统；国家和地区来自 Mixpanel 的 IP 地理推断。

## 网站事件（接入建议）

网站表是后续接入时的建议事件契约，目前**尚未接入或发送**。仅保留能回答产品和安装转化问题的事件。

| 建议 Mixpanel 事件名 | 触发时机 | 建议事件属性 | 优先级 |
|---|---|---|---|
| `web_page_viewed` | 访问网站页面 | `page_path`、`page_type`、`locale`、`referrer_domain` | P1 |
| `web_store_cta_clicked` | 点击 Chrome Web Store 安装按钮 | `page_path`、`locale`、`cta_location` | P1 |
| `web_extension_feature_viewed` | 查看扩展功能区（仅需要可靠可见性检测时） | `page_path`、`feature_name`、`locale` | P2 |
| `web_privacy_link_clicked` | 点击隐私政策链接 | `page_path`、`locale` | P2 |
| `web_outbound_link_clicked` | 点击其他外部链接 | `page_path`、`destination_domain`、`link_type` | P2 |

网站端不要发送完整 URL 查询参数、输入框原文、表单字段或个人身份信息。`referrer_domain` 和 `destination_domain` 只保留域名，避免把含有令牌、搜索内容或个人信息的路径及参数带入分析数据。

## 实现位置

- 事件发送及公共字段：[`analytics.js`](../analytics.js)
- 扩展弹窗事件：[`popup.js`](../popup.js)
- 扩展设置页事件：[`options.js`](../options.js)
- 隐私披露：[`privacy.html`](../privacy.html)
