import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Building,
  User,
  Phone,
  Calendar,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { agencyService } from '../../services/agencyService';
import { AgencyApplication, SmsLog } from '../../types';
import { toPersianDigits } from '../../utils/formatters';

interface AgencyTrackingProps {
  initialTrackingCode?: string;
}

export const AgencyTracking: React.FC<AgencyTrackingProps> = ({ initialTrackingCode }) => {
  const [searchTerm, setSearchTerm] = useState(initialTrackingCode || '');
  const [currentApp, setCurrentApp] = useState<AgencyApplication | null>(null);
  const [smsLogs, setSmsLogs] = useState<SmsLog[]>([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialTrackingCode) {
      handleSearch(initialTrackingCode);
    } else {
      // Default to the first pending or sample
      const apps = agencyService.getApplications();
      if (apps.length > 0) {
        handleSearch(apps[0].trackingCode);
      }
    }
  }, [initialTrackingCode]);

  const handleSearch = (termToUse?: string) => {
    const query = (termToUse || searchTerm).trim();
    if (!query) return;

    setSearched(true);
    let found = agencyService.getApplicationByTracking(query);
    if (!found) {
      found = agencyService.getApplicationByPhone(query);
    }
    setCurrentApp(found || null);

    if (found) {
      const allLogs = agencyService.getSmsLogs();
      const matchedLogs = allLogs.filter(
        l =>
          l.recipientPhone === found?.phone ||
          (found?.trackingCode && l.message.includes(found.trackingCode))
      );
      setSmsLogs(matchedLogs);
    } else {
      setSmsLogs([]);
    }
  };

  return (
    <div className="space-y-6 text-right">
      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-black text-[#55565A]">
            استعلام وضعیت درخواست عاملیت و نمایندگی
          </h3>
          <p className="text-xs text-[#777A7D] mt-1">
            جهت مشاهده مرحله بررسی پرونده، کد رهگیری (مثلاً AGY-74812) یا شماره موبایل ثبت‌شده را وارد کنید:
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="کد رهگیری (مثلاً AGY-74812) یا شماره موبایل..."
              className="w-full h-11 pr-10 pl-4 rounded-xl border border-slate-200 text-xs sm:text-sm text-[#55565A] focus:outline-none focus:border-[#E06518] font-mono"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          </div>

          <button
            type="button"
            onClick={() => handleSearch()}
            className="px-6 h-11 bg-[#E06518] hover:bg-[#C95210] text-white text-xs sm:text-sm font-black rounded-xl transition-colors shrink-0 cursor-pointer"
          >
            پیگیری پرونده
          </button>
        </div>

        {/* Quick sample chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-[#777A7D]">
          <span>کدهای نمونه جهت بررسی سریع:</span>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('AGY-74812');
              handleSearch('AGY-74812');
            }}
            className="font-mono font-bold text-[#55565A] bg-slate-100 hover:bg-orange-50 hover:text-[#E06518] px-2 py-0.5 rounded cursor-pointer transition-colors"
          >
            AGY-74812 (تأییدشده)
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('AGY-88402');
              handleSearch('AGY-88402');
            }}
            className="font-mono font-bold text-[#55565A] bg-slate-100 hover:bg-orange-50 hover:text-[#E06518] px-2 py-0.5 rounded cursor-pointer transition-colors"
          >
            AGY-88402 (در حال بررسی)
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('AGY-91255');
              handleSearch('AGY-91255');
            }}
            className="font-mono font-bold text-[#55565A] bg-slate-100 hover:bg-orange-50 hover:text-[#E06518] px-2 py-0.5 rounded cursor-pointer transition-colors"
          >
            AGY-91255 (میبد)
          </button>
        </div>
      </div>

      {/* Result Card */}
      {currentApp ? (
        <div className="space-y-6">
          {/* Main Status Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-black text-[#55565A]">
                    {currentApp.companyName}
                  </h4>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-[#55565A]">
                    {currentApp.trackingCode}
                  </span>
                </div>
                <p className="text-xs text-[#777A7D]">
                  مدیریت: <strong className="text-[#55565A]">{currentApp.managerName}</strong> | تاریخ ثبت درخواست: {toPersianDigits(currentApp.submittedAt)}
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {currentApp.status === 'approved' ? (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>تأیید شده - عاملیت فعال</span>
                  </div>
                ) : currentApp.status === 'rejected' ? (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-black">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span>درخواست رد شده</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black">
                    <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                    <span>در حال بررسی کارشناسی</span>
                  </div>
                )}
              </div>
            </div>

            {/* Approved Action Banner */}
            {currentApp.status === 'approved' && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>پنل پخش و کاتالوگ قیمت همکار برای شما فعال گردیده است.</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    می‌توانید بلافاصله وارد پنل پخش شوید و سفارش‌های خود را با تخفیف لایه نماینده و قیمت کارخانه ثبت فرمایید.
                  </p>
                </div>
                <Link
                  to="/dealer"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
                >
                  <span>ورود به پنل پخش نماینده</span>
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                </Link>
              </div>
            )}

            {/* Rejection notice */}
            {currentApp.status === 'rejected' && currentApp.rejectionReason && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs space-y-1">
                <strong className="font-bold">علت عدم تأیید:</strong>
                <p className="text-[11px] leading-relaxed">{currentApp.rejectionReason}</p>
              </div>
            )}

            {/* Detail Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 space-y-1">
                <span className="text-[#777A7D] text-[11px]">موقعیت واحد صنفی:</span>
                <div className="font-bold text-[#55565A]">
                  استان {currentApp.province} - شهر {currentApp.city}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 space-y-1">
                <span className="text-[#777A7D] text-[11px]">تلفن و موبایل:</span>
                <div className="font-bold font-mono text-[#55565A]">
                  {currentApp.phone} | {currentApp.tel}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 space-y-1">
                <span className="text-[#777A7D] text-[11px]">حجم خرید ماهانه:</span>
                <div className="font-bold text-[#55565A]">{currentApp.monthlyVolume}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 space-y-1">
                <span className="text-[#777A7D] text-[11px]">حوزه‌های فعالیت:</span>
                <div className="font-bold text-[#E06518] truncate">
                  {currentApp.activityFields.join('، ')}
                </div>
              </div>
            </div>
          </div>

          {/* SMS Logs Mock Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <MessageSquare className="w-5 h-5 text-[#E06518]" />
              <h4 className="text-sm font-black text-[#55565A]">
                تاریخچه لاگ پیامک‌های ارسالی سیستم به شماره {currentApp.phone}
              </h4>
            </div>

            {smsLogs.length > 0 ? (
              <div className="space-y-2.5">
                {smsLogs.map(log => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-[#777A7D]">
                      <span className="font-mono text-emerald-600 font-bold">
                        وضعیت: تحویل داده شده به مخابرات
                      </span>
                      <span className="font-mono">{log.sentAt}</span>
                    </div>
                    <p className="text-[#55565A] leading-relaxed font-medium">
                      «{log.message}»
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-[#777A7D]">
                پیامکی برای این پرونده ثبت نشده است.
              </div>
            )}
          </div>
        </div>
      ) : (
        searched && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-[#55565A]">
              درخواستی با این کد رهگیری یا شماره یافت نشد
            </h4>
            <p className="text-xs text-[#777A7D]">
              لطفاً صحت کد رهگیری را بررسی فرمایید یا با شماره ۰۳۵-۳۷۲۵۴۰۰۰ تماس حاصل فرمایید.
            </p>
          </div>
        )
      )}
    </div>
  );
};
