/**
 * Kimi API Service - 用于食物图片识别
 * 使用 moonshot-v1-8k-vision-preview 模型
 */

const KIMI_API_KEY = 'sk-NIKJoqBisniZcF1r21F5aDG8ThtZhqHfDU6tXf873pfE9omW';
const KIMI_BASE_URL = 'https://api.moonshot.cn/v1';

interface FoodAnalysisResult {
  foodName: string;
  giIndex: number;
  carbs: number;
  advice: string;
}

/**
 * 使用 Kimi Vision API 分析食物图片
 */
export async function analyzeImageWithKimi(base64Image: string): Promise<FoodAnalysisResult> {
  console.log('[Kimi] 开始分析食物图片...');
  
  const prompt = `你是一个专业的营养分析师。请分析这张食物图片，并返回以下 JSON 格式的数据（只返回 JSON，不要其他文字）：

{
  "foodName": "食物名称（中文）",
  "giIndex": 数字（升糖指数，0-100），
  "carbs": 数字（碳水化合物克数），
  "advice": "简短的饮食建议（中文，一句话）"
}

注意：
- GI 指数：低 GI < 55，中 GI 56-69，高 GI >= 70
- 请根据图片中的食物准确估算
- 如果无法识别，请给出合理的估计值`;

  try {
    const response = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KIMI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Kimi] API Error:', response.status, errorText);
      throw new Error(`Kimi API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json() as { choices?: { message?: { content?: string } }[] };
    console.log('[Kimi] 响应成功');
    
    const content = result.choices?.[0]?.message?.content || '';
    console.log('[Kimi] 原始响应:', content);
    
    // 解析 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return {
        foodName: data.foodName || '美味食物',
        giIndex: typeof data.giIndex === 'number' ? data.giIndex : 50,
        carbs: typeof data.carbs === 'number' ? data.carbs : 30,
        advice: data.advice || '均衡饮食，保持健康！'
      };
    }
    
    // 无法解析时返回默认值
    return {
      foodName: '美味食物',
      giIndex: 50,
      carbs: 30,
      advice: '均衡饮食，保持健康！'
    };
  } catch (error: any) {
    console.error('[Kimi] Error:', error.message);
    throw error;
  }
}
