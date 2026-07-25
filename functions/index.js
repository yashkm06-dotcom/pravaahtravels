const { onCall, HttpsError } = require('firebase-functions/v2/https');
const logger = require('firebase-functions/logger');
const cheerio = require('cheerio');
const dns = require('node:dns').promises;
const net = require('node:net');

const MAX_HTML_CHARACTERS = 12_000_000;
const MAX_CONTENT_CHARACTERS = 28_000;
const FETCH_TIMEOUT_MS = 20_000;
const MAX_REDIRECTS = 4;
const SCRIPT_TAG_PATTERN = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
const PRELOADED_STORE_ASSIGNMENT_PATTERN = /(?:window|self|globalThis)(?:\.(?:__)?PRELOADED_STORE(?:__)?|\[['"](?:__)?PRELOADED_STORE(?:__)?['"]\])\s*=/i;

const PACKAGE_PREVIEW_FIELDS = [
  'title',
  'destination',
  'duration',
  'price',
  'overview',
  'highlights',
  'itinerary',
  'inclusions',
  'exclusions',
  'bestTime',
  'difficulty',
  'faqs',
  'metaTitle',
  'metaDescription',
  'slug',
  'heroImage',
  'galleryImages',
];

const ARRAY_PREVIEW_FIELDS = new Set([
  'highlights',
  'itinerary',
  'inclusions',
  'exclusions',
  'faqs',
  'galleryImages',
]);

const SECTION_KEYS = [
  'overview',
  'highlights',
  'itinerary',
  'inclusions',
  'exclusions',
  'hotels',
  'transport',
  'meals',
  'pricing',
  'faqs',
  'bestTime',
  'difficulty',
  'duration',
  'destination',
];

const TARGET_JSON_LD_TYPES = new Set([
  'product',
  'tour',
  'trip',
  'offer',
  'faqpage',
  'breadcrumblist',
  'itemlist',
]);

const CATEGORY_WORDS = new Set([
  'adventure',
  'beach',
  'family',
  'honeymoon',
  'luxury',
  'pilgrimage',
  'spiritual',
  'trekking',
  'wildlife',
  'weekend',
  'holiday',
  'holidays',
  'tour',
  'tours',
  'trip',
  'trips',
  'package',
  'packages',
  'travel',
  'travels',
  'domestic',
  'international',
  'group',
  'private',
]);

const DAY_WORDS = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
};

const SECTION_ALIASES = [
  { key: 'highlights', patterns: [/^highlights?$/, /^trip\s+highlights?$/, /^why\s+this\s+trip$/, /^why\s+choose/i, /^experience/i] },
  { key: 'overview', patterns: [/^overview$/, /^about$/, /^about\s+(the\s+)?(tour|trip|package)$/i, /^description$/, /^tour\s+overview$/i, /^trip\s+overview$/i] },
  { key: 'itinerary', patterns: [/^itinerary$/, /^day\s+wise\s+itinerary$/, /^trip\s+itinerary$/, /^tour\s+plan$/, /^trip\s+plan$/, /^day\s+wise$/, /^schedule$/] },
  { key: 'inclusions', patterns: [/^included$/, /^inclusions?$/, /^package\s+includes$/, /^what'?s\s+included$/, /^includes$/] },
  { key: 'exclusions', patterns: [/^excluded$/, /^exclusions?$/, /^package\s+excludes$/, /^what'?s\s+not\s+included$/, /^excludes$/, /^not\s+included$/] },
  { key: 'faqs', patterns: [/^faqs?$/, /^frequently\s+asked\s+questions?$/, /^questions?$/] },
  { key: 'hotels', patterns: [/^hotels?$/, /^accommodation$/, /^stay$/, /^where\s+you'?ll\s+stay$/] },
  { key: 'meals', patterns: [/^meals?$/, /^meal\s+plan$/, /^food$/, /^breakfast|lunch|dinner/] },
  { key: 'transport', patterns: [/^transport$/, /^transfers?$/, /^vehicle$/, /^cab$/, /^transportation$/] },
  { key: 'pricing', patterns: [/^pricing$/, /^cost$/, /^price$/, /^package\s+cost$/, /^tour\s+cost$/, /^tariff$/] },
  { key: 'bestTime', patterns: [/^best\s+time$/, /^best\s+season$/, /^when\s+to\s+visit$/, /^season$/] },
  { key: 'difficulty', patterns: [/^difficulty$/, /^grade$/, /^level$/, /^trek\s+grade$/] },
  { key: 'duration', patterns: [/^duration$/, /^tour\s+duration$/, /^trip\s+duration$/] },
  { key: 'destination', patterns: [/^destination$/, /^location$/, /^places?\s+covered$/, /^route$/] },
];

const isAdminEmail = (email = '') => {
  const normalized = String(email).trim().toLowerCase();
  return normalized === 'yash.km06@gmail.com' ||
    normalized === 'admin@pravaahtravels.com' ||
    normalized.endsWith('@pravaahtravels.com');
};

const isPrivateIp = (address) => {
  const normalized = String(address || '').toLowerCase();
  const ipVersion = net.isIP(normalized);

  if (ipVersion === 4) {
    const [first, second] = normalized.split('.').map((part) => Number(part));
    return first === 0 ||
      first === 10 ||
      first === 127 ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168);
  }

  if (ipVersion === 6) {
    return normalized === '::1' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe80:');
  }

  return false;
};

const validateUrl = (rawUrl) => {
  if (typeof rawUrl !== 'string' || rawUrl.trim().length === 0) {
    throw new HttpsError('invalid-argument', 'Please enter a package URL.');
  }

  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new HttpsError('invalid-argument', 'Invalid URL. Please enter a complete http or https URL.');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new HttpsError('invalid-argument', 'Only http and https URLs are supported.');
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, '');
  if (
    hostname === 'localhost' ||
    hostname === 'metadata.google.internal' ||
    hostname.endsWith('.local') ||
    isPrivateIp(hostname)
  ) {
    throw new HttpsError('invalid-argument', 'Local, private, and metadata URLs are not allowed.');
  }

  return parsed;
};

const assertPublicHostname = async (urlObject) => {
  const hostname = urlObject.hostname.toLowerCase().replace(/\.$/, '');

  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new HttpsError('invalid-argument', 'Private network URLs are not allowed.');
    }
    return;
  }

  let addresses;
  try {
    addresses = await dns.lookup(hostname, { all: true, verbatim: false });
  } catch {
    throw new HttpsError('invalid-argument', 'Unable to resolve the package website.');
  }

  if (!addresses.length || addresses.some((entry) => isPrivateIp(entry.address))) {
    throw new HttpsError('invalid-argument', 'The package website resolves to a private network address.');
  }
};

const fetchHtml = async (initialUrl) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let currentUrl = validateUrl(initialUrl);

  try {
    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
      await assertPublicHostname(currentUrl);

      const response = await fetch(currentUrl.href, {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1"
        },
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location) {
          throw new HttpsError('unavailable', 'The website redirected without a valid location.');
        }
        currentUrl = validateUrl(new URL(location, currentUrl.href).href);
        continue;
      }

      if (!response.ok) {
        throw new HttpsError('unavailable', `The website could not be downloaded. Status ${response.status}.`);
      }

      const contentType = response.headers.get('content-type') || '';
      const contentLength = Number(response.headers.get('content-length') || 0);
      if (contentLength > MAX_HTML_CHARACTERS) {
        throw new HttpsError('resource-exhausted', 'The package page is too large to analyze safely.');
      }

      const html = await response.text();
      if (html.length > MAX_HTML_CHARACTERS) {
        throw new HttpsError('resource-exhausted', 'The package page is too large to analyze safely.');
      }

      logger.info('Package URL HTML downloaded', {
        htmlLength: html.length,
        finalUrl: currentUrl.href,
        contentType,
      });
      if (!contentType.includes('html') && !/<html|<body|<main|<article/i.test(html)) {
        throw new HttpsError('invalid-argument', 'The URL does not appear to be an HTML package page.');
      }

      return { html, finalUrl: currentUrl.href };
    }
  } catch (error) {
    if (error && error.name === 'AbortError') {
      throw new HttpsError('deadline-exceeded', 'The website took too long to respond.');
    }
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('unavailable', 'The website blocked or failed the download request.');
  } finally {
    clearTimeout(timeout);
  }

  throw new HttpsError('deadline-exceeded', 'Too many redirects while downloading the package page.');
};

const cleanText = (value) => String(value || '')
  .replace(/\u00a0/g, ' ')
  .replace(/\s+/g, ' ')
  .replace(/^[\s:|,•\-–—]+|[\s:|,•\-–—]+$/g, '')
  .trim();

const normalizeHeadingText = (value) => cleanText(value)
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^\w\s/-]+/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const firstNonEmpty = (...values) => {
  for (const value of values.flat(Infinity)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      const nested = firstNonEmpty(...value);
      if (nested) return nested;
      continue;
    }
    const text = cleanText(value);
    if (text) return text;
  }
  return null;
};

