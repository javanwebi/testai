import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import sharp from 'sharp';
import type { OverlayOptions } from 'sharp';
import { GoogleGenAI, Modality, type LiveServerMessage } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

dotenv.config();
if (!process.env.GEMINI_API_KEY) {
  dotenv.config({ path: '.env.example' });
}

// Placeholder values that must NOT be treated as a real API key
const PLACEHOLDER_KEYS = new Set([
  'MY_GEMINI_API_KEY',
  'YOUR_GEMINI_API_KEY_HERE',
  'PASTE_NEW_KEY_HERE',
  'MY_APP_URL',
]);

function getGeminiKey(): string | undefined {
  const raw = (process.env.GEMINI_API_KEY || '').trim();
  const clean = raw.replace(/^['"]|['"]$/g, '');
  if (!clean || PLACEHOLDER_KEYS.has(clean)) return undefined;
  return clean;
}

// Reliable model cascade: prioritize highest grade gemini-3.8-flash
const GEMINI_MODELS = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
];

async function callGeminiModelWithTimeout(
  ai: GoogleGenAI,
  model: string,
  contents: any[],
  config?: any,
  timeoutMs = 15000
): Promise<string> {
  const attempt = async () => {
    let timer: NodeJS.Timeout | null = null;
    try {
      const callPromise = ai.models.generateContent({
        model,
        contents,
        config,
      });
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`Model ${model} request timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      });
      const res: any = await Promise.race([callPromise, timeoutPromise]);
      return res?.text || '';
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  try {
    return await attempt();
  } catch (err: any) {
    // Only 503 (temporary capacity) is worth an immediate retry.
    // 429 means the daily quota is exhausted — retrying wastes time.
    const isTransient503 =
      err?.status === 503 ||
      (!err?.status && err?.message?.includes('503'));

    if (isTransient503) {
      // Short backoff retry once for temporary capacity spikes
      await new Promise((r) => setTimeout(r, 400));
      return await attempt();
    }
    throw err;
  }
}

// The most recent model that answered successfully — tried first on the next
// call so we skip the 429-quota cascade dance after the first success.
let lastGoodAiModel: string | null = null;

async function generateWithModelCascade(
  ai: GoogleGenAI,
  contents: any[],
  config?: any,
  tag = 'AI Search',
  models: string[] = GEMINI_MODELS,
  timeoutMs = 15000
): Promise<{ text: string; model: string }> {
  let lastError = '';
  const ordered = lastGoodAiModel
    ? [lastGoodAiModel, ...models.filter(m => m !== lastGoodAiModel)]
    : models;
  for (const model of ordered) {
    try {
      const text = await callGeminiModelWithTimeout(ai, model, contents, config, timeoutMs);
      if (text && text.trim()) {
        lastGoodAiModel = model;
        return { text, model };
      }
    } catch (err: any) {
      lastError = err?.message || String(err);
      console.log(`[${tag}] Model ${model} unavailable (${err?.status || '503/timeout'}), trying next available model...`);
    }
  }
  throw new Error(`تمامی مدل‌های هوش مصنوعی با خطای موقت مواجه شدند: ${lastError}`);
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

interface CatalogItem {
  code: string;
  forzaCode: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  subcategory: string;
  page: number;
  image: string;
  specs: { key: string; value: string }[];
  price: number;
  stock: number;
}

// Load the complete 864 catalog products
let CATALOG_ITEMS: CatalogItem[] = [];

try {
  const summaryPath = path.join(process.cwd(), 'src', 'data', 'catalogSummary.json');
  if (fs.existsSync(summaryPath)) {
    CATALOG_ITEMS = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    console.log(`[Server] Successfully loaded ${CATALOG_ITEMS.length} catalog products for AI visual search.`);
  } else {
    console.warn(`[Server] catalogSummary.json not found at ${summaryPath}`);
  }
} catch (e: any) {
  console.error('[Server] Failed to load catalog products:', e.message);
}

// ============================================================================
// VISUAL HASH ENGINE: exact/near-duplicate image search over catalog photos.
// Compares the user's photo against all 864 catalog images with a 256-bit
// dHash (difference hash). Resistant to resize/recompress/watermark shifts.
// ============================================================================

const IMAGE_HASH_CACHE_PATH = path.join(process.cwd(), 'src', 'data', 'imageHashes.json');
const GITHUB_CATALOG_IMAGES_REPO = 'https://raw.githubusercontent.com/javanweb/imagesatlas/main';
const CATALOG_IMAGES_CACHE_DIR = path.join(process.cwd(), '.cache', 'catalog_images');

// Ensure catalog images cache folder exists
try {
  fs.mkdirSync(CATALOG_IMAGES_CACHE_DIR, { recursive: true });
} catch {}

// Pure-visual multi-feature descriptor per catalog image.
// NOTE: product names/codes in the current catalog data are known to be
// unreliable — retrieval must depend ONLY on these image features.
interface ImageFeatures {
  dh: string;    // 256-bit difference hash (64 hex chars)
  ph: string;    // 64-bit DCT perceptual hash (16 hex chars)
  ah: string;    // 64-bit average hash (16 hex chars)
  col: number[]; // 64-bin RGB color histogram (normalized, sums to 1)
}

// Every image is indexed twice: as-is (raw) and background-removed (clean).
// Distances are only computed between matching variants (raw↔raw, clean↔clean)
// so a studio catalog shot and a cluttered workshop photo stay comparable.
interface DualFeatures {
  raw: ImageFeatures;
  clean: ImageFeatures;
}

const FEATURE_CACHE_VERSION = 5;

// filename -> DualFeatures
const IMAGE_FEATURE_INDEX = new Map<string, DualFeatures>();
let visualIndexReady = false;

// ─────────────────────────────────────────────────────────────────────────────
// JINA DEEP VISUAL EMBEDDINGS (jina-embeddings-v5-omni-small)
// A second, deep-learning retrieval channel: every catalog image and the
// customer photo are embedded into a shared 1024-dim space; cosine similarity
// captures overall shape & appearance ("شکل و شمایل چشمی") far better than
// perceptual hashes when lighting/angle/background differ.
// The index is cached in src/data/imageEmbeddings.json (864 entries).
// ─────────────────────────────────────────────────────────────────────────────
const JINA_API_KEY = (process.env.JINA_API_KEY || '').trim();
const JINA_EMB_MODEL = 'jina-embeddings-v5-omni-small';
const IMAGE_EMB_CACHE_PATH = path.join(process.cwd(), 'src', 'data', 'imageEmbeddings.json');
const IMAGE_EMB_CACHE_VERSION = 1;

// filename -> number[] (1024 dims, normalized by Jina)
const IMAGE_EMB_INDEX = new Map<string, number[]>();
let embIndexReady = false;

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return -1;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return -1;
  return dot / Math.sqrt(na * nb);
}

async function jinaFetchWithTimeout(url: string, body: any, timeoutMs = 20000): Promise<any> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${JINA_API_KEY}` },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json) {
      throw new Error(`Jina API ${res.status}: ${JSON.stringify(json || {}).slice(0, 120)}`);
    }
    return json;
  } finally {
    clearTimeout(timer);
  }
}

// Embed images (as data URIs) with the Jina multimodal embedding model.
// Batches of 8; returns one 1024-dim vector per input buffer (null on failure).
async function jinaEmbedImages(buffers: Buffer[], task: 'retrieval.query' | 'retrieval.passage'): Promise<(number[] | null)[]> {
  if (!JINA_API_KEY || buffers.length === 0) return buffers.map(() => null);
  const out: (number[] | null)[] = buffers.map(() => null);
  const BATCH = 8;
  for (let off = 0; off < buffers.length; off += BATCH) {
    const chunk = buffers.slice(off, off + BATCH);
    const input: any[] = [];
    const okIdx: number[] = [];
    for (let i = 0; i < chunk.length; i++) {
      try {
        const jpg = await sharp(chunk[i])
          .resize(224, 224, { fit: 'inside' })
          .flatten({ background: '#ffffff' })
          .jpeg({ quality: 80 })
          .toBuffer();
        input.push({ image: 'data:image/jpeg;base64,' + jpg.toString('base64') });
        okIdx.push(i);
      } catch {
        // unprocessable image -> stays null
      }
    }
    if (input.length === 0) continue;
    let json: any = null;
    for (let attempt = 0; attempt < 2 && !json; attempt++) {
      try {
        json = await jinaFetchWithTimeout('https://api.jina.ai/v1/embeddings', {
          model: JINA_EMB_MODEL,
          task,
          dimensions: 1024,
          input,
        });
      } catch (err: any) {
        if (attempt === 1) console.log(`[Jina Embed] batch failed: ${err?.message?.slice(0, 90)}`);
        else await new Promise(r => setTimeout(r, 500));
      }
    }
    if (!json || !Array.isArray(json.data)) continue;
    const embeddings = json.data.map((d: any) => (d?.embedding as number[]) || null);
    for (let k = 0; k < okIdx.length && k < embeddings.length; k++) {
      out[off + okIdx[k]] = embeddings[k];
    }
  }
  return out;
}

// Load the catalog embedding cache; build it in the background when missing
// and a Jina key is configured.
async function buildImageEmbeddingIndex(): Promise<void> {
  try {
    if (fs.existsSync(IMAGE_EMB_CACHE_PATH)) {
      const cached = JSON.parse(fs.readFileSync(IMAGE_EMB_CACHE_PATH, 'utf8')) as {
        version: number;
        model: string;
        entries: Record<string, number[]>;
      };
      if (cached && cached.version === IMAGE_EMB_CACHE_VERSION && cached.entries) {
        for (const [img, emb] of Object.entries(cached.entries)) {
          if (Array.isArray(emb) && emb.length === 1024) IMAGE_EMB_INDEX.set(img, emb);
        }
      }
    }
    embIndexReady = IMAGE_EMB_INDEX.size > 0;
    console.log(
      `[Server] Jina embedding index: ${IMAGE_EMB_INDEX.size} catalog images` +
        (JINA_API_KEY ? '' : ' (no JINA_API_KEY — query-side embeddings disabled)')
    );

    // Background build for any catalog image missing from the cache
    if (JINA_API_KEY) {
      const missing = CATALOG_ITEMS.filter(
        it => (it.image || '').trim() && !IMAGE_EMB_INDEX.has((it.image || '').trim())
      );
      if (missing.length > 0) {
        console.log(`[Server] Building Jina embeddings for ${missing.length} catalog images (background)...`);
        (async () => {
          try {
            const files: string[] = [];
            const bufs: Buffer[] = [];
            for (const item of missing) {
              const file = (item.image || '').trim();
              const buf = await getCatalogImageBuffer(file);
              if (!buf) continue;
              bufs.push(buf);
              files.push(file);
            }
            const embeddings = await jinaEmbedImages(bufs, 'retrieval.passage');
            let built = 0;
            for (let i = 0; i < files.length; i++) {
              if (embeddings[i]) {
                IMAGE_EMB_INDEX.set(files[i], embeddings[i] as number[]);
                built++;
              }
            }
            if (built > 0) {
              embIndexReady = IMAGE_EMB_INDEX.size > 0;
              fs.writeFileSync(
                IMAGE_EMB_CACHE_PATH,
                JSON.stringify({ version: IMAGE_EMB_CACHE_VERSION, model: JINA_EMB_MODEL, entries: Object.fromEntries(IMAGE_EMB_INDEX) })
              );
              console.log(`[Server] Jina embedding index updated: +${built} (total ${IMAGE_EMB_INDEX.size})`);
            }
          } catch (e: any) {
            console.error('[Server] Jina embedding background build failed:', e?.message);
          }
        })();
      }
    }
  } catch (e: any) {
    console.error('[Server] Jina embedding index failed (channel disabled):', e?.message);
    embIndexReady = false;
  }
}

// ----------------------------------------------------------------------------
// Catalog image filename resolver.
// The catalog data references images like "e(001).png" while the file on disk
// may be stored as "e(1).png" (zero-padding differences). Without this
// resolver, ~99 products were invisible to the hash index and to AI
// side-by-side verification.
// ----------------------------------------------------------------------------
const CATALOG_IMAGE_ALIASES = new Map<string, string>();

function buildCatalogImageAliases(): void {
  for (let num = 1; num <= 869; num++) {
    const raw = `e(${num}).png`;
    CATALOG_IMAGE_ALIASES.set(raw.toLowerCase(), raw);
    for (const pad of [2, 3]) {
      const variant = `e(${String(num).padStart(pad, '0')}).png`;
      CATALOG_IMAGE_ALIASES.set(variant.toLowerCase(), raw);
    }
    CATALOG_IMAGE_ALIASES.set(`e${num}.png`, raw);
    CATALOG_IMAGE_ALIASES.set(`at-e${num}`, raw);
    CATALOG_IMAGE_ALIASES.set(`at-e${String(num).padStart(3, '0')}`, raw);
  }
  console.log(`[Server] Catalog image alias map initialized with ${CATALOG_IMAGE_ALIASES.size} entries.`);
}

function normalizeCatalogImageFilename(image?: string): string {
  const clean = (image || '').trim().toLowerCase();
  if (!clean) return 'e(1).png';
  if (CATALOG_IMAGE_ALIASES.has(clean)) {
    return CATALOG_IMAGE_ALIASES.get(clean)!;
  }
  const m = clean.match(/(?:e\(?|at-e)?(\d+)\)?(?:\.(png|jpe?g|webp|svg))?/i);
  if (m) {
    const num = parseInt(m[1], 10);
    const normalizedNum = ((Math.abs(num) - 1) % 869) + 1;
    return `e(${normalizedNum}).png`;
  }
  return clean.endsWith('.png') ? clean : `${clean}.png`;
}

function resolveCatalogImagePath(image?: string): string | null {
  const filename = normalizeCatalogImageFilename(image);
  const cached = path.join(CATALOG_IMAGES_CACHE_DIR, filename);
  if (fs.existsSync(cached)) return cached;
  return null;
}

async function getCatalogImageBuffer(image?: string): Promise<Buffer | null> {
  const filename = normalizeCatalogImageFilename(image);
  const cachedPath = path.join(CATALOG_IMAGES_CACHE_DIR, filename);

  if (fs.existsSync(cachedPath)) {
    try {
      return fs.readFileSync(cachedPath);
    } catch {}
  }

  // Fetch directly from GitHub repository javanweb/imagesatlas
  try {
    const url = `${GITHUB_CATALOG_IMAGES_REPO}/${encodeURIComponent(filename)}`;
    const res = await fetch(url);
    if (res.ok) {
      const arr = await res.arrayBuffer();
      const buf = Buffer.from(arr);
      try {
        fs.writeFileSync(cachedPath, buf);
      } catch {}
      return buf;
    }
  } catch (err) {
    console.warn(`[Server] Failed to fetch catalog image ${filename} from GitHub:`, err);
  }
  return null;
}

function bitsToHex(bits: string): string {
  let hex = '';
  for (let i = 0; i < bits.length; i += 4) {
    hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  }
  return hex;
}

// 64-bit DCT perceptual hash over a 32x32 grayscale buffer
function dctPHash(pixels: Buffer): string {
  const N = 32;
  const M = 8;
  const c = (u: number) => (u === 0 ? Math.SQRT1_2 : 1);
  const dct = new Float64Array(M * M);
  for (let u = 0; u < M; u++) {
    for (let v = 0; v < M; v++) {
      let s = 0;
      for (let x = 0; x < N; x++) {
        for (let y = 0; y < N; y++) {
          s +=
            pixels[y * N + x] *
            Math.cos(((2 * x + 1) * u * Math.PI) / (2 * N)) *
            Math.cos(((2 * y + 1) * v * Math.PI) / (2 * N));
        }
      }
      dct[u * M + v] = c(u) * c(v) * s;
    }
  }
  const sorted = Array.from(dct).sort((a, b) => a - b);
  const med = sorted[32];
  let bits = '';
  for (let i = 0; i < 64; i++) bits += dct[i] > med ? '1' : '0';
  return bitsToHex(bits);
}

// Remove a uniform-ish studio/workshop background using border-seeded
// flood fill. Robust against gradients and watermark noise, unlike a single
// global background color. Returns the cleaned image plus the part mask.
interface CleanResult {
  cleaned: Buffer;
  mask: Uint8Array | null; // 1 = part pixel (at 300px working resolution)
  colHistogram: number[] | null; // 64-bin RGB histogram over PART pixels only
  width: number;
  height: number;
}

async function cleanImage(buffer: Buffer): Promise<CleanResult> {
  try {
    const { data, info } = await sharp(buffer)
      .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const W = info.width;
    const H = info.height;
    const idx = (x: number, y: number) => (y * W + x) * 3;

    // border seed statistics
    const borderIdx: number[] = [];
    for (let x = 0; x < W; x += 3) {
      borderIdx.push(idx(x, 0), idx(x, H - 1));
    }
    for (let y = 0; y < H; y += 3) {
      borderIdx.push(idx(0, y), idx(W - 1, y));
    }
    const mean = [0, 1, 2].map(k => {
      let s = 0;
      for (const i of borderIdx) s += data[i + k];
      return s / borderIdx.length;
    });
    let variance = 0;
    for (const i of borderIdx) {
      for (let k = 0; k < 3; k++) variance += (data[i + k] - mean[k]) ** 2;
    }
    variance /= borderIdx.length * 3;

    // genuinely busy/scene-like border -> no backdrop to remove
    if (variance > 3000) {
      return { cleaned: buffer, mask: null, colHistogram: null, width: W, height: H };
    }

    const bg = new Uint8Array(W * H);
    const queue: number[] = [];
    const LOCAL_T = 42;   // neighbor continuity (handles gradients)
    const GLOBAL_T = 110; // vs border mean (limits runaway growth)
    const closePair = (i: number, j: number) =>
      Math.abs(data[i] - data[j]) < LOCAL_T &&
      Math.abs(data[i + 1] - data[j + 1]) < LOCAL_T &&
      Math.abs(data[i + 2] - data[j + 2]) < LOCAL_T;
    const closeMean = (i: number) =>
      Math.abs(data[i] - mean[0]) < GLOBAL_T &&
      Math.abs(data[i + 1] - mean[1]) < GLOBAL_T &&
      Math.abs(data[i + 2] - mean[2]) < GLOBAL_T;
    const push = (x: number, y: number) => {
      const p = y * W + x;
      if (!bg[p]) {
        bg[p] = 1;
        queue.push(p);
      }
    };
    for (let x = 0; x < W; x++) {
      if (closeMean(idx(x, 0))) push(x, 0);
      if (closeMean(idx(x, H - 1))) push(x, H - 1);
    }
    for (let y = 0; y < H; y++) {
      if (closeMean(idx(0, y))) push(0, y);
      if (closeMean(idx(W - 1, y))) push(W - 1, y);
    }
    while (queue.length) {
      const p = queue.pop() as number;
      const x = p % W;
      const y = (p - x) / W;
      const i = p * 3;
      const tryN = (nx: number, ny: number) => {
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) return;
        const np = ny * W + nx;
        if (bg[np]) return;
        const ni = np * 3;
        if (closePair(i, ni) && closeMean(ni)) {
          bg[np] = 1;
          queue.push(np);
        }
      };
      tryN(x + 1, y);
      tryN(x - 1, y);
      tryN(x, y + 1);
      tryN(x, y - 1);
    }

    let bgCount = 0;
    for (let p = 0; p < W * H; p++) bgCount += bg[p];
    // flood filled almost nothing -> no backdrop
    if (bgCount < 0.08 * W * H) {
      return { cleaned: buffer, mask: null, colHistogram: null, width: W, height: H };
    }

    const out = Buffer.alloc(W * H * 3);
    for (let p = 0; p < W * H; p++) {
      if (bg[p]) {
        out[p * 3] = 255;
        out[p * 3 + 1] = 255;
        out[p * 3 + 2] = 255;
      } else {
        out[p * 3] = data[p * 3];
        out[p * 3 + 1] = data[p * 3 + 1];
        out[p * 3 + 2] = data[p * 3 + 2];
      }
    }
    const mask = new Uint8Array(W * H);
    for (let p = 0; p < W * H; p++) mask[p] = bg[p] ? 0 : 1;

    // Color histogram over PART pixels only — after we whitewash the
    // backdrop, a full-image histogram would be dominated by white and
    // lose all color discrimination between light-colored parts.
    const colHist = new Array(64).fill(0);
    let partPixels = 0;
    for (let p = 0; p < W * H; p++) {
      if (!mask[p]) continue;
      partPixels++;
      const i = p * 3;
      const r = Math.min(3, data[i] >> 6);
      const g = Math.min(3, data[i + 1] >> 6);
      const b = Math.min(3, data[i + 2] >> 6);
      colHist[r * 16 + g * 4 + b]++;
    }
    const colHistogram = partPixels >= 300 ? colHist.map(v => v / partPixels) : null;

    const flat = await sharp(out, { raw: { width: W, height: H, channels: 3 } })
      .png()
      .toBuffer();
    const cleaned = await sharp(flat)
      .trim({ threshold: 3 })
      .png()
      .toBuffer()
      .catch(() => flat);
    return { cleaned, mask, colHistogram, width: W, height: H };
  } catch {
    return { cleaned: buffer, mask: null, colHistogram: null, width: 0, height: 0 };
  }
}

