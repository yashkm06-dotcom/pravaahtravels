import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ClipboardPaste,
  FileText,
  Image as ImageIcon,
  Link,
  Loader2,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, auth } from '../../lib/firebase';
import type { PackageCmsInput, PackageHotel, PackageOption } from '../../types/packageCms';
import { publishImportedPackage, saveImportedDraftPackage } from '../../services/packageCmsService';
import {
  parsePackageDocument,
  type PackageImportSummary,
  type StructuredPackageImport,
} from '../../utils/packageFileImporter';
import TravelMedia from '../TravelMedia';

type ImporterItineraryDay = {
  day: number | null;
  title: string | null;
  description: string | null;
  location?: string | null;
  images?: string[] | null;
};

type ImporterFaq = {
  question: string | null;
  answer: string | null;
};

type AIPackagePreview = {
  title: string | null;
  destination: string | null;
  location: string | null;
  category: string | null;
  bookingType: string | null;
  maxGuests: number | null;
  duration: string | null;
  price: number | null;
  pricePerPerson: number | null;
  offerPrice: number | null;
  originalPrice: number | null;
  packageCode: string | null;
  pickup: string | null;
  homepageActivity: string | null;
  shortSummary: string | null;
  fullDescription: string | null;
  overview: string | null;
  highlights: string[] | null;
  itinerary: ImporterItineraryDay[] | null;
  hotels: PackageHotel[] | null;
  inclusions: string[] | null;
  exclusions: string[] | null;
  packageOptions: PackageOption[] | null;
  knowBeforeYouGo: string[] | null;
  thingsToCarry: string[] | null;
  policies: string[] | null;
  bestTime: string | null;
  difficulty: string | null;
  difficultyLevel: number | null;
  faqs: ImporterFaq[] | null;
  metaTitle: string | null;
  metaDescription: string | null;
  seoKeywords: string[] | null;
  departureDates: string[] | null;
  slug: string | null;
  heroImage: string | null;
  bannerImage: string | null;
  galleryImages: string[] | null;
};

type AnalyzePackageUrlResponse = {
  preview?: AIPackagePreview;
  source?: {
    url?: string;
    characterCount?: number;
    imageCandidateCount?: number;
  };
};

type BulkImportEntry = {
  id: string;
  file: File;
  preview: AIPackagePreview | null;
  warnings: string[];
  error: string;
  status: 'parsing' | 'ready' | 'needs_review' | 'error' | 'importing' | 'imported';
  packageId?: string;
};

const functions = getFunctions(app);
const analyzePackageUrl = httpsCallable<{ url: string }, AnalyzePackageUrlResponse>(functions, 'analyzePackageUrl');

const emptyPreview: AIPackagePreview = {
  title: null,
  destination: null,
  location: null,
  category: null,
  bookingType: null,
  maxGuests: null,
  duration: null,
  price: null,
  pricePerPerson: null,
  offerPrice: null,
  originalPrice: null,
  packageCode: null,
  pickup: null,
  homepageActivity: null,
  shortSummary: null,
  fullDescription: null,
  overview: null,
  highlights: null,
  itinerary: null,
  hotels: null,
  inclusions: null,
  exclusions: null,
  packageOptions: null,
  knowBeforeYouGo: null,
  thingsToCarry: null,
  policies: null,
  bestTime: null,
  difficulty: null,
  difficultyLevel: null,
  faqs: null,
  metaTitle: null,
  metaDescription: null,
  seoKeywords: null,
  departureDates: null,
  slug: null,
  heroImage: null,
  bannerImage: null,
  galleryImages: null,
};

const isValidHttpUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const listToText = (value: string[] | null | undefined) => (value || []).join('\n');

const textToList = (value: string) => {
  const lines = value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.length ? lines : null;
};

const parseNumberValue = (value: string) => {
  const cleaned = value.replace(/[^\d.]/g, '');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const packageOptionsToText = (value: PackageOption[] | null | undefined) => (value || [])
  .map((option) => [
    option.title,
    option.description || '',
    option.price ?? '',
    option.originalPrice ?? '',
    (option.inclusions || []).join(', '),
  ].join(' | '))
  .join('\n');

const textToPackageOptions = (value: string): PackageOption[] | null => {
  const options = value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, description = '', price = '', originalPrice = '', inclusionsText = ''] = line.split('|').map((part) => part.trim());
      return {
        title,
        description: description || null,
        price: parseNumberValue(price),
        originalPrice: parseNumberValue(originalPrice),
        inclusions: inclusionsText
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      };
    })
    .filter((option) => option.title);

  return options.length ? options : null;
};

const hotelsToText = (value: PackageHotel[] | null | undefined) => (value || [])
  .map((hotel) => [hotel.city || '', hotel.hotel || '', hotel.nights ?? ''].join(' | '))
  .join('\n');

const textToHotels = (value: string): PackageHotel[] | null => {
  const hotels = value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [city = '', hotel = '', nights = ''] = line.split('|').map((part) => part.trim());
      return {
        city: city || null,
        hotel: hotel || null,
        nights: parseNumberValue(nights),
      };
    })
    .filter((hotel) => hotel.city || hotel.hotel || hotel.nights !== null);

  return hotels.length ? hotels : null;
};

const parseDifficultyLevelInput = (value: string | number | null | undefined) => {
  const parsed = typeof value === 'number' ? value : Number(String(value || '').replace(/[^\d]/g, ''));
  if (!Number.isFinite(parsed)) return null;
  const rounded = Math.round(parsed);
  return rounded >= 1 && rounded <= 10 ? rounded : null;
};

const normalizePreview = (preview?: AIPackagePreview): AIPackagePreview => ({
  ...emptyPreview,
  ...(preview || {}),
});