const unique = (values) => {
  const seen = new Set();
  const result = [];

  for (const value of values.flat(Infinity)) {
    const text = cleanText(value);
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(text);
  }

  return result;
};

const uniqueUrls = (values) => {
  const seen = new Set();
  const result = [];

  for (const value of values.flat(Infinity)) {
    if (!value || typeof value !== 'string') continue;
    const text = value.trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    result.push(text);
  }

  return result;
};

const toList = (value) => {
  if (Array.isArray(value)) return unique(value.flatMap(toList));
  if (value == null) return [];
  if (typeof value === 'object') {
    return unique([
      value.name,
      value.title,
      value.headline,
      value.text,
      value.description,
      value.value,
    ]);
  }

  return unique(String(value)
    .split(/\n|•|●|▪|·|;|\|/)
    .map((entry) => entry.replace(/^\d+[\).]\s*/, '')));
};

const normalizeUrl = (candidate, baseUrl) => {
  if (!candidate || typeof candidate !== 'string' || candidate.startsWith('data:')) return null;
  try {
    const parsed = new URL(candidate, baseUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    if (/\.(svg|ico)(?:$|\?)/i.test(parsed.pathname)) return null;
    return parsed.href;
  } catch {
    return null;
  }
};

const normalizeImageValue = (value, baseUrl) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap((entry) => normalizeImageValue(entry, baseUrl));
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => normalizeUrl(entry.trim().split(/\s+/)[0], baseUrl))
      .filter(Boolean);
  }
  if (typeof value === 'object') {
    return normalizeImageValue(value.url || value.contentUrl || value.src || value.thumbnailUrl, baseUrl);
  }
  return [];
};

const parsePrice = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const text = cleanText(value);
  if (!text) return null;
  const match = text.match(/(?:\u20b9|rs\.?|inr)\s*([0-9][0-9,\s]*(?:\.\d+)?)/i) ||
    text.match(/([0-9][0-9,\s]*(?:\.\d+)?)\s*(?:\u20b9|rs\.?|inr)/i) ||
    text.match(/(?:price|cost|from|starting\s+from|starts?\s+at)\s*[:\-–—]?\s*(?:\u20b9|rs\.?|inr)?\s*([0-9][0-9,\s]*(?:\.\d+)?)/i);
  if (!match) return null;
  const number = Number(match[1].replace(/[,\s]/g, ''));
  return Number.isFinite(number) ? number : null;
};

const parseDirectPrice = (value) => {
  const parsed = parsePrice(value);
  if (parsed != null) return parsed;

  const text = cleanText(value);
  if (!/^[0-9][0-9,\s]*(?:\.\d+)?$/.test(text)) return null;
  const number = Number(text.replace(/[,\s]/g, ''));
  return Number.isFinite(number) ? number : null;
};

const slugify = (value) => {
  const slug = cleanText(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || null;
};

const normalizeDuration = (value) => {
  const text = cleanText(value);
  if (!text) return null;

  const isoMatch = text.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?)?$/i);
  if (isoMatch) {
    const days = isoMatch[1] ? Number(isoMatch[1]) : 0;
    const hours = isoMatch[2] ? Number(isoMatch[2]) : 0;
    if (days && hours) return `${days} Days / ${hours} Hours`;
    if (days) return `${days} Days`;
    if (hours) return `${hours} Hours`;
  }

  const compactMatch = text.match(/\b(\d{1,2})\s*d\s*\/\s*(\d{1,2})\s*n\b/i);
  if (compactMatch) return `${Number(compactMatch[1])} Days / ${Number(compactMatch[2])} Nights`;

  const daysNightsMatch = text.match(/\b(\d{1,2})\s*days?\s*(?:&|and|\/|\+|-)?\s*(\d{1,2})\s*nights?\b/i) ||
    text.match(/\b(\d{1,2})\s*nights?\s*(?:&|and|\/|\+|-)?\s*(\d{1,2})\s*days?\b/i);
  if (daysNightsMatch) {
    if (/nights?/i.test(daysNightsMatch[0].split(/\d+/)[1] || '')) {
      return `${Number(daysNightsMatch[2])} Days / ${Number(daysNightsMatch[1])} Nights`;
    }
    return `${Number(daysNightsMatch[1])} Days / ${Number(daysNightsMatch[2])} Nights`;
  }

  const daysMatch = text.match(/\b(\d{1,2})\s*days?\b/i);
  const nightsMatch = text.match(/\b(\d{1,2})\s*nights?\b/i);
  if (daysMatch && nightsMatch) return `${Number(daysMatch[1])} Days / ${Number(nightsMatch[1])} Nights`;
  if (daysMatch) return `${Number(daysMatch[1])} Days`;
  if (nightsMatch) return `${Number(nightsMatch[1])} Nights`;

  return null;
};

