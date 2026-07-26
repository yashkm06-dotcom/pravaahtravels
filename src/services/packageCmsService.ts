import type { TravelPackage } from '../types';
import type {
  PackageActivityLog,
  PackageCmsDocument,
  PackageCmsInput,
  PackageCmsStatus,
  PackageDiffResult,
  PackageImportRecord,
  PackageListFilters,
  PackagePricing,
} from '../types/packageCms';
import { packageRepository } from '../repositories/packageRepository';
import {
  PACKAGE_CMS_PARSER_VERSION,
  cleanPackageText,
  comparePackages as comparePackageData,
  getSourceDomain,
  normalizePackageCmsInput,
  normalizeStringArray,
  validatePackageImport,
} from '../utils/packageCmsUtils';

const REQUIRED_PUBLISH_FIELDS = ['Title', 'Duration', 'Hero Image', 'Destinations', 'Overview', 'Itinerary'];

const parseNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const parsed = Number(value.replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
};

const compactString = (value: unknown): string | null => {
  const text = cleanPackageText(value);
  return text || null;
};

const packagePricingFromTravelPackage = (pkg: TravelPackage): PackagePricing => ({
  currency: pkg.pricing?.currency || 'INR',
  price: pkg.pricing?.price ?? pkg.offerPrice ?? pkg.price ?? null,
  originalPrice: pkg.pricing?.originalPrice ?? (pkg.offerPrice ? pkg.price : null),
  discount: pkg.pricing?.discount ?? null,
  priceType: pkg.pricing?.priceType ?? 'Per Person',
  occupancy: pkg.pricing?.occupancy ?? null,
});

export const travelPackageToCmsInput = (
  pkg: TravelPackage,
  overrides: Partial<PackageCmsInput> = {},
): PackageCmsInput => {
  const gallery = normalizeStringArray(pkg.gallery || pkg.galleryImages || []);
  const heroImage = compactString(pkg.heroImage || pkg.packageBannerUrl || pkg.imageUrl);
  const destinations = normalizeStringArray(pkg.destinations || [pkg.destination]);

  return {
    id: pkg.id,
    title: cleanPackageText(pkg.title),
    slug: pkg.slug,
    status: pkg.cmsStatus || (pkg.active ? 'published' : 'draft'),
    sourceUrl: pkg.sourceUrl || null,
    sourceDomain: pkg.sourceDomain || getSourceDomain(pkg.sourceUrl),
    heroImage,
    gallery,
    duration: compactString(pkg.duration),
    destinations,
    destination: compactString(pkg.destination),
    overview: compactString(pkg.overview || pkg.shortDescription || pkg.fullDescription),
    itinerary: (pkg.itinerary || []).map((day, index) => ({
      day: day.day || index + 1,
      title: compactString(day.title),
      description: compactString(day.description),
    })),
    hotels: pkg.hotels || [],
    pricing: packagePricingFromTravelPackage(pkg),
    price: pkg.offerPrice || pkg.price || null,
    inclusions: pkg.inclusions || [],
    exclusions: pkg.exclusions || [],
    faqs: (pkg.faqs || []).map((faq) => ({
      question: compactString(faq.question),
      answer: compactString(faq.answer),
    })),
    policies: pkg.policies || [],
    importQuality: pkg.importQuality || null,
    parserVersion: pkg.parserVersion || 'manual-cms',
    legacy: {
      ...pkg,
      id: undefined,
    },
    ...overrides,
  };
};

export const formPackageToCmsInput = (
  formData: {
    title: string;
    destination: string;
    location: string;
    bookingType: string;
    maxGuests: number;
    category: string;
    duration: string;
    price: number;
    offerPrice: number;
    packageCode: string;
    pickup: string;
    shortDescription: string;
    fullDescription: string;
    imageUrl: string;
    packageBannerUrl: string;
    galleryImages: string;
    highlights: string;
    thingsToCarry: string;
    departureDates: string;
    faqs: string;
    policies: string;
    activityId: string;
    seoTitle: string;
    seoDescription: string;
    featured: boolean;
    active: boolean;
    status: 'Publish' | 'Draft';
  },
  itinerary: TravelPackage['itinerary'],
  inclusions: string[],
  exclusions: string[],
  editingPackage?: TravelPackage | null,
): PackageCmsInput => {
  const parseListField = (value: string) => value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

  const parseFaqs = (value: string) => value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf('|');
      if (separatorIndex === -1) return { question: line, answer: '' };
      return {
        question: line.slice(0, separatorIndex).trim(),
        answer: line.slice(separatorIndex + 1).trim(),
      };
    })
    .filter((faq) => faq.question);

  const galleryImages = parseListField(formData.galleryImages);
  const policies = parseListField(formData.policies);
  const heroImage = formData.packageBannerUrl.trim() || formData.imageUrl.trim();
  const price = parseNumber(formData.offerPrice) || parseNumber(formData.price) || 0;
  const originalPrice = formData.offerPrice ? parseNumber(formData.price) : null;

  return {
    id: editingPackage?.id,
    title: formData.title,
    status: formData.active ? 'published' : 'draft',
    sourceUrl: editingPackage?.sourceUrl || null,
    sourceDomain: editingPackage?.sourceDomain || null,
    heroImage,
    gallery: galleryImages,
    duration: formData.duration,
    destinations: [formData.destination],
    destination: formData.destination,
    overview: formData.shortDescription || formData.fullDescription,
    itinerary: itinerary.map((day, index) => ({
      day: day.day || index + 1,
      title: day.title || '',
      description: day.description || '',
    })),
    hotels: editingPackage?.hotels || [],
    pricing: {
      currency: 'INR',
      price,
      originalPrice,
      discount: null,
      priceType: 'Per Person',
      occupancy: null,
    },
    price,
    inclusions,
    exclusions,
    faqs: parseFaqs(formData.faqs),
    policies,
    importQuality: editingPackage?.importQuality || null,
    parserVersion: editingPackage?.parserVersion || 'manual-cms',
    legacy: {
      title: formData.title,
      destination: formData.destination,
      location: formData.location,
      bookingType: formData.bookingType,
      maxGuests: Number(formData.maxGuests) || 0,
      category: formData.category,
      duration: formData.duration,
      price: Number(formData.price) || 0,
      offerPrice: Number(formData.offerPrice) || undefined,
      packageCode: formData.packageCode.trim(),
      pickup: formData.pickup.trim(),
      shortDescription: formData.shortDescription,
      fullDescription: formData.fullDescription,
      imageUrl: formData.imageUrl.trim(),
      packageBannerUrl: formData.packageBannerUrl.trim(),
      galleryImages,
      highlights: parseListField(formData.highlights),
      thingsToCarry: parseListField(formData.thingsToCarry),
      departureDates: parseListField(formData.departureDates),
      faqs: parseFaqs(formData.faqs),
      policies,
      activityId: formData.activityId,
      seoTitle: formData.seoTitle.trim(),
      seoDescription: formData.seoDescription.trim(),
      featured: formData.featured,
      active: formData.active,
      status: formData.active ? 'Publish' : 'Draft',
      itinerary,
      inclusions,
      exclusions,
    },
  };
};

