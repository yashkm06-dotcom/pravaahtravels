import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Calendar, MapPin, ArrowRight, SlidersHorizontal, RefreshCw, Trash2, Star, Camera, Heart, X } from 'lucide-react';
import { TravelPackage, formatPrice, PACKAGE_LOCATIONS } from '../types';
import { SkeletonPackage } from './SkeletonLoader';
import { getTravelImage, handleTravelImageError } from '../utils/imageFallback';
import { auth, addDoc, collection, db, getDocs, query, where } from '../lib/firebase';

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
  onToggleWishlist?: (pkg: TravelPackage) => void;
}

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
}: PackagesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedBookingType, setSelectedBookingType] = useState<string>('All');
  const [selectedDuration, setSelectedDuration] = useState<string>('All');
  const [selectedGuests, setSelectedGuests] = useState<number>(2);
  const [appliedFilters, setAppliedFilters] = useState({
    searchQuery: '',
    category: 'All',
    location: 'All',
    bookingType: 'All',
    duration: 'All',
    guests: 2,
  });
  const [sortOrder, setSortOrder] = useState<string>('default');
  const [maxPrice, setMaxPrice] = useState<number>(150000);
  const [saveNotice, setSaveNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [savingPackageId, setSavingPackageId] = useState<string | null>(null);

  // Sync state if prefilledCategory changes
  useEffect(() => {
    if (prefilledCategory) {
      setSelectedCategory(prefilledCategory);
    }
  }, [prefilledCategory]);

  useEffect(() => {
    if (selectedLocationFilter && selectedLocationFilter !== 'All') {
      setSelectedLocation(selectedLocationFilter);
    }
  }, [selectedLocationFilter]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSearch = params.get('search') || '';
    const urlCategory = params.get('category') || 'All';
    const urlLocation = params.get('location') || 'All';
    const urlBookingType = params.get('type') || 'All';
    const urlDuration = params.get('duration') || 'All';
    const urlGuests = params.get('guests') || '2';
    const urlSort = params.get('sort') || 'default';

    const hasAnyUrlFilter = [urlSearch, urlCategory, urlLocation, urlBookingType, urlDuration, urlGuests, urlSort].some((value) => value && value !== 'All' && value !== '2' && value !== 'default');
    if (!hasAnyUrlFilter) return;

    setSearchQuery(urlSearch);
    setSelectedCategory(urlCategory);
    setSelectedLocation(urlLocation);
    setSelectedBookingType(urlBookingType);
    setSelectedDuration(urlDuration);
    setSelectedGuests(Number(urlGuests) || 2);
    setAppliedFilters({
      searchQuery: urlSearch,
      category: urlCategory,
      location: urlLocation,
      bookingType: urlBookingType,
      duration: urlDuration,
      guests: Number(urlGuests) || 2,
    });
    setSortOrder(urlSort);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (appliedFilters.searchQuery) params.set('search', appliedFilters.searchQuery);
    if (appliedFilters.category && appliedFilters.category !== 'All') params.set('category', appliedFilters.category);
    if (appliedFilters.location && appliedFilters.location !== 'All') params.set('location', appliedFilters.location);
    if (appliedFilters.bookingType && appliedFilters.bookingType !== 'All') params.set('type', appliedFilters.bookingType);
    if (appliedFilters.duration && appliedFilters.duration !== 'All') params.set('duration', appliedFilters.duration);
    if (appliedFilters.guests && appliedFilters.guests !== 2) params.set('guests', String(appliedFilters.guests));
    if (sortOrder && sortOrder !== 'default') params.set('sort', sortOrder);

    const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState({}, '', nextUrl);
  }, [appliedFilters, sortOrder]);

  // Apply filters
  const filteredPackages = useMemo(() => {
    const applyLocation = selectedLocationFilter === 'All' ? appliedFilters.location : selectedLocationFilter;

    const filtered = packages.filter((pkg) => {
      if (!pkg.active) return false;

      const normalizedLocation = pkg.location || 'Uttarakhand';
      const searchValue = appliedFilters.searchQuery.trim().toLowerCase();
      const matchSearch = !searchValue ||
        pkg.title.toLowerCase().includes(searchValue) ||
        pkg.destination.toLowerCase().includes(searchValue) ||
        pkg.shortDescription.toLowerCase().includes(searchValue);

      const matchCategory = appliedFilters.category === 'All' || pkg.category === appliedFilters.category;
      const matchLocation = applyLocation === 'All' || normalizedLocation === applyLocation;
      const matchBookingType = appliedFilters.bookingType === 'All' || pkg.bookingType === appliedFilters.bookingType;
      const matchPrice = pkg.price ? pkg.price <= maxPrice : true;

      let matchDuration = true;
      if (appliedFilters.duration !== 'All') {
        const daysMatch = pkg.duration.match(/(\d+)\s*Day/);
        if (daysMatch) {
          const days = parseInt(daysMatch[1]);
          if (appliedFilters.duration === 'Short (1-4 Days)') matchDuration = days <= 4;
          else if (appliedFilters.duration === 'Medium (5-7 Days)') matchDuration = days >= 5 && days <= 7;
          else if (appliedFilters.duration === 'Long (8+ Days)') matchDuration = days >= 8;
        }
      }

      const effectiveGuests = appliedFilters.guests || 1;
      const matchGuests = !pkg.maxGuests || pkg.maxGuests >= effectiveGuests;

      return matchSearch && matchCategory && matchLocation && matchBookingType && matchPrice && matchDuration && matchGuests;
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortOrder === 'price-asc') {
        return (a.price || 0) - (b.price || 0);
      }
      if (sortOrder === 'price-desc') {
        return (b.price || 0) - (a.price || 0);
      }
      if (sortOrder === 'duration-asc') {
        return (Number(a.duration.match(/(\d+)\s*Day/)?.[1]) || 0) - (Number(b.duration.match(/(\d+)\s*Day/)?.[1]) || 0);
      }
      if (sortOrder === 'duration-desc') {
        return (Number(b.duration.match(/(\d+)\s*Day/)?.[1]) || 0) - (Number(a.duration.match(/(\d+)\s*Day/)?.[1]) || 0);
      }
      return 0;
    });

    return sorted;
  }, [packages, appliedFilters, selectedLocationFilter, maxPrice, sortOrder]);

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; type: string }> = [];

    if (appliedFilters.searchQuery.trim()) {
      chips.push({ key: 'search', label: `Search: ${appliedFilters.searchQuery}`, type: 'search' });
    }
    if (appliedFilters.category !== 'All') {
      chips.push({ key: 'category', label: appliedFilters.category, type: 'category' });
    }
    if (appliedFilters.location !== 'All') {
      chips.push({ key: 'location', label: appliedFilters.location, type: 'location' });
    }
    if (appliedFilters.bookingType !== 'All') {
      chips.push({ key: 'bookingType', label: appliedFilters.bookingType, type: 'bookingType' });
    }
    if (appliedFilters.duration !== 'All') {
      chips.push({ key: 'duration', label: appliedFilters.duration, type: 'duration' });
    }
    if (appliedFilters.guests !== 2) {
      chips.push({ key: 'guests', label: `${appliedFilters.guests} Guests`, type: 'guests' });
    }

    return chips;
  }, [appliedFilters]);

  const handleApplyFilters = () => {
    setAppliedFilters({
      searchQuery,
      category: selectedCategory,
      location: selectedLocation,
      bookingType: selectedBookingType,
      duration: selectedDuration,
      guests: selectedGuests,
    });
  };

  const handleRemoveFilter = (type: string) => {
    if (type === 'search') {
      setSearchQuery('');
      setAppliedFilters((prev) => ({ ...prev, searchQuery: '' }));
      return;
    }

    if (type === 'category') {
      setSelectedCategory('All');
      setAppliedFilters((prev) => ({ ...prev, category: 'All' }));
      if (onResetPrefilledCategory) {
        onResetPrefilledCategory();
      }
      return;
    }

    if (type === 'location') {
      setSelectedLocation('All');
      setAppliedFilters((prev) => ({ ...prev, location: 'All' }));
      if (onClearSelectedLocation) {
        onClearSelectedLocation();
      }
      return;
    }

    if (type === 'bookingType') {
      setSelectedBookingType('All');
      setAppliedFilters((prev) => ({ ...prev, bookingType: 'All' }));
      return;
    }

    if (type === 'duration') {
      setSelectedDuration('All');
      setAppliedFilters((prev) => ({ ...prev, duration: 'All' }));
      return;
    }

    if (type === 'guests') {
      setSelectedGuests(2);
      setAppliedFilters((prev) => ({ ...prev, guests: 2 }));
    }
  };

  const handleClearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedLocation('All');
    setSelectedBookingType('All');
    setSelectedDuration('All');
    setSelectedGuests(2);
    setAppliedFilters({
      searchQuery: '',
      category: 'All',
      location: 'All',
      bookingType: 'All',
      duration: 'All',
      guests: 2,
    });
    setSortOrder('default');
    setMaxPrice(150000);
    if (onClearSelectedLocation) {
      onClearSelectedLocation();
    }
    if (onResetPrefilledCategory) {
      onResetPrefilledCategory();
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedLocation('All');
    setSelectedBookingType('All');
    setSelectedDuration('All');
    setSelectedGuests(2);
    setAppliedFilters({
      searchQuery: '',
      category: 'All',
      location: 'All',
      bookingType: 'All',
      duration: 'All',
      guests: 2,
    });
    setSortOrder('default');
    setMaxPrice(150000);
    if (onResetPrefilledCategory) {
      onResetPrefilledCategory();
    }
  };

  const handleSavePackage = async (pkg: TravelPackage) => {
    if (!onToggleWishlist) {
      setSaveNotice({ type: 'error', message: 'Wishlist is unavailable right now.' });
      return;
    }

    setSavingPackageId(pkg.id);
    setSaveNotice(null);

    try {
      onToggleWishlist(pkg);
      setSaveNotice({
        type: 'success',
        message: wishlistPackageIds.includes(pkg.id) ? 'Removed from Wishlist' : 'Package added to Wishlist ❤️',
      });
      if (onPackageSaved) {
        onPackageSaved();
      }
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
      <section className="relative overflow-hidden bg-stone-950 px-4 pb-24 pt-36 text-white sm:px-6 sm:pt-40 lg:px-8">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2200&q=85")' }}
        />
        <div className="absolute inset-0 bg-linear-to-r from-stone-950/92 via-stone-950/72 to-stone-950/35" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-[#fffaf1] via-[#fffaf1]/45 to-transparent" />
        
        <div className="relative mx-auto flex min-h-[270px] max-w-[1320px] items-center">
          <div className="max-w-3xl">
            <div className="mb-5 flex items-center gap-3 text-[12px] font-bold uppercase tracking-[0.16em] text-white/75">
              <button type="button" onClick={() => onNavigate('home')} className="cursor-pointer transition hover:text-[#4DA528]">
                Home
              </button>
              <span className="h-px w-8 bg-white/45" />
              <span className="text-[#4DA528]">Tour Package</span>
            </div>
            <span className="font-serif text-[30px] italic leading-none text-[#4DA528] sm:text-[42px]">
              Explore the world
            </span>
            <h1 className="mt-4 text-[40px] font-extrabold leading-[0.98] tracking-tight text-white sm:text-[56px] lg:text-[72px] xl:text-[88px]">
              Tour Package
            </h1>
            <p className="mt-6 max-w-2xl text-[16px] leading-8 text-white/82 sm:text-[18px]">
              Search, refine, and discover live Pravaah journeys with detailed itineraries, pricing, and enquiry flow.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1320px] space-y-10 px-4 py-12 sm:px-6 lg:px-8">

        {/* Filter & Search Bar */}
        <div className="-mt-24 rounded-[14px] border border-stone-200 bg-white p-4 shadow-[0_24px_70px_rgba(18,38,32,0.18)] sm:p-6" id="filter-panel">
          <div className="mb-5 flex flex-col gap-3 border-b border-stone-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#0f766e]">
                <Filter className="h-3.5 w-3.5" />
                Smart Filters
              </div>
              <p className="mt-1 text-xs text-stone-500">
                Showing {filteredPackages.length} of {packages.filter((pkg) => pkg.active).length} active packages.
              </p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#fffaf1] px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-stone-500 ring-1 ring-stone-200">
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#f97350]" />
              <span>{sortOrder === 'default' ? 'Sorted by curated order' : 'Sorted by selected order'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            
            {/* Search Bar */}
            <div className="relative col-span-1 lg:col-span-2">
              <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0f766e]" />
              <input
                type="text"
                placeholder="Search by title, destination, keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-full min-h-14 w-full rounded-[12px] border border-stone-200 bg-[#fffaf1] py-4 pl-12 pr-4 text-sm font-semibold text-stone-900 transition-all focus:border-[#4DA528] focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4DA528]/20"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="min-h-14 w-full cursor-pointer rounded-[12px] border border-stone-200 bg-[#fffaf1] px-4 py-4 text-sm font-semibold text-stone-800 transition-all focus:border-[#4DA528] focus:bg-white focus:outline-none"
              >
                <option value="All">All Categories</option>
                <option value="Pilgrimage">Pilgrimage</option>
                <option value="Treks">Treks</option>
                <option value="Adventure">Adventure</option>
                <option value="Himachal">Himachal</option>
                <option value="Ladakh">Ladakh</option>
                <option value="Uttarakhand">Uttarakhand</option>
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="min-h-14 w-full cursor-pointer rounded-[12px] border border-stone-200 bg-[#fffaf1] px-4 py-4 text-sm font-semibold text-stone-800 transition-all focus:border-[#4DA528] focus:bg-white focus:outline-none"
              >
                <option value="All">All Locations</option>
                {PACKAGE_LOCATIONS.map((location) => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            {/* Booking Type Filter */}
            <div>
              <select
                value={selectedBookingType}
                onChange={(e) => setSelectedBookingType(e.target.value)}
                className="min-h-14 w-full cursor-pointer rounded-[12px] border border-stone-200 bg-[#fffaf1] px-4 py-4 text-sm font-semibold text-stone-800 transition-all focus:border-[#4DA528] focus:bg-white focus:outline-none"
              >
                <option value="All">All Booking Types</option>
                <option value="Bespoke Luxury">Bespoke Luxury</option>
                <option value="Family Comfort">Family Comfort</option>
                <option value="Sacred Slow Travel">Sacred Slow Travel</option>
                <option value="Adventure Led">Adventure Led</option>
              </select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value)}
                className="min-h-14 w-full cursor-pointer rounded-[12px] border border-stone-200 bg-[#fffaf1] px-4 py-4 text-sm font-semibold text-stone-800 transition-all focus:border-[#4DA528] focus:bg-white focus:outline-none"
              >
                <option value="All">All Durations</option>
                <option value="Short (1-4 Days)">Short (1-4 Days)</option>
                <option value="Medium (5-7 Days)">Medium (5-7 Days)</option>
                <option value="Long (8+ Days)">Long (8+ Days)</option>
              </select>
            </div>

            <div>
              <input
                type="number"
                min="1"
                value={selectedGuests}
                onChange={(e) => setSelectedGuests(Number(e.target.value) || 1)}
                className="min-h-14 w-full rounded-[12px] border border-stone-200 bg-[#fffaf1] px-4 py-4 text-sm font-semibold text-stone-800 transition-all focus:border-[#4DA528] focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4DA528]/20"
                placeholder="Guests"
              />
            </div>

            <div>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="min-h-14 w-full cursor-pointer rounded-[12px] border border-stone-200 bg-[#fffaf1] px-4 py-4 text-sm font-semibold text-stone-800 transition-all focus:border-[#4DA528] focus:bg-white focus:outline-none"
              >
                <option value="default">Default</option>
                <option value="newest">Newest</option>
                <option value="price-asc">Price Low → High</option>
                <option value="price-desc">Price High → Low</option>
                <option value="duration-asc">Duration Low → High</option>
                <option value="duration-desc">Duration High → Low</option>
              </select>
            </div>

            <button
              onClick={handleApplyFilters}
              className="inline-flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-[12px] bg-[#4DA528] px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.15em] text-white shadow-[0_12px_28px_rgba(77,165,40,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#FF970D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DA528]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffaf1] md:w-auto"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search</span>
            </button>
          </div>

          <div className="mt-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            {/* Price Range Slider */}
            <div className="flex w-full flex-col gap-2 rounded-[12px] bg-[#fffaf1] p-4 ring-1 ring-stone-200 sm:w-auto sm:min-w-[320px] lg:min-w-[420px]">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-500">Max Price</span>
                <span className="text-sm font-extrabold text-[#4DA528]">{formatPrice(maxPrice)}</span>
              </div>
              <input
                type="range"
                min="5000"
                max="150000"
                step="5000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                className="w-full cursor-pointer accent-[#4DA528]"
              />
            </div>

            {/* Reset Filters */}
            <button
              onClick={handleReset}
              className="inline-flex cursor-pointer items-center gap-2 rounded-[5px] border border-stone-200 bg-white px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.15em] text-stone-700 transition hover:-translate-y-0.5 hover:border-[#4DA528] hover:text-[#4DA528]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>

        {saveNotice && (
          <div className={`mb-6 rounded-[12px] border px-4 py-3 text-sm ${saveNotice.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
            {saveNotice.message}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-semibold text-stone-700">
            Showing {filteredPackages.length} {filteredPackages.length === 1 ? 'Package' : 'Packages'}
          </div>
          {activeFilterChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {activeFilterChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => handleRemoveFilter(chip.type)}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#4DA528] hover:text-[#4DA528]"
                >
                  <span>{chip.label}</span>
                  <X className="h-3.5 w-3.5" />
                </button>
              ))}
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="rounded-full border border-stone-200 bg-[#fffaf1] px-3 py-1.5 text-sm font-semibold text-stone-600 transition hover:border-[#4DA528] hover:text-[#4DA528]"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Catalog Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <SkeletonPackage key={idx} />
            ))}
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="space-y-5 rounded-[12px] border border-dashed border-stone-300 bg-white p-12 text-center shadow-sm">
            <SlidersHorizontal className="mx-auto h-12 w-12 text-stone-300" />
            <h4 className="text-2xl font-semibold text-stone-950">No packages match your search.</h4>
            <p className="mx-auto max-w-md text-sm leading-7 text-stone-500">
              No active packages match your current combination of filters. Try a broader search or clear the filters to browse everything again.
            </p>
            <button
              onClick={handleReset}
              className="rounded-[5px] bg-[#4DA528] px-6 py-3 text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-[#FF970D]"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3" id="packages-grid">
            {filteredPackages.map((pkg) => (
              <article 
                key={pkg.id} 
                className="tour-listing group flex h-full overflow-hidden rounded-[12px] border border-stone-200 bg-white shadow-[0_14px_38px_rgba(18,38,32,0.08)] transition duration-300 hover:-translate-y-2 hover:shadow-[0_28px_70px_rgba(18,38,32,0.16)] flex-col"
              >
                {/* Package Image Banner */}
                <div className="tour-listing-image relative aspect-[1.22/1] overflow-hidden bg-stone-100">
                  <img 
                    src={getTravelImage(pkg.imageUrl)} 
                    alt={pkg.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                    onError={handleTravelImageError}
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-stone-950/55 via-transparent to-transparent" />
                  <div className="badge-top flex-two absolute left-4 right-4 top-4 z-20 flex items-center justify-between gap-3">
                    <span className="feature rounded bg-[#4DA528] px-3 py-1 text-[12px] font-bold text-white shadow-sm">
                      Featured
                    </span>
                    <div className="badge-media flex-five flex items-center gap-2">
                      <span className="media inline-flex items-center gap-1 rounded bg-white/95 px-2.5 py-1 text-[12px] font-bold text-stone-800 shadow-sm">
                        <Camera className="h-3.5 w-3.5 text-[#4DA528]" />
                        5
                      </span>
                      <span className="media inline-flex items-center gap-1 rounded bg-white/95 px-2.5 py-1 text-[12px] font-bold text-stone-800 shadow-sm">
                        <Heart className="h-3.5 w-3.5 text-[#FF970D]" />
                        2
                      </span>
                    </div>
                  </div>
                  {isAdminLoggedIn && onDeletePackage && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePackage(pkg.id);
                      }}
                      className="absolute right-5 top-5 z-30 cursor-pointer rounded-full bg-red-600 p-2 text-white shadow-md transition hover:scale-105 hover:bg-red-700"
                      title="Delete Package"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {pkg.price && (
                    <div className="absolute bottom-5 right-5 rounded-[6px] bg-white px-4 py-2 text-xs font-semibold text-stone-600 shadow-lg">
                      From <span className="text-base font-extrabold text-[#4DA528]">{formatPrice(pkg.price)}</span>
                    </div>
                  )}
                </div>

                {/* Card Info Body */}
                <div className="tour-listing-content flex flex-1 flex-col justify-between space-y-5 p-6">
                  <div className="space-y-3">
                    <span className="tag-listing inline-flex rounded bg-[#FF970D]/12 px-3 py-1 text-[12px] font-bold text-[#D57400]">
                      {pkg.category}
                    </span>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.15em] text-stone-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#f97350]" />
                      <span>{pkg.duration}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-[#0f766e]" />
                        <span className="line-clamp-1">{pkg.destination}</span>
                      </span>
                    </div>
                    <h3 className="title-tour-list line-clamp-2 text-[22px] font-bold leading-tight text-stone-950 transition group-hover:text-[#4DA528]">
                      {pkg.title}
                    </h3>
                    <div className="review flex items-center gap-1 text-[#FF970D]">
                      {[...Array(5)].map((_, index) => (
                        <Star key={index} className="h-4 w-4 fill-current" />
                      ))}
                      <span className="ml-2 text-[13px] font-medium text-stone-500">(1 Review)</span>
                    </div>
                    <p className="line-clamp-3 text-sm leading-7 text-stone-600">
                      {pkg.shortDescription}
                    </p>
                  </div>

                  {/* Card Actions Bottom */}
                  <div className="flex flex-col gap-3 border-t border-stone-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-400">
                      Details & Itinerary
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWishlist?.(pkg);
                        }}
                        className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-[5px] border border-[#4DA528]/20 bg-[#fffaf1] text-[#4DA528] transition hover:-translate-y-0.5 hover:bg-[#f3f7eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DA528]/25"
                        aria-label={wishlistPackageIds.includes(pkg.id) ? 'Remove package from wishlist' : 'Add package to wishlist'}
                        title={wishlistPackageIds.includes(pkg.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      >
                        <Heart className={`h-4 w-4 transition hover:scale-110 ${wishlistPackageIds.includes(pkg.id) ? 'fill-rose-600 text-rose-600' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate('package-detail', pkg.id)}
                        className="btn-main inline-flex cursor-pointer items-center gap-2 rounded-[5px] bg-[#4DA528] px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-[#FF970D]"
                      >
                        <span>View Details</span>
                        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
