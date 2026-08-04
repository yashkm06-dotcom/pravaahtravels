import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, Building2, ChevronLeft, ChevronRight, Edit2, MapPin, Plus, Search, Star, Trash2, X } from 'lucide-react';
import type { GalleryImage, Hotel, HotelCategory, HotelStatus, TravelPackage } from '../../types';
import { slugifyMasterDataName } from '../../utils/masterData';
import { MasterDataSelectField, MediaPickerField } from './MasterDataFormControls';

const PAGE_SIZE = 8;
const HOTEL_CATEGORIES: HotelCategory[] = ['3 Star', '4 Star', '5 Star'];

interface MasterDataNameLists {
  countries: string[];
  destinations: string[];
  cities: string[];
}

interface HotelsTabProps {
  hotels: Hotel[];
  packages: TravelPackage[];
  gallery: GalleryImage[];
  masterData: MasterDataNameLists;
  isSaving: boolean;
  onSaveHotel: (hotel: Hotel) => Promise<void>;
  onDeleteHotel: (id: string) => Promise<void>;
  onQuickAddMasterData: (fieldKey: 'masterCountries' | 'masterDestinations' | 'masterCities', name: string, parentName?: string) => Promise<string>;
}

interface HotelFormState {
  name: string;
  slug: string;
  isSlugManual: boolean;
  destination: string;
  country: string;
  city: string;
  category: HotelCategory;
  starRating: number;
  shortDescription: string;
  fullDescription: string;
  address: string;
  googleMapsLink: string;
  contactNumber: string;
  email: string;
  website: string;
  amenities: string[];
  mealPlans: string[];
  roomTypes: string[];
  checkInTime: string;
  checkOutTime: string;
  heroImage: string;
  bannerImage: string;
  galleryImages: string[];
  featured: boolean;
  displayOrder: string;
  status: HotelStatus;
}

const emptyForm = (): HotelFormState => ({
  name: '', slug: '', isSlugManual: false, destination: '', country: '', city: '',
  category: '3 Star', starRating: 3, shortDescription: '', fullDescription: '', address: '',
  googleMapsLink: '', contactNumber: '', email: '', website: '',
  amenities: [], mealPlans: [], roomTypes: [], checkInTime: '', checkOutTime: '',
  heroImage: '', bannerImage: '', galleryImages: [], featured: false, displayOrder: '', status: 'Active',
});

function ChipListInput({ label, values, placeholder, onChange }: { label: string; values: string[]; placeholder: string; onChange: (next: string[]) => void }) {
  const [draft, setDraft] = useState('');

  const addChip = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (values.some((v) => v.toLowerCase() === trimmed.toLowerCase())) { setDraft(''); return; }
    onChange([...values, trimmed]);
    setDraft('');
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">{label}</label>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <span key={value} className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700">
            {value}
            <button type="button" onClick={() => onChange(values.filter((v) => v !== value))} aria-label={`Remove ${value}`} className="text-stone-400 hover:text-red-600">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addChip(); } }}
          placeholder={placeholder}
          className="flex-1 rounded-sm border border-stone-200 px-3 py-2 text-xs text-stone-700 outline-none focus:border-[#008080]"
        />
        <button type="button" onClick={addChip} className="rounded-sm bg-stone-100 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-600 transition hover:bg-stone-200">Add</button>
      </div>
    </div>
  );
}

function GalleryImagesInput({ images, gallery, onChange }: { images: string[]; gallery: GalleryImage[]; onChange: (next: string[]) => void }) {
  const [pickerValue, setPickerValue] = useState('');
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Gallery Images</label>
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((url) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-sm border border-stone-200 bg-stone-50">
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(images.filter((item) => item !== url))}
                className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-red-500 opacity-0 shadow transition group-hover:opacity-100"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <MediaPickerField
        label="Add gallery image"
        value={pickerValue}
        gallery={gallery}
        onChange={(url) => {
          setPickerValue('');
          if (url && !images.includes(url)) onChange([...images, url]);
        }}
      />
    </div>
  );
}

