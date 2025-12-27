#!/bin/bash

# 九安 AI 一键部署脚本
# 在阿里云服务器上执行此脚本

set -e

echo "🚀 开始部署九安 AI..."

# 1. 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "📦 安装 Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl start docker
    systemctl enable docker
fi

# 2. 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "📦 安装 Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 3. 克隆或更新代码
if [ -d "xiaoan_assistant" ]; then
    echo "📥 更新代码..."
    cd xiaoan_assistant
    git pull
else
    echo "📥 克隆代码..."
    git clone https://github.com/guxudong0917/xiaoan_assistant.git
    cd xiaoan_assistant
fi

# 4. 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "⚠️  请先配置 .env 文件！"
    echo "📝 复制 .env.example 并填入实际值："
    echo ""
    echo "   cp .env.example .env"
    echo "   nano .env"
    echo ""
    exit 1
fi

# 5. 构建并启动
echo "🔨 构建 Docker 镜像..."
docker-compose build

echo "🚀 启动服务..."
docker-compose up -d

echo ""
echo "✅ 部署完成！"
echo ""
echo "📍 访问地址："
echo "   - 前端: http://$(curl -s ifconfig.me)"
echo "   - 后端: http://$(curl -s ifconfig.me):8080"
echo ""
echo "📋 常用命令："
echo "   - 查看日志: docker-compose logs -f"
echo "   - 停止服务: docker-compose down"
echo "   - 重启服务: docker-compose restart"
