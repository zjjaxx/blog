## 官方文档
- [compose](https://docs.docker.com/compose/gettingstarted) 
- [postgres](https://hub.docker.com/_/postgres) 
- [pgvector](https://github.com/pgvector/pgvector#docker)
- [typeorm](https://typeorm.io/docs/getting-started)
- [nest部署](https://docs.nestjs.com/deployment)
## 数据库docker部署
### Dockerfile
```Dockerfile
# Use the official Node.js image as the base image
FROM node:24

# Set the working directory inside the container
WORKDIR /usr/src/app

# Enable pnpm via Corepack (ships with Node)
RUN corepack enable

# Copy package manifests for dependency install layer caching
COPY package.json pnpm-lock.yaml ./

# Install the application dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application files
COPY . .

# Build the NestJS application
RUN pnpm run build

# Expose the application port
EXPOSE 3000

# Command to run the application
CMD ["pnpm", "start:prod"]

```
::: tip
corepack enable 是 打开 Node 自带的包管理器开关，让容器里能直接用 pnpm / yarn，而不用先 npm i -g pnpm。

它是什么
Corepack 是 Node.js 官方附带的工具（Node 16.9+ 就有，你的 node:24 镜像里也有）。

默认是关着的：镜像里有 Corepack，但还不能当 pnpm 用。
执行一次：


RUN corepack enable
之后 shell 里就有 pnpm 命令了。
:::
优化镜像，体积更小版v2
```Dockerfile
# ── base：公共地基（Node slim + pnpm），供后续阶段复用 ──
FROM node:24-bookworm-slim AS base
WORKDIR /usr/src/app
RUN corepack enable

# ── deps：安装全量依赖（含 devDependencies），供编译使用 ──
# 只拷清单文件，改业务代码时这一层更容易命中缓存
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── build：拷源码并编译出 dist/ ──
FROM deps AS build
COPY . .
RUN pnpm run build

# ── prod-deps：只装生产依赖，体积更小、不含编译工具 ──
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# ── runner：最终上线镜像；只收 prod node_modules + dist ──
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY --from=prod-deps --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=build --chown=node:node /usr/src/app/dist ./dist
COPY --chown=node:node package.json ./

# 以非 root 用户运行
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]

```
### compose.base.yaml(开发用)
```yaml
services:
  db:
    image: pgvector/pgvector:pg18-trixie
    restart: always
    # set shared memory limit when using docker compose
    shm_size: 128mb
    ports:
      - "5432:5432" 
    volumes:
      # PG 18+：挂整棵 /var/lib/postgresql，数据会落到其子目录，方便日后 pg_upgrade --link
      - ${DB_DATA:-./db_data}:/var/lib/postgresql
      # 仅在数据目录首次初始化时执行,创建矢量扩展插件
      - ./init:/docker-entrypoint-initdb.d:ro
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_DB: ${DB_DATABASE}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$DB_USERNAME -d $$DB_DATABASE"]
      interval: 5s
      timeout: 3s
      retries: 5
      start_period: 10s
  adminer:
    image: adminer
    restart: always
    ports:
      - 8080:8080

```
` "docker:dev": "docker compose -f compose.base.yaml --env-file .env.development up -d",`
### compose.prod.yaml(覆盖，生产用)
```yaml
# 生产覆盖：docker compose -f compose.base.yaml -f compose.prod.yaml --env-file .env.production up -d
# 与 compose.base.yaml 合并：在共用 db 的基础上增加 server，并收紧生产暴露面
services:
  server:
    container_name: rag-server
    build: .
    # 异常退出自动重启；手动 docker stop 后不再自启（含 Docker 守护进程重启后）
    restart: unless-stopped
    # 宿主机 3008 → 容器内 3000（应用监听 PORT，生产一般为 3000）
    ports:
      - "3008:3000"
    env_file:
      - .env.production
    # 等 db healthcheck 通过后再启动，避免抢连未就绪的 Postgres
    depends_on:
      db:
        condition: service_healthy
    # 周期探测 /health；失败达 retries 次则标记 unhealthy
    healthcheck:
      test:
        [
          "CMD",
          "node",
          "-e",
          "fetch('http://127.0.0.1:3000/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))",
        ]
      interval: 10s      # 探测间隔
      timeout: 3s        # 单次探测超时
      retries: 5         # 连续失败次数后判 unhealthy
      start_period: 20s  # 启动宽限期，此间失败不计入 retries

  db:
    # 覆盖 base 里的 "5432:5432"：生产不把数据库端口暴露到宿主机
    ports: !reset []

  adminer:
    # 挂到不会默认启用的 profile，生产 up 时不启动管理界面
    profiles:
      - donotstart

```
`"docker:prod": "docker compose -f compose.base.yaml -f compose.prod.yaml --env-file .env.production up -d",`
### 数据库初始化脚本
创建矢量扩展
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```
### 设置环境变量
`.env.development`开发环境
```
NODE_ENV=development
PORT=3000

# Postgres（本地 / docker:dev 暴露到宿主机时用 localhost）
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=rag_agent
DB_SYNCHRONIZE=true
DB_DATA=./db_data
```
`.env.production`生产环境
```
NODE_ENV=production
PORT=3000

# Postgres（compose 网络内用服务名 db）
DB_HOST=db
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=rag_agent
DB_SYNCHRONIZE=false
DB_DATA=./db_data
```
### @nestjs/config配置 (生产禁止加载环境变量，统一使用容器的)
```ts
    ConfigModule.forRoot({
      isGlobal: true,
      // 按 NODE_ENV 加载；找不到时回退到 .env
      envFilePath: [
        `.env.${process.env.NODE_ENV ?? 'development'}`
      ],
      ignoreEnvFile: process.env.NODE_ENV === 'production', 
    }),
```
### 关键字字段ID用雪花ID
雪花 ID（Snowflake）是 Twitter 提出的 分布式唯一 ID：64 位整数，大致由「时间戳 + 机器号 + 序列号」拼成。
`1 bit 符号位 | 41 bit 时间戳 | 10 bit 机器/节点 | 12 bit 序列号`
相对自增 ID 的好处

1. 服务 A、服务 B 各连一个库 → 两边都能生成 id=1 → 合并/同步冲突
插入前不知道 ID，要等 DB 返回。雪花：应用层自己生成，插入前就有 ID,多实例只要机器号不冲突，全局唯一

2.  大体按时间有序（比 UUID 更友好）
UUID v4： a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
完全随机 → B-Tree 索引频繁页分裂 → 写入变慢、索引更碎
雪花： 高位是时间戳 → 新 ID 通常更大 → 插入接近追加写

3. 可比对、可排查（比纯随机 UUID 好懂）
从 ID 能反推出大致生成时间（解码时间戳位）。

4. 比自增更难猜（有一定防护价值）
自增： /documents/101 → 很容易猜 /documents/102 去扫别人的资源
雪花： 下一个 ID 不可预测（有时间 + 机器 + 序列）

5. 存储和传输比 UUID 字符串更省
UUID 字符串 36 字符 / 16 字节
雪花 bigint 8 字节


