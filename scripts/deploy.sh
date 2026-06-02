#!/bin/bash

# 铜雀台医美 AI 智能管家 - 生产环境部署脚本

set -e

echo "🚀 开始部署铜雀台医美 AI 智能管家..."

# 检查 .env.production 是否存在
if [ ! -f .env.production ]; then
    echo "❌ 错误：.env.production 文件不存在"
    echo "请复制 .env.production.example 并修改配置"
    exit 1
fi

# 检查必要的环境变量
source .env.production

if [ "$JWT_SECRET" = "CHANGE_ME_RANDOM_SECRET_KEY_AT_LEAST_32_CHARS" ]; then
    echo "❌ 错误：请修改 JWT_SECRET 环境变量"
    exit 1
fi

if [ "$DB_PASSWORD" = "CHANGE_ME_STRONG_PASSWORD" ]; then
    echo "❌ 错误：请修改 DB_PASSWORD 环境变量"
    exit 1
fi

if [ "$ENCRYPTION_KEY" = "CHANGE_ME_32_CHARS_ENCRYPTION_KEY" ]; then
    echo "❌ 错误：请修改 ENCRYPTION_KEY 环境变量"
    exit 1
fi

# 停止旧容器
echo "🛑 停止旧容器..."
docker-compose down

# 拉取最新镜像
echo "📥 拉取最新镜像..."
docker-compose pull

# 构建镜像
echo "🔨 构建镜像..."
docker-compose build

# 启动服务
echo "🚀 启动服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "📊 检查服务状态..."
docker-compose ps

# 运行数据库迁移
echo "🗄️ 运行数据库迁移..."
docker-compose exec server pnpm run migration:run

echo ""
echo "✅ 部署完成！"
echo ""
echo "前端访问地址: http://localhost"
echo "后端 API 地址: http://localhost:3000"
echo ""
echo "默认管理员账号: admin"
echo "请立即登录并修改默认密码！"
