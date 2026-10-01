import fs from 'fs';
import path from 'path';

const analyzedFile = path.join('src', 'data', 'analyzedProducts.json');
let aiAnalyzed = {};
if (fs.existsSync(analyzedFile)) {
  try {
    const data = JSON.parse(fs.readFileSync(analyzedFile, 'utf8'));
    data.forEach(item => {
      if (item && item.file && !item.name.startsWith("قطعه و تجهیزات صنعتی اطلس") && !item.name.startsWith("قطعه صنعتی اطلس")) {
        aiAnalyzed[item.file] = item;
      }
    });
  } catch (e) {}
}

console.log(`Loaded ${Object.keys(aiAnalyzed).length} verified AI analyzed items.`);

const imagesDir = path.join('src', 'assets', 'imagesproducts');
const allFiles = fs.readdirSync(imagesDir)
  .filter(f => f.endsWith('.png'))
  .sort((a, b) => {
    const na = parseInt((a.match(/\d+/) || [0])[0]);
    const nb = parseInt((b.match(/\d+/) || [0])[0]);
    return na - nb;
  });

console.log(`Found ${allFiles.length} product images.`);

// 8 Core Categorical Domains strictly partitioning 864 products
// Ranges:
// 1. power-transmission: 1-40 & 319-386 (Total: 108)
// 2. industrial-belts: 41-90 & 387-456 (Total: 120)
// 3. ceramic-tiles: 91-150 & 457-516 (Total: 120)
// 4. pulleys-idlers: 151-200 & 517-574 (Total: 108)
// 5. bearings-bushings: 201-250 & 575-632 (Total: 108)
// 6. chains-sprockets: 251-285 & 633-697 (Total: 100)
// 7. textile-machinery: 286-318 & 698-764 (Total: 100)
// 8. swr-forza-exclusive: 765-864 (Total: 100)
// Grand Total: 108 + 120 + 120 + 108 + 108 + 100 + 100 + 100 = 864 items!

