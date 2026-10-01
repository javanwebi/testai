export type UserRole = 'guest' | 'retail' | 'wholesale' | 'dealer' | 'admin';

export type ClubTier = 'bronze' | 'silver' | 'gold';

export type OrderStatus = 'registered' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Address {
  id: string;
  title: string;
  recipientName: string;
  recipientPhone: string;
  province: string;
  city: string;
  fullAddress: string;
  postalCode: string;
  isDefault?: boolean;
}

export interface PriceTiers {
  base: number;       // قیمت پایه
  retail: number;     // خرده‌فروش (قیمت نمایش عمومی)
  wholesale: number;  // پخش / همکار
  dealer: number;     // نمایندگی
  agency?: number;    // نمایندگی رسمی
  [key: string]: any;
}

export interface TechnicalSpec {
  key: string;
  value: string;
}

export interface Product {
  code: string;               // e.g. "AT-751", "SWR-230", "FORZA-A45"
  name: string;               // نام فارسی محصول
  nameEn?: string;            // نام لاتین
  brand: string;              // SWR, FORZA, Megadyne, Optibelt, etc.
  categorySlug: string;       // industrial-belts, ceramic-tiles, etc.
  categoryName: string;
  category?: string;
  subcategory: string;        // V-Belt, Timing, Roller, Filter, etc.
  technicalSpecs: TechnicalSpec[];
  prices: PriceTiers;
  discountPercent?: number;   // درصد تخفیف نمایش عمومی (در صورت وجود)
  stock: number;              // موجودی انبار
  inquiryOnly: boolean;       // وضعیت «فقط استعلامی»
  isInquiryOnly?: boolean;    // پشتیبانی تکمیلی
  rating?: number;            // امتیاز کالا
  images: string[];           // SVG Data URIs or optimized SVGs
  image?: string;             // تصویر پیش‌فرض
  tags: string[];             // e.g. ["پرفروش", "ویژه کاشی", "ضد سایش"]
  minOrderQty?: number;       // حداقل سفارش پخش/نماینده
  unit: string;               // عدد، متر، شاخه، رول، ست
  featured?: boolean;         // نمایش در پیشنهاد شگفت‌انگیز
  description?: string;       // توضیحات فنی و کاربرد محصول
  clubPointsReward?: number;  // امتیاز باشگاه قابل کسب با خرید این کالا
  forzaCode?: string;         // کد رسمی کاتالوگ فورزا اطلس مثل "FORZACODE: 1000 0 1"
  cataloguePage?: number;     // شماره صفحه کاتالوگ رسمی ۱۴۰۴ اطلس
  hasCatalogueImage?: boolean;// آیا دارای تصویر مستقیم و ثبت‌شده از کاتالوگ است
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  nameEn: string;
  description: string;
  subcategories: string[];
  icon: string;
  count: number;
}

export interface Brand {
  id: string;
  name: string;
  nameEn: string;
  country: string;
  isExclusive: boolean;       // نماینده انحصاری بازرگانی اطلس
  description: string;
  logo: string;
}

export interface Customer {
  id: string;
  fullName: string;
  name?: string;
  companyName?: string;
  company?: string;
  phone: string;
  email?: string;
  role: UserRole;
  tier?: 'regular' | 'colleague' | 'factory' | 'dealer';
  clubTier: ClubTier;
  clubPoints: number;
  approvedB2B: boolean;
  assignedPriceListId?: string;
  assignedGradeId?: string;
  creditLimit?: number;
  discountPercent?: number;
  totalPurchases?: number;
  totalOrdersAmount?: number;
  notes?: string;
  city: string;
  province: string;
  address?: string;
  addresses?: Address[];
  economicCode?: string;
  createdAt: string;
}

export interface OrderItem {
  productCode: string;
  productName: string;
  brand: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  priceLayerUsed: keyof PriceTiers;
  totalPrice: number;
  image: string;
}

export interface OrderTimelineStep {
  status: OrderStatus;
  label: string;
  date?: string;
  description: string;
  completed: boolean;
  current: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  companyName?: string;
  role: UserRole;
  items: OrderItem[];
  totalAmount: number;
  discountAmount: number;
  shippingCost?: number;
  shippingMethod?: string;
  paymentMethod?: 'online' | 'transfer' | 'credit';
  paymentStatus?: 'paid' | 'pending_review' | 'awaiting_payment';
  receiptImage?: string;
  finalAmount: number;
  status: OrderStatus;
  createdAt: string;
  trackingCode?: string;
  shippingAddress: string;
  recipientName?: string;
  recipientPhone?: string;
  timeline?: OrderTimelineStep[];
}

export interface InquiryItem {
  productCode: string;
  productName: string;
  quantity: number;
  suggestedPrice?: number;
  notes?: string;
}

export interface PriceInquiry {
  id: string;
  inquiryNumber: string;
  customerName: string;
  companyName?: string;
  company?: string;
  phone: string;
  productCode: string;
  productName: string;
  brand?: string;
  requestedQty: number;
  notes?: string;
  status: 'pending' | 'answered' | 'converted_to_order' | 'rejected' | 'quoted' | 'expired';
  createdAt: string;
  answeredPrice?: number;
  priceValidityDate?: string;
  validityHours?: number;
  items: InquiryItem[];
}

