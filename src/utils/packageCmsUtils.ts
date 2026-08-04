import type {
  ImportQuality,
  PackageCmsDocument,
  PackageCmsInput,
  PackageCmsStatus,
  PackageDiffField,
  PackageDiffResult,
  PackageFaq,
  PackageHotel,
  PackageItineraryDay,
  PackagePricing,
} from '../types/packageCms';

export const PACKAGE_CMS_PARSER_VERSION = 'deterministic-html-parser-v1';

export const PACKAGE_CMS_COLLECTION = 'packages';
export const PACKAGE_IMPORTS_COLLECTION = 'imports';
export const PACKAGE_ACTIVITY_LOGS_COLLECTION = 'activityLogs';

export const cleanPackageText = (value: unknown): string => String(value ?? '')
  .replace(/\u00a0/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export const slugifyPackageTitle = (value: unknown): string => cleanPackageText(value)
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 90);

export const getSourceDomain = (sourceUrl?: string | null): string | null => {
  if (!sourceUrl) return null;
  try {
    return new URL(sourceUrl).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return null;
  }
};

export const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of value) {
    const text = cleanPackageText(item);
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(text);
  }

  return result;
};

const hasValue = (value: unknown): boolean => {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value) && value > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return Boolean(value);
};

const normalizeNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const parsed = Number(value.replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
};

export const normalizePricing = (input: PackageCmsInput): PackagePricing | null => {
  const pricing = input.pricing || {};
  const price = normalizeNumber(pricing.price) ?? normalizeNumber(input.price);
  const originalPrice = normalizeNumber(pricing.originalPrice);
  const discount = normalizeNumber(pricing.discount);

  if (price == null && originalPrice == null && discount == null && !pricing.currency) return null;

  return {
    currency: pricing.currency || 'INR',
    price,
    originalPrice,
    discount,
    priceType: pricing.priceType || null,
    occupancy: pricing.occupancy || null,
  };
};

export const normalizeHotels = (value: unknown): PackageHotel[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const city = cleanPackageText(record.city) || null;
      const hotel = cleanPackageText(record.hotel) || null;
      const nights = normalizeNumber(record.nights);
      if (!city && !hotel && nights == null) return null;
      return { city, hotel, nights };
    })
    .filter((item): item is PackageHotel => Boolean(item));
};

export const normalizeItinerary = (value: unknown): PackageItineraryDay[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index): PackageItineraryDay | null => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const day = normalizeNumber(record.day) ?? index + 1;
      const title = cleanPackageText(record.title) || null;
      const description = cleanPackageText(record.description) || null;
      const location = cleanPackageText(record.location) || null;
      const images = normalizeStringArray(record.images);
      if (!title && !description) return null;
      return {
        day,
        title,
        description,
        ...(location ? { location } : {}),
        ...(images.length ? { images } : {}),
      };
    })
    .filter((item): item is PackageItineraryDay => Boolean(item));
};

export const normalizePackageOptions = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const title = cleanPackageText(record.title);
      if (!title) return null;
      return {
        title,
        description: cleanPackageText(record.description) || null,
        price: normalizeNumber(record.price),
        originalPrice: normalizeNumber(record.originalPrice),
        inclusions: normalizeStringArray(record.inclusions),
      };
    })
    .filter(Boolean);
};

export const normalizeFaqs = (value: unknown): PackageFaq[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const question = cleanPackageText(record.question) || null;
      const answer = cleanPackageText(record.answer) || null;
      if (!question && !answer) return null;
      return { question, answer };
    })
    .filter((item): item is PackageFaq => Boolean(item));
};

export const validatePackageImport = (packageData: PackageCmsInput): ImportQuality => {
  const warnings: string[] = [];
  const missing: string[] = [];
  const passed: string[] = [];

  const checks = [
    { label: 'Title', value: packageData.title, points: 10, required: true },
    { label: 'Duration', value: packageData.duration, points: 10, required: true },
    { label: 'Hero Image', value: packageData.heroImage, points: 10, required: true },
    { label: 'Gallery', value: packageData.gallery, points: 5, required: false },
    { label: 'Destinations', value: packageData.destinations || packageData.destination, points: 10, required: true },
    { label: 'Overview', value: packageData.overview, points: 10, required: true },
    { label: 'Itinerary', value: packageData.itinerary, points: 20, required: true },
    { label: 'Hotels', value: packageData.hotels, points: 10, required: false },
    { label: 'Price', value: packageData.pricing?.price ?? packageData.price, points: 10, required: false },
    { label: 'Inclusions', value: packageData.inclusions, points: 5, required: false },
    { label: 'Exclusions', value: packageData.exclusions, points: 5, required: false },
    { label: 'FAQ', value: packageData.faqs, points: 3, required: false },
    { label: 'Policies', value: packageData.policies, points: 2, required: false },
  ];

  let score = 0;

  for (const check of checks) {
    if (hasValue(check.value)) {
      score += check.points;
      passed.push(`${check.label} is present.`);
    } else {
      missing.push(check.label);
      warnings.push(check.required
        ? `${check.label} is required and missing.`
        : `${check.label} is recommended and missing.`);
    }
  }

  const status = score >= 90
    ? 'excellent'
    : score >= 75
      ? 'good'
      : score >= 50
        ? 'needs_review'
        : 'poor';

  return {
    score: Math.max(0, Math.min(100, score)),
    status,
    warnings,
    missing,
    passed,
  };
};

const stableComparable = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stableComparable);
  if (!value || typeof value !== 'object') return value;
  const record = value as Record<string, unknown>;
  return Object.keys(record)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = stableComparable(record[key]);
      return acc;
    }, {});
};

