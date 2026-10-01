// src/services/clubService.ts
/**
 * Customer Club & Loyalty Service (سرویس باشگاه مشتریان هایپر صنعت اطلس)
 * Provides centralized points logic, tier management, referral codes,
 * marketing campaigns, and recommendation helpers for Phases 3 and 5 (Admin).
 */

import { ClubTier, Product, Order, UserRole } from '../types';

export interface TierBenefit {
  tier: ClubTier;
  label: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  badgeHex: string;
  minSpend: number;
  discountPercent: number;
  freeShipping: boolean;
  dedicatedSupport: boolean;
  pointsMultiplier: number;
  description: string;
}

export interface HowToEarnRule {
  id: string;
  title: string;
  points: number;
  description: string;
  badgeText: string;
  iconType: 'user_plus' | 'shopping_bag' | 'file_search' | 'users' | 'message_square';
}

export interface ClubFaq {
  id: string;
  question: string;
  answer: string;
}

export interface SeasonalCampaign {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  discountPercentText: string;
  pointsBonusMultiplier: number;
  endDate: string; // ISO date or formatted
  targetCategorySlug: string;
  active: boolean;
}

// 1. Constants
export const POINT_VALUE_TOMAN = 1000; // هر ۱ امتیاز = ۱٬۰۰۰ تومان اعتبار نقدی
export const REGISTRATION_POINTS = 50; // ۵۰ امتیاز هدیه عضویت اولیه
export const REFERRAL_BONUS_POINTS = 50; // ۵۰ امتیاز برای هر دو طرف معرفی
export const INQUIRY_POINTS = 5; // ۵ امتیاز برای هر استعلام
export const REVIEW_POINTS = 20; // ۲۰ امتیاز برای ثبت نظر و رتبه فنی
export const PURCHASE_SPEND_PER_POINT = 100000; // به ازای هر ۱۰۰٬۰۰۰ تومان ۱ امتیاز

export const TIER_CONFIG: Record<ClubTier, TierBenefit> = {
  bronze: {
    tier: 'bronze',
    label: 'سطح برنزی',
    badgeBg: 'bg-[#9B5330]/10',
    badgeBorder: 'border-[#9B5330]/30',
    badgeText: 'text-[#9B5330]',
    badgeHex: '#9B5330', // #9B5330 copper/bronze tone
    minSpend: 0,
    discountPercent: 0,
    freeShipping: false,
    dedicatedSupport: false,
    pointsMultiplier: 1,
    description: 'سطح پایه عضویت؛ دسترسی به تبدیل امتیازات و جشنواره‌های عمومی فروش',
  },
  silver: {
    tier: 'silver',
    label: 'سطح نقره‌ای',
    badgeBg: 'bg-slate-100',
    badgeBorder: 'border-slate-300',
    badgeText: 'text-slate-700',
    badgeHex: '#94A3B8', // #94A3B8 metallic slate/silver
    minSpend: 20000000, // ۲۰ میلیون تومان خرید تجمعی
    discountPercent: 2, // ۲٪ تخفیف خودکار روی تمام فاکتورها
    freeShipping: false,
    dedicatedSupport: false,
    pointsMultiplier: 1.2,
    description: 'خرید تجمعی بیش از ۲۰ میلیون تومان؛ ۲٪ تخفیف خودکار روی تمام فاکتورها و اولویت انبار',
  },
  gold: {
    tier: 'gold',
    label: 'سطح طلایی',
    badgeBg: 'bg-amber-50',
    badgeBorder: 'border-amber-300',
    badgeText: 'text-amber-800',
    badgeHex: '#F59E0B', // #F59E0B gold
    minSpend: 50000000, // ۵۰ میلیون تومان خرید تجمعی
    discountPercent: 5, // ۵٪ تخفیف خودکار
    freeShipping: true, // ارسال کاملا رایگان (باربری/پست)
    dedicatedSupport: true, // پشتیبانی اختصاصی ۲۴ ساعته خط تولید
    pointsMultiplier: 1.5,
    description: 'خرید بیش از ۵۰ میلیون تومان؛ ۵٪ تخفیف خودکار + ارسال کاملاً رایگان + کارشناس اختصاصی کارخانه',
  },
};

