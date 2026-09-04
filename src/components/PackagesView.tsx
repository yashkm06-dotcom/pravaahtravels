import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Clock3, Compass, Filter, Heart, MapPin, RefreshCw, Search, SlidersHorizontal, Sparkles, Star, Users } from 'lucide-react';
import { PACKAGE_LOCATIONS, TravelPackage, WebsiteCMSSettings, formatPackagePrice } from '../types';
import { getTravelImage, handleTravelImageError } from '../utils/imageFallback';
import { openPackage } from '../utils/packageRoute';
import { resolveBusinessProfile } from '../utils/businessProfile';
import PackageImage from './PackageImage';
import { SkeletonPackage } from './SkeletonLoader';
import { usePravaahMotion } from '../hooks/usePravaahMotion';
import { getPackageVisual } from '../utils/packageVisual';
import { resolvePackageDisplayTitle } from '../utils/packageSeo';

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

interface PackageFilters { searchQuery: string; category: string; destination: string; bookingType: string; duration: string; availability: string; }
const emptyFilters: PackageFilters = { searchQuery: '', category: 'All', destination: 'All', bookingType: 'All', duration: 'All', availability: 'All' };
const PAGE_SIZE = 6;
const readFilters = (): PackageFilters => {
  if (typeof window === 'undefined') return emptyFilters;
  const params = new URLSearchParams(window.location.search);
  return { searchQuery: params.get('search') || '', category: params.get('category') || 'All', destination: params.get('destination') || params.get('location') || 'All', bookingType: params.get('type') || 'All', duration: params.get('duration') || 'All', availability: params.get('availability') || 'All' };
};
const durationDays = (value: string) => Number(String(value || '').match(/(\d+)\s*Day/i)?.[1] || 0);
const unique = (values: unknown[]) => Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));

function PackageResult({ pkg, index, saved, onNavigate, onToggleWishlist }: { pkg: TravelPackage; index: number; saved: boolean; onNavigate: PackagesViewProps['onNavigate']; onToggleWishlist?: PackagesViewProps['onToggleWishlist'] }) {
  const image = getPackageVisual(pkg);
  const displayTitle = resolvePackageDisplayTitle(pkg);
  const packageSignals = pkg as TravelPackage & { rating?: number; reviewRating?: number };
  const rating = Number(packageSignals.rating || packageSignals.reviewRating || 0);
  return <article className={`pravaah-catalog-item pravaah-catalog-item--${(index % 3) + 1}`}>
    <button type="button" className="pravaah-catalog-item__image" onClick={() => openPackage(onNavigate, pkg)} aria-label={`Open ${displayTitle}`}><PackageImage src={image} alt={displayTitle} className="h-full w-full object-cover" /><span className="pravaah-catalog-item__number">{String(index + 1).padStart(2, '0')}</span>{pkg.offerPrice && pkg.offerPrice < pkg.price && <span className="pravaah-catalog-item__offer">Offer</span>}</button>
    <div className="pravaah-catalog-item__body"><div className="pravaah-catalog-item__meta"><span>{pkg.category}</span><span>{pkg.location || pkg.destination}</span></div><h2><button type="button" onClick={() => openPackage(onNavigate, pkg)}>{displayTitle}</button></h2><p>{pkg.shortDescription || 'A considered journey through remarkable country.'}</p><div className="pravaah-catalog-item__facts"><span><Clock3 className="h-4 w-4" aria-hidden="true" />{pkg.duration}</span><span><Users className="h-4 w-4" aria-hidden="true" />{pkg.maxGuests ? `Up to ${pkg.maxGuests}` : 'Small group'}</span><span className="pravaah-catalog-item__rating"><Star className="h-4 w-4" aria-hidden="true" />{rating > 0 ? `${rating.toFixed(1)} guest rating` : 'Guest rating pending'}</span></div><div className="pravaah-catalog-item__footer"><span>From <strong>{formatPackagePrice(pkg.offerPrice || pkg.price)}</strong></span><div>{onToggleWishlist && <button type="button" className={`pravaah-save-button ${saved ? 'is-saved' : ''}`} onClick={() => onToggleWishlist(pkg)} aria-label={saved ? `Remove ${displayTitle} from saved journeys` : `Save ${displayTitle}`} title="Save journey"><Heart className="h-4 w-4" aria-hidden="true" /></button>}<button type="button" className="pravaah-outline-button pravaah-outline-button--small" onClick={() => openPackage(onNavigate, pkg)}>View route <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button></div></div></div>
  </article>;
}

