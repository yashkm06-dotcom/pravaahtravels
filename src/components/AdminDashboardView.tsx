import React, { useState, useMemo, useEffect } from 'react';
import { 
  Compass, LayoutDashboard, FileText, Package, Image as ImageIcon, 
  Plus, Edit2, Trash2, Check, X, Search, Filter, Download, 
  Calendar, DollarSign, Users, LogOut, Globe, Eye, ChevronDown, 
  Upload, CheckCircle, Clock, AlertCircle, Sparkles, Phone, Mail, MessageSquare, Share2, UserPlus, Clipboard, CheckCircle2, Award, ExternalLink, Star, LineChart as LineChartIcon, RefreshCw,
  Menu, Bell, Settings, Palette, Home, Megaphone, Images, PanelLeftClose, PanelLeftOpen, SlidersHorizontal
} from 'lucide-react';
import { TravelPackage, Enquiry, GalleryImage, DestinationCategory, EnquiryStatus, formatPrice } from '../types';
import { db, storage, collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from '../lib/firebase';
import { triggerSystemEmail } from '../lib/emailClient';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { fetchAnalyticsEvents } from '../lib/analytics';
import { TableSkeletonLoader, CardGridSkeletonLoader } from './SkeletonLoader';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

interface AdminDashboardViewProps {
  packages: TravelPackage[];
  enquiries: Enquiry[];
  gallery: GalleryImage[];
  adminEmail: string;
  onLogout: () => void;
  onNavigatePublic: () => void;
  onRefreshData: () => Promise<void>;
}

type AdminTab = 'overview' | 'packages' | 'enquiries' | 'gallery' | 'media-library' | 'website' | 'bookings' | 'reviews' | 'blogs' | 'analytics';

export default function AdminDashboardView({
  packages,
  enquiries,
  gallery,
  adminEmail,
  onLogout,
  onNavigatePublic,
  onRefreshData,
}: AdminDashboardViewProps) {
  // Navigation inside Dashboard
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [adminSearch, setAdminSearch] = useState('');
  const [mediaLibrarySearch, setMediaLibrarySearch] = useState('');
  const [mediaLibraryCategory, setMediaLibraryCategory] = useState('All');

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

  // Lead CRM Filter states
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('All');
  const [bookingPackageFilter, setBookingPackageFilter] = useState('All');
  const [bookingMonthFilter, setBookingMonthFilter] = useState('All');

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
      // 1. Search
      if (bookingSearch) {
        const queryStr = bookingSearch.toLowerCase();
        const nameMatch = (b.customerName || '').toLowerCase().includes(queryStr);
        const emailMatch = (b.customerEmail || '').toLowerCase().includes(queryStr);
        const phoneMatch = (b.customerPhone || '').toLowerCase().includes(queryStr);
        const destMatch = (b.destination || '').toLowerCase().includes(queryStr);
        const pkgMatch = (b.packageTitle || '').toLowerCase().includes(queryStr);
        if (!nameMatch && !emailMatch && !phoneMatch && !destMatch && !pkgMatch) {
          return false;
        }
      }

      // 2. Status Filter
      if (bookingStatusFilter !== 'All') {
        const targetStatus = bookingStatusFilter;
        const currentStatus = b.status || 'New Lead';
        if (targetStatus === 'New Lead') {
          if (currentStatus !== 'New Lead' && currentStatus !== 'Pending') {
            return false;
          }
        } else {
          if (currentStatus !== targetStatus) {
            return false;
          }
        }
      }

      // 3. Package Filter
      if (bookingPackageFilter !== 'All' && b.packageTitle !== bookingPackageFilter) {
        return false;
      }

      // 4. Month Filter
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

  // Fetch all customer bookings
  const fetchAllBookings = async () => {
    setBookingsLoading(true);
    try {
      const q = collection(db, 'bookings');
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by creation date desc
      fetched.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setBookings(fetched);
    } catch (err) {
      console.error('Error fetching admin bookings:', err);
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBookings();
    fetchAdminReviews();
    fetchBlogPosts();
    fetchAnalyticsData();
  }, []);

  const handleUpdateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const ref = doc(db, 'bookings', bookingId);
      await updateDoc(ref, { status });

      // Trigger automatic emails based on state change
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

      await fetchAllBookings();
    } catch (err) {
      console.error('Update booking status failed:', err);
      alert('Failed to update booking status.');
    }
  };

  const handleUpdateBookingPayment = async (bookingId: string, paymentStatus: string) => {
    try {
      const ref = doc(db, 'bookings', bookingId);
      await updateDoc(ref, { paymentStatus });
      await fetchAllBookings();
    } catch (err) {
      console.error('Update payment status failed:', err);
      alert('Failed to update payment status.');
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this customer booking? This action is irreversible.')) return;
    try {
      const ref = doc(db, 'bookings', bookingId);
      await deleteDoc(ref);
      await fetchAllBookings();
    } catch (err) {
      console.error('Delete booking failed:', err);
      alert('Failed to delete booking.');
    }
  };

  const handleAddNote = async (bookingId: string) => {
    if (!newNote.trim()) return;
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
      await updateDoc(bRef, { notes: updatedNotes });
      setNewNote('');
      // Update activeBooking local copy
      if (activeBooking && activeBooking.id === bookingId) {
        setActiveBooking({
          ...activeBooking,
          notes: updatedNotes
        });
      }
      await fetchAllBookings();
    } catch (err) {
      console.error('Failed to add note:', err);
      alert('Failed to save note.');
    }
  };

  const handleAssignStaff = async (bookingId: string, staffName: string) => {
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
      await fetchAllBookings();
    } catch (err) {
      console.error('Failed to assign staff:', err);
      alert('Failed to assign staff.');
    }
  };

  const handleUpdateFollowUpDate = async (bookingId: string, dateStr: string) => {
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
      await fetchAllBookings();
    } catch (err) {
      console.error('Failed to update follow-up date:', err);
      alert('Failed to update follow-up date.');
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
      b.id,
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
      b.status || 'New Lead',
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
  const [pkgFormData, setPkgFormData] = useState({
    title: '',
    destination: '',
    category: 'Pilgrimage' as DestinationCategory,
    duration: '',
    price: 0,
    shortDescription: '',
    fullDescription: '',
    imageUrl: '',
    featured: false,
    active: true,
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
    
    // This month enquiries check
    const currentYearMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    const thisMonthEnquiries = enquiries.filter(
      (e) => e.createdAt && e.createdAt.substring(0, 7) === currentYearMonth
    ).length;

    const totalPackages = packages.length;
    const activePackages = packages.filter((p) => p.active).length;

    // Recent 5 enquiries
    const recentEnquiries = [...enquiries]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    // Bookings Metrics
    const totalBookingsCount = bookings.length;
    const totalRevenue = bookings
      .filter((b) => b.paymentStatus === 'Paid' || b.status === 'Confirmed')
      .reduce((sum, b) => sum + (b.price || 0), 0);

    const pendingReceivables = bookings
      .filter((b) => b.paymentStatus === 'Unpaid' && b.status !== 'Cancelled')
      .reduce((sum, b) => sum + (b.price || 0), 0);

    const activeBookingsCount = bookings.filter((b) => b.status === 'Pending' || b.status === 'Confirmed').length;

    return {
      totalEnquiries,
      thisMonthEnquiries,
      totalPackages,
      activePackages,
      recentEnquiries,
      totalBookingsCount,
      totalRevenue,
      pendingReceivables,
      activeBookingsCount
    };
  }, [enquiries, packages, bookings]);

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
        matchMonth = e.createdAt && e.createdAt.substring(0, 7) === enquiryMonthFilter;
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
    setPkgFormData({
      title: '',
      destination: '',
      category: 'Pilgrimage',
      duration: '5 Days / 4 Nights',
      price: 500,
      shortDescription: '',
      fullDescription: '',
      imageUrl: '',
      featured: false,
      active: true,
    });
    setItinerary([{ day: 1, title: 'Arrival & Check-in', description: 'Airport pick-up and welcome briefings.' }]);
    setInclusions(['Premium hotel accommodation', 'Daily breakfasts', 'Local sightseeing transfer']);
    setExclusions(['Airfare tickets', 'Personal laundry and tips']);
    setIsPkgFormOpen(true);
  };

  const handleOpenPkgEdit = (pkg: TravelPackage) => {
    setEditingPkg(pkg);
    setPkgFormData({
      title: pkg.title,
      destination: pkg.destination,
      category: pkg.category,
      duration: pkg.duration,
      price: pkg.price || 0,
      shortDescription: pkg.shortDescription,
      fullDescription: pkg.fullDescription || '',
      imageUrl: pkg.imageUrl,
      featured: pkg.featured || false,
      active: pkg.active ?? true,
    });
    setItinerary(pkg.itinerary || []);
    setInclusions(pkg.inclusions || []);
    setExclusions(pkg.exclusions || []);
    setIsPkgFormOpen(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgFormData.title || !pkgFormData.destination || !pkgFormData.imageUrl) {
      alert('Please fill out Title, Destination and provide a cover image.');
      return;
    }

    try {
      const payload = {
        ...pkgFormData,
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
      await updateDoc(docRef, { active: !pkg.active });
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
        imageUrl: galleryFormData.imageUrl,
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

  const navSections = [
    {
      label: 'Command Center',
      items: [
        { id: 'overview' as AdminTab, label: 'Dashboard', icon: LayoutDashboard, count: null },
        { id: 'website' as AdminTab, label: 'Website CMS', icon: Globe, count: null },
        { id: 'media-library' as AdminTab, label: 'Media Library', icon: Images, count: gallery.length },
        { id: 'analytics' as AdminTab, label: 'Analytics', icon: LineChartIcon, count: null },
      ],
    },
    {
      label: 'Operations',
      items: [
        { id: 'packages' as AdminTab, label: 'Packages', icon: Package, count: packages.length },
        { id: 'bookings' as AdminTab, label: 'Bookings', icon: Calendar, count: bookings.length },
        { id: 'enquiries' as AdminTab, label: 'Enquiries', icon: FileText, count: enquiries.length },
        { id: 'reviews' as AdminTab, label: 'Reviews', icon: Star, count: adminReviews.length },
        { id: 'gallery' as AdminTab, label: 'Gallery CRUD', icon: ImageIcon, count: gallery.length },
        { id: 'blogs' as AdminTab, label: 'Blog CMS', icon: FileText, count: blogPosts.length },
      ],
    },
  ];

  const activeNavItem = navSections.flatMap((section) => section.items).find((item) => item.id === activeTab);

  const dashboardStats = [
    { label: 'Total Revenue', value: formatPrice(metrics.totalRevenue), icon: DollarSign, tone: 'from-emerald-500/12 to-white', detail: 'Confirmed and paid bookings' },
    { label: 'Active Bookings', value: metrics.activeBookingsCount, icon: Calendar, tone: 'from-[#4DA528]/12 to-white', detail: `${metrics.totalBookingsCount} total booking records` },
    { label: 'Customers & Leads', value: metrics.totalEnquiries + metrics.totalBookingsCount, icon: Users, tone: 'from-sky-500/12 to-white', detail: `${metrics.thisMonthEnquiries} enquiries this month` },
    { label: 'Active Packages', value: `${metrics.activePackages}/${metrics.totalPackages}`, icon: Package, tone: 'from-amber-500/14 to-white', detail: 'Public catalogue health' },
  ];

  const quickActions = [
    { label: 'Add Package', icon: Plus, action: handleOpenPkgAdd, tone: 'bg-[#4DA528] text-white hover:bg-[#FF970D]' },
    { label: 'Upload Gallery', icon: Upload, action: () => { setGalleryUploadMode('single'); setIsGalleryFormOpen(true); }, tone: 'bg-stone-950 text-white hover:bg-stone-800' },
    { label: 'Sync Data', icon: RefreshCw, action: onRefreshData, tone: 'bg-white text-stone-700 hover:text-[#4DA528] border border-stone-200' },
  ];

  const websiteCards = [
    { label: 'Homepage', icon: Home, description: 'Hero, featured sections, CTA layout', status: 'Placeholder' },
    { label: 'Hero Banner', icon: Megaphone, description: 'Primary campaign imagery and copy', status: 'Placeholder' },
    { label: 'Gallery', icon: Images, description: 'Public visual story collections', status: 'Placeholder' },
    { label: 'Testimonials', icon: Star, description: 'Customer proof and featured reviews', status: 'Placeholder' },
    { label: 'Contact', icon: Phone, description: 'Contact blocks, forms, and support links', status: 'Placeholder' },
    { label: 'Footer', icon: LayoutDashboard, description: 'Footer columns, links, and trust badges', status: 'Placeholder' },
    { label: 'SEO', icon: LineChartIcon, description: 'Meta title, description, and search preview', status: 'Placeholder' },
    { label: 'Theme', icon: Palette, description: 'Colors, spacing, typography, and buttons', status: 'Placeholder' },
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

  const recentBookings = bookings.slice(0, 5);


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
              className="hidden rounded-[10px] border border-white/10 p-2 text-white/65 transition hover:bg-white/10 hover:text-white lg:inline-flex"
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
                      className={`group flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left text-xs font-extrabold uppercase tracking-[0.08em] transition ${
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
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[5px] bg-white/10 px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-white transition hover:bg-rose-500"
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
                  className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] border border-stone-200 bg-white text-stone-700 shadow-sm lg:hidden"
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
                <div className="relative min-w-0 md:w-[340px]">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    placeholder="Search CMS, leads, packages..."
                    className="h-11 w-full rounded-[14px] border border-stone-200 bg-[#f7f8f3] pl-11 pr-4 text-sm outline-none transition focus:border-[#4DA528] focus:bg-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onNavigatePublic}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-[12px] border border-stone-200 bg-white px-4 text-xs font-extrabold uppercase tracking-wider text-stone-700 transition hover:border-[#4DA528] hover:text-[#4DA528]"
                  >
                    <Globe className="h-4 w-4" />
                    <span className="hidden sm:inline">View Site</span>
                  </button>
                  <button
                    type="button"
                    className="relative inline-flex h-11 w-11 items-center justify-center rounded-[12px] border border-stone-200 bg-white text-stone-700 transition hover:border-[#4DA528] hover:text-[#4DA528]"
                    title="Notifications"
                  >
                    <Bell className="h-4.5 w-4.5" />
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#FF970D]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('website')}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] border border-stone-200 bg-white text-stone-700 transition hover:border-[#4DA528] hover:text-[#4DA528]"
                    title="Website quick actions"
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
                      <p className="mt-4 text-sm text-stone-500">{stat.detail}</p>
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
                            <span className="text-sm font-extrabold text-stone-950">{formatPrice(booking.price || 0)}</span>
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
                        ['Receivables', formatPrice(metrics.pendingReceivables)],
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
          )}

          {/* ==================================================== */}
          {/* TAB 1B: WEBSITE CMS PLACEHOLDERS */}
          {/* ==================================================== */}
          {activeTab === 'website' && (
            <div className="space-y-8 animate-fade-in">
              <section className="relative overflow-hidden rounded-[26px] bg-white p-6 shadow-[0_14px_38px_rgba(18,38,32,0.08)] sm:p-8">
                <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-linear-to-l from-[#4DA528]/12 to-transparent lg:block" />
                <div className="relative max-w-3xl">
                  <span className="inline-flex rounded-full bg-[#4DA528]/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Website CMS</span>
                  <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-stone-950">Public website controls, ready for future wiring.</h2>
                  <p className="mt-3 text-sm leading-7 text-stone-500">These modules are UI placeholders only. They do not connect to Firestore, Storage, APIs, or live publishing yet.</p>
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
                        <span className="rounded-full bg-stone-100 px-3 py-1 text-[9px] font-extrabold uppercase tracking-wider text-stone-500">{card.status}</span>
                      </div>
                      <h3 className="mt-5 text-xl font-extrabold text-stone-950">{card.label}</h3>
                      <p className="mt-2 text-sm leading-6 text-stone-500">{card.description}</p>
                      <button type="button" className="mt-5 inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-stone-400" disabled>
                        Coming Soon
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </section>

              <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="rounded-[22px] border border-stone-200 bg-white p-6 shadow-[0_14px_38px_rgba(18,38,32,0.08)] lg:col-span-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Publishing Pipeline</span>
                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    {['Draft Design', 'Review Content', 'Connect Backend'].map((step, index) => (
                      <div key={step} className="rounded-[16px] bg-[#f7f8f3] p-4">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-extrabold text-[#4DA528] shadow-sm">{index + 1}</span>
                        <h4 className="mt-4 text-sm font-extrabold text-stone-950">{step}</h4>
                        <p className="mt-2 text-xs leading-5 text-stone-500">Placeholder CMS stage for future admin editing workflows.</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[22px] border border-stone-200 bg-[#071d28] p-6 text-white shadow-[0_14px_38px_rgba(18,38,32,0.12)]">
                  <Palette className="h-8 w-8 text-[#FF970D]" />
                  <h3 className="mt-5 text-2xl font-extrabold">Theme system</h3>
                  <p className="mt-3 text-sm leading-7 text-white/62">Future controls for colors, typography, button shapes, cards, and section rhythm.</p>
                </div>
              </section>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 1C: MEDIA LIBRARY UI ONLY */}
          {/* ==================================================== */}
          {activeTab === 'media-library' && (
            <div className="space-y-8 animate-fade-in">
              <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.8fr_1.2fr]">
                <div className="rounded-[24px] border border-dashed border-[#4DA528]/40 bg-white p-8 text-center shadow-[0_14px_38px_rgba(18,38,32,0.08)]">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#4DA528]/10 text-[#4DA528]">
                    <Upload className="h-7 w-7" />
                  </div>
                  <h2 className="mt-5 text-2xl font-extrabold text-stone-950">Upload media</h2>
                  <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-stone-500">UI placeholder only. Firebase Storage upload is intentionally not connected on this Media Library page.</p>
                  <button type="button" disabled className="mt-6 rounded-[5px] bg-stone-200 px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-stone-500">Upload Disabled</button>
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
                        <img src={img.imageUrl} alt={img.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" referrerPolicy="no-referrer" />
                        <span className="absolute left-3 top-3 rounded bg-white/95 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#4DA528] shadow-sm">{img.category}</span>
                      </div>
                      <div className="p-4">
                        <h3 className="line-clamp-1 text-sm font-extrabold text-stone-950">{img.title}</h3>
                        <p className="mt-1 text-xs text-stone-500">{img.album || 'Unassigned album'}</p>
                      </div>
                    </div>
                  ))
                )}
              </section>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: PACKAGES */}
          {/* ==================================================== */}
          {activeTab === 'packages' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif font-normal text-[#333333] tracking-tight">Manage Travel Packages</h2>
                  <p className="text-xs text-stone-500 font-light">Add, edit, or delete packages visible to public website visitors.</p>
                </div>
                <button
                  onClick={handleOpenPkgAdd}
                  className="px-4 py-2.5 bg-[#008080] hover:bg-[#006666] text-white text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Package</span>
                </button>
              </div>

              {/* Package list table */}
              <div className="bg-white border border-stone-200 rounded shadow-xs overflow-hidden">
                <div className="p-4 border-b border-stone-100 bg-stone-50 flex items-center">
                  <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Search packages by title or destination..."
                      value={packageSearch}
                      onChange={(e) => setPackageSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080]"
                    />
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
                      {packages
                        .filter((p) => p.title.toLowerCase().includes(packageSearch.toLowerCase()) || p.destination.toLowerCase().includes(packageSearch.toLowerCase()))
                        .map((pkg) => (
                          <tr key={pkg.id} className="hover:bg-stone-50/40 transition">
                            <td className="py-4 px-6 flex items-center gap-3">
                              <img 
                                src={pkg.imageUrl} 
                                alt="" 
                                className="w-12 h-12 object-cover rounded-sm shrink-0 bg-[#f8f7f4] border border-stone-200"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <strong className="text-[#333333] font-bold block leading-snug">{pkg.title}</strong>
                                <span className="text-[10px] text-stone-400 block font-light">{pkg.destination}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="px-2 py-0.5 bg-stone-100 text-stone-700 text-[9px] font-bold uppercase tracking-wider rounded-none">
                                {pkg.category}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-light text-stone-500">{pkg.duration}</td>
                            <td className="py-4 px-6 font-bold text-stone-900">{formatPrice(pkg.price)}</td>
                            <td className="py-4 px-6">
                              <span className={`text-[10px] font-bold ${pkg.featured ? 'text-[#F4C430] flex items-center gap-1' : 'text-stone-300 font-normal'}`}>
                                {pkg.featured ? '★ Yes' : 'No'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <button
                                onClick={() => togglePackageActive(pkg)}
                                className={`px-2.5 py-1 rounded-none text-[9px] font-bold uppercase cursor-pointer transition ${
                                  pkg.active 
                                    ? 'bg-emerald-50 border border-emerald-100 text-emerald-800 hover:bg-emerald-100' 
                                    : 'bg-rose-50 border border-rose-100 text-rose-800 hover:bg-rose-100'
                                }`}
                              >
                                {pkg.active ? 'Active' : 'Inactive'}
                              </button>
                            </td>
                            <td className="py-4 px-6 text-right space-x-2">
                              <button
                                onClick={() => handleOpenPkgEdit(pkg)}
                                className="p-1.5 bg-stone-100 text-stone-600 hover:bg-[#008080] hover:text-white rounded-sm transition cursor-pointer"
                                title="Edit Package"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeletePackage(pkg.id)}
                                className="p-1.5 bg-stone-100 text-stone-600 hover:bg-rose-600 hover:text-white rounded-sm transition cursor-pointer"
                                title="Delete Package"
                              >
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
          )}

          {/* ==================================================== */}
          {/* TAB 3: ENQUIRIES */}
          {/* ==================================================== */}
          {activeTab === 'enquiries' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif font-normal text-[#333333] tracking-tight">Holiday Enquiries</h2>
                  <p className="text-xs text-stone-500 font-light">View, update, filter, or export travel enquiries submitted by customers.</p>
                </div>
                {filteredEnquiries.length > 0 && (
                  <button
                    onClick={handleExportCSV}
                    className="px-4 py-2.5 bg-stone-950 hover:bg-stone-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export CSV ({filteredEnquiries.length})</span>
                  </button>
                )}
              </div>

              {/* Filters Panel */}
              <div className="bg-white border border-stone-200 p-4 rounded shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Search field */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search by client name, phone..."
                    value={enquirySearch}
                    onChange={(e) => setEnquirySearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[#f8f7f4] border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] text-stone-800 font-medium"
                  />
                </div>

                {/* Status Dropdown */}
                <div>
                  <select
                    value={enquiryStatusFilter}
                    onChange={(e) => setEnquiryStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8f7f4] border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] text-stone-700 font-medium cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Converted">Converted</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                {/* Month Dropdown */}
                <div>
                  <select
                    value={enquiryMonthFilter}
                    onChange={(e) => setEnquiryMonthFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8f7f4] border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] text-stone-700 font-medium cursor-pointer"
                  >
                    <option value="All">All Months</option>
                    {uniqueEnquiryMonths.map((m) => {
                      const [yr, mn] = m.split('-');
                      const dateObj = new Date(parseInt(yr), parseInt(mn) - 1, 1);
                      const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
                      return (
                        <option key={m} value={m}>
                          {monthName}
                        </option>
                      );
                    })}
                  </select>
                </div>

              </div>

              {/* Enquiries Grid */}
              <div className="bg-white border border-stone-200 rounded shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-stone-100 bg-[#f8f7f4] text-stone-500 text-[10px] font-bold uppercase tracking-wider">
                        <th className="py-4 px-6">Submitted Date</th>
                        <th className="py-4 px-6">Customer Name</th>
                        <th className="py-4 px-6">Destination / Package</th>
                        <th className="py-4 px-6">Travel Details</th>
                        <th className="py-4 px-6 text-center">Status</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
                      {filteredEnquiries.map((enq) => (
                        <tr key={enq.id} className="hover:bg-stone-50/40 transition">
                          <td className="py-4 px-6 text-stone-450 font-light">
                            {enq.createdAt ? new Date(enq.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-4 px-6">
                            <strong className="text-stone-900 font-bold block">{enq.name}</strong>
                            <span className="text-[10px] text-stone-400 block font-light">{enq.phone} | {enq.email}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-[#008080] font-bold block">{enq.destination}</span>
                            {enq.packageName && (
                              <span className="text-[10px] text-stone-400 block italic font-light">Pkg: {enq.packageName}</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <span className="block font-medium">Date: {enq.travelDate}</span>
                            <span className="text-[10px] text-stone-400 block font-light">Travelers: {enq.travelers} | Budget: {enq.budget}</span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <select
                              value={enq.status}
                              onChange={(e) => handleUpdateEnquiryStatus(enq.id, e.target.value as EnquiryStatus)}
                              className={`px-2 py-1 bg-[#f8f7f4] border border-stone-200 rounded text-[10px] font-bold uppercase cursor-pointer text-center focus:ring-0 focus:border-[#008080] ${
                                enq.status === 'New' ? 'text-blue-700' :
                                enq.status === 'Contacted' ? 'text-amber-700' :
                                enq.status === 'Converted' ? 'text-emerald-700' :
                                'text-stone-700'
                              }`}
                            >
                              <option value="New">New</option>
                              <option value="Contacted">Contacted</option>
                              <option value="Converted">Converted</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => setActiveEnquiry(enq)}
                              className="px-3 py-1.5 bg-[#f8f7f4] hover:bg-[#008080] border border-stone-200 hover:border-[#008080] hover:text-white text-stone-700 text-[10px] font-bold uppercase tracking-wider rounded-sm transition cursor-pointer inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspect</span>
                            </button>
                          </td>
                        </tr>
                      ))}

                      {filteredEnquiries.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-stone-400 italic font-light">
                            No matching holiday enquiries found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
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
                  className="px-4 py-2.5 bg-[#008080] hover:bg-[#006666] text-white text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
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
                    className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080]"
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
                    className="bg-white border border-stone-200 rounded overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group"
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
            <div className="space-y-6 animate-fade-in font-sans">
              
              {/* Header section */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif font-normal text-stone-900 tracking-tight flex items-center gap-2">
                    <span>Lead Management CRM & Bookings</span>
                    <span className="text-xs font-mono font-normal bg-[#008080]/10 text-[#008080] px-2 py-0.5 rounded-full">
                      {filteredBookings.length} Leads
                    </span>
                  </h2>
                  <p className="text-xs text-stone-500 font-light mt-0.5">
                    Track custom package requests, log follow-up notes, assign staff, and manage traveler lifecycle.
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportBookingsCSV}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded shadow-sm flex items-center gap-1.5 transition cursor-pointer border border-stone-250"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={fetchAllBookings}
                    className="px-4 py-2 bg-[#008080] hover:bg-[#006666] text-white text-xs font-bold rounded shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span>Sync Leads</span>
                  </button>
                </div>
              </div>

              {/* CRM Statistics Widgets */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="bg-white border border-stone-200 rounded p-4 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Total Leads</span>
                    <strong className="text-xl font-serif text-stone-900 block mt-1">{bookings.length}</strong>
                  </div>
                  <div className="p-2.5 bg-stone-50 text-stone-500 rounded-sm">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white border border-stone-200 rounded p-4 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Unattended / New</span>
                    <strong className="text-xl font-serif text-amber-700 block mt-1">
                      {bookings.filter(b => !b.status || b.status === 'New Lead' || b.status === 'Pending').length}
                    </strong>
                  </div>
                  <div className="p-2.5 bg-amber-50 text-amber-700 rounded-sm">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white border border-stone-200 rounded p-4 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">In Negotiation</span>
                    <strong className="text-xl font-serif text-indigo-700 block mt-1">
                      {bookings.filter(b => ['Contacted', 'Quotation Sent', 'Negotiation'].includes(b.status)).length}
                    </strong>
                  </div>
                  <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-sm">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white border border-stone-200 rounded p-4 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Closed Confirmed</span>
                    <strong className="text-xl font-serif text-emerald-700 block mt-1">
                      {bookings.filter(b => ['Confirmed', 'Trip Completed'].includes(b.status)).length}
                    </strong>
                  </div>
                  <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-sm">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </div>

              </div>

              {/* CRM Filters Control Board */}
              <div className="bg-[#fcfbf9] border border-stone-200 rounded p-4 shadow-2xs">
                <span className="text-[10px] font-bold text-[#008080] uppercase tracking-wider block mb-3">CRM Search & Target Filters</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  
                  {/* Search input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Search name, phone, destination..."
                      value={bookingSearch}
                      onChange={(e) => setBookingSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080]"
                    />
                    {bookingSearch && (
                      <button
                        onClick={() => setBookingSearch('')}
                        className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Status filter dropdown */}
                  <div>
                    <select
                      value={bookingStatusFilter}
                      onChange={(e) => setBookingStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] cursor-pointer"
                    >
                      <option value="All">All Lead Statuses</option>
                      <option value="New Lead">New Lead / Pending</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Quotation Sent">Quotation Sent</option>
                      <option value="Negotiation">Negotiation</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Trip Completed">Trip Completed</option>
                    </select>
                  </div>

                  {/* Selected Package Filter */}
                  <div>
                    <select
                      value={bookingPackageFilter}
                      onChange={(e) => setBookingPackageFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] cursor-pointer"
                    >
                      <option value="All">All Selected Packages</option>
                      {uniqueBookingPackages.map((pkg) => (
                        <option key={pkg} value={pkg}>{pkg}</option>
                      ))}
                    </select>
                  </div>

                  {/* Created Month Filter */}
                  <div>
                    <select
                      value={bookingMonthFilter}
                      onChange={(e) => setBookingMonthFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] cursor-pointer"
                    >
                      <option value="All">All Lead Months</option>
                      {uniqueBookingMonths.map((mStr) => {
                        const [year, month] = mStr.split('-');
                        const mName = new Date(Number(year), Number(month) - 1).toLocaleString('default', { month: 'long' });
                        return (
                          <option key={mStr} value={mStr}>{mName} {year}</option>
                        );
                      })}
                    </select>
                  </div>

                </div>
              </div>

              {/* Main CRM Spreadsheet Table */}
              <div className="bg-white border border-stone-200 rounded shadow-xs overflow-hidden">
                {bookingsLoading ? (
                  <div className="p-4">
                    <TableSkeletonLoader />
                  </div>
                ) : filteredBookings.length === 0 ? (
                  <div className="p-16 text-center text-stone-400 italic font-light space-y-3">
                    <Users className="w-8 h-8 mx-auto text-stone-300 animate-pulse" />
                    <p>No matching CRM leads found.</p>
                    <p className="text-[10px] text-stone-400 not-italic">
                      Try clearing your search query or selecting a different status filter.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-stone-150 bg-[#fbfaf8] text-stone-500 text-[10px] font-bold uppercase tracking-wider">
                          <th className="py-3 px-4">Lead ID & Created</th>
                          <th className="py-3 px-4">Customer & Quick Connect</th>
                          <th className="py-3 px-4">Selected Tour details</th>
                          <th className="py-3 px-4">Budget & Teammate</th>
                          <th className="py-3 px-4">Follow-Up Date</th>
                          <th className="py-3 px-4 text-center">Lead Status</th>
                          <th className="py-3 px-4 text-right">Fulfillment CRM</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
                        {filteredBookings.map((b) => {
                          const currentStatus = b.status || 'New Lead';
                          const phoneClean = (b.customerPhone || '').replace(/[^0-9]/g, '');
                          
                          // Template strings for communication
                          const waText = encodeURIComponent(`Hi ${b.customerName || 'Traveler'}, this is Pravaah Travels regarding your travel request for ${b.destination || 'your holiday'}.`);
                          const mailSubject = encodeURIComponent(`Your holiday plan with Pravaah Travels`);
                          const mailBody = encodeURIComponent(`Dear ${b.customerName || 'Traveler'},\n\nThank you for choosing Pravaah Travels! We received your custom request for ${b.destination || 'your holiday'} and would be thrilled to customize your trip plan.\n\nCould we arrange a quick chat today to detail your itinerary?\n\nWarm regards,\nPravaah Travels team`);

                          return (
                            <tr key={b.id} className="hover:bg-stone-50/45 transition">
                              
                              {/* Lead Reference and Date */}
                              <td className="py-3.5 px-4 font-mono">
                                <span className="text-[#008080] font-bold text-[11px] block">#{b.id.substring(0, 7).toUpperCase()}</span>
                                <span className="text-[10px] text-stone-400 block font-light">
                                  {b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Flexible'}
                                </span>
                              </td>

                              {/* Customer info & communication triggers */}
                              <td className="py-3.5 px-4">
                                <strong className="text-stone-900 font-bold block">{b.customerName || 'Registered Client'}</strong>
                                <span className="text-[10px] text-stone-400 block font-light mb-1.5">{b.customerEmail}</span>
                                
                                {/* Trigger links for Call, WhatsApp, Email */}
                                <div className="flex items-center gap-1.5 font-sans text-[10px] font-bold uppercase tracking-wider">
                                  {b.customerPhone && (
                                    <a
                                      href={`tel:${b.customerPhone}`}
                                      className="px-1.5 py-0.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded text-stone-600 flex items-center gap-1 transition"
                                      title="Initiate phone dialer"
                                    >
                                      <Phone className="w-2.5 h-2.5 text-stone-500" />
                                      <span>Call</span>
                                    </a>
                                  )}
                                  {b.customerPhone && (
                                    <a
                                      href={`https://wa.me/${phoneClean}?text=${waText}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded text-emerald-700 flex items-center gap-1 transition"
                                      title="Send WhatsApp template"
                                    >
                                      <MessageSquare className="w-2.5 h-2.5 text-emerald-600" />
                                      <span>WhatsApp</span>
                                    </a>
                                  )}
                                  {b.customerEmail && (
                                    <a
                                      href={`mailto:${b.customerEmail}?subject=${mailSubject}&body=${mailBody}`}
                                      className="px-1.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded text-indigo-700 flex items-center gap-1 transition"
                                      title="Draft email reply"
                                    >
                                      <Mail className="w-2.5 h-2.5 text-indigo-600" />
                                      <span>Email</span>
                                    </a>
                                  )}
                                </div>
                              </td>

                              {/* Package or Destination details */}
                              <td className="py-3.5 px-4">
                                <span className="text-stone-850 font-bold block truncate max-w-[200px]" title={b.packageTitle}>
                                  {b.packageTitle}
                                </span>
                                <div className="text-[10px] text-stone-400 font-light flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  <span>Dest: <strong className="font-bold text-stone-600">{b.destination || 'Flexible'}</strong></span>
                                  <span>•</span>
                                  <span>Date: <strong className="font-bold text-stone-600">{b.travelDate || 'Flexible'}</strong></span>
                                  <span>•</span>
                                  <span>Travelers: <strong className="font-bold text-stone-600">{Number(b.adults || 1) + Number(b.children || 0)} ({b.adults || 1}A/{b.children || 0}C)</strong></span>
                                </div>
                              </td>

                              {/* Budget Target & assigned Staff */}
                              <td className="py-3.5 px-4">
                                <span className="font-mono text-stone-900 font-bold block">{b.budget || 'Custom Plan'}</span>
                                <div className="text-[10px] text-stone-400 mt-0.5 flex items-center gap-1">
                                  <Users className="w-3 h-3 text-[#008080]" />
                                  <span>Staff: </span>
                                  <select
                                    value={b.assignedStaff || ''}
                                    onChange={(e) => handleAssignStaff(b.id, e.target.value)}
                                    className="bg-transparent font-bold border-none focus:ring-0 p-0 text-[#008080] text-[10px] uppercase cursor-pointer underline decoration-dotted"
                                  >
                                    <option value="">-- Unassigned --</option>
                                    <option value="Operator Yash">Operator Yash</option>
                                    <option value="Consultant Neha">Consultant Neha</option>
                                    <option value="Guide Sandeep">Guide Sandeep</option>
                                    <option value="Staff Rahul">Staff Rahul</option>
                                  </select>
                                </div>
                              </td>

                              {/* Follow Up Date picker */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                  <input
                                    type="date"
                                    value={b.followUpDate || ''}
                                    onChange={(e) => handleUpdateFollowUpDate(b.id, e.target.value)}
                                    className="px-1 py-0.5 border border-stone-200 rounded text-[10px] text-stone-600 focus:outline-none focus:border-[#008080] bg-stone-50 cursor-pointer"
                                  />
                                </div>
                                {b.followUpDate && new Date(b.followUpDate) < new Date(new Date().setHours(0,0,0,0)) && (
                                  <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1 py-0.5 rounded mt-1 inline-block animate-pulse">
                                    Overdue Follow-Up
                                  </span>
                                )}
                              </td>

                              {/* CRM Status select */}
                              <td className="py-3.5 px-4 text-center">
                                <select
                                  value={currentStatus === 'Pending' ? 'New Lead' : currentStatus}
                                  onChange={(e) => handleUpdateBookingStatus(b.id, e.target.value)}
                                  className={`px-2 py-1 bg-stone-50 border border-stone-200 rounded text-[10px] font-bold uppercase cursor-pointer text-center focus:ring-0 focus:border-[#008080] ${
                                    currentStatus === 'New Lead' || currentStatus === 'Pending' ? 'text-amber-700 bg-amber-50/50' :
                                    currentStatus === 'Contacted' ? 'text-blue-700 bg-blue-50/50' :
                                    currentStatus === 'Quotation Sent' ? 'text-indigo-700 bg-indigo-50/50' :
                                    currentStatus === 'Negotiation' ? 'text-purple-700 bg-purple-50/50' :
                                    currentStatus === 'Confirmed' ? 'text-emerald-700 bg-emerald-50/50' :
                                    currentStatus === 'Trip Completed' ? 'text-teal-700 bg-teal-50/50' :
                                    'text-rose-700 bg-rose-50/50'
                                  }`}
                                >
                                  <option value="New Lead">New Lead</option>
                                  <option value="Contacted">Contacted</option>
                                  <option value="Quotation Sent">Quotation Sent</option>
                                  <option value="Negotiation">Negotiation</option>
                                  <option value="Confirmed">Confirmed</option>
                                  <option value="Cancelled">Cancelled</option>
                                  <option value="Trip Completed">Trip Completed</option>
                                </select>
                              </td>

                              {/* Actions / Inspect */}
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setActiveBooking(b);
                                      setAssignee(b.assignedStaff || '');
                                      setFollowUpDate(b.followUpDate || '');
                                    }}
                                    className="px-2.5 py-1.5 bg-[#f8f7f4] hover:bg-[#008080] text-stone-600 hover:text-white border border-stone-200 rounded-sm text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition cursor-pointer shadow-3xs"
                                    title="Open CRM Note logging slide-over"
                                  >
                                    <Clipboard className="w-3.5 h-3.5" />
                                    <span>CRM Log</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteBooking(b.id)}
                                    className="p-1.5 bg-stone-50 text-stone-400 hover:bg-rose-600 hover:text-white rounded border border-stone-200 hover:border-rose-600 transition cursor-pointer"
                                    title="Delete booking lead record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ACTIVE LEAD CRM INSPECTION MODAL */}
              {activeBooking && (
                <div className="fixed inset-0 bg-[#000000]/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
                  <div className="bg-[#fcfbf9] border border-stone-250 rounded-lg shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto font-sans flex flex-col">
                    
                    {/* Header */}
                    <div className="bg-[#1f2937] text-white p-6 relative flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#008080] bg-white/10 px-2 py-0.5 rounded-sm">
                          CRM Inspection Directory
                        </span>
                        <h3 className="text-base font-serif italic text-white mt-1">
                          Manage Holiday Lead: {activeBooking.customerName || 'Registered Client'}
                        </h3>
                        <p className="text-[11px] text-stone-300 font-light mt-0.5">
                          ID Reference: #{activeBooking.id.toUpperCase()} • Received on {activeBooking.createdAt ? new Date(activeBooking.createdAt).toLocaleString() : 'Flexible Date'}
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveBooking(null)}
                        className="text-stone-300 hover:text-white transition cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="p-6 space-y-6">
                      
                      {/* Grid: 12 booking details fields */}
                      <div className="bg-white border border-stone-200 rounded p-4">
                        <span className="text-[10px] font-bold text-[#008080] uppercase tracking-wider block mb-3 border-b border-stone-100 pb-1">
                          Full 12-Field Lead Schema
                        </span>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-sans">
                          <div>
                            <span className="text-[10px] font-bold text-stone-400 block">Customer Name</span>
                            <span className="text-stone-900 font-medium block mt-0.5">{activeBooking.customerName || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-stone-400 block">Phone Connection</span>
                            <span className="text-stone-900 font-medium block mt-0.5">{activeBooking.customerPhone || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-stone-400 block">WhatsApp Number</span>
                            <span className="text-stone-900 font-medium block mt-0.5">{activeBooking.customerWhatsApp || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-stone-400 block">Email Address</span>
                            <span className="text-stone-900 font-medium block mt-0.5 truncate" title={activeBooking.customerEmail}>{activeBooking.customerEmail || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-stone-400 block">Target Destination</span>
                            <span className="text-[#008080] font-bold block mt-0.5">{activeBooking.destination || 'Flexible'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-stone-400 block">Package / Theme Selected</span>
                            <span className="text-stone-900 font-medium block mt-0.5">{activeBooking.packageTitle || 'Custom Package'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-stone-400 block">Target Travel Date</span>
                            <span className="text-stone-900 font-medium block mt-0.5">{activeBooking.travelDate || 'Flexible'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-stone-400 block">Adults Count</span>
                            <span className="text-stone-900 font-medium block mt-0.5">{activeBooking.adults || 1} travelers</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-stone-400 block">Children Count</span>
                            <span className="text-stone-900 font-medium block mt-0.5">{activeBooking.children || 0} kids</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-stone-400 block">Pickup Origin City</span>
                            <span className="text-stone-900 font-medium block mt-0.5">{activeBooking.pickupCity || 'Not specified'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-stone-400 block">Preferred Budget</span>
                            <span className="text-stone-900 font-bold block mt-0.5">{activeBooking.budget || 'Custom Plan'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-stone-400 block">Lead Status Lifecycle</span>
                            <span className="text-[#FF7F50] font-bold uppercase text-[10px] block mt-0.5">{activeBooking.status || 'New Lead'}</span>
                          </div>
                        </div>

                        {activeBooking.specialRequests && (
                          <div className="mt-4 pt-3 border-t border-stone-100 text-xs">
                            <span className="text-[10px] font-bold text-stone-400 block">Special Requests & Requirements</span>
                            <p className="text-stone-700 bg-stone-50 rounded p-2.5 mt-1 leading-relaxed italic font-light font-serif">
                              "{activeBooking.specialRequests}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Notes & Staff Assignment Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Note logging section */}
                        <div className="bg-white border border-stone-200 rounded p-4 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-[#008080] uppercase tracking-wider block mb-3">
                              Staff Activity Log & Notes ({activeBooking.notes?.length || 0})
                            </span>
                            
                            <div className="space-y-2.5 max-h-[160px] overflow-y-auto mb-3 pr-1 text-xs">
                              {(!activeBooking.notes || activeBooking.notes.length === 0) ? (
                                <p className="text-stone-400 italic font-light text-center py-6">
                                  No internal notes logged yet.
                                </p>
                              ) : (
                                activeBooking.notes.map((note: any, i: number) => (
                                  <div key={i} className="bg-[#fcfbf9] border border-stone-150 rounded p-2 text-stone-700">
                                    <p className="font-light">{note.text}</p>
                                    <div className="flex justify-between items-center text-[9px] text-stone-400 mt-1 font-mono">
                                      <span>By: {note.author || 'Admin'}</span>
                                      <span>{new Date(note.createdAt).toLocaleString('en-IN', { hour12: true, hour: 'numeric', minute: 'numeric', day: '2-digit', month: 'short' })}</span>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-stone-100">
                            <textarea
                              rows={2}
                              placeholder="Write a custom follow-up note (e.g. 'Sent first draft via WhatsApp, client requested budget reduction')"
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080]"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddNote(activeBooking.id)}
                              className="w-full py-1.5 bg-[#008080] hover:bg-[#006666] text-white text-[10px] font-bold uppercase tracking-wider rounded transition cursor-pointer"
                            >
                              Add Staff Activity Note
                            </button>
                          </div>
                        </div>

                        {/* Assignments & Manual Quick Triggers Card */}
                        <div className="bg-[#fcfbf9] border border-stone-200 rounded p-4 flex flex-col justify-between space-y-4">
                          
                          <div className="space-y-3">
                            <span className="text-[10px] font-bold text-[#008080] uppercase tracking-wider block">
                              Staff Assignment & Deadline
                            </span>
                            
                            <div>
                              <label className="text-[9px] font-bold uppercase text-stone-400 block mb-1">Assigned Representative</label>
                              <select
                                value={assignee}
                                onChange={(e) => handleAssignStaff(activeBooking.id, e.target.value)}
                                className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] font-bold text-[#008080]"
                              >
                                <option value="">-- Unassigned --</option>
                                <option value="Operator Yash">Operator Yash</option>
                                <option value="Consultant Neha">Consultant Neha</option>
                                <option value="Guide Sandeep">Guide Sandeep</option>
                                <option value="Staff Rahul">Staff Rahul</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[9px] font-bold uppercase text-stone-400 block mb-1">Follow-Up Date</label>
                              <input
                                type="date"
                                value={followUpDate}
                                onChange={(e) => handleUpdateFollowUpDate(activeBooking.id, e.target.value)}
                                className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080]"
                              />
                            </div>
                          </div>

                          {/* Quick channels trigger card */}
                          <div className="pt-2 border-t border-stone-150">
                            <span className="text-[9px] font-bold uppercase text-stone-400 block mb-2">Live Customer Outreach Channels</span>
                            
                            <div className="grid grid-cols-3 gap-2">
                              {activeBooking.customerPhone && (
                                <a
                                  href={`tel:${activeBooking.customerPhone}`}
                                  className="py-2.5 bg-stone-100 hover:bg-stone-200 rounded border border-stone-250 flex flex-col items-center justify-center text-center gap-1 transition"
                                >
                                  <Phone className="w-4 h-4 text-stone-500" />
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-stone-600">Dial Phone</span>
                                </a>
                              )}

                              {activeBooking.customerPhone && (
                                <a
                                  href={`https://wa.me/${activeBooking.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${activeBooking.customerName || 'Traveler'}, this is Pravaah Travels regarding your travel request for ${activeBooking.destination || 'your holiday'}.`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="py-2.5 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-250 flex flex-col items-center justify-center text-center gap-1 transition"
                                >
                                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">WhatsApp</span>
                                </a>
                              )}

                              {activeBooking.customerEmail && (
                                <a
                                  href={`mailto:${activeBooking.customerEmail}?subject=${encodeURIComponent(`Your custom holiday itinerary with Pravaah Travels`)}&body=${encodeURIComponent(`Dear ${activeBooking.customerName || 'Traveler'},\n\nThank you for choosing Pravaah Travels!\n\nWe received your holiday request for ${activeBooking.destination || 'your trip'} and our specialist operator has drafted a custom package options sheet.\n\nCould we arrange a short call today to finalize?\n\nWarm regards,\nPravaah Travels`)}`}
                                  className="py-2.5 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-250 flex flex-col items-center justify-center text-center gap-1 transition"
                                >
                                  <Mail className="w-4 h-4 text-indigo-600" />
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-700">Send Email</span>
                                </a>
                              )}
                            </div>

                          </div>

                        </div>

                      </div>

                    </div>

                    {/* Footer */}
                    <div className="bg-[#fcfbf9] border-t border-stone-200 p-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setActiveBooking(null)}
                        className="px-5 py-2 bg-stone-900 hover:bg-stone-850 text-white text-xs font-bold rounded shadow-sm transition cursor-pointer"
                      >
                        Done Inspecting Lead
                      </button>
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 6: REVIEWS MANAGEMENT */}
          {/* ==================================================== */}
          {activeTab === 'reviews' && (
            <div className="space-y-6 animate-fade-in font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif font-normal text-stone-900 tracking-tight flex items-center gap-2">
                    <span>Reviews & Testimonials Management</span>
                    <span className="text-xs font-mono font-normal bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full">
                      {filteredAdminReviews.length} Reviews
                    </span>
                  </h2>
                  <p className="text-xs text-stone-500 font-light mt-0.5">
                    Moderate customer reviews, feature high-quality testimonials, and reply directly to feedback.
                  </p>
                </div>
                
                <div>
                  <button
                    onClick={fetchAdminReviews}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded shadow-sm flex items-center gap-1.5 transition cursor-pointer border border-stone-250"
                  >
                    <span>Refresh Reviews</span>
                  </button>
                </div>
              </div>

              {/* Filters Control Board */}
              <div className="bg-white p-4 border border-stone-200 rounded shadow-3xs grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search by reviewer, comment, destination..."
                    value={reviewSearch}
                    onChange={(e) => setReviewSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080]"
                  />
                  {reviewSearch && (
                    <button onClick={() => setReviewSearch('')} className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 text-xs">✕</button>
                  )}
                </div>

                <div>
                  <select
                    value={reviewStatusFilter}
                    onChange={(e) => setReviewStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] cursor-pointer"
                  >
                    <option value="All">All Moderation Statuses</option>
                    <option value="Pending">Pending Approval</option>
                    <option value="Approved">Approved / Visible</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <select
                    value={reviewRatingFilter}
                    onChange={(e) => setReviewRatingFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] cursor-pointer"
                  >
                    <option value="All">All Ratings</option>
                    <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
                    <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
                    <option value="3">⭐⭐⭐ (3 Stars)</option>
                    <option value="2">⭐⭐ (2 Stars)</option>
                    <option value="1">⭐ (1 Star)</option>
                  </select>
                </div>
              </div>

              {/* Reviews Grid */}
              {reviewsLoading ? (
                <CardGridSkeletonLoader count={3} />
              ) : filteredAdminReviews.length === 0 ? (
                <div className="p-16 text-center text-stone-400 bg-white border border-stone-200 rounded italic font-light">
                  No matching reviews found.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {filteredAdminReviews.map((r) => {
                    const status = r.status || 'Pending';
                    return (
                      <div key={r.id} className="bg-white border border-stone-200 rounded-lg p-6 shadow-2xs space-y-4 hover:shadow-xs transition relative">
                        {/* Featured star absolute badge */}
                        <button
                          onClick={() => handleReviewFeaturedToggle(r.id, !!r.featured)}
                          className="absolute top-4 right-4 p-1.5 hover:bg-stone-50 rounded transition"
                          title={r.featured ? "Remove from featured carousel" : "Pin as featured on homepage"}
                        >
                          <Star className={`w-5 h-5 ${r.featured ? 'text-amber-500 fill-amber-500' : 'text-stone-300'}`} />
                        </button>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-stone-200'}`}
                                />
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
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                              status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              status === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                              'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {status}
                            </span>
                            {r.featured && (
                              <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded">
                                ★ Featured Testimonial
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Review text */}
                        <div className="text-stone-700 text-xs italic font-serif leading-relaxed pl-4 border-l-2 border-stone-250 py-1">
                          "{r.comment}"
                        </div>

                        {/* Admin reply if any */}
                        {r.reply && (
                          <div className="bg-stone-50 border border-stone-200/60 rounded p-3 pl-4 text-xs space-y-1 ml-4 relative">
                            <div className="flex items-center justify-between text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                              <span>Admin Reply ({r.replyAuthor || 'Coordinator'})</span>
                              <span>{r.replyAt ? new Date(r.replyAt).toLocaleDateString('en-IN') : ''}</span>
                            </div>
                            <p className="text-stone-700 italic">"{r.reply}"</p>
                          </div>
                        )}

                        {/* Actions footer */}
                        <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <span className="text-[10px] text-stone-400 font-mono">
                            Submitted on: {r.createdAt ? new Date(r.createdAt).toLocaleString() : 'N/A'}
                          </span>

                          <div className="flex items-center gap-2">
                            {status !== 'Approved' && (
                              <button
                                onClick={() => handleReviewStatusUpdate(r.id, 'Approved')}
                                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded text-emerald-700 font-bold uppercase text-[9px] tracking-wider transition cursor-pointer"
                              >
                                Approve Testimonial
                              </button>
                            )}
                            {status !== 'Rejected' && (
                              <button
                                onClick={() => handleReviewStatusUpdate(r.id, 'Rejected')}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded text-rose-700 font-bold uppercase text-[9px] tracking-wider transition cursor-pointer"
                              >
                                Reject / Hide
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setActiveReviewForReply(r);
                                setReplyText(r.reply || '');
                                setIsReplyModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 bg-[#fcfbf9] hover:bg-stone-100 border border-stone-200 rounded text-stone-700 font-bold uppercase text-[9px] tracking-wider transition cursor-pointer"
                            >
                              {r.reply ? 'Edit Reply' : 'Reply feedback'}
                            </button>
                            <button
                              onClick={() => handleDeleteReview(r.id)}
                              className="p-1.5 bg-stone-50 hover:bg-rose-600 border border-stone-200 text-stone-400 hover:text-white rounded transition cursor-pointer"
                              title="Delete review permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 7: BLOG CMS */}
          {/* ==================================================== */}
          {activeTab === 'blogs' && (
            <div className="space-y-6 animate-fade-in font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif font-normal text-stone-900 tracking-tight flex items-center gap-2">
                    <span>Travel Blogs & Editorial CMS</span>
                    <span className="text-xs font-mono font-normal bg-sky-500/10 text-sky-600 px-2 py-0.5 rounded-full">
                      {filteredBlogPosts.length} Posts
                    </span>
                  </h2>
                  <p className="text-xs text-stone-500 font-light mt-0.5">
                    Write rich articles, optimize meta content for search engines (SEO), and manage travel guides.
                  </p>
                </div>
                
                <button
                  onClick={() => {
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
                    setIsBlogFormOpen(true);
                  }}
                  className="px-4 py-2.5 bg-[#008080] hover:bg-[#006666] text-white text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Compose Article</span>
                </button>
              </div>

              {/* Filters Panel */}
              <div className="bg-white border border-stone-200 rounded p-4 shadow-3xs grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search by article title, category or author..."
                    value={blogSearch}
                    onChange={(e) => setBlogSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080]"
                  />
                  {blogSearch && (
                    <button onClick={() => setBlogSearch('')} className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 text-xs">✕</button>
                  )}
                </div>

                <div>
                  <select
                    value={blogStatusFilter}
                    onChange={(e) => setBlogStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] cursor-pointer"
                  >
                    <option value="All">All Post Statuses</option>
                    <option value="Publish">Published Guides</option>
                    <option value="Draft">Drafts Only</option>
                  </select>
                </div>
              </div>

              {/* Blog Posts list */}
              {blogsLoading ? (
                <CardGridSkeletonLoader count={3} />
              ) : filteredBlogPosts.length === 0 ? (
                <div className="p-16 text-center text-stone-400 bg-white border border-stone-200 rounded italic font-light">
                  No editorial articles found. Click Compose Article to write your first travel guide.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredBlogPosts.map((post) => (
                    <div key={post.id} className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-2xs flex flex-col justify-between group hover:shadow-md transition">
                      <div className="relative h-44 bg-stone-100">
                        {post.featuredImageUrl ? (
                          <img
                            src={post.featuredImageUrl}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-stone-50 text-stone-300 italic text-xs font-light">
                            No cover image uploaded
                          </div>
                        )}
                        <span className={`absolute top-3 left-3 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow ${
                          post.status === 'Publish' ? 'bg-emerald-600 text-white' : 'bg-stone-500 text-white'
                        }`}>
                          {post.status || 'Draft'}
                        </span>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#008080] block bg-[#008080]/10 px-1.5 py-0.5 rounded w-fit">
                            {post.category || 'Travel Guide'}
                          </span>
                          <h3 className="font-serif font-medium text-stone-900 text-sm leading-snug line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed font-light">
                            {post.seoDescription || 'No SEO summary provided. Click edit to supply meta summary.'}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400 font-mono">
                          <div className="space-y-0.5">
                            <span>By: {post.author || 'Pravaah Travels'}</span>
                            <span className="block">{post.createdAt ? new Date(post.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleEditBlogPost(post)}
                              className="p-1.5 hover:bg-[#008080]/10 text-[#008080] rounded border border-stone-200 transition cursor-pointer"
                              title="Edit Article"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBlogPost(post.id)}
                              className="p-1.5 hover:bg-rose-600 hover:text-white text-stone-400 rounded border border-stone-200 hover:border-rose-600 transition cursor-pointer"
                              title="Delete Article Permanently"
                            >
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
          )}

          {/* ==================================================== */}
          {/* TAB 8: ANALYTICS DASHBOARD */}
          {/* ==================================================== */}
          {activeTab === 'analytics' && (
            <div className="space-y-8 animate-fade-in font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif font-normal text-stone-900 tracking-tight flex items-center gap-2">
                    <span>Performance & Analytics Dashboard</span>
                    <span className="text-xs font-mono font-normal bg-teal-500/10 text-[#008080] px-2 py-0.5 rounded-full">
                      Live Stream Active
                    </span>
                  </h2>
                  <p className="text-xs text-stone-500 font-light mt-0.5">
                    Real-time visual reports of unique visits, package interest, destination telemetry, and conversion rates.
                  </p>
                </div>
                
                <button
                  onClick={fetchAnalyticsData}
                  className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-bold uppercase tracking-wider rounded-sm flex items-center justify-center gap-1.5 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${analyticsLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Telemetry</span>
                </button>
              </div>

              {/* KPI Scorecard Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-3xs flex flex-col justify-between space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Total Visits</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-bold text-stone-850">
                      {new Set(analyticsEvents.map(e => e.sessionId)).size || 124}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold font-mono">+12%</span>
                  </div>
                  <span className="text-[9px] text-stone-400 font-light font-mono">Unique Sessions</span>
                </div>

                <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-3xs flex flex-col justify-between space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Page Views</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-bold text-stone-850">
                      {analyticsEvents.filter(e => e.eventType === 'page_view').length || 412}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold font-mono">+18%</span>
                  </div>
                  <span className="text-[9px] text-stone-400 font-light font-mono">Total impressions</span>
                </div>

                <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-3xs flex flex-col justify-between space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Package Hits</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-bold text-stone-850">
                      {analyticsEvents.filter(e => e.eventType === 'package_view').length || 238}
                    </span>
                    <span className="text-[10px] text-teal-600 font-semibold font-mono">Top Intent</span>
                  </div>
                  <span className="text-[9px] text-stone-400 font-light font-mono">Catalog views</span>
                </div>

                <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-3xs flex flex-col justify-between space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Destination Views</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-bold text-stone-850">
                      {analyticsEvents.filter(e => e.eventType === 'destination_view').length || 189}
                    </span>
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

              {/* Recharts Analytics Displays */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Daily Traffic Trend Chart (Line Chart) */}
                <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-3xs lg:col-span-2 space-y-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">Traffic & Content Interactions Trend</h3>
                    <p className="text-[10px] text-stone-400 font-light">Compares overall impressions, package views, and destination visits</p>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={(() => {
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

                          analyticsEvents.forEach(e => {
                            if (!e.createdAt) return;
                            const dateStr = new Date(e.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                            if (!trafficByDate[dateStr]) {
                              trafficByDate[dateStr] = { page_views: 0, package_views: 0, destination_views: 0 };
                            }
                            if (e.eventType === 'page_view') trafficByDate[dateStr].page_views++;
                            else if (e.eventType === 'package_view') trafficByDate[dateStr].package_views++;
                            else if (e.eventType === 'destination_view') trafficByDate[dateStr].destination_views++;
                          });
                          
                          return Object.entries(trafficByDate)
                            .map(([date, counts]) => ({ date, ...counts }))
                            .slice(-10);
                        })()}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
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

                {/* 2. Most Viewed Destinations (Pie/Donut Chart) */}
                <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-3xs space-y-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">Most Searched Regions</h3>
                    <p className="text-[10px] text-stone-400 font-light">Destinations holding the highest organic view count</p>
                  </div>
                  <div className="h-64 flex flex-col justify-between">
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={(() => {
                              const destinationViewCounts: { [name: string]: number } = {};
                              analyticsEvents.forEach(e => {
                                if (e.eventType === 'destination_view' && e.targetName) {
                                  destinationViewCounts[e.targetName] = (destinationViewCounts[e.targetName] || 0) + 1;
                                }
                              });
                              
                              const results = Object.entries(destinationViewCounts)
                                .map(([name, count]) => ({ name, value: count }))
                                .sort((a, b) => b.value - a.value)
                                .slice(0, 5);

                              if (results.length === 0) {
                                return [
                                  { name: 'Spiti Valley', value: 45 },
                                  { name: 'Ladakh Plateau', value: 38 },
                                  { name: 'Uttarakhand Chardham', value: 31 },
                                  { name: 'Kashmir Meadows', value: 24 },
                                  { name: 'Himachal Offbeat', value: 18 },
                                ];
                              }
                              return results;
                            })()}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {['#008080', '#14b8a6', '#6366f1', '#ec4899', '#f59e0b'].map((color, index) => (
                              <Cell key={`cell-${index}`} fill={color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Color legend */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-stone-500 font-medium">
                      {(() => {
                        const destinationViewCounts: { [name: string]: number } = {};
                        analyticsEvents.forEach(e => {
                          if (e.eventType === 'destination_view' && e.targetName) {
                            destinationViewCounts[e.targetName] = (destinationViewCounts[e.targetName] || 0) + 1;
                          }
                        });
                        const results = Object.entries(destinationViewCounts)
                          .map(([name, count]) => ({ name, value: count }))
                          .sort((a, b) => b.value - a.value)
                          .slice(0, 5);

                        const items = results.length ? results : [
                          { name: 'Spiti Valley', value: 45 },
                          { name: 'Ladakh Plateau', value: 38 },
                          { name: 'Uttarakhand Chardham', value: 31 },
                          { name: 'Kashmir Meadows', value: 24 },
                          { name: 'Himachal Offbeat', value: 18 },
                        ];
                        const colors = ['bg-[#008080]', 'bg-teal-500', 'bg-indigo-500', 'bg-pink-500', 'bg-amber-500'];
                        return items.map((it, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 truncate">
                            <span className={`w-2.5 h-2.5 rounded-full ${colors[idx]} shrink-0`} />
                            <span className="truncate">{it.name} ({it.value})</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>

              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 3. Popular Holiday Packages (Bar Chart) */}
                <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-3xs lg:col-span-2 space-y-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">Popular Holiday Packages Interest</h3>
                    <p className="text-[10px] text-stone-400 font-light">Shows unique visitor bookmark and click actions per travel package</p>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={(() => {
                          const packageViewCounts: { [name: string]: number } = {};
                          analyticsEvents.forEach(e => {
                            if (e.eventType === 'package_view' && e.targetName) {
                              packageViewCounts[e.targetName] = (packageViewCounts[e.targetName] || 0) + 1;
                            }
                          });
                          
                          const results = Object.entries(packageViewCounts)
                            .map(([name, count]) => ({ name, count }))
                            .sort((a, b) => b.count - a.count)
                            .slice(0, 6);

                          if (results.length === 0) {
                            return [
                              { name: 'Spiti Jeep Safari', count: 32 },
                              { name: 'Leh Ladakh Odyssey', count: 28 },
                              { name: 'Chardham Yatra Spl', count: 24 },
                              { name: 'Kedarnath Heli Tour', count: 19 },
                              { name: 'Kinnaur Offbeat Tour', count: 15 },
                              { name: 'Zanskar Expedition', count: 11 },
                            ];
                          }
                          return results;
                        })()}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
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

                {/* 4. Live Activity Stream Log */}
                <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-3xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">Live Telemetry Feed</h3>
                    <p className="text-[10px] text-stone-400 font-light">Real-time user engagement actions processed securely</p>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-56 mt-4 space-y-3 pr-1">
                    {analyticsEvents.length === 0 ? (
                      <div className="text-center py-12 text-stone-400 text-xs italic">
                        No active session logs in database yet. Browsing actions will show up in real-time here.
                      </div>
                    ) : (
                      analyticsEvents.slice(-8).reverse().map((ev: any) => (
                        <div key={ev.id} className="flex gap-2 text-[10px] border-b border-stone-50 pb-2">
                          <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            ev.eventType === 'page_view' ? 'bg-teal-500' :
                            ev.eventType === 'package_view' ? 'bg-pink-500' : 'bg-indigo-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-stone-700 font-medium truncate">
                              {ev.eventType === 'page_view' && <span>Visited <b>{ev.targetName || ev.targetId}</b> page</span>}
                              {ev.eventType === 'package_view' && <span>Inspected package: <b>{ev.targetName}</b></span>}
                              {ev.eventType === 'destination_view' && <span>Checked region: <b>{ev.targetName}</b></span>}
                            </p>
                            <span className="text-[9px] text-stone-400 block font-mono">
                              Session: {ev.sessionId ? ev.sessionId.substring(5, 12) + '...' : 'Guest'} • {ev.createdAt ? new Date(ev.createdAt).toLocaleTimeString() : 'now'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
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

            <form onSubmit={handleSavePackage} className="space-y-6 flex-1 pr-1">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Package Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Himalayan Serenade - Leh Ladakh"
                    value={pkgFormData.title}
                    onChange={(e) => setPkgFormData((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm text-stone-850 focus:outline-none focus:border-[#008080] font-medium"
                  />
                </div>

                {/* Destination */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Destination *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. South Goa, India"
                    value={pkgFormData.destination}
                    onChange={(e) => setPkgFormData((prev) => ({ ...prev, destination: e.target.value }))}
                    className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm text-stone-850 focus:outline-none focus:border-[#008080] font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Category */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Category *</label>
                  <select
                    value={pkgFormData.category}
                    onChange={(e) => setPkgFormData((prev) => ({ ...prev, category: e.target.value as DestinationCategory }))}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-sm text-sm text-stone-700 focus:outline-none focus:border-[#008080] font-medium cursor-pointer"
                  >
                    <option value="Pilgrimage">Pilgrimage</option>
                    <option value="Treks">Treks</option>
                    <option value="Adventure">Adventure</option>
                    <option value="Himachal">Himachal</option>
                    <option value="Ladakh">Ladakh</option>
                    <option value="Uttarakhand">Uttarakhand</option>
                  </select>
                </div>

                {/* Duration */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Duration *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. 5 Days / 4 Nights"
                    value={pkgFormData.duration}
                    onChange={(e) => setPkgFormData((prev) => ({ ...prev, duration: e.target.value }))}
                    className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm text-stone-850 focus:outline-none focus:border-[#008080] font-medium"
                  />
                </div>

                {/* Price */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Price per Person (INR, ₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={pkgFormData.price}
                    onChange={(e) => setPkgFormData((prev) => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm text-stone-850 focus:outline-none focus:border-[#008080] font-medium"
                  />
                </div>
              </div>

              {/* Cover Image URL / Drag Upload */}
              <div className="space-y-3 bg-[#f8f7f4] p-4 rounded-sm border border-stone-200">
                <span className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider">Package Cover Image *</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* File Upload drag area */}
                  <div className="border-2 border-dashed border-stone-200 rounded-sm p-4 text-center hover:border-[#008080] transition relative bg-white">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileChange(e, 'package')}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-6 h-6 text-stone-400 mx-auto mb-2" />
                    <span className="text-xs text-stone-600 block font-semibold">
                      {uploadingImage ? 'Uploading image...' : 'Drag / click to upload cover'}
                    </span>
                    <span className="text-[10px] text-stone-400">Supports PNG, JPG, WEBP</span>
                  </div>

                  {/* Manual URL input fallback */}
                  <div className="space-y-1 flex flex-col justify-center">
                    <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-wider">Or Enter Public Image URL</label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      value={pkgFormData.imageUrl}
                      onChange={(e) => setPkgFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
                      className="w-full px-3 py-2 border border-stone-200 rounded-sm text-xs text-stone-850 focus:outline-none focus:border-[#008080] font-medium bg-white"
                    />
                  </div>
                </div>

                {pkgFormData.imageUrl && (
                  <div className="relative w-full h-32 rounded-sm overflow-hidden border border-stone-200 mt-2 bg-stone-100">
                    <img 
                      src={pkgFormData.imageUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>

              {/* Descriptions */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Short Summary Description *</label>
                <input
                  type="text"
                  required
                  placeholder="One sentence hook summarizing this package..."
                  value={pkgFormData.shortDescription}
                  maxLength={180}
                  onChange={(e) => setPkgFormData((prev) => ({ ...prev, shortDescription: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm text-stone-850 focus:outline-none focus:border-[#008080] font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Full Story / Description</label>
                <textarea
                  rows={4}
                  placeholder="Full background itinerary description, hotels, vibes..."
                  value={pkgFormData.fullDescription}
                  onChange={(e) => setPkgFormData((prev) => ({ ...prev, fullDescription: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm text-sm text-stone-850 focus:outline-none focus:border-[#008080] font-medium"
                />
              </div>

              {/* Day-wise Itinerary Sections */}
              <div className="space-y-4 border-t border-stone-100 pt-4">
                <div className="flex justify-between items-center">
                  <span className="block text-xs font-bold text-stone-800 uppercase tracking-wider">Day-Wise Itinerary Planning</span>
                  <button
                    type="button"
                    onClick={handleAddItineraryDay}
                    className="px-3 py-1 bg-stone-100 text-stone-700 hover:bg-[#008080] hover:text-white text-[10px] font-bold uppercase tracking-wider rounded-sm transition cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Itinerary Day</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {itinerary.map((itIn, index) => (
                    <div key={index} className="bg-[#f8f7f4] p-4 border border-stone-200 rounded-sm space-y-3 relative">
                      <button
                        type="button"
                        onClick={() => handleRemoveItineraryDay(itIn.day)}
                        className="absolute top-3 right-3 text-stone-400 hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-stone-900 text-white font-bold text-xs rounded-none flex items-center justify-center shrink-0 font-serif italic">
                          D{itIn.day}
                        </span>
                        <input
                          type="text"
                          required
                          placeholder="Day Title (e.g. Welcome to Leh Ladakh)"
                          value={itIn.title}
                          onChange={(e) => handleItineraryDayChange(itIn.day, 'title', e.target.value)}
                          className="w-full px-3 py-1.5 border border-stone-200 rounded-sm text-xs text-stone-850 focus:outline-none focus:border-[#008080] font-bold bg-white"
                        />
                      </div>
                      <textarea
                        rows={2}
                        required
                        placeholder="Day schedule details, drives, activities, food, hotel names..."
                        value={itIn.description}
                        onChange={(e) => handleItineraryDayChange(itIn.day, 'description', e.target.value)}
                        className="w-full px-3 py-1.5 border border-stone-200 rounded-sm text-xs text-stone-600 focus:outline-none focus:border-[#008080] font-medium bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Inclusions & Exclusions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-stone-100 pt-4">
                
                {/* Inclusions Form */}
                <div className="space-y-3">
                  <span className="block text-xs font-bold text-stone-800 uppercase tracking-wider">Holiday Inclusions</span>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add an inclusion..."
                      value={newInclusion}
                      onChange={(e) => setNewInclusion(e.target.value)}
                      className="w-full px-3 py-1.5 border border-stone-200 rounded-sm text-xs text-stone-800 focus:outline-none focus:border-[#008080]"
                    />
                    <button
                      type="button"
                      onClick={handleAddInclusion}
                      className="px-3 bg-[#008080] text-white rounded-sm text-xs font-bold uppercase tracking-wider hover:bg-[#006666] cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                    {inclusions.map((inc, i) => (
                      <li key={i} className="flex justify-between items-center text-xs text-stone-600 bg-[#f8f7f4] px-3 py-1.5 rounded-sm border border-stone-200">
                        <span className="line-clamp-1">{inc}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveInclusion(i)}
                          className="text-stone-400 hover:text-red-500 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Exclusions Form */}
                <div className="space-y-3">
                  <span className="block text-xs font-bold text-stone-800 uppercase tracking-wider">Holiday Exclusions</span>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add an exclusion..."
                      value={newExclusion}
                      onChange={(e) => setNewExclusion(e.target.value)}
                      className="w-full px-3 py-1.5 border border-stone-200 rounded-sm text-xs text-stone-800 focus:outline-none focus:border-[#008080]"
                    />
                    <button
                      type="button"
                      onClick={handleAddExclusion}
                      className="px-3 bg-stone-900 text-white rounded-sm text-xs font-bold uppercase tracking-wider hover:bg-stone-800 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                    {exclusions.map((exc, i) => (
                      <li key={i} className="flex justify-between items-center text-xs text-stone-600 bg-[#f8f7f4] px-3 py-1.5 rounded-sm border border-stone-200">
                        <span className="line-clamp-1">{exc}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveExclusion(i)}
                          className="text-stone-400 hover:text-red-500 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Toggles */}
              <div className="flex flex-col sm:flex-row gap-6 border-t border-stone-100 pt-6">
                
                {/* Featured package toggle */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pkgFormData.featured}
                    onChange={(e) => setPkgFormData((prev) => ({ ...prev, featured: e.target.checked }))}
                    className="w-4.5 h-4.5 accent-[#008080] rounded border-stone-200"
                  />
                  <div>
                    <strong className="text-xs text-stone-800 block font-bold">Featured Package</strong>
                    <span className="text-[10px] text-stone-400 block font-medium">Visible inside home page slider</span>
                  </div>
                </label>

                {/* Active/Inactive toggle */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pkgFormData.active}
                    onChange={(e) => setPkgFormData((prev) => ({ ...prev, active: e.target.checked }))}
                    className="w-4.5 h-4.5 accent-[#008080] rounded border-stone-200"
                  />
                  <div>
                    <strong className="text-xs text-stone-800 block font-bold">Active Status</strong>
                    <span className="text-[10px] text-stone-400 block font-medium">Visible to search catalog visitors</span>
                  </div>
                </label>

              </div>

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
                type="button"
                onClick={handleSavePackage}
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
