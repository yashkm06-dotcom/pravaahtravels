import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { 
  Compass, LayoutDashboard, FileText, Package, Image as ImageIcon, 
  Plus, Edit2, Trash2, X, Search, Download, 
  Calendar, DollarSign, Users, LogOut, Globe, Eye, ChevronDown, ChevronUp,
  Upload, CheckCircle, Clock, Phone, Mail, MessageSquare, Clipboard, ExternalLink, Star, LineChart as LineChartIcon, RefreshCw,
  Menu, Bell, Settings, Palette, Home, Megaphone, Images, PanelLeftClose, PanelLeftOpen, Heart, Sparkles, ChevronRight
} from 'lucide-react';
import { TravelPackage, Enquiry, GalleryImage, ActivityItem, DestinationCategory, EnquiryStatus, formatPrice, WebsiteCMSSettings, DEFAULT_WEBSITE_CMS, PACKAGE_LOCATIONS, type CustomerProfile } from '../types';
import { db, storage, collection, addDoc, updateDoc, deleteDoc, doc, getDocs, setDoc, writeBatch, getDoc } from '../lib/firebase';
import { collectionGroup } from 'firebase/firestore';
import { triggerSystemEmail } from '../lib/emailClient';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as XLSX from 'xlsx';
import { fetchAnalyticsEvents } from '../lib/analytics';
import { handleTravelImageError } from '../utils/imageFallback';

const OverviewTab = lazy(() => import('./admin/AdminDashboardSections').then((module) => ({ default: module.OverviewTab })));
const WebsiteTab = lazy(() => import('./admin/AdminDashboardSections').then((module) => ({ default: module.WebsiteTab })));
const ActivitiesTab = lazy(() => import('./admin/AdminDashboardSections').then((module) => ({ default: module.ActivitiesTab })));
const MediaLibraryTab = lazy(() => import('./admin/AdminDashboardSections').then((module) => ({ default: module.MediaLibraryTab })));
const PackagesTab = lazy(() => import('./admin/AdminDashboardSections').then((module) => ({ default: module.PackagesTab })));
const EnquiriesTab = lazy(() => import('./admin/AdminDashboardSections').then((module) => ({ default: module.EnquiriesTab })));
const BookingsTab = lazy(() => import('./admin/AdminDashboardSections').then((module) => ({ default: module.BookingsTab })));
const ReviewsTab = lazy(() => import('./admin/AdminDashboardSections').then((module) => ({ default: module.ReviewsTab })));
const CustomersTab = lazy(() => import('./admin/AdminDashboardSections').then((module) => ({ default: module.CustomersTab })));
const BlogsTab = lazy(() => import('./admin/AdminDashboardSections').then((module) => ({ default: module.BlogsTab })));
const AnalyticsTab = lazy(() => import('./admin/AdminDashboardSections').then((module) => ({ default: module.AnalyticsTab })));
const SettingsTab = lazy(() => import('./admin/AdminDashboardSections').then((module) => ({ default: module.SettingsTab })));

interface AdminDashboardViewProps {
  packages: TravelPackage[];
  enquiries: Enquiry[];
  gallery: GalleryImage[];
  activities: ActivityItem[];
  adminEmail: string;
  onLogout: () => void;
  onNavigatePublic: () => void;
  onRefreshData: () => Promise<void>;
  websiteCMS: WebsiteCMSSettings;
}

type AdminTab = 'overview' | 'packages' | 'enquiries' | 'customers' | 'gallery' | 'media-library' | 'website' | 'activities' | 'bookings' | 'reviews' | 'blogs' | 'analytics' | 'settings';

