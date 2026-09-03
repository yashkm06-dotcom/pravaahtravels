import { useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, CalendarDays, Check, Clock3, Compass, Globe2, Heart, Landmark, MapPin, Mountain, Quote, Search, ShieldCheck, SlidersHorizontal, Tent, Users, Waves } from 'lucide-react';
import { ActivityChildItem, ActivityItem, ActivityRecommendation, DestinationCategory, FeaturedCategoryItem, formatPackagePrice, TravelPackage, WebsiteCMSSettings } from '../types';
import { getTravelImage, handleTravelImageError } from '../utils/imageFallback';
import { openPackage } from '../utils/packageRoute';
import PackageImage from './PackageImage';
import FeaturedPackageShowcase from './FeaturedPackageShowcase';
import { usePravaahMotion } from '../hooks/usePravaahMotion';
import { getPackageVisual } from '../utils/packageVisual';

interface HomeViewProps {
  featuredPackages: TravelPackage[];
  onNavigate: (view: string, packageId?: string | null) => void;
  onEnquire?: (pkg: TravelPackage) => void;
  loading: boolean;
  isAdminLoggedIn?: boolean;
  onDeletePackage?: (id: string) => void;
  onSelectCategory: (category: DestinationCategory) => void;
  onSearchByLocation?: (location: string) => void;
  websiteCMS: WebsiteCMSSettings;
  wishlistPackageIds?: string[];
  onToggleWishlist?: (pkg: TravelPackage) => void;
  activities?: ActivityItem[];
  activityItems?: ActivityChildItem[];
  activityRecommendations?: ActivityRecommendation[];
  featuredCategories?: FeaturedCategoryItem[];
  packages?: TravelPackage[];
  blogPosts?: { id: string; title: string; excerpt?: string; content?: string; imageUrl?: string; category?: string; slug?: string }[];
  googleReviews?: { rating?: number; totalReviews?: number } | null;
}

const HERO_FALLBACK = '/images/buran-ghati/hero-buran-ghati.webp';
const DESTINATION_FALLBACKS: Record<string, string> = {
  Uttarakhand: '/images/roopkund/return-valley.jpg',
  Ladakh: '/images/buran-ghati/pass-crossing.webp',
  'Himachal Pradesh': '/images/buran-ghati/dayara-meadow.webp',
  Kashmir: '/images/roopkund/mount-trishul.jpg',
  'International Trips': '/images/roopkund/rishikesh-valley.jpg',
};

const cleanText = (value: unknown, fallback: string) => String(value || '').trim() || fallback;
const normalizeCountry = (value: unknown) => {
  const country = String(value || '').trim();
  if (!country) return '';
  const normalized = country.toLowerCase().replace(/[._-]+/g, ' ').replace(/\s+/g, ' ');
  if (normalized === 'united arab emirates' || normalized === 'uae') return 'United Arab Emirates';
  return country;
};

function SectionHeading({ eyebrow, title, copy, action, onAction }: { eyebrow: string; title: string; copy?: string; action?: string; onAction?: () => void }) {
  return <div className="pravaah-section-heading">
    <div><span className="pravaah-kicker">{eyebrow}</span><h2>{title}</h2>{copy && <p>{copy}</p>}</div>
    {action && onAction && <button type="button" className="pravaah-text-link" onClick={onAction}>{action}<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button>}
  </div>;
}

