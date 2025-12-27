import express from 'express';
import {
  runCompanionAgent,
  runHealthMonitorAgent,
  getAgentCommunicationHistory
} from '../services/difyService.js';
import { analyzeImageWithKimi } from '../services/kimiService.js';

const router = express.Router();

// 获取Agent通信历史（用于调试和展示协作过程）
router.get('/communication-history', async (req, res) => {
  try {
    const history = getAgentCommunicationHistory();
    res.json({ history });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取所有Agent的状态信息
router.get('/agents', async (req, res) => {
  try {
    const { getAgentManagerInstance } = await import('../services/difyService.js');
    const manager = getAgentManagerInstance();
    
    const agents = [];
    const agentIds = ['companion', 'nutrition', 'health'];
    
    for (const agentId of agentIds) {
      const agent = manager.getAgent(agentId);
      if (agent) {
        agents.push({
          id: agent.getAgentId(),
          name: agent.getAgentName(),
          role: agent.getRole(),
          contextSummary: agent.getContextSummary()
        });
      }
    }
    
    res.json({ agents });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// CBT 对话接口（Companion Agent）
router.post('/chat', async (req, res) => {
  try {
    const { history, message, memories } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log(`[API] Companion Agent processing message from user`);
    
    const response = await runCompanionAgent(
      history || [],
      message,
      memories || []
    );
    
    console.log(`[API] Companion Agent 返回回复，长度: ${response?.length || 0} 字符`);
    
    // 确保有有效回复
    if (!response || response.trim() === '') {
      console.error('⚠️ Companion Agent 返回了空回复！');
      throw new Error('Agent返回了空回复');
    }
    
    // 获取最近的Agent通信记录（展示协作过程）
    const communicationLog = getAgentCommunicationHistory().slice(-5);
    
    console.log(`[API] 返回给前端:`, {
      textLength: response.length,
      collaborationCount: communicationLog.length
    });
    
    res.json({ 
      text: response,
      agentCollaboration: communicationLog.length > 0 ? communicationLog : undefined
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message || 'Chat service error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 食物分析接口（使用 Kimi Vision API）
router.post('/analyze-food', async (req, res) => {
  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    console.log(`[API] 使用 Kimi Vision API 分析食物图片`);
    
    // 使用 Kimi API 进行食物识别
    const result = await analyzeImageWithKimi(image);
    
    res.json({ result });
  } catch (error: any) {
    console.error('Food analysis error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message || 'Food analysis error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 健康监测接口（Health Monitor Agent）
router.post('/health-monitor', async (req, res) => {
  try {
    const { glucoseData, currentHeartRate } = req.body;
    
    if (!glucoseData || currentHeartRate === undefined) {
      return res.status(400).json({ error: 'glucoseData and currentHeartRate are required' });
    }

    console.log(`[API] Health Monitor Agent analyzing health data`);
    
    const result = await runHealthMonitorAgent(glucoseData, currentHeartRate);
    
    // 获取最近的Agent通信记录（展示协作过程）
    const communicationLog = getAgentCommunicationHistory().slice(-3);
    
    res.json({
      ...result,
      agentCollaboration: communicationLog.length > 0 ? communicationLog : undefined
    });
  } catch (error: any) {
    console.error('Health monitor error:', error);
    res.status(500).json({ error: error.message || 'Health monitor error' });
  }
});

export default router;

