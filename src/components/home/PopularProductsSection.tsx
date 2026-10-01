import React, { useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ShoppingCart,
  ArrowLeft,
  Check,
  Phone,
  Calculator,
  Flame,
  Send,
  Eye,
} from 'lucide-react';
import { USER_PRODUCTS } from '../../data/userProducts';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { Modal } from '../ui/Modal';
import { Product } from '../../types';

export const PopularProductsSection: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  const popularProducts = useMemo(() => {
    const featuredCodes = [
      'AT-E001',
      'AT-E045',
      'AT-E095',
      'AT-E155',
      'AT-E205',
      'AT-E255',
      'AT-E290',
      'AT-E055',
      'AT-E012',
      'AT-E110',
      'AT-E180',
      'AT-E230',
    ];

    const matched = USER_PRODUCTS.filter(p => featuredCodes.includes(p.code));
    if (matched.length >= 8) {
      return matched;
    }
    return USER_PRODUCTS.slice(0, 12);
  }, []);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customerPhone, setCustomerPhone] = useState('');
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [quickAddedCode, setQuickAddedCode] = useState<string | null>(null);

  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrolled = Math.abs(el.scrollLeft) > 10;
    setCanScrollRight(scrolled);
  };

  const handleScrollLeft = () => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollBy({ left: -320, behavior: 'smooth' });
      setCanScrollRight(true);
    }
  };

  const handleScrollRight = () => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollBy({ left: 320, behavior: 'smooth' });
      setTimeout(checkScroll, 350);
    }
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerPhone.trim() || !selectedProduct) return;

    setInquirySubmitted(true);
    setTimeout(() => {
      setInquirySubmitted(false);
      setSelectedProduct(null);
      setCustomerPhone('');
      setQuantity(1);
    }, 2000);
  };

  const handleQuickInquiry = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addToCart(product, 1);
    setQuickAddedCode(product.code);
    setTimeout(() => setQuickAddedCode(null), 1800);
  };

  return (
    <section className="space-y-5" dir="rtl">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-[#CBD2D8] pb-3.5">
        {/* Right Title */}
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-black text-[#55565A] tracking-tight">
            محصولات پربازدید
          </h2>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-[#E06518] bg-[#DEE2E5] px-2.5 py-0.5 rounded-md border border-[#CBD2D8]">
            <Flame className="w-3.5 h-3.5 fill-[#E06518] text-[#E06518]" />
            <span>منتخب قطعات پرکاربرد صنایع</span>
          </span>
        </div>

        {/* Left Link */}
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#E06518] hover:text-[#C95210] transition-colors group"
        >
          <span>مشاهده همه ۳۱۸ محصول</span>
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Carousel Container */}
      <div className="relative group/carousel">
        {/* Navigation Arrow: Right */}
        <button
          type="button"
          onClick={handleScrollRight}
          className={`absolute -right-2 sm:-right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#FFFFFF] border border-[#CBD2D8] shadow-sm text-[#55565A] hover:text-white hover:bg-[#E06518] hover:border-[#E06518] flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 ${
            canScrollRight ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-75 pointer-events-none'
          }`}
          aria-label="محصولات قبلی"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Navigation Arrow: Left */}
        <button
          type="button"
          onClick={handleScrollLeft}
          className="absolute -left-2 sm:-left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#FFFFFF] border border-[#CBD2D8] shadow-sm text-[#55565A] hover:text-white hover:bg-[#E06518] hover:border-[#E06518] flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95"
          aria-label="محصولات بعدی"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Scrollable Products Row */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto pb-4 pt-1 px-1 scrollbar-none snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {popularProducts.map(product => {
            const isFav = isInWishlist(product.code);
            const isJustAdded = quickAddedCode === product.code;

            return (
              <div
                key={product.code}
                className="w-48 sm:w-60 shrink-0 bg-[#FFFFFF] rounded-2xl border border-[#CBD2D8] p-3 sm:p-4 shadow-xs hover:shadow-md hover:border-[#E06518]/60 transition-all duration-200 relative flex flex-col justify-between group snap-start text-right"
              >
                {/* Top Badge: Code & Brand */}
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="px-2 py-0.5 bg-[#E06518] text-white text-[10px] font-bold rounded-md">
                    {product.brand}
                  </span>

                  <span className="text-[10px] font-mono font-bold text-[#777A7D] bg-[#DEE2E5] px-1.5 py-0.5 rounded border border-[#CBD2D8]">
                    {product.code}
                  </span>
                </div>

                {/* Product Image on Clean Canvas */}
                <Link
                  to={`/product/${encodeURIComponent(product.code)}`}
                  className="w-full aspect-square rounded-xl overflow-hidden bg-[#DEE2E5] flex items-center justify-center p-2 mb-2 cursor-pointer group-hover:scale-105 transition-transform duration-200"
                >
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-contain"
                  />
                </Link>

                {/* Product Title */}
                <div className="space-y-1 my-1">
                  <Link
                    to={`/product/${encodeURIComponent(product.code)}`}
                    className="block font-bold text-xs sm:text-sm text-[#55565A] hover:text-[#E06518] transition-colors line-clamp-1"
                    title={product.name}
                  >
                    {product.name}
                  </Link>
                  <Link
                    to={`/category/${product.categorySlug}`}
                    className="block text-[10px] text-[#777A7D] hover:text-[#E06518] line-clamp-1 font-medium transition-colors"
                  >
                    {product.categoryName}
                  </Link>
                </div>

                {/* Inquiry Price Button */}
                <div className="pt-2 pb-2 text-center border-t border-[#CBD2D8] mt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(product)}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-2 bg-[#DEE2E5] hover:bg-[#E06518] text-[#55565A] hover:text-white text-xs font-black rounded-lg border border-[#CBD2D8] hover:border-[#E06518] transition-all cursor-pointer shadow-2xs"
                  >
                    <span>استعلام قیمت رسمی</span>
                    <Calculator className="w-3.5 h-3.5 text-[#E06518] group-hover:text-white" />
                  </button>
                </div>

                {/* Bottom Action Icons */}
                <div className="flex items-center justify-between pt-2 border-t border-[#CBD2D8] text-[#777A7D]">
                  <button
                    type="button"
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleWishlist(product.code);
                    }}
                    className="p-1.5 rounded-lg hover:bg-[#DEE2E5] text-[#777A7D] hover:text-[#E06518] transition-colors cursor-pointer"
                    title="افزودن به علاقه‌مندی‌ها"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        isFav ? 'fill-[#E06518] text-[#E06518]' : ''
                      }`}
                    />
                  </button>

                  <div className="flex items-center gap-1">
                    <Link
                      to={`/product/${encodeURIComponent(product.code)}`}
                      className="p-1.5 rounded-lg hover:bg-[#DEE2E5] text-[#55565A] hover:text-[#E06518] transition-colors"
                      title="مشاهده جزئیات قطعه"
                    >
                      <Eye className="w-4 h-4 text-[#55565A]" />
                    </Link>

                    <button
                      type="button"
                      onClick={e => handleQuickInquiry(product, e)}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        isJustAdded
                          ? 'bg-[#55565A] text-white'
                          : 'hover:bg-[#DEE2E5] hover:text-[#E06518] text-[#55565A]'
                      }`}
                      title="افزودن به لیست استعلام"
                    >
                      {isJustAdded ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <ShoppingCart className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Inquiry Modal */}
      {selectedProduct && (
        <Modal
          isOpen={Boolean(selectedProduct)}
          onClose={() => {
            setSelectedProduct(null);
            setInquirySubmitted(false);
          }}
          title={`استعلام سریع: ${selectedProduct.name}`}
        >
          {inquirySubmitted ? (
            <div className="text-center py-8 space-y-3" dir="rtl">
              <div className="w-12 h-12 rounded-full bg-[#DEE2E5] border border-[#CBD2D8] text-[#E06518] mx-auto flex items-center justify-center">
                <Check className="w-6 h-6 text-[#E06518]" />
              </div>
              <h4 className="font-bold text-base text-[#55565A]">درخواست استعلام ثبت شد</h4>
              <p className="text-xs text-[#777A7D]">
                کارشناسان واحد فروش هایپر صنعت اطلس در کوتاه‌ترین زمان با شما تماس خواهند گرفت.
              </p>
            </div>
          ) : (
            <form onSubmit={handleInquirySubmit} className="space-y-4" dir="rtl">
              <div className="flex items-center gap-3 p-3 bg-[#DEE2E5] rounded-xl border border-[#CBD2D8]">
                <img
                  src={selectedProduct.images[0]}
                  alt={selectedProduct.name}
                  className="w-14 h-14 object-contain bg-white rounded-lg p-1 border border-[#CBD2D8]"
                />
                <div>
                  <div className="font-bold text-xs text-[#55565A]">{selectedProduct.name}</div>
                  <div className="text-[11px] text-[#777A7D] font-mono">کد: {selectedProduct.code}</div>
                  <div className="text-[11px] text-[#E06518] font-semibold">{selectedProduct.categoryName}</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#55565A] mb-1">
                  تعداد مورد نیاز:
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full h-10 px-3 text-xs bg-[#FFFFFF] border border-[#CBD2D8] text-[#55565A] rounded-xl focus:outline-none focus:border-[#E06518]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#55565A] mb-1">
                  شماره موبایل جهت دریافت پیش‌فاکتور:
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#777A7D] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full h-10 pr-9 pl-3 text-xs bg-[#FFFFFF] border border-[#CBD2D8] text-[#55565A] rounded-xl focus:outline-none focus:border-[#E06518] font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 h-10 bg-[#E06518] hover:bg-[#C95210] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ارسال فوری استعلام</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="h-10 px-4 border border-[#CBD2D8] text-[#55565A] hover:bg-[#DEE2E5] font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </section>
  );
};
