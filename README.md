# 九安 AI - 智能健康伴侣

基于 AI 的健康管理应用，提供智能对话、食物识别和健康监测功能。

## ✨ 功能特性

- 💬 **AI 对话** - 基于 Dify 的智能对话，提供健康咨询和情感陪伴
- 📸 **食物识别** - 使用 Kimi Vision API 拍照识别食物，分析 GI 值和营养成分
- 🏥 **健康监测** - 实时血糖和心率监测，AI 风险评估
- 💾 **云端记忆** - Supabase 存储，实现个性化关怀

---

## 📁 项目结构

```
├── components/          # React 组件
│   ├── Chat.tsx         # AI 对话页面
│   ├── Dashboard.tsx    # 健康仪表盘
│   ├── NavBar.tsx       # 底部导航栏
│   └── Nutrition.tsx    # 食物识别页面
├── services/            # 前端服务
│   ├── apiClient.ts     # API 客户端
│   ├── geminiService.ts # AI 服务封装
│   └── supabaseService.ts # 记忆服务
├── server/              # 后端服务
│   └── src/
│       ├── index.ts     # Express 入口
│       ├── routes/      # API 路由
│       │   ├── gemini.ts    # AI 相关接口
│       │   └── memories.ts  # 记忆接口
│       └── services/    # 后端服务
│           ├── difyService.ts    # Dify API
│           ├── kimiService.ts    # Kimi Vision API
│           └── supabaseService.ts # 数据库
├── App.tsx              # 主应用组件
├── types.ts             # TypeScript 类型定义
└── index.tsx            # 应用入口
```

---

## 🚀 快速开始

### 1. 安装依赖

```bash
# 前端
npm install

# 后端
cd server
npm install
```

### 2. 配置环境变量

创建 `server/.env` 文件：

```env
PORT=8080
FRONTEND_URL=http://localhost:5173

# Supabase 配置
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key

# Gemini API（可选，用于健康监测）
GEMINI_API_KEY=your_gemini_key
GEMINI_BASE_URL=https://www.sophnet.com/api/open-apis/v1
```

### 3. 启动开发服务器

```bash
# 终端 1：启动后端
cd server
npm run dev

# 终端 2：启动前端
npm run dev
```

- 前端：http://localhost:5173
- 后端：http://localhost:8080

---

## 🌐 部署指南

### 前端部署（Vercel / Netlify）

1. **构建前端**：
```bash
npm run build
```

2. **部署到 Vercel**：
```bash
npm i -g vercel
vercel
```

3. **配置环境变量**：
在 Vercel 控制台添加：
```
VITE_API_BASE_URL=https://your-backend-url.com/api
```

### 后端部署

#### 方式一：部署到云服务器

1. **上传代码到服务器**

2. **安装依赖并构建**：
```bash
cd server
npm install
npm run build
```

3. **配置环境变量**（创建 `.env` 文件）

4. **使用 PM2 运行**：
```bash
npm i -g pm2
pm2 start dist/index.js --name jiuan-server
pm2 save
pm2 startup
```

5. **配置 Nginx 反向代理**：
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

6. **配置 HTTPS**（推荐）：
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

#### 方式二：部署到 Railway / Render

1. 连接 GitHub 仓库
2. 设置根目录为 `server`
3. 配置环境变量
4. 自动部署

### 更新前端 API 地址

部署后端后，更新前端的 API 地址：

**方式一**：环境变量
```bash
# .env.local
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

**方式二**：直接修改代码
```typescript
// services/apiClient.ts
const API_BASE_URL = 'https://api.yourdomain.com/api';
```

---

## 🔧 API 接口

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/gemini/chat` | POST | AI 对话 |
| `/api/gemini/analyze-food` | POST | 食物图片识别 |
| `/api/gemini/health-monitor` | POST | 健康监测分析 |
| `/api/memories` | GET | 获取所有记忆 |
| `/api/memories` | POST | 添加记忆 |
| `/api/memories/:id` | DELETE | 删除记忆 |
| `/health` | GET | 健康检查 |

---

## 🛠 技术栈

| 前端 | 后端 |
|------|------|
| React 19 | Node.js + Express |
| TypeScript | TypeScript |
| Vite | Supabase |
| Tailwind CSS | Dify API |
| Framer Motion | Kimi Vision API |

---

## 📝 许可证

MIT
