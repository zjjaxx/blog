## 官方文档
[compose](https://docs.docker.com/compose/gettingstarted) 
[postgres](https://hub.docker.com/_/postgres) 
[pgvector](https://github.com/pgvector/pgvector#docker)
[typeorm](https://typeorm.io/docs/getting-started)
[nest部署](https://docs.nestjs.com/deployment)
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
### compose.base.yaml(开发用)
```yaml
# Use postgres/example user/password credentials
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
      - postgres_data:/var/lib/postgresql
      # 仅在数据目录首次初始化时执行
      - ./init:/docker-entrypoint-initdb.d:ro
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_DB: ${POSTGRES_DB}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 5s
      timeout: 3s
      retries: 5
      start_period: 10s
  adminer:
    image: adminer
    restart: always
    ports:
      - 8080:8080
volumes:
  postgres_data:
```
` "docker:dev": "docker compose -f compose.base.yaml --env-file .env.development up -d",`
### compose.prod.yaml(覆盖，生产用)
```yaml
services:
  rag:
    container_name: rag-service
    build: .
    ports:
      - "3008:3000"
    env_file:
      - .env.production
    depends_on:
      db:
        condition: service_healthy
  db:
    # 生产一般不把数据库端口暴露到宿主机
    ports: !reset []

  adminer:
    # 生产不启管理界面
    profiles:
      - donotstart

```
`"docker:prod": "docker compose -f compose.base.yaml -f compose.prod.yaml --env-file .env.production up -d",`

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


