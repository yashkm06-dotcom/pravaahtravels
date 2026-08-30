import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronRight, Clock, MapPin, Mountain, ShieldCheck, Users, Award, Headphones } from 'lucide-react';
import type { TravelPackage } from '../types';
import { formatPackagePrice } from '../types';
import { openPackage } from '../utils/packageRoute';

interface FeaturedPackageShowcaseProps {
  packages: TravelPackage[];
  onNavigate: (view: string, packageId?: string | null) => void;
}

const getDifficulty = (pkg: TravelPackage) => {
  const title = `${pkg.difficultyLabel || pkg.difficultyLevel || pkg.category || ''}`.trim();
  if (title) return title;
  if (String(pkg.category || '').toLowerCase().includes('trek')) return 'Moderate';
  return 'Comfort';
};

const getDuration = (pkg: TravelPackage) => pkg.duration || 'Details to be confirmed';

const getPrice = (pkg: TravelPackage) => {
  const price = Number(pkg.offerPrice || pkg.price);
  return Number.isFinite(price) && price > 0 ? formatPackagePrice(price) : 'Price on request';
};

const getLocation = (pkg: TravelPackage) => [pkg.destination, pkg.country].filter(Boolean).join(', ') || pkg.location || 'Curated destination';

const getShowcasePackages = (packages: TravelPackage[]) => packages
  .filter((pkg) => pkg.featured && pkg.active !== false)
  .slice(0, 4);

const roopkundEditorialData = {
  highlights: {
    label: 'The Mystery',
    text: 'A high-altitude lake where human remains were documented around the shoreline, inviting centuries of questions.'
  },
  science: {
    label: 'The Science',
    text: 'Research on the remains indicates more than one population and more than one period of exposure.'
  },
  folklore: {
    label: 'Myth & Folklore',
    text: 'Local traditions connect Roopkund with a divine journey; these stories are shared as cultural folklore, not proof.'
  },
  landscape: {
    label: 'The Landscape',
    text: 'Glacial terrain, alpine meadows and changing mountain weather define this demanding Himalayan route.'
  }
} as const;

const getEditorialContent = (pkg: TravelPackage) => {
  const isRoopkund = /roopkund/i.test(`${pkg.title} ${pkg.destination} ${pkg.location}`);
  if (!isRoopkund) {
    return {
      primary: { label: 'Journey Highlights', text: pkg.highlights?.[0] || pkg.shortDescription || 'A carefully planned journey with local expertise.' },
      secondary: { label: 'Why Choose It', text: pkg.overview || 'Thoughtful routes, comfortable pacing and support from our travel team.' }
    };
  }
  return {
    primary: { label: roopkundEditorialData.science.label, text: roopkundEditorialData.science.text },
    secondary: { label: roopkundEditorialData.folklore.label, text: roopkundEditorialData.folklore.text }
  };
};

const resolvePackageImage = (pkg: TravelPackage) => [
  pkg.imageUrl,
  pkg.packageBannerUrl,
  pkg.heroImage,
  ...(pkg.galleryImages || []),
  ...(pkg.gallery || [])
].find((value) => typeof value === 'string' && value.trim().length > 0)?.trim() || '';

