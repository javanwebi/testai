import React, { useState } from 'react';
import {
  Settings,
  Shield,
  CreditCard,
  MessageSquare,
  History,
  Download,
  RotateCcw,
  CheckCircle,
  Plus,
  Send,
  AlertTriangle,
  Lock,
  User,
  Key,
  Database,
  ExternalLink,
} from 'lucide-react';
import {
  adminService,
  SystemSettings,
  AdminUser,
  AdminAuditLog,
  SmsLog,
} from '../../services/adminService';
import { toPersianDigits } from '../../utils/formatters';

export const SettingsSystemModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'roles' | 'gateways_sms' | 'audit' | 'backup'>('roles');

  const [settings, setSettings] = useState<SystemSettings>(() => adminService.getSettings());
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(() => adminService.getAdminUsers());
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>(() => adminService.getAuditLogs());
  const [smsLogs, setSmsLogs] = useState<SmsLog[]>(() => adminService.getSmsLogs());

  // Test SMS State
  const [testPhone, setTestPhone] = useState('09131234567');
  const [testTemplate, setTestTemplate] = useState<SmsLog['template']>('order_confirmed');
  const [isTestSmsSent, setIsTestSmsSent] = useState(false);

  const refreshData = () => {
    setSettings(adminService.getSettings());
    setAdminUsers(adminService.getAdminUsers());
    setAuditLogs(adminService.getAuditLogs());
    setSmsLogs(adminService.getSmsLogs());
  };

  const handleSaveSettings = (updated: SystemSettings) => {
    setSettings(updated);
    adminService.saveSettings(updated);
    alert('تنظیمات سیستم با موفقیت ذخیره گردید.');
  };

  const handleSendTestSms = (e: React.FormEvent) => {
    e.preventDefault();
    adminService.sendSms(testPhone, testTemplate, {
      name: 'کاربر تستی',
      orderId: 'ORD-1403-999',
      carrier: 'باربری وطن یزد',
      trackingNumber: '784512',
    });
    setSmsLogs(adminService.getSmsLogs());
    setIsTestSmsSent(true);
    setTimeout(() => setIsTestSmsSent(false), 4000);
  };

  const handleDownloadBackup = () => {
    const jsonStr = adminService.exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atlas_admin_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'هشدار: تمام تغییرات، سفارش‌ها و رکوردهای آزمایشی شما حذف شده و سامانه به داده‌های اولیه بازمی‌گردد. آیا ادامه می‌دهید؟'
      )
    ) {
      adminService.resetToInitial();
      refreshData();
      alert('داده‌های سامانه به وضعیت اولیه بازنشانی شد.');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#55565A] flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#E06518]" />
            <span>تنظیمات کلان، امنیت، درگاه‌ها و لاگ سیستم</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            ماتریس دسترسی نقش‌ها (RBAC)، اتصال به درگاه‌های پرداخت، سامانه پیامک و پشتیبان‌گیری کامل از پایگاه داده.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadBackup}
            className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#55565A] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>خروجی پشتیبان JSON</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('roles')}
          className={`py-2 px-4 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'roles'
              ? 'bg-[#55565A] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>نقش‌ها و دسترسی‌ها (RBAC)</span>
        </button>

        <button
          onClick={() => setActiveTab('gateways_sms')}
          className={`py-2 px-4 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'gateways_sms'
              ? 'bg-[#55565A] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>درگاه‌های پرداخت و پیامک</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`py-2 px-4 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'bg-[#55565A] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>سوابق فعالیت مدیران (Audit Log)</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`py-2 px-4 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'backup'
              ? 'bg-[#55565A] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>پشتیبان‌گیری و بازیابی داده‌ها</span>
        </button>
      </div>

      {/* --- TAB 1: ROLES & RBAC MATRIX --- */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          {/* RBAC Matrix */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="font-black text-sm text-[#55565A]">ماتریس دسترسی نقش‌های سازمانی اطلس</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                توزیع مجوزهای کاربری بین مدیران بر اساس وظایف سازمانی
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-[#55565A]">
                    <th className="py-3 px-4">ماژول / عملیات</th>
                    <th className="py-3 px-4 text-center">مدیر ارشد (Superadmin)</th>
                    <th className="py-3 px-4 text-center">مدیر فروش و CRM</th>
                    <th className="py-3 px-4 text-center">انباردار و لجستیک</th>
                    <th className="py-3 px-4 text-center">حسابداری و مالی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { title: 'مشاهده داشبورد و شاخص‌های مالی', s: true, sa: true, w: false, a: true },
                    { title: 'تعریف و ویرایش کالاها و قیمت پایه', s: true, sa: true, w: false, a: false },
                    { title: 'ایمپورت گروهی اکسل و تغییر ضرایب', s: true, sa: true, w: false, a: false },
                    { title: 'پاسخ به استعلام‌ها و صدور پیش‌فاکتور', s: true, sa: true, w: false, a: true },
                    { title: 'تأیید فیش‌های بانکی و اعتبارسنجی', s: true, sa: false, w: false, a: true },
                    { title: 'ثبت بارنامه و تغییر وضعیت بسته‌بندی', s: true, sa: false, w: true, a: false },
                    { title: 'تأیید نمایندگی و تخصیص سقف اعتبار', s: true, sa: true, w: false, a: true },
                    { title: 'تغییر تنظیمات درگاه و خروجی بکاپ', s: true, sa: false, w: false, a: false },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-800">{row.title}</td>
                      <td className="py-3 px-4 text-center">
                        {row.s ? <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" /> : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {row.sa ? <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" /> : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {row.w ? <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" /> : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {row.a ? <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" /> : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Admin Users List */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-[#55565A]">کاربران مجاز به ورود به پنل مدیریت</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {adminUsers.map(user => (
                <div key={user.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-[#55565A]">{user.name}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white border border-slate-200">
                      {user.role}
                    </span>
                  </div>
                  <div className="text-slate-500 font-mono">نام کاربری: {user.username}</div>
                  <div className="text-[10px] text-slate-400">آخرین ورود: {user.lastLogin || 'امروز'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: GATEWAYS & SMS --- */}
      {activeTab === 'gateways_sms' && (
        <div className="space-y-6">
          {/* Payment Gateways Config */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-black text-sm text-[#55565A]">پیکربندی درگاه‌های پرداخت آنلاین بانکی</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Zarinpal */}
              <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#55565A]">زرین‌پال (ZarinPal)</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.paymentGateways.zarinpal.enabled}
                      onChange={e =>
                        handleSaveSettings({
                          ...settings,
                          paymentGateways: {
                            ...settings.paymentGateways,
                            zarinpal: {
                              ...settings.paymentGateways.zarinpal,
                              enabled: e.target.checked,
                            },
                          },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">کد مرچنت تستی (Merchant ID)</label>
                  <input
                    type="text"
                    value={settings.paymentGateways.zarinpal.merchantId}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        paymentGateways: {
                          ...settings.paymentGateways,
                          zarinpal: {
                            ...settings.paymentGateways.zarinpal,
                            merchantId: e.target.value,
                          },
                        },
                      })
                    }
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 font-mono text-[11px] outline-none"
                  />
                </div>
              </div>

              {/* Saman */}
              <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#55565A]">بانک سامان (Sep)</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.paymentGateways.saman.enabled}
                      onChange={e =>
                        handleSaveSettings({
                          ...settings,
                          paymentGateways: {
                            ...settings.paymentGateways,
                            saman: {
                              ...settings.paymentGateways.saman,
                              enabled: e.target.checked,
                            },
                          },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">کد ترمینال سامان</label>
                  <input
                    type="text"
                    value={settings.paymentGateways.saman.terminalId}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        paymentGateways: {
                          ...settings.paymentGateways,
                          saman: {
                            ...settings.paymentGateways.saman,
                            terminalId: e.target.value,
                          },
                        },
                      })
                    }
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 font-mono text-[11px] outline-none"
                  />
                </div>
              </div>

              {/* Mellat */}
              <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#55565A]">به‌پرداخت ملت (Mellat)</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.paymentGateways.mellat.enabled}
                      onChange={e =>
                        handleSaveSettings({
                          ...settings,
                          paymentGateways: {
                            ...settings.paymentGateways,
                            mellat: {
                              ...settings.paymentGateways.mellat,
                              enabled: e.target.checked,
                            },
                          },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">ترمینال به‌پرداخت</label>
                  <input
                    type="text"
                    value={settings.paymentGateways.mellat.terminalId}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        paymentGateways: {
                          ...settings.paymentGateways,
                          mellat: {
                            ...settings.paymentGateways.mellat,
                            terminalId: e.target.value,
                          },
                        },
                      })
                    }
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 font-mono text-[11px] outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SMS Provider & Test Panel */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-black text-sm text-[#55565A]">تنظیمات سامانه پیامک و تست ارسال وب‌سرویس</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-[#55565A]">پروایدر پیامک: کاوه نگار / ملی پیامک</div>
                <div>
                  <label className="text-slate-500 block mb-1">کلید وب‌سرویس (API Key)</label>
                  <input
                    type="password"
                    value={settings.smsConfig.apiKey}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        smsConfig: { ...settings.smsConfig, apiKey: e.target.value },
                      })
                    }
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-500 block mb-1">سرشماره خط اختصاصی ارسال</label>
                  <input
                    type="text"
                    value={settings.smsConfig.senderNumber}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        smsConfig: { ...settings.smsConfig, senderNumber: e.target.value },
                      })
                    }
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 font-mono outline-none"
                  />
                </div>
              </div>

              {/* Test SMS Form */}
              <form onSubmit={handleSendTestSms} className="space-y-3 p-4 rounded-2xl bg-orange-50/60 border border-orange-200">
                <div className="font-bold text-[#C95210]">تست آنی ارسال پیامک به شماره موبایل:</div>
                <input
                  type="text"
                  value={testPhone}
                  onChange={e => setTestPhone(e.target.value)}
                  placeholder="0913..."
                  className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white font-mono outline-none"
                />

                <select
                  value={testTemplate}
                  onChange={e => setTestTemplate(e.target.value as any)}
                  className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white outline-none"
                >
                  <option value="order_confirmed">الگوی: تأیید سفارش خرید</option>
                  <option value="order_shipped">الگوی: ارسال کالا و شماره بارنامه</option>
                  <option value="inquiry_reply">الگوی: صدور پیش‌فاکتور و پاسخ استعلام</option>
                  <option value="receipt_rejected">الگوی: رد فیش واریزی</option>
                </select>

                <button
                  type="submit"
                  className="w-full h-8 rounded-lg bg-[#55565A] text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-[#E06518]" />
                  <span>ارسال پیامک تستی</span>
                </button>

                {isTestSmsSent && (
                  <div className="text-emerald-700 font-bold text-center">
                    ✓ پیامک با موفقیت در صف لاگ قرار گرفت!
                  </div>
                )}
              </form>
            </div>

            {/* Recent SMS Logs */}
            <div className="space-y-2 pt-2">
              <div className="font-bold text-xs text-slate-700">آخرین پیامک‌های ارسالی وب‌سرویس:</div>
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">گیرنده</th>
                      <th className="py-2.5 px-3">الگو</th>
                      <th className="py-2.5 px-3">متن پیامک ارسالی</th>
                      <th className="py-2.5 px-3">تاریخ و زمان</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {smsLogs.slice(0, 5).map(log => (
                      <tr key={log.id}>
                        <td className="py-2 px-3 font-bold text-[#55565A]">{log.to}</td>
                        <td className="py-2 px-3 text-slate-500">{log.template}</td>
                        <td className="py-2 px-3 font-sans text-slate-800 text-[11px]">{log.message}</td>
                        <td className="py-2 px-3 text-slate-400 text-[10px]">{log.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: AUDIT LOG --- */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-[#55565A]">
                <th className="py-3.5 px-4">کاربر مجری</th>
                <th className="py-3.5 px-4">عنوان اقدام</th>
                <th className="py-3.5 px-4">هدف تغییر</th>
                <th className="py-3.5 px-4">شرح تفصیلی</th>
                <th className="py-3.5 px-4">زمان ثبت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-[#55565A]">{log.userName}</td>
                  <td className="py-3 px-4 font-bold text-[#C95210]">{log.action}</td>
                  <td className="py-3 px-4 font-mono text-slate-700">{log.target}</td>
                  <td className="py-3 px-4 text-slate-600">{log.details}</td>
                  <td className="py-3 px-4 text-slate-400 font-mono">{log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- TAB 4: BACKUP & RESTORE --- */}
      {activeTab === 'backup' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 text-center max-w-xl mx-auto">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Database className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-base font-black text-[#55565A]">پشتیبان‌گیری کامل و بازنشانی داده‌ها</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              شما می‌توانید تمام کاتالوگ، مشتریان، تاریخچه قیمت‌ها، سفارشات و تنظیمات سامانه را به صورت فایل JSON استخراج کرده یا در صورت نیاز به دیتای پیش‌فرض بازگردانید.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-[#55565A] hover:bg-[#1B293E] text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4 text-[#E06518]" />
              <span>دانلود فایل کامل پشتیبان (JSON)</span>
            </button>

            <button
              type="button"
              onClick={handleResetData}
              className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>بازیابی داده‌های اولیه سامانه</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