const structuredImportToPreview = (imported: StructuredPackageImport): AIPackagePreview => ({
  ...emptyPreview,
  title: imported.title,
  destination: imported.destination,
  location: imported.location,
  category: imported.category,
  bookingType: imported.bookingType,
  maxGuests: imported.maxGuests,
  duration: imported.duration,
  price: imported.offerPrice ?? imported.pricePerPerson ?? imported.originalPrice,
  pricePerPerson: imported.pricePerPerson,
  offerPrice: imported.offerPrice,
  originalPrice: imported.originalPrice,
  packageCode: imported.packageCode,
  pickup: imported.pickup,
  homepageActivity: imported.homepageActivity,
  shortSummary: imported.shortSummary,
  fullDescription: imported.fullDescription,
  overview: imported.fullDescription || imported.shortSummary,
  heroImage: imported.heroImage || '',
  bannerImage: imported.bannerImage || '',
  galleryImages: imported.galleryImages || [],
  highlights: imported.highlights.length ? imported.highlights : null,
  packageOptions: imported.packageOptions.length
    ? imported.packageOptions.flatMap((option) => option.title ? [{
      title: option.title,
      description: option.description,
      price: option.price,
      originalPrice: option.originalPrice,
      inclusions: option.inclusions,
    }] : [])
    : textToPackageOptions(imported.packageOptionsText),
  itinerary: imported.itinerary.length ? imported.itinerary : null,
  knowBeforeYouGo: imported.knowBeforeYouGo.length ? imported.knowBeforeYouGo : null,
  thingsToCarry: imported.thingsToCarry.length ? imported.thingsToCarry : null,
  inclusions: imported.inclusions.length ? imported.inclusions : null,
  exclusions: imported.exclusions.length ? imported.exclusions : null,
  metaTitle: imported.metaTitle,
  metaDescription: imported.metaDescription,
  seoKeywords: imported.seoKeywords.length ? imported.seoKeywords : null,
  departureDates: imported.departureDates.length ? imported.departureDates : null,
  faqs: imported.faqs.length ? imported.faqs : null,
  policies: imported.policies.length ? imported.policies : null,
});

const getErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message || 'Package analysis failed.');
  }
  return 'Package analysis failed.';
};

const previewToPackageInput = (
  preview: AIPackagePreview,
  sourceUrl: string,
  parserVersion: string,
): PackageCmsInput => {
  const optionOriginalPrice = preview.packageOptions?.find((option) => option.originalPrice)?.originalPrice ?? null;
  const basePrice = preview.originalPrice ?? optionOriginalPrice ?? preview.pricePerPerson ?? preview.price ?? preview.offerPrice;
  const currentPrice = preview.offerPrice ?? preview.price ?? preview.pricePerPerson ?? basePrice;
  const hasOffer = currentPrice !== null && basePrice !== null && currentPrice < basePrice;
  const overview = preview.fullDescription || preview.overview || preview.shortSummary;

  return {
    title: preview.title || '',
    slug: preview.slug || undefined,
    sourceUrl: sourceUrl || null,
    heroImage: preview.heroImage || '',
    gallery: preview.galleryImages || [],
    activityId: preview.homepageActivity || null,
    duration: preview.duration || null,
    destinations: preview.destination ? [preview.destination] : [],
    destination: preview.destination || null,
    overview: overview || null,
    itinerary: (preview.itinerary || []).map((day, index) => ({
      day: day.day || index + 1,
      title: day.title || null,
      description: day.description || null,
      location: day.location || null,
      images: day.images || [],
    })),
    hotels: preview.hotels || [],
    pricing: {
      currency: 'INR',
      price: currentPrice,
      originalPrice: hasOffer ? basePrice : null,
      discount: null,
      priceType: 'Per Person',
      occupancy: null,
    },
    price: currentPrice,
    inclusions: preview.inclusions || [],
    exclusions: preview.exclusions || [],
    packageOptions: preview.packageOptions || [],
    knowBeforeYouGo: preview.knowBeforeYouGo || [],
    thingsToCarry: preview.thingsToCarry || [],
    difficultyLevel: preview.difficultyLevel || parseDifficultyLevelInput(preview.difficulty),
    faqs: (preview.faqs || []).map((faq) => ({
      question: faq.question || null,
      answer: faq.answer || null,
    })),
    policies: preview.policies || [],
    parserVersion,
    legacy: {
      title: preview.title || '',
      destination: preview.destination || '',
      location: preview.location || '',
      category: preview.category || '',
      bookingType: preview.bookingType || '',
      maxGuests: preview.maxGuests || 0,
      duration: preview.duration || '',
      price: basePrice || currentPrice || 0,
      offerPrice: hasOffer ? currentPrice : undefined,
      packageCode: preview.packageCode || '',
      pickup: preview.pickup || '',
      activityId: preview.homepageActivity || '',
      shortDescription: preview.shortSummary || preview.overview || '',
      fullDescription: overview || '',
      imageUrl: preview.heroImage || '',
      packageBannerUrl: preview.bannerImage || '',
      galleryImages: preview.galleryImages || [],
      highlights: preview.highlights || [],
      packageOptions: preview.packageOptions || [],
      knowBeforeYouGo: preview.knowBeforeYouGo || [],
      thingsToCarry: preview.thingsToCarry || [],
      difficultyLevel: preview.difficultyLevel || parseDifficultyLevelInput(preview.difficulty),
      departureDates: preview.departureDates || [],
      faqs: preview.faqs || [],
      policies: preview.policies || [],
      seoTitle: preview.metaTitle || '',
      seoDescription: preview.metaDescription || '',
      seoKeywords: (preview.seoKeywords || []).join(', '),
      featured: false,
    },
  };
};

type AiPackageImporterProps = {
  onPackagePersisted?: () => Promise<void> | void;
  onNavigateToPackages?: () => void;
  onNavigateToPackage?: (packageId: string) => void;
};

const createSlugPreview = (value: string) => value
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const formatPreviewPrice = (value: number | null | undefined) => (
  value === null || value === undefined || !Number.isFinite(value)
    ? 'Not provided'
    : `₹${value.toLocaleString('en-IN')}`
);

const isHtmlPackageFile = (file: File) => {
  const fileName = file.name.toLowerCase();
  return fileName.endsWith('.html') || fileName.endsWith('.htm');
};

const createBulkImportId = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

const getBulkValidationWarnings = (preview: AIPackagePreview, warnings: string[]) => {
  const validationWarnings = [...warnings];
  if (!preview.title?.trim()) validationWarnings.push('Package Title is missing.');
  if (!preview.destination?.trim()) validationWarnings.push('Destination is missing.');
  if (!preview.duration?.trim()) validationWarnings.push('Duration is missing.');
  if (preview.pricePerPerson === null && preview.offerPrice === null && preview.originalPrice === null && preview.price === null) {
    validationWarnings.push('Price is missing.');
  }
  return Array.from(new Set(validationWarnings));
};

