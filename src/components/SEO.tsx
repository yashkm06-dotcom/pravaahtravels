import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'travel';
  schemaMarkup?: object;
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
  schemaMarkup
}: SEOProps) {
  useEffect(() => {
    // 1. Title
    const safeTitle = String(title ?? '');
    const formattedTitle = safeTitle.toLowerCase().includes('pravaah travels') ? safeTitle : `${safeTitle} | Pravaah Travels`;
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
    setMetaTag('property', 'og:site_name', 'Pravaah Travels');

    // 5. Set Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', formattedTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', ogImage);

    // 6. Set Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', currentUrl);

    // 7. Dynamic JSON-LD Schema
    const existingScript = document.getElementById('jsonld-schema');
    if (existingScript) {
      existingScript.remove();
    }

    const defaultSchema = {
      '@context': 'https://schema.org',
      '@type': 'TravelAgency',
      'name': 'Pravaah Travels',
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
  }, [title, description, keywords, canonicalUrl, ogImage, ogType, schemaMarkup]);

  return null; // Side-effect only component
}
