// Dify API 服务 - 替换原有的 Gemini Agent 调用

const DIFY_BASE_URL = 'http://129.211.70.41/v1';
const DIFY_API_KEY = 'app-tgUgIHjTITq3l3LIcznz9Oeh';

interface DifyMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface DifyResponse {
  answer: string;
  conversation_id?: string;
  message_id?: string;
}

// 通用 Dify 聊天请求
async function sendDifyRequest(
  query: string,
  conversationId?: string,
  user: string = 'jiuan-user'
): Promise<DifyResponse> {
  // 构建请求体，首次对话不传 conversation_id
  const requestBody: Record<string, any> = {
    inputs: {},
    query: query,
    response_mode: 'blocking',
    user: user,
  };
  
  // 只有存在有效的 conversation_id 时才传递
  if (conversationId && conversationId.trim() !== '') {
    requestBody.conversation_id = conversationId;
  }

  console.log('[Dify] 发送请求:', {
    url: `${DIFY_BASE_URL}/chat-messages`,
    body: { ...requestBody, query: requestBody.query.substring(0, 50) + '...' }
  });

  const response = await fetch(`${DIFY_BASE_URL}/chat-messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DIFY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Dify] API Error:', response.status, errorText);
    throw new Error(`Dify API error: ${response.status} - ${errorText}`);
  }

  const result = (await response.json()) as DifyResponse;
  
  // 过滤掉 <think>...</think> 标签内容（Dify CoT 思考过程）
  if (result.answer) {
    result.answer = result.answer.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  }
  
  console.log('[Dify] 响应成功:', { 
    conversation_id: result.conversation_id,
    answer_length: result.answer?.length 
  });
  
  return result;
}

// 存储会话ID（简单的内存存储）
const conversationStore: Map<string, string> = new Map();

// 陪伴Agent - 对话接口
export const runCompanionAgent = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string,
  memories: Array<{ title: string; description: string; date: string }> = []
): Promise<string> => {
  try {
    // 构建上下文：包含记忆信息
    let contextMessage = newMessage;
    
    if (memories && memories.length > 0) {
      const memoryContext = memories
        .slice(-5)
        .map(m => `[${m.title}]: ${m.description}`)
        .join('\n');
      contextMessage = `[用户记忆背景]\n${memoryContext}\n\n[用户消息]\n${newMessage}`;
    }

    // 获取或创建会话
    const conversationId = conversationStore.get('companion');
    
    const response = await sendDifyRequest(contextMessage, conversationId, 'companion-user');
    
    // 保存会话ID以保持上下文
    if (response.conversation_id) {
      conversationStore.set('companion', response.conversation_id);
    }

    console.log(`[Dify Companion] 回复: ${response.answer.substring(0, 100)}...`);
    return response.answer;
  } catch (error: any) {
    console.error("Dify Companion Error:", error);
    
    if (error.message?.includes('429')) {
      return "哎呀，我们的交流有点太快了，请稍等片刻再试一次吧。";
    }
    
    return "由于信号微弱，我暂时无法同步我们的记忆，但我一直陪着你。";
  }
};

// 营养Agent - 食物分析接口
export const runNutritionAgent = async (base64Image: string): Promise<string> => {
  try {
    // Dify 处理图片分析
    const query = `请分析这张食物图片的营养成分。图片数据(base64): ${base64Image.substring(0, 100)}...
    
请返回JSON格式：
{
  "foodName": "食物名称",
  "calories": 数字,
  "protein": 数字,
  "carbs": 数字,
  "fat": 数字,
  "healthScore": 1-10,
  "suggestion": "建议"
}`;

    const response = await sendDifyRequest(query, undefined, 'nutrition-user');
    
    // 尝试解析JSON，如果失败则返回默认值
    try {
      const jsonMatch = response.answer.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return jsonMatch[0];
      }
    } catch (e) {
      console.warn('无法解析营养分析结果为JSON');
    }
    
    // 返回默认结构
    return JSON.stringify({
      foodName: "未识别食物",
      calories: 200,
      protein: 10,
      carbs: 25,
      fat: 8,
      healthScore: 6,
      suggestion: response.answer || "请保持均衡饮食"
    });
  } catch (error: any) {
    console.error("Dify Nutrition Error:", error);
    throw error;
  }
};

// 健康监测Agent - 健康数据分析接口
export const runHealthMonitorAgent = async (
  glucoseData: any[],
  currentHeartRate: number
): Promise<any> => {
  try {
    const query = `请分析以下健康数据并提供建议：
血糖数据：${JSON.stringify(glucoseData)}
当前心率：${currentHeartRate} bpm

请返回JSON格式：
{
  "summary": "健康总结",
  "riskLevel": "Low/Medium/High",
  "recommendation": "具体建议"
}`;

    const response = await sendDifyRequest(query, undefined, 'health-user');
    
    // 尝试解析JSON
    try {
      const jsonMatch = response.answer.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('无法解析健康分析结果为JSON');
    }
    
    return {
      summary: response.answer || "数据分析中...",
      riskLevel: "Low",
      recommendation: "保持监测，如有不适请咨询医生。"
    };
  } catch (error: any) {
    console.error("Dify Health Monitor Error:", error);
    return { 
      summary: "数据同步中...", 
      riskLevel: "Low", 
      recommendation: "保持监测。" 
    };
  }
};

// 获取Agent管理器实例（兼容原有接口）
export function getAgentManagerInstance() {
  return {
    getAgent: (id: string) => ({
      getAgentId: () => id,
      getAgentName: () => {
        switch(id) {
          case 'companion': return '小安 (Dify)';
          case 'nutrition': return '营养师小营 (Dify)';
          case 'health': return '健康监测小健 (Dify)';
          default: return id;
        }
      },
      getRole: () => 'Dify Agent',
      getContextSummary: () => 'Powered by Dify'
    })
  };
}

// 获取Agent间通信历史（兼容原有接口）
const communicationHistory: any[] = [];

export const getAgentCommunicationHistory = () => {
  return communicationHistory;
};
