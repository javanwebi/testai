import React, { useState } from 'react';
import {
  Award,
  Users,
  Percent,
  CheckCircle2,
  XCircle,
  Clock,
  Building,
  Phone,
  DollarSign,
  Plus,
  Trash2,
  Edit2,
  Check,
  ShieldAlert,
  Send,
} from 'lucide-react';
import {
  pricingCreditService,
  CustomerGrade,
  DynamicPriceList,
  CustomerApprovalRecord,
} from '../../services/pricingCreditService';
import { agencyService } from '../../services/agencyService';
import { formatPrice, toPersianDigits } from '../../utils/formatters';

export const CustomerGradingModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'approvals' | 'grades' | 'pricelists'>('approvals');

  // Approvals State
  const [approvals, setApprovals] = useState<CustomerApprovalRecord[]>(() =>
    pricingCreditService.getCustomerApprovals()
  );
  const [grades, setGrades] = useState<CustomerGrade[]>(() => pricingCreditService.getGrades());
  const [priceLists, setPriceLists] = useState<DynamicPriceList[]>(() =>
    pricingCreditService.getPriceLists()
  );

  // Approval Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerApprovalRecord | null>(null);
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [selectedPriceListId, setSelectedPriceListId] = useState('');
  const [customCreditLimit, setCustomCreditLimit] = useState<number>(50000000);
  const [adminNotes, setAdminNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Grade Modal
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [newGradeCode, setNewGradeCode] = useState('کرید ');
  const [newGradeName, setNewGradeName] = useState('');
  const [newGradePriceListId, setNewGradePriceListId] = useState('');
  const [newGradeLimit, setNewGradeLimit] = useState(100000000);
  const [newGradeDays, setNewGradeDays] = useState(30);
  const [newGradeTrust, setNewGradeTrust] = useState<'high' | 'medium' | 'restricted'>('medium');
  const [newGradeDesc, setNewGradeDesc] = useState('');

  // New PriceList Modal
  const [isPriceListModalOpen, setIsPriceListModalOpen] = useState(false);
  const [newPlName, setNewPlName] = useState('');
  const [newPlDiscount, setNewPlDiscount] = useState(15);
  const [newPlDesc, setNewPlDesc] = useState('');

  const refreshData = () => {
    setApprovals(pricingCreditService.getCustomerApprovals());
    setGrades(pricingCreditService.getGrades());
    setPriceLists(pricingCreditService.getPriceLists());
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Open Approval Dialog
  const handleOpenApprove = (cust: CustomerApprovalRecord) => {
    setSelectedCustomer(cust);
    const defaultGrade = grades[1] || grades[0];
    setSelectedGradeId(defaultGrade?.id || '');
    setSelectedPriceListId(defaultGrade?.priceListId || priceLists[0]?.id || '');
    setCustomCreditLimit(defaultGrade?.creditLimit || 100000000);
    setAdminNotes('');
  };

  // Confirm Approval & Assign Grade + Price List
  const handleConfirmApprove = () => {
    if (!selectedCustomer || !selectedGradeId || !selectedPriceListId) return;

    const res = pricingCreditService.approveAndGradeCustomer(
      selectedCustomer.id,
      selectedGradeId,
      selectedPriceListId,
      customCreditLimit,
      adminNotes
    );

    const grade = grades.find(g => g.id === selectedGradeId);
    const pl = priceLists.find(p => p.id === selectedPriceListId);

    // Send simulated SMS to customer
    agencyService.addSmsLog({
      recipientPhone: selectedCustomer.phone,
      template: 'b2b_approved',
      message: `مشتری گرامی جناب ${selectedCustomer.fullName}؛ حساب شما در هایپر صنعت اطلس ارزیابی و تأیید شد.\nسطح اعتباری: ${grade?.code || ''}\nلیست قیمت منتسب: ${pl?.name || ''}\nسقف اعتبار: ${new Intl.NumberFormat('fa-IR').format(customCreditLimit)} تومان\nاز هم‌اکنون استعلام آنی قیمت‌ها در پرتال شما فعال است.`,
    });

    refreshData();
    setSelectedCustomer(null);
    showToast(
      `حساب ${selectedCustomer.fullName} با موفقیت تایید و کرید ${grade?.code} و لیست قیمت به ایشان اختصاص یافت و پیامک ارسال شد.`
    );
  };

  // Reject Customer
  const handleReject = (cust: CustomerApprovalRecord) => {
    const reason = window.prompt('لطفاً دلیل عدم تایید درخواست مشتری را وارد نمایید:');
    if (reason) {
      pricingCreditService.rejectCustomer(cust.id, reason);
      refreshData();
      showToast(`درخواست با ذکر دلیل ثبت گردید.`);
    }
  };

  // Save new Grade
  const handleSaveNewGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGradeName.trim()) return;

    pricingCreditService.addGrade({
      code: newGradeCode.trim(),
      name: newGradeName.trim(),
      priceListId: newGradePriceListId || (priceLists[0]?.id ?? ''),
      creditLimit: Number(newGradeLimit) || 50000000,
      settlementDays: Number(newGradeDays) || 30,
      trustLevel: newGradeTrust,
      description: newGradeDesc.trim(),
    });

    refreshData();
    setIsGradeModalOpen(false);
    showToast(`کرید جدید «${newGradeName}» با موفقیت اضافه شد.`);
  };

  // Save new PriceList
  const handleSaveNewPriceList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlName.trim()) return;

    pricingCreditService.addPriceList({
      name: newPlName.trim(),
      discountPercent: Number(newPlDiscount) || 0,
      description: newPlDesc.trim(),
    });

    refreshData();
    setIsPriceListModalOpen(false);
    showToast(`لیست قیمت جدید «${newPlName}» ایجاد شد.`);
  };

  const pendingApprovalsCount = approvals.filter(a => a.status === 'pending').length;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 p-4 rounded-2xl bg-[#55565A] text-white text-xs font-bold shadow-2xl border border-orange-500/50 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#55565A] flex items-center gap-2">
            <Award className="w-6 h-6 text-[#E06518]" />
            <span>سیستم اعتبارسنجی، کریدبندی مشتریان و لیست‌های قیمت داینامیک</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            تعیین صلاحیت اعتباری خریداران صنعتی، اختصاص سقف اعتبار جهت اعتماد در تحویل کالا، و تنظیم لیست قیمت اختصاصی برای استعلام آنی در سایت.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingApprovalsCount > 0 && (
            <span className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-xl animate-pulse">
              {toPersianDigits(pendingApprovalsCount)} درخواست در انتظار تعیین کرید
            </span>
          )}
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl">
            {toPersianDigits(grades.length)} کرید اعتباری فعال
          </span>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl">
            {toPersianDigits(priceLists.length)} لیست قیمت
          </span>
        </div>
      </div>

      {/* 3 Main Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('approvals')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'approvals'
              ? 'bg-[#55565A] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>کارتابل تایید و تعیین کرید مشتریان جدید</span>
          {pendingApprovalsCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#E06518] text-white text-[10px] flex items-center justify-center font-bold">
              {toPersianDigits(pendingApprovalsCount)}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('grades')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'grades'
              ? 'bg-[#55565A] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>مدیریت داینامیک کریدها و سقف اعتبار</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pricelists')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'pricelists'
              ? 'bg-[#55565A] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>مدیریت انواع لیست قیمت</span>
        </button>
      </div>

      {/* --- TAB 1: CUSTOMER APPROVALS & GRADING INBOX --- */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-sm text-[#55565A]">
                  لیست متقاضیان و مشتریان ثبت‌نام‌شده در سایت
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  بررسی مشخصات صنعتی، تعیین رتبه اعتباری (کرید) و اتصال به لیست قیمت جهت نمایش استعلام آنی در حساب کاربر.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3">نام مشتری / شرکت</th>
                    <th className="p-3">شماره تماس</th>
                    <th className="p-3">شهر / زمینه فعالیت</th>
                    <th className="p-3">برآورد خرید ماهانه</th>
                    <th className="p-3 text-center">وضعیت</th>
                    <th className="p-3">کرید و لیست قیمت فعال</th>
                    <th className="p-3 text-left">سقف اعتبار</th>
                    <th className="p-3 text-center">عملیات مدیریت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {approvals.map(cust => {
                    const grade = grades.find(g => g.id === cust.assignedGradeId);
                    const pl = priceLists.find(p => p.id === cust.assignedPriceListId);

                    return (
                      <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-[#55565A]">{cust.fullName}</div>
                          <div className="text-[11px] text-slate-500">{cust.companyName}</div>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-700">{cust.phone}</td>
                        <td className="p-3">
                          <div className="text-slate-800 font-medium">
                            {cust.province}، {cust.city}
                          </div>
                          <div className="text-[10px] text-[#E06518] font-bold">
                            {cust.activityField}
                          </div>
                        </td>
                        <td className="p-3 font-medium text-slate-700">
                          {cust.monthlyPurchaseEstimate}
                        </td>
                        <td className="p-3 text-center">
                          {cust.status === 'approved' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                              تأیید و کریدبندی شده
                            </span>
                          ) : cust.status === 'rejected' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-red-100 text-red-800">
                              رد صلاحیت اعتباری
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 animate-pulse">
                              در انتظار تعیین کرید
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {cust.status === 'approved' ? (
                            <div className="space-y-0.5">
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-black bg-orange-100 text-orange-900 border border-orange-200">
                                {grade?.code || 'کرید اختصاصی'}
                              </span>
                              <div className="text-[10px] text-slate-500 font-bold truncate max-w-[160px]">
                                {pl?.name}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">تعیین نشده</span>
                          )}
                        </td>
                        <td className="p-3 text-left font-mono font-bold text-emerald-700">
                          {cust.assignedCreditLimit
                            ? `${formatPrice(cust.assignedCreditLimit)} ت`
                            : '-'}
                        </td>
                        <td className="p-3 text-center">
                          {cust.status === 'pending' ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenApprove(cust)}
                                className="px-3 py-1.5 bg-[#55565A] hover:bg-[#1B293E] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                تعیین کرید و تایید
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(cust)}
                                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="رد درخواست"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenApprove(cust)}
                              className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                            >
                              ویرایش کرید
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
        </div>
      )}

      {/* --- TAB 2: DYNAMIC CUSTOMER GRADES --- */}
      {activeTab === 'grades' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-sm text-[#55565A]">
                  تعریف سطوح کرید و رتبه‌بندی اعتباری (Customer Grades)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  مدیر می‌تواند بی‌نهایت رتبه اعتباری تعریف نموده و برای هر کرید سقف اعتبار و لیست قیمت متناظر تنظیم نماید.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNewGradeCode(`کرید ${grades.length + 1}`);
                  setNewGradeName('');
                  setNewGradeLimit(150000000);
                  setNewGradeDays(30);
                  setNewGradePriceListId(priceLists[0]?.id || '');
                  setNewGradeDesc('');
                  setIsGradeModalOpen(true);
                }}
                className="px-4 py-2 bg-[#E06518] hover:bg-[#C95210] text-white text-xs font-black rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>تعریف کرید جدید</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {grades.map(grade => {
                const assignedPl = priceLists.find(p => p.id === grade.priceListId);

                return (
                  <div
                    key={grade.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 hover:border-orange-200 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-lg text-xs font-black bg-[#55565A] text-white">
                          {grade.code}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            grade.trustLevel === 'high'
                              ? 'bg-emerald-100 text-emerald-800'
                              : grade.trustLevel === 'medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          سطح اعتماد: {grade.trustLevel === 'high' ? 'عالی (تضمین معتبر)' : grade.trustLevel === 'medium' ? 'متوسط' : 'محدود / نقدی'}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-[#55565A]">{grade.name}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{grade.description}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-200/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>سقف اعتبار پیش‌فرض:</span>
                        <strong className="font-mono text-emerald-700 font-black">
                          {formatPrice(grade.creditLimit)} تومان
                        </strong>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span>مهلت تسویه حساب:</span>
                        <span className="font-bold text-[#55565A]">
                          {toPersianDigits(grade.settlementDays)} روزه
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span>لیست قیمت پیش‌فرض:</span>
                        <span className="font-bold text-orange-700 truncate max-w-[200px]">
                          {assignedPl ? assignedPl.name : 'پیش‌فرض کاتالوگ'}
                        </span>
                      </div>

                      <div className="pt-2 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (grades.length <= 1) {
                              alert('حداقل یک کرید اعتباری باید در سیستم باقی بماند.');
                              return;
                            }
                            if (window.confirm(`آیا از حذف «${grade.name}» اطمینان دارید؟`)) {
                              pricingCreditService.deleteGrade(grade.id);
                              refreshData();
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                          title="حذف کرید"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: DYNAMIC PRICE LISTS --- */}
      {activeTab === 'pricelists' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-sm text-[#55565A]">
                  تعریف و مدیریت انواع لیست‌های قیمت (Price Lists)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  مدیر می‌تواند درصد تخفیف، فرمول قیمت‌گذاری و شرایط هر لیست قیمت را مستقیماً تعیین نماید.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNewPlName('');
                  setNewPlDiscount(15);
                  setNewPlDesc('');
                  setIsPriceListModalOpen(true);
                }}
                className="px-4 py-2 bg-[#E06518] hover:bg-[#C95210] text-white text-xs font-black rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>تعریف لیست قیمت جدید</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {priceLists.map(pl => (
                <div
                  key={pl.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-900 border border-orange-200">
                        {pl.isDefault ? 'لیست پیش‌فرض عمومی' : 'لیست همکار'}
                      </span>
                      <span className="font-black text-emerald-700 text-base font-mono">
                        ٪{toPersianDigits(pl.discountPercent)} تخفیف
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-[#55565A]">{pl.name}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{pl.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-400">شناسه: {pl.id}</span>
                    {!pl.isDefault && (
                      <button
                        type="button"
                        onClick={() => {
                          if (priceLists.length <= 1) {
                            alert('حداقل یک لیست قیمت باید در سامانه فعال باشد.');
                            return;
                          }
                          if (window.confirm(`آیا از حذف «${pl.name}» مطمئن هستید؟`)) {
                            pricingCreditService.deletePriceList(pl.id);
                            refreshData();
                          }
                        }}
                        className="text-slate-400 hover:text-red-600 transition-colors"
                        title="حذف لیست قیمت"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 1: ASSIGN GRADE & APPROVE CUSTOMER --- */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-5 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-sm text-[#55565A]">
                  تعیین کرید و اعتبارسنجی: {selectedCustomer.fullName}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  واحد / شرکت: {selectedCustomer.companyName} | شهر: {selectedCustomer.province} - {selectedCustomer.city}
                </p>
              </div>
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                {selectedCustomer.phone}
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  انتخاب رتبه اعتباری (Customer Grade):
                </label>
                <select
                  value={selectedGradeId}
                  onChange={e => {
                    setSelectedGradeId(e.target.value);
                    const matchedGrade = grades.find(g => g.id === e.target.value);
                    if (matchedGrade) {
                      setSelectedPriceListId(matchedGrade.priceListId);
                      setCustomCreditLimit(matchedGrade.creditLimit);
                    }
                  }}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white font-bold text-[#55565A] outline-none focus:border-[#E06518]"
                >
                  {grades.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name} (سقف: {formatPrice(g.creditLimit)} ت)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  انتخاب لیست قیمت متصل (جهت استعلام آنی کالاها):
                </label>
                <select
                  value={selectedPriceListId}
                  onChange={e => setSelectedPriceListId(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white font-bold text-[#55565A] outline-none focus:border-[#E06518]"
                >
                  {priceLists.map(pl => (
                    <option key={pl.id} value={pl.id}>
                      {pl.name} ({toPersianDigits(pl.discountPercent)}٪ تخفیف نسبت به کاتالوگ)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  سقف اعتبار ریالی جهت تحویل جنس به مشتری (تومان):
                </label>
                <input
                  type="number"
                  value={customCreditLimit}
                  onChange={e => setCustomCreditLimit(Number(e.target.value))}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 font-mono font-bold text-emerald-700 outline-none focus:border-[#E06518]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  یادداشت ارزیابی اعتباری مدیریت (محرمانه):
                </label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder="مثلاً: استعلام چک‌ها از بانک ملی مثبت بود، خوش‌حساب با اعتبار ۵۰۰ میلیونی..."
                  className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-[#E06518]"
                />
              </div>

              <div className="p-3.5 bg-orange-50 rounded-2xl border border-orange-200 text-slate-700 leading-relaxed text-[11px] space-y-1">
                <div className="font-bold text-orange-950 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-[#E06518]" />
                  <span>پیامک خودکار به مشتری:</span>
                </div>
                <p>
                  به محض تایید، پیامک فعال‌سازی کرید و لیست قیمت به شماره <strong>{selectedCustomer.phone}</strong> ارسال شده و مشتری بلافاصله با کلیک روی هر کالا می‌تواند قیمت اختصاصی خود را ببیند.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                className="px-5 py-2 rounded-xl bg-[#E06518] hover:bg-[#C95210] text-white text-xs font-black shadow-xs cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>تایید کرید و فعال‌سازی لیست قیمت</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: CREATE NEW GRADE --- */}
      {isGradeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveNewGrade}
            className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 text-right"
          >
            <h3 className="font-black text-sm text-[#55565A] border-b border-slate-100 pb-3">
              تعریف رتبه و کرید اعتباری جدید
            </h3>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">کد کرید (کوتاه):</label>
                  <input
                    type="text"
                    value={newGradeCode}
                    onChange={e => setNewGradeCode(e.target.value)}
                    placeholder="مثلاً: کرید ۵"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">سطح اعتماد:</label>
                  <select
                    value={newGradeTrust}
                    onChange={e => setNewGradeTrust(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-bold"
                  >
                    <option value="high">عالی (بالا)</option>
                    <option value="medium">متوسط</option>
                    <option value="restricted">محدود / نقدی</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">عنوان کامل کرید:</label>
                <input
                  type="text"
                  value={newGradeName}
                  onChange={e => setNewGradeName(e.target.value)}
                  placeholder="مثلاً: کرید ۵ - صادرکنندگان و خریداران ارزی"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">سقف اعتبار (تومان):</label>
                  <input
                    type="number"
                    value={newGradeLimit}
                    onChange={e => setNewGradeLimit(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 font-mono font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">مهلت تسویه (روز):</label>
                  <input
                    type="number"
                    value={newGradeDays}
                    onChange={e => setNewGradeDays(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">اتصال به لیست قیمت:</label>
                <select
                  value={newGradePriceListId}
                  onChange={e => setNewGradePriceListId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-bold"
                >
                  {priceLists.map(pl => (
                    <option key={pl.id} value={pl.id}>
                      {pl.name} (٪{toPersianDigits(pl.discountPercent)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">توضیحات و مشخصات:</label>
                <textarea
                  rows={2}
                  value={newGradeDesc}
                  onChange={e => setNewGradeDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsGradeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#55565A] hover:bg-[#1B293E] text-white text-xs font-black"
              >
                ثبت کرید اعتباری
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODAL 3: CREATE NEW PRICE LIST --- */}
      {isPriceListModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveNewPriceList}
            className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 text-right"
          >
            <h3 className="font-black text-sm text-[#55565A] border-b border-slate-100 pb-3">
              تعریف نوع لیست قیمت جدید
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">نام لیست قیمت:</label>
                <input
                  type="text"
                  value={newPlName}
                  onChange={e => setNewPlName(e.target.value)}
                  placeholder="مثلاً: لیست قیمت ویژه صنایع لعاب و کاشی"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 font-bold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  درصد تخفیف نسبت به کاتالوگ پایه (٪):
                </label>
                <input
                  type="number"
                  min="0"
                  max="70"
                  value={newPlDiscount}
                  onChange={e => setNewPlDiscount(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 font-mono font-bold text-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">توضیحات و شرایط:</label>
                <textarea
                  rows={2}
                  value={newPlDesc}
                  onChange={e => setNewPlDesc(e.target.value)}
                  placeholder="توضیحات مربوط به نحوه پرداخت، حداقل تناژ سفارش یا اختصاص به صنف خاص..."
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPriceListModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#E06518] hover:bg-[#C95210] text-white text-xs font-black"
              >
                ایجاد لیست قیمت
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
