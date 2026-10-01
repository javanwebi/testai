import React, { useState } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  Users,
  Eye,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
  FileText,
  UserCheck,
  ChevronLeft,
  BarChart2,
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { toPersianDigits, formatPrice } from '../utils/formatters';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const [chartView, setChartView] = useState<'trend' | 'comparison'>('trend');

  const inquiries = adminService.getInquiries();
  const orders = adminService.getOrders();
  const agencies = adminService.getAgencyApplications();
  const customers = adminService.getCustomers();
  const products = adminService.getProducts();

  const pendingInquiries = inquiries.filter(i => i.status === 'pending');
  const pendingOrders = orders.filter(o => o.status === 'registered' || o.status === 'processing');
  const pendingAgencies = agencies.filter(a => a.status === 'pending');

  return (
    <div className="space-y-6 text-right">
      {/* 1. TOP CRITICAL ALERTS BANNER (هشدارها) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigateTab('pricing_inquiries')}
          className="p-4 rounded-2xl bg-amber-50 border border-amber-200 hover:border-amber-400 transition-all cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5 text-amber-700 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-900">استعلام‌های بدون پاسخ</div>
              <div className="text-[11px] text-amber-700 mt-0.5">
                {toPersianDigits(pendingInquiries.length)} استعلام در انتظار قیمت‌گذاری بازرگانی
              </div>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-amber-600" />
        </div>

        <div
          onClick={() => onNavigateTab('orders')}
          className="p-4 rounded-2xl bg-blue-50 border border-blue-200 hover:border-blue-400 transition-all cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <div className="text-xs font-bold text-blue-900">سفارش‌های در صف ارسال انبار</div>
              <div className="text-[11px] text-blue-700 mt-0.5">
                {toPersianDigits(pendingOrders.length)} سفارش نیازمند تأیید و صدور بارنامه
              </div>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-blue-600" />
        </div>

        <div
          onClick={() => onNavigateTab('agencies')}
          className="p-4 rounded-2xl bg-orange-50 border border-orange-200 hover:border-orange-400 transition-all cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#C95210] flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5 text-[#E06518]" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#C95210]">درخواست‌های جدید عاملیت</div>
              <div className="text-[11px] text-orange-700 mt-0.5">
                {toPersianDigits(pendingAgencies.length)} پرونده متقاضی بررسی و تأیید مدارک
              </div>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-orange-600" />
        </div>
      </div>

      {/* 2. KEY PERFORMANCE INDICATORS (کارتهای KPI) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#777A7D] text-xs">
            <span>فروش امروز</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-bold text-[10px] flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              ٪۱۲+
            </span>
          </div>
          <div className="text-2xl font-black text-[#55565A]">
            {formatPrice(48500000)} <span className="text-xs text-slate-500 font-normal">ت</span>
          </div>
          <div className="text-[11px] text-slate-400">۸ فاکتور نقدی و اعتباری</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#777A7D] text-xs">
            <span>فروش این ماه</span>
            <TrendingUp className="w-4 h-4 text-[#E06518]" />
          </div>
          <div className="text-2xl font-black text-[#55565A]">
            {formatPrice(842000000)} <span className="text-xs text-slate-500 font-normal">ت</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-bold">٪۸۴ تحقق تارگت ماهانه</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#777A7D] text-xs">
            <span>تعداد کل سفارش‌ها</span>
            <ShoppingBag className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-[#55565A]">
            {toPersianDigits(148)} <span className="text-xs text-slate-500 font-normal">سفارش</span>
          </div>
          <div className="text-[11px] text-slate-400">۳۲ سفارش عمده کارخانجات</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#777A7D] text-xs">
            <span>بازدید امروز سایت</span>
            <Eye className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-[#55565A]">
            {toPersianDigits(3840)} <span className="text-xs text-slate-500 font-normal">نفر</span>
          </div>
          <div className="text-[11px] text-purple-600 font-bold">۷۱٪ بازدید رسته صنعتی</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#777A7D] text-xs">
            <span>کاربران و مشتریان</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-[#55565A]">
            {toPersianDigits(customers.length + 185)} <span className="text-xs text-slate-500 font-normal">شرکت</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-bold">۱۲ ثبت‌نام B2B در این هفته</div>
        </div>
      </div>

      {/* 3. CHARTS ROW (SVG CHARTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 30-Day Sales Trend Line Chart & Monthly Comparison (SVG) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <h3 className="font-black text-sm text-[#55565A]">
                {chartView === 'trend' ? 'روند فروش ۳۰ روز اخیر (میلیون تومان)' : 'مقایسه فروش ماهانه (۱۴۰۳ در برابر ۱۴۰۲)'}
              </h3>
              <p className="text-xs text-[#777A7D] mt-0.5">
                {chartView === 'trend'
                  ? 'توزیع فروش نقدی و اعتباری شبکه پخش و کارخانجات'
                  : 'رشد ۶ ماهه نخست سال جاری نسبت به دوره مشابه سال قبل'}
              </p>
            </div>
            
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setChartView('trend')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  chartView === 'trend' ? 'bg-white text-[#55565A] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                روند ۳۰ روزه
              </button>
              <button
                type="button"
                onClick={() => setChartView('comparison')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  chartView === 'comparison' ? 'bg-white text-[#55565A] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                مقایسه ماهانه
              </button>
            </div>
          </div>

          {chartView === 'trend' ? (
            <>
              <div className="h-64 w-full flex items-end pt-6 relative">
                {/* SVG Trend Line */}
                <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E06518" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#E06518" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid lines */}
                  <line x1="0" y1="40" x2="500" y2="40" stroke="#dee2e5" strokeWidth="1" />
                  <line x1="0" y1="90" x2="500" y2="90" stroke="#dee2e5" strokeWidth="1" />
                  <line x1="0" y1="140" x2="500" y2="140" stroke="#dee2e5" strokeWidth="1" />
                  <line x1="0" y1="190" x2="500" y2="190" stroke="#dee2e5" strokeWidth="1" />

                  {/* Area */}
                  <polygon
                    points="0,180 30,160 65,130 100,145 140,110 180,95 220,120 260,85 300,70 340,90 380,50 420,40 460,60 500,30 500,200 0,200"
                    fill="url(#salesGrad)"
                  />

                  {/* Line */}
                  <polyline
                    fill="none"
                    stroke="#E06518"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="0,180 30,160 65,130 100,145 140,110 180,95 220,120 260,85 300,70 340,90 380,50 420,40 460,60 500,30"
                  />

                  {/* Data points */}
                  {[
                    [0, 180], [65, 130], [140, 110], [220, 120], [300, 70], [380, 50], [460, 60], [500, 30]
                  ].map(([cx, cy], i) => (
                    <circle key={i} cx={cx} cy={cy} r="4" fill="#55565A" stroke="#E06518" strokeWidth="2" />
                  ))}
                </svg>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                <span>۱ شهریور</span>
                <span>۸ شهریور</span>
                <span>۱۵ شهریور</span>
                <span>۲۲ شهریور</span>
                <span>امروز (۳۱ شهریور)</span>
              </div>
            </>
          ) : (
            <>
              {/* Monthly Comparison Bar Chart */}
              <div className="h-64 w-full flex items-end pt-4 relative">
                <svg viewBox="0 0 600 220" className="w-full h-full overflow-visible">
                  {/* Grid lines */}
                  <line x1="40" y1="40" x2="580" y2="40" stroke="#dee2e5" strokeWidth="1" />
                  <line x1="40" y1="90" x2="580" y2="90" stroke="#dee2e5" strokeWidth="1" />
                  <line x1="40" y1="140" x2="580" y2="140" stroke="#dee2e5" strokeWidth="1" />
                  <line x1="40" y1="190" x2="580" y2="190" stroke="#cbd5e1" strokeWidth="1.5" />

                  {/* 6 Months Bars: [Month, 1402 Height, 1403 Height] */}
                  {[
                    { m: 'فروردین', y1: 70, y2: 105, x: 60 },
                    { m: 'اردیبهشت', y1: 90, y2: 130, x: 150 },
                    { m: 'خرداد', y1: 110, y2: 150, x: 240 },
                    { m: 'تیر', y1: 85, y2: 120, x: 330 },
                    { m: 'مرداد', y1: 125, y2: 170, x: 420 },
                    { m: 'شهریور', y1: 135, y2: 185, x: 510 },
                  ].map((item, idx) => (
                    <g key={idx}>
                      {/* Bar 1402 (Gray) */}
                      <rect
                        x={item.x}
                        y={190 - item.y1}
                        width="24"
                        height={item.y1}
                        rx="4"
                        fill="#94A3B8"
                      />
                      {/* Bar 1403 (Orange) */}
                      <rect
                        x={item.x + 28}
                        y={190 - item.y2}
                        width="24"
                        height={item.y2}
                        rx="4"
                        fill="#E06518"
                      />
                      {/* Month label */}
                      <text
                        x={item.x + 26}
                        y="210"
                        textAnchor="middle"
                        fontSize="11"
                        fill="#777A7D"
                        fontFamily="inherit"
                      >
                        {item.m}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#E06518]" />
                    <span className="font-bold text-[#55565A]">فروش سال ۱۴۰۳ (رشد +۳۸٪)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-slate-400" />
                    <span className="text-slate-500">فروش سال ۱۴۰۲</span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">واحد: میلیون تومان</span>
              </div>
            </>
          )}
        </div>

        {/* Category Share Donut (SVG) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-black text-sm text-[#55565A]">سهم دسته‌بندی‌ها از فروش</h3>
            <p className="text-xs text-[#777A7D] mt-0.5">درصد ارزش سفارشات ثبت‌شده</p>
          </div>

          <div className="flex flex-col items-center justify-center py-2">
            <svg width="180" height="180" viewBox="0 0 42 42" className="rotate-[-90deg]">
              {/* Background circle */}
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#dee2e5" strokeWidth="6" />

              {/* Ceramic & Tiles: 38% */}
              <circle
                cx="21" cy="21" r="15.915" fill="transparent"
                stroke="#E06518" strokeWidth="6"
                strokeDasharray="38 62" strokeDashoffset="0"
              />
              {/* SWR / Forza Belts: 32% */}
              <circle
                cx="21" cy="21" r="15.915" fill="transparent"
                stroke="#55565A" strokeWidth="6"
                strokeDasharray="32 68" strokeDashoffset="-38"
              />
              {/* Textile: 18% */}
              <circle
                cx="21" cy="21" r="15.915" fill="transparent"
                stroke="#3B82F6" strokeWidth="6"
                strokeDasharray="18 82" strokeDashoffset="-70"
              />
              {/* Industrial General: 12% */}
              <circle
                cx="21" cy="21" r="15.915" fill="transparent"
                stroke="#10B981" strokeWidth="6"
                strokeDasharray="12 88" strokeDashoffset="-88"
              />
            </svg>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E06518]" />
                <span>قطعات کوره کاشی و سرامیک</span>
              </span>
              <span className="font-bold font-mono">۳۸٪</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#55565A]" />
                <span>تسمه‌های انحصاری SWR و FORZA</span>
              </span>
              <span className="font-bold font-mono">۳۲٪</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>ماشین‌آلات و قطعات نساجی</span>
              </span>
              <span className="font-bold font-mono">۱۸٪</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>تسمه‌های عمومی و قطعات کارخانجات</span>
              </span>
              <span className="font-bold font-mono">۱۲٪</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. THREE LISTS: TOP PRODUCTS, TOP CUSTOMERS, ACTIVE AGENCIES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-sm text-[#55565A]">پرفروش‌ترین کالاها</h3>
            <button
              onClick={() => onNavigateTab('products')}
              className="text-xs text-[#E06518] font-bold hover:underline"
            >
              کاتالوگ کالاها
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {products.slice(0, 4).map((p, idx) => (
              <div key={p.code} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="space-y-0.5 max-w-[170px]">
                  <div className="font-bold text-[#55565A] line-clamp-1">{p.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">کد: {p.code} | {p.brand}</div>
                </div>
                <div className="text-left font-mono">
                  <div className="font-bold text-[#C95210]">{formatPrice(p.prices.retail)} ت</div>
                  <div className="text-[10px] text-slate-400">فروش: {toPersianDigits(120 - idx * 25)} عدد</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers (مشتریان برتر) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-sm text-[#55565A]">مشتریان برتر سازمانی</h3>
            <button
              onClick={() => onNavigateTab('customers')}
              className="text-xs text-[#E06518] font-bold hover:underline"
            >
              سامانه CRM
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {customers.map((c, i) => (
              <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-bold text-[#55565A]">{c.companyName || c.fullName}</div>
                  <div className="text-[10px] text-slate-500">{c.city} | سطح: {c.clubTier === 'gold' ? 'طلایی' : 'نقره‌ای'}</div>
                </div>
                <div className="text-left font-mono">
                  <div className="font-bold text-emerald-600">{formatPrice(120000000 - i * 35000000)} ت</div>
                  <div className="text-[10px] text-slate-400">خرید تجمعی</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Dealers (نمایندگان فعال) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-sm text-[#55565A]">عاملیت‌های فعال شبکه پخش</h3>
            <button
              onClick={() => onNavigateTab('agencies')}
              className="text-xs text-[#E06518] font-bold hover:underline"
            >
              مدیریت نمایندگان
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { name: 'نمایندگی مرکزی یزد (حاج احمد دهقان)', code: 'DLR-7481', city: 'یزد / میبد', credit: '۲۵۰ م ت', target: '۹۲٪' },
              { name: 'پخش قطعات کوره ستاره میبد', code: 'DLR-8820', city: 'میبد', credit: '۱۸۰ م ت', target: '۸۴٪' },
              { name: 'ابزار صنعت اسپادانا', code: 'DLR-9012', city: 'اصفهان', credit: '۱۵۰ م ت', target: '۷۸٪' },
            ].map(d => (
              <div key={d.code} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-bold text-[#55565A]">{d.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">کد: {d.code} | منطقه: {d.city}</div>
                </div>
                <div className="text-left font-mono">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    تارگت: {d.target}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1">سقف اعتبار: {d.credit}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
