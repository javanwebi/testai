import { Product } from '../types';
import { getProductByCode, generateMockProducts } from '../data/mockGenerator';
import { getProductImageUrl } from '../assets/imagesproducts';
import { apiUrl, assertBackendConfigured } from '../config/apiConfig';

// مرحله تحلیل:
// quick   = شناسایی فوری فقط از روی تصویر (مرحله اول)
// refined = تحلیل دقیق با تصویر + ابعاد + کاربرد (مراحل دوم و سوم)
export type AiAnalysisStage = 'quick' | 'refined';

export interface AiPartAnalysisRequest {
  imageBase64?: string;
  mimeType?: string;
  length?: number;
  width?: number;
  pitch?: number;
  application?: string;
  features?: string;
  stage?: AiAnalysisStage;
}

export interface BoundingBox {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
}

export type VisualVerdict = 'exact_match' | 'very_similar' | 'different';

export type CatalogAvailabilityStatus =
  | 'confirmed_in_catalog'   // عیناً / انطباق قطعی در کاتالوگ موجود است (همونه)
  | 'similar_in_catalog'     // مدل مشابه / جایگزین سازگار در کاتالوگ موجود است (شبیهه)
  | 'custom_order_available'; // قطعه خاص صنعتی - امکان استعلام و ساخت سفارشی

export interface CatalogAvailability {
  status: CatalogAvailabilityStatus;
  statusFarsiTitle: string;
  statusFarsiMessage: string;
}

export interface MatchedPartItem {
  code: string;
  name: string;
  brand: string;
  type: string;
  similarityScore: number;
  matchReason: string;
  distinction?: string;
  specs: { key: string; value: string }[];
  catalogProduct?: Product;
  // Direct image-to-image match against the site's catalog photos
  isVisualMatch?: boolean;
  visualDistance?: number;
  // Multi-image side-by-side AI visual verification
  visualVerdict?: VisualVerdict;
  visualVerdictFarsi?: string; // e.g. "همونه (انطباق قطعی)" | "شبیهه (مدل مشابه/جایگزین)" | "فرق داره"
  visualExplanation?: string;  // Persian side-by-side comparative inspection rationale
  verificationConfidence?: number;
  forzaCode?: string;
  cataloguePage?: number;
  image?: string;
}

export interface AiPartAnalysisResult {
  success: boolean;
  isAiGenerated: boolean;
  stage?: AiAnalysisStage;
  model?: string;
  summary: {
    whatYouSee?: string;
    detectedPartType: string;
    partFamilyFarsi?: string; // short part family, e.g. «چرخ‌دهنده» — used for dynamic UI titles
    detectedProfile: string;
    material?: string;
    visualAnalysis: string;
    confidence: number;
    boundingBox?: BoundingBox;
    exactVisualMatch?: boolean;
    catalogAvailability?: CatalogAvailability;
    verifiedCandidateCount?: number;
  };
  matchedProducts: MatchedPartItem[];
  rejectedCandidates?: MatchedPartItem[]; // (legacy, kept empty) items rejected as 'different'
  similarCandidates?: MatchedPartItem[]; // visually close alternatives — NOT the exact part
  technicalAdvice: string;
  fallbackNotice?: string;
  aiError?: string;
}

// Sample industrial presets for one-click testing (real catalog products)
export interface IndustrialPresetSample {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  length: number;
  width: number;
  pitch?: number;
  application: string;
  features: string;
}

