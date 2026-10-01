import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  Building,
  MapPin,
  Calendar,
  CreditCard,
  Truck,
  Eye,
  Check,
  AlertTriangle,
  FileText,
  Search,
  Plus,
} from 'lucide-react';
import { adminService, ActiveAgency, SupplyRequestItem } from '../../services/adminService';
import { AgencyApplication } from '../../types';
import { formatPrice, toPersianDigits } from '../../utils/formatters';

export const AgenciesAdminModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cardex' | 'applications' | 'supply'>('cardex');

  // Active Agencies Ledger
  const [agencies, setAgencies] = useState<ActiveAgency[]>(() => adminService.getActiveAgencies());
  const [agencySearch, setAgencySearch] = useState('');

  // Applications
  const [applications, setApplications] = useState<AgencyApplication[]>(() =>
    adminService.getAgencyApplications()
  );
  const [selectedApp, setSelectedApp] = useState<AgencyApplication | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [assignedCode, setAssignedCode] = useState('');
  const [assignedCreditLimit, setAssignedCreditLimit] = useState<number>(300000000);
  const [assignedPassword, setAssignedPassword] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Supply Requests
  const [supplyRequests, setSupplyRequests] = useState<SupplyRequestItem[]>(() =>
    adminService.getSupplyRequests()
  );

  const refreshData = () => {
    setAgencies(adminService.getActiveAgencies());
    setApplications(adminService.getAgencyApplications());
    setSupplyRequests(adminService.getSupplyRequests());
  };

  // Filtered agencies
  const filteredAgencies = agencies.filter(
    a =>
      a.name.toLowerCase().includes(agencySearch.toLowerCase()) ||
      a.city.toLowerCase().includes(agencySearch.toLowerCase()) ||
      a.code.toLowerCase().includes(agencySearch.toLowerCase())
  );

  const handleOpenApprove = (app: AgencyApplication) => {
    setSelectedApp(app);
    const autoCode = 'DLR-' + Math.floor(10000 + Math.random() * 90000);
    const autoPass = 'Atlas@' + Math.floor(1000 + Math.random() * 9000);
    setAssignedCode(autoCode);
    setAssignedPassword(autoPass);
    setAssignedCreditLimit(250000000); // 250 million default
    setIsApproveModalOpen(true);
  };

  const handleConfirmApprove = () => {
    if (!selectedApp || !assignedCode.trim()) return;
    const creds = adminService.approveAgency(
      selectedApp.id,
      assignedCode.trim(),
      assignedCreditLimit,
      assignedPassword
    );
    refreshData();
    setIsApproveModalOpen(false);
    if (creds) {
      setSuccessToast(
        `پنل نمایندگی با دیتای صفر برای «${selectedApp.companyName}» فعال شد. پیامک اطلاعات ورود (نام کاربری: ${creds.username} | رمز: ${creds.password}) به شماره ${selectedApp.phone} ارسال شد.`
      );
      setTimeout(() => setSuccessToast(null), 6000);
    }
    setSelectedApp(null);
  };

  const handleReject = (app: AgencyApplication) => {
    const reason = window.prompt('لطفاً دلیل عدم احراز صلاحیت نمایندگی را وارد نمایید:');
    if (reason) {
      adminService.rejectAgency(app.id, reason);
      refreshData();
    }
  };

  const handleApproveSupply = (reqId: string) => {
    adminService.updateSupplyRequestStatus(reqId, 'approved');
    refreshData();
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#55565A] flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#E06518]" />
            <span>مدیریت شبکه نمایندگان رسمی و عاملیت‌های کشوری</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            کاردکس حساب و تعهدات اعتباری، بررسی تقاضاهای نمایندگی جدید، و صدور حواله خروج کالای انبار مرکزی.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
            {toPersianDigits(agencies.length)} نماینده فعال در سراسر کشور
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('cardex')}
          className={`py-2 px-4 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'cardex'
              ? 'bg-[#55565A] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>کاردکس و پرونده نمایندگان ({toPersianDigits(agencies.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`py-2 px-4 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'applications'
              ? 'bg-[#55565A] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>درخواست‌های نمایندگی جدید ({toPersianDigits(applications.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('supply')}
          className={`py-2 px-4 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'supply'
              ? 'bg-[#55565A] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>درخواست‌های تأمین کالا ({toPersianDigits(supplyRequests.length)})</span>
        </button>
      </div>

      {/* --- TAB 1: CARDEX LEDGER --- */}
      {activeTab === 'cardex' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="relative w-80">
              <input
                type="text"
                value={agencySearch}
                onChange={e => setAgencySearch(e.target.value)}
                placeholder="جستجو با کد، نام نماینده یا استان/شهر..."
                className="w-full h-10 pr-9 pl-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#E06518]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>

            <div className="text-xs text-slate-400 font-mono">
              محاسبه آنی سقف اعتبار و موعد چک‌های صیادی
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-[#55565A]">
                    <th className="py-3.5 px-4">کد عاملیت</th>
                    <th className="py-3.5 px-4">نام نماینده / فروشگاه</th>
                    <th className="py-3.5 px-4">استان و شهر</th>
                    <th className="py-3.5 px-4">سقف اعتبار قرارداد</th>
                    <th className="py-3.5 px-4">مانده بدهی جاری</th>
                    <th className="py-3.5 px-4">موعد چک بعدی</th>
                    <th className="py-3.5 px-4">وضعیت قرارداد</th>
                    <th className="py-3.5 px-4 text-center">پرونده مالی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAgencies.map(ag => (
                    <tr key={ag.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-black text-[#55565A]">{ag.code}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#55565A]">{ag.name}</div>
                        <div className="text-[10px] text-slate-400">{ag.phone}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {ag.province} - {ag.city}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        {formatPrice(ag.creditLimit)} ت
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#C95210]">
                        {formatPrice(ag.currentBalance)} ت
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{ag.nextCheckDate}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          قرارداد معتبر
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => alert(`کاردکس تفصیلی مالی نماینده ${ag.name} با سقف ${formatPrice(ag.creditLimit)} تومان.`)}
                          className="py-1 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#55565A] font-bold text-xs mx-auto"
                        >
                          مشاهده کاردکس
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: APPLICATIONS --- */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {applications.map(app => (
              <div
                key={app.id}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-400">#{app.trackingNumber || app.id}</span>
                      <h3 className="font-black text-sm text-[#55565A]">{app.fullName}</h3>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {app.companyName || 'فروشگاه شخصی'} | استان: {app.province} - شهر: {app.city}
                    </div>
                  </div>

                  <div>
                    {app.status === 'pending' && (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        در انتظار بررسی
                      </span>
                    )}
                    {app.status === 'approved' && (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        تأییدشده و فعال
                      </span>
                    )}
                    {app.status === 'rejected' && (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-red-50 text-red-800 border border-red-200">
                        رد شده
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-2xl">
                  <div>کد ملی: <b className="font-mono">{app.nationalCode}</b></div>
                  <div>تلفن همراه: <b className="font-mono">{app.phone}</b></div>
                  <div>سابقه فعالیت: <b>{app.experienceYears || '۱۰ سال در بازار تسمه'}</b></div>
                  <div>مساحت انبار: <b>{app.shopArea || '۲۵۰ متر مربع'}</b></div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  {app.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleReject(app)}
                        className="py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs cursor-pointer"
                      >
                        رد درخواست
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenApprove(app)}
                        className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>تأیید و صدور کد عاملیت</span>
                      </button>
                    </>
                  )}
                  {app.status === 'approved' && (
                    <span className="text-xs font-bold text-emerald-700">
                      کد عاملیت اختصاصی صادر شد
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 3: SUPPLY REQUESTS --- */}
      {activeTab === 'supply' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-[#55565A]">
                    <th className="py-3.5 px-4">کد حواله</th>
                    <th className="py-3.5 px-4">نماینده متقاضی</th>
                    <th className="py-3.5 px-4">شرح اقلام درخواستی</th>
                    <th className="py-3.5 px-4">تعداد کل</th>
                    <th className="py-3.5 px-4">فوریت تأمین</th>
                    <th className="py-3.5 px-4">تاریخ تقاضا</th>
                    <th className="py-3.5 px-4">وضعیت حواله</th>
                    <th className="py-3.5 px-4 text-center">اقدام انبار مرکزی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {supplyRequests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-black text-[#55565A]">{req.id}</td>
                      <td className="py-3.5 px-4 font-bold text-[#55565A]">{req.agencyName}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{req.productName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">کد کالا: {req.productCode}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#55565A]">
                        {toPersianDigits(req.quantity)} عدد
                      </td>
                      <td className="py-3.5 px-4">
                        {req.urgency === 'immediate' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                            فوری (خط متوقف)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            عادی انبار
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono">{req.createdAt}</td>
                      <td className="py-3.5 px-4">
                        {req.status === 'pending' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            در انتظار بارگیری
                          </span>
                        )}
                        {req.status === 'approved' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            حواله صادر شد
                          </span>
                        )}
                        {req.status === 'dispatched' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                            ارسال شد
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {req.status === 'pending' ? (
                          <button
                            type="button"
                            onClick={() => handleApproveSupply(req.id)}
                            className="py-1 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer mx-auto flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>صدور حواله خروج</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 font-bold">تکمیل شده</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {successToast && (
        <div className="fixed bottom-6 left-6 z-50 p-4 rounded-2xl bg-[#55565A] text-white text-xs font-bold shadow-2xl border border-emerald-500 flex items-center gap-3 max-w-md">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="leading-relaxed">{successToast}</span>
        </div>
      )}

      {/* --- APPROVE AGENCY MODAL --- */}
      {isApproveModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-5 text-right">
            <div>
              <h3 className="font-black text-sm text-[#55565A]">
                تأیید عاملیت و افتتاح پنل نمایندگی: {selectedApp.companyName}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                مدیر: {selectedApp.managerName} | شهر: {selectedApp.province} - {selectedApp.city}
              </p>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-[11px] text-blue-900 leading-relaxed space-y-1">
              <strong className="block font-black">صدور پنل اختصاصی با دیتای صفر (Fresh Clean State):</strong>
              <p>
                پنل کاربری نمایندگی برای این شخص با کارتابل تمیز (سفارشات صفر، فاکتورهای اولیه خالی و بالانس اولیه صفر) فعال شده و اطلاعات ورود بلافاصله به شماره متقاضی پیامک خواهد شد.
              </p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">نام کاربری ورود (شماره موبایل متقاضی):</label>
                <input
                  type="text"
                  disabled
                  value={selectedApp.phone}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-100 font-mono font-bold text-slate-600 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">رمز عبور اختصاصی پنل نمایندگی (پیامک می‌شود):</label>
                <input
                  type="text"
                  value={assignedPassword}
                  onChange={e => setAssignedPassword(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 font-mono font-bold text-[#E06518] outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">کد اختصاصی عاملیت (Agency Code):</label>
                <input
                  type="text"
                  value={assignedCode}
                  onChange={e => setAssignedCode(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 font-mono font-bold text-[#55565A] outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">سقف اعتبار اولیه قرارداد (تومان):</label>
                <input
                  type="number"
                  value={assignedCreditLimit}
                  onChange={e => setAssignedCreditLimit(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 font-mono font-bold text-emerald-700 outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsApproveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>تأیید نهایی، صدور پنل صفر و ارسال پیامک</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