const parseDayHeading = (value) => {
  const text = cleanText(value);
  const match = text.match(/^day\s*(0?\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\b\s*[:\-–—]?\s*(.*)$/i);
  if (!match) return null;
  const token = match[1].toLowerCase();
  const day = /^\d+$/.test(token) ? Number(token) : DAY_WORDS[token];
  if (!day) return null;
  return {
    day,
    title: cleanText(match[2]) || null,
  };
};

const getJsonLdTypes = (node) => {
  const type = node && node['@type'];
  const normalize = (entry) => cleanText(entry).toLowerCase().replace(/^schema:/, '').replace(/^https?:\/\/schema\.org\//, '');
  if (Array.isArray(type)) return type.map(normalize).filter(Boolean);
  if (typeof type === 'string') return [normalize(type)].filter(Boolean);
  return [];
};

const flattenJsonLd = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(flattenJsonLd);
  if (typeof value !== 'object') return [];

  const nodes = [value];
  for (const key of ['@graph', 'itemListElement', 'mainEntity', 'offers', 'hasOfferCatalog', 'itinerary', 'subEvent']) {
    if (Array.isArray(value[key])) nodes.push(...value[key].flatMap(flattenJsonLd));
    else if (value[key] && typeof value[key] === 'object') nodes.push(...flattenJsonLd(value[key]));
  }
  if (value.item && typeof value.item === 'object') nodes.push(...flattenJsonLd(value.item));
  return nodes;
};

const safeJsonParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const readJsonLd = ($) => {
  const nodes = [];
  const seen = new Set();

  $('script[type="application/ld+json"]').each((_, element) => {
    const raw = $(element).contents().text();
    const parsed = safeJsonParse(raw);
    for (const node of flattenJsonLd(parsed)) {
      if (!node || typeof node !== 'object') continue;
      const key = JSON.stringify({
        type: node['@type'],
        name: node.name || node.headline || node.title,
        url: node.url || node['@id'],
      });
      if (seen.has(key)) continue;
      seen.add(key);
      nodes.push(node);
    }
  });

  return nodes;
};

const getMetaContent = ($, names) => {
  const normalized = names.map((name) => name.toLowerCase());
  let found = null;

  $('meta').each((_, element) => {
    if (found) return;
    const node = $(element);
    const key = cleanText(node.attr('property') || node.attr('name') || node.attr('itemprop')).toLowerCase();
    if (normalized.includes(key)) found = cleanText(node.attr('content'));
  });

  return found || null;
};

const getMetaData = ($) => ({
  title: firstNonEmpty(getMetaContent($, ['og:title', 'twitter:title']), $('title').first().text()),
  description: getMetaContent($, ['og:description', 'twitter:description', 'description']),
  images: uniqueUrls(normalizeImageValue([
    getMetaContent($, ['og:image']),
    getMetaContent($, ['twitter:image']),
    getMetaContent($, ['image']),
  ], $.root().attr('data-base-url') || '')),
});

const getNodeText = (node) => {
  if (!node) return null;
  if (typeof node === 'string' || typeof node === 'number') return cleanText(node);
  if (Array.isArray(node)) return firstNonEmpty(...node.map(getNodeText));
  if (typeof node === 'object') {
    return firstNonEmpty(
      node.name,
      node.title,
      node.headline,
      node.text,
      node.description,
      node.value,
      node.addressLocality,
      node.addressRegion,
      node.addressCountry,
      getNodeText(node.item)
    );
  }
  return null;
};

const getNestedValues = (source, paths) => {
  const values = [];

  for (const path of paths) {
    const parts = path.split('.');
    const walk = (value, index) => {
      if (value == null) return;
      if (Array.isArray(value)) {
        value.forEach((entry) => walk(entry, index));
        return;
      }
      if (index >= parts.length) {
        values.push(value);
        return;
      }
      if (typeof value === 'object') walk(value[parts[index]], index + 1);
    };
    walk(source, 0);
  }

  return values;
};

const isSupportedJsonLdNode = (node) => {
  const types = getJsonLdTypes(node);
  return types.some((type) => TARGET_JSON_LD_TYPES.has(type)) ||
    Boolean(node.name || node.headline || node.description || node.offers || node.itemListElement || node.mainEntity);
};

const isDestinationCandidate = (value) => {
  const text = cleanText(value);
  if (!text || text.length < 2 || text.length > 80) return false;
  const normalized = normalizeHeadingText(text);
  if (!normalized) return false;
  if (CATEGORY_WORDS.has(normalized)) return false;
  if (/^(home|all|india|packages?|tours?|travel|booking|search|explore|popular|best|top)$/.test(normalized)) return false;
  if (/(days?|nights?|\u20b9|rs\.?|inr|price|cost|faq|included|excluded|overview|itinerary)/i.test(text)) return false;
  return true;
};

const pickDestination = (candidates) => {
  const valid = unique(candidates).filter(isDestinationCandidate);
  return valid[valid.length - 1] || null;
};

const destinationFromTitle = (title) => {
  const text = cleanText(title)
    .replace(/\b\d{1,2}\s*d\s*\/\s*\d{1,2}\s*n\b/ig, ' ')
    .replace(/\b\d{1,2}\s*days?(?:\s*(?:&|and|\/|-)\s*\d{1,2}\s*nights?)?\b/ig, ' ')
    .replace(/(?:\u20b9|rs\.?|inr)\s*[0-9][0-9,\s]*/ig, ' ');
  const match = text.match(/^(.+?)(?:\s+(?:tour|trip|trek|package|yatra|holiday|itinerary|with|from)\b|$)/i);
  return pickDestination([match ? match[1] : text]);
};

const extractItemListTexts = (node) => {
  const items = Array.isArray(node.itemListElement) ? node.itemListElement : [];
  return items
    .map((entry) => getNodeText(entry.item || entry))
    .filter(Boolean);
};

const extractJsonLdData = (nodes, baseUrl) => {
  const data = {
    title: null,
    destination: null,
    duration: null,
    price: null,
    overview: null,
    images: [],
    faqs: [],
    breadcrumbs: [],
    highlights: [],
    itinerary: [],
    inclusions: [],
    exclusions: [],
    hotels: [],
    transport: [],
    meals: [],
  };

  for (const node of nodes.filter(isSupportedJsonLdNode)) {
    const types = getJsonLdTypes(node);
    const nodeName = cleanText(node.name || node.headline || node.title).toLowerCase();

    if (types.includes('faqpage')) {
      const questions = Array.isArray(node.mainEntity) ? node.mainEntity : [];
      data.faqs.push(...questions.map((questionNode) => ({
        question: getNodeText(questionNode),
        answer: getNodeText(questionNode.acceptedAnswer || questionNode.suggestedAnswer),
      })).filter((faq) => faq.question || faq.answer));
    }

    if (types.includes('breadcrumblist')) {
      data.breadcrumbs.push(...extractItemListTexts(node));
    }

    if (types.includes('itemlist')) {
      const items = extractItemListTexts(node);
      if (/highlight/i.test(nodeName)) data.highlights.push(...items);
      else if (/include/i.test(nodeName) && !/exclude/i.test(nodeName)) data.inclusions.push(...items);
      else if (/exclude|not included/i.test(nodeName)) data.exclusions.push(...items);
      else if (/itinerary|day|plan/i.test(nodeName)) data.itinerary.push(...parseItineraryFromLines(items));
      else if (/hotel|accommodation|stay/i.test(nodeName)) data.hotels.push(...items);
      else if (/transport|transfer|vehicle/i.test(nodeName)) data.transport.push(...items);
      else if (/meal|food/i.test(nodeName)) data.meals.push(...items);
      else data.highlights.push(...items.filter((item) => item.length < 180));
    }

    data.title = data.title || firstNonEmpty(node.name, node.headline, node.title);
    data.overview = data.overview || firstNonEmpty(node.description, node.disambiguatingDescription);
    data.duration = data.duration || normalizeDuration(firstNonEmpty(node.duration, node.timeRequired));
    data.images.push(...normalizeImageValue(node.image, baseUrl));
    data.images.push(...normalizeImageValue(node.photo, baseUrl));
    data.images.push(...normalizeImageValue(node.primaryImageOfPage, baseUrl));

    data.breadcrumbs.push(...getNestedValues(node, ['breadcrumb.itemListElement.item.name', 'breadcrumb.itemListElement.name']).map(getNodeText));

    const location = firstNonEmpty(...getNestedValues(node, [
      'location.name',
      'location.address.addressLocality',
      'location.address.addressRegion',
      'address.addressLocality',
      'address.addressRegion',
      'areaServed.name',
      'touristType',
      'itinerary.name',
    ]).map(getNodeText));
    data.destination = data.destination || pickDestination([location]);

    const price = parsePrice(firstNonEmpty(...getNestedValues(node, [
      'offers.price',
      'offers.lowPrice',
      'offers.highPrice',
      'offers.priceSpecification.price',
      'price',
    ])));
    data.price = data.price || price;

    const additionalProperties = Array.isArray(node.additionalProperty) ? node.additionalProperty : [];
    for (const property of additionalProperties) {
      const name = cleanText(property.name).toLowerCase();
      const value = property.value || property.description || property.text;
      if (/highlight/.test(name)) data.highlights.push(...toList(value));
      if (/inclusion|included/.test(name)) data.inclusions.push(...toList(value));
      if (/exclusion|excluded|not included/.test(name)) data.exclusions.push(...toList(value));
      if (/hotel|accommodation|stay/.test(name)) data.hotels.push(...toList(value));
      if (/transport|transfer|vehicle/.test(name)) data.transport.push(...toList(value));
      if (/meal|food/.test(name)) data.meals.push(...toList(value));
    }
  }

  data.destination = data.destination || pickDestination(data.breadcrumbs);
  data.images = uniqueUrls(data.images);
  data.highlights = unique(data.highlights);
  data.inclusions = unique(data.inclusions);
  data.exclusions = unique(data.exclusions);
  data.hotels = unique(data.hotels);
  data.transport = unique(data.transport);
  data.meals = unique(data.meals);
  return data;
};

const removeNonContentElements = ($) => {
  $('script, style, noscript, svg, iframe, header, footer, nav, aside, form').remove();
  $('*').each((_, element) => {
    const attrs = element.attribs || {};
    const marker = `${attrs.id || ''} ${attrs.class || ''} ${attrs.role || ''} ${attrs['aria-label'] || ''} ${attrs['data-ad'] || ''}`.toLowerCase();
    if (/(^|[\s_-])(ad|ads|advert|advertisement|sponsor|sponsored|promo-banner)([\s_-]|$)/.test(marker)) {
      $(element).remove();
    }
  });
};

const classifyHeading = (value) => {
  const text = normalizeHeadingText(value);
  if (!text) return null;
  if (parseDayHeading(text)) return 'itinerary-day';
  for (const alias of SECTION_ALIASES) {
    if (alias.patterns.some((pattern) => pattern.test(text))) return alias.key;
  }
  return null;
};

const elementText = ($, element) => {
  const tag = element.tagName ? element.tagName.toLowerCase() : '';
  if (tag === 'table') {
    return cleanText($(element).find('tr').map((_, row) => cleanText($(row).find('th,td').map((__, cell) => cleanText($(cell).text())).get().join(': '))).get().join('\n'));
  }
  if (tag === 'tr') {
    return cleanText($(element).find('th,td').map((_, cell) => cleanText($(cell).text())).get().join(': '));
  }
  return cleanText($(element).text());
};

const isHeadingElement = ($, element) => {
  const tag = element.tagName ? element.tagName.toLowerCase() : '';
  if (!/^(h1|h2|h3|h4|strong|summary)$/.test(tag)) return false;
  const text = elementText($, element);
  return Boolean(classifyHeading(text) || parseDayHeading(text));
};

const isContentElement = ($, element) => {
  const tag = element.tagName ? element.tagName.toLowerCase() : '';
  if (/^(p|li|dt|dd|blockquote|figcaption|table|tr|details|summary)$/.test(tag)) return true;
  if (isHeadingElement($, element)) return true;
  if (!/^(div|section|article)$/.test(tag)) return false;

  const attrs = element.attribs || {};
  const marker = `${attrs.id || ''} ${attrs.class || ''} ${attrs.role || ''} ${attrs['aria-label'] || ''}`.toLowerCase();
  if (/(accordion|collapse|panel|content|body|description|overview|highlight|itinerary|inclusion|exclusion|faq|day|tour-plan|trip-plan)/.test(marker)) {
    return true;
  }

  return $(element).children('h1,h2,h3,h4,strong,p,ul,ol,table,tr,details,summary,section,article,div').length === 0;
};

const getContentBlocks = ($) => {
  const root = $('main').first().length ? $('main').first() :
    ($('article').first().length ? $('article').first() : $('body'));
  const selectors = 'h1,h2,h3,h4,strong,p,li,dt,dd,blockquote,figcaption,table,tr,details,summary,section,article,div';
  const blocks = [];

  root.find(selectors).each((_, element) => {
    const text = elementText($, element);
    if (!text || text.length > 2400) return;
    if (!isContentElement($, element)) return;
    blocks.push({ element, text });
  });

  return blocks;
};

const collectVisibleData = ($) => {
  const sections = SECTION_KEYS.reduce((acc, key) => ({ ...acc, [key]: [] }), {});
  const lines = [];
  const dayEntries = [];
  let currentSection = null;
  let currentDay = null;

  for (const block of getContentBlocks($)) {
    const { element, text } = block;
    const heading = isHeadingElement($, element) ? classifyHeading(text) : null;
    const dayHeading = parseDayHeading(text);

    lines.push(text);

    if (heading === 'itinerary-day' || dayHeading) {
      currentSection = 'itinerary';
      currentDay = {
        day: dayHeading ? dayHeading.day : dayEntries.length + 1,
        title: dayHeading ? dayHeading.title : null,
        description: '',
      };
      dayEntries.push(currentDay);
      if (dayHeading && dayHeading.title) sections.itinerary.push(dayHeading.title);
      continue;
    }

    if (heading) {
      currentSection = heading;
      currentDay = null;
      continue;
    }

    if (currentSection && sections[currentSection]) {
      sections[currentSection].push(text);
      if (currentSection === 'itinerary' && currentDay) {
        currentDay.description = cleanText(`${currentDay.description} ${text}`);
      }
    }
  }

  return {
    lines: unique(lines).slice(0, 900),
    sections,
    dayEntries: dayEntries
      .map((entry) => ({ ...entry, description: cleanText(entry.description) || null }))
      .filter((entry) => entry.title || entry.description),
  };
};

const extractLabeledValue = (lines, labels) => {
  const normalizedLabels = labels.map((label) => label.toLowerCase());
  for (const line of lines) {
    const cleaned = cleanText(line);
    const [rawLabel, ...rest] = cleaned.split(/\s*[:|]\s*/);
    if (rest.length) {
      const label = cleanText(rawLabel).toLowerCase();
      if (normalizedLabels.some((candidate) => label.includes(candidate))) {
        return cleanText(rest.join(':'));
      }
    }

    for (const label of normalizedLabels) {
      const pattern = new RegExp(`\\b${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b\\s*[:\\-–—]?\\s*(.+)$`, 'i');
      const match = cleaned.match(pattern);
      if (match && match[1] && match[1].length < 180) return cleanText(match[1]);
    }
  }
  return null;
};

const parseItineraryFromLines = (lines) => {
  const entries = [];
  let current = null;

  for (const line of lines) {
    const day = parseDayHeading(line);
    if (day) {
      current = {
        day: day.day,
        title: day.title || `Day ${day.day}`,
        description: '',
      };
      entries.push(current);
      continue;
    }

    if (current) {
      current.description = cleanText(`${current.description} ${line}`);
    }
  }

  return entries.map((entry) => ({
    day: entry.day,
    title: entry.title || null,
    description: entry.description || null,
  }));
};

const parseFaqsFromLines = (lines) => {
  const faqs = [];
  let currentQuestion = null;

  for (const line of lines) {
    const questionMatch = line.match(/^(?:q\.?|question)?\s*[:\-–—]?\s*(.+\?)$/i);
    if (questionMatch) {
      if (currentQuestion) faqs.push({ question: currentQuestion, answer: null });
      currentQuestion = cleanText(questionMatch[1]);
      continue;
    }

    const answerMatch = line.match(/^(?:a\.?|answer)\s*[:\-–—]\s*(.+)$/i);
    if (answerMatch && currentQuestion) {
      faqs.push({ question: currentQuestion, answer: cleanText(answerMatch[1]) || null });
      currentQuestion = null;
      continue;
    }

    if (currentQuestion && line.length > 8) {
      faqs.push({ question: currentQuestion, answer: cleanText(line) || null });
      currentQuestion = null;
    }
  }

  if (currentQuestion) faqs.push({ question: currentQuestion, answer: null });
  return faqs;
};

const extractFaqsFromHtml = ($) => {
  const faqs = [];

  $('details').each((_, element) => {
    const question = cleanText($(element).find('summary').first().text());
    const clone = $(element).clone();
    clone.find('summary').remove();
    const answer = cleanText(clone.text());
    if (question || answer) faqs.push({ question: question || null, answer: answer || null });
  });

  $('[class*="faq"], [id*="faq"], [class*="accordion"], [class*="collapse"]').each((_, container) => {
    const questionNodes = $(container).find('h3,h4,strong,button,summary,[class*="question"],[class*="title"]').filter((__, element) => {
      const text = cleanText($(element).text());
      return text.length > 5 && (/\?$/.test(text) || /^(what|when|where|why|how|is|are|can|do|does|will|which)\b/i.test(text));
    });

    questionNodes.each((__, questionElement) => {
      const question = cleanText($(questionElement).text());
      const answer = firstNonEmpty(
        $(questionElement).nextAll('p,div,li,[class*="answer"],[class*="content"],[class*="body"]').slice(0, 3).map((___, answerElement) => cleanText($(answerElement).text())).get(),
        $(questionElement).parent().next().text()
      );
      if (question || answer) faqs.push({ question: question || null, answer: answer || null });
    });
  });

  return uniqueFaqs(faqs);
};

const imageDimensionsFromUrl = (url) => {
  const text = String(url || '');
  const match = text.match(/(?:^|[^\d])(\d{3,5})\s*[xX]\s*(\d{3,5})(?:[^\d]|$)/);
  if (!match) return null;
  return { width: Number(match[1]), height: Number(match[2]) };
};

const getImageCandidates = (node, baseUrl) => {
  const candidates = [];
  const add = (value, width = null, height = null) => {
    for (const url of normalizeImageValue(value, baseUrl)) {
      candidates.push({ url, width, height });
    }
  };

  add(node.attr('src'), Number(node.attr('width')) || null, Number(node.attr('height')) || null);
  add(node.attr('data-src'), Number(node.attr('data-width')) || null, Number(node.attr('data-height')) || null);
  add(node.attr('data-lazy-src'));
  add(node.attr('data-original'));
  add(node.attr('data-large'));
  add(node.attr('data-bg'));

  const srcset = node.attr('srcset');
  if (srcset) {
    for (const entry of srcset.split(',')) {
      const [rawUrl, descriptor] = entry.trim().split(/\s+/);
      const width = descriptor && /w$/i.test(descriptor) ? Number(descriptor.replace(/\D/g, '')) : null;
      add(rawUrl, width, null);
    }
  }

  return candidates;
};

const isLikelyLargeTravelImage = (candidate, marker, isMetaImage = false) => {
  if (!candidate.url) return false;
  if (/\.(svg|ico)(?:$|\?)/i.test(candidate.url)) return false;
  if (/(logo|icon|avatar|profile|social|facebook|instagram|twitter|youtube|linkedin|whatsapp|sprite|favicon|loader|placeholder)/i.test(`${marker} ${candidate.url}`)) {
    return false;
  }

  const inferred = imageDimensionsFromUrl(candidate.url);
  const width = candidate.width || (inferred && inferred.width);
  const height = candidate.height || (inferred && inferred.height);
  if (width || height) return Math.max(width || 0, height || 0) >= 400;
  if (isMetaImage) return true;
  if (/(hero|banner|cover|gallery|slider|swiper|carousel|tour|trip|package|destination|image|photo|thumb)/i.test(marker)) return true;
  return true;
};

const extractImagesFromHtml = ($, baseUrl, metaImages = []) => {
  const images = [];

  for (const url of metaImages) {
    if (isLikelyLargeTravelImage({ url }, 'meta og twitter', true)) images.push(url);
  }

  $('img, source').each((_, element) => {
    const node = $(element);
    const attrs = element.attribs || {};
    const marker = `${attrs.id || ''} ${attrs.class || ''} ${attrs.alt || ''} ${attrs.title || ''}`.toLowerCase();
    for (const candidate of getImageCandidates(node, baseUrl)) {
      if (isLikelyLargeTravelImage(candidate, marker)) images.push(candidate.url);
    }
  });

  $('[style*="background"]').each((_, element) => {
    const style = $(element).attr('style') || '';
    const marker = `${$(element).attr('id') || ''} ${$(element).attr('class') || ''}`.toLowerCase();
    for (const match of style.matchAll(/url\(["']?([^"')]+)["']?\)/gi)) {
      const url = normalizeUrl(match[1], baseUrl);
      if (url && isLikelyLargeTravelImage({ url }, marker)) images.push(url);
    }
  });

  return uniqueUrls(images).slice(0, 24);
};

const sectionList = (sections, key) => unique(sections[key] || []);

const isThrillophiliaUrl = (finalUrl) => {
  try {
    return new URL(finalUrl).hostname.toLowerCase().includes('thrillophilia.com');
  } catch {
    return false;
  }
};

const extractListBySelectors = ($, selectors) => unique(selectors.flatMap((selector) => (
  $(selector).map((_, element) => cleanText($(element).text())).get()
)));

const extractTextBySelectors = ($, selectors) => firstNonEmpty(...selectors.map((selector) => $(selector).first().text()));

const extractThrillophiliaData = ($, finalUrl) => {
  if (!isThrillophiliaUrl(finalUrl)) return {};

  const title = extractTextBySelectors($, ['h1', '[class*="title"] h1', '[class*="package-title"]']);
  const overview = extractTextBySelectors($, [
    '[id*="overview"]',
    '[class*="overview"]',
    '[class*="description"]',
    '[class*="about"]',
  ]);
  const highlights = extractListBySelectors($, [
    '[id*="highlight"] li',
    '[class*="highlight"] li',
    '[class*="experience"] li',
  ]);
  const inclusions = extractListBySelectors($, [
    '[id*="inclusion"] li',
    '[class*="inclusion"] li',
    '[class*="included"] li',
  ]);
  const exclusions = extractListBySelectors($, [
    '[id*="exclusion"] li',
    '[class*="exclusion"] li',
    '[class*="excluded"] li',
  ]);
  const itineraryLines = extractListBySelectors($, [
    '[id*="itinerary"] h3, [id*="itinerary"] h4, [id*="itinerary"] p, [id*="itinerary"] li',
    '[class*="itinerary"] h3, [class*="itinerary"] h4, [class*="itinerary"] p, [class*="itinerary"] li',
    '[class*="day"] h3, [class*="day"] h4, [class*="day"] p',
  ]);
  const pricingText = extractTextBySelectors($, ['[class*="price"]', '[id*="price"]', '[class*="cost"]']);

  return {
    title,
    overview,
    highlights,
    inclusions,
    exclusions,
    itinerary: parseItineraryFromLines(itineraryLines),
    price: parsePrice(pricingText),
    duration: normalizeDuration(extractLabeledValue(itineraryLines, ['duration']) || extractTextBySelectors($, ['[class*="duration"]', '[id*="duration"]'])),
    destination: pickDestination([
      extractTextBySelectors($, ['[class*="destination"]', '[id*="destination"]', '[class*="location"]']),
      destinationFromTitle(title),
    ]),
  };
};

const extractRegexData = (lines, title) => ({
  price: parsePrice(lines.find((line) => parsePrice(line)) || ''),
  duration: normalizeDuration(lines.find((line) => normalizeDuration(line)) || ''),
  destination: destinationFromTitle(title),
});

const skipJavaScriptTrivia = (source, startIndex) => {
  let cursor = startIndex;
  while (cursor < source.length) {
    while (cursor < source.length && /\s/.test(source[cursor])) cursor += 1;

    if (source[cursor] === '/' && source[cursor + 1] === '/') {
      cursor += 2;
      while (cursor < source.length && source[cursor] !== '\n' && source[cursor] !== '\r') cursor += 1;
      continue;
    }

    if (source[cursor] === '/' && source[cursor + 1] === '*') {
      cursor += 2;
      while (cursor < source.length && !(source[cursor] === '*' && source[cursor + 1] === '/')) cursor += 1;
      if (cursor >= source.length) return -1;
      cursor += 2;
      continue;
    }

    return cursor;
  }

  return cursor;
};

const extractAssignedJsonLiteral = (source, assignmentIndex) => {
  const equalsIndex = source.indexOf('=', assignmentIndex);
  if (equalsIndex === -1) return null;

  const cursor = skipJavaScriptTrivia(source, equalsIndex + 1);
  if (cursor < 0 || !['{', '['].includes(source[cursor])) return null;

  const stack = [];
  let inString = false;
  let escaped = false;

  for (let index = cursor; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      escaped = false;
      continue;
    }

    if (char === '{') {
      stack.push('}');
    } else if (char === '[') {
      stack.push(']');
    } else if (char === stack[stack.length - 1]) {
      stack.pop();
      if (!stack.length) return source.slice(cursor, index + 1);
    }
  }

  logPreloadedStoreObjectLiteralAbort(source, {
    reason: 'reached EOF before brace depth returned to zero',
    assignmentIndex,
    equalsIndex,
    cursor,
    index: source.length,
    braceDepth: stack.length
  });
  return null;
};

