import * as mammoth from 'mammoth';

export type ImportedItineraryDay = {
  day: number | null;
  title: string | null;
  location: string | null;
  description: string | null;
  images: string[];
};

export type ImportedFaq = {
  question: string | null;
  answer: string | null;
};

export type ImportedPackageOption = {
  title: string | null;
  description: string | null;
  price: number | null;
  originalPrice: number | null;
  inclusions: string[];
};

export type PackageImportSummary = {
  parsedFieldCount: number;
  totalFieldCount: number;
  itineraryDayCount: number;
  packageOptionCount: number;
  faqCount: number;
  warningCount: number;
  message: string;
};

export type StructuredPackageImport = {
  title: string | null;
  destination: string | null;
  location: string | null;
  category: string | null;
  bookingType: string | null;
  maxGuests: number | null;
  duration: string | null;
  pricePerPerson: number | null;
  offerPrice: number | null;
  originalPrice: number | null;
  packageCode: string | null;
  pickup: string | null;
  homepageActivity: string | null;
  shortSummary: string | null;
  fullDescription: string | null;
  heroImage: string | null;
  bannerImage: string | null;
  galleryImages: string[];
  highlights: string[];
  packageOptionsText: string;
  packageOptions: ImportedPackageOption[];
  itinerary: ImportedItineraryDay[];
  knowBeforeYouGo: string[];
  thingsToCarry: string[];
  inclusions: string[];
  exclusions: string[];
  metaTitle: string | null;
  metaDescription: string | null;
  seoKeywords: string[];
  departureDates: string[];
  faqs: ImportedFaq[];
  policies: string[];
  warnings: string[];
  summary: PackageImportSummary;
};

type ScalarField =
  | 'title'
  | 'destination'
  | 'location'
  | 'category'
  | 'bookingType'
  | 'maxGuests'
  | 'duration'
  | 'pricePerPerson'
  | 'offerPrice'
  | 'originalPrice'
  | 'packageCode'
  | 'pickup'
  | 'homepageActivity'
  | 'shortSummary'
  | 'fullDescription'
  | 'heroImage'
  | 'bannerImage'
  | 'metaTitle'
  | 'metaDescription';

type ListField =
  | 'galleryImages'
  | 'highlights'
  | 'knowBeforeYouGo'
  | 'thingsToCarry'
  | 'inclusions'
  | 'exclusions'
  | 'seoKeywords'
  | 'departureDates'
  | 'policies';

type ImportField = ScalarField | ListField | 'packageOptionsText' | 'faqs';
type DayField = keyof Omit<ImportedItineraryDay, 'day'>;

type FieldDefinition<Field extends string> = {
  field: Field;
  aliases: string[];
};

const TOTAL_IMPORT_FIELDS = 31;
const MAX_IMPORT_ITINERARY_DAYS = 365;

const GROUP_HEADINGS = new Set([
  'package',
  'general',
  'pricing & media',
  'pricing and media',
  'image references',
  'day-wise itinerary',
  'day wise itinerary',
  'daywise itinerary',
  'itinerary',
  'seo',
]);

const FIELD_ALIASES: Array<FieldDefinition<ImportField>> = [
  { field: 'title', aliases: ['package title', 'tour title'] },
  { field: 'destination', aliases: ['destination', 'primary destination'] },
  { field: 'location', aliases: ['location', 'region'] },
  { field: 'category', aliases: ['category', 'package category'] },
  { field: 'bookingType', aliases: ['booking type'] },
  { field: 'maxGuests', aliases: ['max guests', 'maximum guests'] },
  { field: 'duration', aliases: ['duration', 'tour duration'] },
  { field: 'pricePerPerson', aliases: ['price per person', 'package price', 'current price'] },
  { field: 'offerPrice', aliases: ['offer price', 'sale price', 'discounted price'] },
  { field: 'originalPrice', aliases: ['original price', 'list price', 'mrp'] },
  { field: 'packageCode', aliases: ['package code', 'tour code'] },
  { field: 'pickup', aliases: ['pickup point', 'pickup / meeting point', 'pickup meeting point', 'meeting point'] },
  { field: 'homepageActivity', aliases: ['homepage activity', 'related homepage activity'] },
  { field: 'shortSummary', aliases: ['short summary', 'short summary description', 'short description'] },
  { field: 'fullDescription', aliases: ['full description', 'full story / description', 'full story description', 'overview'] },
  { field: 'heroImage', aliases: ['hero banner', 'hero image', 'package cover image', 'cover image'] },
  { field: 'bannerImage', aliases: ['banner image', 'package banner image'] },
  { field: 'galleryImages', aliases: ['gallery images', 'gallery'] },
  { field: 'highlights', aliases: ['highlights', 'package highlights'] },
  { field: 'packageOptionsText', aliases: ['package options', 'package option'] },
  { field: 'knowBeforeYouGo', aliases: ['know before you go'] },
  { field: 'thingsToCarry', aliases: ['things to carry', 'packing list'] },
  { field: 'inclusions', aliases: ['holiday inclusions', 'inclusions', 'included'] },
  { field: 'exclusions', aliases: ['holiday exclusions', 'exclusions', 'excluded'] },
  { field: 'metaTitle', aliases: ['seo title', 'meta title'] },
  { field: 'metaDescription', aliases: ['seo description', 'meta description'] },
  { field: 'seoKeywords', aliases: ['seo keywords', 'keywords'] },
  { field: 'departureDates', aliases: ['departure dates', 'departures'] },
  { field: 'faqs', aliases: ['faq', 'faqs', 'frequently asked questions'] },
  { field: 'policies', aliases: ['policies', 'policy'] },
];

