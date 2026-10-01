import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { FileText, Heart, Check, ArrowLeft } from 'lucide-react';

interface FeaturedProductCardProps {
  product: Product;
}

export const FeaturedProductCard: React.FC<FeaturedProductCardProps> = ({ product }) => {
  const { currentUser, openAuthModal } = useAuth();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [inquired, setInquired] = useState(false);

  const isFavorited = isInWishlist(product.code);

  const handleInquiry = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      openAuthModal();
      return;
    }

    addToCart(product, 1);
    setInquired(true);
    setTimeout(() => setInquired(false), 2000);
  };

  return (
    <div className="group relative flex flex-col bg-[#FFFFFF] rounded-xl border border-[#CBD2D8] hover:border-[#E06518]/60 hover:shadow-md transition-all duration-200 overflow-hidden text-right h-full">
      {/* Wishlist button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleWishlist(product.code);
        }}
        className="absolute top-2.5 left-2.5 z-10 w-7 h-7 rounded-full bg-white/90 shadow-2xs flex items-center justify-center text-[#777A7D] hover:text-[#E06518] transition-colors"
        title="افزودن به علاقه‌مندی‌ها"
      >
        <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-[#E06518] text-[#E06518]' : ''}`} />
      </button>

      {/* Product Image */}
      <Link
        to={`/product/${encodeURIComponent(product.code)}`}
        className="block relative w-full pt-[75%] bg-[#DEE2E5] overflow-hidden border-b border-[#CBD2D8]"
      >
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-200"
        />
      </Link>

      {/* Card Content */}
      <div className="flex flex-col flex-1 p-3.5 justify-between space-y-3">
        <div>
          {/* Product Name */}
          <Link
            to={`/product/${encodeURIComponent(product.code)}`}
            className="block font-bold text-sm text-[#55565A] hover:text-[#E06518] transition-colors leading-snug line-clamp-1 mb-2"
            title={product.name}
          >
            {product.name}
          </Link>

          {/* Technical Specs & Code */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#777A7D]">
            <span className="px-1.5 py-0.5 rounded bg-[#DEE2E5] font-mono font-bold text-[#55565A] border border-[#CBD2D8]">
              کد: {product.code}
            </span>
            {product.technicalSpecs && product.technicalSpecs[0] && (
              <span className="px-1.5 py-0.5 rounded bg-[#DEE2E5] text-[#55565A] font-medium border border-[#CBD2D8]">
                {product.technicalSpecs[0].key}: {product.technicalSpecs[0].value}
              </span>
            )}
          </div>
        </div>

        {/* Stock Status & Inquiry Action */}
        <div className="pt-2 border-t border-[#CBD2D8] space-y-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-[#55565A] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#E06518]" />
              موجود در انبار اطلس
            </span>
            {product.brand && (
              <span className="text-[#777A7D] text-[10px] font-mono">
                {product.brand}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInquiry}
              className="flex-1 h-9 rounded-lg bg-[#E06518] hover:bg-[#C95210] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              {inquired ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>ثبت شد</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  <span>استعلام قیمت</span>
                </>
              )}
            </button>

            <Link
              to={`/product/${encodeURIComponent(product.code)}`}
              className="h-9 px-2.5 rounded-lg border border-[#CBD2D8] hover:bg-[#DEE2E5] text-[#55565A] hover:text-[#E06518] flex items-center justify-center transition-colors"
              title="مشاهده جزئیات"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