const extractScriptContents = (html) => {
  const scripts = [];
  let match;
  SCRIPT_TAG_PATTERN.lastIndex = 0;

  while ((match = SCRIPT_TAG_PATTERN.exec(html)) !== null) {
    scripts.push(match[1]);
  }

  return scripts;
};

const parsePreloadedStoreScript = (source) => {
  const match = source.match(PRELOADED_STORE_ASSIGNMENT_PATTERN);
  if (!match || match.index == null) return null;

  const literal = extractAssignedJsonLiteral(source, match.index);
  if (!literal) return null;

  try {
    return JSON.parse(literal);
  } catch (error) {
    logger.warn('PRELOADED_STORE JSON parse failed', {
      literalLength: literal.length,
      message: error?.message || String(error),
    });
    return null;
  }
};

const extractPreloadedStore = (html) => {
  let scannedScripts = 0;

  for (const source of extractScriptContents(html)) {
    if (!/PRELOADED_STORE/i.test(source)) continue;
    scannedScripts += 1;

    const store = parsePreloadedStoreScript(source);
    if (store && typeof store === 'object') {
      logger.info('PRELOADED_STORE extracted', {
        scannedScripts,
        topLevelKeys: Object.keys(store).slice(0, 20),
      });
      return store;
    }
  }

  logger.info('PRELOADED_STORE not available', {
    scannedScripts,
  });
  return null;
};

