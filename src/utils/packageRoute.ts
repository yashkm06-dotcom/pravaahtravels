import type { TravelPackage } from '../types';

export interface PackageNavigationTarget {
  view: 'package-detail' | 'custom-landing';
  packageId: string;
  path: string;
}

export const getRegisteredCustomLandingPath = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (
    trimmed === '/roopkund-trek'
    || trimmed === '/buran-ghati-trek'
    || trimmed === '/ladakh'
    || trimmed === '/himachal'
    || trimmed === '/himachal-trek'
  ) {
    return trimmed;
  }
  return null;
};

export const slugifyPackageTitle = (value: string) => String(value ?? '')
  .toLowerCase()
  .trim()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

/**
 * Curated, clean, concise canonical slugs for all 63 production package records.
 * Strips redundant duplicate suffixes while guaranteeing 1-to-1 uniqueness and search-intent alignment.
 */
export const PACKAGE_CANONICAL_SLUGS: Record<string, string> = {
  'amazing-thailand-bangkok-chiang-mai-and-phuket': 'thailand-bangkok-chiang-mai-phuket',
  'auli-snow-escape-skiing-and-himalayan-cable-car-views': 'auli-skiing-cable-car-tour',
  'bali-family-holiday-culture-nature-and-beach-fun-for-all-ages': 'bali-family-vacation',
  'bali-highlights-classic-ubud-kintamani-seminyak-and-uluwatu-tour': 'bali-ubud-kintamani-seminyak-uluwatu',
  'bali-honeymoon-escape-private-villas-in-ubud-sidemen-and-nusa-dua': 'bali-honeymoon-ubud-sidemen-nusa-dua',
  'bali-nusa-penida-escape-island-hopping-cliffs-and-hidden-lagoons': 'bali-nusa-penida-island-tour',
  'bangkok-pattaya-compact-thailand-city-and-beach-break': 'bangkok-pattaya-city-beach-tour',
  'buran-ghati-trek': 'buran-ghati-trek',
  'char-dham-yatra-yamunotri-gangotri-kedarnath-and-badrinath': 'char-dham-yatra-uttarakhand',
  'chopta-tungnath-chandrashila-trek': 'chopta-tungnath-chandrashila-trek',
  'complete-bali-explorer-ubud-north-bali-nusa-penida-and-the-south-coast': 'bali-nusa-penida-grand-explorer',
  'complete-ladakh-explorer-nubra-pangong-tso-moriri-and-monasteries': 'ladakh-nubra-pangong-tso-moriri',
  'complete-thailand-explorer-bangkok-to-chiang-mai-and-islands': 'thailand-bangkok-chiang-mai-phuket-krabi',
  'complete-vietnam-explorer-hanoi-to-mekong-delta-north-south-journey': 'vietnam-hanoi-to-mekong-delta',
  'da-nang-and-hoi-an-golden-bridge-beaches-and-lantern-heritage-break': 'da-nang-hoi-an-golden-bridge',
  'dharamshala-bir-billing-paragliding-and-tibetan-culture-tour': 'dharamshala-bir-billing-paragliding',
  'do-dham-yatra-kedarnath-and-badrinath-pilgrimage': 'do-dham-kedarnath-badrinath',
  'dubai-and-abu-dhabi-explorer-twin-emirates-culture-and-modern-city-tour': 'dubai-abu-dhabi-twin-emirates',
  'dubai-budget-escape-affordable-city-and-desert-holiday': 'dubai-budget-city-desert',
  'dubai-family-vacation-theme-parks-aquariums-and-fun-for-all-ages': 'dubai-family-vacation-theme-parks',
  'dubai-honeymoon-escape-private-desert-yacht-and-spa-romance': 'dubai-honeymoon-yacht-desert',
  'dubai-luxury-holiday-burj-khalifa-marina-and-palm-jumeirah-premium-experience': 'dubai-luxury-burj-khalifa-palm',
  'hanle-turtuk-expedition-dark-sky-reserve-and-border-village': 'ladakh-hanle-dark-sky-turtuk',
  'hanoi-and-halong-bay-north-vietnam-old-quarter-and-luxury-cruise-escape': 'hanoi-halong-bay-luxury-cruise',
  'harshil-hidden-himalayas-offbeat-valley-escape': 'harshil-valley-himalayan-escape',
  'himachal-honeymoon-shimla-manali-and-private-romance': 'himachal-honeymoon-shimla-manali',
  'himalayan-luxury-escape-wellness-and-serenity-retreat': 'himalayan-wellness-serenity-retreat',
  'jibhi-tirthan-valley-quiet-riverside-retreat': 'jibhi-tirthan-valley-retreat',
  'jim-corbett-and-nainital-wildlife-and-hill-station-combo': 'jim-corbett-nainital-tour',
  'kasol-tosh-parvati-valley-backpacker-escape': 'kasol-tosh-parvati-valley-tour',
  'kedarnath-dham-yatra-focused-pilgrimage-package': 'kedarnath-dham-yatra',
  'kinnaur-kalpa-chitkul-last-village-on-the-old-hindustan-tibet-road': 'kinnaur-kalpa-chitkul-sangla',
  'ladakh-bike-expedition-manali-to-leh-via-khardung-la': 'manali-to-leh-motorcycle-expedition',
  'leh-ladakh-highlights-nubra-pangong-and-monasteries': 'leh-ladakh-nubra-pangong',
  'leh-nubra-pangong-extended-valley-and-lake-circuit': 'leh-nubra-pangong-extended-circuit',
  'luxury-ladakh-premium-himalayan-escape': 'luxury-ladakh-experience',
  'maldives-all-inclusive-complete-worry-free-island-holiday': 'maldives-all-inclusive-resort',
  'maldives-honeymoon-romantic-overwater-villa-escape': 'maldives-honeymoon-overwater-villa',
  'maldives-luxury-escape-ultra-premium-private-island-retreat': 'maldives-private-island-retreat',
  'maldives-water-villa-escape-overwater-bungalow-getaway': 'maldives-overwater-villa-holiday',
  'manali-adventure-paragliding-trekking-and-river-rafting': 'manali-adventure-rafting-paragliding-trek',
  'nainital-mussoorie-twin-hill-station-getaway': 'nainital-mussoorie-tour',
  'phuket-and-krabi-island-escape': 'phuket-krabi-island-explorer',
  'pravaah-privilege-himalayas-grand-uttarakhand-and-ladakh-journey': 'grand-himalayan-journey-uttarakhand-ladakh',
  'pravaah-privilege-ladakh-flagship-luxury-high-altitude-journey': 'privilege-ladakh-luxury-journey',
  'pravaah-privilege-uttarakhand-flagship-luxury-himalayan-journey': 'privilege-uttarakhand-luxury-tour',
  'ramayana-trail-sacred-sites-of-sri-lanka': 'sri-lanka-ramayana-trail',
  'rishikesh-adventure-escape-river-rafting-camping-and-yoga': 'rishikesh-rafting-camping-yoga',
  'roopkund-trek': 'roopkund-trek',
  'scenic-sri-lanka-wildlife-waterfalls-and-ancient-cities': 'sri-lanka-sigiriya-ella-yala',
  'shimla-manali-classic-himachal-hill-station-tour': 'shimla-manali-tour',
  'signature-adventure-collection-ultimate-himalayan-expedition': 'manali-to-leh-multi-sport-expedition',
  'singapore-and-malaysia-twin-city-state-explorer': 'singapore-malaysia-twin-tour',
  'singapore-highlights-gardens-marina-bay-and-city-icons': 'singapore-city-highlights',
  'singapore-sentosa-family-fun-and-island-adventure': 'singapore-sentosa-family-holiday',
  'spiti-valley-expedition-cold-desert-circuit-via-kinnaur': 'spiti-valley-circuit-kinnaur',
  'sri-lanka-highlights-colombo-kandy-and-coastal-galle': 'sri-lanka-colombo-kandy-galle',
  'thailand-family-vacation-bangkok-and-phuket': 'thailand-family-bangkok-phuket',
  'thailand-highlights-bangkok-pattaya-and-phuket': 'thailand-bangkok-pattaya-phuket',
  'thailand-honeymoon-escape-bangkok-and-phuket': 'thailand-honeymoon-bangkok-phuket',
  'valley-of-flowers-and-hemkund-sahib-trek': 'valley-of-flowers-hemkund-sahib-trek',
  'vietnam-highlights-hanoi-halong-bay-da-nang-and-hoi-an-grand-tour': 'vietnam-hanoi-halong-da-nang-hoi-an',
  'vietnam-honeymoon-escape-private-cruise-beach-and-romance': 'vietnam-honeymoon-da-nang-hoi-an-halong',
};

