import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Coffee,
  ExternalLink,
  Landmark,
  MapPin,
  Navigation,
  RefreshCw,
  Utensils,
} from 'lucide-react';
import {
  getNearbyPlacePath,
  storeNearbyPlace,
  type NearbyPlaceCategory,
  type NearbyPlaceDetails,
} from '../utils/nearbyPlaceDetails';

type PlaceCategory = NearbyPlaceCategory;
type NearbyPlace = NearbyPlaceDetails;

interface NearbyPlacesSectionProps {
  destination?: string;
  packageTitle: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
}

interface PhotonResponse {
  features?: Array<{
    geometry?: {
      coordinates?: [number, number];
    };
  }>;
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

interface CommonsImageInfo {
  width?: number;
  height?: number;
  thumburl?: string;
  url?: string;
  descriptionurl?: string;
}

interface CommonsSearchPage {
  index?: number;
  title?: string;
  imageinfo?: CommonsImageInfo[];
}

interface CommonsSearchResponse {
  query?: {
    pages?: Record<string, CommonsSearchPage>;
  };
}

interface WikipediaGeoSearchPage {
  pageid: number;
  index?: number;
  title?: string;
  coordinates?: Array<{
    lat: number;
    lon: number;
  }>;
  description?: string;
  thumbnail?: {
    source?: string;
    width?: number;
    height?: number;
  };
  fullurl?: string;
  canonicalurl?: string;
}

interface WikipediaGeoSearchResponse {
  query?: {
    pages?: Record<string, WikipediaGeoSearchPage>;
  };
}

interface CachedPlaces {
  expiresAt: number;
  places: NearbyPlace[];
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 20_000;
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.nchc.org.tw/api/interpreter',
];
const inflightRequests = new Map<string, Promise<NearbyPlace[]>>();

const normalizeSearchValue = (value: string) => value.trim().replace(/\s+/g, ' ');

const getCacheKey = (searchValue: string) => (
  `pravaah-nearby-places-v4:${searchValue.toLowerCase()}`
);

const getDestinationSearchValues = (searchValue: string) => {
  const normalizedValue = normalizeSearchValue(searchValue);
  const splitValues = normalizedValue
    .split(/\s*(?:&|\+|\/|\band\b)\s*/i)
    .map(normalizeSearchValue)
    .filter(Boolean);

  return Array.from(new Set(splitValues.length > 1 ? splitValues : [normalizedValue]));
};

const readCachedPlaces = (searchValue: string): NearbyPlace[] | null => {
  if (typeof window === 'undefined') return null;

  try {
    const rawValue = window.localStorage.getItem(getCacheKey(searchValue));
    if (!rawValue) return null;

    const cached = JSON.parse(rawValue) as CachedPlaces;
    if (!Array.isArray(cached.places) || cached.expiresAt <= Date.now()) {
      window.localStorage.removeItem(getCacheKey(searchValue));
      return null;
    }

    return cached.places;
  } catch {
    return null;
  }
};

const writeCachedPlaces = (searchValue: string, places: NearbyPlace[]) => {
  if (typeof window === 'undefined') return;

  try {
    if (places.length === 0) {
      window.localStorage.removeItem(getCacheKey(searchValue));
      return;
    }

    const cached: CachedPlaces = {
      expiresAt: Date.now() + CACHE_TTL_MS,
      places,
    };
    window.localStorage.setItem(getCacheKey(searchValue), JSON.stringify(cached));
  } catch {
    // A full or unavailable browser cache should never block the recommendations.
  }
};

const fetchWithTimeout = async (url: string, init?: RequestInit) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }
};

const toAbsoluteHttpUrl = (value?: string) => {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
};

const REJECTED_IMAGE_TERMS = [
  'avatar',
  'banner',
  'coat of arms',
  'diagram',
  'emblem',
  'flag',
  'icon',
  'logo',
  'map',
  'poster',
  'seal',
  'sign',
  'symbol',
  'wordmark',
];

const isRejectedImageName = (value: string) => {
  const normalized = value.toLowerCase().replace(/[_-]+/g, ' ');
  return (
    normalized.endsWith('.svg')
    || REJECTED_IMAGE_TERMS.some((term) => normalized.includes(term))
  );
};