const isTourObject = (value) => (
  value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  cleanText(value.name) &&
  Boolean(value.overview || value.long_description || value.custom_highlights)
);

const findTourObject = (store) => {
  const visited = new Set();
  const queue = [store];

  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== 'object' || visited.has(current)) continue;
    visited.add(current);

    if (isTourObject(current)) {
      logger.info('Tour object found');
      logger.debug('Tour keys', Object.keys(current).slice(0, 120));
      return current;
    }

    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }

    for (const value of Object.values(current)) {
      if (value && typeof value === 'object') queue.push(value);
    }
  }

  return null;
};

const htmlToText = (value) => {
  if (value == null) return null;
  if (typeof value !== 'string') return cleanText(value);
  if (!/[<>]/.test(value)) return cleanText(value);
  return cleanText(cheerio.load(value).text());
};

const richFieldToList = (value) => {
  if (Array.isArray(value)) return unique(value.flatMap(richFieldToList));
  if (value == null) return [];

  if (typeof value === 'object') {
    return unique([
      value.title,
      value.name,
      value.heading,
      value.text,
      value.description,
      value.value,
      value.content,
    ].flatMap(richFieldToList));
  }

  const text = String(value);
  if (/<li|<p|<br|<div/i.test(text)) {
    const $field = cheerio.load(text);
    const listItems = $field('li').map((_, element) => cleanText($field(element).text())).get();
    if (listItems.length) return unique(listItems);
    return unique($field('p,div,br').map((_, element) => cleanText($field(element).text())).get());
  }

  return toList(text);
};

