import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Mic, ChevronLeft, StopCircle, Trash2 } from 'lucide-react';
import { Message } from '../types';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface ChatProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onClearHistory: () => void;
}

// --- Robot Eyes Component ---
type Expression = 'neutral' | 'happy' | 'sad' | 'surprised' | 'thinking' | 'listening';

const RobotEyes: React.FC<{ expression: Expression }> = ({ expression }) => {
  const [isBlinking, setIsBlinking] = useState(false);

  // 随机眨眼逻辑
  useEffect(() => {
    const blinkLoop = () => {
      const nextBlink = Math.random() * 3000 + 2000; // 2-5秒眨眼一次
      setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 200); // 闭眼持续200ms
        blinkLoop();
      }, nextBlink);
    };
    blinkLoop();
    return () => setIsBlinking(false); // Cleanup
  }, []);

  // 眼睛变体定义
  const leftEyeVariants: Variants = {
    neutral: { height: 40, width: 28, borderRadius: 99, rotate: 0, y: 0 },
    happy: { height: 20, width: 32, borderRadius: 10, rotate: -10, y: 0 }, // 弯月眼
    sad: { height: 32, width: 28, borderRadius: 20, rotate: 15, y: 5 }, // 八字眉眼
    surprised: { height: 48, width: 36, borderRadius: 99, rotate: 0, y: -5 },
    thinking: { 
      height: 32, 
      width: 32, 
      borderRadius: 99, 
      y: -5,
      transition: { 
        repeat: Infinity, 
        repeatType: "reverse" as const,
        duration: 0.75,
        ease: "easeInOut"
      } 
    },
    listening: { height: 44, width: 32, borderRadius: 99, scale: 1.1 },
    blink: { height: 2, scaleY: 0.1, transition: { duration: 0.1 } }
  };

  const rightEyeVariants: Variants = {
    neutral: { height: 40, width: 28, borderRadius: 99, rotate: 0, y: 0 },
    happy: { height: 20, width: 32, borderRadius: 10, rotate: 10, y: 0 },
    sad: { height: 32, width: 28, borderRadius: 20, rotate: -15, y: 5 },
    surprised: { height: 48, width: 36, borderRadius: 99, rotate: 0, y: -5 },
    thinking: { 
      height: 32, 
      width: 32, 
      borderRadius: 99, 
      y: 5,
      transition: { 
        repeat: Infinity, 
        repeatType: "reverse" as const,
        duration: 0.75,
        ease: "easeInOut"
      } 
    }, // 异步跳动
    listening: { height: 44, width: 32, borderRadius: 99, scale: 1.1 },
    blink: { height: 2, scaleY: 0.1, transition: { duration: 0.1 } }
  };

  // 思考时的眼球运动动画
  const containerVariants: Variants = {
    thinking: { 
      x: 5,
      transition: { 
        repeat: Infinity, 
        repeatType: "reverse" as const,
        duration: 1.5, 
        ease: "easeInOut" 
      } 
    },
    neutral: { x: 0 },
    happy: { 
      y: -2,
      transition: { 
        repeat: Infinity, 
        repeatType: "reverse" as const,
        duration: 2,
        ease: "easeInOut"
      } 
    }
  };

  const currentVariant = isBlinking ? 'blink' : expression;

  return (
    <div className="relative w-40 h-28 bg-warm-500 rounded-[3rem] shadow-[0_10px_40px_-10px_rgba(255,140,96,0.5)] flex items-center justify-center border-4 border-white/40 backdrop-blur-sm">
      {/* 光泽反射 */}
      <div className="absolute top-4 left-6 w-8 h-4 bg-white/30 rounded-full blur-[2px]" />
      
      <motion.div 
        className="flex gap-6 items-center"
        variants={containerVariants}
        animate={expression}
      >
        <motion.div 
          className="bg-gray-800 shadow-inner"
          initial="neutral"
          animate={currentVariant}
          variants={leftEyeVariants}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        />
        <motion.div 
          className="bg-gray-800 shadow-inner"
          initial="neutral"
          animate={currentVariant}
          variants={rightEyeVariants}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        />
      </motion.div>
    </div>
  );
};

