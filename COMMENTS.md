# 评论邮件通知

博客是静态站，评论由独立的 Waline 服务端处理。新评论/回复的通知必须由
Waline 服务端发出，前端和博客仓库不参与通知逻辑。

当前使用的是 Waline 内置 SMTP 邮件通知：

- 新评论：通知博主 `AUTHOR_EMAIL`
- 回复评论：通知被回复的评论者（前提是对方填写了邮箱）
- 博主本人使用 `AUTHOR_EMAIL` 评论时，不发送新评论通知

Waline 官方文档：

- [评论通知](https://waline.js.org/guide/features/notification.html)
- [服务端环境变量](https://waline.js.org/reference/server/env.html)

## 0. 重建 Waline 项目

如果当前 Waline 项目因为 `ERR_REQUIRE_ESM` / `@mdit/plugin-emoji` 无法启动，可以
用仓库里的 [waline-server](waline-server/README.md) 重新建一个独立的 Vercel 项目：

- 固定 `@waline/vercel@1.41.1`，避开 1.41.2+ 的 ESM 崩溃；
- 复用现有 LeanCloud 数据库，评论和阅读量保留；
- Vercel 项目 Root Directory 设为 `waline-server`；
- 部署成功后把 [site.config.ts](src/site.config.ts) 的 `waline.server` 换成新域名。

详细步骤见 [waline-server/README.md](waline-server/README.md)。

## 1. 前置条件

- 能访问 Waline 的 Vercel 项目。当前服务地址是
  `https://waline-silk-phi.vercel.app/`，在 Vercel 里找到对应项目即可。
- 一个可用的 QQ 邮箱，并已开启 SMTP 服务。
- 接收通知的邮箱，默认是 `wuyikun@stu.xmu.edu.cn`，可以换成其他邮箱。

先确认 Waline 服务端本身可访问、部署正常。通知依赖服务端运行，服务端不可达时
评论和通知都不会工作。

## 2. 获取 QQ 邮箱授权码

1. 登录 QQ 邮箱网页版。
2. 设置 → 账号 → 开启 `POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV` 服务。
3. 生成 **授权码**。授权码不是 QQ 登录密码，只用于 SMTP。
4. 保存授权码，下一步填入 Vercel。

QQ 邮箱 SMTP 参数（Waline 可通过 `SMTP_SERVICE` 自动使用）：

- 服务：`smtp.qq.com`
- 端口：`465`
- 加密：SSL
- 账号：完整 QQ 邮箱地址
- 密码：授权码

## 3. 配置 Vercel 环境变量

打开 Vercel → Waline 项目 → Settings → Environment Variables，添加以下变量。
建议至少配置到 **Production**；如果 Preview 也要测试，再单独配置 Preview。

| 变量                    | 示例值                          | 说明                                                |
| ----------------------- | ------------------------------- | --------------------------------------------------- |
| `SMTP_SERVICE`          | `QQ`                            | Nodemailer 内置 QQ 服务，自动使用 `smtp.qq.com:465` |
| `SMTP_USER`             | `123456@qq.com`                 | 你的 QQ 邮箱地址                                    |
| `SMTP_PASS`             | `<QQ邮箱授权码>`                | 不是 QQ 登录密码                                    |
| `SMTP_SECURE`           | `true`                          | 465 端口使用 SSL                                    |
| `SENDER_NAME`           | `Core's ink`                    | 邮件里显示的发件人名称                              |
| `SENDER_EMAIL`          | `123456@qq.com`                 | 与 `SMTP_USER` 保持一致，避免 QQ 拒发               |
| `AUTHOR_EMAIL`          | `wuyikun@stu.xmu.edu.cn`        | 接收新评论通知的邮箱                                |
| `SITE_NAME`             | `Core's ink`                    | 邮件模板中的站点名称                                |
| `SITE_URL`              | `https://coooredump.github.io/` | 邮件模板中的站点地址                                |
| `DISABLE_AUTHOR_NOTIFY` | 不设置                          | 不要设置为 `true`，否则关闭博主新评论通知           |

说明：

- `AUTHOR_EMAIL` 必须设置，否则博主不会收到新评论邮件。
- 你在自己的博客评论区留言时，建议也使用 `wuyikun@stu.xmu.edu.cn`。
  如果使用其他邮箱，Waline 可能把这条评论当作访客评论，给自己发通知。
- 如果以后改收件邮箱，只改 `AUTHOR_EMAIL`。
- 如果以后换发件邮箱，`SMTP_USER` 和 `SENDER_EMAIL` 要一起改。
- 不要把授权码写进仓库、文章或截图。

## 4. 可选：中文邮件模板

不配置模板也能用 Waline 默认模板。想要更清楚的中文邮件，可以添加以下变量。
模板保持简短，Vercel 环境变量有 4KB 大小限制。

`MAIL_SUBJECT_ADMIN`：

```text
[Core's ink] 新评论
```

`MAIL_TEMPLATE_ADMIN`：

```html
<div style="font-family: system-ui, sans-serif; line-height: 1.6">
  <p><strong>{{site.name}}</strong> 有新评论</p>
  <p>
    <strong>{{self.nick}}</strong>（{{self.mail}}）在
    <a href="{{site.postUrl}}">{{site.postUrl}}</a> 评论：
  </p>
  <blockquote style="border-left: 3px solid #ddd; margin: 0; padding-left: 12px; color: #333">
    {{self.comment}}
  </blockquote>
  <p>状态：{{self.status}}</p>
</div>
```

`MAIL_SUBJECT`：

```text
[Core's ink] 你的评论收到了回复
```

`MAIL_TEMPLATE`：

```html
<div style="font-family: system-ui, sans-serif; line-height: 1.6">
  <p>{{site.name}} 上有人回复了你的评论：</p>
  <p><strong>{{self.nick}}</strong>：{{self.comment}}</p>
  <p><a href="{{site.postUrl}}">查看完整内容</a></p>
</div>
```

模板变量：

- `site.name`、`site.url`、`site.postUrl`
- `self.nick`、`self.mail`、`self.comment`、`self.status`

如果自定义模板导致报错，先删除 `MAIL_SUBJECT*` / `MAIL_TEMPLATE*`，回退到默认模板，
确认 SMTP 本身正常后再加回来。

## 5. 重新部署

Vercel 的环境变量修改后必须重新部署才生效：

1. 保存环境变量。
2. 打开 Deployments → 最新部署 → Redeploy。
3. 等待部署完成。

注意：Waline 服务端和博客仓库可能是两个独立项目。改博客仓库不会自动重新部署
Waline；必须在这个 Waline 项目里操作。

## 6. 测试清单

1. 打开任意博客文章的评论区。
2. 用一个**不是** `AUTHOR_EMAIL` 的真实邮箱发表测试评论。
3. 检查 `AUTHOR_EMAIL` 收件箱和垃圾箱，应收到新评论邮件。
4. 用第三个邮箱回复这条测试评论，检查第二个邮箱是否收到回复通知。
5. 用 `AUTHOR_EMAIL` 发一条评论，确认自己不会收到自己的新评论通知。
6. 打开 Vercel → Waline 项目 → Logs，检查有没有 SMTP 错误。
7. 删除测试评论（在 Waline 管理端操作）。

验收标准：

- 新评论在 1 分钟内到达 `AUTHOR_EMAIL`。
- 回复评论能使原评论者收到邮件。
- 博主本人评论不触发新评论通知。
- 邮件包含评论者昵称、评论内容、文章链接。
- 仓库中没有出现 QQ 授权码或 SMTP 密码。
- 评论功能本身正常，通知失败不影响评论保存。

## 7. 常见问题

| 现象                           | 排查                                                                                          |
| ------------------------------ | --------------------------------------------------------------------------------------------- |
| 完全收不到邮件                 | 确认 Vercel 已 Redeploy；确认 `AUTHOR_EMAIL` 已设置；确认 `DISABLE_AUTHOR_NOTIFY` 不是 `true` |
| Vercel 日志 `EAUTH` / `535`    | 授权码错误，或 QQ 邮箱 SMTP 服务未开启；重新生成授权码                                        |
| 发件失败 `EENVELOPE`           | `SENDER_EMAIL` 与 `SMTP_USER` 不一致；QQ 要求两者一致                                         |
| 邮件进垃圾箱                   | 把发件 QQ 邮箱加入白名单；检查学校邮箱过滤规则；换收件邮箱测试                                |
| `ETIMEDOUT` 连接 `smtp.qq.com` | Vercel 到 QQ SMTP 的出网受限；改用 Resend/SendGrid/域名 SMTP                                  |
| QQ 发信频率超限                | 个人博客一般不会触发；量大时换事务邮件服务                                                    |
| 回复没有通知                   | 原评论者没有填写邮箱、邮箱无效，或父评论没有邮箱；这是 Waline 的限制                          |
| 博主自己评论也收到通知         | 评论时使用的邮箱和 `AUTHOR_EMAIL` 不一致；用 `AUTHOR_EMAIL` 评论，或改 `AUTHOR_EMAIL`         |
| 开了评论审核                   | 通知通常仍会发送，邮件里的 `{{self.status}}` 会显示状态；以实际测试为准                       |
| 改了环境变量没效果             | 必须重新部署；Preview 和 Production 要分别配置                                                |
| Waline 域名访问超时            | 先确认 Waline 的 Vercel 部署和域名可访问；服务端不可达时先修服务端                            |

## 8. 关闭通知

在 Vercel 中移除 `AUTHOR_EMAIL`，或设置：

```text
DISABLE_AUTHOR_NOTIFY=true
```

然后重新部署。评论功能不受影响。

## 9. 备用 SMTP

如果 QQ SMTP 在 Vercel 上不稳定，可以换成事务邮件服务。变量名不变，只改
SMTP 配置和发件地址：

| 服务     | 关键变量                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------- |
| Resend   | `SMTP_SERVICE=Resend`、`SMTP_USER=resend`、`SMTP_PASS=<API Key>`、`SENDER_EMAIL=<已验证发件地址>` |
| SendGrid | `SMTP_SERVICE=SendGrid`、`SMTP_USER=apikey`、`SMTP_PASS=<API Key>`                                |
| 域名邮箱 | `SMTP_HOST`、`SMTP_PORT`、`SMTP_SECURE`、`SMTP_USER`、`SMTP_PASS`                                 |

如果使用自定义 SMTP：

```text
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=no-reply@example.com
SMTP_PASS=<SMTP密码>
SENDER_EMAIL=no-reply@example.com
```

## 10. 安全与隐私

- QQ 授权码只放在 Vercel 环境变量中，不提交到 Git。
- 如果授权码泄露，立即在 QQ 邮箱撤销并重新生成，再更新 Vercel。
- 邮件包含评论者昵称、邮箱和评论内容；只有你/被回复者能收到。
- 评论通知失败不会阻止评论保存；具体错误看 Vercel Functions 日志。
- 如果以后需要多个渠道（飞书、企业微信、Telegram），Waline 支持同时配置；
  当前方案只启用邮件。
