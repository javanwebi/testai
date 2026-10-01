export interface ClientLogo {
  id: string;
  name: string;
  englishName?: string;
  logo: string; // Image URL or base64 data URI
  industry: string;
  website?: string;
  isActive: boolean;
  order: number;
  since?: string;
  notes?: string;
  createdAt: string;
}

const STORAGE_KEY = 'atlas_clients_logos_v1';
const EVENT_NAME = 'atlas_clients_updated';

// Default Iranian industrial clients
const DEFAULT_CLIENTS: ClientLogo[] = [
  {
    id: 'client-1',
    name: 'مجتمع فولاد مبارکه',
    englishName: 'Mobarakeh Steel Co.',
    industry: 'فولاد و متالورژی',
    logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80"><rect width="200" height="80" rx="10" fill="%230F172A"/><path d="M40 25 L60 25 L50 45 Z M45 48 L55 48 L50 60 Z" fill="%23F97316"/><circle cx="50" cy="40" r="22" fill="none" stroke="%23F97316" stroke-width="2.5"/><text x="135" y="38" fill="%23FFFFFF" font-family="sans-serif" font-weight="900" font-size="13" text-anchor="middle">فولاد مبارکه</text><text x="135" y="55" fill="%2394A3B8" font-family="sans-serif" font-weight="600" font-size="9" text-anchor="middle">MOBARAKEH STEEL</text></svg>',
    website: 'https://msc.ir',
    isActive: true,
    order: 1,
    since: '۱۳۹۲',
    notes: 'تأمین تسمه‌های نقاله سنگین و کوپلینگ‌های خط نورد گرم',
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'client-2',
    name: 'صنایع کاشی تبریز',
    englishName: 'Tabriz Tile Group',
    industry: 'کاشی و سرامیک',
    logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80"><rect width="200" height="80" rx="10" fill="%230F172A"/><rect x="32" y="24" width="32" height="32" rx="6" fill="%232563EB" stroke="%2360A5FA" stroke-width="2" transform="rotate(45 48 40)"/><text x="135" y="38" fill="%23FFFFFF" font-family="sans-serif" font-weight="900" font-size="13" text-anchor="middle">کاشی تبریز</text><text x="135" y="55" fill="%2394A3B8" font-family="sans-serif" font-weight="600" font-size="9" text-anchor="middle">TABRIZ TILE GROUP</text></svg>',
    website: 'https://tabriztile.com',
    isActive: true,
    order: 2,
    since: '۱۳۹۴',
    notes: 'تسمه‌های ضدسایش و پولی‌های خطوط لعاب‌کاری',
    createdAt: '2026-01-12T11:00:00Z',
  },
  {
    id: 'client-3',
    name: 'سیمان سپهر یزد',
    englishName: 'Yazd Sepehr Cement',
    industry: 'صنعت سیمان',
    logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80"><rect width="200" height="80" rx="10" fill="%230F172A"/><path d="M48 20 L32 58 L64 58 Z" fill="%23E2E8F0"/><path d="M48 28 L38 58 L58 58 Z" fill="%23F97316"/><text x="135" y="38" fill="%23FFFFFF" font-family="sans-serif" font-weight="900" font-size="13" text-anchor="middle">سیمان یزد</text><text x="135" y="55" fill="%2394A3B8" font-family="sans-serif" font-weight="600" font-size="9" text-anchor="middle">YAZD CEMENT CO.</text></svg>',
    website: 'https://yazdcement.com',
    isActive: true,
    order: 3,
    since: '۱۳۹۰',
    notes: 'تسمه‌های الواتور و زنجیرهای انتقال حرارت بالا',
    createdAt: '2026-01-15T09:30:00Z',
  },
  {
    id: 'client-4',
    name: 'کاشی و سرامیک عقیق',
    englishName: 'Aghigh Tile',
    industry: 'کاشی و سرامیک',
    logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80"><rect width="200" height="80" rx="10" fill="%230F172A"/><circle cx="48" cy="40" r="18" fill="%23DC2626"/><circle cx="48" cy="40" r="11" fill="%230F172A"/><path d="M48 25 L48 55 M33 40 L63 40" stroke="%23F97316" stroke-width="2.5"/><text x="135" y="38" fill="%23FFFFFF" font-family="sans-serif" font-weight="900" font-size="13" text-anchor="middle">کاشی عقیق</text><text x="135" y="55" fill="%2394A3B8" font-family="sans-serif" font-weight="600" font-size="9" text-anchor="middle">AGHIGH CERAMICS</text></svg>',
    website: 'https://aghighceramtile.com',
    isActive: true,
    order: 4,
    since: '۱۳۹۵',
    notes: 'تسمه‌های پلی‌اورتان و رولرهای سرامیکی',
    createdAt: '2026-01-20T14:00:00Z',
  },
  {
    id: 'client-5',
    name: 'داروسازی دکتر عبیدی',
    englishName: 'Dr. Abidi Pharma',
    industry: 'دارویی و بهداشتی',
    logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80"><rect width="200" height="80" rx="10" fill="%230F172A"/><rect x="36" y="28" width="24" height="24" rx="12" fill="%2310B981"/><path d="M42 40 L54 40 M48 34 L48 46" stroke="%23FFFFFF" stroke-width="3" stroke-linecap="round"/><text x="135" y="38" fill="%23FFFFFF" font-family="sans-serif" font-weight="900" font-size="13" text-anchor="middle">داروسازی عبیدی</text><text x="135" y="55" fill="%2394A3B8" font-family="sans-serif" font-weight="600" font-size="9" text-anchor="middle">DR. ABIDI PHARMA</text></svg>',
    website: 'https://abidipharma.com',
    isActive: true,
    order: 5,
    since: '۱۳۹۸',
    notes: 'تسمه‌های بهداشتی درجه فود‌گرید FDA و پولی‌های استیل ضدزنگ',
    createdAt: '2026-02-01T15:20:00Z',
  },
  {
    id: 'client-6',
    name: 'نساجی بروجرد',
    englishName: 'Boroujerd Textile',
    industry: 'صنعت نساجی',
    logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80"><rect width="200" height="80" rx="10" fill="%230F172A"/><path d="M35 50 Q48 20 61 50 Q48 60 35 50" fill="none" stroke="%23A855F7" stroke-width="3"/><circle cx="48" cy="40" r="5" fill="%23F97316"/><text x="135" y="38" fill="%23FFFFFF" font-family="sans-serif" font-weight="900" font-size="13" text-anchor="middle">نساجی بروجرد</text><text x="135" y="55" fill="%2394A3B8" font-family="sans-serif" font-weight="600" font-size="9" text-anchor="middle">BOROUJERD TEXTILE</text></svg>',
    website: 'https://boroujerdtextile.com',
    isActive: true,
    order: 6,
    since: '۱۳۹۳',
    notes: 'تسمه‌های اسپیندل و تسمه‌های تخت سرعت بالا',
    createdAt: '2026-02-05T08:45:00Z',
  },
  {
    id: 'client-7',
    name: 'پتروشیمی مارون',
    englishName: 'Marun Petrochemical',
    industry: 'صنایع پتروشیمی',
    logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80"><rect width="200" height="80" rx="10" fill="%230F172A"/><circle cx="48" cy="40" r="18" fill="none" stroke="%2306B6D4" stroke-width="2.5" stroke-dasharray="4,2"/><circle cx="48" cy="40" r="8" fill="%23F97316"/><text x="135" y="38" fill="%23FFFFFF" font-family="sans-serif" font-weight="900" font-size="13" text-anchor="middle">پتروشیمی مارون</text><text x="135" y="55" fill="%2394A3B8" font-family="sans-serif" font-weight="600" font-size="9" text-anchor="middle">MARUN PETROCHEM</text></svg>',
    website: 'https://mpc.ir',
    isActive: true,
    order: 7,
    since: '۱۳۹۷',
    notes: 'تسمه‌های ضداستاتیک و قطعات ضدخوردگی شیمیایی',
    createdAt: '2026-02-10T12:00:00Z',
  },
  {
    id: 'client-8',
    name: 'گروه صنعتی زر (زر ماکارون)',
    englishName: 'Zar Industrial Group',
    industry: 'صنایع غذایی و تبدیلی',
    logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80"><rect width="200" height="80" rx="10" fill="%230F172A"/><path d="M38 52 C38 32, 58 32, 58 52 Z" fill="%23EAB308"/><circle cx="48" cy="30" r="4" fill="%23F97316"/><text x="135" y="38" fill="%23FFFFFF" font-family="sans-serif" font-weight="900" font-size="13" text-anchor="middle">گروه صنعتی زر</text><text x="135" y="55" fill="%2394A3B8" font-family="sans-serif" font-weight="600" font-size="9" text-anchor="middle">ZAR GROUP</text></svg>',
    website: 'https://zargroup.ir',
    isActive: true,
    order: 8,
    since: '۱۳۹۶',
    notes: 'تسمه‌های مدولار پلاستیکی و خطوط بسته‌بندی پیوسته',
    createdAt: '2026-02-14T16:00:00Z',
  },
  {
    id: 'client-9',
    name: 'صنایع کاشی مرجان',
    englishName: 'Marjan Tile Co.',
    industry: 'کاشی و سرامیک',
    logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80"><rect width="200" height="80" rx="10" fill="%230F172A"/><path d="M36 28 H60 V52 H36 Z" fill="none" stroke="%23EC4899" stroke-width="2.5"/><circle cx="48" cy="40" r="6" fill="%23F97316"/><text x="135" y="38" fill="%23FFFFFF" font-family="sans-serif" font-weight="900" font-size="13" text-anchor="middle">کاشی مرجان</text><text x="135" y="55" fill="%2394A3B8" font-family="sans-serif" font-weight="600" font-size="9" text-anchor="middle">MARJAN TILE</text></svg>',
    website: 'https://marjantile.com',
    isActive: true,
    order: 9,
    since: '۱۳۹۱',
    notes: 'تسمه‌های وی‌بلت صنعتی و زنجیرهای خطوط پرس',
    createdAt: '2026-02-18T10:00:00Z',
  },
];