const getCommonsImageUrl = (value?: string) => {
  if (!value || !value.startsWith('File:')) return null;
  const filename = value.slice(5).trim();
  if (!filename || isRejectedImageName(filename)) return null;
  return `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(filename)}?width=900`;
};

const getPlaceImage = (tags: Record<string, string>) => (
  (!isRejectedImageName(tags.image || '') ? toAbsoluteHttpUrl(tags.image) : null)
  || getCommonsImageUrl(tags.wikimedia_commons)
);

const getPlaceImageSource = (tags: Record<string, string>) => {
  if (tags.wikimedia_commons?.startsWith('File:') && !isRejectedImageName(tags.wikimedia_commons)) {
    return `https://commons.wikimedia.org/wiki/${encodeURIComponent(tags.wikimedia_commons.replace(/\s+/g, '_'))}`;
  }
  return !isRejectedImageName(tags.image || '') ? toAbsoluteHttpUrl(tags.image) : null;
};

const getWikipediaUrl = (value?: string) => {
  if (!value) return null;
  const separatorIndex = value.indexOf(':');
  if (separatorIndex <= 0 || separatorIndex >= value.length - 1) return null;

  const language = value.slice(0, separatorIndex).toLowerCase();
  const pageName = value.slice(separatorIndex + 1).trim().replace(/\s+/g, '_');
  if (!/^[a-z-]{2,12}$/.test(language) || !pageName) return null;
  return `https://${language}.wikipedia.org/wiki/${encodeURIComponent(pageName)}`;
};

const formatTagValue = (value?: string) => {
  if (!value) return null;
  return value
    .split(';')
    .map((part) => part.trim().replace(/_/g, ' '))
    .filter(Boolean)
    .join(', ');
};

const getPlaceAddress = (tags: Record<string, string>) => {
  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
  const parts = [street, tags['addr:suburb'], tags['addr:city']].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
};

const getPlaceCategory = (tags: Record<string, string>): PlaceCategory => {
  if (tags.amenity === 'cafe') return 'Cafe';
  if (tags.amenity === 'restaurant') return 'Restaurant';
  return 'Attraction';
};

const getCoordinates = (element: OverpassElement) => {
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude: Number(latitude), longitude: Number(longitude) };
};

const getDistanceKm = (
  originLatitude: number,
  originLongitude: number,
  latitude: number,
  longitude: number,
) => {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(latitude - originLatitude);
  const longitudeDelta = toRadians(longitude - originLongitude);
  const originLatitudeRadians = toRadians(originLatitude);
  const latitudeRadians = toRadians(latitude);
  const calculation = (
    Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(originLatitudeRadians)
    * Math.cos(latitudeRadians)
    * Math.sin(longitudeDelta / 2) ** 2
  );

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(calculation), Math.sqrt(1 - calculation));
};

const selectBalancedPlaces = (places: NearbyPlace[]) => {
  const recommendationScore = (place: NearbyPlace) => {
    let score = Math.max(0, 12 - place.distanceKm);
    if (place.imageUrl) score += 8;
    if (place.description) score += 6;
    if (place.referenceUrl) score += 5;
    if (place.websiteUrl) score += 3;
    if (place.address) score += 2;
    if (place.openingHours) score += 2;
    if (place.cuisine) score += 2;
    return score;
  };

  const byCategory = (category: PlaceCategory, limit: number) => (
    places
      .filter((place) => place.category === category)
      .sort((first, second) => (
        recommendationScore(second) - recommendationScore(first)
        || first.distanceKm - second.distanceKm
      ))
      .slice(0, limit)
  );

  return ([
    ...byCategory('Attraction', 6),
    ...byCategory('Cafe', 3),
    ...byCategory('Restaurant', 3),
  ]).sort((first, second) => (
    recommendationScore(second) - recommendationScore(first)
    || first.distanceKm - second.distanceKm
  ));
};

const getRelevantPlaceTokens = (placeName: string) => {
  const ignoredTokens = new Set([
    'and',
    'cafe',
    'coffee',
    'hotel',
    'restaurant',
    'the',
  ]);

  return placeName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 4 && !ignoredTokens.has(token));
};

