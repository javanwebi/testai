import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart, SHIPPING_METHODS } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toPersianDigits, formatPrice } from '../utils/formatters';
import {
  Trash2,
  Bookmark,
  ShoppingBag,
  ArrowLeft,
  ShieldCheck,
  Award,
  AlertTriangle,
  Tag,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronLeft,
} from 'lucide-react';
import { PriceTiers } from '../types';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    cart,
    savedForLater,
    inquiries,
    removeFromCart,
    updateQuantity,
    saveForLater,
    moveToCartFromSaved,
    removeFromSaved,
    clearCart,
    appliedDiscount,
    discountError,
    applyDiscountCode,
    removeDiscountCode,
    usedClubPoints,
    setClubPointsUsage,
    selectedShippingId,
    setSelectedShippingId,
    itemCount,
    subtotalAmount,
    totalRetailAmount,
    b2bSavings,
    discountAmount,
    tierDiscountPercent,
    tierDiscountAmount,
    isFreeShippingByTier,
    clubPointsDiscount,
    shippingCost,
    finalTotalAmount,
    getProductStock,
  } = useCart();

  const { currentUser, roleTitle, priceLayer, activeRole, openAuthModal } = useAuth();
  const [discountInput, setDiscountInput] = useState('');
  const [useClubToggle, setUseClubToggle] = useState(false);

  const isB2B = activeRole === 'wholesale' || activeRole === 'dealer' || activeRole === 'admin';

  const handleDiscountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (discountInput.trim()) {
      const ok = applyDiscountCode(discountInput);
      if (ok) setDiscountInput('');
    }
  };

  const handleCheckoutProceed = () => {
    if (!currentUser) {
      openAuthModal('/checkout');
    } else {
      navigate('/checkout');
    }
  };

  const handleClubToggle = (checked: boolean) => {
    setUseClubToggle(checked);
    if (checked && currentUser) {
      // Allow using up to all available club points, capped by half of subtotal
      const maxPoints = Math.min(currentUser.clubPoints, Math.floor(subtotalAmount / 2000));
      setClubPointsUsage(maxPoints);
    } else {
      setClubPointsUsage(0);
    }
  };

  const isEmpty = cart.length === 0 && savedForLater.length === 0 && inquiries.length === 0;

  if (isEmpty) {
    return (
      <div className="bg-white rounded-[12px] border border-[#CBD2D8] p-12 text-center space-y-4 max-w-xl mx-auto shadow-sm my-6">
        <div className="w-16 h-16 bg-orange-50 text-[#E06518] rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-[#55565A]">سبد سفارش شما خالی است</h2>
        <p className="text-xs text-[#777A7D] leading-relaxed">
          می‌توانید از طریق منوی دسته‌بندی‌ها یا جستجوی فنی کدهای تسمه و غلتک، اقلام مورد نیاز کارخانه یا واحد صنعتی خود را انتخاب نمایید.
        </p>
        <Link
          to="/"
          className="inline-flex px-6 py-2.5 bg-[#E06518] hover:bg-[#C95210] text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
        >
          مشاهده کاتالوگ محصولات
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#CBD2D8]">
        <div>
          <nav className="flex items-center gap-2 text-xs text-[#777A7D] mb-1">
            <Link to="/" className="hover:text-[#E06518]">
              صفحه اصلی
            </Link>
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="text-[#55565A] font-bold">سبد خرید</span>
          </nav>
          <h1 className="text-xl font-black text-[#55565A] flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-[#E06518]" />
            <span>سبد سفارش صنعتی و پیش‌فاکتور</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-[#C95210]">
              {toPersianDigits(itemCount)} قلم کالا
            </span>
          </h1>
        </div>

        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>خالی کردن کل سبد</span>
          </button>
        )}
      </div>

      {/* B2B Layer Banner */}
      <div className="p-3.5 rounded-xl bg-[#55565A] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-[#E06518] shrink-0" />
          <span>
            لایه‌ی محاسبه قیمت در این سبد: <strong className="text-orange-300 font-bold">{roleTitle}</strong>
          </span>
        </div>
        {b2bSavings > 0 && (
          <div className="text-emerald-400 font-bold bg-emerald-950/80 px-3 py-1 rounded border border-emerald-800 self-start sm:self-auto">
            سود همکاری لایه اختصاصی B2B: {formatPrice(b2bSavings)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Column: Cart Items & Inquiries & Saved For Later */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Cart Items */}
          {cart.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-[#55565A] uppercase tracking-wider">
                اقلام آماده صدور فاکتور ({toPersianDigits(cart.length)})
              </h2>

              {cart.map(item => {
                const stock = getProductStock(item.product);
                const isOverStock = item.quantity > stock;
                const unitPrice = item.product.prices[priceLayer as keyof PriceTiers] || item.product.prices.retail;
                const lineTotal = unitPrice * item.quantity;

                return (
                  <div
                    key={item.product.code}
                    className={`bg-white rounded-[12px] border ${
                      isOverStock ? 'border-amber-300 ring-1 ring-amber-100' : 'border-[#CBD2D8]'
                    } p-4 shadow-sm space-y-3 transition-all`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      {/* Product Thumb + Info */}
                      <div className="flex items-start gap-3.5 flex-1">
                        <div className="w-16 h-16 rounded-xl bg-slate-50 border border-[#CBD2D8] shrink-0 overflow-hidden flex items-center justify-center p-1">
                          {item.product.images[0] ? (
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Layers className="w-8 h-8 text-slate-300" />
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-[#55565A]">
                              {item.product.code}
                            </span>
                            <span className="text-[11px] font-semibold text-[#777A7D]">{item.product.brand}</span>
                            <span className="text-[10px] text-slate-400">واحد: {item.product.unit}</span>
                          </div>

                          <Link
                            to={`/product/${item.product.code}`}
                            className="font-bold text-xs sm:text-sm text-[#55565A] hover:text-[#E06518] line-clamp-2"
                          >
                            {item.product.name}
                          </Link>

                          <div className="text-[11px] text-[#777A7D]">
                            قیمت واحد: <strong className="text-[#55565A]">{formatPrice(unitPrice)}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Quantity control + Line Total */}
                      <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {/* Numerical input and +/- */}
                        <div className="flex items-center border border-[#CBD2D8] rounded-xl overflow-hidden bg-slate-50">
                          <button
                            onClick={() => updateQuantity(item.product.code, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 text-[#55565A] font-bold text-sm cursor-pointer transition-colors"
                            aria-label="کاهش تعداد"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={9999}
                            value={item.quantity}
                            onChange={e => {
                              const val = parseInt(e.target.value, 10);
                              updateQuantity(item.product.code, isNaN(val) ? 1 : val);
                            }}
                            className="w-12 h-8 text-center text-xs font-bold font-mono bg-white border-x border-[#CBD2D8] focus:outline-none"
                          />
                          <button
                            onClick={() => updateQuantity(item.product.code, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 text-[#55565A] font-bold text-sm cursor-pointer transition-colors"
                            aria-label="افزایش تعداد"
                          >
                            +
                          </button>
                        </div>

                        {/* Line total */}
                        <div className="text-left min-w-[110px]">
                          <div className="text-sm font-black text-[#55565A]">
                            {formatPrice(lineTotal)}
                          </div>
                          <div className="text-[10px] text-[#777A7D]">
                            {toPersianDigits(item.quantity)} {item.product.unit}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stock Alert Warning if quantity > stock */}
                    {isOverStock && (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <strong>هشدار موجودی: </strong>
                          تعداد درخواستی شما ({toPersianDigits(item.quantity)}) بیش از موجودی فوری انبار یزد ({toPersianDigits(stock)} {item.product.unit}) است.
                          <span className="text-[11px] text-amber-700 block mt-0.5">
                            تأمین مابقی تعداد کسری ظرف ۲۴ تا ۴۸ ساعت کاری از خط کارخانه انجام می‌پذیرد.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Action links: Save for later & Delete */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <button
                        type="button"
                        onClick={() => saveForLater(item.product.code)}
                        className="flex items-center gap-1 text-[#777A7D] hover:text-[#E06518] transition-colors cursor-pointer"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>ذخیره برای بعد</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.code)}
                        className="flex items-center gap-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف از سبد</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-[12px] p-6 text-center text-xs text-[#777A7D]">
              سبد خرید جاری شما خالی است. اقلام زیر در وضعیت استعلام یا ذخیره‌شده قرار دارند.
            </div>
          )}

          {/* Inquiry Items Section (Distinct Row with "در انتظار استعلام") */}
          {inquiries.length > 0 && (
            <div className="bg-white rounded-[12px] border border-amber-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-amber-100 pb-2.5">
                <h3 className="font-bold text-xs sm:text-sm text-[#55565A] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#F59E0B]" />
                  <span>اقلام دارای وضعیت «در انتظار استعلام قیمت» ({toPersianDigits(inquiries.length)})</span>
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  در حال بررسی کارشناس
                </span>
              </div>
              <p className="text-[11px] text-[#777A7D]">
                این قطعات شامل تسمه‌ها یا قطعات خاص با سایزهای سفارشی هستند که پس از تعیین قیمت در انبار اطلس، مستقیماً به سبد خرید شما اضافه می‌شوند.
              </p>

              <div className="divide-y divide-slate-100">
                {inquiries.map(inq => (
                  <div key={inq.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#55565A] bg-slate-100 px-1.5 py-0.5 rounded">
                          {inq.product.code}
                        </span>
                        <span className="font-bold text-[#55565A]">{inq.product.name}</span>
                      </div>
                      <div className="text-[11px] text-[#777A7D] mt-1">
                        تعداد درخواستی: <strong className="text-[#55565A]">{toPersianDigits(inq.quantity)}</strong> {inq.product.unit} | تاریخ: {inq.date}
                      </div>
                      {inq.notes && (
                        <div className="text-[10px] text-slate-500 italic mt-0.5">یادداشت فنی: {inq.notes}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                        <Clock className="w-3 h-3 animate-spin" />
                        <span>در انتظار استعلام</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Saved for Later Section */}
          {savedForLater.length > 0 && (
            <div className="bg-white rounded-[12px] border border-[#CBD2D8] p-5 shadow-sm space-y-3">
              <h3 className="font-bold text-xs sm:text-sm text-[#55565A] flex items-center gap-2 border-b border-[#CBD2D8] pb-2.5">
                <Bookmark className="w-4 h-4 text-[#E06518]" />
                <span>ذخیره شده برای بعد ({toPersianDigits(savedForLater.length)} کالا)</span>
              </h3>
              <p className="text-[11px] text-[#777A7D]">
                اقلامی که برای خریدهای آتی کنار گذاشته‌اید. هر زمان که مایل باشید می‌توانید آن‌ها را به سبد خرید منتقل کنید.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {savedForLater.map(product => {
                  const unitPrice = product.prices[priceLayer as keyof PriceTiers] || product.prices.retail;
                  return (
                    <div
                      key={product.code}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="font-mono text-[10px] text-[#777A7D]">{product.code}</div>
                        <div className="font-bold text-[#55565A] truncate">{product.name}</div>
                        <div className="text-orange-600 font-bold">{formatPrice(unitPrice)}</div>
                      </div>

                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveToCartFromSaved(product)}
                          className="px-2.5 py-1.5 bg-[#E06518] hover:bg-[#C95210] text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>انتقال به سبد</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromSaved(product.code)}
                          className="text-[10px] text-slate-400 hover:text-red-600 transition-colors"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Summary & Discount / Shipping */}
        <div className="lg:col-span-4 space-y-4">
          {/* Discount Code Box */}
          <div className="bg-white rounded-[12px] border border-[#CBD2D8] p-4 shadow-sm space-y-3">
            <h3 className="font-bold text-xs text-[#55565A] flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-[#E06518]" />
              <span>کد تخفیف همکاری / جشنواره</span>
            </h3>

            {appliedDiscount ? (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>کد {appliedDiscount.code} اعمال شد</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    {appliedDiscount.discountPercent}٪ تخفیف (تا سقف {formatPrice(appliedDiscount.maxDiscount)})
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeDiscountCode}
                  className="text-xs text-red-600 hover:underline cursor-pointer"
                >
                  حذف کد
                </button>
              </div>
            ) : (
              <form onSubmit={handleDiscountSubmit} className="space-y-2">
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    dir="ltr"
                    value={discountInput}
                    onChange={e => setDiscountInput(e.target.value)}
                    placeholder="مثلاً ATLAS1366"
                    className="flex-1 h-9 px-3 text-xs font-mono border border-[#CBD2D8] rounded-lg focus:outline-none focus:border-[#E06518] bg-slate-50 focus:bg-white uppercase"
                  />
                  <button
                    type="submit"
                    className="px-3.5 h-9 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    ثبت
                  </button>
                </div>
                {discountError && (
                  <p className="text-[11px] text-red-600">{discountError}</p>
                )}
                <p className="text-[10px] text-[#777A7D] leading-relaxed">
                  کدهای نمونه فعال: <code className="text-[#55565A] font-bold">WELCOME10</code> (۱۰٪ خرید اول)، <code className="text-[#55565A] font-bold">COMEBACK15</code> (۱۵٪ بازگشت)، <code className="text-[#55565A] font-bold">ATLAS1366</code>
                </p>
              </form>
            )}
          </div>

          {/* Club Points Redemption Box */}
          {currentUser && currentUser.clubPoints > 0 && (
            <div className="bg-white rounded-[12px] border border-[#CBD2D8] p-4 shadow-sm space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-[#55565A]">
                  <Sparkles className="w-4 h-4 text-[#E06518]" />
                  <span>مصرف امتیاز باشگاه اطلس</span>
                </div>
                <span className="font-bold text-[#E06518]">
                  {toPersianDigits(currentUser.clubPoints)} امتیاز
                </span>
              </div>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-orange-50/60 border border-orange-100 hover:bg-orange-50 transition-colors">
                <input
                  type="checkbox"
                  checked={useClubToggle}
                  onChange={e => handleClubToggle(e.target.checked)}
                  className="rounded text-[#E06518]"
                />
                <span className="text-[11px] text-[#55565A]">
                  تبدیل امتیاز به تخفیف نقدی فاکتور ({formatPrice(Math.min(currentUser.clubPoints * 1000, subtotalAmount / 2))} تخفیف)
                </span>
              </label>
            </div>
          )}

          {/* Shipping Method Selector in Cart */}
          <div className="bg-white rounded-[12px] border border-[#CBD2D8] p-4 shadow-sm space-y-2.5 text-xs">
            <h3 className="font-bold text-[#55565A] border-b border-slate-100 pb-2">
              برآورد روش و هزینه ارسال
            </h3>
            <div className="space-y-2">
              {SHIPPING_METHODS.map(m => (
                <label
                  key={m.id}
                  className={`flex items-start justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    selectedShippingId === m.id
                      ? 'border-[#E06518] bg-orange-50/40 text-[#55565A]'
                      : 'border-slate-200 hover:bg-slate-50 text-[#777A7D]'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="radio"
                      name="shipping"
                      checked={selectedShippingId === m.id}
                      onChange={() => setSelectedShippingId(m.id)}
                      className="mt-0.5 text-[#E06518]"
                    />
                    <div>
                      <div className="font-bold text-[#55565A]">{m.name}</div>
                      <div className="text-[10px] text-[#777A7D]">{m.estimatedTime}</div>
                    </div>
                  </div>
                  <div className="text-left font-bold text-[#55565A] text-[11px]">
                    {m.cost === 0 ? 'پس‌کرایه' : formatPrice(m.cost)}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Order Final Summary */}
          <div className="bg-white rounded-[12px] border border-[#CBD2D8] p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-[#55565A] border-b border-[#CBD2D8] pb-2.5">
              خلاصه نهایی صورتحساب
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-[#777A7D]">
                <span>جمع اقلام سبد:</span>
                <span className="font-bold text-[#55565A]">{formatPrice(subtotalAmount)}</span>
              </div>

              {isB2B && (
                <div className="flex items-center justify-between text-[#777A7D]">
                  <span>مجموع طبق نرخ مصرف‌کننده:</span>
                  <span className="font-mono line-through">{formatPrice(totalRetailAmount)}</span>
                </div>
              )}

              {b2bSavings > 0 && (
                <div className="flex items-center justify-between text-emerald-600 font-bold">
                  <span>سود همکاری لایه B2B:</span>
                  <span>- {formatPrice(b2bSavings)}</span>
                </div>
              )}

              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-emerald-600 font-bold">
                  <span>تخفیف کوپن:</span>
                  <span>- {formatPrice(discountAmount)}</span>
                </div>
              )}

              {tierDiscountAmount > 0 && (
                <div className="flex items-center justify-between text-emerald-600 font-bold">
                  <span>تخفیف سطح باشگاه ({toPersianDigits(tierDiscountPercent)}٪):</span>
                  <span>- {formatPrice(tierDiscountAmount)}</span>
                </div>
              )}

              {clubPointsDiscount > 0 && (
                <div className="flex items-center justify-between text-orange-600 font-bold">
                  <span>تخفیف امتیاز باشگاه:</span>
                  <span>- {formatPrice(clubPointsDiscount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-[#777A7D]">
                <span>هزینه حمل و ارسال:</span>
                <span className="font-bold text-[#55565A]">
                  {isFreeShippingByTier ? (
                    <span className="text-emerald-600 font-bold">رایگان (مزیت سطح طلایی باشگاه)</span>
                  ) : shippingCost === 0 ? (
                    'پس‌کرایه به مقصد'
                  ) : (
                    formatPrice(shippingCost)
                  )}
                </span>
              </div>

              <div className="border-t border-[#CBD2D8] pt-3 flex items-baseline justify-between">
                <span className="font-bold text-sm text-[#55565A]">مبلغ نهایی فاکتور:</span>
                <div className="text-xl font-black text-[#E06518]">
                  {formatPrice(finalTotalAmount)}
                </div>
              </div>
            </div>

            {/* Orange Button: ادامه فرایند خرید */}
            <button
              type="button"
              onClick={handleCheckoutProceed}
              disabled={cart.length === 0}
              className="w-full h-12 bg-[#E06518] hover:bg-[#C95210] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>ادامه فرایند خرید و ثبت آدرس</span>
              <ArrowLeft className="w-4 h-4" />
            </button>

            {!currentUser && (
              <p className="text-center text-[10px] text-[#777A7D]">
                کاربر مهمان گرامی، پیش از مرحله آدرس‌دهی به صفحه ورود پیامکی هدایت می‌شوید.
              </p>
            )}

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-[#777A7D] space-y-1">
              <div className="flex items-center gap-1 font-bold text-[#55565A]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>گارانتی اصالت و سلامت فیزیکی قطعات اطلس</span>
              </div>
              <p>تضمین تعویض تا ۷ روز در صورت مغایرت فنی یا مشخصات با دیتاشیت رسمی کارخانه SWR و FORZA.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
