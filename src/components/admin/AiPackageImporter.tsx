import React, { useMemo, useState } from 'react';
import { AlertCircle, ChevronDown, Image as ImageIcon, Link, Loader2, Sparkles } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, auth } from '../../lib/firebase';
import type { PackageCmsInput } from '../../types/packageCms';
import { publishImportedPackage, saveImportedDraftPackage } from '../../services/packageCmsService';
import { getTravelImage, handleTravelImageError } from '../../utils/imageFallback';

type ImporterItineraryDay = {
  day: number | null;
  title: string | null;
  description: string | null;
};

type ImporterFaq = {
  question: string | null;
  answer: string | null;
};

type AIPackagePreview = {
  title: string | null;
  destination: string | null;
  duration: string | null;
  price: number | null;
  overview: string | null;
  highlights: string[] | null;
  itinerary: ImporterItineraryDay[] | null;
  inclusions: string[] | null;
  exclusions: string[] | null;
  bestTime: string | null;
  difficulty: string | null;
  faqs: ImporterFaq[] | null;
  metaTitle: string | null;
  metaDescription: string | null;
  slug: string | null;
  heroImage: string | null;
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

const functions = getFunctions(app);
const analyzePackageUrl = httpsCallable<{ url: string }, AnalyzePackageUrlResponse>(functions, 'analyzePackageUrl');

const emptyPreview: AIPackagePreview = {
  title: null,
  destination: null,
  duration: null,
  price: null,
  overview: null,
  highlights: null,
  itinerary: null,
  inclusions: null,
  exclusions: null,
  bestTime: null,
  difficulty: null,
  faqs: null,
  metaTitle: null,
  metaDescription: null,
  slug: null,
  heroImage: null,
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

const listToText = (value: string[] | null) => (value || []).join('\n');

const textToList = (value: string) => {
  const lines = value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.length ? lines : null;
};

const normalizePreview = (preview?: AIPackagePreview): AIPackagePreview => ({
  ...emptyPreview,
  ...(preview || {}),
});

const getErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message || 'Package analysis failed.');
  }
  return 'Package analysis failed.';
};

const previewToPackageInput = (preview: AIPackagePreview, sourceUrl: string): PackageCmsInput => ({
  title: preview.title || '',
  slug: preview.slug || undefined,
  sourceUrl: sourceUrl || null,
  heroImage: preview.heroImage || null,
  gallery: preview.galleryImages || [],
  duration: preview.duration || null,
  destinations: preview.destination ? [preview.destination] : [],
  destination: preview.destination || null,
  overview: preview.overview || null,
  itinerary: (preview.itinerary || []).map((day, index) => ({
    day: day.day || index + 1,
    title: day.title || null,
    description: day.description || null,
  })),
  hotels: [],
  pricing: {
    currency: 'INR',
    price: preview.price,
    originalPrice: null,
    discount: null,
    priceType: 'Per Person',
    occupancy: null,
  },
  price: preview.price,
  inclusions: preview.inclusions || [],
  exclusions: preview.exclusions || [],
  faqs: (preview.faqs || []).map((faq) => ({
    question: faq.question || null,
    answer: faq.answer || null,
  })),
  policies: [],
  parserVersion: 'deterministic-html-parser-v1',
  legacy: {
    seoTitle: preview.metaTitle || '',
    seoDescription: preview.metaDescription || '',
  },
});