const DOMAINS_CONFIG = [
  {
    slug: 'power-transmission',
    name: 'تسمه‌ها و اتصالات انتقال قدرت',
    ranges: [[1, 40], [319, 386]],
    subcategories: [
      'کوپلینگ و اتصالات',
      'کشنده‌ها و تنظیم‌کننده‌ها',
      'بوش و اتصالات الاستومری',
      'پین و واسطه‌های محرک',
      'چرخ‌دنده‌ها و اسپراکت‌ها'
    ],
    items: [
      { name: 'بوش لاستیکی کوپلینگ خاری (اسپایدر)', sub: 'کوپلینگ و اتصالات', en: 'Coupling Spider Rubber Bushing', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'رابط لاستیکی کوپلینگ ستاره‌ای ضدسایش', sub: 'کوپلینگ و اتصالات', en: 'Star Elastic Coupling Element', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'کشنده مکانیکی فنری تسمه و زنجیر', sub: 'کشنده‌ها و تنظیم‌کننده‌ها', en: 'Mechanical Spring Belt Tensioner', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'کشنده پیچی صنعتی با غلتک هرزگرد', sub: 'کشنده‌ها و تنظیم‌کننده‌ها', en: 'Screw Adjusting Tensioner with Idler', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'کشنده بازویی اتوماتیک خطوط تولید', sub: 'کشنده‌ها و تنظیم‌کننده‌ها', en: 'Automatic Arm Belt Tensioner', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'شفت اسپراکت محرک فولادی سخت‌کاری‌شده', sub: 'چرخ‌دنده‌ها و اسپراکت‌ها', en: 'Hardened Steel Sprocket Drive Shaft', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'شفت دنده‌ای صنعتی با خار انتقال قدرت', sub: 'چرخ‌دنده‌ها و اسپراکت‌ها', en: 'Industrial Spline Drive Shaft', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'بوش لاستیکی خورشیدی کوپلینگ روتکس', sub: 'کوپلینگ و اتصالات', en: 'Rotex Coupling Elastomer Insert', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'لاستیک کوپلینگ لقمه‌ای HRC مقاوم به روغن', sub: 'کوپلینگ و اتصالات', en: 'HRC Coupling Rubber Buffer', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'کوپلینگ خاری چدنی با رابر مرکزی پلی‌یورتان', sub: 'کوپلینگ و اتصالات', en: 'Jaw Coupling Hub with PU Insert', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'بوش هدایت سرامیکی مخروطی نسوز', sub: 'بوش و اتصالات الاستومری', en: 'Conical Ceramic Guide Bushing', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'پین کوپلینگ فولادی با بوش ضربه‌گیر', sub: 'پین و واسطه‌های محرک', en: 'Coupling Pin with Rubber Sleeve', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'پین کوپلینگ استوانه‌ای کششی سنگین', sub: 'پین و واسطه‌های محرک', en: 'Heavy Duty Cylindrical Coupling Pin', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'پیچ انکر با گل شش‌گوش گالوانیزه گرید ۸.۸', sub: 'بوش و اتصالات الاستومری', en: 'Hex Head Anchor Bolt Grade 8.8', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'کوپلینگ لاستیکی فلنجی انعطاف‌پذیر مدل FCL', sub: 'کوپلینگ و اتصالات', en: 'Flexible Flange Coupling FCL', brand: 'فورزا (FORZA)' },
      { name: 'بوش الاستومری ضدلرزش ماشین‌آلات صنعتی', sub: 'بوش و اتصالات الاستومری', en: 'Anti-Vibration Industrial Rubber Bushing', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'رابط کوپلینگ دنده‌ای نایلونی مدل BoWex', sub: 'کوپلینگ و اتصالات', en: 'Nylon Gear Coupling Sleeve BoWex', brand: 'کپکس (KTR / BoWex)' },
      { name: 'ضربه گیر دایره‌ای پایه‌های موتور و گیربکس', sub: 'بوش و اتصالات الاستومری', en: 'Cylindrical Motor Mount Damper', brand: 'بازرگانی تسمه اطلس (ATLAS)' }
    ]
  },
  {
    slug: 'industrial-belts',
    name: 'تسمه‌های صنعتی و تایمینگ',
    ranges: [[41, 90], [387, 456]],
    subcategories: [
      'تسمه V-Belt ساده و دنده‌ای',
      'تسمه تایمینگ صنعتی',
      'تسمه پلی‌یورتان روکش‌دار',
      'تسمه شیاردار Poly-V',
      'تسمه روکش‌دار ضدسایش Linatex'
    ],
    items: [
      { name: 'تسمه تایمینگ صنعتی دنده‌ای HTD-8M اطلس', sub: 'تسمه تایمینگ صنعتی', en: 'Industrial Timing Belt HTD-8M', brand: 'اس دبلیو آر (SWR)' },
      { name: 'تسمه تایم تقویت‌شده HTD-14M با کورد فایبرگلاس', sub: 'تسمه تایمینگ صنعتی', en: 'Heavy Duty Timing Belt HTD-14M', brand: 'اس دبلیو آر (SWR)' },
      { name: 'تسمه وی‌بلت دنده‌ای سوپر پاور مدل SPZ', sub: 'تسمه V-Belt ساده و دنده‌ای', en: 'Raw Edge Cogged V-Belt SPZ', brand: 'فورزا (FORZA)' },
      { name: 'تسمه صنعتی ذوزنقه‌ای مدل SPA با مقاومت حرارتی', sub: 'تسمه V-Belt ساده و دنده‌ای', en: 'Classical V-Belt SPA Heat Resistant', brand: 'فورزا (FORZA)' },
      { name: 'تسمه وی‌بلت صنعتی سنگین مدل SPB دور بالا', sub: 'تسمه V-Belt ساده و دنده‌ای', en: 'High Speed Heavy V-Belt SPB', brand: 'اپتی‌بلت (Optibelt)' },
      { name: 'تسمه V-Belt صنعتی مدل SPC انتقال قدرت بالا', sub: 'تسمه V-Belt ساده و دنده‌ای', en: 'Power Transmission V-Belt SPC', brand: 'اپتی‌بلت (Optibelt)' },
      { name: 'تسمه تایم پلی‌یورتان دندانه دوطرفه T10', sub: 'تسمه تایمینگ صنعتی', en: 'Double Sided PU Timing Belt T10', brand: 'مگاداین (Megadyne)' },
      { name: 'تسمه تایم سفید PU مدل AT10 با کورد استیل', sub: 'تسمه پلی‌یورتان روکش‌دار', en: 'White PU Timing Belt AT10 Steel Cord', brand: 'مگاداین (Megadyne)' },
      { name: 'تسمه روکش‌دار ضدسایش تیناتکس قرمز خط کاشی', sub: 'تسمه روکش‌دار ضدسایش Linatex', en: 'Red Linatex Coated Conveyor Belt', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'تسمه تایم شیاردار با روکش اسفنجی APL سبز', sub: 'تسمه پلی‌یورتان روکش‌دار', en: 'APL Green Sponge Coated Belt', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'تسمه شیاردار دینام و کمپرسور Poly-V مقطع PJ', sub: 'تسمه شیاردار Poly-V', en: 'Poly-V Ribbed Belt PJ Profile', brand: 'کنتی‌تک (Continental)' },
      { name: 'تسمه شیاردار صنعتی مقاوم به لغزش مقطع PK', sub: 'تسمه شیاردار Poly-V', en: 'Multi-Ribbed Industrial Belt PK', brand: 'کنتی‌تک (Continental)' },
      { name: 'تسمه تایمینگ دندانه گرد گام ۵ میلیمتر HTD-5M', sub: 'تسمه تایمینگ صنعتی', en: 'Timing Belt Pitch 5mm HTD-5M', brand: 'اس دبلیو آر (SWR)' },
      { name: 'تسمه وی‌بلت کلاسیک روکش‌دار مقطع B صنعتی', sub: 'تسمه V-Belt ساده و دنده‌ای', en: 'Classical Wrapped V-Belt Profile B', brand: 'فورزا (FORZA)' },
      { name: 'تسمه تخت انتقال نیرو چندلایه پلی‌آمید و چرم', sub: 'تسمه پلی‌یورتان روکش‌دار', en: 'Flat Transmission Belt Polyamide Core', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'تسمه کانوایر مدولار با روکش گریپ پترن ضدلغزش', sub: 'تسمه روکش‌دار ضدسایش Linatex', en: 'Grip Pattern Anti-Slip Conveyor Belt', brand: 'بازرگانی تسمه اطلس (ATLAS)' }
    ]
  },
  {
    slug: 'ceramic-tiles',
    name: 'قطعات خطوط کاشی و سرامیک',
    ranges: [[91, 150], [457, 516]],
    subcategories: [
      'غلتک‌های سرامیکی و فلزی کوره',
      'تسمه‌های خط لعاب و چاپ',
      'قطعات ونتوری و نازل اسپری‌درایر',
      'تسمه‌های رولر ضد حرارت',
      'سنگ‌های ساب و پولیش'
    ],
    items: [
      { name: 'غلتک سرامیکی کوره رولری پخت سریع مدل AT-Roller', sub: 'غلتک‌های سرامیکی و فلزی کوره', en: 'High Alumina Kiln Ceramic Roller', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'غلتک نسوز پرسلان با تحمل دمای ۱۳۰۰ درجه', sub: 'غلتک‌های سرامیکی و فلزی کوره', en: 'Super Refractory Porcelain Roller', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'تسمه خط لعاب و دکوراسیون با روکش نسوز سیلیکونی', sub: 'تسمه‌های خط لعاب و چاپ', en: 'Glaze Line Heat Proof Belt', brand: 'اس دبلیو آر (SWR)' },
      { name: 'تسمه هدایت کاشی خط سورت و بسته‌بندی ضدضربه', sub: 'تسمه‌های رولر ضد حرارت', en: 'Sorting Line Shock Absorbing Belt', brand: 'فورزا (FORZA)' },
      { name: 'نازل اسپری درایر کاربید تنگستن ضداستهلاک', sub: 'قطعات ونتوری و نازل اسپری‌درایر', en: 'Tungsten Carbide Spray Dryer Nozzle', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'ونتوری سرامیکی مکنده گرد و غبار خط پرس', sub: 'قطعات ونتوری و نازل اسپری‌درایر', en: 'Ceramic Press Suction Venturi', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'سنگ ساب الماسه خط کالیبراسیون و پولیش کاشی', sub: 'سنگ‌های ساب و پولیش', en: 'Diamond Grinding Calibrating Wheel', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'پولی محرک غلطک کوره با لنت نسوز گرافیتی', sub: 'غلتک‌های سرامیکی و فلزی کوره', en: 'Kiln Roller Drive Pulley Graphite', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'پولی سرامیکی ضداصطکاک خطوط چاپ دیجیتال', sub: 'تسمه‌های خط لعاب و چاپ', en: 'Digital Printing Ceramic Guide Pulley', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'تسمه تایمینگ دندانه‌دار پوشش‌دار رولرباکس کاشی', sub: 'تسمه‌های رولر ضد حرارت', en: 'Coated Roller Box Timing Belt', brand: 'فورزا (FORZA)' },
      { name: 'سگمنت پولیش نانو و فیسینگ پرسلان نانو', sub: 'سنگ‌های ساب و پولیش', en: 'Nano Porcelain Polishing Segment', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'تسمه گرد پلی‌یورتان جوش‌پذیر خط انتقال تایل', sub: 'تسمه‌های خط لعاب و چاپ', en: 'Round PU Welding Belt for Tiles', brand: 'بازرگانی تسمه اطلس (ATLAS)' }
    ]
  },
  {
    slug: 'pulleys-idlers',
    name: 'پولی و فولی‌های صنعتی',
    ranges: [[151, 200], [517, 574]],
    subcategories: [
      'فولی‌های شیاردار V-Belt',
      'فولی‌های تایمینگ دنده‌ای',
      'بوش مخروطی Taper Lock',
      'پولی‌های آلومینیومی دور بالا',
      'غلتک‌ها و هرزگردهای راهنما'
    ],
    items: [
      { name: 'فولی شیاردار چدنی دو کاناله مدل SPB-200', sub: 'فولی‌های شیاردار V-Belt', en: 'Cast Iron Double Groove Pulley SPB-200', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'فولی تایمینگ آلومینیومی دندانه گرد 8M با لبه راهنما', sub: 'فولی‌های تایمینگ دنده‌ای', en: 'Aluminum Timing Pulley 8M with Flanges', brand: 'اس دبلیو آر (SWR)' },
      { name: 'بوش مخروطی قفل‌کن تیپر لاک مدل Taper Lock 2012', sub: 'بوش مخروطی Taper Lock', en: 'Taper Lock Bushing 2012', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'پولی هرزگرد بلبرینگ‌دار بلت خط تولید کارخانجات', sub: 'غلتک‌ها و هرزگردهای راهنما', en: 'Ball Bearing Idler Pulley Heavy', brand: 'فورزا (FORZA)' },
      { name: 'فولی سه شیار مقطع SPA مخصوص الکتروموتور سنگین', sub: 'فولی‌های شیاردار V-Belt', en: 'Triple Groove Pulley SPA for Motor', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'فولی تایمینگ فولادی HTD-14M با سوراخ شفت استاندارد', sub: 'فولی‌های تایمینگ دنده‌ای', en: 'Steel Timing Pulley 14M Bored', brand: 'اس دبلیو آر (SWR)' },
      { name: 'غلتک راهنمای محدب کانوایرهای صنعتی فولادی', sub: 'غلتک‌ها و هرزگردهای راهنما', en: 'Convex Steel Conveyor Guide Roller', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'بوش قفل‌کن تیپر لاک مدل ۱۶۱۰ ناف‌دار', sub: 'بوش مخروطی Taper Lock', en: 'Taper Lock Bushing 1610 with Keyway', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'پولی تایمینگ دندانه ذوزنقه‌ای آلومینیومی T10', sub: 'پولی‌های آلومینیومی دور بالا', en: 'Aluminum Timing Pulley T10 Profile', brand: 'اس دبلیو آر (SWR)' },
      { name: 'فولی چهار شیار مقطع SPC چدنی بالانس دینامیکی', sub: 'فولی‌های شیاردار V-Belt', en: '4-Groove Pulley SPC Dynamically Balanced', brand: 'بازرگانی تسمه اطلس (ATLAS)' }
    ]
  },
  {
    slug: 'bearings-bushings',
    name: 'بلبرینگ، یاتاقان و بوش',
    ranges: [[201, 250], [575, 632]],
    subcategories: [
      'بلبرینگ‌های شیار عمیق دور بالا',
      'یاتاقان‌های هوزینگ‌دار UCP و UCF',
      'بوش‌های برنجی و گرافیتی خود‌روانکار',
      'رولبرینگ‌های مخروطی و سوزنی',
      'کاسه‌نمدهای نسوز و ضدغبار'
    ],
    items: [
      { name: 'بلبرینگ شیار عمیق صنعتی با کاسه نمد فلزی 2Z', sub: 'بلبرینگ‌های شیار عمیق دور بالا', en: 'Deep Groove Ball Bearing 2Z Shielded', brand: 'اس‌کی‌اف (SKF)' },
      { name: 'یاتاقان پایه‌دار هوزینگ چدنی صنعتی مدل UCP-208', sub: 'یاتاقان‌های هوزینگ‌دار UCP و UCF', en: 'Pillow Block Bearing Unit UCP-208', brand: 'اف‌ای‌جی (FAG)' },
      { name: 'یاتاقان فلنچی چهارپیچ چدنی مدل UCF-210', sub: 'یاتاقان‌های هوزینگ‌دار UCP و UCF', en: 'Flange Bearing Unit 4-Bolt UCF-210', brand: 'اف‌ای‌جی (FAG)' },
      { name: 'بوش برنجی فسفربرنز خود‌روانکار با گرافیت نسوز', sub: 'بوش‌های برنجی و گرافیتی خود‌روانکار', en: 'Graphite Impregnated Bronze Bushing', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'رولبرینگ سوزنی دقیق بدون حلقه داخلی مدل HK', sub: 'رولبرینگ‌های مخروطی و سوزنی', en: 'Drawn Cup Needle Roller Bearing HK', brand: 'اینا (INA)' },
      { name: 'کاسه نمد صنعتی سیلیکونی وایتون دو لبه نسوز', sub: 'کاسه‌نمدهای نسوز و ضدغبار', en: 'Viton Double Lip Rotary Oil Seal', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'بلبرینگ تماس زاویه‌ای دور بالا مدل 7210 BECBP', sub: 'بلبرینگ‌های شیار عمیق دور بالا', en: 'Angular Contact Ball Bearing 7210', brand: 'اس‌کی‌اف (SKF)' },
      { name: 'یاتاقان بیضی دوپیچ مدل UCFL-206 چدن نشکن', sub: 'یاتاقان‌های هوزینگ‌دار UCP و UCF', en: '2-Bolt Flange Bearing Unit UCFL-206', brand: 'ان‌اس‌کی (NSK)' },
      { name: 'رولبرینگ مخروطی سنگین سری ۳۲۲۱۰ خطوط پرس', sub: 'رولبرینگ‌های مخروطی و سوزنی', en: 'Tapered Roller Bearing 32210 Heavy', brand: 'اف‌ای‌جی (FAG)' },
      { name: 'کاسه نمد فلزی ضدحرارت و گرد و غبار کوره', sub: 'کاسه‌نمدهای نسوز و ضدغبار', en: 'High Temperature Metal Cased Oil Seal', brand: 'بازرگانی تسمه اطلس (ATLAS)' }
    ]
  },
  {
    slug: 'chains-sprockets',
    name: 'زنجیر و چرخ‌دنده اسپراکت',
    ranges: [[251, 285], [633, 697]],
    subcategories: [
      'زنجیرهای غلتکی صنعتی تک ردیفه',
      'زنجیرهای دوبل و سه‌ردیفه سنگین',
      'چرخ‌دنده اسپراکت ساده و ناف‌دار',
      'زنجیرهای شاخک‌دار کانوایر و انتقال',
      'قفل و نیم‌پین اتصال زنجیر صنعتی'
    ],
    items: [
      { name: 'زنجیر صنعتی غلتکی تک ردیفه گرید ۸۰ مطابق DIN', sub: 'زنجیرهای غلتکی صنعتی تک ردیفه', en: 'Single Roller Chain ISO 16B-1', brand: 'دانگ‌هوا (Donghua)' },
      { name: 'زنجیر دوبل صنعتی سنگین مدل 10B-2 سخت‌کاری‌شده', sub: 'زنجیرهای دوبل و سه‌ردیفه سنگین', en: 'Double Strand Roller Chain 10B-2', brand: 'دانگ‌هوا (Donghua)' },
      { name: 'چرخ‌دنده اسپراکت تک ردیفه ناف‌دار چدنی با جای خار', sub: 'چرخ‌دنده اسپراکت ساده و ناف‌دار', en: 'Pilot Bore Simplex Sprocket with Hub', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'اسپراکت دوبل صنعتی فولادی ضدسایش کانوایر', sub: 'چرخ‌دنده اسپراکت ساده و ناف‌دار', en: 'Duplex Steel Sprocket Heat Treated', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'زنجیر شاخک‌دار خطوط انتقال و جابجایی کارتن', sub: 'زنجیرهای شاخک‌دار کانوایر و انتقال', en: 'Attachment Conveyor Roller Chain', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'قفل اتصال زنجیر صنعتی (کلمپ اتصال گالوانیزه)', sub: 'قفل و نیم‌پین اتصال زنجیر صنعتی', en: 'Roller Chain Connecting Link', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'نیم‌پین اتصال زنجیر صنعتی استیل مدل Offset Link', sub: 'قفل و نیم‌پین اتصال زنجیر صنعتی', en: 'Stainless Steel Offset Half Link', brand: 'رنولد (Renold)' },
      { name: 'زنجیر کانوایر تیبل‌تاپ پلاستیکی خطوط شستشو و چاپ', sub: 'زنجیرهای شاخک‌دار کانوایر و انتقال', en: 'Plastic Table Top Conveyor Chain', brand: 'تسوباکی (Tsubaki)' },
      { name: 'چرخ‌دنده اسپراکت سه‌ردیفه فولادی مدل 12B-3', sub: 'چرخ‌دنده اسپراکت ساده و ناف‌دار', en: 'Triplex Steel Roller Chain Sprocket', brand: 'ایویس (IWIS)' }
    ]
  },
  {
    slug: 'textile-machinery',
    name: 'قطعات صنعت نساجی',
    ranges: [[286, 318], [698, 764]],
    subcategories: [
      'تسمه دوطرفه اسپیندل ریسندگی',
      'شانه‌های بافندگی فولادی و پرزگیر',
      'غلتک‌های کشش و فرم‌دهی',
      'قطعات چسب آپارات و نگهداری تسمه'
    ],
    items: [
      { name: 'تسمه تخت اسپیندل دوطرفه ضدالکتریسیته ساکن هابازیت', sub: 'تسمه دوطرفه اسپیندل ریسندگی', en: 'Habasit Antistatic Spindle Tape', brand: 'هابازیت (Habasit)' },
      { name: 'تسمه کشش خط بافندگی تار و پود پلی‌آمید', sub: 'تسمه دوطرفه اسپیندل ریسندگی', en: 'Polyamide Driving Belt for Weaving', brand: 'هابازیت (Habasit)' },
      { name: 'شانه بافندگی فولادی ضدزنگ نساجی با سختی بالا', sub: 'شانه‌های بافندگی فولادی و پرزگیر', en: 'Stainless Steel Weaving Machine Reed', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'غلتک کشش لاستیکی روکش نیتریل ضدحرارت نساجی', sub: 'غلتک‌های کشش و فرم‌دهی', en: 'Nitrile Coated Drafting Roller', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'تیغه و پرزگیر برش نخ ماشین‌آلات گردباف', sub: 'شانه‌های بافندگی فولادی و پرزگیر', en: 'Textile Yarn Cutting Blade & Picker', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'چسب آپارات سرد تسمه SC 2000 برند رما تیپ‌تاپ آلمان', sub: 'قطعات چسب آپارات و نگهداری تسمه', en: 'REMA TIP TOP Cement SC 2000', brand: 'رما تیپ‌تاپ (REMA TIP TOP)' },
      { name: 'محلول پرایمر اتصال گرم و سرد لاستیک به فلز PR 300', sub: 'قطعات چسب آپارات و نگهداری تسمه', en: 'Metal Primer PR 300 for Rubber Bonding', brand: 'رما تیپ‌تاپ (REMA TIP TOP)' },
      { name: 'اسپری ضدسایش و ضادلغزش تسمه صنعتی اطلس پاور', sub: 'قطعات چسب آپارات و نگهداری تسمه', en: 'Belt Dressing Anti-Slip Industrial Spray', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'لامل فولادی ضدزنگ حسگر پارگی نخ دستگاه بافندگی', sub: 'شانه‌های بافندگی فولادی و پرزگیر', en: 'Stainless Steel Drop Wire / Lamel', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'تسمه انتقال نیروی رینگ ریسندگی پلی‌وینیل کلراید', sub: 'تسمه دوطرفه اسپیندل ریسندگی', en: 'Ring Spinning Power Belt PVC', brand: 'زیگرلینگ (Siegling / Forbo)' }
    ]
  },
  {
    slug: 'swr-forza-exclusive',
    name: 'محصولات انحصاری SWR و FORZA',
    ranges: [[765, 864]],
    subcategories: [
      'تسمه‌های تخصصی SWR اروپایی',
      'تسمه و اتصالات فورزا (FORZA)',
      'تسمه‌های حرارتی و سیلیکونی کوره',
      'روکش‌های ضدسایش سفارشی خطوط',
      'کیت‌های بهینه‌سازی انتقال قدرت SWR'
    ],
    items: [
      { name: 'تسمه تایمینگ سنگین SWR آلمان مقطع HTD-14M', sub: 'تسمه‌های تخصصی SWR اروپایی', en: 'SWR Heavy Duty Timing Belt HTD-14M', brand: 'اس دبلیو آر (SWR)' },
      { name: 'تسمه وی‌بلت دنده‌ای سوپر پاور فورزا مدل SPA', sub: 'تسمه و اتصالات فورزا (FORZA)', en: 'FORZA Super Power Cogged V-Belt SPA', brand: 'فورزا (FORZA)' },
      { name: 'تسمه کانوایر ضدحرارت سیلیکونی با روکش نسوز SWR', sub: 'تسمه‌های حرارتی و سیلیکونی کوره', en: 'SWR Heat Resistant Silicone Conveyor Belt', brand: 'اس دبلیو آر (SWR)' },
      { name: 'تسمه شیاردار دور بالا مقاوم به سایش فورزا مدل PK', sub: 'تسمه و اتصالات فورزا (FORZA)', en: 'FORZA High Speed Multi-Ribbed Belt PK', brand: 'فورزا (FORZA)' },
      { name: 'تسمه روکش‌دار ضدسایش مخصوص خطوط کاشی و شیشه', sub: 'روکش‌های ضدسایش سفارشی خطوط', en: 'High Abrasion Resistant Coated Belt', brand: 'بازرگانی تسمه اطلس (ATLAS)' },
      { name: 'تسمه وی‌بلت سنگین هایپاور SWR آلمان مدل SPC-3500', sub: 'تسمه‌های تخصصی SWR اروپایی', en: 'SWR High Power Heavy V-Belt SPC-3500', brand: 'اس دبلیو آر (SWR)' },
      { name: 'تسمه دور متغیر تقویت‌شده کولار فورزا ایتالیا', sub: 'تسمه و اتصالات فورزا (FORZA)', en: 'FORZA Kevlar Reinforced Variable Speed Belt', brand: 'فورزا (FORZA)' },
      { name: 'کیت تخصصی بهینه‌سازی تسمه و فولی دینامیک SWR', sub: 'کیت‌های بهینه‌سازی انتقال قدرت SWR', en: 'SWR Transmission Optimization Drive Kit', brand: 'اس دبلیو آر (SWR)' },
      { name: 'تسمه تایمینگ دوطرفه دندانه‌سخت ضدروغن FORZA D8M', sub: 'تسمه و اتصالات فورزا (FORZA)', en: 'FORZA Oil Resistant Double Sided D8M', brand: 'فورزا (FORZA)' },
      { name: 'تسمه سیلیکونی مقاوم به اشعه فرابنفش و ازون SWR', sub: 'تسمه‌های حرارتی و سیلیکونی کوره', en: 'SWR Ozone & UV Resistant Silicone Belt', brand: 'اس دبلیو آر (SWR)' }
    ]
  }
];

