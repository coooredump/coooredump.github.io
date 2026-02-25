---
title: Tips for precise search on GitHub
description: GitHub 上有很多优秀的开源项目与学习资料，如何通过这些资源来抹平你的信息不对称呢？那么你就应该明白我们要如何搜索 GitHub，以下为大家带来精准搜索 GitHub 的神仙技巧。
publishDate: 2021-10-05
tags: [生产力工具]
heroImage: { src: ../_img/202501222159950.png }
language: Chinese
comment: true
draft: false
---

## 1. 普通的搜索📚

相信一般人搜索项目时，都是直接搜索技术栈相关的项目。

高级一点的搜索，会根据 **Best match**、**Most starts** ... 来进行排序、选择相应的**语言**、选择**仓库或者代码**来进行筛选。

![](https://cdn.jsdelivr.net/gh/Wu-yikun/OSS/PicGo/202311141824550.png)

但是 GitHub 的搜索功能只支持以上这些而已吗 ？

No！

如果你只会用以上的功能，那你知道的仅仅是 GitHub 搜索的冰山一角！

GitHub 的搜索是非常强大的！下面介绍更高级的搜索技巧！

## 2. 搜索语法📚

搜索 GitHub 时，你可以构建匹配特定数字和单词的查询。

### 2.1 查询大于或小于另一个值的值

你可以使用 `>`、`>=`、`<` 和 `<=` 搜索大于、大于等于、小于以及小于等于另一个值的值。

| 查询  | 示例                                                         |
| ----- | ------------------------------------------------------------ |
| `>n`  | **[cats vue:>1000](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Futf8%3D%E2%9C%93%26q%3Dvue%2Bstars%3A%3E1000%26type%3DRepositories)** 匹配含有 "vue" 字样、星标超过 1000 个的仓库。 |
| `>=n` | **[vue topics:>=5](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Futf8%3D%E2%9C%93%26q%3Dvue%2Btopics%3A%3E%3D5%26type%3DRepositories)** 匹配含有 "vue" 字样、有 5 个或更多主题的仓库。 |
| `<n`  | **[vue size:<10000](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Futf8%3D%E2%9C%93%26q%3Dvue%2Bsize%3A%3C10000%26type%3DCode)** 匹配小于 10 KB 的文件中含有 "vue" 字样的代码。 |
| `<=n` | **[vue stars:<=50](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Futf8%3D%E2%9C%93%26q%3Dvue%2Bstars%3A%3C%3D50%26type%3DRepositories)** 匹配含有 "vue" 字样、星标不超过 50 个的仓库。 |

你还可以使用**范围查询**：搜索大于等于或小于等于另一个值的值。

| 查询   | 示例                                                         |
| ------ | ------------------------------------------------------------ |
| `n..*` | **[vue stars:10..\*](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Futf8%3D%E2%9C%93%26q%3Dvue%2Bstars%3A10..\*%26type%3DRepositories)** 等同于 `stars:>=10` 并匹配含有 "vue" 字样、有 10 个或更多星号的仓库。 |
| `*..n` | **[vue stars:\*..10](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Futf8%3D%E2%9C%93%26q%3Dvue%2Bstars%3A%22\*..10%22%26type%3DRepositories)** 等同于 `stars:<=10` 并匹配含有 "vue" 字样、有不超过 10 个星号的仓库。 |

### 2.2 查询范围之间的值

你可以使用范围语法 `n..n` 搜索范围内的值，其中第一个数字 *n* 是最小值，而第二个 *n* 是最大值。

| 查询   | 示例                                                         |
| ------ | ------------------------------------------------------------ |
| `n..n` | **[vue stars:10..50](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Futf8%3D%E2%9C%93%26q%3Dcats%2Bstars%3A10..50%26type%3DRepositories)** 匹配含有 "vue" 字样、有 10 到 50 个星号的仓库。 |

### 2.3 查询日期

你可以通过使用 `>`、`>=`、`<`、`<=` 和 范围查询 搜索早于或晚于另一个日期，或者位于日期范围内的日期。

日期格式必须遵循 [ISO8601](https://link.juejin.cn?target=http%3A%2F%2Fen.wikipedia.org%2Fwiki%2FISO_8601) 标准，即 `YYYY-MM-DD`（年-月-日）。

| 查询                     | 示例                                                         |
| ------------------------ | ------------------------------------------------------------ |
| `>YYYY-MM-DD`            | **[vue created:>2016-04-29](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Futf8%3D%E2%9C%93%26q%3Dvue%2Bcreated%3A%3E2016-04-29%26type%3DIssues)** 匹配含有 "vue" 字样、在 2016 年 4 月 29 日之后创建的议题。 |
| `>=YYYY-MM-DD`           | **[vue created:>=2017-04-01](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Futf8%3D%E2%9C%93%26q%3Dvue%2Bcreated%3A%3E%3D2017-04-01%26type%3DIssues)** 匹配含有 "vue" 字样、在 2017 年 4 月 1 日或之后创建的议题。 |
| `<YYYY-MM-DD`            | **[vue pushed:<2012-07-05](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Fq%3Dvue%2Bpushed%3A%3C2012-07-05%26type%3DCode%26utf8%3D%E2%9C%93)** 匹配在 2012 年 7 月 5 日之前推送的仓库中含有 "vue" 字样的代码。 |
| `<=YYYY-MM-DD`           | **[vue created:<=2012-07-04](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Futf8%3D%E2%9C%93%26q%3Dvue%2Bcreated%3A%3C%3D2012-07-04%26type%3DIssues)** 匹配含有 "vue" 字样、在 2012 年 7 月 4 日或之前创建的议题。 |
| `YYYY-MM-DD..YYYY-MM-DD` | **[vue pushed:2016-04-30..2016-07-04](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Futf8%3D%E2%9C%93%26q%3Dvue%2Bpushed%3A2016-04-30..2016-07-04%26type%3DRepositories)** 匹配含有 "vue" 字样、在 2016 年 4 月末到 7 月之间推送的仓库。 |
| `YYYY-MM-DD..*`          | **[vue created:2012-04-30..\*](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Futf8%3D%E2%9C%93%26q%3Dvue%2Bcreated%3A2012-04-30..\*%26type%3DIssues)** 匹配在 2012 年 4 月 30 日之后创建、含有 "vue" 字样的议题。 |
| `*..YYYY-MM-DD`          | **[vue created:\*..2012-04-30](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Futf8%3D%E2%9C%93%26q%3Dvue%2Bcreated%3A\*..2012-07-04%26type%3DIssues)** 匹配在 2012 年 7 月 4 日之前创建、含有 "vue" 字样的议题。 |

你也可以在日期后添加可选的时间信息 `THH:MM:SS+00:00`，以便按小时、分钟和秒进行搜索。 这是 `T`，随后是 `HH:MM:SS`（时-分-秒）和 UTC 偏移 (`+00:00`)。

| 查询                        | 示例                                                         |
| --------------------------- | ------------------------------------------------------------ |
| `YYYY-MM-DDTHH:MM:SS+00:00` | **[vue created:2017-01-01T01:00:00+07:00..2017-03-01T15:30:15+07:00](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Futf8%3D%E2%9C%93%26q%3Dvue%2Bcreated%3A2017-01-01T01%3A00%3A00%2B07%3A00..2017-03-01T15%3A30%3A15%2B07%3A00%26type%3DIssues)** 匹配在 2017 年 1 月 1 日凌晨 1 点（UTC 偏移为 `07:00`）与 2017 年 3 月 1 日下午 3 点（UTC 偏移为 `07:00`）之间创建的议题。 UTC 偏移量 `07:00`，2017 年 3 月 1 日下午 3 点。 UTC 偏移量 `07:00`。 |
| `YYYY-MM-DDTHH:MM:SSZ`      | **[vue created:2016-03-21T14:11:00Z..2016-04-07T20:45:00Z](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Futf8%3D%E2%9C%93%26q%3Dvue%2Bcreated%3A2016-03-21T14%3A11%3A00Z..2016-04-07T20%3A45%3A00Z%26type%3DIssues)** 匹配在 2016 年 3 月 21 日下午 2:11 与 2016 年 4 月 7 日晚上 8:45 之间创建的议题。 |

### 2.4 排除特定结果

你可以使用 `NOT` 语法排除包含特定字词的结果。 `NOT` 运算符只能用于字符串关键词， 不适用于数字或日期。

| 查询  | 示例                                                         |
| ----- | ------------------------------------------------------------ |
| `NOT` | **[hello NOT world](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Fq%3Dhello%2BNOT%2Bworld%26type%3DRepositories)** 匹配含有 "hello" 字样但不含有 "world" 字样的仓库。 |

缩小搜索结果范围的另一种途径是排除特定的子集。 你可以为任何搜索限定符添加 `-` 前缀，以排除该限定符匹配的所有结果。

| 查询         | 示例                                                         |
| ------------ | ------------------------------------------------------------ |
| `-QUALIFIER` | **[vue stars:>10 -language:javascript](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Fq%3Dvue%2Bstars%3A%3E10%2B-language%3Ajavascript%26type%3DRepositories)** 匹配含有 "vue" 字样、有超过 10 个星号但并非以 JavaScript 编写的仓库。 |
|              | **[mentions:Wu-Yikun -org:github](https://github.com/search?q=mentions%3AWu-Yikun+-org%3Agithub&type=Issues)** 匹配提及 @Wu-Yikun 且不在 GitHub 组织仓库中的议题 |

### 2.5 对带有空格的查询使用引号

如果搜索含有空格的查询，你需要用引号将其括起来。 例如：

- [vue cats NOT "hello world"](https://github.com/search?q=vue+cats+NOT+%22hello+world%22&type=Repositories) 匹配含有 "vue" 字样但不含有 "hello world" 字样的仓库。
- [build label:"bug fix"](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Futf8%3D%E2%9C%93%26q%3Dbuild%2Blabel%3A%22bug%2Bfix%22%26type%3DIssues) 匹配具有标签 "bug fix"、含有 "build" 字样的议题。

**某些非字母数字符号（例如空格）会从引号内的代码搜索查询中删除，因此结果可能出乎意料。**

### 2.6 使用用户名的查询

如果搜索查询包含需要用户名的限定符，例如 `user`、`actor` 或 `assignee`，你可以使用任何 GitHub 用户名指定特定人员，或使用 `@me` 指定当前用户。

| 查询                 | 示例                                                         |
| -------------------- | ------------------------------------------------------------ |
| `QUALIFIER:USERNAME` | [`author:biaochenxuying`](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Fq%3Dauthor%3Anat%26type%3DCommits) 匹配 @biaochenxuying 创作的提交。 |
| `QUALIFIER:@me`      | [`is:issue assignee:@me`](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Fq%3Dis%3Aissue%2Bassignee%3A%40me%26type%3DIssues) 匹配已分配给结果查看者的议题 |

`@me` 只能与限定符一起使用，而不能用作搜索词，例如 `@me main.workflow`。

## 3. 高级的搜索📚

### 3.1 按仓库名称、说明或自述文件内容搜索

通过 `in` 限定符，你可以将搜索限制为仓库名称、仓库说明、自述文件内容或这些的任意组合。

如果省略此限定符，则只搜索仓库名称和说明。

| 限定符            | 示例                                                         |
| ----------------- | ------------------------------------------------------------ |
| `in:name`         | [**jquery in:name**](https://github.com/search?q=jquery+in%3Aname&type=Repositories) 匹配其名称中含有 "jquery" 的仓库。 |
| `in:description`  | [**vue in:name,description**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Fq%3Dvue%2Bin%3Aname%2Cdescription%26type%3DRepositories) 匹配其名称或说明中含有 "vue" 的仓库。 |
| `in:readme`       | [**vue in:readme**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Fq%3Dvue%2Bin%3Areadme%26type%3DRepositories) 匹配其自述文件中提及 "vue" 的仓库。 |
| `repo:owner/name` | [**repo:biaochenxuying/blog**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Fq%3Drepo%3Abiaochenxuying%2Fblog) 匹配特定仓库名称，比如：用户为 biaochenxuying 的 blog 项目。 |

### 3.2 在用户或组织的仓库内搜索

要在 `特定用户或组织` 拥有的所有仓库中搜索，你可以使用 `user` 或 `org` 限定符。

| 限定符          | 示例                                                         |
| --------------- | ------------------------------------------------------------ |
| `user:USERNAME` | [**user:biaochenxuying forks:>=100**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Fq%3Duser%3Abiaochenxuying%2Bforks%3A%3E%3D100%26type%3DRepositories) 匹配来自 @biaochenxuying、拥有超过 100 fork 的仓库。 |
| `org:ORGNAME`   | [**org:github**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Futf8%3D%E2%9C%93%26q%3Dorg%3Agithub%26type%3DRepositories) 匹配来自 GitHub 的仓库。 |

### 3.3 按仓库大小搜索

`size` 限定符使用 [大于、小于和范围限定符](https://link.juejin.cn?target=https%3A%2F%2Fdocs.github.com%2Fcn%2Ffree-pro-team%40latest%2Farticles%2Funderstanding-the-search-syntax) 查找匹配特定大小（以千字节为单位）的仓库。

| 限定符   | 示例                                                         |
| -------- | ------------------------------------------------------------ |
| `size:n` | [**size:1000**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Fq%3Dsize%3A1000%26type%3DRepositories) 匹配恰好为 1 MB 的仓库。 |
|          | [**size:>=30000**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Fq%3Dsize%3A%3E%3D30000%26type%3DRepositories) 匹配至少为 30 MB 的仓库。 |
|          | [**size:<50**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Fq%3Dsize%3A%3C50%26type%3DRepositories) 匹配小于 50 KB 的仓库。 |
|          | [**size:50..120**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Fq%3Dsize%3A50..120%26type%3DRepositories) 匹配介于 50 KB 与 120 KB 之间的仓库。 |

### 3.4 按 followers 搜索

你可以使用 `followers` 限定符以及[大于、小于和范围限定符](https://link.juejin.cn?target=https%3A%2F%2Fdocs.github.com%2Fcn%2Ffree-pro-team%40latest%2Farticles%2Funderstanding-the-search-syntax)基于仓库拥有的关注者数量过滤仓库。

| 限定符        | 示例                                                         |
| ------------- | ------------------------------------------------------------ |
| `followers:n` | [**node followers:>=10000**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Fq%3Dnode%2Bfollowers%3A%3E%3D10000) 匹配有 10,000 或更多关注者提及文字 "node" 的仓库。 |
|               | [**styleguide linter followers:1..10**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Fq%3Dstyleguide%2Blinter%2Bfollowers%3A1..10%26type%3DRepositories) 匹配拥有 1 到 10 个关注者并且提及 "styleguide linter" 一词的的仓库。 |

### 3.5 按 forks 搜索

`forks` 限定符使用[大于、小于和范围限定符](https://link.juejin.cn?target=https%3A%2F%2Fdocs.github.com%2Fcn%2Ffree-pro-team%40latest%2Farticles%2Funderstanding-the-search-syntax)指定仓库应具有的复刻数量。

| 限定符    | 示例                                                         |
| --------- | ------------------------------------------------------------ |
| `forks:n` | [**forks:5**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Fq%3Dforks%3A5%26type%3DRepositories) 匹配只有 5 个复刻的仓库。 |
|           | [**forks:>=205**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Fq%3Dforks%3A%3E%3D205%26type%3DRepositories) 匹配具有至少 205 个复刻的仓库。 |
|           | [**forks:<90**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Fq%3Dforks%3A%3C90%26type%3DRepositories) 匹配具有少于 90 个复刻的仓库。 |
|           | [**forks:10..20**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Fq%3Dforks%3A10..20%26type%3DRepositories) 匹配具有 10 到 20 个复刻的仓库。 |

### 3.6 按 stars 数量搜索

你可以使用 [大于、小于和范围限定符](https://link.juejin.cn?target=https%3A%2F%2Fdocs.github.com%2Fcn%2Ffree-pro-team%40latest%2Farticles%2Funderstanding-the-search-syntax) 基于仓库具有的 [星标](https://link.juejin.cn?target=https%3A%2F%2Fdocs.github.com%2Fcn%2Ffree-pro-team%40latest%2Farticles%2Fsaving-repositories-with-stars) 数量搜索仓库

| 限定符    | 示例                                                         |
| --------- | ------------------------------------------------------------ |
| `stars:n` | [**stars:500**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Futf8%3D%E2%9C%93%26q%3Dstars%3A500%26type%3DRepositories) 匹配恰好具有 500 个星号的仓库。 |
|           | [**stars:10..20**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Fq%3Dstars%3A10..20%2Bsize%3A%3C1000%26type%3DRepositories) 匹配具有 10 到 20 个星号、小于 1000 KB 的仓库。 |
|           | [**stars:>=500 fork:true language:vue**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Fq%3Dstars%3A%3E%3D500%2Bfork%3Atrue%2Blanguage%3Avue%26type%3DRepositories) 匹配具有至少 500 个星号，包括复刻的星号（以 vue 编写）的仓库。 |

### 3.7 按仓库创建或上次更新时间搜索

你可以基于创建时间或上次更新时间过滤仓库。

- 对于**仓库创建的时间**，你可以使用 `created` 限定符；
- 要了解**仓库上次更新的时间**，你要使用 `pushed` 限定符。 `pushed` 限定符将返回仓库列表，按仓库中任意分支上最近进行的提交排序。

两者均采用日期作为参数。 日期格式必须遵循 ISO8601 标准，即 `YYYY-MM-DD`（年-月-日）。

也可以在日期后添加可选的时间信息 `THH:MM:SS+00:00`，以便按小时、分钟和秒进行搜索。 这是 `T`，随后是 `HH:MM:SS`（时-分-秒）和 UTC 偏移 (`+00:00`)。

日期支持 `大于、小于和范围限定符`。

| 限定符               | 示例                                                         |
| -------------------- | ------------------------------------------------------------ |
| `created:YYYY-MM-DD` | [**vue created:<2020-01-01**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Fq%3Dvue%2Bcreated%3A%3C2020-01-01%26type%3DRepositories) 匹配具有 "vue" 字样、在 2020 年之前创建的仓库。 |
| `pushed:YYYY-MM-DD`  | [**css pushed:>2020-02-01**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Futf8%3D%E2%9C%93%26q%3Dcss%2Bpushed%3A%3E2020-02-01%26type%3DRepositories) 匹配具有 "css" 字样、在 2020 年 1 月之后收到推送的仓库。 |
|                      | [**vue pushed:>=2020-03-06 fork:only**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Fq%3Dvue%2Bpushed%3A%3E%3D2020-03-06%2Bfork%3Aonly%26type%3DRepositories) 匹配具有 "vue" 字样、在 2020 年 3 月 6 日或之后收到推送并且作为复刻的仓库。 |

### 3.8 按语言搜索

你可以基于其编写采用的主要语言搜索仓库。

| 限定符              | 示例                                                         |
| ------------------- | ------------------------------------------------------------ |
| `language:LANGUAGE` | [**vue language:javascript**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Fq%3Dvue%2Blanguage%3Ajavascript%26type%3DRepositories) 匹配具有 "vue" 字样、以 JavaScript 编写的仓库。 |

### 3.9 按主题搜索

你可以查找归类为特定 [主题](https://link.juejin.cn?target=https%3A%2F%2Fdocs.github.com%2Fcn%2Ffree-pro-team%40latest%2Farticles%2Fclassifying-your-repository-with-topics) 的所有仓库。

| 限定符        | 示例                                                         |
| ------------- | ------------------------------------------------------------ |
| `topic:TOPIC` | [**topic:algorithm**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Futf8%3D%E2%9C%93%26q%3Dtopic%3Aalgorithm%26type%3DRepositories%26ref%3Dsearchresults) 匹配已归类为 "algorithm" 主题的仓库。 |

估计又有很多人不知道 GitHub 上有话题一说的吧。

![](https://cdn.jsdelivr.net/gh/Wu-yikun/OSS/PicGo/202311141825666.png)



![](https://cdn.jsdelivr.net/gh/Wu-yikun/OSS/PicGo/202311141825050.png)

### 3.10 按主题数量搜索

你可以使用 `topics` 限定符以及 [大于、小于和范围限定符](https://link.juejin.cn?target=https%3A%2F%2Fdocs.github.com%2Fcn%2Ffree-pro-team%40latest%2Farticles%2Funderstanding-the-search-syntax) 按应用于仓库的 [主题](https://link.juejin.cn?target=https%3A%2F%2Fdocs.github.com%2Fcn%2Ffree-pro-team%40latest%2Farticles%2Fclassifying-your-repository-with-topics) 数量搜索仓库。

| 限定符     | 示例                                                         |
| ---------- | ------------------------------------------------------------ |
| `topics:n` | [**topics:5**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Futf8%3D%E2%9C%93%26q%3Dtopics%3A5%26type%3DRepositories%26ref%3Dsearchresults) 匹配具有五个主题的仓库。 |
|            | [**topics:>3**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Futf8%3D%E2%9C%93%26q%3Dtopics%3A%3E3%26type%3DRepositories%26ref%3Dsearchresults) 匹配超过三个主题的仓库。 |

### 3.11 使用可视界面搜索

还可以使用 [search](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch) page 或 [advanced search](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%2Fadvanced) page 搜索 GitHub 哦。

这种搜索方式，估计就更少人知道了吧。

[advanced search](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%2Fadvanced) page 提供用于构建搜索查询的可视界面。

你可以按各种因素过滤搜索，例如仓库具有的星标数或复刻数。 在填写高级搜索字段时，你的查询将在顶部搜索栏中自动构建。

### 3.12 按许可搜索

你可以按其[许可](https://link.juejin.cn?target=https%3A%2F%2Fdocs.github.com%2Fcn%2Ffree-pro-team%40latest%2Farticles%2Flicensing-a-repository)搜索仓库。 你必须使用[许可关键词](https://link.juejin.cn?target=https%3A%2F%2Fdocs.github.com%2Fcn%2Ffree-pro-team%40latest%2Farticles%2Flicensing-a-repository%2F%23searching-github-by-license-type)按特定许可或许可系列过滤仓库。

| 限定符                    | 示例                                                         |
| ------------------------- | ------------------------------------------------------------ |
| `license:LICENSE_KEYWORD` | [**license:apache-2.0**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Futf8%3D%E2%9C%93%26q%3Dlicense%3Aapache-2.0%26type%3DRepositories%26ref%3Dsearchresults) 匹配根据 Apache License 2.0 授权的仓库。 |

### 3.13 按公共或私有仓库搜索

你可以基于仓库是**公共**还是**私有**，以此过滤搜索。

| 限定符       | 示例                                                         |
| ------------ | ------------------------------------------------------------ |
| `is:public`  | [**is:public org:github**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Fq%3Dis%3Apublic%2Borg%3Agithub%26type%3DRepositories%26utf8%3D%E2%9C%93) 匹配 GitHub 拥有的公共仓库。 |
| `is:private` | [**is:private pages**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Futf8%3D%E2%9C%93%26q%3Dpages%2Bis%3Aprivate%26type%3DRepositories) 匹配你有访问权限且包含 "pages" 字样的私有仓库。 |

### 3.14 按仓库是否为镜像

你可以根据仓库是否为**镜像**以及托管于其他位置托管来搜索它们。

| 限定符         | 示例                                                         |
| -------------- | ------------------------------------------------------------ |
| `mirror:true`  | [**mirror:true GNOME**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Futf8%3D%E2%9C%93%26q%3Dmirror%3Atrue%2BGNOME%26type%3D) 匹配是镜像且包含 "GNOME" 字样的仓库。 |
| `mirror:false` | [**mirror:false GNOME**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Futf8%3D%E2%9C%93%26q%3Dmirror%3Afalse%2BGNOME%26type%3D) 匹配并非镜像且包含 "GNOME" 字样的仓库。 |

### 3.15 基于仓库是否已存档搜索

你可以基于仓库是否[已存档](https://link.juejin.cn?target=https%3A%2F%2Fdocs.github.com%2Fcn%2Ffree-pro-team%40latest%2Farticles%2Fabout-archiving-repositories)来搜索仓库。

| 限定符           | 示例                                                         |
| ---------------- | ------------------------------------------------------------ |
| `archived:true`  | [**archived:true GNOME**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Futf8%3D%E2%9C%93%26q%3Darchived%3Atrue%2BGNOME%26type%3D) 匹配已存档且包含 "GNOME" 字样的仓库。 |
| `archived:false` | [**archived:false GNOME**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Futf8%3D%E2%9C%93%26q%3Darchived%3Afalse%2BGNOME%26type%3D) 匹配未存档且包含 "GNOME" 字样的仓库。 |

### 3.16 基于具有 `good first issue` 或 `help wanted` 标签的议题数量搜索

你可以使用限定符 `help-wanted-issues:>n` 和 `good-first-issues:>n` 搜索具有最少数量标签为 `help-wanted` 或 `good-first-issue` 议题的仓库。

| 限定符                  | 示例                                                         |
| ----------------------- | ------------------------------------------------------------ |
| `good-first-issues:>n`  | [**good-first-issues:>2 javascript**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Futf8%3D%E2%9C%93%26q%3Djavascript%2Bgood-first-issues%3A%3E2%26type%3D) 匹配具有超过两个标签为 `good-first-issue` 的议题且包含 "javascript" 字样的仓库。 |
| `help-wanted-issues:>n` | [**help-wanted-issues:>4 react**](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fsearch%3Futf8%3D%E2%9C%93%26q%3Dreact%2Bhelp-wanted-issues%3A%3E4%26type%3D) 匹配具有超过四个标签为 `help-wanted` 的议题且包含 "React" 字样的仓库。 |

## 4. 更多技巧

其实，以上很多内容的都是来自于 GitHub 的官方文档，如果你还想学习更多技巧，请看 [GitHub 官方文档](https://link.juejin.cn?target=https%3A%2F%2Fdocs.github.com%2Fcn)

**[GitHub Docs](https://docs.github.com/en/github)**：

![](https://cdn.jsdelivr.net/gh/Wu-yikun/OSS/PicGo/202311141825967.png)

如果你还不了解或者还不会使用 GitHub ，可以看看这一章节：[Git 和 GitHub 学习资源](https://link.juejin.cn?target=https%3A%2F%2Fdocs.github.com%2Fcn%2Ffree-pro-team%40latest%2Fgithub%2Fgetting-started-with-github%2Fgit-and-github-learning-resources)
