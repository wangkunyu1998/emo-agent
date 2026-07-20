# Env Variables (dev/test/production) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 web / admin / api 补齐 development、test、production 环境变量文件与 Zod 校验，并按运行时约定接线（Next 读 `process.env`，Worker 读 `c.env`）。

**Architecture:** web 与 admin 同构：`.env.*` + `env.server.ts` / `env.client.ts`，服务端启动时校验。api 用 Wrangler `vars` 注入 bindings，Hono 从 `c.env` 校验。真实 env 文件 gitignore，仅提交 `.env.example`。

**Tech Stack:** Zod、Next.js env 加载、Wrangler vars、Hono Bindings、pnpm catalog

## Global Constraints

- 三环境枚举仅允许：`development` | `test` | `production`
- api 只从 `c.env` 读；web/admin 只从 `process.env` / `NEXT_PUBLIC_*` 读
- development：`API_BASE_URL=http://127.0.0.1:8787`；test/production 用 `*.example.com` 占位符
- 真实 `.env*` / `.dev.vars` 不进 git；保留 `.env.example`
- 不抽 `@repo/env` 包；不改业务 UI
- 未用户明确要求时不创建 git commit

## File Map

| 路径 | 职责 |
|------|------|
| `pnpm-workspace.yaml` | 增加 `zod` catalog |
| `.gitignore`、`apps/web/.gitignore`、`apps/admin/.gitignore`、`apps/api/.gitignore` | 忽略真实 env，保留 example |
| `apps/web/.env.*`、`apps/admin/.env.*`、对应 `.env.example` | 三环境取值 + 模板 |
| `apps/web/env.server.ts`、`env.client.ts` | 服务端/客户端 Zod 校验 |
| `apps/admin/env.server.ts`、`env.client.ts` | 同上（镜像） |
| `apps/web/instrumentation.ts`、`apps/admin/instrumentation.ts` | 启动时调用 `getServerEnv()` |
| `apps/web/next.config.js`、`apps/admin/next.config.js` | 如需开启 `experimental.instrumentationHook`（Next 16 通常默认支持） |
| `apps/api/env.ts` | `getApiEnv(bindings)` |
| `apps/api/wrangler.jsonc` | 已有三环境 `APP_ENV`，必要时微调 |
| `apps/api/src/index.ts` | `Hono<{ Bindings }>` + `c.env` |
| `apps/*/package.json` | 加 `zod`；api 加 deploy 脚本 |
| `README.md` | 环境变量使用说明 |

---

### Task 1: gitignore + zod catalog

**Files:**
- Modify: `.gitignore`
- Modify: `apps/web/.gitignore`
- Modify: `apps/admin/.gitignore`
- Modify: `apps/api/.gitignore`
- Modify: `pnpm-workspace.yaml`

- [ ] **Step 1: 更新根 `.gitignore` 本地 env 段**

替换为：

```gitignore
# Local env files
.env
.env.*
!.env.example
```

- [ ] **Step 2: 更新 web / admin `.gitignore` env 段**

将 `.env*` 改为：

```gitignore
# env files
.env
.env.*
!.env.example
```

- [ ] **Step 3: 更新 api `.gitignore` env 段**

```gitignore
# env
.env
.env.*
!.env.example
.dev.vars
!.dev.vars.example
```

- [ ] **Step 4: catalog 增加 zod**

在 `pnpm-workspace.yaml` 的 `catalog:` 下增加：

```yaml
zod: ^3.25.76
```

（若安装时解析到更新的 3.x patch，以 lockfile 为准即可。）

- [ ] **Step 5: 验证 ignore 规则**

Run: `git check-ignore -v apps/web/.env.development apps/web/.env.example || true`  
Expected: `.env.development` 被忽略；`.env.example` 不被忽略（example 文件创建后可再验一次）

---

### Task 2: web / admin 的 `.env` 文件与校验模块

**Files:**
- Create: `apps/web/.env.example`、`.env.development`、`.env.test`、`.env.production`
- Create: `apps/web/env.client.ts`
- Modify: `apps/web/env.server.ts`
- Create: `apps/admin/.env.example`、`.env.development`、`.env.test`、`.env.production`
- Create: `apps/admin/env.server.ts`、`env.client.ts`
- Modify: `apps/web/package.json`、`apps/admin/package.json`

**Interfaces:**
- Produces: `getWebServerEnv(): WebServerEnv`、`getWebClientEnv(): WebClientEnv`（admin 同名或 `getAdmin*`；推荐统一命名 `getServerEnv` / `getClientEnv` 以便 instrumentation 一致）

- [ ] **Step 1: 写入 web 四套 env 文件**

`.env.example` / `.env.development`：

```env
APP_ENV=development
API_BASE_URL=http://127.0.0.1:8787
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787
```

`.env.test`：

```env
APP_ENV=test
API_BASE_URL=https://api-test.example.com
NEXT_PUBLIC_APP_ENV=test
NEXT_PUBLIC_API_BASE_URL=https://api-test.example.com
```

`.env.production`：

```env
APP_ENV=production
API_BASE_URL=https://api.example.com
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
```

admin 镜像相同内容（四套文件路径换到 `apps/admin/`）。

- [ ] **Step 2: 实现 web `env.server.ts`**

```ts
import { z } from 'zod';

const serverEnvSchema = z.object({
  APP_ENV: z.enum(['development', 'test', 'production']),
  API_BASE_URL: z.string().url(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse({
    APP_ENV: process.env.APP_ENV,
    API_BASE_URL: process.env.API_BASE_URL,
  });
}
```