export const INDUSTRIAL_PRESET_SAMPLES: IndustrialPresetSample[] = [
  {
    id: 'sample-timing-htd',
    title: 'تسمه تایمینگ صنعتی گام 8M',
    subtitle: 'مدل 376 با ۴۷ دندانه — SWR',
    imageUrl: getProductImageUrl('e(552).png'),
    length: 376,
    width: 30,
    pitch: 8,
    application: 'خط انتقال و پرس کاشی و سرامیک',
    features: 'دندانه گرد HTD، بدون لغزش، مقاوم به کشش بالا',
  },
  {
    id: 'sample-vbelt-forza',
    title: 'تسمه V-Belt مقطع B فورزا',
    subtitle: 'تقویت‌شده گرید سنگین — FORZA',
    imageUrl: getProductImageUrl('e(541).png'),
    length: 1250,
    width: 17,
    application: 'الکتروموتور فن مکنده کوره و پمپ آب صنعتی',
    features: 'تحمل حرارت خط تولید تا ۸۰ درجه، مقاومت به گریس و روغن',
  },
  {
    id: 'sample-pu-wheel',
    title: 'چرخ روکش پلی‌یورتان هدایت کاشی',
    subtitle: 'روکش PU آلمانی Shore 85A',
    imageUrl: getProductImageUrl('e(319).png'),
    length: 120,
    width: 45,
    application: 'خط هدایت و انتقال کاشی بدون سایش سطح',
    features: 'مقاومت سایشی ۴ برابر لاستیک معمولی، مغزی آلومینیوم با بلبرینگ',
  },
  {
    id: 'sample-coupling-bushing',
    title: 'بوش لاستیکی کوپلینگ خاری',
    subtitle: 'کد 1000 0 1 — FORZA',
    imageUrl: getProductImageUrl('e(001).png'),
    length: 60,
    width: 45,
    application: 'اتصال شفت پمپ‌ها و گیربکس‌های صنعتی',
    features: 'جذب ارتعاش و ضربه، مقاوم به سایش و روغن، استاندارد DIN 2215',
  },
];

export const aiVisualSearchService = {
  async analyzePartWithAi(request: AiPartAnalysisRequest): Promise<AiPartAnalysisResult> {
    // If the image is a URL (preset sample), convert it to base64 first
    // so the AI always receives real pixel data.
    let { imageBase64, mimeType } = request;
    if (imageBase64 && /^https?:\/\//i.test(imageBase64.trim())) {
      const converted = await this.urlToBase64(imageBase64.trim());
      imageBase64 = converted.base64;
      mimeType = converted.mimeType;
    }

    assertBackendConfigured();

    const response = await fetch(apiUrl('/api/ai/analyze-part'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...request, imageBase64, mimeType }),
    });

    if (!response.ok) {
      throw new Error(`خطای ارتباط با سرور هوش مصنوعی: کد ${response.status}`);
    }

    const data: AiPartAnalysisResult = await response.json();

    // Enrich matched products with full catalog objects
    const allProducts = generateMockProducts();

    const mapWithCatalog = (m: MatchedPartItem): MatchedPartItem => {
      let catalogItem = getProductByCode(m.code);
      if (!catalogItem) {
        // Find by partial code or name
        catalogItem = allProducts.find(
          p => p.code.toLowerCase() === m.code.toLowerCase() || p.name.includes(m.name)
        );
      }
      return {
        ...m,
        catalogProduct: catalogItem,
      };
    };

    data.matchedProducts = (data.matchedProducts || []).map(mapWithCatalog);
    if (data.rejectedCandidates && Array.isArray(data.rejectedCandidates)) {
      data.rejectedCandidates = data.rejectedCandidates.map(mapWithCatalog);
    }
    if (data.similarCandidates && Array.isArray(data.similarCandidates)) {
      data.similarCandidates = data.similarCandidates.map(mapWithCatalog);
    }

    return data;
  },

  // Helper to convert File to base64
  fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve({
          base64: result,
          mimeType: file.type || 'image/jpeg',
        });
      };
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  },

  // Helper to convert an image URL (same-origin preset or remote) to base64 data-URL
  async urlToBase64(url: string): Promise<{ base64: string; mimeType: string }> {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error('دانلود تصویر نمونه ناموفق بود؛ لطفاً تصویر را مستقیماً آپلود کنید.');
    }
    const blob = await res.blob();
    const base64: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(blob);
    });
    return { base64, mimeType: blob.type || 'image/jpeg' };
  },
};
