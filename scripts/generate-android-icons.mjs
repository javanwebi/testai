#!/usr/bin/env node
/**
 * generate-android-icons.mjs
 * --------------------------
 * Renders the brand launcher icon + splash screen for the Capacitor Android
 * project (android/app/src/main/res) from a single SVG, so the app no longer
 * ships with the generic Capacitor placeholder art.
 *
 * Usage: node scripts/generate-android-icons.mjs
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RES = path.join(ROOT, 'android/app/src/main/res');

const NAVY = '#0A172F';
const NAVY_DEEP = '#050D1C';
const ORANGE = '#F97316';
const ORANGE_LIGHT = '#FDBA74';

/** The belt-drive mark, drawn inside a 108x108 adaptive-icon canvas. */
function markSvg({ withBackground = true, scale = 1 } = {}) {
  const bg = withBackground
    ? `<rect x="0" y="0" width="108" height="108" rx="24" fill="url(#bgGrad)"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="108" height="108" viewBox="0 0 108 108">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${NAVY}"/>
      <stop offset="100%" stop-color="${NAVY_DEEP}"/>
    </linearGradient>
    <linearGradient id="beltGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${ORANGE_LIGHT}"/>
      <stop offset="100%" stop-color="${ORANGE}"/>
    </linearGradient>
  </defs>
  ${bg}
  <g transform="translate(54 54) scale(${scale}) translate(-54 -54)">
    <!-- belt -->
    <rect x="28" y="45" width="52" height="18" rx="9"
          fill="none" stroke="url(#beltGrad)" stroke-width="4.5"/>
    <!-- drive pulley -->
    <circle cx="38" cy="54" r="11.5" fill="url(#beltGrad)"/>
    <circle cx="38" cy="54" r="4.5" fill="${NAVY_DEEP}"/>
    <!-- driven pulley -->
    <circle cx="70" cy="54" r="8.5" fill="url(#beltGrad)"/>
    <circle cx="70" cy="54" r="3.2" fill="${NAVY_DEEP}"/>
  </g>
</svg>`;
}

/** Splash: navy field, mark centred, small wordmark-free lockup. */
function splashSvg(width, height) {
  const size = Math.round(Math.min(width, height) * 0.34);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="splashBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${NAVY}"/>
      <stop offset="100%" stop-color="${NAVY_DEEP}"/>
    </linearGradient>
    <linearGradient id="beltGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${ORANGE_LIGHT}"/>
      <stop offset="100%" stop-color="${ORANGE}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#splashBg)"/>
  <g transform="translate(${width / 2} ${height / 2}) scale(${size / 108}) translate(-54 -54)">
    <rect x="28" y="45" width="52" height="18" rx="9"
          fill="none" stroke="url(#beltGrad)" stroke-width="4.5"/>
    <circle cx="38" cy="54" r="11.5" fill="url(#beltGrad)"/>
    <circle cx="38" cy="54" r="4.5" fill="${NAVY_DEEP}"/>
    <circle cx="70" cy="54" r="8.5" fill="url(#beltGrad)"/>
    <circle cx="70" cy="54" r="3.2" fill="${NAVY_DEEP}"/>
  </g>
</svg>`;
}

const DENSITIES = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];

const LEGACY_ICON_PX = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
const ADAPTIVE_FG_PX = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };

const SPLASH_PORT = {
  mdpi: [320, 480], hdpi: [480, 800], xhdpi: [720, 1280],
  xxhdpi: [960, 1600], xxxhdpi: [1280, 1920],
};
const SPLASH_LAND = {
  mdpi: [480, 320], hdpi: [800, 480], xhdpi: [1280, 720],
  xxhdpi: [1600, 960], xxxhdpi: [1920, 1280],
};

async function writePng(file, svg, width, height) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await sharp(Buffer.from(svg), { density: 512 })
    .resize(width, height, { fit: 'fill' })
    .png({ compressionLevel: 9 })
    .toFile(file);
}

async function main() {
  let count = 0;

  // 1. Legacy square launcher icons (used on API < 26).
  for (const d of DENSITIES) {
    const px = LEGACY_ICON_PX[d];
    const svg = markSvg({ withBackground: true });
    await writePng(path.join(RES, `mipmap-${d}/ic_launcher.png`), svg, px, px);
    count += 1;
  }

  // 2. Round launcher icons: same mark on a circular mask.
  for (const d of DENSITIES) {
    const px = LEGACY_ICON_PX[d];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="108" height="108" viewBox="0 0 108 108">
      <defs>
        <clipPath id="roundMask"><circle cx="54" cy="54" r="54"/></clipPath>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${NAVY}"/><stop offset="100%" stop-color="${NAVY_DEEP}"/>
        </linearGradient>
        <linearGradient id="beltGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="${ORANGE_LIGHT}"/><stop offset="100%" stop-color="${ORANGE}"/>
        </linearGradient>
      </defs>
      <g clip-path="url(#roundMask)">
        <rect width="108" height="108" fill="url(#bgGrad)"/>
        <g transform="translate(54 54) scale(0.94) translate(-54 -54)">
          <rect x="28" y="45" width="52" height="18" rx="9" fill="none" stroke="url(#beltGrad)" stroke-width="4.5"/>
          <circle cx="38" cy="54" r="11.5" fill="url(#beltGrad)"/>
          <circle cx="38" cy="54" r="4.5" fill="${NAVY_DEEP}"/>
          <circle cx="70" cy="54" r="8.5" fill="url(#beltGrad)"/>
          <circle cx="70" cy="54" r="3.2" fill="${NAVY_DEEP}"/>
        </g>
      </g>
    </svg>`;
    await writePng(path.join(RES, `mipmap-${d}/ic_launcher_round.png`), svg, px, px);
    count += 1;
  }

  // 3. Adaptive-icon foreground (transparent background; colour comes from
  //    values/ic_launcher_background.xml).
  for (const d of DENSITIES) {
    const px = ADAPTIVE_FG_PX[d];
    const svg = markSvg({ withBackground: false, scale: 0.72 });
    await writePng(path.join(RES, `mipmap-${d}/ic_launcher_foreground.png`), svg, px, px);
    count += 1;
  }

  // 4. Splash screens.
  for (const d of DENSITIES) {
    const [pw, ph] = SPLASH_PORT[d];
    await writePng(
      path.join(RES, `drawable-port-${d}/splash.png`),
      splashSvg(pw, ph), pw, ph
    );
    const [lw, lh] = SPLASH_LAND[d];
    await writePng(
      path.join(RES, `drawable-land-${d}/splash.png`),
      splashSvg(lw, lh), lw, lh
    );
    count += 2;
  }
  await writePng(path.join(RES, 'drawable/splash.png'), splashSvg(480, 480), 480, 480);
  count += 1;

  console.log(`generate-android-icons: wrote ${count} images into android/app/src/main/res`);
}

main().catch((err) => {
  console.error('generate-android-icons failed:', err);
  process.exit(1);
});
