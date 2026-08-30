import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Quote, Star } from 'lucide-react';

export interface GoogleReviewItem {
  authorName?: string | null;
  authorPhoto?: string | null;
  rating?: number | null;
  text?: string | null;
  publishTime?: string | null;
  relativeTime?: string | null;
  authorUrl?: string | null;
}

export interface GoogleReviewsCache {
  businessName?: string | null;
  rating?: number | null;
  totalReviews?: number;
  lastSynced?: string | null;
  googleUrl?: string | null;
  reviews?: GoogleReviewItem[];
}

const DISPLAY_WORD_LIMIT = 74;


const initialsFor = (name?: string | null) => (name || 'Google reviewer')
  .trim()
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0]?.toUpperCase())
  .join('') || 'GR';

const displayText = (text?: string | null) => {
  const words = (text || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'Review text is unavailable.';
  return words.length > DISPLAY_WORD_LIMIT ? `${words.slice(0, DISPLAY_WORD_LIMIT).join(' ')}...` : words.join(' ');
};

function GoogleMark() {
  return (
    <svg
      viewBox="0 0 18 18"
      width="22"
      height="22"
      className="block h-[22px] w-[22px] min-h-[22px] min-w-[22px] max-h-[22px] max-w-[22px] shrink-0"
      style={{ width: 22, height: 22, minWidth: 22, minHeight: 22, maxWidth: 22, maxHeight: 22, flex: '0 0 22px', objectFit: 'contain' }}
      role="img"
      aria-label="Google"
    >
      <path fill="#4285F4" d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.482h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.909c1.702-1.568 2.683-3.875 2.683-6.616Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.468-.806 5.957-2.179l-2.909-2.259c-.806.54-1.835.86-3.048.86-2.344 0-4.328-1.585-5.037-3.714H.956v2.333A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.963 10.708A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.281-1.708V4.959H.956A9 9 0 0 0 0 9c0 1.452.347 2.827.956 4.041l3.007-2.333Z" />
      <path fill="#EA4335" d="M9 3.578c1.321 0 2.507.454 3.442 1.345l2.581-2.581C13.464.89 11.426 0 9 0A9 9 0 0 0 .956 4.959l3.007 2.333C4.672 5.163 6.656 3.578 9 3.578Z" />
    </svg>
  );
}

function Stars({ rating, large = false }: { rating?: number | null; large?: boolean }) {
  const filled = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return (
    <span className="flex items-center gap-0.5 text-[#e2a321]" aria-label={`${filled} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((star) => <Star key={star} className={`${large ? 'h-3.5 w-3.5' : 'h-3 w-3'} ${star < filled ? 'fill-current' : 'fill-[#f1e5cf] text-[#f1e5cf]'}`} aria-hidden="true" />)}
    </span>
  );
}

function Avatar({ review }: { review: GoogleReviewItem }) {
  const [failed, setFailed] = useState(false);
  const name = review.authorName || 'Google reviewer';
  if (!review.authorPhoto || failed) return <span className="flex h-10 w-10 min-h-10 min-w-10 max-h-10 max-w-10 shrink-0 items-center justify-center rounded-full bg-[#e7f2e1] text-[11px] font-extrabold tracking-wide text-[#397525]" aria-label={`${name} avatar`}>{initialsFor(name)}</span>;
  return <img src={review.authorPhoto} alt={`${name} avatar`} width={40} height={40} className="block h-10 w-10 min-h-10 min-w-10 max-h-10 max-w-10 shrink-0 rounded-full object-cover" loading="lazy" onError={() => setFailed(true)} />;
}

function ReviewCard({ review, featured }: { review: GoogleReviewItem; featured: boolean }) {
  const name = review.authorName || 'Google reviewer';
  const body = <article className={`relative flex h-[300px] w-full min-w-0 flex-col overflow-hidden rounded-[20px] border p-4 transition-[transform,box-shadow] duration-500 ease-out motion-reduce:transition-none ${featured ? 'border-[#c3dbb9] bg-[#f4f9f1] shadow-[0_14px_32px_rgba(54,94,39,0.12)] lg:-translate-y-1' : 'border-[#e9e2d7] bg-[#fffefa] shadow-[0_8px_24px_rgba(63,49,30,0.06)] hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(63,49,30,0.09)]'}`}>
    {featured && <span className="mb-2 w-fit rounded-full border border-[#cfe2c7] bg-white/80 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.16em] text-[#397525]">Featured review</span>}
    <Quote className={`absolute right-3.5 top-3.5 h-6 w-6 ${featured ? 'text-[#4da528]/15' : 'text-[#c8a45c]/13'}`} strokeWidth={1.2} aria-hidden="true" />
    <div className="flex min-w-0 items-center gap-2.5 pr-8"><Avatar review={review} /><div className="min-w-0"><p className="truncate text-[14px] font-extrabold text-stone-950">{name}</p><div className="mt-0.5"><Stars rating={review.rating} /></div></div></div>
    <p className={`mt-4 min-w-0 break-words line-clamp-8 text-[14px] leading-[1.6] text-stone-600 ${featured ? 'sm:text-[15px]' : ''}`}>{displayText(review.text)}</p>
    <div className="mt-auto flex items-center justify-between gap-3 border-t border-stone-200/70 pt-2.5 text-[11px] font-medium text-stone-400"><span>{review.relativeTime || review.publishTime || 'Google review'}</span><GoogleMark /></div>
  </article>;
  return review.authorUrl ? <a href={review.authorUrl} target="_blank" rel="noreferrer" className="block min-w-0 rounded-[22px] focus:outline-none focus:ring-2 focus:ring-[#4da528] focus:ring-offset-2">{body}</a> : body;
}

export default function GoogleReviews({ data }: { data: GoogleReviewsCache | null }) {
  const reviews = useMemo(() => data?.reviews || [], [data]);
  const [visibleCount, setVisibleCount] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [slideOffset, setSlideOffset] = useState(0);
  const touchStart = useRef<number | null>(null);
  const animationFrame = useRef<number | null>(null);
  const activeCount = Math.min(visibleCount, reviews.length);

  useEffect(() => {
    const update = () => setVisibleCount(window.innerWidth >= 1200 ? 3 : window.innerWidth >= 768 ? 2 : 1);
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReducedMotion(motion.matches);
    update(); updateMotion(); window.addEventListener('resize', update); motion.addEventListener('change', updateMotion);
    return () => { window.removeEventListener('resize', update); motion.removeEventListener('change', updateMotion); };
  }, []);

  useEffect(() => () => { if (animationFrame.current !== null) window.cancelAnimationFrame(animationFrame.current); }, []);

  useEffect(() => { setCurrentIndex((index) => reviews.length ? index % reviews.length : 0); }, [reviews.length]);

  const goTo = useCallback((index: number) => {
    if (reviews.length < 2) return;
    const next = (index + reviews.length) % reviews.length;
    if (next === currentIndex) return;
    if (animationFrame.current !== null) window.cancelAnimationFrame(animationFrame.current);
    setCurrentIndex(next);
    if (!reducedMotion) { setSlideOffset(index >= currentIndex ? 18 : -18); animationFrame.current = window.requestAnimationFrame(() => setSlideOffset(0)); }
  }, [currentIndex, reducedMotion, reviews.length]);

  useEffect(() => {
    if (reviews.length < 2 || paused) return undefined;
    const timer = window.setInterval(() => goTo(currentIndex + 1), 5000);
    return () => window.clearInterval(timer);
  }, [currentIndex, goTo, paused, reviews.length]);

  const offsets = activeCount >= 3 ? [-1, 0, 1] : Array.from({ length: activeCount }, (_, index) => index);
  const visibleReviews = offsets.map((offset) => reviews[(currentIndex + offset + reviews.length) % reviews.length]);
  const rating = Number(data?.rating || 0);
  const reviewCount = data?.totalReviews ?? reviews.length;

  if (!data) return <section className="bg-[#fdfbf6] py-14" id="google-business-reviews" aria-label="Google Business reviews"><div className="mx-auto max-w-[1240px] px-5 text-center"><span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#4da528]">Google Business</span><h2 className="mt-3 text-3xl font-extrabold tracking-tight text-stone-950 sm:text-[34px]">Loved by travellers, trusted by thousands</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-stone-500">Google reviews will appear here after the first successful sync.</p></div></section>;
  if (!data.rating && reviews.length === 0) return null;

  return <section className="overflow-hidden bg-[#fdfbf6] py-10 sm:py-12" id="google-business-reviews" aria-label="Google Business reviews">
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
      <header className="mx-auto max-w-[760px] text-center"><span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#4da528]">Google Business</span><h2 className="mt-2 text-[28px] font-extrabold tracking-tight text-stone-950 sm:text-[32px]">Loved by travellers, trusted by thousands</h2><p className="mx-auto mt-1.5 max-w-xl text-[14px] leading-6 text-stone-500">Real experiences from real explorers who travelled with Pravaah Travels.</p><div className="mt-3 inline-flex items-center gap-2.5 rounded-full border border-[#e8e0d3] bg-white px-3.5 py-1.5 shadow-[0_6px_16px_rgba(54,44,27,0.05)]"><Stars rating={rating} large /><span className="text-[13px] font-bold text-stone-700">{rating.toFixed(1)} <span className="mx-1 text-stone-300">·</span> {reviewCount} Google Reviews</span></div></header>
      {reviews.length > 0 ? <>
        <div className="mx-auto mt-6 w-full max-w-[980px]" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false); }}>
          <div className="relative px-9 sm:px-12 lg:px-0" onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={(event) => { if (touchStart.current === null) return; const end = event.changedTouches[0]?.clientX ?? touchStart.current; if (Math.abs(end - touchStart.current) > 40) goTo(currentIndex + (end < touchStart.current ? 1 : -1)); touchStart.current = null; }}>
            <div className="overflow-hidden"><div className="flex items-center justify-center gap-4 transition-[transform,opacity] duration-500 ease-out motion-reduce:transition-none" style={{ transform: `translateX(${slideOffset}px)`, opacity: slideOffset ? 0.72 : 1 }} aria-live="polite">{visibleReviews.map((review, offset) => { const featured = activeCount >= 3 ? offset === 1 : activeCount === 2 && offset === 0; const width = activeCount === 1 ? 'w-full max-w-[340px]' : activeCount === 2 ? 'w-[calc(50%_-_0.5rem)] max-w-[320px]' : featured ? 'w-[37%] max-w-[370px]' : 'w-[29%] max-w-[300px]'; return <div key={`${currentIndex}-${offset}-${review.authorName || 'review'}`} className={`min-w-0 shrink-0 ${width}`}><ReviewCard review={review} featured={featured} /></div>; })}</div></div>
            {reviews.length > 1 && <><button type="button" aria-label="Previous Google review" onClick={() => goTo(currentIndex - 1)} className="absolute left-0 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#ded6c9] bg-white text-stone-700 shadow-sm transition hover:border-[#4da528] hover:text-[#397525] focus:outline-none focus:ring-2 focus:ring-[#4da528] focus:ring-offset-2"><ChevronLeft className="h-4 w-4" /></button><button type="button" aria-label="Next Google review" onClick={() => goTo(currentIndex + 1)} className="absolute right-0 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#ded6c9] bg-white text-stone-700 shadow-sm transition hover:border-[#4da528] hover:text-[#397525] focus:outline-none focus:ring-2 focus:ring-[#4da528] focus:ring-offset-2"><ChevronRight className="h-4 w-4" /></button></>}
          </div>
          {reviews.length > 1 && <div className="mt-4 flex justify-center gap-2" role="tablist" aria-label="Google review carousel pages">{reviews.map((review, index) => <button key={`${review.authorName || 'review'}-${index}`} type="button" role="tab" aria-label={`Show Google review ${index + 1}`} aria-selected={index === currentIndex} onClick={() => goTo(index)} className={`h-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#4da528] focus:ring-offset-2 ${index === currentIndex ? 'w-7 bg-[#4da528]' : 'w-2 bg-[#d8d3c9] hover:bg-[#9ca690]'}`} />)}</div>}
        </div>
      </> : <p className="mt-8 text-center text-sm text-stone-500">Individual Google reviews are not available yet.</p>}
      {data.googleUrl && <div className="mt-4 text-center"><a href={data.googleUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-[#cfe0c8] bg-white px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-[0.11em] text-[#356f1d] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f4f9f0] focus:outline-none focus:ring-2 focus:ring-[#4da528] focus:ring-offset-2"><GoogleMark /> View all reviews on Google <ExternalLink className="h-3 w-3" /></a></div>}
    </div>
  </section>;
}
