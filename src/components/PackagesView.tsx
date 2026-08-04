import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  Compass,
  Filter,
  Heart,
  MapPin,
  MessageCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { DEFAULT_WEBSITE_CMS, PACKAGE_LOCATIONS, TravelPackage, WebsiteCMSSettings, formatPrice } from '../types';
import { comparePackagesForDisplay } from '../utils/packageOrdering';
import { SkeletonPackage } from './SkeletonLoader';
import TravelMedia from './TravelMedia';

interface PackagesViewProps {
  packages: TravelPackage[];
  onNavigate: (view: string, packageId?: string | null) => void;
  loading: boolean;
  isAdminLoggedIn?: boolean;
  onDeletePackage?: (id: string) => void;
  prefilledCategory?: string;
  selectedLocationFilter?: string;
  onResetPrefilledCategory?: () => void;
  onClearSelectedLocation?: () => void;
  onPackageSaved?: () => void;
  wishlistPackageIds?: string[];
  onToggleWishlist?: (pkg: TravelPackage) => Promise<void> | void;
  websiteCMS?: WebsiteCMSSettings;
}

interface PackageFilters {
  searchQuery: string;
  category: string;
  destination: string;
  bookingType: string;
  duration: string;
  availability: string;
}

type PackageWithOptionalRating = TravelPackage & {
  rating?: number;
  reviewCount?: number;
  reviewsCount?: number;
};

const defaultFilters: PackageFilters = {
  searchQuery: '',
  category: 'All',
  destination: 'All',
  bookingType: 'All',
  duration: 'All',
  availability: 'All',
};

const readFiltersFromUrl = (): PackageFilters => {
  if (typeof window === 'undefined') return defaultFilters;

  const params = new URLSearchParams(window.location.search);
  return {
    searchQuery: params.get('search') || '',
    category: params.get('category') || 'All',
    destination: params.get('destination') || params.get('location') || 'All',
    bookingType: params.get('type') || 'All',
    duration: params.get('duration') || 'All',
    availability: params.get('availability') || 'All',
  };
};

const getDurationDays = (duration: string) => {
  const daysMatch = String(duration ?? '').match(/(\d+)\s*Day/i);
  return daysMatch ? Number(daysMatch[1]) : 0;
};

const matchesText = (value: unknown, target: string) => String(value ?? '').toLowerCase().includes(target);

