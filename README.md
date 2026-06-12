# Tabby Serial Command Sidebar

[![CI](https://github.com/rookie0422/tabby-serial-command-sidebar/actions/workflows/ci.yml/badge.svg)](https://github.com/rookie0422/tabby-serial-command-sidebar/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/tabby-serial-command-sidebar.svg)](https://www.npmjs.com/package/tabby-serial-command-sidebar)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

一个面向串口、ADB 和日常终端调试的 Tabby 右侧快捷命令栏。

顶部 Tab 表示可自定义的使用场景。每个场景在同一页中包含快捷命令按钮、常用命令和临时复制区，适合在调试过程中快速填充、发送、复制和暂存多行文本。

## 功能

- 自定义场景 Tab，例如串口、ADB、Linux 或项目专用分类
- 快捷命令按钮支持填充终端、复制，以及可选的自动回车
- 常用命令单击复制，右键可填充或发送
- 分类、按钮和命令通过右键菜单新增、编辑、删除和改色
- 编辑表单使用窗口级弹窗，不挤压侧栏内容
- 临时复制区是每个分类独立的大型持久草稿板
- 快捷按钮最多显示三排，常用命令最多显示五条，超出后区域独立滚动
- 侧栏宽度和整体布局会随窗口尺寸自适应
- 草稿区支持原生复制、粘贴、撤销等快捷键，按 `Esc` 返回当前终端
- 配置保存在 Tabby 配置中，重启后仍然保留

## 安装

### Tabby 插件管理器

发布到 npm 后，在 Tabby 的 `Settings -> Plugins` 中搜索：

```text
tabby-serial-command-sidebar
```

安装后重启 Tabby。

### npm 安装

也可以在 Tabby 的插件目录中安装：

```bash
npm install tabby-serial-command-sidebar
```

常见插件目录：

- Windows: `%APPDATA%\tabby\plugins`
- macOS: `~/Library/Application Support/tabby/plugins`
- Linux: `~/.config/tabby/plugins`

安装完成后重启 Tabby。

### 从 GitHub 安装

```bash
npm install github:rookie0422/tabby-serial-command-sidebar
```

该方式会在安装过程中从源码构建插件。

## 使用

- 左键分类 Tab：切换场景
- 左键快捷按钮：执行按钮配置的默认行为
- 左键常用命令：复制命令正文
- 右键分类、快捷按钮或常用命令：打开管理菜单
- 临时复制区：自由粘贴、编辑和选择任意文本
- `Esc`：从临时复制区返回当前终端
- 右上角关闭按钮：收起侧栏并返回当前终端

侧栏可以在 Tabby 设置页的 `Serial Command Sidebar` 中启用、设置默认展开状态和调整宽度。