// Extract the full pure-visual feature set from an image buffer (as-is).
async function computeImageFeatures(buffer: Buffer): Promise<ImageFeatures> {
  // 256-bit difference hash (17x16 grayscale)
  const raw17 = await sharp(buffer).resize(17, 16, { fit: 'fill' }).grayscale().raw().toBuffer();
  let dbits = '';
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      dbits += raw17[y * 17 + x] > raw17[y * 17 + x + 1] ? '1' : '0';
    }
  }
  const dh = bitsToHex(dbits);

  // 64-bit average hash (8x8 grayscale)
  const raw8 = await sharp(buffer).resize(8, 8, { fit: 'fill' }).grayscale().raw().toBuffer();
  const mean8 = raw8.reduce((a, b) => a + b, 0) / 64;
  let abits = '';
  for (let i = 0; i < 64; i++) abits += raw8[i] > mean8 ? '1' : '0';
  const ah = bitsToHex(abits);

  // 64-bit DCT perceptual hash (32x32 grayscale)
  const raw32 = await sharp(buffer).resize(32, 32, { fit: 'fill' }).grayscale().raw().toBuffer();
  const ph = dctPHash(raw32);

  // 64-bin RGB color histogram (16x16, 4 levels per channel)
  const rgb = await sharp(buffer).resize(16, 16, { fit: 'fill' }).removeAlpha().raw().toBuffer();
  const col = new Array(64).fill(0);
  for (let i = 0; i < 256; i++) {
    const r = Math.min(3, rgb[i * 3] >> 6);
    const g = Math.min(3, rgb[i * 3 + 1] >> 6);
    const b = Math.min(3, rgb[i * 3 + 2] >> 6);
    col[r * 16 + g * 4 + b]++;
  }
  for (let i = 0; i < 64; i++) col[i] /= 256;

  return { dh, ph, ah, col };
}

// Raw + background-removed features for one image.
async function computeDualImageFeatures(buffer: Buffer): Promise<DualFeatures> {
  const raw = await computeImageFeatures(buffer);
  const { cleaned, colHistogram } = await cleanImage(buffer);
  if (cleaned === buffer || !colHistogram) {
    return { raw, clean: raw };
  }
  const clean = await computeImageFeatures(cleaned);
  // Replace the whole-image histogram with the part-only histogram so the
  // white backdrop we just painted does not wash out the color signal.
  clean.col = colHistogram;
  return { raw, clean };
}

function hammingDistance(h1: string, h2: string): number {
  if (!h1 || !h2 || h1.length !== h2.length) return Number.MAX_SAFE_INTEGER;
  let d = 0;
  for (let i = 0; i < h1.length; i++) {
    let x = parseInt(h1[i], 16) ^ parseInt(h2[i], 16);
    while (x) {
      d += x & 1;
      x >>= 1;
    }
  }
  return d;
}

async function buildImageFeatureIndex(): Promise<void> {
  try {
    buildCatalogImageAliases();

    // 1) Try loading cache (v2 multi-feature format)
    if (fs.existsSync(IMAGE_HASH_CACHE_PATH)) {
      try {
        const cached = JSON.parse(fs.readFileSync(IMAGE_HASH_CACHE_PATH, 'utf8')) as {
          version: number;
          entries: Record<string, DualFeatures>;
        };
        if (cached && cached.version === FEATURE_CACHE_VERSION && cached.entries) {
          for (const [file, feat] of Object.entries(cached.entries)) {
            if (
              feat?.raw && typeof feat.raw.dh === 'string' && feat.raw.dh.length === 64 && Array.isArray(feat.raw.col) &&
              feat?.clean && typeof feat.clean.dh === 'string' && feat.clean.dh.length === 64 && Array.isArray(feat.clean.col)
            ) {
              IMAGE_FEATURE_INDEX.set(file, feat);
            }
          }
        }
      } catch {
        // corrupt cache -> rebuild below
      }
    }

    // 2) Extract features for any catalog image missing from the index
    let newlyHashed = 0;
    for (const item of CATALOG_ITEMS) {
      const file = (item.image || '').trim();
      if (!file || IMAGE_FEATURE_INDEX.has(file)) continue;
      const buf = await getCatalogImageBuffer(file);
      if (!buf) continue;
      try {
        IMAGE_FEATURE_INDEX.set(file, await computeDualImageFeatures(buf));
        newlyHashed++;
      } catch {
        // unreadable image -> skip
      }
    }

    // 3) Persist cache if we extracted anything new
    if (newlyHashed > 0) {
      try {
        fs.writeFileSync(
          IMAGE_HASH_CACHE_PATH,
          JSON.stringify({ version: FEATURE_CACHE_VERSION, entries: Object.fromEntries(IMAGE_FEATURE_INDEX) })
        );
      } catch {
        // cache write failure is non-fatal
      }
    }

    visualIndexReady = IMAGE_FEATURE_INDEX.size > 0;
    console.log(
      `[Server] Visual feature index ready: ${IMAGE_FEATURE_INDEX.size} catalog images` +
        (newlyHashed > 0 ? ` (${newlyHashed} newly processed)` : ' (from cache)')
    );
  } catch (e: any) {
    console.error('[Server] Visual feature index failed (visual search disabled):', e.message);
  }
}

// Build in background so server startup isn't blocked on first run
void buildImageFeatureIndex();
void buildImageEmbeddingIndex();

function brandForCatalogItem(item: CatalogItem): string {
  const itemName = item.name.toLowerCase();
  let brand = 'بازرگانی اطلس (ATLAS)';
  if (item.categorySlug === 'industrial-belts') {
    if (itemName.includes('swr') || itemName.includes('اس دبلیو آر')) brand = 'اس دبلیو آر (SWR آلمان)';
    else if (itemName.includes('forza') || itemName.includes('فورزا')) brand = 'فورزا (FORZA اسپانیا)';
  }
  return brand;
}

interface VisualMatch {
  code: string;
  name: string;
  forzaCode: string;
  brand: string;
  categorySlug: string;
  categoryName: string;
  subcategory: string;
  cataloguePage: number;
  image: string;
  similarityScore: number;
  matchReason: string;
  specs: { key: string; value: string }[];
  price: number;
  stock: number;
  isVisualMatch: true;
  visualDistance: number;
}

// Combined visual distance threshold for "this is the same image file"
// (user re-uploaded / screenshotted a catalog photo). On the 0..1 combined
// feature-distance scale, near-duplicates land well below 0.07.
const VISUAL_DUPLICATE_MAX = 0.07;

interface RankedItemRef {
  code: string;
  image: string;
  distance: number;
  colDistance: number;
}

interface VisualCandidateResult {
  candidates: (VisualMatch & { visualDistance: number; isVisualMatch: true; embSim?: number })[];
  exactVisualMatch: boolean;
  bestDistance: number;
  rankedCombined: RankedItemRef[];
  rankedCol: RankedItemRef[];
  rankedRaw: RankedItemRef[];
  rankedEmb: RankedItemRef[];
}

interface NormBox {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
}

// Pure color-distribution distance (0..1). Works on part-only histograms for
// the clean variant, so it compares "what color is the part itself".
function colFeatureDistance(a: ImageFeatures, b: ImageFeatures): number {
  let l1 = 0;
  for (let i = 0; i < 64; i++) l1 += Math.abs(a.col[i] - b.col[i]);
  return Math.min(1, l1 / 2);
}

// Weighted combination of perceptual distances (each normalized 0..1).
function visualFeatureDistance(a: ImageFeatures, b: ImageFeatures): number {
  const dDh = hammingDistance(a.dh, b.dh) / 256;
  const dPh = hammingDistance(a.ph, b.ph) / 64;
  const dAh = hammingDistance(a.ah, b.ah) / 64;
  let l1 = 0;
  for (let i = 0; i < 64; i++) l1 += Math.abs(a.col[i] - b.col[i]);
  const dCol = Math.min(1, l1 / 2);
  return 0.45 * dDh + 0.25 * dPh + 0.1 * dAh + 0.2 * dCol;
}

// PURE VISUAL ranking over all catalog images.
// No names, no codes, no categories, no dimensions — the catalog text data is
// currently unreliable, so the ONLY signal is image appearance.
// Distance is always computed between matching variants (raw↔raw, clean↔clean)
// and the best comparable pair wins.
function dualFeatureDistance(q: DualFeatures, f: DualFeatures): number {
  return Math.min(
    visualFeatureDistance(q.raw, f.raw),
    visualFeatureDistance(q.clean, f.clean)
  );
}

function rankByVisualFeatures(
  queryDualList: DualFeatures[],
  queryEmbs: (number[] | null)[] = [],
  topK = 14
): VisualCandidateResult {
  if (!visualIndexReady || IMAGE_FEATURE_INDEX.size === 0 || !CATALOG_ITEMS || CATALOG_ITEMS.length === 0) {
    return { candidates: [], exactVisualMatch: false, bestDistance: 999, rankedCombined: [], rankedCol: [], rankedRaw: [], rankedEmb: [] };
  }

  const hasEmb = embIndexReady && IMAGE_EMB_INDEX.size > 0 && queryEmbs.some(e => Array.isArray(e) && e.length === 1024);
  let minDistance = 999;
  const scored = CATALOG_ITEMS.map(item => {
    const f = item.image ? IMAGE_FEATURE_INDEX.get(item.image) : undefined;
    let dist = 999;
    let rawDist = 999;
    let colDist = 999;
    if (f && queryDualList.length > 0) {
      dist = Math.min(...queryDualList.map(q => dualFeatureDistance(q, f)));
      rawDist = Math.min(...queryDualList.map(q => visualFeatureDistance(q.raw, f.raw)));
      // Pure color-of-the-part distance (clean variant carries the
      // part-only histogram when background removal succeeded).
      colDist = Math.min(...queryDualList.map(q => Math.min(
        colFeatureDistance(q.clean, f.clean),
        colFeatureDistance(q.raw, f.raw)
      )));
    }
    // Deep visual embedding similarity (Jina v5-omni): captures overall shape
    // & appearance; robust to lighting/angle/background differences.
    let embSim = -1;
    if (hasEmb) {
      const cat = item.image ? IMAGE_EMB_INDEX.get((item.image || '').trim()) : undefined;
      if (cat) {
        for (const qe of queryEmbs) {
          if (!qe) continue;
          const s = cosineSimilarity(qe, cat);
          if (s > embSim) embSim = s;
        }
      }
    }
    if (dist < minDistance) minDistance = dist;
    return { item, distance: dist, rawDistance: rawDist, colDistance: colDist, embSim };
  });

  // Three recall paths:
  //  1) best combined (raw/clean) distance — favors clean catalog shots
  //  2) best raw-only distance — protects busy workshop photos whose
  //     background removal did not trigger
  //  3) best part-color distance — shape hashes fail when the catalog photo
  //     shows the same part differently (stacked vs single), color survives
  const byCombined = [...scored].sort((a, b) => a.distance - b.distance);
  const byRaw = [...scored].sort((a, b) => a.rawDistance - b.rawDistance);
  const byCol = [...scored].sort((a, b) => a.colDistance - b.colDistance);
  const byEmb = hasEmb
    ? [...scored].filter(s => s.embSim >= 0).sort((a, b) => b.embSim - a.embSim)
    : [];

  // Full ranked lists (for the AI catalog-browsing montage round)
  const toRef = (s: (typeof scored)[number]): RankedItemRef => ({
    code: s.item.code,
    image: (s.item.image || '').trim(),
    distance: Number(s.distance.toFixed(4)),
    colDistance: Number(s.colDistance.toFixed(4)),
  });
  const rankedCombined = byCombined.slice(0, 120).map(toRef);
  const rankedCol = byCol.slice(0, 120).map(toRef);
  const rankedRaw = byRaw.slice(0, 120).map(toRef);
  const rankedEmb = byEmb.slice(0, 120).map(s => ({
    code: s.item.code,
    image: (s.item.image || '').trim(),
    distance: Number((1 - s.embSim).toFixed(4)),
    colDistance: Number(s.colDistance.toFixed(4)),
  }));

  // Deduplicate by image so candidates represent distinct catalog photos.
  // The deep-embedding path is included because it recognizes the same part
  // under very different lighting/scene conditions where hashes fail.
  const seenImages = new Set<string>();
  const distinctCandidates: typeof scored = [];
  for (const s of byCombined.slice(0, Math.min(8, topK))) {
    const img = (s.item.image || '').trim();
    if (!seenImages.has(img)) {
      seenImages.add(img);
      distinctCandidates.push(s);
    }
  }
  for (const s of byEmb.slice(0, 8)) {
    if (distinctCandidates.length >= topK) break;
    const img = (s.item.image || '').trim();
    if (!seenImages.has(img)) {
      seenImages.add(img);
      distinctCandidates.push(s);
    }
  }
  for (const s of byCol.slice(0, 6)) {
    if (distinctCandidates.length >= topK) break;
    const img = (s.item.image || '').trim();
    if (!seenImages.has(img)) {
      seenImages.add(img);
      distinctCandidates.push(s);
    }
  }
  for (const s of byRaw.slice(0, 6)) {
    if (distinctCandidates.length >= topK) break;
    const img = (s.item.image || '').trim();
    if (!seenImages.has(img)) {
      seenImages.add(img);
      distinctCandidates.push(s);
    }
  }

  const exactVisualMatch = minDistance <= VISUAL_DUPLICATE_MAX;

  const candidates: (VisualMatch & { visualDistance: number; isVisualMatch: true; embSim?: number })[] = distinctCandidates.map(({ item, distance, embSim }) => ({
    code: item.code,
    name: item.name,
    forzaCode: item.forzaCode,
    brand: brandForCatalogItem(item),
    categorySlug: item.categorySlug,
    categoryName: item.categoryName,
    subcategory: item.subcategory,
    cataloguePage: item.page,
    image: item.image,
    similarityScore: distance <= VISUAL_DUPLICATE_MAX ? 99 : Math.max(55, Math.min(92, Math.round(99 - distance * 55))),
    matchReason:
      distance <= VISUAL_DUPLICATE_MAX
        ? '🎯 عکس شما عیناً همان تصویر این کالا در کاتالوگ اطلس است'
        : 'کاندیدای برگزیده از نظر شباهت ظاهری برای راستی‌آزمایی بصری چهره‌به‌چهره با عکس شما',
    specs: [],
    price: item.price,
    stock: item.stock,
    isVisualMatch: true as const,
    visualDistance: Number(distance.toFixed(4)),
    embSim,
  }));

  return { candidates, exactVisualMatch, bestDistance: minDistance, rankedCombined, rankedCol, rankedRaw, rankedEmb };
}

// Crop the user's photo to the AI-detected part region (with a small margin)
// so background clutter does not pollute the perceptual features.
async function cropToBoundingBox(buffer: Buffer, bb: NormBox, padRatio = 0.08): Promise<Buffer> {
  const meta = await sharp(buffer).metadata();
  const W = meta.width || 0;
  const H = meta.height || 0;
  if (!W || !H) return buffer;
  const bw = ((bb.x_max - bb.x_min) / 1000) * W;
  const bh = ((bb.y_max - bb.y_min) / 1000) * H;
  const left = Math.max(0, Math.round((bb.x_min / 1000) * W - bw * padRatio));
  const top = Math.max(0, Math.round((bb.y_min / 1000) * H - bh * padRatio));
  const width = Math.min(W - left, Math.round(bw * (1 + 2 * padRatio)));
  const height = Math.min(H - top, Math.round(bh * (1 + 2 * padRatio)));
  if (width < 24 || height < 24) return buffer;
  return sharp(buffer).extract({ left, top, width, height }).toBuffer();
}

// Compute visual candidates for a user photo. Features are extracted from the
// full image AND (when available) the cropped part region; the best match
// against each catalog image wins.
async function getVisualCandidateResult(queryBuffer: Buffer, boundingBox?: NormBox): Promise<VisualCandidateResult> {
  if (!visualIndexReady || IMAGE_FEATURE_INDEX.size === 0 || !CATALOG_ITEMS || CATALOG_ITEMS.length === 0) {
    return { candidates: [], exactVisualMatch: false, bestDistance: 999, rankedCombined: [], rankedCol: [], rankedRaw: [], rankedEmb: [] };
  }
  const dualList: DualFeatures[] = [];
  try {
    dualList.push(await computeDualImageFeatures(queryBuffer));
  } catch (err) {
    console.error('[Visual Retrieval] feature extraction failed:', err);
    return { candidates: [], exactVisualMatch: false, bestDistance: 999, rankedCombined: [], rankedCol: [], rankedRaw: [], rankedEmb: [] };
  }
  if (boundingBox) {
    try {
      const cropped = await cropToBoundingBox(queryBuffer, boundingBox);
      dualList.push(await computeDualImageFeatures(cropped));
    } catch {
      // cropping is best-effort
    }
  }
  // Deep embedding of the same query variants (full + cropped). Degrades to
  // hash-only retrieval when the Jina key is absent or the API is down.
  const queryEmbs: (number[] | null)[] = [];
  if (embIndexReady && JINA_API_KEY) {
    try {
      const embBufs = [queryBuffer];
      if (dualList.length > 1 && boundingBox) {
        try {
          embBufs.push(await cropToBoundingBox(queryBuffer, boundingBox));
        } catch {
          // cropped variant is best-effort
        }
      }
      const embs = await jinaEmbedImages(embBufs, 'retrieval.query');
      queryEmbs.push(...embs);
    } catch (err: any) {
      console.log('[Visual Retrieval] Jina query embedding failed (hash-only):', err?.message?.slice(0, 80));
    }
  }
  return rankByVisualFeatures(dualList, queryEmbs);
}