const DAY_FIELD_ALIASES: Array<FieldDefinition<DayField>> = [
  { field: 'title', aliases: ['title', 'day title'] },
  { field: 'location', aliases: ['location', 'day location'] },
  { field: 'description', aliases: ['description', 'day description'] },
  { field: 'images', aliases: ['images', 'day images', 'image references'] },
];

const normalizeLabel = (value: string) => value
  .toLowerCase()
  .replace(/&amp;/g, '&')
  .replace(/[_\u2013\u2014]/g, ' ')
  .replace(/\s+/g, ' ')
  .replace(/\s*:\s*$/, '')
  .trim();

const cleanLine = (value: string) => value
  .replace(/\u00a0/g, ' ')
  .replace(/^[\s\u2502\u2503\u251c\u2514\u250c\u252c\u2534\u253c\u2570\u256d\u256e\u256f\u2500\u2501]+/, '')
  .replace(/[ \t]+/g, ' ')
  .trim();

const cleanListItem = (value: string) => cleanLine(value)
  .replace(/^\s*(?:[\u2022\u25cf\u25aa\u25e6\u2713\u2714]|[-*])\s+/, '')
  .replace(/^\s*\d+[.)]\s+/, '')
  .trim();

const unique = (values: string[]) => {
  const seen = new Set<string>();
  return values.filter((value) => {
    const cleaned = value.trim();
    const key = cleaned.toLocaleLowerCase();
    if (!cleaned || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map((value) => value.trim());
};

const parseNumber = (value: string): number | null => {
  const match = value.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
};

const createEmptySummary = (): PackageImportSummary => ({
  parsedFieldCount: 0,
  totalFieldCount: TOTAL_IMPORT_FIELDS,
  itineraryDayCount: 0,
  packageOptionCount: 0,
  faqCount: 0,
  warningCount: 0,
  message: 'No package fields were parsed.',
});

const emptyImport = (): StructuredPackageImport => ({
  title: null,
  destination: null,
  location: null,
  category: null,
  bookingType: null,
  maxGuests: null,
  duration: null,
  pricePerPerson: null,
  offerPrice: null,
  originalPrice: null,
  packageCode: null,
  pickup: null,
  homepageActivity: null,
  shortSummary: null,
  fullDescription: null,
  heroImage: null,
  bannerImage: null,
  galleryImages: [],
  highlights: [],
  packageOptionsText: '',
  packageOptions: [],
  itinerary: [],
  knowBeforeYouGo: [],
  thingsToCarry: [],
  inclusions: [],
  exclusions: [],
  metaTitle: null,
  metaDescription: null,
  seoKeywords: [],
  departureDates: [],
  faqs: [],
  policies: [],
  warnings: [],
  summary: createEmptySummary(),
});

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const matchLabel = <Field extends string>(
  line: string,
  definitions: Array<FieldDefinition<Field>>,
): { field: Field; inlineValue: string } | null => {
  const normalized = normalizeLabel(line);

  for (const definition of definitions) {
    for (const alias of definition.aliases) {
      const normalizedAlias = normalizeLabel(alias);
      if (normalized === normalizedAlias) return { field: definition.field, inlineValue: '' };

      const prefixPattern = new RegExp(`^${escapeRegExp(alias)}\\s*(?::|\\||-|\\u2013|\\u2014)\\s*(.+)$`, 'i');
      const match = line.match(prefixPattern);
      if (match) return { field: definition.field, inlineValue: match[1].trim() };
    }
  }

  return null;
};

const isControlLabel = (value: string) => {
  const normalized = normalizeLabel(value);
  return GROUP_HEADINGS.has(normalized)
    || /^day\s*0*\d+\b/i.test(value.trim())
    || Boolean(matchLabel(value, FIELD_ALIASES))
    || Boolean(matchLabel(value, DAY_FIELD_ALIASES));
};

const appendText = (current: string, value: string) => {
  const next = value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  if (!next) return current;
  if (!current) return next;
  if (/^[,.;:!?%)]/.test(next) || /[(\[]$/.test(current)) return `${current}${next}`;
  return `${current} ${next}`;
};

const htmlToLines = (html: string): string[] => {
  const parser = new DOMParser();
  const document = parser.parseFromString(html, 'text/html');
  const lines: string[] = [];
  let currentLine = '';

  const flush = () => {
    const cleaned = cleanLine(currentLine);
    if (cleaned) lines.push(cleaned);
    currentLine = '';
  };

  const visit = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      currentLine = appendText(currentLine, node.textContent || '');
      return;
    }

    if (!(node instanceof Element)) return;
    const tagName = node.tagName.toLowerCase();
    if (['script', 'style', 'noscript', 'svg', 'iframe', 'template'].includes(tagName)) return;

    if (tagName === 'br') {
      flush();
      return;
    }

    if (tagName === 'tr') {
      flush();
      const cells = Array.from(node.querySelectorAll(':scope > th, :scope > td'))
        .map((cell) => cleanLine(cell.textContent || ''))
        .filter(Boolean);
      if (cells.length) lines.push(cells.join(' | '));
      return;
    }

    if ((tagName === 'strong' || tagName === 'b') && isControlLabel(node.textContent || '')) {
      flush();
      lines.push(cleanLine(node.textContent || ''));
      return;
    }

    const isBlock = ['address', 'article', 'aside', 'blockquote', 'dd', 'details', 'div', 'dl', 'dt', 'figcaption',
      'figure', 'footer', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'li', 'main', 'nav', 'ol', 'p',
      'section', 'summary', 'table', 'tbody', 'thead', 'tfoot', 'ul'].includes(tagName);

    if (isBlock) flush();
    node.childNodes.forEach(visit);
    if (isBlock) flush();
  };

  document.body.childNodes.forEach(visit);
  flush();
  return lines.filter(Boolean);
};

const textToLines = (text: string): string[] => text
  .replace(/\r/g, '')
  .split('\n')
  .map(cleanLine)
  .filter(Boolean);

const extractMediaReferences = (lines: string[]) => unique(lines
  .map(cleanListItem)
  .map((line) => line.replace(/^url\s*:\s*/i, '').trim())
  .filter(Boolean));

const parseFaqBlock = (lines: string[]): ImportedFaq[] => {
  const faqs: ImportedFaq[] = [];
  let pendingQuestion: string | null = null;
  let pendingAnswer: string[] = [];

  const flushPending = () => {
    if (!pendingQuestion && !pendingAnswer.length) return;
    faqs.push({
      question: pendingQuestion,
      answer: pendingAnswer.join('\n').trim() || null,
    });
    pendingQuestion = null;
    pendingAnswer = [];
  };

  for (const rawLine of lines) {
    const line = cleanListItem(rawLine);
    if (!line) continue;
    const pipeIndex = line.indexOf('|');

    if (pipeIndex > 0) {
      flushPending();
      const question = line.slice(0, pipeIndex).replace(/^(?:q(?:uestion)?)[.:\s-]*/i, '').trim();
      const answer = line.slice(pipeIndex + 1).replace(/^(?:a(?:nswer)?)[.:\s-]*/i, '').trim();
      faqs.push({ question: question || null, answer: answer || null });
      continue;
    }

    const questionMatch = line.match(/^(?:q(?:uestion)?)[.:\s-]+(.+)$/i);
    if (questionMatch || line.endsWith('?')) {
      flushPending();
      pendingQuestion = (questionMatch?.[1] || line).trim();
      continue;
    }

    const answerMatch = line.match(/^(?:a(?:nswer)?)[.:\s-]+(.+)$/i);
    if (answerMatch) {
      pendingAnswer.push(answerMatch[1].trim());
    } else if (pendingQuestion) {
      pendingAnswer.push(line);
    } else {
      faqs.push({ question: line, answer: null });
    }
  }

  flushPending();
  return faqs;
};

const parsePackageOptions = (lines: string[]): ImportedPackageOption[] => lines
  .map(cleanListItem)
  .filter(Boolean)
  .filter((line) => normalizeLabel(line) !== 'title | description | price | original price | inclusions')
  .map((line) => {
    const [title = '', description = '', price = '', originalPrice = '', inclusions = ''] = line
      .split('|')
      .map((part) => part.trim());

    return {
      title: title || null,
      description: description || null,
      price: parseNumber(price),
      originalPrice: parseNumber(originalPrice),
      inclusions: unique(inclusions.split(/[,;]+/).map(cleanListItem)),
    };
  });

const assignField = (result: StructuredPackageImport, field: ImportField, rawLines: string[]) => {
  const lines = rawLines.map(cleanListItem).filter(Boolean);
  const joined = lines.join('\n').trim();
  if (!joined) return;

  if (field === 'maxGuests') {
    result.maxGuests = parseNumber(joined);
  } else if (field === 'pricePerPerson' || field === 'offerPrice' || field === 'originalPrice') {
    result[field] = parseNumber(joined);
  } else if (field === 'galleryImages') {
    result.galleryImages = extractMediaReferences(lines);
  } else if (field === 'heroImage' || field === 'bannerImage') {
    result[field] = extractMediaReferences(lines)[0] || null;
  } else if (field === 'highlights' || field === 'knowBeforeYouGo' || field === 'thingsToCarry'
    || field === 'inclusions' || field === 'exclusions' || field === 'seoKeywords'
    || field === 'departureDates' || field === 'policies') {
    result[field] = unique(lines.flatMap((line) => (
      field === 'seoKeywords'
        ? line.split(/[,;]+/).map((item) => item.trim())
        : [line]
    )));
  } else if (field === 'faqs') {
    result.faqs = parseFaqBlock(lines);
  } else if (field === 'packageOptionsText') {
    result.packageOptionsText = lines.join('\n');
    result.packageOptions = parsePackageOptions(lines);
  } else {
    result[field] = joined;
  }
};

const extractDurationDays = (duration: string | null): number | null => {
  if (!duration) return null;
  const match = duration.match(/\b(\d{1,3})\s*(?:days?|d)\b/i);
  if (!match) return null;
  const days = Number(match[1]);
  return Number.isInteger(days) && days > 0 && days <= MAX_IMPORT_ITINERARY_DAYS ? days : null;
};

const extractDurationNights = (duration: string | null): number | null => {
  if (!duration) return null;
  const match = duration.match(/\b(\d{1,3})\s*(?:nights?|n)\b/i);
  if (!match) return null;
  const nights = Number(match[1]);
  return Number.isInteger(nights) && nights >= 0 && nights <= MAX_IMPORT_ITINERARY_DAYS ? nights : null;
};

const reconcileLongItineraryDuration = (
  duration: string | null,
  itineraryLength: number,
): string | null => {
  if (itineraryLength <= 10 || itineraryLength > MAX_IMPORT_ITINERARY_DAYS) return duration;

  const durationDays = extractDurationDays(duration);
  if (durationDays === itineraryLength || (durationDays !== null && durationDays > 10)) return duration;

  const durationNights = extractDurationNights(duration);
  const nights = durationDays !== null && durationNights === durationDays - 1
    ? itineraryLength - 1
    : null;

  return nights === null
    ? `${itineraryLength} Days`
    : `${itineraryLength} Days / ${nights} Nights`;
};

const validateImport = (result: StructuredPackageImport) => {
  const warnings: string[] = [];
  const warnMissing = (label: string, value: unknown) => {
    const isMissing = value === null || value === undefined || value === ''
      || (Array.isArray(value) && value.length === 0);
    if (isMissing) warnings.push(`${label} was not found in the document.`);
  };

  warnMissing('Package Title', result.title);
  warnMissing('Destination', result.destination);
  warnMissing('Location', result.location);
  warnMissing('Category', result.category);
  warnMissing('Booking Type', result.bookingType);
  warnMissing('Duration', result.duration);
  warnMissing('Price Per Person', result.pricePerPerson);
  warnMissing('Package Code', result.packageCode);
  warnMissing('Short Summary', result.shortSummary);
  warnMissing('Full Description', result.fullDescription);
  warnMissing('Highlights', result.highlights);
  warnMissing('Itinerary', result.itinerary);
  warnMissing('Holiday Inclusions', result.inclusions);
  warnMissing('Holiday Exclusions', result.exclusions);

  if (result.maxGuests !== null && (!Number.isInteger(result.maxGuests) || result.maxGuests <= 0)) {
    warnings.push('Max Guests must be a positive whole number.');
  }
  if (result.pricePerPerson !== null && result.pricePerPerson <= 0) {
    warnings.push('Price Per Person must be greater than zero.');
  }
  if (result.offerPrice !== null && result.offerPrice <= 0) {
    warnings.push('Offer Price must be greater than zero when provided.');
  }
  if (result.originalPrice !== null && result.originalPrice <= 0) {
    warnings.push('Original Price must be greater than zero when provided.');
  }

  const comparisonPrice = result.originalPrice ?? result.pricePerPerson;
  if (result.offerPrice !== null && comparisonPrice !== null && result.offerPrice > comparisonPrice) {
    warnings.push('Offer Price is greater than the original package price.');
  }

  const durationDays = extractDurationDays(result.duration);
  if (result.duration && durationDays === null) {
    warnings.push('Duration should include a valid day count, for example "7 Days / 6 Nights".');
  }
  if (result.packageCode && !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(result.packageCode)) {
    warnings.push('Package Code should contain only letters, numbers, hyphens, or underscores.');
  }

  const itineraryDayNumbers = result.itinerary
    .map((day) => day.day)
    .filter((day): day is number => day !== null);
  if (new Set(itineraryDayNumbers).size !== itineraryDayNumbers.length) {
    warnings.push('The itinerary contains duplicate day numbers.');
  }
  result.itinerary.forEach((day, index) => {
    const label = `Day ${day.day ?? index + 1}`;
    if (!day.title) warnings.push(`${label} is missing a title.`);
    if (!day.description) warnings.push(`${label} is missing a description.`);
  });
  if (durationDays !== null && result.itinerary.length && durationDays !== result.itinerary.length) {
    warnings.push(`Duration says ${durationDays} days, but ${result.itinerary.length} itinerary days were found.`);
  }

  result.packageOptions.forEach((option, index) => {
    if (!option.title) warnings.push(`Package Option ${index + 1} is missing a title.`);
    if (option.price === null) warnings.push(`Package Option ${index + 1} is missing a valid price.`);
    if (option.price !== null && option.price <= 0) warnings.push(`Package Option ${index + 1} price must be greater than zero.`);
    if (option.originalPrice !== null && option.price !== null && option.originalPrice < option.price) {
      warnings.push(`Package Option ${index + 1} original price is lower than its current price.`);
    }
  });

  result.faqs.forEach((faq, index) => {
    if (!faq.question) warnings.push(`FAQ ${index + 1} is missing a question.`);
    if (!faq.answer) warnings.push(`FAQ ${index + 1} is missing an answer.`);
  });

  return unique(warnings);
};

const hasContent = (value: unknown) => value !== null && value !== undefined && value !== ''
  && (!Array.isArray(value) || value.length > 0);

const createSummary = (result: StructuredPackageImport): PackageImportSummary => {
  const contentValues: unknown[] = [
    result.title,
    result.destination,
    result.location,
    result.category,
    result.bookingType,
    result.maxGuests,
    result.duration,
    result.pricePerPerson,
    result.offerPrice,
    result.originalPrice,
    result.packageCode,
    result.pickup,
    result.homepageActivity,
    result.shortSummary,
    result.fullDescription,
    result.heroImage,
    result.bannerImage,
    result.galleryImages,
    result.highlights,
    result.packageOptions,
    result.itinerary,
    result.knowBeforeYouGo,
    result.thingsToCarry,
    result.inclusions,
    result.exclusions,
    result.metaTitle,
    result.metaDescription,
    result.seoKeywords,
    result.departureDates,
    result.faqs,
    result.policies,
  ];
  const parsedFieldCount = contentValues.filter(hasContent).length;

  return {
    parsedFieldCount,
    totalFieldCount: TOTAL_IMPORT_FIELDS,
    itineraryDayCount: result.itinerary.length,
    packageOptionCount: result.packageOptions.length,
    faqCount: result.faqs.length,
    warningCount: result.warnings.length,
    message: `Parsed ${parsedFieldCount} of ${TOTAL_IMPORT_FIELDS} package fields, ${result.itinerary.length} itinerary days, ${result.packageOptions.length} package options, and ${result.faqs.length} FAQs.`,
  };
};

const parseStructuredLines = (lines: string[]): StructuredPackageImport => {
  const result = emptyImport();
  let currentField: ImportField | null = null;
  let currentFieldLines: string[] = [];
  let currentDay: ImportedItineraryDay | null = null;
  let currentDayField: DayField | null = null;
  let currentDayLines: string[] = [];

  const flushField = () => {
    if (currentField) assignField(result, currentField, currentFieldLines);
    currentField = null;
    currentFieldLines = [];
  };

  const flushDayField = () => {
    if (!currentDay || !currentDayField) return;
    const values = currentDayLines.map(cleanListItem).filter(Boolean);
    if (currentDayField === 'images') {
      currentDay.images = extractMediaReferences(values);
    } else {
      currentDay[currentDayField] = values.join('\n').trim() || null;
    }
    currentDayField = null;
    currentDayLines = [];
  };

  const flushDay = () => {
    flushDayField();
    if (currentDay) result.itinerary.push(currentDay);
    currentDay = null;
  };

  for (const rawLine of lines) {
    const line = cleanLine(rawLine);
    if (!line) continue;
    const normalized = normalizeLabel(line);

    if (GROUP_HEADINGS.has(normalized)) {
      flushField();
      flushDay();
      continue;
    }

    const dayMatch = line.match(/^day\s*0*(\d+)(?:\s*(?::|\||-|\u2013|\u2014)\s*(.*))?$/i);
    if (dayMatch) {
      flushField();
      flushDay();
      currentDay = {
        day: Number(dayMatch[1]),
        title: dayMatch[2]?.trim() || null,
        location: null,
        description: null,
        images: [],
      };
      continue;
    }

    if (currentDay) {
      const dayFieldMatch = matchLabel(line, DAY_FIELD_ALIASES);
      if (dayFieldMatch) {
        flushDayField();
        currentDayField = dayFieldMatch.field;
        currentDayLines = dayFieldMatch.inlineValue ? [dayFieldMatch.inlineValue] : [];
        continue;
      }

      const packageFieldMatch = matchLabel(line, FIELD_ALIASES);
      if (packageFieldMatch) {
        flushDay();
        currentField = packageFieldMatch.field;
        currentFieldLines = packageFieldMatch.inlineValue ? [packageFieldMatch.inlineValue] : [];
        continue;
      }

      if (currentDayField) {
        currentDayLines.push(line);
      } else if (!currentDay.title) {
        currentDay.title = cleanListItem(line) || null;
      } else {
        currentDay.description = [currentDay.description, cleanListItem(line)].filter(Boolean).join('\n') || null;
      }
      continue;
    }

    const fieldMatch = matchLabel(line, FIELD_ALIASES);
    if (fieldMatch) {
      flushField();
      currentField = fieldMatch.field;
      currentFieldLines = fieldMatch.inlineValue ? [fieldMatch.inlineValue] : [];
    } else if (currentField) {
      currentFieldLines.push(line);
    }
  }

  flushField();
  flushDay();
  result.duration = reconcileLongItineraryDuration(result.duration, result.itinerary.length);
  result.warnings = validateImport(result);
  result.summary = createSummary(result);
  return result;
};

export const parsePackageDocument = async (file: File): Promise<StructuredPackageImport> => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  let lines: string[];

  if (extension === 'docx') {
    const converted = await mammoth.convertToHtml(
      { arrayBuffer: await file.arrayBuffer() },
      { includeDefaultStyleMap: true, ignoreEmptyParagraphs: false },
    );
    lines = htmlToLines(converted.value);
  } else if (extension === 'html' || extension === 'htm') {
    lines = htmlToLines(await file.text());
  } else if (extension === 'txt') {
    lines = textToLines(await file.text());
  } else {
    throw new Error('Unsupported file. Upload a DOCX, HTML, HTM, or TXT package document.');
  }

  if (!lines.length) throw new Error('The selected document does not contain readable package content.');
  return parseStructuredLines(lines);
};
