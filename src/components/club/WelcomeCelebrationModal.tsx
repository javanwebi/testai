// src/components/club/WelcomeCelebrationModal.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import {
  Sparkles,
  Gift,
  Star,
  Copy,
  Check,
  ArrowLeft,
  Coins,
  Award,
  ShoppingBag,
} from 'lucide-react';
import { toPersianDigits } from '../../utils/formatters';

interface WelcomeCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  pointsAwarded?: number;
}

export const WelcomeCelebrationModal: React.FC<WelcomeCelebrationModalProps> = ({
  isOpen,
  onClose,
  userName = 'کاربر گرامی',
  pointsAwarded = 50,
}) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const discountCode = 'WELCOME10';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(discountCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGoToClub = () => {
    onClose();
    navigate('/club');
  };

  const handleStartShopping = () => {
    onClose();
    navigate('/category/industrial-belts');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" title="">
      <div className="relative text-center py-2 px-1 space-y-6">
        {/* Festive Header Graphic */}
        <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24">
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-full animate-ping opacity-25" />
          <div className="relative w-full h-full rounded-full bg-gradient-to-tr from-[#C95210] to-[#E06518] text-white flex items-center justify-center shadow-xl border-4 border-white">
            <Gift className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-md" />
          </div>
          {/* Floating Stars */}
          <Star className="absolute -top-1 -right-1 w-6 h-6 text-amber-400 fill-amber-400 animate-bounce" />
          <Sparkles className="absolute -bottom-1 -left-1 w-5 h-5 text-amber-300" />
        </div>

        {/* Title & Greeting */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-orange-100 text-[#C95210]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>عضویت شما با موفقیت ثبت شد</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#55565A]">
            به خانواده هایپر صنعت اطلس خوش آمدید!
          </h2>
          <p className="text-xs text-[#777A7D] max-w-sm mx-auto">
            {userName}، هدیه ورود به باشگاه مشتریان با موفقیت به کیف پول اعتباری شما واریز شد.
          </p>
        </div>

        {/* 50 Points Banner */}
        <div className="bg-gradient-to-l from-amber-500/10 via-orange-500/15 to-amber-500/10 border-2 border-orange-300 rounded-2xl p-4 flex items-center justify-between gap-3 text-right">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#E06518] text-white flex items-center justify-center shrink-0 shadow-md">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-[#55565A]">
                {toPersianDigits(pointsAwarded)} امتیاز خوش‌آمدگویی واریز شد!
              </h4>
              <p className="text-[11px] text-[#777A7D] mt-0.5">
                معادل {toPersianDigits((pointsAwarded * 1000).toLocaleString('fa-IR'))} تومان اعتبار نقدی برای خرید قطعات
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 shrink-0">
            فعال شد ✓
          </span>
        </div>

        {/* Discount Code Box */}
        <div className="bg-slate-50 rounded-2xl border border-[#CBD2D8] p-4 text-right space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#55565A]">کد تخفیف ویژه اولین خرید شما:</span>
            <span className="text-[11px] text-[#C95210] font-semibold">۱۰٪ تخفیف تا سقف ۵۰۰ هزار تومان</span>
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl p-2">
            <span className="flex-1 font-mono font-black text-base text-[#55565A] tracking-widest text-center">
              {discountCode}
            </span>
            <button
              onClick={handleCopyCode}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>کپی شد!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>کپی کد</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[10px] text-[#777A7D]">
            کد فوق را در مرحله تسویه‌حساب در فیلد کوپن وارد نمایید تا ۱۰٪ از مبلغ فاکتور کسر گردد.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
          <button
            onClick={handleGoToClub}
            className="w-full py-3 px-4 bg-[#55565A] hover:bg-[#1B293E] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>مشاهده باشگاه مشتریان من</span>
          </button>

          <button
            onClick={handleStartShopping}
            className="w-full py-3 px-4 bg-[#E06518] hover:bg-[#C95210] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>شروع خرید با تخفیف</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
