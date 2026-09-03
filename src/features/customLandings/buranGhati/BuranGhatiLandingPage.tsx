import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowDown,
  ArrowRight,
  ChevronDown,
  Compass,
  Instagram,
  Mail,
  MapPin,
  Mountain,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  TentTree,
  Users,
} from 'lucide-react';
import type { CustomLandingPageProps } from '../registry';
import { BuranGhatiItinerary } from './components/BuranGhatiItinerary';
import {
  BURAN_CHAPTERS,
  BURAN_FAQS,
  BURAN_GHATI_IMAGES,
  BURAN_PRACTICAL_POINTS,
  type BuranImage,
} from './data/buranGhatiData';
import './buranGhati.css';

gsap.registerPlugin(ScrollTrigger);

interface ImageFrameProps {
  image: BuranImage;
  className?: string;
  loading?: 'eager' | 'lazy';
  sizes?: string;
}

function ImageFrame({ image, className = '', loading = 'lazy', sizes }: ImageFrameProps) {
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading');

  return (
    <figure className={`buran-image-frame ${state === 'loaded' ? 'is-loaded' : ''} ${state === 'error' ? 'is-error' : ''} ${className}`}>
      {state !== 'error' && (
        <img
          src={image.src}
          alt={image.alt}
          loading={loading}
          decoding="async"
          sizes={sizes}
          onLoad={() => setState('loaded')}
          onError={() => setState('error')}
        />
      )}
      {state === 'error' && (
        <div className="buran-image-placeholder" role="img" aria-label={`${image.alt} unavailable`}>
          <Mountain aria-hidden="true" size={28} />
          <span>Route image unavailable</span>
        </div>
      )}
      {image.credit && state === 'loaded' && <figcaption>{image.credit}</figcaption>}
    </figure>
  );
}

