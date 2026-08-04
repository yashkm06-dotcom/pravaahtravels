import React, { useMemo, useState } from 'react';
import { AlertTriangle, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Copy, Edit2, List, Plane, Plus, Search, Trash2, X } from 'lucide-react';
import type { DepartureStatus, PackageDeparture, TravelPackage } from '../../types';

interface DeparturesTabProps {
  packages: TravelPackage[];
  isSaving: boolean;
  onUpdatePackageDepartures: (packageId: string, departures: PackageDeparture[]) => Promise<void>;
}

interface FlatDeparture {
  departure: PackageDeparture;
  pkg: TravelPackage;
  availableSeats: number;
  effectiveStatus: DepartureStatus;
}

const getAvailableSeats = (departure: PackageDeparture) => Math.max(0, (departure.totalSeats || 0) - (departure.bookedSeats || 0));

// Sold Out is derived automatically from seats — an admin-picked status never overrides zero
// availability, matching "Sold Out should automatically appear when seats become zero."
const getEffectiveStatus = (departure: PackageDeparture): DepartureStatus => {
  if (departure.status === 'Cancelled') return 'Cancelled';
  if (getAvailableSeats(departure) <= 0) return 'Sold Out';
  return departure.guaranteedDeparture ? 'Guaranteed' : (departure.status === 'Sold Out' ? 'Scheduled' : departure.status);
};

const emptyDepartureForm = () => ({
  departureDate: '',
  returnDate: '',
  duration: '',
  totalSeats: '20',
  bookedSeats: '0',
  bookingCutoffDate: '',
  guaranteedDeparture: false,
  priceOverride: '',
  status: 'Scheduled' as DepartureStatus,
});

