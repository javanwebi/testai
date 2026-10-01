#!/usr/bin/env node
/**
 * optimize-images.mjs
 * -------------------
 * Converts the large source images under `src/assets` into mobile-friendly
 * WebP copies inside a "mobile" subfolder of each asset directory.
 *
 * Why this exists:
 *   The raw catalogue images weigh ~270 MB, which would produce a ~260 MB APK.
 *   GitHub rejects any single file above 100 MB, and such an APK is unusable
 *   on a phone. WebP at a phone-appropriate resolution cuts the payload by
 *   roughly 90% (~30 MB) with no visible quality loss in the app.
 *
 * The originals are never modified. The generated mobile folders are
 * git-ignored and recreated on every build (see the prebuild npm script).
 *
 * Usage:  node scripts/optimize-images.mjs [--force]
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FORCE = process.argv.includes('--force');

/** folder -> { maxWidth, maxHeight, quality } */
const TARGETS = [
  // Product catalogue thumbnails: square, displayed at ~300-500 px on phones.
  { dir: 'src/assets/imagesproducts', maxWidth: 1000, maxHeight: 1000, quality: 80 },
  // Marketing banners / hero images: wider, keep a bit more resolution.
  { dir: 'src/assets/images', maxWidth: 1600, maxHeight: 1600, quality: 80 },
];

const SOURCE_RE = /\.(png|jpe?g)$/i;
const WEBP_NAME = (file) => file.replace(/\.[^.]+$/, '.webp');

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function optimizeFolder({ dir, maxWidth, maxHeight, quality }) {
  const srcDir = path.join(ROOT, dir);
  if (!(await exists(srcDir))) {
    console.log(`  skip (missing): ${dir}`);
    return { converted: 0, skipped: 0, bytesBefore: 0, bytesAfter: 0 };
  }

  const outDir = path.join(srcDir, 'mobile');
  await fs.mkdir(outDir, { recursive: true });

  const entries = (await fs.readdir(srcDir, { withFileTypes: true }))
    .filter((e) => e.isFile() && SOURCE_RE.test(e.name))
    .map((e) => e.name)
    .sort();

  let converted = 0;
  let skipped = 0;
  let bytesBefore = 0;
  let bytesAfter = 0;

  for (const name of entries) {
    const src = path.join(srcDir, name);
    const dest = path.join(outDir, WEBP_NAME(name));

    let srcStat;
    try {
      srcStat = await fs.stat(src);
    } catch {
      continue;
    }
    bytesBefore += srcStat.size;

    // Incremental: only re-encode when the source is newer than the output.
    if (!FORCE && (await exists(dest))) {
      const destStat = await fs.stat(dest);
      if (destStat.mtimeMs >= srcStat.mtimeMs) {
        skipped += 1;
        bytesAfter += destStat.size;
        continue;
      }
    }

    try {
      const image = sharp(src, { failOn: 'none' }).rotate(); // honour EXIF orientation
      const meta = await image.metadata();
      const willDownscale = (meta.width ?? 0) > maxWidth || (meta.height ?? 0) > maxHeight;

      const pipeline = willDownscale
        ? image.resize({ width: maxWidth, height: maxHeight, fit: 'inside', withoutEnlargement: true })
        : image;

      const buffer = await pipeline.webp({ quality, effort: 4 }).toBuffer();
      await fs.writeFile(dest, buffer);

      converted += 1;
      bytesAfter += buffer.length;
    } catch (err) {
      // Never fail the build because of a single bad image.
      console.warn(`  ! failed to optimize ${dir}/${name}: ${err.message}`);
    }
  }

  return { converted, skipped, bytesBefore, bytesAfter };
}

const mb = (n) => (n / 1048576).toFixed(1);

console.log('optimize-images: building mobile WebP assets…');

let grand = { converted: 0, skipped: 0, bytesBefore: 0, bytesAfter: 0 };

for (const target of TARGETS) {
  const r = await optimizeFolder(target);
  grand.converted += r.converted;
  grand.skipped += r.skipped;
  grand.bytesBefore += r.bytesBefore;
  grand.bytesAfter += r.bytesAfter;
  console.log(
    `  ${target.dir}: ${r.converted} converted, ${r.skipped} up-to-date ` +
      `(${mb(r.bytesBefore)} MB -> ${mb(r.bytesAfter)} MB)`
  );
}

console.log(
  `optimize-images: done. total ${mb(grand.bytesBefore)} MB -> ${mb(grand.bytesAfter)} MB ` +
    `(saved ${mb(grand.bytesBefore - grand.bytesAfter)} MB)`
);
