import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import {
  Phone,
  KeyRound,
  CheckCircle2,
  ArrowRight,
  Clock,
  User,
} from 'lucide-react';
import { toPersianDigits } from '../../utils/formatters';
import { UserRole } from '../../types';

export const AuthModal: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthModalOpen, closeAuthModal, loginWithOtp, loginAs } = useAuth();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('09131512345');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [timer, setTimer] = useState(120);
  const [error, setError] = useState('');
  const [showDemoList, setShowDemoList] = useState(false);

  useEffect(() => {
    let interval: any;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim();
    if (!cleanPhone.startsWith('09') || cleanPhone.length < 11) {
      setError('لطفاً شماره موبایل معتبر ۱۱ رقمی (مانند ۰۹۱۳۱۵۱۲۳۴۵) وارد کنید.');
      return;
    }
    setError('');
    setStep('otp');
    setTimer(120);
    setOtpCode('');
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 4) {
      setError('کد تأیید باید ۴ رقم باشد.');
      return;
    }

    loginWithOtp(phone, fullName || undefined, companyName || undefined);
    setStep('phone');
    setOtpCode('');
    setError('');
    closeAuthModal();

    // Direct redirect to dedicated customer dashboard
    navigate('/account');
  };

  const handleQuickLogin = (role: UserRole) => {
    loginAs(role);
    closeAuthModal();
    if (role === 'dealer') {
      navigate('/dealer');
    } else if (role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/account');
    }
  };

  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;

  return (
    <Modal
      isOpen={isAuthModalOpen}
      onClose={() => {
        closeAuthModal();
        setStep('phone');
        setError('');
      }}
      title={step === 'phone' ? 'ورود مشتریان عزیز' : 'تأیید شماره موبایل (کد یک‌بار مصرف)'}
      size="md"
    >
      <div className="space-y-4 text-right">
        {step === 'phone' ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-[#55565A] space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-[#55565A]">
                <User className="w-4 h-4 text-[#E06518]" />
                <span>مشتری عزیز، خوش آمدید</span>
              </div>
              <p className="text-[11px] text-[#777A7D] leading-relaxed">
                جهت استعلام قیمت کالاها بر اساس فهرست قیمت و رتبه اعتباری شما، لطفاً شماره موبایل خود را وارد فرمایید. پس از ورود، مستقیماً به پنل اختصاصی مشتریان هدایت خواهید شد.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#55565A] mb-1">
                شماره تلفن همراه مشتری عزیز:
              </label>
              <div className="relative">
                <input
                  type="tel"
                  dir="ltr"
                  maxLength={11}
                  value={phone}
                  onChange={e => {
                    setPhone(e.target.value);
                    setError('');
                  }}
                  placeholder="09131512345"
                  className="w-full h-11 px-3 pr-10 border border-[#CBD2D8] rounded-xl text-sm font-mono text-left focus:outline-none focus:border-[#E06518] bg-slate-50 focus:bg-white"
                  required
                />
                <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[10px] text-[#777A7D] mt-1">
                کد تأیید ورود به صورت پیامک ارسال می‌شود.
              </p>
            </div>

            {error && (
              <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full h-11 bg-[#E06518] hover:bg-[#C95210] text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>دریافت کد ورود به پنل مشتری</span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>

            {/* Note about Agency applicants */}
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-[11px] text-blue-900 leading-relaxed flex items-center justify-between">
              <div>
                <span className="font-bold block">متقاضی عاملیت فروش و پخش هستید؟</span>
                <span className="text-blue-700">همکاران پخش باید از طریق فرم درخواست نمایندگی اقدام فرمایند.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  closeAuthModal();
                  navigate('/agency');
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[10px] shrink-0 cursor-pointer"
              >
                درخواست نمایندگی
              </button>
            </div>

            {/* Quick Access for testing */}
            <div className="pt-2 border-t border-[#CBD2D8] space-y-2">
              <button
                type="button"
                onClick={() => setShowDemoList(prev => !prev)}
                className="w-full text-center text-[11px] text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 cursor-pointer font-medium"
              >
                <span>ورود سریع با حساب‌های نمونه جهت بررسی سیستم</span>
              </button>

              {showDemoList && (
                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('retail')}
                    className="p-2 bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-300 rounded-lg text-right transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-[#55565A]">مشتری عزیز نمونه</div>
                    <div className="text-[10px] text-slate-500">پنل اختصاصی مشتری</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('dealer')}
                    className="p-2 bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-300 rounded-lg text-right transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-[#55565A]">عاملیت محترم یزد</div>
                    <div className="text-[10px] text-blue-600">پنل اختصاصی نمایندگی</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin')}
                    className="p-2 bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-300 rounded-lg text-right transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-[#55565A]">مدیر سیستم</div>
                    <div className="text-[10px] text-emerald-600">پنل اختصاصی مدیریت</div>
                  </button>
                </div>
              )}
            </div>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#777A7D]">کد تأیید برای شماره زیر ارسال شد:</span>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-xs text-[#E06518] hover:underline"
                >
                  ویرایش شماره
                </button>
              </div>
              <div className="font-mono font-bold text-[#55565A] text-sm text-left" dir="ltr">
                {phone}
              </div>
            </div>

            {/* Hint for OTP */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
                کد پیش‌فرض: <strong className="font-mono font-bold text-base text-amber-800">1234</strong>
              </span>
              <span className="text-[11px] text-amber-700">(یا هر ۴ رقم دیگر)</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#55565A] mb-1">
                کد ۴ رقمی پیامک‌شده:
              </label>
              <input
                type="text"
                dir="ltr"
                maxLength={4}
                autoFocus
                value={otpCode}
                onChange={e => {
                  setOtpCode(e.target.value.replace(/[^0-9]/g, ''));
                  setError('');
                }}
                placeholder="1234"
                className="w-full h-12 text-center tracking-[1em] text-lg font-mono font-black border border-[#CBD2D8] rounded-xl focus:outline-none focus:border-[#E06518] bg-slate-50 focus:bg-white"
                required
              />
            </div>

            {/* Optional profile info */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] text-[#777A7D] block">
                تکمیل مشخصات مشتری عزیز (اختیاری جهت درج در پیش‌فاکتور):
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="نام و نام خانوادگی مشتری"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="px-3 py-2 border border-[#CBD2D8] rounded-lg bg-white"
                />
                <input
                  type="text"
                  placeholder="نام شرکت / کارگاه (اختیاری)"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="px-3 py-2 border border-[#CBD2D8] rounded-lg bg-white"
                />
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-[#777A7D]">
              <div className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {toPersianDigits(minutes.toString().padStart(2, '0'))}:
                  {toPersianDigits(seconds.toString().padStart(2, '0'))}
                </span>
              </div>

              {timer === 0 ? (
                <button
                  type="button"
                  onClick={() => setTimer(120)}
                  className="text-xs text-[#E06518] hover:underline font-bold"
                >
                  ارسال مجدد کد تأیید
                </button>
              ) : (
                <span className="text-[11px] text-slate-400">تا درخواست مجدد کد</span>
              )}
            </div>

            <button
              type="submit"
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تأیید و ورود به پنل اختصاصی مشتری</span>
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
};
