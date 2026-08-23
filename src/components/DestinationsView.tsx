import { useMemo, useState } from 'react';
import { ArrowRight, Loader2, MapPin, Sparkles } from 'lucide-react';
import { FeaturedCategoryItem, TravelPackage } from '../types';
import { getTravelImage, handleTravelImageError } from '../utils/imageFallback';

interface PackageFilterSelection {
  search?: string;
  category?: string;
  location?: string;
  destination?: string;
  bookingType?: string;
}

interface DestinationCard {
  id: string;
  title: string;
  description: string;
  image: string;
  badge: string;
  count: number;
  filter: PackageFilterSelection;
}

interface DestinationsViewProps {
  onSelectCategory: (category: string) => void;
  onSelectFilter?: (filters: PackageFilterSelection) => void;
  packages?: TravelPackage[];
  featuredCategories?: FeaturedCategoryItem[];
  loading?: boolean;
}

const normalizeKey = (value: string) => value.trim().toLowerCase();

export default function DestinationsView({
  onSelectCategory,
  onSelectFilter,
  packages = [],
  featuredCategories = [],
  loading = false,
}: DestinationsViewProps) {
  const [redirectingId, setRedirectingId] = useState<string | null>(null);

  const activePackages = useMemo(() => packages.filter((pkg) => pkg.active), [packages]);

  const destinationCards = useMemo<DestinationCard[]>(() => {
    const enabledCmsCards = featuredCategories
      .filter((item) => item.enabled !== false)
      .map((item) => {
        const linkedPackageIds = new Set((item.packageIds || []).map((id) => String(id)));
        const matchingPackages = activePackages.filter((pkg) => {
          const matchesLinkedPackage = linkedPackageIds.size > 0 && linkedPackageIds.has(String(pkg.id));
          const matchesCategory = item.category && normalizeKey(String(pkg.category)) === normalizeKey(String(item.category));
          const matchesLocation = item.location && (
            normalizeKey(String(pkg.location ?? '')).includes(normalizeKey(String(item.location))) ||
            normalizeKey(String(pkg.destination ?? '')).includes(normalizeKey(String(item.location)))
          );
          return matchesLinkedPackage || matchesCategory || matchesLocation;
        });

        const fallbackPackage = matchingPackages[0] || activePackages[0];
        const filter: PackageFilterSelection = item.category
          ? { category: String(item.category) }
          : item.location
            ? { location: String(item.location) }
            : { search: item.title };

        return {
          id: `cms-${item.id}`,
          title: item.title,
          description: item.description || `Explore ${item.title} packages curated by Pravaah Travels.`,
          image: item.imageUrl || fallbackPackage?.imageUrl || '',
          badge: item.category || item.location || 'Curated',
          count: matchingPackages.length,
          filter,
        };
      });

    if (enabledCmsCards.length > 0) {
      return enabledCmsCards;
    }

    const groupedByCategory = new Map<string, DestinationCard>();
    activePackages.forEach((pkg) => {
      const category = String(pkg.category || '').trim();
      if (!category) return;

      const key = normalizeKey(category);
      const existing = groupedByCategory.get(key);
      if (existing) {
        existing.count += 1;
        return;
      }

      groupedByCategory.set(key, {
        id: `category-${key}`,
        title: `${category} Tours`,
        description: `Browse ${category.toLowerCase()} packages built from live Pravaah itinerary data.`,
        image: pkg.imageUrl,
        badge: category,
        count: 1,
        filter: { category },
      });
    });

    const groupedByBookingType = new Map<string, DestinationCard>();
    activePackages.forEach((pkg) => {
      const bookingType = String(pkg.bookingType || '').trim();
      if (!bookingType) return;

      const key = normalizeKey(bookingType);
      if (groupedByCategory.has(key) || groupedByBookingType.has(key)) {
        const existing = groupedByBookingType.get(key);
        if (existing) existing.count += 1;
        return;
      }

      groupedByBookingType.set(key, {
        id: `type-${key}`,
        title: bookingType,
        description: `Discover ${bookingType.toLowerCase()} packages available in the current catalog.`,
        image: pkg.imageUrl,
        badge: 'Travel Style',
        count: 1,
        filter: { bookingType },
      });
    });

    return [...groupedByCategory.values(), ...groupedByBookingType.values()];
  }, [activePackages, featuredCategories]);

  const handleCardClick = (card: DestinationCard) => {
    setRedirectingId(card.id);
    window.setTimeout(() => {
      if (onSelectFilter) {
        onSelectFilter(card.filter);
        return;
      }

      if (card.filter.category) {
        onSelectCategory(card.filter.category);
      }
    }, 180);
  };

  return (
    <div id="destinations-view" className="animate-fade-in bg-[#F7F8F4] py-20">
      <div className="mx-auto max-w-[1320px] space-y-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-3 text-center">
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Travel Styles</span>
          <h2 className="text-[38px] font-extrabold leading-tight text-stone-950 sm:text-[56px]">
            Discover by Destination Category
          </h2>
          <div className="mx-auto mt-3 h-0.5 w-16 bg-[#FF970D]" />
          <p className="mx-auto max-w-xl text-sm leading-7 text-stone-500 sm:text-base">
            Choose your preferred travel mood. Each card opens matching live packages automatically.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-[430px] animate-pulse rounded-[12px] border border-stone-200 bg-white shadow-[0_12px_35px_rgba(18,38,32,0.08)]">
                <div className="h-64 rounded-t-[12px] bg-stone-200" />
                <div className="space-y-4 p-6">
                  <div className="h-5 w-2/3 rounded bg-stone-200" />
                  <div className="h-4 w-full rounded bg-stone-100" />
                  <div className="h-4 w-5/6 rounded bg-stone-100" />
                </div>
              </div>
            ))}
          </div>
        ) : destinationCards.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-stone-300 bg-white p-10 text-center shadow-sm">
            <Sparkles className="mx-auto h-10 w-10 text-[#4DA528]" />
            <h3 className="mt-4 text-2xl font-extrabold text-stone-950">No destination categories yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-stone-500">
              Publish active packages or featured category CMS cards to populate this page.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {destinationCards.map((card) => {
              const isRedirecting = redirectingId === card.id;

              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => handleCardClick(card)}
                  disabled={Boolean(redirectingId)}
                  className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[12px] border border-stone-200 bg-white text-left shadow-[0_12px_35px_rgba(18,38,32,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(18,38,32,0.14)] disabled:cursor-wait disabled:opacity-80"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                    <img
                      src={getTravelImage(card.image)}
                      alt={card.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                      onError={handleTravelImageError}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-stone-900/65 via-stone-900/10 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 text-white">
                      <span className="rounded-[5px] bg-[#4DA528] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                        {card.badge}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-stone-800">
                        <MapPin className="h-3.5 w-3.5 text-[#FF970D]" />
                        {card.count} {card.count === 1 ? 'Package' : 'Packages'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between space-y-4 p-6">
                    <div className="space-y-2">
                      <h3 className="text-[22px] font-bold leading-tight text-stone-950 transition-colors group-hover:text-[#4DA528]">
                        {card.title}
                      </h3>
                      <p className="line-clamp-3 text-sm leading-7 text-stone-600">
                        {card.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-stone-100 pt-4 text-[11px] font-bold uppercase tracking-wider text-[#4DA528]">
                      <span>{isRedirecting ? 'Opening packages' : 'Explore matching packages'}</span>
                      {isRedirecting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
