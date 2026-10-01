import { Product } from '../types';

export interface CustomerGrade {
  id: string;
  code: string; // e.g. 'G1', 'G2', 'G3', 'G4'
  name: string; // e.g. 'کرید ۱ - کارخانجات مادر و صنایع سنگین'
  priceListId: string; // شناسه لیست قیمت پیش‌فرض
  creditLimit: number; // سقف اعتبار ریالی
  settlementDays: number; // مهلت تسویه حساب به روز
  trustLevel: 'high' | 'medium' | 'restricted';
  description: string;
}

export interface DynamicPriceList {
  id: string;
  name: string; // e.g. 'لیست قیمت A - کارخانجات کاشی', 'لیست قیمت B - تجاری همکار', ...
  discountPercent: number; // درصد تخفیف از قیمت کاتالوگ پایه
  isDefault?: boolean;
  description: string;
  customProductPrices?: Record<string, number>; // قیمت دلخواه برای هر کد کالا در صورت لزوم
}

export interface CustomerApprovalRecord {
  id: string;
  fullName: string;
  companyName: string;
  phone: string;
  password?: string;
  province: string;
  city: string;
  activityField: string;
  monthlyPurchaseEstimate: string;
  economicCode?: string;
  registeredAt: string;
  status: 'pending' | 'approved' | 'rejected';
  assignedGradeId?: string;
  assignedPriceListId?: string;
  assignedCreditLimit?: number;
  reviewedAt?: string;
  rejectionReason?: string;
  adminNotes?: string;
  isDealer?: boolean;
}

const GRADES_STORAGE_KEY = 'atlas_customer_grades_v1';
const PRICE_LISTS_STORAGE_KEY = 'atlas_price_lists_v1';
const CUSTOMERS_APPROVAL_KEY = 'atlas_customers_approval_v1';
const USER_INQUIRY_CACHE_KEY = 'atlas_user_inquiry_cache_v1';

// Initial default grades defined by business
const INITIAL_GRADES: CustomerGrade[] = [
  {
    id: 'grade-1',
    code: 'کرید ۱',
    name: 'کرید ۱ - کارخانجات تراز اول و صنایع سنگین (بالاترین سطح اعتبار)',
    priceListId: 'pl-industrial-a',
    creditLimit: 500000000, // ۵۰۰ میلیون تومان اعتبار باز
    settlementDays: 60,
    trustLevel: 'high',
    description: 'واحدهای بزرگ فولادی، کاشی و سرامیک و نساجی با گردش حساب بالا و تضمین معتبر.',
  },
  {
    id: 'grade-2',
    code: 'کرید ۲',
    name: 'کرید ۲ - خریداران تجاری معتبر و خطوط تولید فعال',
    priceListId: 'pl-factory-b',
    creditLimit: 250000000, // ۲۵۰ میلیون تومان
    settlementDays: 45,
    trustLevel: 'high',
    description: 'کارخانجات متوسط و کارگاه‌های صنعتی معتبر با سابقه همکاری منظم.',
  },
  {
    id: 'grade-3',
    code: 'کرید ۳',
    name: 'کرید ۳ - مشتریان تجاری متوسط و همکاران منطقه‌ای',
    priceListId: 'pl-commercial-c',
    creditLimit: 100000000, // ۱۰۰ میلیون تومان
    settlementDays: 30,
    trustLevel: 'medium',
    description: 'خریداران دوره‌ای قطعات با سابقه پرداخت‌های تسویه‌شده.',
  },
  {
    id: 'grade-4',
    code: 'کرید ۴',
    name: 'کرید ۴ - مشتریان جدید و خریدهای اعتباری اولیه (تسویه نقدی/مدت کوتاه)',
    priceListId: 'pl-standard-d',
    creditLimit: 30000000, // ۳۰ میلیون تومان
    settlementDays: 10,
    trustLevel: 'restricted',
    description: 'حساب‌های تازه‌تأسیس جهت سنجش خوش‌حسابی در ۳ سفارش نخست.',
  },
];

