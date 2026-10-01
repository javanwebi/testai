/**
 * API base URL resolution.
 *
 * On the website the Express server (server.ts) and the Vite bundle are served
 * from the same origin, so a relative "/api/..." path just works.
 *
 * Inside the Android APK the bundle is loaded from https://localhost by the
 * Capacitor WebView, so relative paths can no longer reach the backend. Set
 * `VITE_API_BASE_URL` at build time to point the app at the deployed server,
 * e.g.  VITE_API_BASE_URL=https://atlassanat.ir
 *
 * When the variable is empty and the app runs natively, AI features report a
 * clear "backend not configured" error instead of failing with an opaque
 * network error.
 */

const RAW_BASE: string = (import.meta.env.VITE_API_BASE_URL || '').trim();

/** True when running inside the Capacitor Android shell rather than a browser. */
function detectNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as unknown as { Capacitor?: Record<string, unknown> }).Capacitor;
  if (!cap) return false;
  try {
    if (typeof cap.isNativePlatform === 'function') return Boolean(cap.isNativePlatform());
    const platform = typeof cap.getPlatform === 'function' ? cap.getPlatform() : undefined;
    return Boolean(platform) && platform !== 'web';
  } catch {
    return false;
  }
}

/** Trailing slashes are stripped so `apiUrl('/api/x')` never doubles them. */
export const API_BASE_URL: string = RAW_BASE.replace(/\/+$/, '');

export const IS_NATIVE_APP: boolean = detectNativeApp();

/** True when a remote backend is reachable from this build. */
export const HAS_REMOTE_BACKEND: boolean = API_BASE_URL.length > 0;

/** Builds an absolute-or-relative API URL from an app path such as "/api/ai/consult". */
export function apiUrl(appPath: string): string {
  const withSlash = appPath.startsWith('/') ? appPath : `/${appPath}`;
  return API_BASE_URL ? `${API_BASE_URL}${withSlash}` : withSlash;
}

/**
 * Error thrown when the AI endpoints are called from the APK while no backend
 * URL has been baked into the build.
 */
export class BackendNotConfiguredError extends Error {
  constructor() {
    super(
      'سرور هوش مصنوعی در این نسخهٔ اپ متصل نیست. ' +
        'برای فعال‌سازی، مقدار VITE_API_BASE_URL را هنگام ساخت APK تنظیم کنید.'
    );
    this.name = 'BackendNotConfiguredError';
  }
}

/** Throws BackendNotConfiguredError when the app is native and has no backend. */
export function assertBackendConfigured(): void {
  if (IS_NATIVE_APP && !HAS_REMOTE_BACKEND) {
    throw new BackendNotConfiguredError();
  }
}
