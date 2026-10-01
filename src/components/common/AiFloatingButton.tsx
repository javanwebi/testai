import React, { useState } from 'react';
import { Sparkles, PhoneCall } from 'lucide-react';
import { STORE_ASSETS } from '../../assets/images';

export const AiFloatingButton: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isCallHovered, setIsCallHovered] = useState(false);

  const handleOpenConsult = () => {
    window.dispatchEvent(new CustomEvent('open-ai-consult'));
  };

  const handleOpenForzaCall = () => {
    window.dispatchEvent(new CustomEvent('open-forza-face-to-face'));
  };

  return (
    <div className="fixed bottom-20 lg:bottom-7 left-3 lg:left-7 z-40 flex items-center gap-2 select-none group" dir="rtl">
      {/* Desktop Tooltips */}
      <div
        className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2B313A] text-white text-xs font-bold shadow-lg border border-[#3F4550] transition-all duration-200 pointer-events-none ${
          isCallHovered || isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-[#E06518] animate-pulse" />
        <span>
          {isCallHovered
            ? 'مکالمه زنده رو در رو با AI FORZA'
            : 'مشاور و محاسبات هوشمند اطلس'}
        </span>
      </div>

      {/* 1. Dedicated AI FORZA Real-Time Voice Call Button (Mobile & Desktop) */}
      <button
        type="button"
        onClick={handleOpenForzaCall}
        onMouseEnter={() => setIsCallHovered(true)}
        onMouseLeave={() => setIsCallHovered(false)}
        aria-label="تماس چهره به چهره صوتی با هوش مصنوعی AI FORZA"
        title="تماس چهره به چهره صوتی با هوش مصنوعی FORZA"
        className="relative flex items-center gap-1.5 p-2 lg:p-2.5 rounded-2xl bg-gradient-to-tr from-[#1E232B] via-[#2B313A] to-[#1E232B] hover:border-[#E06518] text-white shadow-xl shadow-black/40 border border-[#E06518]/70 cursor-pointer active:scale-95 transition-all duration-200 hover:scale-105"
      >
        {/* Pulsing Orange Live Call Ping */}
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E06518] opacity-75" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#E06518] border-2 border-white" />
        </span>

        <div className="w-7 h-7 rounded-xl overflow-hidden flex items-center justify-center bg-black/40 border border-[#E06518]/40 relative shrink-0">
          <img
            src={STORE_ASSETS.aiForzaCyborg}
            alt="AI FORZA"
            className="w-full h-full object-cover object-top"
          />
        </div>

        <div className="flex items-center gap-1 text-white pr-0.5">
          <PhoneCall className="w-4 h-4 text-[#E06518] animate-pulse" />
          <span className="text-[11px] font-black tracking-tight hidden sm:inline">
            تماس FORZA
          </span>
        </div>
      </button>

      {/* 2. Main AI Consultation Workspace Trigger Button */}
      <button
        type="button"
        onClick={handleOpenConsult}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="مشاور صنعتی هوشمند اطلس"
        className="relative flex items-center gap-2 p-2.5 lg:p-3 rounded-2xl bg-gradient-to-tr from-[#C95210] to-[#E06518] hover:from-[#B8450A] hover:to-[#C95210] text-white shadow-xl shadow-orange-950/30 border-2 border-white/30 cursor-pointer active:scale-95 transition-all duration-200 hover:scale-105"
      >
        <div className="w-6 h-6 lg:w-7 lg:h-7 rounded-lg overflow-hidden flex items-center justify-center bg-white/20">
          <Sparkles className="w-4 h-4 lg:w-4.5 lg:h-4.5 text-white animate-pulse" />
        </div>

        <span className="hidden md:inline font-black text-xs tracking-tight">
          مشاوره هوشمند AI
        </span>
      </button>
    </div>
  );
};
