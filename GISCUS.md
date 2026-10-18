# Giscus 评论系统

博客评论区现在使用 [Giscus](https://giscus.app/)，评论存储在 GitHub Discussions 中。

- 不需要 Vercel、数据库或服务器
- 访客使用 GitHub 账号登录后评论
- 评论通知走 GitHub 通知（可发到邮箱）

## 1. 开启 GitHub Discussions

打开博客仓库：

```text
https://github.com/coooredump/coooredump.github.io
```

Settings → General → Features → 勾选 **Discussions**。

## 2. 安装 Giscus App

打开：

```text
https://github.com/apps/giscus
```

点击 Install → 选择 `coooredump/coooredump.github.io`。

## 3. 选择讨论分类

当前仓库使用 GitHub 默认的 `Announcements` 分类，已有 discussion 也在这个分类里。

**Giscus 的 `category` 名称必须和 GitHub 实际分类完全一致，`categoryId` 也必须
是同一个分类的 ID。**

如果名称和 ID 对不上，Giscus API 会返回 `404 Discussion not found`，页面表现就是：

- 评论区能打开
- 但列表显示 0 条
- 登录后仍然看不到已有评论

如果你新建一个 `Comments` 分类，必须同时更新 `giscus.category` 和
`giscus.categoryId`；否则就用现有的 `Announcements`，不要只改名字。

## 4. 填写 repoId / categoryId

打开：

```text
https://giscus.app
```

按页面填写：

- Repository：`coooredump/coooredump.github.io`
- Discussion category：`Announcements`
- Mapping：`pathname`
- 其他保持默认即可

页面底部生成的 `<script>` 里会有：

```html
data-repo-id="R_..." data-category-id="DIC_..."
```

把这两个值填入 [site.config.ts](src/site.config.ts)：

```ts
giscus: {
  enable: true,
  repo: 'coooredump/coooredump.github.io',
  repoId: 'R_kgDOQ1i9Sw', // 已填；以 giscus.app 生成的值为准
  category: 'Announcements',
  categoryId: 'DIC_kwDOQ1i9S84DI2sy', // 必须是 Announcements 分类的 ID
  mapping: 'pathname',
  strict: '0',
  reactionsEnabled: '1',
  inputPosition: 'bottom',
  theme: 'preferred_color_scheme',
  lang: 'zh-CN'
}
```

`categoryId` 为空时，开发环境会显示提示，生产环境不渲染评论区。

## 5. 部署并测试

```bash
npm run build
npm run preview
```

打开任意文章，确认：

- 评论区出现 Giscus iframe
- GitHub 登录后可以发评论
- 评论出现在仓库 Discussions 的 `Announcements` 分类
- 回复、reaction 正常
- 切换站点明暗主题时 iframe 跟随

## 6. 收到评论通知

Giscus 没有自己的邮件服务器，通知走 GitHub：

1. 仓库页面 → Watch → Custom
2. 勾选 **Discussions**
3. 确认 GitHub 账号的 notification email 可用

这样有人新建讨论/回复时，GitHub 会给你发通知。访客也可以在自己的
GitHub 通知里看到回复。

注意：Giscus 不收集访客邮箱，也不会给未登录 GitHub 的人发邮件。

## 7. 迁移旧 Waline 评论

Giscus 不能直接读取 LeanCloud。迁移步骤是：

```text
LeanCloud Comment 表 → JSON 导出 → 脚本写入 GitHub Discussions
```

迁移后的评论会以“当前 GitHub token 所有者”的身份出现，原评论者昵称和日期保留在
正文里；邮箱不会迁移，也不会给原评论者发通知。

### 7.1 从 LeanCloud 导出

LeanCloud 控制台 → 数据存储 → 结构化数据 → `Comment` → 导出 → JSON。

保存为仓库根目录的：

```text
waline-comments.json
```

这个文件已在 `.gitignore` 中忽略，不要提交（里面包含评论者邮箱等隐私数据）。

### 7.2 准备 GitHub Token

创建一个有 Discussions 写权限的 token：

- Fine-grained token：Repository `coooredump/coooredump.github.io`，
  `Discussions: Read and write`，`Contents: Read`
- 或 classic token：勾选 `repo` 和 `write:discussion`

迁移完成后建议撤销 token。

### 7.3 先 dry run

```bash
GITHUB_TOKEN=github_pat_xxx \
GITHUB_REPO=coooredump/coooredump.github.io \
GISCUS_CATEGORY_ID=DIC_xxx \
node scripts/migrate-waline-to-giscus.mjs waline-comments.json
```

默认只读，会打印：

- 评论总数、页面数
- 将创建哪些讨论
- 每条评论会迁到哪个页面
- 哪些评论已有迁移标记、会跳过

### 7.4 正式写入

确认 dry run 没问题后：

```bash
GITHUB_TOKEN=github_pat_xxx \
GITHUB_REPO=coooredump/coooredump.github.io \
GISCUS_CATEGORY_ID=DIC_xxx \
node scripts/migrate-waline-to-giscus.mjs waline-comments.json --apply
```

脚本会：

- 按页面路径创建一个 Discussion，标题为 `Comments · /blog/...`
- 每条旧评论创建一个 GitHub comment
- 保留原昵称、日期、内容和回复关系
- 用 `<!-- waline:objectId -->` 标记已迁移，重复执行不会重复写入
- 跳过 `status: spam` 的评论

迁移完成后，Giscus 会根据 `pathname` 找到对应的 Discussion。

### 7.5 验证

1. 打开文章页，确认 Giscus 显示迁移后的讨论。
2. 在 GitHub Discussions 里检查评论内容、昵称、日期。
3. 发一条新评论，确认 Giscus 正常创建/追加。
4. 确认通知邮件。

如果 Giscus 找不到迁移的讨论，检查：

- Discussion 标题是否包含页面完整 `pathname`（带不带末尾 `/`）
- `giscus.mapping` 是否为 `pathname`
- `categoryId` 是否对应 `Announcements` 分类

## 8. 备份与清理

本仓库已经移除 Waline 服务端和客户端，不再提供 Waline 回滚开关。

迁移前请先备份 LeanCloud 的 `Comment` 表（导出 JSON 即可）。确认 Giscus 的
discussion、评论、通知都正常后，再处理旧服务：

- 旧 Vercel 项目确认无用后，在 Vercel 控制台删除。
- LeanCloud 数据确认备份完成后再决定是否清空；迁移脚本不会删除原数据。

## 9. 已知限制

- 访客必须有 GitHub 账号，不能匿名评论。
- 旧评论无法保留原 GitHub 身份，只能保留昵称和日期。
- 迁移脚本不会给原评论者发邮件通知；他们需要之后参与 GitHub 讨论。
- Giscus 不提供浏览量统计；原来的 Waline 浏览量/评论数显示已移除。
- GitHub Discussions 的搜索/标题匹配对末尾 `/` 敏感；如果某篇文章找不到讨论，
  检查标题与 `pathname` 是否完全包含。
