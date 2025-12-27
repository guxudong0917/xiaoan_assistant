import React, { useRef, useState, useEffect } from 'react';
import { Menu, Bell, Camera, Image, ChevronLeft, Share2, ThumbsUp, ThumbsDown, Trash2, X } from 'lucide-react';
import { analyzeFoodImage } from '../services/geminiService';
import { FoodAnalysis, FoodLog } from '../types';
import { motion, AnimatePresence, useMotionValue, useTransform, animate, Variants } from 'framer-motion';

// 颜色常量
const COLORS = {
  cream: '#FFF8F0',
  orange: '#E67E22',
  brown: '#4A3B32',
};

// 弹簧动画配置
const springConfig = { stiffness: 300, damping: 30 };

// --- Robot Eyes Component (from Chat.tsx) ---
type Expression = 'neutral' | 'happy' | 'thinking' | 'surprised';

const RobotEyes: React.FC<{ expression: Expression; size?: 'small' | 'large' }> = ({ expression, size = 'large' }) => {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const blinkLoop = () => {
      const nextBlink = Math.random() * 3000 + 2000;
      const timer = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 200);
        blinkLoop();
      }, nextBlink);
      return timer;
    };
    const timer = blinkLoop();
    return () => { clearTimeout(timer); setIsBlinking(false); };
  }, []);

  const isSmall = size === 'small';
  const scale = isSmall ? 0.7 : 1;

  // 眼睛变体 - happy 时变成弯月眼（扁平、弯曲）
  const leftEyeVariants: Variants = {
    neutral: { height: 40 * scale, width: 28 * scale, borderRadius: 99, rotate: 0, y: 0, scaleY: 1 },
    happy: { height: 12 * scale, width: 36 * scale, borderRadius: '50% 50% 50% 50% / 20% 20% 80% 80%', rotate: -8, y: 2, scaleY: 1 },
    surprised: { height: 48 * scale, width: 36 * scale, borderRadius: 99, rotate: 0, y: -5 * scale, scaleY: 1 },
    thinking: { 
      height: 32 * scale, width: 32 * scale, borderRadius: 99, y: -5 * scale, scaleY: 1,
      transition: { repeat: Infinity, repeatType: "reverse" as const, duration: 0.75, ease: "easeInOut" } 
    },
    blink: { height: 4 * scale, scaleY: 0.1, transition: { duration: 0.1 } }
  };

  const rightEyeVariants: Variants = {
    neutral: { height: 40 * scale, width: 28 * scale, borderRadius: 99, rotate: 0, y: 0, scaleY: 1 },
    happy: { height: 12 * scale, width: 36 * scale, borderRadius: '50% 50% 50% 50% / 20% 20% 80% 80%', rotate: 8, y: 2, scaleY: 1 },
    surprised: { height: 48 * scale, width: 36 * scale, borderRadius: 99, rotate: 0, y: -5 * scale, scaleY: 1 },
    thinking: { 
      height: 32 * scale, width: 32 * scale, borderRadius: 99, y: 5 * scale, scaleY: 1,
      transition: { repeat: Infinity, repeatType: "reverse" as const, duration: 0.75, ease: "easeInOut" } 
    },
    blink: { height: 4 * scale, scaleY: 0.1, transition: { duration: 0.1 } }
  };

  const containerVariants: Variants = {
    thinking: { x: 5 * scale, transition: { repeat: Infinity, repeatType: "reverse" as const, duration: 1.5, ease: "easeInOut" } },
    neutral: { x: 0, y: 0 },
    happy: { y: -3, transition: { repeat: Infinity, repeatType: "reverse" as const, duration: 0.5, ease: "easeInOut" } },
    surprised: { y: 0 }
  };

  const currentVariant = isBlinking ? 'blink' : expression;
  const containerSize = isSmall ? 'w-24 h-16 rounded-[1.5rem]' : 'w-40 h-28 rounded-[3rem]';
  const gapSize = isSmall ? 'gap-4' : 'gap-6';

  return (
    <div className={`relative ${containerSize} bg-gradient-to-b from-orange-400 to-orange-500 shadow-[0_10px_40px_-10px_rgba(255,140,96,0.5)] flex items-center justify-center border-4 border-white/40`}>
      <div className={`absolute ${isSmall ? 'top-2 left-3 w-4 h-2' : 'top-4 left-6 w-8 h-4'} bg-white/30 rounded-full blur-[2px]`} />
      <motion.div className={`flex ${gapSize} items-center`} variants={containerVariants} animate={expression}>
        <motion.div className="bg-gray-800 shadow-inner" initial="neutral" animate={currentVariant} variants={leftEyeVariants} transition={{ type: "spring", stiffness: 300, damping: 20 }} />
        <motion.div className="bg-gray-800 shadow-inner" initial="neutral" animate={currentVariant} variants={rightEyeVariants} transition={{ type: "spring", stiffness: 300, damping: 20 }} />
      </motion.div>
    </div>
  );
};