// 2. Rules List
export const HOW_TO_EARN_RULES: HowToEarnRule[] = [
  {
    id: 'register',
    title: 'عضویت در سامانه',
    points: REGISTRATION_POINTS,
    description: 'ثبت شماره موبایل و عضویت آنی در باشگاه مشتریان اطلس',
    badgeText: 'هدیه ورود',
    iconType: 'user_plus',
  },
  {
    id: 'purchase',
    title: 'خرید تجهیزات و قطعات',
    points: 1,
    description: 'به‌ازای هر ۱۰۰٬۰۰۰ تومان پرداخت، ۱ امتیاز معادل ۱٬۰۰۰ تومان دریافت کنید',
    badgeText: 'هر ۱۰۰ هزار تومان',
    iconType: 'shopping_bag',
  },
  {
    id: 'inquiry',
    title: 'ثبت استعلام قیمت فنی',
    points: INQUIRY_POINTS,
    description: 'ثبت مشخصات فنی تسمه‌ها یا غلتک‌های سفارشی خارج از کاتالوگ',
    badgeText: 'هر استعلام',
    iconType: 'file_search',
  },
  {
    id: 'referral',
    title: 'معرفی همکاران و دوستان',
    points: REFERRAL_BONUS_POINTS,
    description: 'ارسال کد دعوت اختصاصی؛ ۵۰ امتیاز برای شما و ۵۰ امتیاز برای دوست شما پس از ثبت‌نام',
    badgeText: 'دو سر برد',
    iconType: 'users',
  },
  {
    id: 'review',
    title: 'ثبت نظر و امتیاز فنی کالا',
    points: REVIEW_POINTS,
    description: 'ارائه تجربه تست کیفی و طول عمر قطعه در خط تولید پس از خرید موفق',
    badgeText: 'هر نظر تأیید شده',
    iconType: 'message_square',
  },
];

// 3. FAQs
export const CLUB_FAQS: ClubFaq[] = [
  {
    id: 'faq-1',
    question: 'چگونه از امتیازهای باشگاه در خریدهای بعدی استفاده کنم؟',
    answer:
      'در مرحله سبد خرید یا تسویه‌حساب (چک‌اوت)، سوییچ «استفاده از امتیاز باشگاه» را فعال کنید. هر ۱ امتیاز دقیقاً معادل ۱٬۰۰۰ تومان اعتبار نقدی است و از مبلغ نهایی فاکتور کسر می‌شود.',
  },
  {
    id: 'faq-2',
    question: 'آیا ارتقا به سطوح نقره‌ای و طلایی نیاز به پرداخت هزینه دارد؟',
    answer:
      'خیر، عضویت و ارتقا کاملاً رایگان است. سامانه به‌صورت هوشمند مجموع مبالغ خریدهای موفق شما را محاسبه می‌کند. با رسیدن به ۲۰ میلیون تومان به سطح نقره‌ای و با رسیدن به ۵۰ میلیون تومان به سطح طلایی ارتقا می‌یابید.',
  },
  {
    id: 'faq-3',
    question: 'آیا امتیازهای من تاریخ انقضا دارند؟',
    answer:
      'امتیازهای باشگاه تا ۱۲ ماه پس از تاریخ کسب معتبر هستند و در پنل کاربری تاریخ اعتبار نمایش داده می‌شود.',
  },
  {
    id: 'faq-4',
    question: 'آیا تخفیف سطوح با کدهای تخفیف جشنواره قابل جمع است؟',
    answer:
      'بله! تخفیف سطوح نقره‌ای (۲٪) و طلایی (۵٪) به‌صورت سیستمی روی قیمت کالاها اعمال می‌شود و شما می‌توانید علاوه بر آن از کد تخفیف جشنواره یا کوپن خوش‌آمدگویی استفاده کنید.',
  },
  {
    id: 'faq-5',
    question: 'کد تخفیف WELCOME10 چگونه کار می‌کند؟',
    answer:
      'این کد ویژه اولین خرید کلیه اعضای جدید باشگاه است که ۱۰٪ تخفیف تا سقف ۵۰۰٬۰۰۰ تومان را روی سفارش اول لحاظ می‌کند.',
  },
];

