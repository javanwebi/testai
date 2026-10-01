// src/components/club/ClubToastNotification.tsx
import React, { useEffect, useState } from 'react';
import { Sparkles, Coins, Star, X } from 'lucide-react';
import { toPersianDigits } from '../../utils/formatters';

export interface ClubToastData {
  id: string;
  points: number;
  productName: string;
}

let toastListener: ((data: ClubToastData) => void) | null = null;

export const showClubPointsToast = (points: number, productName: string) => {
  if (toastListener && points > 0) {
    toastListener({
      id: 'toast-' + Date.now(),
      points,
      productName,
    });
  }
};

export const ClubToastNotification: React.FC = () => {
  const [toast, setToast] = useState<ClubToastData | null>(null);

  useEffect(() => {
    toastListener = (data: ClubToastData) => {
      setToast(data);
    };
    return () => {
      toastListener = null;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-5 left-5 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 max-w-sm">
      <div className="bg-[#55565A] text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border-2 border-[#E06518] flex items-center justify-between gap-3 text-right">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#C95210] to-[#E06518] text-white flex items-center justify-center shrink-0 shadow-md">
            <Coins className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-bold text-xs text-amber-300">
              <Star className="w-3.5 h-3.5 fill-amber-300" />
              <span>+{toPersianDigits(toast.points)} امتیاز این خرید را بگیر!</span>
            </div>
            <p className="text-[11px] text-slate-300 line-clamp-1">
              با تکمیل سفارش «{toast.productName}» به امتیازات شما افزوده می‌شود.
            </p>
          </div>
        </div>

        <button
          onClick={() => setToast(null)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          aria-label="بستن"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
