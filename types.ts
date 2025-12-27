export enum AppView {
  DASHBOARD = 'DASHBOARD',
  CHAT = 'CHAT',
  NUTRITION = 'NUTRITION'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface FoodAnalysis {
  foodName: string;
  giIndex: number;
  carbs: number;
  advice: string;
}

export interface FoodLog extends FoodAnalysis {
  id: string;
  timestamp: Date;
  image?: string; // base64 图片数据
}

export interface Memory {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'milestone' | 'badge' | 'conversation';
  icon?: string;
}