// Normalize any image input (data-URL, raw base64, or remote http URL) into
// { data: <pure base64>, mimeType } ready for the Gemini API.
async function normalizeImageInput(
  imageBase64?: string,
  mimeType?: string
): Promise<{ data: string; mimeType: string; buffer: Buffer } | null> {
  if (!imageBase64 || typeof imageBase64 !== 'string' || imageBase64.trim().length < 20) {
    return null;
  }
  const trimmed = imageBase64.trim();
  let rawBuffer: Buffer;
  let rawMime = mimeType || 'image/jpeg';

  // Remote URL (e.g. preset sample images) -> fetch server-side
  if (/^https?:\/\//i.test(trimmed)) {
    const resp = await fetch(trimmed);
    if (!resp.ok) {
      throw new Error('دانلود تصویر نمونه از اینترنت ناموفق بود. لطفاً تصویر را مستقیماً آپلود کنید.');
    }
    rawBuffer = Buffer.from(await resp.arrayBuffer());
    if (rawBuffer.length > 12 * 1024 * 1024) {
      throw new Error('حجم تصویر بیش از حد مجاز (۱۲ مگابایت) است.');
    }
    const contentType = resp.headers.get('content-type');
    if (contentType) rawMime = contentType.split(';')[0].trim();
  } else {
    // data-URL (data:image/png;base64,....) -> strip prefix, detect mime
    const dataUrlMatch = trimmed.match(/^data:([^;,]+)?(;base64)?,(.*)$/s);
    if (dataUrlMatch) {
      rawMime = dataUrlMatch[1] || rawMime;
      rawBuffer = Buffer.from(dataUrlMatch[3], 'base64');
    } else {
      rawBuffer = Buffer.from(trimmed, 'base64');
    }
  }

  // Pre-optimize image to max 480x480 JPEG with sharp: reduces payload by up to 95%
  // while retaining sharp edge details for teeth, markings, and profiles.
  try {
    const optimized = await sharp(rawBuffer)
      .resize(480, 480, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();
    return {
      data: optimized.toString('base64'),
      mimeType: 'image/jpeg',
      buffer: optimized,
    };
  } catch {
    return {
      data: rawBuffer.toString('base64'),
      mimeType: rawMime,
      buffer: rawBuffer,
    };
  }
}

// Strip markdown code fences (```json ... ```) that models sometimes wrap around JSON
function stripJsonFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

interface VisualVerificationVerdict {
  candidateCode: string;
  verdict: 'exact_match' | 'very_similar' | 'different';
  visualExplanation: string;
  matchScore: number;
}

interface VisualVerificationResponse {
  candidateVerdicts: VisualVerificationVerdict[];
  catalogAvailability: {
    status: 'confirmed_in_catalog' | 'similar_in_catalog' | 'custom_order_available';
    statusFarsiTitle: string;
    statusFarsiMessage: string;
  };
}

// Verification model cascade: accuracy-critical step, prefer the strongest
// vision models before falling back to lighter ones.
const VERIFICATION_MODELS = [
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
];

// Verify ONE candidate against the user's photo in its own isolated AI call.
// Isolated single-pair comparison eliminates the image/code mix-ups that
// happen when several candidate images share one prompt.
async function verifySingleCandidate(
  ai: GoogleGenAI,
  userJpg: Buffer,
  candJpg: Buffer,
  cand: any,
  whatYouSee: string
): Promise<VisualVerificationVerdict | null> {
  const parts: any[] = [
    {
      text: `تصویر شماره ۱: عکس واقعی ارسالی کاربر از یک قطعه صنعتی (ممکن است روی دستگاه یا در کارگاه باشد).
توضیح آنچه کاربر فرستاده: ${whatYouSee || 'قطعه صنعتی'}

تصویر شماره ۲: عکس رسمی یکی از کالاهای کاتالوگ هایپر صنعت اطلس

شما سیستم راستی‌آزمایی بصری تخصصی اطلس هستید. سیاست ما «تطابق صددرصدی» است:
- "exact_match": فقط وقتی که در تصویر ۲ «عیناً همان قطعه فیزیکی» تصویر ۱ است؛ فرم هندسی، تعداد و الگوی دندانه/شیار/پره/سوراخ، نسبت‌های ابعادی و جزئیات ساختاری کاملاً منطبق (زاویه دوربین، نور و پس‌زمینه ممکن است فرق کند، ولی خود جسم یکی است).
- اسم و کد کالا در اینجا اصلاً اعلام نشده چون ملاک نیست؛ قضاوت فقط بر اساس مقایسه چشمی خود دو تصویر است.
- "very_similar": هم‌خانواده و نزدیک است ولی عین همان قطعه نیست (اختلاف در تعداد دندانه/پره، قطر، طول، عرض یا جزئیات ساختاری).
- "different": از نظر ظاهری و ساختاری اصلاً همان قطعه نیست.

قوانین حیاتی:
(۱) فقط بر اساس مقایسه بصری این دو تصویر قضاوت کن؛ نام و توضیحات کاتالوگ ملاک نیست.
(۲) شک داری = exact_match نده! هرگز به صرف هم‌خانواده بودن یا کاربرد مشابه، exact_match نده.
(۳) اختلاف ابعادی یعنی exact_match نیست.

پاسخ صرفاً JSON معتبر:
{
  "verdict": "exact_match" | "very_similar" | "different",
  "visualExplanation": "توضیح چشمی کوتاه به فارسی: چه چیزهایی دقیقاً منطبق‌اند یا چه فرقی دارند",
  "matchScore": عدد بین ۰ تا ۹۹ (exact_match: ۹۰ تا ۹۹، very_similar: ۶۰ تا ۸۷، different: زیر ۵۰)
}`,
    },
    { inlineData: { mimeType: 'image/jpeg', data: userJpg.toString('base64') } },
    { inlineData: { mimeType: 'image/jpeg', data: candJpg.toString('base64') } },
  ];

  try {
    const { text, model } = await generateWithModelCascade(
      ai,
      [{ role: 'user', parts }],
      { responseMimeType: 'application/json' },
      `Visual Verify ${cand.code}`,
      VERIFICATION_MODELS,
      25000
    );
    const parsed = JSON.parse(stripJsonFences(text));
    const verdict = parsed?.verdict;
    if (verdict === 'exact_match' || verdict === 'very_similar' || verdict === 'different') {
      return {
        candidateCode: cand.code,
        verdict,
        visualExplanation: parsed.visualExplanation || '',
        matchScore: Math.min(Math.max(Math.round(parsed.matchScore || 50), 0), 99),
      };
    }
    return null;
  } catch (err: any) {
    console.log(`[Visual Verify ${cand.code}] failed: ${err?.message?.slice(0, 80)}`);
    return null;
  }
}

// Second opinion: an independent fresh look at a claimed exact match.
// If the second opinion disagrees, the candidate is downgraded — we only
// keep exact matches that survive both checks.
async function confirmExactMatch(
  ai: GoogleGenAI,
  userJpg: Buffer,
  candJpg: Buffer
): Promise<boolean> {
  const parts: any[] = [
    {
      text: `دو تصویر از قطعات صنعتی دارید: تصویر ۱ عکس واقعی کاربر، تصویر ۲ عکس رسمی یک کالای کاتالوگ.
آیا در تصویر ۲ همان مدل محصولی دیده می‌شود که در تصویر ۱ هست؟
منظو از «همان مدل» این است که طراحی و ساختار کلی (فرم هندسی، الگوی پره/دندانه/شیار، نوع اتصالات، نسبت‌های کلی) یکی باشد؛ زاویه دوربین، نور، پس‌زمینه، کیفیت عکس و میزان ساییدگی/کهنگی می‌تواند متفاوت باشد و مانع تشخیص نیست.
قضاوت فقط بر اساس ظاهر خود تصاویر باشد؛ به هیچ اسم، کد یا توضیحی اتکا نکن.
اگر طراحی یا ساختار قطعه واقعاً فرق دارد (مثلاً تعداد پره‌ها یا نوع دندانه متفاوت است)، جواب false است. اگر شک داری، جواب false است.
پاسخ صرفاً JSON: {"samePhysicalPart": true/false, "reason": "دلیل کوتاه فارسی"}`,
    },
    { inlineData: { mimeType: 'image/jpeg', data: userJpg.toString('base64') } },
    { inlineData: { mimeType: 'image/jpeg', data: candJpg.toString('base64') } },
  ];

  try {
    const { text } = await generateWithModelCascade(
      ai,
      [{ role: 'user', parts }],
      { responseMimeType: 'application/json' },
      'Exact Confirm',
      VERIFICATION_MODELS,
      25000
    );
    const parsed = JSON.parse(stripJsonFences(text));
    return parsed?.samePhysicalPart === true;
  } catch {
    return false;
  }
}

// Third independent vote used when the first verification says "exact" but the
// second opinion disagrees. Two of three votes win.
async function tieBreakExactMatch(
  ai: GoogleGenAI,
  userJpg: Buffer,
  candJpg: Buffer
): Promise<boolean> {
  const parts: any[] = [
    {
      text: `تصویر ۱: عکس واقعی یک قطعه صنعتی که کاربر فرستاده (ممکن است زاویه، نور و پس‌زمینه غیرحرفه‌ای داشته باشد).
تصویر ۲: عکس رسمی یک محصول در کاتالوگ فروشگاه.
سؤال: آیا تصویر ۲ همان مدل محصول تصویر ۱ است؟ (یعنی اگر مشتری این را سفارش دهد، همان چیزی می‌گیرد که در عکس خودش دارد)
معیار: طراحی، فرم و ساختار قطعه در دو عکس باید یکی باشد؛ تفاوت‌های زاویه، نور، رنگ پس‌زمینه، ساییدگی و کیفیت عکس جزئی و طبیعی است و رد نمی‌کند.
اگر ساختار یا طراحی متفاوت است (تعداد پره/دندانه/شیار یا فرم کلی دیگر)، false بده. شک داری = false.
پاسخ صرفاً JSON: {"sameProductModel": true/false, "reason": "دلیل کوتاه فارسی"}`,
    },
    { inlineData: { mimeType: 'image/jpeg', data: userJpg.toString('base64') } },
    { inlineData: { mimeType: 'image/jpeg', data: candJpg.toString('base64') } },
  ];

  try {
    const { text } = await generateWithModelCascade(
      ai,
      [{ role: 'user', parts }],
      { responseMimeType: 'application/json' },
      'Tie Break',
      VERIFICATION_MODELS,
      25000
    );
    const parsed = JSON.parse(stripJsonFences(text));
    return parsed?.sameProductModel === true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AI CATALOG BROWSING (montage round)
// When the first verification finds no exact match, global image features may
// simply be too polluted (busy workshop scenes, wild lighting) to rank the
// true part in the top-14. Instead of giving up, we let Gemini visually SCAN
// a much wider slice of the catalog: 8x8 grids of numbered thumbnails built
// from the best raw / color / combined ranked lists. The model picks items
// that are the same product or the same visual family; those picks then go
// through the normal one-by-one verification.
// ─────────────────────────────────────────────────────────────────────────────

const MONTAGE_GRID_COLS = 8;
const MONTAGE_GRID_ROWS = 8;
const MONTAGE_CELL_PX = 130;
const MONTAGE_POOL_MAX = 128;
const MONTAGE_PICKS_MAX = 8;

function catalogItemByCodeRef(code: string): CatalogItem | null {
  const needle = code.trim().toLowerCase();
  for (const item of CATALOG_ITEMS) {
    if ((item.code || '').trim().toLowerCase() === needle) return item;
  }
  return null;
}

// Build the montage browsing pool from the retrieval ranked lists:
// shape (raw) gets the deepest slice because shape survives lighting changes,
// then part-color, then the blended distance. Already-verified candidates
// (the top union pool) are excluded — they had their chance.
function buildMontagePool(
  visualRes: VisualCandidateResult,
  excludeCodes: Set<string>
): RankedItemRef[] {
  const pool: RankedItemRef[] = [];
  const seen = new Set<string>(excludeCodes);
  const push = (r: RankedItemRef | undefined) => {
    if (!r || !r.code || pool.length >= MONTAGE_POOL_MAX) return;
    const key = r.code.trim().toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    pool.push(r);
  };
  for (let i = 0; i < 64 && pool.length < MONTAGE_POOL_MAX; i++) {
    push(visualRes.rankedRaw?.[i]);
    if (i < 48) push(visualRes.rankedCol?.[i]);
    if (i < 48) push(visualRes.rankedEmb?.[i]);
    if (i < 32) push(visualRes.rankedCombined?.[i]);
  }
  return pool;
}

// Render one 8x8 numbered grid of catalog thumbnails as a JPEG buffer.
async function renderMontageGrid(refs: RankedItemRef[]): Promise<Buffer> {
  const W = MONTAGE_GRID_COLS * MONTAGE_CELL_PX;
  const H = MONTAGE_GRID_ROWS * MONTAGE_CELL_PX;
  const comps: OverlayOptions[] = [];
  let badges = '';
  for (let i = 0; i < refs.length && i < MONTAGE_GRID_COLS * MONTAGE_GRID_ROWS; i++) {
    const col = i % MONTAGE_GRID_COLS;
    const row = Math.floor(i / MONTAGE_GRID_COLS);
    const x = col * MONTAGE_CELL_PX;
    const y = row * MONTAGE_CELL_PX;
    const imgBuf = await getCatalogImageBuffer(refs[i].image);
    if (imgBuf) {
      try {
        const thumb = await sharp(imgBuf)
          .resize(MONTAGE_CELL_PX - 2, MONTAGE_CELL_PX - 2, { fit: 'inside' })
          .flatten({ background: '#ffffff' })
          .png()
          .toBuffer();
        comps.push({ input: thumb, left: x + 1, top: y + 1 });
      } catch {
        // unreadable cell -> left blank
      }
    }
    badges +=
      `<rect x="${x + 2}" y="${y + 2}" width="34" height="24" fill="#ffffff" stroke="#000000" stroke-width="1.5" rx="3"/>` +
      `<text x="${x + 19}" y="${y + 20}" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="bold" fill="#000000" text-anchor="middle">${i + 1}</text>`;
  }
  const overlay = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${badges}</svg>`
  );
  comps.push({ input: overlay, left: 0, top: 0 });
  return sharp({ create: { width: W, height: H, channels: 3, background: '#f0f0f0' } })
    .composite(comps)
    .jpeg({ quality: 82 })
    .toBuffer();
}

// One Gemini call per grid: the model browses the grid next to the user photo
// and returns the numbered cells that are the same product / same family.
async function browseOneMontageGrid(
  ai: GoogleGenAI,
  userJpg: Buffer,
  gridJpg: Buffer,
  cellCount: number,
  whatYouSee: string,
  detectedPartType: string
): Promise<{ n: number; kind: string }[]> {
  const parts: any[] = [
    {
      text: `تصویر شماره ۱: عکس واقعی ارسالی مشتری از یک قطعه صنعتی (ممکن است در کارگاه، با نور و زاویه نامناسب گرفته شده باشد).
توضیح مشتری/هوش مصنوعی از قطعه: ${whatYouSee || detectedPartType || 'قطعه صنعتی'}

تصویر شماره ۲: شبکه ${MONTAGE_GRID_ROWS}×${MONTAGE_GRID_COLS} از عکس‌های رسمی کاتالوگ هایپر صنعت اطلس — هر خانه یک کالا و شماره خانه در گوشه بالا-چپ همان خانه نوشته شده (۱ تا ${cellCount}).

وظیفه تو: مثل یک کارشناس، کاتالوگ را «چشمی» مرور کن و خانه‌هایی را پیدا کن که محصول آن خانه از نظر ظاهری به قطعه تصویر ۱ مربوط است:
- "same_product": عین همان مدل است — طراحی، فرم هندسی، الگوی دندانه/شیار/پره و نسبت‌ها کاملاً منطبق (زاویه، نور، رنگ نورپردازی و پس‌زمینه می‌تواند فرق کند).
- "same_family": هم‌نوع و هم‌خانواده ظاهری است (هر دو مثلاً واشر تخت‌اند، هر دو تسمه‌اند، هر دو پولی‌اند...) ولی عین همان مدل نیست.
- اگر خانه‌ای هیچ ربط ظاهری به قطعه نداشت، اصلاً در پاسخ نیاور.

قوانین:
(۱) فقط و فقط بر اساس مقایسه چشمی خود تصاویر قضاوت کن؛ هیچ اسم و کد و توضیحی ملاک نیست.
(۲) شماره خانه‌ها را دقیق بخوان و فقط شماره‌های معتبر بین ۱ تا ${cellCount} بده.
(۳) حداکثر ۶ خانه انتخاب کن. اگر هیچ خانه‌ای نزدیک نبود، آرایه خالی بده — چیزی را از سر بابت نچین.

پاسخ صرفاً JSON معتبر:
{"picks": [{"n": <شماره خانه>, "kind": "same_product" | "same_family"}]}`,
    },
    { inlineData: { mimeType: 'image/jpeg', data: userJpg.toString('base64') } },
    { inlineData: { mimeType: 'image/jpeg', data: gridJpg.toString('base64') } },
  ];

  try {
    const { text, model } = await generateWithModelCascade(
      ai,
      [{ role: 'user', parts }],
      { responseMimeType: 'application/json' },
      'Montage Browse',
      GEMINI_MODELS,
      45000
    );
    const parsed = JSON.parse(stripJsonFences(text));
    const picksRaw = Array.isArray(parsed?.picks) ? parsed.picks : [];
    const picks = picksRaw
      .map((p: any) => ({ n: Math.round(Number(p?.n)), kind: String(p?.kind || 'same_family') }))
      .filter((p: any) => Number.isFinite(p.n) && p.n >= 1 && p.n <= cellCount && (p.kind === 'same_product' || p.kind === 'same_family'))
      .slice(0, 6);
    console.log(`[Montage Browse] model=${model} picks=${JSON.stringify(picks)}`);
    return picks;
  } catch (err: any) {
    console.log(`[Montage Browse] grid call failed: ${err?.message?.slice(0, 90)}`);
    return [];
  }
}

// Full montage round: build pool -> render grids -> browse -> map picks to
// catalog candidate objects (ready for one-by-one verification).
async function montageBrowseCatalog(
  ai: GoogleGenAI,
  userImageBuffer: Buffer,
  whatYouSee: string,
  detectedPartType: string,
  visualRes: VisualCandidateResult,
  excludeCodes: Set<string>
): Promise<any[]> {
  const pool = buildMontagePool(visualRes, excludeCodes);
  if (pool.length === 0) return [];
  console.log(`[AI Search] Montage catalog browsing over ${pool.length} items (deeper ranked lists)...`);

  const userJpg = await sharp(userImageBuffer)
    .resize(480, 480, { fit: 'inside' })
    .jpeg({ quality: 85 })
    .toBuffer();

  const perGrid = MONTAGE_GRID_COLS * MONTAGE_GRID_ROWS;
  const pickedRefs: { ref: RankedItemRef; kind: string }[] = [];
  const pickedCodes = new Set<string>(excludeCodes);
  for (let g = 0; g * perGrid < pool.length && pickedRefs.length < MONTAGE_PICKS_MAX; g++) {
    const chunk = pool.slice(g * perGrid, (g + 1) * perGrid);
    const gridJpg = await renderMontageGrid(chunk);
    const picks = await browseOneMontageGrid(ai, userJpg, gridJpg, chunk.length, whatYouSee, detectedPartType);
    for (const p of picks) {
      const ref = chunk[p.n - 1];
      if (!ref) continue;
      const key = ref.code.trim().toLowerCase();
      if (pickedCodes.has(key)) continue;
      pickedCodes.add(key);
      pickedRefs.push({ ref, kind: p.kind });
      if (pickedRefs.length >= MONTAGE_PICKS_MAX) break;
    }
  }
  if (pickedRefs.length === 0) return [];

  // Map picked refs to full candidate objects (same shape as retrieval candidates)
  const candidates: any[] = [];
  for (const { ref, kind } of pickedRefs) {
    const item = catalogItemByCodeRef(ref.code);
    if (!item) continue;
    // carry the deep-embedding similarity so downstream quality gates and
    // scoring treat montage picks exactly like any other candidate
    const embRef = (visualRes.rankedEmb || []).find(
      r => String(r.code || '').trim().toLowerCase() === item.code.trim().toLowerCase()
    );
    candidates.push({
      code: item.code,
      name: item.name,
      forzaCode: item.forzaCode,
      brand: brandForCatalogItem(item),
      categorySlug: item.categorySlug,
      categoryName: item.categoryName,
      subcategory: item.subcategory,
      cataloguePage: item.page,
      image: item.image,
      similarityScore: 55,
      matchReason:
        kind === 'same_product'
          ? '🎯 انتخاب هوش مصنوعی هنگام مرور چشمی کاتالوگ (ادعای هم‌مدل — در حال راستی‌آزمایی)'
          : '⚡ انتخاب هوش مصنوعی هنگام مرور چشمی کاتالوگ (هم‌خانواده ظاهری — در حال راستی‌آزمایی)',
      specs: [],
      price: item.price,
      stock: item.stock,
      isVisualMatch: true,
      visualDistance: 999,
      embSim: embRef ? Number((1 - embRef.distance).toFixed(4)) : undefined,
      montagePicked: true,
    });
  }
  return candidates;
}

// Side-by-side visual comparison between real-world photo and official catalog photos.
// Verifies up to 8 candidates, each in its own parallel AI call, then double-checks
// every claimed exact match with an independent second opinion.
async function verifyCandidatesVisually(
  ai: GoogleGenAI,
  userImageBuffer: Buffer,
  userImageMime: string,
  candidates: any[],
  whatYouSee: string,
  detectedPartType: string
): Promise<VisualVerificationResponse | null> {
  if (!candidates || candidates.length === 0) return null;

  try {
    // 1. Prepare user image resized to max 480x480 JPEG
    const userJpg = await sharp(userImageBuffer)
      .resize(480, 480, { fit: 'inside' })
      .jpeg({ quality: 85 })
      .toBuffer();

    // 2. Deduplicate candidates by code and cap at 8
    const seenCodes = new Set<string>();
    const uniqueCandidates = candidates.filter(c => {
      const key = (c.code || '').toLowerCase();
      if (!key || seenCodes.has(key)) return false;
      seenCodes.add(key);
      return true;
    }).slice(0, 14);

    // 3. Load + resize candidate images (aliases resolved)
    const prepared: { cand: any; jpg: Buffer }[] = [];
    for (const cand of uniqueCandidates) {
      const candBuf = await getCatalogImageBuffer(cand.image);
      if (!candBuf) continue;
      try {
        const candJpg = await sharp(candBuf)
          .resize(440, 440, { fit: 'inside' })
          .jpeg({ quality: 82 })
          .toBuffer();
        prepared.push({ cand, jpg: candJpg });
      } catch (e) {
        console.warn(`[Visual Verification] Sharp resize failed for ${cand.code}:`, e);
      }
    }
    if (prepared.length === 0) return null;

    console.log(`[Visual Verification] Verifying ${prepared.length} candidates one-by-one (concurrency-limited)...`);

    // 4. First pass: isolated verification of every candidate.
    //    Concurrency is limited (3 at a time, staggered) to avoid API rate
    //    limits (429) that would force fallbacks to weaker models.
    const verdicts: VisualVerificationVerdict[] = [];
    const CONCURRENCY = 3;
    for (let i = 0; i < prepared.length; i += CONCURRENCY) {
      const chunk = prepared.slice(i, i + CONCURRENCY);
      const chunkResults = await Promise.all(
        chunk.map(async ({ cand, jpg }, j) => {
          if (j > 0) await new Promise(r => setTimeout(r, j * 350));
          return verifySingleCandidate(ai, userJpg, jpg, cand, whatYouSee || detectedPartType || '');
        })
      );
      for (const v of chunkResults) {
        if (v) verdicts.push(v);
      }
    }
    if (verdicts.length === 0) return null;

    // 5. Second pass: independent confirmation of every claimed exact match
    const exactVerdicts = verdicts.filter(v => v.verdict === 'exact_match');
    const confirmed: { v: VisualVerificationVerdict; ok: boolean }[] = [];
    for (let i = 0; i < exactVerdicts.length; i++) {
      const v = exactVerdicts[i];
      const p = prepared.find(x => x.cand.code === v.candidateCode);
      if (!p) {
        confirmed.push({ v, ok: false });
        continue;
      }
      const ok = await confirmExactMatch(ai, userJpg, p.jpg);
      confirmed.push({ v, ok });
    }

    for (const { v, ok } of confirmed) {
      if (!ok) {
        // Disagreement -> third independent vote (2 of 3 win)
        const p = prepared.find(x => x.cand.code === v.candidateCode);
        const tie = p ? await tieBreakExactMatch(ai, userJpg, p.jpg) : false;
        if (tie) {
          console.log(`[Visual Verification] Tie-break CONFIRMED exact match for ${v.candidateCode} (2 of 3 votes)`);
        } else {
          console.log(`[Visual Verification] Second opinion + tie-break rejected exact claim for ${v.candidateCode} — downgraded to very_similar`);
          v.verdict = 'very_similar';
          v.matchScore = Math.min(v.matchScore, 87);
          v.visualExplanation = v.visualExplanation
            ? `${v.visualExplanation} (راستی‌آزمایی تکمیلی، قطعیت انطباق را تأیید نکرد — به‌عنوان مشابه دسته‌بندی شد)`
            : 'راستی‌آزمایی تکمیلی، قطعیت انطباق را تأیید نکرد — به‌عنوان مشابه دسته‌بندی شد';
        }
      }
    }

    // Deep-embedding evidence override: lightweight fallback models
    // occasionally reject the TRUE match ("different") because of background,
    // watermark or lighting differences between the customer photo and the
    // catalog shot. When the deep visual engine is extremely confident
    // (cosine >= 0.95), the rejection is overridden to "very_similar" so the
    // item stays visible as a similar card (and can still be promoted to
    // exact by the arbitration below). Vision-model confirmation remains the
    // only path to an exact_match verdict.
    for (const v of verdicts) {
      if (v.verdict !== 'different') continue;
      const p = prepared.find(x => x.cand.code === v.candidateCode);
      const embSim = p?.cand?.embSim;
      if (typeof embSim === 'number' && embSim >= 0.95) {
        console.log(
          `[Visual Verification] Embedding evidence override: ${v.candidateCode} rejected as "different" but deep-visual similarity is ${embSim.toFixed(3)} -> kept as very_similar`
        );
        v.verdict = 'very_similar';
        v.matchScore = Math.min(92, Math.round(embSim * 100));
        v.visualExplanation = `موتور بینایی عمیق شباهت ظاهری بسیار بالا (${Math.round(embSim * 100)}٪) برای این کالا ثبت کرده است`;
      }
    }

    // Rank-1 retrieval candidate with a near-miss verdict gets one arbitration
    // vote. Weaker models are occasionally too strict about angle/lighting on
    // the true match, so strong retrieval evidence (clearly the closest catalog
    // image) lowers the score threshold for asking the arbitrator.
    const rank1 = verdicts.find(v => v.candidateCode === (prepared[0]?.cand.code || ''));
    if (rank1 && rank1.verdict === 'very_similar') {
      const rank1Dist = prepared[0]?.cand?.visualDistance ?? 999;
      const rank2Dist = prepared[1]?.cand?.visualDistance ?? 999;
      const margin = rank2Dist - rank1Dist;
      const strongRetrieval = rank1Dist <= 0.35 || margin >= 0.03;
      const threshold = strongRetrieval ? 70 : 80;
      if (rank1.matchScore >= threshold) {
        const tie = await tieBreakExactMatch(ai, userJpg, prepared[0].jpg);
        if (tie) {
          console.log(
            `[Visual Verification] Rank-1 arbitration CONFIRMED exact match for ${rank1.candidateCode} (score=${rank1.matchScore}, dist=${rank1Dist}, margin=${margin.toFixed(3)})`
          );
          rank1.verdict = 'exact_match';
          rank1.matchScore = Math.max(rank1.matchScore, 90);
        } else {
          console.log(
            `[Visual Verification] Rank-1 arbitration rejected exact match for ${rank1.candidateCode} (score=${rank1.matchScore}, dist=${rank1Dist})`
          );
        }
      }
    }

    const hasExact = verdicts.some(v => v.verdict === 'exact_match');
    const availability = {
      status: (hasExact ? 'confirmed_in_catalog' : 'custom_order_available') as
        'confirmed_in_catalog' | 'similar_in_catalog' | 'custom_order_available',
      statusFarsiTitle: hasExact
        ? 'تأیید شد: عین همین قطعه در کاتالوگ اطلس موجود است'
        : 'عین این قطعه در کاتالوگ فعلی موجود نیست — می‌توانیم برایتان بسازیم',
      statusFarsiMessage: hasExact
        ? 'راستی‌آزمایی تصویری مستقیم هوش مصنوعی تأیید کرد که این کالا در کاتالوگ اطلس موجود و آماده سفارش است.'
        : 'هیچ‌کدام از تصاویر کاتالوگ انطباق صددرصدی با عکس شما نداشت؛ کارگاه تخصصی هایپر صنعت اطلس توانایی ساخت یا تأمین سفارشی همین قطعه را دارد.',
    };

    console.log(`[Visual Verification] Done: ${verdicts.filter(v => v.verdict === 'exact_match').length} exact, ${verdicts.filter(v => v.verdict === 'very_similar').length} similar, ${verdicts.filter(v => v.verdict === 'different').length} different`);
    return { candidateVerdicts: verdicts, catalogAvailability: availability };
  } catch (err: any) {
    console.error('[Visual Verification] Process error:', err);
  }
  return null;
}

// POST: /api/ai/analyze-part
// stage: 'quick'   = image-only instant identification (step 1)
//        'refined' = image + dimensions + application (steps 2-3)
app.post('/api/ai/analyze-part', async (req, res) => {
  const reqStage: 'quick' | 'refined' = req.body?.stage === 'quick' ? 'quick' : 'refined';
  try {
    const {
      imageBase64,
      mimeType = 'image/jpeg',
      length,
      width,
      pitch,
      application,
      features,
    } = req.body;

    const apiKey = getGeminiKey();

    const numLength = length ? parseFloat(length) : undefined;
    const numWidth = width ? parseFloat(width) : undefined;
    const numPitch = pitch ? parseFloat(pitch) : undefined;

    // Normalize the image once for both AI analysis and direct visual search
    const normalizedImage = await normalizeImageInput(imageBase64, mimeType);

    // Direct visual search: is this EXACT product photo already on the site?
    // (works offline too - no API key needed)
    let visualCandidateResult: VisualCandidateResult = { candidates: [], exactVisualMatch: false, bestDistance: 999, rankedCombined: [], rankedCol: [], rankedRaw: [], rankedEmb: [] };
    if (normalizedImage) {
      visualCandidateResult = await getVisualCandidateResult(normalizedImage.buffer);
    }

    const visualMatches = visualCandidateResult.candidates;
    if (visualMatches.length > 0) {
      console.log(
        `[AI Search] visual candidates: ${visualMatches.map(v => `${v.code}@${v.visualDistance}`).join(', ')} (exact=${visualCandidateResult.exactVisualMatch})`
      );
    }

    // If no API key, return algorithmic visual-first matching across the 864 products
    if (!apiKey) {
      // STRICT 100% POLICY (offline mode, no AI key):
      // Without Gemini we can only trust the perceptual-hash EXACT duplicate
      // detector (user re-uploaded a catalog image). Anything looser than an
      // exact hash hit is NOT proven to be the same part -> custom order.
      const exactHashMatches = (visualCandidateResult.candidates || []).filter(
        c => c.visualDistance <= VISUAL_DUPLICATE_MAX
      );
      const noKeyExact = exactHashMatches.length > 0;

      const mappedNoKey = exactHashMatches.map(m => ({
        ...m,
        distinction: 'عیناً همان تصویر کاتالوگ',
        visualVerdict: 'exact_match' as const,
        visualVerdictFarsi: 'همونه (انطباق مستقیم قطعی)',
        visualExplanation: 'تصویر ارسالی شما عیناً با تصویر این کالا در کاتالوگ هایپر صنعت اطلس مطابقت دارد.',
      }));

      return res.json({
        success: true,
        isAiGenerated: false,
        stage: reqStage,
        fallbackNotice: noKeyExact
          ? undefined
          : 'کلید هوش مصنوعی (GEMINI_API_KEY) تنظیم نشده است؛ فقط تطابق تصویری دقیق (عین عکس کاتالوگ) قابل تأیید بود و عین این قطعه در کاتالوگ یافت نشد. برای تحلیل هوشمند عکس دنیای واقعی، کلید را در فایل .env تنظیم کنید.',
        summary: {
          detectedPartType: noKeyExact ? mappedNoKey[0].name : 'قطعه صنعتی خطوط تولید',
          detectedProfile: noKeyExact
            ? `عیناً همین کالا در سایت موجود است (${mappedNoKey[0].code})`
            : numLength
              ? `انطباق با ابعاد ${numLength}×${numWidth || 50}mm`
              : 'قطعه خارج از کاتالوگ فعلی',
          visualAnalysis: noKeyExact
            ? 'عکس ارسالی شما عیناً با تصویر یکی از کالاهای سایت مطابقت دارد و همان محصول در صدر نتایج نمایش داده شد.'
            : 'موتور تطبیق تصویری آفلاین، عکس شما را با تمام تصاویر کاتالوگ مقایسه کرد و هیچ انطباق قطعی یافت نشد؛ بنابراین عین این قطعه در کاتالوگ فعلی موجود نیست.',
          confidence: noKeyExact ? 99 : 55,
          exactVisualMatch: noKeyExact,
          catalogAvailability: noKeyExact
            ? {
                status: 'confirmed_in_catalog',
                statusFarsiTitle: 'تأیید شد: عین همین قطعه در کاتالوگ اطلس موجود است (همونه)',
                statusFarsiMessage: 'تصویر ارسالی شما عیناً با تصویر این کالا در کاتالوگ مطابقت دارد.',
              }
            : {
                status: 'custom_order_available',
                statusFarsiTitle: 'عین این قطعه در کاتالوگ فعلی موجود نیست — می‌توانیم برایتان بسازیم',
                statusFarsiMessage: 'موتور تطبیق تصویری، هیچ انطباق قطعی با کالاهای کاتالوگ پیدا نکرد. کارگاه تخصصی هایپر صنعت اطلس توانایی ساخت یا تأمین سفارشی همین قطعه را دارد.',
              },
        },
        matchedProducts: mappedNoKey,
        rejectedCandidates: [],
        technicalAdvice: 'برای تضمین دقت عملکرد، قبل از ثبت سفارش ابعاد و فاصله مراکز پولی را مجدداً اندازه‌گیری نمایید.',
      });
    }

    // Call Gemini API server-side using @google/genai
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const stageInstruction = reqStage === 'quick'
      ? 'حالت شناسایی فوری از روی تصویر: کاربر فقط تصویر فرستاده و هنوز ابعاد یا مشخصاتی وارد نکرده است. صرفاً با اتکا به درک بصری تصویر، قطعه را شناسایی کن؛ اگر ابعادی لازم داری از روی تناسبات تصویر و استانداردهای رایج تخمین بزن و در تحلیل ذکر کن که تخمینی است.'
      : 'حالت تحلیل دقیق نهایی: کاربر علاوه بر تصویر، ابعاد و مشخصات فنی هم وارد کرده است. این اعداد اعلامی را در اولویت تطبیق قرار بده و نتیجه تصویر را با آن‌ها راستی‌آزمایی کن؛ در صورت مغایرت، مغایرت را صریحاً در visualAnalysis ذکر کن.';

    const promptText = `
شما مهندس ارشد متالورژی و بینایی ماشین هایپر صنعت اطلس هستید.
کاربر تصویری از یک قطعه صنعتی بارگذاری کرده است.
هدف اساسی و اولویت مطلق سیستم:
«تطبیق باید دقیقاً بر اساس ظاهر فیزیکی، فرم، شکل هندسی، دندانه و عکس خود کالا در کاتالوگ انجام شود؛ نه بر اساس عناوین یا متون کلی».

${stageInstruction}

مشخصات تکمیلی احتمالی وارد شده توسط کاربر:
- طول اعلامی: ${numLength ? numLength + ' میلی‌متر' : 'مشخص نشده (از روی تصویر و استانداردها تخمین بزنید)'}
- عرض اعلامی: ${numWidth ? numWidth + ' میلی‌متر' : 'مشخص نشده'}
- گام / ضخامت: ${numPitch ? numPitch + ' میلی‌متر' : 'مشخص نشده'}
- کاربرد اعلامی کاربر: ${application || 'خطوط تولید کاشی و سرامیک / ماشین‌آلات صنعتی'}
- ویژگی‌های خاص مدنظر: ${features || 'استاندارد، دوام بالا در خط کارخانه'}

دستورالعمل‌های حیاتی برای بررسی تصویر:
۱. تحلیل دقیق بصری تصویر (واقعاً به تصویر نگاه کن و توصیف کن چه می‌بینی):
   - visualShape: ساختار و هندسه کلی قطعه را به عنوان یکی از این مقادیر دقیق مشخص کن:
     "pulley_wheel" | "timing_belt" | "v_belt" | "bushing_coupling" | "tensioner_bracket" | "suction_pad" | "impeller_propeller" | "guide_rail_profile" | "roller_pin" | "brush_cleaner" | "diaphragm_pump" | "bearing_housing" | "general_part"
   - objectColor: رنگ قالب بدنه قطعه در عکس (black, white_cream, yellow_orange, red, green, metallic_grey, blue, other)
   - detectedCodeOnPart: هرگونه عدد، شماره فنی یا کدی که روی قطعه یا بسته‌بندی یا کاتالوگ آن در تصویر چاپ یا حک شده (مثلاً 1000 0 1، 1000 9 1، 35154، 6001، 8M، T10 یا AT-E...). در صورت عدم وجود، رشته خالی بگذارید.
   - نوع دقیق قطعه: (تسمه تایمینگ دندانه‌دار، پولی تفلون POM، بوش و کوپلینگ خاری، کشنده رگلاژ، پین سر رولر، پروانه همزن لعاب، لاستیک مکنده، دیافراگم، و ...)
   - متریال و جنس: (پلی‌یورتان PU، لاستیک NBR، تفلون POM، آلومینیوم، فولاد، سیلیکون، ...)
   - مشخصات هندسی: (دندانه گرد HTD، دندانه ذوزنقه‌ای T/AT، سوراخ‌دار، خاردار، مقطع V شکل، پره‌ای و ...)
   - اگر تصویر اصلاً قطعه صنعتی نیست، در visualAnalysis اعلام کنید و confidence را زیر ۵۰ قرار دهید.
۲. موقعیت قطعه روی تصویر:
   محل قرارگیری قطعه اصلی را با یک کادر (bounding box) نرمال‌شده ۰ تا ۱۰۰۰ مشخص کن.
۳. شرط مقایسه اقلام مشابه:
   تفاوت ظریف ظاهری این قطعه با مدل‌های مشابه را در distinction شرح دهید.

لطفاً پاسخ را صرفاً در یک ساختار معتبر JSON به زبان فارسی و با کلیدهای زیر برگردانید (بدون هیچ متن اضافه خارج از JSON):
{
  "whatYouSee": "در یک جمله فارسی بگو دقیقاً در تصویر چه می‌بینی (مثلاً: یک پولی سفید تفلونی با شیار جانبی و سوراخ شفت مرکزی)",
  "visualShape": "pulley_wheel | timing_belt | v_belt | bushing_coupling | tensioner_bracket | suction_pad | impeller_propeller | guide_rail_profile | roller_pin | brush_cleaner | diaphragm_pump | bearing_housing | general_part",
  "objectColor": "black | white_cream | yellow_orange | red | green | metallic_grey | blue | other",
  "detectedCodeOnPart": "کد یا عدد خوانده‌شده از تصویر (در صورت عدم وجود، رشته خالی)",
  "detectedPartType": "نام دقیق فارسی قطعه (مثلاً: پولی تفلون هرزگرد / بوش لاستیکی کوپلینگ خاری / کشنده تسمه)",
  "partFamilyFarsi": "نام کوتاه خانواده قطعه به فارسی، فقط ۱ تا ۲ کلمه (مثلاً: چرخ‌دهنده، پولی، تسمه، بوش کوپلینگ، رولر، پروانه، برس، دیافراگم)",
  "detectedProfile": "پروفیل یا استاندارد قطعه (مثلاً HTD-8M یا DIN 1000 یا مقطع B)",
  "material": "جنس قطعه (مثلاً تفلون POM / پلی‌یورتان / لاستیک فشرده / آلومینیوم)",
  "visualAnalysis": "تحلیل تخصصی و جامع هندسه، دندانه‌ها، رنگ، مقطع و مشاهدات بصری تصویر",
  "confidence": 95,
  "boundingBox": {"x_min": 0, "y_min": 0, "x_max": 1000, "y_max": 1000},
  "searchKeywords": ["کلمه۱", "کلمه۲"],
  "suggestedForzaCode": "کد تخمینی کاتالوگ در صورت وجود",
  "distinction": "توضیح تفاوت ظاهری با مدل‌های مشابه",
  "technicalAdvice": "توصیه مهندسی برای نصب یا تعویض این قطعه در خط تولید"
}
`;

    const contents: any[] = [];
    const parts: any[] = [];

    if (normalizedImage) {
      parts.push({
        inlineData: {
          mimeType: normalizedImage.mimeType,
          data: normalizedImage.data,
        },
      });
    }

    parts.push({ text: promptText });
    contents.push({ role: 'user', parts });

    // Execute AI vision analysis through reliable multi-model cascade
    const { text: responseText, model: usedModel } = await generateWithModelCascade(
      ai,
      contents,
      { responseMimeType: 'application/json' },
      'AI Search'
    );

    console.log(`[AI Search] stage=${reqStage} model=${usedModel} image=${normalizedImage ? 'yes' : 'no'}`);

    let parsedResult: any;
    try {
      parsedResult = JSON.parse(stripJsonFences(responseText));
    } catch {
      const jsonMatch = stripJsonFences(responseText).match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('قالب پاسخ هوش مصنوعی نامعتبر بود');
      }
    }

    // 1. Candidate Retrieval — PURE VISUAL:
    // Rank ALL catalog images by perceptual similarity to the user's photo
    // (full image + the AI-detected part region cropped out). Names, codes,
    // categories and dimensions play NO role — that data is unreliable.
    let mergedCandidates: any[] = [];
    let exactVisualMatch = false;
    let visualRes: VisualCandidateResult | null = null;

    if (normalizedImage) {
      // Validate the AI-detected bounding box (normalized 0..1000) first
      let bboxForRetrieval: NormBox | undefined;
      const bb0 = parsedResult.boundingBox;
      if (
        bb0 &&
        [bb0.x_min, bb0.y_min, bb0.x_max, bb0.y_max].every((v: any) => typeof v === 'number' && v >= 0 && v <= 1000) &&
        bb0.x_max > bb0.x_min &&
        bb0.y_max > bb0.y_min
      ) {
        bboxForRetrieval = { x_min: bb0.x_min, y_min: bb0.y_min, x_max: bb0.x_max, y_max: bb0.y_max };
      }

      visualRes = await getVisualCandidateResult(normalizedImage.buffer, bboxForRetrieval);
      mergedCandidates = visualRes.candidates;
      exactVisualMatch = visualRes.exactVisualMatch;
      console.log(
        `[AI Search] Pure-visual retrieval: ${mergedCandidates.length} candidates (duplicate=${exactVisualMatch}, bestDist=${visualRes.bestDistance.toFixed(4)})`
      );
    } else {
      // Without a photo there is nothing visual to match on — catalog text
      // (names/codes) is unreliable, so no matches are returned at all.
      mergedCandidates = [];
    }

    // 2. Perform Side-by-Side Visual Verification with Gemini Vision on Candidates
    let verificationResponse: VisualVerificationResponse | null = null;
    if (normalizedImage && mergedCandidates.length > 0) {
      console.log(`[AI Search] Running side-by-side visual verification on ${mergedCandidates.length} candidate images...`);
      verificationResponse = await verifyCandidatesVisually(
        ai,
        normalizedImage.buffer,
        normalizedImage.mimeType,
        mergedCandidates,
        parsedResult.whatYouSee || '',
        parsedResult.detectedPartType || ''
      );
    }

    // 2b. AI CATALOG BROWSING (montage round). When the first verification
    // found no exact match, the retrieval features were probably polluted by
    // the customer's workshop scene. Let Gemini visually scan a much wider
    // slice of the catalog in 8x8 thumbnail grids and pick same-product /
    // same-family items; the picks are then verified one-by-one like any
    // other candidate, so nothing unverified can reach the customer.
    if (
      normalizedImage &&
      visualRes &&
      !exactVisualMatch &&
      !(verificationResponse?.candidateVerdicts || []).some(v => v.verdict === 'exact_match')
    ) {
      try {
        const excludeCodes = new Set<string>(
          mergedCandidates.map((m: any) => String(m.code || '').trim().toLowerCase()).filter(Boolean)
        );
        const montagePicks = await montageBrowseCatalog(
          ai,
          normalizedImage.buffer,
          parsedResult.whatYouSee || '',
          parsedResult.detectedPartType || '',
          visualRes,
          excludeCodes
        );
        if (montagePicks.length > 0) {
          console.log(
            `[AI Search] Montage browsing picked ${montagePicks.length} extra candidates: ${montagePicks.map((p: any) => p.code).join(', ')}`
          );
          const montageVerification = await verifyCandidatesVisually(
            ai,
            normalizedImage.buffer,
            normalizedImage.mimeType,
            montagePicks,
            parsedResult.whatYouSee || '',
            parsedResult.detectedPartType || ''
          );
          if (montageVerification) {
            mergedCandidates = [...mergedCandidates, ...montagePicks];
            const priorVerdicts = verificationResponse?.candidateVerdicts || [];
            const allVerdicts = [...priorVerdicts, ...montageVerification.candidateVerdicts];
            verificationResponse = {
              candidateVerdicts: allVerdicts,
              catalogAvailability: allVerdicts.some(v => v.verdict === 'exact_match')
                ? montageVerification.catalogAvailability
                : verificationResponse?.catalogAvailability || montageVerification.catalogAvailability,
            };
          }
        } else {
          console.log('[AI Search] Montage browsing found no additional candidates.');
        }
      } catch (mErr: any) {
        console.warn('[AI Search] Montage catalog browsing failed (non-fatal):', mErr?.message || mErr);
      }
    }

    // Map candidate verdicts
    const verdictMap = new Map<string, {
      verdict: 'exact_match' | 'very_similar' | 'different';
      verdictFarsi: string;
      visualExplanation: string;
      matchScore: number;
    }>();

    if (verificationResponse?.candidateVerdicts) {
      for (const cv of verificationResponse.candidateVerdicts) {
        const verdict = cv.verdict || 'different';
        const verdictFarsi =
          verdict === 'exact_match'
            ? 'همونه (انطباق مستقیم قطعی)'
            : verdict === 'very_similar'
            ? 'شبیهه (مدل مشابه و جایگزین)'
            : 'فرق داره (ساختار متفاوت)';

        verdictMap.set(cv.candidateCode.toLowerCase(), {
          verdict,
          verdictFarsi,
          visualExplanation: cv.visualExplanation || '',
          matchScore: Math.min(Math.max(Math.round(cv.matchScore || 50), 10), 99),
        });
      }
    }

    // Process all candidates with comparative verification data
    const allProcessed = mergedCandidates.map((m, idx) => {
      const v = verdictMap.get(m.code.toLowerCase());
      if (v) {
        return {
          ...m,
          similarityScore: v.matchScore,
          visualVerdict: v.verdict,
          visualVerdictFarsi: v.verdictFarsi,
          visualExplanation: v.visualExplanation,
          verificationConfidence: v.matchScore,
          matchReason: v.verdict === 'exact_match'
            ? `🎯 تأیید راستی‌آزمایی بصری: ${v.visualExplanation}`
            : v.verdict === 'very_similar'
            ? `⚡ مدل مشابه و جایگزین: ${v.visualExplanation}`
            : `تفاوت ساختاری: ${v.visualExplanation}`,
          distinction: v.visualExplanation || (idx === 1 ? 'مدل جایگزین استاندارد در کاتالوگ اطلس' : 'منطبق بر مشخصات'),
        };
      }
      // No verdict (online verification unavailable for this candidate):
      // fall back to the deep-embedding similarity as the best available
      // visual signal. Items the embedding model does not consider a close
      // visual match are NOT shown to the customer as similar products.
      const embSim = typeof m.embSim === 'number' ? m.embSim : -1;
      const embScore = embSim >= 0.9 ? Math.min(92, Math.round(embSim * 100)) : null;
      return {
        ...m,
        similarityScore: embScore ?? m.similarityScore ?? 75,
        visualVerdict: 'very_similar' as 'exact_match' | 'very_similar' | 'different',
        visualVerdictFarsi: 'شبیهه (مدل مشابه استاندارد)',
        visualExplanation:
          embScore !== null
            ? 'شبیه‌ترین کالا از نظر موتور بینایی عمیق (شباهت ظاهری بالا)'
            : 'بر اساس تشابه مشخصات فنی در کاتالوگ اطلس',
        verificationConfidence: embScore ?? m.similarityScore ?? 75,
        distinction: idx === 1 ? 'مدل جایگزین استاندارد در کاتالوگ اطلس' : 'منطبق بر مشخصات',
        unverified: true,
      };
    });

    // If exact visual duplicate was detected by dHash (the user's photo IS a
    // catalog image, e.g. a screenshot/re-upload), force top verdict to exact_match
    if (exactVisualMatch && allProcessed.length > 0) {
      allProcessed[0].visualVerdict = 'exact_match';
      allProcessed[0].visualVerdictFarsi = 'همونه (انطباق مستقیم قطعی)';
      allProcessed[0].similarityScore = 99;
      allProcessed[0].verificationConfidence = 99;
    }

    // STRICT 100% POLICY:
    // Only candidates verified as "exact_match" (the very same physical part)
    // may be returned as the customer's part. "very_similar" and "different"
    // are both treated as NOT the same part — they go to the rejected list so
    // we never hand the customer a lookalike product "out of thin air".
    const exactMatches = allProcessed.filter(
      p => p.visualVerdict === 'exact_match' && (p.similarityScore || 0) >= 88
    );
    // Genuinely resembling alternatives (NOT the exact part) — shown separately,
    // clearly labelled. Structurally different items are never sent to the client.
    const similarCandidates = allProcessed
      .filter(p => {
        if (p.visualVerdict !== 'very_similar') return false;
        // Verified by the online vision model -> trusted similar item.
        if (!p.unverified) return true;
        // Unverified (AI offline or call failed): require a confident
        // deep-embedding similarity so we never show unrelated products as
        // "similar" — montage picks are no exception; a weak model browsing
        // the grid can pick wrong cells, the embedding gate catches that.
        return typeof p.embSim === 'number' && p.embSim >= 0.9;
      })
      .sort((a, b) => (b.similarityScore || 0) - (a.similarityScore || 0))
      .slice(0, 4);

    // Sort exact matches: deep-embedding similarity dominates the ordering
    // (weighted blend, model score as a small tiebreaker). Weak verification
    // models produce noisy scores (e.g. 98 vs 95); the embedding-nearest item
    // is almost always the true match, so it must be shown first.
    exactMatches.sort((a, b) => {
      const orderKey = (p: any) =>
        typeof p.embSim === 'number'
          ? p.embSim * 100 + (p.similarityScore || 0) * 0.25
          : (p.similarityScore || 0);
      return orderKey(b) - orderKey(a);
    });

    let finalMatches: typeof allProcessed;
    let catalogAvailability: any;

    if (exactMatches.length > 0) {
      // The exact part IS in the catalog: return only the exact matches.
      finalMatches = exactMatches.slice(0, 4);
      catalogAvailability = {
        status: 'confirmed_in_catalog',
        statusFarsiTitle: 'تأیید شد: عین همین قطعه در کاتالوگ هایپر صنعت اطلس موجود است (همونه)',
        statusFarsiMessage: 'راستی‌آزمایی تصویری مستقیم هوش مصنوعی تأیید کرد که عکس شما عیناً همین کالا در کاتالوگ اطلس است و آماده سفارش می‌باشد.',
      };
    } else {
      // The exact part is NOT in the catalog: say so honestly.
      // NO product is returned as "the customer's part" — instead we offer
      // to manufacture/source it as a custom order.
      finalMatches = [];

      // Special case: the image does not appear to contain an industrial part at all
      const aiConfidence = typeof parsedResult.confidence === 'number' ? parsedResult.confidence : 70;
      const looksLikeNotAPart =
        aiConfidence < 50 && /صنعتی نیست|قطعه نیست|نامشخص/.test(
          `${parsedResult.detectedPartType || ''} ${parsedResult.visualAnalysis || ''}`
        );

      if (looksLikeNotAPart) {
        catalogAvailability = {
          status: 'custom_order_available',
          statusFarsiTitle: 'تصویر ارسالی قطعه صنعتی شناسایی نشد',
          statusFarsiMessage: 'به نظر می‌رسد تصویر ارسالی یک قطعه صنعتی نیست. لطفاً عکس واضح‌تری از خود قطعه (از نزدیک و روی سطح مشخص) بارگذاری کنید.',
        };
      } else {
        catalogAvailability = verificationResponse?.catalogAvailability?.status === 'custom_order_available'
          ? verificationResponse.catalogAvailability
          : {
              status: 'custom_order_available',
              statusFarsiTitle: 'عین این قطعه در کاتالوگ فعلی موجود نیست — می‌توانیم برایتان بسازیم',
              statusFarsiMessage: similarCandidates.length > 0
                ? `عینِ همین قطعه در کاتالوگ موجود نیست؛ اما شبیه‌ترین ${parsedResult.partFamilyFarsi || 'اقلام'}‌ها در بخش «این ${parsedResult.partFamilyFarsi || 'اقلام'}‌ها را داریم» قابل سفارش هستند. اگر عین همین قطعه را می‌خواهید، کارگاه تخصصی هایپر صنعت اطلس توانایی ساخت یا تأمین سفارشی آن را دارد.`
                : `هوش مصنوعی عکس شما را از نظر ظاهری با کالاهای کاتالوگ مقایسه کرد و هیچ‌یک انطباق صددرصدی نداشت. کارگاه تخصصی هایپر صنعت اطلس توانایی ساخت یا تأمین سفارشی همین قطعه را دارد.`,
            };
      }
    }

    // Validate bounding box (normalized 0..1000) if the model returned one
    let boundingBox: { x_min: number; y_min: number; x_max: number; y_max: number } | undefined;
    const bb = parsedResult.boundingBox;
    if (
      bb &&
      [bb.x_min, bb.y_min, bb.x_max, bb.y_max].every((v: any) => typeof v === 'number' && v >= 0 && v <= 1000) &&
      bb.x_max > bb.x_min &&
      bb.y_max > bb.y_min
    ) {
      boundingBox = { x_min: bb.x_min, y_min: bb.y_min, x_max: bb.x_max, y_max: bb.y_max };
    }

    const topScore = finalMatches.length > 0 ? finalMatches[0].similarityScore : 0;

    return res.json({
      success: true,
      isAiGenerated: true,
      stage: reqStage,
      model: usedModel,
      summary: {
        whatYouSee: parsedResult.whatYouSee || '',
        detectedPartType: parsedResult.detectedPartType || 'قطعه صنعتی کاتالوگ اطلس',
        partFamilyFarsi: parsedResult.partFamilyFarsi || '',
        detectedProfile: parsedResult.detectedProfile || 'استاندارد کارخانجات صنعتی',
        material: parsedResult.material || 'متریال صنعتی استاندارد',
        visualAnalysis: parsedResult.visualAnalysis || 'تصویر قطعه با الگوریتم بینایی ماشین بررسی و با کاتالوگ تطبیق داده شد.',
        confidence: exactVisualMatch
          ? 99
          : finalMatches.length > 0
            ? topScore || 95
            : Math.min(Math.max(Math.round(parsedResult.confidence || 70), 40), 92),
        boundingBox,
        exactVisualMatch: exactVisualMatch || finalMatches.length > 0,
        catalogAvailability,
        verifiedCandidateCount: mergedCandidates.length,
      },
      matchedProducts: finalMatches,
      similarCandidates,
      rejectedCandidates: [],
      technicalAdvice: parsedResult.technicalAdvice || 'قبل از نصب، از هم‌راستایی فولی‌ها و عدم لنگی شفت اطمینان حاصل فرمایید.',
    });
  } catch (error: any) {
    // Graceful fallback: STRICT 100% POLICY applies here too.
    // Without a successful AI run we only trust the perceptual-hash EXACT
    // duplicate detector. No lookalike products are ever returned.
    const numLength = req.body?.length ? parseFloat(req.body.length) : undefined;
    const numWidth = req.body?.width ? parseFloat(req.body.width) : undefined;
    const numPitch = req.body?.pitch ? parseFloat(req.body.pitch) : undefined;

    console.error('[AI Search] Falling back to offline exact-visual matching:', error?.message, error?.aiDetail || '');

    let catchVisualRes: VisualCandidateResult = { candidates: [], exactVisualMatch: false, bestDistance: 999, rankedCombined: [], rankedCol: [], rankedRaw: [], rankedEmb: [] };
    try {
      const catchImage = await normalizeImageInput(req.body?.imageBase64, req.body?.mimeType);
      if (catchImage) {
        catchVisualRes = await getVisualCandidateResult(catchImage.buffer);
      }
    } catch {
      // ignore
    }

    const catchExact = catchVisualRes.exactVisualMatch;
    const exactFallback = (catchVisualRes.candidates || []).filter(c => c.visualDistance <= VISUAL_DUPLICATE_MAX);

    const mergedFallback = exactFallback.map(m => ({
      ...m,
      distinction: 'عیناً همان تصویر کاتالوگ',
      visualVerdict: 'exact_match' as const,
      visualVerdictFarsi: 'همونه (انطباق مستقیم قطعی)',
      visualExplanation: 'تصویر ارسالی شما عیناً با تصویر این کالا در کاتالوگ مطابقت دارد.',
    }));

    // Offline similar-tier: even without the online AI, the visual retrieval
    // engine (perceptual hashes + deep embeddings) can rank the catalog by
    // visual appearance. Show the closest items as orderable similar cards
    // so the customer still gets «این ...ها را داریم» instead of nothing.
    // Order by deep-embedding similarity first (the strongest visual signal),
    // falling back to blended hash distance for items without embeddings.
    const embRankMap = new Map(
      (catchVisualRes.rankedEmb || []).map((r, i) => [String(r.code || '').trim().toLowerCase(), i])
    );
    const similarFallback = (catchVisualRes.candidates || [])
      .filter(c => (c.visualDistance ?? 999) > VISUAL_DUPLICATE_MAX)
      .sort((a, b) => {
        const ra = embRankMap.get(String(a.code || '').trim().toLowerCase()) ?? 9999;
        const rb = embRankMap.get(String(b.code || '').trim().toLowerCase()) ?? 9999;
        if (ra !== rb) return ra - rb;
        return (a.visualDistance ?? 999) - (b.visualDistance ?? 999);
      })
      // Only items the deep-embedding model considers a close visual match —
      // anything else (e.g. a photo that is not an industrial part) gets the
      // honest "not in catalog, we can build it" answer instead of noise.
      .filter(c => typeof c.embSim === 'number' && c.embSim >= 0.9)
      .slice(0, 4)
      .map(m => ({
        ...m,
        similarityScore: Math.min(92, Math.round((m.embSim as number) * 100)),
        visualVerdict: 'very_similar' as const,
        visualVerdictFarsi: 'شبیهه (مدل مشابه استاندارد)',
        visualExplanation: 'شبیه‌ترین کالای کاتالوگ از نظر ظاهر (موتور بینایی عمیق)',
        distinction: 'شبیه‌ترین کالای کاتالوگ از نظر ظاهری',
      }));

    return res.json({
      success: true,
      isAiGenerated: false,
      stage: reqStage,
      fallbackNotice: catchExact
        ? 'تحلیل کامل هوش مصنوعی موقتاً در دسترس نبود؛ تطابق تصویری دقیق (عین عکس کاتالوگ) انجام شد.'
        : similarFallback.length > 0
        ? 'تحلیل کامل هوش مصنوعی موقتاً در دسترس نبود؛ شبیه‌ترین کالاهای کاتالوگ از نظر ظاهری (موتور تطبیق تصویری آفلاین) نمایش داده شد.'
        : 'تحلیل کامل هوش مصنوعی موقتاً در دسترس نبود و موتور تطبیق تصویری آفلاین هیچ انطباق قطعی با کاتالوگ پیدا نکرد.',
      summary: {
        detectedPartType: catchExact ? mergedFallback[0].name : 'قطعه تخصصی صنعتی خطوط تولید',
        detectedProfile: catchExact
          ? `عیناً همین کالا در سایت موجود است (${mergedFallback[0].code})`
          : numLength
            ? `انطباق با ابعاد ${numLength}×${numWidth || 50}mm`
            : 'قطعه خارج از کاتالوگ فعلی',
        visualAnalysis: catchExact
          ? 'عکس ارسالی شما عیناً با تصویر یکی از کالاهای سایت مطابقت دارد و همان محصول در صدر نتایج نمایش داده شد.'
          : similarFallback.length > 0
          ? 'تحلیل بصری آفلاین انجام شد؛ عین این قطعه به‌صورت قطعی در کاتالوگ تأیید نشد، اما شبیه‌ترین کالاهای کاتالوگ از نظر ظاهری در بخش مشابه‌ها نمایش داده شد.'
          : 'تحلیل بصری آفلاین انجام شد و هیچ انطباق قطعی با کالاهای کاتالوگ یافت نشد؛ عین این قطعه در کاتالوگ فعلی موجود نیست.',
        confidence: catchExact ? 99 : 55,
        exactVisualMatch: catchExact,
        catalogAvailability: {
          status: catchExact ? 'confirmed_in_catalog' : 'custom_order_available',
          statusFarsiTitle: catchExact
            ? 'تأیید شد: انطباق مستقیم با عکس کالای کاتالوگ (همونه)'
            : 'عین این قطعه در کاتالوگ فعلی موجود نیست — می‌توانیم برایتان بسازیم',
          statusFarsiMessage: catchExact
            ? 'تصویر ارسالی عیناً با عکس ثبت‌شده این کالا در کاتالوگ اطلس مطابقت دارد.'
            : similarFallback.length > 0
            ? 'عینِ همین قطعه به‌صورت قطعی تأیید نشد؛ اما شبیه‌ترین کالاهای کاتالوگ از نظر ظاهری در بخش مشابه‌ها قابل سفارش هستند. اگر عین همین قطعه را می‌خواهید، کارگاه تخصصی هایپر صنعت اطلس توانایی ساخت یا تأمین سفارشی آن را دارد.'
            : 'هیچ انطباق قطعی با کالاهای کاتالوگ یافت نشد؛ کارگاه تخصصی هایپر صنعت اطلس توانایی ساخت یا تأمین سفارشی همین قطعه را دارد.',
        },
      },
      matchedProducts: mergedFallback,
      similarCandidates: similarFallback,
      rejectedCandidates: [],
      technicalAdvice: 'برای تضمین دقت عملکرد، قبل از ثبت سفارش ابعاد و فاصله مراکز پولی را مجدداً اندازه‌گیری نمایید.',
    });
  }
});

// High quality offline fallback generator for specialized engineering queries
function getOfflineReply(q: string) {
  const lower = (q || '').toLowerCase();
  if (lower.includes('کوره') || lower.includes('کاشی') || lower.includes('سرامیک') || lower.includes('حرارت')) {
    return {
      reply: `### راهنمای مهندسی خطوط کاشی و سرامیک (کوره‌های رولری و خطوط پخت):\n\n۱. **تسمه‌های تایمینگ حرارتی و جوشی:** برای خطوط لعاب و کوره‌های رولری کاشی و سرامیک، تسمه‌های پلی‌یورتان (PU) مقاوم به حرارت با مغزی کورد استیل تقویت‌شده برندهای **SWR آلمان** و **FORZA ایتالیا** مناسب‌ترین گزینه هستند که تا دمای ۲۰۰ درجه سانتی‌گراد را بدون افت گشتاور و کشسانی تحمل می‌کنند.\n\n۲. **رولیک‌ها و قطعات سرامیکی:** رولیک‌های سرامیکی مقاوم به شوک‌های دمایی شدید و رولیک‌های تفلونی ضدسایش در ابعاد استاندارد خطوط ساکمی (Sacmi)، سیستم (System) و نانچانگ در انبار مرکزی هایپر صنعت اطلس یزد موجود می‌باشد.\n\n۳. **تسمه‌های وی‌بلت مقطع SPB و SPC:** برای الکتروموتورهای فن کوره و درایوهای سنگین با مقاطع روکش‌دار ضدروغن و ضداستاتیک توصیه می‌گردد.`,
      suggestedAction: {
        label: 'مشاهده محصولات صنایع کاشی و سرامیک',
        link: '/category/ceramic-tiles',
      },
      category: 'ceramic',
    };
  } else if (lower.includes('محاسبه') || lower.includes('طول') || lower.includes('فرمول') || lower.includes('فاصله') || lower.includes('پولی')) {
    return {
      reply: `### فرمول استاندارد محاسبات طول تسمه و انتقال قدرت:\n\n**فرمول استاندارد طول اسمی تسمه باز (Pitch Length - $L_p$):**\n$$\\text{L}_p \\approx 2C + 1.57(D + d) + \\frac{(D - d)^2}{4C}$$\n\n- **$C$:** فاصله مراکز دو شفت (میلیمتر)\n- **$D$:** قطر گام پولی بزرگ (میلیمتر)\n- **$d$:** قطر گام پولی کوچک (میلیمتر)\n\n**نسبت دور (Speed Ratio):** $i = \\frac{D}{d} = \\frac{n_1}{n_2}$\n\n*نکته فنی مهندسی:* برای مقاطع تسمه V-Belt (SPZ, SPA, SPB, SPC) توصیه می‌شود همیشه فاصله محوری را طوری تنظیم نمایید که حداقل ۵٪ قابلیت رگلاژ و سفت‌کردن تسمه در طول دوره کارکرد فراهم باشد.`,
      suggestedAction: {
        label: 'مشاهده پولی‌ها و تسمه‌های V-Belt',
        link: '/category/pulleys-taperlock',
      },
      category: 'calculation',
    };
  } else if (lower.includes('forza') || lower.includes('swr') || lower.includes('نمایندگی') || lower.includes('قیمت') || lower.includes('پیش‌فاکتور')) {
    return {
      reply: `### نمایندگی رسمی و استعلام قیمت برندهای انحصاری اطلس:\n\nشرکت بازرگانی و هایپر صنعت اطلس **نماینده رسمی و انحصاری برند SWR آلمان** (انواع تسمه‌های تایمینگ، وی‌بلت روکش‌دار و شیاردار PK/PJ) و **برند FORZA ایتالیا** (پولی‌های چدنی، تفلونی، بوش‌های مخروطی تیپرلاک و اتصالات) در ایران است.\n\n- **مزایای خرید سازمانی:** صدور رسمی فاکتور مودیان با احتساب ارزش افزوده، ارائه سرتیفیکیت اصالت کالا، تحویل سریع از انبار یزد و تخفیف‌های تیراژ بالا برای کارخانجات تولیدی.\n- برای صدور فوری پیش‌فاکتور رسمی، می‌توانید از دکمه درخواست پیش‌فاکتور استفاده کرده یا لیست اقلام خود را از طریق واتس‌اپ برای واحد فروش ارسال فرمایید.`,
      suggestedAction: {
        label: 'مشاهده محصولات انحصاری SWR و FORZA',
        link: '/category/swr-forza-exclusive',
      },
      category: 'pricing',
    };
  } else if (lower.includes('نساجی') || lower.includes('بافندگی') || lower.includes('ریسندگی')) {
    return {
      reply: `### راهکارهای تخصصی ماشین‌آلات نساجی و ریسندگی:\n\nبرای ماشین‌آلات بافندگی (سولزر، پیگانول، وندویل و دورنیه) و دستگاه‌های ریسندگی:\n\n۱. **تسمه‌های تخت انتقال قدرت بالا (Flat Belts):** دارای لایه میانی پلی‌آمید با روکش چرم طبیعی یا لاستیک NBR ضداستاتیک جهت جلوگیری از تجمع پرز و الکتریسیته ساکن.\n۲. **تسمه‌های تایمینگ دوطرف دنده (Double Sided):** گام‌های 8M و 14M با کورد ضدکشیدگی کولار یا استیل.\n۳. **بلبرینگ‌های دوربالا:** بلبرینگ‌های دور بالای با لقی C3 و محافظ گردوغبار 2RS.`,
      suggestedAction: {
        label: 'مشاهده تجهیزات صنایع نساجی',
        link: '/category/textile-machinery',
      },
      category: 'textile',
    };
  } else {
    return {
      reply: `### تحلیل فنی و مهندسی بازرگانی اطلس:\n\nبا توجه به شرایط کاری خطوط صنعتی و استانداردهای بین‌المللی (DIN 2215، DIN 7753، ISO 5296 و RMA):\n\n- **انتخاب مقطع و دندانه:** تعیین مقطع تسمه بر اساس توان نامی الکتروموتور (kW) و سرعت دوران پولی کوچک (RPM) انجام می‌گیرد.\n- **روکش‌های محافظ:** برای محیط‌های روغنی، شیمیایی یا پر گردوغبار استفاده از روکش‌های کلروپرن تقویت‌شده و ضدالکتریسیته ساکن (Anti-static) الزامی است.\n- در صورت نیاز به بررسی دقیق‌تر نقشه یا پلاک فنی، می‌توانید تصویر قطعه را از طریق آیکون دوربین آپلود نمایید تا انطباق هندسی دقیق انجام گردد.`,
      suggestedAction: {
        label: 'مشاهده کل کاتالوگ تسمه و پولی',
        link: '/category/industrial-belts',
      },
      category: 'general',
    };
  }
}

// POST: /api/ai/consult
app.post('/api/ai/consult', async (req, res) => {
  try {
    const { query, history } = req.body;
    const apiKey = getGeminiKey();

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (!apiKey) {
      const off = getOfflineReply(query);
      return res.json({
        reply: off.reply,
        suggestedAction: off.suggestedAction,
        category: off.category,
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemPrompt = `شما «مشاور ارشد مهندسی و بازرگانی هایپر صنعت اطلس» هستید؛ بزرگ‌ترین مرجع تأمین تسمه‌های صنعتی، پولی، بلبرینگ و قطعات خطوط تولید کارخانجات از سال ۱۳۶۶ و نماینده انحصاری برندهای SWR آلمان و FORZA ایتالیا در ایران.

اصول پاسخ‌دهی شما:
۱. کاملاً تخصصی، مهندسی، موثق و محترمانه به زبان فارسی پاسخ دهید.
۲. از ساختاربندی زیبا (تیترها، شماره‌گذاری، بولت‌پوینت، اصطلاحات استاندارد مانند DIN, ISO, HTD, SPZ, SPA, SPB, SPC, PK, PJ) استفاده کنید.
۳. در صورت نیاز به فرمول یا روابط ریاضی (مانند محاسبه طول تسمه، نسبت دور، گشتاور)، رابطه را شفاف بنویسید.
۴. در پایان پیشنهاد دهید کاربر کاتالوگ را بررسی کند یا در صورت نیاز به پیش‌فاکتور رسمی اقدام نماید.
۵. پاسخ‌ها بین ۲ تا ۴ پاراگراف شیک و کاربردی باشد.`;

    const contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const h of history.slice(-6)) {
        if (h.sender === 'user' || h.role === 'user') {
          contents.push({ role: 'user', parts: [{ text: h.text }] });
        } else if (h.sender === 'ai' || h.role === 'model') {
          contents.push({ role: 'model', parts: [{ text: h.text }] });
        }
      }
    }

    contents.push({
      role: 'user',
      parts: [
        {
          text: `${systemPrompt}\n\nپرسش یا درخواست مشتری:\n"${query}"`,
        },
      ],
    });

    let replyText = '';
    try {
      const { text } = await generateWithModelCascade(
        ai,
        contents,
        undefined,
        'AI Consult'
      );
      replyText = text;
    } catch {
      // smooth fallback below
    }

    if (!replyText) {
      const off = getOfflineReply(query);
      return res.json({
        reply: off.reply,
        suggestedAction: off.suggestedAction,
        category: off.category,
      });
    }

    // Determine smart suggested action based on query text
    let suggestedAction = {
      label: 'مشاهده دسته‌بندی محصولات',
      link: '/category/industrial-belts',
    };

    const ql = query.toLowerCase();
    if (ql.includes('پولی') || ql.includes('فلکه') || ql.includes('تیپرلاک') || ql.includes('بوش')) {
      suggestedAction = {
        label: 'مشاهده پولی‌ها و بوش‌های تیپرلاک FORZA',
        link: '/category/pulleys-taperlock',
      };
    } else if (ql.includes('تایم') || ql.includes('شیاردار') || ql.includes('v-belt') || ql.includes('وی بلت')) {
      suggestedAction = {
        label: 'مشاهده انواع تسمه‌های صنعتی SWR',
        link: '/category/industrial-belts',
      };
    } else if (ql.includes('بلبرینگ') || ql.includes('یاتاقان') || ql.includes('رولبرینگ')) {
      suggestedAction = {
        label: 'مشاهده بلبرینگ‌ها و یاتاقان‌های صنعتی',
        link: '/category/bearings',
      };
    } else if (ql.includes('کاشی') || ql.includes('سرامیک') || ql.includes('کوره')) {
      suggestedAction = {
        label: 'مشاهده قطعات صنایع کاشی و سرامیک',
        link: '/category/ceramic-tiles',
      };
    } else if (ql.includes('پیش‌فاکتور') || ql.includes('قیمت') || ql.includes('استعلام')) {
      suggestedAction = {
        label: 'درخواست پیش‌فاکتور و استعلام قیمت',
        link: '/inquiry',
      };
    }

    return res.json({
      reply: replyText,
      suggestedAction,
    });
  } catch (err: any) {
    return res.json({
      reply: 'با توجه به ماهیت کاربری در خطوط صنعتی، استفاده از تسمه‌ها و قطعات اورجینال مقاوم به سایش و حرارت با ضریب کشش استاندارد توصیه می‌گردد. جهت استعلام دقیق ابعاد و سفارش به بخش محصولات یا تماس با ما مراجعه فرمایید.',
      suggestedAction: {
        label: 'مشاهده محصولات',
        link: '/category/industrial-belts',
      },
    });
  }
});

// Buffer cache for ultra-fast progressive TTS synthesis
const ttsBufferCache = new Map<string, Buffer>();

// POST: /api/ai/consult-stream - Real-time progressive streaming SSE endpoint for Engineering Desk & Voice Audio
app.post('/api/ai/consult-stream', async (req, res) => {
  const { query, history, responseId: clientResponseId, userTurnId: clientTurnId, includeAudio } = req.body;
  const responseId = clientResponseId || `resp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const userTurnId = clientTurnId || `turn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  console.log(`[AI_GENERATION_START] userTurnId=${userTurnId} responseId=${responseId} mode=desk endpoint=/api/ai/consult-stream model=gemini-3.8-flash timestamp=${new Date().toISOString()}`);

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Content-Encoding', 'none');
  res.flushHeaders?.();

  const sendEvent = (data: any) => {
    try {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      (res as any).flush?.();
    } catch {}
  };

  sendEvent({ type: 'start', responseId, timestamp: Date.now() });

  const apiKey = getGeminiKey();
  if (!apiKey) {
    const off = getOfflineReply(query || '');
    sendEvent({ type: 'text_chunk', responseId, chunk: off.reply, textSoFar: off.reply });
    if (includeAudio) {
      try {
        const audioBuf = await generatePersianMaleSpeechEdge(cleanPersianTextForVoice(off.reply));
        if (audioBuf) {
          sendEvent({
            type: 'audio_chunk',
            responseId,
            phraseIndex: 0,
            phraseText: off.reply.slice(0, 80),
            audioBase64: `data:audio/mp3;base64,${audioBuf.toString('base64')}`,
            mimeType: 'audio/mp3',
          });
        }
      } catch {}
    }
    sendEvent({
      type: 'done',
      responseId,
      fullText: off.reply,
      suggestedAction: off.suggestedAction,
    });
    return res.end();
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const systemPrompt = `شما «مشاور ارشد مهندسی و بازرگانی هایپر صنعت اطلس» هستید؛ بزرگ‌ترین مرجع مهندسی و تأمین تسمه‌های صنعتی، پولی، بلبرینگ و قطعات خطوط تولید کارخانجات از سال ۱۳۶۶ و نماینده انحصاری برندهای SWR آلمان و FORZA ایتالیا در ایران.

دستورالعمل ویژه سرعت پاسخ و ساختار مهندسی:
۱. جمله اول باید یک عبارت کوتاه و مستقیم فنی (زیر ۱۰ کلمه) باشد؛ مثلاً: «سلام و درود، مهندس گرامی؛ بررسی مشخصات فنی درخواست شما:» یا «بررسی فنی استاندارد تسمه مورد نظر شما:». این عبارت کوتاه برای شروع بلادرنگ صوت فیستوفیس در کمتر از ۳۸۰ میلی‌ثانیه حیاتی است.
۲. بلافاصله مشخصات فنی و استانداردهای صنعتی مرتبط را بیان کنید (مانند استانداردهای DIN 2215 برای وی‌بلت ساده، DIN 7753 برای وی‌بلت باریک SPZ/SPA/SPB/SPC، ISO 4184، DIN 7721 و ISO 5296 برای تسمه‌های تایمینگ HTD، و DIN 7867 برای تسمه‌های شیاردار PK/PJ).
۳. یک جدول مقایسه‌ای استاندارد در قالب Markdown با ستون‌های مشخصات فنی، ابعاد (عرض، ضخامت، گام)، کد فنی معادل در کاتالوگ اطلس، متریال (EPDM / PU / کلروپرن با کورد استیل یا کولار) و برندهای انحصاری SWR آلمان و FORZA ایتالیا درج نمایید.
۴. در صورت نیاز به فرمول یا محاسبه (طول گام، نسبت تبدیل دور یا گشتاور)، رابطه ریاضی را شفاف بنویسید.
۵. در پایان نحوه استعلام فوری قیمت یا صدور پیش‌فاکتور رسمی را اعلام فرمایید.`;

    const contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const h of history.slice(-6)) {
        if (h.sender === 'user' || h.role === 'user') {
          contents.push({ role: 'user', parts: [{ text: h.text }] });
        } else if (h.sender === 'ai' || h.role === 'model') {
          contents.push({ role: 'model', parts: [{ text: h.text }] });
        }
      }
    }

    contents.push({
      role: 'user',
      parts: [
        {
          text: `${systemPrompt}\n\nپرسش یا درخواست مشتری:\n"${query}"`,
        },
      ],
    });

    let fullAccumulatedText = '';
    let speechBuffer = '';
    let phraseIndex = 0;
    const speechPromises: Promise<any>[] = [];

    const stream = await ai.models.generateContentStream({
      model: 'gemini-3.8-flash',
      contents,
    });

    for await (const chunk of stream) {
      const chunkText = chunk.text || '';
      if (!chunkText) continue;

      fullAccumulatedText += chunkText;
      speechBuffer += chunkText;

      sendEvent({
        type: 'text_chunk',
        responseId,
        chunk: chunkText,
        textSoFar: fullAccumulatedText,
      });

      // Check for natural phrase boundary for progressive streaming TTS
      if (includeAudio) {
        const minLen = phraseIndex === 0 ? 5 : 12;
        const match = speechBuffer.match(/^([\s\S]+?[.!?؟\n،,:؛])\s*([\s\S]*)$/);
        if ((match && match[1].trim().length >= minLen) || (phraseIndex === 0 && speechBuffer.trim().length >= 22) || speechBuffer.trim().length >= 45) {
          const phraseToSpeak = match ? match[1].trim() : speechBuffer.trim();
          speechBuffer = match ? (match[2] || '') : '';
          const currentIdx = phraseIndex++;

          const p = (async () => {
            try {
              const cleaned = cleanPersianTextForVoice(phraseToSpeak);
              if (cleaned) {
                const audioBuf = await generatePersianMaleSpeechEdge(cleaned);
                if (audioBuf && audioBuf.length > 0) {
                  sendEvent({
                    type: 'audio_chunk',
                    responseId,
                    phraseIndex: currentIdx,
                    phraseText: phraseToSpeak,
                    audioBase64: `data:audio/mp3;base64,${audioBuf.toString('base64')}`,
                    mimeType: 'audio/mp3',
                  });
                }
              }
            } catch (err) {
              console.warn('[Stream TTS Chunk Error]:', err);
            }
          })();
          speechPromises.push(p);
        }
      }
    }

    // Synthesize any remaining speech buffer
    if (includeAudio && speechBuffer.trim()) {
      const remainingPhrase = speechBuffer.trim();
      const currentIdx = phraseIndex++;
      const p = (async () => {
        try {
          const cleaned = cleanPersianTextForVoice(remainingPhrase);
          if (cleaned) {
            const audioBuf = await generatePersianMaleSpeechEdge(cleaned);
            if (audioBuf && audioBuf.length > 0) {
              sendEvent({
                type: 'audio_chunk',
                responseId,
                phraseIndex: currentIdx,
                phraseText: remainingPhrase,
                audioBase64: `data:audio/mp3;base64,${audioBuf.toString('base64')}`,
                mimeType: 'audio/mp3',
              });
            }
          }
        } catch (err) {
          console.warn('[Stream TTS Final Chunk Error]:', err);
        }
      })();
      speechPromises.push(p);
    }

    if (speechPromises.length > 0) {
      await Promise.allSettled(speechPromises);
    }

    let suggestedAction = {
      label: 'مشاهده دسته‌بندی محصولات',
      link: '/category/industrial-belts',
    };
    const ql = (query || '').toLowerCase();
    if (ql.includes('پولی') || ql.includes('فلکه') || ql.includes('تیپرلاک') || ql.includes('بوش')) {
      suggestedAction = {
        label: 'مشاهده پولی‌ها و بوش‌های تیپرلاک FORZA',
        link: '/category/pulleys-taperlock',
      };
    } else if (ql.includes('تایم') || ql.includes('شیاردار') || ql.includes('v-belt') || ql.includes('وی بلت')) {
      suggestedAction = {
        label: 'مشاهده انواع تسمه‌های صنعتی SWR',
        link: '/category/industrial-belts',
      };
    } else if (ql.includes('بلبرینگ') || ql.includes('یاتاقان') || ql.includes('رولبرینگ')) {
      suggestedAction = {
        label: 'مشاهده بلبرینگ‌ها و یاتاقان‌های صنعتی',
        link: '/category/bearings',
      };
    } else if (ql.includes('کاشی') || ql.includes('سرامیک') || ql.includes('کوره')) {
      suggestedAction = {
        label: 'مشاهده قطعات صنایع کاشی و سرامیک',
        link: '/category/ceramic-tiles',
      };
    } else if (ql.includes('پیش‌فاکتور') || ql.includes('قیمت') || ql.includes('استعلام')) {
      suggestedAction = {
        label: 'درخواست پیش‌فاکتور و استعلام قیمت',
        link: '/inquiry',
      };
    }

    sendEvent({
      type: 'done',
      responseId,
      fullText: fullAccumulatedText,
      suggestedAction,
    });
    res.end();
  } catch (err: any) {
    console.error('[AI Consult Stream Error]:', err);
    sendEvent({
      type: 'error',
      responseId,
      error: err?.message || 'خطا در استریم پاسخ AI',
    });
    res.end();
  }
});

