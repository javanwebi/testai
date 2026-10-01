import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../data/categories';
import { USER_PRODUCTS, USER_PRODUCTS_BY_CATEGORY } from '../data/userProducts';
import { 
  Layers, 
  Cpu, 
  Grid, 
  CircleDot, 
  Shield, 
  Link as LinkIcon, 
  Scissors, 
  ShieldCheck, 
  Package, 
  Search, 
  ChevronLeft, 
  Boxes, 
  ArrowLeft,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { toPersianDigits } from '../utils/formatters';

const ICON_MAP: Record<string, React.ReactNode> = {
  Cpu: <Cpu className="w-6 h-6" />,
  Layers: <Layers className="w-6 h-6" />,
  Grid: <Grid className="w-6 h-6" />,
  CircleDot: <CircleDot className="w-6 h-6" />,
  Shield: <Shield className="w-6 h-6" />,
  Link: <LinkIcon className="w-6 h-6" />,
  Scissors: <Scissors className="w-6 h-6" />,
  ShieldCheck: <ShieldCheck className="w-6 h-6" />,
  Package: <Package className="w-6 h-6" />,
};

export const AllCategoriesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = CATEGORIES.filter(cat => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      cat.name.toLowerCase().includes(q) ||
      cat.nameEn.toLowerCase().includes(q) ||
      cat.description.toLowerCase().includes(q) ||
      cat.subcategories.some(sub => sub.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 text-right" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
          <Link to="/" className="hover:text-orange-600 transition-colors">
            صفحه اصلی
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-800 font-bold">تمام دسته‌بندی‌های محصولات</span>
        </nav>

        {/* Page Header */}
        <div className="bg-gradient-to-l from-[#55565A] to-[#1E293B] text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>کاتالوگ جامع و دسته‌بندی تخصصی قطعات اطلس</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                تمام دسته‌بندی‌های قطعات و تجهیزات صنعتی
              </h1>
              <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
                دسته‌بندی جامع تمامی ۸۶۴ قطعه صنعتی خطوط تولید، انواع تسمه‌ها، کوپلینگ‌ها، غلتک‌های سرامیکی، پولی‌ها، یاتاقان‌ها و اتصالات تخصصی به همراه مشخصات فنی دقیق، کد پارت‌نامبر و تصاویر مستقیم قطعات.
              </p>
            </div>

            {/* Quick Stats Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-center">
                <span className="block text-2xl font-black text-orange-400 font-mono">
                  {toPersianDigits(CATEGORIES.length)}
                </span>
                <span className="text-xs text-slate-300 font-medium">دسته‌بندی تخصصی</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-center">
                <span className="block text-2xl font-black text-white font-mono">
                  {toPersianDigits(USER_PRODUCTS.length)}
                </span>
                <span className="text-xs text-slate-300 font-medium">قطعه تصویری ثبت‌شده</span>
              </div>
              <div className="col-span-2 sm:col-span-1 bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-center">
                <span className="block text-2xl font-black text-emerald-400 font-mono">
                  ۱۰۰٪
                </span>
                <span className="text-xs text-slate-300 font-medium">گارانتی اصالت کالا</span>
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div className="mt-8 relative max-w-2xl">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در نام دسته‌بندی، زیردسته‌ها، نوع قطعه، کاربرد..."
              className="w-full bg-white/95 text-slate-900 pr-12 pl-4 py-3.5 rounded-2xl shadow-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-sm placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-xs bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg hover:bg-slate-300"
              >
                پاک کردن
              </button>
            )}
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => {
            const productsInCat = USER_PRODUCTS_BY_CATEGORY.get(category.slug) || [];
            const count = productsInCat.length > 0 ? productsInCat.length : category.count;

            return (
              <div
                key={category.id}
                className="group relative flex flex-col bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(10,23,47,0.04)] hover:shadow-[0_15px_35px_rgba(234,88,12,0.12)] hover:border-orange-300 transition-all duration-300 overflow-hidden"
              >
                {/* Image & Header Banner */}
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Boxes className="w-16 h-16" />
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                  {/* Icon & Count Badges */}
                  <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                    <div className="w-10 h-10 rounded-2xl bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-orange-600 border border-white/50">
                      {ICON_MAP[category.icon] || <Boxes className="w-5 h-5" />}
                    </div>
                  </div>

                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-slate-900/80 backdrop-blur-md text-orange-400 border border-orange-400/30">
                      {toPersianDigits(count)} کالا
                    </span>
                  </div>

                  {/* Category Title overlayed at bottom of banner */}
                  <div className="absolute bottom-3 right-3 left-3 z-10 text-white">
                    <h2 className="text-lg font-black drop-shadow-sm group-hover:text-orange-400 transition-colors">
                      {category.name}
                    </h2>
                    <p className="text-[11px] text-slate-300 font-mono tracking-wider">
                      {category.nameEn}
                    </p>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex-1 flex flex-col p-5 space-y-4">
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
                    {category.description}
                  </p>

                  {/* Subcategories Chips */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 block">
                      زیردسته‌های این گروه:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {category.subcategories.slice(0, 4).map((sub, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/60 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                        >
                          {sub}
                        </span>
                      ))}
                      {category.subcategories.length > 4 && (
                        <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                          +{toPersianDigits(category.subcategories.length - 4)} مورد دیگر
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Link Button */}
                  <div className="pt-2 mt-auto border-t border-slate-100">
                    <Link
                      to={`/category/${category.slug}`}
                      className="w-full inline-flex items-center justify-center gap-2 bg-[#55565A] hover:bg-orange-600 text-white py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 shadow-sm hover:shadow-md group-hover:shadow-orange-500/20"
                    >
                      <span>مشاهده محصولات این دسته‌بندی</span>
                      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state if search returns nothing */}
        {filteredCategories.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto space-y-4">
            <Boxes className="w-16 h-16 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">دسته‌بندی مورد نظر یافت نشد</h3>
            <p className="text-sm text-slate-500">
              عبارت دیگری را جستجو کنید یا تمام دسته‌بندی‌ها را مشاهده نمایید.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition-colors"
            >
              نمایش همه دسته‌بندی‌ها
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default AllCategoriesPage;
