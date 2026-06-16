# Agent 入口说明

这是一个小型 Tabby 插件项目。项目记忆保持轻量：非平凡任务先读本文件，再按任务打开相关源码。不要默认全量扫描或展开所有文档。

## 项目形态

- 产品：`tabby-command-workbench`，一个 Tabby 右侧命令工作台，用于按场景组织快捷操作、可复用命令和持久草稿区。
- 用户可见行为、安装、开发和发布命令先看 [README.md](README.md)。
- 修改产品行为、迁移逻辑、配置持久化、侧栏布局、右键菜单或 Tabby 终端交互时，阅读 [docs/project-context.md](docs/project-context.md)。

## 关键文件

- `src/quickButtons.service.ts`：侧栏 UI、命令执行、右键菜单、弹窗编辑、草稿区持久化和活动终端定位的核心实现。
- `src/model.ts`：默认数据、配置归一化、旧配置到当前结构的数据整理。
- `src/config.ts` 和 `src/configProvider.ts`：当前与旧版 Tabby 配置键、持久化配置选择、迁移支持。
- `src/types.ts`：场景分类、快捷命令、常用命令、草稿区相关类型。
- `scripts/test-model.js`：配置归一化和迁移选择的轻量回归测试。

## 工作规则

- 改动聚焦用户请求，遵循现有 TypeScript 风格。
- 提交信息使用 Conventional Commits：`type(scope): summary`。常用 `type` 包括 `feat`、`fix`、`docs`、`test`、`refactor`、`build`、`ci`、`chore` 和 `release`；summary 使用简短英文祈使句。
- 文档和代码冲突时，以代码为准。
- 除非任务明确要求，否则不要破坏现有用户配置和迁移行为。
- 修改代码后先运行最小相关验证；`npm run check` 是完整本地门禁。
- 只有产生长期有效的产品规则、实现约束、文件入口或设计决策时，才更新项目记忆。
- 不要把流水账式过程记录或历史实现故事写入默认项目上下文。