export function DeparturesTab({ packages, isSaving, onUpdatePackageDepartures }: DeparturesTabProps) {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DepartureStatus>('all');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formPackageId, setFormPackageId] = useState('');
  const [editingDepartureId, setEditingDepartureId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyDepartureForm());
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<FlatDeparture | null>(null);

  const eligiblePackages = useMemo(() => packages.filter((pkg) => pkg.cmsStatus !== 'deleted').sort((a, b) => a.title.localeCompare(b.title)), [packages]);

  const allDepartures = useMemo<FlatDeparture[]>(() => {
    return eligiblePackages.flatMap((pkg) => (pkg.departures || []).map((departure) => ({
      departure,
      pkg,
      availableSeats: getAvailableSeats(departure),
      effectiveStatus: getEffectiveStatus(departure),
    })));
  }, [eligiblePackages]);

  const filteredDepartures = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allDepartures
      .filter((entry) => statusFilter === 'all' || entry.effectiveStatus === statusFilter)
      .filter((entry) => !query || entry.pkg.title.toLowerCase().includes(query) || entry.pkg.destination?.toLowerCase().includes(query))
      .sort((a, b) => new Date(a.departure.departureDate || 0).getTime() - new Date(b.departure.departureDate || 0).getTime());
  }, [allDepartures, search, statusFilter]);

  const openAddForm = () => {
    setFormPackageId(eligiblePackages[0]?.id || '');
    setEditingDepartureId(null);
    setForm(emptyDepartureForm());
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditForm = (entry: FlatDeparture) => {
    setFormPackageId(entry.pkg.id);
    setEditingDepartureId(entry.departure.id);
    setForm({
      departureDate: entry.departure.departureDate || '',
      returnDate: entry.departure.returnDate || '',
      duration: entry.departure.duration || '',
      totalSeats: String(entry.departure.totalSeats ?? 20),
      bookedSeats: String(entry.departure.bookedSeats ?? 0),
      bookingCutoffDate: entry.departure.bookingCutoffDate || '',
      guaranteedDeparture: entry.departure.guaranteedDeparture,
      priceOverride: entry.departure.priceOverride != null ? String(entry.departure.priceOverride) : '',
      status: entry.departure.status,
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const openDuplicateForm = (entry: FlatDeparture) => {
    setFormPackageId(entry.pkg.id);
    setEditingDepartureId(null);
    setForm({
      departureDate: '',
      returnDate: '',
      duration: entry.departure.duration || '',
      totalSeats: String(entry.departure.totalSeats ?? 20),
      bookedSeats: '0',
      bookingCutoffDate: '',
      guaranteedDeparture: entry.departure.guaranteedDeparture,
      priceOverride: entry.departure.priceOverride != null ? String(entry.departure.priceOverride) : '',
      status: 'Scheduled',
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    const targetPackage = eligiblePackages.find((pkg) => pkg.id === formPackageId);
    if (!targetPackage) {
      setFormError('Select a package for this departure.');
      return;
    }
    if (!form.departureDate) {
      setFormError('Departure Date is required.');
      return;
    }
    const totalSeats = Math.max(0, Number(form.totalSeats) || 0);
    const bookedSeats = Math.max(0, Math.min(totalSeats, Number(form.bookedSeats) || 0));
    const now = new Date().toISOString();

    const existing = targetPackage.departures || [];
    const departureRecord: PackageDeparture = {
      id: editingDepartureId || `dep-${Date.now().toString(36)}-${Math.round(Math.random() * 1e6).toString(36)}`,
      departureDate: form.departureDate,
      returnDate: form.returnDate || undefined,
      duration: form.duration.trim() || undefined,
      totalSeats,
      bookedSeats,
      bookingCutoffDate: form.bookingCutoffDate || undefined,
      guaranteedDeparture: form.guaranteedDeparture,
      priceOverride: form.priceOverride.trim() ? Number(form.priceOverride) : null,
      status: form.status,
      createdAt: editingDepartureId ? (existing.find((d) => d.id === editingDepartureId)?.createdAt || now) : now,
      updatedAt: now,
    };

    const updatedDepartures = editingDepartureId
      ? existing.map((d) => (d.id === editingDepartureId ? departureRecord : d))
      : [...existing, departureRecord];

    await onUpdatePackageDepartures(targetPackage.id, updatedDepartures);
    setIsFormOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const updated = (deleteTarget.pkg.departures || []).filter((d) => d.id !== deleteTarget.departure.id);
    await onUpdatePackageDepartures(deleteTarget.pkg.id, updated);
    setDeleteTarget(null);
  };

  const statusBadgeClass = (status: DepartureStatus) => {
    if (status === 'Sold Out') return 'bg-rose-50 border-rose-200 text-rose-700';
    if (status === 'Guaranteed') return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    if (status === 'Cancelled') return 'bg-stone-100 border-stone-200 text-stone-500';
    return 'bg-sky-50 border-sky-200 text-sky-700';
  };

  // Calendar grid: 42 cells (6 weeks) starting from the Sunday on/before the 1st of the month.
  const calendarCells = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay();
    const gridStart = new Date(year, month, 1 - startOffset);

    return Array.from({ length: 42 }, (_, index) => {
      const cellDate = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
      const cellDepartures = allDepartures.filter((entry) => {
        const departureDate = new Date(entry.departure.departureDate);
        return departureDate.getFullYear() === cellDate.getFullYear()
          && departureDate.getMonth() === cellDate.getMonth()
          && departureDate.getDate() === cellDate.getDate();
      });
      return { date: cellDate, inMonth: cellDate.getMonth() === month, departures: cellDepartures };
    });
  }, [calendarMonth, allDepartures]);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-normal text-[#333333] tracking-tight">Departure Management</h2>
          <p className="text-xs text-stone-500 font-light">Manage scheduled departures, seats, and availability across every package.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-sm border border-stone-200 bg-white p-1">
            <button onClick={() => setView('list')} className={`flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${view === 'list' ? 'bg-[#008080] text-white' : 'text-stone-600'}`}><List className="h-3.5 w-3.5" />List</button>
            <button onClick={() => setView('calendar')} className={`flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${view === 'calendar' ? 'bg-[#008080] text-white' : 'text-stone-600'}`}><CalendarIcon className="h-3.5 w-3.5" />Calendar</button>
          </div>
          <button onClick={openAddForm} className="px-4 py-2.5 bg-[#008080] hover:bg-[#006666] text-white text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm flex items-center justify-center gap-1.5 cursor-pointer">
            <Plus className="w-4 h-4" />
            <span>Add Departure</span>
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="bg-white border border-stone-200 rounded shadow-xs overflow-hidden">
          <div className="grid gap-3 border-b border-stone-100 bg-stone-50 p-4 sm:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input type="text" placeholder="Search by package or destination..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080]" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | DepartureStatus)} className="w-full rounded border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700 focus:border-[#008080] focus:outline-none">
              <option value="all">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Guaranteed">Guaranteed</option>
              <option value="Sold Out">Sold Out</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {filteredDepartures.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <Plane className="mx-auto h-10 w-10 text-stone-300" />
              <h3 className="mt-4 text-sm font-bold text-stone-900">No departures found.</h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-100 bg-[#f8f7f4] text-stone-500 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Package</th>
                    <th className="py-3 px-4">Departure</th>
                    <th className="py-3 px-4">Return</th>
                    <th className="py-3 px-4">Seats</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
                  {filteredDepartures.map((entry) => (
                    <tr key={entry.departure.id} className="hover:bg-stone-50/40 transition">
                      <td className="py-3 px-4">
                        <strong className="block font-bold text-stone-900">{entry.pkg.title}</strong>
                        <span className="text-[10px] text-stone-400">{entry.pkg.destination}</span>
                      </td>
                      <td className="py-3 px-4">{entry.departure.departureDate}</td>
                      <td className="py-3 px-4 text-stone-500">{entry.departure.returnDate || '—'}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-stone-900">{entry.availableSeats}</span>
                        <span className="text-stone-400"> / {entry.departure.totalSeats} available</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase ${statusBadgeClass(entry.effectiveStatus)}`}>{entry.effectiveStatus}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => openEditForm(entry)} className="p-1.5 bg-stone-100 text-stone-600 hover:bg-[#008080] hover:text-white rounded-sm transition" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => openDuplicateForm(entry)} className="p-1.5 bg-stone-100 text-stone-600 hover:bg-[#4DA528] hover:text-white rounded-sm transition" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setDeleteTarget(entry)} className="p-1.5 bg-stone-100 text-stone-600 hover:bg-rose-600 hover:text-white rounded-sm transition" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded shadow-xs p-4">
          <div className="mb-4 flex items-center justify-between">
            <button onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} className="rounded-sm border border-stone-200 p-2 text-stone-600 hover:border-[#008080] hover:text-[#008080]"><ChevronLeft className="h-4 w-4" /></button>
            <h3 className="text-sm font-bold text-stone-900">{calendarMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h3>
            <button onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} className="rounded-sm border border-stone-200 p-2 text-stone-600 hover:border-[#008080] hover:text-[#008080]"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold uppercase tracking-wider text-stone-400">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day} className="py-2">{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell, idx) => (
              <div key={idx} className={`min-h-[84px] rounded-sm border p-1.5 text-left ${cell.inMonth ? 'border-stone-100 bg-white' : 'border-stone-50 bg-stone-50/50'}`}>
                <span className={`text-[10px] font-semibold ${cell.inMonth ? 'text-stone-500' : 'text-stone-300'}`}>{cell.date.getDate()}</span>
                <div className="mt-1 space-y-0.5">
                  {cell.departures.slice(0, 2).map((entry) => (
                    <div key={entry.departure.id} onClick={() => openEditForm(entry)} className={`cursor-pointer truncate rounded px-1 py-0.5 text-[9px] font-semibold ${statusBadgeClass(entry.effectiveStatus)}`} title={entry.pkg.title}>
                      {entry.pkg.title}
                    </div>
                  ))}
                  {cell.departures.length > 2 && <div className="text-[9px] text-stone-400">+{cell.departures.length - 2} more</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 backdrop-blur-xs px-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[20px] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <h3 className="text-xl font-serif text-stone-950">{editingDepartureId ? 'Edit Departure' : 'Add Departure'}</h3>
              <button onClick={() => setIsFormOpen(false)} className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Package *</label>
              <select value={formPackageId} onChange={(e) => setFormPackageId(e.target.value)} disabled={Boolean(editingDepartureId)} className="w-full px-3 py-2 bg-white border border-stone-200 rounded-sm text-sm focus:outline-none focus:border-[#008080] disabled:bg-stone-100">
                {eligiblePackages.map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.title}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Departure Date *</label>
                <input type="date" value={form.departureDate} onChange={(e) => setForm((p) => ({ ...p, departureDate: e.target.value }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm focus:outline-none focus:border-[#008080]" />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Return Date</label>
                <input type="date" value={form.returnDate} onChange={(e) => setForm((p) => ({ ...p, returnDate: e.target.value }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm focus:outline-none focus:border-[#008080]" />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Duration</label>
                <input type="text" placeholder="E.g. 5 Days / 4 Nights" value={form.duration} onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm focus:outline-none focus:border-[#008080]" />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Booking Cut-off Date</label>
                <input type="date" value={form.bookingCutoffDate} onChange={(e) => setForm((p) => ({ ...p, bookingCutoffDate: e.target.value }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm focus:outline-none focus:border-[#008080]" />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Total Seats</label>
                <input type="number" min={0} value={form.totalSeats} onChange={(e) => setForm((p) => ({ ...p, totalSeats: e.target.value }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm focus:outline-none focus:border-[#008080]" />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Booked Seats</label>
                <input type="number" min={0} value={form.bookedSeats} onChange={(e) => setForm((p) => ({ ...p, bookedSeats: e.target.value }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm focus:outline-none focus:border-[#008080]" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Price Override (optional)</label>
                <input type="number" min={0} placeholder="Leave blank to use package price" value={form.priceOverride} onChange={(e) => setForm((p) => ({ ...p, priceOverride: e.target.value }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm focus:outline-none focus:border-[#008080]" />
              </div>
            </div>

            <p className="text-[11px] text-stone-500">
              Available seats: <strong className="text-stone-800">{Math.max(0, (Number(form.totalSeats) || 0) - (Number(form.bookedSeats) || 0))}</strong>
              {(Number(form.totalSeats) || 0) - (Number(form.bookedSeats) || 0) <= 0 && <span className="ml-2 font-bold text-rose-600">Sold Out</span>}
            </p>

            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-xs font-semibold text-stone-600">
                <input type="checkbox" checked={form.guaranteedDeparture} onChange={(e) => setForm((p) => ({ ...p, guaranteedDeparture: e.target.checked }))} className="h-3.5 w-3.5 accent-[#008080]" />
                Guaranteed Departure
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-stone-600">
                Status
                <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as DepartureStatus }))} className="rounded-sm border border-stone-200 px-2 py-1.5 text-xs focus:outline-none focus:border-[#008080]">
                  <option value="Scheduled">Scheduled</option>
                  <option value="Guaranteed">Guaranteed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </label>
            </div>

            {formError && <p className="text-xs font-semibold text-red-600">{formError}</p>}

            <div className="flex gap-3 border-t border-stone-100 pt-4">
              <button onClick={() => setIsFormOpen(false)} className="flex-1 rounded-sm border border-stone-200 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-stone-600 hover:bg-stone-50">Cancel</button>
              <button onClick={handleSubmit} disabled={isSaving} className="flex-1 rounded-sm bg-[#008080] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm hover:bg-[#006666] disabled:opacity-60">{isSaving ? 'Saving...' : editingDepartureId ? 'Save Changes' : 'Add Departure'}</button>
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
                <h4 className="text-lg font-serif text-stone-950">Delete this departure?</h4>
                <p className="mt-1 text-xs text-stone-500">{deleteTarget.pkg.title} — {deleteTarget.departure.departureDate}. This cannot be undone.</p>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 rounded-sm border border-stone-200 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-stone-600 hover:bg-stone-50">Cancel</button>
              <button onClick={handleDelete} disabled={isSaving} className="flex-1 rounded-sm bg-red-600 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm hover:bg-red-700 disabled:opacity-60">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeparturesTab;
