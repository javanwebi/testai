import React, { useState } from 'react';
import { X, PackageSearch, AlertCircle, CheckCircle2 } from 'lucide-react';
import { agencyService } from '../../services/agencyService';
import { SupplyRequest } from '../../types';

interface SupplyRequestModalProps {
  dealerName?: string;
  onClose: () => void;
  onSuccess: (req: SupplyRequest) => void;
}

export const SupplyRequestModal: React.FC<SupplyRequestModalProps> = ({
  dealerName = 'نمایندگی رسمی اطلس',
  onClose,
  onSuccess,
}) => {
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('SWR آلمان / FORZA ایتالیا');
  const [technicalSpecs, setTechnicalSpecs] = useState('');
  const [quantity, setQuantity] = useState<number>(10);
  const [urgency, setUrgency] = useState<'normal' | 'urgent' | 'emergency_halt'>('urgent');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !technicalSpecs.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newReq = agencyService.submitSupplyRequest({
        productName: productName.trim(),
        brand,
        technicalSpecs: technicalSpecs.trim(),
        quantity: Number(quantity) || 1,
        urgency,
        dealerName,
      });

      setIsSubmitting(false);
      onSuccess(newReq);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#12203C]/80 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-right border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#C95210] flex items-center justify-center font-bold">
              <PackageSearch className="w-4 h-4" />
            </div>
            <h3 className="font-black text-sm text-[#55565A]">
              ثبت درخواست تأمین کالای ناموجود یا سفارشی
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#777A7D]">
          اگر قطعه یا سایز خاصی از تسمه، پولی یا غلتک در کاتالوگ موجود نیست، مشخصات را ثبت کنید تا واحد بازرگانی خارجی و انبار اختصاصی آن را برای شما تأمین کند.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#55565A]">
              نام قطعه / کالا <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={productName}
              onChange={e => setProductName(e.target.value)}
              placeholder="مثال: تسمه دنده‌ای دوبل گام ۱۴M عرض ۱۷۰"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-[#55565A] focus:outline-none focus:border-[#E06518]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#55565A]">برند مورد تقاضا</label>
              <input
                type="text"
                value={brand}
                onChange={e => setBrand(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-[#55565A] focus:outline-none focus:border-[#E06518]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#55565A]">
                تعداد مورد نیاز <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-[#55565A] font-mono focus:outline-none focus:border-[#E06518]"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#55565A]">
              سطح فوریت و اولویت سفارش <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setUrgency('normal')}
                className={`p-2 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                  urgency === 'normal'
                    ? 'bg-slate-200 border-slate-400 text-slate-800'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                عادی (تکمیل انبار)
              </button>
              <button
                type="button"
                onClick={() => setUrgency('urgent')}
                className={`p-2 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                  urgency === 'urgent'
                    ? 'bg-amber-100 border-amber-400 text-amber-900 font-black'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                فوری (خط در حال کار)
              </button>
              <button
                type="button"
                onClick={() => setUrgency('emergency_halt')}
                className={`p-2 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                  urgency === 'emergency_halt'
                    ? 'bg-red-100 border-red-500 text-red-900 font-black animate-pulse'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                خط خوابیده (اورژانسی)
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#55565A]">
              پارت‌نامبر، مشخصات فنی دقیق یا دستگاه مصرف‌کننده <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={technicalSpecs}
              onChange={e => setTechnicalSpecs(e.target.value)}
              placeholder="مثلاً: طول مؤثر ۲۸۰۰ میلی‌متر، عرض ۵۰ میلی‌متر، مناسب برای کوره رولری پخت دوم کاشی..."
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-[#55565A] focus:outline-none focus:border-[#E06518]"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#E06518] hover:bg-[#C95210] text-white text-xs font-black rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'در حال ثبت...' : 'ارسال درخواست به واحد تأمین'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
