import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  where,
  type Firestore,
} from 'firebase/firestore';
import { db as defaultDb } from '../lib/firebase';
import type {
  PackageActivityLog,
  PackageCmsAction,
  PackageCmsDocument,
  PackageCmsInput,
  PackageCmsStatus,
  PackageImportRecord,
  PackageListFilters,
  PackageVersionHistoryEntry,
} from '../types/packageCms';
import {
  PACKAGE_ACTIVITY_LOGS_COLLECTION,
  PACKAGE_CMS_COLLECTION,
  PACKAGE_IMPORTS_COLLECTION,
  cleanPackageText,
  getSourceDomain,
  mapCmsToLegacyPackageFields,
  normalizePackageCmsInput,
  slugifyPackageTitle,
} from '../utils/packageCmsUtils';

type PackageRecord = Record<string, unknown>;

const nowIso = () => new Date().toISOString();

const isPackageCmsStatus = (value: unknown): value is PackageCmsStatus => (
  value === 'draft' || value === 'published' || value === 'archived' || value === 'deleted'
);

const toStringArray = (value: unknown): string[] => (
  Array.isArray(value) ? value.map((item) => cleanPackageText(item)).filter(Boolean) : []
);

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const normalizeTimestamp = (value: unknown): string => {
  if (typeof value === 'string' && value.trim()) return value;
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    const date = value.toDate();
    if (date instanceof Date && Number.isFinite(date.getTime())) return date.toISOString();
  }
  return nowIso();
};

const normalizeNullableTimestamp = (value: unknown): string | null => {
  if (value == null) return null;
  return normalizeTimestamp(value);
};

const removeUndefinedValues = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value
      .map((item) => removeUndefinedValues(item))
      .filter((item) => item !== undefined);
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [key, nestedValue]) => {
      const cleanedValue = removeUndefinedValues(nestedValue);
      if (cleanedValue !== undefined) acc[key] = cleanedValue;
      return acc;
    }, {});
  }

  return value === undefined ? undefined : value;
};

const sanitizeRecord = (record: Record<string, unknown>): Record<string, unknown> => (
  removeUndefinedValues(record) as Record<string, unknown>
);

const mapSnapshotData = (id: string, data: PackageRecord): PackageCmsDocument => {
  const destinations = toStringArray(data.destinations);
  const fallbackDestination = cleanPackageText(data.destination);
  const gallery = toStringArray(data.gallery).length ? toStringArray(data.gallery) : toStringArray(data.galleryImages);
  const status = isPackageCmsStatus(data.cmsStatus)
    ? data.cmsStatus
    : isPackageCmsStatus(data.status)
      ? data.status
      : data.active === false
        ? 'draft'
        : 'published';

  return {
    id,
    title: cleanPackageText(data.title),
    slug: cleanPackageText(data.slug) || id,
    status,
    version: toNumber(data.version, 1),
    sourceUrl: typeof data.sourceUrl === 'string' ? data.sourceUrl : null,
    sourceDomain: typeof data.sourceDomain === 'string' ? data.sourceDomain : getSourceDomain(typeof data.sourceUrl === 'string' ? data.sourceUrl : null),
    heroImage: typeof data.heroImage === 'string'
      ? data.heroImage
      : typeof data.imageUrl === 'string'
        ? data.imageUrl
        : null,
    gallery,
    duration: typeof data.duration === 'string' ? data.duration : null,
    destinations: destinations.length ? destinations : (fallbackDestination ? [fallbackDestination] : []),
    overview: typeof data.overview === 'string'
      ? data.overview
      : typeof data.shortDescription === 'string'
        ? data.shortDescription
        : null,
    itinerary: Array.isArray(data.itinerary) ? data.itinerary as PackageCmsDocument['itinerary'] : [],
    hotels: Array.isArray(data.hotels) ? data.hotels as PackageCmsDocument['hotels'] : [],
    pricing: data.pricing && typeof data.pricing === 'object'
      ? data.pricing as PackageCmsDocument['pricing']
      : {
        currency: 'INR',
        price: toNumber(data.price, 0),
        originalPrice: toNumber(data.offerPrice, 0) || null,
        discount: null,
        priceType: null,
        occupancy: null,
      },
    inclusions: toStringArray(data.inclusions),
    exclusions: toStringArray(data.exclusions),
    faqs: Array.isArray(data.faqs) ? data.faqs as PackageCmsDocument['faqs'] : [],
    policies: toStringArray(data.policies),
    importQuality: data.importQuality && typeof data.importQuality === 'object'
      ? data.importQuality as PackageCmsDocument['importQuality']
      : null,
    parserVersion: typeof data.parserVersion === 'string' ? data.parserVersion : 'manual',
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
    publishedAt: normalizeNullableTimestamp(data.publishedAt),
    archivedAt: normalizeNullableTimestamp(data.archivedAt),
    deletedAt: normalizeNullableTimestamp(data.deletedAt),
    createdBy: typeof data.createdBy === 'string' ? data.createdBy : '',
    updatedBy: typeof data.updatedBy === 'string' ? data.updatedBy : '',
    active: data.active === true,
    legacyStatus: data.active === true ? 'Publish' : 'Draft',
    versionHistory: Array.isArray(data.versionHistory) ? data.versionHistory as PackageVersionHistoryEntry[] : [],
  };
};