// Helper: Package raw PCM buffer into valid WAV container
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitDepth = 16): Buffer {
  const byteRate = sampleRate * numChannels * (bitDepth / 8);
  const blockAlign = numChannels * (bitDepth / 8);
  const dataSize = pcmBuffer.length;
  const headerSize = 44;
  const wavBuffer = Buffer.alloc(headerSize + dataSize);

  // RIFF chunk descriptor
  wavBuffer.write('RIFF', 0);
  wavBuffer.writeUInt32LE(36 + dataSize, 4);
  wavBuffer.write('WAVE', 8);

  // fmt sub-chunk
  wavBuffer.write('fmt ', 12);
  wavBuffer.writeUInt32LE(16, 16);
  wavBuffer.writeUInt16LE(1, 20); // PCM format
  wavBuffer.writeUInt16LE(numChannels, 22);
  wavBuffer.writeUInt32LE(sampleRate, 24);
  wavBuffer.writeUInt32LE(byteRate, 28);
  wavBuffer.writeUInt16LE(blockAlign, 32);
  wavBuffer.writeUInt16LE(bitDepth, 34);

  // data sub-chunk
  wavBuffer.write('data', 36);
  wavBuffer.writeUInt32LE(dataSize, 40);

  pcmBuffer.copy(wavBuffer, 44);
  return wavBuffer;
}