function JourneyCard({ pkg, index, onNavigate, wishlisted, onToggleWishlist }: { pkg: TravelPackage; index: number; onNavigate: HomeViewProps['onNavigate']; wishlisted: boolean; onToggleWishlist?: (pkg: TravelPackage) => void }) {
  const image = getPackageVisual(pkg);
  return <article className={`pravaah-journey-card pravaah-journey-card--${index + 1}`}>
    <button type="button" className="pravaah-journey-card__image" onClick={() => openPackage(onNavigate, pkg)} aria-label={`Open ${pkg.title}`}>
      <PackageImage src={image} alt={pkg.title} className="h-full w-full object-cover" />
      <span className="pravaah-journey-card__index">0{index + 1}</span>
    </button>
    <div className="pravaah-journey-card__body">
      <div className="pravaah-journey-card__meta"><span>{pkg.category}</span><span>{pkg.duration}</span></div>
      <h3><button type="button" onClick={() => openPackage(onNavigate, pkg)}>{pkg.title}</button></h3>
      <p>{cleanText(pkg.shortDescription, 'A considered route through remarkable country.')}</p>
      <div className="pravaah-journey-card__footer">
        <span>From <strong>{formatPackagePrice(pkg.offerPrice || pkg.price)}</strong></span>
        {onToggleWishlist && <button type="button" className={`pravaah-save-button ${wishlisted ? 'is-saved' : ''}`} onClick={() => onToggleWishlist(pkg)} aria-label={wishlisted ? `Remove ${pkg.title} from saved journeys` : `Save ${pkg.title}`} title={wishlisted ? 'Remove saved journey' : 'Save journey'}><Heart className="h-4 w-4" aria-hidden="true" /></button>}
      </div>
    </div>
  </article>;
}

