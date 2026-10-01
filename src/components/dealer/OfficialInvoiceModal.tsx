import React from 'react';
import { X, Printer, CheckCircle2, ShieldCheck, Download } from 'lucide-react';
import { Order } from '../../types';
import { toPersianDigits, formatPrice } from '../../utils/formatters';

interface OfficialInvoiceModalProps {
  order: Order;
  dealerCompanyName?: string;
  dealerManagerName?: string;
  onClose: () => void;
}

export const OfficialInvoiceModal: React.FC<OfficialInvoiceModalProps> = ({
  order,
  dealerCompanyName = 'نمایندگی رسمی بازرگانی اطلس',
  dealerManagerName = 'مهندس محمدرضا زارع',
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  // Calculate tax breakdown (9% VAT standard Iranian B2B)
  const subtotal = order.totalAmount;
  const discount = order.discountAmount || 0;
  const taxableAmount = Math.max(0, subtotal - discount);
  const vatAmount = Math.round(taxableAmount * 0.09);
  const grandTotal = taxableAmount + vatAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#12203C]/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 text-right my-8 border border-slate-200">
        {/* Actions bar */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-orange-100 text-[#C95210] text-xs font-bold">
              فاکتور رسمی ماده ۱۶۹ مکرر ق.م.م
            </span>
            <span className="text-xs text-[#777A7D]">دارای بارکد و شناسه اصالت کالا</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-[#55565A] hover:bg-[#1B293E] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4 text-[#E06518]" />
              <span>چاپ فاکتور رسمی (Print)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE INVOICE SHEET */}
        <div className="border border-slate-300 p-6 sm:p-8 rounded-xl space-y-6 bg-white text-[#55565A]">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-[#55565A] pb-4">
            <div className="text-right space-y-1">
              <h2 className="text-xl font-black text-[#55565A]">
                شرکت بازرگانی تسمه اطلس یزد
              </h2>
              <p className="text-xs text-[#777A7D]">
                مرکز تخصصی واردات و پخش انواع تسمه‌های صنعتی و قطعات ماشین‌آلات
              </p>
              <div className="text-[11px] text-[#777A7D] flex items-center gap-3 font-mono">
                <span>شناسه ملی: ۱۴۰۰۵۸۹۲۳۱۱</span>
                <span>•</span>
                <span>کد اقتصادی: ۴۱۱۵۸۹۳</span>
                <span>•</span>
                <span>شماره ثبت: ۱۲۸۰۴</span>
              </div>
            </div>

            <div className="text-center sm:text-left space-y-1 text-xs">
              <div className="text-base font-black text-[#E06518] uppercase">
                صورتحساب رسمی فروش کالا و خدمات
              </div>
              <div className="font-mono text-slate-700 font-bold">
                شماره فاکتور: {order.orderNumber}
              </div>
              <div className="font-mono text-slate-600">
                تاریخ صدور: {toPersianDigits(order.createdAt)}
              </div>
            </div>
          </div>

          {/* Parties: Seller & Buyer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Seller */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="font-bold text-[#55565A] border-b border-slate-200 pb-1 flex items-center justify-between">
                <span>مشخصات فروشنده (عرضه‌کننده):</span>
                <span className="text-[10px] text-emerald-700 font-bold">تأییدیه مالیاتی</span>
              </div>
              <div>نام: <strong>شرکت بازرگانی تسمه و قطعات صنعتی اطلس یزد</strong></div>
              <div>نشانی: <strong>یزد، بلوار ۱۷ شهریور، روبروی جهاد، ساختمان اطلس</strong></div>
              <div className="font-mono">تلفن: ۰۳۵-۳۷۲۵۴۰۰۰ | کد پستی: ۸۹۱۷۹۸۷۶۵۴</div>
            </div>

            {/* Buyer */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="font-bold text-[#55565A] border-b border-slate-200 pb-1 flex items-center justify-between">
                <span>مشخصات خریدار (نماینده / همکار پخش):</span>
                <span className="text-[10px] text-blue-700 font-bold">لایه قیمت نمایندگی</span>
              </div>
              <div>نام شرکت/فروشگاه: <strong>{dealerCompanyName}</strong></div>
              <div>مسئول / خریدار: <strong>{dealerManagerName}</strong></div>
              <div>نشانی تحویل: <strong className="text-[11px]">{order.shippingAddress}</strong></div>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs border border-slate-300">
              <thead className="bg-[#55565A] text-white">
                <tr>
                  <th className="p-2.5 border border-slate-300 text-center w-10">ردیف</th>
                  <th className="p-2.5 border border-slate-300">کد فنی</th>
                  <th className="p-2.5 border border-slate-300">شرح کالا یا خدمات</th>
                  <th className="p-2.5 border border-slate-300 text-center">واحد</th>
                  <th className="p-2.5 border border-slate-300 text-center">تعداد</th>
                  <th className="p-2.5 border border-slate-300 text-left">مبلغ واحد پخش (تومان)</th>
                  <th className="p-2.5 border border-slate-300 text-left">مبلغ کل (تومان)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.items.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="p-2.5 border border-slate-300 text-center font-mono font-bold">
                      {toPersianDigits(index + 1)}
                    </td>
                    <td className="p-2.5 border border-slate-300 font-mono font-bold text-[#55565A]">
                      {item.productCode}
                    </td>
                    <td className="p-2.5 border border-slate-300">
                      <div className="font-bold text-[#55565A]">{item.productName}</div>
                      <div className="text-[10px] text-[#777A7D]">برند: {item.brand}</div>
                    </td>
                    <td className="p-2.5 border border-slate-300 text-center">{item.unit}</td>
                    <td className="p-2.5 border border-slate-300 text-center font-bold font-mono">
                      {toPersianDigits(item.quantity)}
                    </td>
                    <td className="p-2.5 border border-slate-300 text-left font-mono font-bold">
                      {formatPrice(item.unitPrice)}
                    </td>
                    <td className="p-2.5 border border-slate-300 text-left font-mono font-bold text-[#55565A]">
                      {formatPrice(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Totals */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            <div className="text-xs text-[#777A7D] space-y-1 max-w-sm">
              <div>شرایط پرداخت: <strong>تسویه اعتباری نمایندگی (حساب باز ۴۵ روزه)</strong></div>
              <div>وضعیت حمل: <strong>ارسال باربری از انبار مرکزی یزد (حواله قطعی)</strong></div>
            </div>

            <div className="w-full sm:w-80 bg-slate-50 border border-slate-300 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between text-[#777A7D]">
                <span>جمع اقلام با قیمت پخش:</span>
                <span className="font-mono font-bold text-[#55565A]">{formatPrice(subtotal)} تومان</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>تخفیف سهمیه فصلی نماینده:</span>
                  <span className="font-mono font-bold">-{formatPrice(discount)} تومان</span>
                </div>
              )}
              <div className="flex justify-between text-[#777A7D]">
                <span>مالیات و عوارض ارزش افزوده (۹٪):</span>
                <span className="font-mono font-bold">{formatPrice(vatAmount)} تومان</span>
              </div>
              <div className="flex justify-between border-t border-slate-300 pt-2 font-black text-sm text-[#55565A]">
                <span>مبلغ نهایی فاکتور:</span>
                <span className="text-[#E06518] font-mono">{formatPrice(grandTotal)} تومان</span>
              </div>
            </div>
          </div>

          {/* Digital Stamp & Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-center text-xs">
            <div className="space-y-6">
              <div className="font-bold text-[#55565A]">مهر و امضای خریدار / نماینده</div>
              <div className="text-[#777A7D] text-[11px] pt-8">تحویل گیرنده اقلام انبار</div>
            </div>

            <div className="space-y-2 relative">
              <div className="font-bold text-[#55565A]">مهر برجسته و امضای مجاز فروشنده</div>
              {/* Digital stamp badge */}
              <div className="mx-auto w-32 h-32 rounded-full border-4 border-dashed border-red-600/70 text-red-700 flex flex-col items-center justify-center p-2 rotate-[-8deg] select-none bg-red-50/20">
                <ShieldCheck className="w-6 h-6 text-red-600" />
                <span className="text-[10px] font-black leading-tight mt-1">بازرگانی تسمه اطلس یزد</span>
                <span className="text-[8px] font-bold">واحد امور مالی و صدور فاکتور</span>
                <span className="text-[8px] font-mono">شناسه: ۱۴۰۰۵۸۹۲۳۱۱</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