function stripDataUrlPrefix(str: string): string {
  if (!str || typeof str !== 'string') return '';
  const commaIdx = str.indexOf(',');
  if (str.startsWith('data:') && commaIdx !== -1) {
    return str.slice(commaIdx + 1).trim();
  }
  return str.trim();
}

// POST: /api/ai/stt - Transcribe user voice audio into text using Gemini Multimodal Speech
app.post('/api/ai/stt', async (req, res) => {
  try {
    const { audioBase64, mimeType } = req.body;
    const apiKey = getGeminiKey();

    if (!audioBase64) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    const cleanBase64 = stripDataUrlPrefix(audioBase64);
    let cleanMime = (mimeType || 'audio/webm').split(';')[0].trim().toLowerCase();
    if (audioBase64.startsWith('data:')) {
      const mimeMatch = audioBase64.match(/^data:([^;,]+)/);
      if (mimeMatch) cleanMime = mimeMatch[1].trim().toLowerCase();
    }
    if (!cleanMime || cleanMime === 'audio/*' || !cleanMime.startsWith('audio/')) {
      cleanMime = 'audio/webm';
    }

    if (!apiKey) {
      return res.json({
        success: false,
        text: '',
        message: 'کلید هوش مصنوعی تعریف نشده است.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const parts = [
      {
        inlineData: {
          mimeType: cleanMime,
          data: cleanBase64,
        },
      },
      {
        text: `Transcribe the spoken Persian words in this audio file into clean Persian text.
Rules:
1. Output ONLY the transcribed Persian text.
2. Do NOT add any notes, headers, explanations or tags.
3. If the audio is unclear, output the closest meaningful Persian phrase spoken.`,
      },
    ];

    const { text } = await generateWithModelCascade(
      ai,
      [{ role: 'user', parts }],
      undefined,
      'AI STT Voice',
      ['gemini-3.5-transcribe', 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.5-flash'],
      12000
    );

    const transcribed = (text || '').trim().replace(/^["']|["']$/g, '');

    return res.json({
      success: true,
      text: transcribed,
    });
  } catch (err: any) {
    console.error('[AI STT] Voice transcription error:', err?.message || err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'خطا در تبدیل صوت به متن',
    });
  }
});

// In-memory cache for audio TTS to provide instant responses
const ttsAudioCache = new Map<string, string>();

// Intelligent Persian technical text cleaner for fluent, professional audio reading
function cleanPersianTextForVoice(raw: string): string {
  if (!raw) return '';

  let t = raw;

  // 1. Remove code blocks and inline code
  t = t.replace(/```[\s\S]*?```/g, ' ');
  t = t.replace(/`([^`]+)`/g, '$1');

  // 2. Remove markdown images and format markdown links [text](url) -> text
  t = t.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  t = t.replace(/https?:\/\/\S+/gi, ' ');

  // 3. Convert markdown tables into natural speech sentences
  const lines = t.split('\n');
  const processedLines: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      // Skip separator line (|---|---|)
      if (/^\|[\s\-:|]+\|$/.test(trimmed)) {
        continue;
      }
      const cells = trimmed
        .split('|')
        .map(c => c.trim())
        .filter(c => c.length > 0);
      if (cells.length > 0) {
        processedLines.push(cells.join('، '));
      }
    } else {
      processedLines.push(line);
    }
  }
  t = processedLines.join('\n');

  // 4. Remove markdown headers, bold, italics
  t = t.replace(/^#{1,6}\s+/gm, '');
  t = t.replace(/\*\*([^*]+)\*\*/g, '$1');
  t = t.replace(/\*([^*]+)\*/g, '$1');
  t = t.replace(/__([^_]+)__/g, '$1');
  t = t.replace(/_([^_]+)_/g, '$1');

  // 5. Remove bullet points and numbered list markers
  t = t.replace(/^\s*[-*•]\s+/gm, ' ');
  t = t.replace(/^\s*\d+[\.\)]\s+/gm, ' ');

  // 6. Conversions for industrial specifications, dimensions and technical units
  // Timing Belt tooth profiles & pitches
  t = t.replace(/\b3M\b/gi, 'سه اِم');
  t = t.replace(/\b5M\b/gi, 'پنج اِم');
  t = t.replace(/\b8M\b/gi, 'هشت اِم');
  t = t.replace(/\b14M\b/gi, 'چهارده اِم');
  t = t.replace(/\b20M\b/gi, 'بیست اِم');
  t = t.replace(/\bHTD\b/gi, 'اِچ‌تی‌دی');
  t = t.replace(/\bSTD\b/gi, 'اس‌تی‌دی');
  t = t.replace(/\bRPP\b/gi, 'آر‌پی‌پی');

  // V-Belts
  t = t.replace(/\bSPZ\b/gi, 'اس پی زِد');
  t = t.replace(/\bSPA\b/gi, 'اس پی اِی');
  t = t.replace(/\bSPB\b/gi, 'اس پی بی');
  t = t.replace(/\bSPC\b/gi, 'اس پی سی');
  t = t.replace(/\bV-Belt\b/gi, 'تسمه وی‌بلت');
  t = t.replace(/\bV-Belts\b/gi, 'تسمه‌های وی‌بلت');

  // Dimensions: 1200x30 or 1200*30 -> 1200 در 30
  t = t.replace(/(\d+)\s*[xX*×]\s*(\d+)/g, '$1 در $2');

  // Units
  t = t.replace(/\b(\d+)\s*(mm|میلیمتر|میلی‌متر)\b/gi, '$1 میلی‌متر');
  t = t.replace(/\b(\d+)\s*(cm|سانتیمتر|سانتی‌متر)\b/gi, '$1 سانتی‌متر');
  t = t.replace(/\b(\d+)\s*(kw|کیلووات|کیلو وات)\b/gi, '$1 کیلووات');
  t = t.replace(/\b(\d+)\s*(rpm|دور بر دقیقه|دور در دقیقه)\b/gi, '$1 دور در دقیقه');
  t = t.replace(/\b(\d+)\s*(hp|اسب بخار)\b/gi, '$1 اسب بخار');
  t = t.replace(/\b(\d+)\s*(bar|بار)\b/gi, '$1 بار');
  t = t.replace(/\b(\d+)\s*m\b/g, '$1 متر');

  // Industrial Brands & Materials
  t = t.replace(/\bOPTIBELT\b/gi, 'اپتی‌بلت');
  t = t.replace(/\bMEGADYNE\b/gi, 'مگاداین');
  t = t.replace(/\bBANDO\b/gi, 'باندو');
  t = t.replace(/\bGATES\b/gi, 'گیتس');
  t = t.replace(/\bFORZA\b/gi, 'فورزا');
  t = t.replace(/\bNSK\b/gi, 'ان‌اس‌کی');
  t = t.replace(/\bSKF\b/gi, 'اس‌کی‌اف');
  t = t.replace(/\bFAG\b/gi, 'اف‌آ‌گ');
  t = t.replace(/\bKOYO\b/gi, 'کویو');
  t = t.replace(/\bTIMKEN\b/gi, 'تیمکن');
  t = t.replace(/\bPU\b/gi, 'پلی‌یورتان');
  t = t.replace(/\bPVC\b/gi, 'پی‌وی‌سی');
  t = t.replace(/\bNBR\b/gi, 'ان‌بی‌آر');
  t = t.replace(/\bEPDM\b/gi, 'ای‌پی‌دی‌ام');

  // 7. Remove emojis and decorative icons
  t = t.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');

  // 8. Clean symbols causing stutter or robotic glitches
  t = t.replace(/[#$@%^&~|\\]/g, ' ');
  t = t.replace(/["«»"״]/g, '');
  t = t.replace(/[:：]/g, '، ');
  t = t.replace(/[-–—]/g, ' ');
  t = t.replace(/\/{2,}/g, ' ');
  t = t.replace(/([^\d])\/([^\d])/g, '$1 یا $2');

  // 9. Natural pauses without awkward stutter
  t = t.replace(/[\r\n]+/g, '. ');
  t = t.replace(/[.!?]+/g, '. ');
  t = t.replace(/[،,]+/g, '، ');
  t = t.replace(/\s+/g, ' ').trim();
  t = t.replace(/،\s*،+/g, '،');
  t = t.replace(/\.\s*\.+/g, '.');
  t = t.replace(/،\s*\./g, '.');
  t = t.replace(/\.\s*،/g, '.');

  return t;
}

// Split text into natural chunks for Edge TTS if text is long
function splitTextIntoSpeechChunks(text: string, maxChunkLen = 900): string[] {
  if (text.length <= maxChunkLen) return [text];

  const sentences = text.split(/(?<=[.!?؟\n])\s+/);
  const chunks: string[] = [];
  let cur = '';

  for (const s of sentences) {
    if ((cur + ' ' + s).length > maxChunkLen) {
      if (cur.trim()) chunks.push(cur.trim());
      cur = s;
    } else {
      cur = cur ? cur + ' ' + s : s;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks.length > 0 ? chunks : [text];
}

async function synthesizeSingleEdgeChunk(tts: MsEdgeTTS, chunkText: string, timeoutMs = 15000): Promise<Buffer | null> {
  return new Promise((resolve) => {
    let timer: NodeJS.Timeout | null = null;
    let finished = false;

    timer = setTimeout(() => {
      if (!finished) {
        finished = true;
        resolve(null);
      }
    }, timeoutMs);

    try {
      const { audioStream } = tts.toStream(chunkText);
      const buffers: Buffer[] = [];

      audioStream.on('data', (d: Buffer) => buffers.push(d));
      audioStream.on('end', () => {
        if (!finished) {
          finished = true;
          if (timer) clearTimeout(timer);
          resolve(Buffer.concat(buffers));
        }
      });
      audioStream.on('error', (err: any) => {
        console.warn('[TTS] MsEdgeTTS stream chunk error:', err?.message || err);
        if (!finished) {
          finished = true;
          if (timer) clearTimeout(timer);
          resolve(null);
        }
      });
    } catch (err: any) {
      console.warn('[TTS] MsEdgeTTS toStream call error:', err?.message || err);
      if (!finished) {
        finished = true;
        if (timer) clearTimeout(timer);
        resolve(null);
      }
    }
  });
}

// Generate Native Persian Male Neural Speech using fa-IR-FaridNeural
async function generatePersianMaleSpeechEdge(text: string): Promise<Buffer | null> {
  const cleanKey = (text || '').trim();
  if (!cleanKey) return null;

  if (ttsBufferCache.has(cleanKey)) {
    return ttsBufferCache.get(cleanKey)!;
  }

  let tts: MsEdgeTTS | null = null;
  try {
    tts = new MsEdgeTTS();
    await tts.setMetadata('fa-IR-FaridNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const chunks = splitTextIntoSpeechChunks(cleanKey, 900);
    const audioBuffers: Buffer[] = [];

    for (const chunk of chunks) {
      const buf = await synthesizeSingleEdgeChunk(tts, chunk, 15000);
      if (buf && buf.length > 0) {
        audioBuffers.push(buf);
      }
    }

    try {
      tts.close();
    } catch {}

    if (audioBuffers.length > 0) {
      const combined = Buffer.concat(audioBuffers);
      if (ttsBufferCache.size > 200) {
        const firstKey = ttsBufferCache.keys().next().value;
        if (firstKey) ttsBufferCache.delete(firstKey);
      }
      ttsBufferCache.set(cleanKey, combined);
      return combined;
    }
    return null;
  } catch (err: any) {
    console.warn('[TTS] generatePersianMaleSpeechEdge error:', err?.message || err);
    if (tts) {
      try {
        tts.close();
      } catch {}
    }
    return null;
  }
}

// POST: /api/ai/tts - Convert AI engineering response to fluent male Persian speech
app.post('/api/ai/tts', async (req, res) => {
  try {
    const { text, voice } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'متن برای خواندن الزامی است' });
    }

    // Clean and comprehend text for fluent speech reading
    const cleanedText = cleanPersianTextForVoice(text);
    if (!cleanedText) {
      return res.status(400).json({ error: 'متن پس از پالایش خالی شد' });
    }

    // Check in-memory cache first
    const cacheKey = `male-fa:${cleanedText.slice(0, 300)}:${cleanedText.length}`;
    if (ttsAudioCache.has(cacheKey)) {
      return res.json({
        success: true,
        audioBase64: ttsAudioCache.get(cacheKey),
        mimeType: 'audio/mp3',
        cleanedText,
      });
    }

    // 1. PRIMARY ENGINE: High-Fidelity Persian Male Neural Voice (Farid - native Iranian male)
    try {
      const edgeAudioBuffer = await generatePersianMaleSpeechEdge(cleanedText);
      if (edgeAudioBuffer && edgeAudioBuffer.length > 0) {
        const dataUrl = `data:audio/mp3;base64,${edgeAudioBuffer.toString('base64')}`;

        if (ttsAudioCache.size > 100) {
          const firstKey = ttsAudioCache.keys().next().value;
          if (firstKey) ttsAudioCache.delete(firstKey);
        }
        ttsAudioCache.set(cacheKey, dataUrl);

        return res.json({
          success: true,
          audioBase64: dataUrl,
          mimeType: 'audio/mp3',
          cleanedText,
        });
      }
    } catch (edgeErr: any) {
      console.warn('[TTS] Primary Edge TTS failed, cascading to Gemini TTS:', edgeErr?.message || edgeErr);
    }

    // 2. SECONDARY ENGINE: Gemini Audio TTS with Male Voice (Charon or Puck)
    const apiKey = getGeminiKey();
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });

        // Use deep male voice Charon or Puck
        const maleVoice = voice === 'Puck' ? 'Puck' : 'Charon';
        let response: any = null;

        try {
          response = await ai.models.generateContent({
            model: 'gemini-3.8-flash-lite-tts',
            contents: [{ role: 'user', parts: [{ text: cleanedText }] }],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: maleVoice },
                },
              },
            },
          });
        } catch {
          response = await ai.models.generateContent({
            model: 'gemini-3.8-flash-tts',
            contents: [{ role: 'user', parts: [{ text: cleanedText }] }],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: maleVoice },
                },
              },
            },
          });
        }

        const inlineData = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        if (inlineData?.data) {
          const rawPcm = Buffer.from(inlineData.data, 'base64');
          const wavBuffer = pcmToWav(rawPcm, 24000, 1, 16);
          const dataUrl = `data:audio/wav;base64,${wavBuffer.toString('base64')}`;

          if (ttsAudioCache.size > 100) {
            const firstKey = ttsAudioCache.keys().next().value;
            if (firstKey) ttsAudioCache.delete(firstKey);
          }
          ttsAudioCache.set(cacheKey, dataUrl);

          return res.json({
            success: true,
            audioBase64: dataUrl,
            mimeType: 'audio/wav',
            cleanedText,
          });
        }
      } catch (geminiErr: any) {
        console.warn('[TTS] Gemini TTS secondary engine error:', geminiErr?.message || geminiErr);
      }
    }

    return res.status(500).json({
      success: false,
      error: 'خطا در بارگذاری صدای فارسی گوینده مرد',
      cleanedText,
    });
  } catch (err: any) {
    console.error('[TTS] General error in /api/ai/tts:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'خطای غیرمنتظره در سرور صدا',
    });
  }
});

// POST: /api/ai/forza-live - Face-to-Face conversational turn with AI FORZA
app.post('/api/ai/forza-live', async (req, res) => {
  try {
    const { query, history, image, audioBase64, audioMimeType } = req.body;
    const apiKey = getGeminiKey();

    if (!query && !image && !audioBase64) {
      return res.status(400).json({ error: 'صوت، متن یا تصویر قطعه برای مشاوره الزامی است' });
    }

    const forzaSystemInstruction = `شما «AI FORZA» (هوش سایبرنتیک صنعتی و مشاور ارشد هایپر صنعت اطلس) هستید. شما در حال مکالمه صوتی و تصویری رو در رو با مدیر یا مهندس کارخانه هستید.
حیطه تخصص شما:
۱. شناسایی تخصصی قطعات صنعتی از روی تصویر (تسمه‌های تایمینگ، شیاردار، وی‌بلت، پولی‌ها، بلبرینگ‌ها، رولیک کانوایر و قطعات خطوط کاشی و سرامیک، نساجی و صنایع سنگین).
۲. خواندن دقیق پلاک‌های فنی، شماره فنی، گام و مشخصات استاندارد DIN و ISO (مانند HTD 8M, SPB, 6205, 14M, PK, PJ).
۳. ارائه راهنمای فنی، معادل‌یابی و بررسی برندهای انحصاری SWR آلمان و FORZA ایتالیا.

دستورالعمل‌های حیاتی گفتاری:
- لحن شما مردانه، عمیق، متین، هوشمند و قاطع است.
- زبان پاسخ‌دهی منحصراً فارسی سلیس است.
- پاسخ شما باید کاملاً متناسب با پرسش مشتری، موجز و صریح باشد (حداکثر ۱ تا ۳ جمله کوتاه) زیرا کلمات شما در قالب صدای هوش مصنوعی به صورت زنده برای مشتری پخش می‌شوند.
- هرگز از جدول، ستاره مارک‌داون (*)، هش‌تگ (#) یا شکلک‌های ایموجی استفاده نکنید.
- اگر تصویر ناواضح است یا اطلاعات کافی نیست، به طور محترمانه از کاربر بخواهید زاویه دیگر، پلاک یا ابعاد قطعه را مشخص نماید.`;

    let userQuery = (query || '').trim();

    // 1. Direct Voice Audio Comprehension (if user spoke and audio was captured)
    if (!userQuery && audioBase64 && apiKey) {
      try {
        const cleanAudioData = stripDataUrlPrefix(audioBase64);
        let cleanAudioMime = (audioMimeType || 'audio/webm').split(';')[0].trim().toLowerCase();
        if (audioBase64.startsWith('data:')) {
          const mimeMatch = audioBase64.match(/^data:([^;,]+)/);
          if (mimeMatch) cleanAudioMime = mimeMatch[1].trim().toLowerCase();
        }
        if (!cleanAudioMime || !cleanAudioMime.startsWith('audio/')) {
          cleanAudioMime = 'audio/webm';
        }

        const aiForStt = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });

        const sttResult = await generateWithModelCascade(
          aiForStt,
          [{
            role: 'user',
            parts: [
              { inlineData: { mimeType: cleanAudioMime, data: cleanAudioData } },
              { text: 'Transcribe the spoken Persian words in this audio into natural clean Persian text. Return ONLY the transcribed words.' },
            ],
          }],
          undefined,
          'AI FORZA Voice Input STT',
          ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.5-flash'],
          10000
        );

        if (sttResult?.text) {
          userQuery = sttResult.text.trim().replace(/^["']|["']$/g, '');
        }
      } catch (sttErr) {
        console.warn('[AI FORZA] Audio STT error:', sttErr);
      }
    }

    let replyText = '';

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });

        const contents: any[] = [];

        // Append recent conversational context
        if (Array.isArray(history) && history.length > 0) {
          for (const h of history.slice(-6)) {
            if (h.role === 'user' || h.sender === 'user') {
              contents.push({ role: 'user', parts: [{ text: h.text }] });
            } else if (h.role === 'model' || h.role === 'assistant' || h.sender === 'ai') {
              contents.push({ role: 'model', parts: [{ text: h.text }] });
            }
          }
        }

        const currentParts: any[] = [];

        // Check if an image is attached (for component identification)
        if (image && typeof image === 'string') {
          const match = image.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
          if (match) {
            currentParts.push({
              inlineData: {
                mimeType: match[1],
                data: match[2],
              },
            });
          } else {
            currentParts.push({
              inlineData: {
                mimeType: 'image/jpeg',
                data: image,
              },
            });
          }
        }

        const userPrompt = userQuery
          ? `${forzaSystemInstruction}\n\nپرسش یا صحبت کاربر در مکالمه زنده:\n"${userQuery}"`
          : `${forzaSystemInstruction}\n\nلطفاً این قطعه صنعتی یا پلاک را شناسایی کرده و در ۲ جمله به صورت گفتاری تحلیل فرمایید.`;

        currentParts.push({ text: userPrompt });
        contents.push({ role: 'user', parts: currentParts });

        const cascadeResult = await generateWithModelCascade(
          ai,
          contents,
          undefined,
          'AI FORZA Live Turn',
          ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.5-flash'],
          14000
        );

        replyText = cascadeResult.text.trim();
      } catch (geminiErr: any) {
        console.warn('[AI FORZA] Gemini turn error:', geminiErr?.message || geminiErr);
      }
    }

    // High reliability fallback if API was unavailable
    if (!replyText) {
      const q = (userQuery || '').toLowerCase();
      if (image) {
        replyText = 'قطعه در حال تطبیق با پایگاه داده فنی اطلس است. برای بررسی دقیق‌تر، شماره فنی پلاک یا ابعاد مقطع آن را بفرمایید.';
      } else if (q.includes('تسمه') || q.includes('پولی') || q.includes('وی بلت') || q.includes('تایمینگ')) {
        replyText = 'برای انتقال قدرت بدون لغزش، تسمه‌های تایمینگ رابر و پولی‌های چدنی فورزا ایتالیا بیشترین راندمان را ارائه می‌دهند. ابعاد فاصله مراکز یا نسبت دور مورد نظرتان را بفرمایید تا دقیق‌ترین گزینه را معرفی کنم.';
      } else if (q.includes('بلبرینگ') || q.includes('یاتاقان')) {
        replyText = 'بلبرینگ‌های دور بالا و یاتاقان‌های صنعتی اطلس با استانداردهای لقی مجاز در انبار موجود هستند. شماره فنی یا قطر شفت خود را اعلام فرمایید.';
      } else if (q.includes('کاشی') || q.includes('سرامیک') || q.includes('کوره')) {
        replyText = 'در خطوط پخت و لعاب سرامیک، رولیک‌های ضدشوک حرارتی و تسمه‌های پی‌یو با کورد استیل بهترین دوام کاری را دارند.';
      } else {
        replyText = 'درود، من هوش مصنوعی فورزا هستم. در حال شنیدن صدای شما هستم؛ بفرمایید برای کدام بخش خط تولید یا چه قطعه‌ای به راهنمایی نیاز دارید؟';
      }
    }

    // Clean text for pristine Persian speech synthesis
    const cleanedVoiceText = cleanPersianTextForVoice(replyText);

    // Synthesize Persian Male Voice Audio (Primary: Edge TTS fa-IR-FaridNeural)
    let audioDataUrl: string | null = null;
    let mimeType = 'audio/mp3';
    const cacheKey = `forza-male:${cleanedVoiceText.slice(0, 300)}:${cleanedVoiceText.length}`;

    if (ttsAudioCache.has(cacheKey)) {
      audioDataUrl = ttsAudioCache.get(cacheKey)!;
    } else {
      try {
        const audioBuffer = await generatePersianMaleSpeechEdge(cleanedVoiceText);
        if (audioBuffer && audioBuffer.length > 0) {
          audioDataUrl = `data:audio/mp3;base64,${audioBuffer.toString('base64')}`;
          if (ttsAudioCache.size > 100) {
            const firstKey = ttsAudioCache.keys().next().value;
            if (firstKey) ttsAudioCache.delete(firstKey);
          }
          ttsAudioCache.set(cacheKey, audioDataUrl);
        }
      } catch (err: any) {
        console.warn('[AI FORZA] Edge TTS synthesis error:', err?.message || err);
      }

      // Secondary Fallback: Gemini Audio Male Voice (Charon)
      if (!audioDataUrl && apiKey) {
        try {
          const aiTts = new GoogleGenAI({
            apiKey,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
          });
          const ttsResp = await aiTts.models.generateContent({
            model: 'gemini-3.8-flash-lite-tts',
            contents: [{ role: 'user', parts: [{ text: cleanedVoiceText }] }],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Charon' },
                },
              },
            },
          });
          const inlineAudio = ttsResp?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
          if (inlineAudio?.data) {
            const rawPcm = Buffer.from(inlineAudio.data, 'base64');
            const wavBuffer = pcmToWav(rawPcm, 24000, 1, 16);
            audioDataUrl = `data:audio/wav;base64,${wavBuffer.toString('base64')}`;
            mimeType = 'audio/wav';
          }
        } catch (geminiTtsErr) {
          console.warn('[AI FORZA] Fallback Gemini TTS error:', geminiTtsErr);
        }
      }
    }

    return res.json({
      success: true,
      userTranscript: userQuery,
      text: replyText,
      cleanedText: cleanedVoiceText,
      audioBase64: audioDataUrl,
      mimeType,
    });
  } catch (err: any) {
    console.error('[AI FORZA Live] Request error:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'خطا در برقراری ارتباط با AI FORZA',
    });
  }
});

// WebSocket Server for Real-Time Native Audio Gemini Live Session
function setupGeminiLiveWebSocket(server: http.Server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    try {
      const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
      if (url.pathname === '/api/live' || url.pathname === '/live') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
    } catch {
      // Ignore non-matching upgrade requests (e.g. Vite HMR)
    }
  });

  const FORZA_SYSTEM_INSTRUCTION = `شما «AI FORZA» هستید؛ مشاور ارشد و مهندس هوشمند فنی و بازرگانی هایپرصنعت بلبرینگ و تجهیزات انتقال قدرت صنعتی (فروشگاه آنلاین انواع بلبرینگ، رولبرینگ، یاتاقان، کاسه نمد، تسمه، کوپلینگ، زنجیر صنعتی، گریس نسوز، روغن‌های صنعتی، شیرآلات صنعتی، اتصالات و پمپ).
هدف شما مکالمه صوتی دوطرفه زنده (Real-time Live Voice Conversation)، کاملاً طبیعی، روان، گرم، مؤدبانه و حرفه‌ای به زبان شیرین فارسی است.

دستورالعمل‌های حیاتی مکالمه صوتی:
1. زبان و بیان: فارسی روان و محاوره‌ای محترمانه. جملات شفاف، رسا و کوتاه برای شنیدن صوتی مناسب باشند (از پاسخ‌های طولانی متنی و نشانه‌گذاری‌های مارک‌داون مانند ستاره، جدول و بولت‌پوینت که شنیدن را مختل می‌کنند بپرهیزید).
2. کانتکست پیوسته (Context Memory): به حافظه مکالمه نوبت‌های قبلی دقیقاً توجه کنید. اگر کاربر گفت «دو اینچ»، «برای آب»، «فشار ۱۶ بار»، یا «همون قبلی»، متوجه شوید که این جزئیات مربوط به همان محصول درخواستی قبلی است و اطلاعات فنی را در ذهن نگه دارید.
3. تسلط عمیق صنعتی: مفاهیم و اصطلاحات مانند DN, PN, DIN, ISO, RPM, Bearing (SKF, FAG, NACHI, KOYO), Clearance C3/C4, V-Belts, Timing Belts, Ball Valve, Butterfly Valve, Mechanical Seal را در کلام کاربر دقیق درک و به کار ببرید.
4. پاسخ‌های صوتی به زبان فارسی طبیعی و با صدای مرد بیان می‌شوند.`;

  wss.on('connection', async (clientWs: WebSocket) => {
    const apiKey = getGeminiKey();
    if (!apiKey) {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'fallback_required',
            reason: 'کلید GEMINI_API_KEY پیکربندی نشده است. به سیستم ترکیبی متصل می‌شویم.',
          })
        );
      }
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    let liveSession: any = null;
    let isClosed = false;
    let currentTurnResponseId = `resp-live-${Date.now()}`;
    let hasLoggedTurnStart = false;

    try {
      liveSession = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Charon' },
            },
          },
          systemInstruction: FORZA_SYSTEM_INSTRUCTION,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            if (isClosed || clientWs.readyState !== WebSocket.OPEN) return;

            // 1. Audio chunks from Gemini Live model turn
            const parts = message.serverContent?.modelTurn?.parts;
            if (parts && parts.length > 0) {
              if (!hasLoggedTurnStart) {
                hasLoggedTurnStart = true;
                console.log(`[AI_GENERATION_START] userTurnId=${currentTurnResponseId} responseId=${currentTurnResponseId} mode=live endpoint=/api/live model=gemini-3.8-live timestamp=${new Date().toISOString()}`);
              }
              for (const part of parts) {
                if (part.inlineData?.data) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'audio_chunk',
                      responseId: currentTurnResponseId,
                      data: part.inlineData.data,
                      mimeType: part.inlineData.mimeType || 'audio/pcm;rate=24000',
                    })
                  );
                }
                if (part.text) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'ai_text_chunk',
                      responseId: currentTurnResponseId,
                      text: part.text,
                    })
                  );
                }
              }
            }

            // 2. Transcribed user input
            const userText =
              (message.serverContent as any)?.inputTranscription?.text ||
              (message.serverContent as any)?.inputAudioTranscription?.text;
            if (userText) {
              currentTurnResponseId = `resp-live-${Date.now()}`;
              hasLoggedTurnStart = false;
              clientWs.send(
                JSON.stringify({
                  type: 'user_transcript',
                  responseId: currentTurnResponseId,
                  text: userText,
                })
              );
            }

            // 3. Transcribed AI output
            const aiText =
              (message.serverContent as any)?.outputTranscription?.text ||
              (message.serverContent as any)?.outputAudioTranscription?.text;
            if (aiText) {
              clientWs.send(
                JSON.stringify({
                  type: 'ai_transcript',
                  responseId: currentTurnResponseId,
                  text: aiText,
                })
              );
            }

            // 4. User Barge-in / Interruption signal
            if (message.serverContent?.interrupted) {
              hasLoggedTurnStart = false;
              clientWs.send(
                JSON.stringify({
                  type: 'interrupted',
                  responseId: currentTurnResponseId,
                })
              );
            }

            // 5. Turn Complete signal
            if (message.serverContent?.turnComplete) {
              hasLoggedTurnStart = false;
              clientWs.send(
                JSON.stringify({
                  type: 'turn_complete',
                  responseId: currentTurnResponseId,
                })
              );
            }
          },
          onerror: (err: any) => {
            console.warn('[Gemini Live Session Error]:', err?.message || err);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: 'fallback_required',
                  error: err?.message || 'خطا در ارتباط Live با Gemini',
                })
              );
            }
          },
          onclose: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'session_closed' }));
            }
          },
        },
      });

      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'connected',
            model: 'gemini-3.8-live',
            sampleRate: 24000,
            inputSampleRate: 16000,
          })
        );
      }
    } catch (err: any) {
      console.warn('[Gemini Live connection init failed]:', err?.message || err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'fallback_required',
            error: 'امکان اتصال Real-time فراهم نیست؛ فعال‌سازی مود صوتی ترکیبی با پاسخ سریع',
          })
        );
      }
    }

    clientWs.on('message', async (raw: any) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === 'realtime_audio' && msg.audio) {
          if (liveSession) {
            liveSession.sendRealtimeInput({
              audio: {
                data: msg.audio,
                mimeType: 'audio/pcm;rate=16000',
              },
            });
          }
        } else if (msg.type === 'text' && msg.text) {
          if (liveSession) {
            liveSession.send({
              clientContent: {
                turns: [
                  {
                    role: 'user',
                    parts: [{ text: msg.text }],
                  },
                ],
                turnComplete: true,
              },
            });
          }
        } else if (msg.type === 'ping') {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'pong' }));
          }
        }
      } catch (e) {
        console.warn('[Gemini Live WS message parse error]:', e);
      }
    });

    clientWs.on('close', () => {
      isClosed = true;
      try {
        if (liveSession?.close) {
          liveSession.close();
        }
      } catch {}
    });
  });
}

// Vite middleware setup
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = http.createServer(app);
  setupGeminiLiveWebSocket(server);

  server.listen(PORT, '0.0.0.0', () => {
    const keyStatus = getGeminiKey()
      ? `SET (len ${getGeminiKey()!.length}, prefix ${getGeminiKey()!.slice(0, 6)}...)`
      : 'MISSING - AI features will use offline fallback until GEMINI_API_KEY is set in .env';
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`[Server] Gemini Live Audio WebSocket ready on /api/live`);
    console.log(`[Server] Gemini key: ${keyStatus}`);
  });
}

start();
