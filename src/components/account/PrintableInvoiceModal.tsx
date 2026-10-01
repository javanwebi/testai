import React from 'react';
import { Order } from '../../types';
import { toPersianDigits, formatPrice } from '../../utils/formatters';
import { Printer, X, Layers, CheckCircle2 } from 'lucide-react';

interface PrintableInvoiceModalProps {
  order: Order | null;
  onClose: () => void;
}

export const PrintableInvoiceModal: React.FC<PrintableInvoiceModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-300">
        {/* Modal Controls Bar (Hidden during window.print) */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl print:hidden">
          <div className="flex items-center gap-2 font-bold text-sm text-[#55565A]">
            <Printer className="w-5 h-5 text-[#E06518]" />
            <span>پیش‌نمایش پیش‌فاکتور و فاکتور رسمی فروش</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#E06518] hover:bg-[#C95210] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ فاکتور (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-8 overflow-y-auto space-y-6 text-right text-xs print:p-0 print:m-0 print:text-[10px]" id="printable-invoice">
          {/* Header */}
          <div className="border-b-2 border-slate-800 pb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#55565A] flex items-center justify-center text-white">
                <Layers className="w-7 h-7 text-[#E06518]" />
              </div>
              <div>
                <h1 className="text-lg font-black text-[#55565A]">بازرگانی تسمه اطلس یزد</h1>
                <p className="text-[11px] text-[#777A7D]">
                  نماینده انحصاری تسمه‌های صنعتی SWR آلمان و FORZA ایتالیا در خاورمیانه
                </p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">شناسه ملی: ۱۰۸۴۰۰۸۵۴۳۰ | کد اقتصادی: ۴۱۱۴-۳۲۸۱-۹۹۴۲</p>
              </div>
            </div>

            <div className="text-left space-y-1 font-mono text-[11px]">
              <div>
                <span className="text-[#777A7D]">شماره فاکتور: </span>
                <strong className="text-[#55565A] font-bold">{order.orderNumber}</strong>
              </div>
              <div>
                <span className="text-[#777A7D]">تاریخ صدور: </span>
                <strong className="text-[#55565A]">{order.createdAt}</strong>
              </div>
              <div>
                <span className="text-[#777A7D]">کد رهگیری: </span>
                <strong className="text-[#E06518]">{order.trackingCode || 'ATLAS-PENDING'}</strong>
              </div>
            </div>
          </div>

          {/* Parties Info: Seller and Buyer */}
          <div className="grid grid-cols-2 gap-4 border border-slate-200 rounded-xl p-4 bg-slate-50/50 text-[11px]">
            {/* Seller */}
            <div className="space-y-1 border-l border-slate-200 pl-4">
              <h3 className="font-bold text-[#55565A] text-xs">مشخصات فروشنده:</h3>
              <div>نام شرکت: <strong>بازرگانی تسمه اطلس (سهامی خاص)</strong></div>
              <div>آدرس: یزد، بلوار ۱۷ شهریور، روبروی جهاد سازندگی، ساختمان اطلس</div>
              <div>تلفن تماس: ۰۳۵-۳۵۲۵۴۷۰۴ | فکس: ۰۳۵-۳۷۲۵۴۰۰۱</div>
            </div>

            {/* Buyer */}
            <div className="space-y-1 pr-2">
              <h3 className="font-bold text-[#55565A] text-xs">مشخصات خریدار / کارخانه:</h3>
              <div>نام تحویل‌گیرنده: <strong>{order.customerName}</strong></div>
              <div>شرکت / واحد صنعتی: <strong>{order.companyName || 'خریدار صنعتی'}</strong></div>
              <div>نشانی تحویل: {order.shippingAddress}</div>
              <div>شماره تماس: <span className="font-mono">{order.recipientPhone || '۰۹۱۳۱۵۱۲۳۴۵'}</span></div>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto border border-slate-300 rounded-lg">
            <table className="w-full text-right border-collapse">
              <thead className="bg-[#55565A] text-white text-[11px]">
                <tr>
                  <th className="p-2 border-l border-slate-700 w-10 text-center">ردیف</th>
                  <th className="p-2 border-l border-slate-700">کد فنی قطعه</th>
                  <th className="p-2 border-l border-slate-700">شرح کالا و مشخصات مهندسی</th>
                  <th className="p-2 border-l border-slate-700 text-center">واحد</th>
                  <th className="p-2 border-l border-slate-700 text-center">تعداد</th>
                  <th className="p-2 border-l border-slate-700 text-left">مبلغ واحد (تومان)</th>
                  <th className="p-2 text-left">مبلغ کل (تومان)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[11px]">
                {order.items.map((item, index) => (
                  <tr key={item.productCode} className="hover:bg-slate-50">
                    <td className="p-2 border-l border-slate-200 text-center font-mono">{toPersianDigits(index + 1)}</td>
                    <td className="p-2 border-l border-slate-200 font-mono font-bold text-[#55565A]">{item.productCode}</td>
                    <td className="p-2 border-l border-slate-200">
                      <div className="font-bold text-[#55565A]">{item.productName}</div>
                      <div className="text-[10px] text-[#777A7D]">برند: {item.brand} | لایه قیمت: {item.priceLayerUsed}</div>
                    </td>
                    <td className="p-2 border-l border-slate-200 text-center">{item.unit}</td>
                    <td className="p-2 border-l border-slate-200 text-center font-mono font-bold">{toPersianDigits(item.quantity)}</td>
                    <td className="p-2 border-l border-slate-200 text-left font-mono">{formatPrice(item.unitPrice)}</td>
                    <td className="p-2 text-left font-mono font-bold text-[#55565A]">{formatPrice(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Summary */}
          <div className="flex justify-end">
            <div className="w-80 border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-[#777A7D]">
                <span>جمع اقلام:</span>
                <span className="font-mono font-bold text-[#55565A]">{formatPrice(order.totalAmount)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>تخفیف و امتیازات:</span>
                  <span className="font-mono">- {formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#777A7D]">
                <span>هزینه حمل و باربری:</span>
                <span className="font-mono">{order.shippingCost ? formatPrice(order.shippingCost) : 'پس‌کرایه'}</span>
              </div>
              <div className="border-t border-slate-300 pt-2 flex justify-between font-black text-sm text-[#55565A]">
                <span>مبلغ نهایی قابل پرداخت:</span>
                <span className="text-[#E06518] font-mono">{formatPrice(order.finalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Signatures & Stamp */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-center text-xs">
            <div className="space-y-12">
              <span className="font-bold text-[#55565A]">امضا و مهر تحویل‌گیرنده / انبار کارخانه</span>
              <div className="h-10" />
            </div>

            <div className="space-y-12">
              <span className="font-bold text-[#55565A]">مهر و امضای امور مالی بازرگانی تسمه اطلس یزد</span>
              <div className="inline-block p-2 border-2 border-dashed border-orange-300 rounded-lg text-[10px] text-orange-600">
                تأییدیه الکترونیکی صادر شد
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
