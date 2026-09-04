import { useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Compass, MapPin } from 'lucide-react';
import { FeaturedCategoryItem, formatPackagePrice, TravelPackage } from '../types';
import { getTravelImage, handleTravelImageError } from '../utils/imageFallback';
import { openPackage } from '../utils/packageRoute';
import PackageImage from './PackageImage';
import { usePravaahMotion } from '../hooks/usePravaahMotion';
import { getPackageVisual } from '../utils/packageVisual';
import { resolvePackageDisplayTitle } from '../utils/packageSeo';

interface PackageFilterSelection { search?: string; category?: string; location?: string; destination?: string; bookingType?: string; }
interface DestinationsViewProps { onSelectCategory: (category: string) => void; onSelectFilter?: (filters: PackageFilterSelection) => void; onNavigate?: (view: string, packageId?: string | null) => void; packages?: TravelPackage[]; featuredCategories?: FeaturedCategoryItem[]; loading?: boolean; }
interface DestinationStory { id: string; name: string; description: string; image: string; count: number; filter: PackageFilterSelection; }

const fallbackImages = ['/images/roopkund/bedni-bugyal.jpg', '/images/buran-ghati/pass-crossing.webp', '/images/roopkund/rishikesh-valley.jpg', '/images/buran-ghati/dayara-meadow.webp'];
const normalize = (value: unknown) => String(value || '').trim().toLowerCase();

