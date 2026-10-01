import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductByCode, getSimilarProducts } from '../data/mockGenerator';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { toPersianDigits, getStockStatus } from '../utils/formatters';
import {
  ChevronLeft,
  ShieldCheck,
  PhoneCall,
  ShoppingCart,
  Check,
  Truck,
  FileSpreadsheet,
  AlertCircle,
  Heart,
  Share2,
  Copy,
  Info,
  Lock,
  Sparkles,
  Layers,
  Award,
  PackageCheck,
  Printer,
  ArrowUpRight,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ProductCard } from '../components/product/ProductCard';
import { pricingCreditService } from '../services/pricingCreditService';

export const ProductDetailPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const { currentUser, openAuthModal } = useAuth();
  const { addToCart, submitInquiry } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const product = code ? getProductByCode(decodeURIComponent(code)) : undefined;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [inquiryNotes, setInquiryNotes] = useState('');
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isInquiring, setIsInquiring] = useState(false);
  const [activeTab, setActiveTab] = useState<'specs' | 'catalogue' | 'delivery'>('specs');

  const [inquiryData, setInquiryData] = useState<{
    price: number;
    gradeName: string;
    priceListName: string;
    discountPercent: number;
  } | null>(() => {
    if (!product || !currentUser) return null;
    const approval = pricingCreditService.getCustomerByPhone(currentUser.phone);
    const gradeId = approval?.assignedGradeId || 'grade-4';
    const priceListId = approval?.assignedPriceListId || 'pl-standard-d';
    const calc = pricingCreditService.calculateInquiryPrice(product, priceListId, gradeId);
    if (calc) {
      return {
        price: calc.calculatedPrice,
        gradeName: calc.gradeName,
        priceListName: calc.priceListName,
        discountPercent: calc.discountPercent,
      };
    }
    return null;
  });

  if (!product) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 max-w-xl mx-auto my-12 shadow-xs">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-500">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-[#55565A]">کالای مورد نظر یافت نشد</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          کد کالای وارد شده در کاتالوگ جامع قطعات ثبت نشده است یا ممکن است کد تغییر یافته باشد.
        </p>
        <Link
          to="/products"
          className="inline-flex px-6 py-2.5 bg-[#E06518] text-white text-xs font-bold rounded-xl hover:bg-[#C95210] transition-colors shadow-xs"
        >
          بازگشت به کاتالوگ محصولات
        </Link>
      </div>
    );
  }

  const stockInfo = getStockStatus(product.stock);
  const isFavorited = isInWishlist(product.code);
  const similarProducts = getSimilarProducts(product, 4);
  const imageLabels = ['نمای اصلی قطعه', 'مقطع و نقشه فنی DIN', 'تأییدیه و بسته‌بندی'];

  const handleInquirePriceClick = () => {
    if (!currentUser) {
      openAuthModal();
      return;
    }

    setIsInquiring(true);
    setTimeout(() => {
      let approval = pricingCreditService.getCustomerByPhone(currentUser.phone);
      if (!approval) {
        approval = pricingCreditService.registerCustomer({
          fullName: currentUser.fullName,
          companyName: currentUser.companyName || '',
          phone: currentUser.phone,
          province: currentUser.province || 'یزد',
          city: currentUser.city || 'یزد',
          activityField: 'صنعتی',
          monthlyPurchaseEstimate: 'متوسط',
        });
      }

      const gradeId = approval.assignedGradeId || 'grade-4';
      const priceListId = approval.assignedPriceListId || 'pl-standard-d';
      const calc = pricingCreditService.calculateInquiryPrice(product, priceListId, gradeId);

      if (calc) {
        setInquiryData({
          price: calc.calculatedPrice,
          gradeName: calc.gradeName,
          priceListName: calc.priceListName,
          discountPercent: calc.discountPercent,
        });
      }
      setIsInquiring(false);
    }, 400);
  };

  const handleAddToCart = () => {
    if (!currentUser) {
      openAuthModal();
      return;
    }

    if (product.inquiryOnly || !inquiryData) {
      setIsInquiryModalOpen(true);
      return;
    }

    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitInquiry(product, quantity, inquiryNotes);
    setInquirySubmitted(true);
    setTimeout(() => {
      setInquirySubmitted(false);
      setIsInquiryModalOpen(false);
    }, 1400);
  };

  const copyProductCode = () => {
    navigator.clipboard.writeText(product.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `${product.name} (کد فنی: ${product.code}) - بازرگانی اطلس`,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback
      }
    }
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 lg:space-y-8 pb-24 lg:pb-12 text-right" dir="rtl">
      {/* 1. BREADCRUMB & UTILITY ACTIONS (MOBILE & DESKTOP) */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto no-scrollbar py-1">
          <Link to="/" className="hover:text-[#E06518] transition-colors shrink-0">
            صفحه اصلی
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <Link to="/products" className="hover:text-[#E06518] transition-colors shrink-0">
            محصولات
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <Link
            to={`/category/${product.categorySlug}`}
            className="hover:text-[#E06518] transition-colors shrink-0 max-w-[120px] sm:max-w-none truncate"
          >
            {product.categoryName}
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[#55565A] font-bold font-mono shrink-0">{product.code}</span>
        </nav>

        {/* Quick Utilities */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="h-8 px-2.5 text-xs font-medium text-slate-600 hover:text-[#55565A] bg-white hover:bg-slate-50 border border-slate-200/80 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="اشتراک‌گذاری قطعه"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">{copiedLink ? 'پیوند کپی شد' : 'اشتراک‌گذاری'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="h-8 px-2.5 text-xs font-medium text-slate-600 hover:text-[#55565A] bg-white hover:bg-slate-50 border border-slate-200/80 rounded-lg transition-colors hidden sm:flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="چاپ شناسنامه فنی قطعه"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>چاپ شناسنامه فنی</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN PRODUCT DETAIL HERO CONTAINER */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-6 lg:p-8 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-start">
          {/* Left: Gallery (Sticky on Desktop) */}
          <div className="lg:col-span-5 space-y-3.5 lg:sticky lg:top-24">
            <div className="relative w-full pt-[82%] bg-gradient-to-b from-slate-50/70 to-white border border-slate-200/90 rounded-2xl overflow-hidden group flex items-center justify-center">
              <img
                src={product.images[activeImageIndex] || product.images[0]}
                alt={`${product.name} - ${imageLabels[activeImageIndex]}`}
                className="absolute inset-0 w-full h-full object-contain p-6 sm:p-8 group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-3 right-3 bg-slate-900/75 backdrop-blur-xs text-white text-[10.5px] px-3 py-1 rounded-lg font-medium shadow-xs">
                {imageLabels[activeImageIndex]} ({toPersianDigits(activeImageIndex + 1)} از ۳)
              </div>
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {product.images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative pt-[75%] rounded-xl border overflow-hidden transition-all cursor-pointer ${
                    activeImageIndex === idx
                      ? 'border-[#E06518] ring-2 ring-[#E06518] ring-offset-1 shadow-xs bg-white'
                      : 'border-slate-200/80 opacity-70 hover:opacity-100 hover:border-slate-300 bg-slate-50/60'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-contain p-2"
                  />
                </button>
              ))}
            </div>

            {/* Quick Actions Under Gallery */}
            <div className="flex items-center justify-between pt-1 px-1 text-xs text-slate-500">
              <button
                type="button"
                onClick={() => toggleWishlist(product.code)}
                className="flex items-center gap-1.5 hover:text-red-600 transition-colors cursor-pointer py-1"
              >
                <Heart
                  className={`w-4 h-4 ${
                    isFavorited ? 'fill-red-500 text-red-500' : 'text-slate-400'
                  }`}
                />
                <span className="text-[11.5px]">{isFavorited ? 'نشان‌شده در حساب شما' : 'نشان کردن کالا'}</span>
              </button>

              <button
                type="button"
                onClick={copyProductCode}
                className="flex items-center gap-1.5 hover:text-[#55565A] transition-colors cursor-pointer py-1"
              >
                <Copy className="w-4 h-4 text-slate-400" />
                <span className="text-[11.5px]">{copiedCode ? 'کد کپی شد' : 'کپی کد فنی کالا'}</span>
              </button>
            </div>
          </div>

          {/* Right: Technical Specs & Pricing Actions */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Badges Strip */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-[#55565A] border border-slate-200">
                    کد فنی: {product.code}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-[#C95210] text-xs font-bold border border-orange-200">
                    {product.brand}
                  </span>
                  {product.forzaCode && (
                    <span
                      className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200"
                      dir="ltr"
                    >
                      {product.forzaCode}
                    </span>
                  )}
                  {product.cataloguePage && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                      کاتالوگ رسمی: صفحه {toPersianDigits(product.cataloguePage)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>موجود در انبار یزد ({toPersianDigits(product.stock)} عدد)</span>
                </div>
              </div>

              {/* Product Title */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#55565A] tracking-tight leading-snug">
                {product.name}
              </h1>

              {/* Stock status indicator */}
              <div className="flex items-center gap-2 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: stockInfo.badgeBg }}
                />
                <span className="text-slate-700 font-bold">{stockInfo.text}</span>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {product.description}
              </p>

              {/* Industrial Features Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">واحد شمارش:</span>
                  <span className="text-xs font-bold text-slate-800 mt-1">{product.unit}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">اصالت کالا:</span>
                  <span className="text-xs font-bold text-emerald-700 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ۱۰۰٪ اورجینال
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">تحویل کالا:</span>
                  <span className="text-xs font-bold text-slate-800 mt-1">انبار مرکزی یزد</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">مستندات مهندسی:</span>
                  <span className="text-xs font-bold text-slate-800 mt-1">
                    {product.cataloguePage ? `صفحه ${toPersianDigits(product.cataloguePage)}` : 'استاندارد DIN'}
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Pricing & Order Action Area */}
            <div className="pt-5 border-t border-slate-200/80 space-y-4">
              {!currentUser ? (
                /* Guest: Sleek, Minimal Inquiry Row */
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-50 via-slate-50/80 to-orange-50/20 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#55565A]">استعلام رسمی قیمت کالا</span>
                      <span className="text-[10.5px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        محاسبه طبق رتبه اعتباری
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>جهت مشاهده نرخ اختصاصی و صدور پیش‌فاکتور رسمی، وارد حساب خود شوید.</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openAuthModal()}
                    className="h-11 sm:h-12 px-6 bg-[#E06518] hover:bg-[#C95210] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-98"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>ورود و استعلام قیمت رسمی</span>
                  </button>
                </div>
              ) : inquiryData ? (
                /* Logged In with Inquired Price */
                <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-0.5">
                        نرخ مصوب استعلامی ({inquiryData.gradeName}):
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-black text-emerald-900 font-mono">
                          {toPersianDigits(
                            new Intl.NumberFormat('fa-IR').format(inquiryData.price * quantity)
                          )}
                        </span>
                        <span className="text-xs text-slate-600 font-medium">تومان</span>
                        {quantity > 1 && (
                          <span className="text-[11px] text-slate-400 mr-2">
                            (هر {product.unit}{' '}
                            {toPersianDigits(new Intl.NumberFormat('fa-IR').format(inquiryData.price))}{' '}
                            تومان)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">تعداد ({product.unit}):</span>
                      <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden shadow-2xs">
                        <button
                          type="button"
                          onClick={() => setQuantity(q => Math.max(1, q - 1))}
                          className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold cursor-pointer transition-colors"
                        >
                          -
                        </button>
                        <span className="w-11 text-center font-bold font-mono text-sm text-[#55565A]">
                          {toPersianDigits(quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(q => q + 1)}
                          className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold cursor-pointer transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={product.stock <= 0}
                      className={`h-12 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-98 ${
                        product.stock <= 0
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : added
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#E06518] hover:bg-[#C95210] text-white'
                      }`}
                    >
                      {added ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>به پیش‌فاکتور افزوده شد</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" />
                          <span>افزودن به سبد و پیش‌فاکتور</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsInquiryModalOpen(true)}
                      className="h-12 rounded-xl border border-slate-300 hover:border-slate-400 bg-white text-[#55565A] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs hover:bg-slate-50 active:scale-98"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-[#E06518]" />
                      <span>درخواست هماهنگی تحویل انبار یزد</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Logged In, needs instant click to inquire */
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-[#55565A] block">محاسبه نرخ بر مبنای پروفایل اعتباری</span>
                    <p className="text-[11px] text-slate-500">
                      جهت دریافت قیمت قطعی بر مبنای فهرست قیمت و سطح اعتباری شما، کلیک کنید.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleInquirePriceClick}
                    disabled={isInquiring}
                    className="h-11 sm:h-12 px-6 bg-[#E06518] hover:bg-[#C95210] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-98"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isInquiring ? 'در حال استعلام نرخ...' : 'استعلام آنی قیمت'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2.5 INTERACTIVE TABS: SPECS, CATALOGUE, WAREHOUSE & DELIVERY */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Tab Headers */}
        <div className="flex items-center border-b border-slate-200/80 bg-slate-50/70 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            className={`px-5 sm:px-7 py-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'specs'
                ? 'border-[#E06518] text-[#E06518] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>مشخصات فنی و استانداردهای DIN</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('catalogue')}
            className={`px-5 sm:px-7 py-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'catalogue'
                ? 'border-[#E06518] text-[#E06518] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>تطبیق با کاتالوگ و نقشه‌کشی کارخانه</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('delivery')}
            className={`px-5 sm:px-7 py-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'delivery'
                ? 'border-[#E06518] text-[#E06518] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>انبارداری یزد، تحویل و ضمانت اصالت</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-7">
          {activeTab === 'specs' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[#55565A]">شاخص‌های فنی و استانداردهای مهندسی قطعه</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    استخراج‌شده از مستندات رسمی تولیدکننده و آزمایشگاه‌های مرجع
                  </p>
                </div>
                {product.cataloguePage && (
                  <span className="text-xs font-bold px-3 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200">
                    صفحه {toPersianDigits(product.cataloguePage)} کاتالوگ جامع ۱۴۰۴
                  </span>
                )}
              </div>

              {product.technicalSpecs && product.technicalSpecs.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200/90 shadow-2xs">
                  <table className="w-full text-xs text-right">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                        <th className="py-3.5 px-4 font-bold w-1/3">شاخص فنی و مهندسی</th>
                        <th className="py-3.5 px-4 font-bold">مقدار اسمی طبق استاندارد کاتالوگ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {product.technicalSpecs.map((spec, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                          <td className="py-3.5 px-4 font-semibold text-slate-700 border-l border-slate-100">
                            {spec.key}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-[#55565A]">{spec.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                  اطلاعات فنی بیشتر طبق نقشه ساخت و فایل کاتالوگ قابل ارائه است.
                </div>
              )}

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-2">
                  <span className="text-xs text-slate-400">برچسب‌های طبقه‌بندی قطعه:</span>
                  {product.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'catalogue' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-[#55565A]">شناسنامه رسمی تطبیق با کاتالوگ کارخانه</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  کدها و مراجع استاندارد بین‌المللی جهت تطبیق توسط مهندسین خرید و دفاتر فنی کارخانجات
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-1">
                  <span className="text-slate-400 block text-[11px]">کد رسمی کاتالوگ:</span>
                  <span className="font-mono font-bold text-[#55565A] text-sm block">
                    {product.forzaCode || product.code}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-1">
                  <span className="text-slate-400 block text-[11px]">صفحه در کاتالوگ مرجع:</span>
                  <span className="font-bold text-[#55565A] text-sm block">
                    {product.cataloguePage ? `صفحه ${toPersianDigits(product.cataloguePage)}` : 'آرشیو مرکزی'}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-1">
                  <span className="text-slate-400 block text-[11px]">برند / تولیدکننده انحصاری:</span>
                  <span className="font-bold text-orange-600 text-sm block">{product.brand}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-1">
                  <span className="text-slate-400 block text-[11px]">استاندارد مرجع تولید:</span>
                  <span className="font-bold text-[#55565A] text-sm block">DIN ISO 9001 / CE</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-amber-950">تأییدیه اصالت کاتالوگ رسمی</h4>
                  <p className="text-[11.5px] leading-relaxed text-amber-900/90">
                    تمامی ابعاد، تلرانس‌ها و مقادیر اسمی این قطعه با نسخه اصلی کاتالوگ ۱۴۰۴ بازرگانی تسمه و قطعات
                    اطلس مطابقت کامل دارد. در صورت نیاز به نقشه دو بعدی یا سه بعدی CAD، با واحد مهندسی تماس بگیرید.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'delivery' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-[#55565A]">انبارداری، لجستیک و تحویل کالا از انبار مرکزی یزد</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  روند آماده‌سازی، بسته‌بندی صنعتی و ارسال سریع به سراسر ایران
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-orange-100/80 text-orange-700 flex items-center justify-center">
                    <Truck className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-900">روش‌های ارسال سریع</h4>
                  <p className="text-slate-500 text-[11.5px] leading-relaxed">
                    تحویل فوری از طریق باربری‌های معتبر، تیپاکس، وانت بین‌شهری و تحویل حضوری در انبار مرکزی یزد.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
                    <PackageCheck className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-900">بسته‌بندی استاندارد صنعتی</h4>
                  <p className="text-slate-500 text-[11.5px] leading-relaxed">
                    پوشش ضد رطوبت و بسته‌بندی مقاوم جهت جلوگیری از هرگونه سایش، تغییر شکل یا آسیب‌دیدگی در حین حمل.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-900">ضمانت اصالت و بازگشت</h4>
                  <p className="text-slate-500 text-[11.5px] leading-relaxed">
                    تضمین ۱۰۰٪ انطباق با کاتالوگ رسمی کارخانه با قابلیت مرجوعی در صورت هرگونه مغایرت ابعادی یا فنی.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. SIMILAR PRODUCTS */}
      {similarProducts.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-[#55565A]">محصولات مشابه در این دسته‌بندی</h2>
            <Link
              to={`/category/${product.categorySlug}`}
              className="text-xs font-bold text-[#E06518] hover:text-[#C95210] flex items-center gap-1 transition-colors"
            >
              <span>مشاهده تمام قطعات</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {similarProducts.map(p => (
              <ProductCard key={p.code} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* 4. MOBILE / ANDROID STICKY BOTTOM ACTION BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-4 py-3 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="block text-[11px] font-mono text-slate-500 truncate">{product.code}</span>
          <div className="text-xs font-black text-[#55565A] truncate">
            {!currentUser ? (
              <span className="text-amber-700">نیازمند استعلام رسمی</span>
            ) : inquiryData ? (
              <span className="text-emerald-700 font-mono">
                {toPersianDigits(new Intl.NumberFormat('fa-IR').format(inquiryData.price * quantity))} تومان
              </span>
            ) : (
              <span className="text-amber-700">آماده استعلام</span>
            )}
          </div>
        </div>

        <div>
          {!currentUser ? (
            <button
              type="button"
              onClick={() => openAuthModal()}
              className="h-11 px-5 bg-[#E06518] hover:bg-[#C95210] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <PhoneCall className="w-4 h-4" />
              <span>استعلام قیمت</span>
            </button>
          ) : inquiryData ? (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="h-11 px-5 bg-[#E06518] hover:bg-[#C95210] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{added ? 'افزوده شد' : 'افزودن به سبد'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleInquirePriceClick}
              disabled={isInquiring}
              className="h-11 px-5 bg-[#E06518] hover:bg-[#C95210] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isInquiring ? 'محاسبه...' : 'استعلام قیمت'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 5. INQUIRY / RFQ MODAL */}
      <Modal
        isOpen={isInquiryModalOpen}
        onClose={() => setIsInquiryModalOpen(false)}
        title={`استعلام قیمت و تحویل کالا: ${product.code}`}
        size="md"
      >
        <form onSubmit={handleInquirySubmit} className="space-y-4 text-right">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <p className="font-semibold text-sm text-[#55565A]">{product.name}</p>
            <p className="text-xs text-slate-500 mt-1">
              برند: {product.brand} | دسته‌بندی: {product.categoryName}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#55565A] mb-1">
              تعداد مورد نیاز ({product.unit}):
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#55565A] mb-1">
              توضیحات و ملزومات فنی:
            </label>
            <textarea
              rows={3}
              value={inquiryNotes}
              onChange={e => setInquiryNotes(e.target.value)}
              placeholder="نکات مربوط به زمان تحویل یا نوع بسته‌بندی..."
              className="w-full p-3 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          {inquirySubmitted ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold text-center">
              درخواست استعلام با موفقیت ثبت شد. واحد فروش به زودی پاسخ خواهد داد.
            </div>
          ) : (
            <button
              type="submit"
              className="w-full h-11 bg-[#E06518] hover:bg-[#C95210] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              ارسال استعلام رسمی
            </button>
          )}
        </form>
      </Modal>
    </div>
  );
};