const buildVersionSnapshot = (data: PackageRecord): Record<string, unknown> => ({
  title: data.title,
  slug: data.slug,
  status: data.cmsStatus,
  sourceUrl: data.sourceUrl,
  sourceDomain: data.sourceDomain,
  heroImage: data.heroImage,
  gallery: data.gallery,
  duration: data.duration,
  destinations: data.destinations,
  overview: data.overview,
  itinerary: data.itinerary,
  hotels: data.hotels,
  pricing: data.pricing,
  inclusions: data.inclusions,
  exclusions: data.exclusions,
  faqs: data.faqs,
  policies: data.policies,
  importQuality: data.importQuality,
  parserVersion: data.parserVersion,
});

export class PackageRepository {
  constructor(private readonly firestore: Firestore = defaultDb) {}

  private packageRef(packageId: string) {
    return doc(this.firestore, PACKAGE_CMS_COLLECTION, packageId);
  }

  private importsRef() {
    return collection(this.firestore, PACKAGE_IMPORTS_COLLECTION);
  }

  private activityLogsRef() {
    return collection(this.firestore, PACKAGE_ACTIVITY_LOGS_COLLECTION);
  }

  private async findSlugOwner(slug: string, currentPackageId?: string): Promise<string | null> {
    const snapshot = await getDocs(query(
      collection(this.firestore, PACKAGE_CMS_COLLECTION),
      where('slug', '==', slug),
      limit(1),
    ));
    const owner = snapshot.docs[0];
    if (!owner || owner.id === currentPackageId) return null;
    return owner.id;
  }

  async generateSlug(titleOrSlug: string, currentPackageId?: string): Promise<string> {
    const baseSlug = slugifyPackageTitle(titleOrSlug);
    if (!baseSlug) throw new Error('A valid package title is required to generate a slug.');

    let suffix = 1;
    while (suffix < 500) {
      const candidate = suffix === 1 ? baseSlug : `${baseSlug}-${suffix}`;
      const documentSnapshot = await getDoc(this.packageRef(candidate));
      const slugOwner = await this.findSlugOwner(candidate, currentPackageId);
      if ((!documentSnapshot.exists() || documentSnapshot.id === currentPackageId) && !slugOwner) {
        return candidate;
      }
      suffix += 1;
    }

    throw new Error('Unable to generate a unique package slug.');
  }

  async getPackage(packageId: string): Promise<PackageCmsDocument | null> {
    const snapshot = await getDoc(this.packageRef(packageId));
    if (!snapshot.exists()) return null;
    return mapSnapshotData(snapshot.id, snapshot.data());
  }

  async listPackages(filters: PackageListFilters = {}): Promise<PackageCmsDocument[]> {
    const sortBy = filters.sortBy || 'updatedAt';
    const sortDirection = filters.sortDirection || 'desc';
    const snapshot = await getDocs(query(collection(this.firestore, PACKAGE_CMS_COLLECTION), orderBy(sortBy, sortDirection)));
    const search = cleanPackageText(filters.search).toLowerCase();
    const destination = cleanPackageText(filters.destination).toLowerCase();

    return snapshot.docs
      .map((docSnapshot) => mapSnapshotData(docSnapshot.id, docSnapshot.data()))
      .filter((item) => filters.status && filters.status !== 'all' ? item.status === filters.status : item.status !== 'deleted')
      .filter((item) => filters.parserVersion ? item.parserVersion === filters.parserVersion : true)
      .filter((item) => filters.qualityStatus && filters.qualityStatus !== 'all' ? item.importQuality?.status === filters.qualityStatus : true)
      .filter((item) => destination ? item.destinations.some((entry) => entry.toLowerCase().includes(destination)) : true)
      .filter((item) => search
        ? [item.title, item.slug, item.status, ...item.destinations].some((entry) => entry.toLowerCase().includes(search))
        : true);
  }

