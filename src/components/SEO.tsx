import { useEffect, useState } from 'react';
import { COOKIE_CONSENT_EVENT, getCookieConsent } from '../utils/cookieConsent';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'travel';
  schemaMarkup?: object;
  siteName?: string;
  faviconUrl?: string;
  twitterImageUrl?: string;
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  facebookPixelId?: string;
}

/**
 * Highly optimized, production-ready SEO component.
 * Dynamically injects Meta Tags, Open Graph, Twitter Cards, Canonical URLs, and JSON-LD Structured Schema.
 */
export default function SEO({
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
  ogType = 'website',
  schemaMarkup,
  siteName = 'Pravaah Travels',
  faviconUrl = '/favicon.svg',
  twitterImageUrl,
  googleAnalyticsId,
  googleTagManagerId,
  facebookPixelId,
}: SEOProps) {
  const [cookieConsent, setCookieConsent] = useState(() => getCookieConsent());

  useEffect(() => {
    const refreshConsent = () => setCookieConsent(getCookieConsent());
    window.addEventListener(COOKIE_CONSENT_EVENT, refreshConsent);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, refreshConsent);
  }, []);

  useEffect(() => {
    // 1. Title
    const safeTitle = String(title ?? '');
    const formattedTitle = safeTitle.toLowerCase().includes(siteName.toLowerCase()) ? safeTitle : `${safeTitle} | ${siteName}`;
    document.title = formattedTitle;

    // 2. Helper to set or create meta tag
    const setMetaTag = (attrName: string, attrValue: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 3. Set standard descriptions
    setMetaTag('name', 'description', description);
    if (keywords) {
      setMetaTag('name', 'keywords', keywords);
    }

    // 4. Set Open Graph (OG) Tags
    const currentUrl = canonicalUrl || window.location.href;
    setMetaTag('property', 'og:title', formattedTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('property', 'og:url', currentUrl);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:site_name', siteName);

    // 5. Set Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', formattedTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', twitterImageUrl || ogImage);

    // 6. Set Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', currentUrl);

    let faviconLink = document.querySelector('link[rel="icon"]');
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.setAttribute('rel', 'icon');
      document.head.appendChild(faviconLink);
    }
    faviconLink.setAttribute('href', faviconUrl);

    // 7. Dynamic JSON-LD Schema
    const existingScript = document.getElementById('jsonld-schema');
    if (existingScript) {
      existingScript.remove();
    }

    const defaultSchema = {
      '@context': 'https://schema.org',
      '@type': 'TravelAgency',
      'name': siteName,
      'image': ogImage,
      'description': description,
      'url': window.location.origin,
      'telephone': '+91-98765-43210',
      'priceRange': '$$$',
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': 'Spiti Highway',
        'addressLocality': 'Shimla',
        'addressRegion': 'Himachal Pradesh',
        'postalCode': '171001',
        'addressCountry': 'IN'
      },
      'geo': {
        '@type': 'GeoCoordinates',
        'latitude': '31.1048',
        'longitude': '77.1734'
      }
    };

    const script = document.createElement('script');
    script.id = 'jsonld-schema';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schemaMarkup || defaultSchema).replace(/</g, '\\u003c');
    document.head.appendChild(script);

    return () => {
      // Clean up dynamic schema script on unmount/re-render to prevent duplicate schemas
      const scriptToRemove = document.getElementById('jsonld-schema');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [title, description, keywords, canonicalUrl, ogImage, ogType, schemaMarkup, siteName, faviconUrl, twitterImageUrl]);

  useEffect(() => {
    type TrackingWindow = Window & {
      dataLayer?: unknown[];
      gtag?: (...args: unknown[]) => void;
      fbq?: (...args: unknown[]) => void;
    };

    const trackingWindow = window as TrackingWindow;
    const analyticsAllowed = cookieConsent?.analytics === true;
    const marketingAllowed = cookieConsent?.marketing === true;
    const safeGoogleAnalyticsId = /^(G|AW)-[A-Z0-9-]+$/i.test(googleAnalyticsId?.trim() || '')
      ? googleAnalyticsId!.trim()
      : '';
    const safeGoogleTagManagerId = /^GTM-[A-Z0-9]+$/i.test(googleTagManagerId?.trim() || '')
      ? googleTagManagerId!.trim()
      : '';
    const safeFacebookPixelId = /^\d+$/.test(facebookPixelId?.trim() || '')
      ? facebookPixelId!.trim()
      : '';

    const removeScripts = (selector: string) => {
      document.querySelectorAll(selector).forEach((element) => element.remove());
    };

    const expireTrackingCookies = (prefixes: string[]) => {
      document.cookie.split(';').forEach((cookie) => {
        const cookieName = cookie.split('=')[0]?.trim();
        if (!cookieName || !prefixes.some((prefix) => cookieName.startsWith(prefix))) return;
        document.cookie = `${cookieName}=; Max-Age=0; Path=/; SameSite=Lax`;
      });
    };

    trackingWindow.dataLayer = trackingWindow.dataLayer || [];
    const updateGoogleConsent = (value: 'granted' | 'denied') => {
      trackingWindow.dataLayer?.push([
        'consent',
        'update',
        {
          analytics_storage: value,
          ad_storage: value,
          ad_user_data: value,
          ad_personalization: value,
        },
      ]);
      trackingWindow.gtag?.('consent', 'update', {
        analytics_storage: value,
        ad_storage: value,
        ad_user_data: value,
        ad_personalization: value,
      });
    };

    if (!analyticsAllowed) {
      updateGoogleConsent('denied');
      removeScripts('script[data-pravaah-analytics], script[data-pravaah-analytics-source], script[data-pravaah-gtm]');
      expireTrackingCookies(['_ga', '_gid', '_gat']);
    } else {
      updateGoogleConsent('granted');

      if (safeGoogleAnalyticsId) {
        let analyticsSource = document.querySelector<HTMLScriptElement>('script[data-pravaah-analytics-source]');
        if (analyticsSource?.dataset.trackingId !== safeGoogleAnalyticsId) {
          analyticsSource?.remove();
          analyticsSource = document.createElement('script');
          analyticsSource.async = true;
          analyticsSource.dataset.pravaahAnalyticsSource = 'true';
          analyticsSource.dataset.trackingId = safeGoogleAnalyticsId;
          analyticsSource.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(safeGoogleAnalyticsId)}`;
          document.head.appendChild(analyticsSource);
        }

        let analyticsConfig = document.querySelector<HTMLScriptElement>('script[data-pravaah-analytics]');
        if (!analyticsConfig) {
          analyticsConfig = document.createElement('script');
          analyticsConfig.dataset.pravaahAnalytics = 'true';
          document.head.appendChild(analyticsConfig);
        }
        analyticsConfig.dataset.trackingId = safeGoogleAnalyticsId;
        analyticsConfig.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('consent','update',{analytics_storage:'granted'});gtag('config',${JSON.stringify(safeGoogleAnalyticsId)});`;
      }

      if (safeGoogleTagManagerId) {
        let gtmScript = document.querySelector<HTMLScriptElement>('script[data-pravaah-gtm]');
        if (gtmScript?.dataset.trackingId !== safeGoogleTagManagerId) {
          gtmScript?.remove();
          gtmScript = document.createElement('script');
          gtmScript.dataset.pravaahGtm = 'true';
          gtmScript.dataset.trackingId = safeGoogleTagManagerId;
          gtmScript.async = true;
          gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(safeGoogleTagManagerId)}`;
          document.head.appendChild(gtmScript);
        }
      }
    }

    if (!marketingAllowed) {
      trackingWindow.fbq?.('consent', 'revoke');
      removeScripts('script[data-pravaah-pixel], script[src*="connect.facebook.net"]');
      expireTrackingCookies(['_fbp', '_fbc']);
    } else if (safeFacebookPixelId) {
      let pixelScript = document.querySelector<HTMLScriptElement>('script[data-pravaah-pixel]');
      if (pixelScript?.dataset.trackingId !== safeFacebookPixelId) {
        pixelScript?.remove();
        pixelScript = document.createElement('script');
        pixelScript.dataset.pravaahPixel = 'true';
        pixelScript.dataset.trackingId = safeFacebookPixelId;
        pixelScript.textContent = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('consent','grant');fbq('init',${JSON.stringify(safeFacebookPixelId)});fbq('track','PageView');`;
        document.head.appendChild(pixelScript);
      }
    }
  }, [cookieConsent, facebookPixelId, googleAnalyticsId, googleTagManagerId]);

  return null; // Side-effect only component
}
