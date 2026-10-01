import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useClubPoints } from '../context/ClubPointsContext';
import { generateMockProducts } from '../data/mockGenerator';
import { MOCK_TICKETS } from '../data/mockData';
import { toPersianDigits, formatPrice } from '../utils/formatters';
import {
  LayoutDashboard,
  Package,
  PhoneCall,
  Heart,
  MapPin,
  Award,
  MessageSquare,
  User,
  LogOut,
  ChevronLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Eye,
  Printer,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Send,
  Building,
  ShieldCheck,
  ShoppingBag,
  ExternalLink,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Order, OrderStatus, Address, Ticket, TicketMessage, PriceInquiry } from '../types';
import { PrintableInvoiceModal } from '../components/account/PrintableInvoiceModal';
import { pricingCreditService } from '../services/pricingCreditService';

export const AccountPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'dashboard';

  const {
    currentUser,
    roleTitle,
    activeRole,
    logout,
    updateProfile,
    getUserAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  } = useAuth();

  const { orders, inquiries, addToCart, removeFromCart } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();
  const { points, tier, transactions } = useClubPoints();

  // Selected Order for Timeline Modal & Invoice Modal
  const [selectedOrderForTimeline, setSelectedOrderForTimeline] = useState<Order | null>(null);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);

  // Address CRUD Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressFormData, setAddressFormData] = useState<Omit<Address, 'id'>>({
    title: '',
    recipientName: '',
    recipientPhone: '',
    province: 'یزد',
    city: 'یزد',
    fullAddress: '',
    postalCode: '',
    isDefault: false,
  });

  // Tickets State
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    // Seed with mock tickets having rich messages
    return MOCK_TICKETS.map(t => ({
      ...t,
      messages: [
        {
          id: 'msg-1',
          sender: 'user',
          senderName: currentUser?.fullName || 'کاربر گرامی',
          message: `سلام و عرض ادب، در خصوص ${t.subject} سوال داشتم. ممنون می‌شوم کاتالوگ فنی یا زمان بررسی را بفرمایید.`,
          timestamp: t.createdAt + ' - ۱۰:۱۵',
        },
        {
          id: 'msg-2',
          sender: 'support',
          senderName: 'کارشناس فنی بازرگانی اطلس (مهندس زارع)',
          message: 'با سلام، درخواست شما در واحد مهندسی فروش بررسی شد. مشخصات کامل ضمیمه پرونده شما گردید.',
          timestamp: t.lastReplyAt + ' - ۱۱:۳۰',
        },
      ],
    }));
  });

  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketDept, setNewTicketDept] = useState<'sales' | 'technical' | 'support' | 'agency'>('technical');
  const [newTicketPriority, setNewTicketPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTicketMsg, setNewTicketMsg] = useState('');
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [ticketReplyText, setTicketReplyText] = useState('');

  // Profile Edit State
  const [profileName, setProfileName] = useState(currentUser?.fullName || '');
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || '');
  const [profileCompany, setProfileCompany] = useState(currentUser?.companyName || '');
  const [profileEconomicCode, setProfileEconomicCode] = useState(currentUser?.economicCode || '');
  const [profileSavedFeedback, setProfileSavedFeedback] = useState(false);

  // Orders Filter
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

  const addresses = getUserAddresses();

  // Wishlist products
  const allProducts = generateMockProducts();
  const wishlistProducts = allProducts.filter(p => wishlist.includes(p.code));

  // Change tab helper
  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  // Address Modal helpers
  const handleOpenAddAddress = () => {
    setEditingAddress(null);
    setAddressFormData({
      title: '',
      recipientName: currentUser?.fullName || '',
      recipientPhone: currentUser?.phone || '',
      province: 'یزد',
      city: 'یزد',
      fullAddress: '',
      postalCode: '',
      isDefault: addresses.length === 0,
    });
    setIsAddressModalOpen(true);
  };

  const handleOpenEditAddress = (addr: Address) => {
    setEditingAddress(addr);
    setAddressFormData({
      title: addr.title,
      recipientName: addr.recipientName,
      recipientPhone: addr.recipientPhone,
      province: addr.province,
      city: addr.city,
      fullAddress: addr.fullAddress,
      postalCode: addr.postalCode,
      isDefault: !!addr.isDefault,
    });
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAddress) {
      updateAddress(editingAddress.id, addressFormData);
    } else {
      addAddress(addressFormData);
    }
    setIsAddressModalOpen(false);
  };

  // Ticket handlers
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketMsg.trim()) return;

    const ticketNum = 'TCK-' + Math.floor(100 + Math.random() * 900);
    const newT: Ticket = {
      id: 'tkt-' + Date.now(),
      ticketNumber: ticketNum,
      subject: newTicketSubject,
      department: newTicketDept,
      priority: newTicketPriority,
      status: 'open',
      createdAt: new Date().toLocaleDateString('fa-IR'),
      lastReplyAt: new Date().toLocaleDateString('fa-IR'),
      messages: [
        {
          id: 'msg-' + Date.now(),
          sender: 'user',
          senderName: currentUser?.fullName || 'کاربر گرامی',
          message: newTicketMsg,
          timestamp: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };

    setTickets(prev => [newT, ...prev]);
    setIsCreatingTicket(false);
    setNewTicketSubject('');
    setNewTicketMsg('');
    setActiveTicket(newT);
  };

  const handleSendTicketReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !ticketReplyText.trim()) return;

    const userMsg: TicketMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      senderName: currentUser?.fullName || 'کاربر گرامی',
      message: ticketReplyText,
      timestamp: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = {
      ...activeTicket,
      messages: [...(activeTicket.messages || []), userMsg],
      lastReplyAt: new Date().toLocaleDateString('fa-IR'),
      status: 'open' as const,
    };

    setTickets(prev => prev.map(t => (t.id === activeTicket.id ? updated : t)));
    setActiveTicket(updated);
    setTicketReplyText('');

    // Simulate quick automated technical reply after 1.5s
    setTimeout(() => {
      const botMsg: TicketMessage = {
        id: 'msg-' + (Date.now() + 1),
        sender: 'support',
        senderName: 'پشتیبانی فنی بازرگانی اطلس',
        message: 'پیام شما دریافت شد و کارشناس فنی خط انتقال قدرت در حال بررسی جزئیات می‌باشد.',
        timestamp: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      };
      setTickets(prev =>
        prev.map(t => (t.id === updated.id ? { ...t, messages: [...(t.messages || []), botMsg] } : t))
      );
      setActiveTicket(curr =>
        curr && curr.id === updated.id ? { ...curr, messages: [...(curr.messages || []), botMsg] } : curr
      );
    }, 1200);
  };

  // Profile Save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      fullName: profileName,
      email: profileEmail,
      companyName: profileCompany,
      economicCode: profileEconomicCode,
    });
    setProfileSavedFeedback(true);
    setTimeout(() => setProfileSavedFeedback(false), 3000);
  };

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    if (orderStatusFilter === 'all') return true;
    return o.status === orderStatusFilter;
  });

  // Pending Inquiries Count
  const pendingInquiriesCount = inquiries.filter(i => i.status === 'pending').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto my-4">
      {/* Top Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#777A7D]">
        <Link to="/" className="hover:text-[#E06518]">
          صفحه اصلی
        </Link>
        <ChevronLeft className="w-3.5 h-3.5" />
        <span className="text-[#55565A] font-bold">پرتال مشتری</span>
        {currentTab !== 'dashboard' && (
          <>
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="text-[#E06518] font-bold">
              {currentTab === 'orders'
                ? 'سفارش‌ها'
                : currentTab === 'inquiries'
                ? 'استعلام‌های من'
                : currentTab === 'favorites'
                ? 'علاقه‌مندی‌ها'
                : currentTab === 'addresses'
                ? 'آدرس‌ها'
                : currentTab === 'club'
                ? 'امتیاز و باشگاه'
                : currentTab === 'tickets'
                ? 'پیام‌ها و تیکت'
                : 'اطلاعات حساب'}
            </span>
          </>
        )}
      </nav>

      {/* Profile Header Banner - Isolated Dedicated Customer Portal */}
      <div className="bg-[#55565A] text-white rounded-3xl p-6 sm:p-7 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5 border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 text-[#E06518] flex items-center justify-center font-black text-xl shadow-inner shrink-0">
            {currentUser?.fullName ? currentUser.fullName.slice(0, 1) : 'م'}
          </div>
          <div className="space-y-1 text-right">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black">
                {currentUser?.fullName || 'مشتری عزیز و گرامی'}
              </h1>
              <span className="text-[11px] font-bold px-3 py-0.5 rounded-full bg-orange-500/20 text-[#E06518] border border-orange-500/30">
                پنل اختصاصی مشتریان
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>حساب معتبر بازرگانی</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {currentUser?.companyName ? `${currentUser.companyName} | ` : ''}تلفن ثبت‌شده: <span className="font-mono text-slate-300">{currentUser?.phone}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          <Link
            to="/"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-4 h-4 text-[#E06518]" />
            <span>کاتالوگ کالاها و استعلام قیمت</span>
          </Link>

          <button
            type="button"
            onClick={logout}
            className="p-2.5 rounded-xl bg-red-950/40 text-red-400 hover:bg-red-900/50 border border-red-900/50 transition-colors cursor-pointer"
            title="خروج از حساب"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Layout: Sidebar Menu + Tab View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SIDEBAR MENU */}
        <div className="lg:col-span-3 space-y-2">
          <div className="bg-white rounded-[16px] border border-[#CBD2D8] p-3 shadow-sm space-y-1">
            <button
              type="button"
              onClick={() => setTab('dashboard')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                currentTab === 'dashboard'
                  ? 'bg-[#E06518] text-white shadow-xs'
                  : 'text-[#55565A] hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>داشبورد حساب</span>
              </div>
              <ChevronLeft className="w-4 h-4 opacity-70" />
            </button>

            <button
              type="button"
              onClick={() => setTab('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                currentTab === 'orders'
                  ? 'bg-[#E06518] text-white shadow-xs'
                  : 'text-[#55565A] hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4" />
                <span>سفارش‌ها</span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  currentTab === 'orders' ? 'bg-white/20 text-white' : 'bg-slate-100 text-[#55565A]'
                }`}
              >
                {toPersianDigits(orders.length)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTab('inquiries')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                currentTab === 'inquiries'
                  ? 'bg-[#E06518] text-white shadow-xs'
                  : 'text-[#55565A] hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <PhoneCall className="w-4 h-4" />
                <span>استعلام‌های من</span>
              </div>
              {pendingInquiriesCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                  {toPersianDigits(pendingInquiriesCount)} در انتظار
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setTab('favorites')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                currentTab === 'favorites'
                  ? 'bg-[#E06518] text-white shadow-xs'
                  : 'text-[#55565A] hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Heart className="w-4 h-4" />
                <span>علاقه‌مندی‌ها</span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  currentTab === 'favorites' ? 'bg-white/20 text-white' : 'bg-slate-100 text-[#55565A]'
                }`}
              >
                {toPersianDigits(wishlist.length)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTab('addresses')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                currentTab === 'addresses'
                  ? 'bg-[#E06518] text-white shadow-xs'
                  : 'text-[#55565A] hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4" />
                <span>آدرس‌ها</span>
              </div>
              <ChevronLeft className="w-4 h-4 opacity-70" />
            </button>

            <button
              type="button"
              onClick={() => setTab('pricing')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                currentTab === 'pricing'
                  ? 'bg-[#E06518] text-white shadow-xs'
                  : 'text-[#55565A] hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Award className="w-4 h-4" />
                <span>کرید اعتباری و لیست قیمت</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                فعال
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTab('tickets')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                currentTab === 'tickets'
                  ? 'bg-[#E06518] text-white shadow-xs'
                  : 'text-[#55565A] hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4" />
                <span>پیام‌ها و تیکت</span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  currentTab === 'tickets' ? 'bg-white/20 text-white' : 'bg-slate-100 text-[#55565A]'
                }`}
              >
                {toPersianDigits(tickets.length)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTab('profile')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                currentTab === 'profile'
                  ? 'bg-[#E06518] text-white shadow-xs'
                  : 'text-[#55565A] hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4" />
                <span>اطلاعات حساب</span>
              </div>
              <ChevronLeft className="w-4 h-4 opacity-70" />
            </button>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="lg:col-span-9 space-y-6">
          {/* TAB 1: DASHBOARD */}
          {currentTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white rounded-[16px] border border-[#CBD2D8] p-4 shadow-sm space-y-1 text-right">
                  <span className="text-[11px] text-[#777A7D]">سفارش‌های کل</span>
                  <div className="text-xl font-black text-[#55565A]">{toPersianDigits(orders.length)} سفارش</div>
                  <span className="text-[10px] text-emerald-600 font-bold block">انبار مرکزی یزد</span>
                </div>

                <div className="bg-white rounded-[16px] border border-[#CBD2D8] p-4 shadow-sm space-y-1 text-right">
                  <span className="text-[11px] text-[#777A7D]">کرید اعتباری خرید</span>
                  <div className="text-xl font-black text-[#E06518]">کرید ۲ (نقره‌ای)</div>
                  <span className="text-[10px] text-emerald-600 block">تسویه اعتباری ۳۰ روزه</span>
                </div>

                <div className="bg-white rounded-[16px] border border-[#CBD2D8] p-4 shadow-sm space-y-1 text-right">
                  <span className="text-[11px] text-[#777A7D]">استعلام‌های باز</span>
                  <div className="text-xl font-black text-amber-600">{toPersianDigits(pendingInquiriesCount)} استعلام</div>
                  <span className="text-[10px] text-amber-600 block">در انتظار پاسخ</span>
                </div>

                <div className="bg-white rounded-[16px] border border-[#CBD2D8] p-4 shadow-sm space-y-1 text-right">
                  <span className="text-[11px] text-[#777A7D]">علاقه‌مندی‌ها</span>
                  <div className="text-xl font-black text-[#55565A]">{toPersianDigits(wishlist.length)} کالا</div>
                  <span className="text-[10px] text-slate-400 block">نشان‌شده</span>
                </div>
              </div>

              {/* Recent Orders Overview */}
              <div className="bg-white rounded-[16px] border border-[#CBD2D8] p-5 shadow-sm space-y-4 text-right">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-sm text-[#55565A] flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#E06518]" />
                    <span>خلاصه آخرین سفارش‌های کارخانه</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setTab('orders')}
                    className="text-xs text-[#E06518] font-bold hover:underline"
                  >
                    مشاهده همه
                  </button>
                </div>

                <div className="space-y-3">
                  {orders.slice(0, 3).map(order => (
                    <div
                      key={order.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#55565A]">{order.orderNumber}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              order.status === 'delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.status === 'shipped'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-orange-100 text-[#C95210]'
                            }`}
                          >
                            {order.status === 'delivered'
                              ? 'تحویل‌شده'
                              : order.status === 'shipped'
                              ? 'ارسال‌شده به باربری'
                              : order.status === 'processing'
                              ? 'در حال آماده‌سازی انبار'
                              : 'ثبت‌شده در صف'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#777A7D]">
                          {order.createdAt} | {toPersianDigits(order.items.length)} قلم کالا | مقصد: {order.shippingAddress}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <div className="text-left font-black text-sm text-[#55565A]">
                          {formatPrice(order.finalAmount)}
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForTimeline(order)}
                          className="px-3 py-1.5 bg-white border border-slate-300 hover:border-orange-400 rounded-lg text-xs font-bold text-[#55565A] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Clock className="w-3.5 h-3.5 text-[#E06518]" />
                          <span>تایم‌لاین</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions Shortcuts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-right">
                <button
                  type="button"
                  onClick={() => setTab('inquiries')}
                  className="bg-white p-4 rounded-xl border border-slate-200 hover:border-orange-300 shadow-xs space-y-2 transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#E06518] flex items-center justify-center">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-[#55565A]">پیگیری استعلام‌های قیمت</div>
                  <p className="text-[11px] text-[#777A7D]">بررسی قیمت‌های اعلامی انبار برای قطعات خاص</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTab('tickets')}
                  className="bg-white p-4 rounded-xl border border-slate-200 hover:border-orange-300 shadow-xs space-y-2 transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-[#55565A]">ارسال تیکت پشتیبانی فنی</div>
                  <p className="text-[11px] text-[#777A7D]">دریافت مشاوره محاسبه گام تسمه و کاتالوگ SWR</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTab('addresses')}
                  className="bg-white p-4 rounded-xl border border-slate-200 hover:border-orange-300 shadow-xs space-y-2 transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-[#55565A]">مدیریت آدرس‌های انبار</div>
                  <p className="text-[11px] text-[#777A7D]">تنظیم آدرس پیش‌فرض تحویل کالا در شهرک‌های صنعتی</p>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ORDERS WITH TIMELINE & INVOICE */}
          {currentTab === 'orders' && (
            <div className="bg-white rounded-[16px] border border-[#CBD2D8] p-6 shadow-sm space-y-5 text-right">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#E06518]" />
                  <h2 className="font-bold text-sm text-[#55565A]">تاریخچه سفارش‌های بازرگانی تسمه اطلس</h2>
                </div>

                {/* Status Filter Buttons */}
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {[
                    { id: 'all', label: 'همه سفارش‌ها' },
                    { id: 'registered', label: 'ثبت‌شده' },
                    { id: 'processing', label: 'در حال آماده‌سازی' },
                    { id: 'shipped', label: 'ارسال‌شده' },
                    { id: 'delivered', label: 'تحویل‌شده' },
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setOrderStatusFilter(f.id)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                        orderStatusFilter === f.id
                          ? 'bg-[#55565A] text-white'
                          : 'bg-slate-100 text-[#777A7D] hover:bg-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#777A7D]">سفارشی در این وضعیت یافت نشد.</div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map(order => (
                    <div
                      key={order.id}
                      className="border border-[#CBD2D8] rounded-xl p-4 bg-white space-y-3 shadow-xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-[#55565A] text-sm">{order.orderNumber}</span>
                          <span className="text-[11px] text-[#777A7D]">{order.createdAt}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                              order.status === 'delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.status === 'shipped'
                                ? 'bg-blue-100 text-blue-800'
                                : order.status === 'processing'
                                ? 'bg-orange-100 text-[#C95210]'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {order.status === 'delivered'
                              ? 'تحویل به انباردار'
                              : order.status === 'shipped'
                              ? 'ارسال‌شده با بارنامه'
                              : order.status === 'processing'
                              ? 'آماده‌سازی انبار مرکزی'
                              : 'ثبت‌شده در سیستم'}
                          </span>
                        </div>
                      </div>

                      {/* Items Thumb preview */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {order.items.map(item => (
                          <div key={item.productCode} className="p-2 bg-slate-50 rounded-lg flex items-center justify-between">
                            <div className="truncate pl-2">
                              <span className="font-mono font-bold text-[#55565A] ml-1">{item.productCode}</span>
                              <span className="text-[#777A7D]">{item.productName}</span>
                            </div>
                            <span className="font-bold shrink-0 text-[#55565A]">
                              {toPersianDigits(item.quantity)} {item.unit}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
                        <div className="text-[11px] text-[#777A7D]">
                          آدرس تحویل: <span className="text-[#55565A] font-medium">{order.shippingAddress}</span>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <div className="text-left font-black text-sm text-[#55565A] ml-2">
                            {formatPrice(order.finalAmount)}
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedOrderForTimeline(order)}
                            className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-[#C95210] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>تایم‌لاین وضعیت</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedOrderForInvoice(order)}
                            className="px-3 py-1.5 bg-[#55565A] hover:bg-[#1B293E] text-white font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>فاکتور رسمی</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INQUIRIES */}
          {currentTab === 'inquiries' && (
            <div className="bg-white rounded-[16px] border border-[#CBD2D8] p-6 shadow-sm space-y-5 text-right">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-bold text-sm text-[#55565A]">
                  <PhoneCall className="w-5 h-5 text-[#E06518]" />
                  <span>استعلام‌های رسمی قیمت و تامین کارخانه</span>
                </div>
              </div>

              <div className="space-y-3">
                {inquiries.map(inq => {
                  const isAnswered = inq.status === 'answered';
                  return (
                    <div
                      key={inq.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isAnswered ? 'border-emerald-300 bg-emerald-50/20' : 'border-amber-200 bg-amber-50/20'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-[#55565A]">{inq.product.code}</span>
                            <span className="font-bold text-[#55565A]">{inq.product.name}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isAnswered ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {isAnswered ? 'پاسخ داده شده' : 'در حال بررسی مهندسی'}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#777A7D]">
                            تعداد استعلام: <strong className="text-[#55565A]">{toPersianDigits(inq.quantity)} {inq.product.unit}</strong> | تاریخ درخواست: {inq.date}
                          </div>
                          {inq.notes && (
                            <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200 mt-1">
                              یادداشت فنی: {inq.notes}
                            </div>
                          )}
                        </div>

                        {/* Offered price and action */}
                        <div className="flex flex-col sm:items-end gap-2 shrink-0">
                          {isAnswered ? (
                            <>
                              <div className="text-left">
                                <div className="text-[10px] text-[#777A7D]">قیمت پیشنهادی انبار اطلس:</div>
                                <div className="text-sm font-black text-emerald-700">
                                  {formatPrice(inq.answeredPrice || 5100000)}
                                </div>
                                <div className="text-[10px] text-amber-700 font-medium">اعتبار قیمت: تا ۷۲ ساعت کاری</div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  addToCart({ ...inq.product, inquiryOnly: false, prices: { ...inq.product.prices, retail: inq.answeredPrice || 5100000 } }, inq.quantity);
                                  setTab('dashboard');
                                }}
                                className="px-4 py-2 bg-[#E06518] hover:bg-[#C95210] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                              >
                                <ShoppingBag className="w-4 h-4" />
                                <span>افزودن به سبد خرید</span>
                              </button>
                            </>
                          ) : (
                            <div className="text-amber-700 text-xs font-semibold flex items-center gap-1">
                              <Clock className="w-4 h-4 animate-spin" />
                              <span>کارشناس بازرگانی اطلس در حال صدور نرخ است.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: FAVORITES / WISHLIST */}
          {currentTab === 'favorites' && (
            <div className="bg-white rounded-[16px] border border-[#CBD2D8] p-6 shadow-sm space-y-5 text-right">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-bold text-sm text-[#55565A]">
                  <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                  <span>کالاهای نشان‌شده و علاقه‌مندی‌ها ({toPersianDigits(wishlist.length)})</span>
                </div>
              </div>

              {wishlistProducts.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#777A7D]">
                  هیچ محصولی در لیست علاقه‌مندی‌های شما نشان نشده است.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlistProducts.map(prod => (
                    <div
                      key={prod.code}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-orange-300 transition-colors flex items-start gap-3.5 text-xs"
                    >
                      <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 shrink-0 overflow-hidden p-1 flex items-center justify-center">
                        {prod.images[0] ? (
                          <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-contain" />
                        ) : (
                          <Layers className="w-6 h-6 text-slate-300" />
                        )}
                      </div>

                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="font-mono text-[10px] text-[#777A7D]">{prod.code} | {prod.brand}</div>
                        <Link
                          to={`/product/${prod.code}`}
                          className="font-bold text-[#55565A] hover:text-[#E06518] line-clamp-1"
                        >
                          {prod.name}
                        </Link>
                        <div className="text-sm font-black text-[#55565A]">
                          {formatPrice(prod.prices.retail)}
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => addToCart(prod, 1)}
                            className="px-3 py-1.5 bg-[#E06518] hover:bg-[#C95210] text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>افزودن به سبد</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleWishlist(prod.code)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100"
                            title="حذف از علاقه‌مندی‌ها"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ADDRESSES CRUD */}
          {currentTab === 'addresses' && (
            <div className="bg-white rounded-[16px] border border-[#CBD2D8] p-6 shadow-sm space-y-5 text-right">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-bold text-sm text-[#55565A]">
                  <MapPin className="w-5 h-5 text-[#E06518]" />
                  <span>آدرس‌های ذخیره‌شده کارخانجات و انبارها ({toPersianDigits(addresses.length)})</span>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddAddress}
                  className="px-3.5 py-2 bg-[#E06518] hover:bg-[#C95210] text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن آدرس جدید</span>
                </button>
              </div>

              <div className="space-y-3">
                {addresses.map(addr => (
                  <div
                    key={addr.id}
                    className={`p-4 rounded-xl border text-xs space-y-2 transition-all ${
                      addr.isDefault ? 'border-[#E06518] bg-orange-50/30' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#55565A]">{addr.title}</span>
                        {addr.isDefault && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            آدرس پیش‌فرض تحویل
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!addr.isDefault && (
                          <button
                            type="button"
                            onClick={() => setDefaultAddress(addr.id)}
                            className="text-[11px] text-[#E06518] hover:underline"
                          >
                            انتخاب به عنوان پیش‌فرض
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEditAddress(addr)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100 cursor-pointer"
                          title="ویرایش"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteAddress(addr.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100 cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[#777A7D] leading-relaxed">
                      {addr.province}، {addr.city}، {addr.fullAddress}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#777A7D] pt-1">
                      <span>گیرنده کالا: <strong className="text-[#55565A]">{addr.recipientName}</strong></span>
                      <span>تلفن تماس: <span className="font-mono text-[#55565A]">{addr.recipientPhone}</span></span>
                      {addr.postalCode && <span>کدپستی: <span className="font-mono text-[#55565A]">{addr.postalCode}</span></span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: CREDIT & PRICING LIST */}
          {currentTab === 'pricing' && (
            <div className="bg-white rounded-[16px] border border-[#CBD2D8] p-6 shadow-sm space-y-6 text-right">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 font-black text-sm sm:text-base text-[#55565A]">
                    <Award className="w-5 h-5 text-[#E06518]" />
                    <span>کرید اعتباری و لیست قیمت اختصاصی مشتری</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    قیمت‌های محصولات در وب‌سایت اطلس بر اساس سطح کرید و لیست قیمت تخصیص‌یافته توسط مدیریت به شما محاسبه می‌گردد.
                  </p>
                </div>
                <Link
                  to="/"
                  className="text-xs font-bold px-4 py-2 rounded-xl bg-[#55565A] hover:bg-slate-800 text-white flex items-center gap-1.5 transition-colors self-start sm:self-auto shrink-0"
                >
                  <Package className="w-4 h-4 text-[#E06518]" />
                  <span>استعلام و کاتالوگ محصولات</span>
                </Link>
              </div>

              {/* Status and Credit Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-orange-50/80 border border-orange-200 text-right space-y-1">
                  <span className="text-[11px] text-[#777A7D] font-bold">رتبه کرید فعال شما:</span>
                  <div className="text-xl font-black text-[#E06518]">کرید ۲ (مشتریان معتبر صنعتی)</div>
                  <span className="text-[10px] text-slate-500 block">تخفیف همکاری مصوب روی تمام محصولات</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-right space-y-1">
                  <span className="text-[11px] text-[#777A7D] font-bold">لیست قیمت تخصیص‌یافته:</span>
                  <div className="text-lg font-black text-[#55565A]">لیست قیمت رسمی همکار ۱۴۰۳</div>
                  <span className="text-[10px] text-emerald-700 font-semibold block">
                    تسویه اعتباری ۳۰ روزه با چک صیادی
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-right space-y-1">
                  <span className="text-[11px] text-emerald-800 font-bold">سقف اعتبار خرید باز:</span>
                  <div className="text-xl font-black text-emerald-700">۱۵۰,۰۰۰,۰۰۰ تومان</div>
                  <span className="text-[10px] text-emerald-800 block">بدون نیاز به پیش‌پرداخت نقدی</span>
                </div>
              </div>

              {/* Instant Credit Calculation Box */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-[#55565A] font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-[#E06518]" />
                  <span>استعلام سریع قیمت طبق کرید شما:</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  هنگامی که وارد حساب خود شده‌اید، با کلیک روی دکمه «استعلام قیمت» روی هر کالا در سایت، قیمت نهایی فاکتور با کسر درصد تخفیف کرید شما فوراً نمایش داده می‌شود و می‌توانید همان لحظه اقدام به ثبت پیش‌فاکتور یا خرید نمایید.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
                  <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700">
                    درصد تخفیف پایه کرید ۲: <strong className="text-emerald-600 font-mono">۱۲٪</strong>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700">
                    ضمانت اصالت: <strong className="text-blue-600">۱۰۰٪ با گارانتی کارخانه اطلس</strong>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700">
                    تحویل مستقیم: <strong className="text-slate-800">انبار مرکزی یزد و تهران</strong>
                  </div>
                </div>
              </div>

              {/* Request Grade Upgrade Notice */}
              <div className="p-5 rounded-2xl bg-[#55565A] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-white">درخواست ارتقای کرید اعتباری یا سقف خرید</h4>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                    چنانچه حجم خریدهای دوره‌ای شما افزایش یافته یا تمایل به بهره‌مندی از کرید ۱ با مهلت تسویه ۴۵ روزه دارید، درخواست خود را برای مدیر بازرگانی ارسال فرمایید.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTab('tickets');
                    setIsCreatingTicket(true);
                    setNewTicketSubject('درخواست ارتقای کرید اعتباری و سقف خرید');
                    setNewTicketDept('sales');
                  }}
                  className="px-4 py-2.5 bg-[#E06518] hover:bg-[#C95210] text-white font-bold text-xs rounded-xl transition-colors shrink-0 cursor-pointer shadow-xs"
                >
                  ارسال درخواست به مدیریت
                </button>
              </div>
            </div>
          )}

          {/* TAB 7: TICKETS & MESSAGES */}
          {currentTab === 'tickets' && (
            <div className="bg-white rounded-[16px] border border-[#CBD2D8] p-6 shadow-sm space-y-6 text-right">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-bold text-sm text-[#55565A]">
                  <MessageSquare className="w-5 h-5 text-[#E06518]" />
                  <span>پیام‌ها و تیکت‌های پشتیبانی فنی و بازرگانی</span>
                </div>

                {!isCreatingTicket && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingTicket(true);
                      setActiveTicket(null);
                    }}
                    className="px-3.5 py-2 bg-[#E06518] hover:bg-[#C95210] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ارسال تیکت جدید</span>
                  </button>
                )}
              </div>

              {/* Create Ticket Form */}
              {isCreatingTicket && (
                <form onSubmit={handleCreateTicket} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="font-bold text-[#55565A]">ثبت تیکت پشتیبانی جدید</h3>
                    <button
                      type="button"
                      onClick={() => setIsCreatingTicket(false)}
                      className="text-[#777A7D] hover:text-red-600"
                    >
                      بستن
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-medium text-[#55565A] mb-1">موضوع تیکت:</label>
                      <input
                        type="text"
                        value={newTicketSubject}
                        onChange={e => setNewTicketSubject(e.target.value)}
                        placeholder="مثلاً درخواست کاتالوگ تسمه ضد سایش کوره"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-[#55565A] mb-1">دپارتمان مربوطه:</label>
                      <select
                        value={newTicketDept}
                        onChange={e => setNewTicketDept(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="technical">پشتیبانی و مهندسی فنی</option>
                        <option value="sales">واحد فروش و صدور فاکتور</option>
                        <option value="agency">امور نمایندگی‌ها</option>
                        <option value="support">پیگیری انبار و باربری</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-[#55565A] mb-1">متن پیام و شرح درخواست:</label>
                    <textarea
                      rows={3}
                      value={newTicketMsg}
                      onChange={e => setNewTicketMsg(e.target.value)}
                      placeholder="توضیحات فنی، کد قطعه یا ابعاد را مرقوم فرمایید..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      ارسال تیکت به واحد فنی
                    </button>
                  </div>
                </form>
              )}

              {/* Threaded Chat Modal / View */}
              {activeTicket ? (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-3 bg-white">
                  <div className="bg-[#55565A] text-white p-4 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-orange-400">{activeTicket.ticketNumber}</span>
                        <span className="font-bold text-sm">{activeTicket.subject}</span>
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        دپارتمان: {activeTicket.department} | وضعیت:{' '}
                        {activeTicket.status === 'answered' ? 'پاسخ داده شده' : 'در حال پیگیری'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTicket(null)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer"
                    >
                      بازگشت به لیست تیکت‌ها
                    </button>
                  </div>

                  {/* Thread messages */}
                  <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                    {activeTicket.messages?.map(m => (
                      <div
                        key={m.id}
                        className={`p-3 rounded-xl max-w-[85%] text-xs space-y-1 ${
                          m.sender === 'user'
                            ? 'bg-orange-50/80 border border-orange-200 mr-auto text-right'
                            : 'bg-slate-100 border border-slate-200 ml-auto text-right'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className={m.sender === 'user' ? 'text-[#C95210]' : 'text-[#55565A]'}>
                            {m.senderName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">{m.timestamp}</span>
                        </div>
                        <p className="leading-relaxed text-[#55565A]">{m.message}</p>
                      </div>
                    ))}
                  </div>

                  {/* Reply form */}
                  <form onSubmit={handleSendTicketReply} className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
                    <input
                      type="text"
                      value={ticketReplyText}
                      onChange={e => setTicketReplyText(e.target.value)}
                      placeholder="پاسخ خود را بنویسید..."
                      className="flex-1 h-10 px-3 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#E06518]"
                    />
                    <button
                      type="submit"
                      className="px-4 h-10 bg-[#E06518] hover:bg-[#C95210] text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                    >
                      <Send className="w-4 h-4" />
                      <span>ارسال</span>
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-3">
                  {tickets.map(ticket => (
                    <div
                      key={ticket.id}
                      onClick={() => setActiveTicket(ticket)}
                      className="p-4 rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-slate-50/70 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#55565A] bg-slate-100 px-1.5 py-0.5 rounded">
                            {ticket.ticketNumber}
                          </span>
                          <span className="font-bold text-[#55565A] text-sm">{ticket.subject}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ticket.status === 'answered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {ticket.status === 'answered' ? 'پاسخ داده شده' : 'در انتظار بررسی'}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#777A7D]">
                          دپارتمان: {ticket.department === 'technical' ? 'فنی و مهندسی' : ticket.department === 'sales' ? 'فروش' : 'پشتیبانی'} | آخرین بروزرسانی: {ticket.lastReplyAt}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[#E06518] font-bold text-xs">
                        <span>مشاهده گفتگو ({toPersianDigits(ticket.messages?.length || 1)} پیام)</span>
                        <ChevronLeft className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 8: PROFILE INFO */}
          {currentTab === 'profile' && (
            <div className="bg-white rounded-[16px] border border-[#CBD2D8] p-6 shadow-sm space-y-5 text-right">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-bold text-sm text-[#55565A]">
                  <User className="w-5 h-5 text-[#E06518]" />
                  <span>ویرایش اطلاعات حساب کاربری و واحد صنعتی</span>
                </div>
              </div>

              {profileSavedFeedback && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>اطلاعات کاربری با موفقیت بروزرسانی شد.</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-[#55565A] mb-1">نام و نام خانوادگی:</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={e => setProfileName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-[#55565A] mb-1">شماره تلفن همراه (تأییدشده):</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={currentUser?.phone || ''}
                      disabled
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-100 rounded-lg text-slate-500 font-mono text-left"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-[#55565A] mb-1">پست الکترونیک (ایمیل):</label>
                    <input
                      type="email"
                      dir="ltr"
                      value={profileEmail}
                      onChange={e => setProfileEmail(e.target.value)}
                      placeholder="info@meybodtile.ir"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-left"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-[#55565A] mb-1">نام شرکت / کارخانه / فروشگاه صنعتی:</label>
                    <input
                      type="text"
                      value={profileCompany}
                      onChange={e => setProfileCompany(e.target.value)}
                      placeholder="صنایع کاشی و سرامیک ستاره میبد"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-[#55565A] mb-1">کد اقتصادی یا شناسه ملی کارخانه:</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={profileEconomicCode}
                      onChange={e => setProfileEconomicCode(e.target.value)}
                      placeholder="411432819942"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-left"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-[#55565A] mb-1">سطح و لایه قیمتی فعال در سامانه:</label>
                    <div className="w-full px-3 py-2 border border-slate-200 bg-slate-100 rounded-lg text-[#55565A] font-bold">
                      {roleTitle}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#E06518] hover:bg-[#C95210] text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    ذخیره تغییرات حساب کاربری
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail & Timeline Modal */}
      {selectedOrderForTimeline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-right space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#55565A]">
                  رهگیری و تایم‌لاین سفارش {selectedOrderForTimeline.orderNumber}
                </h3>
                <span className="text-[11px] text-[#777A7D]">کد رهگیری: {selectedOrderForTimeline.trackingCode}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForTimeline(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Vertical Timeline with Orange Current Step */}
            <div className="space-y-4 py-2 relative pr-6">
              {/* Line connector */}
              <div className="absolute top-3 bottom-3 right-[11px] w-0.5 bg-slate-200 -z-0" />

              {[
                {
                  status: 'registered',
                  label: 'ثبت سفارش در سیستم و صدور پیش‌فاکتور',
                  desc: 'سفارش با موفقیت ثبت شد و به انبار مرکزی اعلام گردید.',
                  stepIndex: 1,
                },
                {
                  status: 'processing',
                  label: 'در حال آماده‌سازی و کنترل کیفی در انبار یزد',
                  desc: 'بررسی سلامت فیزیکی تسمه‌ها، بسته‌بندی پالت و ثبت در سامانه.',
                  stepIndex: 2,
                },
                {
                  status: 'shipped',
                  label: 'تحویل به باربری / تیپاکس و صدور بارنامه',
                  desc: 'محموله بارگیری شد و شماره بارنامه به گیرنده پیامک گردید.',
                  stepIndex: 3,
                },
                {
                  status: 'delivered',
                  label: 'تحویل نهایی به انباردار کارخانه در مقصد',
                  desc: 'رسید تحویل کالا به امضای مسئول انبار رسید.',
                  stepIndex: 4,
                },
              ].map((step, idx) => {
                const orderStatus = selectedOrderForTimeline.status;
                const statusOrder = ['registered', 'processing', 'shipped', 'delivered'];
                const currentIndex = statusOrder.indexOf(orderStatus);
                const isCompleted = idx <= currentIndex;
                const isCurrent = idx === currentIndex;

                return (
                  <div key={step.status} className="relative flex items-start gap-3">
                    {/* Step Icon */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 z-10 ${
                        isCurrent
                          ? 'bg-[#E06518] text-white ring-4 ring-orange-100 shadow-sm'
                          : isCompleted
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isCompleted && !isCurrent ? <CheckCircle2 className="w-3.5 h-3.5" /> : toPersianDigits(idx + 1)}
                    </div>

                    <div className="space-y-0.5">
                      <div className={`font-bold text-xs ${isCurrent ? 'text-[#C95210]' : isCompleted ? 'text-[#55565A]' : 'text-slate-400'}`}>
                        {step.label}
                        {isCurrent && (
                          <span className="mr-2 text-[10px] bg-orange-100 text-[#C95210] px-2 py-0.5 rounded-full font-semibold">
                            مرحله جاری
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#777A7D] leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setSelectedOrderForInvoice(selectedOrderForTimeline);
                  setSelectedOrderForTimeline(null);
                }}
                className="px-4 py-2 bg-[#55565A] hover:bg-[#1B293E] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>مشاهده فاکتور چاپی</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrderForTimeline(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Invoice Modal */}
      {selectedOrderForInvoice && (
        <PrintableInvoiceModal
          order={selectedOrderForInvoice}
          onClose={() => setSelectedOrderForInvoice(null)}
        />
      )}

      {/* Address Add / Edit Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-right space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-[#55565A]">
                {editingAddress ? 'ویرایش آدرس انبار کارخانه' : 'افزودن آدرس جدید'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-[#55565A] mb-1">عنوان آدرس:</label>
                <input
                  type="text"
                  value={addressFormData.title}
                  onChange={e => setAddressFormData({ ...addressFormData, title: e.target.value })}
                  placeholder="انبار مرکزی کارخانه..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-[#55565A] mb-1">نام تحویل‌گیرنده:</label>
                  <input
                    type="text"
                    value={addressFormData.recipientName}
                    onChange={e => setAddressFormData({ ...addressFormData, recipientName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#55565A] mb-1">شماره تماس مستقیم:</label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={addressFormData.recipientPhone}
                    onChange={e => setAddressFormData({ ...addressFormData, recipientPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-left"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-[#55565A] mb-1">استان:</label>
                  <input
                    type="text"
                    value={addressFormData.province}
                    onChange={e => setAddressFormData({ ...addressFormData, province: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#55565A] mb-1">شهر:</label>
                  <input
                    type="text"
                    value={addressFormData.city}
                    onChange={e => setAddressFormData({ ...addressFormData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#55565A] mb-1">نشانی دقیق پستی:</label>
                <textarea
                  rows={2}
                  value={addressFormData.fullAddress}
                  onChange={e => setAddressFormData({ ...addressFormData, fullAddress: e.target.value })}
                  placeholder="بلوار، خیابان، پلاک، نام سوله یا انبار..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-[#55565A] mb-1">کد پستی ۱۰ رقمی:</label>
                <input
                  type="text"
                  dir="ltr"
                  maxLength={10}
                  value={addressFormData.postalCode}
                  onChange={e => setAddressFormData({ ...addressFormData, postalCode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-left"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={addressFormData.isDefault}
                  onChange={e => setAddressFormData({ ...addressFormData, isDefault: e.target.checked })}
                  className="rounded text-[#E06518]"
                />
                <span className="text-[#55565A]">تنظیم به عنوان آدرس پیش‌فرض تحویل کالا</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#E06518] hover:bg-[#C95210] text-white font-bold rounded-lg cursor-pointer transition-colors"
                >
                  ذخیره آدرس
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
