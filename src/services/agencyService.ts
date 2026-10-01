import {
  AgencyApplication,
  FinancialTransaction,
  DepositReceipt,
  SupplyRequest,
  DealerCatalogItem,
  SmsLog,
  TicketMessage,
} from '../types';

const APPLICATIONS_KEY = 'hyper_sanat_agency_applications_v1';
const SMS_LOGS_KEY = 'hyper_sanat_sms_logs_v1';
const RECEIPTS_KEY = 'hyper_sanat_deposit_receipts_v1';
const SUPPLY_KEY = 'hyper_sanat_supply_requests_v1';
const MESSAGES_KEY = 'hyper_sanat_dealer_messages_v1';

// Seed initial applications
const INITIAL_APPLICATIONS: AgencyApplication[] = [
  {
    id: 'app-101',
    trackingCode: 'AGY-74812',
    companyName: 'بازرگانی قطعات صنعتی پارس کویر',
    managerName: 'مهندس وحید صابری',
    nationalCode: '4430129871',
    phone: '09132514433',
    tel: '035-38257000',
    email: 'saberi.ind@gmail.com',
    province: 'یزد',
    city: 'یزد',
    fullAddress: 'بلوار جانباز، نرسیده به میدان مدرسی، روبروی مجتمع فنی پارس',
    activityFields: ['کاشی و سرامیک', 'عمده‌فروشی تسمه', 'تأمین قطعات کارخانجات'],
    activityYears: 8,
    personnelCount: 6,
    monthlyVolume: '۱۰۰ تا ۲۵۰ میلیون تومان',
    cooperationType: 'sales_agency',
    licenseDocument: {
      fileName: 'javaz_kasb_saberi.pdf',
      fileSize: '۱.۸ مگابایت',
    },
    notes: 'دارای انبار ۱۵۰ متری با دسترسی عالی به شهرک‌های صنعتی یزد و مهریز.',
    status: 'approved',
    submittedAt: '۱۴۰۳/۰۶/۱۰',
    reviewedAt: '۱۴۰۳/۰۶/۱۲',
  },
  {
    id: 'app-102',
    trackingCode: 'AGY-88402',
    companyName: 'ابزار صنعت سپاهان (کمالی)',
    managerName: 'مهندس علیرضا کمالی',
    nationalCode: '1289564123',
    phone: '09133189090',
    tel: '031-33809000',
    email: 'kamali.sepahan@yahoo.com',
    province: 'اصفهان',
    city: 'اصفهان',
    fullAddress: 'شهرک صنعتی محمودآباد، خیابان ۳۴، پلاک ۱۸',
    activityFields: ['نساجی', 'عمده‌فروشی تسمه', 'تأمین قطعات کارخانجات'],
    activityYears: 14,
    personnelCount: 12,
    monthlyVolume: 'بالای ۲۵۰ میلیون تومان',
    cooperationType: 'regional_distributor',
    licenseDocument: {
      fileName: 'parvaneh_kasb_kamali.jpg',
      fileSize: '۲.۴ مگابایت',
    },
    notes: 'پوشش کامل کارخانجات نساجی و سنگبری‌های اصفهان، کاشان و نجف‌آباد.',
    status: 'pending',
    submittedAt: '۱۴۰۳/۰۶/۲۰',
  },
  {
    id: 'app-103',
    trackingCode: 'AGY-91255',
    companyName: 'فروشگاه بلبرینگ و تسمه نوین میبد',
    managerName: 'آقای مرتضی فلاح‌زاده',
    nationalCode: '5039871245',
    phone: '09133571234',
    tel: '035-32356000',
    email: 'fallah.novin@gmail.com',
    province: 'یزد',
    city: 'میبد',
    fullAddress: 'میبد، بلوار شهید بهشتی، جنب ورودی جهان‌آباد',
    activityFields: ['کاشی و سرامیک', 'عمده‌فروشی تسمه'],
    activityYears: 6,
    personnelCount: 4,
    monthlyVolume: '۵۰ تا ۱۰۰ میلیون تومان',
    cooperationType: 'wholesale_distributor',
    licenseDocument: {
      fileName: 'sanad_malekiat_meybod.pdf',
      fileSize: '۱.۱ مگابایت',
    },
    notes: 'درخواست عاملیت توزیع غلتک‌های کوره اطلس و تسمه‌های SWR در قطب کاشی میبد و اردکان.',
    status: 'pending',
    submittedAt: '۱۴۰۳/۰۶/۲۱',
  },
];

