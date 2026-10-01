import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  PriceTiers,
  DiscountCode,
  Order,
  OrderItem,
  OrderStatus,
  SmsLog,
  Address,
} from '../types';
import { useAuth } from './AuthContext';
import { MOCK_ORDERS, MOCK_DISCOUNT_CODES, MOCK_SMS_LOGS, MOCK_INQUIRIES } from '../data/mockData';
import { clubService } from '../services/clubService';
import { showClubPointsToast } from '../components/club/ClubToastNotification';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface InquiryItem {
  id: string;
  product: Product;
  quantity: number;
  notes?: string;
  date: string;
  status: 'pending' | 'answered';
  answeredPrice?: number;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  cost: number;
  estimatedTime: string;
  isFreightPostPay?: boolean;
}

export const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 'freight',
    name: 'باربری صنعتی (پس‌کرایه به مقصد)',
    description: 'تحویل در دفتر باربری شهر مقصد (ویژه کارخانجات، بارهای سنگین و حجیم تسمه و رولر)',
    cost: 0,
    isFreightPostPay: true,
    estimatedTime: '۲۴ الی ۴۸ ساعت کاری',
  },
  {
    id: 'tipax',
    name: 'تیپاکس اکسپرس (درب به درب)',
    description: 'ارسال فوری مستقیم تا انبار یا کارخانه با بیمه سلامت کالا',
    cost: 85000,
    estimatedTime: '۲۴ الی ۴۸ ساعت',
  },
  {
    id: 'post',
    name: 'پست پیشتاز سفارشی',
    description: 'مناسب بسته‌های سبک زیر ۳۰ کیلوگرم با کد رهگیری پست جمهوری اسلامی',
    cost: 55000,
    estimatedTime: '۲ الی ۴ روز کاری',
  },
];

