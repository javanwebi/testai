import { Product, Order, PriceInquiry, Customer, DiscountCode, SmsLog, AgencyApplication, Category, Brand, Ticket, Representative, OfficialInvoice } from '../types';
import { generateMockProducts } from '../data/mockGenerator';
import { MOCK_CUSTOMERS, MOCK_ORDERS, MOCK_INQUIRIES, MOCK_DISCOUNT_CODES, MOCK_SMS_LOGS, MOCK_REPRESENTATIVES } from '../data/mockData';
import { CATEGORIES } from '../data/categories';
import { BRANDS } from '../data/brands';
import { agencyService } from './agencyService';

export type { SmsLog, OfficialInvoice };

export type AdminAuditLog = AuditLog;
export type InquiryRequest = PriceInquiry;

export interface AdminOrder {
  id: string;
  customerName: string;
  company?: string;
  phone: string;
  totalAmount: number;
  paymentMethod: 'online' | 'receipt' | 'credit';
  status: 'pending' | 'confirmed' | 'packing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  items: {
    productCode: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  receiptVerified?: boolean;
  receiptImageUrl?: string;
  receiptTrackingCode?: string;
  carrier?: string;
  trackingNumber?: string;
  shippingAddress?: string;
}

export interface SupportTicket {
  id: string;
  customerName: string;
  phone: string;
  subject: string;
  status: 'open' | 'in_progress' | 'answered' | 'closed';
  createdAt: string;
  messages: {
    id: string;
    sender: 'user' | 'admin';
    text: string;
    timestamp: string;
  }[];
}

export interface ActiveAgency {
  id: string;
  code: string;
  name: string;
  phone: string;
  province: string;
  city: string;
  creditLimit: number;
  currentBalance: number;
  nextCheckDate: string;
  contractStatus: 'valid' | 'expired' | 'pending_renewal';
}

export interface SupplyRequestItem {
  id: string;
  agencyName: string;
  productName: string;
  productCode: string;
  quantity: number;
  urgency: 'normal' | 'immediate';
  status: 'pending' | 'approved' | 'dispatched';
  createdAt: string;
}

export interface ClubMember {
  id: string;
  name: string;
  phone: string;
  points: number;
  level: string;
  joinedAt: string;
}

export interface RewardRequestItem {
  id: string;
  memberName: string;
  phone: string;
  rewardTitle: string;
  pointsCost: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  role: 'super_admin' | 'sales_manager' | 'warehouse_operator';
  email: string;
  lastLogin: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  action: string;
  entity?: string;
  target?: string;
  details: string;
  timestamp: string;
  [key: string]: any;
}

export interface PriceHistoryRecord {
  id: string;
  productCode: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  changedBy: string;
  reason: string;
  date: string;
}

export interface ImportPreviewRow {
  rowNumber: number;
  code: string;
  name: string;
  brand: string;
  category: string;
  basePrice: number;
  retailPrice: number;
  wholesalePrice: number;
  dealerPrice: number;
  stock: number;
  status: 'new' | 'update' | 'error';
  errorMessage?: string;
  existingProduct?: Product;
}

export interface ImportResultReport {
  totalProcessed: number;
  newCount: number;
  newCreated?: number;
  updatedCount: number;
  updated?: number;
  errorCount: number;
  errorsCount?: number;
  errors: { row: number; code: string; message: string }[];
  errorDetails?: any[];
  timestamp: string;
}

export interface BannerItem {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  position: 'hero_slider' | 'middle_banner' | 'footer_banner';
  order: number;
  active: boolean;
  validUntil?: string;
}

export interface SmsTemplate {
  id: string;
  eventKey: 'register' | 'order_submit' | 'order_status' | 'agency_approve' | 'inquiry_answer' | 'custom_bulk';
  title: string;
  text: string;
  variables: string[];
}

export interface ClubConfig {
  pointsPer100kTomans: number; // e.g. 1 point per 100,000 Tomans
  tomanPerPointRedeem: number; // e.g. 5,000 Tomans per point discount
  bronzeThreshold: number;     // 0
  silverThreshold: number;     // 500
  goldThreshold: number;       // 1200
  welcomeGiftPoints: number;   // 50
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  author?: string;
  excerpt?: string;
  content: string;
  imageUrl: string;
  publishedAt?: string;
  published?: boolean;
  createdAt?: string;
  views?: number;
  tags?: string[];
}

export interface StaticPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  lastUpdated: string;
}

export interface CampaignItem {
  id: string;
  title: string;
  description?: string;
  multiplier?: number;
  validUntil?: string;
  rewardType?: 'points' | 'discount_code' | 'free_gift';
  rewardValue?: string;
  startDate?: string;
  endDate?: string;
  targetTier?: 'all' | 'silver' | 'gold';
  active: boolean;
  participantsCount?: number;
}

export interface SystemSettings {
  paymentGateway?: {
    provider: 'mellat' | 'saman' | 'zarinpal';
    merchantId: string;
    terminalId: string;
    sandbox: boolean;
  };
  paymentGateways?: any;
  smsProvider?: {
    provider: 'kavenegar' | 'melipayamak' | 'farapayamak';
    apiKey: string;
    senderNumber: string;
  };
  smsConfig?: any;
  shippingMethods?: {
    barbari: boolean;
    tipax: boolean;
    expressPost: boolean;
    dedicatedFleet: boolean;
  };
  shippingMethodsConfig?: any;
  currency?: 'toman' | 'rial';
  seo?: {
    metaTitle: string;
    metaDescription: string;
    keywords: string;
    canonicalBase: string;
  };
  [key: string]: any;
}

const STORAGE_KEYS = {
  ADMIN_AUTH: 'atlas_admin_auth_v1',
  ADMIN_PRODUCTS: 'atlas_admin_products_v1',
  PRICE_LOGS: 'atlas_admin_price_logs_v1',
  AUDIT_LOGS: 'atlas_admin_audit_logs_v1',
  BANNERS: 'atlas_admin_banners_v1',
  SMS_TEMPLATES: 'atlas_admin_sms_templates_v1',
  CLUB_CONFIG: 'atlas_admin_club_config_v1',
  INQUIRIES: 'atlas_admin_inquiries_v1',
  ORDERS: 'atlas_admin_orders_v1',
  CUSTOMERS: 'atlas_admin_customers_v1',
  DISCOUNTS: 'atlas_admin_discounts_v1',
  CATEGORIES: 'atlas_admin_categories_v1',
  BRANDS: 'atlas_admin_brands_v1',
  DEALERS: 'atlas_admin_dealers_v1',
  TICKETS: 'atlas_admin_tickets_v1',
  BLOG: 'atlas_admin_blog_v1',
  PAGES: 'atlas_admin_pages_v1',
  CAMPAIGNS: 'atlas_admin_campaigns_v1',
  SETTINGS: 'atlas_admin_settings_v1',
};

// Initial Seed Data
const INITIAL_ADMINS: AdminUser[] = [
  {
    id: 'adm-1',
    username: 'admin',
    name: 'مهندس مرتضوی (مدیر کل بازرگانی)',
    role: 'super_admin',
    email: 'admin@hyper-sanat.ir',
    lastLogin: '۱۴۰۳/۰۶/۲۱ - ۱۰:۱۵',
  },
  {
    id: 'adm-2',
    username: 'sales',
    name: 'خانم دهقان (کارشناس ارشد فروش و استعلام)',
    role: 'sales_manager',
    email: 'sales@hyper-sanat.ir',
    lastLogin: '۱۴۰۳/۰۶/۲۱ - ۰۹:۴۰',
  },
  {
    id: 'adm-3',
    username: 'warehouse',
    name: 'آقای فلاح (مسئول انبار مرکزی یزد)',
    role: 'warehouse_operator',
    email: 'stock@hyper-sanat.ir',
    lastLogin: '۱۴۰۳/۰۶/۲۱ - ۰۸:۲۰',
  },
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    userId: 'adm-1',
    userName: 'مهندس مرتضوی',
    userRole: 'مدیر کل',
    action: 'تأیید نمایندگی',
    entity: 'نمایندگی کاشی ستاره میبد',
    details: 'درخواست نمایندگی تأیید و سقف اعتبار ۲۵۰ میلیون تومان فعال گردید.',
    timestamp: '۱۴۰۳/۰۶/۲۱ - ۱۱:۳۰',
  },
  {
    id: 'log-2',
    userId: 'adm-2',
    userName: 'خانم دهقان',
    userRole: 'کارشناس فروش',
    action: 'پاسخ به استعلام قیمت',
    entity: 'استعلام INQ-7481',
    details: 'قیمت تسمه تایمینگ ۵,۲۰۰,۰۰۰ تومان با اعتبار ۷ روزه اعلام شد.',
    timestamp: '۱۴۰۳/۰۶/۲۱ - ۱۰:۰۵',
  },
  {
    id: 'log-3',
    userId: 'adm-3',
    userName: 'آقای فلاح',
    userRole: 'انباردار',
    action: 'به‌روزرسانی موجودی انبار',
    entity: 'کد SWR-230',
    details: 'موجودی انبار مرکزی از ۸۵ به ۱۲۰ حلقه تغییر یافت.',
    timestamp: '۱۴۰۳/۰۶/۲۰ - ۱۶:۴۵',
  },
];

