import React, { useState } from 'react';
import {
  ShoppingBag,
  Filter,
  CheckCircle,
  Clock,
  Truck,
  CreditCard,
  FileCheck,
  AlertTriangle,
  XCircle,
  Eye,
  Send,
  Printer,
  Calendar,
  Building,
  Phone,
  User,
  MapPin,
  Check,
  ShieldCheck,
  Receipt,
  FileText,
} from 'lucide-react';
import { adminService, AdminOrder } from '../../services/adminService';
import { formatPrice, toPersianDigits } from '../../utils/formatters';

export const OrdersModule: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrder[]>(() => adminService.getOrders());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Order for Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  // Dispatch fields state
  const [carrier, setCarrier] = useState('باربری وطن (شعبه یزد)');
  const [trackingNumber, setTrackingNumber] = useState('');

  // Reject receipt reason state
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const refreshOrders = () => {
    setOrders(adminService.getOrders());
  };

  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || o.paymentMethod === paymentFilter;
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.company && o.company.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesPayment && matchesSearch;
  });

  const handleOpenDetail = (order: AdminOrder) => {
    setSelectedOrder(order);
    setCarrier(order.carrier || 'باربری وطن (شعبه یزد)');
    setTrackingNumber(order.trackingNumber || '');
    setIsRejecting(false);
    setRejectReason('');
  };

  const handleVerifyReceipt = (approved: boolean) => {
    if (!selectedOrder) return;
    if (!approved && !rejectReason.trim()) {
      alert('لطفاً دلیل عدم تأیید فیش را وارد نمایید.');
      return;
    }

    adminService.verifyReceipt(selectedOrder.id, approved, rejectReason);
    refreshOrders();
    const updated = adminService.getOrders().find(o => o.id === selectedOrder.id);
    setSelectedOrder(updated || null);
    setIsRejecting(false);
  };

  const handleUpdateStatus = (newStatus: AdminOrder['status']) => {
    if (!selectedOrder) return;
    adminService.updateOrderStatus(selectedOrder.id, newStatus, {
      carrier: carrier.trim(),
      trackingNumber: trackingNumber.trim(),
    });
    refreshOrders();
    const updated = adminService.getOrders().find(o => o.id === selectedOrder.id);
    setSelectedOrder(updated || null);
  };

  const getStatusBadge = (status: AdminOrder['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>در انتظار تأیید</span>
          </span>
        );
      case 'confirmed':
        return (
          <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-blue-600" />
            <span>تأییدشده</span>
          </span>
        );
      case 'packing':
        return (
          <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
            <ShoppingBag className="w-3 h-3 text-purple-600" />
            <span>در حال بسته‌بندی</span>
          </span>
        );
      case 'shipped':
        return (
          <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center gap-1">
            <Truck className="w-3 h-3 text-indigo-600" />
            <span>ارسال‌شده (باربری)</span>
          </span>
        );
      case 'delivered':
        return (
          <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>تحویل‌شده</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-red-50 text-red-800 border border-red-200 flex items-center gap-1">
            <XCircle className="w-3 h-3 text-red-600" />
            <span>لغوشده</span>
          </span>
        );
    }
  };

  const getPaymentBadge = (method: AdminOrder['paymentMethod']) => {
    switch (method) {
      case 'online':
        return <span className="font-bold text-emerald-700">درگاه پرداخت آنلاین</span>;
      case 'receipt':
        return <span className="font-bold text-amber-700">فیش واریز بانکی</span>;
      case 'credit':
        return <span className="font-bold text-blue-700">اعتباری ۳۰ روزه</span>;
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#55565A] flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-[#E06518]" />
            <span>مدیریت سفارشات صنعتی و فرآیند لجستیک</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            کنترل سفارش‌ها، بررسی و تأیید فیش‌های واریزی، اعتبارسنجی خریدهای چکی و ثبت شماره بارنامه باربری.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
            {toPersianDigits(orders.filter(o => o.status === 'pending').length)} سفارش در صف اقدام
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-slate-400 ml-2">وضعیت سفارش:</span>
          {[
            { id: 'all', label: 'همه وضعیت‌ها' },
            { id: 'pending', label: 'در انتظار تأیید' },
            { id: 'confirmed', label: 'تأییدشده' },
            { id: 'packing', label: 'در حال بسته‌بندی' },
            { id: 'shipped', label: 'ارسال‌شده' },
            { id: 'delivered', label: 'تحویل‌شده' },
            { id: 'cancelled', label: 'لغوشده' },
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === st.id
                  ? 'bg-[#55565A] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Payment & Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="جستجو با شماره سفارش، نام مشتری یا شرکت..."
              className="w-full h-10 pr-9 pl-3 rounded-xl border border-slate-200 outline-none focus:border-[#E06518]"
            />
            <ShoppingBag className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>

          <div>
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-[#E06518]"
            >
              <option value="all">همه روش‌های پرداخت</option>
              <option value="online">درگاه آنلاین بانکی</option>
              <option value="receipt">فیش واریز نقدی</option>
              <option value="credit">خرید اعتباری ۳۰ روزه</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-[#55565A]">
                <th className="py-3.5 px-4">شماره سفارش</th>
                <th className="py-3.5 px-4">مشتری / شرکت</th>
                <th className="py-3.5 px-4">تعداد اقلام</th>
                <th className="py-3.5 px-4">روش پرداخت</th>
                <th className="py-3.5 px-4">مبلغ کل سفارش</th>
                <th className="py-3.5 px-4">وضعیت</th>
                <th className="py-3.5 px-4">تاریخ ثبت</th>
                <th className="py-3.5 px-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    سفارشی با معیارهای جستجو یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(ord => (
                  <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-black text-[#55565A]">{ord.id}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#55565A]">{ord.customerName}</div>
                      <div className="text-[10px] text-slate-400">{ord.company || ord.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {toPersianDigits(ord.items.length)} ردیف
                    </td>
                    <td className="py-3.5 px-4">{getPaymentBadge(ord.paymentMethod)}</td>
                    <td className="py-3.5 px-4 font-mono font-black text-[#C95210]">
                      {formatPrice(ord.totalAmount)} ت
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(ord.status)}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">{ord.createdAt}</td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenDetail(ord)}
                        className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#55565A] font-bold text-xs flex items-center gap-1 cursor-pointer mx-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>بررسی و اقدام</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ORDER DETAIL & LOGISTICS MODAL --- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="bg-[#55565A] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm">
                  جزئیات سفارش {selectedOrder.id} - {selectedOrder.customerName}
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  تاریخ ثبت: {selectedOrder.createdAt} | تماس: {selectedOrder.phone}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs">
              {/* Order Status & Flow Step */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-500">وضعیت فعلی سفارش:</span>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus('confirmed')}
                    className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                  >
                    تأیید سفارش
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('packing')}
                    className="py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer"
                  >
                    ارسال به انبار (بسته‌بندی)
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('shipped')}
                    className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                  >
                    تحویل باربری (ارسال شد)
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('delivered')}
                    className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                  >
                    تحویل نهایی مشتری
                  </button>
                </div>
              </div>

              {/* SECTION: RECEIPT VERIFICATION IF METHOD IS RECEIPT */}
              {selectedOrder.paymentMethod === 'receipt' && (
                <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-amber-600" />
                      <h4 className="font-black text-sm text-[#55565A]">بررسی و اعتبارسنجی فیش واریزی</h4>
                    </div>
                    {selectedOrder.receiptVerified ? (
                      <span className="text-emerald-700 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        ✓ فیش توسط حسابداری تأیید شد
                      </span>
                    ) : (
                      <span className="text-amber-800 font-bold bg-amber-100 px-2.5 py-0.5 rounded-full">
                        در انتظار تأیید حسابداری
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div>
                      {selectedOrder.receiptImageUrl ? (
                        <div className="border border-slate-300 rounded-2xl overflow-hidden bg-white p-2">
                          <img
                            src={selectedOrder.receiptImageUrl}
                            alt="Receipt"
                            className="w-full h-44 object-contain rounded-xl"
                          />
                          <a
                            href={selectedOrder.receiptImageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block text-center text-[11px] text-blue-600 hover:underline pt-2 font-bold"
                          >
                            مشاهده تصویر در اندازه بزرگ
                          </a>
                        </div>
                      ) : (
                        <div className="p-8 border-2 border-dashed border-slate-300 rounded-2xl text-center text-slate-400">
                          تصویر فیش ضمیمه نشده است
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-slate-500">کد رهگیری فیش / شماره ارجاع:</span>
                        <div className="font-mono font-black text-sm text-[#55565A]">
                          {selectedOrder.receiptTrackingCode || '140306129845'}
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-500">بانک مبدأ و تاریخ واریز:</span>
                        <div className="font-bold text-slate-800">
                          بانک ملت / حساب جاری اطلس - ۱۴۰۳/۰۶/۳۰
                        </div>
                      </div>

                      {!selectedOrder.receiptVerified && !isRejecting && (
                        <div className="pt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleVerifyReceipt(true)}
                            className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>تأیید فیش و تغییر وضعیت</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsRejecting(true)}
                            className="py-2 px-3 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 font-bold cursor-pointer"
                          >
                            رد فیش
                          </button>
                        </div>
                      )}

                      {isRejecting && (
                        <div className="space-y-2 pt-2">
                          <input
                            type="text"
                            placeholder="علت رد فیش (مثلاً عدم تطابق مبلغ یا ناخوانا بودن)..."
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            className="w-full h-9 px-3 rounded-xl border border-red-300 outline-none"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleVerifyReceipt(false)}
                              className="py-1.5 px-3 bg-red-600 text-white rounded-lg font-bold"
                            >
                              ارسال پیامک رد فیش به مشتری
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsRejecting(false)}
                              className="py-1.5 px-3 bg-slate-200 text-slate-700 rounded-lg"
                            >
                              انصراف
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: CREDIT STATUS IF METHOD IS CREDIT */}
              {selectedOrder.paymentMethod === 'credit' && (
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-blue-900">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      <span>خرید اعتباری ۳۰ روزه کارخانجات</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      سقف مجاز: ۲۰۰ میلیون تومان
                    </span>
                  </div>
                  <div className="text-slate-600">
                    مبلغ سفارش: <b className="font-mono text-[#55565A]">{formatPrice(selectedOrder.totalAmount)} تومان</b> | موعد چک صیادی: ۳۰ روز پس از صدور بارنامه رسمی
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2">
                <div className="font-bold text-[#55565A]">اقلام خریداری شده:</div>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-right">
                    <thead className="bg-slate-50 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">کد</th>
                        <th className="py-2.5 px-3">نام محصول</th>
                        <th className="py-2.5 px-3">تعداد</th>
                        <th className="py-2.5 px-3">قیمت واحد</th>
                        <th className="py-2.5 px-3">مبلغ کل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-mono font-bold">{it.productCode}</td>
                          <td className="py-2 px-3 font-bold text-[#55565A]">{it.productName}</td>
                          <td className="py-2 px-3 font-mono">{toPersianDigits(it.quantity)}</td>
                          <td className="py-2 px-3 font-mono">{formatPrice(it.unitPrice)} ت</td>
                          <td className="py-2 px-3 font-mono font-bold text-[#C95210]">
                            {formatPrice(it.totalPrice)} ت
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dispatch Logistics Form */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="font-black text-[#55565A] flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#E06518]" />
                  <span>ثبت مشخصات ارسال و شماره بارنامه</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 block mb-1">شرکت حمل‌ونقل / باربری</label>
                    <input
                      type="text"
                      value={carrier}
                      onChange={e => setCarrier(e.target.value)}
                      placeholder="باربری وطن، پیشتاز، باربری یزد..."
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1">شماره بارنامه / کد رهگیری</label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={e => setTrackingNumber(e.target.value)}
                      placeholder="مثلاً ۱۲۹۸۳۷۴"
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-400">
                    با ثبت بارنامه، پیامک حاوی شماره پیگیری به صورت خودکار برای شماره {selectedOrder.phone} ارسال می‌شود.
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('shipped')}
                    className="py-1.5 px-4 rounded-xl bg-[#55565A] text-white font-bold hover:bg-[#1B293E] cursor-pointer"
                  >
                    ثبت و ارسال پیامک رهگیری
                  </button>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-[#55565A]">نشانی و اطلاعات تحویل‌گیرنده:</div>
                <div className="text-slate-700">
                  {selectedOrder.shippingAddress || 'یزد، بلوار جانباز، شهرک صنعتی، سوله شماره ۸'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