const FeaturedPackageShowcase: React.FC<FeaturedPackageShowcaseProps> = ({ packages, onNavigate }) => {
  const showcasePackages = useMemo(() => getShowcasePackages(packages), [packages]);
  const showcasePackageSignature = useMemo(() => showcasePackages.map((pkg) => pkg.id).join('|'), [showcasePackages]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadedImage, setLoadedImage] = useState('');
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setActiveIndex(0);
    setLoadedImage('');
  }, [showcasePackageSignature]);

  const activePackage = showcasePackages[activeIndex] || null;
  const activeImage = activePackage ? resolvePackageImage(activePackage) : '';
  const editorialContent = activePackage ? getEditorialContent(activePackage) : null;
  const previewPackages = showcasePackages.filter((_, index) => index !== activeIndex).slice(0, 3);

  const goTo = useCallback((nextIndex: number) => {
    if (!showcasePackages.length) return;
    setLoadedImage('');
    setActiveIndex((nextIndex + showcasePackages.length) % showcasePackages.length);
  }, [showcasePackages.length]);

  const previous = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const next = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') previous();
      if (event.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [next, previous]);

  if (!activePackage) return null;

  return (
    <section className="relative mb-14 overflow-visible pb-4 pt-1" id="featured-showcase">
      <div className="relative mx-auto w-full max-w-[1760px]">
        <div className="relative grid gap-4 rounded-[26px] border border-stone-100 bg-white/80 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur md:grid-cols-[1fr_1.5fr] lg:grid-cols-[0.95fr_1.5fr_1.3fr] lg:p-5 xl:p-6">
          <button
            type="button"
            onClick={previous}
            aria-label="Previous featured tour"
            className="absolute left-0 top-1/2 z-20 hidden h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-900 shadow-[0_16px_34px_rgba(15,23,42,0.1)] transition hover:border-[#4DA528] hover:text-[#4DA528] lg:flex"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex min-w-0 flex-col rounded-[22px] bg-[#fffdf8] p-5 sm:p-7">
            <span className="mb-4 w-fit rounded-full bg-[#4DA528]/10 px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.08em] text-[#4DA528]">
              Featured Tour
            </span>
            <h3 className="font-serif text-[34px] font-black leading-tight tracking-[-0.03em] text-[#062116] sm:text-[42px]">
              {activePackage.title}
            </h3>
            <p className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-stone-700">
              <MapPin className="h-4 w-4 text-[#4DA528]" />
              <span className="min-w-0 truncate">{getLocation(activePackage)}</span>
            </p>
            <p className="mt-5 line-clamp-4 text-[15px] leading-7 text-stone-600">
              {activePackage.shortDescription || activePackage.overview || activePackage.destination || 'Details to be confirmed by Pravaah Travels.'}
            </p>

            <div className="mt-6 grid gap-4 text-sm text-stone-700">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#4DA528]/10 text-[#4DA528]">
                  <Clock className="h-4 w-4" />
                </span>
                <span><span className="block text-xs text-stone-500">Duration</span>{getDuration(activePackage)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#4DA528]/10 text-[#4DA528]">
                  <Users className="h-4 w-4" />
                </span>
                <span><span className="block text-xs text-stone-500">Difficulty</span>{getDifficulty(activePackage)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#4DA528]/10 text-[#4DA528]">
                  <Mountain className="h-4 w-4" />
                </span>
                <span><span className="block text-xs text-stone-500">Category</span>{activePackage.category || activePackage.homepageCategory || 'Curated Tour'}</span>
              </div>
            </div>

            <div className="mt-auto pt-6">
              <div className="rounded-[14px] bg-[#eef5e8] p-4">
                <p className="text-xs font-medium text-stone-600">Starting from</p>
                <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
                  <p className="text-[26px] font-black text-[#4DA528]">{getPrice(activePackage)} <span className="text-xs font-medium text-stone-700">/ person</span></p>
                  <button
                    type="button"
                    onClick={() => openPackage(onNavigate, activePackage)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] bg-[#4DA528] px-5 text-sm font-bold text-white shadow-[0_14px_26px_rgba(77,165,40,0.18)] transition hover:bg-[#3a8d1f]"
                  >
                    View Details
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="relative min-h-[320px] overflow-hidden rounded-[22px] bg-stone-100 sm:min-h-[440px] lg:min-h-[500px]">
            {!activeImage || failedImages.has(activePackage.id) ? (
              <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-[#eef5e8] via-stone-100 to-stone-200 p-8 text-center text-sm font-semibold text-stone-500">Image coming soon</div>
            ) : (
              <img key={activeImage} src={activeImage} alt={activePackage.title} className="h-full w-full object-cover object-center transition duration-500" referrerPolicy="no-referrer" loading="eager" decoding="async" onLoad={() => setLoadedImage(activeImage)} onError={() => setFailedImages((current) => new Set(current).add(activePackage.id))} />
            )}
            <div className="absolute inset-x-0 bottom-0 grid gap-3 bg-linear-to-t from-stone-950 via-stone-950/88 to-transparent p-4 pt-20 text-white sm:grid-cols-2 sm:p-6 sm:pt-24">
              <div className="flex gap-3 rounded-2xl border border-white/20 bg-stone-950/60 p-4 shadow-lg backdrop-blur-md">
                <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[#d9f4c9]" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#d9f4c9]">{editorialContent?.primary.label}</p>
                  <p className="mt-1 line-clamp-3 text-xs leading-5 text-white/95">
                    {editorialContent?.primary.text}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 rounded-2xl border border-white/20 bg-stone-950/60 p-4 shadow-lg backdrop-blur-md">
                <Award className="mt-1 h-5 w-5 shrink-0 text-[#d9f4c9]" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#d9f4c9]">{editorialContent?.secondary.label}</p>
                  <p className="mt-1 line-clamp-3 text-xs leading-5 text-white/95">
                    {editorialContent?.secondary.text}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:col-span-2 lg:col-span-1">
            {previewPackages.map((pkg) => {
              const realIndex = showcasePackages.findIndex((item) => item.id === pkg.id);
              const price = Number(pkg.offerPrice || pkg.price);
              const hasOffer = Number(pkg.offerPrice) > 0 && Number(pkg.price) > Number(pkg.offerPrice);
              const discount = hasOffer ? Math.round(((Number(pkg.price) - Number(pkg.offerPrice)) / Number(pkg.price)) * 100) : 0;
              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => goTo(realIndex)}
                  className="group grid min-h-[134px] grid-cols-[minmax(0,1fr)_170px] overflow-hidden rounded-[18px] border border-stone-100 bg-white text-left shadow-[0_14px_34px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-[#4DA528]/30 hover:shadow-[0_18px_38px_rgba(15,23,42,0.1)] sm:grid-cols-[minmax(0,1fr)_215px] lg:grid-cols-[minmax(0,1fr)_220px]"
                >
                  <span className="min-w-0 p-4">
                    {discount > 0 && (
                      <span className="mb-2 inline-flex rounded-full bg-[#4DA528] px-2 py-0.5 text-[10px] font-bold text-white">
                        -{discount}% OFF
                      </span>
                    )}
                    <span className="line-clamp-2 font-serif text-[18px] font-black leading-tight text-[#062116]">{pkg.title}</span>
                    <span className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-stone-600">
                      <MapPin className="h-3 w-3 text-[#4DA528]" />
                      <span className="truncate">{pkg.destination || pkg.location || 'Curated tour'}</span>
                    </span>
                    <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-600">
                      <span>{getDuration(pkg)}</span>
                      <span>{getDifficulty(pkg)}</span>
                    </span>
                    <span className="mt-2 block text-sm font-black text-[#4DA528]">{Number.isFinite(price) && price > 0 ? formatPackagePrice(price) : 'On request'}</span>
                  </span>
                  <span className="relative overflow-hidden bg-stone-100">
                    {resolvePackageImage(pkg) ? (
                      <img src={resolvePackageImage(pkg)} alt={pkg.title} className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105" referrerPolicy="no-referrer" loading="lazy" decoding="async" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center p-3 text-center text-xs font-semibold text-stone-500">Image coming soon</span>
                    )}
                    <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/92 text-[#4DA528] shadow">
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={next}
            aria-label="Next featured tour"
            className="absolute right-0 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-900 shadow-[0_16px_34px_rgba(15,23,42,0.1)] transition hover:border-[#4DA528] hover:text-[#4DA528] lg:flex"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          {showcasePackages.map((pkg, index) => (
            <button
              key={pkg.id}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Show ${pkg.title}`}
              className={`h-1.5 rounded-full transition ${index === activeIndex ? 'w-12 bg-[#4DA528]' : 'w-7 bg-stone-200 hover:bg-stone-300'}`}
            />
          ))}
        </div>

        <div className="mx-auto mt-12 grid max-w-[1020px] gap-4 rounded-[18px] border border-stone-100 bg-white/82 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)] sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'Expert Guides', text: 'Experienced specialists', Icon: Users },
            { title: 'Best Price Guarantee', text: 'No hidden charges', Icon: ShieldCheck },
            { title: 'Customizable Itineraries', text: 'Tailored to your needs', Icon: Mountain },
            { title: '24/7 Support', text: 'We are always here', Icon: Headphones },
          ].map(({ title, text, Icon }) => (
            <div key={String(title)} className="flex items-center gap-4 lg:border-r lg:border-stone-200 lg:last:border-r-0">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#4DA528]/10 text-[#4DA528]">
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-bold text-stone-900">{title}</span>
                <span className="mt-1 block text-xs text-stone-500">{text}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedPackageShowcase;