const findCommonsImage = async (place: NearbyPlace, destination: string): Promise<NearbyPlace> => {
  if (place.imageUrl) return place;

  try {
    const searchUrl = new URL('https://commons.wikimedia.org/w/api.php');
    searchUrl.searchParams.set('action', 'query');
    searchUrl.searchParams.set('generator', 'search');
    searchUrl.searchParams.set('gsrsearch', `${place.name} ${destination}`);
    searchUrl.searchParams.set('gsrnamespace', '6');
    searchUrl.searchParams.set('gsrlimit', '6');
    searchUrl.searchParams.set('prop', 'imageinfo');
    searchUrl.searchParams.set('iiprop', 'url|size');
    searchUrl.searchParams.set('iiurlwidth', '900');
    searchUrl.searchParams.set('format', 'json');
    searchUrl.searchParams.set('origin', '*');

    const response = await fetchWithTimeout(searchUrl.href, {
      headers: {
        Accept: 'application/json',
      },
    });
    if (!response.ok) return place;

    const data = await response.json() as CommonsSearchResponse;
    const relevantTokens = getRelevantPlaceTokens(place.name);
    const pages = Object.values(data.query?.pages || {})
      .sort((first, second) => (first.index || 999) - (second.index || 999));

    const matchingPage = pages.find((page) => {
      const title = page.title || '';
      const image = page.imageinfo?.[0];
      const normalizedTitle = title.toLowerCase().replace(/[_-]+/g, ' ');
      const hasRelevantName = relevantTokens.length > 0
        ? relevantTokens.some((token) => normalizedTitle.includes(token))
        : normalizedTitle.includes(place.name.toLowerCase());

      return (
        hasRelevantName
        && !isRejectedImageName(title)
        && Number(image?.width || 0) >= 640
        && Number(image?.height || 0) >= 400
        && Boolean(image?.thumburl || image?.url)
      );
    });

    const image = matchingPage?.imageinfo?.[0];
    const imageUrl = toAbsoluteHttpUrl(image?.thumburl || image?.url);
    if (!imageUrl) return place;

    return {
      ...place,
      imageUrl,
      imageSourceUrl: toAbsoluteHttpUrl(image?.descriptionurl),
    };
  } catch {
    return place;
  }
};

const enrichPlaceImages = async (places: NearbyPlace[], destination: string) => {
  const enrichedPlaces: NearbyPlace[] = [];

  for (let index = 0; index < places.length; index += 3) {
    const batch = places.slice(index, index + 3);
    const batchResults = await Promise.all(
      batch.map((place) => findCommonsImage(place, destination)),
    );
    enrichedPlaces.push(...batchResults);
  }

  return enrichedPlaces;
};

const geocodeDestination = async (searchValue: string) => {
  const geocodeUrl = new URL('https://nominatim.openstreetmap.org/search');
  geocodeUrl.searchParams.set('q', searchValue);
  geocodeUrl.searchParams.set('format', 'jsonv2');
  geocodeUrl.searchParams.set('limit', '1');
  geocodeUrl.searchParams.set('addressdetails', '1');
  geocodeUrl.searchParams.set('accept-language', 'en');

  try {
    const response = await fetchWithTimeout(geocodeUrl.href, {
      headers: { Accept: 'application/json' },
    });
    if (response.ok) {
      const results = await response.json() as NominatimResult[];
      const latitude = Number(results[0]?.lat);
      const longitude = Number(results[0]?.lon);
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        return { latitude, longitude };
      }
    }
  } catch {
    // Fall through to the secondary geocoder.
  }

  const photonUrl = new URL('https://photon.komoot.io/api/');
  photonUrl.searchParams.set('q', searchValue);
  photonUrl.searchParams.set('limit', '1');
  photonUrl.searchParams.set('lang', 'en');

  try {
    const response = await fetchWithTimeout(photonUrl.href, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;

    const data = await response.json() as PhotonResponse;
    const coordinates = data.features?.[0]?.geometry?.coordinates;
    const longitude = Number(coordinates?.[0]);
    const latitude = Number(coordinates?.[1]);
    return Number.isFinite(latitude) && Number.isFinite(longitude)
      ? { latitude, longitude }
      : null;
  } catch {
    return null;
  }
};

