import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Grid,
  ShoppingCart,
  PhoneCall,
  User,
  X,
  Camera,
  MessageCircle,
  Headphones,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { STORE_ASSETS } from '../../assets/images';

interface MobileBottomBarProps {
  onOpenMobileMenu?: () => void;
  onOpenSearch?: () => void;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = () => {
  const location = useLocation();
  const { itemCount } = useCart();
  const { currentUser, openAuthModal } = useAuth();
  const [isContactSheetOpen, setIsContactSheetOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const toPersianDigits = (num: number) => {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return num.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x, 10)]);
  };

  return (
    <>
      {/* Mobile Floating / Docked Bottom Navigation Bar (Visible only on < lg) */}
      <nav
        aria-label="منوی دسترسی سریع موبایل"
        className="fixed bottom-0 inset-x-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-t border-[#E3E5E6] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] lg:hidden transition-all duration-300 pb-[env(safe-area-inset-bottom)]"
        dir="rtl"
      >
        <div className="max-w-md mx-auto px-2 h-16 flex items-center justify-around">
          {/* 1. خرید (Shop / Catalog / Products) */}
          <Link
            to="/products"
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all ${
              isActive('/products') && !location.pathname.startsWith('/category')
                ? 'text-[#E06518]'
                : 'text-[#55565A] hover:text-[#E06518]'
            }`}
          >
            <div className="relative">
              <Home className="w-5 h-5 transition-transform" />
              {isActive('/products') && !location.pathname.startsWith('/category') && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#E06518] rounded-full shadow-[0_0_6px_#E06518]" />
              )}
            </div>
            <span className="text-[10px] font-bold mt-1 tracking-tight">خرید</span>
          </Link>

          {/* 2. دسته‌بندی (Categories) */}
          <Link
            to="/categories"
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all ${
              isActive('/categories') || isActive('/category')
                ? 'text-[#E06518]'
                : 'text-[#55565A] hover:text-[#E06518]'
            }`}
          >
            <div className="relative">
              <Grid className="w-5 h-5 transition-transform" />
              {(isActive('/categories') || isActive('/category')) && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#E06518] rounded-full shadow-[0_0_6px_#E06518]" />
              )}
            </div>
            <span className="text-[10px] font-bold mt-1 tracking-tight">دسته‌بندی</span>
          </Link>

          {/* 3. سبد خرید (Cart & RFQ) */}
          <Link
            to="/cart"
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all relative ${
              isActive('/cart') || isActive('/checkout')
                ? 'text-[#E06518]'
                : 'text-[#55565A] hover:text-[#E06518]'
            }`}
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5 transition-transform" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -left-2.5 min-w-[17px] h-4 px-1 rounded-full bg-[#E06518] text-white text-[9px] font-mono font-black flex items-center justify-center border-2 border-white shadow-xs">
                  {toPersianDigits(itemCount)}
                </span>
              )}
              {(isActive('/cart') || isActive('/checkout')) && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#E06518] rounded-full shadow-[0_0_6px_#E06518]" />
              )}
            </div>
            <span className="text-[10px] font-bold mt-1 tracking-tight">سبد خرید</span>
          </Link>

          {/* 4. پشتیبانی (Customer Support & Hotline Sheet) */}
          <button
            type="button"
            onClick={() => setIsContactSheetOpen(true)}
            className="flex flex-col items-center justify-center flex-1 h-full py-1 text-center text-[#55565A] hover:text-[#E06518] transition-all cursor-pointer"
            aria-label="پشتیبانی و ارتباط با کارشناسان"
          >
            <div className="relative">
              <PhoneCall className="w-5 h-5 transition-transform" />
            </div>
            <span className="text-[10px] font-bold mt-1 tracking-tight">پشتیبانی</span>
          </button>

          {/* 5. هایپر صنعت من (My Hyper Sanat / User Account & Portal) */}
          {currentUser ? (
            <Link
              to={currentUser.role === 'dealer' ? '/dealer' : currentUser.role === 'admin' ? '/admin' : '/account'}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all ${
                isActive('/account') || isActive('/dealer') || isActive('/admin')
                  ? 'text-[#E06518]'
                  : 'text-[#55565A] hover:text-[#E06518]'
              }`}
            >
              <div className="relative">
                <User className="w-5 h-5 transition-transform" />
                {(isActive('/account') || isActive('/dealer') || isActive('/admin')) && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#E06518] rounded-full shadow-[0_0_6px_#E06518]" />
                )}
              </div>
              <span className="text-[10px] font-bold mt-1 tracking-tight truncate max-w-[70px]">
                حساب من
              </span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal()}
              className="flex flex-col items-center justify-center flex-1 h-full py-1 text-center text-[#55565A] hover:text-[#E06518] transition-all cursor-pointer"
              aria-label="هایپر صنعت من (ورود / ثبت‌نام)"
            >
              <div className="relative">
                <User className="w-5 h-5 transition-transform" />
              </div>
              <span className="text-[10px] font-bold mt-1 tracking-tight truncate max-w-[70px]">
                ورود / عضویت
              </span>
            </button>
          )}
        </div>
      </nav>

      {/* Quick Contact & Hotline Bottom Sheet */}
      {isContactSheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden animate-in fade-in duration-200">
          <div
            onClick={() => setIsContactSheetOpen(false)}
            className="fixed inset-0 bg-[#12203C]/80 backdrop-blur-xs transition-opacity"
          />

          <div
            className="relative z-10 w-full bg-[#FFFFFF] border-t border-[#E3E5E6] rounded-t-3xl p-5 text-[#55565A] shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
            dir="rtl"
          >
            <div className="w-12 h-1.5 bg-[#E3E5E6] rounded-full mx-auto" />

            <div className="flex items-center justify-between border-b border-[#E3E5E6] pb-3">
              <div className="text-right">
                <h3 className="font-black text-base text-[#55565A]">پشتیبانی و ارتباط با کارشناسان اطلس</h3>
                <p className="text-xs text-[#777A7D] mt-0.5">پاسخگویی فنی و استعلام فوری قطعات خطوط تولید</p>
              </div>
              <button
                type="button"
                onClick={() => setIsContactSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F6F7F7] text-[#55565A] hover:text-[#E06518] flex items-center justify-center cursor-pointer border border-[#E3E5E6]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <a
                href="tel:03538739900"
                className="flex items-center justify-between p-3.5 bg-[#E06518] hover:bg-[#C95210] rounded-2xl text-white font-bold shadow-sm cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#12203C]/15 flex items-center justify-center">
                    <PhoneCall className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black">تماس مستقیم با واحد فروش</div>
                    <div className="text-xs font-mono text-orange-100 mt-0.5" dir="ltr">
                      ۰۳۵-۳۸۷۳۹۹۰۰
                    </div>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5" />
              </a>

              <a
                href="tel:03538739988"
                className="flex items-center justify-between p-3.5 bg-[#F6F7F7] border border-[#E3E5E6] rounded-2xl text-[#55565A] font-bold hover:border-[#E06518] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E06518]/10 border border-[#E06518]/30 flex items-center justify-center text-[#E06518]">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">پشتیبانی فنی و مهندسی</div>
                    <div className="text-xs font-mono text-[#777A7D] mt-0.5" dir="ltr">
                      ۰۳۵-۳۸۷۳۹۹۸۸
                    </div>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-[#777A7D]" />
              </a>

              <a
                href="https://wa.me/989903427027"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3.5 bg-[#F6F7F7] border border-emerald-500/40 rounded-2xl text-[#55565A] font-bold hover:border-emerald-500 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-700">ارتباط در واتس‌اپ</div>
                    <div className="text-xs font-mono text-[#777A7D] mt-0.5" dir="ltr">
                      +۹۸ ۹۹۰ ۳۴۲ ۷۰۲۷
                    </div>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-emerald-600" />
              </a>

              {/* Face-to-Face Live AI FORZA Voice Conversation Trigger */}
              <button
                type="button"
                onClick={() => {
                  setIsContactSheetOpen(false);
                  window.dispatchEvent(new CustomEvent('open-forza-face-to-face'));
                }}
                className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-[#E06518] via-amber-600 to-[#C95210] text-white border border-orange-400 rounded-2xl font-bold shadow-lg shadow-orange-950/20 cursor-pointer active:scale-98 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-black/40 border border-white/30 overflow-hidden flex items-center justify-center relative shrink-0">
                    <img
                      src={STORE_ASSETS.aiForzaCyborg}
                      alt="AI FORZA"
                      className="w-full h-full object-cover object-top"
                    />
                    <span className="absolute bottom-0 left-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black animate-pulse" />
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-white flex items-center gap-1.5">
                      <span>مکالمه چهره به چهره با AI FORZA</span>
                      <span className="px-1.5 py-0.2 bg-white text-[#E06518] text-[9px] rounded font-black animate-pulse">
                        زنده
                      </span>
                    </div>
                    <div className="text-xs text-orange-100 mt-0.5">
                      مکالمه دوطرفه صوتی، شناسایی قطعه و پاسخ فوری
                    </div>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>

              {/* AI Consultation Chat Trigger */}
              <button
                type="button"
                onClick={() => {
                  setIsContactSheetOpen(false);
                  window.dispatchEvent(new CustomEvent('open-ai-consult'));
                }}
                className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-[#2B313A] to-[#1E232B] text-white border border-[#3F4550] rounded-2xl font-bold hover:border-[#E06518] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E06518] flex items-center justify-center text-white shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>مشاوره و محاسبات هوشمند AI</span>
                      <span className="px-1.5 py-0.2 bg-[#E06518] text-[9px] rounded font-black">آنلاین</span>
                    </div>
                    <div className="text-xs text-slate-300 mt-0.5">محاسبه طول تسمه، نسبت دور و انتخاب برند</div>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-[#E06518]" />
              </button>

              {/* AI Image / Camera Search Trigger with #55565A + #E06518 */}
              <button
                type="button"
                onClick={() => {
                  setIsContactSheetOpen(false);
                  window.dispatchEvent(new CustomEvent('open-visual-search'));
                }}
                className="w-full flex items-center justify-between p-3.5 bg-[#55565A] text-white border border-[#55565A] rounded-2xl font-bold hover:bg-[#55565A]/90 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E06518] flex items-center justify-center text-white">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">شناسایی تصویری قطعه (هوش مصنوعی)</div>
                    <div className="text-xs text-slate-200 mt-0.5">ارسال عکس پلاک یا قطعه جهت تطبیق هوشمند</div>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-[#E06518]" />
              </button>
            </div>

            <div className="pt-2 text-center text-[11px] text-[#777A7D] border-t border-[#E3E5E6]">
              ساعات پاسخگویی: شنبه تا پنجشنبه از ساعت ۸:۰۰ الی ۲۰:۰۰
            </div>
          </div>
        </div>
      )}
    </>
  );
};
