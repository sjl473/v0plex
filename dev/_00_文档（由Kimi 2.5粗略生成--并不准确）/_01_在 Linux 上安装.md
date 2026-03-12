---
title: 在 Linux 上安装
created_at: 2026-03-12
last_updated_at: 2026-03-12
author: v0plex
has_custom_tsx: false
---

# 在 Linux 上安装

v0plex 的运行依赖 Node.js 和 pnpm 包管理器，同时中文搜索功能需要 Python 3 和 jieba 分词库的支持。本节将详细介绍如何在常见的 Linux 发行版上完成这些依赖的安装和配置。

## 系统要求

在开始安装之前，请确认系统满足以下基本要求。操作系统方面，v0plex 已在 Ubuntu 20.04 LTS 及更高版本、Debian 11、CentOS 8 和 Fedora 35 上通过测试。内存建议至少 4GB，磁盘空间预留 2GB 以上用于项目依赖和构建输出。网络连接用于下载 Node.js 包和 Python 库。

## 安装 Node.js

v0plex 需要 Node.js 18 或更高版本。推荐使用 NodeSource 的安装脚本，它提供了最新的稳定版本。

在基于 Debian 或 Ubuntu 的系统上，执行以下命令安装 Node.js 20：

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

对于使用 dnf 的 Fedora 系统：

```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
```

安装完成后，验证 Node.js 版本：

```bash
node --version
```

正常应显示 v20.x.x 或更高版本。

## 安装 pnpm

pnpm 是 v0plex 选择的包管理器，相比 npm 和 yarn，它在磁盘空间利用和安装速度方面有显著优势。安装 pnpm 最简单的方式是使用 npm：

```bash
sudo npm install -g pnpm
```

或者使用官方安装脚本：

```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

使用脚本安装后，需要重新加载 shell 配置文件或重启终端使 pnpm 命令可用。验证安装：

```bash
pnpm --version
```

## 安装 Python 3

大多数现代 Linux 发行版都预装了 Python 3。可以通过以下命令检查：

```bash
python3 --version
```

如果系统未安装 Python 3，在 Ubuntu 或 Debian 上执行：

```bash
sudo apt-get update
sudo apt-get install -y python3 python3-venv python3-pip
```

在 Fedora 上：

```bash
sudo dnf install -y python3 python3-virtualenv python3-pip
```

v0plex 的构建脚本会自动创建 Python 虚拟环境并安装 jieba 库，因此无需手动安装。

## 克隆 v0plex 仓库

安装完系统依赖后，从 GitHub 克隆 v0plex 项目到本地：

```bash
git clone https://github.com/your-org/v0plex.git
cd v0plex
```

如果你 fork 了项目，请将仓库地址替换为你自己的 fork 地址。

## 安装项目依赖

进入项目目录后，使用 pnpm 安装所有 Node.js 依赖：

```bash
pnpm install
```

这个过程可能需要几分钟，取决于网络状况。pnpm 会下载所有必要的包并建立项目所需的符号链接。安装完成后，`node_modules/` 目录将包含所有依赖。

## 验证安装

完成上述步骤后，可以通过运行开发服务器来验证安装是否成功：

```bash
pnpm dev
```

首次运行会先执行 Markdown 解析和中文索引生成，这可能需要一些时间。如果一切正常，终端将显示开发服务器的访问地址，通常是 `http://localhost:3000`。打开浏览器访问该地址，应该能看到 v0plex 的默认页面和示例内容。

## 故障排除

如果安装过程中遇到问题，以下是一些常见情况的解决方案。

权限问题：如果在安装全局包时遇到 EACCES 错误，考虑使用 nvm 管理 Node.js 版本，或者调整 npm 的默认目录权限。

网络问题：在中国大陆或其他网络受限地区，可以配置 npm 和 pnpm 使用镜像源。编辑 `~/.npmrc` 添加 `registry=https://registry.npmmirror.com`。

Python 虚拟环境冲突：如果在运行 `pnpm lex:gen` 时提示已在虚拟环境中，请执行 `deactivate` 退出当前虚拟环境，然后重新运行命令。

构建失败：确保系统已安装 `git`，因为某些依赖可能通过 Git 协议拉取。
