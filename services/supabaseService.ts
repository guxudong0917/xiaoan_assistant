import { createClient } from '@supabase/supabase-js';
import { Memory } from '../types';

const LOCAL_FALLBACK_KEY = 'jiuan_memories_fallback';

// 获取本地备份
export const getLocalMemories = (): Memory[] => {
  const saved = localStorage.getItem(LOCAL_FALLBACK_KEY);
  return saved ? JSON.parse(saved) : [];
};

// 全量更新本地缓存 (Cloud is Truth)
const updateLocalCache = (memories: Memory[]) => {
  localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify(memories.slice(0, 50)));
};

/**
 * 检查云端是否真正可用
 */
export const checkCloudStatus = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('memories').select('id', { count: 'exact', head: true });
    return !error;
  } catch {
    return false;
  }
};

export const getMemoriesFromCloud = async (): Promise<Memory[]> => {
  try {
    const { data, error } = await supabase
      .from('memories')
      .select('id, title, content, type, date') 
      .order('date', { ascending: false });

    if (error) {
      console.warn(`Supabase Sync Skipped:`, error.message);
      return getLocalMemories(); 
    }

    const cloudData = (data || []).map((item: any): Memory => ({
        id: item.id?.toString(),
        date: item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        title: item.title,
        description: item.content, 
        type: item.type as Memory['type'] || 'conversation',
    }));

    // 以云端数据为准，覆盖本地缓存
    updateLocalCache(cloudData);
    
    return cloudData;
  } catch (e) {
    return getLocalMemories();
  }
};

export const addMemoryToCloud = async (memory: Partial<Memory>) => {
  const now = new Date().toISOString();
  
  // 1. 生成临时 ID 用于即时 UI 反馈
  const tempId = 'temp_' + Date.now().toString(); 
  
  const localMem: Memory = {
    id: tempId, 
    date: now.split('T')[0],
    title: memory.title || '健康动态',
    description: memory.description || '',
    type: memory.type || 'conversation'
  };

  // 乐观更新：先显示在界面上
  const current = getLocalMemories();
  updateLocalCache([localMem, ...current]);
  window.dispatchEvent(new Event('storage'));

  try {
    // 2. 写入云端，并使用 .select() 立即获取回执
    const { data, error } = await supabase
      .from('memories')
      .insert([{
        title: localMem.title,
        content: localMem.description, 
        type: localMem.type,
        date: now
      }])
      .select(); // 关键：获取插入后的真实数据（包含 UUID）

    if (error) throw error;

    // 3. 偷梁换柱：用云端返回的真实 UUID 替换本地的临时 ID
    if (data && data.length > 0) {
      const realId = data[0].id.toString();
      
      const freshLocal = getLocalMemories();
      const fixedLocal = freshLocal.map(m => {
        // 找到刚才那个临时 ID，换成真的
        if (m.id === tempId) {
          return { ...m, id: realId };
        }
        return m;
      });
      
      updateLocalCache(fixedLocal);
      window.dispatchEvent(new Event('storage')); 
    }
  } catch (e: any) {
    console.error('写入异常:', e.message);
  }
};

/**
 * 删除单个记忆
 */
export const deleteMemory = async (id: string) => {
  // 1. 从本地删除 (Immediate)
  const localMemories = getLocalMemories().filter(m => m.id !== id);
  localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify(localMemories));

  // 2. 从云端删除 (Background)
  try {
    await supabase.from('memories').delete().eq('id', id);
  } catch (e) {
    console.error('云端删除失败', e);
  }
};

/**
 * 一键清空所有记忆
 */
export const clearMemoriesOnCloud = async () => {
  // 1. 本地清空 (Immediate)
  localStorage.removeItem(LOCAL_FALLBACK_KEY);
  window.dispatchEvent(new Event('storage'));

  // 2. 云端清空
  try {
    await supabase.from('memories').delete().not('id', 'is', null);
  } catch (e) {
    console.error('云端清空失败', e);
  }
};