const parseLongDescription = (description) => {
  const $description = cheerio.load(`<main>${description || ''}</main>`, { decodeEntities: true });
  removeNonContentElements($description);
  const visible = collectVisibleData($description);
  return {
    visible,
    text: cleanText($description('main').text()),
  };
};

const collectImageUrlsDeep = (value, baseUrl, depth = 0) => {
  if (depth > 5 || value == null) return [];
  if (typeof value === 'string') return normalizeImageValue(value, baseUrl);
  if (Array.isArray(value)) return value.flatMap((entry) => collectImageUrlsDeep(entry, baseUrl, depth + 1));
  if (typeof value !== 'object') return [];

  const urls = [];
  for (const [key, entry] of Object.entries(value)) {
    if (/(image|img|photo|gallery|media|banner|cover|thumbnail|url|src)/i.test(key)) {
      urls.push(...collectImageUrlsDeep(entry, baseUrl, depth + 1));
    }
  }
  return urls;
};

const normalizeTourItinerary = (value) => {
  const entries = Array.isArray(value)
    ? value
    : (value && typeof value === 'object' && Array.isArray(value.itinerary_days) ? value.itinerary_days : []);
  if (!entries.length) return [];

  return uniqueItinerary(entries.map((entry, index) => {
    if (typeof entry === 'string') return entry;
    if (!entry || typeof entry !== 'object') return null;

    const rawDay = entry.day || entry.day_number || entry.dayNumber || entry.day_count || entry.sequence || entry.position || index + 1;
    const dayNumber = typeof rawDay === 'number' ? rawDay : Number(String(rawDay).replace(/\D/g, ''));
    const title = firstNonEmpty(entry.title, entry.name, entry.day_title, entry.heading, entry.location);
    const eventDescriptions = Array.isArray(entry.events)
      ? entry.events.map((event) => cleanText([
        event.title,
        htmlToText(event.description),
      ].filter(Boolean).join(': ')))
      : [];
    const description = cleanText([
      htmlToText(firstNonEmpty(
        entry.description,
        entry.long_description,
        entry.overview,
        entry.details,
        entry.content,
        entry.body
      )),
      ...eventDescriptions,
    ].filter(Boolean).join(' '));

    return {
      day: Number.isFinite(dayNumber) ? dayNumber : index + 1,
      title,
      description,
    };
  }).filter(Boolean));
};

