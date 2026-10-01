import React from 'react';
import { FileEdit, SearchCheck, CheckCircle2, LayoutDashboard, ChevronLeft } from 'lucide-react';
import { toPersianDigits } from '../../utils/formatters';

interface AgencyStepperProps {
  currentStep?: number; // 1 to 4
}

export const AgencyStepper: React.FC<AgencyStepperProps> = ({ currentStep = 1 }) => {
  const steps = [
    {
      step: 1,
      title: 'ثبت درخواست',
      desc: 'تکمیل فرم صنفی و بارگذاری جواز',
      icon: <FileEdit className="w-5 h-5" />,
    },
    {
      step: 2,
      title: 'بررسی و استعلام',
      desc: 'اعتبارسنجی حوزه فعالیت و انبار',
      icon: <SearchCheck className="w-5 h-5" />,
    },
    {
      step: 3,
      title: 'تأیید و توافق‌نامه',
      desc: 'تعیین سقف خرید اعتباری و سهمیه',
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    {
      step: 4,
      title: 'فعال‌سازی پنل پخش',
      desc: 'ورود به پنل و سفارش با قیمت همکار',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
      <div className="text-right mb-4">
        <h3 className="text-xs font-bold text-[#777A7D] uppercase tracking-wider">
          مراحل ۴ گانه اخذ عاملیت و دسترسی به پنل پخش:
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
        {steps.map((s, idx) => {
          const isDone = s.step < currentStep;
          const isCurrent = s.step === currentStep;

          return (
            <div
              key={s.step}
              className={`relative rounded-xl p-3.5 border transition-all text-right flex items-start gap-3 ${
                isCurrent
                  ? 'bg-orange-50/80 border-[#E06518] shadow-xs'
                  : isDone
                  ? 'bg-emerald-50/60 border-emerald-300'
                  : 'bg-slate-50 border-slate-200 opacity-75'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-xs ${
                  isCurrent
                    ? 'bg-[#E06518] text-white'
                    : isDone
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-[#777A7D]'
                }`}
              >
                {s.icon}
              </div>

              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      isCurrent
                        ? 'bg-orange-200 text-[#C95210]'
                        : isDone
                        ? 'bg-emerald-200 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    مرحله {toPersianDigits(s.step)}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-bold text-[#E06518] animate-pulse">
                      (مرحله جاری)
                    </span>
                  )}
                </div>
                <h4
                  className={`text-xs font-bold truncate ${
                    isCurrent ? 'text-[#55565A]' : isDone ? 'text-emerald-900' : 'text-[#777A7D]'
                  }`}
                >
                  {s.title}
                </h4>
                <p className="text-[10px] text-[#777A7D] leading-relaxed line-clamp-1">
                  {s.desc}
                </p>
              </div>

              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute -left-2.5 top-1/2 -translate-y-1/2 z-10 text-slate-300">
                  <ChevronLeft className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