export default function BuranGhatiLandingPage({
  pkg,
  business,
  onNavigate,
  onOpenEnquiry,
}: CustomLandingPageProps) {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const prefersReducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const root = pageRef.current;
    if (!root) return undefined;
    const context = gsap.context(() => {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reducedMotion) {
        gsap.set('.buran-reveal, .buran-hero__image, .buran-hero__copy', { clearProps: 'all' });
        return;
      }

      gsap.fromTo('.buran-hero__copy', { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out' });
      gsap.fromTo('.buran-hero__facts > *', { y: 18, opacity: 0 }, {
        y: 0,
        opacity: 1,
        duration: 0.65,
        stagger: 0.08,
        delay: 0.25,
        ease: 'power2.out',
      });
      gsap.to('.buran-hero__image img', {
        yPercent: 8,
        scale: 1.12,
        ease: 'none',
        scrollTrigger: { trigger: '.buran-hero', start: 'top top', end: 'bottom top', scrub: true },
      });
      gsap.utils.toArray<HTMLElement>('.buran-reveal').forEach((element) => {
        // Keep the content visible before ScrollTrigger runs; motion is enhancement only.
        gsap.from(element, {
          y: 28,
          duration: 0.75,
          ease: 'power2.out',
          scrollTrigger: { trigger: element, start: 'top 86%', once: true },
        });
      });
    }, root);
    return () => context.revert();
  }, []);

  const handleScrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleEnquiry = () => onOpenEnquiry(pkg);

  return (
    <div className="buran-page" ref={pageRef}>
      <header className="buran-hero" aria-labelledby="buran-hero-title">
        <div className="buran-hero__image" aria-hidden="true">
          <ImageFrame image={BURAN_GHATI_IMAGES.hero} loading="eager" sizes="100vw" />
        </div>
        <div className="buran-hero__veil" aria-hidden="true" />
        <div className="buran-container buran-hero__content">
          <div className="buran-hero__copy">
            <p className="buran-kicker buran-kicker--light">HIMACHAL PRADESH · PABBAR VALLEY</p>
            <h1 id="buran-hero-title">Buran Ghati<span>The crossing between two valleys.</span></h1>
            <p className="buran-hero__lede">A seven-day high-altitude expedition from Janglik’s forests to the orchards of Barua, with one honest, weather-led crossing in between.</p>
            <div className="buran-hero__actions">
              <motion.button type="button" className="buran-button buran-button--sun" onClick={handleEnquiry} whileHover={prefersReducedMotion ? undefined : { y: -2 }} whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}>Plan your trek <ArrowRight aria-hidden="true" size={17} /></motion.button>
              <button type="button" className="buran-text-link buran-text-link--light" onClick={() => handleScrollTo('itinerary')}>See the route <ArrowDown aria-hidden="true" size={16} /></button>
            </div>
          </div>
          <div className="buran-hero__facts" aria-label="Buran Ghati route facts">
            <div><strong>07</strong><span>days / 06 nights</span></div>
            <div><strong>15,000</strong><span>ft approx. high point</span></div>
            <div><strong>Hard</strong><span>conditions-led terrain</span></div>
            <div><strong>Janglik → Barua</strong><span>crossing line</span></div>
          </div>
        </div>
        <button type="button" className="buran-scroll-cue" onClick={() => handleScrollTo('story')} aria-label="Scroll to expedition story"><span>Scroll to begin</span><ArrowDown aria-hidden="true" size={17} /></button>
      </header>

      <main>
        <section className="buran-section buran-intro" id="story" aria-labelledby="buran-story-heading">
          <div className="buran-container buran-intro__grid">
            <div className="buran-reveal">
              <p className="buran-kicker">A TRAIL WITH A TURNING POINT</p>
              <h2 id="buran-story-heading">Not a checklist.<br /><em>A change of world.</em></h2>
            </div>
            <div className="buran-intro__copy buran-reveal">
              <p className="buran-lead">Buran Ghati links Himachal’s Pabbar Valley with the Baspa–Sangla side near Barua. The trail feels different every morning: timberline forest, open bugyal, glacial water, then the stark geometry of a pass.</p>
              <p>We plan it as an expedition rather than a rushed transfer. That means acclimatisation, conservative calls in poor weather, and enough space to notice the landscape changing under your feet.</p>
              <button type="button" className="buran-text-link" onClick={() => handleScrollTo('journey')}>Read the terrain <ArrowRight aria-hidden="true" size={16} /></button>
            </div>
          </div>
        </section>

        <section className="buran-facts-band" aria-label="Buran Ghati highlights">
          <div className="buran-container buran-facts-band__grid">
            <div className="buran-reveal"><Compass aria-hidden="true" size={22} /><span><strong>One crossing</strong> between two valleys</span></div>
            <div className="buran-reveal"><ShieldCheck aria-hidden="true" size={22} /><span><strong>Conditions first</strong> local decisions, every day</span></div>
            <div className="buran-reveal"><TentTree aria-hidden="true" size={22} /><span><strong>Small camps</strong> leave room for the quiet</span></div>
            <div className="buran-reveal"><Users aria-hidden="true" size={22} /><span><strong>Private planning</strong> for your pace and dates</span></div>
          </div>
        </section>

        <section className="buran-section buran-journey" id="journey" aria-labelledby="buran-journey-heading">
          <div className="buran-container">
            <div className="buran-section-heading buran-reveal">
              <p className="buran-kicker">THE TERRAIN STORY</p>
              <h2 id="buran-journey-heading">Six languages of the mountain.</h2>
              <p className="buran-section-intro">From Janglik to Kinnaur, the expedition unfolds as a sequence of distinct textures. The pass is the hinge, not the whole story.</p>
            </div>
            <div className="buran-chapters">
              {BURAN_CHAPTERS.map((chapter, index) => (
                <article className={`buran-chapter buran-chapter--${chapter.accent} buran-reveal`} key={chapter.id}>
                  <div className="buran-chapter__copy">
                    <p className="buran-kicker">{chapter.eyebrow}</p>
                    <h3>{chapter.title}</h3>
                    <p>{chapter.copy}</p>
                    <span className="buran-chapter__terrain"><Mountain aria-hidden="true" size={15} /> {chapter.terrain}</span>
                  </div>
                  <ImageFrame image={chapter.image} sizes="(min-width: 900px) 50vw, 100vw" />
                  <span className="buran-chapter__index">0{index + 1}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="buran-pass" aria-labelledby="buran-pass-heading">
          <ImageFrame image={BURAN_GHATI_IMAGES.pass} loading="lazy" sizes="100vw" className="buran-pass__image" />
          <div className="buran-pass__veil" aria-hidden="true" />
          <div className="buran-container buran-pass__content buran-reveal">
            <p className="buran-kicker buran-kicker--light">THE CLIMAX</p>
            <h2 id="buran-pass-heading">The crossing<br /><em>is the story.</em></h2>
            <div className="buran-pass__detail"><span>BURAN GHATI</span><strong>15,000 FT <small>approx.</small></strong><span>Snow, scree, and a view into Kinnaur.</span></div>
          </div>
        </section>

        <BuranGhatiItinerary />

        <section className="buran-section buran-gallery" aria-labelledby="buran-gallery-heading">
          <div className="buran-container">
            <div className="buran-section-heading buran-section-heading--split buran-reveal">
              <div><p className="buran-kicker">FIELD NOTES</p><h2 id="buran-gallery-heading">A route worth remembering.</h2></div>
              <p className="buran-section-intro">A few frames from the trail’s changing register. Your final route and operating plan are always confirmed against current conditions.</p>
            </div>
            <div className="buran-gallery-grid">
              {BURAN_GHATI_IMAGES.gallery.map((image, index) => <ImageFrame key={image.src} image={image} sizes="(min-width: 900px) 33vw, 100vw" className={`buran-gallery-image buran-gallery-image--${index + 1} buran-reveal`} />)}
            </div>
          </div>
        </section>

        <section className="buran-section buran-practical" aria-labelledby="buran-practical-heading">
          <div className="buran-container buran-practical__grid">
            <div className="buran-reveal"><p className="buran-kicker">BEFORE YOU COMMIT</p><h2 id="buran-practical-heading">The useful details,<br /><em>without the noise.</em></h2><p className="buran-section-intro">A hard trek becomes a good trek when the decisions are clear. Here is the working brief we use to shape every enquiry.</p></div>
            <dl className="buran-practical-list buran-reveal">{BURAN_PRACTICAL_POINTS.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          </div>
        </section>

        <section className="buran-section buran-faq" aria-labelledby="buran-faq-heading">
          <div className="buran-container buran-faq__grid">
            <div className="buran-reveal"><p className="buran-kicker">QUESTIONS ON THE TRAIL</p><h2 id="buran-faq-heading">Clarity before the climb.</h2><p className="buran-section-intro">Still deciding? Tell us your dates, experience, and group size. We will tell you what is realistic.</p><button type="button" className="buran-button buran-button--outline" onClick={handleEnquiry}>Ask the expedition desk <ArrowRight aria-hidden="true" size={16} /></button></div>
            <div className="buran-faq-list buran-reveal">{BURAN_FAQS.map((item, index) => { const isOpen = openFaq === index; return <div className={`buran-faq-item ${isOpen ? 'is-open' : ''}`} key={item.question}><button type="button" aria-expanded={isOpen} onClick={() => setOpenFaq(isOpen ? null : index)}><span>{item.question}</span><ChevronDown aria-hidden="true" size={18} /></button>{isOpen && <p>{item.answer}</p>}</div>; })}</div>
          </div>
        </section>

        <section className="buran-enquiry" aria-labelledby="buran-enquiry-heading">
          <div className="buran-container buran-enquiry__inner buran-reveal">
            <div><p className="buran-kicker buran-kicker--light">MAKE THE FIRST MOVE</p><h2 id="buran-enquiry-heading">Your pass day starts<br /><em>with a conversation.</em></h2><p>Share your dates and the kind of expedition you want. We will shape the route, pace, and logistics around what the mountain is offering.</p></div>
            <motion.button type="button" className="buran-button buran-button--sun" onClick={handleEnquiry} whileHover={prefersReducedMotion ? undefined : { y: -2 }} whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}>Plan my Buran Ghati trek <ArrowRight aria-hidden="true" size={17} /></motion.button>
          </div>
        </section>
      </main>

      <footer className="buran-footer">
        <div className="buran-container buran-footer__grid">
          <div><div className="buran-brand">{business.logoUrl ? <img className="buran-brand__logo" src={business.logoUrl} alt="" /> : <span className="buran-brand__mark">P</span>}<span><strong>{business.companyName}</strong><small>{business.tagline || 'Travel with intention.'}</small></span></div><p className="buran-footer__note">Thoughtful journeys through the Himalayas and beyond.</p></div>
          <div><p className="buran-footer__label">THE SHORTCUTS</p><button type="button" onClick={() => onNavigate('home')}>Home</button><button type="button" onClick={() => onNavigate('packages')}>All packages</button><button type="button" onClick={() => handleScrollTo('itinerary')}>Buran itinerary</button></div>
          <div><p className="buran-footer__label">TALK TO US</p>{business.phoneHref && <a href={business.phoneHref}><Phone aria-hidden="true" size={15} /> {business.phone}</a>}{business.email && <a href={`mailto:${business.email}`}><Mail aria-hidden="true" size={15} /> {business.email}</a>}{business.address && <span><MapPin aria-hidden="true" size={15} /> {business.address}</span>}</div>
          <div><p className="buran-footer__label">A SMALL PROMISE</p><p className="buran-footer__promise"><Star aria-hidden="true" size={15} /> Clear plans. Local judgement. No rushed crossings.</p>{business.socialLinks[0] && <a href={business.socialLinks[0].href} target="_blank" rel="noreferrer"><Instagram aria-hidden="true" size={15} /> Follow the journeys</a>}</div>
        </div>
        <div className="buran-container buran-footer__bottom"><span>© {new Date().getFullYear()} {business.companyName}</span><span>Route notes are conditions-dependent.</span><Sparkles aria-hidden="true" size={15} /></div>
      </footer>
    </div>
  );
}
