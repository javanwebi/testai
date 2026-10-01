import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  Check,
  X,
  RefreshCw,
  MoveUp,
  MoveDown,
  Sparkles,
  Eye,
  Play,
  Pause,
  Clock,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import { clientService, ClientLogo } from '../../services/clientService';
import { toPersianDigits } from '../../utils/formatters';

export const ClientsAdminModule: React.FC = () => {
  const [clients, setClients] = useState<ClientLogo[]>(() => clientService.getAllClients());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientLogo | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEnglishName, setFormEnglishName] = useState('');
  const [formIndustry, setFormIndustry] = useState('کاشی و سرامیک');
  const [formLogo, setFormLogo] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  const [formSince, setFormSince] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [logoInputMode, setLogoInputMode] = useState<'upload' | 'url'>('upload');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Refresh from service
  const refreshList = () => {
    setClients(clientService.getAllClients());
  };

  useEffect(() => {
    const unsub = clientService.subscribe(refreshList);
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Open modal to add new client
  const handleOpenAddModal = () => {
    setEditingClient(null);
    setFormName('');
    setFormEnglishName('');
    setFormIndustry('کاشی و سرامیک');
    setFormLogo('');
    setFormWebsite('');
    setFormSince(new Date().getFullYear().toString());
    setFormNotes('');
    setFormIsActive(true);
    setLogoInputMode('upload');
    setIsAddModalOpen(true);
  };

  // Open modal to edit existing client
  const handleOpenEditModal = (client: ClientLogo) => {
    setEditingClient(client);
    setFormName(client.name);
    setFormEnglishName(client.englishName || '');
    setFormIndustry(client.industry);
    setFormLogo(client.logo);
    setFormWebsite(client.website || '');
    setFormSince(client.since || '');
    setFormNotes(client.notes || '');
    setFormIsActive(client.isActive);
    setLogoInputMode(client.logo.startsWith('data:') ? 'upload' : 'url');
    setIsAddModalOpen(true);
  };

  // Handle File Upload (Convert to Base64 data URI)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('لطفاً یک فایل تصویری (PNG, JPG, SVG, WebP) انتخاب کنید.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('حجم فایل نباید بیشتر از ۲ مگابایت باشد.');
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const result = event.target?.result as string;
      if (result) {
        setFormLogo(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save (Add or Update)
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('لطفاً نام شرکت یا مشتری را وارد کنید.');
      return;
    }
    if (!formLogo.trim()) {
      alert('لطفاً لوگوی مشتری را آپلود کرده یا آدرس تصویر را وارد نمایید.');
      return;
    }

    if (editingClient) {
      clientService.updateClient(editingClient.id, {
        name: formName.trim(),
        englishName: formEnglishName.trim() || undefined,
        industry: formIndustry.trim(),
        logo: formLogo.trim(),
        website: formWebsite.trim() || undefined,
        since: formSince.trim() || undefined,
        notes: formNotes.trim() || undefined,
        isActive: formIsActive,
      });
      showToast('اطلاعات مشتری با موفقیت به‌روزرسانی شد');
    } else {
      clientService.addClient({
        name: formName.trim(),
        englishName: formEnglishName.trim() || undefined,
        industry: formIndustry.trim(),
        logo: formLogo.trim(),
        website: formWebsite.trim() || undefined,
        since: formSince.trim() || undefined,
        notes: formNotes.trim() || undefined,
        isActive: formIsActive,
        order: clients.length + 1,
      });
      showToast('مشتری جدید با موفقیت اضافه شد');
    }

    setIsAddModalOpen(false);
    refreshList();
  };

  // Toggle active status
  const handleToggleActive = (id: string, current: boolean) => {
    clientService.updateClient(id, { isActive: !current });
    refreshList();
    showToast(current ? 'مشتری غیرفعال شد' : 'مشتری در اسلایدر فعال شد');
  };

  // Delete client
  const handleDelete = (id: string, name: string) => {
    if (confirm(`آیا از حذف لوگوی «${name}» اطمینان دارید؟`)) {
      clientService.deleteClient(id);
      refreshList();
      showToast(`مشتری «${name}» با موفقیت حذف شد`);
    }
  };

  // Move Up / Down in order
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= clients.length) return;

    const newOrder = [...clients];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);

    clientService.reorderClients(newOrder.map(c => c.id));
    refreshList();
  };

  // Reset to default Iranian industrial giants
  const handleResetDefaults = () => {
    if (confirm('آیا مایلید لیست مشتریان را به نمونه‌های پیش‌فرض بازنشانی کنید؟')) {
      clientService.resetToDefaults();
      refreshList();
      showToast('لیست مشتریان به حالت اولیه بازنشانی شد');
    }
  };

  const activeCount = clients.filter(c => c.isActive).length;

  return (
    <div className="space-y-6 text-right font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-[#55565A] text-white px-5 py-3 rounded-xl border border-orange-500 shadow-2xl flex items-center gap-3 animate-fade-in">
          <Sparkles className="w-5 h-5 text-[#E06518]" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-[#E06518] flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#55565A]">مدیریت لوگوی مشتریان ما</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                تنظیم لوگوها و شرکت‌های صنعتی همکار در اسلایدر ۳ ثانیه‌ای صفحه اصلی
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>بازنشانی پیش‌فرض</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="h-10 px-5 bg-[#E06518] hover:bg-[#C95210] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-orange-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن مشتری جدید</span>
          </button>
        </div>
      </div>

      {/* Info & Settings Notice */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200/80 p-4.5 flex items-start gap-3.5">
        <Clock className="w-5 h-5 text-[#E06518] shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-700 leading-relaxed">
          <p className="font-bold text-[#55565A]">
            رفتار اسلایدر مشتریان در صفحه اصلی:
          </p>
          <p>
            لوگوها به صورت خودکار <strong>هر ۳ ثانیه یک‌بار به سمت چپ</strong> حرکت می‌کنند. با قرار دادن اشاره‌گر ماوس روی لوگوها، اسلایدر موقتاً متوقف شده و به کاربر امکان بررسی دقیق‌تر داده می‌شود.
            (تعداد کل مشتریان: {toPersianDigits(clients.length)} | فعال در اسلایدر: {toPersianDigits(activeCount)})
          </p>
        </div>
      </div>

      {/* Clients Grid / Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-sm text-[#55565A]">
            لیست مشتریان ثبت‌شده ({toPersianDigits(clients.length)})
          </h2>
          <span className="text-xs text-slate-400">
            برای تغییر اولویت نمایش از دکمه‌های بالا / پایین استفاده کنید
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {clients.map((client, index) => (
            <div
              key={client.id}
              className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors ${
                !client.isActive ? 'opacity-60 bg-slate-50/50' : ''
              }`}
            >
              {/* Left Side (in RTL, Right side visually): Logo & Info */}
              <div className="flex items-center gap-4">
                {/* Order Badge & Move Buttons */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMove(index, 'up')}
                    className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                    title="انتقال به بالا"
                  >
                    <MoveUp className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-bold font-mono text-slate-500">
                    #{toPersianDigits(index + 1)}
                  </span>
                  <button
                    type="button"
                    disabled={index === clients.length - 1}
                    onClick={() => handleMove(index, 'down')}
                    className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                    title="انتقال به پایین"
                  >
                    <MoveDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Logo Image Preview */}
                <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-2 shrink-0 overflow-hidden shadow-inner">
                  <img
                    src={client.logo}
                    alt={client.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                {/* Text Metadata */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-[#55565A]">{client.name}</h3>
                    {client.englishName && (
                      <span className="text-xs text-slate-400 font-mono hidden md:inline">
                        ({client.englishName})
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 font-medium text-[11px] border border-orange-200/60">
                      {client.industry}
                    </span>
                    {client.since && (
                      <span className="text-slate-400 text-[11px]">
                        همکاری از {toPersianDigits(client.since)}
                      </span>
                    )}
                    {client.notes && (
                      <span className="text-slate-400 text-[11px] hidden lg:inline line-clamp-1 max-w-xs">
                        • {client.notes}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                {/* Active Switch */}
                <button
                  type="button"
                  onClick={() => handleToggleActive(client.id, client.isActive)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    client.isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-200 text-slate-600 border border-slate-300 hover:bg-slate-300'
                  }`}
                  title={client.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                >
                  {client.isActive ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>فعال</span>
                    </>
                  ) : (
                    <>
                      <X className="w-3.5 h-3.5" />
                      <span>غیرفعال</span>
                    </>
                  )}
                </button>

                {/* Edit */}
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(client)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-[#E06518] text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                  title="ویرایش مشتری"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleDelete(client.id, client.name)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {clients.length === 0 && (
            <div className="p-12 text-center space-y-3">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-600">هنوز مشتری‌ای ثبت نشده است</p>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-xs text-[#E06518] font-bold hover:underline"
              >
                بارگذاری نمونه‌های پیش‌فرض کارخانجات
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5 text-right">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="space-y-0.5">
                <h3 className="font-black text-lg text-[#55565A]">
                  {editingClient ? 'ویرایش اطلاعات مشتری' : 'افزودن لوگوی مشتری جدید'}
                </h3>
                <p className="text-xs text-slate-500">
                  لوگوی وارد شده در اسلایدر متحرک صفحه اصلی نمایش داده خواهد شد
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Company Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نام شرکت / کارخانه صنعتی <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مجتمع کاشی مرجان، فولاد هرمزگان، سیمان سپاهان"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 focus:border-[#E06518] focus:ring-1 focus:ring-[#E06518] text-xs sm:text-sm"
                />
              </div>

              {/* English Name (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نام لاتین (اختیاری)
                </label>
                <input
                  type="text"
                  placeholder="مثال: Marjan Tile Co. / Hormozgan Steel"
                  value={formEnglishName}
                  onChange={e => setFormEnglishName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 focus:border-[#E06518] focus:ring-1 focus:ring-[#E06518] text-xs sm:text-sm font-mono text-left"
                  dir="ltr"
                />
              </div>

              {/* Industry Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  حوزه فعالیت / صنعت <span className="text-red-500">*</span>
                </label>
                <select
                  value={formIndustry}
                  onChange={e => setFormIndustry(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 focus:border-[#E06518] focus:ring-1 focus:ring-[#E06518] text-xs sm:text-sm bg-white"
                >
                  <option value="کاشی و سرامیک">کاشی و سرامیک</option>
                  <option value="فولاد و متالورژی">فولاد و متالورژی</option>
                  <option value="صنعت سیمان">صنعت سیمان</option>
                  <option value="صنعت نساجی">صنعت نساجی</option>
                  <option value="صنایع پتروشیمی">صنایع پتروشیمی و پالایشگاه</option>
                  <option value="دارویی و بهداشتی">دارویی و بهداشتی</option>
                  <option value="صنایع غذایی و تبدیلی">صنایع غذایی و تبدیلی</option>
                  <option value="خودرو و قطعه‌سازی">خودرو و قطعه‌سازی</option>
                  <option value="معدن و فرآوری مواد">معدن و فرآوری مواد</option>
                  <option value="صنایع بسته‌بندی">صنایع بسته‌بندی و چاپ</option>
                </select>
              </div>

              {/* Logo Selection Method (Upload vs URL) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">
                    تصویر لوگو <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg text-xs">
                    <button
                      type="button"
                      onClick={() => setLogoInputMode('upload')}
                      className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        logoInputMode === 'upload'
                          ? 'bg-white shadow-xs text-[#E06518]'
                          : 'text-slate-600'
                      }`}
                    >
                      آپلود عکس
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoInputMode('url')}
                      className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        logoInputMode === 'url'
                          ? 'bg-white shadow-xs text-[#E06518]'
                          : 'text-slate-600'
                      }`}
                    >
                      لینک تصویر
                    </button>
                  </div>
                </div>

                {logoInputMode === 'upload' ? (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-slate-300 hover:border-[#E06518] rounded-2xl p-4 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-orange-50/20"
                    >
                      <Upload className="w-7 h-7 text-slate-400 mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-slate-700">
                        کلیک کنید یا تصویر لوگو را اینجا رها کنید
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        فرمت‌های PNG، JPG، WebP یا SVG (حداکثر ۲ مگابایت)
                      </p>
                    </div>
                  </div>
                ) : (
                  <input
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={formLogo}
                    onChange={e => setFormLogo(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-300 focus:border-[#E06518] focus:ring-1 focus:ring-[#E06518] text-xs sm:text-sm font-mono text-left"
                    dir="ltr"
                  />
                )}

                {/* Logo Live Preview */}
                {formLogo && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-32 rounded-lg bg-[#12203C] flex items-center justify-center p-2 overflow-hidden shadow-inner">
                        <img
                          src={formLogo}
                          alt="پیش‌نمایش"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-slate-300 font-medium block">پیش‌نمایش لوگو در پس‌زمینه تیره</span>
                        <span className="text-[11px] text-slate-400 block">ابعاد بهینه برای نمایش انواع لوگوهای عمودی و افقی</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormLogo('')}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      حذف تصویر
                    </button>
                  </div>
                )}
              </div>

              {/* Year of Cooperation & Website */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    سال شروع همکاری (اختیاری)
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: ۱۳۹۶"
                    value={formSince}
                    onChange={e => setFormSince(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-300 focus:border-[#E06518] focus:ring-1 focus:ring-[#E06518] text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    وب‌سایت کارخانه (اختیاری)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formWebsite}
                    onChange={e => setFormWebsite(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-300 focus:border-[#E06518] focus:ring-1 focus:ring-[#E06518] text-xs sm:text-sm font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Notes / Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  یادداشت یا قطعات تأمین‌شده (اختیاری)
                </label>
                <input
                  type="text"
                  placeholder="مثال: تأمین تسمه‌های تایمینگ و پولی‌های خط بسته‌بندی"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 focus:border-[#E06518] focus:ring-1 focus:ring-[#E06518] text-xs sm:text-sm"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="client-active-toggle"
                  checked={formIsActive}
                  onChange={e => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#E06518] focus:ring-[#E06518]"
                />
                <label htmlFor="client-active-toggle" className="text-xs font-bold text-slate-700 cursor-pointer">
                  نمایش در اسلایدر صفحه اصلی
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="h-11 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="h-11 px-7 bg-[#E06518] hover:bg-[#C95210] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {editingClient ? 'ذخیره تغییرات' : 'افزودن به مشتریان'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
