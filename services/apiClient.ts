const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://47.95.38.64:8080/api';

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      console.log(`[API] 请求: ${url}`);
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      // 更详细的错误信息
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        console.error(`❌ API 请求失败: ${endpoint}`);
        console.error(`   请求 URL: ${url}`);
        console.error(`   可能原因:`);
        console.error(`   1. 后端服务器未启动 (请检查 http://localhost:3002/health)`);
        console.error(`   2. 端口不匹配 (前端期望: 3002)`);
        console.error(`   3. CORS 配置问题`);
        console.error(`   4. 网络连接问题`);
        throw new Error(`无法连接到后端服务器。请确保后端服务器正在运行在 http://localhost:3002`);
      }
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Memories API
  async getMemories() {
    return this.request<any[]>('/memories');
  }

  async addMemory(memory: { title?: string; description?: string; type?: string }) {
    return this.request<any>('/memories', {
      method: 'POST',
      body: JSON.stringify(memory),
    });
  }

  async deleteMemory(id: string) {
    return this.request<{ success: boolean }>(`/memories/${id}`, {
      method: 'DELETE',
    });
  }

  async clearMemories() {
    return this.request<{ success: boolean }>('/memories', {
      method: 'DELETE',
    });
  }

  async checkCloudStatus() {
    return this.request<{ available: boolean }>('/memories/status');
  }

  // Gemini API
  async sendChatMessage(history: any[], message: string, memories: any[] = []) {
    return this.request<{ text: string }>('/gemini/chat', {
      method: 'POST',
      body: JSON.stringify({ history, message, memories }),
    });
  }

  async analyzeFoodImage(base64Image: string) {
    return this.request<{ result: string }>('/gemini/analyze-food', {
      method: 'POST',
      body: JSON.stringify({ image: base64Image }),
    });
  }

  async healthMonitor(glucoseData: any[], currentHeartRate: number) {
    return this.request<any>('/gemini/health-monitor', {
      method: 'POST',
      body: JSON.stringify({ glucoseData, currentHeartRate }),
    });
  }

  // Agent系统查询
  async getAgents() {
    return this.request<{ agents: any[] }>('/gemini/agents');
  }

  async getCommunicationHistory() {
    return this.request<{ history: any[] }>('/gemini/communication-history');
  }
}

export const apiClient = new ApiClient();

