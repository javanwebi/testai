// src/components/club/SeasonalCampaignBanner.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Clock, Flame, ChevronLeft, ArrowLeft, Percent, Gift } from 'lucide-react';
import { clubService } from '../../services/clubService';
import { toPersianDigits } from '../../utils/formatters';

export const SeasonalCampaignBanner: React.FC = () => {
  const campaign = clubService.getActiveCampaign();

  // 4-segment countdown (Days, Hours, Minutes, Seconds)
  const [timeLeft, setTimeLeft] = useState({
    days: 4,
    hours: 18,
    minutes: 42,
    seconds: 30,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!campaign.active) return null;

  return (
    <div className="relative overflow-hidden rounded-[16px] bg-gradient-to-r from-amber-600 via-orange-600 to-[#55565A] text-white p-5 sm:p-6 shadow-md border border-orange-400/40">
      <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] opacity-10 [background-size:16px_16px] pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5">
        {/* Right Details */}
        <div className="space-y-2 text-center md:text-right">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-white text-orange-700 shadow-xs">
              <Flame className="w-3.5 h-3.5 fill-orange-600 text-orange-600" />
              <span>{campaign.badge}</span>
            </span>
            <span className="text-[11px] font-bold bg-[#12203C]/30 px-2.5 py-0.5 rounded-full text-amber-200 border border-amber-300/30">
              {campaign.discountPercentText} + {toPersianDigits(campaign.pointsBonusMultiplier)} برابر امتیاز باشگاه
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
            {campaign.title}
          </h3>

          <p className="text-xs text-orange-100 max-w-xl">
            {campaign.description}
          </p>
        </div>

        {/* Left: Countdown Timer & CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
          {/* Countdown Clock */}
          <div className="bg-[#12203C]/70 backdrop-blur-xs border border-white/20 rounded-xl p-3 flex items-center gap-2 text-center">
            <div className="flex flex-col items-center min-w-[36px]">
              <span className="font-mono text-base font-black text-amber-300">
                {toPersianDigits(timeLeft.days.toString().padStart(2, '0'))}
              </span>
              <span className="text-[9px] text-orange-200">روز</span>
            </div>
            <span className="font-bold text-amber-300">:</span>
            <div className="flex flex-col items-center min-w-[36px]">
              <span className="font-mono text-base font-black text-white">
                {toPersianDigits(timeLeft.hours.toString().padStart(2, '0'))}
              </span>
              <span className="text-[9px] text-orange-200">ساعت</span>
            </div>
            <span className="font-bold text-amber-300">:</span>
            <div className="flex flex-col items-center min-w-[36px]">
              <span className="font-mono text-base font-black text-white">
                {toPersianDigits(timeLeft.minutes.toString().padStart(2, '0'))}
              </span>
              <span className="text-[9px] text-orange-200">دقیقه</span>
            </div>
            <span className="font-bold text-amber-300">:</span>
            <div className="flex flex-col items-center min-w-[36px]">
              <span className="font-mono text-base font-black text-amber-300">
                {toPersianDigits(timeLeft.seconds.toString().padStart(2, '0'))}
              </span>
              <span className="text-[9px] text-orange-200">ثانیه</span>
            </div>
          </div>

          <Link
            to={`/category/${campaign.targetCategorySlug}`}
            className="px-5 py-2.5 bg-white hover:bg-slate-100 text-orange-700 hover:text-orange-800 text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>مشاهده کالاهای جشنواره</span>
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