// Helper to find domain for a given product number
function findDomainForNum(num) {
  for (const domain of DOMAINS_CONFIG) {
    for (const [start, end] of domain.ranges) {
      if (num >= start && num <= end) {
        return domain;
      }
    }
  }
  return DOMAINS_CONFIG[num % DOMAINS_CONFIG.length];
}

const allProducts = [];

for (let num = 1; num <= 864; num++) {
  const numStr = num.toString().padStart(3, '0');
  const cleanCode = `AT-E${numStr}`;
  const filename = num < 100 ? `e(${numStr}).png` : `e(${num}).png`;
  const domain = findDomainForNum(num);
  const isFeatured = num === 1 || num === 45 || num === 95 || num === 155 || num === 205 || num === 255 || num === 290 || num === 770 || num === 820 || (num % 25 === 0);

  // If we have verified AI analysis for this image (e.g. from the original 318 catalogue)
  if (aiAnalyzed[filename]) {
    const a = aiAnalyzed[filename];
    const catSlug = (a.categorySlug && a.categorySlug !== 'industrial-parts') ? a.categorySlug : domain.slug;
    const catName = (a.categorySlug && a.categorySlug !== 'industrial-parts') ? a.categoryName : domain.name;
    const subcat = (a.subcategory && domain.subcategories.includes(a.subcategory)) ? a.subcategory : domain.subcategories[num % domain.subcategories.length];

    allProducts.push({
      code: cleanCode,
      name: a.name,
      nameEn: a.nameEn || `Atlas Industrial Part E${numStr}`,
      brand: a.brand || 'بازرگانی تسمه اطلس (ATLAS)',
      categorySlug: catSlug,
      categoryName: catName,
      subcategory: subcat,
      description: a.description || `قطعه صنعتی استاندارد کد فنی ${cleanCode} مورد استفاده در خطوط تولید و کارخانجات صنعتی با کیفیت و دوام بالا.`,
      technicalSpecs: a.technicalSpecs || [
        { key: 'کد فنی محصول', value: cleanCode },
        { key: 'سازنده / برند', value: a.brand || 'بازرگانی تسمه اطلس' },
        { key: 'دسته‌بندی تخصصی', value: catName },
        { key: 'استاندارد کیفی', value: 'DIN / ISO صنعتی اروپا' },
        { key: 'گارانتی اصالت', value: 'ضمانت سلامت فیزیکی و اصالت رسمی کالا' }
      ],
      prices: {
        base: a.basePrice || (350000 + (num % 25) * 45000),
        retail: Math.round((a.basePrice || (350000 + (num % 25) * 45000)) * 1.3),
        wholesale: Math.round((a.basePrice || (350000 + (num % 25) * 45000)) * 1.15),
        dealer: Math.round((a.basePrice || (350000 + (num % 25) * 45000)) * 1.05)
      },
      stock: a.stock || (15 + (num % 45)),
      inquiryOnly: !!a.inquiryOnly,
      tags: a.tags && a.tags.length > 0 ? a.tags : [catName, subcat, a.brand || 'اطلس', 'قطعات صنعتی', 'خطوط تولید'],
      images: [filename],
      unit: a.unit || 'عدد',
      rating: +(4.6 + (num % 5) * 0.08).toFixed(2),
      reviewCount: 3 + (num % 18),
      cataloguePage: Math.ceil(num / 8),
      featured: isFeatured
    });
    continue;
  }

  // Generate structured industrial product from domain blueprint
  const itemBlueprint = domain.items[(num - 1) % domain.items.length];
  const subcat = itemBlueprint.sub || domain.subcategories[(num - 1) % domain.subcategories.length];

  const basePrice = 320000 + (num % 40) * 55000;
  const retailPrice = Math.round(basePrice * 1.32);
  const wholesalePrice = Math.round(basePrice * 1.15);
  const dealerPrice = Math.round(basePrice * 1.05);

  const materialDesc =
    domain.slug === 'power-transmission' ? 'پلی‌یورتان PU / رابر NBR ضدسایش و چدن نشکن' :
    domain.slug === 'industrial-belts' ? 'کائوچو سنتتیک نسوز، نخ کورد فایبرگلاس سوپر' :
    domain.slug === 'ceramic-tiles' ? 'سرامیک آلومینا ۹۵٪ نسوز / کاربید تنگستن' :
    domain.slug === 'pulleys-idlers' ? 'آلیاژ آلومینیوم سخت / چدن داکتیل بالانس‌شده' :
    domain.slug === 'bearings-bushings' ? 'فولاد کروم ۱۰۰Cr6 سخت‌کاری‌شده، کاسه نمد وایتون' :
    domain.slug === 'chains-sprockets' ? 'فولاد آلیاژی سخت‌کاری سطحی، گرید ۸۰ صنعتی' :
    domain.slug === 'textile-machinery' ? 'پلی‌آمید مهندسی، فولاد ضدزنگ نساجی' :
    'نئوپرن سوپر هایپاور با نخ کورد آرامید و روکش سیلیکون';

  const specs = [
    { key: 'کد فنی قطعه', value: cleanCode },
    { key: 'سازنده / برند', value: itemBlueprint.brand },
    { key: 'دسته‌بندی تخصصی', value: domain.name },
    { key: 'زیردسته عملکردی', value: subcat },
    { key: 'متریال قطعه', value: materialDesc },
    { key: 'استاندارد مرجع', value: 'مطابق استانداردهای DIN / ISO صنعتی اروپا' },
    { key: 'گارانتی اصالت', value: 'ضمانت سلامت فیزیکی و اصالت کالا هایپر صنعت یزد' }
  ];

  allProducts.push({
    code: cleanCode,
    name: `${itemBlueprint.name} کد ${numStr}`,
    nameEn: `${itemBlueprint.en} E${numStr}`,
    brand: itemBlueprint.brand,
    categorySlug: domain.slug,
    categoryName: domain.name,
    subcategory: subcat,
    description: `این قطعه صنعتی با کد فنی ${cleanCode} مطابق استانداردهای خطوط تولید و کارخانجات صنعتی توسط ${itemBlueprint.brand} عرضه گردیده است. دارای دوام مکانیکی بالا، مقاومت به سایش و تنش‌های دینامیکی دور بالا در سیستم‌های انتقال قدرت و ماشین‌آلات پیوسته.`,
    technicalSpecs: specs,
    prices: {
      base: basePrice,
      retail: retailPrice,
      wholesale: wholesalePrice,
      dealer: dealerPrice
    },
    stock: 12 + (num % 60),
    inquiryOnly: num % 15 === 0,
    tags: [domain.name, subcat, itemBlueprint.brand, 'قطعات خط تولید', 'تسمه اطلس'],
    images: [filename],
    unit: domain.slug === 'industrial-belts' ? 'حلقه' : domain.slug === 'chains-sprockets' ? 'شاخه' : 'عدد',
    rating: +(4.65 + (num % 5) * 0.07).toFixed(2),
    reviewCount: 4 + (num % 25),
    cataloguePage: Math.ceil(num / 8),
    featured: isFeatured
  });
}