- [ ] **Step 3: 实现 web `env.client.ts`**

```ts
import { z } from 'zod';

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_ENV: z.enum(['development', 'test', 'production']),
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

export function getClientEnv(): ClientEnv {
  return clientEnvSchema.parse({
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  });
}
```

admin 复制同内容到 `apps/admin/env.server.ts`、`env.client.ts`（删除旧的 `getWebServerEnv` 命名，统一为 `getServerEnv`）。

- [ ] **Step 4: package.json 声明 zod**

web / admin `dependencies` 增加：`"zod": "catalog:"`

- [ ] **Step 5: 安装依赖**

Run: `pnpm install`  
Expected: lockfile 更新成功，无缺依赖报错

---

### Task 3: Next 启动时校验（web + admin）

**Files:**
- Create: `apps/web/instrumentation.ts`
- Create: `apps/admin/instrumentation.ts`
- Modify: `apps/web/next.config.js`、`apps/admin/next.config.js`（仅当需要显式开启时）

**Interfaces:**
- Consumes: `getServerEnv()` from `./env.server`

- [ ] **Step 1: 创建 instrumentation**

`apps/web/instrumentation.ts` 与 `apps/admin/instrumentation.ts`：

```ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getServerEnv } = await import('./env.server');
    getServerEnv();
  }
}
```

- [ ] **Step 2: 确认 Next 16 会加载 instrumentation**

查阅/验证：Next.js 16 App Router 默认加载根目录 `instrumentation.ts`。若启动无调用，在对应 `next.config.js` 增加文档要求的开关（以该仓库 Next 版本实际行为为准）。

- [ ] **Step 3: 冒烟**

Run: `pnpm --filter web exec node -e "process.env.APP_ENV='development';process.env.API_BASE_URL='http://127.0.0.1:8787';const {getServerEnv}=require('./env.server.ts')"`  
（若 ESM/TS 不便，改用 `pnpm --filter web check-types`）  
Expected: `check-types` 通过；缺变量时 Zod 抛错（可用临时删 env 的本地验证）

---

### Task 4: api Worker 接线（c.env）

**Files:**
- Modify: `apps/api/env.ts`
- Modify: `apps/api/src/index.ts`
- Modify: `apps/api/package.json`
- Modify: `apps/api/wrangler.jsonc`（若需）
- Create: `apps/api/.dev.vars.example`（可选说明文件）

**Interfaces:**
- Consumes: Wrangler bindings `APP_ENV`
- Produces: `getApiEnv(bindings): ApiEnv`；health 返回 `appEnv`

- [ ] **Step 1: 确认 `env.ts`**

```ts
import { z } from 'zod';

const apiEnvSchema = z.object({
  APP_ENV: z.enum(['development', 'test', 'production']),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export function getApiEnv(bindings: { APP_ENV?: unknown }): ApiEnv {
  return apiEnvSchema.parse({
    APP_ENV: bindings.APP_ENV,
  });
}
```

- [ ] **Step 2: 改 `src/index.ts`**

```ts
import { Hono } from 'hono';
import { getApiEnv } from '../env';

type Bindings = {
  APP_ENV: 'development' | 'test' | 'production';
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/health', (c) => {
  const env = getApiEnv(c.env);
  return c.json({ ok: true, service: 'api', appEnv: env.APP_ENV });
});

export default app;
```

- [ ] **Step 3: package.json**

dependencies 增加 `"zod": "catalog:"`  
scripts 增加：

```json
"deploy:test": "wrangler deploy --minify --env test",
"deploy:production": "wrangler deploy --minify --env production"
```

- [ ] **Step 4: 可选 `.dev.vars.example`**

```
# Local secrets for wrangler dev (copy to .dev.vars). Currently no secrets required.
# APP_ENV comes from wrangler.jsonc vars.
```

- [ ] **Step 5: 安装并类型检查**

Run: `pnpm install && pnpm --filter api exec tsc --noEmit`（若 api 无 tsc 脚本，则 `pnpm --filter api cf-typegen` 后保证 index 无类型错误）  
Expected: 无报错

- [ ] **Step 6: 本地 health 冒烟（需 api 已启动）**

Run: `curl -s http://127.0.0.1:8787/health`  
Expected: `{"ok":true,"service":"api","appEnv":"development"}`

---

### Task 5: README

**Files:**
- Modify: `README.md`

- [x] **Step 1: 在「快速开始」中增加环境变量小节**

内容需包含：

1. 复制 `apps/web|.admin/.env.example` → `.env.development`
2. api 环境来自 `wrangler.jsonc` 的 `vars` / `--env`
3. 读取约定：Worker → `c.env`；Next → `process.env`
4. `deploy:test` / `deploy:production` 命令
5. 更新 health 示例响应含 `appEnv`

- [x] **Step 2: 自检清单对照设计文档**

对照 `docs/superpowers/specs/2026-07-20-env-variables-design.md` 验收标准 1–5，逐项打勾。

---

## Spec Coverage Check

| Spec 要求 | Task |
|-----------|------|
| web/admin 三环境 + example | Task 2 |
| gitignore 真实 env | Task 1 |
| server/client Zod | Task 2 |
| 启动校验 | Task 3 |
| api `c.env` + wrangler 三环境 | Task 4 |
| deploy scripts | Task 4 |
| README | Task 5 |
| zod 依赖 | Task 1–2、4 |
| 端口 8787 | Task 2 |
| 不做 @repo/env / 不改 UI | 全局约束 |
