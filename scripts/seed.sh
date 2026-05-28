#!/bin/bash
# 铜雀台 AI Agent 数据库初始化与种子数据脚本

echo "📊 初始化 PostgreSQL 数据库..."

DB_NAME="${DB_DATABASE:-tongquetai}"
DB_USER="${DB_USERNAME:-postgres}"

# 创建数据库
psql -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "数据库已存在，跳过创建"

# 运行初始化 SQL
psql -U "$DB_USER" -d "$DB_NAME" -f "$(dirname "$0")/../database/init.sql"

echo "✅ 数据库初始化完成"
echo "   默认管理员: admin / admin123456"