interface CartContextType {
  cart: CartItem[];
  savedForLater: Product[];
  inquiries: InquiryItem[];
  orders: Order[];
  smsLogs: SmsLog[];
  appliedDiscount: DiscountCode | null;
  discountError: string | null;
  usedClubPoints: number;
  selectedShippingId: string;
  stockOverrides: Record<string, number>;
  // Actions
  addToCart: (product: Product, quantity?: number) => void;
  addItem: (product: Product, quantity?: number) => void;
  removeFromCart: (productCode: string) => void;
  updateQuantity: (productCode: string, quantity: number) => void;
  saveForLater: (productCode: string) => void;
  moveToCartFromSaved: (product: Product) => void;
  removeFromSaved: (productCode: string) => void;
  clearCart: () => void;
  applyDiscountCode: (codeStr: string) => boolean;
  removeDiscountCode: () => void;
  setClubPointsUsage: (points: number) => void;
  setSelectedShippingId: (id: string) => void;
  submitInquiry: (product: Product, quantity: number, notes?: string) => void;
  placeOrder: (params: {
    address: Address;
    shippingMethod: ShippingMethod;
    paymentMethod: 'online' | 'transfer' | 'credit';
    receiptImage?: string;
  }) => Order;
  // Computed values
  itemCount: number;
  subtotalAmount: number;
  totalRetailAmount: number;
  b2bSavings: number;
  discountAmount: number;
  tierDiscountPercent: number;
  tierDiscountAmount: number;
  isFreeShippingByTier: boolean;
  clubPointsDiscount: number;
  shippingCost: number;
  finalTotalAmount: number;
  getProductStock: (product: Product) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'hyper_sanat_cart_v2';
const SAVED_STORAGE_KEY = 'hyper_sanat_saved_v2';
const ORDERS_STORAGE_KEY = 'hyper_sanat_orders_v2';
const SMS_STORAGE_KEY = 'hyper_sanat_sms_v2';
const STOCK_STORAGE_KEY = 'hyper_sanat_stock_v2';
const INQUIRY_STORAGE_KEY = 'hyper_sanat_inquiries_v2';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, priceLayer, activeRole, addClubPoints } = useAuth();

  // Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Saved for later
  const [savedForLater, setSavedForLater] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(SAVED_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Inquiries
  const [inquiries, setInquiries] = useState<InquiryItem[]>(() => {
    try {
      const saved = localStorage.getItem(INQUIRY_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    // Seed with mock inquiries
    return MOCK_INQUIRIES.map(mi => ({
      id: mi.inquiryNumber,
      product: {
        code: mi.productCode,
        name: mi.productName,
        brand: 'اطلس و همکاران',
        categorySlug: 'industrial-belts',
        categoryName: 'قطعات فنی استعلامی',
        subcategory: 'استعلامی',
        technicalSpecs: [],
        prices: { base: mi.answeredPrice || 5000000, retail: mi.answeredPrice || 5000000, wholesale: mi.answeredPrice || 4800000, dealer: mi.answeredPrice || 4500000 },
        stock: 50,
        inquiryOnly: true,
        images: [],
        tags: ['استعلامی'],
        unit: 'عدد',
      },
      quantity: mi.requestedQty,
      notes: mi.notes,
      date: mi.createdAt,
      status: mi.status === 'answered' ? 'answered' : 'pending',
      answeredPrice: mi.answeredPrice,
    }));
  });

  // Orders
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return MOCK_ORDERS;
  });

  // SMS logs
  const [smsLogs, setSmsLogs] = useState<SmsLog[]>(() => {
    try {
      const saved = localStorage.getItem(SMS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return MOCK_SMS_LOGS;
  });

  // Stock overrides
  const [stockOverrides, setStockOverrides] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STOCK_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Discounts and shipping
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [usedClubPoints, setUsedClubPoints] = useState<number>(0);
  const [selectedShippingId, setSelectedShippingId] = useState<string>('freight');

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(savedForLater));
    } catch {
      // ignore
    }
  }, [savedForLater]);

  useEffect(() => {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch {
      // ignore
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(SMS_STORAGE_KEY, JSON.stringify(smsLogs));
    } catch {
      // ignore
    }
  }, [smsLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(stockOverrides));
    } catch {
      // ignore
    }
  }, [stockOverrides]);

  useEffect(() => {
    try {
      localStorage.setItem(INQUIRY_STORAGE_KEY, JSON.stringify(inquiries));
    } catch {
      // ignore
    }
  }, [inquiries]);

  const getProductStock = (product: Product): number => {
    if (stockOverrides[product.code] !== undefined) {
      return stockOverrides[product.code];
    }
    return product.stock;
  };

  const addToCart = (product: Product, quantity = 1) => {
    if (product.inquiryOnly) {
      submitInquiry(product, quantity);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.code === product.code);
      if (existing) {
        return prev.map(item =>
          item.product.code === product.code
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });

    const unitPrice = product.prices[priceLayer as keyof PriceTiers] || product.prices.retail;
    const pointsForThis = clubService.calculatePointsEarned(unitPrice * quantity, currentUser?.clubTier);
    showClubPointsToast(pointsForThis, product.name);
  };

  const removeFromCart = (productCode: string) => {
    setCart(prev => prev.filter(item => item.product.code !== productCode));
  };

  const updateQuantity = (productCode: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productCode);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.product.code === productCode ? { ...item, quantity } : item
      )
    );
  };

  const saveForLater = (productCode: string) => {
    const item = cart.find(c => c.product.code === productCode);
    if (!item) return;

    removeFromCart(productCode);
    setSavedForLater(prev => {
      if (prev.some(p => p.code === productCode)) return prev;
      return [item.product, ...prev];
    });
  };

  const moveToCartFromSaved = (product: Product) => {
    setSavedForLater(prev => prev.filter(p => p.code !== product.code));
    addToCart(product, 1);
  };

  const removeFromSaved = (productCode: string) => {
    setSavedForLater(prev => prev.filter(p => p.code !== productCode));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedDiscount(null);
    setUsedClubPoints(0);
  };

  const applyDiscountCode = (codeStr: string): boolean => {
    setDiscountError(null);
    const cleanCode = codeStr.trim().toUpperCase();
    const found = MOCK_DISCOUNT_CODES.find(dc => dc.code.toUpperCase() === cleanCode);

    if (!found) {
      setDiscountError('کد تخفیف واردشده نامعتبر است.');
      return false;
    }

    // Role check
    if (!found.applicableRoles.includes(activeRole)) {
      setDiscountError('این کد تخفیف برای سطح کاربری شما مجاز نیست.');
      return false;
    }

    // Special validation for WELCOME10 (first purchase only)
    if (cleanCode === 'WELCOME10') {
      const userOrders = orders.filter(o => currentUser && o.customerId === currentUser.id);
      if (userOrders.length > 0) {
        setDiscountError('کد تخفیف WELCOME10 تنها برای اولین خرید اعضای جدید باشگاه معتبر است.');
        return false;
      }
    }

    // Special validation for COMEBACK15 (inactive reactivation)
    if (cleanCode === 'COMEBACK15') {
      const userOrders = orders.filter(o => currentUser && o.customerId === currentUser.id);
      const inactivity = clubService.checkUserInactivity(userOrders);
      if (!inactivity.eligibleForComeback && userOrders.length > 0) {
        setDiscountError('این کوپن ویژه بازفعال‌سازی مشتریان با سابقه عدم سفارش بیش از ۶۰ روز است.');
        return false;
      }
    }

    // Min order check
    if (subtotalAmount < found.minOrder) {
      setDiscountError(`حداقل مبلغ سفارش برای اعمال این کد ${found.minOrder.toLocaleString('fa-IR')} تومان است.`);
      return false;
    }

    setAppliedDiscount(found);
    return true;
  };

  const removeDiscountCode = () => {
    setAppliedDiscount(null);
    setDiscountError(null);
  };

  const setClubPointsUsage = (points: number) => {
    setUsedClubPoints(Math.max(0, points));
  };

  const submitInquiry = (product: Product, quantity: number, notes?: string) => {
    const newInquiry: InquiryItem = {
      id: 'INQ-' + Date.now().toString().slice(-6),
      product,
      quantity,
      notes,
      date: new Date().toLocaleDateString('fa-IR'),
      status: 'pending',
    };
    setInquiries(prev => [newInquiry, ...prev]);
  };

  // Computations
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const subtotalAmount = cart.reduce((acc, item) => {
    const unitPrice = item.product.prices[priceLayer as keyof PriceTiers] || item.product.prices.retail;
    return acc + unitPrice * item.quantity;
  }, 0);

  const totalRetailAmount = cart.reduce((acc, item) => {
    return acc + item.product.prices.retail * item.quantity;
  }, 0);

  const b2bSavings = Math.max(0, totalRetailAmount - subtotalAmount);

  // Discount calculation
  let discountAmount = 0;
  if (appliedDiscount) {
    const rawDiscount = Math.round((subtotalAmount * appliedDiscount.discountPercent) / 100);
    discountAmount = Math.min(rawDiscount, appliedDiscount.maxDiscount);
  }

  // Tier auto-discounts (Silver: 2%, Gold: 5%)
  const tierDiscountPercent =
    currentUser?.clubTier === 'gold' ? 5 : currentUser?.clubTier === 'silver' ? 2 : 0;
  const tierDiscountAmount = Math.round((subtotalAmount * tierDiscountPercent) / 100);

  // Gold Tier has Free Shipping benefit
  const isFreeShippingByTier = currentUser?.clubTier === 'gold';
  const currentShipping = SHIPPING_METHODS.find(s => s.id === selectedShippingId) || SHIPPING_METHODS[0];
  const shippingCost = isFreeShippingByTier ? 0 : currentShipping.cost;

  // Club points: Each 1 point = 1,000 Tomans
  const clubPointsDiscount = Math.min(
    Math.max(0, subtotalAmount - discountAmount - tierDiscountAmount),
    usedClubPoints * 1000
  );

  const finalTotalAmount = Math.max(
    0,
    subtotalAmount - discountAmount - tierDiscountAmount - clubPointsDiscount + shippingCost
  );

  // Place order function
  const placeOrder = (params: {
    address: Address;
    shippingMethod: ShippingMethod;
    paymentMethod: 'online' | 'transfer' | 'credit';
    receiptImage?: string;
  }): Order => {
    const orderNum = 'ATLAS-1403-' + Math.floor(1000 + Math.random() * 9000);

    const orderItems: OrderItem[] = cart.map(item => {
      const unitPrice = item.product.prices[priceLayer as keyof PriceTiers] || item.product.prices.retail;
      return {
        productCode: item.product.code,
        productName: item.product.name,
        brand: item.product.brand,
        unit: item.product.unit,
        quantity: item.quantity,
        unitPrice,
        priceLayerUsed: priceLayer as keyof PriceTiers,
        totalPrice: unitPrice * item.quantity,
        image: item.product.images[0] || '',
      };
    });

    const isCredit = params.paymentMethod === 'credit';
    const initialStatus: OrderStatus = isCredit ? 'processing' : 'registered';

    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      orderNumber: orderNum,
      customerId: currentUser ? currentUser.id : 'guest-user',
      customerName: params.address.recipientName || currentUser?.fullName || 'خریدار محترم',
      companyName: currentUser?.companyName,
      role: activeRole,
      items: orderItems,
      totalAmount: subtotalAmount,
      discountAmount: discountAmount + clubPointsDiscount,
      shippingCost: params.shippingMethod.cost,
      shippingMethod: params.shippingMethod.name,
      paymentMethod: params.paymentMethod,
      paymentStatus: params.paymentMethod === 'online' ? 'paid' : 'pending_review',
      receiptImage: params.receiptImage,
      finalAmount: finalTotalAmount,
      status: initialStatus,
      createdAt: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      trackingCode: 'ATLAS-TRK-' + Math.floor(100000 + Math.random() * 900000),
      shippingAddress: `${params.address.province}، ${params.address.city}، ${params.address.fullAddress}`,
      recipientName: params.address.recipientName,
      recipientPhone: params.address.recipientPhone,
      timeline: [
        {
          status: 'registered',
          label: 'ثبت سفارش در سیستم',
          date: 'هم‌اکنون',
          description: isCredit ? 'سفارش اعتباری ثبت شد و جهت تأیید سقف خرید به کارشناس مالی ارسال گردید.' : 'سفارش پرداخت و به واحد انبار مرکزی یزد ارسال شد.',
          completed: true,
          current: initialStatus === 'registered',
        },
        {
          status: 'processing',
          label: 'آماده‌سازی و کنترل کیفی در انبار',
          description: 'تطبیق گام و سایز تسمه‌ها و بسته‌بندی پالت‌های ارسالی',
          completed: false,
          current: initialStatus === 'processing',
        },
        {
          status: 'shipped',
          label: 'تحویل به باربری / تیپاکس',
          description: 'صدور بارنامه رسمی و ارسال شناسه رهگیری مرسوله',
          completed: false,
          current: false,
        },
        {
          status: 'delivered',
          label: 'تحویل به انباردار کارخانه',
          description: 'تأیید رسید نهایی تحویل کالا در مقصد',
          completed: false,
          current: false,
        },
      ],
    };

    // Save order
    setOrders(prev => [newOrder, ...prev]);

    // Generate SMS Log
    const newSms: SmsLog = {
      id: 'sms-' + Date.now(),
      recipientPhone: params.address.recipientPhone || currentUser?.phone || '09131512345',
      template: 'order_registered',
      message: `بازرگانی تسمه اطلس یزد: سفارش شما به شماره ${orderNum} با موفقیت ثبت شد و در صف آماده‌سازی انبار قرار گرفت.`,
      status: 'delivered',
      sentAt: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    };
    setSmsLogs(prev => [newSms, ...prev]);

    // Decrease mock stock for each purchased item
    setStockOverrides(prev => {
      const nextOverrides = { ...prev };
      cart.forEach(item => {
        const currentStock = getProductStock(item.product);
        nextOverrides[item.product.code] = Math.max(0, currentStock - item.quantity);
      });
      return nextOverrides;
    });

    // Reward club points for the order using clubService
    const pointsEarned = clubService.calculatePointsEarned(finalTotalAmount, currentUser?.clubTier);
    if (pointsEarned > 0) {
      addClubPoints(pointsEarned);
    }

    // Clear cart
    clearCart();

    return newOrder;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        savedForLater,
        inquiries,
        orders,
        smsLogs,
        appliedDiscount,
        discountError,
        usedClubPoints,
        selectedShippingId,
        stockOverrides,
        addToCart,
        addItem: addToCart,
        removeFromCart,
        updateQuantity,
        saveForLater,
        moveToCartFromSaved,
        removeFromSaved,
        clearCart,
        applyDiscountCode,
        removeDiscountCode,
        setClubPointsUsage,
        setSelectedShippingId,
        submitInquiry,
        placeOrder,
        itemCount,
        subtotalAmount,
        totalRetailAmount,
        b2bSavings,
        discountAmount,
        tierDiscountPercent,
        tierDiscountAmount,
        isFreeShippingByTier,
        clubPointsDiscount,
        shippingCost,
        finalTotalAmount,
        getProductStock,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
