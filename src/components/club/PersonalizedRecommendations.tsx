// src/components/club/PersonalizedRecommendations.tsx
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronLeft, Layers, Eye } from 'lucide-react';
import { ProductCard } from '../product/ProductCard';
import { generateMockProducts } from '../../data/mockGenerator';
import { clubService } from '../../services/clubService';

interface PersonalizedRecommendationsProps {
  title?: string;
  limit?: number;
  className?: string;
}

export const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({
  title = 'پیشنهاد ویژه برای شما بر اساس آخرین بازدیدها',
  limit = 4,
  className = '',
}) => {
  const allProducts = useMemo(() => generateMockProducts(), []);
  const recommended = useMemo(() => {
    return clubService.getRecommendedProducts(allProducts).slice(0, limit);
  }, [allProducts, limit]);

  if (recommended.length === 0) return null;

  return (
    <div className={`space-y-3.5 ${className}`}>
      <div className="flex items-center justify-between border-b border-[#CBD2D8] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-5 bg-[#E06518] rounded-xs" />
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#E06518]" />
            <h2 className="text-base font-black text-[#55565A]">
              {title}
            </h2>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-medium text-[#777A7D] bg-slate-100 px-2 py-0.5 rounded-full">
            شخصی‌سازی‌شده برای شما
          </span>
        </div>

        <Link
          to="/category/industrial-belts"
          className="text-xs font-bold text-[#E06518] hover:text-[#C95210] flex items-center gap-0.5"
        >
          <span>مشاهده کاتالوگ جامع</span>
          <ChevronLeft className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
        {recommended.map(product => (
          <ProductCard key={product.code} product={product} />
        ))}
      </div>
    </div>
  );
};
