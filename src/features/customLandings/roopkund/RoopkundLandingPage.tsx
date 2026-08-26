import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Compass,
  ExternalLink,
  Footprints,
  Instagram,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Mountain,
  Phone,
  Route,
  Share2,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { formatPrice } from '../../../types';
import { getTravelImage, handleTravelImageError } from '../../../utils/imageFallback';
import { isStaging } from '../../../lib/environment';
import type { CustomLandingPageProps } from '../registry';
import { ROOPKUND_EDITORIAL, ROOPKUND_FACTS_AWAITING_REVIEW } from './roopkundLandingContent';
import './roopkund.css';

const FALLBACK_HERO = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=86';

const sectionLinks = [
  ['story', 'The story'],
  ['route', 'The route'],
  ['itinerary', 'Journal'],
  ['prepare', 'Prepare'],
  ['enquire', 'Enquire'],
] as const;

const scrollToSection = (sectionId: string, reducedMotion: boolean | null) => {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
};

const isReviewPlaceholder = (value: unknown) => /review|confirm|pending|available soon/i.test(String(value ?? ''));

export default function RoopkundLandingPage({
  pkg,
  business,
  onNavigate,
  onOpenEnquiry,
}: CustomLandingPageProps) {
  const reducedMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeDay, setActiveDay] = useState<number | null>(pkg.itinerary?.[0]?.day ?? null);
  const [checkedGear, setCheckedGear] = useState<Set<number>>(new Set());
  const [shareStatus, setShareStatus] = useState('');

  const heroImage = getTravelImage(pkg.packageBannerUrl || pkg.heroImage || pkg.imageUrl || FALLBACK_HERO);
  const gallery = useMemo(() => {
    const candidates = [
      heroImage,
      ...(pkg.galleryImages || []),
      ...(pkg.gallery || []),
      pkg.imageUrl,
    ].map((value) => String(value ?? '').trim()).filter(Boolean);
    return Array.from(new Set(candidates));
  }, [heroImage, pkg.gallery, pkg.galleryImages, pkg.imageUrl]);

  const packageFacts = [
    { label: 'Destination', value: pkg.destination || pkg.location || 'Under review', icon: MapPin },
    { label: 'Duration', value: pkg.duration || 'Under review', icon: CalendarDays },
    { label: 'Difficulty', value: pkg.difficultyLabel || (pkg.difficultyLevel ? `Level ${pkg.difficultyLevel}` : 'Under review'), icon: Mountain },
    { label: 'Investment', value: pkg.price > 0 ? `From ${formatPrice(pkg.offerPrice || pkg.price)}` : 'On request', icon: Compass },
  ];

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(documentHeight > 0 ? Math.min(100, (window.scrollY / documentHeight) * 100) : 0);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  const handleShare = async () => {
    const shareData = {
      title: pkg.seoTitle || `${pkg.title} | ${business.companyName}`,
      text: pkg.shortDescription,
      url: 'https://pravaahtravels.com/roopkund-trek',
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareStatus('Shared');
      } else {
        await navigator.clipboard.writeText(shareData.url);
        setShareStatus('Link copied');
      }
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') setShareStatus('Unable to share');
    }
    window.setTimeout(() => setShareStatus(''), 1800);
  };

  const toggleGear = (index: number) => {
    setCheckedGear((previous) => {
      const next = new Set(previous);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const renderLogo = (compact = false) => (
    <button
      type="button"
      onClick={() => onNavigate('home')}
      className="flex items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bd6f4d] focus-visible:ring-offset-4 focus-visible:ring-offset-[#f7f3eb]"
      aria-label={`Return to ${business.companyName} home`}
    >
      <span className={`${compact ? 'h-9 w-9' : 'h-11 w-11'} flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 p-1.5`}>
        {business.logoUrl ? (
          <img src={business.logoUrl} alt="" className="h-full w-full object-contain" referrerPolicy="no-referrer" onError={handleTravelImageError} />
        ) : (
          <Compass className="h-5 w-5" aria-hidden="true" />
        )}
      </span>
      <span>
        <span className="rk-display block text-lg font-semibold leading-none">{business.companyName}</span>
        <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.26em] opacity-65">Expedition journal</span>
      </span>
    </button>
  );

  return (
    <div className="roopkund-landing min-h-screen">
      <div
        className="fixed left-0 z-[99] h-[3px] bg-[#bd6f4d] transition-[width] duration-100 rk-no-print"
        style={{ width: `${progress}%`, top: isStaging ? '24px' : 0 }}
        aria-hidden="true"
      />

      <nav
        className="sticky z-[90] border-b border-stone-900/10 bg-[#f7f3eb]/92 px-4 py-3 text-[#17211d] shadow-[0_10px_30px_rgba(20,37,29,0.08)] backdrop-blur-xl sm:px-6 lg:px-8 rk-no-print"
        style={{ top: isStaging ? '24px' : 0 }}
        aria-label="Roopkund landing page navigation"
      >
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-5">
          {renderLogo(true)}
          <div className="hidden items-center gap-7 lg:flex">
            {sectionLinks.map(([id, label]) => (
              <button key={id} type="button" onClick={() => scrollToSection(id, reducedMotion)} className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-600 transition hover:text-[#bd6f4d]">
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleShare} className="hidden h-10 items-center gap-2 rounded-full border border-stone-300 px-4 text-[10px] font-extrabold uppercase tracking-[0.14em] transition hover:border-[#bd6f4d] hover:text-[#bd6f4d] sm:flex" aria-label="Share expedition page">
              <Share2 className="h-3.5 w-3.5" />
              {shareStatus || 'Share'}
            </button>
            <button type="button" onClick={() => onOpenEnquiry(pkg)} className="hidden rounded-full bg-[#173e2d] px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white transition hover:bg-[#bd6f4d] sm:block">
              Enquire
            </button>
            <button type="button" onClick={() => setMenuOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 lg:hidden" aria-label="Open page menu">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-[10000] bg-[#12251b]/96 p-6 text-white backdrop-blur-xl rk-no-print" role="dialog" aria-modal="true" aria-label="Roopkund page menu">
          <div className="mx-auto flex h-full max-w-lg flex-col">
            <div className="flex items-center justify-between">
              {renderLogo(true)}
              <button type="button" onClick={() => setMenuOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20" aria-label="Close page menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="my-auto space-y-2">
              {sectionLinks.map(([id, label], index) => (
                <button key={id} type="button" onClick={() => { setMenuOpen(false); window.setTimeout(() => scrollToSection(id, reducedMotion), 30); }} className="rk-display flex w-full items-center gap-5 border-b border-white/12 py-5 text-left text-3xl">
                  <span className="text-xs font-sans text-white/45">0{index + 1}</span>{label}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => { setMenuOpen(false); onOpenEnquiry(pkg); }} className="rounded-full bg-[#bd6f4d] px-6 py-4 text-xs font-extrabold uppercase tracking-[0.2em]">Start an enquiry</button>
          </div>
        </div>
      )}

      <header id="hero" className="relative min-h-[calc(100vh-68px)] overflow-hidden bg-[#12251b] text-white">
        <img src={heroImage} alt={`${pkg.title} mountain landscape`} className="absolute inset-0 h-full w-full object-cover" referrerPolicy="no-referrer" onError={handleTravelImageError} />
        <div className="absolute inset-0 bg-linear-to-r from-[#0c1d15]/96 via-[#0c1d15]/68 to-[#0c1d15]/20" />
        <div className="absolute inset-0 rk-grain rk-contour" />
        <div className="relative mx-auto flex min-h-[calc(100vh-68px)] max-w-[1440px] items-end px-4 pb-14 pt-24 sm:px-6 sm:pb-20 lg:px-8">
          <div className="grid w-full items-end gap-12 lg:grid-cols-[1.25fr_0.75fr]">
            <motion.div initial={reducedMotion ? false : { opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75 }} className="max-w-4xl">
              <div className="mb-7 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[9px] font-extrabold uppercase tracking-[0.26em] backdrop-blur">{ROOPKUND_EDITORIAL.eyebrow}</span>
                <span className="rounded-full border border-amber-200/30 bg-amber-200/10 px-4 py-2 text-[9px] font-extrabold uppercase tracking-[0.2em] text-amber-100 backdrop-blur">Factual review in progress</span>
              </div>
              <h1 className="rk-display text-[clamp(3.8rem,10vw,9rem)] font-medium leading-[0.82] tracking-[-0.055em]">{pkg.title}</h1>
              <p className="rk-display mt-7 max-w-2xl text-2xl italic leading-relaxed text-[#e8dfce] sm:text-3xl">{ROOPKUND_EDITORIAL.titleAccent}</p>
              <p className="mt-6 max-w-2xl text-sm leading-8 text-white/72 sm:text-base">{pkg.shortDescription || ROOPKUND_EDITORIAL.introduction}</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={() => scrollToSection('story', reducedMotion)} className="inline-flex items-center justify-center gap-3 rounded-full bg-[#bd6f4d] px-7 py-4 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white transition hover:bg-[#a95a3d]">
                  Enter the trail <ArrowDown className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => onOpenEnquiry(pkg)} className="inline-flex items-center justify-center gap-3 rounded-full border border-white/30 bg-white/8 px-7 py-4 text-[11px] font-extrabold uppercase tracking-[0.18em] backdrop-blur transition hover:bg-white hover:text-[#17211d]">
                  Plan this journey <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[28px] border border-white/15 bg-white/15 backdrop-blur-xl">
              {packageFacts.map(({ label, value, icon: Icon }) => (
                <div key={label} className="min-h-32 bg-[#0c1d15]/55 p-5 sm:p-6">
                  <Icon className="h-5 w-5 text-[#d7b66f]" />
                  <p className="mt-5 text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/45">{label}</p>
                  <p className={`mt-2 text-sm font-semibold leading-6 ${isReviewPlaceholder(value) ? 'text-amber-100' : 'text-white'}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main>
        <section id="story" className="relative overflow-hidden bg-[#14271d] py-24 text-white sm:py-32">
          <div className="absolute inset-0 rk-contour opacity-45" />
          <div className="relative mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
            <div className="grid gap-14 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
              <div className="lg:sticky lg:top-32">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-[#d7b66f]">The atmosphere</span>
                <h2 className="rk-display mt-6 text-5xl leading-[0.95] sm:text-7xl">A mystery told in layers.</h2>
                <p className="mt-7 max-w-md text-sm leading-8 text-white/65">{ROOPKUND_EDITORIAL.introduction}</p>
              </div>
              <div className="space-y-5">
                {ROOPKUND_EDITORIAL.mysteryChapters.map((chapter, index) => (
                  <motion.article key={chapter.number} initial={reducedMotion ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ delay: index * 0.08 }} className="grid gap-5 rounded-[28px] border border-white/12 bg-white/[0.055] p-6 backdrop-blur sm:grid-cols-[84px_1fr] sm:p-8">
                    <span className="rk-display text-5xl text-[#d7b66f]">{chapter.number}</span>
                    <div>
                      <h3 className="rk-display text-3xl">{chapter.title}</h3>
                      <p className="mt-4 text-sm leading-8 text-white/62">{chapter.description}</p>
                    </div>
                  </motion.article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="route" className="py-24 sm:py-32">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-[#bd6f4d]">Not a generic tour</span>
                <h2 className="rk-display mt-5 max-w-3xl text-5xl leading-none sm:text-7xl">An expedition journal, grounded in one package record.</h2>
              </div>
              <p className="max-w-md text-sm leading-8 text-stone-600">Every stage below is derived from the day-wise itinerary managed in Pravaah’s package CMS. No alternate distance or altitude dataset is embedded in this page.</p>
            </div>

            <div className="mt-16 h-px w-full rk-route-line" />
            {pkg.itinerary?.length ? (
              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {pkg.itinerary.map((day, index) => (
                  <article key={`${day.day}-${day.title}`} className="rk-card-glow rounded-[26px] border border-stone-200 bg-white p-6">
                    <div className="flex items-center justify-between">
                      <span className="rk-display text-4xl text-[#bd6f4d]">{String(day.day).padStart(2, '0')}</span>
                      <Route className="h-5 w-5 text-[#7f9a6d]" />
                    </div>
                    <h3 className="rk-display mt-8 text-2xl">{day.title}</h3>
                    {day.location && <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7f9a6d]">{day.location}</p>}
                    <p className="mt-4 line-clamp-4 text-sm leading-7 text-stone-600">{day.description}</p>
                    <button type="button" onClick={() => { setActiveDay(day.day); scrollToSection('itinerary', reducedMotion); }} className="mt-6 inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#173e2d]">
                      Open chapter <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-10 rounded-[30px] border border-dashed border-[#bd6f4d]/45 bg-[#bd6f4d]/6 p-8 sm:p-10">
                <ClipboardCheck className="h-8 w-8 text-[#bd6f4d]" />
                <h3 className="rk-display mt-5 text-3xl">Verified route chapters are being prepared.</h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">The staging record intentionally contains no invented itinerary. Once the route is reviewed in the package CMS, this section will populate automatically.</p>
              </div>
            )}
          </div>
        </section>

        <section id="itinerary" className="bg-[#e8dfce] py-24 sm:py-32">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-[#bd6f4d]">The expedition journal</span>
                <h2 className="rk-display mt-5 text-5xl leading-none sm:text-7xl">Day by day, when verified.</h2>
                <p className="mt-6 max-w-lg text-sm leading-8 text-stone-600">Select a chapter to read the current Firestore itinerary. Empty records remain visibly under review.</p>
                <div className="mt-8 flex flex-wrap gap-2">
                  {(pkg.itinerary || []).map((day) => (
                    <button key={day.day} type="button" onClick={() => setActiveDay(day.day)} className={`flex h-11 min-w-11 items-center justify-center rounded-full border px-4 text-xs font-extrabold transition ${activeDay === day.day ? 'border-[#173e2d] bg-[#173e2d] text-white' : 'border-stone-400/50 bg-white/35 text-stone-700 hover:border-[#bd6f4d]'}`} aria-pressed={activeDay === day.day}>
                      Day {day.day}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-hidden rounded-[32px] bg-[#173e2d] text-white shadow-[0_30px_90px_rgba(23,62,45,0.22)]">
                {pkg.itinerary?.length ? (() => {
                  const day = pkg.itinerary.find((item) => item.day === activeDay) || pkg.itinerary[0];
                  const dayImage = getTravelImage(day.images?.[0] || gallery[(day.day - 1) % gallery.length] || heroImage);
                  return (
                    <div>
                      <div className="relative h-72 sm:h-96">
                        <img src={dayImage} alt={day.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" onError={handleTravelImageError} />
                        <div className="absolute inset-0 bg-linear-to-t from-[#173e2d] via-transparent to-transparent" />
                        <span className="absolute bottom-5 left-6 text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/75">Chapter {String(day.day).padStart(2, '0')}</span>
                      </div>
                      <div className="p-7 sm:p-10">
                        <h3 className="rk-display text-4xl sm:text-5xl">{day.title}</h3>
                        {day.location && <p className="mt-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#d7b66f]">{day.location}</p>}
                        <p className="mt-6 text-sm leading-8 text-white/70">{day.description}</p>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="flex min-h-[520px] items-center justify-center p-8 text-center">
                    <div className="max-w-md">
                      <Footprints className="mx-auto h-10 w-10 text-[#d7b66f]" />
                      <h3 className="rk-display mt-6 text-4xl">Journal pending review</h3>
                      <p className="mt-4 text-sm leading-8 text-white/65">No route chapters are shown until the canonical package itinerary is verified.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden bg-[#102219] py-24 text-white sm:py-32" aria-labelledby="altitude-profile-title">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.65fr_1.35fr] lg:items-center">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-[#d7b66f]">Altitude profile</span>
                <h2 id="altitude-profile-title" className="rk-display mt-5 text-5xl leading-none sm:text-6xl">The line is waiting for verified coordinates.</h2>
                <p className="mt-6 text-sm leading-8 text-white/62">The original concept contained conflicting elevation and distance values. This neutral schematic preserves the visual section without publishing those numbers.</p>
              </div>
              <div className="relative overflow-hidden rounded-[30px] border border-white/12 bg-white/[0.055] p-5 sm:p-9">
                <svg viewBox="0 0 800 320" role="img" aria-label="Decorative route profile awaiting verified altitude data" className="w-full">
                  <defs>
                    <linearGradient id="rk-profile-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#d7b66f" stopOpacity="0.36" />
                      <stop offset="1" stopColor="#d7b66f" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[70, 140, 210, 280].map((y) => <line key={y} x1="20" x2="780" y1={y} y2={y} stroke="rgba(255,255,255,.1)" />)}
                  <path d="M20 270 C100 250 130 225 210 230 S340 185 420 205 S545 125 620 150 S710 90 780 112 L780 300 L20 300 Z" fill="url(#rk-profile-fill)" />
                  <path className="rk-elevation-path" d="M20 270 C100 250 130 225 210 230 S340 185 420 205 S545 125 620 150 S710 90 780 112" fill="none" stroke="#d7b66f" strokeWidth="4" strokeLinecap="round" />
                </svg>
                <div className="mt-4 flex items-center gap-3 rounded-[18px] border border-amber-200/20 bg-amber-100/8 p-4 text-xs leading-6 text-amber-50">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-[#d7b66f]" />
                  Verified elevation and acclimatization data will be supplied through the package record after operational review.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-[#bd6f4d]">More than a destination</span>
              <h2 className="rk-display mt-5 text-5xl leading-none sm:text-7xl">The moments between milestones.</h2>
            </div>
            <div className="mt-14 grid gap-5 md:grid-cols-2">
              {ROOPKUND_EDITORIAL.experiences.map((experience, index) => (
                <motion.article key={experience.title} initial={reducedMotion ? false : { opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.2 }} className="group relative min-h-[360px] overflow-hidden rounded-[30px] bg-[#173e2d] text-white">
                  <img src={gallery[index % gallery.length] || heroImage} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" referrerPolicy="no-referrer" onError={handleTravelImageError} />
                  <div className="absolute inset-0 bg-linear-to-t from-[#0c1d15]/94 via-[#0c1d15]/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-7 sm:p-9">
                    <span className="text-[9px] font-extrabold uppercase tracking-[0.24em] text-[#d7b66f]">{experience.label}</span>
                    <h3 className="rk-display mt-3 text-4xl">{experience.title}</h3>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="prepare" className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
            <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-[#bd6f4d]">Pack for the mountain</span>
                <h2 className="rk-display mt-5 text-5xl leading-none sm:text-7xl">A checklist owned by the package.</h2>
                <p className="mt-6 text-sm leading-8 text-stone-600">Gear entries appear here only when they have been added to the canonical package. Your checks stay on this device for the current visit only.</p>
                {pkg.thingsToCarry?.length ? (
                  <div className="mt-8 h-2 overflow-hidden rounded-full bg-stone-100">
                    <div className="h-full rounded-full bg-[#7f9a6d] transition-all" style={{ width: `${(checkedGear.size / pkg.thingsToCarry.length) * 100}%` }} />
                  </div>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {pkg.thingsToCarry?.length ? pkg.thingsToCarry.map((item, index) => {
                  const checked = checkedGear.has(index);
                  return (
                    <button key={`${item}-${index}`} type="button" onClick={() => toggleGear(index)} className={`flex items-start gap-4 rounded-[22px] border p-5 text-left transition ${checked ? 'border-[#7f9a6d] bg-[#7f9a6d]/10' : 'border-stone-200 bg-[#f7f3eb]/55 hover:border-[#7f9a6d]'}`} aria-pressed={checked}>
                      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${checked ? 'border-[#173e2d] bg-[#173e2d] text-white' : 'border-stone-300'}`}>
                        {checked && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <span className={`text-sm font-semibold leading-6 ${checked ? 'text-stone-500 line-through' : 'text-stone-800'}`}>{item}</span>
                    </button>
                  );
                }) : (
                  <div className="col-span-full rounded-[28px] border border-dashed border-stone-300 bg-stone-50 p-8">
                    <h3 className="rk-display text-3xl">Packing guidance under review</h3>
                    <p className="mt-3 text-sm leading-7 text-stone-600">No equipment list is published until it is confirmed by the operator.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-20 grid gap-6 lg:grid-cols-2">
              {[
                { title: 'Included', items: pkg.inclusions || [], positive: true },
                { title: 'Not included', items: pkg.exclusions || [], positive: false },
              ].map(({ title, items, positive }) => (
                <article key={title} className={`rounded-[30px] border p-7 sm:p-9 ${positive ? 'border-[#7f9a6d]/35 bg-[#7f9a6d]/8' : 'border-[#bd6f4d]/25 bg-[#bd6f4d]/6'}`}>
                  <h3 className="rk-display text-4xl">{title}</h3>
                  {items.length ? (
                    <ul className="mt-7 space-y-4">
                      {items.map((item, index) => (
                        <li key={`${item}-${index}`} className="flex gap-3 text-sm leading-7 text-stone-650">
                          {positive ? <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#527d55]" /> : <X className="mt-1 h-4 w-4 shrink-0 text-[#bd6f4d]" />}
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="mt-5 text-sm leading-7 text-stone-500">To be confirmed in the canonical package record.</p>}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#e8dfce] py-24 sm:py-32">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr]">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-[#bd6f4d]">Responsible publication</span>
                <h2 className="rk-display mt-5 text-5xl leading-none sm:text-7xl">Respect the altitude. Verify the details.</h2>
                <p className="mt-6 text-sm leading-8 text-stone-600">High-altitude travel requires current professional guidance. This page intentionally provides no medication, dosage, oxygen-threshold or emergency-protocol instructions.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {ROOPKUND_FACTS_AWAITING_REVIEW.map((item) => (
                  <div key={item} className="flex gap-3 rounded-[20px] border border-stone-300/70 bg-white/55 p-5">
                    <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#bd6f4d]" />
                    <span className="text-sm font-semibold leading-6 text-stone-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {pkg.faqs?.length ? (
          <section className="py-24 sm:py-32">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-[#bd6f4d]">Current package guidance</span>
                <h2 className="rk-display mt-5 text-5xl sm:text-7xl">Questions, answered from Firestore.</h2>
              </div>
              <div className="mt-12 space-y-3">
                {pkg.faqs.map((faq, index) => (
                  <details key={`${faq.question}-${index}`} className="group rounded-[22px] border border-stone-200 bg-white p-6 open:border-[#7f9a6d]">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-stone-900">
                      {faq.question}<ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" />
                    </summary>
                    <p className="mt-5 border-t border-stone-100 pt-5 text-sm leading-8 text-stone-600">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="bg-[#173e2d] py-24 text-white sm:py-32">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-[#d7b66f]">Why {business.companyName}</span>
                <h2 className="rk-display mt-5 text-5xl leading-none sm:text-7xl">Clarity before commitment.</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {ROOPKUND_EDITORIAL.principles.map((principle) => (
                  <article key={principle.title} className="rounded-[24px] border border-white/12 bg-white/[0.055] p-6">
                    <Sparkles className="h-5 w-5 text-[#d7b66f]" />
                    <h3 className="rk-display mt-7 text-2xl">{principle.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-white/62">{principle.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="enquire" className="relative overflow-hidden py-24 sm:py-32">
          <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-16" referrerPolicy="no-referrer" onError={handleTravelImageError} />
          <div className="absolute inset-0 bg-[#f7f3eb]/90" />
          <div className="relative mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-[36px] border border-stone-200 bg-white shadow-[0_34px_110px_rgba(23,62,45,0.17)]">
              <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
                <div className="p-7 sm:p-11 lg:p-14">
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-[#bd6f4d]">Walk the mystery trail</span>
                  <h2 className="rk-display mt-5 text-5xl leading-none sm:text-7xl">Start with a real conversation.</h2>
                  <p className="mt-6 max-w-xl text-sm leading-8 text-stone-600">The enquiry form writes to Pravaah’s existing secured Firestore flow. It does not simulate a confirmation or promise an unverified response time.</p>
                  <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                    <button type="button" onClick={() => onOpenEnquiry(pkg)} className="inline-flex items-center justify-center gap-3 rounded-full bg-[#173e2d] px-7 py-4 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white transition hover:bg-[#bd6f4d]">
                      Open secure enquiry <ArrowRight className="h-4 w-4" />
                    </button>
                    {business.whatsappDigits && (
                      <a href={business.whatsappUrl(`Hello ${business.companyName}, I would like current information about ${pkg.title}.`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-3 rounded-full border border-stone-300 px-7 py-4 text-[11px] font-extrabold uppercase tracking-[0.18em] text-stone-700 transition hover:border-[#173e2d]">
                        <MessageCircle className="h-4 w-4" /> WhatsApp
                      </a>
                    )}
                  </div>
                </div>
                <aside className="bg-[#14271d] p-7 text-white sm:p-11 lg:p-14">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#d7b66f]">Current contact</p>
                  <h3 className="rk-display mt-5 text-4xl">{business.companyName}</h3>
                  <div className="mt-8 space-y-5 text-sm text-white/70">
                    {business.phoneHref && <a href={business.phoneHref} className="flex items-center gap-3 transition hover:text-white"><Phone className="h-4 w-4 text-[#d7b66f]" />{business.phone}</a>}
                    {business.email && <a href={`mailto:${business.email}`} className="flex items-center gap-3 transition hover:text-white"><Mail className="h-4 w-4 text-[#d7b66f]" />{business.email}</a>}
                    {business.address && <p className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#d7b66f]" />{business.address}</p>}
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#0b1d14] px-4 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div>
            {renderLogo()}
            <p className="mt-6 max-w-lg text-sm leading-7 text-white/55">{business.tagline}</p>
          </div>
          <div className="flex flex-col items-start gap-4 md:items-end">
            <button type="button" onClick={() => onNavigate('packages')} className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#d7b66f]">
              <ArrowLeft className="h-4 w-4" /> All packages
            </button>
            <div className="flex flex-wrap gap-3">
              {business.socialLinks.map((item) => (
                <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/65 transition hover:border-[#d7b66f] hover:text-[#d7b66f]" aria-label={item.label}>
                  {item.label === 'Instagram' ? <Instagram className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                </a>
              ))}
            </div>
            <p className="text-xs text-white/40">© {new Date().getFullYear()} {business.companyName}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