/**
 * Returns the short, clean, canonical URL slug for any package.
 */
export const getPackageCanonicalSlug = (pkg?: { id?: string; title?: string } | null): string => {
  if (pkg?.id && PACKAGE_CANONICAL_SLUGS[pkg.id]) {
    return PACKAGE_CANONICAL_SLUGS[pkg.id];
  }
  const slug = slugifyPackageTitle(pkg?.title || '');
  return slug || String(pkg?.id || '');
};

export const getPackageRouteSegment = (pkg: Pick<TravelPackage, 'id' | 'title'>) => {
  return getPackageCanonicalSlug(pkg);
};

export const getPackageNavigationTarget = (
  pkg: { id?: string; title?: string; customLandingPage?: string | null },
): PackageNavigationTarget => {
  const customPath = getRegisteredCustomLandingPath(pkg?.customLandingPage);
  if (customPath) {
    return {
      view: 'custom-landing',
      packageId: customPath,
      path: customPath,
    };
  }

  const routeSegment = getPackageRouteSegment(pkg as Pick<TravelPackage, 'id' | 'title'>);
  return {
    view: 'package-detail',
    packageId: routeSegment,
    path: `/packages/${routeSegment}`,
  };
};

export const openPackage = (
  onNavigate: (view: string, packageId?: string | null) => void,
  pkg: Pick<TravelPackage, 'id' | 'title' | 'customLandingPage'>,
) => {
  const target = getPackageNavigationTarget(pkg);
  onNavigate(target.view, target.packageId);
};

/**
 * Resolves incoming URL segments with backwards compatibility:
 * 1. Matches short canonical slug
 * 2. Matches raw Firestore document ID
 * 3. Matches legacy duplicated long slug (${slug}-${pkg.id})
 * 4. Matches base title slug
 */
export const packageMatchesRouteSegment = (
  pkg: Pick<TravelPackage, 'id' | 'title'>,
  routeSegment: string,
) => {
  const cleanSegment = decodeURIComponent(routeSegment || '').trim();
  const canonicalSlug = getPackageCanonicalSlug(pkg);
  const baseTitleSlug = slugifyPackageTitle(pkg.title);
  const legacyCombinedSlug = `${baseTitleSlug}-${pkg.id}`;

  return String(pkg.id) === cleanSegment
    || canonicalSlug === cleanSegment
    || legacyCombinedSlug === cleanSegment
    || baseTitleSlug === cleanSegment;
};