export default function AiPackageImporter({
  onPackagePersisted,
  onNavigateToPackages,
  onNavigateToPackage,
}: AiPackageImporterProps) {
  const [packageUrl, setPackageUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState<'draft' | 'publish' | null>(null);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceFileName, setSourceFileName] = useState('');
  const [parserVersion, setParserVersion] = useState('deterministic-html-parser-v1');
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [draft, setDraft] = useState<AIPackagePreview | null>(null);
  const [openItineraryIndex, setOpenItineraryIndex] = useState<number | null>(0);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [importSummary, setImportSummary] = useState<PackageImportSummary | null>(null);
  const [pastedHtml, setPastedHtml] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isConfirmingImport, setIsConfirmingImport] = useState(false);
  const [publishedPackageTitle, setPublishedPackageTitle] = useState('');
  const [publishedPackageId, setPublishedPackageId] = useState('');
  const [bulkItems, setBulkItems] = useState<BulkImportEntry[]>([]);
  const [selectedBulkIds, setSelectedBulkIds] = useState<string[]>([]);
  const [isBulkParsing, setIsBulkParsing] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');
  const redirectTimeoutRef = useRef<number | null>(null);

  const galleryImages = useMemo(() => (draft?.galleryImages || []).filter(Boolean), [draft?.galleryImages]);
  const itinerary = draft?.itinerary || [];
  const faqs = draft?.faqs || [];
  const hotels = draft?.hotels || [];
  const previewSlug = draft?.slug || createSlugPreview(draft?.title || '');
  const previewPrice = draft?.pricePerPerson ?? draft?.originalPrice ?? draft?.price;

  const workflowWarnings = useMemo(() => {
    if (!draft) return importWarnings;

    const warnings = [...importWarnings];
    if (!draft.faqs?.length) warnings.push('Missing FAQ.');
    if (!draft.metaTitle || !draft.metaDescription) warnings.push('Missing SEO title or description.');
    if (!draft.highlights?.length) warnings.push('Missing Highlights.');

    const durationDays = Number(draft.duration?.match(/\d+/)?.[0] || 0);
    if (durationDays > 0) {
      const importedDays = new Set((draft.itinerary || []).map((day, index) => day.day || index + 1));
      for (let day = 1; day <= durationDays; day += 1) {
        if (!importedDays.has(day)) warnings.push(`Missing Day ${day}.`);
      }
    }

    return Array.from(new Set(warnings));
  }, [draft, importWarnings]);

  useEffect(() => () => {
    if (redirectTimeoutRef.current !== null) {
      window.clearTimeout(redirectTimeoutRef.current);
    }
  }, []);

  const resetImporter = () => {
    if (redirectTimeoutRef.current !== null) {
      window.clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }
    setPackageUrl('');
    setPastedHtml('');
    setError('');
    setSaveMessage('');
    setSourceUrl('');
    setSourceFileName('');
    setParserVersion('deterministic-html-parser-v1');
    setDraft(null);
    setOpenItineraryIndex(0);
    setImportWarnings([]);
    setImportSummary(null);
    setIsConfirmingImport(false);
    setPublishedPackageTitle('');
    setPublishedPackageId('');
    setBulkItems([]);
    setSelectedBulkIds([]);
    setIsBulkParsing(false);
    setIsBulkImporting(false);
    setBulkMessage('');
  };

  const updateDraftField = <Field extends keyof AIPackagePreview>(field: Field, value: AIPackagePreview[Field]) => {
    setDraft((current) => ({
      ...normalizePreview(current || undefined),
      [field]: value,
    }));
  };

  const updateItineraryField = (index: number, field: keyof ImporterItineraryDay, value: string) => {
    setDraft((current) => {
      const next = normalizePreview(current || undefined);
      const nextItinerary = [...(next.itinerary || [])];
      const currentDay = nextItinerary[index] || { day: index + 1, title: null, description: null };
      nextItinerary[index] = {
        ...currentDay,
        [field]: field === 'day'
          ? Number(value) || null
          : field === 'images'
            ? textToList(value) || []
            : value || null,
      };
      return { ...next, itinerary: nextItinerary };
    });
  };

  const updateFaqField = (index: number, field: keyof ImporterFaq, value: string) => {
    setDraft((current) => {
      const next = normalizePreview(current || undefined);
      const nextFaqs = [...(next.faqs || [])];
      nextFaqs[index] = {
        ...(nextFaqs[index] || { question: null, answer: null }),
        [field]: value || null,
      };
      return { ...next, faqs: nextFaqs };
    });
  };

  const processPackageDocument = async (file: File) => {
    setIsReadingFile(true);
    setError('');
    setSaveMessage('');
    setPublishedPackageTitle('');
    setPublishedPackageId('');
    setIsConfirmingImport(false);
    setSourceUrl('');
    setSourceFileName('');
    setDraft(null);
    setImportWarnings([]);
    setImportSummary(null);
    setBulkItems([]);
    setSelectedBulkIds([]);
    setBulkMessage('');

    try {
      const imported = await parsePackageDocument(file);
      setDraft(structuredImportToPreview(imported));
      setSourceFileName(file.name);
      setParserVersion('structured-document-v2');
      setImportWarnings(imported.warnings);
      setImportSummary(imported.summary);
      setPackageUrl('');
      setOpenItineraryIndex(imported.itinerary.length ? 0 : null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsReadingFile(false);
    }
  };

  const processBulkDocuments = async (files: File[]) => {
    const uniqueFiles = Array.from(
      new Map(files.filter(isHtmlPackageFile).map((file) => [createBulkImportId(file), file])).values(),
    );

    if (!uniqueFiles.length) {
      setError('Select one or more HTML or HTM package files.');
      return;
    }

    setIsBulkParsing(true);
    setError('');
    setSaveMessage('');
    setBulkMessage('');
    setPublishedPackageTitle('');
    setPublishedPackageId('');
    setIsConfirmingImport(false);
    setPackageUrl('');
    setPastedHtml('');
    setSourceUrl('');
    setSourceFileName('');
    setDraft(null);
    setImportWarnings([]);
    setImportSummary(null);
    setBulkItems(uniqueFiles.map((file) => ({
      id: createBulkImportId(file),
      file,
      preview: null,
      warnings: [],
      error: '',
      status: 'parsing',
    })));
    setSelectedBulkIds([]);

    const parsedItems = await Promise.all(uniqueFiles.map(async (file): Promise<BulkImportEntry> => {
      try {
        const imported = await parsePackageDocument(file);
        const preview = structuredImportToPreview(imported);
        const warnings = getBulkValidationWarnings(preview, imported.warnings);
        return {
          id: createBulkImportId(file),
          file,
          preview,
          warnings,
          error: '',
          status: warnings.length ? 'needs_review' : 'ready',
        };
      } catch (err) {
        return {
          id: createBulkImportId(file),
          file,
          preview: null,
          warnings: [],
          error: getErrorMessage(err),
          status: 'error',
        };
      }
    }));

    setBulkItems(parsedItems);
    setSelectedBulkIds(parsedItems.filter((item) => item.preview && !item.error).map((item) => item.id));
    setBulkMessage(`${parsedItems.filter((item) => item.preview).length} of ${parsedItems.length} package${parsedItems.length === 1 ? '' : 's'} parsed. Review validation warnings before importing.`);
    setIsBulkParsing(false);
  };

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const files = Array.from(input.files || []);
    if (files.length > 1) await processBulkDocuments(files);
    else if (files[0]) await processPackageDocument(files[0]);
    input.value = '';
  };

  const handleBulkDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    await processBulkDocuments(Array.from(input.files || []));
    input.value = '';
  };

  const handleDocumentDrop = async (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const files = Array.from(event.dataTransfer.files || []);
    if (!files.length) return;
    if (files.length > 1) {
      await processBulkDocuments(files);
      return;
    }

    if (!isHtmlPackageFile(files[0])) {
      setError('Drag and drop supports HTML or HTM files. Use Select File for DOCX or TXT documents.');
      return;
    }

    await processPackageDocument(files[0]);
  };

  const handlePasteHtml = async () => {
    if (!pastedHtml.trim()) {
      setError('Paste the package HTML before parsing.');
      return;
    }

    const file = new File([pastedHtml], 'pasted-package.html', { type: 'text/html' });
    await processPackageDocument(file);
  };

  const handleAnalyze = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedUrl = packageUrl.trim();

    if (!isValidHttpUrl(trimmedUrl)) {
      setError('Please enter a valid http or https package URL.');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setSaveMessage('');
    setPublishedPackageTitle('');
    setPublishedPackageId('');
    setIsConfirmingImport(false);
    setSourceUrl('');
    setSourceFileName('');
    setDraft(null);
    setImportWarnings([]);
    setImportSummary(null);

    try {
      const result = await analyzePackageUrl({ url: trimmedUrl });
      const response = result.data || {};
      if (!response.preview) {
        throw new Error('The importer returned no package preview.');
      }
      setDraft(normalizePreview(response.preview));
      setSourceUrl(response.source?.url || trimmedUrl);
      setParserVersion('deterministic-html-parser-v1');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePersistPackage = async (mode: 'draft' | 'publish') => {
    if (!draft) return;
    setIsSaving(mode);
    setError('');
    setSaveMessage('');

    try {
      const actorId = auth.currentUser?.uid || auth.currentUser?.email || 'admin';
      const input = previewToPackageInput(
        draft,
        sourceFileName ? '' : sourceUrl || packageUrl.trim(),
        parserVersion,
      );
      const savedPackage = mode === 'draft'
        ? await saveImportedDraftPackage(input, actorId)
        : await publishImportedPackage(input, actorId);
      await onPackagePersisted?.();
      setSaveMessage(`${mode === 'draft' ? 'Draft saved' : 'Package published'}: ${savedPackage.title}`);
      if (mode === 'publish') {
        setIsConfirmingImport(false);
        setPublishedPackageTitle(savedPackage.title);
        setPublishedPackageId(savedPackage.id);
        if (onNavigateToPackage) {
          onNavigateToPackage(savedPackage.id);
        } else if (onNavigateToPackages) {
          if (redirectTimeoutRef.current !== null) window.clearTimeout(redirectTimeoutRef.current);
          redirectTimeoutRef.current = window.setTimeout(onNavigateToPackages, 3500);
        }
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(null);
    }
  };

  const toggleBulkSelection = (id: string) => {
    setSelectedBulkIds((current) => current.includes(id)
      ? current.filter((selectedId) => selectedId !== id)
      : [...current, id]);
  };

  const handleBulkImport = async () => {
    const selectedItems = bulkItems.filter((item) => selectedBulkIds.includes(item.id) && item.preview);
    if (!selectedItems.length) {
      setError('Select at least one parsed package before importing.');
      return;
    }

    setIsBulkImporting(true);
    setError('');
    setBulkMessage('Importing selected packages...');
    let importedCount = 0;
    let failedCount = 0;

    try {
      const actorId = auth.currentUser?.uid || auth.currentUser?.email || 'admin';
      for (const item of selectedItems) {
        setBulkItems((current) => current.map((entry) => (
          entry.id === item.id ? { ...entry, status: 'importing', error: '' } : entry
        )));

        try {
          const input = previewToPackageInput(item.preview as AIPackagePreview, '', 'structured-document-v2');
          const savedPackage = await publishImportedPackage(input, actorId);
          importedCount += 1;
          setBulkItems((current) => current.map((entry) => (
            entry.id === item.id
              ? { ...entry, status: 'imported', packageId: savedPackage.id }
              : entry
          )));
        } catch (err) {
          failedCount += 1;
          setBulkItems((current) => current.map((entry) => (
            entry.id === item.id
              ? { ...entry, status: 'error', error: getErrorMessage(err) }
              : entry
          )));
        }
      }

      await onPackagePersisted?.();
      setBulkMessage(`${importedCount} package${importedCount === 1 ? '' : 's'} imported successfully${failedCount ? `, ${failedCount} failed.` : '.'}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsBulkImporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="relative overflow-hidden rounded-[28px] border border-stone-200 bg-[#071d28] p-6 text-white shadow-[0_24px_70px_rgba(7,29,40,0.18)] sm:p-8">
        <div className="absolute inset-0 bg-linear-to-br from-[#071d28] via-[#12323a] to-[#4DA528]/60" />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10 bg-white/8" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/70">
              <Sparkles className="h-3.5 w-3.5" />
              Beta Preview Tool
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">🤖 AI Package Importer (Beta)</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/68">
              Analyze a travel package URL or import a structured DOCX, HTML, or text document, then review every field before saving.
            </p>
          </div>
          <div className="rounded-[22px] border border-white/12 bg-white/10 p-5 text-sm text-white/70 backdrop-blur-md">
            {parserVersion}
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_18px_50px_rgba(18,38,32,0.08)] sm:p-6">
        <form onSubmit={handleAnalyze} className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <label className="block">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-stone-500">Paste Package URL</span>
            <div className="mt-2 flex items-center gap-3 rounded-[16px] border border-stone-200 bg-[#fcfbf9] px-4 py-3 focus-within:border-[#4DA528] focus-within:ring-2 focus-within:ring-[#4DA528]/15">
              <Link className="h-4 w-4 shrink-0 text-stone-400" />
              <input
                type="url"
                value={packageUrl}
                onChange={(event) => setPackageUrl(event.target.value)}
                placeholder="https://example.com/tours/kedarnath-package"
                className="w-full bg-transparent text-sm font-semibold text-stone-900 outline-none placeholder:text-stone-400"
                disabled={isAnalyzing || isReadingFile}
              />
            </div>
          </label>
          <button
            type="submit"
            disabled={isAnalyzing || isReadingFile}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[14px] bg-[#4DA528] px-6 text-xs font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_14px_30px_rgba(77,165,40,0.28)] transition hover:-translate-y-0.5 hover:bg-[#FF970D] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Analyze Package
          </button>
        </form>

        <div className="my-5 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-stone-200" />
          <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-400">or import a document</span>
          <span className="h-px flex-1 bg-stone-200" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <label
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false);
            }}
            onDrop={handleDocumentDrop}
            className={`flex min-h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-[18px] border border-dashed px-5 py-7 text-center transition ${
              isDragging
                ? 'border-[#4DA528] bg-[#4DA528]/10 ring-2 ring-[#4DA528]/15'
                : 'border-stone-300 bg-[#fcfbf9] hover:border-[#4DA528] hover:bg-[#4DA528]/5'
            } ${isAnalyzing || isReadingFile ? 'pointer-events-none opacity-60' : ''}`}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#4DA528]/10 text-[#4DA528]">
              {isReadingFile ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            </span>
            <span>
              <strong className="block text-sm font-extrabold text-stone-900">
                {isReadingFile ? 'Reading package document...' : 'Drop HTML here or select a file'}
              </strong>
              <span className="mt-1 block text-xs leading-5 text-stone-500">HTML and HTM for drag and drop. DOCX and TXT remain supported through file selection.</span>
            </span>
            <span className="rounded-full border border-stone-200 bg-white px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-700">
              Select File
            </span>
            <input
              type="file"
              accept=".docx,.html,.htm,.txt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/html,text/plain"
              multiple
              onChange={handleDocumentUpload}
              disabled={isAnalyzing || isReadingFile || isBulkParsing}
              className="sr-only"
            />
          </label>

          <div className="flex min-h-56 flex-col rounded-[18px] border border-stone-200 bg-[#fcfbf9] p-4">
            <label htmlFor="package-html-input" className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-stone-500">
              <ClipboardPaste className="h-4 w-4 text-[#4DA528]" />
              Paste HTML
            </label>
            <textarea
              id="package-html-input"
              value={pastedHtml}
              onChange={(event) => setPastedHtml(event.target.value)}
              placeholder="Paste the complete structured package HTML here..."
              disabled={isAnalyzing || isReadingFile}
              className="mt-3 min-h-32 flex-1 resize-y rounded-[14px] border border-stone-200 bg-white p-3 font-mono text-xs leading-5 text-stone-700 outline-none transition focus:border-[#4DA528] focus:ring-2 focus:ring-[#4DA528]/15"
            />
            <button
              type="button"
              onClick={handlePasteHtml}
              disabled={isAnalyzing || isReadingFile || !pastedHtml.trim()}
              className="mt-3 inline-flex items-center justify-center gap-2 rounded-[12px] bg-[#071d28] px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white transition hover:bg-[#4DA528] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ClipboardPaste className="h-4 w-4" />
              Parse Pasted HTML
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-[14px] border border-stone-200 bg-white px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-stone-700 transition hover:border-[#4DA528] hover:text-[#4DA528] ${isAnalyzing || isReadingFile || isBulkParsing ? 'pointer-events-none opacity-60' : ''}`}>
            <FileText className="h-4 w-4" />
            Select Multiple HTML Files
            <input
              type="file"
              accept=".html,.htm,text/html"
              multiple
              onChange={handleBulkDocumentUpload}
              disabled={isAnalyzing || isReadingFile || isBulkParsing}
              className="sr-only"
            />
          </label>
          <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-[14px] border border-stone-200 bg-white px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-stone-700 transition hover:border-[#4DA528] hover:text-[#4DA528] ${isAnalyzing || isReadingFile || isBulkParsing ? 'pointer-events-none opacity-60' : ''}`}>
            <Upload className="h-4 w-4" />
            Select HTML Folder
            <input
              type="file"
              accept=".html,.htm,text/html"
              onChange={handleBulkDocumentUpload}
              {...({ webkitdirectory: '', directory: '' } as unknown as React.InputHTMLAttributes<HTMLInputElement>)}
              disabled={isAnalyzing || isReadingFile || isBulkParsing}
              className="sr-only"
            />
          </label>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-[16px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {saveMessage && !publishedPackageTitle && (
          <div className="mt-4 rounded-[16px] border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            {saveMessage}
          </div>
        )}
        {publishedPackageTitle && (
          <div className="mt-4 flex flex-col gap-4 rounded-[18px] border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-extrabold">Package imported successfully</p>
                <p className="mt-1 text-sm text-emerald-700">{publishedPackageTitle} is now available in Packages.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(onNavigateToPackage || onNavigateToPackages) && (
                <button
                  type="button"
                  onClick={() => {
                    if (publishedPackageId && onNavigateToPackage) {
                      onNavigateToPackage(publishedPackageId);
                    } else {
                      onNavigateToPackages?.();
                    }
                  }}
                  className="rounded-[12px] bg-emerald-700 px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white transition hover:bg-emerald-800"
                >
                  Review Package
                </button>
              )}
              <button
                type="button"
                onClick={resetImporter}
                className="rounded-[12px] border border-emerald-300 bg-white px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-emerald-800 transition hover:bg-emerald-100"
              >
                Import Another Package
              </button>
            </div>
          </div>
        )}
        {importSummary && (
          <div className="mt-4 flex items-start gap-3 rounded-[16px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <FileText className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-extrabold">Document parsed successfully</p>
              <p className="mt-1 leading-6">{importSummary.message}</p>
            </div>
          </div>
        )}
        {workflowWarnings.length > 0 && (
          <div className="mt-4 flex items-start gap-3 rounded-[16px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-extrabold">{workflowWarnings.length} field warning{workflowWarnings.length === 1 ? '' : 's'}</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 leading-6">
                {workflowWarnings.map((warning) => <li key={warning}>{warning}</li>)}
              </ul>
            </div>
          </div>
        )}
      </section>

      {(isAnalyzing || isReadingFile) && (
        <section className="grid gap-5 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-44 animate-pulse rounded-[22px] border border-stone-200 bg-stone-100" />
          ))}
        </section>
      )}

      {bulkItems.length > 0 && (
        <section className="space-y-4 rounded-[26px] border border-stone-200 bg-white p-5 shadow-[0_20px_60px_rgba(18,38,32,0.08)] sm:p-6">
          <div className="flex flex-col gap-4 border-b border-stone-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#4DA528]">Bulk import</p>
              <h3 className="mt-1 text-2xl font-extrabold tracking-tight text-stone-950">Review package files</h3>
              <p className="mt-1 text-sm text-stone-500">Select the packages you want to publish. Each file keeps its own parser warnings.</p>
            </div>
            <button
              type="button"
              onClick={handleBulkImport}
              disabled={isBulkParsing || isBulkImporting || selectedBulkIds.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#4DA528] px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.15em] text-white shadow-[0_14px_30px_rgba(77,165,40,0.24)] transition hover:bg-[#FF970D] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isBulkImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Import Selected ({selectedBulkIds.length})
            </button>
          </div>

          {bulkMessage && (
            <div className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              {bulkMessage}
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-2">
            {bulkItems.map((item) => {
              const isSelected = selectedBulkIds.includes(item.id);
              const statusLabel = item.status === 'imported'
                ? 'Imported'
                : item.status === 'error'
                  ? 'Error'
                  : item.status === 'parsing'
                    ? 'Parsing'
                    : item.warnings.length
                      ? 'Needs review'
                      : 'Ready';
              const statusClass = item.status === 'imported'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : item.status === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : item.warnings.length
                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700';

              return (
                <article key={item.id} className="rounded-[20px] border border-stone-200 bg-[#fcfbf9] p-4 transition hover:border-[#4DA528]/40 hover:shadow-[0_12px_30px_rgba(18,38,32,0.08)]">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleBulkSelection(item.id)}
                      disabled={!item.preview || item.status === 'imported' || item.status === 'importing'}
                      aria-label={`Select ${item.file.name}`}
                      className="mt-1 h-4 w-4 accent-[#4DA528]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h4 className="break-all text-sm font-extrabold text-stone-900">{item.file.name}</h4>
                        <span className={`rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </div>
                      {item.preview ? (
                        <>
                          <p className="mt-3 text-base font-extrabold text-stone-950">{item.preview.title || 'Untitled package'}</p>
                          <div className="mt-2 grid gap-2 text-xs text-stone-600 sm:grid-cols-2">
                            <span><strong className="text-stone-800">Destination:</strong> {item.preview.destination || 'Not provided'}</span>
                            <span><strong className="text-stone-800">Price:</strong> {formatPreviewPrice(item.preview.offerPrice ?? item.preview.pricePerPerson ?? item.preview.price)}</span>
                            <span><strong className="text-stone-800">Itinerary:</strong> {item.preview.itinerary?.length || 0} days</span>
                            <span><strong className="text-stone-800">FAQs:</strong> {item.preview.faqs?.length || 0}</span>
                          </div>
                        </>
                      ) : item.status === 'parsing' ? (
                        <p className="mt-3 flex items-center gap-2 text-sm text-stone-500"><Loader2 className="h-4 w-4 animate-spin" /> Parsing document...</p>
                      ) : (
                        <p className="mt-3 text-sm text-rose-700">{item.error || 'The package could not be parsed.'}</p>
                      )}
                      {item.warnings.length > 0 && (
                        <details className="mt-4 rounded-[14px] border border-amber-200 bg-amber-50/70 p-3">
                          <summary className="cursor-pointer text-xs font-extrabold text-amber-900">{item.warnings.length} validation warning{item.warnings.length === 1 ? '' : 's'}</summary>
                          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-amber-900">
                            {item.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                          </ul>
                        </details>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {draft && (
        <section className="space-y-6">
          <div className="sticky top-4 z-20 flex flex-col gap-3 rounded-[22px] border border-stone-200 bg-white/90 p-4 shadow-[0_18px_50px_rgba(18,38,32,0.08)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#4DA528]">Import workflow</p>
              <h3 className="mt-1 text-lg font-extrabold text-stone-950">Review and save this package</h3>
              <p className="mt-1 text-xs text-stone-500">
                {workflowWarnings.length ? `${workflowWarnings.length} validation warning${workflowWarnings.length === 1 ? '' : 's'} to review` : 'All core validation checks passed'}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => handlePersistPackage('draft')}
                disabled={Boolean(isSaving)}
                className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-stone-200 bg-white px-5 py-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-stone-700 transition hover:border-[#4DA528] hover:text-[#4DA528] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving === 'draft' && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingImport(true)}
                disabled={Boolean(isSaving)}
                className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#4DA528] px-5 py-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_14px_30px_rgba(77,165,40,0.28)] transition hover:-translate-y-0.5 hover:bg-[#FF970D] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving === 'publish' && <Loader2 className="h-4 w-4 animate-spin" />}
                Import Package
              </button>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="overflow-hidden rounded-[26px] border border-stone-200 bg-white shadow-[0_20px_60px_rgba(18,38,32,0.08)]">
              <div className="relative aspect-[16/10] bg-stone-100">
                {draft.bannerImage || draft.heroImage ? (
                  <TravelMedia
                    src={draft.bannerImage || draft.heroImage}
                    alt={draft.title || 'AI package hero preview'}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                    disableFallback
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-stone-400">
                    <ImageIcon className="h-10 w-10" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-5 text-white">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/70">Hero Preview</p>
                  <h3 className="mt-1 text-2xl font-extrabold">{draft.title || 'Untitled package'}</h3>
                </div>
              </div>
              <div className="space-y-4 p-5">
                <EditableText label="Hero Image URL" value={draft.heroImage} onChange={(value) => updateDraftField('heroImage', value || null)} />
                <EditableText label="Banner Image URL" value={draft.bannerImage} onChange={(value) => updateDraftField('bannerImage', value || null)} />
                <EditableTextarea label="Gallery Image URLs" value={listToText(draft.galleryImages)} onChange={(value) => updateDraftField('galleryImages', textToList(value))} />
              </div>
            </div>

            <div className="rounded-[26px] border border-stone-200 bg-white p-5 shadow-[0_20px_60px_rgba(18,38,32,0.08)] sm:p-6">
              <div className="flex flex-col gap-2 border-b border-stone-100 pb-5">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#4DA528]">Editable AI Preview</span>
                <h3 className="text-2xl font-extrabold tracking-tight text-stone-950">Package fields</h3>
                {(sourceFileName || sourceUrl) && (
                  <p className="flex items-center gap-2 break-all text-xs text-stone-500">
                    {sourceFileName && <FileText className="h-3.5 w-3.5 shrink-0" />}
                    Source: {sourceFileName || sourceUrl}
                  </p>
                )}
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <EditableText label="Title" value={draft.title} onChange={(value) => updateDraftField('title', value || null)} />
                <EditableText label="Slug" value={draft.slug} onChange={(value) => updateDraftField('slug', value || null)} />
                <EditableText label="Destination" value={draft.destination} onChange={(value) => updateDraftField('destination', value || null)} />
                <EditableText label="Location" value={draft.location} onChange={(value) => updateDraftField('location', value || null)} />
                <EditableText label="Category" value={draft.category} onChange={(value) => updateDraftField('category', value || null)} />
                <EditableText label="Booking Type" value={draft.bookingType} onChange={(value) => updateDraftField('bookingType', value || null)} />
                <EditableText label="Max Guests" type="number" value={draft.maxGuests === null ? '' : String(draft.maxGuests)} onChange={(value) => updateDraftField('maxGuests', parseNumberValue(value))} />
                <EditableText label="Duration" value={draft.duration} onChange={(value) => updateDraftField('duration', value || null)} />
                <EditableText label="Price Per Person" type="number" value={draft.pricePerPerson === null ? '' : String(draft.pricePerPerson)} onChange={(value) => updateDraftField('pricePerPerson', parseNumberValue(value))} />
                <EditableText label="Offer Price" type="number" value={draft.offerPrice === null ? '' : String(draft.offerPrice)} onChange={(value) => updateDraftField('offerPrice', parseNumberValue(value))} />
                <EditableText label="Original Price" type="number" value={draft.originalPrice === null ? '' : String(draft.originalPrice)} onChange={(value) => updateDraftField('originalPrice', parseNumberValue(value))} />
                <EditableText label="Package Code" value={draft.packageCode} onChange={(value) => updateDraftField('packageCode', value || null)} />
                <EditableText label="Pickup Point" value={draft.pickup} onChange={(value) => updateDraftField('pickup', value || null)} />
                <EditableText label="Homepage Activity" value={draft.homepageActivity} onChange={(value) => updateDraftField('homepageActivity', value || null)} />
                <EditableText label="Difficulty" value={draft.difficulty} onChange={(value) => updateDraftField('difficulty', value || null)} />
                <EditableText label="Difficulty Level (1-10)" type="number" value={draft.difficultyLevel === null ? '' : String(draft.difficultyLevel)} onChange={(value) => updateDraftField('difficultyLevel', parseDifficultyLevelInput(value))} />
                <EditableText label="Best Time" value={draft.bestTime} onChange={(value) => updateDraftField('bestTime', value || null)} />
                <EditableText label="Meta Title" value={draft.metaTitle} onChange={(value) => updateDraftField('metaTitle', value || null)} />
              </div>

              <div className="mt-4 space-y-4">
                <EditableTextarea label="Short Summary" value={draft.shortSummary || ''} onChange={(value) => updateDraftField('shortSummary', value || null)} />
                <EditableTextarea label="Full Description" value={draft.fullDescription || ''} onChange={(value) => updateDraftField('fullDescription', value || null)} />
                <EditableTextarea label="Overview" value={draft.overview || ''} onChange={(value) => updateDraftField('overview', value || null)} />
                <EditableTextarea label="Meta Description" value={draft.metaDescription || ''} onChange={(value) => updateDraftField('metaDescription', value || null)} />
                <EditableTextarea label="SEO Keywords" value={listToText(draft.seoKeywords)} onChange={(value) => updateDraftField('seoKeywords', textToList(value))} />
                <EditableTextarea label="Departure Dates" value={listToText(draft.departureDates)} onChange={(value) => updateDraftField('departureDates', textToList(value))} />
              </div>
            </div>
          </div>

          {galleryImages.length > 0 && (
            <div className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_16px_45px_rgba(18,38,32,0.06)]">
              <h3 className="text-lg font-extrabold text-stone-950">Gallery preview</h3>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
                {galleryImages.map((imageUrl, index) => (
                  <TravelMedia
                    key={`${imageUrl}-${index}`}
                    src={imageUrl}
                    alt={`Gallery preview ${index + 1}`}
                    className="aspect-[4/3] rounded-[16px] object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    disableFallback
                  />
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-3">
            <EditableTextarea label="Highlights" value={listToText(draft.highlights)} onChange={(value) => updateDraftField('highlights', textToList(value))} />
            <EditableTextarea label="Inclusions" value={listToText(draft.inclusions)} onChange={(value) => updateDraftField('inclusions', textToList(value))} />
            <EditableTextarea label="Exclusions" value={listToText(draft.exclusions)} onChange={(value) => updateDraftField('exclusions', textToList(value))} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <EditableTextarea
              label="Package Options (Title | Description | Price | Original Price | Inclusions)"
              value={packageOptionsToText(draft.packageOptions)}
              onChange={(value) => updateDraftField('packageOptions', textToPackageOptions(value))}
            />
            <EditableTextarea
              label="Hotels (City | Hotel | Nights)"
              value={hotelsToText(hotels)}
              onChange={(value) => updateDraftField('hotels', textToHotels(value))}
            />
            <EditableTextarea label="Know Before You Go" value={listToText(draft.knowBeforeYouGo)} onChange={(value) => updateDraftField('knowBeforeYouGo', textToList(value))} />
            <EditableTextarea label="Things To Carry" value={listToText(draft.thingsToCarry)} onChange={(value) => updateDraftField('thingsToCarry', textToList(value))} />
            <div className="xl:col-span-2">
              <EditableTextarea label="Policies" value={listToText(draft.policies)} onChange={(value) => updateDraftField('policies', textToList(value))} />
            </div>
          </div>

          <div className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_16px_45px_rgba(18,38,32,0.06)] sm:p-6">
            <h3 className="text-lg font-extrabold text-stone-950">Itinerary accordion</h3>
            <div className="mt-4 space-y-3">
              {itinerary.length === 0 ? (
                <p className="rounded-[16px] border border-dashed border-stone-200 bg-stone-50 p-5 text-sm text-stone-500">No itinerary found in the analyzed page.</p>
              ) : itinerary.map((day, index) => (
                <div key={index} className="overflow-hidden rounded-[18px] border border-stone-200">
                  <button
                    type="button"
                    onClick={() => setOpenItineraryIndex(openItineraryIndex === index ? null : index)}
                    className="flex w-full items-center justify-between gap-4 bg-[#fcfbf9] px-4 py-3 text-left"
                  >
                    <span className="text-sm font-extrabold text-stone-900">Day {day.day || index + 1}: {day.title || 'Untitled'}</span>
                    <ChevronDown className={`h-4 w-4 text-stone-500 transition ${openItineraryIndex === index ? 'rotate-180' : ''}`} />
                  </button>
                  {openItineraryIndex === index && (
                    <div className="grid gap-4 p-4 sm:grid-cols-[120px_1fr]">
                      <EditableText label="Day" type="number" value={day.day === null ? '' : String(day.day)} onChange={(value) => updateItineraryField(index, 'day', value)} />
                      <EditableText label="Title" value={day.title} onChange={(value) => updateItineraryField(index, 'title', value)} />
                      <div className="sm:col-span-2">
                        <EditableText label="Location" value={day.location || ''} onChange={(value) => updateItineraryField(index, 'location', value)} />
                      </div>
                      <div className="sm:col-span-2">
                        <EditableTextarea label="Description" value={day.description || ''} onChange={(value) => updateItineraryField(index, 'description', value)} />
                      </div>
                      <div className="sm:col-span-2">
                        <EditableTextarea label="Day Image URLs" value={listToText(day.images)} onChange={(value) => updateItineraryField(index, 'images', value)} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_16px_45px_rgba(18,38,32,0.06)] sm:p-6">
            <h3 className="text-lg font-extrabold text-stone-950">FAQs</h3>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {faqs.length === 0 ? (
                <p className="rounded-[16px] border border-dashed border-stone-200 bg-stone-50 p-5 text-sm text-stone-500">No FAQs found in the analyzed page.</p>
              ) : faqs.map((faq, index) => (
                <div key={index} className="rounded-[18px] border border-stone-200 bg-[#fcfbf9] p-4">
                  <EditableText label="Question" value={faq.question} onChange={(value) => updateFaqField(index, 'question', value)} />
                  <div className="mt-3">
                    <EditableTextarea label="Answer" value={faq.answer || ''} onChange={(value) => updateFaqField(index, 'answer', value)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {isConfirmingImport && draft && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-sm"
          onMouseDown={() => setIsConfirmingImport(false)}
          role="presentation"
        >
          <section
            aria-labelledby="confirm-package-import-title"
            aria-modal="true"
            className="relative w-full max-w-2xl overflow-hidden rounded-[24px] border border-white/50 bg-white shadow-[0_30px_90px_rgba(18,38,32,0.28)]"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <button
              type="button"
              aria-label="Close import confirmation"
              className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-stone-200 bg-white text-stone-500 transition hover:border-stone-300 hover:text-stone-950"
              onClick={() => setIsConfirmingImport(false)}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="border-b border-stone-200 bg-[#f7f8f3] px-5 py-6 pr-16 sm:px-7">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Final review</p>
              <h2 id="confirm-package-import-title" className="mt-2 text-2xl font-extrabold text-stone-950">Confirm package import</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">Review the key package details before publishing it to the catalogue.</p>
            </div>

            <div className="p-5 sm:p-7">
              <dl className="grid gap-3 sm:grid-cols-2">
                {([
                  ['Package Name', draft.title || 'Untitled package'],
                  ['Slug', previewSlug || 'Will be generated automatically'],
                  ['Destination', draft.destination || 'Not provided'],
                  ['Price', formatPreviewPrice(previewPrice)],
                  ['Offer Price', formatPreviewPrice(draft.offerPrice)],
                ] as Array<[string, string]>).map(([label, value]) => (
                  <div key={label} className={`rounded-[16px] border border-stone-200 bg-[#fcfbf9] p-4 ${label === 'Package Name' ? 'sm:col-span-2' : ''}`}>
                    <dt className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-500">{label}</dt>
                    <dd className="mt-2 break-words text-sm font-bold text-stone-950">{value}</dd>
                  </div>
                ))}
              </dl>

              {workflowWarnings.length > 0 && (
                <div className="mt-4 rounded-[16px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-extrabold">{workflowWarnings.length} validation warning{workflowWarnings.length === 1 ? '' : 's'}</p>
                  <p className="mt-1 leading-6">You can still import this package and complete the missing fields later.</p>
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsConfirmingImport(false)}
                  className="rounded-[12px] border border-stone-200 bg-white px-5 py-3 text-xs font-extrabold uppercase tracking-[0.14em] text-stone-700 transition hover:border-stone-300 hover:text-stone-950"
                >
                  Continue Editing
                </button>
                <button
                  type="button"
                  onClick={() => void handlePersistPackage('publish')}
                  disabled={isSaving === 'publish'}
                  className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-[#4DA528] px-5 py-3 text-xs font-extrabold uppercase tracking-[0.14em] text-white transition hover:bg-[#3f8d20] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving === 'publish' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {isSaving === 'publish' ? 'Importing…' : 'Import Package'}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function EditableText({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string | number | null;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-500">{label}</span>
      <input
        type={type}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-[12px] border border-stone-200 bg-white px-3 py-2.5 text-sm font-semibold text-stone-900 outline-none transition focus:border-[#4DA528] focus:ring-2 focus:ring-[#4DA528]/15"
      />
    </label>
  );
}

function EditableTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-500">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={5}
        className="mt-2 w-full rounded-[12px] border border-stone-200 bg-white px-3 py-2.5 text-sm font-medium leading-6 text-stone-800 outline-none transition focus:border-[#4DA528] focus:ring-2 focus:ring-[#4DA528]/15"
      />
    </label>
  );
}
