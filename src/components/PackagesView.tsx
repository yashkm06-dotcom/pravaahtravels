import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Calendar, MapPin, ArrowRight, SlidersHorizontal, RefreshCw, Trash2, Star, Camera, Heart } from 'lucide-react';
import { TravelPackage, DestinationCategory, formatPrice } from '../types';
import SkeletonLoader from './SkeletonLoader';
import { getTravelImage, handleTravelImageError } from '../utils/imageFallback';

interface PackagesViewProps {
  packages: TravelPackage[];
  onNavigate: (view: string, packageId?: string | null) => void;
  loading: boolean;
  isAdminLoggedIn?: boolean;
  onDeletePackage?: (id: string) => void;
  prefilledCategory?: string;
  onResetPrefilledCategory?: () => void;
}

export default function PackagesView({
  packages,
  onNavigate,
  loading,
  isAdminLoggedIn = false,
  onDeletePackage,
  prefilledCategory = 'All',
  onResetPrefilledCategory,
}: PackagesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDuration, setSelectedDuration] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<number>(150000);

  // Sync state if prefilledCategory changes
  useEffect(() => {
    if (prefilledCategory) {
      setSelectedCategory(prefilledCategory);
    }
  }, [prefilledCategory]);

  // Extract categories dynamically
  const categories = useMemo(() => {
    const list = new Set(packages.map((p) => p.category));
    return ['All', ...Array.from(list)];
  }, [packages]);

  // Durations simple categorization
  const durationOptions = ['All', 'Short (1-4 Days)', 'Medium (5-7 Days)', 'Long (8+ Days)'];

  // Apply filters
  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      // 1. Check status is active
      if (!pkg.active) return false;

      // 2. Search query check
      const matchSearch = 
        pkg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());

      // 3. Category filter
      const matchCategory = selectedCategory === 'All' || pkg.category === selectedCategory;

      // 4. Price filter
      const matchPrice = pkg.price ? pkg.price <= maxPrice : true;

      // 5. Duration filter
      let matchDuration = true;
      if (selectedDuration !== 'All') {
        const daysMatch = pkg.duration.match(/(\d+)\s*Day/);
        if (daysMatch) {
          const days = parseInt(daysMatch[1]);
          if (selectedDuration === 'Short (1-4 Days)') matchDuration = days <= 4;
          else if (selectedDuration === 'Medium (5-7 Days)') matchDuration = days >= 5 && days <= 7;
          else if (selectedDuration === 'Long (8+ Days)') matchDuration = days >= 8;
        }
      }

      return matchSearch && matchCategory && matchPrice && matchDuration;
    });
  }, [packages, searchQuery, selectedCategory, maxPrice, selectedDuration]);

  const handleReset = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedDuration('All');
    setMaxPrice(150000);
    if (onResetPrefilledCategory) {
      onResetPrefilledCategory();
    }
  };

  return (
    <div id="packages-view" className="animate-fade-in overflow-hidden bg-[#fffaf1]">
      <section className="relative min-h-[430px] bg-stone-950 px-4 pb-24 pt-36 text-white sm:px-6 sm:pt-40 lg:px-8">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2200&q=85")' }}
        />
        <div className="absolute inset-0 bg-linear-to-r from-stone-950/92 via-stone-950/72 to-stone-950/35" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-[#fffaf1] via-[#fffaf1]/45 to-transparent" />
        
        <div className="relative mx-auto flex min-h-[270px] max-w-7xl items-center">
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
            <h1 className="mt-4 text-[52px] font-extrabold leading-[0.98] tracking-tight text-white sm:text-[72px] lg:text-[88px]">
              Tour Package
            </h1>
            <p className="mt-6 max-w-2xl text-[16px] leading-8 text-white/82 sm:text-[18px]">
              Search, refine, and discover live Pravaah journeys with detailed itineraries, pricing, and enquiry flow.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">

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
              <span>Sorted by curated order</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            
            {/* Search Bar */}
            <div className="relative col-span-1 lg:col-span-2">
              <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0f766e]" />
              <input
                type="text"
                placeholder="Search by title, destination, keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-full min-h-14 w-full rounded-2xl border border-stone-200 bg-[#fffaf1] py-4 pl-12 pr-4 text-sm font-semibold text-stone-900 transition-all focus:border-[#0f766e] focus:bg-white focus:outline-none"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="min-h-14 w-full cursor-pointer rounded-2xl border border-stone-200 bg-[#fffaf1] px-4 py-4 text-sm font-semibold text-stone-800 transition-all focus:border-[#0f766e] focus:bg-white focus:outline-none"
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

            {/* Duration Filter */}
            <div>
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value)}
                className="min-h-14 w-full cursor-pointer rounded-2xl border border-stone-200 bg-[#fffaf1] px-4 py-4 text-sm font-semibold text-stone-800 transition-all focus:border-[#0f766e] focus:bg-white focus:outline-none"
              >
                <option value="All">All Durations</option>
                <option value="Short (1-4 Days)">Short (1-4 Days)</option>
                <option value="Medium (5-7 Days)">Medium (5-7 Days)</option>
                <option value="Long (8+ Days)">Long (8+ Days)</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            {/* Price Range Slider */}
            <div className="flex w-full flex-col gap-2 rounded-2xl bg-[#fffaf1] p-4 ring-1 ring-stone-200 sm:w-auto sm:min-w-[420px]">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-500">Max Price</span>
                <span className="text-sm font-extrabold text-[#0f766e]">{formatPrice(maxPrice)}</span>
              </div>
              <input
                type="range"
                min="5000"
                max="150000"
                step="5000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                className="w-full cursor-pointer accent-[#0f766e]"
              />
            </div>

            {/* Reset Filters */}
            <button
              onClick={handleReset}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.15em] text-stone-700 transition hover:-translate-y-0.5 hover:border-[#0f766e] hover:text-[#0f766e]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>

        {/* Catalog Grid */}
        {loading ? (
          <SkeletonLoader />
        ) : filteredPackages.length === 0 ? (
          <div className="space-y-5 rounded-[2rem] border border-dashed border-stone-300 bg-white p-12 text-center shadow-sm">
            <SlidersHorizontal className="mx-auto h-12 w-12 text-stone-300" />
            <h4 className="text-2xl font-semibold text-stone-950">No packages found</h4>
            <p className="mx-auto max-w-md text-sm leading-7 text-stone-500">
              No active packages match your current search queries or filters. Try adjusting the parameters or reset the panel.
            </p>
            <button
              onClick={handleReset}
              className="rounded-full bg-[#0f766e] px-6 py-3 text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-[#0d5f59]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3" id="packages-grid">
            {filteredPackages.map((pkg) => (
              <article 
                key={pkg.id} 
                className="tour-listing group flex overflow-hidden rounded-[12px] border border-stone-200 bg-white shadow-[0_14px_38px_rgba(18,38,32,0.08)] transition duration-300 hover:-translate-y-2 hover:shadow-[0_28px_70px_rgba(18,38,32,0.16)] flex-col"
              >
                {/* Package Image Banner */}
                <div className="tour-listing-image relative aspect-[1.22/1] overflow-hidden bg-stone-100">
                  <img 
                    src={getTravelImage(pkg.imageUrl)} 
                    alt={pkg.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
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
                      From <span className="text-base font-extrabold text-[#0f766e]">{formatPrice(pkg.price)}</span>
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
                  <div className="flex items-center justify-between gap-3 border-t border-stone-100 pt-5">
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-400">
                      Details & Itinerary
                    </div>
                    <button
                      onClick={() => onNavigate('package-detail', pkg.id)}
                      className="btn-main inline-flex cursor-pointer items-center gap-2 rounded-[5px] bg-[#4DA528] px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-[#FF970D]"
                    >
                      <span>Details</span>
                      <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </button>
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