const uniqueStrings = (values: Array<string | undefined | null>) => {
  return Array.from(new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
};

const getPackageRating = (pkg: TravelPackage) => {
  const rating = Number((pkg as PackageWithOptionalRating).rating);
  return Number.isFinite(rating) && rating > 0 ? Math.min(rating, 5) : null;
};

const getPackageReviewCount = (pkg: TravelPackage) => {
  const ratedPackage = pkg as PackageWithOptionalRating;
  const reviewCount = Number(ratedPackage.reviewCount ?? ratedPackage.reviewsCount);
  return Number.isFinite(reviewCount) && reviewCount > 0 ? reviewCount : null;
};

const slugifyPackageTitle = (value: string) => String(value ?? '')
  .toLowerCase()
  .trim()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const getPackageRouteSegment = (pkg: Pick<TravelPackage, 'id' | 'title'>) => {
  const slug = slugifyPackageTitle(pkg.title);
  return slug ? `${slug}-${pkg.id}` : String(pkg.id);
};

const sanitizeWhatsAppPhone = (value?: string) => {
  const digits = String(value ?? '').replace(/[^\d]/g, '');
  if (!digits) return '';
  const trimmed = digits.replace(/^0+/, '');
  // Only treat the number as already carrying the "91" country code at the full 12-digit
  // length — a raw 10-digit Indian mobile number that happens to start with "91" (e.g.
  // 9198765432) was previously misdetected as already coded, producing a broken wa.me link.
  return trimmed.length === 12 && trimmed.startsWith('91') ? trimmed : `91${trimmed}`;
};

export default function PackagesView({
  packages,
  onNavigate,
  loading,
  isAdminLoggedIn = false,
  onDeletePackage,
  prefilledCategory = 'All',
  selectedLocationFilter = 'All',
  onResetPrefilledCategory,
  onClearSelectedLocation,
  onPackageSaved,
  wishlistPackageIds = [],
  onToggleWishlist,
  websiteCMS,
}: PackagesViewProps) {
  const initialFilters = useMemo(() => readFiltersFromUrl(), []);
  const [searchQuery, setSearchQuery] = useState(initialFilters.searchQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category);
  const [selectedDestination, setSelectedDestination] = useState(initialFilters.destination);
  const [selectedBookingType, setSelectedBookingType] = useState(initialFilters.bookingType);
  const [selectedDuration, setSelectedDuration] = useState(initialFilters.duration);
  const [selectedAvailability, setSelectedAvailability] = useState(initialFilters.availability);
  const [sortOrder, setSortOrder] = useState(() => {
    if (typeof window === 'undefined') return 'default';
    return new URLSearchParams(window.location.search).get('sort') || 'default';
  });
  const [saveNotice, setSaveNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [savingPackageId, setSavingPackageId] = useState<string | null>(null);

  const activePackages = useMemo(() => packages.filter((pkg) => pkg.active), [packages]);

  const categoryOptions = useMemo(() => {
    const options = uniqueStrings(activePackages.map((pkg) => String(pkg.category ?? '')));
    if (selectedCategory !== 'All' && !options.includes(selectedCategory)) {
      return [selectedCategory, ...options];
    }
    return options;
  }, [activePackages, selectedCategory]);

  const destinationOptions = useMemo(() => {
    const packageDestinations = activePackages.flatMap((pkg) => [
      String(pkg.location ?? ''),
      String(pkg.destination ?? ''),
    ]);
    const options = uniqueStrings([...PACKAGE_LOCATIONS, ...packageDestinations]);
    if (selectedDestination !== 'All' && !options.includes(selectedDestination)) {
      return [selectedDestination, ...options];
    }
    return options;
  }, [activePackages, selectedDestination]);

  useEffect(() => {
    if (prefilledCategory && prefilledCategory !== 'All') {
      setSelectedCategory(prefilledCategory);
    }
  }, [prefilledCategory]);

  useEffect(() => {
    if (selectedLocationFilter && selectedLocationFilter !== 'All') {
      setSelectedDestination(selectedLocationFilter);
    }
  }, [selectedLocationFilter]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (selectedCategory !== 'All') params.set('category', selectedCategory);
    if (selectedDestination !== 'All') params.set('destination', selectedDestination);
    if (selectedBookingType !== 'All') params.set('type', selectedBookingType);
    if (selectedDuration !== 'All') params.set('duration', selectedDuration);
    if (selectedAvailability !== 'All') params.set('availability', selectedAvailability);
    if (sortOrder !== 'default') params.set('sort', sortOrder);

    const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState({}, '', nextUrl);
  }, [searchQuery, selectedCategory, selectedDestination, selectedBookingType, selectedDuration, selectedAvailability, sortOrder]);

  const filteredPackages = useMemo(() => {
    const searchValue = searchQuery.trim().toLowerCase();
    const normalizedCategory = selectedCategory.toLowerCase();
    const normalizedDestination = selectedDestination.toLowerCase();
    const normalizedBookingType = selectedBookingType.toLowerCase();

    const filtered = activePackages.filter((pkg) => {
      const destinationValue = String(pkg.destination ?? '');
      const locationValue = String(pkg.location ?? '');
      const categoryValue = String(pkg.category ?? '');
      const bookingTypeValue = String(pkg.bookingType ?? '');

      const matchSearch = !searchValue ||
        matchesText(pkg.title, searchValue) ||
        matchesText(destinationValue, searchValue) ||
        matchesText(locationValue, searchValue) ||
        matchesText(categoryValue, searchValue) ||
        matchesText(bookingTypeValue, searchValue) ||
        matchesText(pkg.shortDescription, searchValue);

      const matchCategory = selectedCategory === 'All' || categoryValue.toLowerCase() === normalizedCategory;
      const matchDestination = selectedDestination === 'All' ||
        destinationValue.toLowerCase() === normalizedDestination ||
        locationValue.toLowerCase() === normalizedDestination ||
        destinationValue.toLowerCase().includes(normalizedDestination) ||
        locationValue.toLowerCase().includes(normalizedDestination);
      const matchBookingType = selectedBookingType === 'All' || bookingTypeValue.toLowerCase() === normalizedBookingType;

      let matchDuration = true;
      const days = getDurationDays(pkg.duration);
      if (selectedDuration === 'Short (1-4 Days)') matchDuration = days > 0 && days <= 4;
      if (selectedDuration === 'Medium (5-7 Days)') matchDuration = days >= 5 && days <= 7;
      if (selectedDuration === 'Long (8+ Days)') matchDuration = days >= 8;

      let matchAvailability = true;
      if (selectedAvailability === 'Featured') matchAvailability = Boolean(pkg.featured);
      if (selectedAvailability === 'Scheduled') matchAvailability = Array.isArray(pkg.departureDates) && pkg.departureDates.length > 0;
      if (selectedAvailability === 'Offers') matchAvailability = Boolean(pkg.offerPrice && pkg.offerPrice < pkg.price);

      return matchSearch && matchCategory && matchDestination && matchBookingType && matchDuration && matchAvailability;
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      if (sortOrder === 'price-asc') return (a.offerPrice || a.price || 0) - (b.offerPrice || b.price || 0);
      if (sortOrder === 'price-desc') return (b.offerPrice || b.price || 0) - (a.offerPrice || a.price || 0);
      if (sortOrder === 'duration-asc') return getDurationDays(a.duration) - getDurationDays(b.duration);
      if (sortOrder === 'duration-desc') return getDurationDays(b.duration) - getDurationDays(a.duration);
      // Default browsing order: Featured packages first, then admin Display Order — relies
      // on Array.prototype.sort's stability for the final tiebreak (equal-priority packages
      // keep their existing relative order, same as the previous no-op `return 0`).
      return comparePackagesForDisplay(a, b, 0, 0);
    });

    return sorted;
  }, [activePackages, searchQuery, selectedCategory, selectedDestination, selectedBookingType, selectedDuration, selectedAvailability, sortOrder]);

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];

    if (searchQuery.trim()) chips.push({ key: 'search', label: `Search: ${searchQuery.trim()}`, onRemove: () => setSearchQuery('') });
    if (selectedCategory !== 'All') chips.push({
      key: 'category',
      label: selectedCategory,
      onRemove: () => {
        setSelectedCategory('All');
        onResetPrefilledCategory?.();
      },
    });
    if (selectedDestination !== 'All') chips.push({
      key: 'destination',
      label: selectedDestination,
      onRemove: () => {
        setSelectedDestination('All');
        onClearSelectedLocation?.();
      },
    });
    if (selectedBookingType !== 'All') chips.push({ key: 'bookingType', label: selectedBookingType, onRemove: () => setSelectedBookingType('All') });
    if (selectedDuration !== 'All') chips.push({ key: 'duration', label: selectedDuration, onRemove: () => setSelectedDuration('All') });
    if (selectedAvailability !== 'All') chips.push({ key: 'availability', label: selectedAvailability, onRemove: () => setSelectedAvailability('All') });

    return chips;
  }, [searchQuery, selectedCategory, selectedDestination, selectedBookingType, selectedDuration, selectedAvailability, onResetPrefilledCategory, onClearSelectedLocation]);

  const hasActiveFilters = activeFilterChips.length > 0 || sortOrder !== 'default';
  const whatsappPhone = sanitizeWhatsAppPhone(websiteCMS?.footerPhone) || sanitizeWhatsAppPhone(DEFAULT_WEBSITE_CMS.footerPhone);

  const getPackageWhatsAppUrl = (pkg: TravelPackage) => {
    const message = `Hello,\nI am interested in the ${pkg.title} package.\nPlease send complete details.`;
    return `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`;
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedDestination('All');
    setSelectedBookingType('All');
    setSelectedDuration('All');
    setSelectedAvailability('All');
    setSortOrder('default');
    onResetPrefilledCategory?.();
    onClearSelectedLocation?.();
  };

  const handleSavePackage = async (pkg: TravelPackage) => {
    if (!onToggleWishlist) {
      setSaveNotice({ type: 'error', message: 'Wishlist is unavailable right now.' });
      return;
    }

    setSavingPackageId(pkg.id);
    setSaveNotice(null);

    const isAlreadySaved = wishlistPackageIds.includes(String(pkg.id ?? ''));

    try {
      await onToggleWishlist(pkg);
      setSaveNotice({
        type: 'success',
        message: isAlreadySaved ? 'Removed from Wishlist' : 'Package added to Wishlist ❤️',
      });
      onPackageSaved?.();
    } catch (error: any) {
      console.error('Error updating wishlist:', error);
      setSaveNotice({
        type: 'error',
        message: `We couldn’t update your wishlist right now. ${error.message || ''}`.trim(),
      });
    } finally {
      setSavingPackageId(null);
    }
  };

  return (
    <div id="packages-view" className="animate-fade-in overflow-hidden bg-[#fffaf1]">
      <section className="relative overflow-hidden bg-stone-950 px-4 pb-28 pt-36 text-white sm:px-6 sm:pt-40 lg:px-8">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2200&q=85")' }}
        />
        <div className="absolute inset-0 bg-linear-to-r from-stone-950/94 via-stone-950/74 to-stone-950/38" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-linear-to-t from-[#fffaf1] via-[#fffaf1]/45 to-transparent" />

        <div className="relative mx-auto grid min-h-[340px] max-w-[1320px] items-center gap-10 lg:grid-cols-[1fr_360px]">
          <div className="max-w-4xl">
            <div className="mb-5 flex items-center gap-3 text-[12px] font-bold uppercase tracking-[0.16em] text-white/75">
              <a href="/" onClick={(event) => { event.preventDefault(); onNavigate('home'); }} className="cursor-pointer transition hover:text-[#4DA528]">
                Home
              </a>
              <span className="h-px w-8 bg-white/45" />
              <span className="text-[#4DA528]">Tour Packages</span>
            </div>
            <span className="font-serif text-[30px] italic leading-none text-[#4DA528] sm:text-[42px]">
              Curated journeys
            </span>
            <h1 className="mt-4 text-[42px] font-extrabold leading-[0.98] tracking-tight text-white sm:text-[60px] lg:text-[84px]">
              Find your perfect escape
            </h1>
            <p className="mt-6 max-w-2xl text-[16px] leading-8 text-white/82 sm:text-[18px]">
              Browse live Pravaah packages with instant filters, premium itineraries, and seamless booking guidance.
            </p>
          </div>

          <div className="hidden rounded-[22px] border border-white/15 bg-white/10 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.28)] backdrop-blur-md lg:block">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4DA528] text-white">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/60">Live Catalog</p>
                <p className="text-2xl font-extrabold text-white">{activePackages.length}</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-[14px] bg-white/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/55">Featured</p>
                <p className="mt-1 text-xl font-extrabold">{activePackages.filter((pkg) => pkg.featured).length}</p>
              </div>
              <div className="rounded-[14px] bg-white/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/55">Matched</p>
                <p className="mt-1 text-xl font-extrabold">{filteredPackages.length}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1320px] space-y-8 px-4 pb-20 sm:px-6 lg:px-8">
        <section className="-mt-20 rounded-[20px] border border-stone-200 bg-white p-4 shadow-[0_24px_70px_rgba(18,38,32,0.16)] sm:p-6" id="filter-panel">
          <div className="mb-5 flex flex-col gap-3 border-b border-stone-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#0f766e]">
                <Filter className="h-3.5 w-3.5" />
                Smart Search
              </div>
              <p className="mt-1 text-xs text-stone-500">
                {filteredPackages.length} of {activePackages.length} active packages match your preferences.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-stone-200 bg-[#fffaf1] px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.15em] text-stone-700 transition hover:-translate-y-0.5 hover:border-[#4DA528] hover:text-[#4DA528]"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reset
                </button>
              )}
              <span className="inline-flex items-center gap-2 rounded-full bg-[#4DA528]/10 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4DA528]">
                <Sparkles className="h-3.5 w-3.5" />
                Instant Filters
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0f766e]" />
              <input
                type="text"
                placeholder="Search packages, places, travel styles..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="min-h-14 w-full rounded-[14px] border border-stone-200 bg-[#fffaf1] py-4 pl-11 pr-4 text-sm font-semibold text-stone-900 transition-all focus:border-[#4DA528] focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4DA528]/20"
              />
            </div>

            <select
              value={selectedDestination}
              onChange={(event) => {
                setSelectedDestination(event.target.value);
                if (event.target.value === 'All') onClearSelectedLocation?.();
              }}
              className="min-h-14 w-full cursor-pointer rounded-[14px] border border-stone-200 bg-[#fffaf1] px-4 py-4 text-sm font-semibold text-stone-800 transition-all focus:border-[#4DA528] focus:bg-white focus:outline-none"
            >
              <option value="All">All Destinations</option>
              {destinationOptions.map((destination) => (
                <option key={destination} value={destination}>{destination}</option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(event) => {
                setSelectedCategory(event.target.value);
                if (event.target.value === 'All') onResetPrefilledCategory?.();
              }}
              className="min-h-14 w-full cursor-pointer rounded-[14px] border border-stone-200 bg-[#fffaf1] px-4 py-4 text-sm font-semibold text-stone-800 transition-all focus:border-[#4DA528] focus:bg-white focus:outline-none"
            >
              <option value="All">All Categories</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={selectedDuration}
              onChange={(event) => setSelectedDuration(event.target.value)}
              className="min-h-14 w-full cursor-pointer rounded-[14px] border border-stone-200 bg-[#fffaf1] px-4 py-4 text-sm font-semibold text-stone-800 transition-all focus:border-[#4DA528] focus:bg-white focus:outline-none"
            >
              <option value="All">Any Duration</option>
              <option value="Short (1-4 Days)">1-4 Days</option>
              <option value="Medium (5-7 Days)">5-7 Days</option>
              <option value="Long (8+ Days)">8+ Days</option>
            </select>

            <select
              value={selectedAvailability}
              onChange={(event) => setSelectedAvailability(event.target.value)}
              className="min-h-14 w-full cursor-pointer rounded-[14px] border border-stone-200 bg-[#fffaf1] px-4 py-4 text-sm font-semibold text-stone-800 transition-all focus:border-[#4DA528] focus:bg-white focus:outline-none"
            >
              <option value="All">Availability</option>
              <option value="Featured">Featured</option>
              <option value="Scheduled">Scheduled Dates</option>
              <option value="Offers">Active Offers</option>
            </select>

            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              className="min-h-14 w-full cursor-pointer rounded-[14px] border border-stone-200 bg-[#fffaf1] px-4 py-4 text-sm font-semibold text-stone-800 transition-all focus:border-[#4DA528] focus:bg-white focus:outline-none"
            >
              <option value="default">Recommended</option>
              <option value="newest">Newest</option>
              <option value="price-asc">Price Low</option>
              <option value="price-desc">Price High</option>
              <option value="duration-asc">Duration Low</option>
              <option value="duration-desc">Duration High</option>
            </select>
          </div>
        </section>

        {saveNotice && (
          <div className={`rounded-[14px] border px-4 py-3 text-sm font-semibold ${saveNotice.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
            {saveNotice.message}
          </div>
        )}

        <div className="flex flex-col gap-3 rounded-[18px] border border-stone-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4DA528]/10 text-[#4DA528]">
              <Compass className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-extrabold text-stone-950">
                Showing {filteredPackages.length} {filteredPackages.length === 1 ? 'package' : 'packages'}
              </p>
              <p className="text-xs text-stone-500">Filters update automatically as you choose.</p>
            </div>
          </div>

          {activeFilterChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {activeFilterChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.onRemove}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-[#fffaf1] px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:-translate-y-0.5 hover:border-[#4DA528] hover:text-[#4DA528]"
                >
                  <span>{chip.label}</span>
                  <X className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <SkeletonPackage key={idx} />
            ))}
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-stone-300 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#4DA528]/10 text-[#4DA528]">
              <Search className="h-7 w-7" />
            </div>
            <h4 className="mt-5 text-3xl font-extrabold text-stone-950">No packages found</h4>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-stone-500">
              Try clearing a filter, choosing a broader destination, or searching by a nearby region or travel style.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="mt-6 inline-flex items-center gap-2 rounded-[5px] bg-[#4DA528] px-6 py-3 text-xs font-extrabold uppercase tracking-wider text-white transition hover:-translate-y-0.5 hover:bg-[#FF970D]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3" id="packages-grid">
            {filteredPackages.map((pkg) => {
              const isSaved = wishlistPackageIds.includes(String(pkg.id ?? ''));
              const hasOffer = Boolean(pkg.offerPrice && pkg.offerPrice < pkg.price);
              const displayPrice = hasOffer ? pkg.offerPrice || pkg.price : pkg.price;
              const rating = getPackageRating(pkg);
              const reviewCount = getPackageReviewCount(pkg);
              const packageImage = String(pkg.imageUrl || pkg.packageBannerUrl || '').trim();

              return (
                <article
                  key={pkg.id}
                  className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-stone-200 bg-white shadow-[0_14px_38px_rgba(18,38,32,0.08)] transition duration-300 hover:-translate-y-2 hover:shadow-[0_28px_70px_rgba(18,38,32,0.16)]"
                >
                  <div className="relative aspect-[1.2/1] overflow-hidden bg-stone-100">
                    {packageImage ? (
                      <TravelMedia
                        src={packageImage}
                        alt={pkg.title}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                        disableFallback
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#f8f7f4] px-5 text-center text-xs font-semibold text-stone-400">
                        Package image not uploaded
                      </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-stone-950/65 via-stone-950/5 to-transparent" />
                    <div className="absolute left-4 right-4 top-4 z-20 flex items-start justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-[#4DA528] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white shadow-sm">
                          {pkg.category}
                        </span>
                        {hasOffer && (
                          <span className="rounded-full bg-white/95 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#FF970D] shadow-sm">
                            Offer
                          </span>
                        )}
                      </div>
                      {isAdminLoggedIn && onDeletePackage && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDeletePackage(pkg.id);
                          }}
                          className="cursor-pointer rounded-full bg-red-600 p-2 text-white shadow-md transition hover:scale-105 hover:bg-red-700"
                          title="Delete Package"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 z-20 flex items-end justify-between gap-3">
                      <div className="min-w-0 rounded-[12px] bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
                        <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-stone-500">
                          <MapPin className="h-3.5 w-3.5 text-[#FF970D]" />
                          <span className="line-clamp-1">{pkg.destination}</span>
                        </p>
                      </div>
                      <div className="rounded-[12px] bg-white px-4 py-2 text-right shadow-lg">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">From</p>
                        <p className="text-lg font-extrabold text-[#4DA528]">{formatPrice(displayPrice || 0)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between space-y-5 p-6">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.15em] text-stone-500">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-[#f97350]" />
                          <span>{pkg.duration}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-[#0f766e]" />
                          <span>{pkg.location || 'Flexible'}</span>
                        </span>
                      </div>

                      <h3 className="line-clamp-2 text-[22px] font-extrabold leading-tight text-stone-950 transition group-hover:text-[#4DA528]">
                        {pkg.title}
                      </h3>

                      {rating ? (
                        <div className="flex items-center gap-2 text-[#FF970D]">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, index) => (
                              <Star key={index} className={`h-4 w-4 ${index < Math.round(rating) ? 'fill-current' : 'text-stone-200'}`} />
                            ))}
                          </div>
                          <span className="text-[13px] font-semibold text-stone-500">
                            {rating.toFixed(1)}{reviewCount ? ` (${reviewCount})` : ''}
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#fffaf1] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#4DA528]" />
                          Verified itinerary
                        </div>
                      )}

                      <p className="line-clamp-3 text-sm leading-7 text-stone-600">
                        {pkg.shortDescription}
                      </p>
                    </div>

                    <div className="space-y-4 border-t border-stone-100 pt-5">
                      <div className="flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Camera className="h-3.5 w-3.5 text-[#4DA528]" />
                          Gallery ready
                        </span>
                        {pkg.departureDates?.length ? (
                          <span>{pkg.departureDates.length} dates</span>
                        ) : (
                          <span>Flexible dates</span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleSavePackage(pkg);
                          }}
                          disabled={savingPackageId === pkg.id}
                          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-[5px] border border-[#4DA528]/20 bg-[#fffaf1] text-[#4DA528] transition hover:-translate-y-0.5 hover:bg-[#f3f7eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DA528]/25 disabled:cursor-wait disabled:opacity-70"
                          aria-label={isSaved ? 'Remove package from wishlist' : 'Add package to wishlist'}
                          aria-busy={savingPackageId === pkg.id}
                          title={isSaved ? 'Remove from Wishlist' : 'Add to Wishlist'}
                        >
                          <Heart className={`h-4 w-4 transition hover:scale-110 ${isSaved ? 'fill-rose-600 text-rose-600' : ''}`} />
                        </button>
                        <a
                          href={getPackageWhatsAppUrl(pkg)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-[5px] border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/25"
                          aria-label={`Ask on WhatsApp about ${pkg.title}`}
                          title="WhatsApp Package"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                        <a
                          href={`/packages/${getPackageRouteSegment(pkg)}`}
                          onClick={(event) => { event.preventDefault(); onNavigate('package-detail', getPackageRouteSegment(pkg)); }}
                          className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[5px] border border-stone-200 bg-white px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-stone-800 transition hover:-translate-y-0.5 hover:border-[#4DA528] hover:text-[#4DA528]"
                        >
                          View Details
                        </a>
                        <a
                          href={`/packages/${getPackageRouteSegment(pkg)}`}
                          onClick={(event) => { event.preventDefault(); onNavigate('package-detail', getPackageRouteSegment(pkg)); }}
                          className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[5px] bg-[#4DA528] px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-[#FF970D]"
                        >
                          <span>Book Now</span>
                          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