export default function AiPackageImporter() {
  const [packageUrl, setPackageUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState<'draft' | 'publish' | null>(null);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [draft, setDraft] = useState<AIPackagePreview | null>(null);
  const [openItineraryIndex, setOpenItineraryIndex] = useState<number | null>(0);

  const galleryImages = useMemo(() => (draft?.galleryImages || []).filter(Boolean), [draft?.galleryImages]);
  const itinerary = draft?.itinerary || [];
  const faqs = draft?.faqs || [];

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
        [field]: field === 'day' ? Number(value) || null : value || null,
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
    setSourceUrl('');
    setDraft(null);

    try {
      const result = await analyzePackageUrl({ url: trimmedUrl });
      const response = result.data || {};
      if (!response.preview) {
        throw new Error('The importer returned no package preview.');
      }
      setDraft(normalizePreview(response.preview));
      setSourceUrl(response.source?.url || trimmedUrl);
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
      const input = previewToPackageInput(draft, sourceUrl || packageUrl.trim());
      const savedPackage = mode === 'draft'
        ? await saveImportedDraftPackage(input, actorId)
        : await publishImportedPackage(input, actorId);
      setSaveMessage(`${mode === 'draft' ? 'Draft saved' : 'Package published'}: ${savedPackage.title}`);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(null);
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
              Analyze a travel package URL, review the editable preview, then save a draft or publish when it is ready.
            </p>
          </div>
          <div className="rounded-[22px] border border-white/12 bg-white/10 p-5 text-sm text-white/70 backdrop-blur-md">
            Parser v1
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
                disabled={isAnalyzing}
              />
            </div>
          </label>
          <button
            type="submit"
            disabled={isAnalyzing}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[14px] bg-[#4DA528] px-6 text-xs font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_14px_30px_rgba(77,165,40,0.28)] transition hover:-translate-y-0.5 hover:bg-[#FF970D] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Analyze Package
          </button>
        </form>

        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-[16px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {saveMessage && (
          <div className="mt-4 rounded-[16px] border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            {saveMessage}
          </div>
        )}
      </section>

      {isAnalyzing && (
        <section className="grid gap-5 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-44 animate-pulse rounded-[22px] border border-stone-200 bg-stone-100" />
          ))}
        </section>
      )}

      {draft && (
        <section className="space-y-6">
          <div className="sticky top-4 z-20 flex flex-col gap-3 rounded-[22px] border border-stone-200 bg-white/90 p-4 shadow-[0_18px_50px_rgba(18,38,32,0.08)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#4DA528]">Import workflow</p>
              <h3 className="mt-1 text-lg font-extrabold text-stone-950">Review and save this package</h3>
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
                onClick={() => handlePersistPackage('publish')}
                disabled={Boolean(isSaving)}
                className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#4DA528] px-5 py-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_14px_30px_rgba(77,165,40,0.28)] transition hover:-translate-y-0.5 hover:bg-[#FF970D] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving === 'publish' && <Loader2 className="h-4 w-4 animate-spin" />}
                Publish Package
              </button>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="overflow-hidden rounded-[26px] border border-stone-200 bg-white shadow-[0_20px_60px_rgba(18,38,32,0.08)]">
              <div className="relative aspect-[16/10] bg-stone-100">
                {draft.heroImage ? (
                  <img
                    src={getTravelImage(draft.heroImage)}
                    alt={draft.title || 'AI package hero preview'}
                    onError={handleTravelImageError}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
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
                <EditableTextarea label="Gallery Image URLs" value={listToText(draft.galleryImages)} onChange={(value) => updateDraftField('galleryImages', textToList(value))} />
              </div>
            </div>

            <div className="rounded-[26px] border border-stone-200 bg-white p-5 shadow-[0_20px_60px_rgba(18,38,32,0.08)] sm:p-6">
              <div className="flex flex-col gap-2 border-b border-stone-100 pb-5">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#4DA528]">Editable AI Preview</span>
                <h3 className="text-2xl font-extrabold tracking-tight text-stone-950">Package fields</h3>
                {sourceUrl && <p className="break-all text-xs text-stone-500">Source: {sourceUrl}</p>}
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <EditableText label="Title" value={draft.title} onChange={(value) => updateDraftField('title', value || null)} />
                <EditableText label="Slug" value={draft.slug} onChange={(value) => updateDraftField('slug', value || null)} />
                <EditableText label="Destination" value={draft.destination} onChange={(value) => updateDraftField('destination', value || null)} />
                <EditableText label="Duration" value={draft.duration} onChange={(value) => updateDraftField('duration', value || null)} />
                <EditableText label="Price" type="number" value={draft.price === null ? '' : String(draft.price)} onChange={(value) => updateDraftField('price', value ? Number(value) : null)} />
                <EditableText label="Difficulty" value={draft.difficulty} onChange={(value) => updateDraftField('difficulty', value || null)} />
                <EditableText label="Best Time" value={draft.bestTime} onChange={(value) => updateDraftField('bestTime', value || null)} />
                <EditableText label="Meta Title" value={draft.metaTitle} onChange={(value) => updateDraftField('metaTitle', value || null)} />
              </div>

              <div className="mt-4 space-y-4">
                <EditableTextarea label="Overview" value={draft.overview || ''} onChange={(value) => updateDraftField('overview', value || null)} />
                <EditableTextarea label="Meta Description" value={draft.metaDescription || ''} onChange={(value) => updateDraftField('metaDescription', value || null)} />
              </div>
            </div>
          </div>

          {galleryImages.length > 0 && (
            <div className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_16px_45px_rgba(18,38,32,0.06)]">
              <h3 className="text-lg font-extrabold text-stone-950">Gallery preview</h3>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
                {galleryImages.map((imageUrl, index) => (
                  <img
                    key={`${imageUrl}-${index}`}
                    src={getTravelImage(imageUrl)}
                    alt={`Gallery preview ${index + 1}`}
                    onError={handleTravelImageError}
                    className="aspect-[4/3] rounded-[16px] object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
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
                        <EditableTextarea label="Description" value={day.description || ''} onChange={(value) => updateItineraryField(index, 'description', value)} />
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
