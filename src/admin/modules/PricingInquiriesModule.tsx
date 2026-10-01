import React, { useState } from 'react';
import {
  FileQuestion,
  CheckCircle,
  Clock,
  Send,
  Printer,
  MessageSquare,
  Share2,
  Calendar,
  AlertCircle,
  FileText,
  Search,
  ExternalLink,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building,
  Phone,
  User,
  Check,
  Download,
} from 'lucide-react';
import { adminService, PriceHistoryRecord } from '../../services/adminService';
import { InquiryRequest, OfficialInvoice } from '../../types';
import { formatPrice, toPersianDigits } from '../../utils/formatters';

export const PricingInquiriesModule: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'inquiries' | 'invoices' | 'price_history'>('inquiries');

  // Inquiries State
  const [inquiries, setInquiries] = useState<InquiryRequest[]>(() => adminService.getInquiries());
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'quoted' | 'expired'>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryRequest | null>(null);

  // Inquiry Response Modal State
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [itemPrices, setItemPrices] = useState<Record<string, number>>({});
  const [validityHours, setValidityHours] = useState<number>(48);

  // Official Invoices State
  const [invoices, setInvoices] = useState<OfficialInvoice[]>(() => adminService.getOfficialInvoices());
  const [viewInvoice, setViewInvoice] = useState<OfficialInvoice | null>(null);

  // Price History State
  const [priceHistory, setPriceHistory] = useState<PriceHistoryRecord[]>(() => adminService.getPriceHistory());
  const [historySearch, setHistorySearch] = useState('');

  const refreshData = () => {
    setInquiries(adminService.getInquiries());
    setInvoices(adminService.getOfficialInvoices());
    setPriceHistory(adminService.getPriceHistory());
  };

  // Filter inquiries
  const filteredInquiries = inquiries.filter(inq => {
    if (selectedStatus === 'all') return true;
    return inq.status === selectedStatus;
  });

  // Open reply modal
  const handleOpenReply = (inq: InquiryRequest) => {
    setSelectedInquiry(inq);
    const initialPrices: Record<string, number> = {};
    inq.items.forEach(item => {
      initialPrices[item.productCode] = item.suggestedPrice || 1500000;
    });
    setItemPrices(initialPrices);
    setValidityHours(inq.validityHours || 48);
    setIsReplyModalOpen(true);
  };

  // Submit reply and generate proforma
  const handleSaveReply = (generateInvoice: boolean = true) => {
    if (!selectedInquiry) return;

    adminService.saveInquiryReply(selectedInquiry.id, itemPrices, validityHours);

    // If generate invoice is requested
    if (generateInvoice) {
      const itemsList = selectedInquiry.items.map(item => {
        const unitPrice = itemPrices[item.productCode] || 1000000;
        return {
          code: item.productCode,
          name: item.productName,
          quantity: item.quantity,
          unit: 'عدد',
          unitPrice,
          totalPrice: unitPrice * item.quantity,
        };
      });

      const subtotal = itemsList.reduce((sum, item) => sum + item.totalPrice, 0);
      const tax = Math.round(subtotal * 0.10); // 10% VAT
      const total = subtotal + tax;

      const newInvoice = adminService.createOfficialInvoice({
        type: 'proforma',
        buyer: {
          name: selectedInquiry.customerName,
          company: selectedInquiry.company || 'شخصی',
          nationalId: '10103489201',
          economicCode: '411589321456',
          phone: selectedInquiry.phone,
          address: 'یزد، شهرک صنعتی یزد، بلوار کاج، کارخانه شماره ۴',
        },
        items: itemsList,
        subtotal,
        tax,
        discount: 0,
        total,
        validUntil: `${validityHours} ساعت پس از صدور`,
      });

      // Send SMS Notification
      adminService.sendSms(selectedInquiry.phone, 'inquiry_reply', {
        name: selectedInquiry.customerName,
        invoiceNumber: newInvoice.invoiceNumber,
        hours: String(validityHours),
      });

      setViewInvoice(newInvoice);
    }

    refreshData();
    setIsReplyModalOpen(false);
  };

  const calculateTotalQuoted = () => {
    if (!selectedInquiry) return 0;
    return selectedInquiry.items.reduce((sum, item) => {
      const p = itemPrices[item.productCode] || 0;
      return sum + p * item.quantity;
    }, 0);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#55565A] flex items-center gap-2">
            <FileQuestion className="w-6 h-6 text-[#E06518]" />
            <span>استعلام‌ها، قیمت‌گذاری و پیش‌فاکتور رسمی</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            بررسی استعلام‌های وارده، اعلام نرخ با مهلت اعتبار، صدور پیش‌فاکتور استاندارد دارایی با ارزش افزوده ۱۰٪ و رهگیری سابقه تغییرات قیمت.
          </p>
        </div>

        {/* Action badges */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>{toPersianDigits(inquiries.filter(i => i.status === 'pending').length)} استعلام در انتظار پاسخ</span>
          </span>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('inquiries')}
          className={`py-2 px-4 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'inquiries'
              ? 'bg-[#55565A] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileQuestion className="w-4 h-4" />
          <span>استعلام‌های قیمت ({toPersianDigits(inquiries.length)})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('invoices')}
          className={`py-2 px-4 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'invoices'
              ? 'bg-[#55565A] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>پیش‌فاکتورهای رسمی دارایی ({toPersianDigits(invoices.length)})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('price_history')}
          className={`py-2 px-4 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'price_history'
              ? 'bg-[#55565A] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>تاریخچه تغییر قیمت کالاها ({toPersianDigits(priceHistory.length)})</span>
        </button>
      </div>

      {/* --- SUBTAB 1: INQUIRIES LIST --- */}
      {activeSubTab === 'inquiries' && (
        <div className="space-y-4">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                selectedStatus === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              همه ({toPersianDigits(inquiries.length)})
            </button>
            <button
              onClick={() => setSelectedStatus('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                selectedStatus === 'pending'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white border border-slate-200 text-amber-700 hover:bg-amber-50'
              }`}
            >
              در انتظار پاسخ ({toPersianDigits(inquiries.filter(i => i.status === 'pending').length)})
            </button>
            <button
              onClick={() => setSelectedStatus('quoted')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                selectedStatus === 'quoted'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              پاسخ داده شده ({toPersianDigits(inquiries.filter(i => i.status === 'quoted').length)})
            </button>
            <button
              onClick={() => setSelectedStatus('expired')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                selectedStatus === 'expired'
                  ? 'bg-red-600 text-white'
                  : 'bg-white border border-slate-200 text-red-700 hover:bg-red-50'
              }`}
            >
              منقضی شده ({toPersianDigits(inquiries.filter(i => i.status === 'expired').length)})
            </button>
          </div>

          {/* Inquiries Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredInquiries.map(inq => (
              <div
                key={inq.id}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 hover:border-slate-300 transition-all"
              >
                {/* Header info */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#55565A] bg-slate-100 px-2 py-0.5 rounded-lg">
                        {inq.inquiryNumber}
                      </span>
                      <h3 className="font-black text-sm text-[#55565A]">{inq.customerName}</h3>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5" />
                        <span>{inq.company || 'کاربر حقیقی'}</span>
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{inq.phone}</span>
                      </span>
                      <span>{inq.createdAt}</span>
                    </div>
                  </div>

                  {/* Badge */}
                  <div>
                    {inq.status === 'pending' && (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>بی‌پاسخ</span>
                      </span>
                    )}
                    {inq.status === 'quoted' && (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        <span>پاسخ داده شده</span>
                      </span>
                    )}
                    {inq.status === 'expired' && (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        منقضی شده
                      </span>
                    )}
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700">اقلام درخواستی:</div>
                  <div className="bg-slate-50/70 rounded-2xl p-3 space-y-2 border border-slate-100">
                    {inq.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs border-b border-slate-200/50 pb-1.5 last:border-0 last:pb-0">
                        <div>
                          <span className="font-mono text-[11px] text-slate-400 ml-1">[{item.productCode}]</span>
                          <span className="font-bold text-[#55565A]">{item.productName}</span>
                          {item.notes && <span className="text-[10px] text-slate-400 block pr-2">{item.notes}</span>}
                        </div>
                        <div className="text-left font-mono font-bold text-slate-700">
                          {toPersianDigits(item.quantity)} عدد
                          {item.suggestedPrice && (
                            <span className="text-[#C95210] block text-[11px]">
                              {formatPrice(item.suggestedPrice)} ت
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer and Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    {inq.validityHours && (
                      <span>
                        مهلت اعتبار نرخ: <b className="text-[#55565A]">{toPersianDigits(inq.validityHours)} ساعت</b>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenReply(inq)}
                      className="py-2 px-4 rounded-xl bg-[#55565A] hover:bg-[#1B293E] text-white font-black text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 text-[#E06518]" />
                      <span>{inq.status === 'pending' ? 'ثبت قیمت و صدور پیش‌فاکتور' : 'ویرایش قیمت و پیش‌فاکتور'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- SUBTAB 2: OFFICIAL INVOICES --- */}
      {activeSubTab === 'invoices' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-[#55565A]">
                    <th className="py-3.5 px-4">شماره پیش‌فاکتور رسمی</th>
                    <th className="py-3.5 px-4">نام خریدار / شرکت</th>
                    <th className="py-3.5 px-4">شناسه ملی / کد اقتصادی</th>
                    <th className="py-3.5 px-4">مبلغ کل بدون مالیات</th>
                    <th className="py-3.5 px-4">ارزش افزوده (۱۰٪)</th>
                    <th className="py-3.5 px-4">مبلغ نهایی فاکتور</th>
                    <th className="py-3.5 px-4">تاریخ صدور</th>
                    <th className="py-3.5 px-4 text-center">عملیات دارایی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-black text-[#55565A]">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#55565A]">{inv.buyer.name}</div>
                        <div className="text-[10px] text-slate-400">{inv.buyer.company}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        <div>ش‌ملی: {inv.buyer.nationalId}</div>
                        <div>اقتصادی: {inv.buyer.economicCode}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {formatPrice(inv.subtotal)} ت
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-700">
                        {formatPrice(inv.tax ?? inv.totalTax ?? 0)} ت
                      </td>
                      <td className="py-3.5 px-4 font-mono font-black text-[#C95210]">
                        {formatPrice(inv.total ?? inv.grandTotal ?? 0)} تومان
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{inv.issueDate}</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewInvoice(inv)}
                            className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#55565A] font-bold text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>چاپ / PDF رسمی</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- SUBTAB 3: PRICE HISTORY AUDIT LOG --- */}
      {activeSubTab === 'price_history' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="relative w-72">
              <input
                type="text"
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                placeholder="جستجو در کد یا نام کالا..."
                className="w-full h-10 pr-9 pl-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#E06518]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>

            <div className="text-xs text-slate-500 font-mono">
              ثبت مستمر کلیه نوسانات قیمتی با امضای کاربر
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-[#55565A]">
                  <th className="py-3 px-4">تاریخ تغییر</th>
                  <th className="py-3 px-4">کد کالا</th>
                  <th className="py-3 px-4">نام کالا</th>
                  <th className="py-3 px-4">قیمت قدیم</th>
                  <th className="py-3 px-4">قیمت جدید</th>
                  <th className="py-3 px-4">درصد نوسان</th>
                  <th className="py-3 px-4">کاربر ثبت‌کننده</th>
                  <th className="py-3 px-4">علت تغییر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {priceHistory
                  .filter(
                    h =>
                      h.productCode.toLowerCase().includes(historySearch.toLowerCase()) ||
                      h.productName.toLowerCase().includes(historySearch.toLowerCase())
                  )
                  .map(log => {
                    const diff = log.newPrice - log.oldPrice;
                    const percent = log.oldPrice > 0 ? Math.round((diff / log.oldPrice) * 100) : 0;
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 text-slate-500 font-mono">{log.date}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#55565A]">{log.productCode}</td>
                        <td className="py-3.5 px-4 font-bold text-[#55565A]">{log.productName}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">{formatPrice(log.oldPrice)} ت</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#C95210]">{formatPrice(log.newPrice)} ت</td>
                        <td className="py-3.5 px-4 font-mono font-bold">
                          {diff >= 0 ? (
                            <span className="text-emerald-600 flex items-center gap-0.5">
                              <TrendingUp className="w-3.5 h-3.5" />
                              +{toPersianDigits(percent)}٪
                            </span>
                          ) : (
                            <span className="text-red-500 flex items-center gap-0.5">
                              <TrendingDown className="w-3.5 h-3.5" />
                              {toPersianDigits(percent)}٪
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-700">{log.changedBy}</td>
                        <td className="py-3.5 px-4 text-slate-500">{log.reason}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- INQUIRY REPLY MODAL --- */}
      {isReplyModalOpen && selectedInquiry && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="bg-[#55565A] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm">
                  ثبت قیمت استعلام #{selectedInquiry.inquiryNumber} - {selectedInquiry.customerName}
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  شماره تماس: {selectedInquiry.phone} | شرکت: {selectedInquiry.company || 'حقیقی'}
                </p>
              </div>
              <button
                onClick={() => setIsReplyModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Validity Hours Selector */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                <label className="text-xs font-bold text-[#55565A] block">مدت اعتبار قیمت پیشنهادی:</label>
                <div className="flex items-center gap-2">
                  {[24, 48, 168].map(hrs => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setValidityHours(hrs)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        validityHours === hrs
                          ? 'bg-[#55565A] text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {hrs === 168 ? '۱ هفته (۱۶۸ ساعت)' : `${toPersianDigits(hrs)} ساعت`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items Pricing Inputs */}
              <div className="space-y-3">
                <div className="font-bold text-xs text-[#55565A]">قیمت واحد پیشنهادی برای اقلام درخواستی:</div>
                <div className="space-y-3">
                  {selectedInquiry.items.map(item => (
                    <div
                      key={item.productCode}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-xs text-[#55565A]">{item.productName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            کد: {item.productCode} | تعداد درخواستی: {toPersianDigits(item.quantity)} عدد
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <label className="text-xs font-bold text-slate-600">قیمت واحد (تومان):</label>
                        <input
                          type="number"
                          value={itemPrices[item.productCode] || ''}
                          onChange={e =>
                            setItemPrices({
                              ...itemPrices,
                              [item.productCode]: Number(e.target.value),
                            })
                          }
                          className="w-44 h-9 px-3 rounded-xl border border-slate-200 bg-white font-mono font-bold text-[#C95210] outline-none"
                        />
                        <span className="text-xs text-slate-400 font-mono">
                          مجموع ردیف: {formatPrice((itemPrices[item.productCode] || 0) * item.quantity)} ت
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grand Total Preview */}
              <div className="p-4 rounded-2xl bg-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">مجموع اقلام بدون مالیات:</span>
                  <div className="font-mono font-bold text-[#55565A] text-sm">
                    {formatPrice(calculateTotalQuoted())} تومان
                  </div>
                </div>

                <div>
                  <span className="text-slate-500">ارزش افزوده (۱۰٪):</span>
                  <div className="font-mono font-bold text-amber-700 text-sm">
                    {formatPrice(Math.round(calculateTotalQuoted() * 0.10))} تومان
                  </div>
                </div>

                <div>
                  <span className="text-slate-500">مجموع کل با ارزش افزوده:</span>
                  <div className="font-mono font-black text-[#C95210] text-base">
                    {formatPrice(Math.round(calculateTotalQuoted() * 1.10))} تومان
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsReplyModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveReply(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-[#55565A] text-xs font-bold cursor-pointer"
                >
                  فقط ثبت قیمت استعلام
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveReply(true)}
                  className="px-6 py-2.5 rounded-xl bg-[#55565A] hover:bg-[#1B293E] text-white text-xs font-black shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-[#E06518]" />
                  <span>صدور پیش‌فاکتور رسمی دارایی و پیامک</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- OFFICIAL PROFORMA INVOICE MODAL (TAX FORMAT) --- */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
          <div className="bg-white w-full max-w-4xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-6 print:border-0 print:shadow-none print:m-0">
            {/* Action Bar (Hidden on print) */}
            <div className="bg-[#55565A] text-white p-4 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#E06518]" />
                <span className="font-black text-sm">
                  پیش‌فاکتور رسمی استاندارد دارایی ({viewInvoice.invoiceNumber})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>چاپ / ذخیره PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    adminService.sendSms(viewInvoice.buyer.phone, 'inquiry_reply', {
                      name: viewInvoice.buyer.name,
                      invoiceNumber: viewInvoice.invoiceNumber,
                      hours: '48',
                    });
                    alert(`پیامک حاوی لینک پیش‌فاکتور رسمی به شماره ${viewInvoice.buyer.phone} ارسال گردید.`);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#E06518] hover:bg-[#C95210] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>ارسال مجدد پیامک</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const text = encodeURIComponent(
                      `پیش‌فاکتور رسمی بازرگانی اطلس\nشماره: ${viewInvoice.invoiceNumber}\nمبلغ: ${formatPrice(viewInvoice.total ?? viewInvoice.grandTotal ?? 0)} تومان\nاعتبار: ${viewInvoice.validUntil}`
                    );
                    window.open(`https://wa.me/?text=${text}`, '_blank');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>ارسال واتساپ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewInvoice(null)}
                  className="p-1.5 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Tax Proforma Content */}
            <div className="p-8 space-y-6 text-slate-900 bg-white" dir="rtl">
              {/* Invoice Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                <div>
                  <div className="text-xl font-black text-[#55565A]">شرکت بازرگانی تسمه اطلس یزد</div>
                  <div className="text-xs text-slate-500 mt-0.5">واردات و توزیع تخصصی تسمه‌ها و تجهیزات صنعتی</div>
                </div>

                <div className="text-center">
                  <div className="text-lg font-black tracking-widest text-[#55565A]">پیش‌فاکتور رسمی فروش کالا</div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">ماده ۱۹ قانون مالیات بر ارزش افزوده</div>
                </div>

                <div className="text-left text-xs font-mono space-y-1">
                  <div>
                    <span className="text-slate-500">شماره: </span>
                    <span className="font-bold text-[#55565A]">{viewInvoice.invoiceNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">تاریخ: </span>
                    <span>{viewInvoice.issueDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">اعتبار: </span>
                    <span className="text-red-600 font-bold">{viewInvoice.validUntil}</span>
                  </div>
                </div>
              </div>

              {/* Seller & Buyer Info Tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Seller */}
                <div className="p-4 rounded-2xl border border-slate-300 bg-slate-50/50 space-y-1.5">
                  <div className="font-bold text-[#55565A] border-b border-slate-200 pb-1">
                    مشخصات فروشنده: شرکت بازرگانی تسمه اطلس یزد
                  </div>
                  <div>شناسه ملی: <span className="font-mono font-bold">14008920194</span></div>
                  <div>کد اقتصادی: <span className="font-mono font-bold">411634892011</span></div>
                  <div>نشانی: یزد، میدان مهدیه، ابتدای بلوار شهید بهشتی، ساختمان اطلس</div>
                  <div>تلفن: <span className="font-mono">۰۳۵-۳۸۲۴۵۰۰۰</span></div>
                </div>

                {/* Buyer */}
                <div className="p-4 rounded-2xl border border-slate-300 bg-slate-50/50 space-y-1.5">
                  <div className="font-bold text-[#55565A] border-b border-slate-200 pb-1">
                    مشخصات خریدار: {viewInvoice.buyer.company || viewInvoice.buyer.name}
                  </div>
                  <div>نام تحویل‌گیرنده: <span className="font-bold">{viewInvoice.buyer.name}</span></div>
                  <div>شناسه ملی / کد ملی: <span className="font-mono font-bold">{viewInvoice.buyer.nationalId}</span></div>
                  <div>کد اقتصادی: <span className="font-mono font-bold">{viewInvoice.buyer.economicCode}</span></div>
                  <div>تلفن همراه: <span className="font-mono">{viewInvoice.buyer.phone}</span></div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 border-b border-slate-300 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">ردیف</th>
                      <th className="py-2.5 px-3">کد کالا</th>
                      <th className="py-2.5 px-3">شرح کامل کالا یا خدمات</th>
                      <th className="py-2.5 px-3">تعداد</th>
                      <th className="py-2.5 px-3">واحد</th>
                      <th className="py-2.5 px-3">مبلغ واحد (تومان)</th>
                      <th className="py-2.5 px-3">مبلغ کل (تومان)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {viewInvoice.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-mono">{toPersianDigits(idx + 1)}</td>
                        <td className="py-2.5 px-3 font-mono font-bold">{item.code}</td>
                        <td className="py-2.5 px-3 font-bold">{item.name}</td>
                        <td className="py-2.5 px-3 font-mono">{toPersianDigits(item.quantity)}</td>
                        <td className="py-2.5 px-3">{item.unit || 'عدد'}</td>
                        <td className="py-2.5 px-3 font-mono">{formatPrice(item.unitPrice)}</td>
                        <td className="py-2.5 px-3 font-mono font-bold">{formatPrice(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Calculation Grid */}
              <div className="flex justify-end">
                <div className="w-72 border border-slate-300 rounded-xl overflow-hidden text-xs">
                  <div className="flex items-center justify-between p-2.5 border-b border-slate-200 bg-slate-50">
                    <span className="text-slate-600">مجموع مبالغ:</span>
                    <span className="font-mono font-bold">{formatPrice(viewInvoice.subtotal)} تومان</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 border-b border-slate-200 bg-slate-50">
                    <span className="text-slate-600">مالیات بر ارزش افزوده (۱۰٪):</span>
                    <span className="font-mono font-bold text-amber-700">{formatPrice(viewInvoice.tax ?? viewInvoice.totalTax ?? 0)} تومان</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-900 text-white font-black">
                    <span>مبلغ قابل پرداخت:</span>
                    <span className="font-mono text-sm">{formatPrice(viewInvoice.total ?? viewInvoice.grandTotal ?? 0)} تومان</span>
                  </div>
                </div>
              </div>

              {/* Official Stamp & Bank Accounts */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-6 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-[#55565A]">اطلاعات حساب بانکی شرکت:</div>
                  <div>بانک ملت شعبه مهدیه یزد - شماره حساب: <span className="font-mono font-bold">5421890041</span></div>
                  <div>شماره شبا: <span className="font-mono font-bold">IR540120000000005421890041</span></div>
                  <div>به نام شرکت بازرگانی تسمه اطلس یزد</div>
                </div>

                <div className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-300 rounded-2xl text-center">
                  <div className="text-[11px] text-slate-400">مهر و امضای امور مالی و فروش بازرگانی اطلس</div>
                  <div className="w-24 h-24 mt-2 border-2 border-slate-400 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-600 rotate-[-12deg]">
                    مهر بازرگانی اطلس
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