interface NutritionProps {
  foodLogs: FoodLog[];
  onAddLog: (analysis: FoodAnalysis, image?: string) => void;
  onDeleteLog: (id: string) => void;
  onClearAll: () => void;
}

type ViewState = 'dashboard' | 'camera' | 'analysis' | 'results';

// 机器人吉祥物组件 - 使用 RobotEyes
const RobotMascot: React.FC<{ message?: string; showBubble?: boolean; expression?: Expression }> = ({ message, showBubble, expression = 'neutral' }) => (
  <motion.div 
    className="flex items-end gap-3"
    initial={{ y: 100, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
  >
    <RobotEyes expression={expression} size="small" />
    
    {showBubble && message && (
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.3 }}
        className="relative bg-white rounded-2xl px-4 py-2 shadow-lg max-w-[180px]"
      >
        <p className="text-sm font-bold text-gray-700">{message}</p>
        <div className="absolute left-0 bottom-3 -translate-x-1/2 w-3 h-3 bg-white rotate-45" />
      </motion.div>
    )}
  </motion.div>
);

// 动画计数器组件
const AnimatedNumber: React.FC<{ value: number; suffix?: string }> = ({ value, suffix = '' }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.5, ease: 'easeOut' });
    const unsubscribe = rounded.on('change', (v) => setDisplay(v));
    return () => { controls.stop(); unsubscribe(); };
  }, [value]);

  return <span>{display}{suffix}</span>;
};