class ClientService {
  private getStorage(): ClientLogo[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        this.saveStorage(DEFAULT_CLIENTS);
        return DEFAULT_CLIENTS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_CLIENTS;
    }
  }

  private saveStorage(clients: ClientLogo[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(EVENT_NAME));
      }
    } catch (e) {
      console.error('Failed to save clients in localStorage', e);
    }
  }

  /**
   * Get all clients (sorted by order)
   */
  public getAllClients(): ClientLogo[] {
    const clients = this.getStorage();
    return [...clients].sort((a, b) => a.order - b.order);
  }

  /**
   * Get active clients for homepage carousel
   */
  public getActiveClients(): ClientLogo[] {
    return this.getAllClients().filter(c => c.isActive);
  }

  /**
   * Add a new client
   */
  public addClient(client: Omit<ClientLogo, 'id' | 'createdAt'>): ClientLogo {
    const clients = this.getStorage();
    const newClient: ClientLogo = {
      ...client,
      id: `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    clients.push(newClient);
    this.saveStorage(clients);
    return newClient;
  }

  /**
   * Update an existing client
   */
  public updateClient(id: string, updates: Partial<ClientLogo>): ClientLogo | null {
    const clients = this.getStorage();
    const index = clients.findIndex(c => c.id === id);
    if (index === -1) return null;

    clients[index] = { ...clients[index], ...updates };
    this.saveStorage(clients);
    return clients[index];
  }

  /**
   * Delete a client
   */
  public deleteClient(id: string): boolean {
    const clients = this.getStorage();
    const filtered = clients.filter(c => c.id !== id);
    if (filtered.length === clients.length) return false;

    this.saveStorage(filtered);
    return true;
  }

  /**
   * Reorder clients
   */
  public reorderClients(orderedIds: string[]): void {
    const clients = this.getStorage();
    const clientMap = new Map(clients.map(c => [c.id, c]));

    const reordered: ClientLogo[] = [];
    orderedIds.forEach((id, index) => {
      const c = clientMap.get(id);
      if (c) {
        reordered.push({ ...c, order: index + 1 });
        clientMap.delete(id);
      }
    });

    // Append any remaining clients
    clientMap.forEach(c => {
      reordered.push({ ...c, order: reordered.length + 1 });
    });

    this.saveStorage(reordered);
  }

  /**
   * Reset to default industrial clients
   */
  public resetToDefaults(): ClientLogo[] {
    this.saveStorage(DEFAULT_CLIENTS);
    return DEFAULT_CLIENTS;
  }

  /**
   * Subscribe to client updates
   */
  public subscribe(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener(EVENT_NAME, callback);
    return () => window.removeEventListener(EVENT_NAME, callback);
  }
}

export const clientService = new ClientService();
