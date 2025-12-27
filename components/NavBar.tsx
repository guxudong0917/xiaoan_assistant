import React from 'react';
import { Activity, MessageCircleHeart, ScanEye } from 'lucide-react';
import { AppView } from '../types';

interface NavBarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

const NavBar: React.FC<NavBarProps> = ({ currentView, setView }) => {
  const navItems = [
    { view: AppView.DASHBOARD, icon: Activity, label: '监测' },
    { view: AppView.CHAT, icon: MessageCircleHeart, label: '陪伴' },
    { view: AppView.NUTRITION, icon: ScanEye, label: '食愈' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-creamy-200 pb-safe pt-2 px-6 h-24 shadow-[0_-5px_30px_rgba(255,140,96,0.05)] z-50 rounded-t-[32px]">
      <div className="flex justify-between items-center max-w-md mx-auto h-full pb-6">
        {navItems.map((item) => {
          const isActive = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className="flex flex-col items-center justify-center w-16 group relative"
            >
              <div className={`
                relative p-3 rounded-full transition-all duration-500 ease-out
                ${isActive 
                  ? 'bg-warm-500 text-white shadow-soft translate-y-[-8px] scale-110' 
                  : 'text-gray-400 hover:text-warm-400 hover:bg-creamy-100'}
              `}>
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[11px] font-bold mt-1 transition-all duration-300 ${isActive ? 'text-warm-500 translate-y-[-4px]' : 'text-gray-300'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default NavBar;