const getPrimaryVariant = (tour) => (
  Array.isArray(tour.variants) && tour.variants.length ? tour.variants[0] : null
);

const variantDuration = (variant) => {
  if (!variant || typeof variant !== 'object') return null;
  const days = Number(variant.duration_days);
  const nights = Number(variant.duration_nights);
  const hours = Number(variant.duration_hours);
  const minutes = Number(variant.duration_minutes);

  if (Number.isFinite(days) && days > 0 && Number.isFinite(nights) && nights > 0) {
    return `${days} Days / ${nights} Nights`;
  }
  if (Number.isFinite(days) && days > 0) return `${days} Days`;
  if (Number.isFinite(hours) && hours > 0 && Number.isFinite(minutes) && minutes > 0) {
    return `${hours} Hours / ${minutes} Minutes`;
  }
  if (Number.isFinite(hours) && hours > 0) return `${hours} Hours`;
  if (Number.isFinite(minutes) && minutes > 0) return `${minutes} Minutes`;
  return null;
};

const collectVariantField = (tour, field) => (
  Array.isArray(tour.variants) ? tour.variants.flatMap((variant) => variant && variant[field] ? variant[field] : []) : []
);

const collectVariantPrice = (tour, field) => {
  const primaryVariant = getPrimaryVariant(tour);
  return firstNonEmpty(
    tour[field],
    primaryVariant && primaryVariant[field],
    primaryVariant && Array.isArray(primaryVariant.bookable_inventories)
      ? primaryVariant.bookable_inventories.map((entry) => field === 'strike_through_price' ? entry.strike_through_amount : entry.amount)
      : []
  );
};

const normalizeTourFaqs = (value) => {
  if (!Array.isArray(value)) return [];
  return uniqueFaqs(value.map((entry) => {
    if (typeof entry === 'string') return { question: entry, answer: null };
    if (!entry || typeof entry !== 'object') return null;
    return {
      question: firstNonEmpty(entry.question, entry.title, entry.name, entry.heading),
      answer: htmlToText(firstNonEmpty(entry.answer, entry.description, entry.content, entry.body)),
    };
  }).filter(Boolean));
};

const extractTourPreviewFromPreloadedStore = (html, finalUrl, meta) => {
  const store = extractPreloadedStore(html);
  const tour = store ? findTourObject(store) : null;
  if (!tour || typeof tour !== 'object') return null;

  const primaryVariant = getPrimaryVariant(tour);
  const longDescription = firstNonEmpty(tour.long_description, tour.description);
  const longDescriptionData = parseLongDescription(longDescription);
  const galleryImages = uniqueUrls([
    collectImageUrlsDeep(tour, finalUrl),
    normalizeImageValue([
      tour.image,
      tour.image_url,
      tour.cover_image,
      tour.banner_image,
      tour.hero_image,
      tour.thumbnail,
      tour.gallery,
      tour.gallery_images,
      tour.images,
      tour.photos,
      tour.media,
    ], finalUrl),
  ]).slice(0, 12);
  const overview = htmlToText(firstNonEmpty(tour.overview, longDescription));
  const duration = normalizeDuration(firstNonEmpty(
    variantDuration(primaryVariant),
    tour.duration,
    overview,
    tour.summarized_duration,
    longDescriptionData.text
  ));
  const inclusions = unique([
    richFieldToList(collectVariantField(tour, 'inclusions')),
    richFieldToList(tour.inclusions),
    richFieldToList(tour.includes),
    sectionList(longDescriptionData.visible.sections, 'inclusions'),
  ]);
  const exclusions = unique([
    richFieldToList(collectVariantField(tour, 'exclusions')),
    richFieldToList(tour.exclusions),
    richFieldToList(tour.excludes),
    sectionList(longDescriptionData.visible.sections, 'exclusions'),
  ]);
  const highlights = unique([
    richFieldToList(tour.custom_highlights),
    richFieldToList(tour.highlights),
    sectionList(longDescriptionData.visible.sections, 'highlights'),
  ]);

  logger.info('PRELOADED_STORE tour preview extracted', {
    title: tour?.name,
    galleryImages: galleryImages.length,
    highlights: highlights.length,
    itinerary: normalizeTourItinerary(tour.itinerary).length
  });

  return {
    preview: normalizePreview({
      title: tour.name,
      destination: pickDestination([getNodeText(tour.primary_destination), tour.primary_destination]),
      duration,
      price: parseDirectPrice(collectVariantPrice(tour, 'starting_price')),
      discountPrice: parseDirectPrice(collectVariantPrice(tour, 'strike_through_price')),
      overview,
      description: htmlToText(longDescription),
      highlights,
      inclusions,
      exclusions,
      itinerary: normalizeTourItinerary(tour.itinerary),
      gallery: galleryImages,
      bestTime: firstNonEmpty(tour.best_time, tour.bestTime, tour.best_time_to_visit, tour.season),
      difficulty: firstNonEmpty(tour.trip_difficulty, tour.difficulty),
      faqs: normalizeTourFaqs(tour.faqs),
      metaTitle: meta.title,
      metaDescription: meta.description,
      slug: slugify(tour.name),
      heroImage: galleryImages[0] || null,
      galleryImages,
    }),
    contentLength: cleanText(`${overview || ''} ${longDescriptionData.text || ''}`).length,
    imageCount: galleryImages.length,
  };
};