// 4. Seasonal Campaign (Configurable for Phase 5 Admin)
export const DEFAULT_SEASONAL_CAMPAIGN: SeasonalCampaign = {
  id: 'cmp-autumn-1403',
  title: 'فروش ویژه فصلی بازرگانی اطلس یزد',
  subtitle: 'تأمین اضطراری قطعات خطوط تولید کاشی، سرامیک و نساجی',
  description: 'تا ۲۰٪ تخفیف ویژه + ۲ برابر امتیاز باشگاه روی کلیه تسمه‌های نسوز و رولرهای کوره',
  badge: 'فروش ویژه فصلی',
  discountPercentText: 'تا ۲۰٪ تخفیف',
  pointsBonusMultiplier: 2,
  endDate: '2026-10-15T23:59:59',
  targetCategorySlug: 'ceramic-tiles',
  active: true,
};

// 5. Service Class / Singleton
class ClubService {
  private viewedCategoriesKey = 'hyper_sanat_viewed_categories';

  /**
   * Calculates tier based on cumulative purchases in Tomans
   */
  public calculateTier(cumulativePurchases: number): ClubTier {
    if (cumulativePurchases >= TIER_CONFIG.gold.minSpend) {
      return 'gold';
    }
    if (cumulativePurchases >= TIER_CONFIG.silver.minSpend) {
      return 'silver';
    }
    return 'bronze';
  }

  /**
   * Get tier details and benefits
   */
  public getTierInfo(tier: ClubTier): TierBenefit {
    return TIER_CONFIG[tier] || TIER_CONFIG.bronze;
  }

  /**
   * Calculates progress to the next tier
   */
  public getTierProgress(cumulativePurchases: number): {
    currentTier: ClubTier;
    nextTier: ClubTier | null;
    targetSpend: number;
    currentSpend: number;
    remainingSpend: number;
    progressPercent: number;
  } {
    const currentTier = this.calculateTier(cumulativePurchases);

    if (currentTier === 'gold') {
      return {
        currentTier: 'gold',
        nextTier: null,
        targetSpend: TIER_CONFIG.gold.minSpend,
        currentSpend: cumulativePurchases,
        remainingSpend: 0,
        progressPercent: 100,
      };
    }

    if (currentTier === 'silver') {
      const target = TIER_CONFIG.gold.minSpend;
      const progress = Math.min(100, Math.round((cumulativePurchases / target) * 100));
      return {
        currentTier: 'silver',
        nextTier: 'gold',
        targetSpend: target,
        currentSpend: cumulativePurchases,
        remainingSpend: Math.max(0, target - cumulativePurchases),
        progressPercent: progress,
      };
    }

    // Bronze
    const target = TIER_CONFIG.silver.minSpend;
    const progress = Math.min(100, Math.round((cumulativePurchases / target) * 100));
    return {
      currentTier: 'bronze',
      nextTier: 'silver',
      targetSpend: target,
      currentSpend: cumulativePurchases,
      remainingSpend: Math.max(0, target - cumulativePurchases),
      progressPercent: progress,
    };
  }

  /**
   * Calculate points earned from order total
   */
  public calculatePointsEarned(totalAmountToman: number, tier: ClubTier = 'bronze'): number {
    const basePoints = Math.floor(totalAmountToman / PURCHASE_SPEND_PER_POINT);
    const multiplier = TIER_CONFIG[tier]?.pointsMultiplier || 1;
    return Math.max(1, Math.round(basePoints * multiplier));
  }

  /**
   * Calculate Toman value of given points
   */
  public calculatePointsValue(points: number): number {
    return Math.max(0, points * POINT_VALUE_TOMAN);
  }

