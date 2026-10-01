import { Category } from '../types';
import { getProductImageUrl } from '../assets/imagesproducts';
import { USER_PRODUCTS } from './userProducts';

export interface EnhancedCategory extends Category {
  image?: string;
}

const countsBySlug: Record<string, number> = {};
USER_PRODUCTS.forEach(p => {
  countsBySlug[p.categorySlug] = (countsBySlug[p.categorySlug] || 0) + 1;
});

export const CATEGORIES: EnhancedCategory[] = [
  {
    id: 1,
    slug: 'power-transmission',
    name: 'تسمه‌ها و اتصالات انتقال قدرت',
    nameEn: 'Power Transmission & Couplings',
    description: 'انواع کوپلینگ‌های لاستیکی و خاری، کشنده‌های صنعتی، بوش‌های الاستومری، شفت‌های محرک و اسپراکت‌های انتقال نیرو',
    subcategories: [
      'کوپلینگ و اتصالات',
      'کشنده‌ها و تنظیم‌کننده‌ها',
      'بوش و اتصالات الاستومری',
      'پین و واسطه‌های محرک',
      'چرخ‌دنده‌ها و اسپراکت‌ها'
    ],
    icon: 'Cpu',
    count: countsBySlug['power-transmission'] || 107,
    image: getProductImageUrl('e(001).png'),
  },
  {
    id: 2,
    slug: 'industrial-belts',
    name: 'تسمه‌های صنعتی و تایمینگ',
    nameEn: 'Industrial Belts & Timing Belts',
    description: 'تسمه‌های صنعتی V شکل، تایمینگ‌های دنده‌ای گام‌های مختلف، تسمه‌های شیاردار و پلی‌یورتان روکش‌دار خطوط تولید',
    subcategories: [
      'تسمه V-Belt ساده و دنده‌ای',
      'تسمه تایمینگ صنعتی',
      'تسمه پلی‌یورتان روکش‌دار',
      'تسمه شیاردار Poly-V',
      'تسمه روکش‌دار ضدسایش Linatex'
    ],
    icon: 'Layers',
    count: countsBySlug['industrial-belts'] || 120,
    image: getProductImageUrl('e(045).png'),
  },
  {
    id: 3,
    slug: 'ceramic-tiles',
    name: 'قطعات خطوط کاشی و سرامیک',
    nameEn: 'Ceramic & Tile Machinery Parts',
    description: 'غلتک‌های سرامیکی نسوز کوره، تسمه‌های خط لعاب و چاپ، ونتوری و نازل اسپری‌درایر، تسمه‌های نسوز و سنگ‌های پولیش',
    subcategories: [
      'غلتک‌های سرامیکی و فلزی کوره',
      'تسمه‌های خط لعاب و چاپ',
      'قطعات ونتوری و نازل اسپری‌درایر',
      'تسمه‌های رولر ضد حرارت',
      'سنگ‌های ساب و پولیش'
    ],
    icon: 'Grid',
    count: countsBySlug['ceramic-tiles'] || 121,
    image: getProductImageUrl('e(095).png'),
  },
  {
    id: 4,
    slug: 'pulleys-idlers',
    name: 'پولی و فولی‌های صنعتی',
    nameEn: 'Industrial Pulleys & Idlers',
    description: 'فولی‌های چدنی و آلومینیومی شیاردار V-Belt، فولی‌های تایمینگ دنده‌ای، قفل‌کن تیپر لاک و هرزگردهای خطوط انتقال',
    subcategories: [
      'فولی‌های شیاردار V-Belt',
      'فولی‌های تایمینگ دنده‌ای',
      'بوش مخروطی Taper Lock',
      'پولی‌های آلومینیومی دور بالا',
      'غلتک‌ها و هرزگردهای راهنما'
    ],
    icon: 'CircleDot',
    count: countsBySlug['pulleys-idlers'] || 108,
    image: getProductImageUrl('e(155).png'),
  },
  {
    id: 5,
    slug: 'bearings-bushings',
    name: 'بلبرینگ، یاتاقان و بوش صنعتی',
    nameEn: 'Bearings, Bushings & Housings',
    description: 'بلبرینگ‌های شیار عمیق دور بالا، یاتاقان‌های هوزینگ‌دار UCP و UCF، بوش‌های برنجی خود‌روانکار و کاسه‌نمدهای نسوز',
    subcategories: [
      'بلبرینگ‌های شیار عمیق دور بالا',
      'یاتاقان‌های هوزینگ‌دار UCP و UCF',
      'بوش‌های برنجی و گرافیتی خود‌روانکار',
      'رولبرینگ‌های مخروطی و سوزنی',
      'کاسه‌نمدهای نسوز و ضدغبار'
    ],
    icon: 'Shield',
    count: countsBySlug['bearings-bushings'] || 108,
    image: getProductImageUrl('e(205).png'),
  },
  {
    id: 6,
    slug: 'chains-sprockets',
    name: 'زنجیر و چرخ‌دنده اسپراکت',
    nameEn: 'Chains & Industrial Sprockets',
    description: 'انواع زنجیرهای غلتکی صنعتی تک و دوبل، چرخ‌دنده‌های ناف‌دار فولادی و چدنی، زنجیرهای شاخک‌دار کانوایر و اتصالات',
    subcategories: [
      'زنجیرهای غلتکی صنعتی تک ردیفه',
      'زنجیرهای دوبل و سه‌ردیفه سنگین',
      'چرخ‌دنده اسپراکت ساده و ناف‌دار',
      'زنجیرهای شاخک‌دار کانوایر و انتقال',
      'قفل و نیم‌پین اتصال زنجیر صنعتی'
    ],
    icon: 'Link',
    count: countsBySlug['chains-sprockets'] || 100,
    image: getProductImageUrl('e(255).png'),
  },
  {
    id: 7,
    slug: 'textile-machinery',
    name: 'قطعات صنعت نساجی',
    nameEn: 'Textile Machinery Parts',
    description: 'تسمه‌های دوطرفه اسپیندل ریسندگی، شانه‌های بافندگی، غلتک‌های کشش، تیغه‌های برش و قطعات ماشین‌آلات نساجی',
    subcategories: [
      'تسمه دوطرفه اسپیندل ریسندگی',
      'شانه‌های بافندگی فولادی و پرزگیر',
      'غلتک‌های کشش و فرم‌دهی',
      'قطعات چسب آپارات و نگهداری تسمه'
    ],
    icon: 'Scissors',
    count: countsBySlug['textile-machinery'] || 100,
    image: getProductImageUrl('e(290).png'),
  },
  {
    id: 8,
    slug: 'swr-forza-exclusive',
    name: 'برندهای ویژه SWR و FORZA',
    nameEn: 'SWR & FORZA Exclusives',
    description: 'تسمه‌ها و قطعات تخصصی برندهای معتبر اروپایی SWR آلمان و FORZA ایتالیا با گارانتی رسمی بازرگانی اطلس',
    subcategories: [
      'تسمه‌های تخصصی SWR اروپایی',
      'تسمه و اتصالات فورزا (FORZA)',
      'تسمه‌های حرارتی و سیلیکونی کوره',
      'روکش‌های ضدسایش سفارشی خطوط',
      'کیت‌های بهینه‌سازی انتقال قدرت SWR'
    ],
    icon: 'ShieldCheck',
    count: countsBySlug['swr-forza-exclusive'] || 100,
    image: getProductImageUrl('e(055).png'),
  }
];
