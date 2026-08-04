export type PackageCmsStatus = 'draft' | 'published' | 'archived' | 'deleted';

export type PackageCmsAction =
  | 'create'
  | 'update'
  | 'publish'
  | 'archive'
  | 'restore'
  | 'delete'
  | 'permanent-delete'
  | 'import'
  | 're-import'
  | 'duplicate';

export type ImportQualityStatus = 'excellent' | 'good' | 'needs_review' | 'poor';

export interface ImportQuality {
  score: number;
  status: ImportQualityStatus;
  warnings: string[];
  missing: string[];
  passed: string[];
}

export interface PackagePricing {
  currency?: string | null;
  price?: number | null;
  originalPrice?: number | null;
  discount?: number | null;
  priceType?: string | null;
  occupancy?: string | null;
}

export interface PackageHotel {
  city: string | null;
  hotel: string | null;
  nights: number | null;
}

export interface PackageItineraryDay {
  day: number | null;
  title: string | null;
  description: string | null;
  location?: string | null;
  images?: string[];
}

export interface PackageOption {
  title: string;
  description?: string | null;
  price?: number | null;
  originalPrice?: number | null;
  inclusions?: string[];
}

export interface PackageFaq {
  question: string | null;
  answer: string | null;
}

export interface PackageImportRecord {
  id?: string;
  packageId: string;
  sourceUrl: string | null;
  parserVersion: string;
  importQuality: ImportQuality | null;
  importedAt: string;
  duration: number | null;
  importedBy: string;
}

export interface PackageActivityLog {
  id?: string;
  packageId: string;
  action: PackageCmsAction;
  actorId: string;
  createdAt: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface PackageCmsDocument {
  id: string;
  title: string;
  slug: string;
  status: PackageCmsStatus;
  version: number;
  sourceUrl: string | null;
  sourceDomain: string | null;
  heroImage: string | null;
  gallery: string[];
  activityId?: string | null;
  duration: string | null;
  destinations: string[];
  overview: string | null;
  itinerary: PackageItineraryDay[];
  hotels: PackageHotel[];
  pricing: PackagePricing | null;
  inclusions: string[];
  exclusions: string[];
  packageOptions?: PackageOption[];
  knowBeforeYouGo?: string[];
  thingsToCarry?: string[];
  difficultyLevel?: number | null;
  faqs: PackageFaq[];
  policies: string[];
  importQuality: ImportQuality | null;
  parserVersion: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  archivedAt?: string | null;
  deletedAt?: string | null;
  createdBy: string;
  updatedBy: string;
  active: boolean;
  legacyStatus: 'Publish' | 'Draft';
  versionHistory?: PackageVersionHistoryEntry[];
}

export interface PackageVersionHistoryEntry {
  version: number;
  savedAt: string;
  savedBy: string;
  action: PackageCmsAction;
  snapshot: Record<string, unknown>;
}

export interface PackageCmsInput {
  id?: string;
  title: string;
  slug?: string;
  status?: PackageCmsStatus;
  sourceUrl?: string | null;
  heroImage?: string | null;
  gallery?: string[];
  activityId?: string | null;
  duration?: string | null;
  destinations?: string[];
  destination?: string | null;
  overview?: string | null;
  itinerary?: PackageItineraryDay[];
  hotels?: PackageHotel[];
  pricing?: PackagePricing | null;
  price?: number | null;
  inclusions?: string[];
  exclusions?: string[];
  packageOptions?: PackageOption[];
  knowBeforeYouGo?: string[];
  thingsToCarry?: string[];
  difficultyLevel?: number | null;
  faqs?: PackageFaq[];
  policies?: string[];
  importQuality?: ImportQuality | null;
  parserVersion?: string;
  sourceDomain?: string | null;
  legacy?: Record<string, unknown>;
}

export interface PackageDiffField {
  field: string;
  type: 'added' | 'removed' | 'modified';
  before: unknown;
  after: unknown;
}

export interface PackageDiffResult {
  hasChanges: boolean;
  summary: {
    added: number;
    removed: number;
    modified: number;
  };
  fields: PackageDiffField[];
}

export interface PackageListFilters {
  search?: string;
  status?: PackageCmsStatus | 'all';
  destination?: string;
  parserVersion?: string;
  qualityStatus?: ImportQualityStatus | 'all';
  sortBy?: 'updatedAt' | 'createdAt' | 'title' | 'status' | 'version';
  sortDirection?: 'asc' | 'desc';
  pageSize?: number;
}