const INITIAL_PRICE_HISTORY: PriceHistoryRecord[] = [
  {
    id: 'ph-1',
    productCode: 'AT-751',
    productName: 'غلتک سرامیکی نسوز کوره مدل AT-751',
    oldPrice: 3200000,
    newPrice: 3450000,
    changedBy: 'مهندس مرتضوی',
    reason: 'افزایش هزینه ترخیص گمرکی و حمل',
    date: '۱۴۰۳/۰۶/۱۵',
  },
  {
    id: 'ph-2',
    productCode: 'SWR-230',
    productName: 'تسمه تایمینگ دنده‌ای HTD-8M-1760',
    oldPrice: 1550000,
    newPrice: 1650000,
    changedBy: 'خانم دهقان',
    reason: 'به‌روزرسانی طبق لیست رسمی ۲۰۲۴ شرکت SWR',
    date: '۱۴۰۳/۰۶/۱۰',
  },
];

const INITIAL_BANNERS: BannerItem[] = [
  {
    id: 'ban-1',
    title: 'تخفیف شگفت‌انگیز تسمه‌های صنعتی SWR و FORZA',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&q=80',
    linkUrl: '/category/swr-forza-exclusive',
    position: 'hero_slider',
    order: 1,
    active: true,
  },
  {
    id: 'ban-2',
    title: 'تأمین فوری قطعات کوره کارخانجات کاشی و سرامیک یزد',
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&q=80',
    linkUrl: '/category/ceramic-tiles',
    position: 'hero_slider',
    order: 2,
    active: true,
  },
  {
    id: 'ban-3',
    title: 'جذب نمایندگی فعال و عاملیت فروش در سراسر کشور',
    imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80',
    linkUrl: '/agency',
    position: 'middle_banner',
    order: 1,
    active: true,
  },
];

const INITIAL_SMS_TEMPLATES: SmsTemplate[] = [
  {
    id: 'tpl-1',
    eventKey: 'register',
    title: 'خوش‌آمدگویی ثبت‌نام و باشگاه مشتریان',
    text: 'کاربر گرامی {customer_name}، به هایپر صنعت خوش آمدید. ۵۰ امتیاز باشگاه و کد تخفیف ۱۰٪ اولین خرید (WELCOME10) به حساب شما واریز گردید.',
    variables: ['{customer_name}'],
  },
  {
    id: 'tpl-2',
    eventKey: 'order_status',
    title: 'اطلاع‌رسانی تغییر وضعیت سفارش',
    text: 'سفارش شما به شماره {order_number} به وضعیت «{new_status}» تغییر یافت. بارنامه: {tracking_code} | هایپر صنعت',
    variables: ['{order_number}', '{new_status}', '{tracking_code}'],
  },
  {
    id: 'tpl-3',
    eventKey: 'inquiry_answer',
    title: 'پاسخ به استعلام قیمت قطعات صنعتی',
    text: 'مشتری گرامی {customer_name}، استعلام قیمت کالای {product_name} پاسخ داده شد. قیمت مصوب: {price} تومان (معتبر تا {validity_date}). جزئیات در پرتال: hypersanat.ir',
    variables: ['{customer_name}', '{product_name}', '{price}', '{validity_date}'],
  },
  {
    id: 'tpl-4',
    eventKey: 'agency_approve',
    title: 'تأیید درخواست نمایندگی و فعال‌سازی پرتال پخش',
    text: 'جناب {manager_name}، با تبریک، درخواست عاملیت شما برای واحد {company_name} تأیید شد. پرتال پخش و خرید با تخفیف نمایندگی فعال گردید: hypersanat.ir/dealer',
    variables: ['{manager_name}', '{company_name}'],
  },
];

const INITIAL_CLUB_CONFIG: ClubConfig = {
  pointsPer100kTomans: 1,
  tomanPerPointRedeem: 5000,
  bronzeThreshold: 0,
  silverThreshold: 500,
  goldThreshold: 1200,
  welcomeGiftPoints: 50,
};

