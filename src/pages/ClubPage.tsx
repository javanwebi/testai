// src/pages/ClubPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  Award,
  Coins,
  ShieldCheck,
  Users,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Share2,
  Gift,
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  FileSearch,
  MessageSquare,
  UserPlus,
  HelpCircle,
  Truck,
  PhoneCall,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useClubPoints } from '../context/ClubPointsContext';
import {
  clubService,
  TIER_CONFIG,
  HOW_TO_EARN_RULES,
  CLUB_FAQS,
  POINT_VALUE_TOMAN,
} from '../services/clubService';
import { toPersianDigits, formatPrice } from '../utils/formatters';
import { ClubTier } from '../types';

export const ClubPage: React.FC = () => {
  const { currentUser, openAuthModal } = useAuth();
  const { points, tier, transactions } = useClubPoints();

  // Calculation for progress
  // Mock cumulative spend based on points / role or default 12,000,000 Tomans
  const mockCumulativeSpend = currentUser
    ? tier === 'gold'
      ? 65000000
      : tier === 'silver'
      ? 28000000
      : 8500000
    : 0;

  const progress = clubService.getTierProgress(mockCumulativeSpend);
  const tierInfo = clubService.getTierInfo(tier);

  // Referral code
  const referralCode = clubService.generateReferralCode(currentUser?.phone, currentUser?.id);
  const referralLink = clubService.generateReferralLink(referralCode);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Interactive Calculator Slider
  const [calcPoints, setCalcPoints] = useState(points > 0 ? points : 100);
  const calcTomanValue = clubService.calculatePointsValue(calcPoints);

  // FAQ open/close state
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');

  const toggleFaq = (id: string) => {
    setOpenFaqId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. HERO HEADER: Attractive Navy - Orange */}
      <div className="relative overflow-hidden rounded-[18px] bg-gradient-to-l from-[#55565A] via-[#112240] to-[#55565A] text-white p-6 sm:p-10 border-2 border-[#E06518]/40 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(#E06518_1px,transparent_1px)] opacity-15 [background-size:20px_20px] pointer-events-none" />
        <div className="absolute -left-16 -top-16 w-56 h-56 bg-[#E06518]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-right">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black bg-[#E06518] text-white shadow-md">
              <Star className="w-4 h-4 fill-white" />
              <span>سامانه وفاداری و پاداش خرید بازرگانی اطلس یزد</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              باشگاه مشتریان هایپر صنعت
            </h1>

            <p className="text-xs sm:text-sm text-slate-200 max-w-xl leading-relaxed">
              با هر خرید تجهیزات صنعتی، استعلام فنی و معرفی همکاران امتیاز بگیرید و در سفارش‌های بعدی از تخفیف‌های میلیونی و مزایای B2B بهره‌مند شوید.
            </p>
          </div>

          {/* Quick Header Metric or Auth CTA */}
          <div className="shrink-0">
            {currentUser ? (
              <div className="bg-slate-800/90 backdrop-blur-xs border border-slate-700 p-4 sm:p-5 rounded-2xl text-center space-y-2 min-w-[240px]">
                <span className="text-xs text-slate-300 block">موجودی امتیاز در دسترس شما</span>
                <div className="flex items-center justify-center gap-2 font-mono font-black text-3xl text-amber-400">
                  <Coins className="w-7 h-7 text-amber-400" />
                  <span>{toPersianDigits(points)}</span>
                </div>
                <div className="text-xs font-bold text-slate-200">
                  معادل {toPersianDigits(calcPoints ? (points * 1000).toLocaleString('fa-IR') : '۰')} تومان اعتبار
                </div>
                <div className="pt-2">
                  <span
                    className="inline-block text-[11px] font-black px-3 py-1 rounded-full"
                    style={{
                      backgroundColor: `${tierInfo.badgeHex}25`,
                      color: tierInfo.badgeHex,
                      border: `1px solid ${tierInfo.badgeHex}50`,
                    }}
                  >
                    {tierInfo.label}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/90 border border-slate-700 p-5 rounded-2xl text-center space-y-3 min-w-[240px]">
                <p className="text-xs text-slate-200">هنوز عضو باشگاه نشده‌اید؟</p>
                <div className="text-sm font-bold text-amber-300">
                  ۵۰ امتیاز هدیه عضویت آنی
                </div>
                <button
                  onClick={() => openAuthModal()}
                  className="w-full py-2.5 px-4 bg-[#E06518] hover:bg-[#C95210] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>عضویت سریع با شماره موبایل</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. PROFILE POINTS CARD & PROGRESS BAR */}
      <div className="bg-white rounded-[16px] border border-[#CBD2D8] shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-[#CBD2D8]">
          {/* User & Current Points */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#C95210] to-[#E06518] text-white flex items-center justify-center shadow-lg shrink-0">
              <Coins className="w-8 h-8" />
            </div>
            <div className="space-y-1 text-right">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-[#55565A]">
                  {currentUser ? currentUser.fullName : 'کاربر مهمان'}
                </h2>
                <span
                  className="text-xs font-black px-3 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${tierInfo.badgeHex}20`,
                    color: tierInfo.badgeHex,
                    border: `1px solid ${tierInfo.badgeHex}40`,
                  }}
                >
                  {tierInfo.label}
                </span>
              </div>
              <p className="text-xs text-[#777A7D]">
                {currentUser ? `شماره موبایل: ${currentUser.phone}` : 'برای ثبت امتیازها وارد حساب خود شوید'}
              </p>
            </div>
          </div>

          {/* Points Breakdown Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right min-w-[140px]">
              <span className="text-[11px] text-[#777A7D] block">مجموع امتیاز فعال:</span>
              <span className="font-mono font-black text-lg text-[#55565A]">
                {toPersianDigits(points)} <span className="text-xs font-normal">امتیاز</span>
              </span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-right min-w-[150px]">
              <span className="text-[11px] text-emerald-700 block">اعتبار تخفیف نقدی:</span>
              <span className="font-mono font-black text-lg text-emerald-800">
                {toPersianDigits((points * POINT_VALUE_TOMAN).toLocaleString('fa-IR'))}{' '}
                <span className="text-xs font-normal">تومان</span>
              </span>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-right min-w-[150px]">
              <span className="text-[11px] text-amber-800 block">تاریخ انقضای امتیازها:</span>
              <span className="font-bold text-xs text-amber-900">
                ۲۹ اسفند ۱۴۰۴ (۱۲ ماه)
              </span>
            </div>
          </div>
        </div>

        {/* Tier Progress Bar */}
        <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#E06518]" />
              <span className="font-bold text-[#55565A]">پیشرفت تا سطح بعدی ({progress.nextTier ? TIER_CONFIG[progress.nextTier].label : 'حداکثر سطح'}):</span>
            </div>
            <div className="font-medium text-[#777A7D]">
              خرید تجمعی: <strong className="text-[#55565A]">{toPersianDigits(progress.currentSpend.toLocaleString('fa-IR'))}</strong> از{' '}
              <strong>{toPersianDigits(progress.targetSpend.toLocaleString('fa-IR'))}</strong> تومان
            </div>
          </div>

          {/* Progress Bar Track */}
          <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${progress.progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#777A7D]">
            <span>{toPersianDigits(progress.progressPercent)}٪ تکمیل شده</span>
            {progress.remainingSpend > 0 ? (
              <span>
                تنها{' '}
                <strong className="text-[#C95210] font-bold">
                  {toPersianDigits(progress.remainingSpend.toLocaleString('fa-IR'))} تومان
                </strong>{' '}
                خرید دیگر تا ارتقا به {progress.nextTier ? TIER_CONFIG[progress.nextTier].label : ''}
              </span>
            ) : (
              <span className="text-emerald-600 font-bold">تبریک! شما به بالاترین سطح باشگاه دست یافته‌اید.</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. TABLE / CARDS: چطور امتیاز بگیرم؟ */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[#CBD2D8] pb-3">
          <div className="w-2.5 h-6 bg-[#E06518] rounded-xs" />
          <h2 className="text-lg font-black text-[#55565A]">
            روش‌های کسب امتیاز در هایپر صنعت اطلس
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {HOW_TO_EARN_RULES.map(rule => (
            <div
              key={rule.id}
              className="bg-white rounded-[14px] border border-[#CBD2D8] p-5 shadow-xs hover:shadow-md hover:border-orange-200 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-[#C95210] border border-orange-100">
                    {rule.badgeText}
                  </span>
                  <div className="flex items-center gap-1 text-sm font-black text-amber-600 font-mono">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <span>+{toPersianDigits(rule.points)}</span>
                    <span className="text-xs text-[#777A7D]">امتیاز</span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-[#55565A]">{rule.title}</h3>
                <p className="text-xs text-[#777A7D] leading-relaxed">{rule.description}</p>
              </div>

              {rule.id === 'register' && !currentUser && (
                <button
                  onClick={() => openAuthModal()}
                  className="w-full py-2 bg-orange-50 hover:bg-[#E06518] text-[#E06518] hover:text-white text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
                >
                  همین حالا ثبت‌نام کنید
                </button>
              )}

              {rule.id === 'purchase' && (
                <Link
                  to="/category/industrial-belts"
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-[#55565A] text-xs font-bold rounded-xl transition-colors text-center border border-slate-200"
                >
                  مشاهده کاتالوگ و خرید
                </Link>
              )}

              {rule.id === 'inquiry' && (
                <Link
                  to="/search"
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-[#55565A] text-xs font-bold rounded-xl transition-colors text-center border border-slate-200"
                >
                  ثبت استعلام قطعات سفارشی
                </Link>
              )}

              {rule.id === 'referral' && (
                <button
                  onClick={handleCopyLink}
                  className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition-colors cursor-pointer text-center border border-emerald-200"
                >
                  {copiedLink ? 'لینک دعوت کپی شد ✓' : 'کپی لینک دعوت دوستان'}
                </button>
              )}

              {rule.id === 'review' && (
                <Link
                  to="/account/orders"
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-[#55565A] text-xs font-bold rounded-xl transition-colors text-center border border-slate-200"
                >
                  ثبت نظر برای سفارش‌های من
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4. TIERS COMPARISON TABLE (جدول سطح‌های باشگاه) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[#CBD2D8] pb-3">
          <div className="w-2.5 h-6 bg-blue-600 rounded-xs" />
          <h2 className="text-lg font-black text-[#55565A]">
            جدول مقایسه سطوح کاربری و مزایای هر رده
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Bronze Tier Card */}
          <div className="bg-white rounded-[16px] border-2 border-[#9B5330]/40 p-6 shadow-xs flex flex-col justify-between space-y-5 relative">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black px-3 py-1 rounded-full bg-[#9B5330]/10 text-[#9B5330] border border-[#9B5330]/30">
                  سطح برنزی (پیش‌فرض)
                </span>
                <Award className="w-6 h-6 text-[#9B5330]" />
              </div>
              <h3 className="text-base font-black text-[#55565A]">عضویت پایه خریداران</h3>
              <p className="text-xs text-[#777A7D] leading-relaxed">
                ویژه کلیه اعضای ثبت‌نام‌شده بدون سقف خرید؛ تبدیل آنی امتیازات و دسترسی به تخفیف‌های مناسبتی.
              </p>

              <div className="space-y-2.5 pt-2 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>کسب ۱ امتیاز به ازای هر ۱۰۰ هزار تومان</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>تبدیل مستقیم امتیاز به تخفیف نقدی فاکتور</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>دسترسی به پیش‌فاکتور رسمی آنلاین</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-center">
              <span className="text-xs text-slate-500 font-medium">بدون حداقل مبلغ سفارش</span>
            </div>
          </div>

          {/* Silver Tier Card */}
          <div className="bg-white rounded-[16px] border-2 border-slate-300 p-6 shadow-sm flex flex-col justify-between space-y-5 relative">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-300">
                  سطح نقره‌ای (کارگاه‌ها و تولیدی‌ها)
                </span>
                <Award className="w-6 h-6 text-slate-600" />
              </div>
              <h3 className="text-base font-black text-[#55565A]">خریداران فعال صنعتی</h3>
              <p className="text-xs text-[#777A7D] leading-relaxed">
                خرید تجمعی بیش از ۲۰ میلیون تومان؛ ۲٪ تخفیف خودکار روی تمام فاکتورها به همراه اولویت ارسال انبار.
              </p>

              <div className="space-y-2.5 pt-2 text-xs">
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-[#E06518] shrink-0" />
                  <span>۲٪ تخفیف خودکار روی تمام سفارش‌ها</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>ضریب ۱.۲ برابری در کسب امتیاز خرید</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>اولویت بسته‌بندی و تخصیص موجودی انبار</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>هدیه ویژه سالروز ثبت‌نام در سامانه</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-center">
              <span className="text-xs font-bold text-slate-700">خرید تجمعی: ۲۰+ میلیون تومان</span>
            </div>
          </div>

          {/* Gold Tier Card */}
          <div className="bg-gradient-to-b from-amber-500/10 to-white rounded-[16px] border-2 border-amber-400 p-6 shadow-md flex flex-col justify-between space-y-5 relative">
            <div className="absolute top-0 left-0 bg-amber-500 text-white font-bold text-[10px] px-3 py-1 rounded-br-xl">
              بالاترین رده پاداش
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  سطح طلایی (کارخانجات و صنایع بزرگ)
                </span>
                <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
              </div>
              <h3 className="text-base font-black text-[#55565A]">مشتریان طلایی بازرگانی</h3>
              <p className="text-xs text-[#777A7D] leading-relaxed">
                خرید بیش از ۵۰ میلیون تومان؛ ۵٪ تخفیف خودکار + ارسال کاملاً رایگان + کارشناس اختصاصی خط کارخانه.
              </p>

              <div className="space-y-2.5 pt-2 text-xs">
                <div className="flex items-center gap-2 text-amber-900 font-black">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>۵٪ تخفیف خودکار روی تمام فاکتورها</span>
                </div>
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <Truck className="w-4 h-4 text-[#E06518] shrink-0" />
                  <span>ارسال رایگان کلیه بارها (باربری صنعتی و پست)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <PhoneCall className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>پشتیبانی اختصاصی خط تولید ۲۴ ساعته</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>ضریب ۱.۵ برابری در کسب امتیاز خرید</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>امکان خرید اعتباری و تسویه چکی کارخانجات</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-amber-200 text-center">
              <span className="text-xs font-black text-amber-800">خرید تجمعی: ۵۰+ میلیون تومان</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. INTERACTIVE CALCULATOR: تبدیل امتیاز به تخفیف */}
      <div className="bg-white rounded-[16px] border border-[#CBD2D8] shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2 border-b border-[#CBD2D8] pb-3">
          <div className="w-2.5 h-6 bg-emerald-600 rounded-xs" />
          <h2 className="text-lg font-black text-[#55565A]">
            محاسبه‌گر هوشمند تبدیل امتیاز به تخفیف نقدی
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Slider & Controls */}
          <div className="space-y-5">
            <p className="text-xs text-[#777A7D] leading-relaxed">
              اسلایدر زیر را جابجا کنید تا ببینید هر میزان امتیاز، چقدر از هزینه فاکتور شما را در تسویه‌حساب (چک‌اوت) کسر می‌کند:
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#55565A]">
                <span>تعداد امتیاز مورد نظر برای تبدیل:</span>
                <span className="font-mono text-base text-[#E06518]">
                  {toPersianDigits(calcPoints)} امتیاز
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="1000"
                step="10"
                value={calcPoints}
                onChange={e => setCalcPoints(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#E06518]"
              />

              <div className="flex items-center justify-between text-[11px] text-[#777A7D]">
                <span>۰ امتیاز</span>
                <span>۵۰۰ امتیاز</span>
                <span>۱٬۰۰۰ امتیاز</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[#55565A]">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>نحوه استفاده در سبد خرید:</span>
              </div>
              <p className="text-[11px] text-[#777A7D] leading-relaxed">
                در صفحه سبد خرید یا مرحله سوم چک‌اوت، کلید «استفاده از امتیاز باشگاه» را روشن کنید. تخفیف حاصل بلافاصله از مبلغ نهایی سفارش کسر می‌گردد.
              </p>
            </div>
          </div>

          {/* Result Card */}
          <div className="bg-gradient-to-br from-[#55565A] to-[#1E3A5F] text-white p-6 rounded-2xl border border-slate-700 shadow-lg text-center space-y-4">
            <span className="text-xs text-slate-300 font-medium">ارزش نقدی فاکتور:</span>
            <div className="font-mono font-black text-3xl sm:text-4xl text-amber-400">
              {toPersianDigits(calcTomanValue.toLocaleString('fa-IR'))}{' '}
              <span className="text-sm font-normal text-slate-200">تومان</span>
            </div>
            <p className="text-xs text-slate-300">
              با استفاده از {toPersianDigits(calcPoints)} امتیاز، این مبلغ از فاکتور خرید شما کسر می‌شود.
            </p>

            <Link
              to="/category/industrial-belts"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-[#E06518] hover:bg-[#C95210] text-white text-xs font-bold rounded-xl transition-all shadow-md"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>خرید کالا و استفاده از امتیاز</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 6. REFERRAL PROGRAM SECTION: سیستم دعوت از همکاران */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 rounded-[16px] border border-emerald-300 p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#55565A]">
                سیستم معرفی به دوستان (۵۰ امتیاز هدیه برای هر دو طرف)
              </h2>
              <p className="text-xs text-[#777A7D] mt-0.5">
                با ارسال کد یا لینک دعوت، به ازای هر ثبت‌نام موفق ۵۰ امتیاز به حساب شما و ۵۰ امتیاز به حساب دوستتان افزوده می‌شود.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Referral Code */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-[#55565A] block">کد دعوت اختصاصی شما:</span>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl p-2">
              <span className="flex-1 font-mono font-black text-sm text-[#55565A] text-center">
                {referralCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-lg bg-[#55565A] hover:bg-[#1E3A5F] text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'کپی شد' : 'کپی کد'}</span>
              </button>
            </div>
          </div>

          {/* Referral Link */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-[#55565A] block">لینک مستقیم دعوت:</span>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl p-2">
              <span className="flex-1 font-mono text-xs text-[#777A7D] truncate text-left" dir="ltr">
                {referralLink}
              </span>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'کپی شد' : 'اشتراک‌گذاری'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 7. FAQ ACCORDION: سوالات متداول باشگاه */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[#CBD2D8] pb-3">
          <HelpCircle className="w-5 h-5 text-[#E06518]" />
          <h2 className="text-lg font-black text-[#55565A]">
            سوالات متداول باشگاه مشتریان
          </h2>
        </div>

        <div className="space-y-2.5">
          {CLUB_FAQS.map(faq => {
            const isOpen = openFaqId === faq.id;
            return (
              <div
                key={faq.id}
                className="bg-white rounded-xl border border-[#CBD2D8] overflow-hidden transition-all shadow-xs"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-4 flex items-center justify-between text-right font-bold text-xs sm:text-sm text-[#55565A] hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span>{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#E06518] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-[#777A7D] leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
