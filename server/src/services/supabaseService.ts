import { createClient } from '@supabase/supabase-js';
// 使用本地类型定义（避免路径问题）
export interface Memory {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'milestone' | 'badge' | 'conversation';
  icon?: string;
}

// 延迟初始化，确保 dotenv 已经加载
function getSupabaseClient() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Missing Supabase environment variables!\n' +
      '请执行以下步骤：\n' +
      '  1. 在 server 目录下创建 .env 文件\n' +
      '  2. 复制 .env.example 到 .env\n' +
      '  3. 填写 SUPABASE_URL 和 SUPABASE_ANON_KEY\n' +
      '\n' +
      'You can copy .env.example to .env and fill in the values.'
    );
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// 延迟创建客户端，在首次使用时才检查
let _supabaseClient: any = null;

// 使用 Proxy 来延迟初始化，支持所有 Supabase 客户端的方法
export const supabase: any = new Proxy({}, {
  get(_target, prop) {
    if (!_supabaseClient) {
      _supabaseClient = getSupabaseClient();
    }
    const value = _supabaseClient[prop];
    // 如果是函数，需要绑定 this
    if (typeof value === 'function') {
      return value.bind(_supabaseClient);
    }
    return value;
  }
});

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
      return [];
    }

    const cloudData = (data || []).map((item: any): Memory => ({
      id: item.id?.toString(),
      date: item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      title: item.title,
      description: item.content,
      type: item.type as Memory['type'] || 'conversation',
    }));

    return cloudData;
  } catch (e) {
    console.error('Failed to fetch memories:', e);
    return [];
  }
};

export const addMemoryToCloud = async (memory: Partial<Memory>) => {
  const now = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from('memories')
      .insert([{
        title: memory.title || '健康动态',
        content: memory.description || '',
        type: memory.type || 'conversation',
        date: now
      }])
      .select();

    if (error) throw error;

    if (data && data.length > 0) {
      const item = data[0];
      return {
        id: item.id.toString(),
        date: now.split('T')[0],
        title: item.title,
        description: item.content,
        type: item.type as Memory['type'] || 'conversation'
      };
    }

    throw new Error('No data returned from insert');
  } catch (e: any) {
    console.error('写入异常:', e.message);
    throw e;
  }
};

export const deleteMemory = async (id: string) => {
  try {
    const { error } = await supabase.from('memories').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    console.error('云端删除失败', e);
    throw e;
  }
};

export const clearMemoriesOnCloud = async () => {
  try {
    const { error } = await supabase.from('memories').delete().not('id', 'is', null);
    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    console.error('云端清空失败', e);
    throw e;
  }
};