export const adminService = {
  // --- Admin Auth ---
  getCurrentAdmin(): AdminUser | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return null;
  },

  getCurrentUser(): AdminUser | null {
    return this.getCurrentAdmin();
  },

  login(username: string, pass: string): AdminUser | null {
    if ((username === 'admin' && pass === '123admin') || (username === 'sales' && pass === '123sales')) {
      const found = INITIAL_ADMINS.find(a => a.username === username) || INITIAL_ADMINS[0];
      const sessionUser = {
        ...found,
        lastLogin: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      };
      localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, JSON.stringify(sessionUser));
      this.logAction('ورود به پنل', 'سیستم مدیریت', 'ورود موفق به پنل مدیریت');
      return sessionUser;
    }
    return null;
  },

  logout(): void {
    this.logAction('خروج از پنل', 'سیستم مدیریت', 'خروج کاربر ادمین');
    localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
  },

  switchAdminRole(role: AdminUser['role']): AdminUser {
    const current = this.getCurrentAdmin() || INITIAL_ADMINS[0];
    const updated: AdminUser = {
      ...current,
      role,
      name: role === 'super_admin' ? 'مهندس مرتضوی (مدیر کل)' : role === 'sales_manager' ? 'خانم دهقان (کارشناس فروش)' : 'آقای فلاح (انباردار)',
    };
    localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, JSON.stringify(updated));
    this.logAction('تغییر نقش اپراتور', 'دسترسی', `نقش به ${role} تغییر یافت.`);
    return updated;
  },

  // --- Audit Logs ---
  getAuditLogs(): AuditLog[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return INITIAL_AUDIT_LOGS;
  },

  logAction(action: string, entity: string, details: string): void {
    const admin = this.getCurrentAdmin() || INITIAL_ADMINS[0];
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: 'log-' + Date.now(),
      userId: admin.id,
      userName: admin.name,
      userRole: admin.role,
      action,
      entity,
      details,
      timestamp: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    };
    logs.unshift(newLog);
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 100)));
    } catch {
      // ignore
    }
  },

  // --- Products Management ---
  getProducts(): Product[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ADMIN_PRODUCTS);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    const initial = generateMockProducts().slice(0, 35);
    try {
      localStorage.setItem(STORAGE_KEYS.ADMIN_PRODUCTS, JSON.stringify(initial));
    } catch {
      // ignore
    }
    return initial;
  },

  saveProduct(product: Product): void {
    const list = this.getProducts();
    const idx = list.findIndex(p => p.code === product.code);
    const admin = this.getCurrentAdmin();

    if (idx >= 0) {
      const old = list[idx];
      // Check if price changed
      if (old.prices.retail !== product.prices.retail) {
        this.addPriceLog({
          productCode: product.code,
          productName: product.name,
          oldPrice: old.prices.retail,
          newPrice: product.prices.retail,
          changedBy: admin?.name || 'مدیر سیستم',
          reason: 'ویرایش مستقیم کالا در پنل',
        });
      }
      list[idx] = product;
      this.logAction('ویرایش کالا', `کد ${product.code}`, `کالای «${product.name}» به‌روزرسانی شد.`);
    } else {
      list.unshift(product);
      this.logAction('افزودن کالا', `کد ${product.code}`, `کالای جدید «${product.name}» ثبت شد.`);
    }

    try {
      localStorage.setItem(STORAGE_KEYS.ADMIN_PRODUCTS, JSON.stringify(list));
    } catch {
      // ignore
    }
  },

  deleteProduct(code: string): void {
    const list = this.getProducts();
    const filtered = list.filter(p => p.code !== code);
    this.logAction('حذف کالا', `کد ${code}`, `کالای با کد ${code} از سیستم حذف شد.`);
    try {
      localStorage.setItem(STORAGE_KEYS.ADMIN_PRODUCTS, JSON.stringify(filtered));
    } catch {
      // ignore
    }
  },

  // --- Price Multipliers & Category Batch Update ---
  batchUpdateCategoryPrices(categorySlug: string, percentChange: number, reason: string): number {
    const list = this.getProducts();
    let updatedCount = 0;
    const factor = 1 + percentChange / 100;
    const admin = this.getCurrentAdmin();

    const updatedList = list.map(p => {
      if (categorySlug === 'all' || p.categorySlug === categorySlug) {
        const oldPrice = p.prices.retail;
        const newRetail = Math.round((p.prices.retail * factor) / 1000) * 1000;
        const newWholesale = Math.round((p.prices.wholesale * factor) / 1000) * 1000;
        const newDealer = Math.round((p.prices.dealer * factor) / 1000) * 1000;
        const newBase = Math.round((p.prices.base * factor) / 1000) * 1000;

        if (oldPrice !== newRetail) {
          this.addPriceLog({
            productCode: p.code,
            productName: p.name,
            oldPrice,
            newPrice: newRetail,
            changedBy: admin?.name || 'مدیر بازرگانی',
            reason: reason || `تغییر گروهی ${percentChange}% روی دسته`,
          });
          updatedCount++;
        }

        return {
          ...p,
          prices: {
            base: newBase,
            retail: newRetail,
            wholesale: newWholesale,
            dealer: newDealer,
          },
        };
      }
      return p;
    });

    try {
      localStorage.setItem(STORAGE_KEYS.ADMIN_PRODUCTS, JSON.stringify(updatedList));
    } catch {
      // ignore
    }

    this.logAction('تغییر قیمت گروهی', `دسته: ${categorySlug}`, `اعمال ضریب ${percentChange}% روی ${updatedCount} کالا`);
    return updatedCount;
  },

  // --- Price History Logs ---
  getPriceHistory(): PriceHistoryRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PRICE_LOGS);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return INITIAL_PRICE_HISTORY;
  },

  addPriceLog(record: Omit<PriceHistoryRecord, 'id' | 'date'>): void {
    const logs = this.getPriceHistory();
    const newLog: PriceHistoryRecord = {
      ...record,
      id: 'ph-' + Date.now(),
      date: new Date().toLocaleDateString('fa-IR'),
    };
    logs.unshift(newLog);
    try {
      localStorage.setItem(STORAGE_KEYS.PRICE_LOGS, JSON.stringify(logs.slice(0, 50)));
    } catch {
      // ignore
    }
  },

  // --- Bulk Import Engine ---
  getSampleCsvText(): string {
    return `کد کالا,نام محصول,برند,دسته‌بندی,قیمت پایه,موجودی
AT-751,غلتک سرامیکی نسوز کوره مدل AT-751 اطلس یزد,اطلس پاور,قطعات کاشی و سرامیک,2550000,60
SWR-230,تسمه تایمینگ دنده‌ای تقویت‌شده SWR آلمان مدل HTD-8M-1760,اس دبلیو آر (SWR),برندهای ویژه SWR و FORZA,1250000,150
FORZA-C85,تسمه پروانه‌ای استاندارد FORZA ایتالیا تیپ C طول ۲۱۵۰,فورزا (FORZA),برندهای ویژه SWR و FORZA,680000,220
AT-999,تسمه پلی‌یورتان اسپشیال با روکش لاستیکی نسوز کوره مدل AT-999,اطلس پاور,قطعات کاشی و سرامیک,3850000,30
TXT-404,شیطانک بافندگی نساجی ضد سایش دورنیه,پیکانول / اطلس,ماشین‌آلات نساجی,890000,75
ERR-001,تسمه بدون قیمت تستی,نامشخص,ناشناخته,0,-5`;
  },

  parseAndPreviewCsv(rawText: string): ImportPreviewRow[] {
    const existingList = this.getProducts();
    const existingMap = new Map<string, Product>();
    existingList.forEach(p => {
      existingMap.set(p.code.toUpperCase().trim(), p);
      existingMap.set(p.name.trim(), p);
    });

    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length <= 1) return [];

    const previewRows: ImportPreviewRow[] = [];

    // Parse lines (skipping header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 3) continue;

      const code = cols[0] || '';
      const name = cols[1] || '';
      const brand = cols[2] || 'اطلس';
      const category = cols[3] || 'تسمه‌های صنعتی';
      const rawPrice = Number(cols[4]?.replace(/[^0-9]/g, '')) || 0;
      const rawStock = Number(cols[5]?.replace(/[^0-9]/g, '')) || 0;

      let status: 'new' | 'update' | 'error' = 'new';
      let errorMessage: string | undefined;

      if (!code || !name) {
        status = 'error';
        errorMessage = 'کد کالا یا نام محصول خالی است';
      } else if (rawPrice <= 0) {
        status = 'error';
        errorMessage = 'قیمت پایه نامعتبر یا صفر است';
      }

      const existing = existingMap.get(code.toUpperCase()) || existingMap.get(name);
      if (status !== 'error') {
        if (existing) {
          status = 'update';
        } else {
          status = 'new';
        }
      }

      const basePrice = rawPrice;
      const retailPrice = Math.round(basePrice * 1.35);
      const wholesalePrice = Math.round(basePrice * 1.18);
      const dealerPrice = Math.round(basePrice * 1.08);

      previewRows.push({
        rowNumber: i,
        code,
        name,
        brand,
        category,
        basePrice,
        retailPrice,
        wholesalePrice,
        dealerPrice,
        stock: Math.max(0, rawStock),
        status,
        errorMessage,
        existingProduct: existing,
      });
    }

    return previewRows;
  },

  executeImport(previewRows: ImportPreviewRow[]): ImportResultReport {
    const products = this.getProducts();
    const admin = this.getCurrentAdmin();

    let newCount = 0;
    let updatedCount = 0;
    const errors: { row: number; code: string; message: string }[] = [];

    previewRows.forEach(row => {
      if (row.status === 'error') {
        errors.push({
          row: row.rowNumber,
          code: row.code,
          message: row.errorMessage || 'خطای نامشخص در داده',
        });
        return;
      }

      const existingIdx = products.findIndex(p => p.code.toUpperCase() === row.code.toUpperCase());

      if (existingIdx >= 0) {
        // Update
        const old = products[existingIdx];
        if (old.prices.retail !== row.retailPrice) {
          this.addPriceLog({
            productCode: row.code,
            productName: row.name,
            oldPrice: old.prices.retail,
            newPrice: row.retailPrice,
            changedBy: admin?.name || 'ایمپورت اکسل',
            reason: 'به‌روزرسانی قیمت از طریق فایل اکسل/CSV',
          });
        }

        products[existingIdx] = {
          ...old,
          name: row.name || old.name,
          brand: row.brand || old.brand,
          stock: row.stock,
          prices: {
            base: row.basePrice,
            retail: row.retailPrice,
            wholesale: row.wholesalePrice,
            dealer: row.dealerPrice,
          },
        };
        updatedCount++;
      } else {
        // Create new
        const newProduct: Product = {
          code: row.code,
          name: row.name,
          brand: row.brand || 'اطلس پاور',
          categorySlug: 'industrial-belts',
          categoryName: 'تسمه‌های صنعتی',
          subcategory: row.category || 'تسمه وارداتی',
          technicalSpecs: [
            { key: 'تأمین', value: 'واردات مستقیم بازرگانی اطلس' },
            { key: 'واحد', value: 'عدد' },
          ],
          prices: {
            base: row.basePrice,
            retail: row.retailPrice,
            wholesale: row.wholesalePrice,
            dealer: row.dealerPrice,
          },
          stock: row.stock,
          inquiryOnly: false,
          images: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&q=80'],
          tags: ['جدید', 'واردات ۲۰۲۴'],
          unit: 'عدد',
          description: `کالای صنعتی جدید ${row.name} با تضمین اصالت و استاندارد بین‌المللی.`,
        };
        products.unshift(newProduct);
        newCount++;
      }
    });

    try {
      localStorage.setItem(STORAGE_KEYS.ADMIN_PRODUCTS, JSON.stringify(products));
    } catch {
      // ignore
    }

    this.logAction(
      'ایمپورت گروهی محصولات',
      'کاتالوگ کالاها',
      `پردازش فایل: ${newCount} کالای جدید افزوده شد، ${updatedCount} کالا به‌روزرسانی شد و ${errors.length} خطا ثبت گردید.`
    );

    return {
      totalProcessed: previewRows.length,
      newCount,
      updatedCount,
      errorCount: errors.length,
      errors,
      timestamp: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR'),
    };
  },

  // --- Inquiries Management ---
  getInquiries(): PriceInquiry[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.INQUIRIES);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return MOCK_INQUIRIES;
  },

  answerInquiry(inquiryId: string, price: number, validityDays: number | string = 7): void {
    const inquiries = this.getInquiries();
    const idx = inquiries.findIndex(i => i.id === inquiryId);
    if (idx >= 0) {
      const inq = inquiries[idx];
      const validUntil = typeof validityDays === 'string' && !/^\d+$/.test(validityDays.trim())
        ? validityDays
        : new Date(Date.now() + (Number(validityDays) || 7) * 24 * 60 * 60 * 1000).toLocaleDateString('fa-IR');
      inquiries[idx] = {
        ...inq,
        status: 'answered',
        answeredPrice: price,
        priceValidityDate: validUntil,
      };

      try {
        localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(inquiries));
      } catch {
        // ignore
      }

      // Mock SMS to customer
      this.sendMockSms(
        inq.phone,
        `مشتری گرامی ${inq.customerName}، استعلام شما برای کالای «${inq.productName}» پاسخ داده شد: قیمت پیشنهادی: ${price.toLocaleString('fa-IR')} تومان (معتبر تا ${validUntil}). ورود به سایت: hypersanat.ir`
      );

      this.logAction('پاسخ استعلام قیمت', `شماره ${inq.inquiryNumber}`, `قیمت ${price.toLocaleString('fa-IR')} ت اعلام گردید.`);
    }
  },

  // --- Orders Management ---
  getOrders(): any[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return MOCK_ORDERS;
  },

  updateOrderStatus(orderId: string, newStatus: any, trackingInfo?: string | { carrier?: string; trackingNumber?: string }): void {
    const orders = this.getOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx >= 0) {
      const order = orders[idx];
      const statusLabels: Record<string, string> = {
        registered: 'ثبت سفارش',
        processing: 'در حال آماده‌سازی در انبار',
        packing: 'بسته‌بندی در انبار',
        shipped: 'تحویل باربری و ارسال',
        delivered: 'تحویل مشتری گردید',
        cancelled: 'لغو سفارش',
        pending: 'در انتظار تأیید',
        confirmed: 'تأیید شده',
      };

      const trackingCode = typeof trackingInfo === 'string'
        ? trackingInfo
        : trackingInfo?.trackingNumber || order.trackingCode || `TRK-${Math.floor(100000 + Math.random() * 900000)}`;

      const carrier = typeof trackingInfo === 'object' ? trackingInfo.carrier : undefined;

      orders[idx] = {
        ...order,
        status: newStatus,
        trackingCode,
        ...(carrier ? { carrier } : {}),
      };

      try {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      } catch {
        // ignore
      }

      // Mock SMS
      const label = statusLabels[newStatus] || newStatus;
      this.sendMockSms(
        order.recipientPhone || '09121112233',
        `سفارش شما با شناسه ${order.orderNumber || order.id} به وضعیت «${label}» تغییر کرد. هایپر صنعت یزد`
      );

      this.logAction('تغییر وضعیت سفارش', `شماره ${order.orderNumber || order.id}`, `وضعیت به «${label}» تغییر یافت.`);
    }
  },

  // --- Customers & CRM ---
  getCustomers(): Customer[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return MOCK_CUSTOMERS;
  },

  saveCustomerNote(customerId: string, note: string): void {
    const customers = this.getCustomers();
    const idx = customers.findIndex(c => c.id === customerId);
    if (idx >= 0) {
      customers[idx] = {
        ...customers[idx],
        notes: note,
      } as any;
      try {
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
      } catch {
        // ignore
      }
      this.logAction('ثبت یادداشت CRM', `مشتری: ${customers[idx].fullName}`, note);
    }
  },

  // --- Agency Applications (Integrated with agencyService) ---
  getAgencyApplications(): AgencyApplication[] {
    return agencyService.getApplications();
  },

  // --- CMS Banners & Sliders ---
  getBanners(): BannerItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BANNERS);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return INITIAL_BANNERS;
  },

  saveBanner(banner: BannerItem): void {
    const list = this.getBanners();
    const idx = list.findIndex(b => b.id === banner.id);
    if (idx >= 0) {
      list[idx] = banner;
    } else {
      list.push(banner);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.BANNERS, JSON.stringify(list));
    } catch {
      // ignore
    }
    this.logAction('مدیریت بنر', banner.title, 'به‌روزرسانی بنر و اسلایدر صفحه اصلی');
  },

  deleteBanner(bannerId: string): void {
    const list = this.getBanners();
    const filtered = list.filter(b => b.id !== bannerId);
    try {
      localStorage.setItem(STORAGE_KEYS.BANNERS, JSON.stringify(filtered));
    } catch {
      // ignore
    }
  },

  // --- Club Rules Config ---
  getClubConfig(): ClubConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CLUB_CONFIG);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return INITIAL_CLUB_CONFIG;
  },

  saveClubConfig(config: ClubConfig): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CLUB_CONFIG, JSON.stringify(config));
    } catch {
      // ignore
    }
    this.logAction('تنظیمات باشگاه مشتریان', 'قوانین امتیازدهی', 'قوانین امتیاز و نرخ تبدیل تخفیف به‌روزرسانی شد.');
  },

  // --- SMS Templates & Logs ---
  getSmsTemplates(): SmsTemplate[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SMS_TEMPLATES);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return INITIAL_SMS_TEMPLATES;
  },

  saveSmsTemplate(template: SmsTemplate): void {
    const list = this.getSmsTemplates();
    const idx = list.findIndex(t => t.id === template.id);
    if (idx >= 0) {
      list[idx] = template;
    } else {
      list.push(template);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.SMS_TEMPLATES, JSON.stringify(list));
    } catch {
      // ignore
    }
    this.logAction('ویرایش قالب پیامک', template.title, 'قالب پیامکی ذخیره شد.');
  },

  sendMockSms(phone: string, text: string): void {
    const currentLogs = agencyService.getSmsLogs();
    agencyService.addSmsLog({
      recipientPhone: phone,
      template: 'custom',
      message: text,
    });
  },

  sendBulkSms(phones: string[], text: string): number {
    phones.forEach(p => {
      this.sendMockSms(p, text);
    });
    this.logAction('ارسال پیامک گروهی', `${phones.length} شماره`, text.slice(0, 40) + '...');
    return phones.length;
  },

  // --- Discounts Management ---
  getDiscounts(): DiscountCode[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DISCOUNTS);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return MOCK_DISCOUNT_CODES;
  },

  saveDiscount(discount: DiscountCode): void {
    const list = this.getDiscounts();
    const idx = list.findIndex(d => d.code === discount.code);
    if (idx >= 0) {
      list[idx] = discount;
    } else {
      list.unshift(discount);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.DISCOUNTS, JSON.stringify(list));
    } catch {
      // ignore
    }
    this.logAction('کد تخفیف', discount.code, `ثبت تخفیف ${discount.discountPercent}%`);
  },

  deleteDiscount(code: string): void {
    const list = this.getDiscounts();
    const filtered = list.filter(d => d.code !== code);
    try {
      localStorage.setItem(STORAGE_KEYS.DISCOUNTS, JSON.stringify(filtered));
    } catch {
      // ignore
    }
  },

  // --- Categories CRUD ---
  getCategories(): Category[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return CATEGORIES;
  },

  saveCategory(category: Category): void {
    const list = this.getCategories();
    const idx = list.findIndex(c => c.slug === category.slug);
    if (idx >= 0) {
      list[idx] = category;
    } else {
      list.push(category);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(list));
    } catch {
      // ignore
    }
    this.logAction('مدیریت دسته‌بندی', category.name, 'ذخیره مشخصات دسته‌بندی');
  },

  deleteCategory(slug: string): void {
    const list = this.getCategories();
    const filtered = list.filter(c => c.slug !== slug);
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(filtered));
    } catch {
      // ignore
    }
    this.logAction('حذف دسته‌بندی', slug, 'دسته‌بندی حذف شد');
  },

  // --- Brands CRUD ---
  getBrands(): Brand[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BRANDS);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return BRANDS;
  },

  saveBrand(brand: Brand): void {
    const list = this.getBrands();
    const idx = list.findIndex(b => b.id === brand.id);
    if (idx >= 0) {
      list[idx] = brand;
    } else {
      list.push(brand);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.BRANDS, JSON.stringify(list));
    } catch {
      // ignore
    }
    this.logAction('مدیریت برند', brand.name, 'ذخیره برند در سیستم');
  },

  deleteBrand(id: string): void {
    const list = this.getBrands();
    const filtered = list.filter(b => b.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.BRANDS, JSON.stringify(filtered));
    } catch {
      // ignore
    }
    this.logAction('حذف برند', id, 'برند از سیستم حذف شد');
  },

  // --- Active Dealers Management ---
  getActiveDealers(): (Representative & { creditLimit: number; seasonalTargetAchieved: number })[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DEALERS);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    const initial = MOCK_REPRESENTATIVES.map((r, i) => ({
      ...r,
      creditLimit: i === 0 ? 250000000 : i === 1 ? 180000000 : 150000000,
      seasonalTargetAchieved: i === 0 ? 92 : i === 1 ? 84 : 78,
    }));
    try {
      localStorage.setItem(STORAGE_KEYS.DEALERS, JSON.stringify(initial));
    } catch {
      // ignore
    }
    return initial;
  },

  saveDealer(dealer: Representative & { creditLimit: number; seasonalTargetAchieved: number }): void {
    const list = this.getActiveDealers();
    const idx = list.findIndex(d => d.id === dealer.id);
    if (idx >= 0) {
      list[idx] = dealer;
    } else {
      list.push(dealer);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.DEALERS, JSON.stringify(list));
    } catch {
      // ignore
    }
    this.logAction('مدیریت نماینده', dealer.name, `تنظیم سقف اعتبار ${dealer.creditLimit.toLocaleString('fa-IR')} ت`);
  },

  // --- Support Tickets Inbox ---
  getTickets(): any[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TICKETS);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    const initial: any[] = [
      {
        id: 'TCK-881',
        ticketNumber: 'TCK-881',
        customerName: 'مهندس حیدری (کاشی یزد)',
        phone: '09131518920',
        subject: 'درخواست کاتالوگ فنی تسمه با تحمل حرارتی بالای ۱۵۰ درجه سانتی‌گراد',
        department: 'technical',
        priority: 'high',
        status: 'open',
        createdAt: '۱۴۰۳/۰۶/۲۱ - ۰۹:۳۰',
        lastReplyAt: '۱۴۰۳/۰۶/۲۱ - ۰۹:۳۰',
        messages: [
          {
            id: 'm1',
            sender: 'user',
            senderName: 'مهندس حیدری (کاشی یزد)',
            text: 'سلام و احترام، خط خروجی کوره کاشی ما نیازمند تسمه سیلیکونی یا تفلونی مقاوم تا ۱۸۰ درجه سانتی‌گراد است. کاتالوگ و مشخصات دقیق مدل SWR را بفرمایید.',
            message: 'سلام و احترام، خط خروجی کوره کاشی ما نیازمند تسمه سیلیکونی یا تفلونی مقاوم تا ۱۸۰ درجه سانتی‌گراد است. کاتالوگ و مشخصات دقیق مدل SWR را بفرمایید.',
            timestamp: '۱۴۰۳/۰۶/۲۱ - ۰۹:۳۰',
          },
        ],
      },
      {
        id: 'TCK-882',
        ticketNumber: 'TCK-882',
        customerName: 'آقای شمس (پخش اصفهان)',
        phone: '09132223344',
        subject: 'استعلام زمان تحویل بار ارسالی با باربری وطن',
        department: 'sales',
        priority: 'medium',
        status: 'answered',
        createdAt: '۱۴۰۳/۰۶/۲۰ - ۱۶:۴۰',
        lastReplyAt: '۱۴۰۳/۰۶/۲۰ - ۱۷:۰۵',
        messages: [
          {
            id: 'm1',
            sender: 'user',
            senderName: 'آقای شمس (پخش اصفهان)',
            text: 'سلام، شماره بارنامه سفارش ثبت شده دیروز را محبت می‌فرمایید؟',
            message: 'سلام، شماره بارنامه سفارش ثبت شده دیروز را محبت می‌فرمایید؟',
            timestamp: '۱۴۰۳/۰۶/۲۰ - ۱۶:۴۰',
          },
          {
            id: 'm2',
            sender: 'admin',
            senderName: 'پشتیبانی بازرگانی اطلس',
            text: 'با سلام، شماره بارنامه ۱۲۹۸۳۷۴ باربری وطن یزد صادر شد و پیامک پیگیری نیز برای جنابعالی ارسال گردید.',
            message: 'با سلام، شماره بارنامه ۱۲۹۸۳۷۴ باربری وطن یزد صادر شد و پیامک پیگیری نیز برای جنابعالی ارسال گردید.',
            timestamp: '۱۴۰۳/۰۶/۲۰ - ۱۷:۰۵',
          },
        ],
      },
      {
        id: 't-103',
        ticketNumber: 'TCK-8794',
        customerName: 'نمایندگی اصفهان (ابزار صنعت اسپادانا)',
        phone: '03133880000',
        subject: 'استعلام افزایش سقف اعتبار عاملیت استانی',
        department: 'agency',
        priority: 'medium',
        status: 'open',
        createdAt: '۱۴۰۳/۰۶/۱۹ - ۱۲:۰۰',
        lastReplyAt: '۱۴۰۳/۰۶/۱۹ - ۱۲:۰۰',
        messages: [
          {
            id: 'm-4',
            sender: 'user',
            senderName: 'نمایندگی اصفهان (ابزار صنعت اسپادانا)',
            text: 'احتراماً با توجه به حجم سفارشات پایان فصل کارخانجات نساجی، تقاضای افزایش سقف اعتبار از ۱۵۰ به ۲۵۰ م ت را داریم.',
            message: 'احتراماً با توجه به حجم سفارشات پایان فصل کارخانجات نساجی، تقاضای افزایش سقف اعتبار از ۱۵۰ به ۲۵۰ م ت را داریم.',
            timestamp: '۱۴۰۳/۰۶/۱۹ - ۱۲:۰۰',
          },
        ],
      },
    ];
    try {
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(initial));
    } catch {
      // ignore
    }
    return initial;
  },

  replyTicket(ticketId: string, replyText: string): void {
    const list = this.getTickets();
    const idx = list.findIndex(t => t.id === ticketId);
    if (idx >= 0) {
      const admin = this.getCurrentAdmin();
      const newMsg = {
        id: 'm-' + Date.now(),
        sender: 'support' as const,
        senderName: admin?.name || 'پشتیبانی هایپر صنعت',
        message: replyText,
        timestamp: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      };
      const msgs = list[idx].messages || [];
      msgs.push(newMsg);
      list[idx] = {
        ...list[idx],
        status: 'answered',
        lastReplyAt: newMsg.timestamp,
        messages: msgs,
      };
      try {
        localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(list));
      } catch {
        // ignore
      }
      this.logAction('پاسخ به تیکت', list[idx].ticketNumber, replyText.slice(0, 40));
    }
  },

  // --- Blog & Static Pages ---
  getArticles(): BlogPost[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BLOG);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    const initial: BlogPost[] = [
      {
        id: 'art-1',
        title: 'راهنمای جامع انتخاب تسمه‌های تایمینگ در خطوط تولید پرسرعت کاشی',
        slug: 'timing-belts-guide-tiles',
        category: 'آموزش فنی و مهندسی',
        author: 'مهندس مرتضوی',
        excerpt: 'بررسی تفاوت‌های گام‌های HTD، RPP و مقاومت کششی نخ‌های کولار و استیل در کوره‌های حرارتی.',
        content: 'تسمه‌های تایمینگ صنعتی از حساس‌ترین عناصر انتقال توان همگام در کارخانجات کاشی و سرامیک به شمار می‌روند...',
        imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80',
        publishedAt: '۱۴۰۳/۰۶/۱۵',
        views: 1240,
      },
      {
        id: 'art-2',
        title: 'استانداردهای ضدسایش تسمه‌های انحصاری SWR آلمان و FORZA ایتالیا',
        slug: 'swr-forza-standards',
        category: 'اخبار و برندها',
        author: 'خانم دهقان',
        excerpt: 'چرا برندهای SWR و FORZA به انتخاب اول مهندسان تأسیسات صنعتی استان یزد و اصفهان تبدیل شده‌اند؟',
        content: 'ترکیبات پلیمری خاص و لایه‌های روکش پلی‌آمید و سیلیکون در تسمه‌های SWR سبب کاهش فرسایش تا ۴۰ درصد می‌گردد...',
        imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80',
        publishedAt: '۱۴۰۳/۰۶/۰۲',
        views: 980,
      },
    ];
    try {
      localStorage.setItem(STORAGE_KEYS.BLOG, JSON.stringify(initial));
    } catch {
      // ignore
    }
    return initial;
  },

  saveArticle(article: BlogPost): void {
    const list = this.getArticles();
    const idx = list.findIndex(a => a.id === article.id);
    if (idx >= 0) {
      list[idx] = article;
    } else {
      list.unshift(article);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.BLOG, JSON.stringify(list));
    } catch {
      // ignore
    }
    this.logAction('مدیریت وبلاگ', article.title, 'ذخیره مقاله در وبلاگ');
  },

  getBlogPosts(): BlogPost[] {
    return this.getArticles();
  },

  saveBlogPost(post: BlogPost): void {
    this.saveArticle(post);
  },

  deleteArticle(id: string): void {
    const list = this.getArticles();
    const filtered = list.filter(a => a.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.BLOG, JSON.stringify(filtered));
    } catch {
      // ignore
    }
  },

  getStaticPages(): StaticPage[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PAGES);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    const initial: StaticPage[] = [
      {
        id: 'pg-about',
        slug: 'about-us',
        title: 'درباره بازرگانی تسمه اطلس',
        content: 'تأسیس سال ۱۳۶۶ در استان یزد با بیش از سه دهه تخصص در واردات، مهندسی و پخش تسمه‌های صنعتی، قطعات کوره کاشی و سرامیک و ماشین‌آلات نساجی.',
        lastUpdated: '۱۴۰۳/۰۶/۱۰',
      },
      {
        id: 'pg-contact',
        slug: 'contact-us',
        title: 'تماس با ما و دفاتر بازرگانی',
        content: 'دفتر مرکزی: یزد، بلوار جمهوری، مجتمع تجاری صنعتی اطلس. تلفن: ۰۳۵-۳۵۲۲۲۰۰۰ | کارگاه آپارات و انبار مرکزی: شهرک صنعتی یزد فاز ۱.',
        lastUpdated: '۱۴۰۳/۰۶/۱۵',
      },
      {
        id: 'pg-faq',
        slug: 'faq',
        title: 'سؤالات متداول کارخانجات و مشتریان',
        content: 'پاسخ به سؤالات درباره زمان تحویل سفارش‌های عمده، شرایط استعلام قیمت، اعتبارسنجی عاملیت و گارانتی اصالت کالا.',
        lastUpdated: '۱۴۰۳/۰۶/۰۵',
      },
    ];
    try {
      localStorage.setItem(STORAGE_KEYS.PAGES, JSON.stringify(initial));
    } catch {
      // ignore
    }
    return initial;
  },

  saveStaticPage(page: StaticPage): void {
    const list = this.getStaticPages();
    const idx = list.findIndex(p => p.id === page.id);
    if (idx >= 0) {
      list[idx] = page;
    } else {
      list.push(page);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.PAGES, JSON.stringify(list));
    } catch {
      // ignore
    }
    this.logAction('ویرایش صفحات ثابت', page.title, 'متن صفحه به‌روزرسانی شد');
  },

  // --- Campaigns Management ---
  getCampaigns(): CampaignItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CAMPAIGNS);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    const initial: CampaignItem[] = [
      {
        id: 'cmp-1',
        title: 'جشنواره پاییزه تأمین قطعات کارخانجات کاشی',
        description: '۵٪ تخفیف مازاد روی کلیه سفارش‌های تسمه کوره بالای ۵۰ میلیون تومان + ۲ برابر امتیاز باشگاه',
        rewardType: 'discount_code',
        rewardValue: 'کد AUTUMN-TILE',
        startDate: '۱۴۰۳/۰۶/۱۵',
        endDate: '۱۴۰۳/۰۷/۱۵',
        targetTier: 'all',
        active: true,
        participantsCount: 42,
      },
      {
        id: 'cmp-2',
        title: 'طرح ویژه اعضای طلایی: ارسال رایگان با باربری اختصاصی',
        description: 'ارسال رایگان تمام سفارش‌های بالای ۲۰ میلیون تومان برای اعضای دارای سطح طلایی VIP',
        rewardType: 'free_gift',
        rewardValue: 'حمل رایگان سراسری',
        startDate: '۱۴۰۳/۰۶/۰۱',
        endDate: '۱۴۰۳/۰۸/۳۰',
        targetTier: 'gold',
        active: true,
        participantsCount: 18,
      },
    ];
    try {
      localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(initial));
    } catch {
      // ignore
    }
    return initial;
  },

  saveCampaign(campaign: CampaignItem): void {
    const list = this.getCampaigns();
    const idx = list.findIndex(c => c.id === campaign.id);
    if (idx >= 0) {
      list[idx] = campaign;
    } else {
      list.unshift(campaign);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(list));
    } catch {
      // ignore
    }
    this.logAction('کمپین بازاریابی', campaign.title, 'ذخیره کمپین و تخفیف');
  },

  deleteCampaign(id: string): void {
    const list = this.getCampaigns();
    const filtered = list.filter(c => c.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(filtered));
    } catch {
      // ignore
    }
  },

  // --- General System Settings ---
  getSettings(): SystemSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    const initial: SystemSettings = {
      paymentGateway: {
        provider: 'mellat',
        merchantId: 'MOCK-MLT-982341',
        terminalId: 'TRM-88210',
        sandbox: true,
      },
      smsProvider: {
        provider: 'kavenegar',
        apiKey: 'kav_live_sample_token_889241',
        senderNumber: '1000882200',
      },
      shippingMethods: {
        barbari: true,
        tipax: true,
        expressPost: true,
        dedicatedFleet: true,
      },
      currency: 'toman',
      seo: {
        metaTitle: 'هایپر صنعت | بازرگانی تسمه اطلس یزد (تأسیس ۱۳۶۶)',
        metaDescription: 'بزرگترین پلتفرم تخصصی فروش و پخش آنلاین تسمه‌های صنعتی، قطعات کوره کاشی و سرامیک و ماشین‌آلات نساجی با نمایندگی انحصاری SWR و FORZA.',
        keywords: 'تسمه صنعتی, تسمه کوره کاشی, تسمه تایمینگ, SWR آلمان, FORZA ایتالیا, بازرگانی اطلس یزد',
        canonicalBase: 'https://hypersanat.ir',
      },
    };
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(initial));
    } catch {
      // ignore
    }
    return initial;
  },

  saveSettings(settings: SystemSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      // ignore
    }
    this.logAction('تنظیمات سامانه', 'پیکربندی عمومی', 'به‌روزرسانی درگاه، پیامک، روش‌های ارسال و متای سئو');
  },

  getAdminUsers(): AdminUser[] {
    return INITIAL_ADMINS;
  },

  getOfficialInvoices(): OfficialInvoice[] {
    try {
      const stored = localStorage.getItem('atlas_admin_official_invoices_v1');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [
      {
        id: 'INV-1403-881',
        invoiceNumber: 'INV-1403-881',
        nationalTaxId: 'TX-140306-9923',
        issueDate: '۱۴۰۳/۰۶/۲۱',
        validUntil: '۱۴۰۳/۰۶/۲۸',
        seller: {
          name: 'شرکت بازرگانی هایپر صنعت اطلس یزد (سهامی خاص)',
          nationalId: '10861234567',
          economicCode: '411589321456',
          registrationNumber: '14285',
          address: 'یزد، بلوار جمهوری اسلامی، مجتمع صنعتی بازرگانی اطلس، پلاک ۸۲',
          postalCode: '8917945123',
          phone: '۰۳۵-۳۵۲۲۲۰۰۰',
        },
        buyer: {
          name: 'مجتمع کارخانجات کاشی و سرامیک عقیق یزد',
          companyName: 'شرکت صنایع سرامیک عقیق (سهامی عام)',
          nationalId: '10860012458',
          economicCode: '411298456123',
          phone: '۰۳۵-۳۲۲۴۵۰۰۰',
          address: 'یزد، شهرک صنعتی یزد، فاز ۲، میدان صنعت، خیابان کاشی',
          postalCode: '8916574125',
        },
        items: [
          {
            row: 1,
            productCode: 'SWR-230',
            productName: 'تسمه تایمینگ دنده‌ای صنعتی HTD-8M-1760 ضد سایش',
            quantity: 25,
            unit: 'حلقه',
            unitPrice: 5200000,
            totalPrice: 130000000,
            discount: 6500000,
            tax: 12350000,
            finalPrice: 135850000,
          },
        ],
        subtotal: 130000000,
        totalDiscount: 6500000,
        totalTax: 12350000,
        grandTotal: 135850000,
        paymentTerms: 'تسویه ۳۰ روزه با چک صیادی تأییدشده',
        status: 'issued',
      },
    ];
  },

  createOfficialInvoice(invoiceData: any): OfficialInvoice {
    const invoiceNumber = invoiceData.invoiceNumber || `INV-1403-${Math.floor(100 + Math.random() * 900)}`;
    const invoice: OfficialInvoice = {
      id: invoiceData.id || invoiceNumber,
      invoiceNumber,
      nationalTaxId: invoiceData.nationalTaxId || `TX-${Date.now()}`,
      issueDate: invoiceData.issueDate || new Date().toLocaleDateString('fa-IR'),
      validUntil: invoiceData.validUntil || '۷ روز کاری',
      seller: invoiceData.seller || {
        name: 'شرکت بازرگانی هایپر صنعت اطلس یزد (سهامی خاص)',
        nationalId: '10861234567',
        economicCode: '411589321456',
        registrationNumber: '14285',
        address: 'یزد، بلوار جمهوری اسلامی، مجتمع صنعتی بازرگانی اطلس، پلاک ۸۲',
        postalCode: '8917945123',
        phone: '۰۳۵-۳۵۲۲۲۰۰۰',
      },
      buyer: {
        name: invoiceData.buyer?.name || 'خریدار',
        companyName: invoiceData.buyer?.companyName || invoiceData.buyer?.company || 'سازمان خریدار',
        nationalId: invoiceData.buyer?.nationalId || '10100000000',
        economicCode: invoiceData.buyer?.economicCode || '411000000000',
        phone: invoiceData.buyer?.phone || '09120000000',
        address: invoiceData.buyer?.address || 'یزد، شهرک صنعتی',
        postalCode: invoiceData.buyer?.postalCode || '8910000000',
      },
      items: (invoiceData.items || []).map((item: any, idx: number) => ({
        row: idx + 1,
        productCode: item.productCode || item.code || `PRD-${idx + 1}`,
        productName: item.productName || item.name || 'کالای صنعتی',
        quantity: item.quantity || 1,
        unit: item.unit || 'عدد',
        unitPrice: item.unitPrice || 0,
        totalPrice: item.totalPrice || (item.unitPrice || 0) * (item.quantity || 1),
        discount: item.discount || 0,
        tax: item.tax || Math.round((item.totalPrice || 0) * 0.1),
        finalPrice: item.finalPrice || (item.totalPrice || 0) + Math.round((item.totalPrice || 0) * 0.1),
      })),
      subtotal: invoiceData.subtotal || 0,
      totalDiscount: invoiceData.discount || invoiceData.totalDiscount || 0,
      totalTax: invoiceData.tax || invoiceData.totalTax || 0,
      grandTotal: invoiceData.total || invoiceData.grandTotal || 0,
      paymentTerms: invoiceData.paymentTerms || 'نقد / اعتباری',
      status: invoiceData.status || 'issued',
    };
    const list = this.getOfficialInvoices();
    list.unshift(invoice);
    try {
      localStorage.setItem('atlas_admin_official_invoices_v1', JSON.stringify(list));
    } catch {
      // ignore
    }
    this.logAction('صدور پیش‌فاکتور رسمی', invoice.invoiceNumber, `خریدار: ${invoice.buyer.companyName}`);
    return invoice;
  },

  saveInquiryReply(id: string, priceOrMap: any, validity?: any, terms?: any): void {
    const price = typeof priceOrMap === 'number' ? priceOrMap : (typeof priceOrMap === 'object' && priceOrMap ? Number(Object.values(priceOrMap)[0]) : 1000000);
    this.answerInquiry(id, Number(price) || 1000000, String(validity || '48 ساعت'));
    this.logAction('ثبت پاسخ استعلام', id, `قیمت: ${price} ت - اعتبار: ${terms || validity || '۴۸ ساعت'}`);
  },

  sendSms(to: string, template: any, params: any): void {
    const message = typeof params === 'string' ? params : `اطلاع‌رسانی هایپر صنعت اطلس برای شماره ${to}`;
    const log: SmsLog = {
      id: 'sms-' + Date.now(),
      recipientPhone: to,
      template: 'custom',
      message: message,
      status: 'delivered',
      sentAt: new Date().toLocaleDateString('fa-IR'),
    };
    try {
      const logs = this.getSmsLogs();
      logs.unshift(log);
      localStorage.setItem('atlas_admin_sms_logs_v1', JSON.stringify(logs));
    } catch {
      // ignore
    }
  },

  getSmsLogs(): SmsLog[] {
    try {
      const stored = localStorage.getItem('atlas_admin_sms_logs_v1');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [
      {
        id: 'sms-101',
        recipientPhone: '09131512345',
        template: 'order_registered',
        message: 'مشتری گرامی، سفارش شما در هایپر صنعت اطلس ثبت و در صف تأیید قرار گرفت.',
        status: 'delivered',
        sentAt: '۱۴۰۳/۰۶/۲۱ - ۱۰:۱۵',
      },
      {
        id: 'sms-102',
        recipientPhone: '09121114567',
        template: 'inquiry_received',
        message: 'پیش‌فاکتور رسمی استعلام INQ-7481 صادر شد. جهت مشاهده به پنل کاربری مراجعه فرمایید.',
        status: 'delivered',
        sentAt: '۱۴۰۳/۰۶/۲۱ - ۱۱:۳۰',
      },
    ];
  },

  verifyReceipt(orderId: string, approved: boolean, reason?: string): void {
    const orders = this.getOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx >= 0) {
      orders[idx] = {
        ...orders[idx],
        status: approved ? 'processing' : 'pending',
        receiptVerified: approved,
      } as any;
      try {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      } catch {
        // ignore
      }
      this.logAction('اعتبارسنجی فیش واریزی', orderId, approved ? 'فیش تأیید شد' : `فیش رد شد: ${reason}`);
    }
  },

  replyToTicket(ticketId: string, replyText: string, newStatus: SupportTicket['status'] = 'answered'): void {
    const tickets = this.getTickets();
    const idx = tickets.findIndex(t => t.id === ticketId);
    if (idx >= 0) {
      tickets[idx].status = newStatus;
      tickets[idx].messages.push({
        id: 'm-' + Date.now(),
        sender: 'admin',
        text: replyText,
        timestamp: new Date().toLocaleDateString('fa-IR'),
      });
      try {
        localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
      } catch {
        // ignore
      }
      this.logAction('پاسخ به تیکت CRM', ticketId, replyText.slice(0, 40));
    }
  },

  updateCustomerTier(customerId: string, tier: any, creditLimit: number, discountPercent: number): void {
    const customers = this.getCustomers();
    const idx = customers.findIndex(c => c.id === customerId);
    if (idx >= 0) {
      customers[idx] = {
        ...customers[idx],
        role: tier === 'dealer' ? 'dealer' : tier === 'colleague' ? 'wholesale' : 'retail',
        clubTier: tier === 'dealer' ? 'gold' : tier === 'colleague' ? 'silver' : 'bronze',
        creditLimit,
        discountPercent,
      } as any;
      try {
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
      } catch {
        // ignore
      }
      this.logAction('تغییر سطح B2B مشتری', customers[idx].fullName, `سطح: ${tier} - سقف: ${creditLimit}`);
    }
  },

  getActiveAgencies(): ActiveAgency[] {
    try {
      const stored = localStorage.getItem('atlas_admin_active_agencies_v1');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [
      {
        id: 'ag-101',
        code: 'AG-1403-101',
        name: 'نمایندگی کاشی ستاره میبد (فروشگاه فنی دهقانی)',
        phone: '035-32356000',
        province: 'یزد',
        city: 'میبد',
        creditLimit: 350000000,
        currentBalance: 120000000,
        nextCheckDate: '۱۴۰۳/۰۷/۱۵',
        contractStatus: 'valid',
      },
      {
        id: 'ag-102',
        code: 'AG-1403-102',
        name: 'عاملیت مرکزی تسمه و قطعات اصفهان (صنعتی پایا)',
        phone: '031-33880000',
        province: 'اصفهان',
        city: 'اصفهان',
        creditLimit: 500000000,
        currentBalance: 280000000,
        nextCheckDate: '۱۴۰۳/۰۷/۲۰',
        contractStatus: 'valid',
      },
    ];
  },

  saveActiveAgency(agency: ActiveAgency): void {
    const list = this.getActiveAgencies();
    const idx = list.findIndex(a => a.id === agency.id);
    if (idx >= 0) list[idx] = agency;
    else list.push(agency);
    try {
      localStorage.setItem('atlas_admin_active_agencies_v1', JSON.stringify(list));
    } catch {
      // ignore
    }
  },

  approveAgency(appId: string, assignedCode: string, creditLimit: number, customPassword?: string): { username: string; password: string } | undefined {
    const res = agencyService.approveApplication(appId, {
      agencyCode: assignedCode,
      initialCreditLimit: creditLimit,
      password: customPassword,
    });
    if (!res) return undefined;

    const newActive: ActiveAgency = {
      id: 'ag-' + Date.now(),
      name: res.app.companyName,
      city: res.app.city,
      province: res.app.province,
      phone: res.app.phone,
      code: assignedCode,
      creditLimit: creditLimit,
      currentBalance: 0, // Zero Data
      nextCheckDate: 'تسویه ۳۰ روزه',
      contractStatus: 'valid',
    };
    this.saveActiveAgency(newActive);
    this.logAction('تأیید عاملیت و صدور پنل نمایندگی', appId, `کد: ${assignedCode} | سقف اعتبار: ${creditLimit} ت | پیامک رمز عبور ارسال شد`);

    return res.credentials;
  },

  rejectAgency(appId: string, reason: string): void {
    agencyService.rejectApplication(appId, reason);
    this.logAction('رد درخواست عاملیت', appId, reason);
  },

  getSupplyRequests(): SupplyRequestItem[] {
    try {
      const stored = localStorage.getItem('atlas_admin_supply_reqs_v1');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [
      {
        id: 'SUP-701',
        agencyName: 'نمایندگی میبد',
        productName: 'تسمه کوره انتقال سرامیک HTD-14M',
        productCode: 'SWR-14M-2100',
        quantity: 40,
        urgency: 'immediate',
        status: 'pending',
        createdAt: '۱۴۰۳/۰۶/۲۱',
      },
      {
        id: 'SUP-702',
        agencyName: 'عاملیت اصفهان',
        productName: 'رولیک و غلتک سرامیکی نسوز کوره',
        productCode: 'AT-751',
        quantity: 100,
        urgency: 'normal',
        status: 'approved',
        createdAt: '۱۴۰۳/۰۶/۱۹',
      },
    ];
  },

  updateSupplyRequestStatus(id: string, status: SupplyRequestItem['status']): void {
    const list = this.getSupplyRequests();
    const idx = list.findIndex(r => r.id === id);
    if (idx >= 0) {
      list[idx].status = status;
      try {
        localStorage.setItem('atlas_admin_supply_reqs_v1', JSON.stringify(list));
      } catch {
        // ignore
      }
      this.logAction('تغییر وضعیت حواله تأمین', id, `وضعیت: ${status}`);
    }
  },

  getClubMembers(): ClubMember[] {
    return [
      { id: 'cm-1', name: 'کاشی و سرامیک عقیق', phone: '09131510000', points: 2850, level: 'الماس VIP', joinedAt: '۱۴۰۱/۰۲/۱۰' },
      { id: 'cm-2', name: 'نساجی تابان یزد', phone: '09132512222', points: 1420, level: 'طلایی', joinedAt: '۱۴۰۲/۰۵/۱۵' },
      { id: 'cm-3', name: 'کاشی ستاره میبد', phone: '09133513333', points: 950, level: 'نقره‌ای', joinedAt: '۱۴۰۲/۰۹/۰۱' },
    ];
  },

  getRewardRequests(): RewardRequestItem[] {
    return [
      { id: 'rw-1', memberName: 'کاشی عقیق', phone: '09131510000', rewardTitle: 'تخفیف ۵ میلیون تومانی خرید عمده بعدی', pointsCost: 1000, status: 'pending', createdAt: '۱۴۰۳/۰۶/۲۱' },
    ];
  },

  updateRewardStatus(id: string, status: RewardRequestItem['status']): void {
    this.logAction('بررسی جایزه باشگاه', id, `وضعیت: ${status}`);
  },

  deleteBlogPost(id: string): void {
    const posts = this.getBlogPosts().filter(p => p.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.BLOG, JSON.stringify(posts));
    } catch {
      // ignore
    }
    this.logAction('حذف مقاله وبلاگ', id, 'مقاله از کاتالوگ حذف گردید');
  },

  exportBackupJson(): string {
    const fullBackup = {
      timestamp: new Date().toISOString(),
      products: this.getProducts(),
      categories: this.getCategories(),
      brands: this.getBrands(),
      orders: this.getOrders(),
      inquiries: this.getInquiries(),
      customers: this.getCustomers(),
      agencies: this.getActiveAgencies(),
      auditLogs: this.getAuditLogs(),
      settings: this.getSettings(),
    };
    return JSON.stringify(fullBackup, null, 2);
  },

  resetToInitial(): void {
    Object.values(STORAGE_KEYS).forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch {
        // ignore
      }
    });
    this.logAction('بازنشانی سیستم', 'تمام پایگاه داده', 'سامانه به داده‌های اولیه ریست شد.');
  },
};
