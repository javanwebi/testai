// Utility functions for Persian digits, currency formatting, and industrial SVG placeholders

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(input: number | string | undefined | null): string {
  if (input === undefined || input === null) return '';
  const str = input.toString();
  return str.replace(/\d/g, (digit) => PERSIAN_DIGITS[parseInt(digit, 10)]);
}

export function formatPrice(amount: number, showUnit: boolean = true): string {
  if (!amount || amount <= 0) return 'استعلام قیمت';
  const formatted = new Intl.NumberFormat('fa-IR').format(amount);
  return showUnit ? `${formatted} تومان` : formatted;
}

export function getStockStatus(stock: number) {
  if (stock <= 0) {
    return {
      text: 'ناموجود در انبار مرکزی',
      colorClass: 'text-[#DC2626] bg-red-50 border-red-200',
      badgeBg: '#DC2626',
      status: 'out_of_stock' as const,
    };
  }
  if (stock <= 5) {
    return {
      text: `تنها ${toPersianDigits(stock)} عدد باقی‌مانده`,
      colorClass: 'text-[#F59E0B] bg-amber-50 border-amber-200',
      badgeBg: '#F59E0B',
      status: 'low' as const,
    };
  }
  return {
    text: `موجود در انبار (${toPersianDigits(stock)} موجود)`,
    colorClass: 'text-[#16A34A] bg-emerald-50 border-emerald-200',
    badgeBg: '#16A34A',
    status: 'in_stock' as const,
  };
}

/**
 * Generates an ultra-optimized lightweight industrial SVG matching the exact catalogue illustration, colors, and FORZACODE badges
 */