const Chat: React.FC<ChatProps> = ({ messages, isLoading, onSendMessage, onClearHistory }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  // --- 情感分析逻辑 ---
  const currentExpression = useMemo<Expression>(() => {
    if (isLoading) return 'thinking';
    if (isListening) return 'listening';

    // 获取最后一条消息（如果是用户发的，或者刚回复的）
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg) return 'neutral';

    const text = lastMsg.text.toLowerCase();

    // 关键词映射
    if (/(开心|哈哈|棒|谢谢|好|喜欢|爱)/.test(text)) return 'happy';
    if (/(难过|累|痛|死|烦|哭|焦虑|担心|怕)/.test(text)) return 'sad';
    if (/(\?|什么|真的|哇|吗)/.test(text)) return 'surprised';
    
    return 'neutral';
  }, [isLoading, isListening, messages]);

  // 初始化语音
  useEffect(() => {
    if ('speechSynthesis' in window) synthesisRef.current = window.speechSynthesis;
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'zh-CN';
      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onresult = (event: any) => onSendMessage(event.results[0][0].transcript);
    }
  }, [onSendMessage]);

  // 消息滚动
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'model' && !isLoading) {
      const isNew = (new Date().getTime() - lastMsg.timestamp.getTime()) < 3000;
      if (isNew) speakText(lastMsg.text);
    }
  }, [messages, isLoading]);

  const speakText = (text: string) => {
    if (!synthesisRef.current) return;
    synthesisRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    synthesisRef.current.speak(utterance);
  };

  return (
    <div className="flex flex-col h-screen bg-creamy-50 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-gradient-to-b from-creamy-50 via-creamy-100 to-warm-100 pointer-events-none" />
      <div className="relative z-10 pt-12 px-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button className="p-2 bg-white/50 backdrop-blur-md rounded-full shadow-sm text-gray-600"><ChevronLeft size={20} /></button>
          <h1 className="text-lg font-bold text-gray-800">CBT 深度陪伴</h1>
        </div>
        <button onClick={() => setShowClearConfirm(true)} className="p-2 text-gray-400 hover:text-red-400 transition-colors">
          <Trash2 size={20} />
        </button>
      </div>

      <div className="flex-1 relative flex flex-col items-center z-10 overflow-hidden">
        
        {/* --- 动态眼睛区域 --- */}
        <motion.div 
          className="mt-6 mb-4 relative flex items-center justify-center shrink-0 z-20"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* 背景光晕 */}
          <div className="absolute inset-0 bg-warm-300/30 blur-[40px] rounded-full scale-150" />
          
          <RobotEyes expression={currentExpression} />

          {/* 状态标签（根据表情显示） */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentExpression}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute -bottom-8 bg-white/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/50"
            >
              <span className="text-[10px] font-bold text-warm-600 tracking-wider uppercase">
                {currentExpression === 'thinking' ? '思考中...' : 
                 currentExpression === 'listening' ? '倾听中...' : 
                 currentExpression === 'happy' ? '开心' :
                 currentExpression === 'sad' ? '共情' :
                 currentExpression === 'surprised' ? '惊讶' : '在线'}
              </span>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <div className="flex-1 w-full max-w-md px-6 overflow-y-auto no-scrollbar space-y-4 pb-48 pt-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 text-sm font-bold shadow-soft ${msg.role === 'user' ? 'bg-warm-500 text-white rounded-2xl rounded-tr-none' : 'bg-[#FFF3E0] text-gray-700 rounded-2xl rounded-tl-none border border-white'}`}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <div className="flex gap-1 pl-4">
              <div className="w-1.5 h-1.5 bg-warm-400 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-warm-400 rounded-full animate-bounce delay-150" />
              <div className="w-1.5 h-1.5 bg-warm-400 rounded-full animate-bounce delay-300" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-white via-white/95 to-transparent flex flex-col items-center justify-end pb-20 z-20">
          <div className="flex items-end justify-center gap-1 h-12 mb-6">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div key={i} className="w-2 rounded-full bg-cyan-400" animate={{ height: isListening ? [10, 40, 10] : isSpeaking ? [10, 25, 10] : 6 }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }} />
            ))}
          </div>
          <button onClick={() => isListening ? recognitionRef.current.stop() : recognitionRef.current.start()} className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${isListening ? 'bg-white border-2 border-cyan-400 text-cyan-500 scale-110' : 'bg-warm-500 text-white hover:scale-105'}`}>
            {isListening ? <StopCircle size={28} /> : <Mic size={28} />}
          </button>
          <p className="mt-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{isListening ? "正在倾听..." : "点击对话"}</p>
        </div>
      </div>

      {/* 自定义确认弹窗 */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setShowClearConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-gradient-to-br from-creamy-50 to-creamy-100 rounded-3xl p-6 mx-6 max-w-sm w-full shadow-2xl border border-white/50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-warm-100 rounded-full flex items-center justify-center">
                  <Trash2 size={28} className="text-warm-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">清空聊天记录？</h3>
                <p className="text-sm text-gray-500 mb-6">这将清除当前的对话内容，但不会影响你的记忆数据。</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 py-3 px-4 bg-white/80 text-gray-600 font-bold rounded-2xl border border-gray-200 hover:bg-white transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      onClearHistory();
                      setShowClearConfirm(false);
                    }}
                    className="flex-1 py-3 px-4 bg-warm-500 text-white font-bold rounded-2xl shadow-lg hover:bg-warm-600 transition-colors"
                  >
                    确认清空
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chat;