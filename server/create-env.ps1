# 创建 .env 文件的 PowerShell 脚本
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

$envPath = Join-Path $PSScriptRoot ".env"
$envContent | Out-File -FilePath $envPath -Encoding utf8 -NoNewline

Write-Host "✅ .env 文件已创建！" -ForegroundColor Green
Write-Host "📋 配置内容：" -ForegroundColor Cyan
Write-Host "   - 端口: 8080" -ForegroundColor Yellow
Write-Host "   - Gemini API Key: 已配置" -ForegroundColor Yellow
Write-Host "   - Gemini Base URL: https://www.sophnet.com/api/open-apis/v1" -ForegroundColor Yellow
Write-Host "   - Gemini Model: gemini-3-pro-preview" -ForegroundColor Yellow
Write-Host "   - Supabase: 已配置" -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 现在可以运行: npm install 然后 npm run dev" -ForegroundColor Green
