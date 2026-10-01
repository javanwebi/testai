import React, { useState } from 'react';
import { X, UploadCloud, FileCheck, CheckCircle2, DollarSign } from 'lucide-react';
import { agencyService } from '../../services/agencyService';
import { DepositReceipt } from '../../types';
import { toPersianDigits } from '../../utils/formatters';

interface DepositReceiptModalProps {
  onClose: () => void;
  onSuccess: (receipt: DepositReceipt) => void;
}

const BANKS = ['بانک سپه', 'بانک ملت', 'بانک تجارت', 'بانک ملی ایران', 'بانک صادرات', 'بانک سامان'];

export const DepositReceiptModal: React.FC<DepositReceiptModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [amount, setAmount] = useState('50000000');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [bankName, setBankName] = useState('بانک سپه');
  const [paymentDate, setPaymentDate] = useState('۱۴۰۳/۰۶/۲۲');
  const [notes, setNotes] = useState('تسویه فاکتور و افزایش اعتبار خرید');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string>('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=300&q=80');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) return;
    if (!trackingNumber.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const receipt = agencyService.submitDepositReceipt({
        amount: numAmount,
        trackingNumber: trackingNumber.trim(),
        bankName,
        paymentDate,
        receiptImage,
        notes: notes.trim() || undefined,
      });

      setIsSubmitting(false);
      onSuccess(receipt);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#12203C]/80 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-right border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#C95210] flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
            <h3 className="font-black text-sm text-[#55565A]">
              ارسال رسید واریز وجه و تسویه حساب نماینده
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#55565A]">
              مبلغ واریزی (تومان) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="100000"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="مثال: ۵۰٬۰۰۰٬۰۰۰"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 font-mono text-xs sm:text-sm text-[#55565A] focus:outline-none focus:border-[#E06518]"
              required
            />
            <span className="text-[11px] text-[#777A7D]">
              معادل: {Number(amount).toLocaleString('fa-IR')} تومان
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#55565A]">
                شماره پیگیری / سند فیش <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={e => setTrackingNumber(e.target.value)}
                placeholder="مثال: ۷۸۰۱۹۸۴۳۲"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 font-mono text-xs text-[#55565A] focus:outline-none focus:border-[#E06518]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#55565A]">بانک مبدأ / مقصد</label>
              <select
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-[#55565A] bg-white cursor-pointer focus:outline-none focus:border-[#E06518]"
              >
                {BANKS.map(b => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#55565A]">تاریخ واریز</label>
            <input
              type="text"
              value={paymentDate}
              onChange={e => setPaymentDate(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono text-[#55565A] focus:outline-none focus:border-[#E06518]"
            />
          </div>

          {/* Receipt Image Mock Upload */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#55565A]">تصویر فیش واریزی / رسید کارتخوان</label>
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={receiptImage}
                  alt="فیش"
                  className="w-10 h-10 rounded object-cover border border-slate-300"
                />
                <span className="text-xs font-bold text-slate-700">fish_varizi_bank.jpg (تستی)</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-bold">آماده پیوست</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#55565A]">توضیحات بابت فاکتور یا چک</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-[#55565A] focus:outline-none focus:border-[#E06518]"
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
              {isSubmitting ? 'در حال ثبت رسید...' : 'ثبت و ارسال به واحد مالی'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