// Seed initial SMS Logs
const INITIAL_SMS_LOGS: SmsLog[] = [
  {
    id: 'sms-init-1',
    recipientPhone: '09132514433',
    template: 'agency_submitted',
    message: 'بازرگانی تسمه اطلس: درخواست عاملیت شما با کد رهگیری AGY-74812 ثبت گردید. کارشناسان ما بررسی خواهند کرد.',
    status: 'delivered',
    sentAt: '۱۴۰۳/۰۶/۱۰ - ۱۱:۳۰',
  },
  {
    id: 'sms-init-2',
    recipientPhone: '09132514433',
    template: 'agency_approved',
    message: 'همکار گرامی جناب مهندس وحید صابری؛ درخواست عاملیت بازرگانی پارس کویر تأیید شد. پنل پخش شما فعال گردید.',
    status: 'delivered',
    sentAt: '۱۴۰۳/۰۶/۱۲ - ۱۴:۱۵',
  },
  {
    id: 'sms-init-3',
    recipientPhone: '09133189090',
    template: 'agency_submitted',
    message: 'بازرگانی تسمه اطلس: درخواست عاملیت شما با کد رهگیری AGY-88402 ثبت گردید. کارشناسان ما بررسی خواهند کرد.',
    status: 'delivered',
    sentAt: '۱۴۰۳/۰۶/۲۰ - ۱۰:۴۵',
  },
  {
    id: 'sms-init-4',
    recipientPhone: '09133571234',
    template: 'agency_submitted',
    message: 'بازرگانی تسمه اطلس: درخواست عاملیت شما با کد رهگیری AGY-91255 ثبت گردید. کارشناسان ما بررسی خواهند کرد.',
    status: 'delivered',
    sentAt: '۱۴۰۳/۰۶/۲۱ - ۱۶:۲۰',
  },
];

// Financial transactions seed for dealer
const INITIAL_FINANCIAL_TRANSACTIONS: FinancialTransaction[] = [
  {
    id: 'tx-1',
    date: '۱۴۰۳/۰۶/۱۸',
    description: 'فاکتور فروش عمده تسمه و غلتک کوره - شماره ATLAS-D-8812',
    type: 'invoice',
    debit: 185000000,
    credit: 0,
    balance: 185000000,
    referenceNumber: 'ATLAS-D-8812',
  },
  {
    id: 'tx-2',
    date: '۱۴۰۳/۰۶/۱۹',
    description: 'واریز نقدی به حساب بانک سپه شعبه مرکزی یزد (شناسه واریز ۷۸۰۱)',
    type: 'payment',
    debit: 0,
    credit: 100000000,
    balance: 85000000,
    referenceNumber: 'PAY-SEP-98124',
  },
  {
    id: 'tx-3',
    date: '۱۴۰۳/۰۶/۱۵',
    description: 'چک صیادی ۴۵ روزه بانک ملت (سری ب/۹۸۲۳)',
    type: 'cheque',
    debit: 0,
    credit: 40000000,
    balance: 45000000,
    referenceNumber: 'CHK-982341-MLT',
  },
  {
    id: 'tx-4',
    date: '۱۴۰۳/۰۶/۰۱',
    description: 'پاداش تحقق هدف فروش تابستانه (تخفیف حجم خرید ۳٪)',
    type: 'credit_rebate',
    debit: 0,
    credit: 5000000,
    balance: 40000000,
    referenceNumber: 'REBATE-1403-Q2',
  },
];