export type InquiryRequest = PriceInquiry;

export interface Representative {
  id: string;
  agencyCode: string;
  name: string;
  managerName: string;
  city: string;
  province: string;
  phone: string;
  address: string;
  brands: string[];
  contractStartDate: string;
  tier: 'gold' | 'silver';
  status: 'active' | 'pending' | 'suspended';
}

export interface DealerOrder {
  id: string;
  dealerId: string;
  dealerName: string;
  orderNumber: string;
  itemsCount: number;
  totalWholesaleAmount: number;
  creditUsed: number;
  status: 'submitted' | 'finance_review' | 'warehouse_packing' | 'dispatched';
  createdAt: string;
}

export interface TicketMessage {
  id: string;
  sender: 'user' | 'support';
  senderName: string;
  message: string;
  timestamp: string;
}

export type InternalMessage = TicketMessage;

export interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  department: 'sales' | 'technical' | 'support' | 'agency';
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'answered' | 'closed';
  createdAt: string;
  lastReplyAt: string;
  messages?: TicketMessage[];
}

export interface DiscountCode {
  code: string;
  discountPercent: number;
  maxDiscount: number;
  minOrder: number;
  expiryDate: string;
  applicableRoles: UserRole[];
}

export interface PointTransaction {
  id: string;
  type: 'earn' | 'redeem';
  points: number;
  description: string;
  date: string;
  referenceOrder?: string;
}

export interface SmsLog {
  id: string;
  recipientPhone?: string;
  to?: string;
  template?:
    | 'order_registered'
    | 'order_confirmed'
    | 'inquiry_received'
    | 'b2b_approved'
    | 'club_reward'
    | 'agency_submitted'
    | 'agency_approved'
    | 'agency_rejected'
    | 'deposit_received'
    | 'supply_request'
    | 'custom'
    | string;
  message: string;
  status: 'delivered' | 'sent' | 'failed' | string;
  sentAt?: string;
  timestamp?: string;
}

export interface AgencyApplication {
  id: string;
  trackingCode: string;
  trackingNumber?: string;
  companyName: string;
  managerName: string;
  fullName?: string;
  nationalCode: string;
  phone: string;
  tel: string;
  email?: string;
  province: string;
  city: string;
  fullAddress: string;
  activityFields: string[]; // e.g. ['کاشی و سرامیک', 'نساجی', 'عمده‌فروشی تسمه', 'تأمین قطعات کارخانجات', 'سایر']
  activityYears: number;
  experienceYears?: number;
  personnelCount: number;
  monthlyVolume: string; // e.g. 'کمتر از ۵۰ میلیون تومان', '۵۰ تا ۱۰۰ میلیون تومان', ...
  shopArea?: string | number;
  cooperationType: 'sales_agency' | 'regional_distributor' | 'wholesale_distributor';
  licenseDocument?: {
    fileName: string;
    fileSize: string;
    previewUrl?: string;
  };
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  applicantUserId?: string;
}

export interface FinancialTransaction {
  id: string;
  date: string;
  description: string;
  type: 'invoice' | 'payment' | 'cheque' | 'credit_rebate' | 'return' | string;
  debit: number; // بدهکار (مبلغ فاکتور خرید)
  credit: number; // بستانکار (واریز یا تسویه حساب)
  balance: number; // مانده حساب پس از تراکنش
  status?: string;
  referenceNumber?: string;
}

export interface DepositReceipt {
  id: string;
  amount: number;
  trackingNumber: string;
  bankName: string;
  paymentDate: string;
  receiptImage?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  notes?: string;
}

export interface SupplyRequest {
  id: string;
  requestNumber: string;
  productName: string;
  brand: string;
  technicalSpecs: string;
  quantity: number;
  urgency: 'normal' | 'urgent' | 'emergency_halt'; // خط خوابیده
  dealerName: string;
  status: 'pending' | 'sourcing' | 'available' | 'rejected';
  adminResponse?: string;
  submittedAt: string;
}

export interface DealerCatalogItem {
  id: string;
  title: string;
  category: string;
  fileSize: string;
  format: 'PDF' | 'XLSX' | 'ZIP';
  updatedAt: string;
  downloadCount: number;
}

export interface OfficialInvoiceItem {
  row: number;
  productCode: string;
  productName: string;
  code?: string;
  name?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  discount: number;
  tax: number;
  finalPrice: number;
}

export interface OfficialInvoice {
  id: string;
  invoiceNumber: string;
  nationalTaxId: string;
  issueDate: string;
  validUntil: string;
  seller: {
    name: string;
    nationalId: string;
    economicCode: string;
    registrationNumber: string;
    address: string;
    postalCode: string;
    phone: string;
  };
  buyer: {
    name: string;
    companyName: string;
    company?: string;
    nationalId: string;
    economicCode: string;
    phone: string;
    address: string;
    postalCode: string;
  };
  items: OfficialInvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  tax?: number;
  grandTotal: number;
  total?: number;
  paymentTerms: string;
  status: 'draft' | 'issued' | 'approved' | 'settled';
}

