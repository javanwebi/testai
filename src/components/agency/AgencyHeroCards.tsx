import React from 'react';
import { Package, Truck, Receipt, MessageSquareCode } from 'lucide-react';

export const AgencyHeroCards: React.FC = () => {
  const cards = [
    {
      icon: <Package className="w-6 h-6 text-[#E06518]" />,
      title: 'دسترسی به ۵٬۰۰۰ قلم کالا با قیمت پخش',
      description:
        'سبد جامع انواع تسمه‌های صنعتی، قطعات خطوط کوره کاشی و سرامیک، غلتک‌های نسوز و قطعات نساجی بدون واسطه از مبدأ واردات و تولید.',
      badge: 'قیمت لایه همکار و نماینده',
    },
    {
      icon: <Truck className="w-6 h-6 text-[#E06518]" />,
      title: 'ارسال سریع به سراسر کشور',
      description:
        'انبار مرکزی یزد مجهز به سیستم بسته‌بندی مقاوم صنعتی با ارسال روزانه از طریق باربری‌های معتبر، تیپاکس و ترمینال ظرف ۲۴ الی ۴۸ ساعت.',
      badge: 'پوشش کلیه استان‌ها',
    },
    {
      icon: <Receipt className="w-6 h-6 text-[#E06518]" />,
      title: 'تسویه منظم و صدور فاکتور رسمی',
      description:
        'امکان خرید اعتباری ماهانه، تسویه با چک صیادی برای عاملیت‌های معتبر و صدور فاکتور رسمی مالیاتی مورد تأیید وزارت امور دارایی و ارزش افزوده.',
      badge: 'ماده ۱۶۹ مکرر مالیاتی',
    },
    {
      icon: <MessageSquareCode className="w-6 h-6 text-[#E06518]" />,
      title: 'پیام‌رسانی مستقیم با مدیریت و مهندسی',
      description:
        'خط ارتباطی اختصاصی در پنل پخش جهت استعلام فوری سایزهای خاص، دریافت سهمیه‌های فصلی SWR و FORZA و پشتیبانی فنی کارخانجات.',
      badge: 'بدون واسطه اداری',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-[#C95210] text-xs font-bold">
          <span>شبکه پخش و عاملیت انحصاری اطلس</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#55565A]">
          چرا پخش و عاملیت هایپر صنعت؟
        </h2>
        <p className="text-xs sm:text-sm text-[#777A7D] leading-relaxed">
          مزایای پیوستن به بزرگ‌ترین شبکه تخصصی تأمین تسمه و قطعات ماشین‌آلات صنعتی در کشور با بیش از ۳۵ سال سابقه در قلب صنعتی یزد
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-orange-200 transition-all flex flex-col justify-between text-right space-y-3"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                {card.icon}
              </div>
              <h3 className="font-bold text-sm text-[#55565A] leading-snug">
                {card.title}
              </h3>
              <p className="text-xs text-[#777A7D] leading-relaxed">
                {card.description}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md inline-block">
                {card.badge}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