export default function HomeView({ featuredPackages, onNavigate, onEnquire, loading, onSelectCategory, onSearchByLocation, websiteCMS, wishlistPackageIds = [], onToggleWishlist, activities = [], activityRecommendations = [], featuredCategories = [], packages = [], blogPosts = [], googleReviews = null }: HomeViewProps) {
  const viewRef = useRef<HTMLDivElement>(null);
  usePravaahMotion(viewRef);
  const [destination, setDestination] = useState('Uttarakhand');
  const [travelType, setTravelType] = useState('All travel styles');
  const [tripDuration, setTripDuration] = useState('7 days');
  const [travelDate, setTravelDate] = useState('');
  const [travellers, setTravellers] = useState('2 travellers');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFeaturedLocation, setActiveFeaturedLocation] = useState('Uttarakhand');
  const [activeFeaturedCountry, setActiveFeaturedCountry] = useState('All');
  const activePackages = useMemo(() => (packages.length ? packages : featuredPackages).filter((pkg) => pkg.active !== false), [featuredPackages, packages]);
  const configuredHero = String(websiteCMS.heroBackgroundImageUrl || '').trim();
  const configuredHeroLooksRelevant = configuredHero.length > 0 && !/(dubai|thailand|vietnam|bali|singapore|city[-_ ]?scape|beatsnoop|placeholder)/i.test(configuredHero);
  const heroImage = getTravelImage(loading || !configuredHeroLooksRelevant ? HERO_FALLBACK : configuredHero);

  const destinations = useMemo(() => {
    const map = new Map<string, { name: string; image: string; count: number; region: string; package?: TravelPackage }>();
    activePackages.forEach((pkg) => {
      const name = cleanText(pkg.location, cleanText(pkg.destination, 'Uttarakhand'));
      if (!map.has(name)) map.set(name, { name, image: getPackageVisual(pkg) || DESTINATION_FALLBACKS[name] || HERO_FALLBACK, count: 0, region: pkg.destination, package: pkg });
      map.get(name)!.count += 1;
    });
    const fromCms = featuredCategories.filter((item) => item.enabled !== false).map((item) => ({ name: item.title, image: item.imageUrl, count: item.packageIds?.length || 0, region: item.location || item.title, package: undefined as TravelPackage | undefined }));
    return [...map.values(), ...fromCms.filter((item) => !map.has(item.name))].slice(0, 5);
  }, [activePackages, featuredCategories]);

  const journeyList = useMemo(() => {
    const featured = featuredPackages.filter((pkg) => pkg.active !== false);
    const rest = activePackages.filter((pkg) => !featured.some((item) => item.id === pkg.id));
    return [...featured, ...rest].slice(0, 4);
  }, [activePackages, featuredPackages]);

  const travelStyles = useMemo(() => {
    const styles = activePackages.map((pkg) => pkg.category).filter(Boolean);
    return Array.from(new Set([...styles, 'Adventure', 'Pilgrimage'])).slice(0, 5) as DestinationCategory[];
  }, [activePackages]);
  const travelStyleIcons = [Mountain, Waves, Tent, Landmark, Globe2];

  const featuredLocations = ['Uttarakhand', 'Ladakh', 'Himachal', 'International'];
  const internationalCountries = useMemo(() => Array.from(new Set(activePackages.filter((pkg) => /international/i.test(`${pkg.category} ${pkg.location} ${pkg.homepageCategory}`) && !/^india$/i.test(String(pkg.country || '').trim())).map((pkg) => normalizeCountry(pkg.country)).filter(Boolean))).sort((a, b) => a.localeCompare(b)), [activePackages]);
  const featuredMatches = useMemo(() => featuredPackages.filter((pkg) => {
    if (pkg.active === false) return false;
    const searchable = `${pkg.location} ${pkg.destination} ${pkg.category} ${pkg.homepageCategory}`.toLowerCase();
    const isInternational = /international/i.test(searchable) && !/^india$/i.test(String(pkg.country || '').trim());
    if (activeFeaturedLocation === 'International') return isInternational && (activeFeaturedCountry === 'All' || String(pkg.country || '') === activeFeaturedCountry);
    if (activeFeaturedLocation === 'Himachal') return /himachal|spiti|shimla|manali/i.test(searchable);
    return searchable.includes(activeFeaturedLocation.toLowerCase());
  }).slice(0, 4), [activeFeaturedCountry, activeFeaturedLocation, featuredPackages]);

  const fieldNotes = activityRecommendations.length > 0 ? activityRecommendations.slice(0, 3) : activities.slice(0, 3).map((item) => ({ ...item, thumbnailUrl: item.imageUrl, title: item.title, description: item.description, location: item.location, duration: item.subtitle }));
  const reviewCount = Number(googleReviews?.totalReviews || 0);
  const rating = Number(googleReviews?.rating || 0);

  const handleDestinationSearch = () => {
    onSearchByLocation?.(destination);
    onNavigate('packages');
  };

  return <div ref={viewRef} id="home-view" className={`pravaah-home ${filtersOpen ? 'is-filters-open' : ''}`}>
    <section className="pravaah-home-hero" aria-labelledby="home-hero-title">
      <div className="pravaah-home-hero__image">{heroImage && <img src={heroImage} alt="A mountain landscape prepared for a Pravaah journey" onError={handleTravelImageError} />}</div>
      <div className="pravaah-home-hero__veil" />
      <div className="pravaah-shell pravaah-home-hero__content">
        <div className="pravaah-home-hero__copy">
          <span className="pravaah-kicker pravaah-kicker--light">Journeys from the quiet side of India</span>
          <h1 id="home-hero-title">Go where<br /><em>the map gets quiet.</em></h1>
          <p>Thoughtful journeys through high valleys, sacred towns, and the small roads that make a place stay with you.</p>
          <div className="pravaah-hero-actions"><button type="button" className="pravaah-button pravaah-button--copper" onClick={() => onNavigate('packages')}>Find your way <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button><button type="button" className="pravaah-quiet-link pravaah-quiet-link--light" onClick={() => onNavigate('about')}>Why Pravaah <ArrowRight className="h-4 w-4" aria-hidden="true" /></button></div>
        </div>
        <div className="pravaah-home-hero__aside"><span>01</span><p>Move with the landscape.<br />Return with a story.</p><ArrowDown className="h-5 w-5" aria-hidden="true" /></div>
      </div>
      <div className="pravaah-home-hero__caption"><span>Field note / 01</span><span>Himalayan journeys, made human</span></div>
    </section>

    <section className={`pravaah-discovery ${filtersOpen ? 'is-expanded' : ''}`} aria-labelledby="trip-discovery-title">
      <div className="pravaah-shell">
        <div className="pravaah-discovery__head">
          <div><span className="pravaah-kicker">Trip discovery</span><h2 id="trip-discovery-title">Tell us how you want to go.</h2></div>
          <button type="button" className="pravaah-discovery__more" onClick={() => setFiltersOpen((value) => !value)} aria-expanded={filtersOpen}><SlidersHorizontal className="h-4 w-4" aria-hidden="true" />{filtersOpen ? 'Fewer options' : 'More options'}</button>
        </div>
        <div className="pravaah-discovery__controls">
          <label className="pravaah-discovery__field pravaah-discovery__field--destination"><span>Destination</span><div><MapPin className="h-4 w-4" aria-hidden="true" /><select id="wayfinder-location" name="location" value={destination} onChange={(event) => setDestination(event.target.value)}><option>Uttarakhand</option><option>Himachal Pradesh</option><option>Ladakh</option><option>Kashmir</option><option>International Trips</option></select></div></label>
          <label className="pravaah-discovery__field pravaah-discovery__field--type"><span>Trip type</span><div><Compass className="h-4 w-4" aria-hidden="true" /><select id="wayfinder-style" name="travelStyle" value={travelType} onChange={(event) => setTravelType(event.target.value)}><option>All travel styles</option><option>Adventure</option><option>Pilgrimage</option><option>Family</option><option>International</option></select></div></label>
          <label className="pravaah-discovery__field pravaah-discovery__field--duration"><span>Duration</span><div><Clock3 className="h-4 w-4" aria-hidden="true" /><select id="wayfinder-duration" name="duration" value={tripDuration} onChange={(event) => setTripDuration(event.target.value)}><option>3 days</option><option>5 days</option><option>7 days</option><option>10+ days</option></select></div></label>
          <label className="pravaah-discovery__field pravaah-discovery__field--travellers"><span>Travellers</span><div><Users className="h-4 w-4" aria-hidden="true" /><select id="wayfinder-travellers" name="travellers" value={travellers} onChange={(event) => setTravellers(event.target.value)}><option>1 traveller</option><option>2 travellers</option><option>3 travellers</option><option>4+ travellers</option></select></div></label>
          <button type="button" className="pravaah-button pravaah-button--dark pravaah-discovery__action" onClick={handleDestinationSearch}><span>Explore journeys</span><ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button>
        </div>
        {filtersOpen && <div className="pravaah-discovery__extras"><label><CalendarDays className="h-4 w-4" aria-hidden="true" /><span>Preferred travel date</span><input id="wayfinder-date" name="travelDate" type="date" value={travelDate} onChange={(event) => setTravelDate(event.target.value)} /></label><p>We will use your destination to open the live route collection. The rest helps us understand the shape of your trip.</p></div>}
      </div>
    </section>

    <section className="pravaah-home-rhythms pravaah-section" aria-labelledby="home-rhythms-title">
      <div className="pravaah-shell"><div className="pravaah-reference-heading"><span className="pravaah-kicker">Travel styles</span><h2 id="home-rhythms-title">Choose the way you want to wander.</h2></div><div className="pravaah-home-rhythms__list">{travelStyles.map((style, index) => { const Icon = travelStyleIcons[index % travelStyleIcons.length]; return <button type="button" key={style} onClick={() => onSelectCategory(style)}><span className="pravaah-home-rhythms__icon"><Icon className="h-6 w-6" aria-hidden="true" /></span><strong>{style}</strong><ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button>; })}</div></div>
    </section>

    <section className="pravaah-destination-index pravaah-section" aria-labelledby="destination-index-title">
      <div className="pravaah-shell"><SectionHeading eyebrow="The destination index" title="Begin with the landscape." copy="Different altitudes, different rhythms. Choose the kind of silence you want to come home with." action="View all destinations" onAction={() => onNavigate('destinations')} />
        <div className={`pravaah-destination-grid ${destinations.length === 0 ? 'pravaah-destination-grid--empty' : ''}`}>{destinations.length > 0 ? destinations.map((item, index) => <button type="button" key={item.name} className={`pravaah-destination-panel pravaah-destination-panel--${index + 1}`} onClick={() => { if (item.package) openPackage(onNavigate, item.package); else onNavigate('destinations'); }}><img src={getTravelImage(item.image)} alt={item.name} loading="lazy" onError={handleTravelImageError} /><span className="pravaah-destination-panel__veil" /><span className="pravaah-destination-panel__copy"><small>{item.count ? `${item.count} ${item.count === 1 ? 'journey' : 'journeys'}` : item.region}</small><strong>{item.name}</strong><span>Explore <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></span></span></button>) : <div className="pravaah-empty-state">{loading ? 'Loading destination routes...' : 'Destinations are being prepared in the field.'}</div>}</div>
      </div>
    </section>

    <section className="pravaah-featured-section pravaah-section" id="featured-packages" aria-labelledby="featured-journeys-title">
      <div className="pravaah-shell"><div className="pravaah-featured-heading"><div><span className="pravaah-kicker">The featured routes</span><h2 id="featured-journeys-title">Featured Tours for the way you wander</h2><p>Start with a region, then narrow the feeling down to a country when the route reaches beyond India.</p></div><button type="button" className="pravaah-text-link" onClick={() => onNavigate('packages')}>Browse all journeys <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button></div><ul className="pravaah-featured-tabs" role="tablist" aria-label="Featured journey regions">{featuredLocations.map((item) => <li key={item}><button type="button" role="tab" aria-selected={activeFeaturedLocation === item} className={activeFeaturedLocation === item ? 'is-active' : ''} onClick={() => { setActiveFeaturedLocation(item); setActiveFeaturedCountry('All'); }}>{item}</button></li>)}</ul>{activeFeaturedLocation === 'International' && <ul className="pravaah-featured-tabs pravaah-featured-tabs--countries" role="tablist" aria-label="International countries">{internationalCountries.map((country) => <li key={country}><button type="button" role="tab" aria-selected={activeFeaturedCountry === country} className={activeFeaturedCountry === country ? 'is-active' : ''} onClick={() => setActiveFeaturedCountry(country)}>{country}</button></li>)}</ul>}<FeaturedPackageShowcase packages={featuredMatches.slice(0, 3)} onNavigate={onNavigate} onEnquire={onEnquire} /></div>
    </section>

    <section className="pravaah-journeys pravaah-section" aria-labelledby="journeys-title">
      <div className="pravaah-shell"><SectionHeading eyebrow="The journeys" title="A few ways in." copy="Every route is shaped around pace, place, and the people you are travelling with." action="See the full collection" onAction={() => onNavigate('packages')} />
        <div className="pravaah-journeys__rail">{journeyList.length > 0 ? journeyList.map((pkg, index) => <JourneyCard key={pkg.id} pkg={pkg} index={index} onNavigate={onNavigate} wishlisted={wishlistPackageIds.includes(String(pkg.id))} onToggleWishlist={onToggleWishlist} />) : <div className="pravaah-empty-state">No published journeys yet.</div>}</div>
        <div className="pravaah-rail-note"><span>{String(activePackages.length).padStart(2, '0')} routes in the live collection</span><span>More journeys are taking shape</span></div>
      </div>
    </section>

    <section className="pravaah-home-process pravaah-section" aria-labelledby="home-process-title">
      <div className="pravaah-shell pravaah-home-process__grid">
        <div className="pravaah-home-process__marker"><span className="pravaah-kicker">The Pravaah way</span><strong>03</strong><span>Make room for the unexpected.</span></div>
        <div className="pravaah-home-process__content"><span className="pravaah-kicker">How a route takes shape</span><h2 id="home-process-title">Less rushing.<br /><em>More arriving.</em></h2><div className="pravaah-home-process__steps"><div><span>01</span><div><h3>Find the pull</h3><p>Start with a place, a season, or simply the feeling you want to follow.</p></div></div><div><span>02</span><div><h3>Shape the route</h3><p>Our team matches the right pace, stays, and local details to your people.</p></div></div><div><span>03</span><div><h3>Travel with room</h3><p>Leave space for weather, chai, and the moments no itinerary can predict.</p></div></div></div><button type="button" className="pravaah-text-link" onClick={() => onNavigate('contact')}>Talk to a route curator <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button></div>
      </div>
    </section>

    <section className="pravaah-field-notes pravaah-section" aria-labelledby="field-notes-title">
      <div className="pravaah-shell"><div className="pravaah-field-notes__intro"><span className="pravaah-kicker">The field notes</span><h2 id="field-notes-title">Travel is in the details.</h2><p>Local meals, unhurried mornings, and the route your driver knows to take when the main road gets loud.</p><button type="button" className="pravaah-text-link" onClick={() => onNavigate('about')}>How we travel <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button></div><div className="pravaah-field-notes__list">{fieldNotes.length > 0 ? fieldNotes.map((note, index) => <article key={note.id || index} className="pravaah-field-note"><span className="pravaah-field-note__number">0{index + 1}</span><div className="pravaah-field-note__image"><img src={getTravelImage(note.thumbnailUrl || (note as ActivityItem).imageUrl || HERO_FALLBACK)} alt={note.title} loading="lazy" onError={handleTravelImageError} /></div><div><span className="pravaah-kicker">{note.location || 'In the field'}</span><h3>{note.title}</h3><p>{note.description}</p></div><ArrowUpRight className="h-5 w-5" aria-hidden="true" /></article>) : <p className="pravaah-empty-state">Field notes will appear here as the journal grows.</p>}</div></div>
    </section>

    <section className="pravaah-trust pravaah-section" aria-labelledby="trust-title"><div className="pravaah-shell pravaah-trust__grid"><div className="pravaah-trust__image"><img src={getTravelImage('/images/roopkund/experience-ridge.jpg')} alt="A Pravaah guide on a Himalayan ridge" loading="lazy" onError={handleTravelImageError} /><span>02 / Trust the people who know the way</span></div><div className="pravaah-trust__copy"><span className="pravaah-kicker">The Pravaah promise</span><h2 id="trust-title">The right trip is not the fullest itinerary.</h2><p>It is the one that leaves room for a roadside chai, a change in weather, and the conversation you did not plan for.</p><div className="pravaah-trust__points"><div><ShieldCheck className="h-5 w-5" aria-hidden="true" /><span>Local route knowledge, from first call to return</span></div><div><Compass className="h-5 w-5" aria-hidden="true" /><span>Clear planning for comfort, pace, and altitude</span></div><div><Check className="h-5 w-5" aria-hidden="true" /><span>One human team to help you through the details</span></div></div>{reviewCount > 0 && <div className="pravaah-trust__review"><Quote className="h-6 w-6" aria-hidden="true" /><span>{rating.toFixed(1)} from {reviewCount} verified guest reviews</span></div>}</div></div></section>

    {blogPosts.length > 0 && <section className="pravaah-journal-preview pravaah-section" aria-labelledby="journal-preview-title"><div className="pravaah-shell"><SectionHeading eyebrow="The journal" title="Notes for the road." action="Read the journal" onAction={() => onNavigate('blogs')} /><div className="pravaah-journal-preview__grid">{blogPosts.slice(0, 2).map((post, index) => <article key={post.id} className={`pravaah-journal-story pravaah-journal-story--${index + 1}`}><div className="pravaah-journal-story__image">{post.imageUrl && <img src={getTravelImage(post.imageUrl)} alt={post.title} loading="lazy" onError={handleTravelImageError} />}</div><div><span className="pravaah-kicker">{post.category || 'Travel note'}</span><h3>{post.title}</h3><p>{cleanText(post.excerpt || post.content, 'A note from the road.')}</p><button type="button" className="pravaah-text-link" onClick={() => onNavigate('blog-detail', post.slug || post.id)}>Read note <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button></div></article>)}</div></div></section>}

    <section className="pravaah-home-cta"><div className="pravaah-shell pravaah-home-cta__inner"><div><span className="pravaah-kicker pravaah-kicker--light">Your route can start small</span><h2>Tell us where<br /><em>you want to go.</em></h2><p>We will help you turn a feeling into a route, with the right amount of room left unplanned.</p></div><button type="button" className="pravaah-button pravaah-button--paper" onClick={() => onNavigate('contact')}>Plan your trip <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button></div></section>
  </div>;
}
