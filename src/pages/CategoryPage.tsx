import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CATEGORIES } from '../data/categories';
import { getProductsByCategory } from '../data/mockGenerator';
import { ProductCard } from '../components/product/ProductCard';
import { Product } from '../types';
import { toPersianDigits } from '../utils/formatters';
import { Filter, ChevronLeft, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const category = CATEGORIES.find(c => c.slug === slug) || CATEGORIES[0];

  const [selectedSubcat, setSelectedSubcat] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [inquiryOnlyFilter, setInquiryOnlyFilter] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc' | 'code'>('default');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 24;

  const rawData = useMemo(() => {
    return getProductsByCategory(category.slug, 1000, 0);
  }, [category.slug]);

  // Extract unique brands for filtering
  const availableBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    rawData.products.forEach(p => brandsSet.add(p.brand));
    return Array.from(brandsSet);
  }, [rawData]);

  // Filter and sort
  const filteredProducts = useMemo(() => {
    let list = [...rawData.products];

    if (selectedSubcat !== 'all') {
      list = list.filter(p => p.subcategory === selectedSubcat);
    }
    if (selectedBrand !== 'all') {
      list = list.filter(p => p.brand === selectedBrand);
    }
    if (inStockOnly) {
      list = list.filter(p => p.stock > 0 && !p.inquiryOnly);
    }
    if (inquiryOnlyFilter) {
      list = list.filter(p => p.inquiryOnly);
    }

    if (sortBy === 'price_asc') {
      list.sort((a, b) => a.prices.retail - b.prices.retail);
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => b.prices.retail - a.prices.retail);
    } else if (sortBy === 'code') {
      list.sort((a, b) => a.code.localeCompare(b.code));
    }

    return list;
  }, [rawData, selectedSubcat, selectedBrand, inStockOnly, inquiryOnlyFilter, sortBy]);

  const paginated = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE) || 1;

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-[#777A7D]">
        <Link to="/" className="hover:text-[#E06518]">
          صفحه اصلی
        </Link>
        <ChevronLeft className="w-3.5 h-3.5" />
        <span className="text-[#55565A] font-bold">{category.name}</span>
      </nav>

      {/* Category Header Banner */}
      <div className="bg-white rounded-[12px] border border-[#CBD2D8] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-[#55565A]">
              {category.name}
            </h1>
            <p className="text-xs text-[#777A7D] max-w-3xl leading-relaxed">
              {category.description}
            </p>
          </div>
          <div className="text-xs text-[#777A7D] bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 self-start md:self-auto font-mono">
            {toPersianDigits(filteredProducts.length)} قلم کالا یافت شد
          </div>
        </div>

        {/* Subcategories Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-[#CBD2D8]">
          <button
            onClick={() => {
              setSelectedSubcat('all');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedSubcat === 'all'
                ? 'bg-[#55565A] text-white'
                : 'bg-slate-100 text-[#777A7D] hover:bg-slate-200'
            }`}
          >
            همه زیرگروه‌ها
          </button>
          {category.subcategories.map(sub => (
            <button
              key={sub}
              onClick={() => {
                setSelectedSubcat(sub);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedSubcat === sub
                  ? 'bg-[#E06518] text-white'
                  : 'bg-slate-100 text-[#777A7D] hover:bg-slate-200'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Filter Sidebar + Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <div className="space-y-4">
          <div className="bg-white rounded-[12px] border border-[#CBD2D8] p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#CBD2D8]">
              <span className="text-sm font-bold text-[#55565A] flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#E06518]" />
                فیلترهای پیشرفته
              </span>
              {(selectedSubcat !== 'all' || selectedBrand !== 'all' || inStockOnly) && (
                <button
                  onClick={() => {
                    setSelectedSubcat('all');
                    setSelectedBrand('all');
                    setInStockOnly(false);
                    setPage(1);
                  }}
                  className="text-[11px] text-[#DC2626] hover:underline"
                >
                  حذف فیلترها
                </button>
              )}
            </div>

            {/* Brand Filter */}
            <div>
              <label className="block text-xs font-bold text-[#55565A] mb-2">
                فیلتر بر اساس برند:
              </label>
              <select
                value={selectedBrand}
                onChange={e => {
                  setSelectedBrand(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-xs border border-[#CBD2D8] rounded-lg bg-white focus:outline-none focus:border-[#E06518]"
              >
                <option value="all">همه برندها</option>
                {availableBrands.map(b => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* In stock toggle */}
            <div className="pt-2 border-t border-[#CBD2D8] space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#55565A]">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={e => {
                    setInStockOnly(e.target.checked);
                    if (e.target.checked) setInquiryOnlyFilter(false);
                    setPage(1);
                  }}
                  className="rounded border-[#CBD2D8] text-[#E06518] focus:ring-[#E06518]"
                />
                <span>فقط کالاهای موجود در انبار</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#55565A]">
                <input
                  type="checkbox"
                  checked={inquiryOnlyFilter}
                  onChange={e => {
                    setInquiryOnlyFilter(e.target.checked);
                    if (e.target.checked) setInStockOnly(false);
                    setPage(1);
                  }}
                  className="rounded border-[#CBD2D8] text-[#E06518] focus:ring-[#E06518]"
                />
                <span>فقط اقلام نیازمند استعلام قیمت</span>
              </label>
            </div>
          </div>
        </div>

        {/* Products Grid & Sorting Bar */}
        <div className="lg:col-span-3 space-y-4">
          {/* Sorting controls */}
          <div className="bg-white rounded-[12px] border border-[#CBD2D8] p-3 px-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#777A7D]">
              <ArrowUpDown className="w-4 h-4 text-[#E06518]" />
              <span className="font-bold text-[#55565A]">مرتب‌سازی:</span>
              <button
                onClick={() => setSortBy('default')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  sortBy === 'default' ? 'bg-[#FFEDD5] text-[#C95210] font-bold' : 'hover:bg-slate-100'
                }`}
              >
                پیشنهاد اطلس
              </button>
              <button
                onClick={() => setSortBy('price_asc')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  sortBy === 'price_asc' ? 'bg-[#FFEDD5] text-[#C95210] font-bold' : 'hover:bg-slate-100'
                }`}
              >
                ارزان‌ترین
              </button>
              <button
                onClick={() => setSortBy('price_desc')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  sortBy === 'price_desc' ? 'bg-[#FFEDD5] text-[#C95210] font-bold' : 'hover:bg-slate-100'
                }`}
              >
                گران‌ترین
              </button>
              <button
                onClick={() => setSortBy('code')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  sortBy === 'code' ? 'bg-[#FFEDD5] text-[#C95210] font-bold' : 'hover:bg-slate-100'
                }`}
              >
                کد فنی کالا
              </button>
            </div>

            <div className="text-[#777A7D] text-[11px]">
              صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}
            </div>
          </div>

          {/* Product Items */}
          {paginated.length === 0 ? (
            <div className="bg-white rounded-[12px] border border-[#CBD2D8] p-12 text-center text-slate-500">
              کالایی با فیلترهای انتخابی یافت نشد. لطفاً فیلترها را تغییر دهید.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {paginated.map(product => (
                <ProductCard key={product.code} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-[#CBD2D8] bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                صفحه قبل
              </button>
              <div className="text-xs font-bold text-[#55565A]">
                صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}
              </div>
              <button
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs rounded-lg border border-[#CBD2D8] bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                صفحه بعد
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