const ensureTitle = (input: PackageCmsInput) => {
  if (!cleanPackageText(input.title)) {
    throw new Error('Package title is required.');
  }
};

const ensureCanPublish = (input: PackageCmsInput) => {
  const quality = validatePackageImport(input);
  const blockingMissing = quality.missing.filter((field) => REQUIRED_PUBLISH_FIELDS.includes(field));

  if (blockingMissing.length) {
    throw new Error(`Cannot publish package. Missing: ${blockingMissing.join(', ')}.`);
  }
};

export const saveDraftPackage = async (
  packageData: PackageCmsInput,
  userId: string,
): Promise<PackageCmsDocument> => {
  ensureTitle(packageData);
  return packageRepository.savePackage({ ...packageData, status: 'draft' }, userId, packageData.id ? 'update' : 'create');
};

export const saveImportedDraftPackage = async (
  packageData: PackageCmsInput,
  userId: string,
): Promise<PackageCmsDocument> => {
  ensureTitle(packageData);
  return packageRepository.savePackage({ ...packageData, status: 'draft' }, userId, packageData.id ? 're-import' : 'import');
};

export const publishPackage = async (
  packageData: PackageCmsInput,
  userId: string,
): Promise<PackageCmsDocument> => {
  ensureTitle(packageData);
  ensureCanPublish({ ...packageData, status: 'published' });
  return packageRepository.savePackage({ ...packageData, status: 'published' }, userId, packageData.id ? 'publish' : 'create');
};

export const publishImportedPackage = async (
  packageData: PackageCmsInput,
  userId: string,
): Promise<PackageCmsDocument> => {
  ensureTitle(packageData);
  ensureCanPublish({ ...packageData, status: 'published' });
  return packageRepository.savePackage({ ...packageData, status: 'published' }, userId, packageData.id ? 're-import' : 'import');
};

export const updatePackage = async (
  packageId: string,
  packageData: PackageCmsInput,
  userId: string,
): Promise<PackageCmsDocument> => {
  ensureTitle(packageData);
  const status = packageData.status || 'draft';
  if (status === 'published') ensureCanPublish(packageData);
  return packageRepository.savePackage({ ...packageData, id: packageId, status }, userId, 'update');
};

export const archivePackage = async (
  packageId: string,
  userId: string,
): Promise<PackageCmsDocument> => packageRepository.updateStatus(packageId, 'archived', userId, 'archive');

export const restorePackage = async (
  packageId: string,
  userId: string,
): Promise<PackageCmsDocument> => packageRepository.updateStatus(packageId, 'draft', userId, 'restore');

export const softDeletePackage = async (
  packageId: string,
  userId: string,
): Promise<PackageCmsDocument> => packageRepository.updateStatus(packageId, 'deleted', userId, 'delete');

export const deletePackage = softDeletePackage;

export const duplicatePackage = async (
  packageId: string,
  userId: string,
): Promise<PackageCmsDocument> => {
  const original = await packageRepository.getPackage(packageId);
  if (!original) throw new Error('Package not found.');

  const duplicateInput = normalizePackageCmsInput({
    ...original,
    id: undefined,
    title: `Copy of ${original.title}`,
    slug: undefined,
    status: 'draft',
    sourceUrl: original.sourceUrl,
    parserVersion: original.parserVersion || PACKAGE_CMS_PARSER_VERSION,
  });

  return packageRepository.savePackage({
    ...duplicateInput,
    id: undefined,
    status: 'draft',
  }, userId, 'duplicate');
};

export const listPackages = (
  filters?: PackageListFilters,
): Promise<PackageCmsDocument[]> => packageRepository.listPackages(filters);

export const getPackage = (
  packageId: string,
): Promise<PackageCmsDocument | null> => packageRepository.getPackage(packageId);

export const getPackageImportHistory = (
  packageId: string,
): Promise<PackageImportRecord[]> => packageRepository.getImportHistory(packageId);

export const getPackageActivityLogs = (
  packageId: string,
): Promise<PackageActivityLog[]> => packageRepository.getActivityLogs(packageId);

export const comparePackages = (
  before: Partial<PackageCmsDocument | PackageCmsInput> | null | undefined,
  after: Partial<PackageCmsDocument | PackageCmsInput> | null | undefined,
): PackageDiffResult => comparePackageData(before, after);
