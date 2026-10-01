import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart, SHIPPING_METHODS, ShippingMethod } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toPersianDigits, formatPrice } from '../utils/formatters';
import {
  MapPin,
  Truck,
  CreditCard,
  CheckCircle2,
  Plus,
  ArrowRight,
  ArrowLeft,
  Building,
  ShieldCheck,
  FileText,
  UploadCloud,
  FileCheck,
  AlertCircle,
  Copy,
  Clock,
  Printer,
  ChevronLeft,
} from 'lucide-react';
import { Address, Order } from '../types';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    cart,
    subtotalAmount,
    discountAmount,
    clubPointsDiscount,
    finalTotalAmount,
    placeOrder,
  } = useCart();

  const { currentUser, getUserAddresses, addAddress, roleTitle } = useAuth();

  // Stepper state: 1 = Address, 2 = Shipping, 3 = Payment & Review
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Selected states
  const addresses = getUserAddresses();
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    addresses.length > 0 ? (addresses.find(a => a.isDefault)?.id || addresses[0].id) : ''
  );

  const [selectedShipping, setSelectedShipping] = useState<ShippingMethod>(SHIPPING_METHODS[0]);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'transfer' | 'credit'>('online');

  // New address modal / inline form
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newRecipientName, setNewRecipientName] = useState(currentUser?.fullName || '');
  const [newRecipientPhone, setNewRecipientPhone] = useState(currentUser?.phone || '');
  const [newProvince, setNewProvince] = useState('یزد');
  const [newCity, setNewCity] = useState('یزد');
  const [newFullAddress, setNewFullAddress] = useState('');
  const [newPostalCode, setNewPostalCode] = useState('');

  // Card to Card fields
  const [transferReceiptNumber, setTransferReceiptNumber] = useState('');
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  const [copiedBankInfo, setCopiedBankInfo] = useState(false);

  // Bank Gateway Simulation State
  const [showBankGatewayModal, setShowBankGatewayModal] = useState(false);

  // Completed Order State
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Selected address object
  const activeAddress = addresses.find(a => a.id === selectedAddressId) || addresses[0];

  const handleSaveNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipientName || !newRecipientPhone || !newFullAddress) return;

    const created = addAddress({
      title: newTitle || 'آدرس جدید',
      recipientName: newRecipientName,
      recipientPhone: newRecipientPhone,
      province: newProvince,
      city: newCity,
      fullAddress: newFullAddress,
      postalCode: newPostalCode || '8910000000',
      isDefault: false,
    });

    setSelectedAddressId(created.id);
    setIsAddingAddress(false);
    // Reset form
    setNewTitle('');
    setNewFullAddress('');
    setNewPostalCode('');
  };

  const handleFinalOrderSubmit = () => {
    if (!activeAddress) return;

    if (paymentMethod === 'online') {
      // Open mock bank gateway
      setShowBankGatewayModal(true);
      return;
    }

    // Direct place order for transfer or credit
    const order = placeOrder({
      address: activeAddress,
      shippingMethod: selectedShipping,
      paymentMethod,
      receiptImage: receiptUploaded ? 'uploaded_receipt_slip.png' : undefined,
    });
    setCompletedOrder(order);
  };

  const handleBankSuccess = () => {
    setShowBankGatewayModal(false);
    if (!activeAddress) return;

    const order = placeOrder({
      address: activeAddress,
      shippingMethod: selectedShipping,
      paymentMethod: 'online',
    });
    setCompletedOrder(order);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBankInfo(true);
    setTimeout(() => setCopiedBankInfo(false), 2000);
  };

  // If completed order, show Success Screen
  if (completedOrder) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 my-6">
        <div className="bg-white rounded-[16px] border border-emerald-200 p-8 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-black text-[#55565A]">سفارش شما با موفقیت ثبت گردید</h1>
            <p className="text-xs text-[#777A7D]">
              پیامک تأیید ثبت سفارش و صدور پیش‌فاکتور به شماره <span className="font-mono font-bold text-[#55565A]">{completedOrder.recipientPhone || currentUser?.phone}</span> ارسال شد.
            </p>
          </div>

          {/* Order Details Card */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 text-xs text-right space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <span className="text-[#777A7D]">شماره فاکتور سفارش:</span>
              <span className="font-mono font-black text-sm text-[#55565A]">{completedOrder.orderNumber}</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <span className="text-[#777A7D]">کد رهگیری انبار مرکزی:</span>
              <span className="font-mono font-bold text-[#E06518]">{completedOrder.trackingCode}</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <span className="text-[#777A7D]">وضعیت سفارش:</span>
              <span className="font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {completedOrder.status === 'registered' ? 'ثبت‌شده در صف انبار' : 'در انتظار تأیید اعتباری'}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <span className="text-[#777A7D]">روش پرداخت:</span>
              <span className="font-bold text-[#55565A]">
                {completedOrder.paymentMethod === 'online'
                  ? 'پرداخت اینترنتی شتاب (تأییدشده)'
                  : completedOrder.paymentMethod === 'transfer'
                  ? 'کارت‌به‌کارت / فیش واریز'
                  : 'خرید اعتباری B2B'}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <span className="text-[#777A7D]">آدرس مقصد تحویل:</span>
              <span className="text-[#55565A] truncate max-w-xs">{completedOrder.shippingAddress}</span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="font-bold text-[#55565A]">مبلغ پرداخت‌شده:</span>
              <span className="font-black text-base text-[#E06518]">{formatPrice(completedOrder.finalAmount)}</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link
              to="/account"
              className="px-6 py-2.5 bg-[#55565A] hover:bg-[#1B293E] text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2"
            >
              <Building className="w-4 h-4" />
              <span>پیگیری در پنل مشتری</span>
            </Link>

            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#55565A] text-xs font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#777A7D]" />
              <span>چاپ پیش‌فاکتور رسمی</span>
            </button>

            <Link
              to="/"
              className="px-5 py-2.5 text-[#E06518] hover:bg-orange-50 text-xs font-bold rounded-xl transition-colors"
            >
              بازگشت به صفحه اصلی
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If cart is empty and no order completed
  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-[12px] border border-[#CBD2D8] p-8 text-center space-y-4 shadow-sm">
        <p className="text-sm font-bold text-[#55565A]">سبد سفارش شما برای تسویه‌حساب خالی است.</p>
        <Link to="/" className="inline-block px-5 py-2 bg-[#E06518] text-white text-xs font-bold rounded-xl">
          بازگشت به فروشگاه
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 my-4">
      {/* 3-Step Stepper Header */}
      <div className="bg-white rounded-[16px] border border-[#CBD2D8] p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto relative">
          {/* Step 1: Address */}
          <div
            onClick={() => setCurrentStep(1)}
            className={`flex flex-col items-center gap-2 cursor-pointer z-10 ${
              currentStep === 1 ? 'text-[#E06518]' : currentStep > 1 ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-colors shadow-xs ${
                currentStep === 1
                  ? 'bg-[#E06518] text-white ring-4 ring-orange-100'
                  : currentStep > 1
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 text-slate-500 border border-slate-300'
              }`}
            >
              {currentStep > 1 ? <CheckCircle2 className="w-5 h-5" /> : '۱'}
            </div>
            <span className="text-xs font-bold">انتخاب آدرس</span>
          </div>

          {/* Connector 1 */}
          <div
            className={`flex-1 h-1 mx-2 rounded-full transition-colors ${
              currentStep > 1 ? 'bg-emerald-500' : 'bg-slate-200'
            }`}
          />

          {/* Step 2: Shipping */}
          <div
            onClick={() => currentStep > 1 && setCurrentStep(2)}
            className={`flex flex-col items-center gap-2 z-10 ${
              currentStep === 2 ? 'text-[#E06518]' : currentStep > 2 ? 'text-emerald-600' : 'text-slate-400'
            } ${currentStep > 1 ? 'cursor-pointer' : 'cursor-not-allowed'}`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-colors shadow-xs ${
                currentStep === 2
                  ? 'bg-[#E06518] text-white ring-4 ring-orange-100'
                  : currentStep > 2
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 text-slate-500 border border-slate-300'
              }`}
            >
              {currentStep > 2 ? <CheckCircle2 className="w-5 h-5" /> : '۲'}
            </div>
            <span className="text-xs font-bold">روش ارسال</span>
          </div>

          {/* Connector 2 */}
          <div
            className={`flex-1 h-1 mx-2 rounded-full transition-colors ${
              currentStep > 2 ? 'bg-emerald-500' : 'bg-slate-200'
            }`}
          />

          {/* Step 3: Payment & Review */}
          <div
            className={`flex flex-col items-center gap-2 z-10 ${
              currentStep === 3 ? 'text-[#E06518]' : 'text-slate-400'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-colors shadow-xs ${
                currentStep === 3
                  ? 'bg-[#E06518] text-white ring-4 ring-orange-100'
                  : 'bg-slate-100 text-slate-500 border border-slate-300'
              }`}
            >
              ۳
            </div>
            <span className="text-xs font-bold">پرداخت و مرور نهایی</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Current Step Form vs Sidebar Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* STEP 1: ADDRESS SELECTION */}
          {currentStep === 1 && (
            <div className="bg-white rounded-[16px] border border-[#CBD2D8] p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-[#CBD2D8] pb-3">
                <div className="flex items-center gap-2 font-bold text-sm text-[#55565A]">
                  <MapPin className="w-5 h-5 text-[#E06518]" />
                  <span>انتخاب محل تحویل سفارش و انبار کارخانه</span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingAddress(prev => !prev)}
                  className="text-xs font-bold text-[#E06518] hover:text-[#C95210] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن آدرس جدید</span>
                </button>
              </div>

              {/* Add Address Inline Form */}
              {isAddingAddress && (
                <form onSubmit={handleSaveNewAddress} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <h4 className="font-bold text-[#55565A]">ثبت آدرس کارخانه یا انبار جدید:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#55565A] mb-1">عنوان آدرس (مثلاً انبار خط ۲):</label>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        placeholder="انبار مرکزی"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#55565A] mb-1">نام و نام خانوادگی تحویل‌گیرنده:</label>
                      <input
                        type="text"
                        value={newRecipientName}
                        onChange={e => setNewRecipientName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#55565A] mb-1">شماره تماس مستقیم انباردار / گیرنده:</label>
                      <input
                        type="tel"
                        dir="ltr"
                        value={newRecipientPhone}
                        onChange={e => setNewRecipientPhone(e.target.value)}
                        placeholder="0913xxxxxxx"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-left font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#55565A] mb-1">استان و شهر:</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={newProvince}
                          onChange={e => setNewProvince(e.target.value)}
                          placeholder="یزد"
                          className="px-2 py-2 border border-slate-300 rounded-lg bg-white"
                          required
                        />
                        <input
                          type="text"
                          value={newCity}
                          onChange={e => setNewCity(e.target.value)}
                          placeholder="میبد"
                          className="px-2 py-2 border border-slate-300 rounded-lg bg-white"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#55565A] mb-1">نشانی دقیق پستی و صنعتی:</label>
                    <textarea
                      rows={2}
                      value={newFullAddress}
                      onChange={e => setNewFullAddress(e.target.value)}
                      placeholder="شهرک صنعتی، بلوار صنعت، کوچه تلاش..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#55565A] mb-1">کد پستی ۱۰ رقمی:</label>
                    <input
                      type="text"
                      dir="ltr"
                      maxLength={10}
                      value={newPostalCode}
                      onChange={e => setNewPostalCode(e.target.value)}
                      placeholder="8910000000"
                      className="w-full sm:w-1/2 px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono text-left"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#E06518] text-white font-bold rounded-lg hover:bg-[#C95210] cursor-pointer"
                    >
                      ذخیره و انتخاب این آدرس
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingAddress(false)}
                      className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 cursor-pointer"
                    >
                      انصراف
                    </button>
                  </div>
                </form>
              )}

              {/* Address Cards List */}
              <div className="space-y-3">
                {addresses.map(addr => (
                  <label
                    key={addr.id}
                    className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedAddressId === addr.id
                        ? 'border-[#E06518] bg-orange-50/40 ring-1 ring-orange-200'
                        : 'border-[#CBD2D8] hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 text-xs">
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="selected_address"
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="mt-1 text-[#E06518]"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#55565A]">{addr.title}</span>
                            {addr.isDefault && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                پیش‌فرض
                              </span>
                            )}
                          </div>
                          <p className="text-[#777A7D] leading-relaxed">
                            {addr.province}، {addr.city}، {addr.fullAddress}
                          </p>
                          <div className="flex items-center gap-4 text-[11px] text-[#777A7D] pt-1">
                            <span>گیرنده: <strong className="text-[#55565A]">{addr.recipientName}</strong></span>
                            <span>تماس: <span className="font-mono text-[#55565A]">{addr.recipientPhone}</span></span>
                            {addr.postalCode && (
                              <span>کدپستی: <span className="font-mono text-[#55565A]">{addr.postalCode}</span></span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Next Step Button */}
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={!selectedAddressId}
                  className="px-6 py-2.5 bg-[#E06518] hover:bg-[#C95210] disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <span>ادامه به مرحله روش ارسال</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SHIPPING METHOD */}
          {currentStep === 2 && (
            <div className="bg-white rounded-[16px] border border-[#CBD2D8] p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-[#CBD2D8] pb-3">
                <div className="flex items-center gap-2 font-bold text-sm text-[#55565A]">
                  <Truck className="w-5 h-5 text-[#E06518]" />
                  <span>انتخاب نحوه ارسال کالا از انبار مرکزی یزد</span>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs text-[#777A7D] hover:text-[#55565A] flex items-center gap-1"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>بازگشت به آدرس</span>
                </button>
              </div>

              <div className="space-y-3">
                {SHIPPING_METHODS.map(method => (
                  <label
                    key={method.id}
                    className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedShipping.id === method.id
                        ? 'border-[#E06518] bg-orange-50/40 ring-1 ring-orange-200'
                        : 'border-[#CBD2D8] hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 text-xs">
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="shipping_method"
                          checked={selectedShipping.id === method.id}
                          onChange={() => setSelectedShipping(method)}
                          className="mt-1 text-[#E06518]"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#55565A]">{method.name}</span>
                            <span className="text-[11px] font-mono text-[#E06518] bg-orange-100 px-2 py-0.5 rounded">
                              {method.estimatedTime}
                            </span>
                          </div>
                          <p className="text-[#777A7D] text-[11px]">{method.description}</p>
                        </div>
                      </div>

                      <div className="text-left font-black text-sm text-[#55565A] shrink-0">
                        {method.cost === 0 ? (
                          <span className="text-emerald-600 font-bold">پس‌کرایه به مقصد</span>
                        ) : (
                          formatPrice(method.cost)
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-[#777A7D] space-y-1">
                <div className="font-bold text-[#55565A] flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>بسته‌بندی پالت چوبی استاندارد برای غلتک‌های سرامیکی و تسمه‌ها</span>
                </div>
                <p className="text-[11px]">
                  کلیه محموله‌ها همراه با بارنامه رسمی، بیمه حوادث جاده‌ای و لیبل فنی کدهای کارخانه ارسال می‌گردد.
                </p>
              </div>

              {/* Navigation buttons */}
              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  مرحله قبل
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-2.5 bg-[#E06518] hover:bg-[#C95210] text-white font-bold text-xs rounded-xl transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <span>ادامه به مرحله پرداخت و مرور</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT METHOD & FINAL REVIEW */}
          {currentStep === 3 && (
            <div className="bg-white rounded-[16px] border border-[#CBD2D8] p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-[#CBD2D8] pb-3">
                <div className="flex items-center gap-2 font-bold text-sm text-[#55565A]">
                  <CreditCard className="w-5 h-5 text-[#E06518]" />
                  <span>انتخاب روش پرداخت و تأیید نهایی</span>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-xs text-[#777A7D] hover:text-[#55565A] flex items-center gap-1"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>تغییر روش ارسال</span>
                </button>
              </div>

              {/* Payment Methods Selection */}
              <div className="space-y-3">
                {/* 1. Online Gateway */}
                <label
                  className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'online'
                      ? 'border-[#E06518] bg-orange-50/40 ring-1 ring-orange-200'
                      : 'border-[#CBD2D8] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3 text-xs">
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === 'online'}
                      onChange={() => setPaymentMethod('online')}
                      className="mt-1 text-[#E06518]"
                    />
                    <div className="space-y-1">
                      <div className="font-bold text-sm text-[#55565A]">
                        درگاه پرداخت اینترنتی شاپرک (کلیه کارت‌های شتاب)
                      </div>
                      <p className="text-[#777A7D] text-[11px]">
                        پرداخت آنلاین با رمز پویا از طریق درگاه امن شبیه‌سازی‌شده بانکی همراه با تأییدیه آنی سفارش.
                      </p>
                    </div>
                  </div>
                </label>

                {/* 2. Card to Card / Transfer */}
                <label
                  className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'transfer'
                      ? 'border-[#E06518] bg-orange-50/40 ring-1 ring-orange-200'
                      : 'border-[#CBD2D8] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3 text-xs">
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === 'transfer'}
                      onChange={() => setPaymentMethod('transfer')}
                      className="mt-1 text-[#E06518]"
                    />
                    <div className="space-y-1">
                      <div className="font-bold text-sm text-[#55565A]">
                        کارت‌به‌کارت / حواله پایا / ساتنا به حساب بازرگانی اطلس
                      </div>
                      <p className="text-[#777A7D] text-[11px]">
                        واریز به حساب رسمی بانک ملی ایران و ثبت شماره فیش یا آپلود رسید ماک
                      </p>
                    </div>
                  </div>
                </label>

                {/* Sub-view for Card to Card */}
                {paymentMethod === 'transfer' && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                    <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                      <div>
                        <div className="text-[#777A7D]">شماره شبای بانک ملی بنام بازرگانی تسمه اطلس یزد:</div>
                        <div className="font-mono font-bold text-sm text-[#55565A] mt-0.5" dir="ltr">
                          IR45 0170 0000 0012 3456 7890 12
                        </div>
                        <div className="text-[11px] text-[#777A7D]">شماره کارت: ۶۰۳۷-۹۹۷۵-۸۲۱۱-۴۵۹۰</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('IR450170000000123456789012')}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedBankInfo ? 'کپی شد!' : 'کپی شبا'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-[#55565A] mb-1">
                          شماره پیگیری یا ارجاع فیش واریز:
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          placeholder="مثلاً ۹۸۲۱۰۴"
                          value={transferReceiptNumber}
                          onChange={e => setTransferReceiptNumber(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono text-left"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-[#55565A] mb-1">
                          آپلود تصویر فیش / رسید واریز (ماک):
                        </label>
                        <button
                          type="button"
                          onClick={() => setReceiptUploaded(true)}
                          className={`w-full px-3 py-2 rounded-lg border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            receiptUploaded
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold'
                              : 'bg-white border-dashed border-slate-300 hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <UploadCloud className="w-4 h-4" />
                          <span>{receiptUploaded ? 'رسید آپلود شد (تأیید)' : 'انتخاب تصویر فیش'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Credit / Cheque (For B2B customers) */}
                <label
                  className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'credit'
                      ? 'border-[#E06518] bg-orange-50/40 ring-1 ring-orange-200'
                      : 'border-[#CBD2D8] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3 text-xs">
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === 'credit'}
                      onChange={() => setPaymentMethod('credit')}
                      className="mt-1 text-[#E06518]"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#55565A]">
                          خرید اعتباری ویژه مشتریان دائمی و نمایندگان (B2B)
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          نیاز به تأیید اپراتور
                        </span>
                      </div>
                      <p className="text-[#777A7D] text-[11px]">
                        ثبت سفارش با وضعیت «در انتظار تأیید» بدون پرداخت آنی. کارشناس امور مالی پس از بررسی سقف اعتبار و چک صیادی سفارش را تأیید می‌فرماید.
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {/* Order Items Review Table */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-xs text-[#55565A] border-b border-slate-100 pb-2">
                  اقلام سفارش ({toPersianDigits(cart.length)} قلم):
                </h4>
                <div className="divide-y divide-slate-100 text-xs">
                  {cart.map(item => (
                    <div key={item.product.code} className="py-2.5 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-[#55565A]">{item.product.name}</div>
                        <div className="font-mono text-[10px] text-[#777A7D]">
                          {item.product.code} | {item.product.brand} | {toPersianDigits(item.quantity)} {item.product.unit}
                        </div>
                      </div>
                      <div className="font-bold text-[#55565A]">
                        {formatPrice(
                          (item.product.prices[roleTitle.includes('عمده') ? 'wholesale' : roleTitle.includes('نماینده') ? 'dealer' : 'retail'] || item.product.prices.retail) * item.quantity
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Submit Button */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  مرحله قبل
                </button>

                <button
                  type="button"
                  onClick={handleFinalOrderSubmit}
                  className="px-8 py-3 bg-[#16A34A] hover:bg-[#15803D] text-white font-black text-sm rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>
                    {paymentMethod === 'online'
                      ? 'انتقال به درگاه بانک و پرداخت'
                      : paymentMethod === 'credit'
                      ? 'ثبت نهایی سفارش اعتباری'
                      : 'تأیید فیش و ثبت نهایی سفارش'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Summary Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-[16px] border border-[#CBD2D8] p-5 shadow-sm space-y-4 sticky top-24">
            <h3 className="font-bold text-sm text-[#55565A] border-b border-[#CBD2D8] pb-2.5">
              جزئیات صورتحساب
            </h3>

            <div className="space-y-2.5 text-xs text-[#777A7D]">
              <div className="flex justify-between">
                <span>جمع اقلام سبد:</span>
                <span className="font-bold text-[#55565A]">{formatPrice(subtotalAmount)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>تخفیف کوپن:</span>
                  <span>- {formatPrice(discountAmount)}</span>
                </div>
              )}

              {clubPointsDiscount > 0 && (
                <div className="flex justify-between text-orange-600 font-bold">
                  <span>تخفیف امتیاز باشگاه:</span>
                  <span>- {formatPrice(clubPointsDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>هزینه روش ارسال:</span>
                <span className="font-bold text-[#55565A]">
                  {selectedShipping.cost === 0 ? 'پس‌کرایه به مقصد' : formatPrice(selectedShipping.cost)}
                </span>
              </div>

              {activeAddress && (
                <div className="pt-2 border-t border-slate-100 text-[11px] space-y-0.5">
                  <span className="text-[#55565A] font-bold block">تحویل به:</span>
                  <p className="truncate text-slate-600">
                    {activeAddress.recipientName} - {activeAddress.city}
                  </p>
                </div>
              )}

              <div className="border-t border-[#CBD2D8] pt-3 flex items-baseline justify-between">
                <span className="font-bold text-sm text-[#55565A]">مبلغ نهایی:</span>
                <div className="text-xl font-black text-[#E06518]">
                  {formatPrice(finalTotalAmount)}
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-[#777A7D] space-y-1">
              <div className="flex items-center gap-1 font-bold text-[#55565A]">
                <FileCheck className="w-3.5 h-3.5 text-[#E06518]" />
                <span>فاکتور رسمی دارای شماره اقتصادی</span>
              </div>
              <p>پیش‌فاکتور رسمی بلافاصله پس از ثبت جهت بارگذاری در سامانه مؤدیان صادر می‌گردد.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mock Bank Payment Gateway Modal */}
      {showBankGatewayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-[#55565A]">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span>درگاه پرداخت اینترنتی شاپرک (شبیه‌ساز)</span>
              </div>
              <span className="font-mono text-slate-400">بانک سامان / شاپرک</span>
            </div>

            <div className="py-2 space-y-2">
              <div className="text-xs text-[#777A7D]">مبلغ قابل پرداخت:</div>
              <div className="text-2xl font-black text-[#55565A]">
                {formatPrice(finalTotalAmount)}
              </div>
              <div className="text-[11px] text-slate-500">پذیرنده: بازرگانی تسمه اطلس یزد (هایپر صنعت)</div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
              این یک شبیه‌ساز واقعی درگاه شتاب است. برای ثبت سفارش روی دکمه «پرداخت موفق» کلیک کنید.
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleBankSuccess}
                className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
              >
                پرداخت موفق
              </button>

              <button
                type="button"
                onClick={() => setShowBankGatewayModal(false)}
                className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                انصراف از پرداخت
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
