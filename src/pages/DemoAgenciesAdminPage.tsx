import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Building,
  User,
  Phone,
  MapPin,
  Briefcase,
  TrendingUp,
  FileText,
  Sparkles,
  Search,
  MessageSquare,
  AlertTriangle,
  ChevronLeft,
  Eye,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { agencyService } from '../services/agencyService';
import { useAuth } from '../context/AuthContext';
import { AgencyApplication, SmsLog } from '../types';
import { toPersianDigits } from '../utils/formatters';

export const DemoAgenciesAdminPage: React.FC = () => {
  const { currentUser, activeRole, activateDealerRole, switchRole } = useAuth();
  const navigate = useNavigate();

  const [applications, setApplications] = useState<AgencyApplication[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'applications' | 'sms_logs'>('applications');
  const [smsLogs, setSmsLogs] = useState<SmsLog[]>([]);

  // Rejection modal
  const [rejectingApp, setRejectingApp] = useState<AgencyApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('عدم تطابق مدارک صنفی و عدم ارائه تصویر واضح جواز کسب معتبر');

  // Preview doc modal
  const [previewDoc, setPreviewDoc] = useState<{ name: string; url?: string } | null>(null);

  // Success alert
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const loadData = () => {
    const apps = agencyService.getApplications();
    setApplications([...apps]);
    const logs = agencyService.getSmsLogs();
    setSmsLogs([...logs]);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = (app: AgencyApplication) => {
    agencyService.approveApplication(app.id);

    // If current logged in user has the same phone or if user wants immediate dealer role
    if (currentUser && currentUser.phone === app.phone) {
      activateDealerRole();
    }

    setAlertMessage(`درخواست عاملیت ${app.companyName} با موفقیت تایید شد. پیامک خوش‌آمدگویی و فعال‌سازی ارسال گردید.`);
    loadData();
    setTimeout(() => setAlertMessage(null), 5000);
  };

  const handleRejectConfirm = () => {
    if (!rejectingApp) return;
    agencyService.rejectApplication(rejectingApp.id, rejectionReason.trim());
    setAlertMessage(`درخواست ${rejectingApp.companyName} رد شد و پیامک دلیل رد به متقاضی مخابره گردید.`);
    setRejectingApp(null);
    loadData();
    setTimeout(() => setAlertMessage(null), 5000);
  };

  // Dev Quick Action
  const handleQuickActivateDealer = () => {
    activateDealerRole();
    setAlertMessage('نقش کاربری شما بلافاصله به «نماینده رسمی اطلس» ارتقا یافت! پنل پخش فعال شد.');
    setTimeout(() => {
      navigate('/dealer');
    }, 1200);
  };

  const filteredApps = applications.filter(app => {
    if (filterStatus !== 'all' && app.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        app.companyName.toLowerCase().includes(q) ||
        app.managerName.toLowerCase().includes(q) ||
        app.trackingCode.toLowerCase().includes(q) ||
        app.city.toLowerCase().includes(q) ||
        app.phone.includes(q)
      );
    }
    return true;
  });

  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const approvedCount = applications.filter(a => a.status === 'approved').length;
  const rejectedCount = applications.filter(a => a.status === 'rejected').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-right">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#777A7D]">
        <Link to="/" className="hover:text-[#E06518] transition-colors">
          صفحه اصلی
        </Link>
        <ChevronLeft className="w-3.5 h-3.5" />
        <Link to="/agency" className="hover:text-[#E06518] transition-colors">
          همکاری و نمایندگی
        </Link>
        <ChevronLeft className="w-3.5 h-3.5" />
        <span className="text-[#55565A] font-bold">پنل موقت بررسی درخواست‌ها (پیش‌نمایش فاز ۴)</span>
      </nav>

      {/* DEV QUICK TOGGLE BANNER */}
      <div className="bg-gradient-to-r from-[#55565A] via-[#1B293E] to-[#55565A] text-white rounded-2xl p-5 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 border border-orange-500/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#E06518] text-white text-[10px] font-black">
              ابزار ویژه تست و توسعه (Dev Mode)
            </span>
            <span className="text-xs text-slate-300">
              نقش فعلی شما:{' '}
              <strong className="text-[#E06518] font-bold">
                {activeRole === 'dealer'
                  ? 'نماینده رسمی (Dealer)'
                  : activeRole === 'admin'
                  ? 'مدیر سیستم (Admin)'
                  : activeRole === 'wholesale'
                  ? 'همکار عمده'
                  : 'کاربر عادی'}
              </strong>
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-white">
            فعال‌سازی فوری نمایندگی برای کاربر جاری بدون انتظار
          </h2>
          <p className="text-xs text-slate-300">
            با این دکمه بدون نیاز به تایید مدارک، دسترسی کاربر فعال شما به «نماینده» تغییر کرده و تمام ۹ بخش پنل پخش (/dealer) باز می‌شود.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleQuickActivateDealer}
            className="px-5 py-2.5 bg-[#E06518] hover:bg-[#C95210] text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>⚡ فعال‌سازی فوری نمایندگی (ورود به /dealer)</span>
          </button>

          {activeRole === 'dealer' && (
            <button
              type="button"
              onClick={() => switchRole('retail')}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              برگشت به کاربر عادی
            </button>
          )}
        </div>
      </div>

      {/* Alert toast */}
      {alertMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{alertMessage}</span>
          </div>
          <button
            onClick={() => setAlertMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-right">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] text-[#777A7D]">کل درخواست‌ها</div>
          <div className="text-2xl font-black text-[#55565A] mt-1">
            {toPersianDigits(applications.length)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">ثبت شده در سامانه</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] text-[#777A7D]">در انتظار بررسی (Pending)</div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {toPersianDigits(pendingCount)}
          </div>
          <div className="text-[10px] text-amber-700 mt-0.5">نیازمند اقدام فوری</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] text-[#777A7D]">تأیید شده (Approved)</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {toPersianDigits(approvedCount)}
          </div>
          <div className="text-[10px] text-emerald-700 mt-0.5">عاملیت فعال و پنل باز</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] text-[#777A7D]">رد شده (Rejected)</div>
          <div className="text-2xl font-black text-red-600 mt-1">
            {toPersianDigits(rejectedCount)}
          </div>
          <div className="text-[10px] text-red-700 mt-0.5">ارسال پیامک علت رد</div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('applications')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'applications'
                  ? 'bg-[#55565A] text-white shadow-xs'
                  : 'bg-slate-100 text-[#777A7D] hover:bg-slate-200'
              }`}
            >
              درخواست‌های نمایندگی ({toPersianDigits(applications.length)})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sms_logs')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'sms_logs'
                  ? 'bg-[#55565A] text-white shadow-xs'
                  : 'bg-slate-100 text-[#777A7D] hover:bg-slate-200'
              }`}
            >
              لاگ پیامک‌های سیستم ({toPersianDigits(smsLogs.length)})
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-72">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="جستجو در متقاضیان، کد یا شهر..."
                className="w-full h-10 pr-9 pl-3 rounded-xl border border-slate-200 text-xs text-[#55565A] focus:outline-none focus:border-[#E06518]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* Status Filter Chips (only when on applications tab) */}
        {activeTab === 'applications' && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#777A7D] font-bold">فیلتر وضعیت:</span>
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                filterStatus === 'all'
                  ? 'bg-orange-100 text-[#C95210] font-black'
                  : 'bg-slate-100 text-[#777A7D] hover:bg-slate-200'
              }`}
            >
              همه ({toPersianDigits(applications.length)})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                filterStatus === 'pending'
                  ? 'bg-amber-100 text-amber-900 font-black'
                  : 'bg-slate-100 text-[#777A7D] hover:bg-slate-200'
              }`}
            >
              در حال بررسی ({toPersianDigits(pendingCount)})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('approved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                filterStatus === 'approved'
                  ? 'bg-emerald-100 text-emerald-900 font-black'
                  : 'bg-slate-100 text-[#777A7D] hover:bg-slate-200'
              }`}
            >
              تأیید شده ({toPersianDigits(approvedCount)})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('rejected')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                filterStatus === 'rejected'
                  ? 'bg-red-100 text-red-900 font-black'
                  : 'bg-slate-100 text-[#777A7D] hover:bg-slate-200'
              }`}
            >
              رد شده ({toPersianDigits(rejectedCount)})
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: Applications List */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {filteredApps.length > 0 ? (
            filteredApps.map(app => {
              const isApproved = app.status === 'approved';
              const isRejected = app.status === 'rejected';
              const isPending = app.status === 'pending';

              return (
                <div
                  key={app.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs transition-all space-y-4 ${
                    isApproved
                      ? 'border-emerald-200/80 bg-emerald-50/10'
                      : isRejected
                      ? 'border-red-200/80 bg-red-50/10'
                      : 'border-slate-200 hover:border-orange-300'
                  }`}
                >
                  {/* Top Bar: Company Name, Tracking, Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : isRejected
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        <Building className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-base text-[#55565A]">
                            {app.companyName}
                          </h3>
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {app.trackingCode}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#777A7D] mt-0.5">
                          <span>
                            مدیر: <strong className="text-[#55565A]">{app.managerName}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            کد ملی: <strong className="font-mono">{app.nationalCode}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            تاریخ ثبت: {toPersianDigits(app.submittedAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-black">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>تأیید شده (عاملیت فعال)</span>
                        </span>
                      ) : isRejected ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-100 text-red-800 text-xs font-black">
                          <XCircle className="w-3.5 h-3.5 text-red-600" />
                          <span>رد شده</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100 text-amber-900 text-xs font-black">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>در انتظار بررسی کارشناس</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Information Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[#777A7D] text-[11px]">اطلاعات تماس:</span>
                      <div className="font-bold text-[#55565A] font-mono">
                        {app.phone} | {app.tel}
                      </div>
                      {app.email && <div className="text-[11px] text-slate-500">{app.email}</div>}
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[#777A7D] text-[11px]">موقعیت واحد:</span>
                      <div className="font-bold text-[#55565A]">
                        {app.province}، {app.city}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate" title={app.fullAddress}>
                        {app.fullAddress}
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[#777A7D] text-[11px]">سابقه و حجم پیش‌بینی:</span>
                      <div className="font-bold text-[#55565A]">
                        {app.monthlyVolume}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {toPersianDigits(app.activityYears)} سال سابقه | {toPersianDigits(app.personnelCount)} نفر پرسنل
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[#777A7D] text-[11px]">نوع همکاری و حوزه‌ها:</span>
                      <div className="font-bold text-[#E06518]">
                        {app.cooperationType === 'sales_agency'
                          ? 'نمایندگی انحصاری فروش'
                          : app.cooperationType === 'regional_distributor'
                          ? 'پخش منطقه‌ای و استانی'
                          : 'عاملیت توزیع'}
                      </div>
                      <div className="text-[11px] text-slate-600 truncate">
                        {app.activityFields.join('، ')}
                      </div>
                    </div>
                  </div>

                  {/* Documents and Notes */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-3">
                      {app.licenseDocument ? (
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewDoc({
                              name: app.licenseDocument?.fileName || 'مدرک جواز',
                              url: app.licenseDocument?.previewUrl,
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#55565A] font-bold text-xs transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#E06518]" />
                          <span>مشاهده مدرک جواز ({app.licenseDocument.fileName})</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs">مدرکی ضمیمه نشده است</span>
                      )}

                      {app.notes && (
                        <span className="text-[#777A7D] text-[11px] max-w-md truncate" title={app.notes}>
                          توضیحات متقاضی: {app.notes}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApprove(app)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>تأیید نمایندگی و فعال‌سازی پنل</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRejectingApp(app)}
                            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl transition-colors border border-red-200 flex items-center gap-1.5 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                            <span>رد درخواست</span>
                          </button>
                        </>
                      )}

                      {isApproved && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-emerald-700 font-bold">
                            تأیید شده در: {toPersianDigits(app.reviewedAt || app.submittedAt)}
                          </span>
                          <Link
                            to="/dealer"
                            className="px-3.5 py-1.5 bg-[#55565A] hover:bg-[#1B293E] text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1"
                          >
                            <span>مشاهده پنل پخش</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      )}

                      {isRejected && app.rejectionReason && (
                        <span className="text-[11px] text-red-600 font-bold">
                          دلیل رد: {app.rejectionReason}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
              <Building className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="font-bold text-sm text-[#55565A]">درخواستی با این فیلتر یافت نشد</div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: SMS Logs */}
      {activeTab === 'sms_logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-sm text-[#55565A]">
              گزارش سیستم پیامک‌های ماک هایپر صنعت اطلس
            </h3>
            <span className="text-xs text-[#777A7D]">
              اتصال وب‌سرویس پترن کاوه‌نگار / ملی‌پیامک (شبیه‌سازی شده)
            </span>
          </div>

          <div className="space-y-2.5">
            {smsLogs.map(log => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#55565A] bg-white px-2 py-0.5 rounded border border-slate-200">
                      گیرنده: {log.recipientPhone}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                      قالب: {log.template}
                    </span>
                  </div>
                  <p className="text-[#55565A] font-medium leading-relaxed">«{log.message}»</p>
                </div>

                <div className="flex sm:flex-col items-end gap-1 text-[11px] text-[#777A7D] shrink-0">
                  <span className="text-emerald-600 font-bold">تحویل موفق (Delivered)</span>
                  <span className="font-mono">{log.sentAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REJECTION MODAL */}
      {rejectingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#12203C]/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-black text-sm">ثبت علت رد درخواست نمایندگی</h3>
              </div>
              <button
                onClick={() => setRejectingApp(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#777A7D]">
              درخواست واحد <strong className="text-[#55565A]">{rejectingApp.companyName}</strong> (مدیریت: {rejectingApp.managerName}) رد خواهد شد و این علت به شماره {rejectingApp.phone} پیامک می‌شود.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#55565A]">علت عدم پذیرش:</label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-[#55565A] focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingApp(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
              >
                تأیید رد درخواست و ارسال پیامک
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW DOCUMENT MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#12203C]/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-[#55565A]">{previewDoc.name}</h3>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center min-h-[250px]">
              {previewDoc.url ? (
                <img
                  src={previewDoc.url}
                  alt="مدرک"
                  className="max-h-[350px] w-full object-contain"
                />
              ) : (
                <div className="text-center p-8 space-y-2">
                  <FileText className="w-12 h-12 text-[#E06518] mx-auto" />
                  <div className="text-xs font-bold text-[#55565A]">سند PDF پروانه کسب رسمی</div>
                  <div className="text-[11px] text-[#777A7D]">دارای هولوگرام و شماره صنفی معتبر</div>
                </div>
              )}
            </div>

            <div className="text-left">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-[#55565A] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
