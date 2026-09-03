import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowDown,
  ArrowRight,
  Backpack,
  Check,
  ChevronDown,
  Clock3,
  Compass,
  ExternalLink,
  Footprints,
  Gauge,
  Leaf,
  MapPin,
  Mountain,
  Navigation,
  Phone,
  ShieldCheck,
  Snowflake,
  Sparkles,
  TentTree,
  X,
} from 'lucide-react';
import type { CustomLandingPageProps } from '../registry';
import {
  ROOPKUND_BEFORE_LEAVE,
  ROOPKUND_CHECKLIST,
  ROOPKUND_EXCLUSIONS,
  ROOPKUND_FAQS,
  ROOPKUND_INCLUSIONS,
  ROOPKUND_ITINERARY,
  ROOPKUND_KNOW_BEFORE,
  ROOPKUND_LANDSCAPE_STAGES,
  ROOPKUND_MYSTERY_EVIDENCE,
  ROOPKUND_MYSTERY_IMAGES,
  ROOPKUND_MYSTERY_META,
  ROOPKUND_RESPONSIBLE,
  ROOPKUND_SAFETY,
  ROOPKUND_WHY_WALK,
} from './data/roopkundMysteryData';
import './roopkundMystery.css';

gsap.registerPlugin(ScrollTrigger);

interface ImageFrameProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
  sizes?: string;
  onClick?: () => void;
}

function ImageFrame({ src, alt, className = '', loading = 'lazy', sizes, onClick }: ImageFrameProps) {
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading');
  return (
    <div className={`rkm-image ${state === 'loaded' ? 'is-loaded' : ''} ${state === 'error' ? 'is-error' : ''} ${className}`}>
      {state !== 'error' && (
        <img
          src={src}
          alt={alt}
          loading={loading}
          fetchPriority={loading === 'eager' ? 'high' : undefined}
          decoding="async"
          sizes={sizes}
          onLoad={() => setState('loaded')}
          onError={() => setState('error')}
          onClick={onClick}
        />
      )}
      {state === 'error' && (
        <div className="rkm-image__fallback" role="img" aria-label={alt ? `${alt} unavailable` : 'Image unavailable'}>
          <Mountain aria-hidden="true" size={28} />
          <span>Image unavailable</span>
        </div>
      )}
    </div>
  );
}

const NAV_ITEMS = [
  ['story', 'Story'],
  ['mystery', 'Mystery'],
  ['itinerary', 'Itinerary'],
  ['checklist', 'Checklist'],
  ['prepare', 'Prepare'],
  ['inclusions', 'Details'],
  ['gallery', 'Gallery'],
  ['faq', 'FAQ'],
];

