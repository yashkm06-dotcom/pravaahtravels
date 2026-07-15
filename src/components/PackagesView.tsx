import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Calendar, MapPin, ArrowRight, SlidersHorizontal, RefreshCw, Trash2 } from 'lucide-react';
import { TravelPackage, DestinationCategory, formatPrice } from '../types';
import SkeletonLoader from './SkeletonLoader';

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
    <div id="packages-view" className="animate-fade-in bg-[#f8f7f4] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Page Title Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold text-[#008080] tracking-[0.2em] uppercase">Curated Catalog</span>
          <h2 className="text-3xl sm:text-4xl font-serif font-normal text-[#333333] tracking-tight">
            Explore Handcrafted Packages
          </h2>
          <div className="w-16 h-0.5 bg-[#F4C430] mx-auto mt-3" />
          <p className="text-xs sm:text-sm text-stone-500 font-light">
            Search and filter through our bespoke travel experiences. Click any package to view day-wise itineraries, pricing breakdown, and make enquiries.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white border border-stone-200 rounded p-6 shadow-xs space-y-6" id="filter-panel">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            
            {/* Search Bar */}
            <div className="relative col-span-1 lg:col-span-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search by title, destination, keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#f8f7f4] border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] focus:bg-white transition-all text-stone-800 font-medium"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 bg-[#f8f7f4] border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] focus:bg-white transition-all text-stone-700 font-medium cursor-pointer"
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
                className="w-full px-4 py-3 bg-[#f8f7f4] border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] focus:bg-white transition-all text-stone-700 font-medium cursor-pointer"
              >
                <option value="All">All Durations</option>
                <option value="Short (1-4 Days)">Short (1-4 Days)</option>
                <option value="Medium (5-7 Days)">Medium (5-7 Days)</option>
                <option value="Long (8+ Days)">Long (8+ Days)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-stone-100 gap-4">
            {/* Price Range Slider */}
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <span className="text-[10px] font-bold text-[#333333] uppercase tracking-wider">Max Price:</span>
              <input
                type="range"
                min="5000"
                max="150000"
                step="5000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                className="accent-[#008080] cursor-pointer w-full sm:w-48"
              />
              <span className="text-xs font-bold text-[#008080]">{formatPrice(maxPrice)}</span>
            </div>

            {/* Reset Filters */}
            <button
              onClick={handleReset}
              className="text-[10px] font-bold text-[#333333] hover:text-[#008080] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer py-1.5 px-3 rounded hover:bg-stone-50 transition border border-stone-200"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>

        {/* Catalog Grid */}
        {loading ? (
          <SkeletonLoader />
        ) : filteredPackages.length === 0 ? (
          <div className="text-center py-20 bg-white border border-stone-200 rounded space-y-4 p-8">
            <SlidersHorizontal className="w-10 h-10 text-stone-300 mx-auto" />
            <h4 className="text-lg font-serif italic text-[#333333]">No Packages Found</h4>
            <p className="text-stone-400 text-xs max-w-md mx-auto font-light">
              No active packages match your current search queries or filters. Try adjusting the parameters or reset the panel.
            </p>
            <button
              onClick={handleReset}
              className="px-5 py-2 bg-[#008080] hover:bg-[#006666] text-white font-bold text-[10px] uppercase tracking-wider rounded transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" id="packages-grid">
            {filteredPackages.map((pkg) => (
              <div 
                key={pkg.id} 
                className="bg-white border border-stone-200 rounded overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col group"
              >
                {/* Package Image Banner */}
                <div className="relative h-60 overflow-hidden bg-stone-100">
                  <img 
                    src={pkg.imageUrl} 
                    alt={pkg.title}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4 bg-[#008080] text-white text-[10px] font-bold px-2.5 py-1 shadow-sm uppercase tracking-wider">
                    {pkg.category}
                  </div>
                  {isAdminLoggedIn && onDeletePackage && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePackage(pkg.id);
                      }}
                      className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-md hover:scale-105 transition-all cursor-pointer z-30"
                      title="Delete Package"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {pkg.price && (
                    <div className="absolute bottom-4 right-4 bg-white/95 border border-stone-200 text-[#333333] text-xs font-semibold px-3 py-1.5 shadow-md">
                      From <span className="text-[#008080] font-bold text-base">{formatPrice(pkg.price)}</span>
                    </div>
                  )}
                </div>

                {/* Card Info Body */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] text-[#FF7F50] font-bold uppercase tracking-widest">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{pkg.duration}</span>
                    </div>
                    <h3 className="text-lg font-serif italic text-[#333333] leading-snug group-hover:text-[#008080] transition-colors line-clamp-2">
                      {pkg.title}
                    </h3>
                    <p className="text-stone-500 text-xs leading-relaxed font-light line-clamp-3">
                      {pkg.shortDescription}
                    </p>
                  </div>

                  {/* Card Actions Bottom */}
                  <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-[11px] text-stone-400 font-bold uppercase tracking-wider">
                      <MapPin className="w-3.5 h-3.5 text-[#008080] shrink-0" />
                      <span className="line-clamp-1">{pkg.destination}</span>
                    </div>
                    <button
                      onClick={() => onNavigate('package-detail', pkg.id)}
                      className="px-4 py-2 bg-[#008080] hover:bg-[#006666] text-white text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1 group/btn"
                    >
                      <span>Details</span>
                      <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
