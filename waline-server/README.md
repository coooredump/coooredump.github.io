# Waline server

这是博客评论区的 Waline 服务端，单独作为一个 Vercel 项目部署。

- 固定使用 `@waline/vercel@1.41.1`
- 复用现有 LeanCloud 数据库，评论和阅读量保留
- 只提供 Waline API/管理端，不包含博客前端

## 为什么固定 1.41.1

`@waline/vercel` 从 1.41.2 开始依赖的 `@mdit/plugin-*` 变成 ES Module，但服务端
仍用 CommonJS 的 `require()` 加载，Vercel 上会出现：

```text
ERR_REQUIRE_ESM
require() of ES Module @mdit/plugin-emoji / @mdit/plugin-katex ...
```

`1.41.1` 是官方 issue 确认可用的最后一个版本。**在官方修复前不要升级这个依赖。**

相关 issue：

- <https://github.com/walinejs/waline/issues/3736>
- <https://github.com/walinejs/waline/issues/3706>

## 部署步骤

### 1. 提交代码

`waline-server/` 已经包含：

```text
package.json
package-lock.json
index.cjs
vercel.json
.env.example
```

把整个目录提交到博客仓库即可。`package-lock.json` 也要一起提交，确保 Vercel 安装
的是同一组依赖（尤其是 1.41.1 这一版）。

### 2. 新建 Vercel 项目

Vercel → Add New → Project → 选择博客仓库：

- **Root Directory**：`waline-server`
- **Framework Preset**：Other
- **Node.js Version**：22.x（或项目默认的 20+）
- Build Command / Output Directory 保持默认

`waline-server/vercel.json` 会把所有请求转发到 `index.cjs`。

### 3. 配置环境变量

在 Vercel 项目 → Settings → Environment Variables 添加。**至少选 Production**；
如果要测试 Preview，也选 Preview。

LeanCloud 变量从旧 Waline 项目原样复制：

```dotenv
LEAN_ID=
LEAN_KEY=
LEAN_MASTER_KEY=
```

如果旧项目有 `LEAN_SERVER`，或者 LeanCloud 国际版/自建环境要求，也一起复制。

站点和通知：

```dotenv
SITE_NAME=Core's ink
SITE_URL=https://wu-yikun.com/
AUTHOR_EMAIL=wuyikun@stu.xmu.edu.cn
```

QQ SMTP：

```dotenv
SMTP_SERVICE=QQ
SMTP_USER=<你的QQ邮箱>
SMTP_PASS=<QQ邮箱授权码>
SMTP_SECURE=true
SENDER_NAME=Core's ink
SENDER_EMAIL=<你的QQ邮箱>
```

完整说明和可选模板见仓库根目录的 [COMMENTS.md](../COMMENTS.md)。

### 4. 部署并验证服务端

部署完成后，Vercel 会给出一个新的生产域名，例如：

```text
https://waline-xxxx.vercel.app
```

先访问：

```text
https://<新域名>/api/comment?type=recent&count=1
```

- 返回 JSON：服务端正常启动。
- 返回 500：看 Vercel Functions 日志；确认 `LEAN_*` 变量和 Node 版本。
- 不要用带 hash 的 deployment URL 作为正式地址。

### 5. 登录管理端

打开：

```text
https://<新域名>/ui/login
```

如果这个 LeanCloud 数据库里还没有管理员，用 `/ui/register` 注册第一个管理员。
因为复用了同一个 LeanCloud app，旧评论应该会直接出现。

### 6. 切换博客配置

确认新服务端能读到旧评论后，修改：

```ts
// src/site.config.ts
waline: {
  server: 'https://<新域名>/'
}
```

然后重新构建/部署博客：

```bash
npm run build
```

本地验证：

```bash
npm run preview
```

打开文章页，确认评论列表、发评论、阅读量都正常。

### 7. 测试

- 旧评论是否还在（同一个 LeanCloud app）
- 新评论是否能提交
- 管理端是否能审核/删除
- 新评论邮件是否到达 `AUTHOR_EMAIL`
- 回复评论时，原评论者是否收到邮件

## 注意事项

- **不要改 LeanCloud app**，否则会看不到旧评论。要保留评论就复用同一组
  `LEAN_ID` / `LEAN_KEY` / `LEAN_MASTER_KEY`。
- 如果旧项目有 `LEAN_SERVER`、`SECURE_DOMAINS`，一起复制。`SECURE_DOMAINS`
  建议同时包含 `wu-yikun.com` 和 `coooredump.github.io`，否则某些域名下可能提交
  失败。
- 如果 LeanCloud 配了 IP 白名单/安全域名，新 Vercel 项目的函数出口 IP 可能不同，
  需要在 LeanCloud 控制台放行；否则会出现 401/403。
- 不要使用 `waline-<hash>-...vercel.app` 这种部署 URL 作为网站配置；用项目的
  生产域名。
- Vercel 环境变量改完必须 Redeploy。
- 如果以后升级 `@waline/vercel`，先看官方 issue；升级到 1.41.2+ 需要在
  `vercel.json` 里加 `NODE_OPTIONS=--experimental-require-module`，或者继续固定在
  1.41.1。
- 旧 Waline 项目先不要删除。等新项目的评论、管理端、邮件都验证通过，再切换域名
  或删除旧项目。
- 如果 `SITE_URL` 使用自定义域名，邮件里的文章链接会跟随它；评论本身按文章
  `path` 归属，不受域名切换影响。