export function HotelsTab({ hotels, packages, gallery, masterData, isSaving, onSaveHotel, onDeleteHotel, onQuickAddMasterData }: HotelsTabProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | HotelStatus>('all');
  const [destinationFilter, setDestinationFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [form, setForm] = useState<HotelFormState>(emptyForm());
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Hotel | null>(null);

  const destinationOptions = useMemo(() => ['All', ...Array.from(new Set(hotels.map((h) => h.destination).filter(Boolean))).sort()], [hotels]);

  const getUsageCount = (hotelId: string) => packages.filter((pkg) => (pkg.hotelIds || []).includes(hotelId)).length;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return hotels
      .filter((hotel) => statusFilter === 'all' || hotel.status === statusFilter)
      .filter((hotel) => destinationFilter === 'All' || hotel.destination === destinationFilter)
      .filter((hotel) => !query || [hotel.name, hotel.destination, hotel.city, hotel.country].some((field) => String(field ?? '').toLowerCase().includes(query)))
      .sort((a, b) => (a.displayOrder ?? Number.MAX_SAFE_INTEGER) - (b.displayOrder ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name));
  }, [hotels, search, statusFilter, destinationFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const openAddForm = () => {
    setEditingHotel(null);
    setForm(emptyForm());
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditForm = (hotel: Hotel) => {
    setEditingHotel(hotel);
    setForm({
      name: hotel.name,
      slug: hotel.slug,
      isSlugManual: true,
      destination: hotel.destination || '',
      country: hotel.country || '',
      city: hotel.city || '',
      category: hotel.category,
      starRating: hotel.starRating,
      shortDescription: hotel.shortDescription || '',
      fullDescription: hotel.fullDescription || '',
      address: hotel.address || '',
      googleMapsLink: hotel.googleMapsLink || '',
      contactNumber: hotel.contactNumber || '',
      email: hotel.email || '',
      website: hotel.website || '',
      amenities: hotel.amenities || [],
      mealPlans: hotel.mealPlans || [],
      roomTypes: hotel.roomTypes || [],
      checkInTime: hotel.checkInTime || '',
      checkOutTime: hotel.checkOutTime || '',
      heroImage: hotel.heroImage || '',
      bannerImage: hotel.bannerImage || '',
      galleryImages: hotel.galleryImages || [],
      featured: hotel.featured,
      displayOrder: hotel.displayOrder != null ? String(hotel.displayOrder) : '',
      status: hotel.status,
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const updateName = (name: string) => {
    setForm((prev) => ({ ...prev, name, slug: prev.isSlugManual ? prev.slug : slugifyMasterDataName(name) }));
  };

  const handleSubmit = async () => {
    const trimmedName = form.name.trim();
    if (!trimmedName || !form.destination) {
      setFormError('Hotel Name and Destination are required.');
      return;
    }
    const slug = form.slug.trim() ? slugifyMasterDataName(form.slug) : slugifyMasterDataName(trimmedName);
    const duplicate = hotels.find((h) => h.id !== editingHotel?.id && h.slug === slug);
    if (duplicate) {
      setFormError(`Slug "${slug}" is already used by "${duplicate.name}".`);
      return;
    }

    const now = new Date().toISOString();
    const hotel: Hotel = {
      id: editingHotel?.id || '',
      name: trimmedName,
      slug,
      destination: form.destination,
      country: form.country || undefined,
      city: form.city || undefined,
      category: form.category,
      starRating: Math.max(1, Math.min(5, Number(form.starRating) || 3)),
      shortDescription: form.shortDescription.trim() || undefined,
      fullDescription: form.fullDescription.trim() || undefined,
      address: form.address.trim() || undefined,
      googleMapsLink: form.googleMapsLink.trim() || undefined,
      contactNumber: form.contactNumber.trim() || undefined,
      email: form.email.trim() || undefined,
      website: form.website.trim() || undefined,
      amenities: form.amenities,
      mealPlans: form.mealPlans,
      roomTypes: form.roomTypes,
      checkInTime: form.checkInTime || undefined,
      checkOutTime: form.checkOutTime || undefined,
      heroImage: form.heroImage || undefined,
      bannerImage: form.bannerImage || undefined,
      galleryImages: form.galleryImages,
      featured: form.featured,
      displayOrder: form.displayOrder.trim() ? Number(form.displayOrder) : undefined,
      status: form.status,
      createdAt: editingHotel?.createdAt || now,
      updatedAt: now,
    };

    await onSaveHotel(hotel);
    setIsFormOpen(false);
  };

  const handleToggleStatus = async (hotel: Hotel) => {
    await onSaveHotel({ ...hotel, status: hotel.status === 'Active' ? 'Inactive' : 'Active', updatedAt: new Date().toISOString() });
  };

  const handleToggleFeatured = async (hotel: Hotel) => {
    await onSaveHotel({ ...hotel, featured: !hotel.featured, updatedAt: new Date().toISOString() });
  };

  const handleReorder = async (hotel: Hotel, direction: 'up' | 'down') => {
    const sorted = [...hotels].sort((a, b) => (a.displayOrder ?? Number.MAX_SAFE_INTEGER) - (b.displayOrder ?? Number.MAX_SAFE_INTEGER));
    const index = sorted.findIndex((h) => h.id === hotel.id);
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (index === -1 || swapIndex < 0 || swapIndex >= sorted.length) return;
    const neighbor = sorted[swapIndex];
    const hotelOrder = hotel.displayOrder ?? index;
    const neighborOrder = neighbor.displayOrder ?? swapIndex;
    await onSaveHotel({ ...hotel, displayOrder: neighborOrder, updatedAt: new Date().toISOString() });
    await onSaveHotel({ ...neighbor, displayOrder: hotelOrder, updatedAt: new Date().toISOString() });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await onDeleteHotel(deleteTarget.id);
    setDeleteTarget(null);
  };

  const deleteUsageCount = deleteTarget ? getUsageCount(deleteTarget.id) : 0;

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-normal text-[#333333] tracking-tight">Hotel Management</h2>
          <p className="text-xs text-stone-500 font-light">Manage hotel partners, amenities, and media referenced by the Package CMS.</p>
        </div>
        <button onClick={openAddForm} className="px-4 py-2.5 bg-[#008080] hover:bg-[#006666] text-white text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm flex items-center justify-center gap-1.5 cursor-pointer">
          <Plus className="w-4 h-4" />
          <span>Add Hotel</span>
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded shadow-xs overflow-hidden">
        <div className="grid gap-3 border-b border-stone-100 bg-stone-50 p-4 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input type="text" placeholder="Search hotels..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080]" />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as 'all' | HotelStatus); setPage(1); }} className="w-full rounded border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700 focus:border-[#008080] focus:outline-none">
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <select value={destinationFilter} onChange={(e) => { setDestinationFilter(e.target.value); setPage(1); }} className="w-full rounded border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700 focus:border-[#008080] focus:outline-none">
            {destinationOptions.map((d) => <option key={d} value={d}>{d === 'All' ? 'All Destinations' : d}</option>)}
          </select>
        </div>

        {pageItems.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Building2 className="mx-auto h-10 w-10 text-stone-300" />
            <h3 className="mt-4 text-sm font-bold text-stone-900">No hotels found.</h3>
            <p className="mt-1 text-xs text-stone-500">Add a hotel to make it selectable from the Package CMS.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {pageItems.map((hotel) => {
              const usage = getUsageCount(hotel.id);
              return (
                <div key={hotel.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-sm border border-stone-200 bg-stone-50">
                      {hotel.heroImage && <img src={hotel.heroImage} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <strong className="truncate text-sm font-bold text-stone-900">{hotel.name}</strong>
                        {hotel.featured && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />}
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${hotel.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-600'}`}>{hotel.status}</span>
                      </div>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-stone-400">
                        <MapPin className="h-3 w-3" />
                        {hotel.destination}{hotel.city ? `, ${hotel.city}` : ''} · {hotel.category} · {usage} package{usage === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button onClick={() => handleReorder(hotel, 'up')} className="rounded-sm p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700" title="Move up"><ArrowUp className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleReorder(hotel, 'down')} className="rounded-sm p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700" title="Move down"><ArrowDown className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleToggleFeatured(hotel)} className={`rounded-sm p-1.5 transition hover:bg-amber-50 ${hotel.featured ? 'text-amber-500' : 'text-stone-400 hover:text-amber-500'}`} title={hotel.featured ? 'Unfeature' : 'Feature'}><Star className={`w-3.5 h-3.5 ${hotel.featured ? 'fill-amber-400' : ''}`} /></button>
                    <button onClick={() => handleToggleStatus(hotel)} className="rounded-sm px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider text-stone-600 transition hover:bg-stone-100" title="Toggle Active/Inactive">{hotel.status === 'Active' ? 'Deactivate' : 'Activate'}</button>
                    <button onClick={() => openEditForm(hotel)} className="rounded-sm p-1.5 text-stone-600 transition hover:bg-[#008080] hover:text-white" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteTarget(hotel)} className="rounded-sm p-1.5 text-stone-600 transition hover:bg-rose-600 hover:text-white" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-stone-100 px-4 py-4">
            <p className="text-[11px] text-stone-500">Page {safePage} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1} className="inline-flex items-center gap-1 rounded-sm border border-stone-200 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-600 disabled:opacity-40"><ChevronLeft className="h-3.5 w-3.5" />Prev</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="inline-flex items-center gap-1 rounded-sm border border-stone-200 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-600 disabled:opacity-40">Next<ChevronRight className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 backdrop-blur-xs px-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[20px] bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <h3 className="text-xl font-serif text-stone-950">{editingHotel ? 'Edit Hotel' : 'Add New Hotel'}</h3>
              <button onClick={() => setIsFormOpen(false)} className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Hotel Name *</label>
                <input type="text" value={form.name} onChange={(e) => updateName(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm focus:outline-none focus:border-[#008080]" />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Slug</label>
                <input type="text" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value, isSlugManual: true }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-xs font-mono text-stone-600 focus:outline-none focus:border-[#008080]" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MasterDataSelectField
                label="Country"
                value={form.country}
                options={masterData.countries}
                onChange={(value) => setForm((p) => ({ ...p, country: value }))}
                onAddNew={(name) => onQuickAddMasterData('masterCountries', name)}
              />
              <MasterDataSelectField
                label="Destination"
                value={form.destination}
                options={masterData.destinations}
                required
                onChange={(value) => setForm((p) => ({ ...p, destination: value }))}
                onAddNew={(name) => onQuickAddMasterData('masterDestinations', name, form.country || undefined)}
              />
              <MasterDataSelectField
                label="City"
                value={form.city}
                options={masterData.cities}
                onChange={(value) => setForm((p) => ({ ...p, city: value }))}
                onAddNew={(name) => onQuickAddMasterData('masterCities', name, form.destination || undefined)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Category</label>
                <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as HotelCategory }))} className="w-full px-3 py-2 bg-white border border-stone-200 rounded-sm text-sm focus:outline-none focus:border-[#008080]">
                  {HOTEL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Star Rating</label>
                <input type="number" min={1} max={5} value={form.starRating} onChange={(e) => setForm((p) => ({ ...p, starRating: Number(e.target.value) || 3 }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm focus:outline-none focus:border-[#008080]" />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Display Order</label>
                <input type="number" value={form.displayOrder} onChange={(e) => setForm((p) => ({ ...p, displayOrder: e.target.value }))} placeholder="—" className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm focus:outline-none focus:border-[#008080]" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Short Description</label>
              <textarea rows={2} value={form.shortDescription} onChange={(e) => setForm((p) => ({ ...p, shortDescription: e.target.value }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm focus:outline-none focus:border-[#008080]" />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Full Description</label>
              <textarea rows={4} value={form.fullDescription} onChange={(e) => setForm((p) => ({ ...p, fullDescription: e.target.value }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm focus:outline-none focus:border-[#008080]" />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Address</label>
              <textarea rows={2} value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm focus:outline-none focus:border-[#008080]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Google Maps Link</label>
                <input type="text" value={form.googleMapsLink} onChange={(e) => setForm((p) => ({ ...p, googleMapsLink: e.target.value }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm focus:outline-none focus:border-[#008080]" />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Website</label>
                <input type="text" value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm focus:outline-none focus:border-[#008080]" />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Contact Number</label>
                <input type="text" value={form.contactNumber} onChange={(e) => setForm((p) => ({ ...p, contactNumber: e.target.value }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm focus:outline-none focus:border-[#008080]" />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm focus:outline-none focus:border-[#008080]" />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Check-in Time</label>
                <input type="time" value={form.checkInTime} onChange={(e) => setForm((p) => ({ ...p, checkInTime: e.target.value }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm focus:outline-none focus:border-[#008080]" />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Check-out Time</label>
                <input type="time" value={form.checkOutTime} onChange={(e) => setForm((p) => ({ ...p, checkOutTime: e.target.value }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm focus:outline-none focus:border-[#008080]" />
              </div>
            </div>

            <ChipListInput label="Amenities" values={form.amenities} placeholder="E.g. Pool, WiFi, Spa" onChange={(next) => setForm((p) => ({ ...p, amenities: next }))} />
            <ChipListInput label="Meal Plans" values={form.mealPlans} placeholder="E.g. Bed & Breakfast" onChange={(next) => setForm((p) => ({ ...p, mealPlans: next }))} />
            <ChipListInput label="Room Types" values={form.roomTypes} placeholder="E.g. Deluxe Room" onChange={(next) => setForm((p) => ({ ...p, roomTypes: next }))} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MediaPickerField label="Hero Image" value={form.heroImage} gallery={gallery} onChange={(url) => setForm((p) => ({ ...p, heroImage: url }))} />
              <MediaPickerField label="Banner Image" value={form.bannerImage} gallery={gallery} onChange={(url) => setForm((p) => ({ ...p, bannerImage: url }))} />
            </div>

            <GalleryImagesInput images={form.galleryImages} gallery={gallery} onChange={(next) => setForm((p) => ({ ...p, galleryImages: next }))} />

            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-xs font-semibold text-stone-600">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))} className="h-3.5 w-3.5 accent-[#008080]" />
                Featured Hotel
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-stone-600">
                Status
                <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as HotelStatus }))} className="rounded-sm border border-stone-200 px-2 py-1.5 text-xs focus:outline-none focus:border-[#008080]">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>
            </div>

            {formError && <p className="text-xs font-semibold text-red-600">{formError}</p>}

            <div className="flex gap-3 border-t border-stone-100 pt-4">
              <button onClick={() => setIsFormOpen(false)} className="flex-1 rounded-sm border border-stone-200 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-stone-600 hover:bg-stone-50">Cancel</button>
              <button onClick={handleSubmit} disabled={isSaving} className="flex-1 rounded-sm bg-[#008080] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm hover:bg-[#006666] disabled:opacity-60">{isSaving ? 'Saving...' : editingHotel ? 'Save Changes' : 'Add Hotel'}</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[18px] border border-stone-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600"><AlertTriangle className="h-5 w-5" /></span>
              <div>
                <h4 className="text-lg font-serif text-stone-950">Delete "{deleteTarget.name}"?</h4>
                {deleteUsageCount > 0 ? (
                  <p className="mt-1 text-xs text-stone-500">This hotel is linked to <span className="font-bold text-stone-700">{deleteUsageCount} package{deleteUsageCount === 1 ? '' : 's'}</span>. Deleting it will remove it from the picker; linked packages keep their reference but won't resolve a hotel record until you update them.</p>
                ) : (
                  <p className="mt-1 text-xs text-stone-500">This hotel is not currently linked to any package.</p>
                )}
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 rounded-sm border border-stone-200 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-stone-600 hover:bg-stone-50">Cancel</button>
              <button onClick={handleConfirmDelete} disabled={isSaving} className="flex-1 rounded-sm bg-red-600 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm hover:bg-red-700 disabled:opacity-60">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HotelsTab;
