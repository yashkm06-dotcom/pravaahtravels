import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Image as ImageIcon, Search, X } from 'lucide-react';
import type { GalleryImage } from '../../types';
import TravelMedia from '../TravelMedia';

const ADD_NEW_VALUE = '__add_new_master_data_value__';

interface QuickAddModalProps {
  title: string;
  subtitle: string;
  fieldLabel: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  saving: boolean;
  confirmLabel: string;
}

function QuickAddModal({ title, subtitle, fieldLabel, placeholder, value, onChange, onCancel, onConfirm, saving, confirmLabel }: QuickAddModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[18px] border border-stone-200 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#008080]">Master Data</p>
            <h4 className="mt-1 text-xl font-serif text-stone-950">{title}</h4>
            <p className="mt-1 text-xs text-stone-500">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-full p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">{fieldLabel}</label>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onConfirm();
              }
            }}
            placeholder={placeholder}
            autoFocus
            className="w-full rounded-sm border border-stone-200 px-3 py-2 text-sm font-medium text-stone-850 outline-none transition focus:border-[#008080]"
          />
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="flex-1 rounded-sm border border-stone-200 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-stone-600 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="flex-1 rounded-sm bg-[#008080] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-[#006666] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface MasterDataSelectFieldProps {
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  emptyOptionLabel?: string;
  required?: boolean;
  onChange: (value: string) => void;
  onAddNew: (name: string) => Promise<string>;
}