// Initial default dynamic price lists
const INITIAL_PRICE_LISTS: DynamicPriceList[] = [
  {
    id: 'pl-industrial-a',
    name: 'لیست قیمت ممتاز صنعتی (صنایع مادر و VIP)',
    discountPercent: 22,
    description: 'پایین‌ترین نرخ شرکتی مخصوص دارندگان کرید ۱ با ۲۲٪ تخفیف از کاتالوگ مرجع.',
  },
  {
    id: 'pl-factory-b',
    name: 'لیست قیمت کارخانجات کاشی و نساجی (کرید ۲)',
    discountPercent: 16,
    description: 'نرخ مصوب کارخانجات صنعتی معتبر با ۱۶٪ تخفیف همکاری.',
  },
  {
    id: 'pl-commercial-c',
    name: 'لیست قیمت تجاری همکاران (کرید ۳)',
    discountPercent: 10,
    description: 'تخفیف ۱۰ درصدی نسبت به نرخ کاتالوگ برای سفارشات نیمه‌عمده.',
  },
  {
    id: 'pl-standard-d',
    name: 'لیست قیمت استاندارد پایه (کرید ۴ و تسویه فوری)',
    discountPercent: 5,
    isDefault: true,
    description: 'لیست قیمت استاندارد با تخفیف ۵٪ خرید مستقیم از هایپر صنعت.',
  },
];

// Seed sample customer approval records
const INITIAL_CUSTOMER_APPROVALS: CustomerApprovalRecord[] = [
  {
    id: 'cust-req-1',
    fullName: 'مهندس محمدرضا زارع',
    companyName: 'کارخانه کاشی ستاره میبد',
    phone: '09131512345',
    password: '123',
    province: 'یزد',
    city: 'میبد',
    activityField: 'کاشی و سرامیک',
    monthlyPurchaseEstimate: 'بالای ۱۰۰ میلیون تومان',
    economicCode: '411298456123',
    registeredAt: '۱۴۰۳/۰۶/۱۸',
    status: 'approved',
    assignedGradeId: 'grade-1',
    assignedPriceListId: 'pl-industrial-a',
    assignedCreditLimit: 500000000,
    reviewedAt: '۱۴۰۳/۰۶/۱۹',
    adminNotes: 'تأییدیه واحد مالی و اعتبار ارزیابی شد. یکی از بزرگترین خطوط کوره میبد.',
  },
  {
    id: 'cust-req-2',
    fullName: 'آقای صادق میرجلیلی',
    companyName: 'ریسندگی و بافندگی پرنیان یزد',
    phone: '09132519988',
    password: '123',
    province: 'یزد',
    city: 'یزد',
    activityField: 'نساجی',
    monthlyPurchaseEstimate: '۵۰ تا ۱۰۰ میلیون تومان',
    registeredAt: '۱۴۰۳/۰۶/۲۰',
    status: 'approved',
    assignedGradeId: 'grade-2',
    assignedPriceListId: 'pl-factory-b',
    assignedCreditLimit: 250000000,
    reviewedAt: '۱۴۰۳/۰۶/۲۱',
    adminNotes: 'تامین تسمه‌های تایمینگ و ضدسایش خطوط ریسندگی.',
  },
  {
    id: 'cust-req-3',
    fullName: 'مهندس کیوان یزدانی',
    companyName: 'صنایع لعاب و سرامیک کویر',
    phone: '09133518877',
    password: '123',
    province: 'یزد',
    city: 'اردکان',
    activityField: 'کاشی و سرامیک',
    monthlyPurchaseEstimate: '۳۰ تا ۵۰ میلیون تومان',
    registeredAt: '۱۴۰۳/۰۶/۲۲',
    status: 'pending',
    adminNotes: 'ثبت‌نام جدید، نیازمند تماس و بررسی جواز یا معرفی‌نامه کارخانه.',
  },
  {
    id: 'cust-req-4',
    fullName: 'آقای حمیدرضا کریمی',
    companyName: 'کارگاه تولید قطعات بتنی کریمی',
    phone: '09121114455',
    password: '123',
    province: 'اصفهان',
    city: 'نجف‌آباد',
    activityField: 'سایر صنایع',
    monthlyPurchaseEstimate: '۱۰ تا ۳۰ میلیون تومان',
    registeredAt: '۱۴۰۳/۰۶/۲۲',
    status: 'pending',
  },
];

