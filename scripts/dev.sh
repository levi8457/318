#!/bin/bash
# 铜雀台 AI Agent 开发启动脚本

echo "🚀 启动铜雀台 AI Agent 开发环境..."

# 启动后端
echo "📦 启动 NestJS 后端 (port 3000)..."
cd "$(dirname "$0")/../apps/server"
npx nest start --watch &
SERVER_PID=$!

# 启动前端
echo "🎨 启动 Vue3 前端 (port 5173)..."
cd "$(dirname "$0")/../apps/web"
npx vite &
WEB_PID=$!

echo "✅ 服务已启动:"
echo "   后端: http://localhost:3000"
echo "   前端: http://localhost:5173"
echo "   API文档: http://localhost:3000/api/docs"

# 等待退出
trap "kill $SERVER_PID $WEB_PID; exit" SIGINT SIGTERM
wait
