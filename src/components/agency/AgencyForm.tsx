import React, { useState } from 'react';
import {
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  Users,
  TrendingUp,
  UploadCloud,
  FileCheck,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { agencyService } from '../../services/agencyService';
import { AgencyApplication } from '../../types';
import { toPersianDigits } from '../../utils/formatters';

interface AgencyFormProps {
  onSuccess: (application: AgencyApplication) => void;
}

const PROVINCES = [
  'یزد',
  'اصفهان',
  'تهران',
  'فارس',
  'خراسان رضوی',
  'خوزستان',
  'آذربایجان شرقی',
  'کرمان',
  'قم',
  'مازندران',
  'البرز',
  'گیلان',
  'مرکزی',
  'قزوین',
  'سمنان',
  'سایر استان‌ها',
];

const ACTIVITY_OPTIONS = [
  { id: 'کاشی و سرامیک', label: 'صنایع کاشی و سرامیک (کوره‌ها، لعاب و بسته‌بندی)' },
  { id: 'نساجی', label: 'ماشین‌آلات نساجی و ریسندگی/بافندگی' },
  { id: 'عمده‌فروشی تسمه', label: 'عمده‌فروشی و فروشگاه تخصصی انواع تسمه صنعتی' },
  { id: 'تأمین قطعات کارخانجات', label: 'تأمین قطعات فنی کارخانجات و صنایع مادر' },
  { id: 'سایر', label: 'سایر صنایع و تجهیزات انتقال قدرت' },
];

const MONTHLY_VOLUMES = [
  { id: 'کمتر از ۵۰ میلیون تومان', label: 'کمتر از ۵۰ میلیون تومان در ماه' },
  { id: '۵۰ تا ۱۰۰ میلیون تومان', label: '۵۰ تا ۱۰۰ میلیون تومان در ماه' },
  { id: '۱۰۰ تا ۲۵۰ میلیون تومان', label: '۱۰۰ تا ۲۵۰ میلیون تومان در ماه' },
  { id: 'بالای ۲۵۰ میلیون تومان', label: 'بالای ۲۵۰ میلیون تومان در ماه (عاملیت کلان)' },
];

export const AgencyForm: React.FC<AgencyFormProps> = ({ onSuccess }) => {
  // Form state
  const [companyName, setCompanyName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [nationalCode, setNationalCode] = useState('');
  const [phone, setPhone] = useState('');
  const [tel, setTel] = useState('');
  const [email, setEmail] = useState('');
  const [province, setProvince] = useState('یزد');
  const [city, setCity] = useState('یزد');
  const [fullAddress, setFullAddress] = useState('');
  const [activityFields, setActivityFields] = useState<string[]>(['عمده‌فروشی تسمه']);
  const [activityYears, setActivityYears] = useState<number>(5);
  const [personnelCount, setPersonnelCount] = useState<number>(4);
  const [monthlyVolume, setMonthlyVolume] = useState('۱۰۰ تا ۲۵۰ میلیون تومان');
  const [cooperationType, setCooperationType] = useState<'sales_agency' | 'regional_distributor' | 'wholesale_distributor'>('sales_agency');
  const [notes, setNotes] = useState('');

  // Document mock upload state
  const [uploadedDoc, setUploadedDoc] = useState<{
    fileName: string;
    fileSize: string;
    previewUrl?: string;
  } | null>({
    fileName: 'parvaneh_kasb_sample.jpg',
    fileSize: '۱.۸ مگابایت',
    previewUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80',
  });

  // Mock OTP verification
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toggle activity checkbox
  const handleToggleActivity = (fieldId: string) => {
    setActivityFields(prev =>
      prev.includes(fieldId) ? prev.filter(f => f !== fieldId) : [...prev, fieldId]
    );
  };

  // Mock OTP Send
  const handleSendOtp = () => {
    const cleanPhone = phone.trim();
    if (!cleanPhone || !/^09\d{9}$/.test(cleanPhone)) {
      setErrors(prev => ({ ...prev, phone: 'شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود.' }));
      return;
    }
    setErrors(prev => {
      const copy = { ...prev };
      delete copy.phone;
      return copy;
    });
    setIsOtpSent(true);
    setOtpCode('');
    setOtpError('');
  };

  const handleVerifyOtp = () => {
    if (otpCode.trim() === '1234' || otpCode.trim().length === 4) {
      setIsPhoneVerified(true);
      setIsOtpSent(false);
      setOtpError('');
    } else {
      setOtpError('کد وارد شده نامعتبر است (کد تستی: ۱۲۳۴)');
    }
  };

  // Mock File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setUploadedDoc({
        fileName: file.name,
        fileSize: `${toPersianDigits(sizeMb)} مگابایت`,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const errs: Record<string, string> = {};

    if (!companyName.trim()) {
      errs.companyName = 'نام شرکت، واحد صنفی یا نام فروشگاه الزامی است.';
    }
    if (!managerName.trim()) {
      errs.managerName = 'نام و نام خانوادگی مدیر یا مالک الزامی است.';
    }
    if (!nationalCode.trim() || !/^\d{10}$/.test(nationalCode.trim())) {
      errs.nationalCode = 'کد ملی باید دقیقاً ۱۰ رقم عددی باشد.';
    }
    if (!phone.trim() || !/^09\d{9}$/.test(phone.trim())) {
      errs.phone = 'شماره همراه نامعتبر است (مثال: 09131512345).';
    }
    if (!tel.trim()) {
      errs.tel = 'تلفن ثابت واحد صنفی با پیش‌شماره الزامی است.';
    }
    if (!fullAddress.trim()) {
      errs.fullAddress = 'نشانی پستی دقیق واحد صنفی یا انبار الزامی است.';
    }
    if (activityFields.length === 0) {
      errs.activityFields = 'حداقل یکی از حوزه‌های فعالیت را انتخاب کنید.';
    }
    if (!uploadedDoc) {
      errs.licenseDocument = 'بارگذاری تصویر پروانه کسب یا جواز فعالیت الزامی است.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      window.scrollTo({ top: 400, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const newApp = agencyService.submitApplication({
        companyName: companyName.trim(),
        managerName: managerName.trim(),
        nationalCode: nationalCode.trim(),
        phone: phone.trim(),
        tel: tel.trim(),
        email: email.trim() || undefined,
        province,
        city: city.trim(),
        fullAddress: fullAddress.trim(),
        activityFields,
        activityYears: Number(activityYears) || 1,
        personnelCount: Number(personnelCount) || 1,
        monthlyVolume,
        cooperationType,
        licenseDocument: uploadedDoc || undefined,
        notes: notes.trim() || undefined,
      });

      setIsSubmitting(false);
      onSuccess(newApp);
    }, 600);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 text-right">
      {/* 1. SECTION: مشخصات شرکت و نوع همکاری */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-[#55565A]">
          <Building className="w-5 h-5 text-[#E06518]" />
          <h3 className="font-black text-sm">۱. مشخصات شرکت / واحد صنفی و نوع همکاری</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#55565A]">
              نام شرکت / فروشگاه / واحد صنفی <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="مثال: بازرگانی قطعات صنعتی پارس کویر"
              className={`w-full h-11 px-3.5 rounded-xl border text-xs sm:text-sm text-[#55565A] focus:outline-none focus:border-[#E06518] ${
                errors.companyName ? 'border-red-500 bg-red-50/30' : 'border-slate-200'
              }`}
            />
            {errors.companyName && <p className="text-[11px] text-red-600">{errors.companyName}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#55565A]">
              نوع همکاری درخواستی <span className="text-red-500">*</span>
            </label>
            <select
              value={cooperationType}
              onChange={e => setCooperationType(e.target.value as any)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-[#55565A] focus:outline-none focus:border-[#E06518] bg-white cursor-pointer"
            >
              <option value="sales_agency">نمایندگی انحصاری فروش (برندهای SWR و FORZA)</option>
              <option value="regional_distributor">پخش منطقه‌ای و استانی (تأمین کارخانجات)</option>
              <option value="wholesale_distributor">عاملیت توزیع قطعات کوره و تسمه صنعتی</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#55565A]">
              سابقه فعالیت صنفی (سال) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="80"
                value={activityYears}
                onChange={e => setActivityYears(Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-[#55565A] focus:outline-none focus:border-[#E06518]"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                سال
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#55565A]">تعداد پرسنل فعال شاغل</label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="500"
                value={personnelCount}
                onChange={e => setPersonnelCount(Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-[#55565A] focus:outline-none focus:border-[#E06518]"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                نفر
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SECTION: مشخصات مدیر / مالک */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-[#55565A]">
          <User className="w-5 h-5 text-[#E06518]" />
          <h3 className="font-black text-sm">۲. مشخصات مدیر / مالک و احراز هویت</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#55565A]">
              نام و نام خانوادگی مدیر/مالک <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={managerName}
              onChange={e => setManagerName(e.target.value)}
              placeholder="مثال: مهندس محمدرضا زارع"
              className={`w-full h-11 px-3.5 rounded-xl border text-xs sm:text-sm text-[#55565A] focus:outline-none focus:border-[#E06518] ${
                errors.managerName ? 'border-red-500 bg-red-50/30' : 'border-slate-200'
              }`}
            />
            {errors.managerName && <p className="text-[11px] text-red-600">{errors.managerName}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#55565A]">
              کد ملی ۱۰ رقمی مدیر <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              maxLength={10}
              value={nationalCode}
              onChange={e => setNationalCode(e.target.value.replace(/\D/g, ''))}
              placeholder="۴۴۳۰۱۲۹۸۷۱"
              className={`w-full h-11 px-3.5 rounded-xl border text-xs sm:text-sm text-[#55565A] font-mono focus:outline-none focus:border-[#E06518] ${
                errors.nationalCode ? 'border-red-500 bg-red-50/30' : 'border-slate-200'
              }`}
            />
            {errors.nationalCode && (
              <p className="text-[11px] text-red-600">{errors.nationalCode}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#55565A]">
              شماره همراه (جهت دریافت پیامک و OTP) <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                maxLength={11}
                value={phone}
                disabled={isPhoneVerified}
                onChange={e => setPhone(e.target.value)}
                placeholder="09131512345"
                className={`flex-1 h-11 px-3.5 rounded-xl border text-xs sm:text-sm font-mono text-[#55565A] focus:outline-none focus:border-[#E06518] ${
                  isPhoneVerified
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : errors.phone
                    ? 'border-red-500 bg-red-50/30'
                    : 'border-slate-200'
                }`}
              />
              {!isPhoneVerified ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="px-3.5 h-11 bg-orange-100 hover:bg-orange-200 text-[#C95210] text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer"
                >
                  تأیید OTP ماک
                </button>
              ) : (
                <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs px-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأیید شد</span>
                </span>
              )}
            </div>
            {errors.phone && <p className="text-[11px] text-red-600">{errors.phone}</p>}

            {/* OTP Mock Input Row */}
            {isOtpSent && !isPhoneVerified && (
              <div className="p-3 mt-2 rounded-xl bg-orange-50 border border-orange-200 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#55565A]">
                    کد تأیید پیامک‌شده به {phone} را وارد کنید:
                  </span>
                  <span className="text-orange-700 font-mono font-bold">(کد تست: ۱۲۳۴)</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={4}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    placeholder="۱۲۳۴"
                    className="w-28 h-9 text-center font-mono text-base font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#E06518]"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    className="px-4 h-9 bg-[#E06518] hover:bg-[#C95210] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    ثبت کد
                  </button>
                </div>
                {otpError && <p className="text-[11px] text-red-600 font-bold">{otpError}</p>}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#55565A]">
              تلفن ثابت واحد صنفی با پیش‌شماره <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={tel}
              onChange={e => setTel(e.target.value)}
              placeholder="مثال: ۰۳۵-۳۷۲۵۴۰۰۰"
              className={`w-full h-11 px-3.5 rounded-xl border text-xs sm:text-sm font-mono text-[#55565A] focus:outline-none focus:border-[#E06518] ${
                errors.tel ? 'border-red-500 bg-red-50/30' : 'border-slate-200'
              }`}
            />
            {errors.tel && <p className="text-[11px] text-red-600">{errors.tel}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#55565A]">آدرس ایمیل کاری (اختیاری)</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="info@yourcompany.ir"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-[#55565A] focus:outline-none focus:border-[#E06518]"
            />
          </div>
        </div>
      </div>

      {/* 3. SECTION: موقعیت جغرافیایی و آدرس انبار */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-[#55565A]">
          <MapPin className="w-5 h-5 text-[#E06518]" />
          <h3 className="font-black text-sm">۳. موقعیت جغرافیایی، شهر و نشانی انبار</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#55565A]">
              استان <span className="text-red-500">*</span>
            </label>
            <select
              value={province}
              onChange={e => setProvince(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-[#55565A] focus:outline-none focus:border-[#E06518] bg-white cursor-pointer"
            >
              {PROVINCES.map(p => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-[#55565A]">
              شهر / منطقه صنعتی <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="مثال: یزد - شهرک صنعتی جهان‌آباد میبد"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-[#55565A] focus:outline-none focus:border-[#E06518]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#55565A]">
            آدرس پستی کامل فروشگاه / انبار مرکزی <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={2}
            value={fullAddress}
            onChange={e => setFullAddress(e.target.value)}
            placeholder="خیابان، پلاک، طبقه یا مختصات سوله انبار جهت تحویل باربری"
            className={`w-full p-3.5 rounded-xl border text-xs sm:text-sm text-[#55565A] focus:outline-none focus:border-[#E06518] ${
              errors.fullAddress ? 'border-red-500 bg-red-50/30' : 'border-slate-200'
            }`}
          />
          {errors.fullAddress && <p className="text-[11px] text-red-600">{errors.fullAddress}</p>}
        </div>
      </div>

      {/* 4. SECTION: حوزه فعالیت و حجم خرید */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-[#55565A]">
          <Briefcase className="w-5 h-5 text-[#E06518]" />
          <h3 className="font-black text-sm">۴. حوزه فعالیت و حجم خرید ماهانه مورد انتظار</h3>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-[#55565A]">
            حوزه‌های اصلی فعالیت (چندین مورد قابل انتخاب است) <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {ACTIVITY_OPTIONS.map(opt => {
              const isChecked = activityFields.includes(opt.id);
              return (
                <label
                  key={opt.id}
                  onClick={() => handleToggleActivity(opt.id)}
                  className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${
                    isChecked
                      ? 'bg-orange-50/80 border-[#E06518] text-[#55565A]'
                      : 'bg-slate-50/60 border-slate-200 text-[#777A7D] hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="w-4 h-4 accent-[#E06518] cursor-pointer"
                  />
                  <span className="text-xs font-bold">{opt.label}</span>
                </label>
              );
            })}
          </div>
          {errors.activityFields && (
            <p className="text-[11px] text-red-600 font-bold">{errors.activityFields}</p>
          )}
        </div>

        <div className="space-y-2 pt-2">
          <label className="text-xs font-bold text-[#55565A]">
            حجم خرید ماهانه برآوردشده از هایپر صنعت <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {MONTHLY_VOLUMES.map(v => {
              const isSelected = monthlyVolume === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setMonthlyVolume(v.id)}
                  className={`p-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#55565A] text-[#E06518] border-[#55565A] shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-[#777A7D] hover:bg-slate-100'
                  }`}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. SECTION: بارگذاری مدارک (پروانه کسب یا جواز) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-[#55565A]">
            <UploadCloud className="w-5 h-5 text-[#E06518]" />
            <h3 className="font-black text-sm">۵. بارگذاری مدارک شناسایی و جواز کسب</h3>
          </div>
          <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            فرمت‌های مجاز: JPG, PNG, PDF
          </span>
        </div>

        {uploadedDoc ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {uploadedDoc.previewUrl ? (
                <img
                  src={uploadedDoc.previewUrl}
                  alt="پیش‌نمایش سند"
                  className="w-14 h-14 rounded-lg object-cover border border-slate-200 shadow-xs"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-orange-100 text-[#C95210] flex items-center justify-center font-bold text-xs">
                  PDF
                </div>
              )}
              <div className="space-y-0.5 text-right">
                <div className="flex items-center gap-1.5 font-bold text-xs text-[#55565A]">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>{uploadedDoc.fileName}</span>
                </div>
                <span className="text-[11px] text-[#777A7D]">حجم فایل: {uploadedDoc.fileSize}</span>
                <div className="text-[10px] text-emerald-600 font-semibold">
                  مدرک با موفقیت بارگذاری شد و آماده ارزیابی است.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setUploadedDoc(null)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-xs cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف و بارگذاری مجدد</span>
            </button>
          </div>
        ) : (
          <label className="border-2 border-dashed border-slate-300 hover:border-[#E06518] bg-slate-50/50 hover:bg-orange-50/20 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center">
            <UploadCloud className="w-10 h-10 text-[#E06518]" />
            <span className="font-bold text-sm text-[#55565A]">
              تصویر پروانه کسب یا روزنامه رسمی شرکت را اینجا بکشید یا کلیک کنید
            </span>
            <span className="text-xs text-[#777A7D]">
              حداکثر حجم فایل: ۱۰ مگابایت (جهت تأیید هویت صنفی)
            </span>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
        {errors.licenseDocument && (
          <p className="text-[11px] text-red-600 font-bold">{errors.licenseDocument}</p>
        )}
      </div>

      {/* 6. SECTION: توضیحات تکمیلی */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-3">
        <label className="text-xs font-bold text-[#55565A]">
          توضیحات تکمیلی، بازار هدف یا درخواست سهمیه خاص (اختیاری)
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="اگر مشتریان بالقوه، کارخانجات تحت پوشش یا درخواست نمایندگی شهر خاصی دارید، اینجا قید بفرمایید..."
          className="w-full p-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-[#55565A] focus:outline-none focus:border-[#E06518]"
        />
      </div>

      {/* SUBMIT BUTTON */}
      <div className="bg-[#55565A] rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-right">
          <div className="flex items-center gap-2 text-[#E06518] font-bold text-sm">
            <ShieldCheck className="w-5 h-5" />
            <span>ثبت نهایی و دریافت آنی کد رهگیری</span>
          </div>
          <p className="text-xs text-slate-300">
            اطلاعات شما محرمانه نزد واحد امور نمایندگی‌های بازرگانی اطلس یزد محفوظ خواهد بود.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto px-8 py-3.5 bg-[#E06518] hover:bg-[#C95210] text-white font-black text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
        >
          {isSubmitting ? (
            <span>در حال ارسال درخواست...</span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>ارسال درخواست نمایندگی</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