  async savePackage(
    packageInput: PackageCmsInput,
    userId: string,
    action: PackageCmsAction,
  ): Promise<PackageCmsDocument> {
    const normalized = normalizePackageCmsInput(packageInput);
    const slug = await this.generateSlug(normalized.slug || normalized.title, packageInput.id);
    const packageId = packageInput.id || slug;
    const packageRef = this.packageRef(packageId);
    const timestamp = nowIso();

    await runTransaction(this.firestore, async (transaction) => {
      const existingSnapshot = await transaction.get(packageRef);
      if (!packageInput.id && existingSnapshot.exists()) {
        throw new Error('A package with this slug already exists. Please adjust the title.');
      }
      const existingData = existingSnapshot.exists() ? existingSnapshot.data() : null;
      const existingVersion = existingData ? toNumber(existingData.version, 1) : 0;
      const nextVersion = existingVersion + 1;
      const publishedAt = normalized.status === 'published'
        ? (existingData?.publishedAt || timestamp)
        : existingData?.publishedAt || null;
      const versionHistory = Array.isArray(existingData?.versionHistory)
        ? existingData.versionHistory as PackageVersionHistoryEntry[]
        : [];

      const basePayload = {
        ...(packageInput.legacy || {}),
        ...normalized,
        ...mapCmsToLegacyPackageFields({ ...normalized, slug }),
        slug,
        cmsStatus: normalized.status,
        version: nextVersion,
        updatedAt: timestamp,
        updatedBy: userId,
        publishedAt,
        archivedAt: normalized.status === 'archived' ? timestamp : null,
        deletedAt: normalized.status === 'deleted' ? timestamp : null,
      };
      const payload = existingData
        ? basePayload
        : {
          ...basePayload,
          createdAt: timestamp,
          createdBy: userId,
        };

      const nextVersionHistory = [
        ...versionHistory,
        {
          version: nextVersion,
          savedAt: timestamp,
          savedBy: userId,
          action,
          snapshot: buildVersionSnapshot(payload),
        },
      ].slice(-30);

      transaction.set(packageRef, sanitizeRecord({
        ...payload,
        versionHistory: nextVersionHistory,
      }), { merge: true });

      const logRef = doc(this.activityLogsRef());
      transaction.set(logRef, {
        packageId,
        action,
        actorId: userId,
        createdAt: timestamp,
        message: `${action} package ${normalized.title}`,
        metadata: {
          version: nextVersion,
          status: normalized.status,
          slug,
        },
      });

      if (action === 'import' || action === 're-import') {
        const importRef = doc(this.importsRef());
        transaction.set(importRef, {
          packageId,
          sourceUrl: normalized.sourceUrl,
          parserVersion: normalized.parserVersion,
          importQuality: normalized.importQuality,
          importedAt: timestamp,
          duration: null,
          importedBy: userId,
        });
      }
    });

    const saved = await this.getPackage(packageId);
    if (!saved) throw new Error('Package save failed.');
    return saved;
  }

  async updateStatus(packageId: string, status: PackageCmsStatus, userId: string, action: PackageCmsAction): Promise<PackageCmsDocument> {
    const packageRef = this.packageRef(packageId);
    const timestamp = nowIso();

    await runTransaction(this.firestore, async (transaction) => {
      const snapshot = await transaction.get(packageRef);
      if (!snapshot.exists()) throw new Error('Package not found.');
      const data = snapshot.data();
      const nextVersion = toNumber(data.version, 1) + 1;
      const versionHistory = Array.isArray(data.versionHistory) ? data.versionHistory as PackageVersionHistoryEntry[] : [];

      const patch = {
        cmsStatus: status,
        status: status === 'published' ? 'Publish' : 'Draft',
        active: status === 'published',
        version: nextVersion,
        updatedAt: timestamp,
        updatedBy: userId,
        publishedAt: status === 'published' ? (data.publishedAt || timestamp) : data.publishedAt || null,
        archivedAt: status === 'archived' ? timestamp : null,
        deletedAt: status === 'deleted' ? timestamp : null,
        versionHistory: [
          ...versionHistory,
          {
            version: nextVersion,
            savedAt: timestamp,
            savedBy: userId,
            action,
            snapshot: buildVersionSnapshot({ ...data, cmsStatus: status }),
          },
        ].slice(-30),
      };

      transaction.update(packageRef, sanitizeRecord(patch));
      transaction.set(doc(this.activityLogsRef()), {
        packageId,
        action,
        actorId: userId,
        createdAt: timestamp,
        message: `${action} package ${cleanPackageText(data.title)}`,
        metadata: { version: nextVersion, status },
      });
    });

    const saved = await this.getPackage(packageId);
    if (!saved) throw new Error('Package status update failed.');
    return saved;
  }

  async getImportHistory(packageId: string): Promise<PackageImportRecord[]> {
    const snapshot = await getDocs(query(
      this.importsRef(),
      where('packageId', '==', packageId),
      orderBy('importedAt', 'desc'),
    ));

    return snapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        packageId: cleanPackageText(data.packageId),
        sourceUrl: typeof data.sourceUrl === 'string' ? data.sourceUrl : null,
        parserVersion: cleanPackageText(data.parserVersion),
        importQuality: data.importQuality && typeof data.importQuality === 'object'
          ? data.importQuality as PackageImportRecord['importQuality']
          : null,
        importedAt: normalizeTimestamp(data.importedAt),
        duration: typeof data.duration === 'number' ? data.duration : null,
        importedBy: cleanPackageText(data.importedBy),
      };
    });
  }

  async getActivityLogs(packageId: string): Promise<PackageActivityLog[]> {
    const snapshot = await getDocs(query(
      this.activityLogsRef(),
      where('packageId', '==', packageId),
      orderBy('createdAt', 'desc'),
    ));

    return snapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        packageId: cleanPackageText(data.packageId),
        action: data.action as PackageCmsAction,
        actorId: cleanPackageText(data.actorId),
        createdAt: normalizeTimestamp(data.createdAt),
        message: cleanPackageText(data.message),
        metadata: data.metadata && typeof data.metadata === 'object'
          ? data.metadata as Record<string, unknown>
          : undefined,
      };
    });
  }
}

export const packageRepository = new PackageRepository();
