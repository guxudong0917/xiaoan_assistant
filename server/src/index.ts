import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// 必须在导入其他模块之前加载环境变量
// 使用绝对路径确保能找到 .env 文件
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });
// 检查必要的环境变量
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('\n❌ 错误：缺少必要的环境变量！');
  console.error('\n📝 请执行以下步骤：');
  console.error('  1. 在 server 目录下创建 .env 文件');
  console.error('  2. 复制 .env.example 到 .env');
  console.error('  3. 填写 SUPABASE_URL 和 SUPABASE_ANON_KEY');
  console.error('  4. 填写 GEMINI_API_KEY\n');
  process.exit(1);
}

import memoriesRouter from './routes/memories.js';
import geminiRouter from './routes/gemini.js';

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// 显示当前配置（用于调试）
console.log(`📋 配置信息:`);
console.log(`   - 端口: ${PORT}`);
console.log(`   - Gemini API Key: ${process.env.GEMINI_API_KEY ? '✓ 已配置' : '✗ 未配置'}`);
console.log(`   - Supabase URL: ${process.env.SUPABASE_URL ? '✓ 已配置' : '✗ 未配置'}\n`);

// 中间件
// CORS 配置 - 允许前端访问
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// 添加请求日志（开发环境）
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
    next();
  });
}

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 路由
app.use('/api/memories', memoriesRouter);
app.use('/api/gemini', geminiRouter);

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 启动服务器
const server = app.listen(PORT, 'localhost', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🤖 Multi-Agent System initialized`);
  console.log(`   - GET /api/gemini/agents - List all agents`);
  console.log(`   - GET /api/gemini/communication-history - View agent collaboration`);
});

// 错误处理
server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ 错误：端口 ${PORT} 已被占用！`);
    console.error(`\n📝 解决方法：`);
    console.error(`  1. 关闭占用端口 ${PORT} 的其他程序`);
    console.error(`  2. 或者修改 .env 文件中的 PORT 为其他端口（如 3002）\n`);
  } else if (err.code === 'EACCES') {
    console.error(`\n❌ 错误：没有权限监听端口 ${PORT}！`);
    console.error(`\n📝 解决方法：`);
    console.error(`  1. 使用管理员权限运行（不推荐）`);
    console.error(`  2. 修改 .env 文件中的 PORT 为其他端口（如 3002）`);
    console.error(`  3. 检查防火墙设置\n`);
  } else {
    console.error('\n❌ 服务器启动失败:', err.message);
  }
  process.exit(1);
});

