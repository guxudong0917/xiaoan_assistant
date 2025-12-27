import express from 'express';
import {
  getMemoriesFromCloud,
  addMemoryToCloud,
  deleteMemory,
  clearMemoriesOnCloud,
  checkCloudStatus,
  type Memory
} from '../services/supabaseService.js';

const router = express.Router();

// 获取所有记忆
router.get('/', async (req, res) => {
  try {
    const memories = await getMemoriesFromCloud();
    res.json(memories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 添加记忆
router.post('/', async (req, res) => {
  try {
    const { title, description, type } = req.body;
    const memory = await addMemoryToCloud({ title, description, type });
    res.json(memory);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除记忆
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteMemory(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 清空所有记忆
router.delete('/', async (req, res) => {
  try {
    await clearMemoriesOnCloud();
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 检查云端状态
router.get('/status', async (req, res) => {
  try {
    const status = await checkCloudStatus();
    res.json({ available: status });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