// Seed deposit receipts
const INITIAL_DEPOSIT_RECEIPTS: DepositReceipt[] = [
  {
    id: 'rec-1',
    amount: 100000000,
    trackingNumber: '7801948231',
    bankName: 'بانک سپه',
    paymentDate: '۱۴۰۳/۰۶/۱۹',
    status: 'approved',
    submittedAt: '۱۴۰۳/۰۶/۱۹ - ۱۲:۳۰',
    notes: 'تسویه قسط اول فاکتور D-8812',
  },
];

// Seed supply requests
const INITIAL_SUPPLY_REQUESTS: SupplyRequest[] = [
  {
    id: 'sup-1',
    requestNumber: 'SUP-1403-401',
    productName: 'تسمه چند شیار Poly-V پروفیل PL گام ۴.۷ میلی‌متر طول ۳۲۰۰',
    brand: 'Megadyne یا Continental',
    technicalSpecs: 'پروفیل PL، ۱۸ دندانه، الیاف آرامید ضد روغن برای کمپرسورهای اسکرو ۲۵۰ کیلووات',
    quantity: 12,
    urgency: 'urgent',
    dealerName: 'نمایندگی مرکزی یزد',
    status: 'sourcing',
    adminResponse: 'در حال هماهنگی با گمرک فرودگاه امام؛ بار ترخیص ظرف ۴۸ ساعت ارسال می‌شود.',
    submittedAt: '۱۴۰۳/۰۶/۱۹',
  },
  {
    id: 'sup-2',
    requestNumber: 'SUP-1403-402',
    productName: 'شانه فلزی نساجی ضد اکسیداسیون استیل ۳۱۶ گام ۲۴',
    brand: 'اطلس / وارداتی اروپا',
    technicalSpecs: 'طول ۱۸۰ سانتی‌متر، دندانه‌بندی دقیق برای دستگاه‌های دورنیه پیکانول',
    quantity: 5,
    urgency: 'emergency_halt',
    dealerName: 'نمایندگی منطقه اصفهان',
    status: 'available',
    adminResponse: 'تعداد ۶ شاخه در انبار مرکزی یزد رزرو شد. حواله خروج صادر گردید.',
    submittedAt: '۱۴۰۳/۰۶/۲۰',
  },
];

// Seed dealer messages
const INITIAL_DEALER_MESSAGES: TicketMessage[] = [
  {
    id: 'msg-1',
    sender: 'support',
    senderName: 'مدیریت بازرگانی اطلس (مهندس مرتضوی)',
    message: 'همکاران گرامی نمایندگی؛ بار جدید تسمه‌های اسپشیال SWR آلمان و غلتک‌های سرامیکی در انبار مرکزی یزد تخلیه شد. اولویت تخصیص سهمیه با سفارش‌های دارای فاکتور قطعی است.',
    timestamp: '۱۴۰۳/۰۶/۱۵ - ۱۰:۰۰',
  },
  {
    id: 'msg-2',
    sender: 'user',
    senderName: 'نماینده پخش (مهندس صابری)',
    message: 'با سلام و احترام؛ برای خط تولید کارخانه کاشی به ۵۰ حلقه تسمه SPB 2240 تا فردا ظهر نیاز داریم. آیا امکان ارسال با باربری سریع اختصاصی به میبد فراهم است؟',
    timestamp: '۱۴۰3/06/18 - ۱۱:۲۰',
  },
  {
    id: 'msg-3',
    sender: 'support',
    senderName: 'واحد لجستیک و انبار اطلس',
    message: 'سلام جناب صابری عزیز؛ موجودی رزرو شد و حواله انبار صادر گردید. تحویل راننده باربری ساعت ۱۴ انجام می‌شود و شماره پلاک و بارنامه خدمتتان پیامک خواهد شد.',
    timestamp: '۱۴۰۳/۰۶/۱۸ - ۱۱:۴۵',
  },
];

