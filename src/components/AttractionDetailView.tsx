import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Clock3,
  Coffee,
  ExternalLink,
  Globe2,
  Landmark,
  MapPin,
  Navigation,
  Route,
  Utensils,
} from 'lucide-react';
import {
  getNameFromNearbyPlaceSlug,
  readStoredNearbyPlace,
} from '../utils/nearbyPlaceDetails';

interface AttractionDetailViewProps {
  placeSlug: string | null;
}

export default function AttractionDetailView({ placeSlug }: AttractionDetailViewProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const normalizedSlug = decodeURIComponent(placeSlug || '');
  const storedPlace = useMemo(
    () => readStoredNearbyPlace(normalizedSlug),
    [normalizedSlug],
  );
  const place = storedPlace?.place || null;
  const placeName = place?.name || getNameFromNearbyPlaceSlug(normalizedSlug) || 'Destination Place';
  const CategoryIcon = place?.category === 'Cafe'
    ? Coffee
    : place?.category === 'Restaurant'
      ? Utensils
      : Landmark;

  const mapUrl = place?.mapUrl
    || `https://www.openstreetmap.org/search?query=${encodeURIComponent(placeName)}`;

  const embeddedMapUrl = useMemo(() => {
    if (!place) return null;
    const latitudeSpan = 0.018;
    const longitudeSpan = 0.024;
    const boundingBox = [
      place.longitude - longitudeSpan,
      place.latitude - latitudeSpan,
      place.longitude + longitudeSpan,
      place.latitude + latitudeSpan,
    ].join(',');

    return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(boundingBox)}&layer=mapnik&marker=${place.latitude}%2C${place.longitude}`;
  }, [place]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [normalizedSlug]);

  const detailRows = [
    place?.category ? { label: 'Place type', value: place.category, icon: CategoryIcon } : null,
    storedPlace?.destination ? { label: 'Destination', value: storedPlace.destination, icon: MapPin } : null,
    place?.distanceKm != null
      ? {
        label: 'Distance',
        value: place.distanceKm < 1
          ? `${Math.max(1, Math.round(place.distanceKm * 1000))} metres`
          : `${place.distanceKm.toFixed(1)} kilometres`,
        icon: Route,
      }
      : null,
    place?.openingHours ? { label: 'Opening hours', value: place.openingHours, icon: Clock3 } : null,
    place?.cuisine ? { label: 'Cuisine', value: place.cuisine, icon: Utensils } : null,
    place?.address ? { label: 'Address', value: place.address, icon: MapPin } : null,
  ].filter((row): row is NonNullable<typeof row> => Boolean(row));

  return (
    <div className="min-h-screen bg-[#f3f6f8] pb-20 pt-28 text-stone-900">
      <section className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <a
          href="/packages"
          className="mb-5 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-stone-600 transition hover:text-[#4DA528]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to packages
        </a>

        <div className="relative min-h-[420px] overflow-hidden rounded-[24px] bg-stone-900 shadow-[0_28px_75px_rgba(18,38,32,0.2)]">
          {place?.imageUrl && !imageFailed ? (
            <img
              src={place.imageUrl}
              alt={placeName}
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="absolute inset-0 bg-linear-to-br from-[#18352a] via-[#31552d] to-[#d7762e]">
              <CategoryIcon className="absolute right-[8%] top-1/2 h-40 w-40 -translate-y-1/2 text-white/10 md:h-56 md:w-56" />
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-stone-950 via-stone-950/50 to-stone-950/15" />

          <div className="relative flex min-h-[420px] max-w-4xl flex-col justify-end p-6 text-white sm:p-10 lg:p-14">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em] backdrop-blur-md">
              <CategoryIcon className="h-4 w-4" />
              {place?.category || 'Destination guide'}
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              {placeName}
            </h1>
            {storedPlace?.destination && (
              <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-white/85 sm:text-base">
                <MapPin className="h-5 w-5 text-[#9cdd6f]" />
                Near {storedPlace.destination}
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-7">
            <article className="rounded-[20px] border border-stone-200 bg-white p-6 shadow-[0_18px_50px_rgba(18,38,32,0.08)] sm:p-8">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#4DA528]">About this place</span>
              <h2 className="mt-3 text-3xl font-extrabold text-stone-950">{placeName}</h2>
              <p className="mt-5 text-base leading-8 text-stone-600">
                {place?.description
                  || `Detailed editorial information for ${placeName} is not available from the verified place source yet. Use the location map and official links below for current information.`}
              </p>

              {storedPlace?.packageTitle && (
                <div className="mt-6 rounded-[12px] border border-[#4DA528]/20 bg-[#f3faef] px-5 py-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#4DA528]">Recommended near package</p>
                  <p className="mt-2 font-bold text-stone-900">{storedPlace.packageTitle}</p>
                </div>
              )}
            </article>

            <article className="overflow-hidden rounded-[20px] border border-stone-200 bg-white shadow-[0_18px_50px_rgba(18,38,32,0.08)]">
              <div className="flex items-center justify-between border-b border-stone-200 px-6 py-5 sm:px-8">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#4DA528]">Location</span>
                  <h2 className="mt-1 text-2xl font-extrabold text-stone-950">Find it on the map</h2>
                </div>
                <Navigation className="h-6 w-6 text-[#ff5a1f]" />
              </div>

              {embeddedMapUrl ? (
                <iframe
                  src={embeddedMapUrl}
                  title={`Map showing ${placeName}`}
                  className="h-[380px] w-full border-0"
                  loading="lazy"
                />
              ) : (
                <div className="flex min-h-[260px] flex-col items-center justify-center bg-[#f6f2ea] px-6 text-center">
                  <MapPin className="h-9 w-9 text-[#4DA528]" />
                  <p className="mt-4 max-w-md text-sm leading-7 text-stone-600">
                    Open the place search to view its latest mapped location.
                  </p>
                </div>
              )}
            </article>
          </div>

          <aside className="h-fit rounded-[20px] border border-stone-200 bg-white p-6 shadow-[0_18px_50px_rgba(18,38,32,0.1)] lg:sticky lg:top-28">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#4DA528]">Quick details</span>
            <div className="mt-5 divide-y divide-stone-200">
              {detailRows.length > 0 ? detailRows.map((row) => {
                const Icon = row.icon;
                return (
                  <div key={row.label} className="flex gap-3 py-4 first:pt-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#edf7e8] text-[#4DA528]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-stone-400">{row.label}</p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-stone-800">{row.value}</p>
                    </div>
                  </div>
                );
              }) : (
                <p className="pb-5 text-sm leading-7 text-stone-600">
                  Verified place details are limited. Use map search for current information.
                </p>
              )}
            </div>

            <a
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-[6px] bg-[#ff5a1f] px-5 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white transition hover:bg-[#df4512]"
            >
              Open directions
              <Navigation className="h-4 w-4" />
            </a>

            {place?.websiteUrl && (
              <a
                href={place.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[6px] border border-stone-300 px-5 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-stone-800 transition hover:border-[#4DA528] hover:text-[#4DA528]"
              >
                Official website
                <Globe2 className="h-4 w-4" />
              </a>
            )}

            {place?.referenceUrl && (
              <a
                href={place.referenceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[6px] border border-stone-300 px-5 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-stone-800 transition hover:border-[#4DA528] hover:text-[#4DA528]"
              >
                Read reference
                <ExternalLink className="h-4 w-4" />
              </a>
            )}

            {place?.imageSourceUrl && (
              <a
                href={place.imageSourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[6px] border border-stone-300 px-5 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-stone-800 transition hover:border-[#4DA528] hover:text-[#4DA528]"
              >
                Image source
                <ExternalLink className="h-4 w-4" />
              </a>
            )}

            <p className="mt-5 border-t border-stone-200 pt-4 text-[11px] leading-5 text-stone-500">
              Place and map data © OpenStreetMap contributors.
            </p>
          </aside>
        </div>
      </section>
    </div>
  );
}