const Nutrition: React.FC<NutritionProps> = ({ foodLogs, onAddLog, onDeleteLog, onClearAll }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);

  const [viewState, setViewState] = useState<ViewState>('dashboard');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [result, setResult] = useState<FoodAnalysis | null>(null);
  const [nutritionData, setNutritionData] = useState({ calories: 450, carbs: 55, fats: 18, protein: 22 });
  const [hasRated, setHasRated] = useState(false);

  // 总卡路里计算
  const totalCalories = foodLogs.reduce((sum, l) => sum + (l.carbs * 4), 0);

  // 启动摄像头
  const startCamera = async () => {
    if (!mountedRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (!mountedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      try {
        const fallback = await navigator.mediaDevices.getUserMedia({ video: true });
        if (!mountedRef.current) { fallback.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = fallback;
        if (videoRef.current) videoRef.current.srcObject = fallback;
      } catch (e) {
        console.error('Camera error:', e);
      }
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => { t.stop(); t.enabled = false; });
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; stopCamera(); };
  }, []);

  useEffect(() => {
    if (viewState === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
  }, [viewState]);

  // 拍照并开始分析 - 只截取中心方框区域
  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      const videoWidth = videoRef.current.videoWidth;
      const videoHeight = videoRef.current.videoHeight;
      
      // 计算中心方框区域（对应 w-72 h-72 = 288px，取视频短边的 60% 作为截取尺寸）
      const cropSize = Math.min(videoWidth, videoHeight) * 0.6;
      const cropX = (videoWidth - cropSize) / 2;
      const cropY = (videoHeight - cropSize) / 2;
      
      // 设置画布为正方形
      canvasRef.current.width = cropSize;
      canvasRef.current.height = cropSize;
      
      // 只截取中心方框区域
      ctx.drawImage(
        videoRef.current,
        cropX, cropY, cropSize, cropSize,  // 源图片的裁剪区域
        0, 0, cropSize, cropSize           // 目标画布位置
      );
      
      const dataUrl = canvasRef.current.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
      setViewState('analysis');
      
      // 模拟进度动画
      setAnalysisProgress(0);
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 2;
        });
      }, 50);

      // 调用 AI 分析
      try {
        const base64 = dataUrl.split(',')[1];
        const response = await analyzeFoodImage(base64);
        const rawResponse = typeof response === 'string' ? response : (response as any).result || JSON.stringify(response);
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          const unknownNames = ['健康美食', '美味食物', '未知食物', '无法识别'];
          const isRecognized = data.foodName && !unknownNames.includes(data.foodName);
          
          const validData: FoodAnalysis = {
            foodName: data.foodName || "未知食物",
            giIndex: isRecognized ? (data.giIndex || 50) : 0,
            carbs: isRecognized ? (data.carbs || 30) : 0,
            advice: data.advice || (isRecognized ? "均衡饮食，保持健康！" : "抱歉，无法识别这个食物")
          };
          setResult(validData);
          
          if (isRecognized) {
            setNutritionData({
              calories: Math.round(validData.carbs * 4),
              carbs: validData.carbs,
              fats: Math.round(validData.carbs * 0.3),
              protein: Math.round(validData.carbs * 0.4)
            });
            onAddLog(validData, dataUrl);
          } else {
            setNutritionData({ calories: 0, carbs: 0, fats: 0, protein: 0 });
          }
        }
      } catch (err) {
        console.error('Analysis error:', err);
        setResult({
          foodName: "健康美食",
          giIndex: 45,
          carbs: 55,
          advice: "看起来很美味！注意均衡饮食哦~"
        });
      }

      // 等待进度完成后切换到结果
      setTimeout(() => {
        setViewState('results');
      }, 3000);
    }
  };

  // 返回仪表板
  const goBack = () => {
    setViewState('dashboard');
    setCapturedImage(null);
    setResult(null);
    setAnalysisProgress(0);
    setHasRated(false);
  };

  // 根据食物营养质量判断表情和鼓励语
  const getFoodReaction = (): { expression: Expression; message: string } => {
    if (!result) return { expression: 'neutral', message: '让我看看~' };
    
    // 检查是否是无法识别的食物
    const unknownNames = ['健康美食', '美味食物', '未知食物', '无法识别'];
    if (unknownNames.includes(result.foodName)) {
      return { expression: 'thinking', message: '抱歉，我无法识别这个食物，请重新拍照~' };
    }
    
    const gi = result.giIndex;
    const carbs = result.carbs;
    
    // 低 GI (≤ 55) 且低碳水 = 很棒的选择
    if (gi <= 55 && carbs <= 30) {
      return { expression: 'happy', message: '太棒了！这是非常健康的选择！' };
    }
    // 低 GI 但碳水较高 = 还不错
    if (gi <= 55) {
      return { expression: 'happy', message: '不错的选择！继续保持！' };
    }
    // 中 GI (56-69) = 还可以
    if (gi <= 69) {
      return { expression: 'neutral', message: '还可以，注意控制分量哦~' };
    }
    // 高 GI (≥ 70) = 需要注意
    if (gi >= 70 && carbs >= 50) {
      return { expression: 'surprised', message: '这个热量有点高，建议少吃一点哦！' };
    }
    return { expression: 'neutral', message: '适量食用，保持均衡饮食~' };
  };

  const foodReaction = getFoodReaction();

  return (
    <div className="relative h-screen overflow-hidden font-sans" style={{ backgroundColor: COLORS.cream }}>
      <canvas ref={canvasRef} className="hidden" />
      
      <AnimatePresence mode="wait">
        {/* ========== State 1: Dashboard ========== */}
        {viewState === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -50 }}
            className="h-full flex flex-col relative"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 pt-12 pb-4">
              <div>
                <h2 className="text-2xl font-black" style={{ color: COLORS.brown }}>AI 智能识别</h2>
                <p className="text-sm text-gray-500">拍摄食物，智能分析营养成分</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2 rounded-xl hover:bg-white/50 relative">
                  <Bell size={24} color={COLORS.brown} />
                  <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </button>
              </div>
            </div>

            {/* 今日热量统计 */}
            {totalCalories > 0 && (
              <div className="px-6 mb-4">
                <div className="px-4 py-2 rounded-full inline-block" style={{ backgroundColor: `${COLORS.orange}20` }}>
                  <span className="font-bold" style={{ color: COLORS.orange }}>
                    今日总热量: <AnimatedNumber value={totalCalories} suffix=" kcal" />
                  </span>
                </div>
              </div>
            )}

            {/* Food Logs - 主要区域 */}
            {(() => {
              // 只显示识别成功的食物（有图片且不是默认名称）
              const unknownNames = ['健康美食', '美味食物', '未知食物'];
              const recognizedLogs = foodLogs.filter(log => log.image && !unknownNames.includes(log.foodName));
              return recognizedLogs.length > 0 ? (
                <div className="flex-1 px-6 pb-28 overflow-y-auto">
                  <div className="flex justify-between items-center mb-4 max-w-sm mx-auto">
                    <h3 className="font-bold text-lg" style={{ color: COLORS.brown }}>识别记录</h3>
                    <motion.button
                      onClick={onClearAll}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-50 text-red-500 text-xs font-bold"
                    >
                      <Trash2 size={14} />
                      清空全部
                    </motion.button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                    {recognizedLogs.map((log, index) => (
                      <motion.div 
                        key={log.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white rounded-3xl overflow-hidden shadow-lg relative group"
                      >
                        {/* 删除按钮 */}
                        <motion.button
                          onClick={() => onDeleteLog(log.id)}
                          whileTap={{ scale: 0.9 }}
                          className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} color="white" />
                        </motion.button>
                        {/* 食物图片 */}
                        <div className="aspect-square relative overflow-hidden">
                          <img 
                            src={log.image} 
                            alt={log.foodName} 
                            className="w-full h-full object-cover"
                          />
                          {/* GI 标签 */}
                          <div 
                            className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold text-white"
                            style={{ 
                              backgroundColor: log.giIndex <= 55 ? '#22c55e' : log.giIndex <= 69 ? '#f59e0b' : '#ef4444'
                            }}
                          >
                            GI {log.giIndex}
                          </div>
                        </div>
                        {/* 食物信息 */}
                        <div className="p-3">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-sm truncate flex-1" style={{ color: COLORS.brown }}>
                              {log.foodName}
                            </h4>
                            <button 
                              onClick={() => onDeleteLog(log.id)}
                              className="p-1 rounded-full hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={14} className="text-gray-300 hover:text-red-500" />
                            </button>
                          </div>
                          <p className="font-black text-lg" style={{ color: COLORS.orange }}>
                            {Math.round(log.carbs * 4)} kcal
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(log.timestamp).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
                  <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                    <span className="text-5xl">🍽️</span>
                  </div>
                  <p className="text-lg font-bold" style={{ color: COLORS.brown }}>还没有识别记录</p>
                  <p className="text-sm text-gray-400 mt-2">点击右下角按钮开始拍照</p>
                </div>
              );
            })()}

            {/* 浮动拍照按钮 - 固定在底部 */}
            <motion.button
              onClick={() => setViewState('camera')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="fixed bottom-24 right-6 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl"
              style={{ backgroundColor: COLORS.orange, zIndex: 50 }}
            >
              <Camera size={32} color="white" />
            </motion.button>

          </motion.div>
        )}

        {/* ========== State 2: Camera ========== */}
        {viewState === 'camera' && (
          <motion.div
            key="camera"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', ...springConfig }}
            className="absolute inset-0 bg-black"
          >
            {/* Camera View */}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Viewfinder Corners - 绝对居中 */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div 
                layoutId="food-frame"
                className="w-72 h-72 relative"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={springConfig}
              >
                {/* Corner brackets */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-3xl" />
                <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-3xl" />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-3xl" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-3xl" />
                
                {/* Scan line */}
                <motion.div
                  animate={{ top: ['10%', '90%', '10%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute left-4 right-4 h-0.5"
                  style={{ backgroundColor: COLORS.orange, boxShadow: `0 0 20px ${COLORS.orange}` }}
                />
              </motion.div>
            </div>
            
            {/* 提示文字 - 单独定位在方框下方 */}
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute left-0 right-0 top-[60%] text-white/80 text-sm font-bold text-center pointer-events-none"
            >
              请将食物放在方框内
            </motion.p>

            {/* Bottom Controls */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-lg rounded-t-[40px] pt-6 pb-10 px-8"
            >
              <div className="flex items-center justify-between">
                {/* Gallery */}
                <button 
                  onClick={goBack}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                    <Image size={24} color="white" />
                  </div>
                  <span className="text-[10px] text-white/60">返回</span>
                </button>

                {/* Shutter Button */}
                <motion.button
                  onClick={captureAndAnalyze}
                  whileTap={{ scale: 0.9 }}
                  className="relative"
                >
                  <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center">
                    <motion.div 
                      className="w-16 h-16 rounded-full"
                      style={{ backgroundColor: COLORS.orange }}
                      whileHover={{ scale: 1.05 }}
                    />
                  </div>
                </motion.button>

                {/* Manual */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                    <Camera size={24} color="white" />
                  </div>
                  <span className="text-[10px] text-white/60">手动</span>
                </div>
              </div>
              
              <p className="text-center text-white/80 font-bold mt-4 text-sm">拍摄 & 分析</p>
            </motion.div>
          </motion.div>
        )}

        {/* ========== State 3: Analysis ========== */}
        {viewState === 'analysis' && (
          <motion.div
            key="analysis"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center"
          >
            {/* Circular Image with Progress Ring */}
            <div className="relative">
              <motion.div
                layoutId="food-frame"
                className="w-56 h-56 rounded-full overflow-hidden border-4 border-white/20"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={springConfig}
              >
                {capturedImage && (
                  <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                )}
              </motion.div>

              {/* Progress Ring */}
              <svg className="absolute inset-0 w-56 h-56 -rotate-90">
                <circle
                  cx="112"
                  cy="112"
                  r="106"
                  fill="none"
                  stroke={`${COLORS.orange}30`}
                  strokeWidth="8"
                />
                <motion.circle
                  cx="112"
                  cy="112"
                  r="106"
                  fill="none"
                  stroke={COLORS.orange}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={666}
                  initial={{ strokeDashoffset: 666 }}
                  animate={{ strokeDashoffset: 666 - (666 * analysisProgress) / 100 }}
                  transition={{ duration: 0.1 }}
                />
              </svg>
            </div>

            {/* Loading Text */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 text-center"
            >
              <p className="text-white font-bold text-lg">估算份量中...</p>
              <p className="text-white/50 text-sm mt-1">Powered by AI</p>
            </motion.div>

            {/* Robot Mascot */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
              <RobotMascot expression="thinking" />
            </div>
          </motion.div>
        )}

        {/* ========== State 4: Results ========== */}
        {viewState === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col overflow-hidden"
            style={{ backgroundColor: COLORS.cream }}
          >
            {/* Header - 更精致 */}
            <div className="flex justify-between items-center px-6 pt-12 pb-2">
              <motion.button 
                onClick={goBack} 
                className="p-2 rounded-2xl bg-white/80 shadow-sm hover:shadow-md transition-shadow"
                whileTap={{ scale: 0.95 }}
              >
                <ChevronLeft size={24} color={COLORS.brown} />
              </motion.button>
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center"
              >
                <h1 className="font-black text-xl" style={{ color: COLORS.brown }}>
                  {result?.foodName || '健康美食'}
                </h1>
                <p className="text-xs text-gray-400">{new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</p>
              </motion.div>
              <motion.button 
                className="p-2 rounded-2xl bg-white/80 shadow-sm hover:shadow-md transition-shadow"
                whileTap={{ scale: 0.95 }}
              >
                <Share2 size={20} color={COLORS.brown} />
              </motion.button>
            </div>

            {/* Hero Image + Robot - 更紧凑 */}
            <div className="flex justify-center items-end gap-3 py-4">
              <motion.div
                layoutId="food-frame"
                className="w-32 h-32 rounded-3xl overflow-hidden border-4 shadow-xl"
                style={{ borderColor: COLORS.orange }}
              >
                {capturedImage && (
                  <img src={capturedImage} alt="Food" className="w-full h-full object-cover" />
                )}
              </motion.div>
              <RobotMascot message={foodReaction.message} showBubble expression={foodReaction.expression} />
            </div>

            {/* Nutrition Card - 可滚动 */}
            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', ...springConfig, delay: 0.2 }}
              className="flex-1 bg-white rounded-t-[32px] shadow-2xl overflow-y-auto"
            >
              <div className="px-6 pt-6 pb-40 max-w-lg mx-auto">
                {/* Calories - 更精致 */}
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-center mb-5 p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-yellow-50"
                >
                  <p className="text-xs text-gray-400 font-bold mb-1">总热量</p>
                  <p className="text-4xl font-black" style={{ color: COLORS.orange }}>
                    <AnimatedNumber value={nutritionData.calories} suffix="" />
                    <span className="text-lg ml-1">kcal</span>
                  </p>
                </motion.div>

                {/* Macro Bars - 更精致 */}
                <div className="mb-5">
                  <div className="h-3 rounded-full overflow-hidden flex bg-gray-100 shadow-inner">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-orange-400 to-orange-500"
                      initial={{ width: 0 }}
                      animate={{ width: '45%' }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                    />
                    <motion.div 
                      className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500"
                      initial={{ width: 0 }}
                      animate={{ width: '25%' }}
                      transition={{ duration: 0.8, delay: 0.6 }}
                    />
                    <motion.div 
                      className="h-full bg-gradient-to-r from-green-400 to-green-500"
                      initial={{ width: 0 }}
                      animate={{ width: '30%' }}
                      transition={{ duration: 0.8, delay: 0.8 }}
                    />
                  </div>
                </div>

                {/* Macro Details - 更精致 */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center p-3 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 shadow-sm"
                  >
                    <div className="w-2 h-2 rounded-full bg-orange-400 mx-auto mb-1" />
                    <p className="text-[10px] text-gray-400 font-bold">碳水</p>
                    <p className="font-black text-base" style={{ color: COLORS.brown }}>{nutritionData.carbs}g</p>
                  </motion.div>
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-center p-3 rounded-2xl bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-sm"
                  >
                    <div className="w-2 h-2 rounded-full bg-yellow-400 mx-auto mb-1" />
                    <p className="text-[10px] text-gray-400 font-bold">脂肪</p>
                    <p className="font-black text-base" style={{ color: COLORS.brown }}>{nutritionData.fats}g</p>
                  </motion.div>
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-center p-3 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 shadow-sm"
                  >
                    <div className="w-2 h-2 rounded-full bg-green-500 mx-auto mb-1" />
                    <p className="text-[10px] text-gray-400 font-bold">蛋白质</p>
                    <p className="font-black text-base" style={{ color: COLORS.brown }}>{nutritionData.protein}g</p>
                  </motion.div>
                </div>

                {/* GI Index Badge */}
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="flex items-center justify-center gap-2 mb-5"
                >
                  <div 
                    className="px-4 py-2 rounded-full text-white font-bold text-sm shadow-md"
                    style={{ 
                      backgroundColor: (result?.giIndex || 50) <= 55 ? '#22c55e' : (result?.giIndex || 50) <= 69 ? '#f59e0b' : '#ef4444'
                    }}
                  >
                    GI 指数: {result?.giIndex || 50}
                  </div>
                  <span className="text-xs text-gray-400">
                    {(result?.giIndex || 50) <= 55 ? '低升糖' : (result?.giIndex || 50) <= 69 ? '中升糖' : '高升糖'}
                  </span>
                </motion.div>

                {/* AI Advice - 更精致 */}
                {result?.advice && (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-4 mb-5 border border-orange-100"
                  >
                    <p className="text-xs text-orange-400 font-bold mb-1">AI 建议</p>
                    <p className="text-sm font-medium" style={{ color: COLORS.brown }}>
                      {result.advice}
                    </p>
                  </motion.div>
                )}

                {/* Rate AI Accuracy - 带消失动画 */}
                <AnimatePresence>
                  {!hasRated && (
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="text-center bg-gray-50 rounded-2xl p-4"
                    >
                      <p className="text-xs text-gray-400 font-bold mb-3">AI 识别准确吗？</p>
                      <div className="flex justify-center gap-3">
                        <motion.button
                          onClick={() => setHasRated(true)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-100 shadow-sm hover:shadow-md transition-all"
                        >
                          <ThumbsUp size={18} color="#22c55e" />
                          <span className="font-bold text-sm text-green-600">准确</span>
                        </motion.button>
                        <motion.button
                          onClick={() => setHasRated(true)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-100 shadow-sm hover:shadow-md transition-all"
                        >
                          <ThumbsDown size={18} color="#ef4444" />
                          <span className="font-bold text-sm text-red-500">不准</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* 感谢反馈提示 */}
                <AnimatePresence>
                  {hasRated && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center py-3"
                    >
                      <p className="text-sm text-green-500 font-bold">感谢您的反馈！</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Nutrition;