const equalValues = (left: unknown, right: unknown): boolean => (
  JSON.stringify(stableComparable(left)) === JSON.stringify(stableComparable(right))
);

const summarizeDiff = (fields: PackageDiffField[]) => ({
  added: fields.filter((field) => field.type === 'added').length,
  removed: fields.filter((field) => field.type === 'removed').length,
  modified: fields.filter((field) => field.type === 'modified').length,
});

export const comparePackages = (
  before: Partial<PackageCmsDocument | PackageCmsInput> | null | undefined,
  after: Partial<PackageCmsDocument | PackageCmsInput> | null | undefined,
): PackageDiffResult => {
  const beforeRecord = before || {};
  const afterRecord = after || {};
  const fieldsToCompare = [
    'title',
    'duration',
    'destinations',
    'overview',
    'itinerary',
    'hotels',
    'pricing',
    'inclusions',
    'exclusions',
    'packageOptions',
    'knowBeforeYouGo',
    'thingsToCarry',
    'difficultyLevel',
    'faqs',
    'policies',
    'gallery',
    'heroImage',
    'activityId',
  ];
  const fields: PackageDiffField[] = [];

  for (const field of fieldsToCompare) {
    const beforeValue = beforeRecord[field as keyof typeof beforeRecord];
    const afterValue = afterRecord[field as keyof typeof afterRecord];
    if (equalValues(beforeValue, afterValue)) continue;
    const type = !hasValue(beforeValue) && hasValue(afterValue)
      ? 'added'
      : hasValue(beforeValue) && !hasValue(afterValue)
        ? 'removed'
        : 'modified';
    fields.push({ field, type, before: beforeValue ?? null, after: afterValue ?? null });
  }

  return {
    hasChanges: fields.length > 0,
    summary: summarizeDiff(fields),
    fields,
  };
};

export const normalizePackageCmsInput = (input: PackageCmsInput): Omit<PackageCmsDocument, 'id' | 'version' | 'createdAt' | 'updatedAt' | 'publishedAt' | 'createdBy' | 'updatedBy'> => {
  const destinations = normalizeStringArray(input.destinations || [input.destination]);
  const pricing = normalizePricing(input);
  const status: PackageCmsStatus = input.status || 'draft';

  return {
    title: cleanPackageText(input.title),
    slug: slugifyPackageTitle(input.slug || input.title),
    status,
    sourceUrl: input.sourceUrl || null,
    sourceDomain: input.sourceDomain || getSourceDomain(input.sourceUrl),
    heroImage: input.heroImage || null,
    gallery: normalizeStringArray(input.gallery),
    activityId: cleanPackageText(input.activityId) || null,
    duration: cleanPackageText(input.duration) || null,
    destinations,
    overview: cleanPackageText(input.overview) || null,
    itinerary: normalizeItinerary(input.itinerary),
    hotels: normalizeHotels(input.hotels),
    pricing,
    inclusions: normalizeStringArray(input.inclusions),
    exclusions: normalizeStringArray(input.exclusions),
    packageOptions: normalizePackageOptions(input.packageOptions),
    knowBeforeYouGo: normalizeStringArray(input.knowBeforeYouGo),
    thingsToCarry: normalizeStringArray(input.thingsToCarry),
    difficultyLevel: normalizeNumber(input.difficultyLevel),
    faqs: normalizeFaqs(input.faqs),
    policies: normalizeStringArray(input.policies),
    importQuality: input.importQuality || validatePackageImport(input),
    parserVersion: input.parserVersion || PACKAGE_CMS_PARSER_VERSION,
    archivedAt: null,
    deletedAt: null,
    active: status === 'published',
    legacyStatus: status === 'published' ? 'Publish' : 'Draft',
  };
};

export const mapCmsToLegacyPackageFields = (input: Omit<PackageCmsDocument, 'id' | 'version' | 'createdAt' | 'updatedAt' | 'publishedAt' | 'createdBy' | 'updatedBy'>) => {
  const currentPrice = input.pricing?.price || 0;
  const originalPrice = input.pricing?.originalPrice || 0;
  const hasOfferPrice = originalPrice > 0 && currentPrice > 0 && currentPrice < originalPrice;

  return {
    title: input.title,
    destination: input.destinations[0] || '',
    destinations: input.destinations,
    duration: input.duration || '',
    price: hasOfferPrice ? originalPrice : currentPrice,
    offerPrice: hasOfferPrice ? currentPrice : undefined,
    shortDescription: input.overview || '',
    fullDescription: input.overview || '',
    imageUrl: input.gallery[0] || input.heroImage || '',
    packageBannerUrl: input.heroImage || '',
    activityId: input.activityId || null,
    galleryImages: input.gallery,
    gallery: input.gallery,
    itinerary: input.itinerary.map((day, index) => ({
      day: day.day || index + 1,
      title: day.title || '',
      description: day.description || '',
      location: day.location || '',
      images: day.images || [],
    })),
    inclusions: input.inclusions,
    exclusions: input.exclusions,
    packageOptions: input.packageOptions || [],
    knowBeforeYouGo: input.knowBeforeYouGo || [],
    thingsToCarry: input.thingsToCarry || [],
    difficultyLevel: input.difficultyLevel ?? null,
    faqs: input.faqs.map((faq) => ({
      question: faq.question || '',
      answer: faq.answer || '',
    })),
    policies: input.policies,
    heroImage: input.heroImage,
    overview: input.overview,
    hotels: input.hotels,
    pricing: input.pricing,
    sourceUrl: input.sourceUrl,
    sourceDomain: input.sourceDomain,
    parserVersion: input.parserVersion,
    importQuality: input.importQuality,
    cmsStatus: input.status,
    active: input.active,
    status: input.legacyStatus,
  };
};
