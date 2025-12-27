import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Heart, Droplets, Zap, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { runHealthMonitorAgent } from '../services/geminiService';

const data = [
  { time: '6:00', gl: 5.2 },
  { time: '8:00', gl: 7.8 }, // Post breakfast
  { time: '10:00', gl: 6.5 },
  { time: '12:00', gl: 5.8 },
  { time: '14:00', gl: 7.2 }, // Post lunch
  { time: '16:00', gl: 6.1 },
  { time: '18:00', gl: 5.9 },
];

const Dashboard: React.FC = () => {
  const [heartRate, setHeartRate] = useState(72);
  const [aiInsight, setAiInsight] = useState<{ summary: string; riskLevel: string; recommendation: string } | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(true);

  // Simulate rPPG heart rate fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setHeartRate(prev => prev + (Math.random() > 0.5 ? 1 : -1));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // AGENT INTEGRATION: Call Health Monitor Agent
  useEffect(() => {
    const fetchHealthInsight = async () => {
      // Small delay to simulate "Thinking" feel
      setTimeout(async () => {
        const insight = await runHealthMonitorAgent(data, 72);
        setAiInsight(insight);
        setLoadingInsight(false);
      }, 1500);
    };

    fetchHealthInsight();
  }, []);

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-creamy-50 px-6 pt-14 pb-32 space-y-8 no-scrollbar">
      
      {/* Header with Agent Insight */}
      <header className="flex justify-between items-start mb-2">
        <div className="flex-1 pr-4">
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">早上好，安</h1>
          
          <AnimatePresence mode="wait">
            {loadingInsight ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 mt-2"
              >
                <Sparkles size={14} className="text-warm-400 animate-spin" />
                <span className="text-sm font-semibold text-gray-400">AI 正在分析您的健康数据...</span>
              </motion.div>
            ) : (
              <motion.div 
                key="content"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1"
              >
                <p className="text-sm font-bold text-warm-600 leading-relaxed">
                   {aiInsight?.summary}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="w-12 h-12 rounded-full bg-warm-100 border-2 border-white shadow-soft flex items-center justify-center text-warm-600 font-bold text-lg shrink-0">
          A
        </div>
      </header>

      {/* Feature 1.2: Glucose Trend Chart (Priority Card) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-card p-8 shadow-soft border border-white"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-creamy-100 rounded-2xl text-warm-500">
              <Droplets size={22} fill="currentColor" className="text-warm-500" />
            </div>
            <div>
               <h3 className="font-bold text-lg text-gray-800">血糖趋势</h3>
               <p className="text-xs font-semibold text-gray-400">近12小时平稳曲线</p>
            </div>
          </div>
          <div className="text-right">
             <span className="block text-2xl font-extrabold text-gray-800">5.9</span>
             <span className="text-xs text-warm-500 font-bold bg-warm-100 px-2 py-1 rounded-full">Normal</span>
          </div>
        </div>
        
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorGl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF8C60" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#FF8C60" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#9CA3AF', fontSize: 10, fontWeight: 600}} 
                dy={10}
              />
              <YAxis domain={[4, 10]} hide />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(255,140,96,0.15)', fontFamily: 'Nunito' }}
                itemStyle={{ color: '#FF8C60', fontWeight: 'bold' }}
                cursor={{ stroke: '#FF8C60', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area 
                type="natural" 
                dataKey="gl" 
                stroke="#FF8C60" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorGl)" 
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Row for Heart Rate & Risk */}
      <div className="grid grid-cols-2 gap-5">
        
        {/* Feature 1.1: rPPG Monitor Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-card p-5 shadow-soft border border-white flex flex-col justify-between overflow-hidden relative"
        >
          <div className="flex items-center gap-2 mb-3 z-10">
            <div className="p-2 bg-red-50 rounded-xl text-red-400">
              <Heart size={18} className="fill-current animate-pulse" />
            </div>
            <span className="font-bold text-gray-700 text-sm">心率</span>
          </div>

          <div className="z-10 mb-2">
            <span className="text-4xl font-black text-gray-800 tracking-tight">{heartRate}</span>
            <span className="text-xs font-bold text-gray-400 ml-1">BPM</span>
          </div>

          {/* Camera Feed Placeholder with Scanning Animation */}
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-900 shadow-inner">
             <video 
               className="w-full h-full object-cover opacity-80"
               autoPlay muted loop playsInline
             >
               <source src="https://assets.mixkit.co/videos/preview/mixkit-red-abstract-background-loop-2591-large.mp4" type="video/mp4" />
             </video>
             
             {/* Scanning Line Animation */}
             <motion.div 
               className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_15px_rgba(255,255,255,0.8)] z-20"
               animate={{ top: ['0%', '100%', '0%'] }}
               transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
             />
             
             {/* Scanning Overlay Grid */}
             <div className="absolute inset-0 z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
             
             <div className="absolute bottom-2 left-0 right-0 text-center">
                <span className="text-[10px] font-bold text-white/90 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full">rPPG Active</span>
             </div>
          </div>
        </motion.div>

        {/* Feature 1.3: Risk Prediction Card (Agent Powered) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-b from-warm-100 to-white rounded-card p-5 shadow-soft border border-warm-100 flex flex-col justify-between"
        >
           <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-warm-200 rounded-xl text-warm-600">
              <Zap size={18} fill="currentColor" />
            </div>
            <span className="font-bold text-gray-700 text-sm">预测</span>
          </div>

          <div className="flex-1 flex flex-col justify-center">
             <h4 className="text-sm font-bold text-gray-500 mb-1">风险评估</h4>
             <AnimatePresence mode="wait">
                {loadingInsight ? (
                     <motion.div 
                        key="load" 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        className="h-8 w-16 bg-warm-200/50 rounded animate-pulse"
                     />
                ) : (
                    <motion.p 
                        key="val"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-2xl font-black text-warm-500"
                    >
                        {aiInsight?.riskLevel === 'Low' ? '极低' : aiInsight?.riskLevel === 'Medium' ? '中等' : '注意'}
                    </motion.p>
                )}
             </AnimatePresence>
          </div>

          <div className="mt-2 pt-3 border-t border-warm-100">
             <AnimatePresence mode="wait">
                 {loadingInsight ? (
                    <motion.div className="space-y-1">
                        <div className="h-2 w-full bg-warm-200/30 rounded animate-pulse" />
                        <div className="h-2 w-2/3 bg-warm-200/30 rounded animate-pulse" />
                    </motion.div>
                 ) : (
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[11px] font-semibold text-gray-500 leading-tight"
                    >
                       {aiInsight?.recommendation || "建议保持当前节奏。"}
                    </motion.p>
                 )}
             </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Decorative background element */}
      <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-white to-transparent pointer-events-none -z-10 opacity-60" />

    </div>
  );
};

export default Dashboard;