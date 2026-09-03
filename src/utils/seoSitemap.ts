export const PRODUCTION_SITE_ORIGIN = 'https://pravaahtravels.com';

export const STATIC_PUBLIC_SITEMAP_PATHS = [
  '/',
  '/destinations',
  '/packages',
  '/blogs',
  '/gallery',
  '/about',
  '/contact',
  '/review',
  '/ai-curator',
] as const;

// Keep this list aligned with routes that are explicitly public in the landing registry.
export const PUBLIC_CUSTOM_LANDING_PATHS = [
  '/roopkund-trek',
  '/buran-ghati-trek',
  '/roopkund-mystery',
] as const;

export interface SitemapPackageRecord {
  id: string;
  title?: string;
  active?: boolean;
  status?: string;
  cmsStatus?: string;
  customLandingPage?: string | null;
  updatedAt?: unknown;
  publishedAt?: unknown;
  createdAt?: unknown;
}

export interface SitemapBlogRecord {
  id: string;
  slug?: string;
  status?: string;
  updatedAt?: unknown;
  createdAt?: unknown;
}

export interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: 'daily' | 'weekly' | 'monthly';
  priority?: string;
}

const escapeXml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const normalizePath = (value: string) => {
  const path = value.trim();
  if (!path.startsWith('/') || path.includes('?') || path.includes('#')) return null;
  return path === '/' ? path : path.replace(/\/+$/, '');
};

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'object' && value !== null) {
    const candidate = value as { toDate?: () => Date; seconds?: number; _seconds?: number };
    if (typeof candidate.toDate === 'function') return toDate(candidate.toDate());
    const seconds = candidate.seconds ?? candidate._seconds;
    if (typeof seconds === 'number') return new Date(seconds * 1000);
  }
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
};

export const toSitemapDate = (value: unknown) => {
  const date = toDate(value);
  return date ? date.toISOString().slice(0, 10) : undefined;
};

export const isPublicPackage = (pkg: SitemapPackageRecord) => (
  Boolean(pkg.id)
  && pkg.active === true
  && pkg.status !== 'Draft'
  && pkg.cmsStatus !== 'draft'
  && pkg.cmsStatus !== 'archived'
  && pkg.cmsStatus !== 'deleted'
);

export const isPublishedBlog = (post: SitemapBlogRecord) => Boolean(
  post.id && post.status === 'Publish',
);

const slugifyPackageTitle = (value: string) => String(value || '')
  .toLowerCase()
  .trim()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

export const getPublicPackagePath = (pkg: SitemapPackageRecord) => {
  const customPath = normalizePath(String(pkg.customLandingPage || ''));
  if (customPath && PUBLIC_CUSTOM_LANDING_PATHS.includes(customPath as (typeof PUBLIC_CUSTOM_LANDING_PATHS)[number])) {
    return customPath;
  }
  const slug = slugifyPackageTitle(String(pkg.title || ''));
  return `/packages/${slug ? `${slug}-${pkg.id}` : pkg.id}`;
};

export const getPublicBlogPath = (post: SitemapBlogRecord) => {
  const slug = String(post.slug || '').trim();
  return `/blogs/${slug || post.id}`;
};

const staticEntry = (path: string): SitemapEntry => ({
  path,
  changefreq: path === '/' ? 'daily' : path === '/gallery' || path === '/about' || path === '/contact' ? 'monthly' : 'weekly',
  priority: path === '/' ? '1.0' : path === '/packages' || path === '/destinations' ? '0.9' : '0.7',
});

export const buildSitemapEntries = ({
  packages = [],
  blogs = [],
  includeContent = true,
}: {
  packages?: SitemapPackageRecord[];
  blogs?: SitemapBlogRecord[];
  includeContent?: boolean;
} = {}): SitemapEntry[] => {
  if (!includeContent) return [];

  const entries: SitemapEntry[] = [
    ...STATIC_PUBLIC_SITEMAP_PATHS.map(staticEntry),
    ...PUBLIC_CUSTOM_LANDING_PATHS.map((path) => ({ path, changefreq: 'monthly' as const, priority: '0.8' })),
    ...packages.filter(isPublicPackage).map((pkg) => ({
      path: getPublicPackagePath(pkg),
      lastmod: toSitemapDate(pkg.updatedAt ?? pkg.publishedAt ?? pkg.createdAt),
      changefreq: 'weekly' as const,
      priority: '0.9',
    })),
    ...blogs.filter(isPublishedBlog).map((post) => ({
      path: getPublicBlogPath(post),
      lastmod: toSitemapDate(post.updatedAt ?? post.createdAt),
      changefreq: 'monthly' as const,
      priority: '0.7',
    })),
  ];

  const seen = new Set<string>();
  return entries.filter((entry) => {
    const path = normalizePath(entry.path);
    if (!path || seen.has(path)) return false;
    seen.add(path);
    return true;
  });
};

export const buildSitemapXml = (entries: SitemapEntry[]) => {
  const urls = entries.map((entry) => {
    const lines = [`  <url>`, `    <loc>${escapeXml(`${PRODUCTION_SITE_ORIGIN}${entry.path}`)}</loc>`];
    if (entry.lastmod) lines.push(`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`);
    if (entry.changefreq) lines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
    if (entry.priority) lines.push(`    <priority>${entry.priority}</priority>`);
    lines.push('  </url>');
    return lines.join('\n');
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
};

export const buildRobotsTxt = ({ staging = false } = {}) => [
  'User-agent: *',
  ...(staging
    ? ['Disallow: /']
    : [
      'Allow: /',
      'Disallow: /admin',
      'Disallow: /admin/',
      'Disallow: /admin-login',
      'Disallow: /account/',
      'Disallow: /login',
      'Disallow: /portal',
    ]),
  '',
  `Sitemap: ${PRODUCTION_SITE_ORIGIN}/sitemap.xml`,
  '',
].join('\n');
