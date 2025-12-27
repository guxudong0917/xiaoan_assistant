# 九安 AI 后端服务

Express + TypeScript 后端，集成 Dify、Kimi Vision 和 Supabase。

## 🚀 快速开始

```bash
npm install
npm run dev
```

服务器运行在 http://localhost:8080

## ⚙️ 环境变量

创建 `.env` 文件：

```env
PORT=8080
FRONTEND_URL=http://localhost:5173

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key

# Gemini（健康监测用）
GEMINI_API_KEY=your_gemini_key
GEMINI_BASE_URL=https://www.sophnet.com/api/open-apis/v1
```

## 📁 项目结构

```
src/
├── index.ts           # Express 入口
├── routes/
│   ├── gemini.ts      # AI 接口（对话、食物识别、健康监测）
│   └── memories.ts    # 记忆 CRUD
└── services/
    ├── difyService.ts     # Dify 对话 API
    ├── kimiService.ts     # Kimi Vision 食物识别
    └── supabaseService.ts # 数据库操作
```

## 🔧 API 接口

| 端点 | 方法 | 描述 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/api/gemini/chat` | POST | AI 对话 |
| `/api/gemini/analyze-food` | POST | 食物识别 |
| `/api/gemini/health-monitor` | POST | 健康监测 |
| `/api/memories` | GET/POST/DELETE | 记忆管理 |

## 📦 构建 & 部署

```bash
# 构建
npm run build

# 生产运行
npm start

# PM2 守护进程
pm2 start dist/index.js --name jiuan-server
```

