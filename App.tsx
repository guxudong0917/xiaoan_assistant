import React, { useState, useEffect } from 'react';
import { AppView, Message, Memory, FoodLog, FoodAnalysis } from './types';
import NavBar from './components/NavBar';
import Dashboard from './components/Dashboard';
import Chat from './components/Chat';
import Nutrition from './components/Nutrition';
import { sendCBTChatMessage } from './services/geminiService';
import { getMemoriesFromCloud, addMemoryToCloud, clearMemoriesOnCloud, getLocalMemories, deleteMemory } from './services/supabaseService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);

  // 1. 初始化加载
  useEffect(() => {
    const savedChat = localStorage.getItem('jiuan_chat_history');
    if (savedChat) {
      setMessages(JSON.parse(savedChat).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
    } else {
      setMessages([{ id: '1', role: 'model', text: '你好，我是九安。很高兴能陪伴你，我们可以聊聊你的近况，或者记录一下今天的健康数据。', timestamp: new Date() }]);
    }

    const loadInitialData = async () => {
      const local = getLocalMemories();
      setMemories(local);
      try {
        const cloudMemories = await getMemoriesFromCloud();
        if (cloudMemories && cloudMemories.length > 0) {
          setMemories(cloudMemories);
        }
      } catch (err) {
        console.warn('云端同步暂不可用');
      }
    };
    loadInitialData();

    const savedLogs = localStorage.getItem('jiuan_food_logs');
    if (savedLogs) {
      setFoodLogs(JSON.parse(savedLogs).map((l: any) => ({ ...l, timestamp: new Date(l.timestamp) })));
    }
  }, []);

  // 2. 监听同步
  useEffect(() => {
    const handleSync = async () => {
      const updated = await getMemoriesFromCloud();
      setMemories(updated);
    };
    window.addEventListener('storage', handleSync);
    return () => window.removeEventListener('storage', handleSync);
  }, []);

  const updateOrAddMemory = async (title: string, description: string, type: Memory['type']) => {
    try {
      await addMemoryToCloud({ title, description, type });
      const updated = await getMemoriesFromCloud();
      setMemories(updated);
    } catch (err) {
      console.error('保存失败:', err);
    }
  };

  // 核心逻辑：智能记忆提取
  const saveToMemoriesLogic = (userText: string, aiText: string) => {
    // 1. 个人基本信息
    if (/(我叫|名字是|叫我|我是)(.*)/.test(userText) || userText.includes('岁') || userText.includes('职业') || userText.includes('工作')) {
      updateOrAddMemory('基本信息', userText, 'milestone');
      return;
    }
    
    // 2. 健康历史与症状
    const healthKeywords = ['血糖', '心率', '病', '疼', '不舒服', '过敏', '医生', '药', '手术', '诊断'];
    if (healthKeywords.some(k => userText.includes(k)) && userText.length > 5) {
      updateOrAddMemory('健康状况', userText, 'milestone');
      return;
    }

    // 3. 生活习惯与偏好
    const habitKeywords = ['吃', '饭', '熬夜', '睡', '运动', '跑步', '健身', '烟', '酒', '重口味', '清淡'];
    if (habitKeywords.some(k => userText.includes(k)) && userText.length > 8) {
      updateOrAddMemory('生活习惯', userText, 'conversation');
      return;
    }

    // 4. 情感波动 (CBT重点)
    const emotionKeywords = ['难过', '焦虑', '压力', '绝望', '开心', '兴奋', '烦', '累', '想哭'];
    if (emotionKeywords.some(k => userText.includes(k))) {
      updateOrAddMemory('心境时刻', userText, 'badge');
      return;
    }
  };

  const addFoodLog = (analysis: FoodAnalysis, image?: string) => {
    const newLog: FoodLog = { ...analysis, id: Date.now().toString(), timestamp: new Date(), image };
    const updatedLogs = [newLog, ...foodLogs].slice(0, 100);
    setFoodLogs(updatedLogs);
    localStorage.setItem('jiuan_food_logs', JSON.stringify(updatedLogs));
    updateOrAddMemory('饮食分析', `记录了：${analysis.foodName}`, 'conversation');
  };

  const deleteFoodLog = (id: string) => {
    const updatedLogs = foodLogs.filter(log => log.id !== id);
    setFoodLogs(updatedLogs);
    localStorage.setItem('jiuan_food_logs', JSON.stringify(updatedLogs));
  };

  const clearAllFoodLogs = () => {
    setFoodLogs([]);
    localStorage.removeItem('jiuan_food_logs');
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text, timestamp: new Date() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    localStorage.setItem('jiuan_chat_history', JSON.stringify(newMessages));
    
    setIsLoading(true);
    try {
      const history = newMessages.slice(-10).map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      // 传递 memories 给后端 agent
      const response = await sendCBTChatMessage(history, text, memories);
      const responseText = typeof response === 'string' ? response : response.text;
      
      // 调试：检查响应
      console.log('📨 收到Agent回复:', responseText);
      console.log('📨 响应类型:', typeof response);
      
      // 如果有Agent协作信息，记录到控制台
      if (response.collaboration && response.collaboration.length > 0) {
        console.log('🤖 Agent协作日志:', response.collaboration);
      }
      
      // 确保有有效的回复文本
      if (!responseText || responseText.trim() === '') {
        console.error('⚠️ Agent返回了空回复！');
        throw new Error('Agent返回了空回复');
      }
      
      const modelMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: new Date() };
      const finalMessages = [...newMessages, modelMsg];
      setMessages(finalMessages);
      localStorage.setItem('jiuan_chat_history', JSON.stringify(finalMessages));
      
      // 触发智能提取逻辑
      saveToMemoriesLogic(text, responseText);
    } catch (error) {
      console.error("对话错误:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMemories = async () => {
    // 乐观更新：立即清空 UI
    setMemories([]);
    // 后台清空数据
    await clearMemoriesOnCloud();
  };

  const handleDeleteMemory = async (id: string) => {
    // 乐观更新 UI：先从列表中移除，再后台请求
    setMemories(prev => prev.filter(m => m.id !== id));
    await deleteMemory(id);
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD: return <Dashboard />;
      case AppView.CHAT: return <Chat messages={messages} isLoading={isLoading} onSendMessage={handleSendMessage} onClearHistory={() => { setMessages([]); localStorage.removeItem('jiuan_chat_history'); }} />;
      case AppView.NUTRITION: return <Nutrition foodLogs={foodLogs} onAddLog={addFoodLog} onDeleteLog={deleteFoodLog} onClearAll={clearAllFoodLogs} />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="w-full h-full min-h-screen bg-creamy-50 font-sans text-gray-800">
      <main className="h-full">{renderView()}</main>
      <NavBar currentView={currentView} setView={setCurrentView} />
    </div>
  );
};

export default App;