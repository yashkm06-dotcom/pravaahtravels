import { createHash, randomUUID } from 'node:crypto';
import { appendFile, readFile, stat, writeFile } from 'node:fs/promises';
import { applicationDefault, deleteApp, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type DocumentData, type Firestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import sharp from 'sharp';

const SOURCE_PROJECT_ID: string = 'zealous-theory-q09p9';
const SOURCE_DATABASE_ID: string = 'ai-studio-e139cba2-4b0b-4550-a190-1ca3520d6d45';
const SOURCE_BUCKET: string = 'zealous-theory-q09p9.firebasestorage.app';
const DESTINATION_PROJECT_ID: string = 'pravaah-travels-test';
const DESTINATION_DATABASE_ID: string = '(default)';
const DESTINATION_BUCKET: string = 'pravaah-travels-test.firebasestorage.app';

const APPLY_CONFIRMATION = 'MIGRATE_PUBLIC_CONTENT:zealous-theory-q09p9:pravaah-travels-test';
const SOURCE_APP_NAME = 'public-content-migration-source-read-only';
const DESTINATION_APP_NAME = 'public-content-migration-destination';
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 100_000_000;
const MAX_APPROXIMATE_FIRESTORE_TRANSACTION_BYTES = 4 * 1024 * 1024;
const OVERSIZED_SOURCE_OBJECT = 'packages/1786261447134_xifyyu_Generated_Image_August_09__2026___1_13PM.jpg';
const EXPECTED_OVERSIZED_SOURCE_BYTES = 11_077_292;
const NORMAL_COPY_MARKER = 'byte-for-byte-copy-v1';
const JPEG_TRANSFORM_MARKER = 'resize-jpeg-under-10mib-v1';

const EXPECTED_SOURCE_COUNTS = {
  packages: 61,
  gallery: 0,
  activities: 7,
  activityItems: 40,
  activityRecommendations: 0,
  featuredCategories: 0,
  hotels: 0,
  blogs: 0,
} as const;

const EXPECTED_STORAGE_INVENTORY = {
  referenceOccurrences: 1_310,
  uniqueObjects: 994,
  existingObjects: 746,
  missingObjects: 248,
  missingReferenceOccurrences: 312,
  oversizedObjects: 1,
} as const;

const MIGRATED_COLLECTIONS = ['packages', 'activities', 'activityItems'] as const;
type MigratedCollection = (typeof MIGRATED_COLLECTIONS)[number] | 'siteSettings';

const SKIPPED_COLLECTIONS = [
  'reviews',
  'users/**',
  'bookings',
  'enquiries',
  'analytics_events',
  'sent_emails',
  'imports',
  'activityLogs',
  'hotels',
  'blogs',
] as const;

const PACKAGE_ALLOWED_FIELDS = new Set([
  'active',
  'activityId',
  'activityTypes',
  'archivedAt',
  'bookingType',
  'category',
  'city',
  'cmsStatus',
  'country',
  'createdAt',
  'deletedAt',
  'departureDates',
  'destination',
  'destinations',
  'difficultyLabel',
  'difficultyLevel',
  'displayOrder',
  'duration',
  'exclusions',
  'faqs',
  'featured',
  'fullDescription',
  'gallery',
  'galleryImages',
  'heroImage',
  'highlights',
  'homepageCategory',
  'hotelIds',
  'hotels',
  'imageUrl',
  'inclusions',
  'itinerary',
  'knowBeforeYouGo',
  'legacyStatus',
  'location',
  'maxGuests',
  'mealPlans',
  'offerPrice',
  'overview',
  'packageBannerUrl',
  'packageCode',
  'packageOptions',
  'pickup',
  'policies',
  'price',
  'pricing',
  'publishedAt',
  'seoDescription',
  'seoKeywords',
  'seoTitle',
  'shortDescription',
  'slug',
  'sourceDomain',
  'sourceUrl',
  'status',
  'tags',
  'thingsToCarry',
  'title',
  'transportType',
  'updatedAt',
  'version',
]);

const PACKAGE_OMITTED_FIELDS = new Set([
  'createdBy',
  'updatedBy',
  'versionHistory',
  'importQuality',
  'parserVersion',
  // Live capacity/booking state is operational, not public CMS content.
  'departures',
]);

const ACTIVITY_ALLOWED_FIELDS = new Set([
  'category',
  'createdAt',
  'description',
  'enabled',
  'imageUrl',
  'location',
  'order',
  'subtitle',
  'title',
]);

const ACTIVITY_ITEM_ALLOWED_FIELDS = new Set([
  'activityId',
  'buttonLink',
  'buttonText',
  'createdAt',
  'description',
  'enabled',
  'imageUrl',
  'linkedPackageId',
  'linkedPackageIds',
  'order',
  'startingPrice',
  'subtitle',
  'thumbnailUrl',
  'title',
]);

const SITE_SETTINGS_ALLOWED_FIELDS = new Set([
  'bookingEmail',
  'city',
  'companyName',
  'companyTagline',
  'contactDescription',
  'contactHeading',
  'copyrightText',
  'country',
  'faviconUrl',
  'featuredCountryOrder',
  'featuredDestinationOrder',
  'footerAddress',
  'footerContactInfo',
  'footerEmail',
  'footerPhone',
  'footerText',
  'googleMapsEmbedUrl',
  'heroBackgroundImageUrl',
  'heroCtaLink',
  'heroCtaText',
  'heroSubtitle',
  'heroTitle',
  'heroTitleAccent',
  'homepageCategoryOrder',
  'inactiveCountryNames',
  'inactiveDestinationNames',
  'logoUrl',
  'officeAddress',
  'officeName',
  'officeWorkingHours',
  'ogImageUrl',
  'postalCode',
  'primaryEmail',
  'primaryPhone',
  'secondaryEmail',
  'secondaryPhone',
  'seoDescription',
  'seoKeywords',
  'seoTitle',
  'socialFacebook',
  'socialInstagram',
  'socialLinkedIn',
  'socialX',
  'state',
  'supportEmail',
  'twitterImageUrl',
  'updatedAt',
  'weekendHours',
  'whatsappNumber',
]);

const SITE_SETTINGS_OMITTED_FIELDS = new Set([
  'googleAnalyticsId',
  'googleTagManagerId',
  'facebookPixelId',
  'gstNumber',
  'panNumber',
]);

const CONTACT_VALUE_FIELDS = new Set([
  'primaryEmail',
  'footerEmail',
  'supportEmail',
  'primaryPhone',
  'footerPhone',
  'whatsappNumber',
  'contactHeading',
  'contactDescription',
  'footerContactInfo',
  'footerAddress',
  'officeAddress',
  'officeName',
  'officeWorkingHours',
  'weekendHours',
  'city',
  'state',
  'postalCode',
  'country',
  'googleMapsEmbedUrl',
]);

const PRIVATE_FIELD_NAMES = new Set([
  'userid',
  'uid',
  'authuid',
  'ownerid',
  'bookingid',
  'bookingreference',
  'customerid',
  'customeremail',
  'customerphone',
  'customername',
  'paymentid',
  'paymentstatus',
  'transactionid',
  'assignedstaff',
  'assignedtripmanager',
  'staffid',
  'staffuid',
  'savedby',
  'createdby',
  'updatedby',
  'versionhistory',
  'bookedseats',
  'internalnotes',
  'privatenotes',
  'adminnotes',
  'supplierid',
  'supplieremail',
  'supplierphone',
  'vendorid',
  'agentid',
  'commission',
  'commissionrate',
  'netcost',
  'suppliercost',
  'internalcost',
  'travelleremail',
  'traveleremail',
  'travellerphone',
  'travelerphone',
  'travellername',
  'travelername',
  'guestemail',
  'guestphone',
  'guestname',
  'passportnumber',
  'aadhaarnumber',
]);

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const OMIT = Symbol('omit-broken-storage-reference');

type RecordData = Record<string, unknown>;
type RewriteResult = unknown | typeof OMIT;

interface SourceDocument {
  collection: MigratedCollection;
  id: string;
  data: DocumentData;
  updateTime: string;
}

interface PreparedDocument {
  collection: MigratedCollection;
  id: string;
  data: RecordData;
  destinationExists: boolean;
  destinationUpdateTime: string | null;
  destinationDataHash: string | null;
}

interface ParsedStorageReference {
  bucket: string;
  objectPath: string;
}

interface SourceObjectSnapshot {
  exists: boolean;
  generation: string | null;
  metageneration: string | null;
  md5Hash: string | null;
  crc32c: string | null;
  size: number | null;
  contentType: string | null;
}

interface AssetPlan extends SourceObjectSnapshot {
  sourceObjectPath: string;
  destinationObjectPath: string;
  destinationUrl: string | null;
  destinationToken: string | null;
  destinationExists: boolean;
  destinationGeneration: string | null;
  operation: 'missing' | 'copy' | 'reuse' | 'transform';
  transformedFinalBytes: number | null;
  transformedMd5Hash: string | null;
  transformedSha256: string | null;
  transformedOutput: Buffer | null;
}

interface MissingReference {
  collection: MigratedCollection;
  documentId: string;
  fieldPath: string;
  sourceObjectPath: string;
}

interface RewriteContext {
  collection: MigratedCollection;
  documentId: string;
}

interface WriteCounters {
  sourceWritesAttempted: number;
  destinationDocumentsMerged: number;
  destinationObjectsCopied: number;
  destinationObjectsReused: number;
  destinationObjectsTransformed: number;
  destinationDeletesAttempted: number;
}

const args = process.argv.slice(2);
if (args.some((arg) => arg !== '--apply') || args.filter((arg) => arg === '--apply').length > 1) {
  throw new Error('The only supported argument is --apply. Project, database, bucket, collection, UID, and email arguments are forbidden.');
}
const apply = args.includes('--apply');

const writeCounters: WriteCounters = {
  sourceWritesAttempted: 0,
  destinationDocumentsMerged: 0,
  destinationObjectsCopied: 0,
  destinationObjectsReused: 0,
  destinationObjectsTransformed: 0,
  destinationDeletesAttempted: 0,
};

const sanitizedFieldCounts: Record<string, number> = {};
const missingReferences: MissingReference[] = [];
const preparedFieldPaths: Record<MigratedCollection, Set<string>> = {
  packages: new Set(),
  activities: new Set(),
  activityItems: new Set(),
  siteSettings: new Set(),
};
let storageReferenceOccurrences = 0;
let currentPhase = 'startup';
const completedStoragePlans: string[] = [];
const attemptedStorageWrites: string[] = [];
const createdStorageObjects: string[] = [];

const assertImmutableEndpoints = () => {
  if (SOURCE_PROJECT_ID !== 'zealous-theory-q09p9') throw new Error('Source project invariant failed.');
  if (SOURCE_DATABASE_ID !== 'ai-studio-e139cba2-4b0b-4550-a190-1ca3520d6d45') throw new Error('Source database invariant failed.');
  if (SOURCE_BUCKET !== 'zealous-theory-q09p9.firebasestorage.app') throw new Error('Source bucket invariant failed.');
  if (DESTINATION_PROJECT_ID !== 'pravaah-travels-test') throw new Error('Destination project invariant failed.');
  if (DESTINATION_DATABASE_ID !== '(default)') throw new Error('Destination database invariant failed.');
  if (DESTINATION_BUCKET !== 'pravaah-travels-test.firebasestorage.app') throw new Error('Destination bucket invariant failed.');
  if (String(SOURCE_PROJECT_ID) === String(DESTINATION_PROJECT_ID)) throw new Error('Source and destination projects must differ.');
  if (String(SOURCE_DATABASE_ID) === String(DESTINATION_DATABASE_ID)) throw new Error('Source and destination database IDs must differ.');
  if (String(SOURCE_BUCKET) === String(DESTINATION_BUCKET)) throw new Error('Source and destination buckets must differ.');
  if (String(DESTINATION_PROJECT_ID) === String(SOURCE_PROJECT_ID)
    || String(DESTINATION_DATABASE_ID) === String(SOURCE_DATABASE_ID)
    || String(DESTINATION_BUCKET) === String(SOURCE_BUCKET)) {
    throw new Error('Production can never be a migration destination.');
  }
};

const assertExecutionEnvironment = async () => {
  const emulatorVariables = [
    'FIRESTORE_EMULATOR_HOST',
    'FIREBASE_STORAGE_EMULATOR_HOST',
    'STORAGE_EMULATOR_HOST',
    'FIREBASE_AUTH_EMULATOR_HOST',
  ];
  for (const name of emulatorVariables) {
    if (process.env[name]?.trim()) throw new Error(`Safety check failed: ${name} must not be set for this migration.`);
  }

  const projectVariables = [
    'GOOGLE_CLOUD_PROJECT',
    'GCLOUD_PROJECT',
    'GCP_PROJECT',
    'CLOUDSDK_PROJECT',
    'CLOUDSDK_CORE_PROJECT',
  ];
  for (const name of projectVariables) {
    const value = process.env[name]?.trim();
    if (value && value !== DESTINATION_PROJECT_ID) {
      throw new Error(`Safety check failed: ${name} targets ${value}, not ${DESTINATION_PROJECT_ID}.`);
    }
  }

  if (process.env.GOOGLE_CLOUD_PROJECT !== DESTINATION_PROJECT_ID) {
    throw new Error(`GOOGLE_CLOUD_PROJECT must be exactly ${DESTINATION_PROJECT_ID}.`);
  }

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (!credentialsPath) throw new Error('GOOGLE_APPLICATION_CREDENTIALS is required; authenticate with GitHub Actions WIF first.');
  const credentialsStat = await stat(credentialsPath);
  if (!credentialsStat.isFile() || credentialsStat.size === 0) throw new Error('The WIF application-default credentials file is missing or empty.');
  const credentialConfiguration = JSON.parse(await readFile(credentialsPath, 'utf8')) as { type?: string; audience?: string };
  if (credentialConfiguration.type !== 'external_account' || !credentialConfiguration.audience?.includes('workloadIdentityPools')) {
    throw new Error('Application Default Credentials must be a GitHub Actions Workload Identity Federation external-account configuration.');
  }

  const firebaseConfig = process.env.FIREBASE_CONFIG?.trim();
  if (firebaseConfig) {
    if (firebaseConfig.includes(SOURCE_PROJECT_ID)) throw new Error('FIREBASE_CONFIG must not reference production.');
    if (firebaseConfig.startsWith('{')) {
      const parsed = JSON.parse(firebaseConfig) as { projectId?: string };
      if (parsed.projectId && parsed.projectId !== DESTINATION_PROJECT_ID) {
        throw new Error(`FIREBASE_CONFIG targets unexpected project ${parsed.projectId}.`);
      }
    }
  }

  if (process.env.GITHUB_ACTIONS === 'true' && process.env.GITHUB_REF !== 'refs/heads/staging') {
    throw new Error('GitHub Actions execution is permitted only on refs/heads/staging.');
  }

  if (apply) {
    if (process.env.GITHUB_ACTIONS !== 'true' || process.env.GITHUB_REF !== 'refs/heads/staging') {
      throw new Error('Apply mode is permitted only through the guarded staging GitHub Actions workflow.');
    }
    if (process.env.MIGRATION_CONFIRMATION !== APPLY_CONFIRMATION) {
      throw new Error(`Apply mode requires MIGRATION_CONFIRMATION=${APPLY_CONFIRMATION}.`);
    }
  }
};

const canonicalize = (value: unknown): unknown => {
  if (value === null || value === undefined || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Date) return { __date: value.toISOString() };
  if (Array.isArray(value)) return value.map(canonicalize);
  if (typeof value === 'object') {
    const candidate = value as { toDate?: () => Date; seconds?: number; nanoseconds?: number; latitude?: number; longitude?: number; path?: string };
    if (typeof candidate.seconds === 'number' && typeof candidate.nanoseconds === 'number') {
      return { __timestamp: [candidate.seconds, candidate.nanoseconds] };
    }
    if (typeof candidate.toDate === 'function') return { __timestamp: candidate.toDate().toISOString() };
    if (typeof candidate.latitude === 'number' && typeof candidate.longitude === 'number') {
      return { __geoPoint: [candidate.latitude, candidate.longitude] };
    }
    if (typeof candidate.path === 'string' && candidate.constructor?.name === 'DocumentReference') {
      return { __documentReference: candidate.path };
    }
    return Object.fromEntries(
      Object.entries(value as RecordData)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    );
  }
  return String(value);
};

const timestampIdentity = (value: unknown): string => {
  if (!value || typeof value !== 'object') return 'missing-update-time';
  const candidate = value as { seconds?: number; nanoseconds?: number; toDate?: () => Date };
  if (typeof candidate.seconds === 'number' && typeof candidate.nanoseconds === 'number') {
    return `${candidate.seconds}:${candidate.nanoseconds}`;
  }
  return typeof candidate.toDate === 'function' ? candidate.toDate().toISOString() : 'missing-update-time';
};

const hashValue = (value: unknown) => {
  const serialized = JSON.stringify(canonicalize(value));
  return createHash('sha256').update(serialized ?? 'undefined').digest('hex');
};

const normalizeForPlanHash = (value: unknown): unknown => {
  if (typeof value === 'string') {
    const parsed = parseStorageReference(value);
    if (parsed?.bucket === DESTINATION_BUCKET) return `gs://${DESTINATION_BUCKET}/${parsed.objectPath}`;
    return value;
  }
  if (Array.isArray(value)) return value.map(normalizeForPlanHash);
  if (!isPlainRecord(value)) return value;
  return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, normalizeForPlanHash(nested)]));
};

