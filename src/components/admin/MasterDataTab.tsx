import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, Ban, CheckCircle2, ChevronLeft, ChevronRight, Edit2, Plus, Search, Star, X } from 'lucide-react';
import type { GalleryImage, TravelPackage } from '../../types';
import {
  MASTER_DATA_MODULES,
  MasterDataFieldKey,
  MasterDataItem,
  MasterDataKey,
  MasterDataLists,
  cleanMasterDataName,
  createMasterDataItem,
  findDuplicateMasterDataItem,
  getMasterDataModule,
  getParentModule,
  slugifyMasterDataName,
  sortForDisplay,
} from '../../utils/masterData';
import { MediaPickerField } from './MasterDataFormControls';
import { getTravelImage, handleTravelImageError } from '../../utils/imageFallback';

const PAGE_SIZE = 8;

interface MasterDataTabProps {
  packages: TravelPackage[];
  gallery: GalleryImage[];
  masterDataLists: MasterDataLists;
  isSaving: boolean;
  onSaveList: (fieldKey: MasterDataFieldKey, updatedItems: MasterDataItem[]) => Promise<void>;
}

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

interface ItemFormState {
  name: string;
  slug: string;
  isSlugManual: boolean;
  parentName: string;
  featured: boolean;
  icon: string;
  banner: string;
  thumbnail: string;
}

const EMPTY_FORM: ItemFormState = {
  name: '', slug: '', isSlugManual: false, parentName: '', featured: false, icon: '', banner: '', thumbnail: '',
};