console.log(`Generated exactly ${allProducts.length} rich product profiles.`);

// Verify category counts
const categoryCounts = {};
allProducts.forEach(p => {
  categoryCounts[p.categorySlug] = (categoryCounts[p.categorySlug] || 0) + 1;
});
console.log('Category Counts:', categoryCounts);

// Generate the TypeScript file src/data/userProducts.ts
const tsContent = `// Auto-generated catalogue containing all ${allProducts.length} products from src/assets/imagesproducts
import { Product } from '../types';
import { getProductImageUrl } from '../assets/imagesproducts';

export const USER_PRODUCTS_RAW = ${JSON.stringify(allProducts, null, 2)};

export const USER_PRODUCTS: Product[] = USER_PRODUCTS_RAW.map(p => ({
  ...p,
  images: p.images.map((img: string) => getProductImageUrl(img))
}));

export const USER_PRODUCTS_BY_CODE = new Map<string, Product>(
  USER_PRODUCTS.map(p => [p.code.toLowerCase(), p])
);

export const USER_PRODUCTS_BY_CATEGORY = new Map<string, Product[]>();
USER_PRODUCTS.forEach(p => {
  const existing = USER_PRODUCTS_BY_CATEGORY.get(p.categorySlug) || [];
  existing.push(p);
  USER_PRODUCTS_BY_CATEGORY.set(p.categorySlug, existing);
});
`;

fs.writeFileSync(path.join('src', 'data', 'userProducts.ts'), tsContent, 'utf8');
console.log('Successfully wrote src/data/userProducts.ts!');
