# ai-agent

基于 **pnpm + Turborepo** 的 monorepo 项目，包含用户端 Web、管理后台 Admin，以及 Cloudflare Workers API 服务，共享 UI 组件库与工程化配置。

## 技术栈

| 类别 | 技术 |
|------|------|
| 包管理 | pnpm workspace + catalog 统一版本 |
| 构建编排 | Turborepo |
| 前端框架 | Next.js 16（Turbopack）+ React 19 |
| 样式 | Tailwind CSS v4 + PostCSS |
| API | Hono + Cloudflare Workers（Wrangler） |
| 语言 | TypeScript |
| 代码规范 | ESLint + Prettier |

## 项目结构

```
ai-agent/
├── apps/
│   ├── web/          # 用户端 Next.js 应用（端口 3005）
│   ├── admin/        # 管理后台 Next.js 应用（端口 3006）
│   └── api/          # Cloudflare Workers API（端口 8787）
├── packages/
│   ├── ui/           # 共享 React 组件与设计 token（theme.css）
│   ├── eslint-config/# 共享 ESLint 配置
│   └── typescript-config/  # 共享 TS 配置
├── pnpm-workspace.yaml     # workspace 与 catalog 版本定义
├── turbo.json              # Turborepo 任务配置
└── .npmrc                  # pnpm 配置（Tailwind 依赖提升）
```

### 应用说明

- **web**：面向用户的 Next.js 应用，引用 `@repo/ui` 共享组件
- **admin**：管理后台，与 web 共用 UI 库和 Tailwind 主题
- **api**：基于 Hono 的 Worker 服务，提供 `/health` 等接口

### 共享包说明

- **@repo/ui**：共享 React 组件（如 `button`、`card`、`tailwind-demo`）及 `theme.css` 设计 token
- **@repo/eslint-config**：ESLint 规则（含 Next.js、React 场景）
- **@repo/typescript-config**：各子项目的 `tsconfig` 基座

## 环境要求

- Node.js >= 18
- pnpm 10（项目已锁定版本，推荐使用 Corepack）

```bash
corepack enable
corepack prepare pnpm@10.33.2 --activate
```

## 快速开始

### 安装依赖

在仓库根目录执行：

```bash
pnpm install
```

### 环境变量

本地开发前，为 web / admin 从 example 复制出 development 配置（真实 `.env.*` 已 gitignore，勿提交）：

```bash
cp apps/web/.env.example apps/web/.env.development
cp apps/admin/.env.example apps/admin/.env.development
```

三环境说明：

| 环境 | web / admin | api |
|------|-------------|-----|
| development | `.env.development`（本地可跑，API 指向 `http://127.0.0.1:8787`） | `wrangler.jsonc` 顶层 `vars.APP_ENV` |
| test | `.env.test`（占位符） | `wrangler.jsonc` → `env.test.vars` |
| production | `.env.production`（占位符） | `wrangler.jsonc` → `env.production.vars` |

读取约定：

- **api**（Cloudflare Worker）：从 `c.env` 读取 Wrangler `vars` / bindings
- **web / admin**（Next.js）：服务端读 `process.env`，浏览器读 `process.env.NEXT_PUBLIC_*`

api 部署到不同环境：

```bash
pnpm --filter @repo/api deploy              # 默认（development vars）
pnpm --filter @repo/api deploy:test         # wrangler deploy --env test
pnpm --filter @repo/api deploy:production   # wrangler deploy --env production
```

### 启动开发服务

推荐单独启动某个应用（避免 Turborepo TUI 额外开销）：

```bash
pnpm run dev:web     # http://localhost:3005
pnpm run dev:admin   # http://localhost:3006
pnpm run dev:api     # http://localhost:8787
```

也可一次性启动所有 dev 任务：

```bash
pnpm run dev
```

### 构建

```bash
# 构建全部
pnpm run build

# 构建单个应用
pnpm --filter web build
pnpm --filter admin build
```

### 代码检查

```bash
pnpm run lint          # ESLint
pnpm run check-types   # TypeScript 类型检查
pnpm run format        # Prettier 格式化
```

## 本地开发地址

| 应用 | 地址 | 命令 |
|------|------|------|
| web | http://localhost:3005 | `pnpm run dev:web` |
| admin | http://localhost:3006 | `pnpm run dev:admin` |
| api | http://localhost:8787 | `pnpm run dev:api` |

API 健康检查：

```bash
curl http://localhost:8787/health
# {"ok":true,"service":"api","appEnv":"development"}
```

## Tailwind CSS 配置说明

本项目使用 **Tailwind CSS v4**，各 Next 应用独立配置 PostCSS，共享 UI 包提供主题 token。

- 各 app 的 `postcss.config.mjs` 使用 `@tailwindcss/postcss`
- `packages/ui/src/theme.css` 定义共享 `@theme` 变量
- 各 app 的 `globals.css` 通过 `@import "@repo/ui/theme.css"` 引入主题
- 使用 `@source` 限定扫描范围（仅 app 目录 + `packages/ui`），避免 monorepo 下扫描过大导致 dev 卡顿

版本通过 `pnpm-workspace.yaml` 的 catalog 统一管理：

```yaml
tailwindcss: ^4.1.15
'@tailwindcss/postcss': ^4.1.15
```

## 部署 API

```bash
pnpm --filter @repo/api deploy              # 默认（development vars）
pnpm --filter @repo/api deploy:test         # test 环境
pnpm --filter @repo/api deploy:production   # production 环境
```

生成 Cloudflare Worker 类型：

```bash
pnpm --filter @repo/api cf-typegen
```

## 常见问题

### 端口被占用（EADDRINUSE）

重启 dev 前旧进程可能未退出，先释放端口：

```bash
lsof -ti :3005 | xargs kill -9   # web
lsof -ti :3006 | xargs kill -9   # admin
lsof -ti :8787 | xargs kill -9   # api
```

### dev 首次加载较慢

Next.js dev 模式下，Tailwind PostCSS 首次编译需要几秒，属正常现象。若持续卡顿，可尝试：

```bash
rm -rf apps/web/.next apps/admin/.next
pnpm run dev:web   # 或 dev:admin
```

### 依赖版本管理

子项目引用 catalog 版本，例如：

```json
"react": "catalog:",
"tailwindcss": "catalog:"
```

新增 catalog 依赖时，需同时更新 `pnpm-workspace.yaml` 和对应 `package.json`，然后重新 `pnpm install`。

## 相关链接

- [Turborepo 文档](https://turborepo.dev/docs)
- [Next.js 文档](https://nextjs.org/docs)
- [Tailwind CSS v4 文档](https://tailwindcss.com/docs)
- [Hono 文档](https://hono.dev/)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
