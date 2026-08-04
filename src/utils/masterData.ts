import type { TravelPackage } from '../types';

// The Master Data system reuses the existing `settings/general` Firestore document
// (already isAdmin()-guarded, already used for packageCategories / packageBookingTypes)
// instead of introducing a new collection or rule. Category and Booking Type keep their
// original string[]-based implementation from the first Master Data pass — this file only
// covers the richer, hierarchy-aware modules: Country, Destination, City, Activity Type,
// Package Tag, Difficulty, Meal Plan, Transport Type.
export type MasterDataStatus = 'active' | 'inactive';

export interface MasterDataItem {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
  status: MasterDataStatus;
  featured: boolean;
  icon?: string;
  banner?: string;
  thumbnail?: string;
  // Destination -> parent Country name. City -> parent Destination name.
  // Stored as a name (not a synthetic id) so it stays consistent with how every package
  // field already stores plain names, and needs no id-lookup indirection anywhere else.
  parentName?: string;
  createdAt: string;
  updatedAt: string;
}

export type MasterDataKey =
  | 'country'
  | 'destination'
  | 'city'
  | 'activityType'
  | 'packageTag'
  | 'difficulty'
  | 'mealPlan'
  | 'transportType'
  | 'homepageCategory';

export type MasterDataFieldKey =
  | 'masterCountries'
  | 'masterDestinations'
  | 'masterCities'
  | 'masterActivityTypes'
  | 'masterPackageTags'
  | 'masterDifficultyLevels'
  | 'masterMealPlans'
  | 'masterTransportTypes'
  | 'masterHomepageCategories';

export type MasterDataLists = Record<MasterDataFieldKey, MasterDataItem[]>;

export const EMPTY_MASTER_DATA_LISTS: MasterDataLists = {
  masterCountries: [],
  masterDestinations: [],
  masterCities: [],
  masterActivityTypes: [],
  masterPackageTags: [],
  masterDifficultyLevels: [],
  masterMealPlans: [],
  masterTransportTypes: [],
  masterHomepageCategories: [],
};

export interface MasterDataModuleConfig {
  key: MasterDataKey;
  fieldKey: MasterDataFieldKey;
  label: string;
  pluralLabel: string;
  description: string;
  seedExamples: string[];
  // Package Tags / Activity Type / Meal Plan allow multiple values per package.
  multi: boolean;
  // Destination is a child of Country; City is a child of Destination.
  parentModuleKey?: MasterDataKey;
  // Only the hierarchy family (Country/Destination/City) exposes media pickers.
  supportsMedia: boolean;
  getUsageCount: (name: string, packages: TravelPackage[]) => number;
}

const norm = (value?: string | null) => String(value ?? '').trim().toLowerCase();

const countSingle = (name: string, packages: TravelPackage[], getValue: (pkg: TravelPackage) => string | null | undefined) => {
  const key = norm(name);
  if (!key) return 0;
  return packages.filter((pkg) => norm(getValue(pkg)) === key).length;
};

const countMulti = (name: string, packages: TravelPackage[], getValues: (pkg: TravelPackage) => string[] | undefined) => {
  const key = norm(name);
  if (!key) return 0;
  return packages.filter((pkg) => (getValues(pkg) || []).some((value) => norm(value) === key)).length;
};

