import React from 'react';

// Geometric Orange 'A' Logo matching Atlas Trading brand identity in user's image
export const AtlasTradingLogoMark: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-9 h-9',
}) => (
  <svg viewBox="0 0 100 86" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Left slant leg with darker orange */}
    <path d="M42 4 L10 82 L26 82 L48 28 Z" fill="#c7540f" />
    {/* Right slant leg with vibrant bright orange */}
    <path d="M48 4 L88 82 L72 82 L56 46 Z" fill="#e06518" />
    {/* Forward ribbon fold facet */}
    <path d="M26 60 L74 60 L65 46 L17 46 Z" fill="#f18a47" />
  </svg>
);

// Full Brand Lockup: ATLAS TRADING with Smart Solutions
export const AtlasTradingBrandLockup: React.FC<{ light?: boolean; className?: string }> = ({
  light = true,
  className = '',
}) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <AtlasTradingLogoMark className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 drop-shadow-[0_2px_8px_rgba(224,101,24,0.4)]" />
    <div className="flex flex-col text-left font-sans leading-none select-none">
      <div className={`text-base sm:text-lg font-black tracking-[0.16em] uppercase ${light ? 'text-white' : 'text-[#37383b]'}`}>
        ATLAS
      </div>
      <div className="text-[9px] sm:text-[10px] tracking-[0.28em] font-bold text-[#e06518] mt-1 uppercase">
        TRADING
      </div>
    </div>
  </div>
);

// The iconic circular "AI هایپر صنعت" chest emblem directly from the user's reference image
export const AtlasAiChestBadge: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  };

  return (
    <div
      className={`relative rounded-full flex items-center justify-center shrink-0 border-2 border-[#e06518] shadow-[0_0_15px_rgba(224,101,24,0.5)] bg-[#55565a] ${sizeMap[size]} ${className}`}
      title="سیستم هوشمند هایپر صنعت اطلس"
    >
      {/* Outer concentric glowing thin ring */}
      <div className="absolute -inset-1 rounded-full border border-[#e06518]/50 animate-pulse pointer-events-none" />

      {/* Center content */}
      <div className="flex flex-col items-center justify-center text-center select-none">
        {/* "AI" Mark */}
        <div className="flex items-center justify-center leading-none font-black font-sans tracking-tight">
          <span className="text-[#e06518] text-xs sm:text-sm font-black drop-shadow-[0_0_4px_rgba(224,101,24,0.8)]">
            A
          </span>
          <span className="text-white text-xs sm:text-sm font-black drop-shadow-[0_0_4px_rgba(255,255,255,0.8)] ml-0.5">
            I
          </span>
        </div>
        {/* "هایپر صنعت" Typography */}
        <span className="text-[7px] sm:text-[8px] font-bold text-white tracking-tighter leading-none mt-0.5 whitespace-nowrap">
          هایپر صنعت
        </span>
      </div>
    </div>
  );
};

// "SMART SOLUTIONS FOR INDUSTRY" Badge as seen on the top right of the user's image
export const SmartSolutionsBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`hidden md:flex items-center gap-2 select-none ${className}`}>
    <span className="w-8 h-[3px] bg-[#e06518] rounded-full" />
    <div className="text-[10px] tracking-wider uppercase font-sans font-bold text-slate-300">
      <span>SMART SOLUTIONS FOR </span>
      <span className="text-[#e06518] font-black">INDUSTRY</span>
    </div>
  </div>
);
