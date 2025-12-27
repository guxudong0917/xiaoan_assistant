import { apiClient } from './apiClient';

export const sendCBTChatMessage = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string,
  memories?: any[]
): Promise<{ text: string; collaboration?: any[] }> => {
  try {
    const response = await apiClient.sendChatMessage(history, newMessage, memories);
    return {
      text: response.text,
      collaboration: undefined
    };
  } catch (error: any) {
    console.error("Chat API Error:", error);
    if (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')) {
      return {
        text: "哎呀，我们的交流有点太快了，我的思绪需要休息一分钟才能跟上你。请稍等片刻再试一次吧。",
        collaboration: undefined
      };
    }
    return {
      text: "由于信号微弱，我暂时无法同步我们的记忆，但我一直陪着你。",
      collaboration: undefined
    };
  }
};

export const analyzeFoodImage = async (base64Image: string): Promise<string> => {
  try {
    const response = await apiClient.analyzeFoodImage(base64Image);
    return response.result;
  } catch (error: any) {
    console.error("Food Analysis API Error:", error);
    throw error;
  }
};

export const runHealthMonitorAgent = async (
  glucoseData: any[],
  currentHeartRate: number
): Promise<any> => {
  try {
    return await apiClient.healthMonitor(glucoseData, currentHeartRate);
  } catch (error: any) {
    console.error("Health Monitor API Error:", error);
    return { summary: "数据同步中...", riskLevel: "Low", recommendation: "保持监测。" };
  }
};

// 保留向后兼容的导出
export const runCompanionAgent = sendCBTChatMessage;
export const runNutritionAgent = analyzeFoodImage;
