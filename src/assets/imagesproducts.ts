/**
 * Product Image Resolver
 * Serves all product images directly from the GitHub repository:
 * https://github.com/javanweb/imagesatlas
 * Branch: main
 */

export const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/javanweb/imagesatlas/main';
export const JSDELIVR_CDN_BASE = 'https://cdn.jsdelivr.net/gh/javanweb/imagesatlas@main';

export const TOTAL_OFFICIAL_IMAGES_COUNT = 869;

/**
 * Normalizes an image identifier or filename to the official e(N).png format
 * available in the javanweb/imagesatlas repository.
 */
export function normalizeImageFileName(imageName?: string | null): string {
  if (!imageName) return 'e(1).png';
  const clean = imageName.trim();
  const match = clean.match(/(?:e\(?|at-e)?(\d+)\)?(?:\.(png|jpe?g|webp|svg))?/i);
  if (match) {
    const num = parseInt(match[1], 10);
    // 869 images in the repository: e(1).png through e(869).png
    const normalizedNum = ((Math.abs(num) - 1) % 869) + 1;
    return `e(${normalizedNum}).png`;
  }
  return 'e(1).png';
}

/**
 * Checks whether a given image name has a real matching image in the catalogue (e(1) - e(869)).
 */
export function isVerifiedCatalogueImage(imageName?: string | null): boolean {
  if (!imageName) return false;
  const clean = imageName.trim().toLowerCase();
  const match = clean.match(/(?:e\(?|at-e)?(\d+)\)?(?:\.(png|jpe?g|webp|svg))?/i);
  if (match) {
    const num = parseInt(match[1], 10);
    return num >= 1 && num <= 869;
  }
  return false;
}

/**
 * Resolves a product image name (e.g. "e(001).png", "e(196).png", "AT-E042", etc.)
 * directly to its GitHub repository URL (https://raw.githubusercontent.com/javanweb/imagesatlas/main/...)
 */
export function getProductImageUrl(imageName?: string | null): string {
  if (!imageName) {
    return `${GITHUB_RAW_BASE}/e(1).png`;
  }

  const clean = imageName.trim();

  // If already an absolute URL or data URI, return as-is
  if (
    clean.startsWith('http://') ||
    clean.startsWith('https://') ||
    clean.startsWith('data:') ||
    clean.startsWith('blob:')
  ) {
    return clean;
  }

  const fileName = normalizeImageFileName(clean);
  return `${GITHUB_RAW_BASE}/${fileName}`;
}

export default getProductImageUrl;