export const MASTER_DATA_MODULES: MasterDataModuleConfig[] = [
  {
    key: 'country',
    fieldKey: 'masterCountries',
    label: 'Country',
    pluralLabel: 'Countries',
    description: 'Top level of the destination hierarchy. Powers the homepage International country tabs.',
    seedExamples: ['Thailand', 'Indonesia', 'UAE', 'Vietnam'],
    multi: false,
    supportsMedia: true,
    getUsageCount: (name, packages) => countSingle(name, packages, (pkg) => pkg.country),
  },
  {
    key: 'destination',
    fieldKey: 'masterDestinations',
    label: 'Destination',
    pluralLabel: 'Destinations',
    description: 'Specific places within a Country (Phuket, Bali, Bangkok...). Powers the homepage destination buttons.',
    seedExamples: ['Phuket', 'Bali', 'Bangkok', 'Dubai', 'Singapore'],
    multi: false,
    parentModuleKey: 'country',
    supportsMedia: true,
    getUsageCount: (name, packages) => countSingle(name, packages, (pkg) => pkg.destination),
  },
  {
    key: 'city',
    fieldKey: 'masterCities',
    label: 'City',
    pluralLabel: 'Cities',
    description: 'Specific towns/neighbourhoods within a Destination (Patong, Ubud, Seminyak...).',
    seedExamples: ['Patong', 'Kata', 'Ubud', 'Seminyak', 'Kuta'],
    multi: false,
    parentModuleKey: 'destination',
    supportsMedia: true,
    getUsageCount: (name, packages) => countSingle(name, packages, (pkg) => pkg.city),
  },
  {
    key: 'activityType',
    fieldKey: 'masterActivityTypes',
    label: 'Activity',
    pluralLabel: 'Activities',
    description: 'Experience style tags (Adventure, Family, Luxury, Beach, Wildlife...). Independent of the homepage Activities CMS section.',
    seedExamples: ['Adventure', 'Family', 'Luxury', 'Beach', 'Wildlife', 'Honeymoon', 'Road Trip', 'Trekking', 'Pilgrimage', 'Cruise'],
    multi: true,
    supportsMedia: false,
    getUsageCount: (name, packages) => countMulti(name, packages, (pkg) => pkg.activityTypes),
  },
  {
    key: 'packageTag',
    fieldKey: 'masterPackageTags',
    label: 'Package Tag',
    pluralLabel: 'Package Tags',
    description: 'Merchandising labels shown on package cards (Best Seller, Trending, New...).',
    seedExamples: ['Best Seller', 'Trending', 'New', 'Limited Offer', 'Festival Special', 'Luxury', 'Budget', 'Popular'],
    multi: true,
    supportsMedia: false,
    getUsageCount: (name, packages) => countMulti(name, packages, (pkg) => pkg.tags),
  },
  {
    key: 'difficulty',
    fieldKey: 'masterDifficultyLevels',
    label: 'Difficulty',
    pluralLabel: 'Difficulty Levels',
    description: 'Trip difficulty shown to travelers.',
    seedExamples: ['Easy', 'Moderate', 'Difficult'],
    multi: false,
    supportsMedia: false,
    getUsageCount: (name, packages) => countSingle(name, packages, (pkg) => pkg.difficultyLabel),
  },
  {
    key: 'mealPlan',
    fieldKey: 'masterMealPlans',
    label: 'Meal Plan',
    pluralLabel: 'Meal Plans',
    description: 'Meal inclusions offered with a package.',
    seedExamples: ['Breakfast', 'MAP', 'AP', 'All Inclusive', 'Breakfast + Dinner'],
    multi: true,
    supportsMedia: false,
    getUsageCount: (name, packages) => countMulti(name, packages, (pkg) => pkg.mealPlans),
  },
  {
    key: 'transportType',
    fieldKey: 'masterTransportTypes',
    label: 'Transport Type',
    pluralLabel: 'Transport Types',
    description: 'Primary mode of transport used in the package.',
    seedExamples: ['Flight', 'Train', 'Bus', 'Self Drive', 'Private Cab'],
    multi: false,
    supportsMedia: false,
    getUsageCount: (name, packages) => countSingle(name, packages, (pkg) => pkg.transportType),
  },
  {
    key: 'homepageCategory',
    fieldKey: 'masterHomepageCategories',
    label: 'Homepage Category',
    pluralLabel: 'Homepage Categories',
    description: 'Buttons shown in the homepage Featured Categories section. Display Order and Active/Inactive control what appears and in which order.',
    seedExamples: ['Domestic', 'International', 'Weekend Trips', 'Honeymoon', 'Luxury', 'Adventure', 'Pilgrimage'],
    multi: false,
    supportsMedia: false,
    getUsageCount: (name, packages) => countSingle(name, packages, (pkg) => pkg.homepageCategory),
  },
];

export const getMasterDataModule = (key: MasterDataKey) => (
  MASTER_DATA_MODULES.find((module) => module.key === key) || MASTER_DATA_MODULES[0]
);

export const getParentModule = (module: MasterDataModuleConfig) => (
  module.parentModuleKey ? getMasterDataModule(module.parentModuleKey) : null
);

export const cleanMasterDataName = (value: string) => value.trim().replace(/\s+/g, ' ');

export const slugifyMasterDataName = (value: string) => cleanMasterDataName(value)
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const isPlainObject = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