export function MasterDataTab({ packages, gallery, masterDataLists, isSaving, onSaveList }: MasterDataTabProps) {
  const [activeModuleKey, setActiveModuleKey] = useState<MasterDataKey>('country');
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [formError, setFormError] = useState('');
  const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<ItemFormState>(EMPTY_FORM);
  const [statusTarget, setStatusTarget] = useState<MasterDataItem | null>(null);

  const activeModule = getMasterDataModule(activeModuleKey);
  const curatedList = masterDataLists[activeModule.fieldKey] || [];
  const parentModule = getParentModule(activeModule);
  const parentList = parentModule ? (masterDataLists[parentModule.fieldKey] || []) : [];

  const switchModule = (key: MasterDataKey) => {
    setActiveModuleKey(key);
    setSearch('');
    setPage(1);
    setFormError('');
    setStatusTarget(null);
  };

  const filteredSorted = useMemo(() => {
    const query = search.trim().toLowerCase();
    const base = showInactive ? curatedList : curatedList;
    const filtered = base.filter((item) => {
      if (!showInactive && item.status !== 'active') return false;
      if (query && !item.name.toLowerCase().includes(query)) return false;
      return true;
    });
    return sortForDisplay(filtered);
  }, [curatedList, search, showInactive]);

  const isReorderable = search.trim().length === 0;
  const fullSortedList = useMemo(() => sortForDisplay(curatedList), [curatedList]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filteredSorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const persist = async (updatedItems: MasterDataItem[]) => {
    await onSaveList(activeModule.fieldKey, updatedItems);
  };

  const openAddForm = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditForm = (item: MasterDataItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      slug: item.slug,
      isSlugManual: true,
      parentName: item.parentName || '',
      featured: item.featured,
      icon: item.icon || '',
      banner: item.banner || '',
      thumbnail: item.thumbnail || '',
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const updateFormName = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: prev.isSlugManual ? prev.slug : slugifyMasterDataName(name),
    }));
  };

  const updateFormSlug = (slug: string) => {
    setForm((prev) => ({ ...prev, slug: slugifyMasterDataName(slug), isSlugManual: true }));
  };

  const handleSaveForm = async () => {
    const name = cleanMasterDataName(form.name);
    if (!name) {
      setFormError('Please enter a name.');
      return;
    }
    const slug = form.slug ? slugifyMasterDataName(form.slug) : slugifyMasterDataName(name);
    const duplicate = findDuplicateMasterDataItem(curatedList, name, editingItem?.id);
    if (duplicate) {
      setFormError(`"${name}" already exists (duplicate name or slug).`);
      return;
    }
    const slugDuplicate = curatedList.find((item) => item.id !== editingItem?.id && item.slug === slug);
    if (slugDuplicate) {
      setFormError(`Slug "${slug}" is already used by "${slugDuplicate.name}".`);
      return;
    }

    const now = new Date().toISOString();
    const overrides = {
      parentName: parentModule ? (form.parentName || undefined) : undefined,
      icon: activeModule.supportsMedia ? (form.icon || undefined) : undefined,
      banner: activeModule.supportsMedia ? (form.banner || undefined) : undefined,
      thumbnail: activeModule.supportsMedia ? (form.thumbnail || undefined) : undefined,
      featured: form.featured,
    };

    let updatedList: MasterDataItem[];
    if (editingItem) {
      updatedList = curatedList.map((item) => (item.id === editingItem.id
        ? { ...item, name, slug, updatedAt: now, ...overrides }
        : item));
    } else {
      const newItem = createMasterDataItem(name, curatedList, now, overrides);
      updatedList = [...curatedList, { ...newItem, slug }];
    }

    await persist(updatedList);
    setIsFormOpen(false);
    setForm(EMPTY_FORM);
    setEditingItem(null);
  };

  const handleToggleStatus = async (item: MasterDataItem) => {
    const nextStatus: MasterDataItem['status'] = item.status === 'active' ? 'inactive' : 'active';
    const updatedList = curatedList.map((entry) => (entry.id === item.id
      ? { ...entry, status: nextStatus, updatedAt: new Date().toISOString() }
      : entry));
    await persist(updatedList);
    setStatusTarget(null);
  };

  const handleReorder = async (item: MasterDataItem, direction: 'up' | 'down') => {
    const index = fullSortedList.findIndex((entry) => entry.id === item.id);
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (index === -1 || swapIndex < 0 || swapIndex >= fullSortedList.length) return;

    const reordered = [...fullSortedList];
    const swapOrder = reordered[swapIndex].displayOrder;
    reordered[swapIndex] = { ...reordered[swapIndex], displayOrder: item.displayOrder, updatedAt: new Date().toISOString() };
    reordered[index] = { ...reordered[index], displayOrder: swapOrder, updatedAt: new Date().toISOString() };
    await persist(reordered);
  };

  const deactivateUsageCount = statusTarget ? activeModule.getUsageCount(statusTarget.name, packages) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-normal text-stone-900">Master Data</h2>
        <p className="mt-1 text-sm text-stone-500">Manage the shared, ordered, hierarchy-aware values used across the Package CMS and the homepage. Changes apply everywhere instantly — no code changes required.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <div className="space-y-1.5 rounded-[20px] border border-stone-200 bg-white p-3">
          {MASTER_DATA_MODULES.map((module) => {
            const isActive = module.key === activeModuleKey;
            const count = (masterDataLists[module.fieldKey] || []).filter((item) => item.status === 'active').length;
            return (
              <button
                key={module.key}
                type="button"
                onClick={() => switchModule(module.key)}
                className={`flex w-full items-center justify-between rounded-sm px-3 py-2.5 text-left text-sm font-semibold transition ${
                  isActive ? 'bg-[#008080] text-white shadow-sm' : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {module.parentModuleKey && <span className="text-xs opacity-60">↳</span>}
                  {module.pluralLabel}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'}`}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-4 rounded-[20px] border border-stone-200 bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-serif font-normal text-stone-900">{activeModule.pluralLabel}</h3>
              <p className="mt-1 text-xs text-stone-500">{activeModule.description}</p>
            </div>
            <button
              type="button"
              onClick={openAddForm}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-sm bg-[#008080] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#006666]"
            >
              <Plus className="h-4 w-4" />
              Add {activeModule.label}
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder={`Search ${activeModule.pluralLabel.toLowerCase()}...`}
                className="w-full rounded-sm border border-stone-200 py-2 pl-9 pr-3 text-sm text-stone-700 outline-none transition focus:border-[#008080]"
              />
            </div>
            <label className="inline-flex shrink-0 items-center gap-2 text-xs font-semibold text-stone-600">
              <input type="checkbox" checked={showInactive} onChange={(e) => { setShowInactive(e.target.checked); setPage(1); }} className="h-3.5 w-3.5 accent-[#008080]" />
              Show inactive
            </label>
          </div>
          {!isReorderable && <p className="text-[11px] text-stone-400">Clear the search to reorder items by Display Order.</p>}

          {curatedList.length === 0 ? (
            <div className="rounded-sm border border-dashed border-stone-300 bg-[#f8f7f4] p-6 text-center">
              <p className="text-sm text-stone-500">No {activeModule.pluralLabel.toLowerCase()} added yet.</p>
              <p className="mt-2 text-xs text-stone-400">Examples: {activeModule.seedExamples.join(', ')}</p>
            </div>
          ) : filteredSorted.length === 0 ? (
            <p className="rounded-sm border border-dashed border-stone-300 bg-[#f8f7f4] p-6 text-center text-sm text-stone-500">No matches.</p>
          ) : (
            <div className="divide-y divide-stone-100 rounded-sm border border-stone-200">
              {pageItems.map((item) => {
                const usageCount = activeModule.getUsageCount(item.name, packages);
                return (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {activeModule.supportsMedia && (
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-sm border border-stone-200 bg-stone-50">
                          {item.thumbnail || item.icon ? (
                            <img
                              src={getTravelImage(item.thumbnail || item.icon)}
                              alt=""
                              className="h-full w-full object-cover"
                              onError={handleTravelImageError}
                            />
                          ) : null}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate text-sm font-semibold text-stone-800">{item.name}</span>
                          {item.featured && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />}
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${item.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-600'}`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-stone-400">
                          /{item.slug} {item.parentName ? `· ${item.parentName}` : ''} · {usageCount} {usageCount === 1 ? 'package' : 'packages'} · Created {formatDate(item.createdAt)} · Updated {formatDate(item.updatedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      {isReorderable && (
                        <>
                          <button type="button" onClick={() => handleReorder(item, 'up')} className="rounded-sm p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700" aria-label={`Move ${item.name} up`}>
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" onClick={() => handleReorder(item, 'down')} className="rounded-sm p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700" aria-label={`Move ${item.name} down`}>
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      <button type="button" onClick={() => openEditForm(item)} className="rounded-sm p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-[#008080]" aria-label={`Edit ${item.name}`}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      {item.status === 'active' ? (
                        <button type="button" onClick={() => setStatusTarget(item)} className="rounded-sm p-1.5 text-stone-400 transition hover:bg-red-50 hover:text-red-600" aria-label={`Deactivate ${item.name}`}>
                          <Ban className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button type="button" onClick={() => handleToggleStatus(item)} disabled={isSaving} className="rounded-sm p-1.5 text-stone-400 transition hover:bg-emerald-50 hover:text-emerald-600" aria-label={`Activate ${item.name}`}>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filteredSorted.length > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-stone-500">Page {safePage} of {totalPages}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={safePage <= 1}
                  className="inline-flex items-center gap-1 rounded-sm border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={safePage >= totalPages}
                  className="inline-flex items-center gap-1 rounded-sm border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/45 px-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[18px] border border-stone-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#008080]">{activeModule.label}</p>
                <h4 className="mt-1 text-xl font-serif text-stone-950">{editingItem ? `Edit ${activeModule.label}` : `Add new ${activeModule.label.toLowerCase()}`}</h4>
              </div>
              <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-full p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-900" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">Name *</label>
                <input type="text" value={form.name} onChange={(e) => updateFormName(e.target.value)} autoFocus placeholder={`E.g. ${activeModule.seedExamples[0]}`} className="w-full rounded-sm border border-stone-200 px-3 py-2 text-sm font-medium text-stone-850 outline-none transition focus:border-[#008080]" />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">Slug</label>
                <input type="text" value={form.slug} onChange={(e) => updateFormSlug(e.target.value)} placeholder="auto-generated-from-name" className="w-full rounded-sm border border-stone-200 px-3 py-2 text-xs font-mono text-stone-600 outline-none transition focus:border-[#008080]" />
                <p className="text-[10px] text-stone-400">Auto-updates from the name until you edit it directly.</p>
              </div>

              {parentModule && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">{parentModule.label}</label>
                  <select value={form.parentName} onChange={(e) => setForm((prev) => ({ ...prev, parentName: e.target.value }))} className="w-full cursor-pointer rounded-sm border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 outline-none transition focus:border-[#008080]">
                    <option value="">Unassigned</option>
                    {sortForDisplay(parentList).filter((p) => p.status === 'active').map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {activeModule.supportsMedia && (
                <div className="space-y-3 rounded-sm border border-stone-200 bg-[#f8f7f4] p-3">
                  <MediaPickerField label="Icon" value={form.icon} gallery={gallery} onChange={(url) => setForm((prev) => ({ ...prev, icon: url }))} />
                  <MediaPickerField label="Banner" value={form.banner} gallery={gallery} onChange={(url) => setForm((prev) => ({ ...prev, banner: url }))} />
                  <MediaPickerField label="Thumbnail" value={form.thumbnail} gallery={gallery} onChange={(url) => setForm((prev) => ({ ...prev, thumbnail: url }))} />
                </div>
              )}

              <label className="flex items-center gap-2 text-xs font-semibold text-stone-600">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))} className="h-3.5 w-3.5 accent-[#008080]" />
                Featured — show first on the homepage
              </label>
            </div>

            {formError && <p className="mt-3 text-xs font-semibold text-red-600">{formError}</p>}

            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 rounded-sm border border-stone-200 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-stone-600 transition hover:bg-stone-50">
                Cancel
              </button>
              <button type="button" onClick={handleSaveForm} disabled={isSaving} className="flex-1 rounded-sm bg-[#008080] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-[#006666] disabled:cursor-not-allowed disabled:opacity-60">
                {isSaving ? 'Saving...' : editingItem ? 'Save Changes' : `Add ${activeModule.label}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {statusTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[18px] border border-stone-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h4 className="text-lg font-serif text-stone-950">Deactivate "{statusTarget.name}"?</h4>
                <p className="mt-1 text-xs text-stone-500">
                  {deactivateUsageCount > 0
                    ? <>Used in <span className="font-bold text-stone-700">{deactivateUsageCount} package{deactivateUsageCount === 1 ? '' : 's'}</span>. </>
                    : null}
                  It will disappear from dropdowns and stop appearing for new selections. Packages that already use it keep their value, and you can reactivate it anytime.
                </p>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setStatusTarget(null)} className="flex-1 rounded-sm border border-stone-200 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-stone-600 transition hover:bg-stone-50">
                Cancel
              </button>
              <button type="button" onClick={() => handleToggleStatus(statusTarget)} disabled={isSaving} className="flex-1 rounded-sm bg-amber-600 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60">
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MasterDataTab;
