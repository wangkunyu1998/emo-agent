# 环境变量三环境设计（development / test / production）

日期：2026-07-20  
状态：待用户确认  
方案：C（各 app 镜像结构 + 轻量运行时接线）

## 背景

项目已有半成品环境变量骨架：

- `apps/web/.env.development`、`apps/web/env.server.ts`
- `apps/api/wrangler.jsonc`（default / test / production 的 `APP_ENV`）、`apps/api/env.ts`

目标：按 **development / test / production** 补齐整仓配置，gitignore 真实 env 文件，并把校验接到运行时。取值策略：development 本地可跑；test / production 用占位符；可提交 `.env.example`。

## 运行时读取约定

| 应用 | 运行时 | 读取方式 |
|------|--------|----------|
| api | Cloudflare Worker | `c.env`（Wrangler `vars` / bindings） |
| web | Next.js 服务端 | `process.env` |
| web | Next.js 浏览器 | `process.env.NEXT_PUBLIC_*`（构建期内联） |
| admin | 同 web | 同 web |

校验函数签名与此对齐：

- api：`getApiEnv(c.env)` 或 `getApiEnv(bindings)`，在路由/中间件里从 `c.env` 取
- web/admin 服务端：`getServerEnv()` 读 `process.env`
- web/admin 客户端：`getClientEnv()` 读 `process.env.NEXT_PUBLIC_*`

## 变量清单

### web / admin（同构）

| 变量 | 作用域 | 说明 |
|------|--------|------|
| `APP_ENV` | server | `development` \| `test` \| `production` |
| `API_BASE_URL` | server | API 绝对 URL |
| `NEXT_PUBLIC_APP_ENV` | client | 与 `APP_ENV` 同值，供浏览器侧判断环境 |
| `NEXT_PUBLIC_API_BASE_URL` | client | 浏览器可调用的 API base URL |

### api（Worker bindings）

| 变量 | 说明 |
|------|------|
| `APP_ENV` | 写入 `wrangler.jsonc` 各环境 `vars` |

当前无 secrets；若后续增加密钥，用 Wrangler secrets / `.dev.vars`（本地），不进 git。

## 文件布局

### web & admin

```
apps/web/
  .env.example              # 可提交
  .env.development          # gitignore，本地可跑
  .env.test                 # gitignore，占位符
  .env.production           # gitignore，占位符
  env.server.ts
  env.client.ts

apps/admin/                 # 镜像同上
```

取值约定：

- development：`API_BASE_URL=http://127.0.0.1:8787`（与 api `wrangler dev --port 8787` 一致）
- test：`https://api-test.example.com`
- production：`https://api.example.com`

Next.js 会按 `NODE_ENV` / 启动模式自动加载对应 `.env.*`；本地 `next dev` 使用 `.env.development`。

### api

```
apps/api/
  wrangler.jsonc            # vars.APP_ENV + env.test / env.production
  env.ts                    # zod 校验
  src/index.ts              # Hono<{ Bindings }>，从 c.env 校验/使用
  .dev.vars.example         # 可选；暂无 secret 时可仅写注释说明
```

`wrangler.jsonc` 已具备三环境 `APP_ENV`，保持并确保类型与 `getApiEnv` 一致。

## gitignore

根目录 `.gitignore`：

```gitignore
.env
.env.*
!.env.example
```

各 app：

- web / admin：与根一致（忽略 `.env*`，保留 `!.env.example`）；去掉会把 example 也忽略的裸 `.env*`
- api：忽略 `.env`、`.env.*`、`.dev.vars`；保留 `!.env.example`、`!.dev.vars.example`

## 校验与接线

### 依赖

web / admin / api 均声明 `zod`（建议走 pnpm catalog，若尚无则加入 catalog）。

### web / admin

- `env.server.ts`：校验 `APP_ENV`、`API_BASE_URL`
- `env.client.ts`：校验 `NEXT_PUBLIC_APP_ENV`、`NEXT_PUBLIC_API_BASE_URL`
- 启动时在服务端入口调用一次 `getServerEnv()`（优先 `instrumentation.ts`；若项目未开 instrumentation，则在 root `layout.tsx` 服务端调用）
- 客户端按需调用 `getClientEnv()`（首次需要读 public env 的模块里调用即可，避免在无客户端代码时强绑）

### api

```ts
const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use('*', async (c, next) => {
  getApiEnv(c.env); // 或挂到 c.set('env', ...)
  await next();
});

app.get('/health', (c) => {
  const env = getApiEnv(c.env);
  return c.json({ ok: true, service: 'api', appEnv: env.APP_ENV });
});
```

运行 `wrangler types` / 现有 `cf-typegen`，保证 `CloudflareBindings` 含 `APP_ENV`。

## Scripts

api `package.json`：

- `deploy`：默认（development vars 的 top-level deploy，或明确文档说明）
- `deploy:test`：`wrangler deploy --minify --env test`
- `deploy:production`：`wrangler deploy --minify --env production`

根 README 补充：

1. 复制各 app `.env.example` → `.env.development`
2. 端口：web 3005 / admin 3006 / api 8787
3. Worker 用 `c.env`，Next 用 `process.env`

## 明确不做

- 不抽 `@repo/env` 共享包（变量尚少）
- 不写入真实 test/production 域名或密钥
- 不改业务页面 UI / demo 样式
- 不把 `contracts` 纳入本轮 env 类型

## 验收标准

1. web / admin 存在三环境 `.env.*` + `.env.example`，真实文件被 gitignore
2. 本地 `pnpm dev:web` / `dev:admin` / `dev:api` 能读到 development 配置；web 指向 8787
3. api `/health`（或等价路径）能通过 `c.env` 反映 `APP_ENV`
4. 缺少必填变量时，zod parse 在启动或首请求失败，错误可读
5. README 有复制 example 与三环境说明