export default function RoopkundMysteryLandingPage({ pkg, business, onOpenEnquiry }: CustomLandingPageProps) {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [activeSection, setActiveSection] = useState('story');
  const [checkedItems, setCheckedItems] = useState<Set<string>>(() => new Set());
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const root = pageRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return undefined;
    const sections = NAV_ITEMS.map(([id]) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target.id) setActiveSection(visible.target.id);
    }, { rootMargin: '-18% 0px -62% 0px', threshold: [0.1, 0.35, 0.65] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const root = pageRef.current;
    if (!root) return undefined;
    const context = gsap.context(() => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || prefersReducedMotion;
      if (reduced) {
        gsap.set('.rkm-reveal, .rkm-hero__copy, .rkm-hero__visual', { clearProps: 'all' });
        return;
      }
      gsap.fromTo('.rkm-hero__copy', { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' });
      gsap.fromTo('.rkm-hero__visual', { opacity: 0, scale: 1.05 }, { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out' });
      gsap.utils.toArray<HTMLElement>('.rkm-reveal').forEach((element) => {
        gsap.fromTo(element, { opacity: 0, y: 22 }, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: { trigger: element, start: 'top 88%', once: true },
        });
      });
    }, root);
    return () => context.revert();
  }, [prefersReducedMotion]);

  const completedCount = checkedItems.size;
  const checklistCount = useMemo(
    () => ROOPKUND_CHECKLIST.reduce((count, group) => count + group.items.length, 0),
    [],
  );

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const toggleChecklistItem = (id: string) => {
    setCheckedItems((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleEnquiry = () => onOpenEnquiry(pkg);
  const closeLightbox = () => setLightboxIndex(null);

  useEffect(() => {
    if (lightboxIndex === null) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowRight') setLightboxIndex((index) => index === null ? 0 : (index + 1) % ROOPKUND_MYSTERY_IMAGES.length);
      if (event.key === 'ArrowLeft') setLightboxIndex((index) => index === null ? 0 : (index - 1 + ROOPKUND_MYSTERY_IMAGES.length) % ROOPKUND_MYSTERY_IMAGES.length);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex]);

  return (
    <div className="roopkund-mystery" ref={pageRef}>
      <header className="rkm-hero" aria-labelledby="rkm-hero-title">
        <div className="rkm-hero__backdrop" aria-hidden="true"><ImageFrame src={ROOPKUND_MYSTERY_META.heroImage} alt="" loading="eager" sizes="100vw" /></div>
        <div className="rkm-hero__veil" aria-hidden="true" />
        <div className="rkm-shell rkm-hero__inner">
          <div className="rkm-hero__copy">
            <p className="rkm-eyebrow rkm-eyebrow--gold"><Sparkles aria-hidden="true" size={14} /> Garhwal Himalaya · Uttarakhand</p>
            <h1 id="rkm-hero-title"><span>The Lake</span> of Mysteries</h1>
            <p className="rkm-hero__subtitle">Roopkund Trek</p>
            <p className="rkm-hero__lede">A measured seven-day expedition through forests, bugyals and a high glacial basin where science, story and silence meet.</p>
            <p className="rkm-hero__price"><span>Current expedition quote</span><strong>{ROOPKUND_MYSTERY_META.priceLabel}</strong></p>
            <div className="rkm-hero__actions">
              <motion.button type="button" className="rkm-button rkm-button--gold" onClick={handleEnquiry} whileHover={prefersReducedMotion ? undefined : { y: -2 }} whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}>
                Enquire about this trek <ArrowRight aria-hidden="true" size={16} />
              </motion.button>
              <button type="button" className="rkm-hero__link" onClick={() => scrollTo('story')}>Enter the story <ArrowDown aria-hidden="true" size={15} /></button>
            </div>
          </div>
          <div className="rkm-hero__visual" aria-label="Roopkund route facts">
            <div className="rkm-hero__route"><Navigation aria-hidden="true" size={14} /> {ROOPKUND_MYSTERY_META.route}</div>
            <div className="rkm-facts-grid">{ROOPKUND_MYSTERY_META.facts.map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
          </div>
        </div>
        <button type="button" className="rkm-scroll-cue" onClick={() => scrollTo('story')} aria-label="Scroll to the expedition story"><span>Scroll to begin</span><ArrowDown aria-hidden="true" size={16} /></button>
      </header>

      <nav className="rkm-sticky-nav" aria-label="Roopkund page sections">
        <div className="rkm-shell rkm-sticky-nav__inner">
          <span className="rkm-sticky-nav__brand">RK / 01</span>
          <div className="rkm-sticky-nav__links">{NAV_ITEMS.map(([id, label]) => <button key={id} type="button" className={activeSection === id ? 'is-active' : ''} onClick={() => scrollTo(id)}>{label}</button>)}</div>
          <button type="button" className="rkm-nav-cta" onClick={handleEnquiry}>Plan <ArrowRight aria-hidden="true" size={14} /></button>
        </div>
      </nav>

      <main>
        <section className="rkm-section rkm-story" id="story" aria-labelledby="rkm-story-title">
          <div className="rkm-shell rkm-story__grid">
            <div className="rkm-reveal"><p className="rkm-eyebrow">A route with a question</p><h2 id="rkm-story-title">Walk slowly enough to notice what the mountain keeps.</h2></div>
            <div className="rkm-story__copy rkm-reveal"><p className="rkm-lead">Roopkund is not a riddle to be solved in a headline. It is a demanding trail through the Garhwal Himalaya, and a place where archaeological evidence and living tradition ask us to hold more than one perspective at once.</p><p>Pravaah’s existing seven-day route begins and ends in Rishikesh, moving from river valley to forest, meadow, cold staging ground and the high basin beneath Trishul.</p><button type="button" className="rkm-text-link" onClick={() => scrollTo('mystery')}>Read the evidence <ArrowRight aria-hidden="true" size={15} /></button></div>
          </div>
        </section>

        <section className="rkm-section rkm-mystery" id="mystery" aria-labelledby="rkm-mystery-title">
          <div className="rkm-shell"><div className="rkm-section-heading rkm-reveal"><p className="rkm-eyebrow rkm-eyebrow--gold">Evidence / uncertainty / folklore</p><h2 id="rkm-mystery-title">A mystery deserves a clear frame.</h2><p>Three lenses, kept deliberately separate.</p></div>
            <div className="rkm-evidence-grid">
              <article className="rkm-evidence-card rkm-evidence-card--science rkm-reveal"><span className="rkm-card-index">01</span><Compass aria-hidden="true" size={22} /><h3>What science says</h3><ul>{ROOPKUND_MYSTERY_EVIDENCE.science.map((item) => <li key={item}>{item}</li>)}</ul><a href={ROOPKUND_MYSTERY_EVIDENCE.sourceUrl} target="_blank" rel="noreferrer">Read the Nature study <ExternalLink aria-hidden="true" size={13} /></a></article>
              <article className="rkm-evidence-card rkm-evidence-card--quiet rkm-reveal"><span className="rkm-card-index">02</span><Snowflake aria-hidden="true" size={22} /><h3>What remains open</h3><ul>{ROOPKUND_MYSTERY_EVIDENCE.uncertainty.map((item) => <li key={item}>{item}</li>)}</ul><span className="rkm-note">Respect before spectacle</span></article>
              <article className="rkm-evidence-card rkm-evidence-card--folklore rkm-reveal"><span className="rkm-card-index">03</span><Sparkles aria-hidden="true" size={22} /><h3>What people remember</h3><ul>{ROOPKUND_MYSTERY_EVIDENCE.folklore.map((item) => <li key={item}>{item}</li>)}</ul><span className="rkm-note">Local tradition, not proof</span></article>
            </div>
          </div>
        </section>

        <section className="rkm-section rkm-landscape" id="landscape" aria-labelledby="rkm-landscape-title">
          <div className="rkm-shell"><div className="rkm-section-heading rkm-reveal"><p className="rkm-eyebrow">The terrain changes first</p><h2 id="rkm-landscape-title">Five landscapes. One continuous line.</h2></div><div className="rkm-landscape-grid">{ROOPKUND_LANDSCAPE_STAGES.map(([index, title, copy, image]) => <article className="rkm-landscape-card rkm-reveal" key={index}><ImageFrame src={image} alt={title} sizes="(max-width: 700px) 100vw, 20vw" /><div><span>{index}</span><h3>{title}</h3><p>{copy}</p></div></article>)}</div></div>
        </section>

        <section className="rkm-section rkm-progression" aria-labelledby="rkm-progression-title">
          <div className="rkm-shell"><div className="rkm-section-heading rkm-reveal"><p className="rkm-eyebrow rkm-eyebrow--gold">Journey progression</p><h2 id="rkm-progression-title">From river light to thin air.</h2></div><div className="rkm-progression-line" aria-label="Route progression">{['Rishikesh', 'Wan', 'Ali Bugyal', 'Bhagwabasa', 'Roopkund', 'Wan → Rishikesh'].map((stop, index) => <div className="rkm-progression-stop rkm-reveal" key={stop}><span>{String(index + 1).padStart(2, '0')}</span><i aria-hidden="true" /><strong>{stop}</strong></div>)}</div></div>
        </section>

        <section className="rkm-section rkm-itinerary" id="itinerary" aria-labelledby="rkm-itinerary-title">
          <div className="rkm-shell"><div className="rkm-section-heading rkm-section-heading--split rkm-reveal"><div><p className="rkm-eyebrow">The Pravaah route</p><h2 id="rkm-itinerary-title">Seven days, honestly mapped.</h2></div><p>Each day is visible by default. Weather and trail conditions always have the final word.</p></div><div className="rkm-itinerary-list">{ROOPKUND_ITINERARY.map((day) => <article className="rkm-day-card rkm-reveal" key={day.day}><div className="rkm-day-card__number">D{String(day.day).padStart(2, '0')}</div><div className="rkm-day-card__body"><div className="rkm-day-card__top"><div><p className="rkm-eyebrow">{day.route}</p><h3>{day.title}</h3></div><ImageFrame src={day.image} alt={day.title} sizes="(max-width: 700px) 100vw, 260px" /></div><p className="rkm-day-card__description">{day.description}</p><ul className="rkm-bullet-list">{day.highlights.map((highlight) => <li key={highlight}><Check aria-hidden="true" size={14} />{highlight}</li>)}</ul><div className="rkm-day-card__meta"><span><Footprints aria-hidden="true" size={15} /> {day.distance}</span><span><Gauge aria-hidden="true" size={15} /> {day.elevation}</span><span><Clock3 aria-hidden="true" size={15} /> {day.time}</span><span><TentTree aria-hidden="true" size={15} /> {day.stay}</span><span>{day.meals}</span></div><p className="rkm-terrain"><Mountain aria-hidden="true" size={15} /><strong>Terrain</strong> {day.terrain}</p></div></article>)}</div></div>
        </section>

        <section className="rkm-section rkm-checklist" id="checklist" aria-labelledby="rkm-checklist-title">
          <div className="rkm-shell"><div className="rkm-section-heading rkm-section-heading--split rkm-reveal"><div><p className="rkm-eyebrow rkm-eyebrow--gold">Pack with intention</p><h2 id="rkm-checklist-title">Your trail checklist.</h2></div><div className="rkm-progress" aria-live="polite"><strong>{completedCount}/{checklistCount}</strong><span>items ready</span><div><i style={{ width: `${checklistCount ? (completedCount / checklistCount) * 100 : 0}%` }} /></div></div></div><div className="rkm-checklist-grid">{ROOPKUND_CHECKLIST.map((group) => <article className="rkm-checklist-group rkm-reveal" key={group.id}><div className="rkm-checklist-group__heading"><Backpack aria-hidden="true" size={18} /><div><h3>{group.title}</h3><p>{group.intro}</p></div></div><div className="rkm-check-items">{group.items.map((item) => <button type="button" key={item.id} className={checkedItems.has(item.id) ? 'is-checked' : ''} onClick={() => toggleChecklistItem(item.id)} aria-pressed={checkedItems.has(item.id)}><span className="rkm-check-box" aria-hidden="true">{checkedItems.has(item.id) && <Check size={13} />}</span><span><strong>{item.label}</strong>{item.essential && <em>Essential</em>}{item.note && <small>{item.note}</small>}</span></button>)}</div></article>)}</div></div>
        </section>

        <section className="rkm-section rkm-prepare" id="prepare" aria-labelledby="rkm-prepare-title">
          <div className="rkm-shell rkm-prepare__grid"><div className="rkm-reveal"><p className="rkm-eyebrow">Before you leave</p><h2 id="rkm-prepare-title">Preparation is part of the expedition.</h2><p className="rkm-section-intro">A clear start makes the high days more spacious.</p></div><div className="rkm-prepare__right"><div className="rkm-todo rkm-reveal">{ROOPKUND_BEFORE_LEAVE.map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, '0')}</span><p>{item}</p></div>)}</div><dl className="rkm-know-grid rkm-reveal">{ROOPKUND_KNOW_BEFORE.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></div></div>
        </section>

        <section className="rkm-section rkm-why" aria-labelledby="rkm-why-title"><div className="rkm-shell"><div className="rkm-section-heading rkm-reveal"><p className="rkm-eyebrow rkm-eyebrow--gold">Why walk this line</p><h2 id="rkm-why-title">The reward is more than the objective.</h2></div><div className="rkm-why-grid">{ROOPKUND_WHY_WALK.map(([title, copy], index) => <article key={title} className="rkm-why-card rkm-reveal"><span>0{index + 1}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>

        <section className="rkm-section rkm-details" id="inclusions" aria-labelledby="rkm-details-title"><div className="rkm-shell"><div className="rkm-section-heading rkm-reveal"><p className="rkm-eyebrow">The practical frame</p><h2 id="rkm-details-title">Know what is included.</h2></div><div className="rkm-details-grid"><article className="rkm-detail-panel rkm-reveal"><h3><Check aria-hidden="true" size={18} /> Included</h3>{ROOPKUND_INCLUSIONS.map(([title, copy]) => <div key={title}><strong>{title}</strong><p>{copy}</p></div>)}</article><article className="rkm-detail-panel rkm-detail-panel--muted rkm-reveal"><h3><X aria-hidden="true" size={18} /> Not included</h3>{ROOPKUND_EXCLUSIONS.map(([title, copy]) => <div key={title}><strong>{title}</strong><p>{copy}</p></div>)}</article></div></div></section>

        <section className="rkm-section rkm-safety" aria-labelledby="rkm-safety-title"><div className="rkm-shell rkm-safety__grid"><div className="rkm-reveal"><p className="rkm-eyebrow rkm-eyebrow--gold">Safety and stewardship</p><h2 id="rkm-safety-title">The mountain is the authority.</h2><p className="rkm-section-intro">Good expedition design leaves room to change course.</p></div><div className="rkm-safety__right"><div className="rkm-safety-list rkm-reveal">{ROOPKUND_SAFETY.map(([title, copy]) => <div key={title}><ShieldCheck aria-hidden="true" size={19} /><span><strong>{title}</strong><p>{copy}</p></span></div>)}</div><div className="rkm-responsible rkm-reveal"><h3><Leaf aria-hidden="true" size={18} /> Responsible travel</h3><ul>{ROOPKUND_RESPONSIBLE.map((item) => <li key={item}>{item}</li>)}</ul></div></div></div></section>

        <section className="rkm-section rkm-gallery" id="gallery" aria-labelledby="rkm-gallery-title"><div className="rkm-shell"><div className="rkm-section-heading rkm-section-heading--split rkm-reveal"><div><p className="rkm-eyebrow">Field notes</p><h2 id="rkm-gallery-title">The route, in changing light.</h2></div><p>Open an image for a closer look. Local route imagery is intentionally kept separate from package data.</p></div><div className="rkm-gallery-grid">{ROOPKUND_MYSTERY_IMAGES.map((image, index) => <button type="button" className={`rkm-gallery-tile rkm-gallery-tile--${index + 1} rkm-reveal`} key={image.src} onClick={() => setLightboxIndex(index)} aria-label={`Open image: ${image.alt}`}><ImageFrame src={image.src} alt={image.alt} sizes="(max-width: 700px) 50vw, 25vw" /><span>{String(index + 1).padStart(2, '0')}</span></button>)}</div></div></section>

        <section className="rkm-section rkm-faq" id="faq" aria-labelledby="rkm-faq-title"><div className="rkm-shell rkm-faq__grid"><div className="rkm-reveal"><p className="rkm-eyebrow">Useful before you decide</p><h2 id="rkm-faq-title">Questions, answered plainly.</h2><p className="rkm-section-intro">Still unsure? The enquiry desk can talk through readiness, dates and conditions.</p><button type="button" className="rkm-button rkm-button--outline" onClick={handleEnquiry}>Talk to Pravaah <ArrowRight aria-hidden="true" size={16} /></button></div><div className="rkm-faq-list rkm-reveal">{ROOPKUND_FAQS.map(([question, answer], index) => <div className={`rkm-faq-item ${openFaq === index ? 'is-open' : ''}`} key={question}><h3><button type="button" onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index}>{question}<ChevronDown aria-hidden="true" size={17} /></button></h3>{openFaq === index && <p>{answer}</p>}</div>)}</div></div></section>

        <section className="rkm-enquiry" id="enquire" aria-labelledby="rkm-enquiry-title"><div className="rkm-shell rkm-enquiry__inner"><div className="rkm-reveal"><p className="rkm-eyebrow rkm-eyebrow--gold">A considered next step</p><h2 id="rkm-enquiry-title">Ready to meet the mystery?</h2><p>Tell us your dates, group size and previous mountain experience. We will respond with the current operating plan, quote and readiness guidance.</p></div><div className="rkm-enquiry__actions rkm-reveal"><motion.button type="button" className="rkm-button rkm-button--gold" onClick={handleEnquiry} whileHover={prefersReducedMotion ? undefined : { y: -2 }}>Start an enquiry <ArrowRight aria-hidden="true" size={16} /></motion.button>{business.whatsappUrl() && <a className="rkm-button rkm-button--ghost" href={business.whatsappUrl('Hi Pravaah Travels, I am enquiring about the Roopkund Trek.')} target="_blank" rel="noreferrer"><Phone aria-hidden="true" size={16} /> WhatsApp the desk</a>}</div></div></section>
      </main>

      <footer className="rkm-footer"><div className="rkm-shell rkm-footer__grid"><div><div className="rkm-footer__brand"><span>PRAVAAH</span><small>TRAVELS</small></div><p>{business.tagline || 'Journeys designed with local knowledge and mountain respect.'}</p></div><div><strong>Roopkund / 01</strong><span>{business.address}</span>{business.phoneHref && <a href={business.phoneHref}>{business.phone}</a>}{business.email && <a href={`mailto:${business.email}`}>{business.email}</a>}</div><div><strong>Explore</strong><button type="button" onClick={() => scrollTo('itinerary')}>Itinerary <ArrowRight aria-hidden="true" size={13} /></button><button type="button" onClick={() => scrollTo('checklist')}>Checklist <ArrowRight aria-hidden="true" size={13} /></button><button type="button" onClick={handleEnquiry}>Enquire <ArrowRight aria-hidden="true" size={13} /></button></div></div><div className="rkm-shell rkm-footer__bottom"><span>© {new Date().getFullYear()} {business.companyName}</span><span>Built for the trail, not the spectacle.</span></div></footer>

      {lightboxIndex !== null && <div className="rkm-lightbox" role="dialog" aria-modal="true" aria-label="Roopkund gallery viewer" onClick={closeLightbox}><div className="rkm-lightbox__panel" onClick={(event) => event.stopPropagation()}><button type="button" className="rkm-lightbox__close" onClick={closeLightbox} aria-label="Close gallery"><X aria-hidden="true" size={20} /></button><ImageFrame src={ROOPKUND_MYSTERY_IMAGES[lightboxIndex].src} alt={ROOPKUND_MYSTERY_IMAGES[lightboxIndex].alt} loading="eager" sizes="90vw" /><div className="rkm-lightbox__caption"><span>{String(lightboxIndex + 1).padStart(2, '0')} / {String(ROOPKUND_MYSTERY_IMAGES.length).padStart(2, '0')}</span><p>{ROOPKUND_MYSTERY_IMAGES[lightboxIndex].alt}</p></div></div></div>}
    </div>
  );
}
