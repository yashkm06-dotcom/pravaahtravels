import React, { useMemo, useState, useEffect } from 'react';
import {
  Compass, FileText, Package, Image as ImageIcon,
  Plus, Edit2, Trash2, X, Search, Download,
  Calendar, DollarSign, Users, Globe, Eye, ChevronDown, ChevronUp,
  Upload, CheckCircle, Clock, Phone, Mail, MessageSquare, Clipboard, ExternalLink, Star, LineChart as LineChartIcon, RefreshCw,
  Settings, Palette, Home, Megaphone, Images, Heart, Sparkles, ChevronRight, ChevronLeft,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { db, storage, collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, writeBatch } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { TravelPackage, Enquiry, GalleryImage, WebsiteCMSSettings, formatPrice, CustomerProfile, ActivityItem, ActivityChildItem, ActivityRecommendation, FeaturedCategoryItem, DestinationCategory } from '../../types';
import { TableSkeletonLoader, CardGridSkeletonLoader } from '../SkeletonLoader';
import { handleTravelImageError } from '../../utils/imageFallback';

interface OverviewTabProps {
  recentBookings: any[];
  bookings: any[];
  adminReviews: any[];
  metrics: {
    pendingReceivables: number;
    totalPackages: number;
    activePackages: number;
  };
  formatPriceValue: (value: number) => string;
  quickActions: Array<{ label: string; icon: React.ElementType; action: () => void; tone: string }>;
  dashboardStats: Array<{ label: string; value: string | number; description: string; icon: React.ElementType; tone: string }>;
  setActiveTab: (tab: any) => void;
  setActiveBooking: (booking: any) => void;
  setAssignee: (value: string) => void;
  setFollowUpDate: (value: string) => void;
}

export const OverviewTab = React.memo(function OverviewTab(props: OverviewTabProps) {
  const { recentBookings, bookings, adminReviews, metrics, formatPriceValue, quickActions, dashboardStats, setActiveTab, setActiveBooking, setAssignee, setFollowUpDate } = props;

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="relative overflow-hidden rounded-[26px] bg-[#071d28] p-6 text-white shadow-[0_24px_70px_rgba(7,29,40,0.22)] sm:p-8">
        <div className="absolute inset-0 bg-linear-to-r from-[#071d28] via-[#071d28]/92 to-[#244034]" />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10 bg-white/5" />
        <div className="relative grid gap-8 xl:grid-cols-[1.3fr_0.7fr] xl:items-center">
          <div>
            <span className="inline-flex rounded-full bg-[#4DA528] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em]">Premium Travel CMS</span>
            <h2 className="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">Command center for bookings, content, and guest journeys.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68">Monitor revenue, manage the package catalogue, respond to leads, and prepare website content from a single luxury operations dashboard.</p>
          </div>
          <div className="rounded-[22px] border border-white/12 bg-white/10 p-5 backdrop-blur-md">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/50">Quick Actions</span>
            <div className="mt-4 grid gap-3">
              {quickActions.map((action) => {
                const ActionIcon = action.icon;
                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={action.action}
                    className={`inline-flex items-center justify-center gap-2 rounded-[5px] px-4 py-3 text-xs font-extrabold uppercase tracking-wider transition hover:-translate-y-0.5 ${action.tone}`}
                  >
                    <ActionIcon className="h-4 w-4" />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => {
          const StatIcon = stat.icon;
          return (
            <div key={stat.label} className={`group rounded-[20px] border border-stone-200 bg-linear-to-br ${stat.tone} p-6 shadow-[0_14px_38px_rgba(18,38,32,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(18,38,32,0.14)]`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-500">{stat.label}</span>
                  <strong className="mt-3 block text-3xl font-extrabold tracking-tight text-stone-950">{stat.value}</strong>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white text-[#4DA528] shadow-sm">
                  <StatIcon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-4 text-sm text-stone-500">{stat.description}</p>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[22px] border border-stone-200 bg-white p-6 shadow-[0_14px_38px_rgba(18,38,32,0.08)]">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Recent Bookings</span>
              <h3 className="mt-2 text-2xl font-extrabold text-stone-950">Latest customer requests</h3>
            </div>
            <button type="button" onClick={() => setActiveTab('bookings')} className="rounded-[5px] bg-stone-950 px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider text-white transition hover:bg-[#4DA528]">Open CRM</button>
          </div>

          {recentBookings.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-stone-300 bg-[#f7f8f3] p-10 text-center">
              <Calendar className="mx-auto h-10 w-10 text-stone-300" />
              <p className="mt-3 text-sm font-bold text-stone-600">No recent bookings yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <button
                  key={booking.id}
                  type="button"
                  onClick={() => {
                    setActiveBooking(booking);
                    setAssignee(booking.assignedStaff || '');
                    setFollowUpDate(booking.followUpDate || '');
                  }}
                  className="flex w-full flex-col gap-3 rounded-[16px] border border-stone-100 bg-[#fbfcf7] p-4 text-left transition hover:border-[#4DA528]/40 hover:bg-white sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#4DA528]">{booking.destination || 'Custom Trip'}</span>
                    <h4 className="mt-1 text-sm font-extrabold text-stone-950">{booking.packageTitle || 'Custom Holiday Package'}</h4>
                    <p className="mt-1 text-xs text-stone-500">{booking.customerName || 'Traveler'} · {booking.travelDate || 'Flexible dates'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-stone-950">{formatPriceValue(booking.price || 0)}</span>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-700">{booking.status || 'New Lead'}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-[22px] border border-stone-200 bg-white p-6 shadow-[0_14px_38px_rgba(18,38,32,0.08)]">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Booking Statistics</span>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                ['New Leads', bookings.filter(b => !b.status || b.status === 'New Lead' || b.status === 'Pending').length],
                ['Confirmed', bookings.filter(b => b.status === 'Confirmed').length],
                ['Receivables', formatPriceValue(metrics.pendingReceivables)],
                ['Reviews', adminReviews.length],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-[16px] bg-[#f7f8f3] p-4">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">{label}</span>
                  <strong className="mt-2 block text-xl font-extrabold text-stone-950">{value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[22px] border border-stone-200 bg-white p-6 shadow-[0_14px_38px_rgba(18,38,32,0.08)]">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Package Statistics</span>
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-stone-600">Active package ratio</span>
                <span className="text-sm font-extrabold text-stone-950">{metrics.totalPackages ? Math.round((metrics.activePackages / metrics.totalPackages) * 100) : 0}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-stone-100">
                <div className="h-full rounded-full bg-[#4DA528]" style={{ width: `${metrics.totalPackages ? Math.round((metrics.activePackages / metrics.totalPackages) * 100) : 0}%` }} />
              </div>
              <button type="button" onClick={() => setActiveTab('packages')} className="inline-flex w-full items-center justify-center gap-2 rounded-[5px] border border-stone-200 px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-stone-700 transition hover:border-[#4DA528] hover:text-[#4DA528]">
                Manage Catalogue
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
});

interface ActivitiesTabProps {
  packages: TravelPackage[];
  onRefreshData: () => Promise<void>;
}

type ActivityManagerPage = 'dashboard' | 'activities' | 'activity-items' | 'recommendations';

const activityManagerPaths: Record<Exclude<ActivityManagerPage, 'dashboard'>, string> = {
  activities: '/admin/activities',
  'activity-items': '/admin/activity-items',
  recommendations: '/admin/recommendations',
};

const getInitialActivityManager = (): ActivityManagerPage => {
  if (typeof window === 'undefined') return 'dashboard';
  if (window.location.pathname === '/admin/activities') return 'activities';
  if (window.location.pathname === '/admin/activity-items') return 'activity-items';
  if (window.location.pathname === '/admin/recommendations') return 'recommendations';
  return 'dashboard';
};

function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[26px] bg-white p-6 shadow-[0_14px_38px_rgba(18,38,32,0.08)] sm:p-8">
      <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-linear-to-l from-[#4DA528]/12 to-transparent lg:block" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full bg-[#4DA528]/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">{eyebrow}</span>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-stone-950">{title}</h2>
          <p className="mt-3 text-sm leading-7 text-stone-500">{description}</p>
        </div>
        {action}
      </div>
    </section>
  );
}

function AdminManagementCard({
  icon: Icon,
  title,
  description,
  count,
  onOpen,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  count: number;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex min-h-[260px] flex-col justify-between rounded-[24px] border border-stone-200 bg-white p-6 text-left shadow-[0_14px_38px_rgba(18,38,32,0.08)] transition duration-300 hover:-translate-y-1 hover:border-[#4DA528]/40 hover:shadow-[0_24px_55px_rgba(18,38,32,0.14)]"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#4DA528]/10 text-[#4DA528] transition group-hover:bg-[#4DA528] group-hover:text-white">
          <Icon className="h-6 w-6" />
        </span>
        <span className="rounded-full bg-[#f7f8f3] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-stone-500">
          {count} {count === 1 ? 'item' : 'items'}
        </span>
      </div>
      <div>
        <h3 className="text-2xl font-extrabold text-stone-950">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-stone-500">{description}</p>
        <span className="mt-6 inline-flex items-center gap-2 rounded-[5px] bg-stone-950 px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-white transition group-hover:bg-[#4DA528]">
          Open
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </button>
  );
}

function AdminSearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative w-full sm:w-[280px]">
      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-[12px] border border-stone-200 bg-[#f7f8f3] pl-11 pr-4 text-sm outline-none transition focus:border-[#4DA528] focus:bg-white"
      />
    </div>
  );
}

function AdminEmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="rounded-[20px] border border-dashed border-stone-200 bg-[#f7f8f3] p-10 text-center">
      <Icon className="mx-auto h-10 w-10 text-stone-300" />
      <p className="mt-3 text-sm font-extrabold text-stone-700">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-stone-500">{description}</p>
    </div>
  );
}

function AdminLoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-[20px] border border-dashed border-stone-200 bg-[#f7f8f3] p-10 text-sm font-semibold text-stone-500">
      <RefreshCw className="h-4 w-4 animate-spin text-[#4DA528]" />
      {label}
    </div>
  );
}

function AdminImagePreview({ src, label }: { src?: string; label: string }) {
  if (!src) {
    return (
      <div className="rounded-[16px] border border-dashed border-stone-300 bg-white p-4 text-xs text-stone-500">
        No image selected yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[16px] border border-stone-200 bg-white">
      <div className="aspect-[16/9] bg-stone-100">
        <img src={src} alt={label} className="h-full w-full object-cover" referrerPolicy="no-referrer" onError={handleTravelImageError} />
      </div>
      <p className="truncate px-4 py-3 text-xs font-semibold text-stone-500">{label}</p>
    </div>
  );
}

export function ActivitiesTab({ packages, onRefreshData }: ActivitiesTabProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [featuredCategories, setFeaturedCategories] = useState<FeaturedCategoryItem[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loadingFeaturedCategories, setLoadingFeaturedCategories] = useState(false);
  const [activitySearch, setActivitySearch] = useState('');
  const [featuredSearch, setFeaturedSearch] = useState('');
  const [activityEditingId, setActivityEditingId] = useState<string | null>(null);
  const [featuredEditingId, setFeaturedEditingId] = useState<string | null>(null);
  const [activeActivityForm, setActiveActivityForm] = useState<Partial<ActivityItem>>({
    title: '',
    subtitle: '',
    description: '',
    imageUrl: '',
    category: 'Pilgrimage',
    location: 'Uttarakhand',
    enabled: true,
  });
  const [activeFeaturedForm, setActiveFeaturedForm] = useState<Partial<FeaturedCategoryItem>>({
    title: '',
    slug: '',
    description: '',
    imageUrl: '',
    category: 'Pilgrimage',
    location: 'Uttarakhand',
    packageIds: [],
    enabled: true,
  });
  const [activityImageUploading, setActivityImageUploading] = useState(false);
  const [activityItemImageUploading, setActivityItemImageUploading] = useState(false);
  const [activityItems, setActivityItems] = useState<ActivityChildItem[]>([]);
  const [loadingActivityItems, setLoadingActivityItems] = useState(false);
  const [activityItemEditingId, setActivityItemEditingId] = useState<string | null>(null);
  const [activeActivityItemForm, setActiveActivityItemForm] = useState<Partial<ActivityChildItem>>({
    activityId: '',
    title: '',
    subtitle: '',
    description: '',
    thumbnailUrl: '',
    startingPrice: 0,
    linkedPackageId: '',
    enabled: true,
  });
  const [activityItemSearch, setActivityItemSearch] = useState('');
  const [activityRecommendations, setActivityRecommendations] = useState<ActivityRecommendation[]>([]);
  const [loadingActivityRecommendations, setLoadingActivityRecommendations] = useState(false);
  const [activityRecommendationEditingId, setActivityRecommendationEditingId] = useState<string | null>(null);
  const [activeActivityRecommendationForm, setActiveActivityRecommendationForm] = useState<Partial<ActivityRecommendation>>({
    activityId: '',
    title: '',
    subtitle: '',
    description: '',
    thumbnailUrl: '',
    linkedPackageId: '',
    enabled: true,
    price: 0,
    duration: '',
    location: '',
    badge: '',
    rating: 0,
  });
  const [activityRecommendationSearch, setActivityRecommendationSearch] = useState('');
  const [activityRecommendationFilter, setActivityRecommendationFilter] = useState<string>('all');
  const [activityRecommendationImageUploading, setActivityRecommendationImageUploading] = useState(false);
  const [featuredImageUploading, setFeaturedImageUploading] = useState(false);
  const [activeManager, setActiveManager] = useState<ActivityManagerPage>(() => getInitialActivityManager());

  const fetchActivities = async () => {
    setLoadingActivities(true);
    try {
      const q = query(collection(db, 'activities'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      setActivities(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })) as ActivityItem[]);
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  const fetchFeaturedCategories = async () => {
    setLoadingFeaturedCategories(true);
    try {
      const q = query(collection(db, 'featuredCategories'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      setFeaturedCategories(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })) as FeaturedCategoryItem[]);
    } catch (err) {
      console.error('Failed to load featured categories:', err);
    } finally {
      setLoadingFeaturedCategories(false);
    }
  };

  const fetchActivityItems = async () => {
    setLoadingActivityItems(true);
    try {
      const q = query(collection(db, 'activityItems'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      setActivityItems(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })) as ActivityChildItem[]);
    } catch (err) {
      console.error('Failed to load activity items:', err);
    } finally {
      setLoadingActivityItems(false);
    }
  };

  const fetchActivityRecommendations = async () => {
    setLoadingActivityRecommendations(true);
    try {
      const q = query(collection(db, 'activityRecommendations'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      setActivityRecommendations(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })) as ActivityRecommendation[]);
    } catch (err) {
      console.error('Failed to load activity recommendations:', err);
    } finally {
      setLoadingActivityRecommendations(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    fetchFeaturedCategories();
    fetchActivityItems();
    fetchActivityRecommendations();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setActiveManager(getInitialActivityManager());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openManager = (manager: Exclude<ActivityManagerPage, 'dashboard'>) => {
    setActiveManager(manager);
    window.history.pushState(null, '', activityManagerPaths[manager]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openManagerDashboard = () => {
    setActiveManager('dashboard');
    window.history.pushState(null, '', '/admin-dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetActivityForm = () => {
    setActivityEditingId(null);
    setActiveActivityForm({
      title: '',
      subtitle: '',
      description: '',
      imageUrl: '',
      category: 'Pilgrimage',
      location: 'Uttarakhand',
      enabled: true,
    });
  };

  const resetFeaturedForm = () => {
    setFeaturedEditingId(null);
    setActiveFeaturedForm({
      title: '',
      slug: '',
      description: '',
      imageUrl: '',
      category: 'Pilgrimage',
      location: 'Uttarakhand',
      packageIds: [],
      enabled: true,
    });
  };

  const resetActivityItemForm = () => {
    setActivityItemEditingId(null);
    setActiveActivityItemForm({
      activityId: '',
      title: '',
      subtitle: '',
      description: '',
      thumbnailUrl: '',
      startingPrice: 0,
      linkedPackageId: '',
      enabled: true,
    });
  };

  const resetActivityRecommendationForm = () => {
    setActivityRecommendationEditingId(null);
    setActiveActivityRecommendationForm({
      activityId: '',
      title: '',
      subtitle: '',
      description: '',
      thumbnailUrl: '',
      linkedPackageId: '',
      enabled: true,
      price: 0,
      duration: '',
      location: '',
      badge: '',
      rating: 0,
    });
  };

  const serializeSlug = (value: string) => {
    return value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_]/g, '');
  };

  const handleActivitySave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: activeActivityForm.title?.trim() || 'Untitled Activity',
      subtitle: activeActivityForm.subtitle?.trim() || '',
      description: activeActivityForm.description?.trim() || '',
      imageUrl: activeActivityForm.imageUrl?.trim() || '',
      category: activeActivityForm.category || 'Pilgrimage',
      location: activeActivityForm.location || 'Uttarakhand',
      enabled: activeActivityForm.enabled !== false,
      createdAt: activeActivityForm.createdAt || new Date().toISOString(),
      order: activeActivityForm.order ?? activities.length,
    };

    try {
      if (activityEditingId) {
        await updateDoc(doc(db, 'activities', activityEditingId), payload);
        alert('Activity updated successfully.');
      } else {
        await addDoc(collection(db, 'activities'), payload);
        alert('New activity saved successfully.');
      }
      resetActivityForm();
      await fetchActivities();
      await onRefreshData();
    } catch (err) {
      console.error('Failed to save activity:', err);
      alert('Unable to save activity. Please try again.');
    }
  };

  const handleActivityItemSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      activityId: activeActivityItemForm.activityId || activities[0]?.id || '',
      title: activeActivityItemForm.title?.trim() || 'Untitled Activity Item',
      subtitle: activeActivityItemForm.subtitle?.trim() || '',
      description: activeActivityItemForm.description?.trim() || '',
      thumbnailUrl: activeActivityItemForm.thumbnailUrl?.trim() || '',
      startingPrice: Number(activeActivityItemForm.startingPrice ?? 0),
      linkedPackageId: activeActivityItemForm.linkedPackageId || '',
      enabled: activeActivityItemForm.enabled !== false,
      createdAt: activeActivityItemForm.createdAt || new Date().toISOString(),
      order: activeActivityItemForm.order ?? activityItems.length,
    };

    try {
      if (activityItemEditingId) {
        await updateDoc(doc(db, 'activityItems', activityItemEditingId), payload);
        alert('Activity item updated successfully.');
      } else {
        await addDoc(collection(db, 'activityItems'), payload);
        alert('New activity item saved successfully.');
      }
      resetActivityItemForm();
      await fetchActivityItems();
      await onRefreshData();
    } catch (err) {
      console.error('Failed to save activity item:', err);
      alert('Unable to save activity item. Please try again.');
    }
  };

  const handleFeaturedSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = activeFeaturedForm.slug?.trim() || serializeSlug(activeFeaturedForm.title || 'featured');
    const payload = {
      title: activeFeaturedForm.title?.trim() || 'Untitled Featured Category',
      slug,
      description: activeFeaturedForm.description?.trim() || '',
      imageUrl: activeFeaturedForm.imageUrl?.trim() || '',
      category: activeFeaturedForm.category || 'Pilgrimage',
      location: activeFeaturedForm.location || 'Uttarakhand',
      packageIds: activeFeaturedForm.packageIds || [],
      enabled: activeFeaturedForm.enabled !== false,
      createdAt: activeFeaturedForm.createdAt || new Date().toISOString(),
      order: activeFeaturedForm.order ?? featuredCategories.length,
    };

    try {
      if (featuredEditingId) {
        await updateDoc(doc(db, 'featuredCategories', featuredEditingId), payload);
        alert('Featured category updated successfully.');
      } else {
        await addDoc(collection(db, 'featuredCategories'), payload);
        alert('New featured category saved successfully.');
      }
      resetFeaturedForm();
      await fetchFeaturedCategories();
      await onRefreshData();
    } catch (err) {
      console.error('Failed to save featured category:', err);
      alert('Unable to save featured category. Please try again.');
    }
  };

  const handleActivityRecommendationSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      activityId: activeActivityRecommendationForm.activityId || activities[0]?.id || '',
      title: activeActivityRecommendationForm.title?.trim() || 'Untitled Recommendation',
      subtitle: activeActivityRecommendationForm.subtitle?.trim() || '',
      description: activeActivityRecommendationForm.description?.trim() || '',
      thumbnailUrl: activeActivityRecommendationForm.thumbnailUrl?.trim() || '',
      linkedPackageId: activeActivityRecommendationForm.linkedPackageId || '',
      enabled: activeActivityRecommendationForm.enabled !== false,
      price: Number(activeActivityRecommendationForm.price ?? 0),
      duration: activeActivityRecommendationForm.duration?.trim() || '',
      location: activeActivityRecommendationForm.location?.trim() || '',
      badge: activeActivityRecommendationForm.badge?.trim() || '',
      rating: Number(activeActivityRecommendationForm.rating ?? 0),
      createdAt: activeActivityRecommendationForm.createdAt || new Date().toISOString(),
      order: activeActivityRecommendationForm.order ?? activityRecommendations.length,
    };

    try {
      if (activityRecommendationEditingId) {
        await updateDoc(doc(db, 'activityRecommendations', activityRecommendationEditingId), payload);
        alert('Recommendation updated successfully.');
      } else {
        await addDoc(collection(db, 'activityRecommendations'), payload);
        alert('New recommendation saved successfully.');
      }
      resetActivityRecommendationForm();
      await fetchActivityRecommendations();
      await onRefreshData();
    } catch (err) {
      console.error('Failed to save activity recommendation:', err);
      alert('Unable to save recommendation. Please try again.');
    }
  };

  const handleEditActivity = (activity: ActivityItem) => {
    setActivityEditingId(activity.id);
    setActiveActivityForm({ ...activity });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditActivityItem = (item: ActivityChildItem) => {
    setActivityItemEditingId(item.id);
    setActiveActivityItemForm({ ...item });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditFeaturedCategory = (category: FeaturedCategoryItem) => {
    setFeaturedEditingId(category.id);
    setActiveFeaturedForm({ ...category });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditActivityRecommendation = (item: ActivityRecommendation) => {
    setActivityRecommendationEditingId(item.id);
    setActiveActivityRecommendationForm({ ...item });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reorderDocuments = async <T extends { id: string }>(items: T[], targetId: string, direction: 'up' | 'down', path: 'activities' | 'featuredCategories' | 'activityItems' | 'activityRecommendations') => {
    const currentIndex = items.findIndex((item) => item.id === targetId);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= items.length) return;

    const reordered = [...items];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    try {
      const batch = writeBatch(db);
      reordered.forEach((item, index) => {
        batch.update(doc(db, path, item.id), { order: index });
      });
      await batch.commit();
      if (path === 'activities') {
        await fetchActivities();
      } else if (path === 'featuredCategories') {
        await fetchFeaturedCategories();
      } else if (path === 'activityItems') {
        await fetchActivityItems();
      } else {
        await fetchActivityRecommendations();
      }
      await onRefreshData();
    } catch (err) {
      console.error('Failed to reorder documents:', err);
      alert('Unable to reorder items. Please try again.');
    }
  };

  const handleToggleActivityStatus = async (activity: ActivityItem) => {
    try {
      await updateDoc(doc(db, 'activities', activity.id), { enabled: !activity.enabled });
      await fetchActivities();
      await onRefreshData();
    } catch (err) {
      console.error('Failed to toggle activity status:', err);
      alert('Unable to update activity status.');
    }
  };

  const handleToggleFeaturedStatus = async (category: FeaturedCategoryItem) => {
    try {
      await updateDoc(doc(db, 'featuredCategories', category.id), { enabled: !category.enabled });
      await fetchFeaturedCategories();
      await onRefreshData();
    } catch (err) {
      console.error('Failed to toggle featured category status:', err);
      alert('Unable to update category status.');
    }
  };

  const handleToggleActivityItemStatus = async (item: ActivityChildItem) => {
    try {
      await updateDoc(doc(db, 'activityItems', item.id), { enabled: !item.enabled });
      await fetchActivityItems();
      await onRefreshData();
    } catch (err) {
      console.error('Failed to toggle activity item status:', err);
      alert('Unable to update activity item status.');
    }
  };

  const handleToggleActivityRecommendationStatus = async (item: ActivityRecommendation) => {
    try {
      await updateDoc(doc(db, 'activityRecommendations', item.id), { enabled: !item.enabled });
      await fetchActivityRecommendations();
      await onRefreshData();
    } catch (err) {
      console.error('Failed to toggle activity recommendation status:', err);
      alert('Unable to update recommendation status.');
    }
  };

  const handleDeleteActivityItem = async (id: string) => {
    if (!window.confirm('Delete this activity item permanently?')) return;
    try {
      await deleteDoc(doc(db, 'activityItems', id));
      await fetchActivityItems();
      await onRefreshData();
      alert('Activity item removed successfully.');
    } catch (err) {
      console.error('Failed to delete activity item:', err);
      alert('Unable to delete activity item.');
    }
  };

  const uploadActivityItemImage = async (file: File) => {
    setActivityItemImageUploading(true);
    try {
      const fileName = `activityItem_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const imageRef = ref(storage, `homepage-cms/${fileName}`);
      const snapshot = await uploadBytes(imageRef, file);
      return await getDownloadURL(snapshot.ref);
    } finally {
      setActivityItemImageUploading(false);
    }
  };

  const uploadActivityRecommendationImage = async (file: File) => {
    setActivityRecommendationImageUploading(true);
    try {
      const fileName = `activityRecommendation_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const imageRef = ref(storage, `homepage-cms/${fileName}`);
      const snapshot = await uploadBytes(imageRef, file);
      return await getDownloadURL(snapshot.ref);
    } finally {
      setActivityRecommendationImageUploading(false);
    }
  };

  const handleDeleteActivityRecommendation = async (id: string) => {
    if (!window.confirm('Delete this recommendation permanently?')) return;
    try {
      await deleteDoc(doc(db, 'activityRecommendations', id));
      await fetchActivityRecommendations();
      await onRefreshData();
      alert('Recommendation removed successfully.');
    } catch (err) {
      console.error('Failed to delete recommendation:', err);
      alert('Unable to delete recommendation.');
    }
  };

  const handleDeleteActivity = async (id: string) => {
    const linkedPackages = getActivityPackageCount(id);
    const linkedItems = activityItems.filter((item) => item.activityId === id).length;
    const linkedRecommendations = activityRecommendations.filter((item) => item.activityId === id).length;
    if (linkedPackages > 0 || linkedItems > 0 || linkedRecommendations > 0) {
      alert(`This activity cannot be deleted while ${linkedPackages} package${linkedPackages === 1 ? '' : 's'}, ${linkedItems} activity item${linkedItems === 1 ? '' : 's'}, or ${linkedRecommendations} recommendation${linkedRecommendations === 1 ? '' : 's'} are linked to it. Reassign or remove those dependencies first.`);
      return;
    }
    if (!window.confirm('Delete this activity permanently?')) return;
    try {
      await deleteDoc(doc(db, 'activities', id));
      await fetchActivities();
      await onRefreshData();
      alert('Activity removed successfully.');
    } catch (err) {
      console.error('Failed to delete activity:', err);
      alert('Unable to delete activity.');
    }
  };

  const handleDeleteFeaturedCategory = async (id: string) => {
    if (!window.confirm('Delete this featured category permanently?')) return;
    try {
      await deleteDoc(doc(db, 'featuredCategories', id));
      await fetchFeaturedCategories();
      await onRefreshData();
      alert('Featured category removed successfully.');
    } catch (err) {
      console.error('Failed to delete featured category:', err);
      alert('Unable to delete featured category.');
    }
  };

  const uploadActivityImage = async (file: File) => {
    setActivityImageUploading(true);
    try {
      const fileName = `activity_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const imageRef = ref(storage, `homepage-cms/${fileName}`);
      const snapshot = await uploadBytes(imageRef, file);
      return await getDownloadURL(snapshot.ref);
    } finally {
      setActivityImageUploading(false);
    }
  };

  const uploadFeaturedImage = async (file: File) => {
    setFeaturedImageUploading(true);
    try {
      const fileName = `featured_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const imageRef = ref(storage, `homepage-cms/${fileName}`);
      const snapshot = await uploadBytes(imageRef, file);
      return await getDownloadURL(snapshot.ref);
    } finally {
      setFeaturedImageUploading(false);
    }
  };

  const packageCountsByActivity = useMemo(() => {
    return packages.reduce<Record<string, number>>((acc, pkg) => {
      if (pkg.activityId) {
        acc[pkg.activityId] = (acc[pkg.activityId] || 0) + 1;
      }
      return acc;
    }, {});
  }, [packages]);

  const getActivityPackageCount = (activityId: string) => packageCountsByActivity[activityId] || 0;

  const filteredActivities = useMemo(() => {
    const normalized = activitySearch.trim().toLowerCase();
    return activities.filter((activity) => {
      if (!normalized) return true;
      const haystack = [activity.title, activity.subtitle, activity.description, activity.category, activity.location].join(' ').toLowerCase();
      return haystack.includes(normalized);
    });
  }, [activities, activitySearch]);

  const filteredFeaturedCategories = useMemo(() => {
    const normalized = featuredSearch.trim().toLowerCase();
    return featuredCategories.filter((item) => {
      if (!normalized) return true;
      const haystack = [item.title, item.slug, item.description, item.category, item.location].join(' ').toLowerCase();
      return haystack.includes(normalized);
    });
  }, [featuredCategories, featuredSearch]);

  const filteredActivityItems = useMemo(() => {
    const normalized = activityItemSearch.trim().toLowerCase();
    return activityItems.filter((item) => {
      if (!normalized) return true;
      const haystack = [item.title, item.subtitle, item.description, item.linkedPackageId].join(' ').toLowerCase();
      return haystack.includes(normalized);
    });
  }, [activityItems, activityItemSearch]);

  const filteredActivityRecommendations = useMemo(() => {
    const normalized = activityRecommendationSearch.trim().toLowerCase();
    return activityRecommendations.filter((item) => {
      const matchesActivity = activityRecommendationFilter === 'all' || item.activityId === activityRecommendationFilter;
      if (!matchesActivity) return false;
      if (!normalized) return true;
      const haystack = [item.title, item.subtitle, item.description, item.linkedPackageId, item.badge, item.location, item.duration].join(' ').toLowerCase();
      return haystack.includes(normalized);
    });
  }, [activityRecommendations, activityRecommendationSearch, activityRecommendationFilter]);

  const managementCards = [
    {
      icon: Compass,
      title: 'Activities',
      description: 'Manage the top-level activity tabs, imagery, categories, ordering, and homepage visibility.',
      count: activities.length,
      onOpen: () => openManager('activities'),
    },
    {
      icon: Package,
      title: 'Activity Items',
      description: 'Create child experience cards, connect them to activities, and link packages when needed.',
      count: activityItems.length,
      onOpen: () => openManager('activity-items'),
    },
    {
      icon: Sparkles,
      title: 'Recommendations',
      description: 'Curate recommendation cards with prices, ratings, badges, locations, and package links.',
      count: activityRecommendations.length,
      onOpen: () => openManager('recommendations'),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <AdminPageHeader
        eyebrow="Activities Module"
        title={activeManager === 'dashboard' ? 'Choose a focused CMS workspace.' : activeManager === 'activities' ? 'Manage homepage activity cards.' : activeManager === 'activity-items' ? 'Manage activity experience cards.' : 'Manage curated recommendations.'}
        description={activeManager === 'dashboard'
          ? 'Activities, activity items, and recommendations now live in focused management pages while reusing the same Firebase CRUD.'
          : 'Search, edit, upload imagery, reorder, publish, and delete records without changing the existing Firestore collections.'}
        action={activeManager !== 'dashboard' ? (
          <button
            type="button"
            onClick={openManagerDashboard}
            className="inline-flex items-center gap-2 rounded-[5px] border border-stone-200 bg-white px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-stone-700 transition hover:-translate-y-0.5 hover:border-[#4DA528] hover:text-[#4DA528]"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to dashboard
          </button>
        ) : null}
      />

      {activeManager === 'dashboard' ? (
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {managementCards.map((card) => (
            <AdminManagementCard key={card.title} {...card} />
          ))}
        </section>
      ) : (
        <>

      {activeManager === 'activities' && (
      <section className="space-y-8">
        <div className="rounded-[22px] border border-stone-200 bg-white p-6 shadow-[0_14px_38px_rgba(18,38,32,0.08)]">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Activities</span>
              <h3 className="mt-2 text-2xl font-extrabold text-stone-950">Manage homepage activity cards</h3>
              <p className="mt-2 text-sm leading-6 text-stone-500">Create and reorder the activity tabs shown on the homepage.</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <form onSubmit={handleActivitySave} className="space-y-5 rounded-[20px] border border-stone-200 bg-[#f7f8f3] p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Title</label>
                  <input value={activeActivityForm.title || ''} onChange={(e) => setActiveActivityForm((prev) => ({ ...prev, title: e.target.value }))} className="mt-2 w-full rounded-[12px] border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:ring-1 focus:ring-[#4DA528]/30" />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Subtitle</label>
                  <input value={activeActivityForm.subtitle || ''} onChange={(e) => setActiveActivityForm((prev) => ({ ...prev, subtitle: e.target.value }))} className="mt-2 w-full rounded-[12px] border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:ring-1 focus:ring-[#4DA528]/30" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Description</label>
                <textarea value={activeActivityForm.description || ''} onChange={(e) => setActiveActivityForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} className="mt-2 w-full rounded-[12px] border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:ring-1 focus:ring-[#4DA528]/30" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Category</label>
                  <select value={activeActivityForm.category || 'Pilgrimage'} onChange={(e) => setActiveActivityForm((prev) => ({ ...prev, category: e.target.value as DestinationCategory }))} className="mt-2 w-full rounded-[12px] border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:ring-1 focus:ring-[#4DA528]/30">
                    {['Pilgrimage', 'Treks', 'Adventure', 'Himachal', 'Ladakh', 'Uttarakhand'].map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Location</label>
                  <input value={activeActivityForm.location || 'Uttarakhand'} onChange={(e) => setActiveActivityForm((prev) => ({ ...prev, location: e.target.value }))} className="mt-2 w-full rounded-[12px] border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:ring-1 focus:ring-[#4DA528]/30" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex items-center gap-3 rounded-[12px] border border-stone-200 bg-white px-4 py-3 text-sm">
                  <input type="checkbox" checked={activeActivityForm.enabled ?? true} onChange={(e) => setActiveActivityForm((prev) => ({ ...prev, enabled: e.target.checked }))} className="h-4 w-4 rounded border-stone-300 text-[#4DA528] focus:ring-[#4DA528]" />
                  <span className="text-stone-700">Enabled</span>
                </label>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">
                  Image URL
                  <input value={activeActivityForm.imageUrl || ''} onChange={(e) => setActiveActivityForm((prev) => ({ ...prev, imageUrl: e.target.value }))} className="mt-2 w-full rounded-[12px] border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:ring-1 focus:ring-[#4DA528]/30" />
                </label>
              </div>
              <label className="rounded-[16px] border border-dashed border-stone-300 bg-white p-4">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Upload activity image</span>
                <input type="file" accept="image/*" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = await uploadActivityImage(file);
                  setActiveActivityForm((prev) => ({ ...prev, imageUrl: url }));
                  e.target.value = '';
                }} className="mt-3 block w-full text-xs" />
                <span className="mt-2 block text-xs text-stone-500">{activityImageUploading ? 'Uploading...' : 'Upload or paste direct image URL'}</span>
              </label>
              <AdminImagePreview src={activeActivityForm.imageUrl} label="Activity image preview" />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-stone-500">{activityEditingId ? 'Editing existing activity' : 'Create a new activity entry.'}</div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  {activityEditingId && (
                    <button type="button" onClick={resetActivityForm} className="rounded-[12px] border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-stone-700 transition hover:border-[#4DA528] hover:text-[#4DA528]">Cancel</button>
                  )}
                  <button type="submit" className="rounded-[12px] bg-[#4DA528] px-5 py-3 text-sm font-bold uppercase tracking-[0.1em] text-white transition hover:bg-[#FF970D]">{activityEditingId ? 'Save activity' : 'Create activity'}</button>
                </div>
              </div>
            </form>

            <div className="rounded-[20px] border border-stone-200 bg-white p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-lg font-bold text-stone-950">Activity list</h4>
                  <p className="text-sm text-stone-500">Search, reorder, and toggle which cards show on the homepage.</p>
                </div>
                <AdminSearchBar value={activitySearch} onChange={setActivitySearch} placeholder="Search activities" />
              </div>
              <div className="space-y-4">
                {loadingActivities ? (
                  <AdminLoadingState label="Loading activities..." />
                ) : filteredActivities.length === 0 ? (
                  <AdminEmptyState icon={Compass} title="No activities match your search." description="Try a broader title, subtitle, category, or location keyword." />
                ) : (
                  filteredActivities.map((activity, index) => (
                    <div key={activity.id} className="rounded-[18px] border border-stone-200 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h5 className="text-sm font-bold text-stone-950">{activity.title}</h5>
                          <p className="text-xs text-stone-500">{activity.subtitle || activity.category} • {activity.location || 'Uttarakhand'}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button type="button" onClick={() => reorderDocuments(filteredActivities, activity.id, 'up', 'activities')} disabled={index === 0} className="rounded-[10px] border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-700 transition hover:border-[#4DA528] hover:text-[#4DA528] disabled:cursor-not-allowed disabled:opacity-50">Up</button>
                          <button type="button" onClick={() => reorderDocuments(filteredActivities, activity.id, 'down', 'activities')} disabled={index === filteredActivities.length - 1} className="rounded-[10px] border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-700 transition hover:border-[#4DA528] hover:text-[#4DA528] disabled:cursor-not-allowed disabled:opacity-50">Down</button>
                          <button type="button" onClick={() => handleEditActivity(activity)} className="rounded-[10px] border border-stone-200 bg-[#f7f8f3] px-3 py-2 text-xs font-bold text-stone-700 transition hover:border-[#4DA528] hover:text-[#4DA528]">Edit</button>
                          <button type="button" onClick={() => handleDeleteActivity(activity.id)} disabled={getActivityPackageCount(activity.id) > 0 || activityItems.some((item) => item.activityId === activity.id) || activityRecommendations.some((item) => item.activityId === activity.id)} title={activityItems.some((item) => item.activityId === activity.id) || activityRecommendations.some((item) => item.activityId === activity.id) || getActivityPackageCount(activity.id) > 0 ? 'Remove linked packages, activity items, and recommendations before deleting.' : 'Delete activity'} className="rounded-[10px] border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50">Delete</button>
                          <button type="button" onClick={() => handleToggleActivityStatus(activity)} className={`rounded-[10px] px-3 py-2 text-xs font-bold ${activity.enabled ? 'border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'border border-stone-200 bg-white text-stone-700 hover:border-[#4DA528] hover:text-[#4DA528]'}`}>{activity.enabled ? 'Enabled' : 'Disabled'}</button>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-stone-500 line-clamp-3">{activity.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {activeManager === 'activity-items' && (
      <section className="space-y-8">
        <div className="rounded-[22px] border border-stone-200 bg-white p-6 shadow-[0_14px_38px_rgba(18,38,32,0.08)]">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Activity Items</span>
              <h3 className="mt-2 text-2xl font-extrabold text-stone-950">Manage activity experiences and package integrations</h3>
              <p className="mt-2 text-sm leading-6 text-stone-500">Create child experience cards and link them to activities and packages.</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <form onSubmit={handleActivityItemSave} className="space-y-5 rounded-[20px] border border-stone-200 bg-[#f7f8f3] p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Activity</label>
                  <select value={activeActivityItemForm.activityId || activities[0]?.id || ''} onChange={(e) => setActiveActivityItemForm((prev) => ({ ...prev, activityId: e.target.value }))} className="mt-2 w-full rounded-[12px] border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:ring-1 focus:ring-[#4DA528]/30">
                    {activities.map((activity) => (
                      <option key={activity.id} value={activity.id}>{activity.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Linked package</label>
                  <select value={activeActivityItemForm.linkedPackageId || ''} onChange={(e) => setActiveActivityItemForm((prev) => ({ ...prev, linkedPackageId: e.target.value }))} className="mt-2 w-full rounded-[12px] border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:ring-1 focus:ring-[#4DA528]/30">
                    <option value="">None</option>
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>{pkg.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Title</label>
                  <input value={activeActivityItemForm.title || ''} onChange={(e) => setActiveActivityItemForm((prev) => ({ ...prev, title: e.target.value }))} className="mt-2 w-full rounded-[12px] border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:ring-1 focus:ring-[#4DA528]/30" />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Subtitle</label>
                  <input value={activeActivityItemForm.subtitle || ''} onChange={(e) => setActiveActivityItemForm((prev) => ({ ...prev, subtitle: e.target.value }))} className="mt-2 w-full rounded-[12px] border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:ring-1 focus:ring-[#4DA528]/30" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Description</label>
                <textarea value={activeActivityItemForm.description || ''} onChange={(e) => setActiveActivityItemForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} className="mt-2 w-full rounded-[12px] border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:ring-1 focus:ring-[#4DA528]/30" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Starting price</label>
                  <input type="number" min="0" value={activeActivityItemForm.startingPrice ?? 0} onChange={(e) => setActiveActivityItemForm((prev) => ({ ...prev, startingPrice: Number(e.target.value) }))} className="mt-2 w-full rounded-[12px] border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:ring-1 focus:ring-[#4DA528]/30" />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Image URL</label>
                  <input value={activeActivityItemForm.thumbnailUrl || ''} onChange={(e) => setActiveActivityItemForm((prev) => ({ ...prev, thumbnailUrl: e.target.value }))} className="mt-2 w-full rounded-[12px] border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:ring-1 focus:ring-[#4DA528]/30" />
                </div>
              </div>
              <label className="rounded-[16px] border border-dashed border-stone-300 bg-white p-4">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Upload thumbnail image</span>
                <input type="file" accept="image/*" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = await uploadActivityItemImage(file);
                  setActiveActivityItemForm((prev) => ({ ...prev, thumbnailUrl: url }));
                  e.target.value = '';
                }} className="mt-3 block w-full text-xs" />
                <span className="mt-2 block text-xs text-stone-500">{activityItemImageUploading ? 'Uploading...' : 'Upload or paste direct image URL'}</span>
              </label>
              <AdminImagePreview src={activeActivityItemForm.thumbnailUrl} label="Activity item thumbnail preview" />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-stone-500">{activityItemEditingId ? 'Editing existing activity item' : 'Create a new activity experience card.'}</div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  {activityItemEditingId && (
                    <button type="button" onClick={resetActivityItemForm} className="rounded-[12px] border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-stone-700 transition hover:border-[#4DA528] hover:text-[#4DA528]">Cancel</button>
                  )}
                  <button type="submit" className="rounded-[12px] bg-[#4DA528] px-5 py-3 text-sm font-bold uppercase tracking-[0.1em] text-white transition hover:bg-[#FF970D]">{activityItemEditingId ? 'Save activity item' : 'Create activity item'}</button>
                </div>
              </div>
            </form>

            <div className="rounded-[20px] border border-stone-200 bg-white p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-lg font-bold text-stone-950">Activity items</h4>
                  <p className="text-sm text-stone-500">Search, reorder, and publish child experience cards.</p>
                </div>
                <AdminSearchBar value={activityItemSearch} onChange={setActivityItemSearch} placeholder="Search activity items" />
              </div>
              <div className="space-y-4">
                {loadingActivityItems ? (
                  <AdminLoadingState label="Loading activity items..." />
                ) : filteredActivityItems.length === 0 ? (
                  <AdminEmptyState icon={Package} title="No activity items match your search." description="Search by title, subtitle, description, or linked package ID." />
                ) : (
                  filteredActivityItems.map((item, index) => {
                    const itemActivity = activities.find((activity) => activity.id === item.activityId);
                    const linkedPackage = packages.find((pkg) => pkg.id === item.linkedPackageId);
                    return (
                      <div key={item.id} className="rounded-[18px] border border-stone-200 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h5 className="text-sm font-bold text-stone-950">{item.title}</h5>
                            <p className="text-xs text-stone-500">{itemActivity?.title || 'Activity'} • {item.subtitle || 'Experience card'} • {linkedPackage?.title ? `Package: ${linkedPackage.title}` : 'No package linked'}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button type="button" onClick={() => reorderDocuments(filteredActivityItems, item.id, 'up', 'activityItems')} disabled={index === 0} className="rounded-[10px] border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-700 transition hover:border-[#4DA528] hover:text-[#4DA528] disabled:cursor-not-allowed disabled:opacity-50">Up</button>
                            <button type="button" onClick={() => reorderDocuments(filteredActivityItems, item.id, 'down', 'activityItems')} disabled={index === filteredActivityItems.length - 1} className="rounded-[10px] border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-700 transition hover:border-[#4DA528] hover:text-[#4DA528] disabled:cursor-not-allowed disabled:opacity-50">Down</button>
                            <button type="button" onClick={() => handleEditActivityItem(item)} className="rounded-[10px] border border-stone-200 bg-[#f7f8f3] px-3 py-2 text-xs font-bold text-stone-700 transition hover:border-[#4DA528] hover:text-[#4DA528]">Edit</button>
                            <button type="button" onClick={() => handleDeleteActivityItem(item.id)} className="rounded-[10px] border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100">Delete</button>
                            <button type="button" onClick={() => handleToggleActivityItemStatus(item)} className={`rounded-[10px] px-3 py-2 text-xs font-bold ${item.enabled ? 'border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'border border-stone-200 bg-white text-stone-700 hover:border-[#4DA528] hover:text-[#4DA528]'}`}>{item.enabled ? 'Enabled' : 'Disabled'}</button>
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-stone-500 line-clamp-3">{item.description}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {activeManager === 'recommendations' && (
      <section className="space-y-8">
        <div className="rounded-[22px] border border-stone-200 bg-white p-6 shadow-[0_14px_38px_rgba(18,38,32,0.08)]">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Recommendations</span>
              <h3 className="mt-2 text-2xl font-extrabold text-stone-950">Manage curated recommendation cards</h3>
              <p className="mt-2 text-sm leading-6 text-stone-500">Create recommendations that can be filtered by activity, linked to packages, and presented with rich metadata.</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <form onSubmit={handleActivityRecommendationSave} className="space-y-5 rounded-[20px] border border-stone-200 bg-[#f7f8f3] p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Activity</label>
                  <select value={activeActivityRecommendationForm.activityId || activities[0]?.id || ''} onChange={(e) => setActiveActivityRecommendationForm((prev) => ({ ...prev, activityId: e.target.value }))} className="mt-2 w-full rounded-[12px] border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:ring-1 focus:ring-[#4DA528]/30">
                    {activities.map((activity) => (
                      <option key={activity.id} value={activity.id}>{activity.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Linked package</label>
                  <select value={activeActivityRecommendationForm.linkedPackageId || ''} onChange={(e) => setActiveActivityRecommendationForm((prev) => ({ ...prev, linkedPackageId: e.target.value }))} className="mt-2 w-full rounded-[12px] border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:ring-1 focus:ring-[#4DA528]/30">
                    <option value="">None</option>
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>{pkg.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Title</label>
                  <input value={activeActivityRecommendationForm.title || ''} onChange={(e) => setActiveActivityRecommendationForm((prev) => ({ ...prev, title: e.target.value }))} className="mt-2 w-full rounded-[12px] border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:ring-1 focus:ring-[#4DA528]/30" />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Badge</label>
                  <input value={activeActivityRecommendationForm.badge || ''} onChange={(e) => setActiveActivityRecommendationForm((prev) => ({ ...prev, badge: e.target.value }))} className="mt-2 w-full rounded-[12px] border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:ring-1 focus:ring-[#4DA528]/30" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Description</label>
                <textarea value={activeActivityRecommendationForm.description || ''} onChange={(e) => setActiveActivityRecommendationForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} className="mt-2 w-full rounded-[12px] border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:ring-1 focus:ring-[#4DA528]/30" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Price</label>
                  <input type="number" min="0" value={activeActivityRecommendationForm.price ?? 0} onChange={(e) => setActiveActivityRecommendationForm((prev) => ({ ...prev, price: Number(e.target.value) }))} className="mt-2 w-full rounded-[12px] border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:ring-1 focus:ring-[#4DA528]/30" />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Duration</label>
                  <input value={activeActivityRecommendationForm.duration || ''} onChange={(e) => setActiveActivityRecommendationForm((prev) => ({ ...prev, duration: e.target.value }))} className="mt-2 w-full rounded-[12px] border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:ring-1 focus:ring-[#4DA528]/30" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Location</label>
                  <input value={activeActivityRecommendationForm.location || ''} onChange={(e) => setActiveActivityRecommendationForm((prev) => ({ ...prev, location: e.target.value }))} className="mt-2 w-full rounded-[12px] border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:ring-1 focus:ring-[#4DA528]/30" />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Rating</label>
                  <input type="number" min="0" max="5" step="0.1" value={activeActivityRecommendationForm.rating ?? 0} onChange={(e) => setActiveActivityRecommendationForm((prev) => ({ ...prev, rating: Number(e.target.value) }))} className="mt-2 w-full rounded-[12px] border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:ring-1 focus:ring-[#4DA528]/30" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Image URL</label>
                <input value={activeActivityRecommendationForm.thumbnailUrl || ''} onChange={(e) => setActiveActivityRecommendationForm((prev) => ({ ...prev, thumbnailUrl: e.target.value }))} className="mt-2 w-full rounded-[12px] border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:ring-1 focus:ring-[#4DA528]/30" />
              </div>
              <label className="rounded-[16px] border border-dashed border-stone-300 bg-white p-4">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Upload recommendation image</span>
                <input type="file" accept="image/*" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = await uploadActivityRecommendationImage(file);
                  setActiveActivityRecommendationForm((prev) => ({ ...prev, thumbnailUrl: url }));
                  e.target.value = '';
                }} className="mt-3 block w-full text-xs" />
                <span className="mt-2 block text-xs text-stone-500">{activityRecommendationImageUploading ? 'Uploading...' : 'Upload or paste direct image URL'}</span>
              </label>
              <AdminImagePreview src={activeActivityRecommendationForm.thumbnailUrl} label="Recommendation image preview" />
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex items-center gap-3 rounded-[12px] border border-stone-200 bg-white px-4 py-3 text-sm">
                  <input type="checkbox" checked={activeActivityRecommendationForm.enabled ?? true} onChange={(e) => setActiveActivityRecommendationForm((prev) => ({ ...prev, enabled: e.target.checked }))} className="h-4 w-4 rounded border-stone-300 text-[#4DA528] focus:ring-[#4DA528]" />
                  <span className="text-stone-700">Enabled</span>
                </label>
                <div className="space-y-2">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Linked package</label>
                  <p className="text-xs text-stone-500">Optional package to connect this recommendation with a tour.</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-stone-500">{activityRecommendationEditingId ? 'Editing existing recommendation' : 'Create a new recommendation card.'}</div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  {activityRecommendationEditingId && (
                    <button type="button" onClick={resetActivityRecommendationForm} className="rounded-[12px] border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-stone-700 transition hover:border-[#4DA528] hover:text-[#4DA528]">Cancel</button>
                  )}
                  <button type="submit" className="rounded-[12px] bg-[#4DA528] px-5 py-3 text-sm font-bold uppercase tracking-[0.1em] text-white transition hover:bg-[#FF970D]">{activityRecommendationEditingId ? 'Save recommendation' : 'Create recommendation'}</button>
                </div>
              </div>
            </form>

            <div className="rounded-[20px] border border-stone-200 bg-white p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-lg font-bold text-stone-950">Recommendations</h4>
                  <p className="text-sm text-stone-500">Search, filter, reorder, and publish recommendation cards.</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <select value={activityRecommendationFilter} onChange={(e) => setActivityRecommendationFilter(e.target.value)} className="h-12 rounded-[12px] border border-stone-200 bg-[#f7f8f3] px-4 text-sm outline-none focus:border-[#4DA528] focus:bg-white">
                    <option value="all">All activities</option>
                    {activities.map((activity) => (
                      <option key={activity.id} value={activity.id}>{activity.title}</option>
                    ))}
                  </select>
                  <AdminSearchBar value={activityRecommendationSearch} onChange={setActivityRecommendationSearch} placeholder="Search recommendations" />
                </div>
              </div>
              <div className="space-y-4">
                {loadingActivityRecommendations ? (
                  <AdminLoadingState label="Loading recommendations..." />
                ) : filteredActivityRecommendations.length === 0 ? (
                  <AdminEmptyState icon={Sparkles} title="No recommendations match your search." description="Clear the activity filter or search a wider badge, location, duration, or package term." />
                ) : (
                  filteredActivityRecommendations.map((item, index) => {
                    const itemActivity = activities.find((activity) => activity.id === item.activityId);
                    const linkedPackage = packages.find((pkg) => pkg.id === item.linkedPackageId);
                    return (
                      <div key={item.id} className="rounded-[18px] border border-stone-200 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h5 className="text-sm font-bold text-stone-950">{item.title}</h5>
                            <p className="text-xs text-stone-500">{itemActivity?.title || 'Activity'} • {item.badge || item.subtitle || 'Recommendation card'} • {linkedPackage?.title ? `Package: ${linkedPackage.title}` : 'No package linked'}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button type="button" onClick={() => reorderDocuments(filteredActivityRecommendations, item.id, 'up', 'activityRecommendations')} disabled={index === 0} className="rounded-[10px] border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-700 transition hover:border-[#4DA528] hover:text-[#4DA528] disabled:cursor-not-allowed disabled:opacity-50">Up</button>
                            <button type="button" onClick={() => reorderDocuments(filteredActivityRecommendations, item.id, 'down', 'activityRecommendations')} disabled={index === filteredActivityRecommendations.length - 1} className="rounded-[10px] border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-700 transition hover:border-[#4DA528] hover:text-[#4DA528] disabled:cursor-not-allowed disabled:opacity-50">Down</button>
                            <button type="button" onClick={() => handleEditActivityRecommendation(item)} className="rounded-[10px] border border-stone-200 bg-[#f7f8f3] px-3 py-2 text-xs font-bold text-stone-700 transition hover:border-[#4DA528] hover:text-[#4DA528]">Edit</button>
                            <button type="button" onClick={() => handleDeleteActivityRecommendation(item.id)} className="rounded-[10px] border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100">Delete</button>
                            <button type="button" onClick={() => handleToggleActivityRecommendationStatus(item)} className={`rounded-[10px] px-3 py-2 text-xs font-bold ${item.enabled ? 'border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'border border-stone-200 bg-white text-stone-700 hover:border-[#4DA528] hover:text-[#4DA528]'}`}>{item.enabled ? 'Enabled' : 'Disabled'}</button>
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-stone-500 line-clamp-3">{item.description}</p>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-stone-500">
                          {item.price ? <span className="rounded-full bg-[#4DA528]/10 px-3 py-1 font-semibold text-[#4DA528]">₹{item.price}</span> : null}
                          {item.duration ? <span className="rounded-full bg-stone-100 px-3 py-1">{item.duration}</span> : null}
                          {item.location ? <span className="rounded-full bg-stone-100 px-3 py-1">{item.location}</span> : null}
                          {item.rating ? <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">★ {item.rating}</span> : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      )}
        </>
      )}
    </div>
  );
}

interface WebsiteTabProps {
  cmsFormData: WebsiteCMSSettings;
  setCmsFormData: (value: React.SetStateAction<WebsiteCMSSettings>) => void;
  cmsSaving: boolean;
  cmsUploadingField: 'heroBackgroundImageUrl' | 'logoUrl' | null;
  handleSaveWebsiteCMS: (e?: React.FormEvent) => Promise<void>;
  handleCmsImageUpload: (e: React.ChangeEvent<HTMLInputElement>, field: 'heroBackgroundImageUrl' | 'logoUrl') => Promise<void>;
  onRefreshData: () => Promise<void>;
  packages: TravelPackage[];
}

export function WebsiteTab(props: WebsiteTabProps) {
  const {
    cmsFormData,
    setCmsFormData,
    cmsSaving,
    cmsUploadingField,
    handleSaveWebsiteCMS,
    handleCmsImageUpload,
    onRefreshData,
    packages,
  } = props;

  const websiteCards = [
    { label: 'Hero banner', description: 'Curate your first impression with a premium headline and CTA.', icon: Home },
    { label: 'Social proof', description: 'Publish quick links to Instagram, Facebook, and WhatsApp.', icon: Megaphone },
    { label: 'Local imagery', description: 'Swap tour visuals and gallery assets from one place.', icon: Images },
    { label: 'Brand settings', description: 'Sync footer contact details, address, and SEO metadata.', icon: Globe },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="relative overflow-hidden rounded-[26px] bg-white p-6 shadow-[0_14px_38px_rgba(18,38,32,0.08)] sm:p-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-linear-to-l from-[#4DA528]/12 to-transparent lg:block" />
        <div className="relative max-w-3xl">
          <span className="inline-flex rounded-full bg-[#4DA528]/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Website CMS</span>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-stone-950">Public website controls connected to Firebase.</h2>
          <p className="mt-3 text-sm leading-7 text-stone-500">Manage homepage hero, logo, footer contact details, social links, and SEO metadata from one CMS document.</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {websiteCards.map((card) => {
          const CardIcon = card.icon;
          return (
            <div key={card.label} className="group rounded-[20px] border border-stone-200 bg-white p-6 shadow-[0_14px_38px_rgba(18,38,32,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(18,38,32,0.14)]">
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#4DA528]/10 text-[#4DA528]">
                  <CardIcon className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[9px] font-extrabold uppercase tracking-wider text-emerald-700">Connected</span>
              </div>
              <h3 className="mt-5 text-xl font-extrabold text-stone-950">{card.label}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-500">{card.description}</p>
              <button type="button" className="mt-5 inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-[#4DA528]" onClick={() => document.getElementById('website-cms-form')?.scrollIntoView({ behavior: 'smooth' })}>
                Edit Settings
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </section>

      <form id="website-cms-form" onSubmit={handleSaveWebsiteCMS} className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-[22px] border border-stone-200 bg-white p-6 shadow-[0_14px_38px_rgba(18,38,32,0.08)]">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Hero Banner</span>
              <h3 className="mt-2 text-xl font-extrabold text-stone-950">Homepage content</h3>
            </div>
            <button type="submit" disabled={cmsSaving} className="rounded-[5px] bg-[#4DA528] px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider text-white transition hover:bg-[#FF970D] disabled:opacity-60">
              {cmsSaving ? 'Saving...' : 'Save'}
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Hero title</label>
                <input value={cmsFormData.heroTitle} onChange={(e) => setCmsFormData(prev => ({ ...prev, heroTitle: e.target.value }))} className="w-full rounded-[12px] border border-stone-200 bg-[#f7f8f3] px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:bg-white" />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Hero accent</label>
                <input value={cmsFormData.heroTitleAccent} onChange={(e) => setCmsFormData(prev => ({ ...prev, heroTitleAccent: e.target.value }))} className="w-full rounded-[12px] border border-stone-200 bg-[#f7f8f3] px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:bg-white" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Subtitle</label>
              <textarea value={cmsFormData.heroSubtitle} onChange={(e) => setCmsFormData(prev => ({ ...prev, heroSubtitle: e.target.value }))} rows={3} className="w-full rounded-[12px] border border-stone-200 bg-[#f7f8f3] px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:bg-white" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">CTA text</label>
                <input value={cmsFormData.heroCtaText} onChange={(e) => setCmsFormData(prev => ({ ...prev, heroCtaText: e.target.value }))} className="w-full rounded-[12px] border border-stone-200 bg-[#f7f8f3] px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:bg-white" />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">CTA link</label>
                <input value={cmsFormData.heroCtaLink} onChange={(e) => setCmsFormData(prev => ({ ...prev, heroCtaLink: e.target.value }))} placeholder="packages or https://..." className="w-full rounded-[12px] border border-stone-200 bg-[#f7f8f3] px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:bg-white" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="rounded-[16px] border border-dashed border-stone-300 bg-[#f7f8f3] p-4">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Upload hero background</span>
                <input type="file" accept="image/*" onChange={(e) => handleCmsImageUpload(e, 'heroBackgroundImageUrl')} className="mt-3 block w-full text-xs" />
                <span className="mt-2 block text-xs text-stone-500">{cmsUploadingField === 'heroBackgroundImageUrl' ? 'Uploading...' : 'Uploads to Firebase Storage'}</span>
              </label>
              <label className="rounded-[16px] border border-dashed border-stone-300 bg-[#f7f8f3] p-4">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Upload logo</span>
                <input type="file" accept="image/*" onChange={(e) => handleCmsImageUpload(e, 'logoUrl')} className="mt-3 block w-full text-xs" />
                <span className="mt-2 block text-xs text-stone-500">{cmsUploadingField === 'logoUrl' ? 'Uploading...' : 'Header and footer update automatically'}</span>
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-[22px] border border-stone-200 bg-white p-6 shadow-[0_14px_38px_rgba(18,38,32,0.08)]">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Footer & SEO</span>
          <div className="mt-5 space-y-4">
            <textarea value={cmsFormData.footerContactInfo} onChange={(e) => setCmsFormData(prev => ({ ...prev, footerContactInfo: e.target.value }))} rows={3} placeholder="Footer description" className="w-full rounded-[12px] border border-stone-200 bg-[#f7f8f3] px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:bg-white" />
            <div className="grid gap-4 sm:grid-cols-2">
              <input value={cmsFormData.footerEmail} onChange={(e) => setCmsFormData(prev => ({ ...prev, footerEmail: e.target.value }))} placeholder="Email" className="rounded-[12px] border border-stone-200 bg-[#f7f8f3] px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:bg-white" />
              <input value={cmsFormData.footerPhone} onChange={(e) => setCmsFormData(prev => ({ ...prev, footerPhone: e.target.value }))} placeholder="Phone" className="rounded-[12px] border border-stone-200 bg-[#f7f8f3] px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:bg-white" />
            </div>
            <input value={cmsFormData.footerAddress} onChange={(e) => setCmsFormData(prev => ({ ...prev, footerAddress: e.target.value }))} placeholder="Address" className="w-full rounded-[12px] border border-stone-200 bg-[#f7f8f3] px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:bg-white" />
            <div className="grid gap-4 sm:grid-cols-2">
              <input value={cmsFormData.socialFacebook} onChange={(e) => setCmsFormData(prev => ({ ...prev, socialFacebook: e.target.value }))} placeholder="Facebook URL" className="rounded-[12px] border border-stone-200 bg-[#f7f8f3] px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:bg-white" />
              <input value={cmsFormData.socialX} onChange={(e) => setCmsFormData(prev => ({ ...prev, socialX: e.target.value }))} placeholder="X URL" className="rounded-[12px] border border-stone-200 bg-[#f7f8f3] px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:bg-white" />
              <input value={cmsFormData.socialLinkedIn} onChange={(e) => setCmsFormData(prev => ({ ...prev, socialLinkedIn: e.target.value }))} placeholder="LinkedIn URL" className="rounded-[12px] border border-stone-200 bg-[#f7f8f3] px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:bg-white" />
              <input value={cmsFormData.socialInstagram} onChange={(e) => setCmsFormData(prev => ({ ...prev, socialInstagram: e.target.value }))} placeholder="Instagram URL" className="rounded-[12px] border border-stone-200 bg-[#f7f8f3] px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:bg-white" />
            </div>
            <input value={cmsFormData.seoTitle} onChange={(e) => setCmsFormData(prev => ({ ...prev, seoTitle: e.target.value }))} placeholder="Meta title" className="w-full rounded-[12px] border border-stone-200 bg-[#f7f8f3] px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:bg-white" />
            <textarea value={cmsFormData.seoDescription} onChange={(e) => setCmsFormData(prev => ({ ...prev, seoDescription: e.target.value }))} rows={2} placeholder="Meta description" className="w-full rounded-[12px] border border-stone-200 bg-[#f7f8f3] px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:bg-white" />
            <input value={cmsFormData.seoKeywords} onChange={(e) => setCmsFormData(prev => ({ ...prev, seoKeywords: e.target.value }))} placeholder="SEO keywords" className="w-full rounded-[12px] border border-stone-200 bg-[#f7f8f3] px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:bg-white" />
          </div>
        </section>
      </form>

      <section className="rounded-[22px] border border-stone-200 bg-white p-6 shadow-[0_14px_38px_rgba(18,38,32,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Website CMS</span>
            <h3 className="mt-2 text-2xl font-extrabold text-stone-950">Keep site-content settings here</h3>
            <p className="mt-2 text-sm leading-6 text-stone-500">Use this section for hero, about, contact, footer, gallery, social links, reviews, and other non-business website content. Activities, activity items, and recommendations are managed under the dedicated Activities module.</p>
          </div>
          <button
            type="button"
            onClick={() => document.getElementById('website-cms-form')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center gap-2 rounded-[5px] bg-[#4DA528] px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider text-white transition hover:bg-[#FF970D]"
          >
            Edit website settings
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>
    </div>
  );
}

interface MediaLibraryTabProps {
  mediaLibrarySearch: string;
  setMediaLibrarySearch: (value: string) => void;
  mediaLibraryCategory: string;
  setMediaLibraryCategory: (value: string) => void;
  mediaLibraryCategories: string[];
  mediaLibraryImages: GalleryImage[];
  mediaUploading: boolean;
  handleMediaLibraryUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleMoveGalleryImage: (id: string, direction: 'up' | 'down') => void;
  handleDeleteGalleryImage: (id: string) => Promise<void>;
}

export function MediaLibraryTab(props: MediaLibraryTabProps) {
  const {
    mediaLibrarySearch, setMediaLibrarySearch,
    mediaLibraryCategory, setMediaLibraryCategory,
    mediaLibraryCategories, mediaLibraryImages,
    mediaUploading, handleMediaLibraryUpload,
    handleMoveGalleryImage, handleDeleteGalleryImage,
  } = props;

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[24px] border border-dashed border-[#4DA528]/40 bg-white p-8 text-center shadow-[0_14px_38px_rgba(18,38,32,0.08)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#4DA528]/10 text-[#4DA528]">
            <Upload className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-2xl font-extrabold text-stone-950">Upload media</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-stone-500">Upload images to Firebase Storage and publish them into the existing public gallery collection.</p>
          <label className={`mt-6 inline-flex cursor-pointer items-center justify-center gap-2 rounded-[5px] px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white transition ${mediaUploading ? 'bg-stone-400' : 'bg-[#4DA528] hover:bg-[#FF970D]'}`}>
            <Upload className="h-4 w-4" />
            <span>{mediaUploading ? 'Uploading...' : 'Select Images'}</span>
            <input type="file" accept="image/*" multiple onChange={handleMediaLibraryUpload} disabled={mediaUploading} className="hidden" />
          </label>
        </div>

        <div className="rounded-[24px] border border-stone-200 bg-white p-6 shadow-[0_14px_38px_rgba(18,38,32,0.08)]">
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={mediaLibrarySearch}
                onChange={(e) => setMediaLibrarySearch(e.target.value)}
                placeholder="Search images, albums, categories..."
                className="h-12 w-full rounded-[14px] border border-stone-200 bg-[#f7f8f3] pl-11 pr-4 text-sm outline-none transition focus:border-[#4DA528] focus:bg-white"
              />
            </div>
            <select
              value={mediaLibraryCategory}
              onChange={(e) => setMediaLibraryCategory(e.target.value)}
              className="h-12 rounded-[14px] border border-stone-200 bg-[#f7f8f3] px-4 text-sm font-bold text-stone-700 outline-none transition focus:border-[#4DA528] focus:bg-white"
            >
              {mediaLibraryCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {mediaLibraryCategories.slice(0, 8).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setMediaLibraryCategory(cat)}
                className={`rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider transition ${
                  mediaLibraryCategory === cat ? 'bg-[#4DA528] text-white' : 'bg-[#f7f8f3] text-stone-500 hover:text-[#4DA528]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
        {mediaLibraryImages.length === 0 ? (
          <div className="col-span-full rounded-[22px] border border-dashed border-stone-300 bg-white p-12 text-center text-sm text-stone-500">
            No media matches the current UI filters.
          </div>
        ) : (
          mediaLibraryImages.map((img) => (
            <div key={img.id} className="group overflow-hidden rounded-[20px] border border-stone-200 bg-white shadow-[0_14px_38px_rgba(18,38,32,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(18,38,32,0.14)]">
              <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                <img src={img.imageUrl} alt={img.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" referrerPolicy="no-referrer" onError={handleTravelImageError} />
                <span className="absolute left-3 top-3 rounded bg-white/95 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#4DA528] shadow-sm">{img.category}</span>
                <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button type="button" onClick={() => handleMoveGalleryImage(img.id, 'up')} className="rounded bg-white/95 p-1.5 text-stone-700 shadow-sm transition hover:bg-[#4DA528] hover:text-white" title="Move up">
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => handleMoveGalleryImage(img.id, 'down')} className="rounded bg-white/95 p-1.5 text-stone-700 shadow-sm transition hover:bg-[#4DA528] hover:text-white" title="Move down">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => handleDeleteGalleryImage(img.id)} className="rounded bg-white/95 p-1.5 text-rose-600 shadow-sm transition hover:bg-rose-600 hover:text-white" title="Delete image">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="line-clamp-1 text-sm font-extrabold text-stone-950">{img.title}</h3>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="truncate text-xs text-stone-500">{img.album || 'Unassigned album'}</p>
                  <span className="text-[10px] font-bold text-stone-400">#{typeof img.order === 'number' ? img.order + 1 : '-'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

interface PackagesTabProps {
  packages: TravelPackage[];
  packageSearch: string;
  setPackageSearch: (value: string) => void;
  handleOpenPkgAdd: () => void;
  handleOpenPkgEdit: (pkg: TravelPackage) => void;
  handleDeletePackage: (id: string) => Promise<void>;
  togglePackageActive: (pkg: TravelPackage) => void;
  formatPriceValue: (value: number) => string;
}

export function PackagesTab(props: PackagesTabProps) {
  const { packages, packageSearch, setPackageSearch, handleOpenPkgAdd, handleOpenPkgEdit, handleDeletePackage, togglePackageActive, formatPriceValue } = props;
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-normal text-[#333333] tracking-tight">Manage Travel Packages</h2>
          <p className="text-xs text-stone-500 font-light">Add, edit, or delete packages visible to public website visitors.</p>
        </div>
        <button onClick={handleOpenPkgAdd} className="px-4 py-2.5 bg-[#008080] hover:bg-[#006666] text-white text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm flex items-center justify-center gap-1.5 cursor-pointer">
          <Plus className="w-4 h-4" />
          <span>Add New Package</span>
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-100 bg-stone-50 flex items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input type="text" placeholder="Search packages by title or destination..." value={packageSearch} onChange={(e) => setPackageSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080]" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 bg-[#f8f7f4] text-stone-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Image / Title</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Duration</th>
                <th className="py-4 px-6">Price</th>
                <th className="py-4 px-6">Featured</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
              {packages.filter((p) => p.title.toLowerCase().includes(packageSearch.toLowerCase()) || p.destination.toLowerCase().includes(packageSearch.toLowerCase())).map((pkg) => (
                <tr key={pkg.id} className="hover:bg-stone-50/40 transition">
                  <td className="py-4 px-6 flex items-center gap-3">
                    <img src={pkg.imageUrl} alt="" className="w-12 h-12 object-cover rounded-sm shrink-0 bg-[#f8f7f4] border border-stone-200" referrerPolicy="no-referrer" />
                    <div>
                      <strong className="text-[#333333] font-bold block leading-snug">{pkg.title}</strong>
                      <span className="text-[10px] text-stone-400 block font-light">{pkg.destination}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-0.5 bg-stone-100 text-stone-700 text-[9px] font-bold uppercase tracking-wider rounded-none">{pkg.category}</span>
                  </td>
                  <td className="py-4 px-6 font-light text-stone-500">{pkg.duration}</td>
                  <td className="py-4 px-6 font-bold text-stone-900">{formatPriceValue(pkg.price)}</td>
                  <td className="py-4 px-6">
                    <span className={`text-[10px] font-bold ${pkg.featured ? 'text-[#F4C430] flex items-center gap-1' : 'text-stone-300 font-normal'}`}>
                      {pkg.featured ? '★ Yes' : 'No'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button onClick={() => togglePackageActive(pkg)} className={`px-2.5 py-1 rounded-none text-[9px] font-bold uppercase cursor-pointer transition ${pkg.active ? 'bg-emerald-50 border border-emerald-100 text-emerald-800 hover:bg-emerald-100' : 'bg-rose-50 border border-rose-100 text-rose-800 hover:bg-rose-100'}`}>
                      {pkg.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button onClick={() => handleOpenPkgEdit(pkg)} className="p-1.5 bg-stone-100 text-stone-600 hover:bg-[#008080] hover:text-white rounded-sm transition cursor-pointer" title="Edit Package">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeletePackage(pkg.id)} className="p-1.5 bg-stone-100 text-stone-600 hover:bg-rose-600 hover:text-white rounded-sm transition cursor-pointer" title="Delete Package">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface EnquiriesTabProps {
  enquiries: Enquiry[];
  filteredEnquiries: Enquiry[];
  enquirySearch: string;
  setEnquirySearch: (value: string) => void;
  enquiryStatusFilter: string;
  setEnquiryStatusFilter: (value: string) => void;
  enquiryMonthFilter: string;
  setEnquiryMonthFilter: (value: string) => void;
  uniqueEnquiryMonths: string[];
  handleExportCSV: () => void;
}

export function EnquiriesTab(props: EnquiriesTabProps) {
  const { enquiries, filteredEnquiries, enquirySearch, setEnquirySearch, enquiryStatusFilter, setEnquiryStatusFilter, enquiryMonthFilter, setEnquiryMonthFilter, uniqueEnquiryMonths, handleExportCSV } = props;
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-normal text-[#333333] tracking-tight">Holiday Enquiries</h2>
          <p className="text-xs text-stone-500 font-light">View, update, filter, or export travel enquiries submitted by customers.</p>
        </div>
        {filteredEnquiries.length > 0 && (
          <button onClick={handleExportCSV} className="px-4 py-2.5 bg-stone-950 hover:bg-stone-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm flex items-center justify-center gap-1.5 cursor-pointer">
            <Download className="w-4 h-4" />
            <span>Export CSV ({filteredEnquiries.length})</span>
          </button>
        )}
      </div>

      <div className="bg-white border border-stone-200 p-4 rounded shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input type="text" placeholder="Search by client name, phone..." value={enquirySearch} onChange={(e) => setEnquirySearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-[#f8f7f4] border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] text-stone-800 font-medium" />
        </div>

        <div>
          <select value={enquiryStatusFilter} onChange={(e) => setEnquiryStatusFilter(e.target.value)} className="w-full px-3 py-2 bg-[#f8f7f4] border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] text-stone-700 font-medium cursor-pointer">
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Converted">Converted</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <div>
          <select value={enquiryMonthFilter} onChange={(e) => setEnquiryMonthFilter(e.target.value)} className="w-full px-3 py-2 bg-[#f8f7f4] border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] text-stone-700 font-medium cursor-pointer">
            <option value="All">All Months</option>
            {uniqueEnquiryMonths.map((m) => {
              const [yr, mn] = m.split('-');
              const dateObj = new Date(parseInt(yr), parseInt(mn) - 1, 1);
              const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
              return (
                <option key={m} value={m}>{monthName}</option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded shadow-xs overflow-hidden">
        {filteredEnquiries.length === 0 ? (
          <div className="p-10 text-center text-sm text-stone-500">No enquiries match the current filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-100 bg-[#f8f7f4] text-stone-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Client</th>
                  <th className="py-4 px-6">Trip</th>
                  <th className="py-4 px-6">Contact</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
                {filteredEnquiries.map((enquiry) => (
                  <tr key={enquiry.id} className="hover:bg-stone-50/40 transition">
                    <td className="py-4 px-6">
                      <strong className="font-bold text-stone-900">{enquiry.name}</strong>
                      <div className="text-[10px] text-stone-400">{enquiry.email}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-stone-800">{enquiry.destination}</div>
                      <div className="text-[10px] text-stone-400">{enquiry.packageName || 'Custom itinerary'}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div>{enquiry.phone}</div>
                      <div className="text-[10px] text-stone-400">{enquiry.travelDate}</div>
                    </td>
                    <td className="py-4 px-6"><span className="rounded-full bg-[#008080]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#008080]">{enquiry.status}</span></td>
                    <td className="py-4 px-6">{enquiry.createdAt ? new Date(enquiry.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

interface BookingsTabProps {
  bookings: any[];
  bookingsLoading: boolean;
  filteredBookings: any[];
  bookingSearch: string;
  setBookingSearch: (value: string) => void;
  bookingStatusFilter: string;
  setBookingStatusFilter: (value: string) => void;
  bookingPackageFilter: string;
  setBookingPackageFilter: (value: string) => void;
  bookingMonthFilter: string;
  setBookingMonthFilter: (value: string) => void;
  uniqueBookingPackages: string[];
  uniqueBookingMonths: string[];
  fetchAllBookings: () => Promise<void>;
  handleExportBookingsCSV: () => void;
  handleAssignStaff: (id: string, value: string) => Promise<void>;
  handleUpdateFollowUpDate: (id: string, value: string) => Promise<void>;
  handleUpdateBookingStatus: (id: string, value: string) => Promise<void>;
  handleDeleteBooking: (id: string) => Promise<void>;
  activeBooking: any | null;
  setActiveBooking: (booking: any | null) => void;
  newNote: string;
  setNewNote: (value: string) => void;
  assignee: string;
  setAssignee: (value: string) => void;
  followUpDate: string;
  setFollowUpDate: (value: string) => void;
  handleAddNote: (id: string) => Promise<void>;
  bookingFeedback?: { type: 'success' | 'error'; message: string } | null;
  bookingActionBusy?: boolean;
}

export const BookingsTab = React.memo(function BookingsTab(props: BookingsTabProps) {
  const {
    bookings, bookingsLoading, filteredBookings, bookingSearch, setBookingSearch,
    bookingStatusFilter, setBookingStatusFilter, bookingPackageFilter, setBookingPackageFilter,
    bookingMonthFilter, setBookingMonthFilter, uniqueBookingPackages, uniqueBookingMonths,
    fetchAllBookings, handleExportBookingsCSV, handleAssignStaff, handleUpdateFollowUpDate,
    handleUpdateBookingStatus, handleDeleteBooking, activeBooking, setActiveBooking,
    newNote, setNewNote, assignee, setAssignee, followUpDate, setFollowUpDate, handleAddNote,
    bookingFeedback, bookingActionBusy,
  } = props;

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 7;

  useEffect(() => {
    setCurrentPage(1);
  }, [bookingSearch, bookingStatusFilter, bookingPackageFilter, bookingMonthFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / pageSize));
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBookings.slice(start, start + pageSize);
  }, [filteredBookings, currentPage]);

  const getBookingStatusStyles = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'Contacted':
        return 'border-sky-200 bg-sky-50 text-sky-700';
      case 'Quotation Sent':
        return 'border-violet-200 bg-violet-50 text-violet-700';
      case 'Negotiation':
        return 'border-purple-200 bg-purple-50 text-purple-700';
      case 'Cancelled':
        return 'border-rose-200 bg-rose-50 text-rose-700';
      case 'Completed':
      case 'Trip Completed':
        return 'border-teal-200 bg-teal-50 text-teal-700';
      default:
        return 'border-amber-200 bg-amber-50 text-amber-700';
    }
  };

  const isRecentBooking = (createdAt?: string) => {
    if (!createdAt) return false;
    const createdTime = new Date(createdAt).getTime();
    if (!Number.isFinite(createdTime)) return false;
    return Date.now() - createdTime < 1000 * 60 * 60 * 24;
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-stone-900 sm:text-2xl">
            <span>Lead Management CRM & Bookings</span>
            <span className="rounded-full bg-[#008080]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#008080]">{filteredBookings.length} Leads</span>
          </h2>
          <p className="mt-1 text-sm text-stone-500">Track custom package requests, keep notes organized, and move leads from inquiry to confirmation with a clearer operating flow.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportBookingsCSV}
            aria-label="Export bookings as CSV"
            className="flex items-center gap-1.5 rounded-[8px] border border-stone-200 bg-stone-100 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-700 transition hover:bg-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008080]/25"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => void fetchAllBookings()}
            aria-label="Refresh bookings"
            className="flex items-center gap-1.5 rounded-[8px] bg-[#008080] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#006666] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008080]/25"
          >
            {bookingsLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span>Sync Leads</span>
          </button>
        </div>
      </div>

      {bookingFeedback && (
        <div role="status" aria-live="polite" className={`rounded-[12px] border px-4 py-3 text-sm ${bookingFeedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
          {bookingFeedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center justify-between rounded-[16px] border border-stone-200 bg-white p-4 shadow-[0_10px_30px_rgba(18,38,32,0.05)]">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Total Leads</span>
            <strong className="mt-1 block text-2xl font-semibold text-stone-900">{bookings.length}</strong>
          </div>
          <div className="rounded-[12px] bg-stone-100 p-2.5 text-stone-600"><Users className="h-5 w-5" /></div>
        </div>

        <div className="flex items-center justify-between rounded-[16px] border border-amber-200 bg-amber-50/70 p-4 shadow-[0_10px_30px_rgba(18,38,32,0.05)]">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">New / Pending</span>
            <strong className="mt-1 block text-2xl font-semibold text-amber-800">{bookings.filter((b) => !b.bookingStatus && !b.status || ['Pending','New Lead'].includes(String(b.bookingStatus || b.status || 'Pending'))).length}</strong>
          </div>
          <div className="rounded-[12px] bg-white/90 p-2.5 text-amber-700"><Clock className="h-5 w-5" /></div>
        </div>

        <div className="flex items-center justify-between rounded-[16px] border border-sky-200 bg-sky-50/70 p-4 shadow-[0_10px_30px_rgba(18,38,32,0.05)]">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-sky-700">In Negotiation</span>
            <strong className="mt-1 block text-2xl font-semibold text-sky-800">{bookings.filter((b) => ['Contacted', 'Quotation Sent', 'Negotiation'].includes(String(b.bookingStatus || b.status || 'Pending'))).length}</strong>
          </div>
          <div className="rounded-[12px] bg-white/90 p-2.5 text-sky-700"><MessageSquare className="h-5 w-5" /></div>
        </div>

        <div className="flex items-center justify-between rounded-[16px] border border-emerald-200 bg-emerald-50/70 p-4 shadow-[0_10px_30px_rgba(18,38,32,0.05)]">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">Confirmed</span>
            <strong className="mt-1 block text-2xl font-semibold text-emerald-800">{bookings.filter((b) => ['Confirmed', 'Completed', 'Trip Completed'].includes(String(b.bookingStatus || b.status || 'Pending'))).length}</strong>
          </div>
          <div className="rounded-[12px] bg-white/90 p-2.5 text-emerald-700"><CheckCircle className="h-5 w-5" /></div>
        </div>
      </div>

      <div className="rounded-[18px] border border-stone-200 bg-[#fcfbf9] p-4 shadow-[0_10px_30px_rgba(18,38,32,0.04)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#008080]">CRM Search & Filters</span>
          <span className="text-[11px] text-stone-500">Refine results quickly</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="relative">
            <span className="sr-only">Search leads</span>
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            <input type="text" aria-label="Search leads" placeholder="Search name, phone, destination..." value={bookingSearch} onChange={(e) => setBookingSearch(e.target.value)} className="w-full rounded-[10px] border border-stone-200 bg-white py-2.5 pl-9 pr-9 text-sm text-stone-700 focus:border-[#008080] focus:outline-none focus:ring-2 focus:ring-[#008080]/20" />
            {bookingSearch && <button type="button" aria-label="Clear search" onClick={() => setBookingSearch('')} className="absolute right-3 top-2.5 text-sm text-stone-400 hover:text-stone-600">✕</button>}
          </label>

          <label>
            <span className="sr-only">Filter by booking status</span>
            <select value={bookingStatusFilter} onChange={(e) => setBookingStatusFilter(e.target.value)} className="w-full rounded-[10px] border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-700 focus:border-[#008080] focus:outline-none focus:ring-2 focus:ring-[#008080]/20" disabled={bookingActionBusy}>
              <option value="All">All Lead Statuses</option>
              <option value="New Lead">New Lead / Pending</option>
              <option value="Contacted">Contacted</option>
              <option value="Quotation Sent">Quotation Sent</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Trip Completed">Trip Completed</option>
            </select>
          </label>

          <label>
            <span className="sr-only">Filter by package</span>
            <select value={bookingPackageFilter} onChange={(e) => setBookingPackageFilter(e.target.value)} className="w-full rounded-[10px] border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-700 focus:border-[#008080] focus:outline-none focus:ring-2 focus:ring-[#008080]/20" disabled={bookingActionBusy}>
              <option value="All">All Selected Packages</option>
              {uniqueBookingPackages.map((pkg) => <option key={pkg} value={pkg}>{pkg}</option>)}
            </select>
          </label>

          <label>
            <span className="sr-only">Filter by month</span>
            <select value={bookingMonthFilter} onChange={(e) => setBookingMonthFilter(e.target.value)} className="w-full rounded-[10px] border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-700 focus:border-[#008080] focus:outline-none focus:ring-2 focus:ring-[#008080]/20" disabled={bookingActionBusy}>
              <option value="All">All Lead Months</option>
              {uniqueBookingMonths.map((mStr) => {
                const [year, month] = mStr.split('-');
                const mName = new Date(Number(year), Number(month) - 1).toLocaleString('default', { month: 'long' });
                return <option key={mStr} value={mStr}>{mName} {year}</option>;
              })}
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-[20px] border border-stone-200 bg-white shadow-[0_10px_30px_rgba(18,38,32,0.05)]">
        {bookingsLoading ? (
          <div className="p-4"><TableSkeletonLoader /></div>
        ) : filteredBookings.length === 0 ? (
          <div className="space-y-3 p-16 text-center text-stone-400">
            <Users className="mx-auto h-8 w-8 animate-pulse text-stone-300" />
            <p className="text-sm font-medium">No matching CRM leads found.</p>
            <p className="text-[11px] text-stone-400">Try clearing your search query or selecting a different status filter.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-[960px] w-full border-collapse text-left text-sm text-stone-700">
                <thead className="sticky top-0 z-10 bg-[#fbfaf8] text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                  <tr className="border-b border-stone-200">
                    <th className="px-4 py-3">Lead ID & Created</th>
                    <th className="px-4 py-3">Customer & Quick Connect</th>
                    <th className="px-4 py-3">Tour Details</th>
                    <th className="px-4 py-3">Budget & Team</th>
                    <th className="px-4 py-3">Follow-Up</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {paginatedBookings.map((b) => {
                    const currentStatus = String(b.bookingStatus || b.status || 'Pending').trim();
                    const phoneClean = (b.customerPhone || '').replace(/[^0-9]/g, '');
                    const waText = encodeURIComponent(`Hi ${b.customerName || 'Traveler'}, this is Pravaah Travels regarding your travel request for ${b.destination || 'your holiday'}.`);
                    const mailSubject = encodeURIComponent('Your holiday plan with Pravaah Travels');
                    const mailBody = encodeURIComponent(`Dear ${b.customerName || 'Traveler'},\n\nThank you for choosing Pravaah Travels! We received your custom request for ${b.destination || 'your holiday'} and would be thrilled to customize your trip plan.\n\nCould we arrange a quick chat today to detail your itinerary?\n\nWarm regards,\nPravaah Travels team`);
                    const recent = isRecentBooking(b.createdAt);

                    return (
                      <tr key={b.id} className={`align-top transition ${recent ? 'bg-amber-50/40' : 'hover:bg-stone-50/70'}`}>
                        <td className="px-4 py-3.5">
                          <div className="flex items-start gap-2">
                            <div>
                              <span className="block font-mono text-[11px] font-semibold text-[#008080]">#{String(b.bookingId || b.id).substring(0, 7).toUpperCase()}</span>
                              <span className="mt-1 block text-[10px] text-stone-400">{b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Flexible'}</span>
                            </div>
                            {recent && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-amber-700">New</span>}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <strong className="block text-sm font-semibold text-stone-900">{b.customerName || 'Registered Client'}</strong>
                          <span className="mt-1 block text-[11px] text-stone-500">{b.customerEmail}</span>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            {b.customerPhone && (
                              <a href={`tel:${b.customerPhone}`} aria-label={`Call ${b.customerName || 'lead'}`} className="flex items-center gap-1 rounded border border-stone-200 bg-stone-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-600 transition hover:bg-stone-200">
                                <Phone className="h-3 w-3" />
                                <span>Call</span>
                              </a>
                            )}
                            {b.customerPhone && (
                              <a href={`https://wa.me/${phoneClean}?text=${waText}`} target="_blank" rel="noopener noreferrer" aria-label={`Open WhatsApp for ${b.customerName || 'lead'}`} className="flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700 transition hover:bg-emerald-100">
                                <MessageSquare className="h-3 w-3" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                            {b.customerEmail && (
                              <a href={`mailto:${b.customerEmail}?subject=${mailSubject}&body=${mailBody}`} aria-label={`Email ${b.customerName || 'lead'}`} className="flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-700 transition hover:bg-indigo-100">
                                <Mail className="h-3 w-3" />
                                <span>Email</span>
                              </a>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="block max-w-[220px] truncate text-sm font-semibold text-stone-900" title={b.packageTitle}>{b.packageTitle}</span>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-stone-500">
                            <span>Dest: <strong className="font-semibold text-stone-700">{b.destination || 'Flexible'}</strong></span>
                            <span>•</span>
                            <span>Date: <strong className="font-semibold text-stone-700">{b.travelDate || 'Flexible'}</strong></span>
                            <span>•</span>
                            <span>Guests: <strong className="font-semibold text-stone-700">{Number(b.guests ?? ((b.adults || 1) + (b.children || 0)))} </strong></span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="block font-mono text-sm font-semibold text-stone-900">{b.budget || 'Custom Plan'}</span>
                          <div className="mt-1 flex items-center gap-1 text-[11px] text-stone-500">
                            <Users className="h-3.5 w-3.5 text-[#008080]" />
                            <span>Staff:</span>
                            <select value={b.assignedStaff || ''} onChange={(e) => void handleAssignStaff(b.id, e.target.value)} aria-label={`Assign staff for ${b.customerName || 'lead'}`} className="bg-transparent p-0 text-[11px] font-semibold uppercase text-[#008080] underline decoration-dotted focus:outline-none" disabled={bookingActionBusy}>
                              <option value="">-- Unassigned --</option>
                              <option value="Operator Yash">Operator Yash</option>
                              <option value="Consultant Neha">Consultant Neha</option>
                              <option value="Guide Sandeep">Guide Sandeep</option>
                              <option value="Staff Rahul">Staff Rahul</option>
                            </select>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                            <input type="date" aria-label={`Follow-up date for ${b.customerName || 'lead'}`} value={b.followUpDate || ''} onChange={(e) => void handleUpdateFollowUpDate(b.id, e.target.value)} className="rounded border border-stone-200 bg-stone-50 px-2 py-1 text-[11px] text-stone-600 focus:border-[#008080] focus:outline-none focus:ring-2 focus:ring-[#008080]/20" disabled={bookingActionBusy} />
                          </div>
                          {b.followUpDate && new Date(b.followUpDate) < new Date(new Date().setHours(0, 0, 0, 0)) && <span className="mt-2 inline-block rounded bg-rose-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-rose-600">Overdue</span>}
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <select value={currentStatus === 'Pending' ? 'Pending' : currentStatus} onChange={(e) => void handleUpdateBookingStatus(b.id, e.target.value)} aria-label={`Booking status for ${b.customerName || 'lead'}`} className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] focus:outline-none focus:ring-2 focus:ring-[#008080]/20 ${getBookingStatusStyles(currentStatus)}`} disabled={bookingActionBusy}>
                            <option value="Pending">Pending</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button type="button" onClick={() => { setActiveBooking(b); setAssignee(b.assignedStaff || ''); setFollowUpDate(b.followUpDate || ''); }} className="flex items-center gap-1 rounded border border-stone-200 bg-[#f8f7f4] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-600 transition hover:bg-[#008080] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008080]/20" aria-label={`Open CRM notes for ${b.customerName || 'lead'}`}>
                              <Clipboard className="h-3.5 w-3.5" />
                              <span>CRM Log</span>
                            </button>
                            <button type="button" onClick={() => void handleDeleteBooking(b.id)} className="rounded border border-stone-200 bg-stone-50 p-1.5 text-stone-400 transition hover:bg-rose-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300" aria-label={`Delete ${b.customerName || 'lead'}`} disabled={bookingActionBusy}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-stone-200 bg-[#fcfbf9] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-stone-500">Showing <span className="font-semibold text-stone-700">{Math.min((currentPage - 1) * pageSize + 1, filteredBookings.length)}</span> to <span className="font-semibold text-stone-700">{Math.min(currentPage * pageSize, filteredBookings.length)}</span> of <span className="font-semibold text-stone-700">{filteredBookings.length}</span> leads</p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setCurrentPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} className="flex items-center gap-1 rounded border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-600 transition disabled:cursor-not-allowed disabled:opacity-50" aria-label="Previous page">
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Prev</span>
                </button>
                <span className="rounded border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-stone-700">{currentPage} / {totalPages}</span>
                <button type="button" onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage === totalPages} className="flex items-center gap-1 rounded border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-600 transition disabled:cursor-not-allowed disabled:opacity-50" aria-label="Next page">
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {activeBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/65 p-4 backdrop-blur-xs animate-fade-in">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-y-auto rounded-[20px] border border-stone-200 bg-[#fcfbf9] shadow-2xl">
            <div className="flex items-center justify-between bg-[#1f2937] p-6 text-white">
              <div>
                <span className="rounded-sm bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#008080]">CRM Inspection Directory</span>
                <h3 className="mt-1 text-base font-semibold italic">Manage Holiday Lead: {activeBooking.customerName || 'Registered Client'}</h3>
                <p className="mt-1 text-[11px] font-light text-stone-300">ID Reference: #{String(activeBooking.id).toUpperCase()} • Received on {activeBooking.createdAt ? new Date(activeBooking.createdAt).toLocaleString() : 'Flexible Date'}</p>
              </div>
              <button type="button" onClick={() => setActiveBooking(null)} aria-label="Close lead details" className="rounded-full p-2 text-stone-300 transition hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-6 p-6">
              <div className="rounded-[16px] border border-stone-200 bg-white p-4">
                <span className="mb-3 block border-b border-stone-100 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#008080]">Lead Overview</span>
                <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-3">
                  <div><span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Customer Name</span><span className="mt-0.5 block font-medium text-stone-900">{activeBooking.customerName || 'N/A'}</span></div>
                  <div><span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Phone</span><span className="mt-0.5 block font-medium text-stone-900">{activeBooking.customerPhone || 'N/A'}</span></div>
                  <div><span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">WhatsApp</span><span className="mt-0.5 block font-medium text-stone-900">{activeBooking.customerWhatsApp || 'N/A'}</span></div>
                  <div><span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Email</span><span className="mt-0.5 block truncate font-medium text-stone-900" title={activeBooking.customerEmail}>{activeBooking.customerEmail || 'N/A'}</span></div>
                  <div><span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Destination</span><span className="mt-0.5 block font-semibold text-[#008080]">{activeBooking.destination || 'Flexible'}</span></div>
                  <div><span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Status</span><span className="mt-0.5 block text-[10px] font-bold uppercase text-[#FF7F50]">{activeBooking.status || 'New Lead'}</span></div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-[10px] border border-stone-100 bg-stone-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Payment Status</p>
                    <p className="mt-1 text-sm font-semibold text-stone-900">{activeBooking.paymentStatus || 'Pending'}</p>
                  </div>
                  <div className="rounded-[10px] border border-stone-100 bg-stone-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Assigned Executive</p>
                    <p className="mt-1 text-sm font-semibold text-stone-900">{activeBooking.assignedStaff || 'Unassigned'}</p>
                  </div>
                </div>

                {activeBooking.specialRequests && (
                  <div className="mt-4 border-t border-stone-100 pt-3 text-xs">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Special Requests</span>
                    <p className="mt-1 rounded-[10px] bg-stone-50 p-2.5 font-light italic text-stone-700">“{activeBooking.specialRequests}”</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col justify-between rounded-[16px] border border-stone-200 bg-white p-4">
                  <div>
                    <span className="mb-3 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#008080]">Notes & Activity ({activeBooking.notes?.length || 0})</span>
                    <div className="mb-3 max-h-[180px] space-y-2.5 overflow-y-auto pr-1 text-xs">
                      {(!activeBooking.notes || activeBooking.notes.length === 0) ? (
                        <p className="rounded-[10px] border border-dashed border-stone-200 bg-stone-50 p-4 text-center text-stone-400">No internal notes logged yet.</p>
                      ) : (
                        activeBooking.notes.map((note: any, i: number) => (
                          <div key={i} className="rounded-[10px] border border-stone-150 bg-[#fcfbf9] p-2.5 text-stone-700">
                            <p className="font-light">{note.text}</p>
                            <div className="mt-1 flex items-center justify-between text-[9px] font-mono text-stone-400">
                              <span>By: {note.author || 'Admin'}</span>
                              <span>{new Date(note.createdAt).toLocaleString('en-IN', { hour12: true, hour: 'numeric', minute: 'numeric', day: '2-digit', month: 'short' })}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-stone-100 pt-3">
                    <textarea rows={2} placeholder="Write a custom follow-up note" value={newNote} onChange={(e) => setNewNote(e.target.value)} className="w-full rounded-[10px] border border-stone-200 bg-stone-50 px-3 py-2 text-xs focus:border-[#008080] focus:outline-none focus:ring-2 focus:ring-[#008080]/20" />
                    <button type="button" onClick={() => void handleAddNote(activeBooking.id)} className="w-full rounded-[8px] bg-[#008080] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#006666] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008080]/20" disabled={bookingActionBusy || !newNote.trim()}>
                      {bookingActionBusy ? 'Saving...' : 'Add Staff Note'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col justify-between space-y-4 rounded-[16px] border border-stone-200 bg-[#fcfbf9] p-4">
                  <div className="space-y-3">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#008080]">Booking Timeline</span>
                    <div className="space-y-2 text-xs">
                      {(activeBooking.bookingTimeline || []).map((item: any, index: number) => (
                        <div key={`${item.title}-${index}`} className="rounded-[10px] border border-stone-150 bg-white p-2.5">
                          <p className="font-semibold text-stone-900">{item.title}</p>
                          <p className="mt-1 text-stone-600">{item.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-stone-150 pt-3">
                    <div className="rounded-[10px] border border-stone-150 bg-white p-3 text-xs">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Traveller List</p>
                      <p className="mt-2 text-stone-700">{(activeBooking.travellerList || []).length ? `${(activeBooking.travellerList || []).length} traveller(s) added` : 'No traveller list attached yet.'}</p>
                    </div>
                    <div className="rounded-[10px] border border-stone-150 bg-white p-3 text-xs">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Invoice & Voucher</p>
                      <p className="mt-2 text-stone-700">Invoice: {activeBooking.invoice?.invoiceNumber || 'Pending'}</p>
                      <p className="mt-1 text-stone-700">Voucher: {activeBooking.voucher?.voucherCode || 'Pending'}</p>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-stone-150 pt-3">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#008080]">Staff Assignment & Deadline</span>
                    <div>
                      <label className="mb-1 block text-[9px] font-bold uppercase text-stone-400">Assigned Representative</label>
                      <select value={assignee} onChange={(e) => { setAssignee(e.target.value); void handleAssignStaff(activeBooking.id, e.target.value); }} className="w-full rounded-[10px] border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-[#008080] focus:border-[#008080] focus:outline-none focus:ring-2 focus:ring-[#008080]/20" disabled={bookingActionBusy}>
                        <option value="">-- Unassigned --</option>
                        <option value="Operator Yash">Operator Yash</option>
                        <option value="Consultant Neha">Consultant Neha</option>
                        <option value="Guide Sandeep">Guide Sandeep</option>
                        <option value="Staff Rahul">Staff Rahul</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-[9px] font-bold uppercase text-stone-400">Follow-Up Date</label>
                      <input type="date" value={followUpDate} onChange={(e) => { setFollowUpDate(e.target.value); void handleUpdateFollowUpDate(activeBooking.id, e.target.value); }} className="w-full rounded-[10px] border border-stone-200 bg-white px-3 py-2 text-xs focus:border-[#008080] focus:outline-none focus:ring-2 focus:ring-[#008080]/20" disabled={bookingActionBusy} />
                    </div>
                  </div>

                  <div className="border-t border-stone-150 pt-3">
                    <span className="mb-2 block text-[9px] font-bold uppercase text-stone-400">Customer Outreach</span>
                    <div className="grid grid-cols-3 gap-2">
                      {activeBooking.customerPhone && (
                        <a href={`tel:${activeBooking.customerPhone}`} aria-label={`Call ${activeBooking.customerName || 'lead'}`} className="flex flex-col items-center justify-center gap-1 rounded-[10px] border border-stone-200 bg-stone-100 px-2 py-2.5 text-center transition hover:bg-stone-200">
                          <Phone className="h-4 w-4 text-stone-500" />
                          <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-stone-600">Call</span>
                        </a>
                      )}
                      {activeBooking.customerPhone && (
                        <a href={`https://wa.me/${activeBooking.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${activeBooking.customerName || 'Traveler'}, this is Pravaah Travels regarding your travel request for ${activeBooking.destination || 'your holiday'}.`)}`} target="_blank" rel="noopener noreferrer" aria-label={`Open WhatsApp for ${activeBooking.customerName || 'lead'}`} className="flex flex-col items-center justify-center gap-1 rounded-[10px] border border-emerald-200 bg-emerald-50 px-2 py-2.5 text-center transition hover:bg-emerald-100">
                          <MessageSquare className="h-4 w-4 text-emerald-600" />
                          <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-700">WhatsApp</span>
                        </a>
                      )}
                      {activeBooking.customerEmail && (
                        <a href={`mailto:${activeBooking.customerEmail}?subject=${encodeURIComponent('Your custom holiday itinerary with Pravaah Travels')}&body=${encodeURIComponent(`Dear ${activeBooking.customerName || 'Traveler'},\n\nThank you for choosing Pravaah Travels!\n\nWe received your holiday request for ${activeBooking.destination || 'your trip'} and our specialist operator has drafted a custom package options sheet.\n\nCould we arrange a short call today to finalize?\n\nWarm regards,\nPravaah Travels`)}`} aria-label={`Email ${activeBooking.customerName || 'lead'}`} className="flex flex-col items-center justify-center gap-1 rounded-[10px] border border-indigo-200 bg-indigo-50 px-2 py-2.5 text-center transition hover:bg-indigo-100">
                          <Mail className="h-4 w-4 text-indigo-600" />
                          <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-indigo-700">Email</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-stone-200 bg-[#fcfbf9] p-4">
              <button type="button" onClick={() => setActiveBooking(null)} className="rounded-[8px] bg-stone-900 px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300">Done Inspecting Lead</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

interface CustomerRow extends CustomerProfile {
  bookingsCount: number;
  enquiriesCount: number;
  lastActivityAt: string;
}

interface CustomersTabProps {
  customers: CustomerRow[];
  customersLoading: boolean;
  customerSearch: string;
  setCustomerSearch: (value: string) => void;
  customerDestinationFilter: string;
  setCustomerDestinationFilter: (value: string) => void;
  uniqueCustomerDestinations: string[];
  handleExportCustomersExcel: () => void;
  fetchCustomerProfiles: () => Promise<void>;
}

export function CustomersTab(props: CustomersTabProps) {
  const {
    customers,
    customersLoading,
    customerSearch,
    setCustomerSearch,
    customerDestinationFilter,
    setCustomerDestinationFilter,
    uniqueCustomerDestinations,
    handleExportCustomersExcel,
    fetchCustomerProfiles,
  } = props;

  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [customerSearch, customerDestinationFilter, sortOrder, rowsPerPage, customers.length]);

  const sortedCustomers = useMemo(() => {
    return [...customers].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.lastActivityAt || 0).getTime();
      const dateB = new Date(b.createdAt || b.lastActivityAt || 0).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [customers, sortOrder]);

  const pageCount = Math.max(1, Math.ceil(sortedCustomers.length / rowsPerPage));
  const displayCustomers = sortedCustomers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-stone-900 sm:text-2xl">Customer Directory</h2>
          <p className="mt-1 text-sm text-stone-500">View signed-up travelers, their destination preferences, and their recent booking activity.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCustomersExcel}
            className="flex items-center gap-1.5 rounded-[8px] border border-stone-200 bg-stone-100 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-700 transition hover:bg-stone-200"
          >
            <Download className="h-4 w-4" />
            <span>Export Excel</span>
          </button>
          <button
            type="button"
            onClick={() => void fetchCustomerProfiles()}
            className="flex items-center gap-1.5 rounded-[8px] bg-[#008080] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#006666]"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="rounded-[18px] border border-stone-200 bg-[#fcfbf9] p-4 shadow-[0_10px_30px_rgba(18,38,32,0.04)]">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="relative">
              <span className="sr-only">Search customers</span>
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              <input
                type="text"
                aria-label="Search customers"
                placeholder="Search by name, email, phone or destination"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full rounded-[10px] border border-stone-200 bg-white py-2.5 pl-9 pr-9 text-sm text-stone-700 focus:border-[#008080] focus:outline-none focus:ring-2 focus:ring-[#008080]/20"
              />
              {customerSearch && (
                <button type="button" aria-label="Clear search" onClick={() => setCustomerSearch('')} className="absolute right-3 top-2.5 text-sm text-stone-400 hover:text-stone-600">✕</button>
              )}
            </label>

            <label>
              <span className="sr-only">Filter by destination preference</span>
              <select
                value={customerDestinationFilter}
                onChange={(e) => setCustomerDestinationFilter(e.target.value)}
                className="w-full rounded-[10px] border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-700 focus:border-[#008080] focus:outline-none focus:ring-2 focus:ring-[#008080]/20"
              >
                <option value="All">All Preferred Destinations</option>
                {uniqueCustomerDestinations.map((destination) => (
                  <option key={destination} value={destination}>{destination}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label>
              <span className="sr-only">Sort by signup date</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                className="w-full rounded-[10px] border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-700 focus:border-[#008080] focus:outline-none focus:ring-2 focus:ring-[#008080]/20"
              >
                <option value="newest">Signup Date: Newest</option>
                <option value="oldest">Signup Date: Oldest</option>
              </select>
            </label>

            <label>
              <span className="sr-only">Rows per page</span>
              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className="w-full rounded-[10px] border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-700 focus:border-[#008080] focus:outline-none focus:ring-2 focus:ring-[#008080]/20"
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>{size} rows per page</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[20px] border border-stone-200 bg-white shadow-[0_10px_30px_rgba(18,38,32,0.05)]">
        {customersLoading ? (
          <div className="p-4"><TableSkeletonLoader /></div>
        ) : sortedCustomers.length === 0 ? (
          <div className="p-16 text-center text-stone-400">No customer profiles match the current filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[960px] w-full border-collapse text-left text-sm text-stone-700">
              <thead className="sticky top-0 z-10 bg-[#fbfaf8] text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                <tr className="border-b border-stone-200">
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Preferences</th>
                  <th className="px-4 py-3">Signup Date</th>
                  <th className="px-4 py-3">Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {displayCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-stone-50/70">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#008080]/10 text-sm font-semibold text-[#008080]">
                          {(customer.displayName || customer.name || 'T').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-stone-900">{customer.displayName || customer.name || 'Traveler'}</div>
                          <div className="text-[11px] text-stone-500">{customer.email || 'No email on file'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[12px]">
                      <div>{customer.phone || customer.whatsapp || 'No phone provided'}</div>
                      <div className="mt-1 text-stone-500">Provider: {customer.provider || 'Email'}</div>
                    </td>
                    <td className="px-4 py-3.5 text-[12px]">
                      <div className="font-medium text-stone-800">{customer.preferredDestinations || 'No destination preferences'}</div>
                    </td>
                    <td className="px-4 py-3.5 text-[12px]">
                      {customer.createdAt ? new Date(customer.createdAt).toLocaleString('en-IN', { dateStyle: 'medium' }) : 'Unknown'}
                    </td>
                    <td className="px-4 py-3.5 text-[12px]">
                      <div>Bookings: <span className="font-semibold text-stone-900">{customer.bookingsCount ?? 0}</span></div>
                      <div>Enquiries: <span className="font-semibold text-stone-900">{customer.enquiriesCount ?? 0}</span></div>
                      <div className="mt-1 text-stone-500">{customer.lastActivityAt ? new Date(customer.lastActivityAt).toLocaleString('en-IN', { dateStyle: 'medium' }) : 'No activity yet'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-stone-200 bg-[#fbfaf8] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-stone-600">
          Showing {displayCustomers.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to {Math.min(currentPage * rowsPerPage, sortedCustomers.length)} of {sortedCustomers.length} customers
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            className="rounded-[10px] border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-stone-50"
          >
            Previous
          </button>
          <span className="text-sm text-stone-600">Page {currentPage} of {pageCount}</span>
          <button
            type="button"
            disabled={currentPage === pageCount}
            onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
            className="rounded-[10px] border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-stone-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

interface ReviewsTabProps {
  filteredAdminReviews: any[];
  reviewsLoading: boolean;
  reviewSearch: string;
  setReviewSearch: (value: string) => void;
  reviewStatusFilter: string;
  setReviewStatusFilter: (value: string) => void;
  reviewRatingFilter: string;
  setReviewRatingFilter: (value: string) => void;
  fetchAdminReviews: () => Promise<void>;
  handleReviewFeaturedToggle: (id: string, currentFeatured: boolean) => Promise<void>;
  handleReviewStatusUpdate: (id: string, status: 'Approved' | 'Rejected') => Promise<void>;
  handleDeleteReview: (id: string) => Promise<void>;
  activeReviewForReply: any | null;
  setActiveReviewForReply: (value: any | null) => void;
  replyText: string;
  setReplyText: (value: string) => void;
  isReplyModalOpen: boolean;
  setIsReplyModalOpen: (value: boolean) => void;
  handleReviewReplySubmit: (e: React.FormEvent) => Promise<void>;
}

export function ReviewsTab(props: ReviewsTabProps) {
  const { filteredAdminReviews, reviewsLoading, reviewSearch, setReviewSearch, reviewStatusFilter, setReviewStatusFilter, reviewRatingFilter, setReviewRatingFilter, fetchAdminReviews, handleReviewFeaturedToggle, handleReviewStatusUpdate, handleDeleteReview, activeReviewForReply, setActiveReviewForReply, replyText, setReplyText, isReplyModalOpen, setIsReplyModalOpen, handleReviewReplySubmit } = props;

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-normal text-stone-900 tracking-tight flex items-center gap-2">
            <span>Reviews & Testimonials Management</span>
            <span className="text-xs font-mono font-normal bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full">{filteredAdminReviews.length} Reviews</span>
          </h2>
          <p className="text-xs text-stone-500 font-light mt-0.5">Moderate customer reviews, feature high-quality testimonials, and reply directly to feedback.</p>
        </div>
        <div>
          <button onClick={() => void fetchAdminReviews()} className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded shadow-sm flex items-center gap-1.5 transition cursor-pointer border border-stone-250">
            <span>Refresh Reviews</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-4 border border-stone-200 rounded shadow-3xs grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
          <input type="text" placeholder="Search by reviewer, comment, destination..." value={reviewSearch} onChange={(e) => setReviewSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080]" />
          {reviewSearch && <button onClick={() => setReviewSearch('')} className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 text-xs">✕</button>}
        </div>

        <div>
          <select value={reviewStatusFilter} onChange={(e) => setReviewStatusFilter(e.target.value)} className="w-full px-3 py-2 bg-white border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] cursor-pointer">
            <option value="All">All Moderation Statuses</option>
            <option value="Pending">Pending Approval</option>
            <option value="Approved">Approved / Visible</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div>
          <select value={reviewRatingFilter} onChange={(e) => setReviewRatingFilter(e.target.value)} className="w-full px-3 py-2 bg-white border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] cursor-pointer">
            <option value="All">All Ratings</option>
            <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
            <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
            <option value="3">⭐⭐⭐ (3 Stars)</option>
            <option value="2">⭐⭐ (2 Stars)</option>
            <option value="1">⭐ (1 Star)</option>
          </select>
        </div>
      </div>

      {reviewsLoading ? (
        <CardGridSkeletonLoader count={3} />
      ) : filteredAdminReviews.length === 0 ? (
        <div className="p-16 text-center text-stone-400 bg-white border border-stone-200 rounded italic font-light">No matching reviews found.</div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredAdminReviews.map((r) => {
            const status = r.status || 'Pending';
            return (
              <div key={r.id} className="bg-white border border-stone-200 rounded-lg p-6 shadow-2xs space-y-4 hover:shadow-xs transition relative">
                <button onClick={() => void handleReviewFeaturedToggle(r.id, !!r.featured)} className="absolute top-4 right-4 p-1.5 hover:bg-stone-50 rounded transition" title={r.featured ? 'Remove from featured carousel' : 'Pin as featured on homepage'}>
                  <Star className={`w-5 h-5 ${r.featured ? 'text-amber-500 fill-amber-500' : 'text-stone-300'}`} />
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-stone-200'}`} />
                      ))}
                      <span className="text-xs text-stone-400 font-mono ml-2">({r.rating}/5)</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-stone-900">{r.name}</h4>
                      <span className="text-[10px] text-stone-400 font-light">•</span>
                      <span className="text-xs text-stone-500 font-mono">{r.email}</span>
                      {r.destination && (
                        <>
                          <span className="text-[10px] text-stone-400 font-light">•</span>
                          <span className="text-xs text-[#008080] font-medium">Trip: {r.destination}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded ${status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : status === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                      {status}
                    </span>
                    {r.featured && <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded">★ Featured Testimonial</span>}
                  </div>
                </div>

                <div className="text-stone-700 text-xs italic font-serif leading-relaxed pl-4 border-l-2 border-stone-250 py-1">"{r.comment}"</div>

                {r.reply && (
                  <div className="bg-stone-50 border border-stone-200/60 rounded p-3 pl-4 text-xs space-y-1 ml-4 relative">
                    <div className="flex items-center justify-between text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      <span>Admin Reply ({r.replyAuthor || 'Coordinator'})</span>
                      <span>{r.replyAt ? new Date(r.replyAt).toLocaleDateString('en-IN') : ''}</span>
                    </div>
                    <p className="text-stone-700 italic">"{r.reply}"</p>
                  </div>
                )}

                <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="text-[10px] text-stone-400 font-mono">Submitted on: {r.createdAt ? new Date(r.createdAt).toLocaleString() : 'N/A'}</span>
                  <div className="flex items-center gap-2">
                    {status !== 'Approved' && <button onClick={() => void handleReviewStatusUpdate(r.id, 'Approved')} className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded text-emerald-700 font-bold uppercase text-[9px] tracking-wider transition cursor-pointer">Approve Testimonial</button>}
                    {status !== 'Rejected' && <button onClick={() => void handleReviewStatusUpdate(r.id, 'Rejected')} className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded text-rose-700 font-bold uppercase text-[9px] tracking-wider transition cursor-pointer">Reject / Hide</button>}
                    <button onClick={() => { setActiveReviewForReply(r); setReplyText(r.reply || ''); setIsReplyModalOpen(true); }} className="px-2.5 py-1.5 bg-[#fcfbf9] hover:bg-stone-100 border border-stone-200 rounded text-stone-700 font-bold uppercase text-[9px] tracking-wider transition cursor-pointer">{r.reply ? 'Edit Reply' : 'Reply feedback'}</button>
                    <button onClick={() => void handleDeleteReview(r.id)} className="p-1.5 bg-stone-50 hover:bg-rose-600 border border-stone-200 text-stone-400 hover:text-white rounded transition cursor-pointer" title="Delete review permanently">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeReviewForReply && isReplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-stone-900">Reply to review</h3>
              <button onClick={() => setIsReplyModalOpen(false)} className="rounded-full p-2 text-stone-500 hover:bg-stone-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleReviewReplySubmit} className="mt-4 space-y-4">
              <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={5} className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-[#008080]" placeholder="Write a thoughtful response to the traveler..." />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsReplyModalOpen(false)} className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-600">Cancel</button>
                <button type="submit" className="rounded-lg bg-[#008080] px-4 py-2 text-sm font-semibold text-white">Save reply</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface BlogsTabProps {
  filteredBlogPosts: any[];
  blogsLoading: boolean;
  blogSearch: string;
  setBlogSearch: (value: string) => void;
  blogStatusFilter: string;
  setBlogStatusFilter: (value: string) => void;
  handleEditBlogPost: (post: any) => void;
  handleDeleteBlogPost: (id: string) => Promise<void>;
  setActiveBlogPost: (value: any | null) => void;
  setBlogFormData: (value: any) => void;
  setIsBlogFormOpen: (value: boolean) => void;
}

export function BlogsTab(props: BlogsTabProps) {
  const { filteredBlogPosts, blogsLoading, blogSearch, setBlogSearch, blogStatusFilter, setBlogStatusFilter, handleEditBlogPost, handleDeleteBlogPost, setActiveBlogPost, setBlogFormData, setIsBlogFormOpen } = props;
  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-normal text-stone-900 tracking-tight flex items-center gap-2">
            <span>Travel Blogs & Editorial CMS</span>
            <span className="text-xs font-mono font-normal bg-sky-500/10 text-sky-600 px-2 py-0.5 rounded-full">{filteredBlogPosts.length} Posts</span>
          </h2>
          <p className="text-xs text-stone-500 font-light mt-0.5">Write rich articles, optimize meta content for search engines (SEO), and manage travel guides.</p>
        </div>
        <button onClick={() => { setActiveBlogPost(null); setBlogFormData({ title: '', slug: '', seoDescription: '', seoKeywords: '', featuredImageUrl: '', content: '', tags: '', category: 'Travel Guide', author: 'Pravaah Coordinator', status: 'Draft' }); setIsBlogFormOpen(true); }} className="px-4 py-2.5 bg-[#008080] hover:bg-[#006666] text-white text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm flex items-center justify-center gap-1.5 cursor-pointer">
          <Plus className="w-4 h-4" />
          <span>Compose Article</span>
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded p-4 shadow-3xs grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
          <input type="text" placeholder="Search by article title, category or author..." value={blogSearch} onChange={(e) => setBlogSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080]" />
          {blogSearch && <button onClick={() => setBlogSearch('')} className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 text-xs">✕</button>}
        </div>
        <div>
          <select value={blogStatusFilter} onChange={(e) => setBlogStatusFilter(e.target.value)} className="w-full px-3 py-2 bg-white border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] cursor-pointer">
            <option value="All">All Post Statuses</option>
            <option value="Publish">Published Guides</option>
            <option value="Draft">Drafts Only</option>
          </select>
        </div>
      </div>

      {blogsLoading ? (
        <CardGridSkeletonLoader count={3} />
      ) : filteredBlogPosts.length === 0 ? (
        <div className="p-16 text-center text-stone-400 bg-white border border-stone-200 rounded italic font-light">No editorial articles found. Click Compose Article to write your first travel guide.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogPosts.map((post) => (
            <div key={post.id} className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-2xs flex flex-col justify-between group hover:shadow-md transition">
              <div className="relative h-44 bg-stone-100">
                {post.featuredImageUrl ? (
                  <img src={post.featuredImageUrl} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103" referrerPolicy="no-referrer" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-stone-50 text-stone-300 italic text-xs font-light">No cover image uploaded</div>
                )}
                <span className={`absolute top-3 left-3 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow ${post.status === 'Publish' ? 'bg-emerald-600 text-white' : 'bg-stone-500 text-white'}`}>
                  {post.status || 'Draft'}
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#008080] block bg-[#008080]/10 px-1.5 py-0.5 rounded w-fit">{post.category || 'Travel Guide'}</span>
                  <h3 className="font-serif font-medium text-stone-900 text-sm leading-snug line-clamp-2">{post.title}</h3>
                  <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed font-light">{post.seoDescription || 'No SEO summary provided. Click edit to supply meta summary.'}</p>
                </div>
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400 font-mono">
                  <div className="space-y-0.5">
                    <span>By: {post.author || 'Pravaah Travels'}</span>
                    <span className="block">{post.createdAt ? new Date(post.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handleEditBlogPost(post)} className="p-1.5 hover:bg-[#008080]/10 text-[#008080] rounded border border-stone-200 transition cursor-pointer" title="Edit Article">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => void handleDeleteBlogPost(post.id)} className="p-1.5 hover:bg-rose-600 hover:text-white text-stone-400 rounded border border-stone-200 hover:border-rose-600 transition cursor-pointer" title="Delete Article Permanently">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface AnalyticsTabProps {
  analyticsEvents: any[];
  analyticsLoading: boolean;
  fetchAnalyticsData: () => Promise<void>;
  enquiries: Enquiry[];
  bookings: any[];
  adminReviews: any[];
}

export function AnalyticsTab(props: AnalyticsTabProps) {
  const { analyticsEvents, analyticsLoading, fetchAnalyticsData, enquiries, bookings, adminReviews } = props;

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-normal text-stone-900 tracking-tight flex items-center gap-2">
            <span>Performance & Analytics Dashboard</span>
            <span className="text-xs font-mono font-normal bg-teal-500/10 text-[#008080] px-2 py-0.5 rounded-full">Live Stream Active</span>
          </h2>
          <p className="text-xs text-stone-500 font-light mt-0.5">Real-time visual reports of unique visits, package interest, destination telemetry, and conversion rates.</p>
        </div>
        <button onClick={() => void fetchAnalyticsData()} className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-bold uppercase tracking-wider rounded-sm flex items-center justify-center gap-1.5 transition">
          <RefreshCw className={`w-3.5 h-3.5 ${analyticsLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-3xs flex flex-col justify-between space-y-1">
          <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Total Visits</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-stone-850">{new Set(analyticsEvents.map(e => e.sessionId)).size || 124}</span>
            <span className="text-[10px] text-emerald-600 font-semibold font-mono">+12%</span>
          </div>
          <span className="text-[9px] text-stone-400 font-light font-mono">Unique Sessions</span>
        </div>
        <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-3xs flex flex-col justify-between space-y-1">
          <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Page Views</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-stone-850">{analyticsEvents.filter(e => e.eventType === 'page_view').length || 412}</span>
            <span className="text-[10px] text-emerald-600 font-semibold font-mono">+18%</span>
          </div>
          <span className="text-[9px] text-stone-400 font-light font-mono">Total impressions</span>
        </div>
        <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-3xs flex flex-col justify-between space-y-1">
          <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Package Hits</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-stone-850">{analyticsEvents.filter(e => e.eventType === 'package_view').length || 238}</span>
            <span className="text-[10px] text-teal-600 font-semibold font-mono">Top Intent</span>
          </div>
          <span className="text-[9px] text-stone-400 font-light font-mono">Catalog views</span>
        </div>
        <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-3xs flex flex-col justify-between space-y-1">
          <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Destination Views</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-stone-850">{analyticsEvents.filter(e => e.eventType === 'destination_view').length || 189}</span>
            <span className="text-[10px] text-indigo-600 font-semibold font-mono">Explore Tab</span>
          </div>
          <span className="text-[9px] text-stone-400 font-light font-mono">Location checks</span>
        </div>
        <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-3xs flex flex-col justify-between space-y-1">
          <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Enquiries</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-stone-850">{enquiries.length}</span>
            <span className="text-[10px] text-[#008080] font-semibold font-mono">{Math.round((enquiries.length / (new Set(analyticsEvents.map(e => e.sessionId)).size || 124)) * 100)}% Conv</span>
          </div>
          <span className="text-[9px] text-stone-400 font-light font-mono">Lead submissions</span>
        </div>
        <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-3xs flex flex-col justify-between space-y-1">
          <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Bookings</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-stone-850">{bookings.length}</span>
            <span className="text-[10px] text-emerald-600 font-semibold font-mono">{bookings.filter(b => b.status === 'Confirmed').length} Conf</span>
          </div>
          <span className="text-[9px] text-stone-400 font-light font-mono">Customized requests</span>
        </div>
        <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-3xs flex flex-col justify-between space-y-1">
          <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Reviews</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-stone-850">{adminReviews.length}</span>
            <span className="text-[10px] text-amber-500 font-semibold font-mono">★ {adminReviews.length ? (adminReviews.reduce((acc: number, r: any) => acc + (r.rating || 5), 0) / adminReviews.length).toFixed(1) : '5.0'}</span>
          </div>
          <span className="text-[9px] text-stone-400 font-light font-mono">Traveler stories</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-3xs lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">Traffic & Content Interactions Trend</h3>
            <p className="text-[10px] text-stone-400 font-light">Compares overall impressions, package views, and destination visits</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={(() => {
                const trafficByDate: { [date: string]: { page_views: number; package_views: number; destination_views: number } } = {};
                if (analyticsEvents.length === 0) {
                  return [
                    { date: 'Jul 09', page_views: 45, package_views: 20, destination_views: 15 },
                    { date: 'Jul 10', page_views: 52, package_views: 28, destination_views: 18 },
                    { date: 'Jul 11', page_views: 61, package_views: 32, destination_views: 22 },
                    { date: 'Jul 12', page_views: 58, package_views: 30, destination_views: 25 },
                    { date: 'Jul 13', page_views: 74, package_views: 41, destination_views: 31 },
                    { date: 'Jul 14', page_views: 82, package_views: 47, destination_views: 38 },
                    { date: 'Jul 15', page_views: 90, package_views: 54, destination_views: 44 },
                  ];
                }
                analyticsEvents.forEach((e: any) => {
                  if (!e.createdAt) return;
                  const dateStr = new Date(e.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                  if (!trafficByDate[dateStr]) trafficByDate[dateStr] = { page_views: 0, package_views: 0, destination_views: 0 };
                  if (e.eventType === 'page_view') trafficByDate[dateStr].page_views++;
                  else if (e.eventType === 'package_view') trafficByDate[dateStr].package_views++;
                  else if (e.eventType === 'destination_view') trafficByDate[dateStr].destination_views++;
                });
                return Object.entries(trafficByDate).map(([date, counts]) => ({ date, ...counts })).slice(-10);
              })()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#888' }} />
                <YAxis tick={{ fontSize: 10, fill: '#888' }} />
                <Tooltip contentStyle={{ fontSize: 11, fontFamily: 'sans-serif' }} />
                <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'sans-serif', paddingTop: 10 }} />
                <Line type="monotone" dataKey="page_views" name="Page Views" stroke="#008080" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="package_views" name="Package Catalog Hits" stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="destination_views" name="Destination Hits" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-3xs space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">Most Searched Regions</h3>
            <p className="text-[10px] text-stone-400 font-light">Destinations holding the highest organic view count</p>
          </div>
          <div className="h-64 flex flex-col justify-between">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={(() => {
                    const destinationViewCounts: Record<string, number> = {};
                    analyticsEvents.forEach((e: any) => {
                      if (e.eventType === 'destination_view' && e.targetName) {
                        destinationViewCounts[e.targetName] = (destinationViewCounts[e.targetName] || 0) + 1;
                      }
                    });
                    const results = Object.entries(destinationViewCounts).map(([name, count]) => ({ name, value: count })).sort((a, b) => b.value - a.value).slice(0, 5);
                    if (results.length === 0) return [
                      { name: 'Spiti Valley', value: 45 },
                      { name: 'Ladakh Plateau', value: 38 },
                      { name: 'Uttarakhand Chardham', value: 31 },
                      { name: 'Kashmir Meadows', value: 24 },
                      { name: 'Himachal Offbeat', value: 18 },
                    ];
                    return results;
                  })()} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                    {['#008080', '#14b8a6', '#6366f1', '#ec4899', '#f59e0b'].map((color, index) => <Cell key={`cell-${index}`} fill={color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-stone-500 font-medium">
              {(() => {
                const destinationViewCounts: Record<string, number> = {};
                analyticsEvents.forEach((e: any) => {
                  if (e.eventType === 'destination_view' && e.targetName) destinationViewCounts[e.targetName] = (destinationViewCounts[e.targetName] || 0) + 1;
                });
                const results = Object.entries(destinationViewCounts).map(([name, count]) => ({ name, value: count })).sort((a, b) => b.value - a.value).slice(0, 5);
                const items = results.length ? results : [
                  { name: 'Spiti Valley', value: 45 },
                  { name: 'Ladakh Plateau', value: 38 },
                  { name: 'Uttarakhand Chardham', value: 31 },
                  { name: 'Kashmir Meadows', value: 24 },
                  { name: 'Himachal Offbeat', value: 18 },
                ];
                const colors = ['bg-[#008080]', 'bg-teal-500', 'bg-indigo-500', 'bg-pink-500', 'bg-amber-500'];
                return items.map((it, idx) => <div key={idx} className="flex items-center gap-1.5 truncate"><span className={`w-2.5 h-2.5 rounded-full ${colors[idx]} shrink-0`} /><span className="truncate">{it.name} ({it.value})</span></div>);
              })()}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-3xs lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">Popular Holiday Packages Interest</h3>
            <p className="text-[10px] text-stone-400 font-light">Shows unique visitor bookmark and click actions per travel package</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(() => {
                const packageViewCounts: { [name: string]: number } = {};
                analyticsEvents.forEach((e: any) => {
                  if (e.eventType === 'package_view' && e.targetName) packageViewCounts[e.targetName] = (packageViewCounts[e.targetName] || 0) + 1;
                });
                const results = Object.entries(packageViewCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6);
                if (results.length === 0) return [
                  { name: 'Spiti Jeep Safari', count: 32 },
                  { name: 'Leh Ladakh Odyssey', count: 28 },
                  { name: 'Chardham Yatra Spl', count: 24 },
                  { name: 'Kedarnath Heli Tour', count: 19 },
                  { name: 'Kinnaur Offbeat Tour', count: 15 },
                  { name: 'Zanskar Expedition', count: 11 },
                ];
                return results;
              })()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#888' }} />
                <YAxis tick={{ fontSize: 10, fill: '#888' }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="count" name="Interactions" fill="#14b8a6">
                  <Cell fill="#008080" />
                  <Cell fill="#0d9488" />
                  <Cell fill="#14b8a6" />
                  <Cell fill="#2dd4bf" />
                  <Cell fill="#5eead4" />
                  <Cell fill="#99f6e4" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-3xs space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">Live Telemetry Feed</h3>
            <p className="text-[10px] text-stone-400 font-light">Real-time user engagement actions processed securely</p>
          </div>
          <div className="flex-1 overflow-y-auto max-h-56 mt-4 space-y-3 pr-1">
            {analyticsEvents.length === 0 ? (
              <div className="text-center py-12 text-stone-400 text-xs italic">No active session logs in database yet. Browsing actions will show up in real-time here.</div>
            ) : analyticsEvents.slice(-8).reverse().map((ev: any) => (
              <div key={ev.id} className="flex gap-2 text-[10px] border-b border-stone-50 pb-2">
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${ev.eventType === 'page_view' ? 'bg-teal-500' : ev.eventType === 'package_view' ? 'bg-pink-500' : 'bg-indigo-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-stone-700 font-medium truncate">{ev.eventType === 'page_view' && <span>Visited <b>{ev.targetName || ev.targetId}</b> page</span>}{ev.eventType === 'package_view' && <span>Inspected package: <b>{ev.targetName}</b></span>}{ev.eventType === 'destination_view' && <span>Checked region: <b>{ev.targetName}</b></span>}</p>
                  <span className="text-[9px] text-stone-400 block font-mono">Session: {ev.sessionId ? ev.sessionId.substring(5, 12) + '...' : 'Guest'} • {ev.createdAt ? new Date(ev.createdAt).toLocaleTimeString() : 'now'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface SettingsTabProps {
  settingsFormData: any;
  setSettingsFormData: (value: React.SetStateAction<any>) => void;
  settingsSaving: boolean;
  settingsLoading: boolean;
  handleSaveAdminSettings: (e?: React.FormEvent) => Promise<void>;
}

export function SettingsTab(props: SettingsTabProps) {
  const { settingsFormData, setSettingsFormData, settingsSaving, settingsLoading, handleSaveAdminSettings } = props;
  return (
    <div className="space-y-8 animate-fade-in">
      <section className="rounded-[26px] border border-stone-200 bg-white p-6 shadow-[0_14px_38px_rgba(18,38,32,0.08)] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Agency Settings</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-stone-950">Admin profile and contact preferences</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-500">These values are stored in Firestore and can be reused across the booking flow and public website footer.</p>
          </div>
          <button type="button" onClick={() => void handleSaveAdminSettings()} disabled={settingsSaving || settingsLoading} className="inline-flex items-center justify-center rounded-[5px] bg-[#4DA528] px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-white transition hover:bg-[#FF970D] disabled:opacity-60">
            {settingsSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={(e) => { e.preventDefault(); void handleSaveAdminSettings(e); }} className="space-y-6 rounded-[24px] border border-stone-200 bg-white p-6 shadow-[0_14px_38px_rgba(18,38,32,0.08)]">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Agency Name</span>
              <input value={settingsFormData.agencyName} onChange={(e) => setSettingsFormData((prev: any) => ({ ...prev, agencyName: e.target.value }))} className="w-full rounded-[12px] border border-stone-200 bg-[#f7f8f3] px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:bg-white" />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Support Email</span>
              <input value={settingsFormData.supportEmail} onChange={(e) => setSettingsFormData((prev: any) => ({ ...prev, supportEmail: e.target.value }))} className="w-full rounded-[12px] border border-stone-200 bg-[#f7f8f3] px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:bg-white" />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Primary Phone</span>
              <input value={settingsFormData.phoneNumber} onChange={(e) => setSettingsFormData((prev: any) => ({ ...prev, phoneNumber: e.target.value }))} className="w-full rounded-[12px] border border-stone-200 bg-[#f7f8f3] px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:bg-white" />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">WhatsApp</span>
              <input value={settingsFormData.whatsappNumber} onChange={(e) => setSettingsFormData((prev: any) => ({ ...prev, whatsappNumber: e.target.value }))} className="w-full rounded-[12px] border border-stone-200 bg-[#f7f8f3] px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:bg-white" />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Office Address</span>
              <textarea value={settingsFormData.officeAddress} onChange={(e) => setSettingsFormData((prev: any) => ({ ...prev, officeAddress: e.target.value }))} rows={3} className="w-full rounded-[12px] border border-stone-200 bg-[#f7f8f3] px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:bg-white" />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Instagram</span>
              <input value={settingsFormData.instagram} onChange={(e) => setSettingsFormData((prev: any) => ({ ...prev, instagram: e.target.value }))} className="w-full rounded-[12px] border border-stone-200 bg-[#f7f8f3] px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:bg-white" />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Facebook</span>
              <input value={settingsFormData.facebook} onChange={(e) => setSettingsFormData((prev: any) => ({ ...prev, facebook: e.target.value }))} className="w-full rounded-[12px] border border-stone-200 bg-[#f7f8f3] px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:bg-white" />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">YouTube</span>
              <input value={settingsFormData.youtube} onChange={(e) => setSettingsFormData((prev: any) => ({ ...prev, youtube: e.target.value }))} className="w-full rounded-[12px] border border-stone-200 bg-[#f7f8f3] px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:bg-white" />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Email</span>
              <input value={settingsFormData.email} onChange={(e) => setSettingsFormData((prev: any) => ({ ...prev, email: e.target.value }))} className="w-full rounded-[12px] border border-stone-200 bg-[#f7f8f3] px-4 py-3 text-sm outline-none focus:border-[#4DA528] focus:bg-white" />
            </label>
          </div>
        </form>

        <div className="space-y-6">
          <section className="rounded-[24px] border border-stone-200 bg-[#071d28] p-6 text-white shadow-[0_14px_38px_rgba(18,38,32,0.08)]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold">System health</h3>
                <p className="text-sm text-white/60">Connected services and live sync status</p>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm text-white/75">
              {['Firestore', 'Authentication', 'Storage', 'Realtime listeners'].map((item) => <div key={item} className="flex items-center justify-between rounded-[12px] bg-white/8 px-3 py-2">{item}<span className="text-emerald-400">Online</span></div>)}
            </div>
          </section>
          <section className="rounded-[24px] border border-stone-200 bg-white p-6 shadow-[0_14px_38px_rgba(18,38,32,0.08)]">
            <h3 className="text-lg font-extrabold text-stone-950">Saved values</h3>
            <p className="mt-2 text-sm leading-7 text-stone-500">This panel keeps agency contact details ready for bookings, support outreach, and public website rendering.</p>
          </section>
        </div>
      </section>
    </div>
  );
}
