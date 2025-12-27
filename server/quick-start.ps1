# 快速启动脚本
Write-Host "🚀 检查并启动后端服务器..." -ForegroundColor Cyan
Write-Host ""

# 检查 .env 文件
if (!(Test-Path .env)) {
    Write-Host "❌ .env 文件不存在，正在创建..." -ForegroundColor Red
    $envContent = @"
PORT=8080
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

SUPABASE_URL=https://elamluervbzfbxcmmtju.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsYW1sdWVydmJ6ZmJ4Y21tdGp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NjkwODIsImV4cCI6MjA4MjM0NTA4Mn0.LwEU1laM2FGmwnJKSNe7k2XVoA5SMoUaasZzVvHBDl8

# Gemini API 配置（SophNet OpenAI兼容接口）
GEMINI_API_KEY=EBSVWjCV59fPU_pin71A_kMRyB5RDCokm-7TfhIVyQnG5cZtNPJgyEwPryscdJsdyXGAfv67ha0VP3Q4gREe3w
GEMINI_BASE_URL=https://www.sophnet.com/api/open-apis/v1
GEMINI_MODEL=gemini-3-pro-preview
"@
    $envContent | Out-File -FilePath .env -Encoding utf8 -NoNewline
    Write-Host "✅ .env 文件已创建" -ForegroundColor Green
} else {
    Write-Host "✅ .env 文件已存在" -ForegroundColor Green
}

# 检查 node_modules
if (!(Test-Path node_modules)) {
    Write-Host "📦 安装依赖..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "🚀 启动服务器..." -ForegroundColor Cyan
Write-Host "   访问地址: http://localhost:8080" -ForegroundColor Yellow
Write-Host "   健康检查: http://localhost:8080/health" -ForegroundColor Yellow
Write-Host ""

npm run dev
