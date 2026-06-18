# Tabby Command Workbench

[![CI](https://github.com/rookie0422/tabby-command-workbench/actions/workflows/ci.yml/badge.svg)](https://github.com/rookie0422/tabby-command-workbench/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/tabby-command-workbench.svg)](https://www.npmjs.com/package/tabby-command-workbench)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

一个按场景组织快捷操作、可复用命令和持久草稿的 Tabby 命令工作台。

顶部 Tab 表示可自定义的使用场景。每个场景在同一页中包含快捷命令按钮、常用命令和临时复制区，适合在调试过程中快速填充、发送、复制和暂存多行文本。

![Command Workbench 界面预览](docs/images/workbench-preview.svg)

## 功能

- 自定义场景 Tab，例如串口、ADB、Linux 或项目专用分类
- 快捷命令按钮支持填充终端、复制，以及可选的自动回车
- 快捷命令支持 `{{name}}` 参数占位符，点击时填写一次并复用到整段命令
- 自动回车模式支持多行顺序发送，并可用 `{{delay:2000}}` 插入简单等待
- 会直接执行的按钮有独立样式；高风险命令保存或首次执行时需要确认
- 常用命令单击复制，右键可填充或发送
- 分类、按钮和命令通过右键菜单新增、编辑、删除和改色
- 编辑表单使用窗口级弹窗，不挤压侧栏内容
- 临时复制区是每个分类独立的大型持久草稿板
- 快捷按钮最多显示三排，常用命令最多显示五条，超出后区域独立滚动
- 侧栏以停靠方式展开，会压缩终端主体而不是遮挡内容
- 可直接拖动侧栏左边缘调整宽度，宽度会随配置持久化
- 草稿区支持原生复制、粘贴、撤销等快捷键，按 `Esc` 返回当前终端
- 配置保存在 Tabby 配置中，重启后仍然保留

## 安全提示

命令、常用命令和草稿区内容会持久化到 Tabby 配置文件中。不要在本插件中保存 token、密码、生产密钥或其他敏感凭据。

## 安装

### Tabby 插件管理器

发布到 npm 后，在 Tabby 的 `Settings -> Plugins` 中搜索：

```text
tabby-command-workbench
```

安装后重启 Tabby。

### npm 安装

也可以在 Tabby 的插件目录中安装：

```bash
npm install tabby-command-workbench
```

常见插件目录：

- Windows: `%APPDATA%\tabby\plugins`
- macOS: `~/Library/Application Support/tabby/plugins`
- Linux: `~/.config/tabby/plugins`

安装完成后重启 Tabby。

### 从 GitHub 安装

```bash
npm install github:rookie0422/tabby-command-workbench
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

参数化多行快捷命令示例：

```text
adb connect {{ip}}
{{delay:2000}}
adb -s {{ip}} shell
```

点击该按钮时会先填写 `ip`，再按顺序发送两条命令，中间等待 2 秒。`delay` 只负责按时间等待，不会判断上一条命令是否成功。

工作台可以在 Tabby 设置页的 `Command Workbench` 中启用并设置默认展开状态。
侧栏宽度直接拖动工作台左边缘调整。

从 `tabby-serial-command-sidebar` 升级时，首次启动会自动迁移原有分类、按钮、
常用命令和草稿内容。确认新版本正常后即可卸载旧包。

## 开发

```bash
npm install
npm run check
```

`npm run check` 会依次运行持久化回归测试、TypeScript 类型检查、Webpack
构建和 npm 包内容检查。

## 发布

项目通过 `.github/workflows/publish.yml` 和 npm Trusted Publishing 自动发布。
在 npm 包设置中将 Trusted Publisher 配置为：

- Provider: GitHub Actions
- Organization or user: `rookie0422`
- Repository: `tabby-command-workbench`
- Workflow filename: `publish.yml`

发布新版本时：

```bash
npm version patch --no-git-tag-version
npm run check
git add package.json package-lock.json
git commit -m "Release vX.Y.Z"
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin main
git push origin vX.Y.Z
```

最后在 GitHub 上发布对应标签的 Release。GitHub Actions 会通过 OIDC
直接发布到 npm，不需要 `NPM_TOKEN`，也不需要手动输入 OTP。