export function generateProductSvg(
  code: string,
  subcategory: string,
  brand: string,
  variant: 'main' | 'spec' | 'cert' = 'main',
  badgeText?: string,
  forzaCode?: string,
  cataloguePage?: number
): string {
  const isSWR = brand.includes('SWR');
  const isFORZA = brand.includes('FORZA');
  const displayForzaCode = forzaCode || (code.startsWith('1000') ? `FORZACODE : ${code.replace(/-/g, ' ')}` : code);
  const pageLabel = cataloguePage ? `PAGE ${cataloguePage}` : 'CATALOGUE 2025.26';

  const cleanId = `${code.replace(/[^a-zA-Z0-9]/g, '_')}_${variant}`;

  // Blueprint / Spec variant
  if (variant === 'spec') {
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
  <defs>
    <pattern id="cad_grid_${cleanId}" width="15" height="15" patternUnits="userSpaceOnUse">
      <path d="M 15 0 L 0 0 0 15" fill="none" stroke="#0284C7" stroke-width="0.5" stroke-opacity="0.25" />
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="#0B192C" />
  <rect width="100%" height="100%" fill="url(#cad_grid_${cleanId})" />

  <!-- Technical drawing frame -->
  <rect x="15" y="15" width="370" height="270" fill="none" stroke="#0284C7" stroke-width="1.5" stroke-opacity="0.6" />
  
  <g transform="translate(200, 140)">
    <circle r="65" fill="none" stroke="#38BDF8" stroke-width="2" stroke-dasharray="6,4" />
    <circle r="45" fill="#0E2442" stroke="#38BDF8" stroke-width="2" />
    <circle r="22" fill="#0B192C" stroke="#E06518" stroke-width="2.5" />
    
    <!-- Crosshairs -->
    <line x1="-85" y1="0" x2="85" y2="0" stroke="#38BDF8" stroke-width="1" stroke-dasharray="4,2" opacity="0.8" />
    <line x1="0" y1="-85" x2="0" y2="85" stroke="#38BDF8" stroke-width="1" stroke-dasharray="4,2" opacity="0.8" />
    
    <!-- Dimension arrows -->
    <line x1="-65" y1="-75" x2="65" y2="-75" stroke="#E06518" stroke-width="1.5" />
    <path d="M-65 -78 L-72 -75 L-65 -72 Z" fill="#E06518" />
    <path d="M65 -78 L72 -75 L65 -72 Z" fill="#E06518" />
    <text x="0" y="-82" fill="#E06518" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">DIN / ISO SPEC</text>
  </g>

  <!-- Spec Tag -->
  <rect x="25" y="25" width="150" height="24" rx="4" fill="#0284C7" fill-opacity="0.3" stroke="#38BDF8" stroke-width="1" />
  <text x="100" y="41" fill="#E0F2FE" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">نقشه فنی ابعادی و تلورانس</text>

  <rect x="15" y="252" width="370" height="33" fill="#071220" />
  <text x="25" y="273" fill="#38BDF8" font-family="monospace" font-size="12" font-weight="bold">${displayForzaCode}</text>
  <text x="370" y="273" fill="#94A3B8" font-family="sans-serif" font-size="10" text-anchor="end">ATLASS TRADING TECHNICAL ARCHIVE</text>
</svg>`.trim();
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  // Cert / QC variant
  if (variant === 'cert') {
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#DEE2E5" />
  <rect x="15" y="15" width="370" height="270" rx="8" fill="#FFFFFF" stroke="#CBD2D8" stroke-width="2" />
  
  <g transform="translate(200, 135)">
    <circle r="60" fill="#F0FDF4" stroke="#16A34A" stroke-width="3" />
    <circle r="50" fill="none" stroke="#16A34A" stroke-width="1" stroke-dasharray="4,4" />
    <path d="M-18 -4 L-6 12 L22 -16" fill="none" stroke="#16A34A" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
    <text x="0" y="32" fill="#15803D" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">کنترل کیفیت تأیید شد</text>
  </g>

  <rect x="15" y="250" width="370" height="35" fill="#55565A" rx="0 0 8 8" />
  <text x="200" y="272" fill="#FFFFFF" font-family="monospace" font-size="13" font-weight="bold" text-anchor="middle">${displayForzaCode} • 100% QC PASS</text>
</svg>`.trim();
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  // Main visual illustration depending on catalogue product type
  let illustration = '';
  const s = subcategory.toLowerCase();
  const c = code.toLowerCase();
  const fc = (forzaCode || '').toLowerCase();

  if (s.includes('v-belt') || c.includes('1000-0') || fc.includes('1000 0') || s.includes('انتقال قدرت')) {
    // Coiled V-Belts with trapezoid profile & brand imprint
    illustration = `
      <ellipse cx="200" cy="140" rx="105" ry="48" fill="none" stroke="#1E293B" stroke-width="16" />
      <ellipse cx="200" cy="140" rx="105" ry="48" fill="none" stroke="#12203C" stroke-width="14" />
      <ellipse cx="198" cy="138" rx="88" ry="40" fill="none" stroke="#334155" stroke-width="14" />
      <ellipse cx="198" cy="138" rx="88" ry="40" fill="none" stroke="#1E293B" stroke-width="12" />
      <ellipse cx="196" cy="136" rx="72" ry="32" fill="none" stroke="#475569" stroke-width="12" />
      <ellipse cx="196" cy="136" rx="72" ry="32" fill="none" stroke="#12203C" stroke-width="10" />
      
      <!-- Brand imprint on belt -->
      <g transform="translate(145, 178) rotate(-5)">
        <rect x="0" y="0" width="110" height="15" rx="3" fill="#F59E0B" fill-opacity="0.9" />
        <text x="55" y="11" fill="#000000" font-family="sans-serif" font-size="9" font-weight="900" text-anchor="middle" letter-spacing="1">${isSWR ? 'SWR GERMANY' : 'FORZA HIGH-POWER'}</text>
      </g>
      
      <!-- Belt profile diagram thumbnail -->
      <g transform="translate(50, 85)">
        <polygon points="0,0 36,0 28,26 8,26" fill="#1E293B" stroke="#F59E0B" stroke-width="1.5" />
        <line x1="8" y1="8" x2="28" y2="8" stroke="#EF4444" stroke-width="2" stroke-dasharray="3,1" />
        <text x="18" y="38" fill="#777A7D" font-family="monospace" font-size="8" font-weight="bold" text-anchor="middle">V-PROFILE</text>
      </g>
    `;
  } else if (s.includes('تایم') || c.includes('timing') || c.includes('htd') || c.includes('t10')) {
    // Timing Belt with precision molded teeth & green/red lining
    illustration = `
      <g transform="translate(200, 140)">
        <!-- Outer loop -->
        <ellipse cx="0" cy="0" rx="95" ry="50" fill="none" stroke="#12203C" stroke-width="18" />
        <!-- Green NFT fabric layer -->
        <ellipse cx="0" cy="0" rx="87" ry="42" fill="none" stroke="#16A34A" stroke-width="3" />
        
        <!-- Curvilinear teeth -->
        <g fill="#12203C" stroke="#16A34A" stroke-width="0.75">
          ${[-70, -50, -30, -10, 10, 30, 50, 70].map(x => `<rect x="${x-5}" y="36" width="10" height="7" rx="2" />`).join('')}
          ${[-70, -50, -30, -10, 10, 30, 50, 70].map(x => `<rect x="${x-5}" y="-43" width="10" height="7" rx="2" />`).join('')}
        </g>
        
        <!-- Central label -->
        <rect x="-60" y="-12" width="120" height="24" rx="4" fill="#1E293B" stroke="#38BDF8" stroke-width="1" />
        <text x="0" y="4" fill="#38BDF8" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">HTD SYNCHRONOUS</text>
      </g>
    `;
  } else if (s.includes('جوشی') || c.includes('1000-49') || fc.includes('1000 49')) {
    // Welded green TPU belts with cogs / red grip
    illustration = `
      <g transform="translate(200, 140)">
        <ellipse cx="0" cy="0" rx="100" ry="46" fill="none" stroke="#15803D" stroke-width="16" />
        <ellipse cx="0" cy="0" rx="100" ry="46" fill="none" stroke="#22C55E" stroke-width="12" />
        <!-- Red supergrip top -->
        <ellipse cx="0" cy="-6" rx="98" ry="44" fill="none" stroke="#DC2626" stroke-width="4" stroke-dasharray="6,3" />
        
        <ellipse cx="-8" cy="-5" rx="75" ry="34" fill="none" stroke="#16A34A" stroke-width="14" />
        <ellipse cx="-8" cy="-5" rx="75" ry="34" fill="none" stroke="#4ADE80" stroke-width="10" />

        <rect x="-55" y="-10" width="110" height="20" rx="4" fill="#55565A" opacity="0.9" />
        <text x="0" y="4" fill="#4ADE80" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle">PU WELDABLE 85A</text>
      </g>
    `;
  } else if (s.includes('پولی تفلون') || c.includes('1000-9') || fc.includes('1000 9')) {
    // Teflon Pulley with bearing and orange/yellow flange
    const isYellow = c.includes('9-4') || c.includes('9-5') || c.includes('9-23');
    const isWhite = c.includes('9-6') || c.includes('9-7') || c.includes('9-9');
    const pulColor = isYellow ? '#EAB308' : isWhite ? '#CBD2D8' : '#E06518';
    const darkPulColor = isYellow ? '#CA8A04' : isWhite ? '#94A3B8' : '#C95210';
    illustration = `
      <g transform="translate(200, 135)">
        <!-- Outer flange -->
        <circle r="72" fill="${darkPulColor}" />
        <circle r="68" fill="${pulColor}" stroke="#FFFFFF" stroke-width="2" />
        <!-- Radial spokes / pockets -->
        <circle r="52" fill="none" stroke="${darkPulColor}" stroke-width="3" stroke-dasharray="16,8" />
        <circle r="42" fill="${pulColor}" />
        
        <!-- Central steel bearing (6000 / 6201) -->
        <circle r="30" fill="#CBD2D8" stroke="#475569" stroke-width="3" />
        <!-- Bearing rubber seal (red/orange) -->
        <circle r="23" fill="#DC2626" stroke="#991B1B" stroke-width="1.5" />
        <!-- Inner steel ring & bore -->
        <circle r="14" fill="#94A3B8" stroke="#334155" stroke-width="2" />
        <circle r="8" fill="#1E293B" />
      </g>
    `;
  } else if (s.includes('استکر') || c.includes('1000-19') || fc.includes('1000 19')) {
    // Staker spiral damping rubber
    const isBlue = c.includes('19-3');
    const isYellow = c.includes('19-1');
    const rubColor = isBlue ? '#2563EB' : isYellow ? '#EAB308' : '#DC2626';
    illustration = `
      <g transform="translate(200, 135)">
        <circle r="65" fill="${rubColor}" stroke="#12203C" stroke-width="3" />
        <circle r="54" fill="#FFFFFF" stroke="${rubColor}" stroke-width="2" />
        
        <!-- 5 curved spiral damping spokes -->
        <path d="M0,0 Q20,-20 38,-38" stroke="${rubColor}" stroke-width="9" stroke-linecap="round" fill="none" />
        <path d="M0,0 Q-20,-20 -38,-38" stroke="${rubColor}" stroke-width="9" stroke-linecap="round" fill="none" />
        <path d="M0,0 Q25,10 48,15" stroke="${rubColor}" stroke-width="9" stroke-linecap="round" fill="none" />
        <path d="M0,0 Q-25,10 -48,15" stroke="${rubColor}" stroke-width="9" stroke-linecap="round" fill="none" />
        <path d="M0,0 Q0,30 0,50" stroke="${rubColor}" stroke-width="9" stroke-linecap="round" fill="none" />

        <circle r="16" fill="${rubColor}" stroke="#FFFFFF" stroke-width="2" />
        <circle r="8" fill="#12203C" />
        <text x="0" y="3" fill="#FFFFFF" font-family="monospace" font-size="7" font-weight="bold" text-anchor="middle">FORZA</text>
      </g>
    `;
  } else if (s.includes('مکنده') || c.includes('1000-20') || fc.includes('1000 20')) {
    // Bellows Suction Cup
    illustration = `
      <g transform="translate(200, 130)">
        <!-- Top aluminum hex connector -->
        <polygon points="-16,-55 16,-55 24,-35 16,-15 -16,-15 -24,-35" fill="#94A3B8" stroke="#475569" stroke-width="2" />
        <circle cx="0" cy="-35" r="7" fill="#334155" />
        
        <!-- Silicone bellows folds -->
        <ellipse cx="0" cy="5" rx="36" ry="14" fill="#DEE2E5" stroke="#94A3B8" stroke-width="2.5" />
        <ellipse cx="0" cy="22" rx="48" ry="16" fill="#DEE2E5" stroke="#94A3B8" stroke-width="2.5" />
        <ellipse cx="0" cy="42" rx="62" ry="18" fill="#FFFFFF" stroke="#777A7D" stroke-width="3" />
        <ellipse cx="0" cy="46" rx="55" ry="12" fill="#CBD2D8" opacity="0.6" />
      </g>
    `;
  } else if (s.includes('پروانه') || c.includes('1000-12') || fc.includes('1000 12')) {
    // Multi-blade Impeller
    illustration = `
      <g transform="translate(200, 135)">
        <circle r="70" fill="none" stroke="#CBD2D8" stroke-dasharray="4,4" />
        <!-- Curved impeller blades -->
        <path d="M0,0 C15,-30 45,-45 65,-40 C45,-25 25,-15 0,0" fill="#FEF08A" stroke="#CA8A04" stroke-width="1.5" />
        <path d="M0,0 C30,15 45,45 40,65 C25,45 15,25 0,0" fill="#FEF08A" stroke="#CA8A04" stroke-width="1.5" />
        <path d="M0,0 C-15,30 -45,45 -65,40 C-45,25 -25,15 0,0" fill="#FEF08A" stroke="#CA8A04" stroke-width="1.5" />
        <path d="M0,0 C-30,-15 -45,-45 -40,-65 C-25,-45 -15,-25 0,0" fill="#FEF08A" stroke="#CA8A04" stroke-width="1.5" />
        
        <!-- Brass center hub -->
        <circle r="18" fill="#D97706" stroke="#92400E" stroke-width="2" />
        <circle r="12" fill="#FBBF24" />
        <circle r="6" fill="#78350F" />
      </g>
    `;
  } else if (s.includes('ضربه گیر') || c.includes('1000-13') || fc.includes('1000 13')) {
    // Bell shaped shock absorber
    illustration = `
      <g transform="translate(200, 135)">
        <!-- Oval 2-bolt flange base -->
        <ellipse cx="0" cy="35" rx="85" ry="18" fill="#CBD2D8" stroke="#475569" stroke-width="2" />
        <circle cx="-62" cy="35" r="7" fill="#1E293B" stroke="#777A7D" stroke-width="1.5" />
        <circle cx="62" cy="35" r="7" fill="#1E293B" stroke="#777A7D" stroke-width="1.5" />
        
        <!-- Rubber elastomeric core -->
        <path d="M-45,35 C-45,15 -35,-10 0,-15 C35,-10 45,15 45,35 Z" fill="#12203C" />
        
        <!-- Gold/Green metallic bell dome -->
        <path d="M-42,20 C-40,-5 -28,-28 0,-32 C28,-28 40,-5 42,20 Z" fill="#EAB308" stroke="#A16207" stroke-width="2" />
        <circle cx="0" cy="-32" r="10" fill="#CA8A04" stroke="#713F12" stroke-width="2" />
      </g>
    `;
  } else if (s.includes('پیچ فلکه‌ای') || c.includes('1000-15') || fc.includes('1000 15')) {
    // Star Knob Capstan Screw
    illustration = `
      <g transform="translate(200, 135)">
        <!-- Threaded zinc stud -->
        <rect x="-8" y="25" width="16" height="55" fill="#94A3B8" stroke="#475569" stroke-width="1.5" />
        ${[35, 45, 55, 65, 75].map(y => `<line x1="-8" y1="${y}" x2="8" y2="${y}" stroke="#777A7D" stroke-width="1.5" />`).join('')}

        <!-- 5-Star bakelite knob head -->
        <circle r="48" fill="#1E293B" stroke="#12203C" stroke-width="3" />
        ${[0, 72, 144, 216, 288].map(deg => `
          <circle cx="${Math.cos(deg * Math.PI / 180) * 38}" cy="${Math.sin(deg * Math.PI / 180) * 38}" r="16" fill="#1E293B" />
        `).join('')}
        
        <!-- Orange center cap -->
        <circle r="22" fill="#E06518" stroke="#C2410C" stroke-width="2.5" />
        <text x="0" y="4" fill="#FFFFFF" font-family="monospace" font-size="8" font-weight="bold" text-anchor="middle">FORZA</text>
      </g>
    `;
  } else if (s.includes('کوپلینگ') || c.includes('1000-39') || fc.includes('1000 39')) {
    // Rotex Coupling with red spider
    illustration = `
      <g transform="translate(200, 135)">
        <!-- Aluminum jaw half -->
        <circle r="65" fill="#CBD2D8" stroke="#777A7D" stroke-width="3" />
        
        <!-- Red 8-petal elastomeric spider -->
        ${[0, 45, 90, 135, 180, 225, 270, 315].map(deg => `
          <g transform="rotate(${deg})">
            <rect x="-8" y="-55" width="16" height="25" rx="6" fill="#DC2626" stroke="#991B1B" stroke-width="1.5" />
          </g>
        `).join('')}
        
        <circle r="30" fill="#DC2626" stroke="#991B1B" stroke-width="2" />
        <circle r="18" fill="#CBD2D8" stroke="#475569" stroke-width="2" />
        <circle r="9" fill="#1E293B" />
      </g>
    `;
  } else if (s.includes('پین سر رولر') || c.includes('pin') || c.includes('39373') || c.includes('90156')) {
    // Precision Roller Drive Pin
    illustration = `
      <g transform="translate(200, 135)">
        <!-- Square drive head (W x h) -->
        <rect x="-18" y="-70" width="36" height="42" rx="2" fill="#CBD2D8" stroke="#334155" stroke-width="2" />
        <!-- Collar flange (2R) -->
        <rect x="-35" y="-28" width="70" height="12" rx="2" fill="#94A3B8" stroke="#1E293B" stroke-width="2" />
        <!-- Stepped cylindrical shank (2r) -->
        <rect x="-22" y="-16" width="44" height="85" fill="#CBD2D8" stroke="#334155" stroke-width="2" />
        
        <!-- Dimensions dimension arrows -->
        <line x1="32" y1="-70" x2="32" y2="-28" stroke="#E06518" stroke-width="1.5" />
        <text x="44" y="-45" fill="#E06518" font-family="monospace" font-size="10" font-weight="bold">h</text>
        
        <line x1="-18" y1="-80" x2="18" y2="-80" stroke="#E06518" stroke-width="1.5" />
        <text x="0" y="-85" fill="#E06518" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle">W</text>
      </g>
    `;
  } else if (s.includes('پروفیل') || c.includes('1000-1') || fc.includes('1000 1')) {
    // Extruded aluminum profile cross section
    illustration = `
      <g transform="translate(200, 135)">
        <rect x="-65" y="-65" width="130" height="130" rx="4" fill="#CBD2D8" stroke="#334155" stroke-width="3" />
        <rect x="-55" y="-55" width="110" height="110" fill="#CBD2D8" />
        
        <!-- Center core hole -->
        <circle r="16" fill="#475569" stroke="#1E293B" stroke-width="2" />
        
        <!-- 4 T-Slots -->
        <rect x="-12" y="-65" width="24" height="24" fill="#475569" />
        <rect x="-12" y="41" width="24" height="24" fill="#475569" />
        <rect x="-65" y="-12" width="24" height="24" fill="#475569" />
        <rect x="41" y="-12" width="24" height="24" fill="#475569" />
      </g>
    `;
  } else if (s.includes('روکش پلی‌یورتان') || c.includes('1000-17') || fc.includes('1000 17')) {
    // Polyurethane coated wheel
    const isRed = c.includes('17-2') || c.includes('17-3') || c.includes('17-16');
    const puColor = isRed ? '#DC2626' : '#F59E0B';
    const puDark = isRed ? '#991B1B' : '#B45309';
    illustration = `
      <g transform="translate(200, 135)">
        <!-- Thick PU tire rim -->
        <circle r="68" fill="${puColor}" stroke="${puDark}" stroke-width="3" />
        <circle r="46" fill="#CBD2D8" stroke="#777A7D" stroke-width="3" />
        
        <!-- Steel hub and bearing -->
        <circle r="30" fill="#94A3B8" stroke="#334155" stroke-width="2" />
        <circle r="18" fill="#1E293B" />
        <circle r="9" fill="#CBD2D8" />
      </g>
    `;
  } else if (s.includes('برس') || c.includes('1000-7') || c.includes('1000-8') || fc.includes('1000 7')) {
    // Rotary brush wheel
    illustration = `
      <g transform="translate(200, 135)">
        <circle r="72" fill="#1E293B" stroke="#12203C" stroke-dasharray="2,2" stroke-width="8" />
        <circle r="64" fill="#334155" />
        ${[0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320, 340].map(deg => `
          <line x1="0" y1="0" x2="${Math.cos(deg*Math.PI/180)*72}" y2="${Math.sin(deg*Math.PI/180)*72}" stroke="#777A7D" stroke-width="2" />
        `).join('')}
        <circle r="32" fill="#CBD2D8" stroke="#475569" stroke-width="2" />
        <circle r="14" fill="#12203C" />
      </g>
    `;
  } else {
    // Universal precision industrial component
    illustration = `
      <g transform="translate(200, 135)">
        <circle r="70" fill="none" stroke="#CBD2D8" stroke-width="2" stroke-dasharray="6,4" />
        <circle r="52" fill="#FFFFFF" stroke="#94A3B8" stroke-width="3" />
        <circle r="36" fill="#55565A" />
        <circle r="16" fill="#DEE2E5" stroke="${isSWR ? '#E06518' : '#2563EB'}" stroke-width="3" />
      </g>
    `;
  }

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
  <defs>
    <linearGradient id="bg_${cleanId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#DEE2E5" />
    </linearGradient>
    <pattern id="grid_${cleanId}" width="16" height="16" patternUnits="userSpaceOnUse">
      <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#CBD2D8" stroke-width="0.75" />
    </pattern>
  </defs>

  <!-- Background with subtle technical grid -->
  <rect width="100%" height="100%" fill="url(#bg_${cleanId})" />
  <rect width="100%" height="100%" fill="url(#grid_${cleanId})" opacity="0.7" />

  <!-- Catalogue Top Header Bar matching official Atlass Catalogue page layout -->
  <rect x="0" y="0" width="400" height="42" fill="#FFFFFF" />
  <line x1="0" y1="42" x2="400" y2="42" stroke="#CBD2D8" stroke-width="1" />

  <!-- Exact FORZACODE Badge like the printed catalogue -->
  <g transform="translate(14, 10)">
    <rect width="175" height="24" rx="4" fill="#DEE2E5" stroke="#CBD2D8" stroke-width="1" />
    <text x="87" y="16" fill="#12203C" font-family="monospace, sans-serif" font-size="11" font-weight="900" text-anchor="middle" letter-spacing="0.5">${displayForzaCode}</text>
  </g>

  <!-- Right subcategory header -->
  <g transform="translate(386, 12)">
    <text x="0" y="16" fill="#E06518" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="end">${subcategory}</text>
  </g>

  <!-- Central Visual Illustration -->
  ${illustration}

  <!-- Official Bottom Catalogue Strip -->
  <rect y="260" width="400" height="40" fill="#55565A" />
  <line x1="0" y1="260" x2="400" y2="260" stroke="#E06518" stroke-width="3" />
  
  <text x="14" y="284" fill="#FFFFFF" font-family="monospace, sans-serif" font-size="11" font-weight="bold" letter-spacing="1">WWW.ATLASS.TRADING.COM</text>
  
  <g transform="translate(386, 284)">
    <text x="0" y="0" fill="#E06518" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="end">${pageLabel}</text>
  </g>
</svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