export default function AdminDashboardView({
  packages,
  enquiries,
  gallery,
  activities,
  adminEmail,
  onLogout,
  onNavigatePublic,
  onRefreshData,
  websiteCMS,
}: AdminDashboardViewProps) {
  // Navigation inside Dashboard
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [adminSearch, setAdminSearch] = useState('');
  const [mediaLibrarySearch, setMediaLibrarySearch] = useState('');
  const [mediaLibraryCategory, setMediaLibraryCategory] = useState('All');
  const [cmsFormData, setCmsFormData] = useState<WebsiteCMSSettings>(websiteCMS);
  const [cmsSaving, setCmsSaving] = useState(false);
  const [cmsUploadingField, setCmsUploadingField] = useState<'heroBackgroundImageUrl' | 'logoUrl' | null>(null);
  const [mediaUploading, setMediaUploading] = useState(false);

  // Analytics State
  const [analyticsEvents, setAnalyticsEvents] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const fetchAnalyticsData = async () => {
    setAnalyticsLoading(true);
    try {
      const data = await fetchAnalyticsEvents();
      setAnalyticsEvents(data);
    } catch (err) {
      console.error('Failed to load analytics events:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Bookings state
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [settingsFormData, setSettingsFormData] = useState({
    agencyName: 'Pravaah Travels',
    phoneNumber: '+91 91231 36692',
    whatsappNumber: '+91 91231 36692',
    email: 'pravaahtravels@gmail.com',
    officeAddress: '402, Signature Towers, Sector 30, Gurugram, HR - 122001, India',
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
    youtube: 'https://youtube.com',
    websiteFooter: 'Premium Himalayan journeys, sacred valleys, and tailor-made comfort handled by local curators.',
    heroBannerText: 'Journey beyond the ordinary with curated Himalayan escapes.',
    supportEmail: 'support@pravaahtravels.com',
    updatedAt: '',
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [systemHealth, setSystemHealth] = useState({
    firestoreConnected: true,
    authenticationActive: true,
    storageConnected: true,
    realtimeListenersActive: true,
  });

  // Lead CRM Filter states
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('All');
  const [customers, setCustomers] = useState<Array<CustomerProfile & { bookingsCount: number; enquiriesCount: number; lastActivityAt: string }>>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerDestinationFilter, setCustomerDestinationFilter] = useState('All');
  const [bookingPackageFilter, setBookingPackageFilter] = useState('All');
  const [bookingMonthFilter, setBookingMonthFilter] = useState('All');
  const [bookingFeedback, setBookingFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [bookingActionBusy, setBookingActionBusy] = useState(false);

  // Lead Inspection Modal & Update states
  const [activeBooking, setActiveBooking] = useState<any | null>(null);
  const [newNote, setNewNote] = useState('');
  const [assignee, setAssignee] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  // Get all unique packages/destinations in bookings for filtering
  const uniqueBookingPackages = useMemo(() => {
    const pkgs = bookings.map((b) => b.packageTitle).filter(Boolean);
    return Array.from(new Set(pkgs));
  }, [bookings]);

  // Get all unique booking months for filtering
  const uniqueBookingMonths = useMemo(() => {
    const months = bookings
      .map((b) => {
        if (!b.createdAt) return '';
        const d = new Date(b.createdAt);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      })
      .filter(Boolean);
    return Array.from(new Set(months)).sort().reverse();
  }, [bookings]);

  // Filtered Bookings (Leads)
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const bookingStatus = String(b.bookingStatus || b.status || 'Pending').trim();
      const customerName = String(b.customerName || b.userName || '').toLowerCase();
      const customerEmail = String(b.customerEmail || b.email || '').toLowerCase();
      const customerPhone = String(b.customerPhone || b.phone || '').toLowerCase();
      const destination = String(b.destination || '').toLowerCase();
      const packageTitle = String(b.packageTitle || '').toLowerCase();

      if (bookingSearch) {
        const queryStr = bookingSearch.toLowerCase();
        const nameMatch = customerName.includes(queryStr);
        const emailMatch = customerEmail.includes(queryStr);
        const phoneMatch = customerPhone.includes(queryStr);
        const destMatch = destination.includes(queryStr);
        const pkgMatch = packageTitle.includes(queryStr);
        if (!nameMatch && !emailMatch && !phoneMatch && !destMatch && !pkgMatch) {
          return false;
        }
      }

      if (bookingStatusFilter !== 'All') {
        const targetStatus = bookingStatusFilter;
        if (targetStatus === 'New Lead') {
          if (bookingStatus !== 'Pending' && bookingStatus !== 'New Lead') {
            return false;
          }
        } else if (bookingStatus !== targetStatus) {
          return false;
        }
      }

      if (bookingPackageFilter !== 'All' && packageTitle !== bookingPackageFilter) {
        return false;
      }

      if (bookingMonthFilter !== 'All') {
        if (!b.createdAt) return false;
        const d = new Date(b.createdAt);
        const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (mStr !== bookingMonthFilter) {
          return false;
        }
      }

      return true;
    });
  }, [bookings, bookingSearch, bookingStatusFilter, bookingPackageFilter, bookingMonthFilter]);

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    return customers.filter((customer) => {
      const name = String(customer.displayName || customer.name || '').toLowerCase();
      const email = String(customer.email || '').toLowerCase();
      const phone = String(customer.phone || customer.whatsapp || '').toLowerCase();
      const destinations = String(customer.preferredDestinations || '').toLowerCase();
      const matchesSearch = !query || [name, email, phone, destinations].some((value) => value.includes(query));
      const matchesDestination = customerDestinationFilter === 'All' || !customerDestinationFilter || destinations.includes(customerDestinationFilter.toLowerCase());
      return matchesSearch && matchesDestination;
    });
  }, [customers, customerSearch, customerDestinationFilter]);

  const uniqueCustomerDestinations = useMemo(() => {
    return Array.from(
      new Set(
        customers
          .map((customer) => String(customer.preferredDestinations || '').split(',').map((item) => item.trim()).filter(Boolean))
          .flat()
      )
    ).sort();
  }, [customers]);

  const handleExportCustomersExcel = () => {
    if (filteredCustomers.length === 0) return;

    const worksheetData = [
      ['Name', 'Email', 'Phone', 'Preferred Destinations', 'Bookings', 'Enquiries', 'Last Activity'],
      ...filteredCustomers.map((customer) => [
        customer.displayName || customer.name || 'Traveler',
        customer.email || '',
        customer.phone || customer.whatsapp || '',
        customer.preferredDestinations || '',
        customer.bookingsCount ?? 0,
        customer.enquiriesCount ?? 0,
        customer.lastActivityAt ? new Date(customer.lastActivityAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '',
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pravaah_customers_${new Date().toISOString().substring(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const fetchCustomerProfiles = async () => {
    setCustomersLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const fetchedCustomers = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as Partial<CustomerProfile>;
        const email = String(data.email || '').trim().toLowerCase();
        const userBookings = bookings.filter((booking) => String(booking.customerEmail || booking.email || '').trim().toLowerCase() === email);
        const userEnquiries = enquiries.filter((enquiry) => String(enquiry.email || '').trim().toLowerCase() === email);
        const activityTimeline = [
          ...userBookings.map((booking) => booking.createdAt || ''),
          ...userEnquiries.map((enquiry) => enquiry.createdAt || ''),
        ].filter(Boolean);

        return {
          id: docSnap.id,
          ...data,
          displayName: data.displayName || data.name || 'Traveler',
          email: data.email || '',
          phone: data.phone || '',
          whatsapp: data.whatsapp || data.phone || '',
          preferredDestinations: data.preferredDestinations || '',
          bookingsCount: userBookings.length,
          enquiriesCount: userEnquiries.length,
          lastActivityAt: activityTimeline.sort().at(-1) || data.updatedAt || data.createdAt || '',
        } as CustomerProfile & { bookingsCount: number; enquiriesCount: number; lastActivityAt: string };
      });

      fetchedCustomers.sort((a, b) => new Date(b.lastActivityAt || 0).getTime() - new Date(a.lastActivityAt || 0).getTime());
      setCustomers(fetchedCustomers);
    } catch (err) {
      console.error('Error fetching customer profiles:', err);
    } finally {
      setCustomersLoading(false);
    }
  };

  // Fetch all customer bookings
  const fetchAllBookings = async () => {
    setBookingsLoading(true);
    try {
      const q = collection(db, 'bookings');
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        bookingStatus: String(doc.data().bookingStatus || doc.data().status || 'Pending').trim(),
        customerName: doc.data().customerName || doc.data().userName || 'Traveler',
        customerEmail: doc.data().customerEmail || doc.data().email || '',
        customerPhone: doc.data().customerPhone || doc.data().phone || '',
        packageTitle: doc.data().packageTitle || doc.data().destination || 'Custom Package',
        travelDate: doc.data().travelDate || '',
        guests: Number(doc.data().guests ?? (doc.data().travelers ?? ((doc.data().adults || 0) + (doc.data().children || 0) || 1)))
      }));
      fetched.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setBookings(fetched);
    } catch (err) {
      console.error('Error fetching admin bookings:', err);
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    void fetchAllBookings();
    void fetchCustomerProfiles();
    void fetchAdminReviews();
    void fetchBlogPosts();
    void fetchAnalyticsData();
    void fetchWishlistAnalytics();
    void fetchAdminSettings();
  }, []);

  useEffect(() => {
    setCmsFormData({
      ...DEFAULT_WEBSITE_CMS,
      ...websiteCMS,
    });
  }, [websiteCMS]);

  const fetchWishlistAnalytics = async () => {
    setWishlistLoading(true);
    try {
      const snapshot = await getDocs(collectionGroup(db, 'private'));
      const items = snapshot.docs
        .map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Record<string, unknown>) }))
        .filter((item: any) => item.packageId || item.packageTitle || item.title);
      setWishlistItems(items);
      setSystemHealth((prev) => ({ ...prev, realtimeListenersActive: true }));
    } catch (err) {
      console.error('Failed to load wishlist analytics:', err);
    } finally {
      setWishlistLoading(false);
    }
  };

  const fetchAdminSettings = async () => {
    setSettingsLoading(true);
    try {
      const snapshot = await getDoc(doc(db, 'settings', 'general'));
      if (snapshot.exists()) {
        const data = snapshot.data();
        setSettingsFormData({
          agencyName: String(data.agencyName || 'Pravaah Travels'),
          phoneNumber: String(data.phoneNumber || '+91 91231 36692'),
          whatsappNumber: String(data.whatsappNumber || '+91 91231 36692'),
          email: String(data.email || 'pravaahtravels@gmail.com'),
          officeAddress: String(data.officeAddress || '402, Signature Towers, Sector 30, Gurugram, HR - 122001, India'),
          instagram: String(data.instagram || 'https://instagram.com'),
          facebook: String(data.facebook || 'https://facebook.com'),
          youtube: String(data.youtube || 'https://youtube.com'),
          websiteFooter: String(data.websiteFooter || 'Premium Himalayan journeys, sacred valleys, and tailor-made comfort handled by local curators.'),
          heroBannerText: String(data.heroBannerText || 'Journey beyond the ordinary with curated Himalayan escapes.'),
          supportEmail: String(data.supportEmail || 'support@pravaahtravels.com'),
          updatedAt: String(data.updatedAt || ''),
        });
      }
      setSystemHealth((prev) => ({ ...prev, firestoreConnected: true }));
    } catch (err) {
      console.error('Failed to load admin settings:', err);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: string) => {
    setBookingActionBusy(true);
    setBookingFeedback(null);
    try {
      const ref = doc(db, 'bookings', bookingId);
      await updateDoc(ref, { bookingStatus: status, status });

      const booking = bookings.find((b) => b.id === bookingId);
      if (booking) {
        const recipient = booking.customerEmail || booking.email || '';
        if (recipient) {
          if (status === 'Confirmed') {
            triggerSystemEmail('booking-confirmed', recipient, {
              customerName: booking.customerName || 'Traveler',
              bookingId,
              packageTitle: booking.packageTitle,
              travelDate: booking.travelDate
            });
          } else if (status === 'Cancelled') {
            triggerSystemEmail('booking-cancelled', recipient, {
              customerName: booking.customerName || 'Traveler',
              bookingId,
              packageTitle: booking.packageTitle,
              travelDate: booking.travelDate
            });
          }
        }
      }

      setBookingFeedback({ type: 'success', message: `Booking status updated to ${status}.` });
      await fetchAllBookings();
    } catch (err) {
      console.error('Update booking status failed:', err);
      setBookingFeedback({ type: 'error', message: 'Unable to update booking status right now.' });
    } finally {
      setBookingActionBusy(false);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this customer booking? This action is irreversible.')) return;
    setBookingActionBusy(true);
    setBookingFeedback(null);
    try {
      const ref = doc(db, 'bookings', bookingId);
      await deleteDoc(ref);
      setBookingFeedback({ type: 'success', message: 'Booking removed from the CRM.' });
      await fetchAllBookings();
    } catch (err) {
      console.error('Delete booking failed:', err);
      setBookingFeedback({ type: 'error', message: 'Unable to delete this booking right now.' });
    } finally {
      setBookingActionBusy(false);
    }
  };

  const handleAddNote = async (bookingId: string) => {
    if (!newNote.trim()) {
      setBookingFeedback({ type: 'error', message: 'Add a note before saving it to the booking.' });
      return;
    }
    setBookingActionBusy(true);
    setBookingFeedback(null);
    try {
      const bRef = doc(db, 'bookings', bookingId);
      const booking = bookings.find((b) => b.id === bookingId);
      const currentNotes = booking?.notes || [];
      const noteObj = {
        text: newNote,
        createdAt: new Date().toISOString(),
        author: adminEmail || 'Admin'
      };
      const updatedNotes = [...currentNotes, noteObj];
      await updateDoc(bRef, { notes: updatedNotes, updatedAt: new Date().toISOString() });
      setNewNote('');
      if (activeBooking && activeBooking.id === bookingId) {
        setActiveBooking({
          ...activeBooking,
          notes: updatedNotes
        });
      }
      setBookingFeedback({ type: 'success', message: 'Staff note saved to the booking timeline.' });
      await fetchAllBookings();
    } catch (err) {
      console.error('Failed to add note:', err);
      setBookingFeedback({ type: 'error', message: 'Failed to save note. Please try again.' });
    } finally {
      setBookingActionBusy(false);
    }
  };

  const handleAssignStaff = async (bookingId: string, staffName: string) => {
    setBookingActionBusy(true);
    setBookingFeedback(null);
    try {
      const bRef = doc(db, 'bookings', bookingId);
      await updateDoc(bRef, { assignedStaff: staffName });
      setAssignee(staffName);
      if (activeBooking && activeBooking.id === bookingId) {
        setActiveBooking({
          ...activeBooking,
          assignedStaff: staffName
        });
      }
      setBookingFeedback({ type: 'success', message: 'Staff assignment updated.' });
      await fetchAllBookings();
    } catch (err) {
      console.error('Failed to assign staff:', err);
      setBookingFeedback({ type: 'error', message: 'Unable to assign staff right now.' });
    } finally {
      setBookingActionBusy(false);
    }
  };

  const handleUpdateFollowUpDate = async (bookingId: string, dateStr: string) => {
    setBookingActionBusy(true);
    setBookingFeedback(null);
    try {
      const bRef = doc(db, 'bookings', bookingId);
      await updateDoc(bRef, { followUpDate: dateStr });
      setFollowUpDate(dateStr);
      if (activeBooking && activeBooking.id === bookingId) {
        setActiveBooking({
          ...activeBooking,
          followUpDate: dateStr
        });
      }
      setBookingFeedback({ type: 'success', message: 'Follow-up date saved.' });
      await fetchAllBookings();
    } catch (err) {
      console.error('Failed to update follow-up date:', err);
      setBookingFeedback({ type: 'error', message: 'Unable to update the follow-up date.' });
    } finally {
      setBookingActionBusy(false);
    }
  };

  const handleSaveAdminSettings = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSettingsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'general'), {
        ...settingsFormData,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      await fetchAdminSettings();
      alert('Admin settings saved to Firestore.');
    } catch (err) {
      console.error('Failed to save admin settings:', err);
      alert('Failed to save admin settings.');
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleExportBookingsCSV = () => {
    if (filteredBookings.length === 0) {
      alert('No booking records to export.');
      return;
    }
    
    const headers = [
      'Booking ID',
      'Created At',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'WhatsApp',
      'Destination',
      'Package Selected',
      'Travel Date',
      'Adults',
      'Children',
      'Pickup City',
      'Budget Limit',
      'Assigned Staff',
      'Follow Up Date',
      'Status',
      'Special Requests'
    ];

    const rows = filteredBookings.map(b => [
      b.bookingId || b.id,
      b.createdAt || '',
      b.customerName || '',
      b.customerEmail || '',
      b.customerPhone || '',
      b.customerWhatsApp || '',
      b.destination || '',
      b.packageTitle || '',
      b.travelDate || '',
      b.adults || 0,
      b.children || 0,
      b.pickupCity || '',
      b.budget || '',
      b.assignedStaff || '',
      b.followUpDate || '',
      b.bookingStatus || b.status || 'Pending',
      (b.specialRequests || '').replace(/\n/g, ' ')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pravaah_travels_leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Package modal/form states
  const [isPkgFormOpen, setIsPkgFormOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<TravelPackage | null>(null);
  const [packageCmsTab, setPackageCmsTab] = useState<'general' | 'pricing' | 'content' | 'seo'>('general');
  const [pkgFormData, setPkgFormData] = useState({
    title: '',
    destination: '',
    location: 'Uttarakhand',
    bookingType: 'Family Comfort',
    maxGuests: 8,
    category: 'Pilgrimage' as DestinationCategory,
    duration: '',
    price: 0,
    offerPrice: 0,
    packageCode: '',
    pickup: '',
    shortDescription: '',
    fullDescription: '',
    imageUrl: '',
    packageBannerUrl: '',
    galleryImages: '',
    highlights: '',
    thingsToCarry: '',
    departureDates: '',
    faqs: '',
    policies: '',
    activityId: '',
    seoTitle: '',
    seoDescription: '',
    featured: false,
    active: true,
    status: 'Draft' as 'Publish' | 'Draft',
  });
  // Dynamic arrays inside package form
  const [itinerary, setItinerary] = useState<{ day: number; title: string; description: string }[]>([]);
  const [inclusions, setInclusions] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Enquiry detail modal state
  const [activeEnquiry, setActiveEnquiry] = useState<Enquiry | null>(null);

  // Gallery form state
  const [isGalleryFormOpen, setIsGalleryFormOpen] = useState(false);
  const [galleryFormData, setGalleryFormData] = useState({
    title: '',
    category: 'Pilgrimage',
    album: '',
    imageUrl: '',
  });

  // Gallery Filters
  const [gallerySearch, setGallerySearch] = useState('');
  const [galleryAlbumFilter, setGalleryAlbumFilter] = useState('All');
  const [galleryCategoryFilter, setGalleryCategoryFilter] = useState('All');

  // Multiple Image Upload States
  const [galleryUploadMode, setGalleryUploadMode] = useState<'single' | 'multiple'>('single');
  const [selectedGalleryFiles, setSelectedGalleryFiles] = useState<{ file: File; preview: string; compressedBase64: string; title: string }[]>([]);
  const [isUploadingMultiple, setIsUploadingMultiple] = useState(false);
  const [multipleUploadCategory, setMultipleUploadCategory] = useState('Pilgrimage');
  const [multipleUploadAlbum, setMultipleUploadAlbum] = useState('');
  
  // Edit/Rename state
  const [editingGalleryImage, setEditingGalleryImage] = useState<GalleryImage | null>(null);
  const [isGalleryEditOpen, setIsGalleryEditOpen] = useState(false);
  const [editGalleryFormData, setEditGalleryFormData] = useState({
    title: '',
    category: 'Pilgrimage',
    album: '',
  });

  // Client-side image compression and conversion helpers
  const dataURItoBlob = (dataURI: string): Blob => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => reject(new Error('Image load error'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsDataURL(file);
    });
  };

  // Filtered gallery selectors
  const filteredGalleryImages = useMemo(() => {
    return gallery.filter((img) => {
      const matchSearch = img.title.toLowerCase().includes(gallerySearch.toLowerCase()) ||
        (img.album || '').toLowerCase().includes(gallerySearch.toLowerCase()) ||
        img.category.toLowerCase().includes(gallerySearch.toLowerCase());
      
      const matchAlbum = galleryAlbumFilter === 'All' || img.album === galleryAlbumFilter;
      const matchCategory = galleryCategoryFilter === 'All' || img.category === galleryCategoryFilter;
      
      return matchSearch && matchAlbum && matchCategory;
    });
  }, [gallery, gallerySearch, galleryAlbumFilter, galleryCategoryFilter]);

  const uniqueAlbums = useMemo(() => {
    const albums = gallery.map((img) => img.album).filter(Boolean) as string[];
    return Array.from(new Set(albums));
  }, [gallery]);

  const uniqueCategories = useMemo(() => {
    const cats = gallery.map((img) => img.category).filter(Boolean) as string[];
    return Array.from(new Set(cats));
  }, [gallery]);

  // Review management state and hooks
  const [adminReviews, setAdminReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewStatusFilter, setReviewStatusFilter] = useState('All');
  const [reviewRatingFilter, setReviewRatingFilter] = useState('All');
  const [replyText, setReplyText] = useState('');
  const [activeReviewForReply, setActiveReviewForReply] = useState<any | null>(null);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);

  const fetchAdminReviews = async () => {
    setReviewsLoading(true);
    try {
      const q = collection(db, 'reviews');
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      fetched.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setAdminReviews(fetched);
    } catch (err) {
      console.error('Error fetching admin reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleReviewStatusUpdate = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      const refDoc = doc(db, 'reviews', id);
      await updateDoc(refDoc, { status });
      await fetchAdminReviews();
    } catch (err) {
      console.error('Error updating review status:', err);
    }
  };

  const handleReviewFeaturedToggle = async (id: string, currentFeatured: boolean) => {
    try {
      const refDoc = doc(db, 'reviews', id);
      await updateDoc(refDoc, { featured: !currentFeatured });
      await fetchAdminReviews();
    } catch (err) {
      console.error('Error toggling featured status:', err);
    }
  };

  const handleReviewReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReviewForReply) return;
    try {
      const refDoc = doc(db, 'reviews', activeReviewForReply.id);
      await updateDoc(refDoc, {
        reply: replyText.trim(),
        replyAuthor: adminEmail,
        replyAt: new Date().toISOString(),
      });
      setIsReplyModalOpen(false);
      setActiveReviewForReply(null);
      setReplyText('');
      await fetchAdminReviews();
    } catch (err) {
      console.error('Error saving review reply:', err);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this review?')) return;
    try {
      await deleteDoc(doc(db, 'reviews', id));
      await fetchAdminReviews();
    } catch (err) {
      console.error('Error deleting review:', err);
    }
  };

  const filteredAdminReviews = useMemo(() => {
    return adminReviews.filter((r) => {
      const matchSearch = r.name.toLowerCase().includes(reviewSearch.toLowerCase()) ||
        (r.comment || '').toLowerCase().includes(reviewSearch.toLowerCase()) ||
        (r.destination || '').toLowerCase().includes(reviewSearch.toLowerCase());
      
      const matchStatus = reviewStatusFilter === 'All' 
        ? true 
        : (reviewStatusFilter === 'Pending' ? (!r.status || r.status === 'Pending') : r.status === reviewStatusFilter);
      
      const matchRating = reviewRatingFilter === 'All' ? true : r.rating === Number(reviewRatingFilter);
      
      return matchSearch && matchStatus && matchRating;
    });
  }, [adminReviews, reviewSearch, reviewStatusFilter, reviewRatingFilter]);

  // Blog CMS states and hooks
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(false);
  const [blogSearch, setBlogSearch] = useState('');
  const [blogStatusFilter, setBlogStatusFilter] = useState('All');
  const [isBlogFormOpen, setIsBlogFormOpen] = useState(false);
  const [activeBlogPost, setActiveBlogPost] = useState<any | null>(null);
  const [blogFormData, setBlogFormData] = useState({
    title: '',
    slug: '',
    seoDescription: '',
    seoKeywords: '',
    featuredImageUrl: '',
    content: '',
    tags: '',
    category: 'Travel Guide',
    author: 'Pravaah Coordinator',
    status: 'Draft' as 'Publish' | 'Draft',
  });

  const handleBlogTitleChange = (title: string) => {
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    
    setBlogFormData((prev) => ({
      ...prev,
      title,
      slug,
    }));
  };

  const fetchBlogPosts = async () => {
    setBlogsLoading(true);
    try {
      const q = collection(db, 'blogs');
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      fetched.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setBlogPosts(fetched);
    } catch (err) {
      console.error('Error fetching blog posts:', err);
    } finally {
      setBlogsLoading(false);
    }
  };

  const handleSaveBlogPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogFormData.title || !blogFormData.content) {
      alert('Title and Content are required.');
      return;
    }

    try {
      const tagsArray = blogFormData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      const payload = {
        title: blogFormData.title,
        slug: blogFormData.slug || 'untitled-post',
        seoDescription: blogFormData.seoDescription,
        seoKeywords: blogFormData.seoKeywords,
        featuredImageUrl: blogFormData.featuredImageUrl,
        content: blogFormData.content,
        tags: tagsArray,
        category: blogFormData.category,
        author: blogFormData.author,
        status: blogFormData.status,
        updatedAt: new Date().toISOString(),
      };

      if (activeBlogPost) {
        await updateDoc(doc(db, 'blogs', activeBlogPost.id), payload);
        alert('Blog post updated successfully.');
      } else {
        await addDoc(collection(db, 'blogs'), {
          ...payload,
          createdAt: new Date().toISOString(),
        });
        alert('Blog post created successfully.');
      }

      setIsBlogFormOpen(false);
      setActiveBlogPost(null);
      setBlogFormData({
        title: '',
        slug: '',
        seoDescription: '',
        seoKeywords: '',
        featuredImageUrl: '',
        content: '',
        tags: '',
        category: 'Travel Guide',
        author: 'Pravaah Coordinator',
        status: 'Draft',
      });
      await fetchBlogPosts();
    } catch (err) {
      console.error('Error saving blog post:', err);
      alert('Failed to save blog post.');
    }
  };

  const handleEditBlogPost = (post: any) => {
    setActiveBlogPost(post);
    setBlogFormData({
      title: post.title,
      slug: post.slug,
      seoDescription: post.seoDescription || '',
      seoKeywords: post.seoKeywords || '',
      featuredImageUrl: post.featuredImageUrl || '',
      content: post.content || '',
      tags: (post.tags || []).join(', '),
      category: post.category || 'Travel Guide',
      author: post.author || 'Pravaah Coordinator',
      status: post.status || 'Draft',
    });
    setIsBlogFormOpen(true);
  };

  const handleDeleteBlogPost = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this blog post?')) return;
    try {
      await deleteDoc(doc(db, 'blogs', id));
      await fetchBlogPosts();
    } catch (err) {
      console.error('Error deleting blog post:', err);
    }
  };

  const handleBlogImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file);
      const blob = dataURItoBlob(compressed);
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storagePath = `blogs/${fileName}`;
      const imageRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(imageRef, blob);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      setBlogFormData((prev) => ({ ...prev, featuredImageUrl: downloadUrl }));
    } catch (error) {
      console.warn('Firebase Storage upload failed. Using Base64 fallback.', error);
      const reader = new FileReader();
      reader.onload = (event) => {
        setBlogFormData((prev) => ({ ...prev, featuredImageUrl: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredBlogPosts = useMemo(() => {
    return blogPosts.filter((post) => {
      const matchSearch = post.title.toLowerCase().includes(blogSearch.toLowerCase()) ||
        (post.category || '').toLowerCase().includes(blogSearch.toLowerCase()) ||
        (post.author || '').toLowerCase().includes(blogSearch.toLowerCase());
      const matchStatus = blogStatusFilter === 'All' ? true : post.status === blogStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [blogPosts, blogSearch, blogStatusFilter]);

  // Load reviews and blogs on mount
  useEffect(() => {
    fetchAdminReviews();
    fetchBlogPosts();
  }, []);

  // Filters and searches inside tab
  const [enquirySearch, setEnquirySearch] = useState('');
  const [enquiryStatusFilter, setEnquiryStatusFilter] = useState<string>('All');
  const [enquiryMonthFilter, setEnquiryMonthFilter] = useState<string>('All');

  const [packageSearch, setPackageSearch] = useState('');

  // ----------------------------------------------------
  // DASHBOARD OVERVIEW METRICS
  // ----------------------------------------------------
  const metrics = useMemo(() => {
    const totalEnquiries = enquiries.length;

    const currentYearMonth = new Date().toISOString().substring(0, 7);
    const thisMonthEnquiries = enquiries.filter(
      (e) => e.createdAt && e.createdAt.substring(0, 7) === currentYearMonth
    ).length;

    const totalPackages = packages.length;
    const activePackages = packages.filter((p) => p.active).length;

    const recentEnquiries = [...enquiries]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    const getBookingState = (booking: any) => String(booking?.bookingStatus || booking?.status || 'Pending').trim();
    const totalBookingsCount = bookings.length;
    const pendingBookingsCount = bookings.filter((b) => ['Pending', 'New Lead'].includes(getBookingState(b))).length;
    const confirmedBookingsCount = bookings.filter((b) => ['Confirmed', 'Completed', 'Trip Completed'].includes(getBookingState(b))).length;
    const cancelledBookingsCount = bookings.filter((b) => getBookingState(b) === 'Cancelled').length;
    const estimatedRevenue = bookings.reduce((sum, b) => {
      const state = getBookingState(b);
      if (['Confirmed', 'Completed', 'Trip Completed'].includes(state)) {
        return sum + Number(b.totalPrice ?? b.price ?? 0);
      }
      return sum;
    }, 0);

    const totalRevenue = estimatedRevenue;
    const pendingReceivables = bookings
      .filter((b) => (b.paymentStatus === 'Unpaid' || b.paymentStatus === undefined) && getBookingState(b) !== 'Cancelled')
      .reduce((sum, b) => sum + Number(b.totalPrice ?? b.price ?? 0), 0);
    const activeBookingsCount = pendingBookingsCount + confirmedBookingsCount;

    const customerEmails = Array.from(
      new Set(
        bookings
          .map((b) => String(b.customerEmail || b.email || '').trim())
          .filter(Boolean)
          .concat(enquiries.map((e) => String(e.email || '').trim()).filter(Boolean))
      )
    );

    return {
      totalEnquiries,
      thisMonthEnquiries,
      totalPackages,
      activePackages,
      recentEnquiries,
      totalBookingsCount,
      pendingBookingsCount,
      confirmedBookingsCount,
      cancelledBookingsCount,
      totalRevenue,
      pendingReceivables,
      activeBookingsCount,
      totalCustomers: customerEmails.length,
      wishlistSaves: wishlistItems.length,
      estimatedRevenue: totalRevenue,
    };
  }, [enquiries, packages, bookings, wishlistItems]);

  // ----------------------------------------------------
  // ENQUIRIES FILTERS & EXPORT
  // ----------------------------------------------------
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((e) => {
      const matchSearch =
        e.name.toLowerCase().includes(enquirySearch.toLowerCase()) ||
        e.phone.includes(enquirySearch) ||
        e.destination.toLowerCase().includes(enquirySearch.toLowerCase());

      const matchStatus = enquiryStatusFilter === 'All' || e.status === enquiryStatusFilter;

      let matchMonth = true;
      if (enquiryMonthFilter !== 'All') {
        const monthMatches = typeof e.createdAt === 'string' && e.createdAt.substring(0, 7) === enquiryMonthFilter;
        matchMonth = monthMatches;
      }

      return matchSearch && matchStatus && matchMonth;
    });
  }, [enquiries, enquirySearch, enquiryStatusFilter, enquiryMonthFilter]);

  // Extract unique months from enquiries for filter dropdown
  const uniqueEnquiryMonths = useMemo(() => {
    const months = enquiries
      .map((e) => e.createdAt && e.createdAt.substring(0, 7))
      .filter(Boolean);
    return Array.from(new Set(months)).sort();
  }, [enquiries]);

  // Client-side CSV Exporter
  const handleExportCSV = () => {
    if (filteredEnquiries.length === 0) return;
    
    // Headers
    const headers = ['Name', 'Phone', 'Email', 'Destination', 'Travel Date', 'Travelers', 'Budget', 'Status', 'Submitted At', 'Message'];
    const rows = filteredEnquiries.map((e) => [
      `"${e.name.replace(/"/g, '""')}"`,
      `"${e.phone}"`,
      `"${e.email}"`,
      `"${e.destination.replace(/"/g, '""')}"`,
      `"${e.travelDate}"`,
      e.travelers,
      `"${e.budget}"`,
      `"${e.status}"`,
      `"${e.createdAt}"`,
      `"${(e.message || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pravaah_enquiries_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ----------------------------------------------------
  // PACKAGE IMAGE UPLOAD HELPERS (Storage & Base64 Fallback)
  // ----------------------------------------------------
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>, target: 'package' | 'gallery') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      // 1. Attempt upload to Firebase Storage
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storagePath = target === 'package' ? `packages/${fileName}` : `gallery/${fileName}`;
      const imageRef = ref(storage, storagePath);
      
      const snapshot = await uploadBytes(imageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      
      if (target === 'package') {
        setPkgFormData((prev) => ({ ...prev, imageUrl: downloadUrl }));
      } else {
        setGalleryFormData((prev) => ({ ...prev, imageUrl: downloadUrl }));
      }
    } catch (error) {
      console.warn('Firebase Storage upload blocked or failed. Falling back to local Base64 conversion:', error);
      
      // 2. Fallback to base64 encoding so user isn't blocked!
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result as string;
        if (target === 'package') {
          setPkgFormData((prev) => ({ ...prev, imageUrl: base64Url }));
        } else {
          setGalleryFormData((prev) => ({ ...prev, imageUrl: base64Url }));
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  // ----------------------------------------------------
  // PACKAGE MANAGEMENT MUTATIONS
  // ----------------------------------------------------
  const handleOpenPkgAdd = () => {
    setEditingPkg(null);
    setPackageCmsTab('general');
    setPkgFormData({
      title: '',
      destination: '',
      location: 'Uttarakhand',
      bookingType: 'Family Comfort',
      maxGuests: 8,
      category: 'Pilgrimage',
      duration: '5 Days / 4 Nights',
      price: 500,
      offerPrice: 0,
      packageCode: '',
      pickup: '',
      shortDescription: '',
      fullDescription: '',
      imageUrl: '',
      packageBannerUrl: '',
      galleryImages: '',
      highlights: '',
      thingsToCarry: '',
      departureDates: '',
      faqs: '',
      policies: '',
      activityId: '',
      seoTitle: '',
      seoDescription: '',
      featured: false,
      active: true,
      status: 'Draft',
    });
    setItinerary([{ day: 1, title: 'Arrival & Check-in', description: 'Airport pick-up and welcome briefings.' }]);
    setInclusions(['Premium hotel accommodation', 'Daily breakfasts', 'Local sightseeing transfer']);
    setExclusions(['Airfare tickets', 'Personal laundry and tips']);
    setIsPkgFormOpen(true);
  };

  const handleOpenPkgEdit = (pkg: TravelPackage) => {
    setEditingPkg(pkg);
    setPackageCmsTab('general');
    setPkgFormData({
      title: pkg.title,
      destination: pkg.destination,
      location: pkg.location || 'Uttarakhand',
      bookingType: pkg.bookingType || 'Family Comfort',
      maxGuests: pkg.maxGuests || 8,
      category: pkg.category,
      duration: pkg.duration,
      price: pkg.price || 0,
      offerPrice: pkg.offerPrice || 0,
      packageCode: pkg.packageCode || '',
      pickup: pkg.pickup || '',
      shortDescription: pkg.shortDescription,
      fullDescription: pkg.fullDescription || '',
      imageUrl: pkg.imageUrl,
      packageBannerUrl: pkg.packageBannerUrl || '',
      galleryImages: (pkg.galleryImages || []).join('\n'),
      highlights: (pkg.highlights || []).join('\n'),
      thingsToCarry: (pkg.thingsToCarry || []).join('\n'),
      departureDates: (pkg.departureDates || []).join('\n'),
      faqs: (pkg.faqs || []).map((faq) => `${faq.question} | ${faq.answer}`).join('\n'),
      policies: (pkg.policies || []).join('\n'),
      activityId: pkg.activityId || '',
      seoTitle: pkg.seoTitle || '',
      seoDescription: pkg.seoDescription || '',
      featured: pkg.featured || false,
      active: pkg.active ?? true,
      status: pkg.status || (pkg.active ? 'Publish' : 'Draft'),
    });
    setItinerary(pkg.itinerary || []);
    setInclusions(pkg.inclusions || []);
    setExclusions(pkg.exclusions || []);
    setIsPkgFormOpen(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgFormData.title || !pkgFormData.destination || !pkgFormData.location || !pkgFormData.imageUrl) {
      alert('Please fill out Title, Destination, Location and provide a cover image.');
      return;
    }

    try {
      const parseListField = (value: string) => value
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);

      const parseFaqs = (value: string) => value
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const separatorIndex = line.indexOf('|');
          if (separatorIndex === -1) {
            return { question: line, answer: '' };
          }
          return {
            question: line.slice(0, separatorIndex).trim(),
            answer: line.slice(separatorIndex + 1).trim(),
          };
        })
        .filter((faq) => faq.question);

      const {
        galleryImages: galleryImagesInput,
        highlights: highlightsInput,
        thingsToCarry: thingsToCarryInput,
        departureDates: departureDatesInput,
        faqs: faqsInput,
        policies: policiesInput,
        ...restPkgFormData
      } = pkgFormData;

      const payload = {
        ...restPkgFormData,
        packageCode: pkgFormData.packageCode?.trim() || '',
        pickup: pkgFormData.pickup?.trim() || '',
        seoTitle: pkgFormData.seoTitle?.trim() || '',
        seoDescription: pkgFormData.seoDescription?.trim() || '',
        offerPrice: Number(pkgFormData.offerPrice) || undefined,
        packageBannerUrl: pkgFormData.packageBannerUrl?.trim() || '',
        galleryImages: parseListField(galleryImagesInput),
        highlights: parseListField(highlightsInput),
        thingsToCarry: parseListField(thingsToCarryInput),
        departureDates: parseListField(departureDatesInput),
        faqs: parseFaqs(faqsInput),
        policies: parseListField(policiesInput),
        status: pkgFormData.active ? 'Publish' : 'Draft',
        itinerary,
        inclusions,
        exclusions,
        updatedAt: new Date().toISOString(),
      };

      if (editingPkg) {
        // Edit document
        const docRef = doc(db, 'packages', editingPkg.id);
        await updateDoc(docRef, payload);
      } else {
        // Create document
        const colRef = collection(db, 'packages');
        await addDoc(colRef, {
          ...payload,
          createdAt: new Date().toISOString(),
        });
      }

      setIsPkgFormOpen(false);
      await onRefreshData();
    } catch (err) {
      console.error('Error saving package:', err);
      alert('Failed to save package document. Check firestore permissions.');
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to delete this travel package permanently?')) return;
    try {
      await deleteDoc(doc(db, 'packages', id));
      await onRefreshData();
    } catch (err: any) {
      console.error('Error deleting package:', err);
      alert(`Failed to delete package document: ${err.message || String(err)}`);
    }
  };

  const togglePackageActive = async (pkg: TravelPackage) => {
    try {
      const docRef = doc(db, 'packages', pkg.id);
      const nextActive = !pkg.active;
      await updateDoc(docRef, { active: nextActive, status: nextActive ? 'Publish' : 'Draft' });
      await onRefreshData();
    } catch (err) {
      console.error('Error toggling package status:', err);
    }
  };

  // Itinerary Row Operations
  const handleAddItineraryDay = () => {
    const nextDayNum = itinerary.length + 1;
    setItinerary((prev) => [...prev, { day: nextDayNum, title: '', description: '' }]);
  };

  const handleRemoveItineraryDay = (dayNum: number) => {
    const updated = itinerary
      .filter((day) => day.day !== dayNum)
      .map((day, index) => ({ ...day, day: index + 1 })); // Recalculate index
    setItinerary(updated);
  };

  const handleItineraryDayChange = (dayNum: number, field: 'title' | 'description', val: string) => {
    setItinerary((prev) =>
      prev.map((day) => (day.day === dayNum ? { ...day, [field]: val } : day))
    );
  };

  // Inclusion List Operations
  const handleAddInclusion = () => {
    if (!newInclusion.trim()) return;
    setInclusions((prev) => [...prev, newInclusion.trim()]);
    setNewInclusion('');
  };

  const handleRemoveInclusion = (idx: number) => {
    setInclusions((prev) => prev.filter((_, i) => i !== idx));
  };

  // Exclusion List Operations
  const handleAddExclusion = () => {
    if (!newExclusion.trim()) return;
    setExclusions((prev) => [...prev, newExclusion.trim()]);
    setNewExclusion('');
  };

  const handleRemoveExclusion = (idx: number) => {
    setExclusions((prev) => prev.filter((_, i) => i !== idx));
  };


  // ----------------------------------------------------
  // ENQUIRY STATUS UPDATES
  // ----------------------------------------------------
  const handleUpdateEnquiryStatus = async (enquiryId: string, newStatus: EnquiryStatus) => {
    try {
      const docRef = doc(db, 'enquiries', enquiryId);
      await updateDoc(docRef, { status: newStatus });
      // Keep detail modal updated
      if (activeEnquiry && activeEnquiry.id === enquiryId) {
        setActiveEnquiry((prev) => prev ? { ...prev, status: newStatus } : null);
      }
      await onRefreshData();
    } catch (err) {
      console.error('Error updating enquiry status:', err);
    }
  };

  const handleDeleteEnquiry = async (enquiryId: string) => {
    if (!confirm('Are you sure you want to delete this enquiry from record?')) return;
    try {
      await deleteDoc(doc(db, 'enquiries', enquiryId));
      setActiveEnquiry(null);
      await onRefreshData();
    } catch (err) {
      console.error('Error deleting enquiry:', err);
    }
  };


  // ----------------------------------------------------
  // GALLERY MANAGEMENT MUTATIONS
  // ----------------------------------------------------
  const handleAddGalleryImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryFormData.imageUrl) {
      alert('Please upload or enter an image URL first.');
      return;
    }

    try {
      const colRef = collection(db, 'gallery');
      await addDoc(colRef, {
        title: galleryFormData.title || 'Untitled Journey',
        category: galleryFormData.category,
        album: galleryFormData.album.trim(),
        imageUrl: galleryFormData.imageUrl,
        order: gallery.length,
        createdAt: new Date().toISOString(),
      });

      setGalleryFormData({ title: '', category: 'Pilgrimage', album: '', imageUrl: '' });
      setIsGalleryFormOpen(false);
      await onRefreshData();
    } catch (err) {
      console.error('Error saving gallery item:', err);
    }
  };

  const handleDeleteGalleryImage = async (id: string) => {
    if (!confirm('Delete this image from public gallery?')) return;
    try {
      await deleteDoc(doc(db, 'gallery', id));
      await onRefreshData();
    } catch (err) {
      console.error('Error deleting gallery item:', err);
    }
  };

  const handleStartEditGalleryImage = (img: GalleryImage) => {
    setEditingGalleryImage(img);
    setEditGalleryFormData({
      title: img.title,
      category: img.category,
      album: img.album || '',
    });
    setIsGalleryEditOpen(true);
  };

  const handleSaveEditGalleryImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGalleryImage) return;

    try {
      const docRef = doc(db, 'gallery', editingGalleryImage.id);
      await updateDoc(docRef, {
        title: editGalleryFormData.title.trim() || 'Untitled Journey',
        category: editGalleryFormData.category,
        album: editGalleryFormData.album.trim(),
      });

      setIsGalleryEditOpen(false);
      setEditingGalleryImage(null);
      await onRefreshData();
    } catch (err) {
      console.error('Error updating gallery item:', err);
      alert('Failed to update gallery image metadata.');
    }
  };

  // ----------------------------------------------------
  // MULTIPLE GALLERY IMAGES UPLOAD HANDLERS
  // ----------------------------------------------------
  const handleMultipleGalleryFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFilesList: typeof selectedGalleryFiles = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const compressed = await compressImage(file);
        // Clean title from filename
        const baseTitle = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const formattedTitle = baseTitle
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());
          
        newFilesList.push({
          file,
          preview: URL.createObjectURL(file),
          compressedBase64: compressed,
          title: formattedTitle,
        });
      } catch (err) {
        console.error('Error compressing file:', file.name, err);
      }
    }

    setSelectedGalleryFiles((prev) => [...prev, ...newFilesList]);
  };

  const handleBulkGalleryUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGalleryFiles.length === 0) {
      alert('Please select at least one photograph to upload.');
      return;
    }

    setIsUploadingMultiple(true);
    let successCount = 0;

    try {
      for (const item of selectedGalleryFiles) {
        let imageUrl = '';
        try {
          // Attempt Storage upload
          const blob = dataURItoBlob(item.compressedBase64);
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${item.file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
          const storagePath = `gallery/${fileName}`;
          const imageRef = ref(storage, storagePath);
          
          const snapshot = await uploadBytes(imageRef, blob);
          imageUrl = await getDownloadURL(snapshot.ref);
        } catch (error) {
          console.warn('Firebase Storage upload failed for item. Falling back to Base64 data-url.', error);
          imageUrl = item.compressedBase64;
        }

        // Add doc to Firestore
        const colRef = collection(db, 'gallery');
        await addDoc(colRef, {
          title: item.title.trim() || 'Untitled Journey',
          category: multipleUploadCategory,
          album: multipleUploadAlbum.trim(),
          imageUrl: imageUrl,
          order: gallery.length + successCount,
          createdAt: new Date().toISOString(),
        });
        successCount++;
      }

      alert(`Successfully uploaded ${successCount} photographs to the gallery!`);
      setSelectedGalleryFiles([]);
      setMultipleUploadAlbum('');
      setIsGalleryFormOpen(false);
      await onRefreshData();
    } catch (err) {
      console.error('Error in batch upload:', err);
      alert('An error occurred during bulk upload. Some files may not have saved.');
    } finally {
      setIsUploadingMultiple(false);
    }
  };

  const handleSaveWebsiteCMS = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setCmsSaving(true);
    try {
      await setDoc(doc(db, 'siteSettings', 'main'), {
        ...cmsFormData,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      await onRefreshData();
      alert('Website CMS settings saved successfully.');
    } catch (err: any) {
  console.error("CMS SAVE ERROR:", err);
  console.error("Code:", err.code);
  console.error("Message:", err.message);

  alert(`Error Code: ${err.code}\n\n${err.message}`);
}
  };

  const handleCmsImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'heroBackgroundImageUrl' | 'logoUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCmsUploadingField(field);
    try {
      const fileName = `${field}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const imageRef = ref(storage, `cms/${fileName}`);
      const snapshot = await uploadBytes(imageRef, file);
      const imageUrl = await getDownloadURL(snapshot.ref);
      const nextData = {
        ...cmsFormData,
        [field]: imageUrl,
        updatedAt: new Date().toISOString(),
      };
      setCmsFormData(nextData);
      await setDoc(doc(db, 'siteSettings', 'main'), nextData, { merge: true });
      await onRefreshData();
    } catch (err) {
      console.error('CMS image upload failed:', err);
      alert('Failed to upload CMS image.');
    } finally {
      setCmsUploadingField(null);
      e.target.value = '';
    }
  };

  const handleMediaLibraryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setMediaUploading(true);
    try {
      for (let idx = 0; idx < files.length; idx++) {
        const file = files[idx];
        const fileName = `${Date.now()}_${idx}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const imageRef = ref(storage, `gallery/${fileName}`);
        const snapshot = await uploadBytes(imageRef, file);
        const imageUrl = await getDownloadURL(snapshot.ref);
        const baseTitle = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        await addDoc(collection(db, 'gallery'), {
          title: baseTitle.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          category: mediaLibraryCategory === 'All' ? 'Pilgrimage' : mediaLibraryCategory,
          album: 'Media Library',
          imageUrl,
          order: gallery.length + idx,
          createdAt: new Date().toISOString(),
        });
      }
      await onRefreshData();
    } catch (err) {
      console.error('Media library upload failed:', err);
      alert('Failed to upload media library images.');
    } finally {
      setMediaUploading(false);
      e.target.value = '';
    }
  };

  const handleMoveGalleryImage = async (imageId: string, direction: 'up' | 'down') => {
    const currentIndex = gallery.findIndex((img) => img.id === imageId);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= gallery.length) return;

    const reordered = [...gallery];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    try {
      const batch = writeBatch(db);
      reordered.forEach((img, index) => {
        batch.update(doc(db, 'gallery', img.id), { order: index });
      });
      await batch.commit();
      await onRefreshData();
    } catch (err) {
      console.error('Failed to reorder gallery:', err);
      alert('Failed to reorder gallery images.');
    }
  };

  const navSections = [
    {
      label: 'Command Center',
      items: [
        { id: 'overview' as AdminTab, label: 'Dashboard', icon: LayoutDashboard, count: null },
        { id: 'website' as AdminTab, label: 'Website CMS', icon: Globe, count: null },
        { id: 'media-library' as AdminTab, label: 'Media Library', icon: Images, count: gallery.length },
        { id: 'analytics' as AdminTab, label: 'Analytics', icon: LineChartIcon, count: null },
        { id: 'settings' as AdminTab, label: 'Settings', icon: Settings, count: null },
      ],
    },
    {
      label: 'Operations',
      items: [
        { id: 'activities' as AdminTab, label: 'Activities', icon: Compass, count: activities.length },
        { id: 'packages' as AdminTab, label: 'Packages', icon: Package, count: packages.length },
        { id: 'bookings' as AdminTab, label: 'Bookings', icon: Calendar, count: bookings.length },
        { id: 'customers' as AdminTab, label: 'Customers', icon: Users, count: customers.length },
        { id: 'enquiries' as AdminTab, label: 'Enquiries', icon: FileText, count: enquiries.length },
        { id: 'reviews' as AdminTab, label: 'Reviews', icon: Star, count: adminReviews.length },
        { id: 'gallery' as AdminTab, label: 'Gallery CRUD', icon: ImageIcon, count: gallery.length },
        { id: 'blogs' as AdminTab, label: 'Blog CMS', icon: FileText, count: blogPosts.length },
      ],
    },
  ];

  const activeNavItem = navSections.flatMap((section) => section.items).find((item) => item.id === activeTab);

  const dashboardStats = [
    { label: 'Total Packages', value: metrics.totalPackages, description: 'Live catalogue items', icon: Package, tone: 'from-[#4DA528]/12 to-white', trend: '+3 this month' },
    { label: 'Total Bookings', value: metrics.totalBookingsCount, description: 'All booking requests', icon: Calendar, tone: 'from-sky-500/12 to-white', trend: 'Updated live' },
    { label: 'Pending Bookings', value: metrics.pendingBookingsCount, description: 'Awaiting confirmation', icon: Clock, tone: 'from-amber-500/14 to-white', trend: 'Needs attention' },
    { label: 'Confirmed Bookings', value: metrics.confirmedBookingsCount, description: 'Ready for travel', icon: CheckCircle, tone: 'from-emerald-500/12 to-white', trend: 'Healthy pipeline' },
    { label: 'Cancelled Bookings', value: metrics.cancelledBookingsCount, description: 'Cancelled requests', icon: X, tone: 'from-rose-500/12 to-white', trend: 'Watch churn' },
    { label: 'Total Customers', value: metrics.totalCustomers, description: 'Bookings + enquiries', icon: Users, tone: 'from-violet-500/12 to-white', trend: 'Growing steadily' },
    { label: 'Wishlist Saves', value: metrics.wishlistSaves, description: 'Packages saved by travelers', icon: Heart, tone: 'from-rose-500/12 to-white', trend: 'Top intent signal' },
    { label: 'Estimated Revenue', value: formatPrice(metrics.estimatedRevenue), description: 'Confirmed trip value', icon: DollarSign, tone: 'from-[#071d28]/10 to-white', trend: 'Forecast ready' },
  ];

  const quickActions = [
    { label: 'Add Package', icon: Plus, action: handleOpenPkgAdd, tone: 'bg-[#4DA528] text-white hover:bg-[#FF970D]' },
    { label: 'View Bookings', icon: Calendar, action: () => setActiveTab('bookings'), tone: 'bg-stone-950 text-white hover:bg-stone-800' },
    { label: 'Customers', icon: Users, action: () => setActiveTab('bookings'), tone: 'bg-white text-stone-700 hover:text-[#4DA528] border border-stone-200' },
    { label: 'Reports', icon: LineChartIcon, action: () => setActiveTab('analytics'), tone: 'bg-[#f7f8f3] text-stone-700 hover:text-[#4DA528] border border-stone-200' },
    { label: 'Settings', icon: Settings, action: () => setActiveTab('settings'), tone: 'bg-white text-stone-700 hover:text-[#4DA528] border border-stone-200' },
  ];

  const mediaLibraryCategories = useMemo(() => ['All', ...uniqueCategories], [uniqueCategories]);
  const mediaLibraryImages = useMemo(() => {
    return gallery.filter((img) => {
      const term = mediaLibrarySearch.toLowerCase();
      const matchesSearch = !term ||
        img.title.toLowerCase().includes(term) ||
        img.category.toLowerCase().includes(term) ||
        (img.album || '').toLowerCase().includes(term);
      const matchesCategory = mediaLibraryCategory === 'All' || img.category === mediaLibraryCategory;
      return matchesSearch && matchesCategory;
    });
  }, [gallery, mediaLibrarySearch, mediaLibraryCategory]);

  const recentBookings = [...bookings].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 10);

  const topDestinations = useMemo(() => {
    const counts = bookings.reduce<Record<string, number>>((acc, booking) => {
      const destination = String(booking.destination || booking.packageTitle || 'Uncategorized').trim();
      acc[destination] = (acc[destination] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [bookings]);

  const topWishlistPackages = useMemo(() => {
    const counts = wishlistItems.reduce<Record<string, number>>((acc, item) => {
      const packageId = String(item.packageId || '').trim();
      if (!packageId) return acc;
      acc[packageId] = (acc[packageId] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([packageId, count]) => {
        const matchedPackage = packages.find((pkg) => pkg.id === packageId);
        return {
          name: matchedPackage?.title || 'Saved Package',
          count,
        };
      });
  }, [wishlistItems, packages]);

  const recentCustomers = useMemo(() => {
    const rows = bookings
      .map((booking) => ({
        name: String(booking.customerName || booking.userName || 'Traveler').trim(),
        email: String(booking.customerEmail || booking.email || '').trim(),
        joinedAt: booking.createdAt || new Date().toISOString(),
      }))
      .filter((entry) => entry.email || entry.name);

    return rows.slice(0, 5);
  }, [bookings]);

  const upcomingTrips = useMemo(() => {
    const now = new Date();
    const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return bookings
      .filter((booking) => {
        if (!booking.travelDate) return false;
        const travelDate = new Date(booking.travelDate);
        return !Number.isNaN(travelDate.getTime()) && travelDate >= now && travelDate <= next30Days;
      })
      .sort((a, b) => new Date(a.travelDate).getTime() - new Date(b.travelDate).getTime())
      .slice(0, 6);
  }, [bookings]);

  const adminActivity = useMemo(() => {
    const items = [
      ...packages.map((pkg) => ({
        title: 'Package Added',
        subtitle: pkg.title,
        time: pkg.createdAt,
      })),
      ...bookings
        .filter((booking) => ['Confirmed', 'Completed', 'Trip Completed', 'Cancelled'].includes(String(booking.bookingStatus || booking.status || 'Pending').trim()))
        .map((booking) => ({
          title: String(booking.bookingStatus || booking.status || 'Pending').trim() === 'Cancelled' ? 'Booking Cancelled' : 'Booking Confirmed',
          subtitle: booking.packageTitle || 'A travel request',
          time: booking.updatedAt || booking.createdAt,
        })),
      ...bookings
        .filter((booking) => booking.updatedAt && booking.updatedAt !== booking.createdAt)
        .map((booking) => ({
          title: 'Status Changed',
          subtitle: `${booking.packageTitle || 'Travel request'} • ${String(booking.bookingStatus || booking.status || 'Pending').trim()}`,
          time: booking.updatedAt,
        })),
    ];

    return items.sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime()).slice(0, 8);
  }, [packages, bookings]);


  return (
    <div id="admin-dashboard-layout" className="min-h-screen bg-[#f4f6f0] text-stone-800 animate-fade-in">
      
      {/* 1. Premium Admin Shell */}
      <div className="flex min-h-screen">
        
        {/* Navigation Sidebar */}
        <aside className={`${isSidebarCollapsed ? 'w-[88px]' : 'w-[292px]'} hidden shrink-0 border-r border-white/10 bg-[#071d28] text-white shadow-[18px_0_50px_rgba(7,29,40,0.16)] transition-all duration-300 lg:flex lg:flex-col`}>
          <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
            <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#4DA528] text-white shadow-lg">
                <Compass className="h-5 w-5 animate-spin-slow" />
              </div>
              {!isSidebarCollapsed && (
                <div>
                  <h1 className="font-serif text-lg font-normal tracking-tight">Pravaah CMS</h1>
                  <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.22em] text-white/45">Travel Control Suite</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden rounded-[10px] border border-white/10 p-2 text-white/65 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DA528]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071d28] lg:inline-flex"
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
            {navSections.map((section) => (
              <div key={section.label} className="space-y-2">
                {!isSidebarCollapsed && (
                  <p className="px-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/35">{section.label}</p>
                )}
                {section.items.map((item) => {
                  const NavIcon = item.icon;
                  const selected = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`group flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left text-xs font-extrabold uppercase tracking-[0.08em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DA528]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071d28] ${
                        selected
                          ? 'bg-[#4DA528] text-white shadow-[0_14px_35px_rgba(77,165,40,0.3)]'
                          : 'text-white/62 hover:bg-white/10 hover:text-white'
                      } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                      title={item.label}
                    >
                      <NavIcon className="h-4.5 w-4.5 shrink-0" />
                      {!isSidebarCollapsed && (
                        <>
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          {item.count !== null && (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] ${selected ? 'bg-white/20 text-white' : 'bg-white/8 text-white/50'}`}>
                              {item.count}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 p-4">
            <div className={`rounded-[18px] border border-white/10 bg-white/8 p-4 ${isSidebarCollapsed ? 'hidden' : ''}`}>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#FF970D]">Operator</span>
              <p className="mt-2 truncate text-sm font-bold text-white">{adminEmail}</p>
              <button
                type="button"
                onClick={onLogout}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[5px] bg-white/10 px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-white transition-all duration-200 hover:bg-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071d28]"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          </div>

        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Premium Header Bar */}
          <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-white/88 px-4 py-4 shadow-[0_12px_35px_rgba(18,38,32,0.06)] backdrop-blur-xl sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] border border-stone-200 bg-white text-stone-700 shadow-sm transition hover:border-[#4DA528] hover:text-[#4DA528] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DA528]/30 focus-visible:ring-offset-2 lg:hidden"
                  onClick={() => setIsSidebarCollapsed(false)}
                  title="Admin navigation"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#4DA528]">Admin Workspace</span>
                  <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-stone-950 sm:text-3xl">{activeNavItem?.label || 'Dashboard'}</h2>
                </div>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative w-full min-w-0 md:w-[340px]">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    placeholder="Search CMS, leads, packages..."
                    className="h-11 w-full rounded-[14px] border border-stone-200 bg-[#f7f8f3] pl-11 pr-4 text-sm outline-none transition focus:border-[#4DA528] focus:bg-white focus-visible:ring-2 focus-visible:ring-[#4DA528]/20"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={onNavigatePublic}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-[12px] border border-stone-200 bg-white px-4 text-xs font-extrabold uppercase tracking-wider text-stone-700 transition hover:border-[#4DA528] hover:text-[#4DA528] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DA528]/30 focus-visible:ring-offset-2"
                  >
                    <Globe className="h-4 w-4" />
                    <span className="hidden sm:inline">View Site</span>
                  </button>
                  <button
                    type="button"
                    className="relative inline-flex h-11 w-11 items-center justify-center rounded-[12px] border border-stone-200 bg-white text-stone-700 transition hover:border-[#4DA528] hover:text-[#4DA528] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DA528]/30 focus-visible:ring-offset-2"
                    title="Notifications"
                  >
                    <Bell className="h-4.5 w-4.5" />
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#FF970D]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('activities')}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] border border-stone-200 bg-white text-stone-700 transition hover:border-[#4DA528] hover:text-[#4DA528] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DA528]/30 focus-visible:ring-offset-2"
                    title="Activities quick actions"
                  >
                    <Settings className="h-4.5 w-4.5" />
                  </button>
                  <div className="flex h-11 items-center gap-3 rounded-[14px] bg-stone-950 px-3 text-white shadow-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4DA528] text-xs font-extrabold">
                      {adminEmail?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div className="hidden text-left sm:block">
                      <span className="block text-[9px] font-extrabold uppercase tracking-wider text-white/45">Admin</span>
                      <span className="block max-w-[150px] truncate text-xs font-bold">{adminEmail}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {navSections.flatMap((section) => section.items).map((item) => {
                const NavIcon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[11px] font-extrabold uppercase tracking-wider transition ${
                      activeTab === item.id ? 'bg-[#4DA528] text-white' : 'bg-white text-stone-600'
                    }`}
                  >
                    <NavIcon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </header>

        {/* Dynamic Display Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 xl:p-8">
          
          {/* ==================================================== */}
          {/* TAB 1: OVERVIEW */}
          {/* ==================================================== */}
          {activeTab === 'overview' && (
            <Suspense fallback={<div className="rounded-[20px] border border-stone-200 bg-white p-8 text-sm text-stone-500">Loading dashboard overview…</div>}>
              <OverviewTab
                recentBookings={recentBookings}
                bookings={bookings}
                adminReviews={adminReviews}
                metrics={metrics}
                formatPriceValue={(value) => formatPrice(value)}
                quickActions={quickActions}
                dashboardStats={dashboardStats}
                setActiveTab={setActiveTab}
                setActiveBooking={setActiveBooking}
                setAssignee={setAssignee}
                setFollowUpDate={setFollowUpDate}
              />
            </Suspense>
          )}

          {/* ==================================================== */}
          {/* TAB 1B: WEBSITE CMS PLACEHOLDERS */}
          {/* ==================================================== */}
          {activeTab === 'website' && (
            <Suspense fallback={<div className="rounded-[20px] border border-stone-200 bg-white p-8 text-sm text-stone-500">Loading website CMS…</div>}>
              <WebsiteTab
                cmsFormData={cmsFormData}
                setCmsFormData={setCmsFormData}
                cmsSaving={cmsSaving}
                cmsUploadingField={cmsUploadingField}
                handleSaveWebsiteCMS={handleSaveWebsiteCMS}
                handleCmsImageUpload={handleCmsImageUpload}
                onRefreshData={onRefreshData}
                packages={packages}
              />
            </Suspense>
          )}

          {/* ==================================================== */}
          {/* TAB 1C: ACTIVITIES */}
          {/* ==================================================== */}
          {activeTab === 'activities' && (
            <Suspense fallback={<div className="rounded-[20px] border border-stone-200 bg-white p-8 text-sm text-stone-500">Loading activities manager…</div>}>
              <ActivitiesTab
                packages={packages}
                onRefreshData={onRefreshData}
              />
            </Suspense>
          )}

          {/* ==================================================== */}
          {/* TAB 1D: MEDIA LIBRARY */}
          {/* ==================================================== */}
          {activeTab === 'media-library' && (
            <Suspense fallback={<div className="rounded-[20px] border border-stone-200 bg-white p-8 text-sm text-stone-500">Loading media library…</div>}>
              <MediaLibraryTab
                mediaLibrarySearch={mediaLibrarySearch}
                setMediaLibrarySearch={setMediaLibrarySearch}
                mediaLibraryCategory={mediaLibraryCategory}
                setMediaLibraryCategory={setMediaLibraryCategory}
                mediaLibraryCategories={mediaLibraryCategories}
                mediaLibraryImages={mediaLibraryImages}
                mediaUploading={mediaUploading}
                handleMediaLibraryUpload={handleMediaLibraryUpload}
                handleMoveGalleryImage={handleMoveGalleryImage}
                handleDeleteGalleryImage={handleDeleteGalleryImage}
              />
            </Suspense>
          )}

          {/* ==================================================== */}
          {/* TAB 2: PACKAGES */}
          {/* ==================================================== */}
          {activeTab === 'packages' && (
            <Suspense fallback={<div className="rounded-[20px] border border-stone-200 bg-white p-8 text-sm text-stone-500">Loading package manager…</div>}>
              <PackagesTab
                packages={packages}
                packageSearch={packageSearch}
                setPackageSearch={setPackageSearch}
                handleOpenPkgAdd={handleOpenPkgAdd}
                handleOpenPkgEdit={handleOpenPkgEdit}
                handleDeletePackage={handleDeletePackage}
                togglePackageActive={togglePackageActive}
                formatPriceValue={(value) => formatPrice(value)}
              />
            </Suspense>
          )}

          {/* ==================================================== */}
          {/* TAB 3: ENQUIRIES */}
          {/* ==================================================== */}
          {activeTab === 'enquiries' && (
            <Suspense fallback={<div className="rounded-[20px] border border-stone-200 bg-white p-8 text-sm text-stone-500">Loading enquiries…</div>}>
              <EnquiriesTab
                enquiries={enquiries}
                filteredEnquiries={filteredEnquiries}
                enquirySearch={enquirySearch}
                setEnquirySearch={setEnquirySearch}
                enquiryStatusFilter={enquiryStatusFilter}
                setEnquiryStatusFilter={setEnquiryStatusFilter}
                enquiryMonthFilter={enquiryMonthFilter}
                setEnquiryMonthFilter={setEnquiryMonthFilter}
                uniqueEnquiryMonths={uniqueEnquiryMonths}
                handleExportCSV={handleExportCSV}
              />
            </Suspense>
          )}

          {/* ==================================================== */}
          {/* TAB 4: GALLERY */}
          {/* ==================================================== */}
          {activeTab === 'gallery' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif font-normal text-stone-900 tracking-tight">Manage Media Gallery</h2>
                  <p className="text-xs text-stone-500 font-light">Organize, rename, search, and upload multiple high-resolution photos with client-side compression.</p>
                </div>
                <button
                  onClick={() => {
                    setGalleryUploadMode('single');
                    setIsGalleryFormOpen(true);
                  }}
                  className="px-4 py-2.5 bg-[#008080] hover:bg-[#006666] text-white text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008080]/30 focus-visible:ring-offset-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload Media / CMS</span>
                </button>
              </div>

              {/* SEARCH & FILTERS BAR */}
              <div className="bg-white p-4 border border-stone-200 rounded shadow-3xs grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative md:col-span-2">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search by photo title, album or category..."
                    value={gallerySearch}
                    onChange={(e) => setGallerySearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded text-xs transition focus:outline-none focus:border-[#008080] focus-visible:ring-2 focus-visible:ring-[#008080]/20"
                  />
                  {gallerySearch && (
                    <button
                      onClick={() => setGallerySearch('')}
                      className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div>
                  <select
                    value={galleryAlbumFilter}
                    onChange={(e) => setGalleryAlbumFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] cursor-pointer"
                  >
                    <option value="All">All Albums ({uniqueAlbums.length})</option>
                    {uniqueAlbums.map((alb) => (
                      <option key={alb} value={alb}>
                        {alb}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={galleryCategoryFilter}
                    onChange={(e) => setGalleryCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] cursor-pointer"
                  >
                    <option value="All">All Categories</option>
                    <option value="Pilgrimage">Pilgrimage</option>
                    <option value="Treks">Treks</option>
                    <option value="Adventure">Adventure</option>
                    <option value="Himachal">Himachal</option>
                    <option value="Ladakh">Ladakh</option>
                    <option value="Uttarakhand">Uttarakhand</option>
                    {uniqueCategories
                      .filter((cat) => !['Pilgrimage', 'Treks', 'Adventure', 'Himachal', 'Ladakh', 'Uttarakhand'].includes(cat))
                      .map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Gallery Image List Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {filteredGalleryImages.map((img) => (
                  <div 
                    key={img.id} 
                    className="bg-white border border-stone-200 rounded overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div className="relative h-44 bg-[#f8f7f4] overflow-hidden">
                      <img 
                        src={img.imageUrl} 
                        alt={img.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                        loading="lazy" // Lazy Loading requirement
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleStartEditGalleryImage(img)}
                          className="p-2 bg-white hover:bg-stone-100 text-stone-850 rounded shadow transition cursor-pointer"
                          title="Rename & Edit Metadata"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteGalleryImage(img.id)}
                          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded shadow transition cursor-pointer"
                          title="Delete Image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[9px] font-bold text-[#008080] uppercase tracking-wider block bg-[#008080]/10 px-1.5 py-0.5 rounded">
                          {img.category}
                        </span>
                        {img.album && (
                          <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider block bg-stone-100 px-1.5 py-0.5 rounded">
                            📂 {img.album}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-serif font-medium text-stone-900 line-clamp-1" title={img.title}>
                        {img.title}
                      </h4>
                      <div className="flex md:hidden items-center gap-3 pt-1 border-t border-stone-100">
                        <button
                          onClick={() => handleStartEditGalleryImage(img)}
                          className="text-[10px] text-[#008080] hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteGalleryImage(img.id)}
                          className="text-[10px] text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredGalleryImages.length === 0 && (
                  <div className="col-span-full py-16 text-center text-stone-400 italic font-light">
                    {gallery.length === 0 
                      ? 'The gallery is empty. Click Upload Media to add your first photo!'
                      : 'No gallery images match your active search filters.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 5: CUSTOMER BOOKINGS */}
          {/* ==================================================== */}
          {activeTab === 'bookings' && (
            <Suspense fallback={<div className="rounded-[20px] border border-stone-200 bg-white p-8 text-sm text-stone-500">Loading bookings CRM…</div>}>
              <BookingsTab
                bookings={bookings}
                bookingsLoading={bookingsLoading}
                filteredBookings={filteredBookings}
                bookingSearch={bookingSearch}
                setBookingSearch={setBookingSearch}
                bookingStatusFilter={bookingStatusFilter}
                setBookingStatusFilter={setBookingStatusFilter}
                bookingPackageFilter={bookingPackageFilter}
                setBookingPackageFilter={setBookingPackageFilter}
                bookingMonthFilter={bookingMonthFilter}
                setBookingMonthFilter={setBookingMonthFilter}
                uniqueBookingPackages={uniqueBookingPackages}
                uniqueBookingMonths={uniqueBookingMonths}
                fetchAllBookings={fetchAllBookings}
                handleExportBookingsCSV={handleExportBookingsCSV}
                handleAssignStaff={handleAssignStaff}
                handleUpdateFollowUpDate={handleUpdateFollowUpDate}
                handleUpdateBookingStatus={handleUpdateBookingStatus}
                handleDeleteBooking={handleDeleteBooking}
                activeBooking={activeBooking}
                setActiveBooking={setActiveBooking}
                newNote={newNote}
                setNewNote={setNewNote}
                assignee={assignee}
                setAssignee={setAssignee}
                followUpDate={followUpDate}
                setFollowUpDate={setFollowUpDate}
                handleAddNote={handleAddNote}
                bookingFeedback={bookingFeedback}
                bookingActionBusy={bookingActionBusy}
              />
            </Suspense>
          )}

          {/* ==================================================== */}
          {/* TAB 5B: CUSTOMER DIRECTORY */}
          {/* ==================================================== */}
          {activeTab === 'customers' && (
            <Suspense fallback={<div className="rounded-[20px] border border-stone-200 bg-white p-8 text-sm text-stone-500">Loading customer directory…</div>}>
              <CustomersTab
                customers={filteredCustomers}
                customersLoading={customersLoading}
                customerSearch={customerSearch}
                setCustomerSearch={setCustomerSearch}
                customerDestinationFilter={customerDestinationFilter}
                setCustomerDestinationFilter={setCustomerDestinationFilter}
                uniqueCustomerDestinations={uniqueCustomerDestinations}
                handleExportCustomersExcel={handleExportCustomersExcel}
                fetchCustomerProfiles={fetchCustomerProfiles}
              />
            </Suspense>
          )}

          {/* ==================================================== */}
          {/* TAB 6: REVIEWS MANAGEMENT */}
          {/* ==================================================== */}
          {activeTab === 'reviews' && (
            <Suspense fallback={<div className="rounded-[20px] border border-stone-200 bg-white p-8 text-sm text-stone-500">Loading reviews…</div>}>
              <ReviewsTab
                filteredAdminReviews={filteredAdminReviews}
                reviewsLoading={reviewsLoading}
                reviewSearch={reviewSearch}
                setReviewSearch={setReviewSearch}
                reviewStatusFilter={reviewStatusFilter}
                setReviewStatusFilter={setReviewStatusFilter}
                reviewRatingFilter={reviewRatingFilter}
                setReviewRatingFilter={setReviewRatingFilter}
                fetchAdminReviews={fetchAdminReviews}
                handleReviewFeaturedToggle={handleReviewFeaturedToggle}
                handleReviewStatusUpdate={handleReviewStatusUpdate}
                handleDeleteReview={handleDeleteReview}
                activeReviewForReply={activeReviewForReply}
                setActiveReviewForReply={setActiveReviewForReply}
                replyText={replyText}
                setReplyText={setReplyText}
                isReplyModalOpen={isReplyModalOpen}
                setIsReplyModalOpen={setIsReplyModalOpen}
                handleReviewReplySubmit={handleReviewReplySubmit}
              />
            </Suspense>
          )}

          {/* ==================================================== */}
          {/* TAB 7: BLOG CMS */}
          {/* ==================================================== */}
          {activeTab === 'blogs' && (
            <Suspense fallback={<div className="rounded-[20px] border border-stone-200 bg-white p-8 text-sm text-stone-500">Loading blog CMS…</div>}>
              <BlogsTab
                filteredBlogPosts={filteredBlogPosts}
                blogsLoading={blogsLoading}
                blogSearch={blogSearch}
                setBlogSearch={setBlogSearch}
                blogStatusFilter={blogStatusFilter}
                setBlogStatusFilter={setBlogStatusFilter}
                handleEditBlogPost={handleEditBlogPost}
                handleDeleteBlogPost={handleDeleteBlogPost}
                setActiveBlogPost={setActiveBlogPost}
                setBlogFormData={setBlogFormData}
                setIsBlogFormOpen={setIsBlogFormOpen}
              />
            </Suspense>
          )}

          {/* ==================================================== */}
          {/* TAB 8: ANALYTICS DASHBOARD */}
          {/* ==================================================== */}
          {activeTab === 'analytics' && (
            <Suspense fallback={<div className="rounded-[20px] border border-stone-200 bg-white p-8 text-sm text-stone-500">Loading analytics…</div>}>
              <AnalyticsTab
                analyticsEvents={analyticsEvents}
                analyticsLoading={analyticsLoading}
                fetchAnalyticsData={fetchAnalyticsData}
                enquiries={enquiries}
                bookings={bookings}
                adminReviews={adminReviews}
              />
            </Suspense>
          )}

          {activeTab === 'settings' && (
            <Suspense fallback={<div className="rounded-[20px] border border-stone-200 bg-white p-8 text-sm text-stone-500">Loading settings…</div>}>
              <SettingsTab
                settingsFormData={settingsFormData}
                setSettingsFormData={setSettingsFormData}
                settingsSaving={settingsSaving}
                settingsLoading={settingsLoading}
                handleSaveAdminSettings={handleSaveAdminSettings}
              />
            </Suspense>
          )}

        </main>
      </div>
      </div>

      {/* ==================================================== */}
      {/* DIALOG A: PACKAGE ADD/EDIT FORM (FULLSCREEN SLIDEOVER) */}
      {/* ==================================================== */}
      {isPkgFormOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex justify-end animate-fade-in">
          <div className="w-full max-w-3xl bg-white h-full flex flex-col justify-between shadow-2xl p-6 sm:p-8 overflow-y-auto space-y-6">
            
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <h3 className="text-xl font-serif font-normal text-[#333333] flex items-center gap-2">
                <Package className="w-6 h-6 text-[#008080] animate-spin-slow" />
                <span>{editingPkg ? 'Edit Travel Package' : 'Publish New Travel Package'}</span>
              </h3>
              <button 
                onClick={() => setIsPkgFormOpen(false)}
                className="p-1.5 hover:bg-stone-100 text-stone-400 hover:text-stone-900 rounded-full cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form id="pkg-form" onSubmit={handleSavePackage} className="space-y-6 flex-1 pr-1">
              <div className="rounded-[20px] border border-stone-200 bg-[#f8f7f4] p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Package CMS</p>
                    <h4 className="mt-1 text-lg font-serif font-normal text-stone-900">{pkgFormData.title || 'Untitled package'}</h4>
                    <p className="mt-1 text-sm text-stone-600">{pkgFormData.destination || 'Set the destination, pricing, and publishing details for this trip.'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${pkgFormData.active ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-700'}`}>
                      {pkgFormData.active ? 'Live' : 'Draft'}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${pkgFormData.featured ? 'bg-amber-100 text-amber-700' : 'bg-white text-stone-600'}`}>
                      {pkgFormData.featured ? 'Featured' : 'Standard'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    { id: 'general', label: 'General' },
                    { id: 'pricing', label: 'Pricing & Media' },
                    { id: 'content', label: 'Content & Itinerary' },
                    { id: 'seo', label: 'SEO & Publishing' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPackageCmsTab(tab.id as 'general' | 'pricing' | 'content' | 'seo')}
                      className={`rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition ${packageCmsTab === tab.id ? 'bg-[#008080] text-white shadow-sm' : 'bg-white text-stone-600 hover:bg-stone-100'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {packageCmsTab === 'general' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Package Title *</label>
                      <input type="text" required placeholder="E.g. Himalayan Serenade - Leh Ladakh" value={pkgFormData.title} onChange={(e) => setPkgFormData((prev) => ({ ...prev, title: e.target.value }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm text-stone-850 focus:outline-none focus:border-[#008080] font-medium" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Destination *</label>
                      <input type="text" required placeholder="E.g. South Goa, India" value={pkgFormData.destination} onChange={(e) => setPkgFormData((prev) => ({ ...prev, destination: e.target.value }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm text-stone-850 focus:outline-none focus:border-[#008080] font-medium" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Location *</label>
                      <select required value={pkgFormData.location} onChange={(e) => setPkgFormData((prev) => ({ ...prev, location: e.target.value }))} className="w-full px-3 py-2 bg-white border border-stone-200 rounded-sm text-sm text-stone-700 focus:outline-none focus:border-[#008080] font-medium cursor-pointer">
                        {PACKAGE_LOCATIONS.map((location) => (<option key={location} value={location}>{location}</option>))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Category *</label>
                      <select value={pkgFormData.category} onChange={(e) => setPkgFormData((prev) => ({ ...prev, category: e.target.value as DestinationCategory }))} className="w-full px-3 py-2 bg-white border border-stone-200 rounded-sm text-sm text-stone-700 focus:outline-none focus:border-[#008080] font-medium cursor-pointer">
                        <option value="Pilgrimage">Pilgrimage</option>
                        <option value="Treks">Treks</option>
                        <option value="Adventure">Adventure</option>
                        <option value="Himachal">Himachal</option>
                        <option value="Ladakh">Ladakh</option>
                        <option value="Uttarakhand">Uttarakhand</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Booking Type</label>
                      <select value={pkgFormData.bookingType} onChange={(e) => setPkgFormData((prev) => ({ ...prev, bookingType: e.target.value }))} className="w-full px-3 py-2 bg-white border border-stone-200 rounded-sm text-sm text-stone-700 focus:outline-none focus:border-[#008080] font-medium cursor-pointer">
                        <option value="Bespoke Luxury">Bespoke Luxury</option>
                        <option value="Family Comfort">Family Comfort</option>
                        <option value="Sacred Slow Travel">Sacred Slow Travel</option>
                        <option value="Adventure Led">Adventure Led</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Max Guests</label>
                      <input type="number" min="1" value={pkgFormData.maxGuests} onChange={(e) => setPkgFormData((prev) => ({ ...prev, maxGuests: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm text-stone-850 focus:outline-none focus:border-[#008080] font-medium" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Duration *</label>
                      <input type="text" required placeholder="E.g. 5 Days / 4 Nights" value={pkgFormData.duration} onChange={(e) => setPkgFormData((prev) => ({ ...prev, duration: e.target.value }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm text-stone-850 focus:outline-none focus:border-[#008080] font-medium" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Price per Person (INR, ₹) *</label>
                      <input type="number" required min="0" value={pkgFormData.price} onChange={(e) => setPkgFormData((prev) => ({ ...prev, price: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm text-stone-850 focus:outline-none focus:border-[#008080] font-medium" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Package Code</label>
                      <input type="text" placeholder="e.g. PKG-LEH-01" value={pkgFormData.packageCode} onChange={(e) => setPkgFormData((prev) => ({ ...prev, packageCode: e.target.value }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm text-stone-850 focus:outline-none focus:border-[#008080] font-medium" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Pickup / Meeting Point</label>
                      <input type="text" placeholder="Delhi Airport / Dehradun" value={pkgFormData.pickup} onChange={(e) => setPkgFormData((prev) => ({ ...prev, pickup: e.target.value }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm text-stone-850 focus:outline-none focus:border-[#008080] font-medium" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Related Homepage Activity</label>
                    <select value={pkgFormData.activityId} onChange={(e) => setPkgFormData((prev) => ({ ...prev, activityId: e.target.value }))} className="w-full px-3 py-2 bg-white border border-stone-200 rounded-sm text-sm text-stone-700 focus:outline-none focus:border-[#008080] font-medium cursor-pointer">
                      <option value="">None</option>
                      {activities.map((activity) => (<option key={activity.id} value={activity.id}>{activity.title}</option>))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Short Summary Description *</label>
                    <input type="text" required placeholder="One sentence hook summarizing this package..." value={pkgFormData.shortDescription} maxLength={180} onChange={(e) => setPkgFormData((prev) => ({ ...prev, shortDescription: e.target.value }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm text-stone-850 focus:outline-none focus:border-[#008080] font-medium" />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Full Story / Description</label>
                    <textarea rows={4} placeholder="Full background itinerary description, hotels, vibes..." value={pkgFormData.fullDescription} onChange={(e) => setPkgFormData((prev) => ({ ...prev, fullDescription: e.target.value }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm text-stone-850 focus:outline-none focus:border-[#008080] font-medium" />
                  </div>
                </div>
              )}

              {packageCmsTab === 'pricing' && (
                <div className="space-y-4">
                  <div className="space-y-3 bg-[#f8f7f4] p-4 rounded-sm border border-stone-200">
                    <span className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider">Package Cover Image *</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="border-2 border-dashed border-stone-200 rounded-sm p-4 text-center hover:border-[#008080] transition relative bg-white">
                        <input type="file" accept="image/*" onChange={(e) => handleImageFileChange(e, 'package')} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <Upload className="w-6 h-6 text-stone-400 mx-auto mb-2" />
                        <span className="text-xs text-stone-600 block font-semibold">{uploadingImage ? 'Uploading image...' : 'Drag / click to upload cover'}</span>
                        <span className="text-[10px] text-stone-400">Supports PNG, JPG, WEBP</span>
                      </div>
                      <div className="space-y-1 flex flex-col justify-center">
                        <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-wider">Or Enter Public Image URL</label>
                        <input type="text" placeholder="https://images.unsplash.com/..." value={pkgFormData.imageUrl} onChange={(e) => setPkgFormData((prev) => ({ ...prev, imageUrl: e.target.value }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-xs text-stone-850 focus:outline-none focus:border-[#008080] font-medium bg-white" />
                      </div>
                    </div>
                    {pkgFormData.imageUrl && (
                      <div className="relative w-full h-32 rounded-sm overflow-hidden border border-stone-200 mt-2 bg-stone-100">
                        <img src={pkgFormData.imageUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Offer Price (Optional)</label>
                      <input type="number" min="0" value={pkgFormData.offerPrice} onChange={(e) => setPkgFormData((prev) => ({ ...prev, offerPrice: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm text-stone-850 focus:outline-none focus:border-[#008080] font-medium" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Banner Image URL</label>
                      <input type="text" placeholder="Optional high-res hero image" value={pkgFormData.packageBannerUrl} onChange={(e) => setPkgFormData((prev) => ({ ...prev, packageBannerUrl: e.target.value }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm text-stone-850 focus:outline-none focus:border-[#008080] font-medium" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Gallery Images (one per line)</label>
                    <textarea rows={3} placeholder="Paste image URLs, one per line" value={pkgFormData.galleryImages} onChange={(e) => setPkgFormData((prev) => ({ ...prev, galleryImages: e.target.value }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm text-stone-850 focus:outline-none focus:border-[#008080] font-medium" />
                  </div>
                </div>
              )}

              {packageCmsTab === 'content' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Highlights (one per line)</label>
                    <textarea rows={3} placeholder="Add highlight points, one per line" value={pkgFormData.highlights} onChange={(e) => setPkgFormData((prev) => ({ ...prev, highlights: e.target.value }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm text-stone-850 focus:outline-none focus:border-[#008080] font-medium" />
                  </div>

                  <div className="space-y-4 border-t border-stone-100 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="block text-xs font-bold text-stone-800 uppercase tracking-wider">Day-Wise Itinerary Planning</span>
                      <button type="button" onClick={handleAddItineraryDay} className="px-3 py-1 bg-stone-100 text-stone-700 hover:bg-[#008080] hover:text-white text-[10px] font-bold uppercase tracking-wider rounded-sm transition cursor-pointer flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Itinerary Day</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {itinerary.map((itIn) => (
                        <div key={itIn.day} className="bg-[#f8f7f4] p-4 border border-stone-200 rounded-sm space-y-3 relative">
                          <button type="button" onClick={() => handleRemoveItineraryDay(itIn.day)} className="absolute top-3 right-3 text-stone-400 hover:text-red-500 cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 bg-stone-900 text-white font-bold text-xs rounded-none flex items-center justify-center shrink-0 font-serif italic">D{itIn.day}</span>
                            <input type="text" required placeholder="Day Title (e.g. Welcome to Leh Ladakh)" value={itIn.title} onChange={(e) => handleItineraryDayChange(itIn.day, 'title', e.target.value)} className="w-full px-3 py-1.5 border border-stone-200 rounded-sm text-xs text-stone-850 focus:outline-none focus:border-[#008080] font-bold bg-white" />
                          </div>
                          <textarea rows={2} required placeholder="Day schedule details, drives, activities, food, hotel names..." value={itIn.description} onChange={(e) => handleItineraryDayChange(itIn.day, 'description', e.target.value)} className="w-full px-3 py-1.5 border border-stone-200 rounded-sm text-xs text-stone-600 focus:outline-none focus:border-[#008080] font-medium bg-white" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-stone-100 pt-4">
                    <div className="space-y-3">
                      <span className="block text-xs font-bold text-stone-800 uppercase tracking-wider">Holiday Inclusions</span>
                      <div className="flex gap-2">
                        <input type="text" placeholder="Add an inclusion..." value={newInclusion} onChange={(e) => setNewInclusion(e.target.value)} className="w-full px-3 py-1.5 border border-stone-200 rounded-sm text-xs text-stone-800 focus:outline-none focus:border-[#008080]" />
                        <button type="button" onClick={handleAddInclusion} className="px-3 bg-[#008080] text-white rounded-sm text-xs font-bold uppercase tracking-wider hover:bg-[#006666] cursor-pointer">Add</button>
                      </div>
                      <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                        {inclusions.map((inc, i) => (
                          <li key={i} className="flex justify-between items-center text-xs text-stone-600 bg-[#f8f7f4] px-3 py-1.5 rounded-sm border border-stone-200">
                            <span className="line-clamp-1">{inc}</span>
                            <button type="button" onClick={() => handleRemoveInclusion(i)} className="text-stone-400 hover:text-red-500 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <span className="block text-xs font-bold text-stone-800 uppercase tracking-wider">Holiday Exclusions</span>
                      <div className="flex gap-2">
                        <input type="text" placeholder="Add an exclusion..." value={newExclusion} onChange={(e) => setNewExclusion(e.target.value)} className="w-full px-3 py-1.5 border border-stone-200 rounded-sm text-xs text-stone-800 focus:outline-none focus:border-[#008080]" />
                        <button type="button" onClick={handleAddExclusion} className="px-3 bg-stone-900 text-white rounded-sm text-xs font-bold uppercase tracking-wider hover:bg-stone-800 cursor-pointer">Add</button>
                      </div>
                      <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                        {exclusions.map((exc, i) => (
                          <li key={i} className="flex justify-between items-center text-xs text-stone-600 bg-[#f8f7f4] px-3 py-1.5 rounded-sm border border-stone-200">
                            <span className="line-clamp-1">{exc}</span>
                            <button type="button" onClick={() => handleRemoveExclusion(i)} className="text-stone-400 hover:text-red-500 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {packageCmsTab === 'seo' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">SEO Title</label>
                      <input type="text" placeholder="Search-friendly title" value={pkgFormData.seoTitle} onChange={(e) => setPkgFormData((prev) => ({ ...prev, seoTitle: e.target.value }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm text-stone-850 focus:outline-none focus:border-[#008080] font-medium" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">SEO Description</label>
                      <input type="text" placeholder="Short meta description" value={pkgFormData.seoDescription} onChange={(e) => setPkgFormData((prev) => ({ ...prev, seoDescription: e.target.value }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm text-stone-850 focus:outline-none focus:border-[#008080] font-medium" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Publishing Status</label>
                      <select value={pkgFormData.status} onChange={(e) => setPkgFormData((prev) => ({ ...prev, status: e.target.value as 'Publish' | 'Draft', active: e.target.value === 'Publish' }))} className="w-full px-3 py-2 bg-white border border-stone-200 rounded-sm text-sm text-stone-700 focus:outline-none focus:border-[#008080] font-medium cursor-pointer">
                        <option value="Draft">Draft</option>
                        <option value="Publish">Publish</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Visibility</label>
                      <div className="rounded-sm border border-stone-200 bg-white p-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={pkgFormData.featured} onChange={(e) => setPkgFormData((prev) => ({ ...prev, featured: e.target.checked }))} className="w-4.5 h-4.5 accent-[#008080] rounded border-stone-200" />
                          <div>
                            <strong className="text-xs text-stone-800 block font-bold">Feature on homepage</strong>
                            <span className="text-[10px] text-stone-400 block font-medium">Adds this package to the homepage showcase.</span>
                          </div>
                        </label>
                        <label className="mt-3 flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={pkgFormData.active} onChange={(e) => setPkgFormData((prev) => ({ ...prev, active: e.target.checked, status: e.target.checked ? 'Publish' : 'Draft' }))} className="w-4.5 h-4.5 accent-[#008080] rounded border-stone-200" />
                          <div>
                            <strong className="text-xs text-stone-800 block font-bold">Publish to catalog</strong>
                            <span className="text-[10px] text-stone-400 block font-medium">Makes it visible in package listings and search.</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Departure Dates (one per line)</label>
                    <textarea rows={3} placeholder="e.g. 15 May 2026" value={pkgFormData.departureDates} onChange={(e) => setPkgFormData((prev) => ({ ...prev, departureDates: e.target.value }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm text-stone-850 focus:outline-none focus:border-[#008080] font-medium" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">FAQs (Question | Answer)</label>
                      <textarea rows={3} placeholder="Is the trip beginner-friendly? | Yes, it is beginner-friendly..." value={pkgFormData.faqs} onChange={(e) => setPkgFormData((prev) => ({ ...prev, faqs: e.target.value }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm text-stone-850 focus:outline-none focus:border-[#008080] font-medium" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Policies (one per line)</label>
                      <textarea rows={3} placeholder="Cancellation and planning notes" value={pkgFormData.policies} onChange={(e) => setPkgFormData((prev) => ({ ...prev, policies: e.target.value }))} className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm text-stone-850 focus:outline-none focus:border-[#008080] font-medium" />
                    </div>
                  </div>
                </div>
              )}
            </form>

            <div className="flex gap-4 border-t border-stone-100 pt-4 shrink-0">
              <button
                type="button"
                onClick={() => setIsPkgFormOpen(false)}
                className="w-1/2 py-2.5 border border-stone-200 text-stone-600 text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-stone-50 transition cursor-pointer"
              >
                Discard Changes
              </button>
              <button
                type="submit"
                form="pkg-form"
                className="w-1/2 py-2.5 bg-[#008080] hover:bg-[#006666] text-white text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm transition cursor-pointer text-center"
              >
                {editingPkg ? 'Update Package document' : 'Save & Publish Package'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* DIALOG B: ENQUIRY INSPECT MODAL */}
      {/* ==================================================== */}
      {activeEnquiry && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-sm w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col justify-between" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="bg-stone-900 text-white p-6 flex justify-between items-center">
              <div>
                <span className="text-[9px] bg-[#008080]/20 text-teal-300 font-bold border border-[#008080]/30 px-2.5 py-1 rounded-none uppercase tracking-wider">
                  Enquiry ID: {activeEnquiry.id.substring(0, 8)}
                </span>
                <h3 className="text-lg font-serif font-normal tracking-tight mt-3">
                  Client: {activeEnquiry.name}
                </h3>
              </div>
              <button 
                onClick={() => setActiveEnquiry(null)}
                className="text-stone-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh] text-xs sm:text-sm">
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Contact Phone</span>
                  <a href={`tel:${activeEnquiry.phone}`} className="text-stone-850 font-bold hover:underline">
                    {activeEnquiry.phone}
                  </a>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Contact Email</span>
                  <a href={`mailto:${activeEnquiry.email}`} className="text-stone-850 font-bold hover:underline">
                    {activeEnquiry.email}
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 border-t border-stone-100 pt-4">
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Target Destination</span>
                  <strong className="text-[#008080] font-bold block">
                    {activeEnquiry.destination}
                  </strong>
                  {activeEnquiry.packageName && (
                    <span className="text-[10px] text-stone-400 italic block mt-0.5">Package: {activeEnquiry.packageName}</span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Travel Date</span>
                  <strong className="text-stone-850 font-bold block">
                    {activeEnquiry.travelDate}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 border-t border-stone-100 pt-4">
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Number of Travelers</span>
                  <strong className="text-stone-850 font-bold block">
                    {activeEnquiry.travelers} Guests
                  </strong>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Estimated Budget</span>
                  <strong className="text-stone-850 font-bold block">
                    {activeEnquiry.budget} per traveler
                  </strong>
                </div>
              </div>

              {/* Message Box */}
              <div className="bg-[#f8f7f4] border border-stone-200 rounded-sm p-4 space-y-2">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Special Requests & Message</span>
                <p className="text-stone-700 leading-relaxed font-light whitespace-pre-wrap">
                  {activeEnquiry.message || 'No custom messages entered.'}
                </p>
              </div>

              {/* Submitted At */}
              <div className="text-[10px] text-stone-400 text-right">
                Submitted At: {activeEnquiry.createdAt ? new Date(activeEnquiry.createdAt).toLocaleString() : 'N/A'}
              </div>

            </div>

            {/* Footer Operations */}
            <div className="bg-stone-50 border-t border-stone-100 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Status:</span>
                <select
                  value={activeEnquiry.status}
                  onChange={(e) => handleUpdateEnquiryStatus(activeEnquiry.id, e.target.value as EnquiryStatus)}
                  className={`px-3 py-1.5 bg-white border border-stone-200 rounded-sm text-xs font-bold uppercase cursor-pointer ${
                    activeEnquiry.status === 'New' ? 'text-blue-700' :
                    activeEnquiry.status === 'Contacted' ? 'text-amber-700' :
                    activeEnquiry.status === 'Converted' ? 'text-emerald-700' :
                    'text-stone-700'
                  }`}
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Converted">Converted</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleDeleteEnquiry(activeEnquiry.id)}
                  className="w-1/2 sm:w-auto px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 text-[10px] font-bold uppercase tracking-wider rounded-sm transition cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Enquiry</span>
                </button>
                <button
                  onClick={() => setActiveEnquiry(null)}
                  className="w-1/2 sm:w-auto px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-sm transition cursor-pointer text-center"
                >
                  Close Modal
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* DIALOG C: GALLERY UPLOAD MODAL */}
      {/* ==================================================== */}
      {isGalleryFormOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-md w-full max-w-xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-serif font-normal text-lg text-[#333333]">Add Photographs to Gallery</h3>
                <p className="text-[10px] text-stone-400">Upload multiple photos, compress them instantly, and group under albums.</p>
              </div>
              <button 
                onClick={() => {
                  setIsGalleryFormOpen(false);
                  setSelectedGalleryFiles([]);
                }}
                className="text-stone-400 hover:text-stone-900 cursor-pointer p-1 rounded-full hover:bg-stone-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Selector Tabs */}
            <div className="flex bg-stone-100 p-0.5 rounded-sm">
              <button
                type="button"
                onClick={() => setGalleryUploadMode('single')}
                className={`flex-1 py-1.5 text-center text-xs font-bold uppercase tracking-wider rounded-xs transition-all cursor-pointer ${
                  galleryUploadMode === 'single' ? 'bg-white text-stone-900 shadow-3xs' : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Single Upload
              </button>
              <button
                type="button"
                onClick={() => setGalleryUploadMode('multiple')}
                className={`flex-1 py-1.5 text-center text-xs font-bold uppercase tracking-wider rounded-xs transition-all cursor-pointer ${
                  galleryUploadMode === 'multiple' ? 'bg-white text-stone-900 shadow-3xs' : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Bulk Upload
              </button>
            </div>

            {galleryUploadMode === 'single' ? (
              <form onSubmit={handleAddGalleryImage} className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-stone-450 uppercase tracking-wider">Image Title</label>
                    <input
                      type="text"
                      placeholder="E.g. Sunrise at Taj Mahal"
                      value={galleryFormData.title}
                      onChange={(e) => setGalleryFormData((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-stone-200 rounded-sm text-xs text-stone-850 focus:outline-none focus:border-[#008080]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-stone-450 uppercase tracking-wider">Album / Group Name</label>
                    <input
                      type="text"
                      placeholder="E.g. Goa Diaries 2026 (Optional)"
                      value={galleryFormData.album}
                      onChange={(e) => setGalleryFormData((prev) => ({ ...prev, album: e.target.value }))}
                      className="w-full px-3 py-2 border border-stone-200 rounded-sm text-xs text-stone-850 focus:outline-none focus:border-[#008080]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-stone-455 uppercase tracking-wider">Category *</label>
                  <select
                    value={galleryFormData.category}
                    onChange={(e) => setGalleryFormData((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-sm text-xs text-stone-700 focus:outline-none focus:border-[#008080] cursor-pointer"
                  >
                    <option value="Pilgrimage">Pilgrimage</option>
                    <option value="Treks">Treks</option>
                    <option value="Adventure">Adventure</option>
                    <option value="Himachal">Himachal</option>
                    <option value="Ladakh">Ladakh</option>
                    <option value="Uttarakhand">Uttarakhand</option>
                  </select>
                </div>

                {/* Upload Area */}
                <div className="bg-[#f8f7f4] p-4 rounded-sm border border-stone-200 space-y-2">
                  <span className="block text-[10px] font-bold text-stone-450 uppercase tracking-wider">Image File *</span>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="border-2 border-dashed border-stone-200 rounded-sm p-3 text-center hover:border-[#008080] transition bg-white relative cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageFileChange(e, 'gallery')}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Upload className="w-5 h-5 text-stone-400 mx-auto mb-1" />
                      <span className="text-[11px] text-stone-600 block font-semibold">
                        {uploadingImage ? 'Uploading image...' : 'Upload Image File'}
                      </span>
                    </div>

                    <div className="text-center text-[9px] text-stone-450 font-bold uppercase py-1 tracking-widest">OR</div>

                    <input
                      type="text"
                      placeholder="Enter direct image URL"
                      value={galleryFormData.imageUrl}
                      onChange={(e) => setGalleryFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-stone-200 rounded-sm text-xs text-stone-850 focus:outline-none focus:border-[#008080] bg-white"
                    />
                  </div>

                  {galleryFormData.imageUrl && (
                    <div className="w-full h-24 rounded-sm overflow-hidden border border-stone-200 mt-2 bg-stone-100 relative group">
                      <img 
                        src={galleryFormData.imageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsGalleryFormOpen(false);
                      setSelectedGalleryFiles([]);
                    }}
                    className="w-1/2 py-2 border border-stone-200 text-stone-600 text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-stone-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2 bg-[#008080] hover:bg-[#006666] text-white text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm cursor-pointer text-center"
                  >
                    Upload Photograph
                  </button>
                </div>

              </form>
            ) : (
              <form onSubmit={handleBulkGalleryUpload} className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-stone-450 uppercase tracking-wider">Album / Group Name</label>
                    <input
                      type="text"
                      placeholder="E.g. Leh Expedition 2026"
                      value={multipleUploadAlbum}
                      onChange={(e) => setMultipleUploadAlbum(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-200 rounded-sm text-xs text-stone-850 focus:outline-none focus:border-[#008080]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-stone-450 uppercase tracking-wider">Category *</label>
                    <select
                      value={multipleUploadCategory}
                      onChange={(e) => setMultipleUploadCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-sm text-xs text-stone-700 focus:outline-none focus:border-[#008080] cursor-pointer"
                    >
                      <option value="Pilgrimage">Pilgrimage</option>
                      <option value="Treks">Treks</option>
                      <option value="Adventure">Adventure</option>
                      <option value="Himachal">Himachal</option>
                      <option value="Ladakh">Ladakh</option>
                      <option value="Uttarakhand">Uttarakhand</option>
                    </select>
                  </div>
                </div>

                {/* Multiple upload file field */}
                <div className="border-2 border-dashed border-stone-200 rounded-sm p-5 text-center hover:border-[#008080] transition bg-stone-50 relative cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleMultipleGalleryFilesChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-6 h-6 text-stone-400 mx-auto mb-1.5" />
                  <span className="text-xs text-stone-700 block font-bold">Select Multiple Photographs</span>
                  <p className="text-[10px] text-stone-400 mt-0.5">Select one or more travel photos. Client-side compression auto-applied.</p>
                </div>

                {/* Preview Selected Files List */}
                {selectedGalleryFiles.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Batch Preview ({selectedGalleryFiles.length} files)</span>
                      <button
                        type="button"
                        onClick={() => setSelectedGalleryFiles([])}
                        className="text-[10px] text-rose-600 hover:underline cursor-pointer font-bold"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="max-h-44 overflow-y-auto space-y-2 pr-1 border border-stone-100 rounded p-2">
                      {selectedGalleryFiles.map((fileItem, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-stone-50 p-2 rounded-xs border border-stone-200/40 relative group">
                          <img
                            src={fileItem.preview}
                            alt="preview"
                            className="w-10 h-10 object-cover rounded-xs"
                          />
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              required
                              value={fileItem.title}
                              onChange={(e) => {
                                const updatedVal = e.target.value;
                                setSelectedGalleryFiles((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, title: updatedVal } : item))
                                );
                              }}
                              className="w-full bg-white px-2 py-1 text-xs border border-stone-200 rounded-xs focus:outline-none focus:border-[#008080]"
                              placeholder="Photo title"
                            />
                            <span className="text-[9px] text-stone-400 font-mono block mt-0.5">{(fileItem.file.size / 1024).toFixed(0)} KB • Compressed</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedGalleryFiles((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-stone-400 hover:text-rose-600 cursor-pointer p-1 rounded-full"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsGalleryFormOpen(false);
                      setSelectedGalleryFiles([]);
                    }}
                    className="w-1/2 py-2 border border-stone-200 text-stone-600 text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-stone-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploadingMultiple}
                    className="w-1/2 py-2 bg-[#008080] hover:bg-[#006666] disabled:bg-stone-300 text-white text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm cursor-pointer text-center flex items-center justify-center gap-1.5"
                  >
                    {isUploadingMultiple ? 'Uploading...' : `Upload Batch (${selectedGalleryFiles.length})`}
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}
      {/* ==================================================== */}
      {/* DIALOG D: REVIEW REPLY MODAL */}
      {/* ==================================================== */}
      {isReplyModalOpen && activeReviewForReply && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-md w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <h3 className="font-serif font-normal text-base text-stone-900 flex items-center gap-2">
                <span>Reply to Review</span>
              </h3>
              <button 
                onClick={() => {
                  setIsReplyModalOpen(false);
                  setActiveReviewForReply(null);
                  setReplyText('');
                }}
                className="text-stone-400 hover:text-stone-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-stone-50 border border-stone-200 p-3 rounded text-xs space-y-1">
              <span className="font-bold text-stone-500 uppercase text-[9px] tracking-wider block">Customer Testimonial</span>
              <strong className="text-stone-850 block">{activeReviewForReply.name} ({activeReviewForReply.rating}★)</strong>
              <p className="text-stone-600 italic">"{activeReviewForReply.comment}"</p>
            </div>

            <form onSubmit={handleReviewReplySubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Your Official Coordinator Reply *</label>
                <textarea
                  required
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Thank you for sharing your incredible experience, we look forward to designing your next customized tour..."
                  className="w-full px-3 py-2 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080]"
                ></textarea>
              </div>

              <div className="flex gap-4 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsReplyModalOpen(false);
                    setActiveReviewForReply(null);
                    setReplyText('');
                  }}
                  className="w-1/2 py-2 border border-stone-200 text-stone-600 text-[10px] font-bold uppercase tracking-wider rounded hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-[#008080] hover:bg-[#006666] text-white text-[10px] font-bold uppercase tracking-wider rounded shadow-sm cursor-pointer text-center"
                >
                  Save Reply
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* DIALOG E: GALLERY METADATA EDIT MODAL */}
      {/* ==================================================== */}
      {isGalleryEditOpen && editingGalleryImage && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-md w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <h3 className="font-serif font-normal text-base text-stone-900">Edit Photo Details</h3>
              <button 
                onClick={() => {
                  setIsGalleryEditOpen(false);
                  setEditingGalleryImage(null);
                }}
                className="text-stone-400 hover:text-stone-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditGalleryImage} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-stone-450 uppercase tracking-wider">Photo Title *</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Paragliding in Bir Billing"
                  value={editGalleryFormData.title}
                  onChange={(e) => setEditGalleryFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-200 rounded text-xs text-stone-850 focus:outline-none focus:border-[#008080]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-stone-450 uppercase tracking-wider">Category *</label>
                  <select
                    value={editGalleryFormData.category}
                    onChange={(e) => setEditGalleryFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded text-xs text-stone-700 focus:outline-none focus:border-[#008080] cursor-pointer"
                  >
                    <option value="Pilgrimage">Pilgrimage</option>
                    <option value="Treks">Treks</option>
                    <option value="Adventure">Adventure</option>
                    <option value="Himachal">Himachal</option>
                    <option value="Ladakh">Ladakh</option>
                    <option value="Uttarakhand">Uttarakhand</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-stone-450 uppercase tracking-wider">Album / Group Name</label>
                  <input
                    type="text"
                    placeholder="E.g. Ladakh Expeditions 2026"
                    value={editGalleryFormData.album}
                    onChange={(e) => setEditGalleryFormData(prev => ({ ...prev, album: e.target.value }))}
                    className="w-full px-3 py-2 border border-stone-200 rounded text-xs text-stone-850 focus:outline-none focus:border-[#008080]"
                  />
                </div>
              </div>

              {editingGalleryImage.imageUrl && (
                <div className="w-full h-32 rounded border border-stone-200 overflow-hidden bg-stone-50">
                  <img
                    src={editingGalleryImage.imageUrl}
                    alt="Current representation"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsGalleryEditOpen(false);
                    setEditingGalleryImage(null);
                  }}
                  className="w-1/2 py-2 border border-stone-200 text-stone-600 text-[10px] font-bold uppercase tracking-wider rounded hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-[#008080] hover:bg-[#006666] text-white text-[10px] font-bold uppercase tracking-wider rounded shadow-sm cursor-pointer text-center"
                >
                  Save Modifications
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* DIALOG F: BLOG POST COMPOSE/EDIT MODAL */}
      {/* ==================================================== */}
      {isBlogFormOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex justify-end animate-fade-in font-sans">
          <div className="w-full max-w-4xl bg-white h-full flex flex-col justify-between shadow-2xl p-6 sm:p-8 overflow-y-auto space-y-6 animate-slide-left">
            
            <div className="flex justify-between items-center border-b border-stone-100 pb-3 shrink-0">
              <div>
                <h3 className="font-serif font-normal text-xl text-stone-900 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-[#008080]" />
                  <span>{activeBlogPost ? 'Modify Travel Article' : 'Compose Travel Article'}</span>
                </h3>
                <p className="text-[10px] text-stone-400">Write rich articles, optimize metadata for Google and search engines (SEO).</p>
              </div>
              <button 
                onClick={() => {
                  setIsBlogFormOpen(false);
                  setActiveBlogPost(null);
                }}
                className="p-1.5 hover:bg-stone-100 text-stone-400 hover:text-stone-900 rounded-full cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveBlogPost} className="space-y-6 flex-1 pr-1 overflow-y-auto">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-stone-450 uppercase tracking-wider">Article Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. 10 Essential Stops in Spiti Valley"
                    value={blogFormData.title}
                    onChange={(e) => handleBlogTitleChange(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded text-sm text-stone-850 focus:outline-none focus:border-[#008080] font-medium"
                  />
                </div>

                {/* Slug (Auto-generated but editable) */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-stone-450 uppercase tracking-wider">URL Slug (SEO friendly) *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. essential-stops-spiti-valley"
                    value={blogFormData.slug}
                    onChange={(e) => setBlogFormData(prev => ({ ...prev, slug: e.target.value }))}
                    className="w-full px-3 py-2 border border-stone-200 rounded text-xs text-stone-850 focus:outline-none focus:border-[#008080] bg-stone-50 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Category */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-stone-450 uppercase tracking-wider">Editorial Category *</label>
                  <select
                    value={blogFormData.category}
                    onChange={(e) => setBlogFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded text-xs text-stone-700 focus:outline-none focus:border-[#008080] cursor-pointer font-medium"
                  >
                    <option value="Travel Guide">Travel Guide</option>
                    <option value="Cultural Highlights">Cultural Highlights</option>
                    <option value="Treks & Trails">Treks & Trails</option>
                    <option value="Itineraries">Itineraries</option>
                    <option value="Spiritual Travel">Spiritual Travel</option>
                    <option value="News & Updates">News & Updates</option>
                    <option value="Food & Culture">Food & Culture</option>
                  </select>
                </div>

                {/* Author */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-stone-450 uppercase tracking-wider">Author Identity *</label>
                  <input
                    type="text"
                    required
                    value={blogFormData.author}
                    onChange={(e) => setBlogFormData(prev => ({ ...prev, author: e.target.value }))}
                    className="w-full px-3 py-2 border border-stone-200 rounded text-xs text-stone-850 focus:outline-none focus:border-[#008080] font-medium"
                  />
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-stone-450 uppercase tracking-wider">Post Visibility Status *</label>
                  <select
                    value={blogFormData.status}
                    onChange={(e) => setBlogFormData(prev => ({ ...prev, status: e.target.value as 'Publish' | 'Draft' }))}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded text-xs text-stone-700 focus:outline-none focus:border-[#008080] cursor-pointer font-medium"
                  >
                    <option value="Draft">Draft (Only Admins See)</option>
                    <option value="Publish">Publish (Publicly Visible)</option>
                  </select>
                </div>
              </div>

              {/* SEO METADATA SECTION */}
              <div className="bg-[#fcfbf9] border border-stone-200/80 p-4 rounded-sm space-y-4">
                <span className="block text-[10px] font-bold text-[#008080] uppercase tracking-wider">Search Engine Optimization (SEO Meta Details)</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-stone-450 uppercase tracking-wider">SEO Meta Description *</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="E.g. Read about the absolute essential stops in Spiti Valley, our curated traveler highlights, and pristine monastery excursions..."
                      value={blogFormData.seoDescription}
                      maxLength={160}
                      onChange={(e) => setBlogFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-stone-200 rounded text-xs text-stone-800 focus:outline-none focus:border-[#008080]"
                    ></textarea>
                    <span className="text-[9px] text-stone-400 block text-right">Recommended: 150-160 chars ({blogFormData.seoDescription.length}/160)</span>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-stone-450 uppercase tracking-wider">SEO Meta Keywords (Comma Separated)</label>
                    <textarea
                      rows={2}
                      placeholder="E.g. Spiti Valley travel, Kaza monasteries, Pin valley trekking guide"
                      value={blogFormData.seoKeywords}
                      onChange={(e) => setBlogFormData(prev => ({ ...prev, seoKeywords: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-stone-200 rounded text-xs text-stone-800 focus:outline-none focus:border-[#008080]"
                    ></textarea>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-stone-450 uppercase tracking-wider">Article Tags (Comma Separated, E.g. Adventure, Spiti, Mountains)</label>
                  <input
                    type="text"
                    placeholder="Adventure, Spiti, Offbeat, Monasteries"
                    value={blogFormData.tags}
                    onChange={(e) => setBlogFormData(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-stone-200 rounded text-xs text-stone-800 focus:outline-none focus:border-[#008080]"
                  />
                </div>
              </div>

              {/* Cover Image */}
              <div className="bg-[#f8f7f4] p-5 rounded-sm border border-stone-200 space-y-3">
                <span className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider">Featured Cover Image *</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border-2 border-dashed border-stone-200 rounded-sm p-4 text-center hover:border-[#008080] transition bg-white relative cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBlogImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-5 h-5 text-stone-400 mx-auto mb-1" />
                    <span className="text-xs text-stone-700 block font-bold">Select Cover File</span>
                    <span className="text-[10px] text-stone-400 block mt-0.5">Auto-compresses and processes immediately</span>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-wider">OR Direct URL</label>
                      <input
                        type="text"
                        placeholder="Paste direct featured image URL"
                        value={blogFormData.featuredImageUrl}
                        onChange={(e) => setBlogFormData((prev) => ({ ...prev, featuredImageUrl: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-stone-200 rounded-sm text-xs text-stone-850 focus:outline-none focus:border-[#008080] bg-white font-mono"
                      />
                    </div>
                    {blogFormData.featuredImageUrl && (
                      <div className="w-full h-24 rounded overflow-hidden border border-stone-200 bg-stone-100 relative">
                        <img 
                          src={blogFormData.featuredImageUrl} 
                          alt="Featured Preview" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => setBlogFormData((prev) => ({ ...prev, featuredImageUrl: '' }))}
                          className="absolute top-1.5 right-1.5 bg-stone-900/80 text-white p-1 hover:bg-rose-600 rounded transition cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Editorial Body Content Area */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-stone-450 uppercase tracking-wider">Article Body Content (Markdown Supported) *</label>
                  <span className="text-[9px] text-stone-400 font-mono">Use standard Markdown headers, bullets and citations</span>
                </div>
                <textarea
                  required
                  rows={15}
                  placeholder="# Majestic Spiti Valley...
## Best Time to Visit
- June to September: Highly accessible with pleasant days.
- December to February: Ideal for extreme winter snow leopards expeditions.

Spiti is indeed a treasure-house of natural and cultural delights..."
                  value={blogFormData.content}
                  onChange={(e) => setBlogFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-4 py-3 border border-stone-200 rounded font-sans text-xs text-stone-800 leading-relaxed focus:outline-none focus:border-[#008080] bg-[#fdfdfd] shadow-inner"
                ></textarea>
              </div>

              <div className="flex gap-4 pt-4 border-t border-stone-150 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsBlogFormOpen(false);
                    setActiveBlogPost(null);
                  }}
                  className="px-6 py-2 border border-stone-200 text-stone-600 text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2 bg-[#008080] hover:bg-[#006666] text-white text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm cursor-pointer text-center font-bold"
                >
                  {activeBlogPost ? 'Save Changes' : 'Publish Editorial'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
