# 后端 Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ai-engine/package.json ./packages/ai-engine/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY tsconfig.base.json ./
COPY apps/server ./apps/server
COPY packages/shared ./packages/shared
COPY packages/ai-engine ./packages/ai-engine

# 构建
RUN pnpm --filter @tongquetai/shared build
RUN pnpm --filter @tongquetai/ai-engine build
RUN pnpm --filter @tongquetai/server build

# 生产镜像
FROM node:20-alpine

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ai-engine/package.json ./packages/ai-engine/

# 安装生产依赖
RUN pnpm install --frozen-lockfile --prod

# 复制构建产物
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/ai-engine/dist ./packages/ai-engine/dist

# 创建上传目录
RUN mkdir -p /app/uploads

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "apps/server/dist/main.js"]