const isPlainRecord = (value: unknown): value is RecordData => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const errorStatus = (error: unknown): number | string | undefined => {
  if (!error || typeof error !== 'object') return undefined;
  const candidate = error as { code?: number | string; statusCode?: number | string };
  return candidate.code ?? candidate.statusCode;
};

const isNotFound = (error: unknown) => {
  const status = errorStatus(error);
  return status === 404 || status === '404' || status === 'NOT_FOUND' || status === 5;
};

const increment = (record: Record<string, number>, key: string, amount = 1) => {
  record[key] = (record[key] ?? 0) + amount;
};

const createLimiter = (concurrency: number) => {
  let active = 0;
  const queue: Array<() => void> = [];
  const runNext = () => {
    if (active >= concurrency) return;
    const next = queue.shift();
    if (!next) return;
    active += 1;
    next();
  };
  return <T>(task: () => Promise<T>): Promise<T> => new Promise<T>((resolve, reject) => {
    queue.push(() => {
      task().then(resolve, reject).finally(() => {
        active -= 1;
        runNext();
      });
    });
    runNext();
  });
};

const runWritesFailClosed = async <T>(
  items: T[],
  concurrency: number,
  task: (item: T) => Promise<void>,
) => {
  let nextIndex = 0;
  let firstError: unknown;
  const worker = async () => {
    while (firstError === undefined) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      try {
        await task(items[index]);
      } catch (error) {
        firstError ??= error;
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  if (firstError !== undefined) throw firstError;
};

const storageReadLimit = createLimiter(24);

const fetchCollection = async (database: Firestore, collection: MigratedCollection): Promise<SourceDocument[]> => {
  const snapshot = await database.collection(collection).get();
  return snapshot.docs
    .map((document) => ({
      collection,
      id: document.id,
      data: document.data(),
      updateTime: timestampIdentity(document.updateTime),
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
};

const fetchSiteSettingsMain = async (database: Firestore): Promise<SourceDocument> => {
  const snapshot = await database.collection('siteSettings').doc('main').get();
  if (!snapshot.exists) throw new Error('Required source document siteSettings/main does not exist.');
  return {
    collection: 'siteSettings',
    id: 'main',
    data: snapshot.data() ?? {},
    updateTime: timestampIdentity(snapshot.updateTime),
  };
};

const fetchNoOpCounts = async (database: Firestore) => {
  const names = ['gallery', 'activityRecommendations', 'featuredCategories', 'hotels', 'blogs'] as const;
  const entries = await Promise.all(names.map(async (name) => [name, (await database.collection(name).get()).size] as const));
  return Object.fromEntries(entries) as Record<(typeof names)[number], number>;
};

const validateSourceDocuments = (
  collections: Record<'packages' | 'activities' | 'activityItems', SourceDocument[]>,
  noOpCounts: Record<'gallery' | 'activityRecommendations' | 'featuredCategories' | 'hotels' | 'blogs', number>,
) => {
  for (const name of MIGRATED_COLLECTIONS) {
    if (collections[name].length !== EXPECTED_SOURCE_COUNTS[name]) {
      throw new Error(`Source count drift: ${name} expected ${EXPECTED_SOURCE_COUNTS[name]}, found ${collections[name].length}. Re-audit before continuing.`);
    }
  }
  for (const [name, count] of Object.entries(noOpCounts)) {
    const expected = EXPECTED_SOURCE_COUNTS[name as keyof typeof EXPECTED_SOURCE_COUNTS];
    if (count !== expected) throw new Error(`Source count drift: ${name} expected ${expected}, found ${count}. Re-audit before continuing.`);
  }

  const nonPublicPackages = collections.packages.filter((document) => document.data.active !== true);
  if (nonPublicPackages.length) throw new Error(`Expected all 61 packages to be active; non-public package IDs: ${nonPublicPackages.map((item) => item.id).join(', ')}`);

  const disabledActivities = [...collections.activities, ...collections.activityItems].filter((document) => document.data.enabled === false);
  if (disabledActivities.length) throw new Error(`Expected all activity documents to be enabled; disabled IDs: ${disabledActivities.map((item) => `${item.collection}/${item.id}`).join(', ')}`);

  for (const document of collections.packages) {
    if (document.data.createdAt === undefined) throw new Error(`packages/${document.id} is missing createdAt and would disappear from the public ordered query.`);
  }
  for (const document of [...collections.activities, ...collections.activityItems]) {
    if (typeof document.data.order !== 'number') throw new Error(`${document.collection}/${document.id} is missing numeric order.`);
  }
};

const pickAllowedFields = (
  source: DocumentData,
  allowed: Set<string>,
  omitted: Set<string>,
  documentPath: string,
): RecordData => {
  const unknown = Object.keys(source).filter((key) => !allowed.has(key) && !omitted.has(key));
  if (unknown.length) throw new Error(`${documentPath} contains unreviewed fields: ${unknown.sort().join(', ')}`);

  const result: RecordData = {};
  for (const [key, value] of Object.entries(source)) {
    if (omitted.has(key)) {
      increment(sanitizedFieldCounts, `${documentPath.split('/')[0]}.${key}`);
      continue;
    }
    if (allowed.has(key)) result[key] = value;
  }
  return result;
};

const assertNoPrivateFields = (value: unknown, documentPath: string, path = ''): void => {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoPrivateFields(item, documentPath, `${path}[${index}]`));
    return;
  }
  if (value instanceof Date) return;
  if (value instanceof Uint8Array) throw new Error(`${documentPath} contains binary/private data at ${path || '(root)'}.`);
  if (value && typeof value === 'object' && !isPlainRecord(value)) {
    const candidate = value as { constructor?: { name?: string }; toDate?: () => Date; latitude?: number; longitude?: number };
    const typeName = candidate.constructor?.name ?? 'unknown Firestore value';
    if (typeName === 'Timestamp' && typeof candidate.toDate === 'function') return;
    if (typeName === 'GeoPoint' && typeof candidate.latitude === 'number' && typeof candidate.longitude === 'number') return;
    throw new Error(`${documentPath} contains unsupported ${typeName} at ${path || '(root)'}; references and opaque values are never migrated.`);
  }
  if (!isPlainRecord(value)) return;
  for (const [key, nested] of Object.entries(value)) {
    const nestedPath = path ? `${path}.${key}` : key;
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (PRIVATE_FIELD_NAMES.has(normalizedKey)) throw new Error(`${documentPath} retains forbidden private/operational field ${nestedPath}.`);
    assertNoPrivateFields(nested, documentPath, nestedPath);
  }
};

const assertOmittedFieldsAbsent = (data: RecordData, omitted: Set<string>, documentPath: string) => {
  const present = [...omitted].filter((field) => Object.prototype.hasOwnProperty.call(data, field));
  if (present.length) throw new Error(`${documentPath} contains fields that this migration must omit: ${present.sort().join(', ')}`);
};

const assertNoUnmanagedExistingFields = (
  existing: unknown,
  prepared: unknown,
  documentPath: string,
  path = '',
): void => {
  if (!isPlainRecord(existing) || !isPlainRecord(prepared)) return;
  for (const [key, nested] of Object.entries(existing)) {
    const nestedPath = path ? `${path}.${key}` : key;
    if (!Object.prototype.hasOwnProperty.call(prepared, key)) {
      throw new Error(`${documentPath} contains stale/unmanaged staging field ${nestedPath}; merge was refused and nothing will be deleted automatically.`);
    }
    assertNoUnmanagedExistingFields(nested, prepared[key], documentPath, nestedPath);
  }
};

const collectPreparedFieldPaths = (collection: MigratedCollection, value: unknown, path = ''): void => {
  if (Array.isArray(value)) {
    value.forEach((item) => collectPreparedFieldPaths(collection, item, `${path}[]`));
    return;
  }
  if (!isPlainRecord(value)) return;
  for (const [key, nested] of Object.entries(value)) {
    const nestedPath = path ? `${path}.${key}` : key;
    preparedFieldPaths[collection].add(nestedPath);
    collectPreparedFieldPaths(collection, nested, nestedPath);
  }
};

const parseStorageReference = (value: string): ParsedStorageReference | null => {
  if (value.startsWith('gs://')) {
    const remainder = value.slice(5);
    const slash = remainder.indexOf('/');
    if (slash <= 0) return null;
    return { bucket: remainder.slice(0, slash), objectPath: remainder.slice(slash + 1) };
  }

  try {
    const url = new URL(value);
    if (url.hostname === 'firebasestorage.googleapis.com') {
      const match = url.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
      if (!match) return null;
      return { bucket: decodeURIComponent(match[1]), objectPath: decodeURIComponent(match[2]) };
    }
    if (url.hostname === 'storage.googleapis.com') {
      const parts = url.pathname.split('/').filter(Boolean).map((part) => decodeURIComponent(part));
      if (parts.length < 2) return null;
      const [bucket, ...objectParts] = parts;
      return { bucket, objectPath: objectParts.join('/') };
    }
    if (url.hostname.endsWith('.storage.googleapis.com')) {
      return { bucket: url.hostname.slice(0, -'.storage.googleapis.com'.length), objectPath: decodeURIComponent(url.pathname.replace(/^\//, '')) };
    }
  } catch {
    return null;
  }
  return null;
};

const assertSafeObjectPath = (objectPath: string) => {
  if (!objectPath || objectPath.startsWith('/') || objectPath.includes('\0')) throw new Error(`Unsafe Storage object path: ${objectPath}`);
  const segments = objectPath.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) throw new Error(`Unsafe or ambiguous Storage object path: ${objectPath}`);
  if (objectPath.includes('%2f') || objectPath.includes('%2F') || objectPath.includes('%5c') || objectPath.includes('%5C')) {
    throw new Error(`Double-encoded Storage path is not allowed: ${objectPath}`);
  }
};

const destinationObjectPathFor = (sourceObjectPath: string): string => {
  assertSafeObjectPath(sourceObjectPath);
  if (sourceObjectPath.startsWith('packages/')) return sourceObjectPath;
  if (sourceObjectPath.startsWith('cms/')) return sourceObjectPath;
  if (sourceObjectPath.startsWith('activities/activities/')) {
    return `homepage-cms/activities/${sourceObjectPath.slice('activities/activities/'.length)}`;
  }
  if (sourceObjectPath.startsWith('activities/activityItems/')) {
    return `homepage-cms/activityItems/${sourceObjectPath.slice('activities/activityItems/'.length)}`;
  }
  throw new Error(`Unapproved production Storage prefix: ${sourceObjectPath}`);
};

const isApprovedAssetField = (collection: MigratedCollection, fieldPath: string): boolean => {
  if (collection === 'packages') {
    return /^(imageUrl|packageBannerUrl|heroImage)$/.test(fieldPath)
      || /^(gallery|galleryImages)\[\d+\]$/.test(fieldPath)
      || /^itinerary\[\d+\]\.images\[\d+\]$/.test(fieldPath);
  }
  if (collection === 'activities') return fieldPath === 'imageUrl';
  if (collection === 'activityItems') return fieldPath === 'thumbnailUrl' || fieldPath === 'imageUrl';
  if (collection === 'siteSettings') {
    return ['heroBackgroundImageUrl', 'logoUrl', 'faviconUrl', 'ogImageUrl', 'twitterImageUrl'].includes(fieldPath);
  }
  return false;
};

const mimeFromMagicBytes = (bytes: Buffer): string | null => {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (bytes.length >= 6 && ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString('ascii'))) return 'image/gif';
  return null;
};

const extractDestinationToken = (metadata: RecordData | undefined): string | null => {
  const value = metadata?.firebaseStorageDownloadTokens;
  if (typeof value !== 'string') return null;
  const token = value.split(',').map((item) => item.trim()).find(Boolean);
  return token ?? null;
};

const destinationDownloadUrl = (objectPath: string, token: string) => (
  `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(DESTINATION_BUCKET)}/o/${encodeURIComponent(objectPath)}?alt=media&token=${encodeURIComponent(token)}`
);

const metadataSnapshot = (metadata: RecordData): SourceObjectSnapshot => ({
  exists: true,
  generation: metadata.generation === undefined ? null : String(metadata.generation),
  metageneration: metadata.metageneration === undefined ? null : String(metadata.metageneration),
  md5Hash: typeof metadata.md5Hash === 'string' ? metadata.md5Hash : null,
  crc32c: typeof metadata.crc32c === 'string' ? metadata.crc32c : null,
  size: Number(metadata.size),
  contentType: typeof metadata.contentType === 'string' ? metadata.contentType.toLowerCase().split(';')[0] : null,
});

const missingObjectSnapshot = (): SourceObjectSnapshot => ({
  exists: false,
  generation: null,
  metageneration: null,
  md5Hash: null,
  crc32c: null,
  size: null,
  contentType: null,
});

const assetPlanCache = new Map<string, Promise<AssetPlan>>();

const createAssetPlanner = (sourceApp: App, destinationApp: App) => {
  const sourceBucket = getStorage(sourceApp).bucket(SOURCE_BUCKET);
  const destinationBucket = getStorage(destinationApp).bucket(DESTINATION_BUCKET);

  if (sourceBucket.name !== SOURCE_BUCKET || destinationBucket.name !== DESTINATION_BUCKET) {
    throw new Error('Explicit Storage bucket verification failed.');
  }

  const inspect = async (sourceObjectPath: string): Promise<AssetPlan> => storageReadLimit(async () => {
    const destinationObjectPath = destinationObjectPathFor(sourceObjectPath);
    const sourceFile = sourceBucket.file(sourceObjectPath);
    let sourceMetadata: RecordData;
    try {
      const [metadata] = await sourceFile.getMetadata();
      sourceMetadata = metadata as unknown as RecordData;
    } catch (error) {
      if (isNotFound(error)) {
        return {
          ...missingObjectSnapshot(),
          sourceObjectPath,
          destinationObjectPath,
          destinationUrl: null,
          destinationToken: null,
          destinationExists: false,
          destinationGeneration: null,
          operation: 'missing',
          transformedFinalBytes: null,
          transformedMd5Hash: null,
          transformedSha256: null,
          transformedOutput: null,
        };
      }
      throw new Error(`Cannot read production Storage metadata for ${sourceObjectPath}. Required read permission may be missing. ${error instanceof Error ? error.message : String(error)}`);
    }

    const source = metadataSnapshot(sourceMetadata);
    if (sourceMetadata.bucket !== SOURCE_BUCKET || sourceMetadata.name !== sourceObjectPath) {
      throw new Error(`Production Storage metadata identity mismatch for ${sourceObjectPath}.`);
    }
    if (!Number.isFinite(source.size) || source.size === null || source.size < 1) throw new Error(`Invalid source object size for ${sourceObjectPath}.`);
    if (!source.contentType || !ALLOWED_IMAGE_TYPES.has(source.contentType)) throw new Error(`Unexpected source MIME ${source.contentType ?? '(missing)'} for ${sourceObjectPath}.`);
    if (!source.generation || !source.metageneration || !source.md5Hash) {
      throw new Error(`Source object ${sourceObjectPath} lacks generation/checksum metadata required for an immutable migration.`);
    }

    const pinnedSourceFile = sourceBucket.file(sourceObjectPath, { generation: source.generation });
    const [prefixBytes] = await pinnedSourceFile.download({ start: 0, end: 31, validation: false });
    const magicType = mimeFromMagicBytes(prefixBytes);
    if (magicType !== source.contentType) throw new Error(`Magic-byte MIME ${magicType ?? '(unknown)'} does not match metadata ${source.contentType} for ${sourceObjectPath}.`);

    const transform = source.size > MAX_IMAGE_BYTES;
    if (transform && sourceObjectPath !== OVERSIZED_SOURCE_OBJECT) {
      throw new Error(`Unapproved oversized source object ${sourceObjectPath} (${source.size} bytes).`);
    }
    if (sourceObjectPath === OVERSIZED_SOURCE_OBJECT && source.size !== EXPECTED_OVERSIZED_SOURCE_BYTES) {
      throw new Error(`Approved oversized object changed from ${EXPECTED_OVERSIZED_SOURCE_BYTES} to ${source.size} bytes; re-approve before continuing.`);
    }
    if (transform && source.contentType !== 'image/jpeg') throw new Error('The approved oversized transform is restricted to JPEG input.');

    let transformedOutput: Buffer | null = null;
    let transformedFinalBytes: number | null = null;
    let transformedMd5Hash: string | null = null;
    let transformedSha256: string | null = null;
    if (transform) {
      const [input] = await pinnedSourceFile.download({ validation: 'crc32c' });
      if (input.length !== source.size) throw new Error(`Pinned oversized source size mismatch for ${sourceObjectPath}.`);
      if (createHash('md5').update(input).digest('base64') !== source.md5Hash) {
        throw new Error(`Pinned oversized source checksum mismatch for ${sourceObjectPath}.`);
      }
      transformedOutput = await transformOversizedJpeg(input);
      transformedFinalBytes = transformedOutput.length;
      transformedMd5Hash = createHash('md5').update(transformedOutput).digest('base64');
      transformedSha256 = createHash('sha256').update(transformedOutput).digest('hex');
    }

    const destinationFile = destinationBucket.file(destinationObjectPath);
    let destinationMetadata: RecordData | null = null;
    try {
      const [metadata] = await destinationFile.getMetadata();
      destinationMetadata = metadata as unknown as RecordData;
    } catch (error) {
      if (!isNotFound(error)) throw new Error(`Cannot inspect staging Storage destination ${destinationObjectPath}: ${error instanceof Error ? error.message : String(error)}`);
    }

    const destinationExists = destinationMetadata !== null;
    const existingToken = extractDestinationToken(destinationMetadata?.metadata as RecordData | undefined);
    const token = existingToken ?? randomUUID();
    let operation: AssetPlan['operation'] = transform ? 'transform' : 'copy';

    if (destinationMetadata) {
      if (destinationMetadata.bucket !== DESTINATION_BUCKET || destinationMetadata.name !== destinationObjectPath) {
        throw new Error(`Staging Storage metadata identity mismatch for ${destinationObjectPath}.`);
      }
      const destination = metadataSnapshot(destinationMetadata);
      const customMetadata = destinationMetadata.metadata as RecordData | undefined;
      const migratedGeneration = customMetadata?.migrationSourceGeneration;
      const provenanceMatches = customMetadata?.migrationSourceProject === SOURCE_PROJECT_ID
        && customMetadata?.migrationSourceBucket === SOURCE_BUCKET
        && customMetadata?.migrationSourceObject === sourceObjectPath
        && migratedGeneration !== undefined
        && String(migratedGeneration) === source.generation
        && customMetadata?.migrationSourceMd5Hash === source.md5Hash
        && customMetadata?.migrationSourceCrc32c === (source.crc32c ?? 'missing');
      const identicalNormalObject = !transform
        && destination.size === source.size
        && destination.contentType === source.contentType
        && destination.md5Hash === source.md5Hash
        && (source.crc32c === null || destination.crc32c === source.crc32c)
        && provenanceMatches
        && customMetadata?.migrationOperation === NORMAL_COPY_MARKER
        && customMetadata?.migrationOutputSha256 === 'not-transformed'
        && Boolean(existingToken);
      const validExistingTransform = transform
        && destination.contentType === 'image/jpeg'
        && destination.size !== null
        && destination.size > 0
        && destination.size === transformedFinalBytes
        && destination.md5Hash === transformedMd5Hash
        && provenanceMatches
        && customMetadata?.migrationOperation === JPEG_TRANSFORM_MARKER
        && customMetadata?.migrationOutputSha256 === transformedSha256
        && Boolean(existingToken);
      if (identicalNormalObject || validExistingTransform) {
        operation = 'reuse';
      } else {
        throw new Error(`Staging Storage collision at ${destinationObjectPath}; existing content is not the same approved source generation. No overwrite was attempted.`);
      }
    }

    return {
      ...source,
      sourceObjectPath,
      destinationObjectPath,
      destinationUrl: destinationDownloadUrl(destinationObjectPath, token),
      destinationToken: token,
      destinationExists,
      destinationGeneration: destinationMetadata?.generation === undefined ? null : String(destinationMetadata.generation),
      operation,
      transformedFinalBytes,
      transformedMd5Hash,
      transformedSha256,
      transformedOutput,
    };
  });

  return (sourceObjectPath: string): Promise<AssetPlan> => {
    const cached = assetPlanCache.get(sourceObjectPath);
    if (cached) return cached;
    const planned = inspect(sourceObjectPath);
    assetPlanCache.set(sourceObjectPath, planned);
    return planned;
  };
};

const rewriteStorageReferences = async (
  value: unknown,
  context: RewriteContext,
  fieldPath: string,
  planAsset: (sourceObjectPath: string) => Promise<AssetPlan>,
): Promise<RewriteResult> => {
  if (typeof value === 'string') {
    const parsed = parseStorageReference(value);
    if (!parsed) {
      if (value.includes(SOURCE_BUCKET) || value.includes(SOURCE_PROJECT_ID) || value.includes(SOURCE_DATABASE_ID)) {
        throw new Error(`${context.collection}/${context.documentId} contains an unparseable production reference at ${fieldPath}.`);
      }
      return value;
    }

    if (parsed.bucket === DESTINATION_BUCKET) {
      throw new Error(`${context.collection}/${context.documentId} source data unexpectedly references the staging bucket at ${fieldPath}.`);
    }
    if (parsed.bucket !== SOURCE_BUCKET) {
      throw new Error(`${context.collection}/${context.documentId} contains an unapproved Firebase/GCS bucket ${parsed.bucket} at ${fieldPath}.`);
    }
    if (!isApprovedAssetField(context.collection, fieldPath)) {
      throw new Error(`${context.collection}/${context.documentId} contains a production Storage URL in unapproved field ${fieldPath}.`);
    }

    storageReferenceOccurrences += 1;
    const plan = await planAsset(parsed.objectPath);
    if (!plan.exists) {
      missingReferences.push({
        collection: context.collection,
        documentId: context.documentId,
        fieldPath,
        sourceObjectPath: parsed.objectPath,
      });
      return OMIT;
    }
    if (!plan.destinationUrl) throw new Error(`No staging URL was planned for existing object ${parsed.objectPath}.`);
    return plan.destinationUrl;
  }

  if (Array.isArray(value)) {
    const rewritten = await Promise.all(value.map((item, index) => rewriteStorageReferences(item, context, `${fieldPath}[${index}]`, planAsset)));
    return rewritten.filter((item): item is Exclude<RewriteResult, typeof OMIT> => item !== OMIT);
  }

  if (!isPlainRecord(value)) return value;
  const entries = await Promise.all(Object.entries(value).map(async ([key, nested]) => {
    const nestedPath = fieldPath ? `${fieldPath}.${key}` : key;
    const rewritten = await rewriteStorageReferences(nested, context, nestedPath, planAsset);
    return [key, rewritten] as const;
  }));
  return Object.fromEntries(entries.filter((entry): entry is readonly [string, Exclude<RewriteResult, typeof OMIT>] => entry[1] !== OMIT));
};

const assertNoProductionReferences = (value: unknown, documentPath: string, fieldPath = ''): void => {
  if (typeof value === 'string') {
    if (value.includes(SOURCE_BUCKET) || value.includes(SOURCE_PROJECT_ID) || value.includes(SOURCE_DATABASE_ID)) {
      throw new Error(`${documentPath} still references production at ${fieldPath}.`);
    }
    const parsed = parseStorageReference(value);
    if (parsed?.bucket === SOURCE_BUCKET) throw new Error(`${documentPath} still references production Storage at ${fieldPath}.`);
    if (parsed?.objectPath.startsWith('users/')) throw new Error(`${documentPath} contains a forbidden users/** Storage reference at ${fieldPath}.`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoProductionReferences(item, documentPath, `${fieldPath}[${index}]`));
    return;
  }
  if (!isPlainRecord(value)) return;
  for (const [key, nested] of Object.entries(value)) {
    assertNoProductionReferences(nested, documentPath, fieldPath ? `${fieldPath}.${key}` : key);
  }
};

const prepareDocument = async (
  document: SourceDocument,
  destinationDatabase: Firestore,
  planAsset: (sourceObjectPath: string) => Promise<AssetPlan>,
): Promise<PreparedDocument> => {
  const documentPath = `${document.collection}/${document.id}`;
  let selected: RecordData;
  if (document.collection === 'packages') {
    selected = pickAllowedFields(document.data, PACKAGE_ALLOWED_FIELDS, PACKAGE_OMITTED_FIELDS, documentPath);
  } else if (document.collection === 'activities') {
    selected = pickAllowedFields(document.data, ACTIVITY_ALLOWED_FIELDS, new Set(), documentPath);
  } else if (document.collection === 'activityItems') {
    selected = pickAllowedFields(document.data, ACTIVITY_ITEM_ALLOWED_FIELDS, new Set(), documentPath);
  } else {
    selected = pickAllowedFields(document.data, SITE_SETTINGS_ALLOWED_FIELDS, SITE_SETTINGS_OMITTED_FIELDS, documentPath);
  }

  assertNoPrivateFields(selected, documentPath);
  const rewritten = await rewriteStorageReferences(selected, { collection: document.collection, documentId: document.id }, '', planAsset);
  if (rewritten === OMIT || !isPlainRecord(rewritten)) throw new Error(`Prepared document ${documentPath} is invalid.`);
  if (document.collection === 'siteSettings') {
    for (const field of CONTACT_VALUE_FIELDS) {
      if (hashValue(selected[field]) !== hashValue(rewritten[field])) {
        throw new Error(`Public contact value ${field} changed during sanitization; migration aborted.`);
      }
    }
  }
  assertNoPrivateFields(rewritten, documentPath);
  assertNoProductionReferences(rewritten, documentPath);
  collectPreparedFieldPaths(document.collection, rewritten);

  const approximateBytes = Buffer.byteLength(JSON.stringify(canonicalize(rewritten)), 'utf8');
  if (approximateBytes > 1_000_000) throw new Error(`${documentPath} is approximately ${approximateBytes} bytes and is too close to the Firestore document limit.`);

  const destinationSnapshot = await destinationDatabase.collection(document.collection).doc(document.id).get();
  if (destinationSnapshot.exists) {
    const existingData = destinationSnapshot.data() ?? {};
    assertNoProductionReferences(existingData, `existing staging ${documentPath}`);
    assertNoPrivateFields(existingData, `existing staging ${documentPath}`);
    if (document.collection === 'packages') assertOmittedFieldsAbsent(existingData, PACKAGE_OMITTED_FIELDS, `existing staging ${documentPath}`);
    if (document.collection === 'siteSettings') assertOmittedFieldsAbsent(existingData, SITE_SETTINGS_OMITTED_FIELDS, `existing staging ${documentPath}`);
    assertNoUnmanagedExistingFields(existingData, rewritten, `existing staging ${documentPath}`);
  }

  return {
    collection: document.collection,
    id: document.id,
    data: rewritten,
    destinationExists: destinationSnapshot.exists,
    destinationUpdateTime: destinationSnapshot.exists ? timestampIdentity(destinationSnapshot.updateTime) : null,
    destinationDataHash: destinationSnapshot.exists ? hashValue(destinationSnapshot.data() ?? {}) : null,
  };
};

const sourceDocumentFingerprint = (documents: SourceDocument[]) => hashValue(documents.map((document) => ({
  collection: document.collection,
  id: document.id,
  updateTime: document.updateTime,
  dataHash: hashValue(document.data),
})));

const sourceObjectFingerprint = (plans: AssetPlan[]) => hashValue(plans.map((plan) => ({
  sourceObjectPath: plan.sourceObjectPath,
  exists: plan.exists,
  generation: plan.generation,
  metageneration: plan.metageneration,
  md5Hash: plan.md5Hash,
  crc32c: plan.crc32c,
  size: plan.size,
  contentType: plan.contentType,
})).sort((left, right) => left.sourceObjectPath.localeCompare(right.sourceObjectPath)));

const recheckSourceObjects = async (sourceApp: App, plans: AssetPlan[]) => {
  const sourceBucket = getStorage(sourceApp).bucket(SOURCE_BUCKET);
  const snapshots = await Promise.all(plans.map((plan) => storageReadLimit(async () => {
    try {
      const [metadata] = await sourceBucket.file(plan.sourceObjectPath).getMetadata();
      return { sourceObjectPath: plan.sourceObjectPath, ...metadataSnapshot(metadata as unknown as RecordData) };
    } catch (error) {
      if (isNotFound(error)) return { sourceObjectPath: plan.sourceObjectPath, ...missingObjectSnapshot() };
      throw error;
    }
  })));
  const actual = hashValue(snapshots.sort((left, right) => left.sourceObjectPath.localeCompare(right.sourceObjectPath)));
  const expected = hashValue(plans.map((plan) => ({
    sourceObjectPath: plan.sourceObjectPath,
    exists: plan.exists,
    generation: plan.generation,
    metageneration: plan.metageneration,
    md5Hash: plan.md5Hash,
    crc32c: plan.crc32c,
    size: plan.size,
    contentType: plan.contentType,
  })).sort((left, right) => left.sourceObjectPath.localeCompare(right.sourceObjectPath)));
  if (actual !== expected) throw new Error('Production Storage objects changed during the migration run; no further writes are allowed.');
};

const recheckSourceDocuments = async (sourceDatabase: Firestore, expectedFingerprint: string) => {
  const [packages, activities, activityItems, siteSettings] = await Promise.all([
    fetchCollection(sourceDatabase, 'packages'),
    fetchCollection(sourceDatabase, 'activities'),
    fetchCollection(sourceDatabase, 'activityItems'),
    fetchSiteSettingsMain(sourceDatabase),
  ]);
  const actual = sourceDocumentFingerprint([...packages, ...activities, ...activityItems, siteSettings]);
  if (actual !== expectedFingerprint) throw new Error('Production Firestore documents changed during the migration run; no further writes are allowed.');
};

const transformOversizedJpeg = async (input: Buffer): Promise<Buffer> => {
  const metadata = await sharp(input, { failOn: 'error', limitInputPixels: MAX_IMAGE_PIXELS }).metadata();
  if (!metadata.width || !metadata.height || metadata.width * metadata.height > MAX_IMAGE_PIXELS) {
    throw new Error('Oversized JPEG exceeds the decoded-pixel safety limit.');
  }

  let maxDimension = 4_096;
  let quality = 84;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const output = await sharp(input, { failOn: 'error', limitInputPixels: MAX_IMAGE_PIXELS })
      .rotate()
      .resize({ width: maxDimension, height: maxDimension, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
    if (output.length <= MAX_IMAGE_BYTES) return output;
    maxDimension = Math.max(1_600, Math.floor(maxDimension * 0.82));
    quality = Math.max(52, quality - 7);
  }
  throw new Error('Could not safely transform the approved JPEG below 10 MiB.');
};

const destinationMetadata = (plan: AssetPlan) => ({
  firebaseStorageDownloadTokens: plan.destinationToken ?? randomUUID(),
  migrationSourceProject: SOURCE_PROJECT_ID,
  migrationSourceBucket: SOURCE_BUCKET,
  migrationSourceObject: plan.sourceObjectPath,
  migrationSourceGeneration: plan.generation ?? 'missing',
  migrationSourceMd5Hash: plan.md5Hash ?? 'missing',
  migrationSourceCrc32c: plan.crc32c ?? 'missing',
  migrationOperation: plan.transformedSha256 ? JPEG_TRANSFORM_MARKER : NORMAL_COPY_MARKER,
  migrationOutputSha256: plan.transformedSha256 ?? 'not-transformed',
});

const verifyDestinationObjectMetadata = (
  plan: AssetPlan,
  metadata: RecordData,
  phase: string,
  expectedGeneration: string | null,
): SourceObjectSnapshot => {
  if (metadata.bucket !== DESTINATION_BUCKET || metadata.name !== plan.destinationObjectPath) {
    throw new Error(`${phase}: staging object identity mismatch for ${plan.destinationObjectPath}.`);
  }
  const snapshot = metadataSnapshot(metadata);
  if (!snapshot.generation || (expectedGeneration !== null && snapshot.generation !== expectedGeneration)) {
    throw new Error(`${phase}: staging generation mismatch for ${plan.destinationObjectPath}.`);
  }
  const customMetadata = metadata.metadata as RecordData | undefined;
  if (extractDestinationToken(customMetadata) !== plan.destinationToken
    || customMetadata?.migrationSourceProject !== SOURCE_PROJECT_ID
    || customMetadata?.migrationSourceBucket !== SOURCE_BUCKET
    || customMetadata?.migrationSourceObject !== plan.sourceObjectPath
    || customMetadata?.migrationSourceGeneration !== plan.generation
    || customMetadata?.migrationSourceMd5Hash !== plan.md5Hash
    || customMetadata?.migrationSourceCrc32c !== (plan.crc32c ?? 'missing')) {
    throw new Error(`${phase}: staging provenance/token mismatch for ${plan.destinationObjectPath}.`);
  }

  if (plan.transformedSha256) {
    if (customMetadata?.migrationOperation !== JPEG_TRANSFORM_MARKER
      || customMetadata?.migrationOutputSha256 !== plan.transformedSha256
      || snapshot.contentType !== 'image/jpeg'
      || snapshot.size !== plan.transformedFinalBytes
      || snapshot.md5Hash !== plan.transformedMd5Hash
      || snapshot.size === null
      || snapshot.size < 1
      || snapshot.size > MAX_IMAGE_BYTES) {
      throw new Error(`${phase}: transformed staging object mismatch for ${plan.destinationObjectPath}.`);
    }
  } else if (customMetadata?.migrationOperation !== NORMAL_COPY_MARKER
    || customMetadata?.migrationOutputSha256 !== 'not-transformed'
    || snapshot.size !== plan.size
    || snapshot.contentType !== plan.contentType
    || snapshot.md5Hash !== plan.md5Hash
    || (plan.crc32c !== null && snapshot.crc32c !== plan.crc32c)) {
    throw new Error(`${phase}: copied staging object mismatch for ${plan.destinationObjectPath}.`);
  }
  return snapshot;
};

const performStorageWrites = async (sourceApp: App, destinationApp: App, plans: AssetPlan[]) => {
  const sourceBucket = getStorage(sourceApp).bucket(SOURCE_BUCKET);
  const destinationBucket = getStorage(destinationApp).bucket(DESTINATION_BUCKET);

  await runWritesFailClosed(plans.filter((plan) => plan.exists), 8, async (plan) => {
    const destinationFile = destinationBucket.file(plan.destinationObjectPath);
    if (plan.operation === 'reuse') {
      const [metadata] = await destinationFile.getMetadata();
      verifyDestinationObjectMetadata(plan, metadata as unknown as RecordData, 'reuse verification', plan.destinationGeneration);
      writeCounters.destinationObjectsReused += 1;
      completedStoragePlans.push(plan.destinationObjectPath);
      return;
    }
    if (!plan.destinationToken) throw new Error(`Destination token was not planned for ${plan.sourceObjectPath}.`);
    if (!plan.generation) throw new Error(`Source generation was not planned for ${plan.sourceObjectPath}.`);

    const sourceFile = sourceBucket.file(plan.sourceObjectPath, { generation: plan.generation });
    if (plan.operation === 'transform') {
      if (!plan.transformedOutput || plan.transformedOutput.length !== plan.transformedFinalBytes) {
        throw new Error(`Approved transformed output is unavailable for ${plan.sourceObjectPath}.`);
      }
      attemptedStorageWrites.push(plan.destinationObjectPath);
      await destinationFile.save(plan.transformedOutput, {
        resumable: false,
        validation: 'crc32c',
        preconditionOpts: { ifGenerationMatch: 0 },
        metadata: {
          contentType: 'image/jpeg',
          cacheControl: 'public, max-age=31536000, immutable',
          metadata: destinationMetadata(plan),
        },
      });
      createdStorageObjects.push(plan.destinationObjectPath);
    } else {
      attemptedStorageWrites.push(plan.destinationObjectPath);
      await sourceFile.copy(destinationFile, {
        contentType: plan.contentType ?? undefined,
        cacheControl: 'public, max-age=31536000, immutable',
        metadata: destinationMetadata(plan),
        preconditionOpts: { ifGenerationMatch: 0 },
      });
      createdStorageObjects.push(plan.destinationObjectPath);
    }

    const [verified] = await destinationFile.getMetadata();
    const verifiedSnapshot = verifyDestinationObjectMetadata(
      plan,
      verified as unknown as RecordData,
      'post-write verification',
      null,
    );
    plan.destinationGeneration = verifiedSnapshot.generation;
    if (plan.operation === 'transform') writeCounters.destinationObjectsTransformed += 1;
    else writeCounters.destinationObjectsCopied += 1;
    completedStoragePlans.push(plan.destinationObjectPath);
  });
};

const performFirestoreWrites = async (destinationDatabase: Firestore, documents: PreparedDocument[]) => {
  const references = documents.map((document) => destinationDatabase.collection(document.collection).doc(document.id));
  await destinationDatabase.runTransaction(async (transaction) => {
    const snapshots = await transaction.getAll(...references);
    snapshots.forEach((snapshot, index) => {
      const planned = documents[index];
      if (snapshot.exists !== planned.destinationExists) {
        throw new Error(`Staging document existence changed after approval: ${planned.collection}/${planned.id}.`);
      }
      if (snapshot.exists
        && (timestampIdentity(snapshot.updateTime) !== planned.destinationUpdateTime
          || hashValue(snapshot.data() ?? {}) !== planned.destinationDataHash)) {
        throw new Error(`Staging document changed after approval: ${planned.collection}/${planned.id}.`);
      }
    });
    references.forEach((reference, index) => {
      transaction.set(reference, documents[index].data, { merge: true });
    });
  });
  writeCounters.destinationDocumentsMerged += documents.length;
};

const destinationCollectionState = async (destinationDatabase: Firestore, sourceDocuments: SourceDocument[]) => {
  const sourceIdsByCollection = new Map<string, Set<string>>();
  for (const document of sourceDocuments) {
    const ids = sourceIdsByCollection.get(document.collection) ?? new Set<string>();
    ids.add(document.id);
    sourceIdsByCollection.set(document.collection, ids);
  }

  const result: Record<string, { count: number; creates: number; merges: number; unexpectedDocumentIds: string[] }> = {};
  for (const collection of MIGRATED_COLLECTIONS) {
    const snapshot = await destinationDatabase.collection(collection).get();
    const sourceIds = sourceIdsByCollection.get(collection) ?? new Set<string>();
    const destinationIds = new Set(snapshot.docs.map((document) => document.id));
    const unexpectedDocumentIds = [...destinationIds].filter((id) => !sourceIds.has(id)).sort();
    result[collection] = {
      count: snapshot.size,
      creates: [...sourceIds].filter((id) => !destinationIds.has(id)).length,
      merges: [...sourceIds].filter((id) => destinationIds.has(id)).length,
      unexpectedDocumentIds,
    };
  }

  const siteSnapshot = await destinationDatabase.collection('siteSettings').doc('main').get();
  result['siteSettings/main'] = {
    count: siteSnapshot.exists ? 1 : 0,
    creates: siteSnapshot.exists ? 0 : 1,
    merges: siteSnapshot.exists ? 1 : 0,
    unexpectedDocumentIds: [],
  };
  return result;
};

const assertNoUnexpectedDestinationDocuments = (state: Awaited<ReturnType<typeof destinationCollectionState>>) => {
  const conflicts = Object.entries(state).flatMap(([collection, details]) => details.unexpectedDocumentIds.map((id) => `${collection}/${id}`));
  if (conflicts.length) throw new Error(`Staging has extra selected-collection documents and the migration will not delete them: ${conflicts.join(', ')}`);
};

const verifyDestination = async (
  destinationDatabase: Firestore,
  destinationApp: App,
  preparedDocuments: PreparedDocument[],
  plans: AssetPlan[],
) => {
  const expectedIds = new Map<string, Set<string>>();
  const expectedDocuments = new Map<string, PreparedDocument>();
  for (const document of preparedDocuments) {
    const set = expectedIds.get(document.collection) ?? new Set<string>();
    set.add(document.id);
    expectedIds.set(document.collection, set);
    expectedDocuments.set(`${document.collection}/${document.id}`, document);
  }

  const counts: Record<string, number> = {};
  for (const collection of MIGRATED_COLLECTIONS) {
    const snapshot = await destinationDatabase.collection(collection).get();
    counts[collection] = snapshot.size;
    const actualIds = new Set(snapshot.docs.map((document) => document.id));
    const expected = expectedIds.get(collection) ?? new Set<string>();
    if (snapshot.size !== expected.size || [...expected].some((id) => !actualIds.has(id))) {
      throw new Error(`Staging ${collection} IDs/count do not match the approved source set.`);
    }
    snapshot.docs.forEach((document) => {
      const data = document.data();
      const prepared = expectedDocuments.get(`${collection}/${document.id}`);
      if (!prepared || hashValue(data) !== hashValue(prepared.data)) {
        throw new Error(`Staging ${collection}/${document.id} does not exactly match the approved sanitized document.`);
      }
      assertNoProductionReferences(data, `staging ${collection}/${document.id}`);
      assertNoPrivateFields(data, `staging ${collection}/${document.id}`);
      if (collection === 'packages') assertOmittedFieldsAbsent(data, PACKAGE_OMITTED_FIELDS, `staging ${collection}/${document.id}`);
    });
  }

  const siteSnapshot = await destinationDatabase.collection('siteSettings').doc('main').get();
  if (!siteSnapshot.exists) throw new Error('Staging siteSettings/main verification failed.');
  const verifiedSiteSettings = siteSnapshot.data() ?? {};
  const preparedSiteSettings = expectedDocuments.get('siteSettings/main');
  if (!preparedSiteSettings || hashValue(verifiedSiteSettings) !== hashValue(preparedSiteSettings.data)) {
    throw new Error('Staging siteSettings/main does not exactly match the approved sanitized document.');
  }
  assertNoProductionReferences(verifiedSiteSettings, 'staging siteSettings/main');
  assertNoPrivateFields(verifiedSiteSettings, 'staging siteSettings/main');
  assertOmittedFieldsAbsent(verifiedSiteSettings, SITE_SETTINGS_OMITTED_FIELDS, 'staging siteSettings/main');
  counts['siteSettings/main'] = 1;

  const destinationBucket = getStorage(destinationApp).bucket(DESTINATION_BUCKET);
  await Promise.all(plans.filter((plan) => plan.exists).map((plan) => storageReadLimit(async () => {
    const destinationFile = destinationBucket.file(plan.destinationObjectPath);
    const [metadata] = await destinationFile.getMetadata();
    const snapshot = verifyDestinationObjectMetadata(
      plan,
      metadata as unknown as RecordData,
      'final verification',
      plan.destinationGeneration,
    );
    if (!snapshot.generation || !snapshot.contentType) throw new Error(`Staging object metadata is incomplete: ${plan.destinationObjectPath}`);
    const [prefixBytes] = await destinationBucket.file(plan.destinationObjectPath, { generation: snapshot.generation })
      .download({ start: 0, end: 31, validation: false });
    if (mimeFromMagicBytes(prefixBytes) !== snapshot.contentType) {
      throw new Error(`Staging object magic-byte MIME mismatch: ${plan.destinationObjectPath}`);
    }
  })));

  return counts;
};

const buildReport = ({
  mode,
  planHash,
  sourceCounts,
  destinationBefore,
  documents,
  plans,
  sourceUnchanged,
  destinationVerification,
}: {
  mode: 'dry-run' | 'apply';
  planHash: string;
  sourceCounts: Record<string, number>;
  destinationBefore: Awaited<ReturnType<typeof destinationCollectionState>>;
  documents: PreparedDocument[];
  plans: AssetPlan[];
  sourceUnchanged: boolean;
  destinationVerification: Record<string, number> | null;
}) => {
  const existingPlans = plans.filter((plan) => plan.exists);
  const missingPlans = plans.filter((plan) => !plan.exists);
  const transformedPlans = plans.filter((plan) => plan.operation === 'transform' || (plan.operation === 'reuse' && plan.sourceObjectPath === OVERSIZED_SOURCE_OBJECT));
  const mimeCounts: Record<string, number> = {};
  const missingReferenceFieldCounts: Record<string, number> = {};
  const approximateFirestoreTransactionBytes = documents.reduce((total, document) => (
    total + Buffer.byteLength(JSON.stringify(canonicalize(document.data)), 'utf8')
  ), 0);
  existingPlans.forEach((plan) => increment(mimeCounts, plan.contentType ?? '(missing)'));
  missingReferences.forEach((reference) => increment(missingReferenceFieldCounts, `${reference.collection}.${reference.fieldPath.replace(/\[\d+\]/g, '[]')}`));

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    mode,
    applyExecuted: mode === 'apply',
    planHash,
    implementationHash: process.env.MIGRATION_IMPLEMENTATION_SHA256?.trim() || null,
    identity: {
      source: { projectId: SOURCE_PROJECT_ID, databaseId: SOURCE_DATABASE_ID, bucket: SOURCE_BUCKET, access: 'read-only' },
      destination: { projectId: DESTINATION_PROJECT_ID, databaseId: DESTINATION_DATABASE_ID, bucket: DESTINATION_BUCKET },
    },
    sourceCounts,
    selectedDocuments: {
      total: documents.length,
      byCollection: Object.fromEntries([...new Set(documents.map((document) => document.collection))].sort().map((collection) => [collection, documents.filter((document) => document.collection === collection).length])),
      destinationCreates: documents.filter((document) => !document.destinationExists).length,
      destinationMerges: documents.filter((document) => document.destinationExists).length,
    },
    destinationBefore,
    sanitization: {
      omittedFieldOccurrences: sanitizedFieldCounts,
      publicContactValuesPreserved: true,
      missingStorageValuesOmitted: missingReferences.length,
    },
    schemaReview: {
      preparedFieldPathsByCollection: Object.fromEntries(
        Object.entries(preparedFieldPaths).map(([collection, paths]) => [collection, [...paths].sort()]),
      ),
      valuesIncludedInSchemaInventory: false,
    },
    firestore: {
      approximateTransactionDocumentBytes: approximateFirestoreTransactionBytes,
      safetyLimitBytes: MAX_APPROXIMATE_FIRESTORE_TRANSACTION_BYTES,
      transactionWrites: documents.length,
    },
    storage: {
      referenceOccurrences: storageReferenceOccurrences,
      referencesRewrittenToStaging: storageReferenceOccurrences - missingReferences.length,
      uniqueSourceObjects: plans.length,
      existingSourceObjects: existingPlans.length,
      missingSourceObjects: missingPlans.length,
      policyCompliantExistingObjects: existingPlans.filter((plan) => (plan.size ?? 0) <= MAX_IMAGE_BYTES).length,
      mimeCounts,
      plannedCopies: plans.filter((plan) => plan.operation === 'copy').length,
      plannedReuses: plans.filter((plan) => plan.operation === 'reuse').length,
      plannedTransforms: transformedPlans.length,
      missingObjectPaths: missingPlans.map((plan) => plan.sourceObjectPath).sort(),
      missingReferences: [...missingReferences].sort((left, right) => `${left.collection}/${left.documentId}/${left.fieldPath}`.localeCompare(`${right.collection}/${right.documentId}/${right.fieldPath}`)),
      missingReferenceFieldCounts,
      transformedObjects: transformedPlans.map((plan) => ({
        sourceObjectPath: plan.sourceObjectPath,
        destinationObjectPath: plan.destinationObjectPath,
        originalBytes: plan.size,
        finalBytes: plan.transformedFinalBytes,
        status: mode === 'apply' ? 'uploaded-and-verified' : 'transformed-and-verified-no-upload',
      })),
    },
    skippedCollections: SKIPPED_COLLECTIONS,
    writes: writeCounters,
    verification: {
      sourceUnchanged,
      sourceWritesAttempted: writeCounters.sourceWritesAttempted,
      destinationDeletesAttempted: writeCounters.destinationDeletesAttempted,
      preparedDocumentsContainProductionReferences: false,
      destinationDocumentsExactlyMatchPreparedContent: mode === 'apply' ? true : null,
      destinationCounts: destinationVerification,
      actualMigrationPerformed: mode === 'apply',
    },
  };
};

const writeReport = async (report: ReturnType<typeof buildReport>) => {
  const reportPath = process.env.MIGRATION_REPORT_PATH?.trim();
  if (reportPath) await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });

  const summaryPath = process.env.GITHUB_STEP_SUMMARY?.trim();
  if (summaryPath) {
    const storage = report.storage;
    await appendFile(summaryPath, [
      `## Public content migration ${report.mode}`,
      '',
      `- Plan hash: \`${report.planHash}\``,
      `- Source documents selected: ${report.selectedDocuments.total}`,
      `- Storage references: ${storage.referenceOccurrences}`,
      `- Unique source objects: ${storage.uniqueSourceObjects}`,
      `- Existing objects: ${storage.existingSourceObjects}`,
      `- Missing objects: ${storage.missingSourceObjects}`,
      `- Missing references omitted: ${storage.missingReferences.length}`,
      `- Oversized transforms: ${storage.plannedTransforms}`,
      `- Firebase writes performed: ${report.applyExecuted ? 'yes (staging only)' : 'no'}`,
      '',
    ].join('\n'));
  }
};

const writeFailureReport = async (error: unknown) => {
  const reportPath = process.env.MIGRATION_REPORT_PATH?.trim();
  if (!reportPath) return;
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    mode: apply ? 'apply' : 'dry-run',
    result: 'FAILED_CLOSED',
    phase: currentPhase,
    error: error instanceof Error ? error.message : String(error),
    identity: {
      source: { projectId: SOURCE_PROJECT_ID, databaseId: SOURCE_DATABASE_ID, bucket: SOURCE_BUCKET, access: 'read-only' },
      destination: { projectId: DESTINATION_PROJECT_ID, databaseId: DESTINATION_DATABASE_ID, bucket: DESTINATION_BUCKET },
    },
    writes: writeCounters,
    attemptedDestinationStorageWrites: [...attemptedStorageWrites].sort(),
    createdDestinationStorageObjects: [...createdStorageObjects].sort(),
    completedOrReusedDestinationObjectPaths: [...completedStoragePlans].sort(),
    partialStagingStorageStatePossible: attemptedStorageWrites.length > 0,
    productionWritesAttempted: writeCounters.sourceWritesAttempted,
    productionDeletesAttempted: 0,
  };
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
};

const main = async () => {
  currentPhase = 'safety-guards';
  assertImmutableEndpoints();
  await assertExecutionEnvironment();

  console.log(JSON.stringify({
    mode: apply ? 'apply' : 'dry-run',
    source: { projectId: SOURCE_PROJECT_ID, databaseId: SOURCE_DATABASE_ID, bucket: SOURCE_BUCKET, access: 'read-only' },
    destination: { projectId: DESTINATION_PROJECT_ID, databaseId: DESTINATION_DATABASE_ID, bucket: DESTINATION_BUCKET },
  }, null, 2));

  const sourceApp = initializeApp({
    credential: applicationDefault(),
    projectId: SOURCE_PROJECT_ID,
    storageBucket: SOURCE_BUCKET,
  }, SOURCE_APP_NAME);
  const destinationApp = initializeApp({
    credential: applicationDefault(),
    projectId: DESTINATION_PROJECT_ID,
    storageBucket: DESTINATION_BUCKET,
  }, DESTINATION_APP_NAME);

  try {
    currentPhase = 'source-and-destination-inventory';
    if (sourceApp.options.projectId !== SOURCE_PROJECT_ID || sourceApp.options.storageBucket !== SOURCE_BUCKET) throw new Error('Source Admin app identity verification failed.');
    if (destinationApp.options.projectId !== DESTINATION_PROJECT_ID || destinationApp.options.storageBucket !== DESTINATION_BUCKET) throw new Error('Destination Admin app identity verification failed.');

    const sourceDatabase = getFirestore(sourceApp, SOURCE_DATABASE_ID);
    const destinationDatabase = getFirestore(destinationApp, DESTINATION_DATABASE_ID);

    const [packages, activities, activityItems, siteSettings, noOpCounts] = await Promise.all([
      fetchCollection(sourceDatabase, 'packages'),
      fetchCollection(sourceDatabase, 'activities'),
      fetchCollection(sourceDatabase, 'activityItems'),
      fetchSiteSettingsMain(sourceDatabase),
      fetchNoOpCounts(sourceDatabase),
    ]);
    const collections = { packages, activities, activityItems };
    validateSourceDocuments(collections, noOpCounts);
    const sourceDocuments = [...packages, ...activities, ...activityItems, siteSettings];
    const documentFingerprintBefore = sourceDocumentFingerprint(sourceDocuments);

    const destinationBefore = await destinationCollectionState(destinationDatabase, sourceDocuments);
    assertNoUnexpectedDestinationDocuments(destinationBefore);

    const planAsset = createAssetPlanner(sourceApp, destinationApp);
    currentPhase = 'sanitize-and-plan';
    const preparedDocuments = await Promise.all(sourceDocuments.map((document) => prepareDocument(document, destinationDatabase, planAsset)));
    const approximateFirestoreTransactionBytes = preparedDocuments.reduce((total, document) => (
      total + Buffer.byteLength(JSON.stringify(canonicalize(document.data)), 'utf8')
    ), 0);
    if (approximateFirestoreTransactionBytes > MAX_APPROXIMATE_FIRESTORE_TRANSACTION_BYTES) {
      throw new Error(`Prepared Firestore transaction is approximately ${approximateFirestoreTransactionBytes} bytes, above the conservative ${MAX_APPROXIMATE_FIRESTORE_TRANSACTION_BYTES}-byte safety limit.`);
    }
    const plans = await Promise.all([...assetPlanCache.values()]);
    plans.sort((left, right) => left.sourceObjectPath.localeCompare(right.sourceObjectPath));

    const existingPlans = plans.filter((plan) => plan.exists);
    const missingPlans = plans.filter((plan) => !plan.exists);
    const oversizedPlans = existingPlans.filter((plan) => (plan.size ?? 0) > MAX_IMAGE_BYTES);
    if (storageReferenceOccurrences !== EXPECTED_STORAGE_INVENTORY.referenceOccurrences) throw new Error(`Storage reference count drift: expected ${EXPECTED_STORAGE_INVENTORY.referenceOccurrences}, found ${storageReferenceOccurrences}.`);
    if (plans.length !== EXPECTED_STORAGE_INVENTORY.uniqueObjects) throw new Error(`Unique Storage object count drift: expected ${EXPECTED_STORAGE_INVENTORY.uniqueObjects}, found ${plans.length}.`);
    if (existingPlans.length !== EXPECTED_STORAGE_INVENTORY.existingObjects) throw new Error(`Existing Storage object count drift: expected ${EXPECTED_STORAGE_INVENTORY.existingObjects}, found ${existingPlans.length}.`);
    if (missingPlans.length !== EXPECTED_STORAGE_INVENTORY.missingObjects) throw new Error(`Missing Storage object count drift: expected ${EXPECTED_STORAGE_INVENTORY.missingObjects}, found ${missingPlans.length}.`);
    if (missingReferences.length !== EXPECTED_STORAGE_INVENTORY.missingReferenceOccurrences) throw new Error(`Missing reference count drift: expected ${EXPECTED_STORAGE_INVENTORY.missingReferenceOccurrences}, found ${missingReferences.length}.`);
    if (oversizedPlans.length !== EXPECTED_STORAGE_INVENTORY.oversizedObjects) throw new Error(`Oversized object count drift: expected ${EXPECTED_STORAGE_INVENTORY.oversizedObjects}, found ${oversizedPlans.length}.`);

    const sourceCounts = {
      packages: packages.length,
      activities: activities.length,
      activityItems: activityItems.length,
      'siteSettings/main': 1,
      gallery: noOpCounts.gallery,
      activityRecommendations: noOpCounts.activityRecommendations,
      featuredCategories: noOpCounts.featuredCategories,
      hotels: noOpCounts.hotels,
      blogs: noOpCounts.blogs,
    };

    const planManifest = {
      sourceDocumentFingerprint: documentFingerprintBefore,
      sourceObjectFingerprint: sourceObjectFingerprint(plans),
      sourceCounts,
      destinationBefore,
      preparedDocumentHashes: preparedDocuments.map((document) => ({
        collection: document.collection,
        id: document.id,
        // Download tokens are intentionally random per staging object and are
        // excluded from the approved plan identity. Bucket + object path remain.
        hash: hashValue(normalizeForPlanHash(document.data)),
        destinationExists: document.destinationExists,
        destinationUpdateTime: document.destinationUpdateTime,
        destinationDataHash: document.destinationDataHash,
      })),
      storagePlans: plans.map((plan) => ({
        sourceObjectPath: plan.sourceObjectPath,
        destinationObjectPath: plan.destinationObjectPath,
        exists: plan.exists,
        generation: plan.generation,
        metageneration: plan.metageneration,
        md5Hash: plan.md5Hash,
        crc32c: plan.crc32c,
        size: plan.size,
        contentType: plan.contentType,
        operation: plan.operation,
        destinationGeneration: plan.destinationGeneration,
        transformedFinalBytes: plan.transformedFinalBytes,
        transformedMd5Hash: plan.transformedMd5Hash,
        transformedSha256: plan.transformedSha256,
      })),
      missingReferences: [...missingReferences].sort((left, right) => (
        `${left.collection}/${left.documentId}/${left.fieldPath}/${left.sourceObjectPath}`
          .localeCompare(`${right.collection}/${right.documentId}/${right.fieldPath}/${right.sourceObjectPath}`)
      )),
    };
    const planHash = hashValue(planManifest);

    currentPhase = 'pre-write-source-reverification';
    await recheckSourceDocuments(sourceDatabase, documentFingerprintBefore);
    await recheckSourceObjects(sourceApp, plans);

    if (!apply) {
      currentPhase = 'dry-run-report';
      const report = buildReport({
        mode: 'dry-run',
        planHash,
        sourceCounts,
        destinationBefore,
        documents: preparedDocuments,
        plans,
        sourceUnchanged: true,
        destinationVerification: null,
      });
      await writeReport(report);
      currentPhase = 'complete';
      console.log(JSON.stringify({
        result: 'DRY_RUN_PASS',
        planHash,
        selectedDocuments: report.selectedDocuments.total,
        storageReferences: report.storage.referenceOccurrences,
        uniqueStorageObjects: report.storage.uniqueSourceObjects,
        existingStorageObjects: report.storage.existingSourceObjects,
        missingStorageObjects: report.storage.missingSourceObjects,
        missingReferencesOmitted: report.storage.missingReferences.length,
        plannedOversizedTransforms: report.storage.plannedTransforms,
        firebaseWritesPerformed: false,
      }, null, 2));
      return;
    }

    currentPhase = 'apply-approval';
    const approvedPlanHash = process.env.MIGRATION_APPROVED_PLAN_HASH?.trim();
    if (!approvedPlanHash || approvedPlanHash !== planHash) {
      throw new Error(`Apply mode requires MIGRATION_APPROVED_PLAN_HASH to equal the approved dry-run plan hash ${planHash}.`);
    }

    currentPhase = 'staging-storage-writes';
    await performStorageWrites(sourceApp, destinationApp, plans);
    currentPhase = 'between-write-phases-source-reverification';
    await recheckSourceDocuments(sourceDatabase, documentFingerprintBefore);
    await recheckSourceObjects(sourceApp, plans);
    currentPhase = 'staging-firestore-transaction';
    await performFirestoreWrites(destinationDatabase, preparedDocuments);
    currentPhase = 'destination-verification';
    const destinationVerification = await verifyDestination(destinationDatabase, destinationApp, preparedDocuments, plans);
    currentPhase = 'post-write-source-reverification';
    await recheckSourceDocuments(sourceDatabase, documentFingerprintBefore);
    await recheckSourceObjects(sourceApp, plans);

    currentPhase = 'apply-report';
    const report = buildReport({
      mode: 'apply',
      planHash,
      sourceCounts,
      destinationBefore,
      documents: preparedDocuments,
      plans,
      sourceUnchanged: true,
      destinationVerification,
    });
    await writeReport(report);
    currentPhase = 'complete';
    console.log(JSON.stringify({
      result: 'APPLY_AND_VERIFICATION_PASS',
      planHash,
      destinationCounts: destinationVerification,
      storageObjectsCopied: writeCounters.destinationObjectsCopied,
      storageObjectsReused: writeCounters.destinationObjectsReused,
      storageObjectsTransformed: writeCounters.destinationObjectsTransformed,
      missingReferencesOmitted: missingReferences.length,
      sourceWritesAttempted: writeCounters.sourceWritesAttempted,
      destinationDeletesAttempted: writeCounters.destinationDeletesAttempted,
    }, null, 2));
  } finally {
    await Promise.allSettled([deleteApp(sourceApp), deleteApp(destinationApp)]);
  }
};

main().catch(async (error: unknown) => {
  try {
    await writeFailureReport(error);
  } catch (reportError) {
    console.error(`Could not write failure report: ${reportError instanceof Error ? reportError.message : String(reportError)}`);
  }
  console.error(`Migration ${apply ? 'apply' : 'dry-run'} failed safely: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