// Catalog downloads
const DEALER_CATALOGS: DealerCatalogItem[] = [
  {
    id: 'cat-1',
    title: 'کاتالوگ جامع مهندسی تسمه‌های صنعتی SWR آلمان (ویرایش ۲۰۲۴)',
    category: 'کاتالوگ فنی',
    fileSize: '۱۴.۲ مگابایت',
    format: 'PDF',
    updatedAt: 'شهریور ۱۴۰۳',
    downloadCount: 342,
  },
  {
    id: 'cat-2',
    title: 'لیست قیمت رسمی پخش و عمده‌فروشی بازرگانی اطلس (فایل اکسل فرمول‌دار)',
    category: 'لیست قیمت همکار',
    fileSize: '۲.۸ مگابایت',
    format: 'XLSX',
    updatedAt: 'هفته جاری',
    downloadCount: 890,
  },
  {
    id: 'cat-3',
    title: 'دیتاشیت تحمل حرارتی و جدول انحنای غلتک‌های سرامیکی کوره AT-751',
    category: 'راهنمای کوره کاشی',
    fileSize: '۴.۱ مگابایت',
    format: 'PDF',
    updatedAt: 'مرداد ۱۴۰۳',
    downloadCount: 195,
  },
  {
    id: 'cat-4',
    title: 'فرم رسمی تفاهم‌نامه عاملیت فروش و سهمیه‌بندی فصلی (مهر و امضا)',
    category: 'اسناد حقوقی',
    fileSize: '۱.۵ مگابایت',
    format: 'PDF',
    updatedAt: 'تیر ۱۴۰۳',
    downloadCount: 120,
  },
  {
    id: 'cat-5',
    title: 'پکیج لوگوها و بنرهای تبلیغاتی برندهای انحصاری FORZA و SWR با وضوح بالا',
    category: 'مواد بازاریابی فروشگاه',
    fileSize: '۲۸.۵ مگابایت',
    format: 'ZIP',
    updatedAt: 'خرداد ۱۴۰۳',
    downloadCount: 260,
  },
];