// Searchable single-select combobox backed by Master Data, with an inline "+ Add new"
// quick-add flow. Typing filters the option list live (e.g. "tha" -> "Thailand").
export function MasterDataSelectField({ label, value, options, placeholder, emptyOptionLabel, required, onChange, onAddNew }: MasterDataSelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const filteredOptions = options.filter((option) => option.toLowerCase().includes(query.trim().toLowerCase()));

  const selectValue = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
    setQuery('');
  };

  const openAddModal = (prefill: string) => {
    setDraft(prefill);
    setIsModalOpen(true);
    setIsOpen(false);
    setQuery('');
  };

  const handleConfirmAdd = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    try {
      setSaving(true);
      const canonicalName = await onAddNew(trimmed);
      onChange(canonicalName);
      setIsModalOpen(false);
      setDraft('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-1" ref={containerRef}>
      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">{label}{required ? ' *' : ''}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-2 rounded-sm border border-stone-200 bg-white px-3 py-2 text-left text-sm font-medium text-stone-700 outline-none transition focus:border-[#008080]"
        >
          <span className={value ? 'truncate text-stone-800' : 'truncate text-stone-400'}>
            {value || emptyOptionLabel || `Select ${label.toLowerCase()}...`}
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-stone-400 transition ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-sm border border-stone-200 bg-white shadow-xl">
            <div className="relative border-b border-stone-100 p-2">
              <Search className="pointer-events-none absolute left-4.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filteredOptions.length > 0) {
                    e.preventDefault();
                    selectValue(filteredOptions[0]);
                  }
                }}
                placeholder={`Search ${label.toLowerCase()}...`}
                autoFocus
                className="w-full rounded-sm border border-stone-100 bg-[#f8f7f4] py-1.5 pl-7 pr-2 text-xs text-stone-700 outline-none focus:border-[#008080]"
              />
            </div>
            <div className="max-h-52 overflow-y-auto py-1">
              {!required && (
                <button
                  type="button"
                  onClick={() => selectValue('')}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-stone-500 transition hover:bg-stone-50"
                >
                  {emptyOptionLabel || 'None'}
                </button>
              )}
              {filteredOptions.length === 0 ? (
                <p className="px-3 py-3 text-xs text-stone-400">No matches for "{query}".</p>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => selectValue(option)}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition hover:bg-stone-50 ${option === value ? 'font-bold text-[#008080]' : 'text-stone-700'}`}
                  >
                    <span className="truncate">{option}</span>
                    {option === value && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                ))
              )}
            </div>
            <button
              type="button"
              onClick={() => openAddModal(query.trim())}
              className="flex w-full items-center gap-2 border-t border-stone-100 px-3 py-2 text-left text-xs font-bold text-[#008080] transition hover:bg-teal-50"
            >
              + Add new {label.toLowerCase()}{query.trim() ? ` "${query.trim()}"` : ''}
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <QuickAddModal
          title={`Add new ${label.toLowerCase()}`}
          subtitle="This value is saved to Master Data and becomes available across the site immediately."
          fieldLabel={`${label} Name`}
          placeholder={placeholder || `E.g. ${label}`}
          value={draft}
          onChange={setDraft}
          onCancel={() => setIsModalOpen(false)}
          onConfirm={handleConfirmAdd}
          saving={saving}
          confirmLabel={`Add ${label}`}
        />
      )}
    </div>
  );
}

interface MasterDataTagPickerProps {
  label: string;
  selected: string[];
  options: string[];
  onChange: (selected: string[]) => void;
  onAddNew: (name: string) => Promise<string>;
}

// Multi-select chip picker (Package Tags, Activities, Meal Plans) with a search filter for
// long option lists — click a chip to toggle, "+ Add" opens the shared quick-add flow.
export function MasterDataTagPicker({ label, selected, options, onChange, onAddNew }: MasterDataTagPickerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');

  const toggleTag = (tag: string) => {
    const key = tag.toLowerCase();
    const isSelected = selected.some((item) => item.toLowerCase() === key);
    onChange(isSelected ? selected.filter((item) => item.toLowerCase() !== key) : [...selected, tag]);
  };

  const handleConfirmAdd = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    try {
      setSaving(true);
      const canonicalName = await onAddNew(trimmed);
      if (!selected.some((item) => item.toLowerCase() === canonicalName.toLowerCase())) {
        onChange([...selected, canonicalName]);
      }
      setIsModalOpen(false);
      setDraft('');
    } finally {
      setSaving(false);
    }
  };

  const filteredOptions = options.filter((option) => option.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">{label}</label>
      {options.length > 6 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${label.toLowerCase()}...`}
            className="w-full rounded-sm border border-stone-200 py-1.5 pl-8 pr-2 text-xs text-stone-700 outline-none focus:border-[#008080]"
          />
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {filteredOptions.map((tag) => {
          const isSelected = selected.some((item) => item.toLowerCase() === tag.toLowerCase());
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              aria-pressed={isSelected}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                isSelected
                  ? 'border-[#008080] bg-[#008080] text-white shadow-sm'
                  : 'border-stone-200 bg-white text-stone-600 hover:border-[#008080] hover:text-[#008080]'
              }`}
            >
              {tag}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => { setDraft(query.trim()); setIsModalOpen(true); }}
          className="rounded-full border border-dashed border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-500 transition hover:border-[#008080] hover:text-[#008080]"
        >
          + Add {label.toLowerCase()}
        </button>
      </div>

      {isModalOpen && (
        <QuickAddModal
          title={`Add new ${label.toLowerCase()}`}
          subtitle="This value is saved to Master Data and becomes available across the site immediately."
          fieldLabel={`${label} Name`}
          placeholder="E.g. Best Seller"
          value={draft}
          onChange={setDraft}
          onCancel={() => setIsModalOpen(false)}
          onConfirm={handleConfirmAdd}
          saving={saving}
          confirmLabel="Add"
        />
      )}
    </div>
  );
}

interface MediaPickerFieldProps {
  label: string;
  value?: string;
  gallery: GalleryImage[];
  onChange: (url: string) => void;
}

// Icon / Banner / Thumbnail picker for the destination hierarchy. Reuses the existing
// Media Library (the `gallery` collection already loaded for the Gallery CRUD tab) instead
// of building a separate upload system, per the "reuse current media infrastructure" ask.
export function MediaPickerField({ label, value, gallery, onChange }: MediaPickerFieldProps) {
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);

  return (
    <div className="space-y-1">
      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-stone-200 bg-stone-50">
          {value ? (
            <TravelMedia src={value} alt={label} className="h-full w-full object-cover" disableFallback />
          ) : (
            <ImageIcon className="h-4 w-4 text-stone-300" />
          )}
        </div>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste image URL or browse..."
          className="min-w-0 flex-1 rounded-sm border border-stone-200 px-3 py-2 text-xs text-stone-700 outline-none transition focus:border-[#008080]"
        />
        <button
          type="button"
          onClick={() => setIsBrowserOpen(true)}
          className="shrink-0 rounded-sm border border-stone-200 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-600 transition hover:border-[#008080] hover:text-[#008080]"
        >
          Browse
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="shrink-0 rounded-sm p-2 text-stone-400 transition hover:bg-stone-100 hover:text-red-600"
            aria-label={`Clear ${label}`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isBrowserOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-950/50 px-4 backdrop-blur-sm">
          <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-[18px] border border-stone-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 p-4">
              <h4 className="text-base font-serif text-stone-950">Select from Media Library</h4>
              <button type="button" onClick={() => setIsBrowserOpen(false)} className="rounded-full p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-900" aria-label="Close media browser">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {gallery.length === 0 ? (
                <p className="py-10 text-center text-sm text-stone-500">No media in the library yet. Upload images from the Media Library tab first.</p>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {gallery.map((image) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => { onChange(image.imageUrl); setIsBrowserOpen(false); }}
                      className="group relative aspect-square overflow-hidden rounded-sm border border-stone-200 transition hover:border-[#008080]"
                      title={image.title}
                    >
                      <TravelMedia src={image.imageUrl} alt={image.title} className="h-full w-full object-cover transition group-hover:scale-105" disableFallback />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
