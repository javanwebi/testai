import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Headphones,
  ChevronLeft,
  ChevronDown,
  Send,
  Instagram,
  MessageCircle,
  ArrowUp,
  Check,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { STORE_ASSETS } from '../../assets/images';
import { AiConsultModal } from '../search/AiConsultModal';

// Minimalist Two-tone Geometric Brand Mark
const AtlasLogoMark: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
  <svg viewBox="0 0 100 86" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Left slant leg with solid slate */}
    <path d="M42 4 L10 82 L26 82 L48 28 Z" fill="#2B313A" />
    {/* Right slant leg with brand subtle orange */}
    <path d="M48 4 L88 82 L72 82 L56 46 Z" fill="#E06518" />
    {/* Ribbon fold facet */}
    <path d="M26 60 L74 60 L65 46 L17 46 Z" fill="#777A7D" />
  </svg>
);

// Official Iran Ministry of Industry Emblem SVG
const MimtEmblemSvg: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C11.3 4.2 9.8 7.3 9.8 10C9.8 12.2 10.9 13.8 12 14.3C13.1 13.8 14.2 12.2 14.2 10C14.2 7.3 12.7 4.2 12 2Z" />
    <path d="M8.2 7.5C6.7 10 5.8 13.2 5.8 15.8C5.8 19.4 8.5 22 12 22C8.8 21.6 7.6 18.5 7.6 15.8C7.6 13.2 8.5 10.5 9 9L8.2 7.5Z" />
    <path d="M15.8 7.5C17.3 10 18.2 13.2 18.2 15.8C18.2 19.4 15.5 22 12 22C15.2 21.6 16.4 18.5 16.4 15.8C16.4 13.2 15.5 10.5 15 9L15.8 7.5Z" />
    <line x1="12" y1="4.5" x2="12" y2="19" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="10.8" y1="2.5" x2="13.2" y2="2.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

// Company Registration Hexagonal Emblem SVG
const SherkatEmblemSvg: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
    <path d="M12 2L20.5 7V17L12 22L3.5 17V7L12 2Z" strokeLinejoin="round" />
    <path d="M12 7V17" strokeLinecap="round" />
    <path d="M8 10L12 7L16 10" strokeLinejoin="round" />
    <path d="M8 14H16" strokeLinecap="round" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

// E-Namad Calligraphic 'e' Emblem SVG
const EnamadEmblemSvg: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className}>
    <path
      d="M30 68 C 24 50, 42 22, 68 28 C 88 32, 82 65, 60 70 C 44 74, 34 60, 48 48 C 60 38, 72 45, 70 55"
      stroke="currentColor"
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="72" cy="30" r="4.5" fill="#E06518" />
  </svg>
);

