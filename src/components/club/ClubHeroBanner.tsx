// src/components/club/ClubHeroBanner.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Star,
  Coins,
  ShieldCheck,
  Users,
  ArrowLeft,
  ChevronLeft,
  Award,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toPersianDigits } from '../../utils/formatters';

export const ClubHeroBanner: React.FC = () => {
  const { currentUser, openAuthModal } = useAuth();

  return (
    <div className="relative overflow-hidden rounded-[16px] bg-gradient-to-l from-[#55565A] via-[#112347] to-[#55565A] text-white border-2 border-[#E06518]/40 shadow-lg p-6 sm:p-8">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#E06518_1.5px,transparent_1.5px)] [background-size:20px_20px]" />
      
      {/* Glowing Star Graphic in background */}
      <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-[#E06518]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Right / Main Content */}
        <div className="space-y-4 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#E06518] text-white shadow-xs">
              <Star className="w-3.5 h-3.5 fill-white text-white" />
              <span>باشگاه مشتریان و وفاداری اطلس</span>
            </span>
            <span className="text-[11px] text-amber-300 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-800/80 font-medium">
              تأسیس ۱۳۶۶ • انبار مرکزی یزد
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-snug flex items-center gap-2.5">
            <Star className="w-7 h-7 sm:w-8 sm:h-8 text-[#E06518] fill-[#E06518] shrink-0 drop-shadow-[0_0_12px_rgba(249,115,22,0.6)]" />
            <span>با هر خرید، امتیاز بگیر؛ امتیازت را تخفیف کن!</span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed text-justify">
            ساده‌ترین و شفاف‌ترین سیستم پاداش در صنعت تجهیزات انتقال قدرت. بدون قرعه‌کشی، هر امتیاز کسب‌شده در فاکتور بعدی مستقیماً به اعتبار نقدی تبدیل می‌شود.
          </p>

          {/* 3 Key Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/80">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-[#E06518] flex items-center justify-center shrink-0 border border-orange-500/30">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">هر ۱ امتیاز = ۱٬۰۰۰ تومان</h4>
                <p className="text-[10px] text-slate-300 mt-0.5">کسر آنی و خودکار از مبلغ نهایی سفارش در سبد خرید</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/80">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">ارتقا به نقره‌ای و طلایی</h4>
                <p className="text-[10px] text-slate-300 mt-0.5">تا ۵٪ تخفیف مازاد دائمی + ارسال کاملاً رایگان</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/80">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">۵۰ امتیاز هدیه عضویت</h4>
                <p className="text-[10px] text-slate-300 mt-0.5">واریز آنی در ثبت‌نام + ۵۰ امتیاز با معرفی دوستان</p>
              </div>
            </div>
          </div>
        </div>

        {/* Left / CTA Box */}
        <div className="w-full lg:w-auto shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3 items-stretch lg:items-end justify-center">
          {currentUser ? (
            <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 text-center lg:text-right space-y-2 min-w-[220px]">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>موجودی امتیاز شما:</span>
                <span className="font-bold text-amber-400 text-sm">
                  {toPersianDigits(currentUser.clubPoints)} امتیاز
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                معادل {toPersianDigits((currentUser.clubPoints * 1000).toLocaleString('fa-IR'))} تومان اعتبار خرید
              </div>
              <Link
                to="/club"
                className="w-full mt-2 py-2.5 px-4 bg-[#E06518] hover:bg-[#C95210] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>مشاهده پرتال باشگاه من</span>
                <ChevronLeft className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2 min-w-[220px]">
              <button
                onClick={() => openAuthModal()}
                className="w-full py-3 px-6 bg-[#E06518] hover:bg-[#C95210] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group"
              >
                <Star className="w-4 h-4 fill-white group-hover:rotate-12 transition-transform" />
                <span>عضویت رایگان و دریافت ۵۰ امتیاز</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <Link
                to="/club"
                className="w-full py-2 px-4 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-colors border border-slate-700 flex items-center justify-center gap-1"
              >
                <span>آشنایی کامل با سطوح و جوایز باشگاه</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
