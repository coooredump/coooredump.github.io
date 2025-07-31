# Here is Coredump

![Word Art](docs/images/wordArt.webp)

## 内容

编程竞赛发展多年，难度越来越高，内容越来越复杂，而网上资料大多零散，初学者往往并不知道如何系统地学习相关知识，需要花费大量时间摸索。

**OI Wiki** 致力于成为一个免费开放且持续更新的知识整合站点，大家可以在这里获取关于 **编程竞赛 (competitive programming)** 有趣又实用的知识，我们为大家准备了竞赛中的基础知识、常见题型、解题思路以及常用工具等内容，帮助大家更快速深入地学习编程竞赛。

目前，**OI Wiki** 的内容还有很多不完善的地方，知识点覆盖不够全面，存在一些低质量页面需要修改。**OI Wiki** 团队以及参与贡献的小伙伴们正在积极完善这些内容。

## 部署

本项目目前采用 [MkDocs](https://github.com/mkdocs/mkdocs) 部署在 [Coredump `gh-page`](https://coooredump.github.io/)。

当然，也可以在本地部署。（**需要安装 `Python3` 和 `uv`**）

**如果遇到问题，可以查阅 [F.A.Q.](https://oi-wiki.org/intro/faq/) 来了解更多信息。**

```bash
git clone https://github.com/OI-wiki/OI-wiki.git --depth=1

cd OI-wiki

# 安装 uv (如果尚未安装)
pip install uv

# 安装依赖
uv sync --index-url https://pypi.tuna.tsinghua.edu.cn/simple/

# 使用我们的自定义主题（Windows 下请使用 Git Bash 执行）
# 安装主题时将连接网络下载资源，可通过以下配置项控制下载链接
# .gitmodules:
# - url
# scripts/pre-build/install-theme-vendor.sh:
# - MATHJAX_URL
# - MATERIAL_ICONS_URL
./scripts/pre-build/install-theme.sh

# 两种方法（选其一即可）：
# 1. 运行一个本地服务器，访问 http://127.0.0.1:8000 可以查看效果
uv run mkdocs serve -v

# 2. 在 site 文件夹下得到静态页面
uv run mkdocs build -v

# 获取 mkdocs 的命令行工具的说明（解释了命令和参数的含义）
uv run mkdocs --help

# 部署到 coooredump.github.io
git add .
git commit -m "<msg>"
git push
```

我们现在在服务器端渲染 MathJax，如果希望实现类似效果，可以参考 [build.yml](https://github.com/OI-wiki/OI-wiki/blob/master/.github/workflows/build.yml)（需要安装 Node.js）。

### 镜像

```bash
# Gitee 码云 上的镜像仓库和 GitHub 仓库的内容相同
git clone https://gitee.com/OI-wiki/OI-wiki.git
```

### 离线版

可以使用 `gh-pages` 分支的内容

```bash
git clone https://gitee.com/OI-wiki/OI-wiki.git -b gh-pages
```

本地启动一个 http 服务器可能会更方便一些。

```bash
# 如果是 python3
python3 -m http.server
# 如果是 python2
python2 -m SimpleHTTPServer
# 有些环境下找不到名叫 python3/python2 的可执行文件，不妨运行 python 试试
```

## 问题与方法

Q：本项目中 `master` 分支与 `gh-page` 分支分别存放「项目源码」和「静态网页」的方式，和 `Hexo` 使用 github.io 和 github.io-source 仓库分别存放「项目源码」和「静态网页」的方式有什么区别？

A：前者两个分支都是 `public` 的，无法保护项目源码的隐私；后者在 github.io-source 仓库中 `priavte` 仓库即可保护，静态网页仓库设置为 `public`

---

Q：如果多个 Github 账号，如何生成多个密钥来部署

A：
1. `ssh-keygen -t rsa -f ~/.ssh/id_rsa_coooredump` 生成另一个密钥，区别于默认 id_rsa 密钥
2. 修改当前仓库的 git 配置信息：即 `git config --local` 的 `email` 和 `name` 信息，文件位于当前项目的 `.git/config`，不同于全局配置（当前仓库如有配置，则优先级更高）
3. 配置 `sshCommand` 指定提交时的密钥

> 以下为 `.git/config` 的信息（即当前项目的 git 配置文件）

```bash
[core]
        sshCommand = "ssh -i ~/.ssh/id_rsa_coredump" # 而非 id_rsa（另一个 github 账号的）
        repositoryformatversion = 0
        filemode = true
        bare = false
        logallrefupdates = true
        ignorecase = true
        precomposeunicode = true
[user]
        email = coooredump@gmail.com
        name = Coredump
[remote "github"]
        url = git@github.com:coooredump/coooredump.github.io.git
        fetch = +refs/heads/*:refs/remotes/github/*
[branch "master"]
        remote = github
        merge = refs/heads/master
```

---

Q：执行 `./scripts/pre-build/install-theme.sh` 没办法完全生成 `mkdocs-material/` 目录

A：解决办法是去 https://github.com/OI-wiki/mkdocs-material 的 `material/templates/` 目录拷贝所有文件过来

---

Q：数学公式无法生成

A：解决办法在 `mkdocs.yml` 中添加：

```yml
# 数学渲染配置
extra_javascript:
  - 'https://polyfill.io/v3/polyfill.min.js?features=es6'
  - 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js'
```

## 版权声明

<a rel="license" href="https://creativecommons.org/licenses/by-sa/4.0/"><img alt="知识共享许可协议" style="border-width:0" src="https://i.creativecommons.org/l/by-sa/4.0/88x31.png" /></a><br />除特别注明外，项目中除了代码部分均采用<a rel="license" href="https://creativecommons.org/licenses/by-sa/4.0/deed.zh">(Creative Commons BY-SA 4.0) 知识共享署名 - 相同方式共享 4.0 国际许可协议</a>及附加的 [The Star And Thank Author License](https://github.com/zTrix/sata-license) 进行许可。

换言之，使用过程中您可以自由地共享、演绎，但是必须署名、以相同方式共享、分享时没有附加限制，而且应该为 GitHub 仓库点赞（Star）。

而如果你想要引用这个 GitHub 仓库，可以使用如下的 bibtex：

```latex
@misc{oiwiki,
  author = {OI Wiki Team},
  title = {OI Wiki},
  year = {2016},
  publisher = {GitHub},
  journal = {GitHub Repository},
  howpublished = {\url{https://github.com/OI-wiki/OI-wiki}},
}
```

## 鸣谢

本项目受 [CTF Wiki](https://ctf-wiki.org/) 的启发，在编写过程中参考了诸多资料，在此一并致谢。

非常感谢一起完善 **OI Wiki** 的 [小伙伴们](https://github.com/OI-wiki/OI-wiki/graphs/contributors) 和为 **OI Wiki** 捐赠的 [朋友们](https://oi-wiki.org/intro/thanks/)！

<a href="https://github.com/OI-wiki/OI-wiki/graphs/contributors"><img src="https://opencollective.com/oi-wiki/contributors.svg?width=890&button=false" /></a>

特别感谢 [24OI](https://github.com/24OI) 的朋友们的大力支持！
