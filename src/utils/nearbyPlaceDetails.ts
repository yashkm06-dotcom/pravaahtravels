export type NearbyPlaceCategory = 'Attraction' | 'Cafe' | 'Restaurant';

export interface NearbyPlaceDetails {
  id: string;
  name: string;
  category: NearbyPlaceCategory;
  latitude: number;
  longitude: number;
  distanceKm: number;
  imageUrl: string | null;
  imageSourceUrl: string | null;
  description: string | null;
  cuisine: string | null;
  openingHours: string | null;
  address: string | null;
  mapUrl: string;
  websiteUrl: string | null;
  referenceUrl: string | null;
}

export interface StoredNearbyPlace {
  place: NearbyPlaceDetails;
  destination: string;
  packageTitle: string;
  savedAt: number;
}

const STORAGE_PREFIX = 'pravaah-attraction-detail:';

export const slugifyNearbyPlace = (value: string) => String(value || '')
  .toLowerCase()
  .trim()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

export const getNearbyPlacePath = (placeName: string) => (
  `/attraction/${slugifyNearbyPlace(placeName)}`
);

export const storeNearbyPlace = (
  place: NearbyPlaceDetails,
  destination: string,
  packageTitle: string,
) => {
  if (typeof window === 'undefined') return;
  const slug = slugifyNearbyPlace(place.name);
  if (!slug) return;

  try {
    const value: StoredNearbyPlace = {
      place,
      destination,
      packageTitle,
      savedAt: Date.now(),
    };
    window.localStorage.setItem(`${STORAGE_PREFIX}${slug}`, JSON.stringify(value));
  } catch {
    // Details still remain accessible through the map link if storage is unavailable.
  }
};

export const readStoredNearbyPlace = (slug: string): StoredNearbyPlace | null => {
  if (typeof window === 'undefined' || !slug) return null;

  try {
    const rawValue = window.localStorage.getItem(`${STORAGE_PREFIX}${slug}`);
    if (!rawValue) return null;

    const parsed = JSON.parse(rawValue) as StoredNearbyPlace;
    if (!parsed?.place?.name || !Number.isFinite(parsed.place.latitude) || !Number.isFinite(parsed.place.longitude)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export const getNameFromNearbyPlaceSlug = (slug: string) => (
  decodeURIComponent(slug || '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
);