export const pricingCreditService = {
  // --- Customer Grades (کریدبندی) ---
  getGrades(): CustomerGrade[] {
    try {
      const stored = localStorage.getItem(GRADES_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    this.saveGrades(INITIAL_GRADES);
    return INITIAL_GRADES;
  },

  saveGrades(grades: CustomerGrade[]): void {
    try {
      localStorage.setItem(GRADES_STORAGE_KEY, JSON.stringify(grades));
    } catch {
      // ignore
    }
  },

  getGradeById(id: string): CustomerGrade | undefined {
    return this.getGrades().find(g => g.id === id);
  },

  addGrade(grade: Omit<CustomerGrade, 'id'>): CustomerGrade {
    const grades = this.getGrades();
    const newGrade: CustomerGrade = {
      ...grade,
      id: 'grade-' + Date.now(),
    };
    grades.push(newGrade);
    this.saveGrades(grades);
    return newGrade;
  },

  updateGrade(id: string, updates: Partial<CustomerGrade>): void {
    const grades = this.getGrades().map(g => (g.id === id ? { ...g, ...updates } : g));
    this.saveGrades(grades);
  },

  deleteGrade(id: string): void {
    const grades = this.getGrades().filter(g => g.id !== id);
    this.saveGrades(grades);
  },

  // --- Dynamic Price Lists (لیست‌های قیمت داینامیک) ---
  getPriceLists(): DynamicPriceList[] {
    try {
      const stored = localStorage.getItem(PRICE_LISTS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    this.savePriceLists(INITIAL_PRICE_LISTS);
    return INITIAL_PRICE_LISTS;
  },

  savePriceLists(lists: DynamicPriceList[]): void {
    try {
      localStorage.setItem(PRICE_LISTS_STORAGE_KEY, JSON.stringify(lists));
    } catch {
      // ignore
    }
  },

  getPriceListById(id: string): DynamicPriceList | undefined {
    return this.getPriceLists().find(p => p.id === id);
  },

  addPriceList(list: Omit<DynamicPriceList, 'id'>): DynamicPriceList {
    const lists = this.getPriceLists();
    const newList: DynamicPriceList = {
      ...list,
      id: 'pl-' + Date.now(),
    };
    lists.push(newList);
    this.savePriceLists(lists);
    return newList;
  },

  updatePriceList(id: string, updates: Partial<DynamicPriceList>): void {
    const lists = this.getPriceLists().map(l => (l.id === id ? { ...l, ...updates } : l));
    this.savePriceLists(lists);
  },

  deletePriceList(id: string): void {
    const lists = this.getPriceLists().filter(l => l.id !== id);
    this.savePriceLists(lists);
  },

  // --- Customer Registration Approvals & Grading ---
  getCustomerApprovals(): CustomerApprovalRecord[] {
    try {
      const stored = localStorage.getItem(CUSTOMERS_APPROVAL_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    this.saveCustomerApprovals(INITIAL_CUSTOMER_APPROVALS);
    return INITIAL_CUSTOMER_APPROVALS;
  },

  saveCustomerApprovals(records: CustomerApprovalRecord[]): void {
    try {
      localStorage.setItem(CUSTOMERS_APPROVAL_KEY, JSON.stringify(records));
    } catch {
      // ignore
    }
  },

  getCustomerByPhone(phone: string): CustomerApprovalRecord | undefined {
    const clean = phone.trim();
    return this.getCustomerApprovals().find(c => c.phone === clean);
  },

  registerCustomer(data: Omit<CustomerApprovalRecord, 'id' | 'registeredAt' | 'status'>): CustomerApprovalRecord {
    const records = this.getCustomerApprovals();
    const existing = records.find(r => r.phone === data.phone.trim());
    if (existing) {
      return existing;
    }

    const newRecord: CustomerApprovalRecord = {
      ...data,
      id: 'cust-req-' + Date.now(),
      registeredAt: new Date().toLocaleDateString('fa-IR'),
      status: 'pending',
    };

    records.unshift(newRecord);
    this.saveCustomerApprovals(records);
    return newRecord;
  },

  approveAndGradeCustomer(
    customerId: string,
    gradeId: string,
    priceListId: string,
    creditLimit?: number,
    adminNotes?: string
  ): CustomerApprovalRecord | undefined {
    const records = this.getCustomerApprovals();
    const customer = records.find(c => c.id === customerId);
    if (!customer) return undefined;

    const grade = this.getGradeById(gradeId);
    const priceList = this.getPriceListById(priceListId);

    customer.status = 'approved';
    customer.assignedGradeId = gradeId;
    customer.assignedPriceListId = priceListId;
    customer.assignedCreditLimit = creditLimit ?? grade?.creditLimit ?? 50000000;
    customer.reviewedAt = new Date().toLocaleDateString('fa-IR');
    if (adminNotes) customer.adminNotes = adminNotes;
    delete customer.rejectionReason;

    this.saveCustomerApprovals(records);

    // If current logged-in customer is this user, update active session
    try {
      const activeUser = localStorage.getItem('hyper_sanat_auth_state_v2');
      if (activeUser) {
        const parsed = JSON.parse(activeUser);
        if (parsed.phone === customer.phone) {
          parsed.approvedB2B = true;
          parsed.gradeId = gradeId;
          parsed.priceListId = priceListId;
          parsed.creditLimit = customer.assignedCreditLimit;
          parsed.assignedGradeName = grade?.name;
          parsed.assignedPriceListName = priceList?.name;
          localStorage.setItem('hyper_sanat_auth_state_v2', JSON.stringify(parsed));
        }
      }
    } catch {
      // ignore
    }

    return customer;
  },

  rejectCustomer(customerId: string, reason: string): CustomerApprovalRecord | undefined {
    const records = this.getCustomerApprovals();
    const customer = records.find(c => c.id === customerId);
    if (!customer) return undefined;

    customer.status = 'rejected';
    customer.rejectionReason = reason;
    customer.reviewedAt = new Date().toLocaleDateString('fa-IR');
    this.saveCustomerApprovals(records);
    return customer;
  },

  // --- Dynamic Price Calculation Engine ---
  /**
   * Calculates the instant inquired price for a product based on user's assigned grade and price list.
   * If customer is not approved or not assigned, returns null (cannot view price, must inquire/wait for approval).
   */
  calculateInquiryPrice(
    product: Product,
    priceListId?: string,
    gradeId?: string
  ): {
    calculatedPrice: number;
    priceListName: string;
    gradeName: string;
    discountPercent: number;
    creditLimit: number;
    settlementDays: number;
  } | null {
    const baseRetail = product.prices.retail;
    if (!priceListId && !gradeId) return null;

    let targetPriceList: DynamicPriceList | undefined;
    let targetGrade: CustomerGrade | undefined;

    if (gradeId) {
      targetGrade = this.getGradeById(gradeId);
    }
    if (priceListId) {
      targetPriceList = this.getPriceListById(priceListId);
    } else if (targetGrade) {
      targetPriceList = this.getPriceListById(targetGrade.priceListId);
    }

    if (!targetPriceList) {
      targetPriceList = this.getPriceLists().find(p => p.isDefault) || INITIAL_PRICE_LISTS[3];
    }

    // Check if custom price exists for this product
    if (targetPriceList.customProductPrices && targetPriceList.customProductPrices[product.code]) {
      return {
        calculatedPrice: targetPriceList.customProductPrices[product.code],
        priceListName: targetPriceList.name,
        gradeName: targetGrade ? targetGrade.code : 'کرید اختصاصی',
        discountPercent: targetPriceList.discountPercent,
        creditLimit: targetGrade ? targetGrade.creditLimit : 0,
        settlementDays: targetGrade ? targetGrade.settlementDays : 0,
      };
    }

    // Calculate discounted price
    const discount = targetPriceList.discountPercent || 0;
    const finalPrice = Math.round(baseRetail * (1 - discount / 100));

    return {
      calculatedPrice: finalPrice,
      priceListName: targetPriceList.name,
      gradeName: targetGrade ? targetGrade.code : 'کرید معتبر',
      discountPercent: discount,
      creditLimit: targetGrade ? targetGrade.creditLimit : 0,
      settlementDays: targetGrade ? targetGrade.settlementDays : 0,
    };
  },

  // Instant inquiry status cache (keeps track of what products this user has inquired this session)
  getInquiryCache(): Record<string, boolean> {
    try {
      const stored = sessionStorage.getItem(USER_INQUIRY_CACHE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return {};
  },

  markProductInquired(productCode: string): void {
    try {
      const cache = this.getInquiryCache();
      cache[productCode] = true;
      sessionStorage.setItem(USER_INQUIRY_CACHE_KEY, JSON.stringify(cache));
    } catch {
      // ignore
    }
  },

  isProductInquired(productCode: string): boolean {
    const cache = this.getInquiryCache();
    return !!cache[productCode];
  },
};