const extractPackagePreview = (html, finalUrl) => {
  const $ = cheerio.load(html, { decodeEntities: true });
  $.root().attr('data-base-url', finalUrl);

  const meta = {
    title: firstNonEmpty(getMetaContent($, ['og:title', 'twitter:title']), $('title').first().text()),
    description: getMetaContent($, ['og:description', 'twitter:description', 'description']),
    images: uniqueUrls(normalizeImageValue([
      getMetaContent($, ['og:image']),
      getMetaContent($, ['twitter:image']),
      getMetaContent($, ['image']),
    ], finalUrl)),
  };
  const preloadedStorePreview = extractTourPreviewFromPreloadedStore(html, finalUrl, meta);
  if (preloadedStorePreview) return preloadedStorePreview;

  const jsonLdNodes = readJsonLd($);
  const jsonLd = extractJsonLdData(jsonLdNodes, finalUrl);
  const custom = extractThrillophiliaData($, finalUrl);

  removeNonContentElements($);
  const visible = collectVisibleData($);
  const htmlFaqs = extractFaqsFromHtml($);
  const htmlImages = extractImagesFromHtml($, finalUrl, meta.images);
  const bodyText = visible.lines.join('\n').slice(0, MAX_CONTENT_CHARACTERS);
  const h1Title = cleanText($('h1').first().text());
  const title = firstNonEmpty(jsonLd.title, custom.title, meta.title, h1Title);
  const regex = extractRegexData(visible.lines, title);

  const genericDestination = pickDestination([
    visible.sections.destination,
    extractLabeledValue(visible.lines, ['destination', 'location', 'places covered', 'route']),
  ]);
  const destination = pickDestination([
    jsonLd.destination,
    jsonLd.breadcrumbs,
    custom.destination,
    genericDestination,
    regex.destination,
  ]);
  const duration = normalizeDuration(firstNonEmpty(
    jsonLd.duration,
    custom.duration,
    extractLabeledValue(visible.lines, ['duration', 'tour duration', 'trip duration']),
    visible.sections.duration[0],
    regex.duration
  ));
  const price = parsePrice(firstNonEmpty(
    jsonLd.price,
    custom.price,
    extractLabeledValue(visible.lines, ['price', 'cost', 'package cost', 'starting from']),
    visible.sections.pricing,
    regex.price
  ));
  const overview = firstNonEmpty(
    jsonLd.overview,
    custom.overview,
    visible.sections.overview.join(' '),
    meta.description
  );
  const highlights = unique([
    jsonLd.highlights,
    custom.highlights,
    sectionList(visible.sections, 'highlights'),
  ]);
  const itinerary = uniqueItinerary([
    jsonLd.itinerary,
    custom.itinerary,
    visible.dayEntries,
    parseItineraryFromLines(visible.sections.itinerary),
  ]);
  const inclusions = unique([
    jsonLd.inclusions,
    custom.inclusions,
    sectionList(visible.sections, 'inclusions'),
  ]);
  const exclusions = unique([
    jsonLd.exclusions,
    custom.exclusions,
    sectionList(visible.sections, 'exclusions'),
  ]);
  const faqs = uniqueFaqs([
    jsonLd.faqs,
    htmlFaqs,
    parseFaqsFromLines(visible.sections.faqs),
  ]);
  const allImages = uniqueUrls([jsonLd.images, htmlImages]).slice(0, 12);

  return {
    preview: normalizePreview({
      title,
      destination,
      duration,
      price,
      overview,
      highlights,
      itinerary,
      inclusions,
      exclusions,
      bestTime: firstNonEmpty(extractLabeledValue(visible.lines, ['best time', 'best season', 'season']), visible.sections.bestTime),
      difficulty: firstNonEmpty(extractLabeledValue(visible.lines, ['difficulty', 'grade', 'level']), visible.sections.difficulty),
      faqs,
      metaTitle: meta.title || title,
      metaDescription: meta.description || overview,
      slug: slugify(title),
      heroImage: allImages[0] || null,
      galleryImages: allImages,
    }),
    contentLength: bodyText.length,
    imageCount: allImages.length,
  };
};

const uniqueFaqs = (groups) => {
  const seen = new Set();
  const faqs = [];

  for (const faq of groups.flat(Infinity)) {
    if (!faq || typeof faq !== 'object') continue;
    const question = cleanText(faq.question);
    const answer = cleanText(faq.answer);
    if (!question && !answer) continue;
    const key = `${question.toLowerCase()}::${answer.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    faqs.push({
      question: question || null,
      answer: answer || null,
    });
  }

  return faqs;
};

const uniqueItinerary = (groups) => {
  const seen = new Set();
  const itinerary = [];

  for (const entry of groups.flat(Infinity)) {
    if (!entry) continue;
    let normalized = null;
    if (typeof entry === 'string') {
      const day = parseDayHeading(entry);
      normalized = {
        day: day ? day.day : null,
        title: day ? day.title : null,
        description: day ? null : cleanText(entry),
      };
    } else if (typeof entry === 'object') {
      const day = typeof entry.day === 'number' && Number.isFinite(entry.day) ? entry.day : null;
      normalized = {
        day,
        title: cleanText(entry.title) || (day ? `Day ${day}` : null),
        description: cleanText(entry.description) || cleanText(entry.text) || cleanText(entry.details) || null,
      };
    }

    if (!normalized || (!normalized.title && !normalized.description)) continue;
    const key = `${normalized.day || ''}::${(normalized.title || '').toLowerCase()}::${(normalized.description || '').toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    itinerary.push(normalized);
  }

  return itinerary.sort((a, b) => {
    if (a.day == null || b.day == null) return 0;
    return a.day - b.day;
  });
};

const normalizeItinerary = (value) => {
  if (!Array.isArray(value)) return [];
  return uniqueItinerary(value);
};

const normalizeFaqs = (value) => {
  if (!Array.isArray(value)) return [];
  return uniqueFaqs(value);
};

const normalizePreview = (value) => {
  const source = value && typeof value === 'object' ? value : {};
  const normalized = {};

  for (const field of PACKAGE_PREVIEW_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(source, field) || source[field] == null) {
      normalized[field] = ARRAY_PREVIEW_FIELDS.has(field) ? [] : null;
      continue;
    }

    if (field === 'price') {
      normalized.price = parsePrice(source.price);
    } else if (field === 'duration') {
      normalized.duration = normalizeDuration(source.duration);
    } else if (field === 'destination') {
      normalized.destination = pickDestination([source.destination]);
    } else if (field === 'itinerary') {
      normalized.itinerary = normalizeItinerary(source.itinerary);
    } else if (field === 'faqs') {
      normalized.faqs = normalizeFaqs(source.faqs);
    } else if (ARRAY_PREVIEW_FIELDS.has(field)) {
      normalized[field] = field === 'galleryImages' ? uniqueUrls(source[field]) : unique(source[field]);
    } else {
      normalized[field] = cleanText(source[field]) || null;
    }
  }

  return normalized;
};

exports.analyzePackageUrl = onCall({
  cors: true,
  invoker: 'public',
  timeoutSeconds: 120,
  memory: '512MiB',
}, async (request) => {
  try {
    const email = request.auth && request.auth.token ? request.auth.token.email : '';
    if (!isAdminEmail(email)) {
      throw new HttpsError('permission-denied', 'Only Pravaah Travels admins can analyze package URLs.');
    }

    const { url } = request.data || {};
    const { html, finalUrl } = await fetchHtml(url);
    const result = extractPackagePreview(html, finalUrl);

    logger.info('Package URL analysis finished', {
      finalUrl,
      title: result?.preview?.title,
      destination: result?.preview?.destination,
      price: result?.preview?.price,
    });

    if (!result.contentLength && !result.preview.title && !result.preview.overview) {
      throw new HttpsError('failed-precondition', 'No readable package content was found on this page.');
    }

    return {
      preview: result.preview,
      source: {
        url: finalUrl,
        characterCount: result.contentLength,
        imageCandidateCount: result.imageCount,
      },
    };
  } catch (err) {
    logger.error("FULL ERROR", {
      message: err?.message,
      code: err?.code,
      stack: err?.stack
    });
    throw err;
  }
});