const fetchOverpassData = async (overpassQuery: string) => {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    const getUrl = new URL(endpoint);
    getUrl.searchParams.set('data', overpassQuery);

    try {
      const getResponse = await fetchWithTimeout(getUrl.href, {
        headers: { Accept: 'application/json' },
      });
      if (getResponse.ok) {
        return await getResponse.json() as OverpassResponse;
      }
    } catch {
      // Some public endpoints disable cross-origin GET requests; try POST next.
    }

    try {
      const postResponse = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        body: `data=${encodeURIComponent(overpassQuery)}`,
      });
      if (postResponse.ok) {
        return await postResponse.json() as OverpassResponse;
      }
    } catch {
      // Continue to the next public endpoint.
    }
  }

  return null;
};

const fetchWikipediaNearbyPlaces = async (
  latitude: number,
  longitude: number,
): Promise<NearbyPlace[]> => {
  try {
    const searchUrl = new URL('https://en.wikipedia.org/w/api.php');
    searchUrl.searchParams.set('action', 'query');
    searchUrl.searchParams.set('generator', 'geosearch');
    searchUrl.searchParams.set('ggsprimary', 'all');
    searchUrl.searchParams.set('ggsnamespace', '0');
    searchUrl.searchParams.set('ggscoord', `${latitude}|${longitude}`);
    searchUrl.searchParams.set('ggsradius', '10000');
    searchUrl.searchParams.set('ggslimit', '16');
    searchUrl.searchParams.set('prop', 'coordinates|description|pageimages|info');
    searchUrl.searchParams.set('inprop', 'url');
    searchUrl.searchParams.set('piprop', 'thumbnail');
    searchUrl.searchParams.set('pithumbsize', '900');
    searchUrl.searchParams.set('format', 'json');
    searchUrl.searchParams.set('origin', '*');

    const response = await fetchWithTimeout(searchUrl.href, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return [];

    const data = await response.json() as WikipediaGeoSearchResponse;
    const rejectedPlaceTerms = [
      'assembly constituency',
      'district',
      'ethnic group',
      'legislative assembly',
    ];

    return Object.values(data.query?.pages || {})
      .sort((first, second) => (first.index ?? 999) - (second.index ?? 999))
      .reduce<NearbyPlace[]>((places, page) => {
        const name = page.title?.trim();
        const normalizedName = name?.toLowerCase() || '';
        if (
          !name
          || rejectedPlaceTerms.some((term) => normalizedName.includes(term))
        ) {
          return places;
        }

        const coordinates = page.coordinates?.[0];
        const placeLatitude = Number(coordinates?.lat ?? latitude);
        const placeLongitude = Number(coordinates?.lon ?? longitude);
        if (!Number.isFinite(placeLatitude) || !Number.isFinite(placeLongitude)) return places;

        const thumbnailUrl = page.thumbnail?.source;
        const imageUrl = thumbnailUrl && !isRejectedImageName(`${name} ${thumbnailUrl}`)
          ? toAbsoluteHttpUrl(thumbnailUrl)
          : null;
        const referenceUrl = toAbsoluteHttpUrl(page.fullurl || page.canonicalurl);

        places.push({
          id: `wikipedia-${page.pageid}`,
          name,
          category: 'Attraction',
          latitude: placeLatitude,
          longitude: placeLongitude,
          distanceKm: getDistanceKm(
            latitude,
            longitude,
            placeLatitude,
            placeLongitude,
          ),
          imageUrl,
          imageSourceUrl: referenceUrl,
          description: page.description?.trim() || null,
          cuisine: null,
          openingHours: null,
          address: null,
          mapUrl: `https://www.openstreetmap.org/?mlat=${placeLatitude}&mlon=${placeLongitude}#map=16/${placeLatitude}/${placeLongitude}`,
          websiteUrl: null,
          referenceUrl,
        });

        return places;
      }, [])
      .slice(0, 6);
  } catch {
    return [];
  }
};

const fetchNearbyPlaces = async (searchValue: string) => {
  const cachedPlaces = readCachedPlaces(searchValue);
  if (cachedPlaces) return cachedPlaces;

  const existingRequest = inflightRequests.get(searchValue);
  if (existingRequest) return existingRequest;

  const request = (async () => {
    const destinationSearchValues = getDestinationSearchValues(searchValue);
    const placeGroups: NearbyPlace[][] = [];
    let resolvedDestinationCount = 0;
    let overpassResponseCount = 0;

    for (const destinationSearchValue of destinationSearchValues) {
      const origin = await geocodeDestination(destinationSearchValue);
      if (!origin) continue;
      resolvedDestinationCount += 1;

      const { latitude, longitude } = origin;
      const overpassQuery = `
        [out:json][timeout:20];
        (
          nwr(around:18000,${latitude},${longitude})["name"]["tourism"~"attraction|museum|viewpoint|gallery|zoo|theme_park"];
          nwr(around:10000,${latitude},${longitude})["name"]["amenity"="cafe"];
          nwr(around:10000,${latitude},${longitude})["name"]["amenity"="restaurant"];
        );
        out center qt 160;
      `;

      const seenGroupPlaces = new Set<string>();
      const overpassData = await fetchOverpassData(overpassQuery);
      if (overpassData) overpassResponseCount += 1;

      const groupPlaces = (overpassData?.elements || []).reduce<NearbyPlace[]>((results, element) => {
        const tags = element.tags || {};
        const name = tags.name?.trim();
        const placeCoordinates = getCoordinates(element);
        if (!name || !placeCoordinates) return results;

        const category = getPlaceCategory(tags);
        const dedupeKey = `${category}:${name.toLowerCase()}`;
        if (seenGroupPlaces.has(dedupeKey)) return results;
        seenGroupPlaces.add(dedupeKey);

        const distanceKm = getDistanceKm(
          latitude,
          longitude,
          placeCoordinates.latitude,
          placeCoordinates.longitude,
        );

        results.push({
          id: `${element.type}-${element.id}`,
          name,
          category,
          latitude: placeCoordinates.latitude,
          longitude: placeCoordinates.longitude,
          distanceKm,
          imageUrl: getPlaceImage(tags),
          imageSourceUrl: getPlaceImageSource(tags),
          description: tags.description?.trim() || null,
          cuisine: formatTagValue(tags.cuisine),
          openingHours: tags.opening_hours?.trim() || null,
          address: getPlaceAddress(tags),
          mapUrl: `https://www.openstreetmap.org/?mlat=${placeCoordinates.latitude}&mlon=${placeCoordinates.longitude}#map=16/${placeCoordinates.latitude}/${placeCoordinates.longitude}`,
          websiteUrl: toAbsoluteHttpUrl(tags.website || tags['contact:website']),
          referenceUrl: getWikipediaUrl(tags.wikipedia)
            || (tags.wikidata ? `https://www.wikidata.org/wiki/${encodeURIComponent(tags.wikidata)}` : null),
        });

        return results;
      }, []);

      const fallbackPlaces = groupPlaces.length === 0
        ? await fetchWikipediaNearbyPlaces(latitude, longitude)
        : [];
      const selectedGroupPlaces = selectBalancedPlaces(
        groupPlaces.length > 0 ? groupPlaces : fallbackPlaces,
      );
      if (selectedGroupPlaces.length > 0) placeGroups.push(selectedGroupPlaces);
    }

    if (
      resolvedDestinationCount > 0
      && overpassResponseCount === 0
      && placeGroups.length === 0
    ) {
      throw new Error('Nearby recommendations are temporarily unavailable.');
    }

    const selectedPlaces: NearbyPlace[] = [];
    const seenPlaces = new Set<string>();
    const largestGroupSize = Math.max(0, ...placeGroups.map((group) => group.length));

    for (let placeIndex = 0; placeIndex < largestGroupSize && selectedPlaces.length < 12; placeIndex += 1) {
      for (const group of placeGroups) {
        const place = group[placeIndex];
        if (!place) continue;

        const dedupeKey = `${place.category}:${place.name.toLowerCase()}`;
        if (seenPlaces.has(dedupeKey)) continue;
        seenPlaces.add(dedupeKey);
        selectedPlaces.push(place);

        if (selectedPlaces.length === 12) break;
      }
    }

    const enrichedPlaces = await enrichPlaceImages(selectedPlaces, searchValue);
    writeCachedPlaces(searchValue, enrichedPlaces);
    return enrichedPlaces;
  })();

  inflightRequests.set(searchValue, request);

  try {
    return await request;
  } finally {
    inflightRequests.delete(searchValue);
  }
};

const PlaceVisual = ({ place }: { place: NearbyPlace }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const Icon = place.category === 'Cafe'
    ? Coffee
    : place.category === 'Restaurant'
      ? Utensils
      : Landmark;

  if (place.imageUrl && !imageFailed) {
    return (
      <img
        src={place.imageUrl}
        alt={place.name}
        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        loading="lazy"
        decoding="async"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-[#edf7e8] via-[#fff8e8] to-[#ffe9df]">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/80 bg-white/80 text-[#4DA528] shadow-sm backdrop-blur">
        <Icon className="h-7 w-7" />
      </div>
    </div>
  );
};

interface PlaceCardProps {
  destination: string;
  packageTitle: string;
  place: NearbyPlace;
}

const PlaceCard = ({ destination, packageTitle, place }: PlaceCardProps) => {
  const CategoryIcon = place.category === 'Cafe'
    ? Coffee
    : place.category === 'Restaurant'
      ? Utensils
      : Landmark;
  const details = [
    place.cuisine,
    place.openingHours ? `Open: ${place.openingHours}` : null,
    place.address,
    place.description,
  ].filter(Boolean);
  const detailsPath = getNearbyPlacePath(place.name);
  const rememberPlace = () => storeNearbyPlace(place, destination, packageTitle);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[16px] border border-white/80 bg-white shadow-[0_12px_34px_rgba(18,38,32,0.09)] ring-1 ring-stone-200/70 transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_48px_rgba(18,38,32,0.15)]">
      <div className="relative aspect-[16/9] overflow-hidden bg-stone-100">
        <PlaceVisual place={place} />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-stone-950/40 via-transparent to-stone-950/5 opacity-80" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/90 px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-stone-800 shadow-sm backdrop-blur-md">
          <CategoryIcon className="h-3.5 w-3.5 text-[#4DA528]" />
          {place.category}
        </span>
        <span className="absolute bottom-3 left-3 rounded-full border border-white/40 bg-stone-950/65 px-2.5 py-1.5 text-[10px] font-bold text-white backdrop-blur-md">
          {place.distanceKm < 1
            ? `${Math.max(1, Math.round(place.distanceKm * 1000))} m away`
            : `${place.distanceKm.toFixed(1)} km away`}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col bg-linear-to-br from-white to-[#fffaf2] p-4">
        <h3 className="line-clamp-2 min-h-[2.75rem] text-lg font-extrabold leading-snug text-stone-950">{place.name}</h3>

        <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-[13px] leading-5 text-stone-600">
          {details[0] || `Explore this ${place.category.toLowerCase()} near your travel destination.`}
        </p>

        <div className="mt-4 flex items-center gap-2 border-t border-stone-200/80 pt-4">
          <a
            href={detailsPath}
            target="_blank"
            rel="noreferrer"
            onClick={rememberPlace}
            onAuxClick={rememberPlace}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-[6px] bg-[#ff5a1f] px-3 py-2.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-[#df4512]"
            aria-label={`Read details about ${place.name}`}
          >
            View details
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <a
            href={place.mapUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] bg-stone-950 text-white transition hover:bg-[#4DA528]"
            aria-label={`View ${place.name} on OpenStreetMap`}
            title="Directions"
          >
            <Navigation className="h-4 w-4" />
          </a>
        </div>
      </div>
    </article>
  );
};

const LoadingCards = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {[0, 1, 2, 3, 4, 5].map((item) => (
      <div key={item} className="overflow-hidden rounded-[16px] border border-stone-200 bg-white">
        <div className="aspect-[16/9] animate-pulse bg-stone-200" />
        <div className="space-y-3 p-4">
          <div className="h-5 w-2/3 animate-pulse rounded bg-stone-200" />
          <div className="h-10 animate-pulse rounded bg-stone-100" />
          <div className="h-4 w-24 animate-pulse rounded bg-stone-100" />
        </div>
      </div>
    ))}
  </div>
);

export default function NearbyPlacesSection({
  destination,
  packageTitle,
}: NearbyPlacesSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const searchValue = useMemo(
    () => normalizeSearchValue(destination || packageTitle),
    [destination, packageTitle],
  );
  const [shouldLoad, setShouldLoad] = useState(false);
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | PlaceCategory>('All');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || shouldLoad) return;

    if (!('IntersectionObserver' in window)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '500px 0px' },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [shouldLoad]);

  useEffect(() => {
    if (!shouldLoad || !searchValue) return;

    let isActive = true;
    setLoading(true);
    setError('');

    void fetchNearbyPlaces(searchValue)
      .then((nextPlaces) => {
        if (!isActive) return;
        setPlaces(nextPlaces);
      })
      .catch((caughtError: unknown) => {
        if (!isActive) return;
        setPlaces([]);
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'Nearby recommendations are temporarily unavailable.',
        );
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [retryCount, searchValue, shouldLoad]);

  useEffect(() => {
    setActiveCategory('All');
    setPlaces([]);
    setError('');
  }, [searchValue]);

  const availableCategories = useMemo(
    () => (['Attraction', 'Cafe', 'Restaurant'] as PlaceCategory[])
      .filter((category) => places.some((place) => place.category === category)),
    [places],
  );

  const visiblePlaces = useMemo(
    () => (
      activeCategory === 'All'
        ? places.slice(0, 12)
        : places.filter((place) => place.category === activeCategory).slice(0, 12)
    ),
    [activeCategory, places],
  );

  return (
    <section
      ref={sectionRef}
      className="rounded-[24px] border border-stone-200/80 bg-gradient-to-br from-white via-[#fffdf8] to-[#f3f9ef] p-6 shadow-[0_24px_70px_rgba(18,38,32,0.08)] md:p-8"
      id="nearby-places"
    >
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <span className="text-[13px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Around your destination</span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-stone-950 md:text-4xl">
            {destination || packageTitle} Top Places
          </h2>
          <p className="mt-3 text-sm leading-7 text-stone-600">
            Discover nearby attractions, cafes and restaurants for a richer holiday experience.
          </p>
        </div>

        {places.length > 0 && (
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1" aria-label="Nearby place categories">
            {(['All', ...availableCategories] as Array<'All' | PlaceCategory>).map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${
                  activeCategory === category
                    ? 'border-stone-950 bg-stone-950 text-white'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-[#4DA528] hover:text-[#3c861d]'
                }`}
              >
                {category === 'Cafe' ? 'Cafes' : category === 'Restaurant' ? 'Restaurants' : category}
              </button>
            ))}
          </div>
        )}
      </div>

      {!shouldLoad || loading ? (
        <LoadingCards />
      ) : error ? (
        <div className="flex flex-col items-center rounded-[14px] border border-dashed border-stone-300 bg-white/70 px-6 py-10 text-center">
          <AlertCircle className="h-8 w-8 text-[#ff5a1f]" />
          <h3 className="mt-4 text-lg font-extrabold text-stone-950">Recommendations could not be loaded</h3>
          <p className="mt-2 max-w-lg text-sm leading-6 text-stone-600">{error}</p>
          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            className="mt-5 inline-flex items-center gap-2 rounded-[6px] bg-stone-950 px-5 py-3 text-xs font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-[#4DA528]"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      ) : visiblePlaces.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visiblePlaces.map((place) => (
            <PlaceCard
              key={place.id}
              destination={destination || searchValue}
              packageTitle={packageTitle}
              place={place}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center rounded-[14px] border border-dashed border-stone-300 bg-white/70 px-6 py-10 text-center">
          <MapPin className="h-8 w-8 text-[#4DA528]" />
          <h3 className="mt-4 text-lg font-extrabold text-stone-950">Nearby recommendations are being mapped</h3>
          <p className="mt-2 max-w-lg text-sm leading-6 text-stone-600">
            Verified nearby places are not available for this destination at the moment.
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2 border-t border-stone-200 pt-5 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-center gap-2">
          <Navigation className="h-3.5 w-3.5 text-[#4DA528]" />
          Distances are measured from {destination || 'the package destination'}.
        </span>
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
          className="font-semibold transition hover:text-[#4DA528]"
        >
          Place data © OpenStreetMap contributors
        </a>
        {places.some((place) => place.imageSourceUrl?.includes('wikimedia.org')) && (
          <a
            href="https://commons.wikimedia.org/"
            target="_blank"
            rel="noreferrer"
            className="font-semibold transition hover:text-[#4DA528]"
          >
            Photos from Wikimedia Commons
          </a>
        )}
      </div>
    </section>
  );
}