// Accepts either the legacy string[] format (from the first Master Data pass) or the
// current MasterDataItem[] object format, and always returns normalized, fully-populated
// items. Purely an in-memory upgrade — nothing is force-written back until the admin next
// saves that module, so existing settings/general documents are never touched implicitly.
export const migrateMasterDataList = (raw: unknown, nowIso: string): MasterDataItem[] => {
  if (!Array.isArray(raw)) return [];
  const usedIds = new Set<string>();

  const toItem = (value: unknown, index: number): MasterDataItem | null => {
    if (typeof value === 'string') {
      const name = cleanMasterDataName(value);
      if (!name) return null;
      let id = slugifyMasterDataName(name) || `item-${index}`;
      while (usedIds.has(id)) id = `${id}-${index}`;
      usedIds.add(id);
      return {
        id,
        name,
        slug: slugifyMasterDataName(name),
        displayOrder: index,
        status: 'active',
        featured: false,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
    }

    if (isPlainObject(value)) {
      const name = cleanMasterDataName(String(value.name ?? ''));
      if (!name) return null;
      let id = String(value.id ?? '').trim() || slugifyMasterDataName(name) || `item-${index}`;
      while (usedIds.has(id)) id = `${id}-${index}`;
      usedIds.add(id);
      return {
        id,
        name,
        slug: cleanMasterDataName(String(value.slug ?? '')) ? slugifyMasterDataName(String(value.slug)) : slugifyMasterDataName(name),
        displayOrder: Number.isFinite(Number(value.displayOrder)) ? Number(value.displayOrder) : index,
        status: value.status === 'inactive' ? 'inactive' : 'active',
        featured: value.featured === true,
        icon: typeof value.icon === 'string' && value.icon ? value.icon : undefined,
        banner: typeof value.banner === 'string' && value.banner ? value.banner : undefined,
        thumbnail: typeof value.thumbnail === 'string' && value.thumbnail ? value.thumbnail : undefined,
        parentName: typeof value.parentName === 'string' && value.parentName ? value.parentName : undefined,
        createdAt: typeof value.createdAt === 'string' && value.createdAt ? value.createdAt : nowIso,
        updatedAt: typeof value.updatedAt === 'string' && value.updatedAt ? value.updatedAt : nowIso,
      };
    }

    return null;
  };

  return raw
    .map((value, index) => toItem(value, index))
    .filter((item): item is MasterDataItem => Boolean(item));
};

export const sortForDisplay = (items: MasterDataItem[]) => [...items].sort((a, b) => (
  a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)
));

// Featured items first (each group keeps its relative Display Order) — used by the
// homepage-facing ordering that gets mirrored to the public siteSettings/main document.
export const sortFeaturedFirst = (items: MasterDataItem[]) => [...items].sort((a, b) => (
  Number(b.featured) - Number(a.featured) || a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)
));

export const getActiveItems = (items: MasterDataItem[]) => items.filter((item) => item.status === 'active');

export const findDuplicateMasterDataItem = (items: MasterDataItem[], name: string, excludeId?: string) => {
  const nameKey = norm(name);
  const slugKey = slugifyMasterDataName(name);
  return items.find((item) => item.id !== excludeId && (norm(item.name) === nameKey || item.slug === slugKey));
};

export const findMasterDataItemByName = (items: MasterDataItem[], name?: string | null) => {
  const key = norm(name);
  if (!key) return undefined;
  return items.find((item) => norm(item.name) === key);
};

// Options shown in a dropdown: active items (Display Order first), optionally scoped to a
// parent (Destination -> Country, City -> Destination), plus any legacy free-text values
// still used by saved packages so old packages never lose their current selection, plus the
// package's own current value even if it has since been deactivated.
export const buildDynamicOptionNames = (
  items: MasterDataItem[],
  usedValues: Array<string | null | undefined>,
  currentValue?: string | null,
  parentFilterName?: string | null,
): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  const add = (name?: string | null) => {
    const cleaned = cleanMasterDataName(String(name ?? ''));
    if (!cleaned) return;
    const key = norm(cleaned);
    if (seen.has(key)) return;
    seen.add(key);
    result.push(cleaned);
  };

  const scopedActive = sortForDisplay(items).filter((item) => {
    if (item.status !== 'active') return false;
    if (!parentFilterName) return true;
    // Legacy items with no parent assigned yet stay visible regardless of the selected
    // parent, so packages created before the hierarchy existed keep working.
    return !item.parentName || norm(item.parentName) === norm(parentFilterName);
  });
  scopedActive.forEach((item) => add(item.name));

  usedValues.forEach(add);
  add(currentValue);

  return result;
};

export const createMasterDataItem = (
  name: string,
  existingItems: MasterDataItem[],
  nowIso: string,
  overrides: Partial<Pick<MasterDataItem, 'parentName' | 'icon' | 'banner' | 'thumbnail' | 'featured'>> = {},
): MasterDataItem => {
  const cleanedName = cleanMasterDataName(name);
  const maxOrder = existingItems.reduce((max, item) => Math.max(max, item.displayOrder), -1);
  let id = slugifyMasterDataName(cleanedName) || `item-${Date.now().toString(36)}`;
  const usedIds = new Set(existingItems.map((item) => item.id));
  while (usedIds.has(id)) id = `${id}-${Date.now().toString(36)}`;

  return {
    id,
    name: cleanedName,
    slug: slugifyMasterDataName(cleanedName),
    displayOrder: maxOrder + 1,
    status: 'active',
    featured: overrides.featured ?? false,
    icon: overrides.icon,
    banner: overrides.banner,
    thumbnail: overrides.thumbnail,
    parentName: overrides.parentName,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
};
