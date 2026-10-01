import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Check,
  FileText,
  Percent,
  Sliders,
  Sparkles,
  Info,
  XCircle,
  Clock,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { adminService, ImportPreviewRow, ImportResultReport } from '../../services/adminService';
import { formatPrice, toPersianDigits } from '../../utils/formatters';

interface BulkImportModuleProps {
  onGoToProducts?: () => void;
  onGoToPriceHistory?: () => void;
}

export const BulkImportModule: React.FC<BulkImportModuleProps> = ({
  onGoToProducts,
  onGoToPriceHistory,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Input text / file
  const [rawText, setRawText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');

  // Step 2: Mapping & Multipliers
  const [multipliers, setMultipliers] = useState({
    retailPercent: 35, // +35%
    wholesalePercent: 18, // +18%
    agencyPercent: 8, // +8%
  });
  const [recordPriceHistory, setRecordPriceHistory] = useState(true);

  // Step 3: Preview Data
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([]);
  const [previewFilter, setPreviewFilter] = useState<'all' | 'new' | 'update' | 'error'>('all');

  // Step 4: Final Execution Report
  const [report, setReport] = useState<ImportResultReport | null>(null);

  // Load sample file button
  const handleLoadSample = () => {
    const sample = adminService.getSampleCsvText();
    setRawText(sample);
    setFileName('لیست_قیمت_شهریور_۱۴۰۳_تسمه_اطلس.csv');
  };

  // Handle local file read
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) setRawText(content);
    };
    reader.readAsText(file);
  };

  // Move from Step 1 to Step 2
  const handleProceedToMapping = () => {
    if (!rawText.trim()) {
      alert('لطفاً ابتدا یک فایل CSV بارگذاری کرده یا متن آن را در کادر وارد فرمایید.');
      return;
    }
    setCurrentStep(2);
  };

  // Move from Step 2 to Step 3 (Parse and calculate)
  const handleGeneratePreview = () => {
    const baseRows = adminService.parseAndPreviewCsv(rawText);
    if (baseRows.length === 0) {
      alert('هیچ ردیف معتبری در متن وارد شده یافت نشد. لطفاً قالب فایل را بررسی نمایید.');
      return;
    }

    // Recalculate based on current step 2 custom multipliers
    const adjusted = baseRows.map(row => {
      const retail = Math.round(row.basePrice * (1 + multipliers.retailPercent / 100));
      const wholesale = Math.round(row.basePrice * (1 + multipliers.wholesalePercent / 100));
      const dealer = Math.round(row.basePrice * (1 + multipliers.agencyPercent / 100));
      return {
        ...row,
        retailPrice: retail,
        wholesalePrice: wholesale,
        dealerPrice: dealer,
      };
    });

    setPreviewRows(adjusted);
    setCurrentStep(3);
  };

  // Execute Import
  const handleExecuteImport = () => {
    if (previewRows.length === 0) return;
    const result = adminService.executeImport(previewRows);
    setReport(result);
    setCurrentStep(4);
  };

  // Filter preview table
  const filteredPreview = previewRows.filter(r => {
    if (previewFilter === 'all') return true;
    return r.status === previewFilter;
  });

  const countNew = previewRows.filter(r => r.status === 'new').length;
  const countUpdate = previewRows.filter(r => r.status === 'update').length;
  const countError = previewRows.filter(r => r.status === 'error').length;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#C95210] text-xs font-bold mb-1">
            <Sparkles className="w-4 h-4 text-[#E06518]" />
            <span>موتور هوشمند ایمپورت و همگام‌سازی اکسل کاتالوگ</span>
          </div>
          <h2 className="text-xl font-black text-[#55565A]">
            ورود گروهی کالاها و لیست قیمت ماهانه (Bulk Import)
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            به‌روزرسانی سریع صدها قلم کالا، اعمال خودکار ضرایب قیمت‌گذاری ۴ لایه، ثبت خودکار تغییرات در تاریخچه قیمت و پیشگیری از خطای رکوردهای تکراری.
          </p>
        </div>

        {/* Quick Sample Button */}
        {currentStep === 1 && (
          <button
            type="button"
            onClick={handleLoadSample}
            className="py-3 px-5 rounded-2xl bg-orange-50 hover:bg-orange-100 text-[#C95210] border border-orange-200 font-black text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-5 h-5 text-[#E06518]" />
            <span>بارگذاری نمونه اکسل «قیمت‌های این ماه»</span>
          </button>
        )}
      </div>

      {/* Stepper Progress Bar (۳ مرحله + گزارش) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="grid grid-cols-3 gap-2">
          {/* Step 1 */}
          <div
            className={`p-3 rounded-xl flex items-center gap-3 transition-colors ${
              currentStep === 1
                ? 'bg-[#55565A] text-white'
                : currentStep > 1
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-slate-50 text-slate-400'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                currentStep > 1 ? 'bg-emerald-600 text-white' : 'bg-white/20'
              }`}
            >
              {currentStep > 1 ? <Check className="w-4 h-4" /> : '۱'}
            </div>
            <div className="text-xs">
              <div className="font-bold">مرحله ۱: ورود فایل و متن</div>
              <div className="text-[10px] opacity-75">آپلود CSV یا اکسل</div>
            </div>
          </div>

          {/* Step 2 */}
          <div
            className={`p-3 rounded-xl flex items-center gap-3 transition-colors ${
              currentStep === 2
                ? 'bg-[#55565A] text-white'
                : currentStep > 2
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-slate-50 text-slate-400'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                currentStep > 2 ? 'bg-emerald-600 text-white' : 'bg-white/20'
              }`}
            >
              {currentStep > 2 ? <Check className="w-4 h-4" /> : '۲'}
            </div>
            <div className="text-xs">
              <div className="font-bold">مرحله ۲: نگاشت و ضرایب</div>
              <div className="text-[10px] opacity-75">تطبیق ستون‌ها و حاشیه سود</div>
            </div>
          </div>

          {/* Step 3 */}
          <div
            className={`p-3 rounded-xl flex items-center gap-3 transition-colors ${
              currentStep === 3
                ? 'bg-[#55565A] text-white'
                : currentStep > 3
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-slate-50 text-slate-400'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                currentStep > 3 ? 'bg-emerald-600 text-white' : 'bg-white/20'
              }`}
            >
              {currentStep > 3 ? <Check className="w-4 h-4" /> : '۳'}
            </div>
            <div className="text-xs">
              <div className="font-bold">مرحله ۳: پیش‌نمایش و اعمال</div>
              <div className="text-[10px] opacity-75">بررسی تفکیکی جدید/به‌روزرسانی</div>
            </div>
          </div>
        </div>
      </div>

      {/* --- STEP 1: UPLOAD / PASTE --- */}
      {currentStep === 1 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-black text-[#55565A]">مرحله ۱: انتخاب فایل یا چسباندن متن کاتالوگ</h3>
            <p className="text-xs text-slate-500 mt-1">
              می‌توانید فایل با پسوند CSV یا Excel اکسپورت‌شده را آپلود کرده یا محتوای آن را مستقیماً در کادر زیر جای‌گذاری نمایید.
            </p>
          </div>

          {/* File Upload Zone */}
          <div className="border-2 border-dashed border-slate-300 hover:border-[#E06518] rounded-3xl p-8 text-center bg-slate-50/50 transition-colors relative">
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-100 text-[#C95210] flex items-center justify-center mb-3">
              <Upload className="w-7 h-7 text-[#E06518]" />
            </div>
            <div className="text-sm font-bold text-[#55565A]">
              فایل CSV یا اکسل را به اینجا بکشید یا برای انتخاب کلیک کنید
            </div>
            <div className="text-xs text-slate-400 mt-1">
              فرمت پشتیبانی شده: CSV با جداکننده کاما یا تب (UTF-8)
            </div>
            {fileName && (
              <div className="mt-4 inline-flex items-center gap-2 py-1.5 px-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold font-mono">
                <Check className="w-4 h-4" />
                <span>فایل انتخاب‌شده: {fileName}</span>
              </div>
            )}
          </div>

          {/* Or Paste Raw Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#55565A]">یا چسباندن متن مستقیم CSV در کادر:</label>
              <button
                type="button"
                onClick={handleLoadSample}
                className="text-xs text-[#C95210] hover:underline font-bold"
              >
                بارگذاری داده‌های نمونه تست
              </button>
            </div>
            <textarea
              rows={8}
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="کد کالا,نام محصول,برند,دسته‌بندی,قیمت پایه,موجودی..."
              className="w-full p-4 rounded-2xl border border-slate-200 text-xs font-mono bg-slate-50/70 focus:bg-white focus:border-[#E06518] outline-none leading-relaxed"
            />
          </div>

          {/* Sample Data Tip */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold">راهنمای ستون‌های کاتالوگ اطلس:</div>
              <p className="text-slate-600 leading-relaxed">
                ردیف اول شامل نام ستون‌ها است. سیستم به طور هوشمند ستون‌های{' '}
                <span className="font-mono font-bold text-blue-800">کد کالا, نام محصول, برند, دسته‌بندی, قیمت پایه, موجودی</span> را استخراج می‌کند. رکوردهایی با کد یا نام تکراری (مثل <span className="font-mono font-bold">AT-751</span>) به‌روزرسانی می‌شوند و رکوردهای تازه (مثل <span className="font-mono font-bold">AT-999</span>) به کاتالوگ افزوده خواهند شد.
              </p>
            </div>
          </div>

          {/* Next Button */}
          <div className="flex items-center justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleProceedToMapping}
              className="py-3 px-6 rounded-2xl bg-[#55565A] hover:bg-[#1B293E] text-white font-black text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>رفتن به مرحله ۲: نگاشت و تنظیم ضرایب</span>
              <ArrowLeft className="w-4 h-4 text-[#E06518]" />
            </button>
          </div>
        </div>
      )}

      {/* --- STEP 2: MAPPING & MULTIPLIERS --- */}
      {currentStep === 2 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-black text-[#55565A]">مرحله ۲: تطبیق ستون‌ها و تنظیم ضرایب لایه‌های قیمت</h3>
            <p className="text-xs text-slate-500 mt-1">
              تعیین نحوه محاسبه قیمت مصرف‌کننده، عمده‌فروشی کارخانجات و عاملیت رسمی بر پایه قیمت خرید فایل اکسل.
            </p>
          </div>

          {/* Column Mapping Table */}
          <div className="space-y-3">
            <div className="font-bold text-xs text-[#55565A]">تطبیق فیلدهای سیستم با ستون‌های فایل اکسل:</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500">فیلد سیستم:</span>
                  <div className="font-bold text-[#55565A]">کد یکتای کالا (SKU)</div>
                </div>
                <span className="font-mono font-bold text-[#C95210] bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  ستون ۱: کد کالا
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500">فیلد سیستم:</span>
                  <div className="font-bold text-[#55565A]">نام و شرح کالا</div>
                </div>
                <span className="font-mono font-bold text-[#C95210] bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  ستون ۲: نام محصول
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500">فیلد سیستم:</span>
                  <div className="font-bold text-[#55565A]">برند تجاری</div>
                </div>
                <span className="font-mono font-bold text-[#C95210] bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  ستون ۳: برند
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500">فیلد سیستم:</span>
                  <div className="font-bold text-[#55565A]">دسته‌بندی اصلی</div>
                </div>
                <span className="font-mono font-bold text-[#C95210] bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  ستون ۴: دسته‌بندی
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500">فیلد سیستم:</span>
                  <div className="font-bold text-[#55565A]">قیمت پایه خرید</div>
                </div>
                <span className="font-mono font-bold text-[#C95210] bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  ستون ۵: قیمت پایه
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500">فیلد سیستم:</span>
                  <div className="font-bold text-[#55565A]">موجودی انبار</div>
                </div>
                <span className="font-mono font-bold text-[#C95210] bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  ستون ۶: موجودی
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Multipliers Configuration */}
          <div className="p-5 rounded-2xl bg-orange-50/60 border border-orange-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-[#E06518]" />
                <h4 className="font-black text-sm text-[#55565A]">تنظیم ضرایب محاسبه ۴ لایه قیمت</h4>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">فرمول: قیمت پایه × (۱ + درصد / ۱۰۰)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200">
                <label className="font-bold text-[#C95210] block">حاشیه سود قیمت مصرف‌کننده (سایت)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={multipliers.retailPercent}
                    onChange={e => setMultipliers({ ...multipliers, retailPercent: Number(e.target.value) })}
                    className="w-20 h-9 px-2 rounded-lg border border-slate-200 font-mono font-bold text-center outline-none"
                  />
                  <span className="font-bold text-slate-500">درصد افزوده (+٪)</span>
                </div>
                <p className="text-[10px] text-slate-400">قیمت نهایی برای مشتریان عمومی و سفارشات تکی</p>
              </div>

              <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200">
                <label className="font-bold text-[#55565A] block">حاشیه سود فروش عمده و کارخانجات</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={multipliers.wholesalePercent}
                    onChange={e => setMultipliers({ ...multipliers, wholesalePercent: Number(e.target.value) })}
                    className="w-20 h-9 px-2 rounded-lg border border-slate-200 font-mono font-bold text-center outline-none"
                  />
                  <span className="font-bold text-slate-500">درصد افزوده (+٪)</span>
                </div>
                <p className="text-[10px] text-slate-400">قیمت اختصاصی خطوط تولید و خرید عمده</p>
              </div>

              <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200">
                <label className="font-bold text-emerald-700 block">حاشیه سود عاملیت رسمی و نمایندگان</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={multipliers.agencyPercent}
                    onChange={e => setMultipliers({ ...multipliers, agencyPercent: Number(e.target.value) })}
                    className="w-20 h-9 px-2 rounded-lg border border-slate-200 font-mono font-bold text-center outline-none"
                  />
                  <span className="font-bold text-slate-500">درصد افزوده (+٪)</span>
                </div>
                <p className="text-[10px] text-slate-400">نرخ خرید پرتال پخش نمایندگان دارای قرارداد</p>
              </div>
            </div>
          </div>

          {/* Rules Checkbox */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-[#55565A]">
              <input
                type="checkbox"
                checked={recordPriceHistory}
                onChange={e => setRecordPriceHistory(e.target.checked)}
                className="w-4 h-4 text-[#E06518] rounded accent-[#E06518]"
              />
              <span>ثبت تاریخچه تغییرات قیمت (Price Change Log) در صورت نوسان قیمت کالاهای موجود</span>
            </label>
            <p className="text-[11px] text-slate-500 pr-6">
              در صورت تغییر قیمت کالای موجود، سابقه قیمت قدیم، قیمت جدید، تاریخ و کاربر ثبت‌کننده در آرشیو ثبت می‌گردد.
            </p>
          </div>

          {/* Back & Next */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
            >
              <ArrowRight className="w-4 h-4" />
              <span>مرحله قبل</span>
            </button>

            <button
              type="button"
              onClick={handleGeneratePreview}
              className="py-3 px-6 rounded-2xl bg-[#55565A] hover:bg-[#1B293E] text-white font-black text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>تأیید و مشاهده پیش‌نمایش تفکیکی (مرحله ۳)</span>
              <ArrowLeft className="w-4 h-4 text-[#E06518]" />
            </button>
          </div>
        </div>
      )}

      {/* --- STEP 3: PREVIEW & VERIFY --- */}
      {currentStep === 3 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-[#55565A]">
                مرحله ۳: پیش‌نمایش رکوردهای پردازش‌شده قبل از ثبت نهایی
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                وضعیت هر سطر با برچسب‌های رنگی مشخص شده است: سبز (کالای جدید)، آبی (به‌روزرسانی کالای موجود)، قرمز (خطادار).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="py-2 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                تغییر ضرایب
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>تأیید نهایی و اعمال در کاتالوگ کالاها</span>
              </button>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <button
              type="button"
              onClick={() => setPreviewFilter('all')}
              className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                previewFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400'
              }`}
            >
              <div className="text-[11px] opacity-75">کل ردیف‌ها</div>
              <div className="text-xl font-black font-mono mt-1">{toPersianDigits(previewRows.length)}</div>
            </button>

            <button
              type="button"
              onClick={() => setPreviewFilter('new')}
              className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                previewFilter === 'new'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-400'
              }`}
            >
              <div className="text-[11px] opacity-75">کالاهای جدید (سبز)</div>
              <div className="text-xl font-black font-mono mt-1">{toPersianDigits(countNew)}</div>
            </button>

            <button
              type="button"
              onClick={() => setPreviewFilter('update')}
              className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                previewFilter === 'update'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-blue-50 text-blue-800 border-blue-200 hover:border-blue-400'
              }`}
            >
              <div className="text-[11px] opacity-75">به‌روزرسانی کالاها (آبی)</div>
              <div className="text-xl font-black font-mono mt-1">{toPersianDigits(countUpdate)}</div>
            </button>

            <button
              type="button"
              onClick={() => setPreviewFilter('error')}
              className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                previewFilter === 'error'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-red-50 text-red-800 border-red-200 hover:border-red-400'
              }`}
            >
              <div className="text-[11px] opacity-75">رکوردهای خطادار (قرمز)</div>
              <div className="text-xl font-black font-mono mt-1">{toPersianDigits(countError)}</div>
            </button>
          </div>

          {/* Preview Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-[#55565A]">
                    <th className="py-3 px-3">ردیف</th>
                    <th className="py-3 px-3">وضعیت</th>
                    <th className="py-3 px-3">کد کالا</th>
                    <th className="py-3 px-3">نام محصول</th>
                    <th className="py-3 px-3">برند / دسته</th>
                    <th className="py-3 px-3">قیمت پایه</th>
                    <th className="py-3 px-3">مصرف‌کننده (+۳۵٪)</th>
                    <th className="py-3 px-3">پخش / همکار (+۱۸٪)</th>
                    <th className="py-3 px-3">نمایندگی (+۸٪)</th>
                    <th className="py-3 px-3">موجودی</th>
                    <th className="py-3 px-3">توضیحات / تطابق</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPreview.map(row => (
                    <tr
                      key={row.rowNumber}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        row.status === 'error'
                          ? 'bg-red-50/40'
                          : row.status === 'new'
                          ? 'bg-emerald-50/30'
                          : 'bg-blue-50/30'
                      }`}
                    >
                      <td className="py-3 px-3 font-mono text-slate-400 font-bold">{toPersianDigits(row.rowNumber)}</td>

                      <td className="py-3 px-3">
                        {row.status === 'new' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            + جدید
                          </span>
                        )}
                        {row.status === 'update' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                            ⟳ به‌روزرسانی
                          </span>
                        )}
                        {row.status === 'error' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                            ✕ خطا
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-[#55565A]">{row.code || '-'}</td>
                      <td className="py-3 px-3 font-bold text-[#55565A] max-w-[200px] truncate">{row.name}</td>
                      <td className="py-3 px-3 text-slate-600">
                        <div>{row.brand}</div>
                        <div className="text-[10px] text-slate-400">{row.category}</div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-700">
                        {row.basePrice > 0 ? `${formatPrice(row.basePrice)} ت` : '-'}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#C95210]">
                        {row.retailPrice > 0 ? `${formatPrice(row.retailPrice)} ت` : '-'}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#55565A]">
                        {row.wholesalePrice > 0 ? `${formatPrice(row.wholesalePrice)} ت` : '-'}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                        {row.dealerPrice > 0 ? `${formatPrice(row.dealerPrice)} ت` : '-'}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-700">{toPersianDigits(row.stock)}</td>
                      <td className="py-3 px-3 text-[11px]">
                        {row.status === 'error' ? (
                          <span className="text-red-600 font-bold">{row.errorMessage}</span>
                        ) : row.status === 'update' ? (
                          <span className="text-blue-700">
                            کالای موجود (قیمت قبل: {formatPrice(row.existingProduct?.prices.retail || 0)} ت)
                          </span>
                        ) : (
                          <span className="text-emerald-700">کالای تازه، ثبت در کاتالوگ</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
            >
              <ArrowRight className="w-4 h-4" />
              <span>بازگشت به مرحله ۲</span>
            </button>

            <button
              type="button"
              onClick={handleExecuteImport}
              className="py-3 px-8 rounded-2xl bg-[#55565A] hover:bg-[#1B293E] text-white font-black text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 text-[#E06518]" />
              <span>اعمال نهایی {toPersianDigits(countNew + countUpdate)} کالا در سامانه</span>
            </button>
          </div>
        </div>
      )}

      {/* --- STEP 4: FINAL EXECUTION REPORT --- */}
      {currentStep === 4 && report && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-xl font-black text-[#55565A]">همگام‌سازی و ایمپورت گروهی با موفقیت انجام شد!</h3>
            <p className="text-xs text-slate-500 mt-1">
              کاتالوگ کالاها، قیمت‌های لایه‌ای، موجودی انبار و سوابق نوسان قیمت به‌روزرسانی گردید.
            </p>
          </div>

          {/* Report Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto text-right">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <div className="text-xs text-emerald-800 font-bold">کالاهای جدید اضافه شده:</div>
              <div className="text-2xl font-black font-mono text-emerald-700 mt-1">
                {toPersianDigits(report.newCreated ?? report.newCount ?? 0)} کالا
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
              <div className="text-xs text-blue-800 font-bold">کالاهای به‌روزرسانی شده:</div>
              <div className="text-2xl font-black font-mono text-blue-700 mt-1">
                {toPersianDigits(report.updated ?? report.updatedCount ?? 0)} کالا
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
              <div className="text-xs text-red-800 font-bold">خطاها یا ردهای پردازش:</div>
              <div className="text-2xl font-black font-mono text-red-700 mt-1">
                {toPersianDigits(report.errorsCount ?? report.errorCount ?? 0)} ردیف
              </div>
            </div>
          </div>

          {/* If Errors */}
          {(report.errorDetails || report.errors || []).length > 0 && (
            <div className="max-w-xl mx-auto text-right p-4 rounded-2xl bg-red-50/70 border border-red-200 text-xs text-red-800 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>ردیف‌های دارای خطا که رد شدند:</span>
              </div>
              <div className="space-y-1">
                {(report.errorDetails || report.errors || []).map((err: any, i: number) => (
                  <div key={i} className="text-[11px] font-mono">
                    ردیف {toPersianDigits(err.row)} (کد: {err.code || 'خالی'}): {err.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Action Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            {onGoToProducts && (
              <button
                type="button"
                onClick={onGoToProducts}
                className="py-3 px-6 rounded-2xl bg-[#55565A] text-white font-black text-xs hover:bg-[#1B293E] transition-colors cursor-pointer"
              >
                مشاهده در کاتالوگ کالاها
              </button>
            )}

            {onGoToPriceHistory && (
              <button
                type="button"
                onClick={onGoToPriceHistory}
                className="py-3 px-6 rounded-2xl bg-orange-50 text-[#C95210] border border-orange-200 font-bold text-xs hover:bg-orange-100 transition-colors cursor-pointer flex items-center gap-2"
              >
                <Clock className="w-4 h-4 text-[#E06518]" />
                <span>مشاهده تاریخچه تغییرات قیمت</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setRawText('');
                setFileName('');
                setPreviewRows([]);
                setReport(null);
                setCurrentStep(1);
              }}
              className="py-3 px-6 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              ایمپورت یک فایل جدید
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
