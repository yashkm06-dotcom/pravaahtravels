import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Clock3, Mountain } from 'lucide-react';
import { formatPackagePrice, type TravelPackage } from '../types';
import { openPackage } from '../utils/packageRoute';
import PackageImage from './PackageImage';

interface FeaturedPackageShowcaseProps {
  packages: TravelPackage[];
  onNavigate: (view: string, packageId?: string | null) => void;
  onEnquire?: (pkg: TravelPackage) => void;
}

type CarouselItem =
  | { type: 'package'; pkg: TravelPackage }
  | { type: 'coming-soon'; id: 'coming-soon' };

const usableImage = (value: unknown) => {
  const source = String(value || '').trim();
  return /^(https?:\/\/|\/|data:image\/)/i.test(source)
    && !/vitour-travel-placeholder|placeholder\.(jpg|jpeg|png|webp)/i.test(source);
};

const getPackageOwnedImage = (pkg: TravelPackage) => [
  pkg.imageUrl,
  pkg.packageBannerUrl,
  pkg.heroImage,
  ...(pkg.galleryImages || []),
  ...(pkg.gallery || []),
].find(usableImage) || '';

const getLocation = (pkg: TravelPackage) => Array.from(new Set([
  pkg.destination,
  pkg.country,
  pkg.location,
].map((value) => String(value || '').trim()).filter(Boolean))).join(' / ');

const getPrice = (pkg: TravelPackage) => {
  const price = Number(pkg.offerPrice ?? pkg.price);
  return Number.isFinite(price) && price > 0 ? formatPackagePrice(price) : 'Price on request';
};

const getDifficulty = (pkg: TravelPackage) => {
  const label = String(pkg.difficultyLabel || '').trim();
  if (label) return label;
  return Number.isFinite(Number(pkg.difficultyLevel)) ? `Level ${pkg.difficultyLevel}` : '';
};

const getEditorialIntro = (pkg: TravelPackage) => String(pkg.overview || pkg.shortDescription || '').trim();

const getEditorialSections = (pkg: TravelPackage) => {
  const sections: Array<{ label: string; text: string }> = [];
  const fullDescription = String(pkg.fullDescription || '').trim();
  const intro = getEditorialIntro(pkg);
  const highlights = (pkg.highlights || []).map((item) => String(item || '').trim()).filter(Boolean).slice(0, 3);
  const firstDay = pkg.itinerary?.find((day) => String(day.description || '').trim());

  if (fullDescription && fullDescription !== intro) sections.push({ label: 'The journey', text: fullDescription });
  if (highlights.length) sections.push({ label: 'The experience', text: highlights.join(' · ') });
  if (firstDay) sections.push({ label: firstDay.location ? `Along the route · ${firstDay.location}` : 'Along the route', text: String(firstDay.description).trim() });
  return sections.slice(0, 3);
};

const clampIndex = (index: number, length: number) => Math.max(0, Math.min(index, Math.max(length - 1, 0)));