export const Footer: React.FC = () => {
  const [isConsultOpen, setIsConsultOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const toggleAccordion = (key: string) => {
    setOpenAccordion((prev) => (prev === key ? null : key));
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setIsSubscribed(true);
      setTimeout(() => {
        setIsSubscribed(false);
        setNewsletterEmail('');
      }, 3500);
    }
  };

  return (
    <footer className="relative w-full overflow-hidden text-[#2B313A] border-t border-[#CBD2D8]" dir="rtl">
      {/* Top subtle hairline orange accent bar matching header */}
      <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-[#E06518] to-transparent opacity-85" />

      {/* ========================================================================= */}
      {/* TIER 1 (MAIN ZONE): Matching Header Main Body Canvas (#DEE2E5)            */}
      {/* ========================================================================= */}
      <div className="relative bg-[#DEE2E5] text-[#2B313A] pt-10 pb-9">
        {/* Subtle background industrial pattern and gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#DEE2E5] via-[#E2E6E9] to-[#D8DCE0] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#2b313a0f_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none opacity-40" />

        {/* Subtle conveyor graphic on far left */}
        <div className="absolute left-0 top-0 bottom-0 w-[22%] lg:w-[16%] pointer-events-none overflow-hidden z-0 hidden md:block opacity-10 mix-blend-multiply">
          <img
            src={STORE_ASSETS.footerConveyor}
            alt="نوار نقاله صنعتی"
            className="w-full h-full object-cover object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-[#DEE2E5] via-[#DEE2E5]/60 to-transparent" />
        </div>

        {/* Main Footer Content Grid */}
        <div className="relative z-10 max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.55fr_0.9fr_0.95fr_0.95fr_1.1fr_1.35fr] gap-6 lg:gap-4 xl:gap-6 items-start">
            
            {/* 1. BRAND & NEWSLETTER COLUMN */}
            <div className="space-y-3.5 text-right lg:pl-3">
              <Link to="/" className="inline-flex items-center gap-2.5 group">
                <AtlasLogoMark className="w-8 h-8 group-hover:scale-105 transition-transform shrink-0" />
                <div className="flex flex-col text-right">
                  <span className="text-lg font-black tracking-tight text-[#2B313A] leading-tight">
                    هایپر صنعت
                  </span>
                  <span className="text-[10px] font-bold text-[#E06518] mt-0.5 leading-none">
                    پشتوانه کارخانجات اطلس
                  </span>
                </div>
              </Link>

              <h3 className="text-xs sm:text-[13px] font-bold text-[#2B313A] pt-0.5">
                تأمین‌کننده تخصصی قطعات خطوط تولید کشور
              </h3>

              <p className="text-[11px] text-[#55565A] leading-relaxed text-justify max-w-sm font-normal">
                هایپر صنعت، مرجع تخصصی تأمین قطعات و تجهیزات مصرفی خطوط تولید صنعتی است که با سرمایه‌گذاری، تولیدات و شبکه بازرگانی کارخانجات اطلس پشتیبانی می‌شود.
              </p>

              {/* Social Icons Row */}
              <div className="flex items-center gap-2 pt-0.5">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-7 h-7 rounded-lg bg-white border border-[#CBD2D8] flex items-center justify-center text-[#2B313A] hover:text-[#E06518] hover:border-[#E06518] hover:bg-orange-50/40 transition-colors shadow-2xs"
                  title="اینستاگرام اطلس"
                >
                  <Instagram className="w-3.5 h-3.5" />
                </a>

                <a
                  href="https://eitaa.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-7 h-7 rounded-lg bg-white border border-[#CBD2D8] flex items-center justify-center text-[#E06518] hover:text-[#C95210] hover:border-[#E06518] hover:bg-orange-50/40 transition-colors shadow-2xs font-bold text-xs"
                  title="ایتا اطلس"
                >
                  <span>e</span>
                </a>

                <a
                  href="https://t.me"
                  target="_blank"
                  rel="noreferrer"
                  className="w-7 h-7 rounded-lg bg-white border border-[#CBD2D8] flex items-center justify-center text-[#2B313A] hover:text-sky-600 hover:border-sky-400 hover:bg-sky-50/40 transition-colors shadow-2xs"
                  title="کانال تلگرام"
                >
                  <Send className="w-3.5 h-3.5" />
                </a>

                <a
                  href="https://wa.me/989903427027"
                  target="_blank"
                  rel="noreferrer"
                  className="w-7 h-7 rounded-lg bg-white border border-[#CBD2D8] flex items-center justify-center text-[#2B313A] hover:text-emerald-600 hover:border-emerald-500 hover:bg-emerald-50/40 transition-colors shadow-2xs"
                  title="ارتباط در واتس‌اپ"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="border-t border-[#CBD2D8] pt-3 max-w-sm" />

              {/* Newsletter Section */}
              <div className="space-y-1.5 max-w-sm">
                <div className="flex items-center gap-1.5 text-[#2B313A] font-bold text-xs">
                  <Mail className="w-3.5 h-3.5 text-[#E06518]" />
                  <span>عضویت در خبرنامه</span>
                </div>
                <p className="text-[10px] text-[#55565A]">
                  برای دریافت جدیدترین محصولات و قیمت‌ها، ایمیل خود را وارد کنید.
                </p>

                <form onSubmit={handleNewsletterSubmit} className="pt-1">
                  <div className="flex items-center bg-white border border-[#CBD2D8] rounded-xl p-1 focus-within:border-[#E06518] focus-within:ring-2 focus-within:ring-[#E06518]/20 transition-all shadow-2xs">
                    <button
                      type="submit"
                      className="w-8 h-8 rounded-lg bg-[#E06518] hover:bg-[#C95210] text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer shadow-xs active:scale-95"
                      title="ارسال ایمیل"
                    >
                      {isSubscribed ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : (
                        <Send className="w-3.5 h-3.5 rotate-180" />
                      )}
                    </button>

                    <input
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="ایمیل خود را وارد کنید..."
                      required
                      className="w-full bg-transparent text-xs text-[#2B313A] placeholder:text-[#777A7D] px-3 outline-none text-right font-sans"
                      dir="rtl"
                    />
                  </div>
                  {isSubscribed && (
                    <p className="text-[10px] text-emerald-600 mt-1 font-bold text-right">
                      ایمیل شما با موفقیت در سامانه اطلس ثبت شد.
                    </p>
                  )}
                </form>
              </div>
            </div>

            {/* 2. QUICK ACCESS COLUMN */}
            <div className="space-y-2 text-right lg:border-r lg:border-[#CBD2D8] lg:pr-4 xl:pr-5 border-b border-[#CBD2D8] pb-3 md:border-b-0 md:pb-0">
              <button
                type="button"
                onClick={() => toggleAccordion('quickAccess')}
                className="w-full flex items-center justify-between py-1.5 md:py-0 md:cursor-default cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E06518]" />
                  <h4 className="text-xs sm:text-[13px] font-bold text-[#2B313A] group-hover:text-[#E06518] md:group-hover:text-[#2B313A] transition-colors">
                    دسترسی سریع
                  </h4>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-[#777A7D] transition-transform duration-200 md:hidden ${
                    openAccordion === 'quickAccess' ? 'rotate-180 text-[#E06518]' : ''
                  }`}
                />
              </button>

              <ul className={`space-y-1.5 text-[11px] text-[#55565A] pt-1.5 md:pt-0 ${openAccordion === 'quickAccess' ? 'block' : 'hidden'} md:block animate-in fade-in`}>
                <li>
                  <Link to="/" className="hover:text-[#E06518] transition-colors block">
                    خانه
                  </Link>
                </li>
                <li>
                  <Link to="/products" className="hover:text-[#E06518] transition-colors flex items-center justify-between group">
                    <span>کاتالوگ کل محصولات (۳۱۸ قطعه)</span>
                    <ChevronLeft className="w-3 h-3 text-[#777A7D] group-hover:text-[#E06518] transition-colors" />
                  </Link>
                </li>
                <li>
                  <Link to="/categories" className="hover:text-[#E06518] transition-colors flex items-center justify-between group">
                    <span>همه دسته‌بندی‌ها</span>
                    <ChevronLeft className="w-3 h-3 text-[#777A7D] group-hover:text-[#E06518] transition-colors" />
                  </Link>
                </li>
                <li>
                  <Link to="/#industries" className="hover:text-[#E06518] transition-colors flex items-center justify-between group">
                    <span>صنایع و کاربردها</span>
                    <ChevronLeft className="w-3 h-3 text-[#777A7D] group-hover:text-[#E06518] transition-colors" />
                  </Link>
                </li>
                <li>
                  <Link to="/#brands" className="hover:text-[#E06518] transition-colors flex items-center justify-between group">
                    <span>برندها</span>
                    <ChevronLeft className="w-3 h-3 text-[#777A7D] group-hover:text-[#E06518] transition-colors" />
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsConsultOpen(true)}
                    className="w-full hover:text-[#E06518] transition-colors flex items-center justify-between group cursor-pointer text-right"
                  >
                    <span>خدمات صنعتی</span>
                    <ChevronLeft className="w-3 h-3 text-[#777A7D] group-hover:text-[#E06518] transition-colors" />
                  </button>
                </li>
                <li>
                  <Link to="/about" className="hover:text-[#E06518] transition-colors flex items-center justify-between group">
                    <span>درباره اطلس</span>
                    <ChevronLeft className="w-3 h-3 text-[#777A7D] group-hover:text-[#E06518] transition-colors" />
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-[#E06518] transition-colors flex items-center justify-between group">
                    <span>تماس با ما</span>
                    <ChevronLeft className="w-3 h-3 text-[#777A7D] group-hover:text-[#E06518] transition-colors" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* 3. PRODUCTS COLUMN */}
            <div className="space-y-2 text-right lg:border-r lg:border-[#CBD2D8] lg:pr-4 xl:pr-5 border-b border-[#CBD2D8] pb-3 md:border-b-0 md:pb-0">
              <button
                type="button"
                onClick={() => toggleAccordion('products')}
                className="w-full flex items-center justify-between py-1.5 md:py-0 md:cursor-default cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E06518]" />
                  <h4 className="text-xs sm:text-[13px] font-bold text-[#2B313A] group-hover:text-[#E06518] md:group-hover:text-[#2B313A] transition-colors">
                    محصولات
                  </h4>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-[#777A7D] transition-transform duration-200 md:hidden ${
                    openAccordion === 'products' ? 'rotate-180 text-[#E06518]' : ''
                  }`}
                />
              </button>

              <ul className={`space-y-1.5 text-[11px] text-[#55565A] pt-1.5 md:pt-0 ${openAccordion === 'products' ? 'block' : 'hidden'} md:block animate-in fade-in`}>
                <li>
                  <Link to="/category/industrial-belts" className="hover:text-[#E06518] transition-colors flex items-center justify-between group">
                    <span>تسمه‌های خط تولید و کانوایر</span>
                    <ChevronLeft className="w-3 h-3 text-[#777A7D] group-hover:text-[#E06518] transition-colors" />
                  </Link>
                </li>
                <li>
                  <Link to="/category/pulleys-idlers" className="hover:text-[#E06518] transition-colors flex items-center justify-between group">
                    <span>پولی، فلکه و بوش تیپرلاک</span>
                    <ChevronLeft className="w-3 h-3 text-[#777A7D] group-hover:text-[#E06518] transition-colors" />
                  </Link>
                </li>
                <li>
                  <Link to="/category/bearings-bushings" className="hover:text-[#E06518] transition-colors flex items-center justify-between group">
                    <span>بلبرینگ، رولبرینگ و یاتاقان</span>
                    <ChevronLeft className="w-3 h-3 text-[#777A7D] group-hover:text-[#E06518] transition-colors" />
                  </Link>
                </li>
                <li>
                  <Link to="/category/chains-sprockets" className="hover:text-[#E06518] transition-colors flex items-center justify-between group">
                    <span>زنجیر و چرخ زنجیر صنعتی</span>
                    <ChevronLeft className="w-3 h-3 text-[#777A7D] group-hover:text-[#E06518] transition-colors" />
                  </Link>
                </li>
                <li>
                  <Link to="/category/power-transmission" className="hover:text-[#E06518] transition-colors flex items-center justify-between group">
                    <span>سیستم‌های انتقال قدرت</span>
                    <ChevronLeft className="w-3 h-3 text-[#777A7D] group-hover:text-[#E06518] transition-colors" />
                  </Link>
                </li>
                <li>
                  <Link to="/category/swr-forza-exclusive" className="hover:text-[#E06518] transition-colors flex items-center justify-between group">
                    <span>محصولات انحصاری SWR و FORZA</span>
                    <ChevronLeft className="w-3 h-3 text-[#777A7D] group-hover:text-[#E06518] transition-colors" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* 4. CUSTOMER SERVICES */}
            <div className="space-y-2 text-right lg:border-r lg:border-[#CBD2D8] lg:pr-4 xl:pr-5 border-b border-[#CBD2D8] pb-3 md:border-b-0 md:pb-0">
              <button
                type="button"
                onClick={() => toggleAccordion('services')}
                className="w-full flex items-center justify-between py-1.5 md:py-0 md:cursor-default cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E06518]" />
                  <h4 className="text-xs sm:text-[13px] font-bold text-[#2B313A] group-hover:text-[#E06518] md:group-hover:text-[#2B313A] transition-colors">
                    خدمات مشتریان
                  </h4>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-[#777A7D] transition-transform duration-200 md:hidden ${
                    openAccordion === 'services' ? 'rotate-180 text-[#E06518]' : ''
                  }`}
                />
              </button>

              <ul className={`space-y-1.5 text-[11px] text-[#55565A] pt-1.5 md:pt-0 ${openAccordion === 'services' ? 'block' : 'hidden'} md:block animate-in fade-in`}>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsConsultOpen(true)}
                    className="w-full hover:text-[#E06518] transition-colors flex items-center justify-between group cursor-pointer text-right"
                  >
                    <span>مشاوره فنی اطلس</span>
                    <ChevronLeft className="w-3 h-3 text-[#777A7D] group-hover:text-[#E06518] transition-colors" />
                  </button>
                </li>
                <li>
                  <Link to="/category/industrial-belts" className="hover:text-[#E06518] transition-colors flex items-center justify-between group">
                    <span>انتخاب قطعات صنعتی</span>
                    <ChevronLeft className="w-3 h-3 text-[#777A7D] group-hover:text-[#E06518] transition-colors" />
                  </Link>
                </li>
                <li>
                  <Link to="/dealer" className="hover:text-[#E06518] transition-colors flex items-center justify-between group">
                    <span>پنل عاملیت و نمایندگی</span>
                    <ChevronLeft className="w-3 h-3 text-[#777A7D] group-hover:text-[#E06518] transition-colors" />
                  </Link>
                </li>
                <li>
                  <Link to="/agency" className="hover:text-[#E06518] transition-colors flex items-center justify-between group">
                    <span>تأمین سفارشی خطوط</span>
                    <ChevronLeft className="w-3 h-3 text-[#777A7D] group-hover:text-[#E06518] transition-colors" />
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-[#E06518] transition-colors flex items-center justify-between group">
                    <span>پشتیبانی فنی مهندسی</span>
                    <ChevronLeft className="w-3 h-3 text-[#777A7D] group-hover:text-[#E06518] transition-colors" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* 5. CONTACT INFO COLUMN */}
            <div className="space-y-2.5 text-right lg:border-r lg:border-[#CBD2D8] lg:pr-4 xl:pr-5 border-b border-[#CBD2D8] pb-3 md:border-b-0 md:pb-0">
              <button
                type="button"
                onClick={() => toggleAccordion('contact')}
                className="w-full flex items-center justify-between py-1.5 md:py-0 md:cursor-default cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E06518]" />
                  <h4 className="text-xs sm:text-[13px] font-bold text-[#2B313A] group-hover:text-[#E06518] md:group-hover:text-[#2B313A] transition-colors">
                    اطلاعات تماس
                  </h4>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-[#777A7D] transition-transform duration-200 md:hidden ${
                    openAccordion === 'contact' ? 'rotate-180 text-[#E06518]' : ''
                  }`}
                />
              </button>

              <div className={`space-y-2.5 pt-1.5 md:pt-0 ${openAccordion === 'contact' ? 'block' : 'hidden'} md:block animate-in fade-in`}>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-lg bg-white border border-[#CBD2D8] text-[#E06518] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Phone className="w-3 h-3" />
                  </div>
                  <div className="space-y-0.5 text-[11px] text-[#2B313A] font-mono text-right" dir="ltr">
                    <div>
                      <a href="tel:03538739900" className="hover:text-[#E06518] transition-colors">
                        ۰۳۵-۳۸۷۳۹۹۰۰
                      </a>
                    </div>
                    <div>
                      <a href="tel:03538739988" className="hover:text-[#E06518] transition-colors">
                        ۰۳۵-۳۸۷۳۹۹۸۸
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-white border border-[#CBD2D8] text-[#E06518] flex items-center justify-center shrink-0 shadow-2xs">
                    <Mail className="w-3 h-3" />
                  </div>
                  <a
                    href="mailto:info@atlastrading.com"
                    className="text-[11px] text-[#2B313A] font-mono hover:text-[#E06518] transition-colors"
                    dir="ltr"
                  >
                    info@atlastrading.com
                  </a>
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-lg bg-white border border-[#CBD2D8] text-[#E06518] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <MapPin className="w-3 h-3" />
                  </div>
                  <div className="space-y-0.5 text-[11px] text-[#55565A]">
                    <p className="text-[#2B313A]">یزد، شهرک صنعتی، خیابان صنعت ۱</p>
                    <a
                      href="https://maps.google.com/?q=Yazd+Industrial+Town"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#777A7D] hover:text-[#E06518] transition-colors text-[10px] inline-block underline decoration-slate-400 underline-offset-2"
                    >
                      مشاهده روی نقشه
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-lg bg-white border border-[#CBD2D8] text-[#E06518] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Clock className="w-3 h-3" />
                  </div>
                  <div className="space-y-0.5 text-[11px] text-[#55565A]">
                    <span className="font-bold text-[#2B313A] block">ساعات کاری</span>
                    <span className="text-[10.5px] text-[#777A7D] block">شنبه تا پنجشنبه ۸:۰۰ الی ۲۰:۰۰</span>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setIsConsultOpen(true)}
                    className="w-full h-8 rounded-xl border border-[#CBD2D8] bg-white hover:bg-orange-50/50 hover:border-[#E06518] text-[#2B313A] hover:text-[#E06518] flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer text-xs font-bold shadow-2xs group active:scale-95"
                  >
                    <Headphones className="w-3.5 h-3.5 text-[#E06518] group-hover:scale-110 transition-transform" />
                    <span>درخواست مشاوره مهندسی</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 6. TRUST BADGES & LICENSES */}
            <div className="space-y-3 text-right lg:border-r lg:border-[#CBD2D8] lg:pr-4 xl:pr-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E06518]" />
                <h4 className="text-xs sm:text-[13px] font-bold text-[#2B313A]">نماد اعتماد و مجوزها</h4>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white border border-[#CBD2D8] hover:border-[#E06518] rounded-xl p-2 flex flex-col items-center justify-between text-center min-h-[96px] transition-all shadow-2xs">
                  <EnamadEmblemSvg className="w-6 h-6 text-[#2B313A] mt-0.5" />
                  <div className="w-full space-y-0.5">
                    <span className="text-[8px] text-[#2B313A] block font-bold leading-tight">
                      نماد اعتماد
                    </span>
                    <div className="flex justify-center text-amber-500 text-[7px] tracking-widest">
                      ★★★★★
                    </div>
                    <span className="text-[7.5px] text-[#777A7D] font-mono block" dir="ltr">
                      eNAMAD.ir
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-[#CBD2D8] hover:border-[#E06518] rounded-xl p-2 flex flex-col items-center justify-between text-center min-h-[96px] transition-all shadow-2xs">
                  <SherkatEmblemSvg className="w-5.5 h-5.5 text-[#2B313A] mt-0.5" />
                  <div className="w-full space-y-0.5">
                    <span className="text-[8px] text-[#2B313A] block font-bold leading-tight">
                      سامانه ثبت
                    </span>
                    <span className="text-[8px] text-[#2B313A] block font-bold leading-tight">
                      شرکت‌ها
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-[#CBD2D8] hover:border-[#E06518] rounded-xl p-2 flex flex-col items-center justify-between text-center min-h-[96px] transition-all shadow-2xs">
                  <MimtEmblemSvg className="w-5.5 h-5.5 text-[#2B313A] mt-0.5" />
                  <div className="w-full space-y-0.5">
                    <span className="text-[8px] text-[#2B313A] block font-bold leading-tight">
                      وزارت صنعت
                    </span>
                    <span className="text-[8px] text-[#2B313A] block font-bold leading-tight">
                      معدن و تجارت
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-start gap-2.5 pt-2">
                <div className="w-1 h-8 bg-[#E06518] rounded-full shrink-0 shadow-2xs" />
                <div className="text-right">
                  <h5 className="text-xs font-bold text-[#2B313A] leading-snug">
                    اطلس؛ همراه مطمئن صنعت
                  </h5>
                  <p className="text-[10px] text-[#777A7D] mt-0.5 font-normal">
                    کیفیت، تخصص، اعتماد
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TIER 2 (BOTTOM ZONE): Matching Header Top & Nav Dark Slate (#2B313A)      */}
      {/* ========================================================================= */}
      <div className="relative z-10 border-t border-[#3F4550] bg-[#2B313A] text-slate-300 py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1520px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <AtlasLogoMark className="w-4 h-4 shrink-0" />
              <div className="flex flex-col text-right">
                <span className="font-black text-white text-xs tracking-tight leading-none">
                  هایپر صنعت
                </span>
                <span className="text-[8px] font-bold text-[#E06518] leading-none mt-0.5">
                  کارخانجات اطلس
                </span>
              </div>
            </div>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="text-slate-300 text-[11px]">
              © ۱۴۰۴ هایپر صنعت اطلس | تمامی حقوق محفوظ است.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-400">
              <Link to="/about" className="hover:text-white transition-colors">
                شرایط استفاده
              </Link>
              <span className="text-slate-600">|</span>
              <Link to="/catalog" className="hover:text-white transition-colors">
                سوالات متداول
              </Link>
              <span className="text-slate-600">|</span>
              <Link to="/about" className="hover:text-white transition-colors">
                حریم خصوصی
              </Link>
            </div>

            <button
              type="button"
              onClick={scrollToTop}
              className="w-7 h-7 rounded-lg border border-slate-600 bg-[#3F4550] text-slate-200 hover:text-white hover:border-[#E06518] hover:bg-[#E06518] flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0 active:scale-95"
              title="بازگشت به بالا"
              aria-label="بازگشت به بالا"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <AiConsultModal isOpen={isConsultOpen} onClose={() => setIsConsultOpen(false)} />
    </footer>
  );
};

export default Footer;
