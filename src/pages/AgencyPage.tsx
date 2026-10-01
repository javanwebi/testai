import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  ChevronLeft,
  FileEdit,
  Search,
  CheckCircle2,
  PhoneCall,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { AgencyHeroCards } from '../components/agency/AgencyHeroCards';
import { AgencyStepper } from '../components/agency/AgencyStepper';
import { AgencyForm } from '../components/agency/AgencyForm';
import { AgencyTracking } from '../components/agency/AgencyTracking';
import { AgencyApplication } from '../types';

export const AgencyPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'tracking' ? 'tracking' : 'apply';
  const [activeTab, setActiveTab] = useState<'apply' | 'tracking'>(initialTab);
  const [lastSubmittedApp, setLastSubmittedApp] = useState<AgencyApplication | null>(null);

  const handleApplySuccess = (app: AgencyApplication) => {
    setLastSubmittedApp(app);
    setActiveTab('tracking');
    setSearchParams({ tab: 'tracking', code: app.trackingCode });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8 text-right">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-[#777A7D]">
        <Link to="/" className="hover:text-[#E06518] transition-colors">
          صفحه اصلی
        </Link>
        <ChevronLeft className="w-3.5 h-3.5" />
        <span className="text-[#55565A] font-bold">همکاری، عاملیت و شبکه پخش</span>
      </nav>

      {/* Hero Header */}
      <div className="bg-[#55565A] rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-lg">
        <div className="absolute -left-10 -bottom-10 w-64 h-64 rounded-full bg-[#E06518]/10 blur-3xl pointer-events-none" />
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-orange-400 text-xs font-bold border border-white/10">
            <ShieldCheck className="w-4 h-4" />
            <span>پرتال رسمی عاملیت‌های فروش بازرگانی تسمه اطلس یزد</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            پیوستن به شبکه سراسری نمایندگی و پخش هایپر صنعت
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            اگر مالک فروشگاه ابزار و قطعات صنعتی، شرکت بازرگانی تأمین کارخانجات یا فعال در حوزه کاشی، سرامیک و نساجی هستید، با تکمیل فرم زیر به عنوان نماینده رسمی پذیرش شده و از قیمت‌های لایه پخش، اعتبار خرید و ارسال اختصاصی بهره‌مند شوید.
          </p>

          {/* Tester note */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/admin/demo-agencies"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-orange-300 font-bold border border-orange-500/30 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>پنل موقت تایید درخواست‌ها (ویژه دمو فاز ۴: admin/demo-agencies/)</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <Link
              to="/dealer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E06518] hover:bg-[#C95210] text-xs text-white font-black transition-colors"
            >
              <span>مشاهده پنل پخش (dealer/)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Hero Cards */}
      <AgencyHeroCards />

      {/* 4-Step Stepper */}
      <AgencyStepper currentStep={activeTab === 'tracking' ? 2 : 1} />

      {/* Application Success Banner if just submitted */}
      {lastSubmittedApp && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-right">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-black text-sm text-emerald-900">
                درخواست عاملیت واحد {lastSubmittedApp.companyName} با موفقیت ثبت شد!
              </h4>
              <p className="text-xs text-emerald-700">
                کد رهگیری شما: <strong className="font-mono text-emerald-950 font-bold px-2 py-0.5 bg-emerald-100 rounded">{lastSubmittedApp.trackingCode}</strong> | پیامک تایید نیز به {lastSubmittedApp.phone} ارسال گردید.
              </p>
            </div>
          </div>

          <Link
            to="/admin/demo-agencies"
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shrink-0 shadow-xs"
          >
            تأیید فوری در پنل ادمین
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div className="space-y-6">
        <div className="flex items-center border-b border-slate-200">
          <button
            type="button"
            onClick={() => {
              setActiveTab('apply');
              setSearchParams({});
            }}
            className={`pb-3 px-5 text-sm font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'apply'
                ? 'border-[#E06518] text-[#E06518]'
                : 'border-transparent text-[#777A7D] hover:text-[#55565A]'
            }`}
          >
            <FileEdit className="w-4 h-4" />
            <span>ثبت فرم درخواست نمایندگی جدید</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('tracking');
              setSearchParams({ tab: 'tracking' });
            }}
            className={`pb-3 px-5 text-sm font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'tracking'
                ? 'border-[#E06518] text-[#E06518]'
                : 'border-transparent text-[#777A7D] hover:text-[#55565A]'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>پیگیری وضعیت پرونده و استعلام کد رهگیری</span>
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'apply' ? (
          <AgencyForm onSuccess={handleApplySuccess} />
        ) : (
          <AgencyTracking
            initialTrackingCode={searchParams.get('code') || lastSubmittedApp?.trackingCode}
          />
        )}
      </div>

      {/* Support Footer Note */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-right">
        <div className="space-y-1">
          <h4 className="font-bold text-xs sm:text-sm text-[#55565A]">
            نیاز به مشاوره پیش از ارسال درخواست عاملیت دارید؟
          </h4>
          <p className="text-[11px] text-[#777A7D]">
            همکاران ما در واحد توسعه شبکه عاملیت و بازرگانی پاسخگوی سؤالات تخصصی شما هستند.
          </p>
        </div>
        <a
          href="tel:03537254000"
          className="px-5 py-2.5 bg-white hover:bg-slate-100 text-[#55565A] font-bold text-xs rounded-xl border border-slate-300 flex items-center gap-2 transition-colors shrink-0 shadow-xs"
        >
          <PhoneCall className="w-4 h-4 text-[#E06518]" />
          <span className="font-mono">۰۳۵-۳۷۲۵۴۰۰۰</span>
        </a>
      </div>
    </div>
  );
};
