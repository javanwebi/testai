import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FileText,
  CreditCard,
  MessageSquare,
  FileDown,
  TrendingUp,
  PackageSearch,
  ShieldCheck,
  Bell,
  CheckCircle2,
  Lock,
  Sparkles,
  Printer,
  UploadCloud,
  ChevronLeft,
  Plus,
  Send,
  Search,
  Download,
  Clock,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { agencyService } from '../services/agencyService';
import { generateMockProducts } from '../data/mockGenerator';
import { MOCK_ORDERS } from '../data/mockData';
import {
  FinancialTransaction,
  DepositReceipt,
  SupplyRequest,
  DealerCatalogItem,
  InternalMessage,
  Order,
  Product,
} from '../types';
import { toPersianDigits, formatPrice } from '../utils/formatters';
import { OfficialInvoiceModal } from '../components/dealer/OfficialInvoiceModal';
import { DepositReceiptModal } from '../components/dealer/DepositReceiptModal';
import { SupplyRequestModal } from '../components/dealer/SupplyRequestModal';

type DealerTab =
  | 'dashboard'
  | 'store'
  | 'inventory'
  | 'orders'
  | 'financials'
  | 'messages'
  | 'catalogs'
  | 'performance'
  | 'supply_request';

export const DealerPortalPage: React.FC = () => {
  const { currentUser, activateDealerRole, isDealer } = useAuth();
  const { addToCart } = useCart();

  const [activeTab, setActiveTab] = useState<DealerTab>('dashboard');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showSupplyModal, setShowSupplyModal] = useState(false);

  // Products from mock generator
  const [products] = useState<Product[]>(() => generateMockProducts().slice(0, 18));

  // Dealer Data from Service
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [depositReceipts, setDepositReceipts] = useState<DepositReceipt[]>([]);
  const [supplyRequests, setSupplyRequests] = useState<SupplyRequest[]>([]);
  const [catalogs, setCatalogs] = useState<DealerCatalogItem[]>([]);
  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'in_stock' | 'limited' | 'out_of_stock'>('all');

  // Order quantities state for dealer store bulk ordering
  const [orderQuantities, setOrderQuantities] = useState<Record<string, number>>({});
  const [addedToast, setAddedToast] = useState<string | null>(null);

  // Scroll to top on tab change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activeTab]);

  // Load service data
  const loadServiceData = () => {
    setTransactions(agencyService.getFinancialTransactions());
    setDepositReceipts(agencyService.getDepositReceipts());
    setSupplyRequests(agencyService.getSupplyRequests());
    setCatalogs(agencyService.getCatalogs());
    setMessages(agencyService.getDealerMessages());
  };

  useEffect(() => {
    loadServiceData();
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    agencyService.sendDealerMessage(newMessageText.trim(), currentUser?.fullName || 'نمایندگی رسمی اطلس');
    setNewMessageText('');
    setMessages(agencyService.getDealerMessages());
  };

  // Add bulk quantity to cart with dealer pricing
  const handleAddDealerProductToCart = (product: Product, quantity: number) => {
    const qty = quantity || 1;
    addToCart(product, qty);
    setAddedToast(`تعداد ${toPersianDigits(qty)} عدد از «${product.name}» با قیمت پخش به سبد خرید افزوده شد.`);
    setTimeout(() => setAddedToast(null), 4000);
  };

  // IF NOT DEALER: Show informative lock screen with quick link and dev bypass
  if (!isDealer) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-right space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 text-[#C95210] mx-auto flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-xl sm:text-2xl font-black text-[#55565A]">
              این بخش پس از تأیید نمایندگی فعال می‌شود
            </h2>
            <p className="text-xs sm:text-sm text-[#777A7D] leading-relaxed">
              پرتال پخش اختصاصی، دسترسی به قیمت‌های همکار، اعتبار خرید، دانلود کاتالوگ‌های ویژه و فاکتورهای رسمی مختص واحدهای صنفی و نمایندگان رسمی بازرگانی اطلس است.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/agency"
              className="w-full sm:w-auto px-6 py-3 bg-[#55565A] hover:bg-[#1B293E] text-white font-black text-xs sm:text-sm rounded-xl transition-colors shadow-xs"
            >
              تکمیل فرم درخواست عاملیت و نمایندگی
            </Link>

            <Link
              to="/agency?tab=tracking"
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-[#55565A] font-bold text-xs sm:text-sm rounded-xl transition-colors"
            >
              پیگیری درخواست قبلی با کد رهگیری
            </Link>
          </div>

          {/* DEV SHORTCUT BUTTON */}
          <div className="pt-6 border-t border-slate-100 max-w-md mx-auto">
            <div className="p-4 rounded-2xl bg-orange-50/80 border border-[#E06518]/30 text-right space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-[#C95210]">
                <Sparkles className="w-4 h-4" />
                <span>دسترسی مستقیم توسعه و بررسی (Dev Mode)</span>
              </div>
              <p className="text-[11px] text-[#777A7D] leading-relaxed">
                جهت تست کارشناسی تمام ۹ بخش پرتال بدون انتظار برای تایید مدارک، روی دکمه زیر کلیک کنید:
              </p>
              <button
                type="button"
                onClick={() => activateDealerRole()}
                className="w-full py-2.5 bg-[#E06518] hover:bg-[#C95210] text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>⚡ فعال‌سازی فوری نقش نماینده و ورود به پنل</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate dealer credit summary
  const totalCreditLimit = 250000000; // 250 million Toman limit
  const usedCredit = 142500000;
  const remainingCredit = totalCreditLimit - usedCredit;
  const usedPercentage = Math.round((usedCredit / totalCreditLimit) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-right">
      {/* Toast Notification */}
      {addedToast && (
        <div className="fixed bottom-6 left-6 z-50 p-4 rounded-2xl bg-[#55565A] text-white text-xs font-bold shadow-xl border border-orange-500/40 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{addedToast}</span>
        </div>
      )}

      {/* TOP DEALER BAR */}
      <div className="bg-[#55565A] text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full bg-[#E06518] text-white text-[10px] font-black uppercase">
              عاملیت رسمی درجه ۱
            </span>
            <span className="text-xs text-slate-300">
              کد عاملیت: <strong className="font-mono text-white font-bold">DLR-74812</strong>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black">
            پرتال اختصاصی شبکه پخش و نمایندگی بازرگانی اطلس
          </h1>

          <p className="text-xs text-slate-300">
            نماینده محترم: <strong className="text-white font-bold">{currentUser?.fullName || 'مهندس زارع'}</strong> | انبار تحویل: استان یزد، شهرک صنعتی میبد
          </p>
        </div>

        {/* Credit Quick Overview */}
        <div className="bg-white/10 border border-white/15 rounded-2xl p-4 w-full lg:w-96 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-medium">سقف اعتبار خرید باز:</span>
            <span className="font-mono font-black text-orange-400">
              {formatPrice(totalCreditLimit)} تومان
            </span>
          </div>

          <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#E06518] h-full rounded-full transition-all"
              style={{ width: `${usedPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-300">
            <span>استفاده شده: {formatPrice(usedCredit)}</span>
            <span className="text-emerald-400 font-bold">
              مانده فعال: {formatPrice(remainingCredit)}
            </span>
          </div>
        </div>
      </div>

      {/* MANAGEMENT NOTICE BANNER */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <strong className="font-black text-sm">اعلان فوری مدیریت بازرگانی (سهمیه فصلی تسمه تایم):</strong>
            <p className="text-[11px] text-amber-800 mt-0.5">
              محموله جدید تسمه‌های دنده‌ای صنعتی SWR آلمان تخلیه شد. نمایندگان محترم تا پایان هفته می‌توانند با ۵٪ تخفیف اضافه نقدی، سهمیه فصلی خود را رزرو کنند.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('store')}
          className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl shrink-0 transition-colors cursor-pointer"
        >
          مشاهده سهمیه انبار
        </button>
      </div>

      {/* 9 NAVIGATION TABS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {[
            { id: 'dashboard', label: 'داشبورد اصلی', icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: 'store', label: 'فروشگاه قیمت پخش', icon: <ShoppingBag className="w-4 h-4" /> },
            { id: 'inventory', label: 'موجودی لحظه‌ای انبار', icon: <Package className="w-4 h-4" /> },
            { id: 'orders', label: 'سفارش‌ها و فاکتور رسمی', icon: <FileText className="w-4 h-4" /> },
            { id: 'financials', label: 'گردش حساب و تسویه', icon: <CreditCard className="w-4 h-4" /> },
            { id: 'messages', label: 'پیام‌رسانی با مدیریت', icon: <MessageSquare className="w-4 h-4" /> },
            { id: 'catalogs', label: 'کاتالوگ و لیست قیمت', icon: <FileDown className="w-4 h-4" /> },
            { id: 'performance', label: 'عملکرد و نمودار تارگت', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'supply_request', label: 'درخواست تأمین سفارشی', icon: <PackageSearch className="w-4 h-4" /> },
          ].map(tab => {
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as DealerTab)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[#55565A] text-white shadow-xs'
                    : 'text-[#777A7D] hover:bg-slate-100 hover:text-[#55565A]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. TAB: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-[#777A7D] text-xs">
                <span>سفارش‌های جاری در حال حمل</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-[#55565A]">
                {toPersianDigits(2)} <span className="text-xs text-slate-500">بارنامه فعال</span>
              </div>
              <div className="text-[11px] text-emerald-600 font-bold">
                تحویل فردا از انبار مرکزی یزد
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-[#777A7D] text-xs">
                <span>اعتبار مصرف‌شده نمایندگی</span>
                <DollarSign className="w-4 h-4 text-[#E06518]" />
              </div>
              <div className="text-2xl font-black text-[#55565A]">
                {formatPrice(usedCredit)} <span className="text-xs text-slate-500">تومان</span>
              </div>
              <div className="text-[11px] text-slate-500">
                مهلت تسویه حساب باز: تا ۲۵ روز دیگر
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-[#777A7D] text-xs">
                <span>فروش این فصل نسبت به تارگت</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-600">
                ٪{toPersianDigits(84)}
              </div>
              <div className="text-[11px] text-slate-500">
                هدف فصلی: ۱ میلیارد تومان
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-[#777A7D] text-xs">
                <span>پیام‌های خوانده‌نشده از دفتر مرکزی</span>
                <MessageSquare className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-blue-600">
                {toPersianDigits(1)} <span className="text-xs text-slate-500">پیام جدید</span>
              </div>
              <div className="text-[11px] text-slate-500">
                پاسخ کارشناس تخصصی کوره
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-sm text-[#55565A]">
                  آخرین حواله‌ها و سفارش‌های نمایندگی
                </h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs text-[#E06518] font-bold hover:underline cursor-pointer"
                >
                  مشاهده همه
                </button>
              </div>

              <div className="space-y-3">
                {MOCK_ORDERS.slice(0, 3).map(order => (
                  <div
                    key={order.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-[#55565A] font-bold font-mono">
                          {order.orderNumber}
                        </strong>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {order.status === 'processing' ? 'در حال ارسال باربری' : 'تحویل انبار میبد'}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        تاریخ ثبت: {toPersianDigits(order.createdAt)} | اقلام: {toPersianDigits(order.items.length)} ردیف
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-sm text-[#55565A]">
                        {formatPrice(order.totalAmount)} تومان
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedInvoiceOrder(order)}
                        className="px-3 py-1.5 bg-[#55565A] hover:bg-[#1B293E] text-white font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#E06518]" />
                        <span>فاکتور رسمی</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="font-black text-sm text-[#55565A] border-b border-slate-100 pb-3">
                دسترسی سریع عملیات نماینده
              </h3>

              <div className="space-y-2.5 text-xs">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(true)}
                  className="w-full p-3 rounded-xl bg-orange-50/80 hover:bg-orange-100/80 text-[#C95210] font-bold border border-orange-200 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span>ثبت فیش واریزی و تسویه حساب</span>
                  </div>
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowSupplyModal(true)}
                  className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#55565A] font-bold border border-slate-200 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <PackageSearch className="w-4 h-4 text-[#E06518]" />
                    <span>درخواست تأمین سایز ناموجود</span>
                  </div>
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('catalogs')}
                  className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#55565A] font-bold border border-slate-200 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FileDown className="w-4 h-4 text-[#E06518]" />
                    <span>دانلود لیست قیمت و کاتالوگ فنی</span>
                  </div>
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('messages')}
                  className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#55565A] font-bold border border-slate-200 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#E06518]" />
                    <span>گفتگو با واحد پشتیبانی بازرگانی</span>
                  </div>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. TAB: STORE */}
      {activeTab === 'store' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-sm text-[#55565A]">
                کاتالوگ سفارش عمده با لایه قیمت نمایندگی
              </h3>
              <p className="text-xs text-[#777A7D] mt-0.5">
                کلیه قیمت‌ها ۱۵٪ تا ۲۵٪ زیر قیمت مصرف‌کننده محاسبه شده است + تخفیف پلکانی در سفارشات کارتنی (۱۰ و ۵۰ عدد به بالا).
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>لایه قیمت نماینده فعال است</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map(product => {
              const retailPrice = product.prices.retail;
              const wholesalePrice = product.prices.dealer || Math.round(retailPrice * 0.82);
              const margin = retailPrice - wholesalePrice;
              const marginPercent = Math.round((margin / retailPrice) * 100);
              const qty = orderQuantities[product.code] || 5;

              const isBulkTier = qty >= 20;
              const activeUnitPrice = isBulkTier
                ? Math.round(wholesalePrice * 0.95)
                : wholesalePrice;
              const totalLinePrice = activeUnitPrice * qty;

              return (
                <div
                  key={product.code}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-orange-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-video flex items-center justify-center">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="object-contain w-full h-full p-2"
                      />
                      <span className="absolute top-2 right-2 bg-[#55565A] text-white text-[10px] font-bold px-2 py-0.5 rounded-md font-mono">
                        کد: {product.code}
                      </span>
                      <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                        سود شما: ٪{toPersianDigits(isBulkTier ? marginPercent + 5 : marginPercent)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] text-[#E06518] font-bold">{product.brand}</div>
                      <h4 className="font-black text-sm text-[#55565A] line-clamp-1">
                        {product.name}
                      </h4>
                      <div className="text-[11px] text-[#777A7D] line-clamp-2">
                        {product.description || product.categoryName}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span>قیمت مصرف‌کننده:</span>
                        <span className="line-through font-mono">
                          {formatPrice(retailPrice)} تومان
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[#55565A] font-bold">
                        <span className="text-[#C95210]">قیمت پخش نماینده:</span>
                        <span className="text-base font-black font-mono text-[#55565A]">
                          {formatPrice(activeUnitPrice)} تومان
                        </span>
                      </div>

                      <div className="text-[10px] text-emerald-700 font-medium">
                        {isBulkTier ? (
                          <span>⚡ تخفیف پلکانی تیراژ بالا (بیش از ۲۰ عدد) اعمال گردید!</span>
                        ) : (
                          <span>خرید ۲۰ عدد به بالا: ۵٪ تخفیف اضافه پلکانی</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setOrderQuantities(prev => ({
                              ...prev,
                              [product.code]: Math.max(1, (prev[product.code] || 5) - 1),
                            }))
                          }
                          className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-sm text-slate-700 flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={qty}
                          onChange={e =>
                            setOrderQuantities(prev => ({
                              ...prev,
                              [product.code]: Math.max(1, Number(e.target.value) || 1),
                            }))
                          }
                          className="w-14 h-8 text-center font-mono font-bold text-xs border border-slate-200 rounded-lg text-[#55565A]"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setOrderQuantities(prev => ({
                              ...prev,
                              [product.code]: (prev[product.code] || 5) + 1,
                            }))
                          }
                          className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-sm text-slate-700 flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-left font-mono font-black text-xs text-[#55565A]">
                        جمع: {formatPrice(totalLinePrice)} تومان
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddDealerProductToCart(product, qty)}
                      className="w-full py-2.5 bg-[#E06518] hover:bg-[#C95210] text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>افزودن به سبد سفارش پخش ({toPersianDigits(qty)} عدد)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. TAB: INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-sm text-[#55565A]">
                استعلام وضعیت موجودی لحظه‌ای انبار مرکزی یزد
              </h3>
              <p className="text-xs text-[#777A7D] mt-0.5">
                تعداد دقیق موجودی قابل حواله در انبار مرکزی اطلس (به‌روزرسانی شده آنلاین).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setInventoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
                  inventoryFilter === 'all'
                    ? 'bg-[#55565A] text-white'
                    : 'bg-slate-100 text-[#777A7D] hover:bg-slate-200'
                }`}
              >
                همه اقلام
              </button>
              <button
                type="button"
                onClick={() => setInventoryFilter('in_stock')}
                className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
                  inventoryFilter === 'in_stock'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-emerald-700 hover:bg-slate-200'
                }`}
              >
                موجود در انبار
              </button>
              <button
                type="button"
                onClick={() => setInventoryFilter('limited')}
                className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
                  inventoryFilter === 'limited'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-amber-700 hover:bg-slate-200'
                }`}
              >
                موجودی محدود
              </button>
              <button
                type="button"
                onClick={() => setInventoryFilter('out_of_stock')}
                className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
                  inventoryFilter === 'out_of_stock'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-100 text-red-700 hover:bg-slate-200'
                }`}
              >
                ناموجود (نیاز به تأمین)
              </button>
            </div>
          </div>

          <div className="relative max-w-md">
            <input
              type="text"
              value={inventorySearch}
              onChange={e => setInventorySearch(e.target.value)}
              placeholder="جستجو بر اساس پارت‌نامبر، کد کالا یا نام تسمه..."
              className="w-full h-10 pr-9 pl-3 rounded-xl border border-slate-200 text-xs text-[#55565A] focus:outline-none focus:border-[#E06518]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-[#777A7D] border-b border-slate-200">
                <tr>
                  <th className="p-3">کد کالا</th>
                  <th className="p-3">نام و مشخصات تسمه</th>
                  <th className="p-3">برند / کشور</th>
                  <th className="p-3 text-center">وضعیت</th>
                  <th className="p-3 text-center">موجودی انبار یزد</th>
                  <th className="p-3 text-left">قیمت همکار</th>
                  <th className="p-3 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products
                  .filter(p => {
                    const status = p.stock > 10 ? 'in_stock' : p.stock > 0 ? 'limited' : 'out_of_stock';
                    if (inventoryFilter !== 'all' && status !== inventoryFilter) return false;
                    if (inventorySearch.trim()) {
                      const q = inventorySearch.toLowerCase();
                      return (
                        p.name.toLowerCase().includes(q) ||
                        p.code.toLowerCase().includes(q) ||
                        p.brand.toLowerCase().includes(q)
                      );
                    }
                    return true;
                  })
                  .map(prod => {
                    const wholesalePrice = prod.prices.dealer || Math.round(prod.prices.retail * 0.82);
                    const status = prod.stock > 10 ? 'in_stock' : prod.stock > 0 ? 'limited' : 'out_of_stock';

                    return (
                      <tr key={prod.code} className="hover:bg-slate-50/80">
                        <td className="p-3 font-mono font-bold text-[#55565A]">{prod.code}</td>
                        <td className="p-3">
                          <div className="font-bold text-[#55565A]">{prod.name}</div>
                          <div className="text-[10px] text-[#777A7D]">{prod.categoryName}</div>
                        </td>
                        <td className="p-3 font-bold text-slate-700">{prod.brand}</td>
                        <td className="p-3 text-center">
                          {status === 'in_stock' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              موجود در انبار
                            </span>
                          ) : status === 'limited' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              موجودی محدود
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                              ناموجود
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center font-mono font-black text-[#55565A]">
                          {toPersianDigits(prod.stock)} {prod.unit}
                        </td>
                        <td className="p-3 text-left font-mono font-bold text-[#E06518]">
                          {formatPrice(wholesalePrice)} تومان
                        </td>
                        <td className="p-3 text-center">
                          {prod.stock === 0 ? (
                            <button
                              type="button"
                              onClick={() => setShowSupplyModal(true)}
                              className="px-2.5 py-1 text-[10px] font-bold text-[#C95210] bg-orange-50 hover:bg-orange-100 rounded-lg cursor-pointer transition-colors"
                            >
                              درخواست تأمین
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddDealerProductToCart(prod, 1)}
                              className="px-2.5 py-1 text-[10px] font-bold text-white bg-[#55565A] hover:bg-[#1B293E] rounded-lg cursor-pointer transition-colors"
                            >
                              سفارش سریع
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TAB: ORDERS & INVOICES */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-sm text-[#55565A]">
                تاریخچه سفارش‌ها، بارنامه‌ها و فاکتورهای رسمی نمایندگی
              </h3>
              <p className="text-xs text-[#777A7D] mt-0.5">
                امکان مشاهده وضعیت باربری، کد رهگیری چاپار/تیپاکس و دریافت صورتحساب ماده ۱۶۹ مکرر مالیاتی.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {MOCK_ORDERS.map(order => (
              <div
                key={order.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#55565A]">شماره سفارش:</span>
                      <span className="font-mono font-black text-[#E06518] text-sm">
                        {order.orderNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                        حواله نمایندگی
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      تاریخ ثبت: {toPersianDigits(order.createdAt)} | نشانی تحویل: {order.shippingAddress}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <div className="text-[11px] text-slate-500">مبلغ کل فاکتور:</div>
                      <div className="font-mono font-black text-sm text-[#55565A]">
                        {formatPrice(order.totalAmount)} تومان
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedInvoiceOrder(order)}
                      className="px-4 py-2 bg-[#55565A] hover:bg-[#1B293E] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Printer className="w-4 h-4 text-[#E06518]" />
                      <span>مشاهده و چاپ فاکتور رسمی</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-[#55565A] line-clamp-1">
                          {item.productName}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          تعداد: {toPersianDigits(item.quantity)} {item.unit}
                        </div>
                      </div>
                      <div className="font-mono font-bold text-slate-700">
                        {formatPrice(item.totalPrice)} ت
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-[#777A7D] pt-1">
                  <span>
                    روش ارسال: <strong>باربری اختصاصی یزد - تخلیه بار میبد</strong>
                  </span>
                  <span className="font-mono text-[11px]">
                    کد بارنامه: YZD-88402-TR
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TAB: FINANCIALS */}
      {activeTab === 'financials' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-1">
              <span className="text-xs text-[#777A7D]">سقف کل اعتبار نمایندگی:</span>
              <div className="text-xl font-black text-[#55565A]">
                {formatPrice(totalCreditLimit)} تومان
              </div>
              <div className="text-[11px] text-slate-500">ضمانت تفاهم‌نامه صنفی</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-1">
              <span className="text-xs text-[#777A7D]">بدهی جاری (سفارش‌های تسویه نشده):</span>
              <div className="text-xl font-black text-red-600">
                {formatPrice(usedCredit)} تومان
              </div>
              <div className="text-[11px] text-slate-500">موعد سررسید: ۲۵ روز دیگر</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-1">
              <span className="text-xs text-[#777A7D]">مانده اعتبار آزاد جهت سفارش:</span>
              <div className="text-xl font-black text-emerald-600">
                {formatPrice(remainingCredit)} تومان
              </div>
              <div className="text-[11px] text-emerald-700 font-bold">قابل سفارش بلافاصله</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-sm text-[#55565A]">
                  گردش حساب مالی، بستانکاری و تسویه فاکتورها
                </h3>
                <p className="text-xs text-[#777A7D] mt-0.5">
                  گزارش ریز اسناد مالی حسابداری نمایندگی شما در سیستم بازرگانی اطلس.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowDepositModal(true)}
                className="px-4 py-2.5 bg-[#E06518] hover:bg-[#C95210] text-white text-xs font-black rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <UploadCloud className="w-4 h-4" />
                <span>ارسال رسید واریز وجه (فیش بانکی)</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-[#777A7D] border-b border-slate-200">
                  <tr>
                    <th className="p-3">شماره سند</th>
                    <th className="p-3">تاریخ</th>
                    <th className="p-3">شرح تراکنش</th>
                    <th className="p-3 text-left">بدهکار (خرید)</th>
                    <th className="p-3 text-left">بستانکار (واریز)</th>
                    <th className="p-3 text-left">مانده حساب</th>
                    <th className="p-3 text-center">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {transactions.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-[#55565A]">{t.referenceNumber}</td>
                      <td className="p-3 text-slate-600">{toPersianDigits(t.date)}</td>
                      <td className="p-3 font-sans font-medium text-slate-800">{t.description}</td>
                      <td className="p-3 text-left text-red-600 font-bold">
                        {t.debit > 0 ? `${formatPrice(t.debit)} ت` : '-'}
                      </td>
                      <td className="p-3 text-left text-emerald-600 font-bold">
                        {t.credit > 0 ? `${formatPrice(t.credit)} ت` : '-'}
                      </td>
                      <td className="p-3 text-left text-[#55565A] font-black">
                        {formatPrice(t.balance)} ت
                      </td>
                      <td className="p-3 text-center font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {t.status === 'confirmed' ? 'تأیید مالی' : 'در حال بررسی'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB: MESSAGES */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-black text-sm text-[#55565A]">
              سامانه پیام‌رسانی مستقیم با مدیریت بازرگانی و کارشناسان فنی
            </h3>
            <p className="text-xs text-[#777A7D] mt-0.5">
              مکاتبات شما مستقیماً توسط مدیر بازرگانی و واحد مهندسی فروش پاسخ داده می‌شود.
            </p>
          </div>

          <div className="space-y-3 max-h-[450px] overflow-y-auto p-3 bg-slate-50 rounded-2xl border border-slate-200">
            {messages.map(msg => {
              const isMe = msg.sender === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-lg p-3.5 rounded-2xl text-xs space-y-1 shadow-xs ${
                      isMe
                        ? 'bg-[#55565A] text-white rounded-tr-none'
                        : 'bg-white text-[#55565A] border border-slate-200 rounded-tl-none'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-[10px] opacity-75">
                      <span className="font-bold">{msg.senderName}</span>
                      <span className="font-mono">{toPersianDigits(msg.timestamp)}</span>
                    </div>
                    <p className="leading-relaxed font-medium">{msg.message}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessageText}
              onChange={e => setNewMessageText(e.target.value)}
              placeholder="پیام یا استعلام فنی خود را بنویسید..."
              className="flex-1 h-11 px-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-[#55565A] focus:outline-none focus:border-[#E06518]"
            />
            <button
              type="submit"
              className="px-5 h-11 bg-[#E06518] hover:bg-[#C95210] text-white text-xs font-black rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>ارسال پیام</span>
            </button>
          </form>
        </div>
      )}

      {/* 7. TAB: CATALOGS */}
      {activeTab === 'catalogs' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-black text-sm text-[#55565A]">
              دانلود کاتالوگ‌های فنی، جداول سایزبندی و فایل‌های اکسل قیمت پخش
            </h3>
            <p className="text-xs text-[#777A7D] mt-0.5">
              فایل‌های به‌روزرسانی شده ویژه پرینت یا ایمپورت در نرم‌افزارهای حسابداری فروشگاه‌ها.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {catalogs.map(cat => (
              <div
                key={cat.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-4 hover:border-orange-300 transition-all"
              >
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-100 text-[#C95210]">
                      {cat.format}
                    </span>
                    <h4 className="font-black text-sm text-[#55565A]">{cat.title}</h4>
                  </div>
                  <p className="text-[#777A7D] leading-relaxed text-[11px]">{cat.category}</p>
                  <div className="text-[10px] text-slate-500 pt-1 font-mono">
                    حجم: {cat.fileSize} | دانلودها: {toPersianDigits(cat.downloadCount)} | تاریخ: {toPersianDigits(cat.updatedAt)}
                  </div>
                </div>

                <a
                  href={`#download-${cat.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setAddedToast(`دانلود فایل «${cat.title}» آغاز شد.`);
                    setTimeout(() => setAddedToast(null), 3500);
                  }}
                  className="px-3.5 py-2 bg-[#55565A] hover:bg-[#1B293E] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#E06518]" />
                  <span>دانلود فایل</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. TAB: PERFORMANCE */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-sm text-[#55565A]">
                  نمودار تحلیلی فروش فصلی و میزان تحقق تارگت نمایندگی
                </h3>
                <p className="text-xs text-[#777A7D] mt-0.5">
                  مقایسه فروش واقعی بر حسب میلیون تومان با هدف‌گذاری فصلی بازرگانی.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-[#E06518] font-bold">
                  <span className="w-3 h-3 rounded-full bg-[#E06518] inline-block" />
                  فروش تحقق‌یافته
                </span>
                <span className="flex items-center gap-1 text-slate-400 font-bold">
                  <span className="w-3 h-3 rounded-full bg-slate-300 inline-block" />
                  هدف ماهانه (تارگت)
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="h-64 w-full flex items-end justify-between gap-4 pt-8 px-4">
                {[
                  { month: 'فروردین', actual: 80, target: 70 },
                  { month: 'اردیبهشت', actual: 110, target: 90 },
                  { month: 'خرداد', actual: 130, target: 120 },
                  { month: 'تیر', actual: 95, target: 100 },
                  { month: 'مرداد', actual: 140, target: 125 },
                  { month: 'شهریور', actual: 165, target: 140 },
                ].map((bar, i) => {
                  const maxHeight = 180;
                  const actualHeight = Math.round((bar.actual / maxHeight) * 200);
                  const targetHeight = Math.round((bar.target / maxHeight) * 200);

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <div className="text-[10px] font-mono font-bold text-[#55565A]">
                        {toPersianDigits(bar.actual)}م
                      </div>

                      <div className="w-full max-w-[48px] flex items-end gap-1 h-full justify-center">
                        <div
                          style={{ height: `${actualHeight}px` }}
                          className="w-1/2 bg-[#E06518] rounded-t-lg transition-all hover:bg-[#C95210]"
                          title={`فروش: ${bar.actual} میلیون تومان`}
                        />
                        <div
                          style={{ height: `${targetHeight}px` }}
                          className="w-1/2 bg-slate-300 rounded-t-lg transition-all hover:bg-slate-400"
                          title={`هدف: ${bar.target} میلیون تومان`}
                        />
                      </div>

                      <span className="text-[11px] font-bold text-[#777A7D]">{bar.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[#777A7D]">مجموع فروش ۶ ماهه:</span>
                <div className="font-black font-mono text-base text-[#55565A] mt-1">
                  ۷۲۰ میلیون تومان
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[#777A7D]">پاداش تحقق فصلی (Rebate):</span>
                <div className="font-black font-mono text-base text-emerald-600 mt-1">
                  ۲۱.۶ میلیون تومان (۳٪)
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[#777A7D]">رتبه کشوری در شبکه نمایندگان:</span>
                <div className="font-black text-base text-[#E06518] mt-1">
                  رتبه ۴ از کل عاملیت‌ها
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. TAB: SUPPLY REQUEST */}
      {activeTab === 'supply_request' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-sm text-[#55565A]">
                درخواست تأمین قطعات ناموجود، سایزهای سفارشی و اقلام خاص
              </h3>
              <p className="text-xs text-[#777A7D] mt-0.5">
                اگر سایز یا مدل خاصی از تسمه در کاتالوگ موجود نیست، سفارش دهید تا با واردات مستقیم تهیه شود.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowSupplyModal(true)}
              className="px-4 py-2.5 bg-[#E06518] hover:bg-[#C95210] text-white text-xs font-black rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>ثبت سفارش تأمین جدید</span>
            </button>
          </div>

          <div className="space-y-3">
            {supplyRequests.map(req => (
              <div
                key={req.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-sm text-[#55565A]">{req.productName}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                      برند: {req.brand}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        req.urgency === 'emergency_halt'
                          ? 'bg-red-100 text-red-800'
                          : req.urgency === 'urgent'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {req.urgency === 'emergency_halt'
                        ? 'خط خوابیده'
                        : req.urgency === 'urgent'
                        ? 'فوری'
                        : 'عادی'}
                    </span>
                  </div>
                  <p className="text-[#777A7D] text-[11px] leading-relaxed">
                    مشخصات فنی: {req.technicalSpecs}
                  </p>
                  <div className="text-[10px] text-slate-500 font-mono">
                    تعداد درخواستی: {toPersianDigits(req.quantity)} عدد | تاریخ ثبت: {toPersianDigits(req.submittedAt)}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    {req.status === 'sourcing' ? 'در حال مذاکره واردات و تأمین' : 'بررسی شده'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALS */}
      {selectedInvoiceOrder && (
        <OfficialInvoiceModal
          order={selectedInvoiceOrder}
          dealerCompanyName={currentUser?.fullName ? `بازرگانی ${currentUser.fullName}` : undefined}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}

      {showDepositModal && (
        <DepositReceiptModal
          onClose={() => setShowDepositModal(false)}
          onSuccess={receipt => {
            setDepositReceipts(agencyService.getDepositReceipts());
            setTransactions(agencyService.getFinancialTransactions());
            setAddedToast(`رسید واریز به شماره سند ${receipt.trackingNumber} ثبت شد و به واحد حسابداری ارسال گردید.`);
            setTimeout(() => setAddedToast(null), 4000);
          }}
        />
      )}

      {showSupplyModal && (
        <SupplyRequestModal
          dealerName={currentUser?.fullName}
          onClose={() => setShowSupplyModal(false)}
          onSuccess={req => {
            setSupplyRequests(agencyService.getSupplyRequests());
            setAddedToast(`درخواست تأمین «${req.productName}» با موفقیت برای واحد بازرگانی ارسال شد.`);
            setTimeout(() => setAddedToast(null), 4000);
          }}
        />
      )}
    </div>
  );
};