export default function FeaturedPackageShowcase({ packages, onNavigate, onEnquire }: FeaturedPackageShowcaseProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const realPackages = useMemo(() => packages.filter((pkg) => pkg.active !== false), [packages]);
  const items = useMemo<CarouselItem[]>(() => [
    ...realPackages.map((pkg) => ({ type: 'package' as const, pkg })),
    ...(realPackages.length < 4 ? [{ type: 'coming-soon' as const, id: 'coming-soon' as const }] : []),
  ], [realPackages]);
  const activeItem = items[activeIndex];
  const activePackage = activeItem?.type === 'package' ? activeItem.pkg : null;
  const editorialSections = activePackage ? getEditorialSections(activePackage) : [];

  useEffect(() => {
    setActiveIndex(0);
  }, [items]);

  const selectIndex = useCallback((index: number) => {
    const nextIndex = clampIndex(index, items.length);
    if (items[nextIndex]?.type !== 'package') return;
    setActiveIndex(nextIndex);
    window.requestAnimationFrame(() => cardRefs.current[nextIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }));
  }, [items]);

  const previous = useCallback(() => selectIndex((activeIndex - 1 + realPackages.length) % realPackages.length), [activeIndex, realPackages.length, selectIndex]);
  const next = useCallback(() => selectIndex((activeIndex + 1) % realPackages.length), [activeIndex, realPackages.length, selectIndex]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); previous(); }
    if (event.key === 'ArrowRight') { event.preventDefault(); next(); }
    if (event.key === 'Home') { event.preventDefault(); selectIndex(0); }
    if (event.key === 'End') { event.preventDefault(); selectIndex(Math.max(realPackages.length - 1, 0)); }
  };

  if (!activePackage) {
    return <div className="pravaah-featured-carousel" aria-label="Featured travel packages"><div className="pravaah-featured-carousel__empty"><span className="pravaah-kicker">The next route</span><strong>New featured journeys are taking shape.</strong><p>More routes are being curated for the live collection.</p></div></div>;
  }

  return (
    <div className="pravaah-featured-carousel" aria-label="Featured travel packages">
      <div className="pravaah-featured-carousel__composition" onKeyDown={handleKeyDown}>
        <article className="pravaah-featured-carousel__active-card" key={activePackage.id} aria-label={`Active journey: ${activePackage.title}`}>
          <button type="button" className="pravaah-featured-carousel__active-image" onClick={() => openPackage(onNavigate, activePackage)} aria-label={`View ${activePackage.title} details`}>
            <PackageImage src={getPackageOwnedImage(activePackage)} alt={activePackage.title} className="h-full w-full object-cover" loading="eager" />
            <span className="pravaah-featured-carousel__index">{String(activeIndex + 1).padStart(2, '0')}</span>
            <span className="pravaah-featured-carousel__image-note">Featured route</span>
          </button>
          <div className="pravaah-featured-carousel__active-body">
            <div className="pravaah-featured-carousel__meta"><span>{getLocation(activePackage)}</span><span>{activePackage.category}</span></div>
            <h3>{activePackage.title}</h3>
            <div className="pravaah-featured-carousel__facts">
              {activePackage.duration && <span><Clock3 className="h-4 w-4" aria-hidden="true" />{activePackage.duration}</span>}
              {getDifficulty(activePackage) && <span><Mountain className="h-4 w-4" aria-hidden="true" />{getDifficulty(activePackage)}</span>}
            </div>
            <div className="pravaah-featured-carousel__active-footer"><strong>{getPrice(activePackage)}</strong><button type="button" onClick={() => openPackage(onNavigate, activePackage)}>View details <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button></div>
          </div>
        </article>

        <section className="pravaah-featured-carousel__editorial" aria-live="polite" key={`story-${activePackage.id}`}>
          <div className="pravaah-featured-carousel__editorial-topline"><span className="pravaah-kicker">Destination story</span><span>{String(activeIndex + 1).padStart(2, '0')} / {String(realPackages.length).padStart(2, '0')}</span></div>
          <h3>{activePackage.destination || activePackage.title}</h3>
          <p className="pravaah-featured-carousel__intro">{getEditorialIntro(activePackage) || 'Journey context is being prepared from the route archive.'}</p>
          {editorialSections.length > 0 && <div className="pravaah-featured-carousel__insights">{editorialSections.map((section) => <article key={section.label}><span>{section.label}</span><p>{section.text}</p></article>)}</div>}
          <div className="pravaah-featured-carousel__editorial-footer"><div><small>Starting from</small><strong>{getPrice(activePackage)}</strong></div><div className="pravaah-featured-carousel__editorial-actions"><button type="button" className="pravaah-button pravaah-button--copper" onClick={() => onEnquire?.(activePackage)}>Enquire now <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button><button type="button" className="pravaah-outline-button pravaah-outline-button--small" onClick={() => openPackage(onNavigate, activePackage)}>View full details <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button></div></div>
        </section>

        <aside className="pravaah-featured-carousel__rail-wrap" aria-label="Other featured journeys">
          <span className="pravaah-kicker">More routes</span>
          <div ref={railRef} className="pravaah-featured-carousel__rail" role="list" tabIndex={0}>
            {items.map((item, index) => item.type === 'coming-soon' ? (
              <article key={item.id} className="pravaah-featured-carousel__rail-card pravaah-featured-carousel__rail-card--coming" role="listitem"><span>+</span><div><small>The next route</small><strong>More coming soon.</strong></div></article>
            ) : index !== activeIndex ? (
              <button key={item.pkg.id} ref={(node) => { cardRefs.current[index] = node; }} type="button" className="pravaah-featured-carousel__rail-card" role="listitem" onClick={() => selectIndex(index)} aria-label={`Select ${item.pkg.title}`}><PackageImage src={getPackageOwnedImage(item.pkg)} alt="" className="h-full w-full object-cover" loading="lazy" /><span className="pravaah-featured-carousel__rail-card__veil" /><span className="pravaah-featured-carousel__rail-card__copy"><small>{item.pkg.destination || item.pkg.location}</small><strong>{item.pkg.title}</strong><em>{getPrice(item.pkg)}</em></span><ArrowUpRight className="pravaah-featured-carousel__rail-card__arrow" aria-hidden="true" /></button>
            ) : null)}
          </div>
        </aside>
      </div>

      <div className="pravaah-featured-carousel__controls"><div className="pravaah-featured-carousel__progress" aria-live="polite"><strong>{String(activeIndex + 1).padStart(2, '0')}</strong><span>/ {String(realPackages.length).padStart(2, '0')}</span><span className="pravaah-featured-carousel__progress-line" aria-hidden="true"><span style={{ width: `${realPackages.length ? ((activeIndex + 1) / realPackages.length) * 100 : 0}%` }} /></span></div><div className="pravaah-featured-carousel__arrows"><button type="button" onClick={previous} disabled={realPackages.length < 2} aria-label="Previous featured journey"><ArrowLeft className="h-4 w-4" aria-hidden="true" /></button><button type="button" onClick={next} disabled={realPackages.length < 2} aria-label="Next featured journey"><ArrowRight className="h-4 w-4" aria-hidden="true" /></button></div></div>
    </div>
  );
}