  /**
   * Generate referral code from user phone/id
   */
  public generateReferralCode(phone?: string, id?: string): string {
    if (phone && phone.length >= 7) {
      const lastDigits = phone.slice(-5);
      return `ATLAS-${lastDigits}`;
    }
    if (id) {
      return `ATLAS-${id.slice(-4).toUpperCase()}`;
    }
    return 'ATLAS-1366';
  }

  /**
   * Generate referral link
   */
  public generateReferralLink(referralCode: string): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://atlassanat.ir';
    return `${origin}/?ref=${encodeURIComponent(referralCode)}`;
  }

  /**
   * Record a viewed category in localStorage for personalized recommendations
   */
  public recordCategoryView(categorySlug: string): void {
    if (typeof window === 'undefined' || !categorySlug) return;
    try {
      const raw = localStorage.getItem(this.viewedCategoriesKey);
      const list: string[] = raw ? JSON.parse(raw) : [];
      const updated = [categorySlug, ...list.filter(s => s !== categorySlug)].slice(0, 5);
      localStorage.setItem(this.viewedCategoriesKey, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  /**
   * Get recently viewed category slugs
   */
  public getRecentCategoryViews(): string[] {
    if (typeof window === 'undefined') return ['industrial-belts', 'ceramic-tiles'];
    try {
      const raw = localStorage.getItem(this.viewedCategoriesKey);
      const list: string[] = raw ? JSON.parse(raw) : [];
      return list.length > 0 ? list : ['industrial-belts', 'ceramic-tiles'];
    } catch {
      return ['industrial-belts', 'ceramic-tiles'];
    }
  }

  /**
   * Get personalized recommendations based on recent views
   */
  public getRecommendedProducts(allProducts: Product[]): Product[] {
    const slugs = this.getRecentCategoryViews();
    // Prioritize products matching recently viewed slugs
    const matches = allProducts.filter(p => slugs.includes(p.categorySlug));
    if (matches.length >= 4) {
      return matches.slice(0, 4);
    }
    // Fallback or fill up with popular/featured products
    const remaining = allProducts.filter(p => !matches.some(m => m.code === p.code));
    return [...matches, ...remaining].slice(0, 4);
  }

  /**
   * Check for user inactivity (> 60 days without order)
   */
  public checkUserInactivity(orders: Order[]): {
    isInactive: boolean;
    daysSinceLastOrder: number;
    eligibleForComeback: boolean;
  } {
    // If no orders at all, not considered a churned inactive user (they're new)
    if (!orders || orders.length === 0) {
      return {
        isInactive: false,
        daysSinceLastOrder: 0,
        eligibleForComeback: false,
      };
    }

    // For demo / simulation purposes, allow inspecting if mock order date is > 60 days
    // Or check if user has COMEBACK mock toggle in localStorage
    let forceInactive = false;
    try {
      if (typeof window !== 'undefined' && localStorage.getItem('hyper_sanat_mock_inactive') === 'true') {
        forceInactive = true;
      }
    } catch {
      // ignore
    }

    if (forceInactive) {
      return {
        isInactive: true,
        daysSinceLastOrder: 75,
        eligibleForComeback: true,
      };
    }

    // Calculate roughly from latest order
    const latestOrder = orders[0];
    // If order date contains year 1402 or earlier, or flag set
    if (latestOrder.createdAt && (latestOrder.createdAt.includes('1402') || latestOrder.createdAt.includes('1401'))) {
      return {
        isInactive: true,
        daysSinceLastOrder: 92,
        eligibleForComeback: true,
      };
    }

    return {
      isInactive: false,
      daysSinceLastOrder: 12,
      eligibleForComeback: false,
    };
  }

  /**
   * Set mock inactive state for demonstration
   */
  public setMockInactiveState(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    try {
      if (enabled) {
        localStorage.setItem('hyper_sanat_mock_inactive', 'true');
      } else {
        localStorage.removeItem('hyper_sanat_mock_inactive');
      }
    } catch {
      // ignore
    }
  }

  /**
   * Get active campaign
   */
  public getActiveCampaign(): SeasonalCampaign {
    return DEFAULT_SEASONAL_CAMPAIGN;
  }
}

export const clubService = new ClubService();