export default function PackagesView({ packages, onNavigate, loading, prefilledCategory = 'All', selectedLocationFilter = 'All', onResetPrefilledCategory, onClearSelectedLocation, onPackageSaved, wishlistPackageIds = [], onToggleWishlist, websiteCMS }: PackagesViewProps) {
  const viewRef = useRef<HTMLDivElement>(null);
  usePravaahMotion(viewRef);
  const business = resolveBusinessProfile(websiteCMS);
  const initial = useMemo(readFilters, []);
  const [filters, setFilters] = useState<PackageFilters>(initial);
  const [sortOrder, setSortOrder] = useState(() => typeof window === 'undefined' ? 'default' : new URLSearchParams(window.location.search).get('sort') || 'default');
  const [page, setPage] = useState(() => typeof window === 'undefined' ? 1 : Math.max(1, Number(new URLSearchParams(window.location.search).get('page')) || 1));
  const [savedNotice, setSavedNotice] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const activePackages = useMemo(() => packages.filter((pkg) => pkg.active !== false), [packages]);

  useEffect(() => { if (prefilledCategory !== 'All') { setPage(1); setFilters((prev) => ({ ...prev, category: prefilledCategory })); } }, [prefilledCategory]);
  useEffect(() => { if (selectedLocationFilter !== 'All') { setPage(1); setFilters((prev) => ({ ...prev, destination: selectedLocationFilter })); } }, [selectedLocationFilter]);
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.searchQuery.trim()) params.set('search', filters.searchQuery.trim());
    if (filters.category !== 'All') params.set('category', filters.category);
    if (filters.destination !== 'All') params.set('destination', filters.destination);
    if (filters.bookingType !== 'All') params.set('type', filters.bookingType);
    if (filters.duration !== 'All') params.set('duration', filters.duration);
    if (filters.availability !== 'All') params.set('availability', filters.availability);
    if (sortOrder !== 'default') params.set('sort', sortOrder);
    if (page > 1) params.set('page', String(page));
    window.history.replaceState({}, '', `${window.location.pathname}${params.toString() ? `?${params}` : ''}`);
  }, [filters, page, sortOrder]);

  const categoryOptions = useMemo(() => unique(activePackages.map((pkg) => pkg.category)), [activePackages]);
  const destinationOptions = useMemo(() => unique([...PACKAGE_LOCATIONS, ...activePackages.flatMap((pkg) => [pkg.location, pkg.destination])]), [activePackages]);
  const bookingOptions = useMemo(() => unique(activePackages.map((pkg) => pkg.bookingType)), [activePackages]);

  const filteredPackages = useMemo(() => {
    const query = filters.searchQuery.trim().toLowerCase();
    const category = filters.category.toLowerCase();
    const destination = filters.destination.toLowerCase();
    const bookingType = filters.bookingType.toLowerCase();
    const matches = activePackages.filter((pkg) => {
      const haystack = [pkg.title, pkg.destination, pkg.location, pkg.category, pkg.bookingType, pkg.shortDescription, ...(pkg.tags || [])].join(' ').toLowerCase();
      const isInternational = /international/i.test(`${pkg.category} ${pkg.location} ${pkg.homepageCategory}`) && !/^india$/i.test(String(pkg.country || '').trim());
      const matchesCategory = filters.category === 'All' || (category.includes('international') ? isInternational : String(pkg.category).toLowerCase() === category);
      const matchesDestination = filters.destination === 'All' || [pkg.destination, pkg.location].some((value) => String(value || '').toLowerCase().includes(destination));
      const days = durationDays(pkg.duration);
      const matchesDuration = filters.duration === 'All' || (filters.duration === 'Short (1-4 Days)' && days > 0 && days <= 4) || (filters.duration === 'Medium (5-7 Days)' && days >= 5 && days <= 7) || (filters.duration === 'Long (8+ Days)' && days >= 8);
      const matchesAvailability = filters.availability === 'All' || (filters.availability === 'Featured' && pkg.featured) || (filters.availability === 'Scheduled' && Boolean(pkg.departureDates?.length)) || (filters.availability === 'Offers' && Boolean(pkg.offerPrice && pkg.offerPrice < pkg.price));
      return (!query || haystack.includes(query)) && matchesCategory && matchesDestination && (filters.bookingType === 'All' || String(pkg.bookingType || '').toLowerCase() === bookingType) && matchesDuration && matchesAvailability;
    });
    return matches.sort((a, b) => sortOrder === 'newest' ? new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime() : sortOrder === 'price-asc' ? (a.offerPrice || a.price) - (b.offerPrice || b.price) : sortOrder === 'price-desc' ? (b.offerPrice || b.price) - (a.offerPrice || a.price) : sortOrder === 'duration-asc' ? durationDays(a.duration) - durationDays(b.duration) : sortOrder === 'duration-desc' ? durationDays(b.duration) - durationDays(a.duration) : 0);
  }, [activePackages, filters, sortOrder]);

  const pageCount = Math.max(1, Math.ceil(filteredPackages.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paginatedPackages = filteredPackages.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const hasFilters = Object.values(filters).some((value) => value !== '' && value !== 'All') || sortOrder !== 'default';
  const updateFilter = (key: keyof PackageFilters, value: string) => { setPage(1); setFilters((prev) => ({ ...prev, [key]: value })); };
  const reset = () => { setPage(1); setFilters(emptyFilters); setSortOrder('default'); onResetPrefilledCategory?.(); onClearSelectedLocation?.(); };
  useEffect(() => { if (page !== safePage) setPage(safePage); }, [page, safePage]);
  const handleSave = async (pkg: TravelPackage) => { if (!onToggleWishlist) return; const alreadySaved = wishlistPackageIds.includes(String(pkg.id)); await onToggleWishlist(pkg); setSavedNotice(alreadySaved ? 'Journey removed from your travel desk.' : 'Journey saved to your travel desk.'); onPackageSaved?.(); window.setTimeout(() => setSavedNotice(''), 2600); };
  const inputClass = 'pravaah-filter-control';

  return <div ref={viewRef} id="packages-view" className="pravaah-page pravaah-catalog-page">
    <section className="pravaah-page-hero"><div className="pravaah-page-hero__image"><img src={getTravelImage('/images/roopkund/bedni-bugyal.jpg')} alt="A high meadow in the Himalaya" onError={handleTravelImageError} /></div><div className="pravaah-page-hero__veil" /><div className="pravaah-shell pravaah-page-hero__inner"><span className="pravaah-kicker pravaah-kicker--light">The journey collection</span><h1>Routes worth<br /><em>taking your time for.</em></h1><p>Live packages, thoughtfully paced and ready to shape around the people you are travelling with.</p><div className="pravaah-page-hero__note"><span>Collection / {String(activePackages.length).padStart(2, '0')} routes</span><span>Updated from the Pravaah field desk</span></div></div></section>
    <section className="pravaah-catalog-toolbar"><div className="pravaah-shell"><div className="pravaah-catalog-toolbar__top"><div><span className="pravaah-kicker">Choose your way in</span><p>{filteredPackages.length} of {activePackages.length} published journeys</p></div><div className="pravaah-catalog-toolbar__actions"><button type="button" className="pravaah-outline-button pravaah-outline-button--small" onClick={() => setMobileFiltersOpen((value) => !value)}><SlidersHorizontal className="h-4 w-4" aria-hidden="true" />{mobileFiltersOpen ? 'Close filters' : 'Filter routes'}</button>{hasFilters && <button type="button" className="pravaah-text-link" onClick={reset}><RefreshCw className="h-4 w-4" aria-hidden="true" />Reset</button>}</div></div><div className={`pravaah-catalog-filters ${mobileFiltersOpen ? 'is-open' : ''}`}><label className="pravaah-filter-search"><Search className="h-4 w-4" aria-hidden="true" /><span className="sr-only">Search journeys</span><input id="package-search" name="search" value={filters.searchQuery} onChange={(event) => updateFilter('searchQuery', event.target.value)} placeholder="Search by place, pace, or journey" /></label><label className={inputClass}><span>Destination</span><select id="package-destination" name="destination" value={filters.destination} onChange={(event) => updateFilter('destination', event.target.value)}><option>All</option>{destinationOptions.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown className="h-4 w-4" aria-hidden="true" /></label><label className={inputClass}><span>Category</span><select id="package-category" name="category" value={filters.category} onChange={(event) => updateFilter('category', event.target.value)}><option>All</option>{categoryOptions.map((option) => <option key={option}>{option}</option>)}<option>International</option></select><ChevronDown className="h-4 w-4" aria-hidden="true" /></label><label className={inputClass}><span>Duration</span><select id="package-duration" name="duration" value={filters.duration} onChange={(event) => updateFilter('duration', event.target.value)}><option>All</option><option>Short (1-4 Days)</option><option>Medium (5-7 Days)</option><option>Long (8+ Days)</option></select><ChevronDown className="h-4 w-4" aria-hidden="true" /></label><label className={inputClass}><span>Travel style</span><select id="package-style" name="bookingType" value={filters.bookingType} onChange={(event) => updateFilter('bookingType', event.target.value)}><option>All</option>{bookingOptions.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown className="h-4 w-4" aria-hidden="true" /></label><label className={inputClass}><span>Sort by</span><select id="package-sort" name="sort" value={sortOrder} onChange={(event) => { setPage(1); setSortOrder(event.target.value); }}><option value="default">Recommended</option><option value="newest">Newest</option><option value="price-asc">Price: low</option><option value="price-desc">Price: high</option><option value="duration-asc">Shortest</option><option value="duration-desc">Longest</option></select><ChevronDown className="h-4 w-4" aria-hidden="true" /></label></div></div></section>
    {savedNotice && <div className="pravaah-shell"><div className="pravaah-notice"><Sparkles className="h-4 w-4" aria-hidden="true" />{savedNotice}</div></div>}
    <section className="pravaah-catalog-results pravaah-section"><div className="pravaah-shell"><div className="pravaah-catalog-results__heading"><span>Live collection</span><span>{loading ? 'Preparing routes' : filteredPackages.length > 0 ? `${(safePage - 1) * PAGE_SIZE + 1}-${Math.min(safePage * PAGE_SIZE, filteredPackages.length)} of ${filteredPackages.length}` : 'No routes found'}</span></div>{loading ? <div className="pravaah-catalog-list">{[1, 2, 3].map((item) => <SkeletonPackage key={item} />)}</div> : filteredPackages.length > 0 ? <><div className="pravaah-catalog-list">{paginatedPackages.map((pkg, index) => <PackageResult key={pkg.id} pkg={pkg} index={(safePage - 1) * PAGE_SIZE + index} saved={wishlistPackageIds.includes(String(pkg.id))} onNavigate={onNavigate} onToggleWishlist={onToggleWishlist ? handleSave : undefined} />)}</div>{pageCount > 1 && <nav className="pravaah-pagination" aria-label="Journey collection pages"><button type="button" className="pravaah-pagination__arrow" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={safePage === 1} aria-label="Previous page" title="Previous page"><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button><div className="pravaah-pagination__pages">{Array.from({ length: pageCount }, (_, index) => index + 1).map((item) => <button type="button" key={item} className={item === safePage ? 'is-active' : ''} onClick={() => setPage(item)} aria-current={item === safePage ? 'page' : undefined}>{String(item).padStart(2, '0')}</button>)}</div><button type="button" className="pravaah-pagination__arrow" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={safePage === pageCount} aria-label="Next page" title="Next page"><ChevronRight className="h-4 w-4" aria-hidden="true" /></button></nav>}</> : <div className="pravaah-empty-state pravaah-empty-state--large"><Filter className="h-7 w-7" aria-hidden="true" /><h2>No route matches that search.</h2><p>Try a wider destination, another travel rhythm, or clear the filters to return to the full collection.</p><button type="button" className="pravaah-button pravaah-button--dark" onClick={reset}>Show all journeys <RefreshCw className="h-4 w-4" aria-hidden="true" /></button></div>}</div></section>
  </div>;
}
