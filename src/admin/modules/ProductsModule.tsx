import React, { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  Layers,
  Sparkles,
  ShieldCheck,
  Tag,
  Package,
  ArrowUpDown,
  RefreshCw,
  FolderPlus,
  Check,
  AlertCircle,
  Image as ImageIcon,
  HelpCircle,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Product, Category, Brand, TechnicalSpec } from '../../types';
import { formatPrice, toPersianDigits } from '../../utils/formatters';

interface ProductsModuleProps {
  onQuickImportClick?: () => void;
}

export const ProductsModule: React.FC<ProductsModuleProps> = ({ onQuickImportClick }) => {
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'categories' | 'brands'>('products');
  
  // Products state
  const [products, setProducts] = useState<Product[]>(() => adminService.getProducts());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock' | 'inquiry'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Categories & Brands state
  const [categories, setCategories] = useState<Category[]>(() => adminService.getCategories());
  const [brands, setBrands] = useState<Brand[]>(() => adminService.getBrands());
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  // Form State for Product Add/Edit
  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    category: string;
    subcategory: string;
    brand: string;
    basePrice: number;
    retailPrice: number;
    wholesalePrice: number;
    agencyPrice: number;
    stock: number;
    isInquiryOnly: boolean;
    unit: string;
    description: string;
    tags: string;
    imageUrl: string;
    specs: { key: string; value: string }[];
  }>({
    code: '',
    name: '',
    category: 'industrial-belts',
    subcategory: 'تسمه V-Belt ساده و دنده‌ای',
    brand: 'SWR',
    basePrice: 1000000,
    retailPrice: 1350000,
    wholesalePrice: 1180000,
    agencyPrice: 1080000,
    stock: 25,
    isInquiryOnly: false,
    unit: 'حلقه',
    description: '',
    tags: 'صنعتی, پرفروش, ضدسایش',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80',
    specs: [
      { key: 'مقاومت حرارتی', value: 'منفی ۲۰ تا مثبت ۱۱۰ درجه سانتی‌گراد' },
      { key: 'پروفیل و گام', value: 'دنده‌ای صنعتی DIN 7753' },
      { key: 'نخ کششی', value: 'پلی‌استر تقویت‌شده با الیاف آرامید' },
    ],
  });

  const refreshProducts = () => {
    setProducts(adminService.getProducts());
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesBrand = selectedBrand === 'all' || p.brand.toLowerCase().includes(selectedBrand.toLowerCase());
    
    let matchesStock = true;
    if (stockFilter === 'in_stock') matchesStock = p.stock > 0;
    if (stockFilter === 'out_of_stock') matchesStock = p.stock === 0;
    if (stockFilter === 'inquiry') matchesStock = !!p.isInquiryOnly;

    return matchesSearch && matchesCat && matchesBrand && matchesStock;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    const randomCode = 'AT-' + Math.floor(100 + Math.random() * 900);
    setFormData({
      code: randomCode,
      name: '',
      category: 'industrial-belts',
      subcategory: 'تسمه V-Belt ساده و دنده‌ای',
      brand: 'SWR',
      basePrice: 1200000,
      retailPrice: 1620000,
      wholesalePrice: 1416000,
      agencyPrice: 1296000,
      stock: 50,
      isInquiryOnly: false,
      unit: 'حلقه',
      description: 'تسمه صنعتی با مقاومت کششی بسیار بالا و استاندارد DIN آلمان، مناسب برای مصارف صنعتی و کارخانجات.',
      tags: 'پرفروش, صنعتی, آلمان',
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80',
      specs: [
        { key: 'مقاومت حرارتی', value: '-۲۰ تا ۱۱۰ درجه' },
        { key: 'استاندارد ساخت', value: 'DIN 7753 / ISO 4184' },
      ],
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    const specEntries = Array.isArray(product.technicalSpecs)
      ? product.technicalSpecs
      : Object.entries(product.technicalSpecs || {}).map(([key, value]) => ({
          key,
          value: String(value),
        }));
    setFormData({
      code: product.code,
      name: product.name,
      category: product.categorySlug || product.categoryName || '',
      subcategory: product.subcategory || '',
      brand: product.brand,
      basePrice: product.prices.base || product.prices.retail,
      retailPrice: product.prices.retail,
      wholesalePrice: product.prices.wholesale,
      agencyPrice: (product.prices as any).dealer || (product.prices as any).agency || 0,
      stock: product.stock,
      isInquiryOnly: !!product.inquiryOnly,
      unit: product.unit || 'عدد',
      description: product.description || '',
      tags: (product.tags || []).join(', '),
      imageUrl: (product.images && product.images[0]) || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80',
      specs: specEntries.length > 0 ? specEntries : [{ key: 'جنس روکش', value: 'پلی‌یورتان ضدسایش' }],
    });
    setIsProductModalOpen(true);
  };

  const handleRecalculatePrices = (base: number) => {
    setFormData(prev => ({
      ...prev,
      basePrice: base,
      retailPrice: Math.round(base * 1.35),
      wholesalePrice: Math.round(base * 1.18),
      agencyPrice: Math.round(base * 1.08),
    }));
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const specsArray: TechnicalSpec[] = formData.specs
      .filter(s => s.key.trim())
      .map(s => ({ key: s.key.trim(), value: s.value.trim() }));

    const tagsArray = formData.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const productPayload: Product = {
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      categorySlug: formData.category || 'industrial-belts',
      categoryName: categories.find(c => c.slug === formData.category)?.name || 'تسمه‌های صنعتی',
      subcategory: formData.subcategory,
      brand: formData.brand,
      prices: {
        base: Number(formData.basePrice),
        retail: Number(formData.retailPrice),
        wholesale: Number(formData.wholesalePrice),
        dealer: Number(formData.agencyPrice),
      },
      stock: Number(formData.stock),
      inquiryOnly: formData.isInquiryOnly,
      unit: formData.unit,
      description: formData.description,
      tags: tagsArray,
      images: [formData.imageUrl],
      technicalSpecs: specsArray,
    };

    adminService.saveProduct(productPayload);
    refreshProducts();
    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = (code: string) => {
    if (window.confirm(`آیا از حذف کالا با کد ${code} اطمینان دارید؟`)) {
      adminService.deleteProduct(code);
      refreshProducts();
    }
  };

  const handleToggleActive = (product: Product) => {
    const updated = {
      ...product,
      stock: product.stock > 0 ? 0 : 20,
    };
    adminService.saveProduct(updated);
    refreshProducts();
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Top Header & Subtabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-[#55565A] flex items-center gap-2">
            <Package className="w-5 h-5 text-[#E06518]" />
            <span>مدیریت محصولات و کاتالوگ صنعتی</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            کنترل کالاها، قیمت‌گذاری ۴ لایه، موجودی انبار، دسته‌بندی‌ها و برندهای انحصاری
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onQuickImportClick && (
            <button
              onClick={onQuickImportClick}
              className="py-2.5 px-4 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#C95210] font-bold text-xs border border-orange-200 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#E06518]" />
              <span>ایمپورت اکسل کالاها</span>
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="py-2.5 px-4 rounded-xl bg-[#55565A] hover:bg-[#1B293E] text-white font-black text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#E06518]" />
            <span>تعریف کالای جدید</span>
          </button>
        </div>
      </div>

      {/* Sub navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('products')}
          className={`py-2 px-4 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'products'
              ? 'bg-[#55565A] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>کاتالوگ کالاها ({toPersianDigits(products.length)})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('categories')}
          className={`py-2 px-4 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'categories'
              ? 'bg-[#55565A] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>دسته‌بندی‌ها ({toPersianDigits(categories.length)})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('brands')}
          className={`py-2 px-4 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'brands'
              ? 'bg-[#55565A] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>برندهای تجاری ({toPersianDigits(brands.length)})</span>
        </button>
      </div>

      {/* --- TAB 1: PRODUCTS TABLE --- */}
      {activeSubTab === 'products' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative md:col-span-1">
              <input
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="جستجو با نام کالا، کد یا برند..."
                className="w-full h-10 pr-9 pl-3 rounded-xl border border-slate-200 text-xs text-[#55565A] focus:outline-none focus:border-[#E06518]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={e => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-[#55565A] bg-white focus:outline-none focus:border-[#E06518]"
              >
                <option value="all">همه دسته‌بندی‌ها</option>
                {categories.map(c => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div>
              <select
                value={selectedBrand}
                onChange={e => {
                  setSelectedBrand(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-[#55565A] bg-white focus:outline-none focus:border-[#E06518]"
              >
                <option value="all">همه برندها</option>
                {brands.map(b => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Filter */}
            <div>
              <select
                value={stockFilter}
                onChange={e => {
                  setStockFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-[#55565A] bg-white focus:outline-none focus:border-[#E06518]"
              >
                <option value="all">همه وضعیت‌های موجودی</option>
                <option value="in_stock">موجود در انبار</option>
                <option value="out_of_stock">اتمام موجودی (ناموجود)</option>
                <option value="inquiry">فقط استعلام قیمت</option>
              </select>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[#55565A] font-bold">
                    <th className="py-3 px-4">کد کالا</th>
                    <th className="py-3 px-4">مشخصات و تصویر</th>
                    <th className="py-3 px-4">دسته / برند</th>
                    <th className="py-3 px-4">قیمت مصرف‌کننده</th>
                    <th className="py-3 px-4">قیمت پخش / همکار</th>
                    <th className="py-3 px-4">قیمت عاملیت</th>
                    <th className="py-3 px-4">موجودی</th>
                    <th className="py-3 px-4">وضعیت</th>
                    <th className="py-3 px-4 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        هیچ کالایی با فیلترهای انتخابی یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.map(p => (
                      <tr key={p.code} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#55565A]">
                          {p.code}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200&q=80'}
                              alt={p.name}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-[#55565A] line-clamp-1">{p.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">واحد: {p.unit || 'عدد'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-700">{p.brand}</div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">{p.subcategory || p.category}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#C95210]">
                          {p.isInquiryOnly ? (
                            <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[11px]">استعلامی</span>
                          ) : (
                            `${formatPrice(p.prices.retail)} ت`
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#55565A]">
                          {p.isInquiryOnly ? '-' : `${formatPrice(p.prices.wholesale)} ت`}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                          {p.isInquiryOnly ? '-' : `${formatPrice(p.prices.agency || p.prices.dealer || 0)} ت`}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <span
                            className={`font-bold ${
                              p.stock > 10 ? 'text-emerald-600' : p.stock > 0 ? 'text-amber-600' : 'text-red-500'
                            }`}
                          >
                            {toPersianDigits(p.stock)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {p.isInquiryOnly ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              فقط استعلام
                            </span>
                          ) : p.stock > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              فعال در انبار
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                              ناموجود
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              title="ویرایش کالا"
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleActive(p)}
                              title={p.stock > 0 ? 'غیرفعال‌سازی (اتمام موجودی)' : 'فعال‌سازی موجودی'}
                              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.code)}
                              title="حذف کالا"
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div>
                نمایش {toPersianDigits((currentPage - 1) * itemsPerPage + 1)} تا{' '}
                {toPersianDigits(Math.min(currentPage * itemsPerPage, filteredProducts.length))} از مجموع{' '}
                {toPersianDigits(filteredProducts.length)} کالا
              </div>

              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer font-bold"
                >
                  صفحه قبل
                </button>
                <span className="px-3 py-1.5 font-bold font-mono text-[#55565A]">
                  {toPersianDigits(currentPage)} / {toPersianDigits(totalPages)}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer font-bold"
                >
                  صفحه بعد
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: CATEGORIES CRUD --- */}
      {activeSubTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#55565A]">فهرست دسته‌بندی‌های صنعتی</h3>
            <button
              onClick={() => {
                setEditingCategory(null);
                setIsCategoryModalOpen(true);
              }}
              className="py-2 px-3 bg-[#55565A] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#E06518]" />
              <span>افزودن دسته‌بندی جدید</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <div key={cat.slug} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#C95210] flex items-center justify-center font-bold">
                      <Layers className="w-5 h-5 text-[#E06518]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#55565A]">{cat.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">{cat.nameEn || cat.slug}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                    {toPersianDigits(cat.count || 0)} کالا
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{cat.description}</p>

                {cat.subcategories && cat.subcategories.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <div className="text-[10px] font-bold text-slate-400">زیرگروه‌ها:</div>
                    <div className="flex flex-wrap gap-1">
                      {cat.subcategories.map((sub, i) => (
                        <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setEditingCategory(cat);
                      setIsCategoryModalOpen(true);
                    }}
                    className="text-xs text-blue-600 hover:underline font-bold"
                  >
                    ویرایش
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('آیا از حذف این دسته‌بندی اطمینان دارید؟')) {
                        adminService.deleteCategory(cat.slug);
                        setCategories(adminService.getCategories());
                      }
                    }}
                    className="text-xs text-red-500 hover:underline font-bold"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 3: BRANDS CRUD --- */}
      {activeSubTab === 'brands' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#55565A]">برندهای همکار و انحصاری</h3>
            <button
              onClick={() => {
                setEditingBrand(null);
                setIsBrandModalOpen(true);
              }}
              className="py-2 px-3 bg-[#55565A] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#E06518]" />
              <span>افزودن برند تجاری</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map(brand => (
              <div key={brand.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-mono font-black flex items-center justify-center text-xs">
                      {brand.logo || brand.name.slice(0, 3)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#55565A]">{brand.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">{brand.country}</span>
                    </div>
                  </div>
                  {brand.isExclusive && (
                    <span className="text-[10px] font-bold text-[#C95210] bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                      نمایندگی انحصاری
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{brand.description}</p>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setEditingBrand(brand);
                      setIsBrandModalOpen(true);
                    }}
                    className="text-xs text-blue-600 hover:underline font-bold"
                  >
                    ویرایش
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('آیا از حذف برند اطمینان دارید؟')) {
                        adminService.deleteBrand(brand.id);
                        setBrands(adminService.getBrands());
                      }
                    }}
                    className="text-xs text-red-500 hover:underline font-bold"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- ADD/EDIT PRODUCT MODAL (COMPREHENSIVE) --- */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="bg-[#55565A] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm">
                  {editingProduct ? `ویرایش کالا: ${editingProduct.name}` : 'تعریف کالای جدید صنعتی'}
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  ثبت قیمت‌گذاری ۴ لایه، مشخصات فنی داینامیک و مدیریت انبار
                </p>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Row 1: Code, Name, Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#55565A] block">کد یکتای کالا (SKU) *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    placeholder="مثلاً AT-751 یا SWR-230"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:border-[#E06518] outline-none"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-[#55565A] block">نام کامل کالا *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثلاً تسمه کوره کاشی و سرامیک ضدسایش SWR"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold focus:border-[#E06518] outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Category, Subcategory, Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#55565A] block">دسته‌بندی اصلی</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-white focus:border-[#E06518] outline-none"
                  >
                    {categories.map(c => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#55565A] block">زیرگروه تخصصی</label>
                  <input
                    type="text"
                    value={formData.subcategory}
                    onChange={e => setFormData({ ...formData, subcategory: e.target.value })}
                    placeholder="مثلاً تسمه V-Belt دنده‌ای"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:border-[#E06518] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#55565A] block">برند</label>
                  <select
                    value={formData.brand}
                    onChange={e => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-white focus:border-[#E06518] outline-none"
                  >
                    {brands.map(b => (
                      <option key={b.id} value={b.name}>
                        {b.name} ({b.country})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: 4-Layer Pricing System */}
              <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs text-[#55565A]">سیستم قیمت‌گذاری ۴ لایه صنعتی (تومان)</span>
                    <span className="text-[10px] text-[#C95210] bg-orange-100 px-2 py-0.5 rounded-full font-bold">
                      محاسبه‌گر خودکار حاشیه سود
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRecalculatePrices(formData.basePrice)}
                    className="text-[11px] text-[#C95210] hover:underline font-bold cursor-pointer"
                  >
                    تطبیق ضرایب استاندارد (۳۵٪ / ۱۸٪ / ۸٪)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">۱. قیمت پایه خرید (تومان)</label>
                    <input
                      type="number"
                      value={formData.basePrice}
                      onChange={e => handleRecalculatePrices(Number(e.target.value))}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#C95210] block mb-1">۲. قیمت مصرف‌کننده (+۳۵٪)</label>
                    <input
                      type="number"
                      value={formData.retailPrice}
                      onChange={e => setFormData({ ...formData, retailPrice: Number(e.target.value) })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-mono font-bold text-[#C95210] outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#55565A] block mb-1">۳. قیمت پخش / کارخانجات (+۱۸٪)</label>
                    <input
                      type="number"
                      value={formData.wholesalePrice}
                      onChange={e => setFormData({ ...formData, wholesalePrice: Number(e.target.value) })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-mono font-bold text-[#55565A] outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-emerald-700 block mb-1">۴. قیمت نمایندگی رسمی (+۸٪)</label>
                    <input
                      type="number"
                      value={formData.agencyPrice}
                      onChange={e => setFormData({ ...formData, agencyPrice: Number(e.target.value) })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-mono font-bold text-emerald-700 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Stock, Inquiry Switch, Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#55565A] block">موجودی انبار</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:border-[#E06518] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#55565A] block">واحد سنجش</label>
                  <select
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-white focus:border-[#E06518] outline-none"
                  >
                    <option value="عدد">عدد</option>
                    <option value="حلقه">حلقه</option>
                    <option value="متر">متر</option>
                    <option value="شاخه">شاخه</option>
                    <option value="رول">رول</option>
                    <option value="ست">ست</option>
                  </select>
                </div>

                <div className="pt-5">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      checked={formData.isInquiryOnly}
                      onChange={e => setFormData({ ...formData, isInquiryOnly: e.target.checked })}
                      className="w-4 h-4 text-[#E06518] rounded accent-[#E06518]"
                    />
                    <span className="text-xs font-bold text-[#55565A]">فقط قیمت استعلامی (عدم نمایش قیمت)</span>
                  </label>
                </div>
              </div>

              {/* Row 5: Dynamic Technical Specs */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#55565A]">ویژگی‌های فنی و استانداردهای مهندسی</label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        specs: [...formData.specs, { key: '', value: '' }],
                      })
                    }
                    className="text-xs text-[#C95210] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن سطر مشخصه</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.specs.map((spec, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="عنوان مشخصه (مثلاً تحمل حرارتی)"
                        value={spec.key}
                        onChange={e => {
                          const updated = [...formData.specs];
                          updated[index].key = e.target.value;
                          setFormData({ ...formData, specs: updated });
                        }}
                        className="w-1/3 h-9 px-3 rounded-xl border border-slate-200 text-xs font-bold outline-none"
                      />
                      <input
                        type="text"
                        placeholder="مقدار مشخصه (مثلاً تا ۱۲۰ درجه)"
                        value={spec.value}
                        onChange={e => {
                          const updated = [...formData.specs];
                          updated[index].value = e.target.value;
                          setFormData({ ...formData, specs: updated });
                        }}
                        className="flex-1 h-9 px-3 rounded-xl border border-slate-200 text-xs outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = formData.specs.filter((_, i) => i !== index);
                          setFormData({ ...formData, specs: updated });
                        }}
                        className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 6: Image URL and Gallery */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <label className="text-xs font-bold text-[#55565A] block">آدرس تصویر یا آپلود گالری صنعتی</label>
                <div className="flex items-center gap-3">
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono outline-none"
                  />
                </div>
              </div>

              {/* Row 7: Tags & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#55565A] block">برچسب‌ها (با کاما جدا کنید)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={e => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="پرفروش, نسوز, کوره کاشی"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#55565A] block">توضیحات و کاربرد صنعتی</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#55565A] hover:bg-[#1B293E] text-white text-xs font-black shadow-xs cursor-pointer"
                >
                  ذخیره و ثبت کالا
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD/EDIT CATEGORY MODAL --- */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <h3 className="font-black text-sm text-[#55565A]">
              {editingCategory ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی جدید'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">نام فارسی دسته</label>
                <input
                  type="text"
                  defaultValue={editingCategory?.name || ''}
                  id="cat-name"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">نام انگلیسی / اسلاگ URL</label>
                <input
                  type="text"
                  defaultValue={editingCategory?.slug || ''}
                  id="cat-slug"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 font-mono outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">توضیحات</label>
                <textarea
                  defaultValue={editingCategory?.description || ''}
                  id="cat-desc"
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => {
                  const nameInput = (document.getElementById('cat-name') as HTMLInputElement)?.value;
                  const slugInput = (document.getElementById('cat-slug') as HTMLInputElement)?.value;
                  const descInput = (document.getElementById('cat-desc') as HTMLTextAreaElement)?.value;
                  if (!nameInput) return;
                  const catPayload: Category = {
                    id: editingCategory?.id || Date.now(),
                    name: nameInput,
                    nameEn: editingCategory?.nameEn || slugInput || 'Category',
                    slug: slugInput || nameInput.toLowerCase().replace(/\s+/g, '-'),
                    description: descInput || '',
                    subcategories: editingCategory?.subcategories || ['تسمه‌های صنعتی ویژه', 'قطعات خطوط تولید'],
                    icon: editingCategory?.icon || 'Layers',
                    count: editingCategory?.count || 120,
                  };
                  adminService.saveCategory(catPayload);
                  setCategories(adminService.getCategories());
                  setIsCategoryModalOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-[#55565A] text-white text-xs font-black cursor-pointer"
              >
                ذخیره دسته‌بندی
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD/EDIT BRAND MODAL --- */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <h3 className="font-black text-sm text-[#55565A]">
              {editingBrand ? 'ویرایش برند تجاری' : 'افزودن برند تجاری'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">نام برند (فارسی / لاتین)</label>
                <input
                  type="text"
                  defaultValue={editingBrand?.name || ''}
                  id="br-name"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">کشور مبدأ</label>
                <input
                  type="text"
                  defaultValue={editingBrand?.country || 'آلمان'}
                  id="br-country"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    defaultChecked={editingBrand?.isExclusive || false}
                    id="br-exclusive"
                    className="w-4 h-4 text-[#E06518] rounded"
                  />
                  <span className="font-bold text-[#C95210]">نمایندگی انحصاری بازرگانی اطلس در ایران</span>
                </label>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">توضیحات برند</label>
                <textarea
                  defaultValue={editingBrand?.description || ''}
                  id="br-desc"
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBrandModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => {
                  const nameInput = (document.getElementById('br-name') as HTMLInputElement)?.value;
                  const countryInput = (document.getElementById('br-country') as HTMLInputElement)?.value;
                  const exclusiveInput = (document.getElementById('br-exclusive') as HTMLInputElement)?.checked;
                  const descInput = (document.getElementById('br-desc') as HTMLTextAreaElement)?.value;
                  if (!nameInput) return;
                  const brandPayload: Brand = {
                    id: editingBrand?.id || nameInput.toLowerCase().replace(/\s+/g, '-'),
                    name: nameInput,
                    nameEn: editingBrand?.nameEn || nameInput,
                    country: countryInput || 'آلمان',
                    isExclusive: exclusiveInput || false,
                    description: descInput || '',
                    logo: nameInput.slice(0, 4).toUpperCase(),
                  };
                  adminService.saveBrand(brandPayload);
                  setBrands(adminService.getBrands());
                  setIsBrandModalOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-[#55565A] text-white text-xs font-black cursor-pointer"
              >
                ذخیره برند
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