export const agencyService = {
  // --- Applications ---
  getApplications(): AgencyApplication[] {
    try {
      const stored = localStorage.getItem(APPLICATIONS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(INITIAL_APPLICATIONS));
    return INITIAL_APPLICATIONS;
  },

  saveApplications(apps: AgencyApplication[]): void {
    try {
      localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
    } catch {
      // ignore
    }
  },

  getApplicationByTracking(code: string): AgencyApplication | undefined {
    const apps = this.getApplications();
    const clean = code.trim().toUpperCase();
    return apps.find(a => a.trackingCode.toUpperCase() === clean);
  },

  getApplicationByPhone(phone: string): AgencyApplication | undefined {
    const apps = this.getApplications();
    const clean = phone.trim();
    return apps.find(a => a.phone === clean);
  },

  submitApplication(data: Omit<AgencyApplication, 'id' | 'trackingCode' | 'status' | 'submittedAt'>): AgencyApplication {
    const apps = this.getApplications();
    const randomCode = 'AGY-' + Math.floor(10000 + Math.random() * 90000);
    const newApp: AgencyApplication = {
      ...data,
      id: 'app-' + Date.now(),
      trackingCode: randomCode,
      status: 'pending',
      submittedAt: new Date().toLocaleDateString('fa-IR'),
    };

    apps.unshift(newApp);
    this.saveApplications(apps);

    // Create confirmation SMS log
    this.addSmsLog({
      recipientPhone: data.phone,
      template: 'agency_submitted',
      message: `بازرگانی تسمه اطلس: درخواست عاملیت شما با کد رهگیری ${randomCode} ثبت گردید. کارشناسان ما ظرف ۲۴ ساعت آینده بررسی خواهند کرد.`,
    });

    return newApp;
  },

  approveApplication(
    id: string,
    options?: {
      username?: string;
      password?: string;
      initialCreditLimit?: number;
      agencyCode?: string;
    }
  ): { app: AgencyApplication; credentials: { username: string; password: string; agencyCode: string } } | undefined {
    const apps = this.getApplications();
    const app = apps.find(a => a.id === id);
    if (!app) return undefined;

    const generatedCode = options?.agencyCode || 'DLR-' + Math.floor(10000 + Math.random() * 90000);
    const username = options?.username || app.phone.trim();
    const password = options?.password || ('Atlas@' + Math.floor(1000 + Math.random() * 9000));
    const creditLimit = options?.initialCreditLimit || 250000000;

    app.status = 'approved';
    app.reviewedAt = new Date().toLocaleDateString('fa-IR');
    delete app.rejectionReason;
    this.saveApplications(apps);

    // Provision Zero-Data Dedicated Dealer Profile
    const dealerAccount = {
      id: 'dealer-' + app.id,
      agencyCode: generatedCode,
      username: username,
      password: password,
      managerName: app.managerName,
      companyName: app.companyName,
      phone: app.phone,
      creditLimit: creditLimit,
      usedCredit: 0,
      availableCredit: creditLimit,
      openInvoicesCount: 0,
      activeOrdersCount: 0,
      approvedAt: app.reviewedAt,
      isFreshZeroData: true,
    };

    try {
      const dealersKey = 'hyper_sanat_approved_dealers_v1';
      const stored = localStorage.getItem(dealersKey);
      const list = stored ? JSON.parse(stored) : [];
      const filtered = list.filter((d: any) => d.phone !== app.phone);
      filtered.push(dealerAccount);
      localStorage.setItem(dealersKey, JSON.stringify(filtered));

      // Also register into users store so login recognizes dealer role
      const usersKey = 'hyper_sanat_registered_users_v2';
      const usersStored = localStorage.getItem(usersKey);
      const userList = usersStored ? JSON.parse(usersStored) : [];
      const userIdx = userList.findIndex((u: any) => u.phone === app.phone);
      const dealerUserData = {
        id: 'user-dealer-' + app.id,
        fullName: app.managerName,
        companyName: app.companyName,
        phone: app.phone,
        password: password,
        role: 'dealer',
        clubTier: 'gold',
        clubPoints: 0,
        approvedB2B: true,
        agencyCode: generatedCode,
        creditLimit: creditLimit,
        city: app.city,
        province: app.province,
        createdAt: app.reviewedAt,
      };
      if (userIdx >= 0) {
        userList[userIdx] = { ...userList[userIdx], ...dealerUserData };
      } else {
        userList.push(dealerUserData);
      }
      localStorage.setItem(usersKey, JSON.stringify(userList));
    } catch {
      // ignore
    }

    // Create approval SMS with Username & Password
    this.addSmsLog({
      recipientPhone: app.phone,
      template: 'agency_approved',
      message: `همکار گرامی جناب ${app.managerName}؛ عاملیت شما در هایپر صنعت اطلس یزد تأیید گردید. پرتال نمایندگی شما با سقف اعتبار ${new Intl.NumberFormat('fa-IR').format(creditLimit)} تومان فعال شد.\nنام کاربری: ${username}\nرمز عبور: ${password}\nکد عاملیت: ${generatedCode}`,
    });

    return {
      app,
      credentials: {
        username,
        password,
        agencyCode: generatedCode,
      },
    };
  },

  rejectApplication(id: string, reason: string): AgencyApplication | undefined {
    const apps = this.getApplications();
    const app = apps.find(a => a.id === id);
    if (!app) return undefined;

    app.status = 'rejected';
    app.rejectionReason = reason;
    app.reviewedAt = new Date().toLocaleDateString('fa-IR');
    this.saveApplications(apps);

    // Create rejection SMS
    this.addSmsLog({
      recipientPhone: app.phone,
      template: 'agency_rejected',
      message: `متقاضی محترم جناب ${app.managerName}؛ درخواست عاملیت شما به دلیل «${reason}» تأیید نشد. جهت بررسی مجدد تماس حاصل فرمایید.`,
    });

    return app;
  },

  // --- SMS Logs ---
  getSmsLogs(): SmsLog[] {
    try {
      const stored = localStorage.getItem(SMS_LOGS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    localStorage.setItem(SMS_LOGS_KEY, JSON.stringify(INITIAL_SMS_LOGS));
    return INITIAL_SMS_LOGS;
  },

  addSmsLog(params: {
    recipientPhone: string;
    template: SmsLog['template'];
    message: string;
  }): SmsLog {
    const logs = this.getSmsLogs();
    const now = new Date();
    const timeStr = `${now.toLocaleDateString('fa-IR')} - ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newLog: SmsLog = {
      id: 'sms-' + Date.now(),
      recipientPhone: params.recipientPhone,
      template: params.template,
      message: params.message,
      status: 'delivered',
      sentAt: timeStr,
    };
    logs.unshift(newLog);
    try {
      localStorage.setItem(SMS_LOGS_KEY, JSON.stringify(logs));
    } catch {
      // ignore
    }
    return newLog;
  },

  // --- Financial Statement ---
  getFinancialTransactions(): FinancialTransaction[] {
    return INITIAL_FINANCIAL_TRANSACTIONS;
  },

  getFinancialOverview() {
    const creditLimit = 200000000; // سقف اعتبار مصوب ۲۰۰ میلیون تومان
    const currentDebt = 40000000;  // مانده بدهی جاری ۴۰ میلیون تومان
    const availableCredit = creditLimit - currentDebt; // ۱۶۰ میلیون اعتبار آزاد
    const pendingCheques = 40000000; // چک‌های در جریان وصول
    return {
      creditLimit,
      currentDebt,
      availableCredit,
      pendingCheques,
      lastPaymentDate: '۱۴۰۳/۰۶/۱۹',
      settlementRating: 'عالی (رتبه A+)',
    };
  },

  getDepositReceipts(): DepositReceipt[] {
    try {
      const stored = localStorage.getItem(RECEIPTS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return INITIAL_DEPOSIT_RECEIPTS;
  },

  submitDepositReceipt(data: Omit<DepositReceipt, 'id' | 'status' | 'submittedAt'>): DepositReceipt {
    const receipts = this.getDepositReceipts();
    const now = new Date();
    const timeStr = `${now.toLocaleDateString('fa-IR')} - ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newReceipt: DepositReceipt = {
      ...data,
      id: 'rec-' + Date.now(),
      status: 'pending',
      submittedAt: timeStr,
    };
    receipts.unshift(newReceipt);
    try {
      localStorage.setItem(RECEIPTS_KEY, JSON.stringify(receipts));
    } catch {
      // ignore
    }

    this.addSmsLog({
      recipientPhone: '09131512345',
      template: 'deposit_received',
      message: `رسید واریز شما به مبلغ ${data.amount.toLocaleString('fa-IR')} تومان ثبت شد و پس از بررسی حسابداری تأیید می‌شود.`,
    });

    return newReceipt;
  },

  // --- Supply Requests ---
  getSupplyRequests(): SupplyRequest[] {
    try {
      const stored = localStorage.getItem(SUPPLY_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return INITIAL_SUPPLY_REQUESTS;
  },

  submitSupplyRequest(data: Omit<SupplyRequest, 'id' | 'requestNumber' | 'status' | 'submittedAt'>): SupplyRequest {
    const requests = this.getSupplyRequests();
    const randomNum = 'SUP-1403-' + Math.floor(100 + Math.random() * 900);
    const newReq: SupplyRequest = {
      ...data,
      id: 'sup-' + Date.now(),
      requestNumber: randomNum,
      status: 'pending',
      submittedAt: new Date().toLocaleDateString('fa-IR'),
    };
    requests.unshift(newReq);
    try {
      localStorage.setItem(SUPPLY_KEY, JSON.stringify(requests));
    } catch {
      // ignore
    }
    return newReq;
  },

  // --- Dealer Internal Messages ---
  getDealerMessages(): TicketMessage[] {
    try {
      const stored = localStorage.getItem(MESSAGES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return INITIAL_DEALER_MESSAGES;
  },

  sendDealerMessage(text: string, senderName: string): TicketMessage {
    const messages = this.getDealerMessages();
    const now = new Date();
    const timeStr = `${now.toLocaleDateString('fa-IR')} - ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newMsg: TicketMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      senderName: senderName || 'نماینده پخش',
      message: text.trim(),
      timestamp: timeStr,
    };
    messages.push(newMsg);
    try {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
    return newMsg;
  },

  // --- Catalogs ---
  getCatalogs(): DealerCatalogItem[] {
    return DEALER_CATALOGS;
  },
};
