import { useEffect, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const revealSelectors = [
  '.pravaah-wayfinder',
  '.pravaah-home-rhythms',
  '.pravaah-destination-index',
  '.pravaah-featured-section',
  '.pravaah-journeys',
  '.pravaah-home-process',
  '.pravaah-field-notes',
  '.pravaah-trust',
  '.pravaah-journal-preview',
  '.pravaah-home-cta',
  '.pravaah-catalog-results',
  '.pravaah-destination-stories',
  '.pravaah-destination-routes',
  '.pravaah-detail-summary',
  '.pravaah-detail-gallery',
  '.pravaah-detail-facts',
  '.pravaah-detail-body',
  '.pravaah-related',
];

const cardSelectors = [
  '.pravaah-reference-tour-card',
  '.pravaah-featured-carousel__card',
  '.pravaah-catalog-item',
  '.pravaah-destination-panel',
  '.pravaah-destination-story',
  '.pravaah-journey-card',
  '.pravaah-field-note',
  '.pravaah-journal-story',
  '.pravaah-destination-routes__list article',
  '.pravaah-related__rail article',
];

const staggerGroups = [
  { container: '.pravaah-home-process', items: '.pravaah-home-process__steps > div' },
  { container: '.pravaah-detail-body', items: '.pravaah-detail-overview, .pravaah-detail-highlights, .pravaah-detail-itinerary, .pravaah-detail-split, .pravaah-detail-notes, .pravaah-detail-logistics, .pravaah-detail-reviews, .pravaah-detail-faqs' },
];

export function usePravaahMotion(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === 'undefined') return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return undefined;

    const context = gsap.context(() => {
      const heroCopy = root.querySelector<HTMLElement>('.pravaah-home-hero__copy, .pravaah-page-hero__inner, .pravaah-detail-summary');
      const heroImage = root.querySelector<HTMLElement>('.pravaah-home-hero__image img, .pravaah-page-hero__image img, .pravaah-detail-hero__image img');

      if (heroCopy) {
        gsap.fromTo(heroCopy, { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.72, ease: 'power3.out', clearProps: 'transform,opacity' });
      }
      if (heroImage) {
        gsap.fromTo(heroImage, { opacity: 0.72 }, { opacity: 1, duration: 1.05, ease: 'power2.out', clearProps: 'opacity' });
        const hero = heroImage.closest('.pravaah-home-hero, .pravaah-page-hero, .pravaah-detail-hero');
        const mediaWrap = heroImage.closest<HTMLElement>('.pravaah-home-hero__image, .pravaah-page-hero__image, .pravaah-detail-hero__image');
        if (hero && mediaWrap) {
          gsap.to(mediaWrap, {
            yPercent: 5,
            ease: 'none',
            scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.8 },
          });
        }
      }

      root.querySelectorAll<HTMLElement>(revealSelectors.join(',')).forEach((element) => {
        gsap.fromTo(element, { y: 24, opacity: 0 }, {
          y: 0,
          opacity: 1,
          duration: 0.62,
          ease: 'power3.out',
          scrollTrigger: { trigger: element, start: 'top 86%', once: true },
          clearProps: 'transform,opacity',
        });
      });

      root.querySelectorAll<HTMLElement>(cardSelectors.join(',')).forEach((element) => {
        gsap.fromTo(element, { y: 16, opacity: 0 }, {
          y: 0,
          opacity: 1,
          duration: 0.5,
          delay: Math.min(Array.from(element.parentElement?.children || []).indexOf(element) * 0.045, 0.18),
          ease: 'power2.out',
          scrollTrigger: { trigger: element, start: 'top 92%', once: true },
          clearProps: 'transform,opacity',
        });
      });

      staggerGroups.forEach(({ container, items }) => {
        const trigger = root.querySelector<HTMLElement>(container);
        const nodes = root.querySelectorAll<HTMLElement>(`${container} ${items}`);
        if (!trigger || !nodes.length) return;
        gsap.fromTo(nodes, { y: 18, opacity: 0 }, {
          y: 0,
          opacity: 1,
          duration: 0.52,
          stagger: 0.07,
          ease: 'power3.out',
          scrollTrigger: { trigger, start: 'top 82%', once: true },
          clearProps: 'transform,opacity',
        });
      });

      root.querySelectorAll<HTMLElement>('.pravaah-destination-panel img, .pravaah-trust__image img, .pravaah-field-note__image img').forEach((element) => {
        gsap.to(element, {
          yPercent: 4,
          ease: 'none',
          scrollTrigger: { trigger: element.closest('section') || element, start: 'top bottom', end: 'bottom top', scrub: 0.7 },
        });
      });
    }, root);

    return () => context.revert();
  }, [rootRef]);
}