export default function DestinationsView({ onSelectCategory, onSelectFilter, onNavigate, packages = [], featuredCategories = [], loading = false }: DestinationsViewProps) {
  const viewRef = useRef<HTMLDivElement>(null);
  usePravaahMotion(viewRef);
  const [activeId, setActiveId] = useState<string | null>(null);
  const stories = useMemo<DestinationStory[]>(() => {
    const active = packages.filter((pkg) => pkg.active !== false);
    if (featuredCategories.length > 0) return featuredCategories.filter((item) => item.enabled !== false).map((item, index) => {
      const linked = new Set((item.packageIds || []).map(String));
      const matching = active.filter((pkg) => linked.has(pkg.id) || (item.category && normalize(pkg.category) === normalize(item.category)) || (item.location && `${pkg.location} ${pkg.destination}`.toLowerCase().includes(normalize(item.location))));
      return { id: item.id, name: item.title, description: item.description || 'A Pravaah route shaped by the landscape.', image: item.imageUrl || (matching[0] ? getPackageVisual(matching[0]) : '') || fallbackImages[index % fallbackImages.length], count: matching.length, filter: item.category ? { category: item.category } : { location: item.location || item.title } };
    });
    const map = new Map<string, DestinationStory>();
    active.forEach((pkg) => {
      const name = String(pkg.location || pkg.destination || 'Uttarakhand');
      const key = normalize(name);
      const existing = map.get(key);
      if (existing) { existing.count += 1; return; }
      map.set(key, { id: key, name, description: pkg.shortDescription || `Routes through ${name}, paced with room to look around.`, image: getPackageVisual(pkg) || fallbackImages[map.size % fallbackImages.length], count: 1, filter: { location: name } });
    });
    return [...map.values()];
  }, [packages, featuredCategories]);
  const activePackages = useMemo(() => packages.filter((pkg) => pkg.active !== false), [packages]);
  const routePreview = useMemo(() => activePackages.slice(0, 3), [activePackages]);

  const select = (story: DestinationStory) => {
    setActiveId(story.id);
    window.setTimeout(() => { if (onSelectFilter) onSelectFilter(story.filter); else if (story.filter.category) onSelectCategory(story.filter.category); }, 150);
  };

  return <div ref={viewRef} id="destinations-view" className="pravaah-page pravaah-destinations-page">
    <section className="pravaah-page-hero pravaah-page-hero--destinations"><div className="pravaah-page-hero__image"><img src={getTravelImage('/images/roopkund/mount-trishul.jpg')} alt="Mountain ridges above a Himalayan valley" onError={handleTravelImageError} /></div><div className="pravaah-page-hero__veil" /><div className="pravaah-shell pravaah-page-hero__inner"><span className="pravaah-kicker pravaah-kicker--light">The destination index</span><h1>Find the landscape<br /><em>that finds you.</em></h1><p>Not a list of places. A collection of regions, each with its own pace, altitude, and way of opening up.</p></div></section>
    <section className="pravaah-destinations-intro pravaah-section"><div className="pravaah-shell pravaah-destinations-intro__grid"><div><span className="pravaah-kicker">Read the terrain</span><h2>Choose by feeling,<br />then let the route follow.</h2></div><p>Start with a region or a travel style. The live collection will take you from there, with real packages and the details needed to decide well.</p></div></section>
    <section className="pravaah-destination-stories pravaah-section"><div className="pravaah-shell"><div className="pravaah-destination-stories__label"><span>Published regions</span><span>{String(stories.length).padStart(2, '0')} directions</span></div>{loading ? <div className="pravaah-destination-loading">Loading the field index...</div> : stories.length > 0 ? <div className="pravaah-destination-stories__list">{stories.map((story, index) => <button type="button" key={story.id} className={`pravaah-destination-story ${index === 0 ? 'is-lead' : ''} ${activeId === story.id ? 'is-opening' : ''}`} onClick={() => select(story)} disabled={Boolean(activeId && activeId !== story.id)}><span className="pravaah-destination-story__number">{String(index + 1).padStart(2, '0')}</span><span className="pravaah-destination-story__image"><img src={getTravelImage(story.image)} alt={story.name} loading="lazy" onError={handleTravelImageError} /></span><span className="pravaah-destination-story__body"><span className="pravaah-kicker">{story.count} {story.count === 1 ? 'journey' : 'journeys'}</span><strong>{story.name}</strong><span>{story.description}</span><small>Open matching routes <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></small></span></button>)}</div> : <div className="pravaah-empty-state pravaah-empty-state--large"><Compass className="h-7 w-7" aria-hidden="true" /><h2>The index is waiting for its first route.</h2><p>Publish active packages or destination stories from the CMS to bring this page to life.</p></div>}</div></section>
    <section className="pravaah-destinations-note"><div className="pravaah-shell"><MapPin className="h-5 w-5" aria-hidden="true" /><p>Every destination entry is tied to the live package collection, so what you find here is what you can actually plan.</p></div></section>
    <section className="pravaah-destination-routes pravaah-section" aria-labelledby="destination-routes-title"><div className="pravaah-shell"><div className="pravaah-section-heading"><div><span className="pravaah-kicker">Journeys already on the ground</span><h2 id="destination-routes-title">Start with a route.</h2><p>A few live departures from the collection. Open one to see the pace, detail, and room built into the journey.</p></div><button type="button" className="pravaah-text-link" onClick={() => onNavigate?.('packages')}>Browse all packages <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button></div><div className="pravaah-destination-routes__list">{routePreview.map((pkg, index) => {
      const displayTitle = resolvePackageDisplayTitle(pkg);
      return <article key={pkg.id}><button type="button" className="pravaah-destination-route__image" onClick={() => onNavigate && openPackage(onNavigate, pkg)} aria-label={`Open ${displayTitle}`}><PackageImage src={pkg.imageUrl || pkg.packageBannerUrl || pkg.heroImage || fallbackImages[index % fallbackImages.length]} alt={displayTitle} className="h-full w-full object-cover" /></button><div className="pravaah-destination-route__body"><span className="pravaah-kicker">{pkg.location || pkg.destination} / {pkg.category}</span><h3><button type="button" onClick={() => onNavigate && openPackage(onNavigate, pkg)}>{displayTitle}</button></h3><p>{pkg.shortDescription || 'A route shaped around the landscape and the people travelling through it.'}</p><div><span>{pkg.duration}</span><strong>{pkg.offerPrice || pkg.price ? `From ${formatPackagePrice(pkg.offerPrice || pkg.price)}` : 'Enquire for route'}</strong></div></div></article>;
    })}</div></div></section>
  </div>;
}
