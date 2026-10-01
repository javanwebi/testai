import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { toPersianDigits, getStockStatus } from '../../utils/formatters';
import { ShoppingCart, PhoneCall, Check, Eye, Heart, Lock, Sparkles, ShieldCheck } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { pricingCreditService } from '../../services/pricingCreditService';

export interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { currentUser, openAuthModal } = useAuth();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [addedAnimation, setAddedAnimation] = useState(false);
  const [isInquiring, setIsInquiring] = useState(false);
  const [inquiryResult, setInquiryResult] = useState<{
    price: number;
    gradeName: string;
    priceListName: string;
  } | null>(() => {
    if (!currentUser) return null;
    const approval = pricingCreditService.getCustomerByPhone(currentUser.phone);
    const gradeId = approval?.assignedGradeId || 'grade-4';
    const priceListId = approval?.assignedPriceListId || 'pl-standard-d';
    const res = pricingCreditService.calculateInquiryPrice(product, priceListId, gradeId);
    if (res) {
      return {
        price: res.calculatedPrice,
        gradeName: res.gradeName,
        priceListName: res.priceListName,
      };
    }
    return null;
  });

  const stockInfo = getStockStatus(product.stock);
  const isFavorited = isInWishlist(product.code);

  const handleInquirePriceClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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
        setInquiryResult({
          price: calc.calculatedPrice,
          gradeName: calc.gradeName,
          priceListName: calc.priceListName,
        });
      }
      setIsInquiring(false);
    }, 400);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      openAuthModal();
      return;
    }

    addToCart(product, 1);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  return (
    <div className="group relative flex flex-col bg-[#FFFFFF] rounded-2xl border border-[#CBD2D8] shadow-xs hover:shadow-md hover:border-[#E06518]/60 transition-all duration-200 overflow-hidden h-full text-right">
      {/* Top Header: Code, Badges, Wishlist */}
      <div className="p-2.5 pb-1 flex items-center justify-between gap-1 z-10">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg bg-[#DEE2E5] text-[#55565A] tracking-wide border border-[#CBD2D8]">
            {product.code}
          </span>
          {product.cataloguePage && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#DEE2E5] text-[#777A7D] border border-[#CBD2D8]">
              ص {toPersianDigits(product.cataloguePage)}
            </span>
          )}
          {product.hasCatalogueImage && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#DEE2E5] text-[#55565A] border border-[#CBD2D8]">
              <Sparkles className="w-2.5 h-2.5 text-[#E06518]" />
              <span>تصویر کاتالوگ</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {product.inquiryOnly && (
            <Badge variant="warning" size="sm">
              استعلامی
            </Badge>
          )}

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product.code);
            }}
            title="افزودن به نشان‌شده‌ها"
            className="p-1.5 rounded-full text-[#777A7D] hover:text-[#E06518] hover:bg-[#DEE2E5] transition-colors cursor-pointer"
          >
            <Heart
              className={`w-4 h-4 ${
                isFavorited ? 'fill-[#E06518] text-[#E06518]' : 'text-[#777A7D]'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Product SVG Placeholder Image */}
      <Link
        to={`/product/${encodeURIComponent(product.code)}`}
        className="relative block w-full pt-[62%] bg-[#DEE2E5] overflow-hidden"
      >
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-contain p-2.5 group-hover:scale-105 transition-transform duration-300"
        />
      </Link>

      {/* Product Details */}
      <div className="flex flex-col flex-1 p-3.5 pt-2">
        {/* Brand Chip & Subcategory */}
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="font-bold px-2 py-0.5 rounded-md bg-[#DEE2E5] text-[#E06518] border border-[#CBD2D8] truncate max-w-[50%]">
            {product.brand}
          </span>
          <Link
            to={`/category/${product.categorySlug}`}
            className="text-[#777A7D] hover:text-[#E06518] hover:underline truncate max-w-[48%] text-left transition-colors"
            title={product.categoryName}
          >
            {product.subcategory || product.categoryName}
          </Link>
        </div>

        {/* Product Name */}
        <Link
          to={`/product/${encodeURIComponent(product.code)}`}
          className="font-bold text-xs sm:text-sm text-[#55565A] hover:text-[#E06518] line-clamp-2 min-h-[38px] leading-relaxed transition-colors mb-1.5"
          title={product.name}
        >
          {product.name}
        </Link>

        {product.forzaCode && (
          <div className="mb-2">
            <span className="inline-block text-[10px] font-mono font-bold text-[#55565A] bg-[#DEE2E5] px-1.5 py-0.5 rounded border border-[#CBD2D8]" dir="ltr">
              {product.forzaCode}
            </span>
          </div>
        )}

        {/* Stock Indicator */}
        <div className="flex items-center gap-1.5 text-xs mb-3">
          <span
            className="w-2 h-2 rounded-full inline-block shrink-0"
            style={{ backgroundColor: stockInfo.badgeBg }}
          />
          <span className="text-[11px] text-[#777A7D] truncate">{stockInfo.text}</span>
        </div>

        {/* Dynamic Pricing Box */}
        <div className="mt-auto pt-2.5 border-t border-[#CBD2D8]">
          {!currentUser ? (
            /* Guest / Not logged in */
            <div className="bg-[#DEE2E5] rounded-xl p-2.5 border border-[#CBD2D8] text-center mb-2.5 space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#55565A]">
                <Lock className="w-3.5 h-3.5 text-[#E06518] shrink-0" />
                <span>مشاهده قیمت منوط به استعلام</span>
              </div>
              <p className="text-[10px] text-[#777A7D]">
                قیمت‌ها بر اساس گرید اعتباری و لیست قیمت پس از ورود محاسبه می‌شوند.
              </p>
            </div>
          ) : inquiryResult ? (
            /* Logged in with Inquiry Result */
            <div className="flex flex-col mb-2.5">
              <div className="flex items-center justify-between text-[10px] text-[#777A7D] mb-1">
                <span className="flex items-center gap-1 text-[#55565A] font-bold">
                  <ShieldCheck className="w-3 h-3 text-[#E06518]" />
                  <span>{inquiryResult.gradeName}</span>
                </span>
                <span className="truncate max-w-[140px] text-[#777A7D] font-medium">
                  {inquiryResult.priceListName}
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-[11px] font-medium text-[#777A7D]">نرخ استعلامی:</span>
                <div className="text-left">
                  <span className="text-sm sm:text-base font-black text-[#55565A]">
                    {toPersianDigits(new Intl.NumberFormat('fa-IR').format(inquiryResult.price))}
                  </span>
                  <span className="text-[10px] font-normal text-[#777A7D] mr-1">تومان</span>
                </div>
              </div>
            </div>
          ) : (
            /* Logged in but not yet inquired */
            <div className="bg-[#DEE2E5] rounded-xl p-2.5 border border-[#CBD2D8] text-center mb-2.5">
              <span className="text-[11px] font-bold text-[#55565A] block">
                استعلام نرخ اختصاصی برای شما
              </span>
              <span className="text-[10px] text-[#777A7D]">
                جهت استخراج قیمت بر حسب گرید خود کلیک کنید
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-5 gap-1.5 mt-1">
            <Link
              to={`/product/${encodeURIComponent(product.code)}`}
              className="col-span-1 flex items-center justify-center h-9 rounded-xl border border-[#CBD2D8] text-[#55565A] hover:text-[#E06518] hover:bg-[#DEE2E5] transition-colors"
              title="مشاهده مشخصات فنی و استعلام"
            >
              <Eye className="w-4 h-4 text-[#55565A]" />
            </Link>

            {!currentUser ? (
              /* Guest: Inquiry Button that prompts login */
              <button
                type="button"
                onClick={handleInquirePriceClick}
                className="col-span-4 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-[#55565A] hover:bg-[#55565A]/90 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#E06518]" />
                <span>استعلام قیمت کالا</span>
              </button>
            ) : inquiryResult ? (
              /* Logged In with price: Can add to cart / quote */
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className={`col-span-4 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  product.stock <= 0
                    ? 'bg-[#DEE2E5] text-[#777A7D] cursor-not-allowed border border-[#CBD2D8]'
                    : addedAnimation
                    ? 'bg-[#55565A] text-white'
                    : 'bg-[#E06518] text-white hover:bg-[#C95210]'
                }`}
              >
                {addedAnimation ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>افزوده شد</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>{product.stock <= 0 ? 'ناموجود' : 'افزودن به پیش‌فاکتور'}</span>
                  </>
                )}
              </button>
            ) : (
              /* Logged in, button to calculate instant price based on customer grade */
              <button
                type="button"
                onClick={handleInquirePriceClick}
                disabled={isInquiring}
                className="col-span-4 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-[#E06518] hover:bg-[#C95210] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isInquiring ? 'در حال استعلام نرخ...' : 'استعلام قیمت شما'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
