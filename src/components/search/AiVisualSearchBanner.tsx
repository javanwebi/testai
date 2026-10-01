import React, { useState } from 'react';
import { Camera, Sparkles, Ruler, ArrowLeft, Layers, Zap } from 'lucide-react';
import { AiVisualPartSearchModal } from './AiVisualPartSearchModal';

export const AiVisualSearchBanner: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#55565A] via-[#152544] to-[#1E293B] text-white p-6 sm:p-7 border border-slate-700 shadow-md">
        {/* Background glow and subtle dots */}
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-[#E06518]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-10 top-0 w-64 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Left / Info */}
          <div className="space-y-3 text-right max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#E06518]" />
              <span>فناوری تشخیص قطعه با هوش مصنوعی (Gemini AI)</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#E06518] animate-ping" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
              نمی‌دانید کد فنی قطعه یا تسمه شما چیست؟
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              در ۳ گام ساده و بدون نیاز به دانستن کد فنی: ابتدا <strong className="text-orange-400">عکس قطعه</strong> را ثبت کنید، سپس <strong className="text-orange-400">طول و عرض</strong> و در مرحله بعد <strong className="text-orange-400">کاربرد و ویژگی‌ها</strong> را مشخص نمایید تا هوش مصنوعی نزدیک‌ترین کالا را از کاتالوگ اطلس برایتان پیدا کند.
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-1">
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
                <Camera className="w-3.5 h-3.5 text-[#E06518]" />
                <span>۱. عکس قطعه</span>
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
                <Ruler className="w-3.5 h-3.5 text-blue-400" />
                <span>۲. طول و عرض</span>
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>۳. کاربرد و ویژگی‌ها</span>
              </span>
            </div>
          </div>

          {/* Right / CTA Button & Visual Element */}
          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto h-12 px-7 bg-[#E06518] hover:bg-[#C95210] text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer group"
            >
              <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>شروع جستجوی هوشمند با عکس و ابعاد</span>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      <AiVisualPartSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
