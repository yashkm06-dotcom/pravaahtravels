import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, Calendar, MapPin, Check, X, Send, Users, 
  ChevronDown, ChevronUp, Trash2, GripVertical, Sliders, ArrowUp, ArrowDown, Sparkles, Phone, Compass, HelpCircle, CheckCircle2, Heart,
  Star, Camera, ChevronRight, AlertCircle, MessageCircle, BedDouble, Car, Utensils
} from 'lucide-react';
import { TravelPackage, Enquiry, Review, WebsiteCMSSettings, DEFAULT_WEBSITE_CMS, formatPrice, formatPackagePrice } from '../types';
import { db, collection, addDoc, auth, getDocs, query, where, orderBy, limit } from '../lib/firebase';
import { triggerSystemEmail } from '../lib/emailClient';
import InteractiveRouteMap from './InteractiveRouteMap';
import { DEFAULT_TRAVEL_IMAGE, getTravelImage, handleTravelImageError } from '../utils/imageFallback';
import { SkeletonCard } from './SkeletonLoader';
import NearbyPlacesSection from './NearbyPlacesSection';
import { openPackage } from '../utils/packageRoute';
import { resolveBusinessProfile } from '../utils/businessProfile';
import GoogleReviews, { GoogleReviewsCache } from './GoogleReviews';

interface PackageDetailViewProps {
  pkg: TravelPackage;
  onBack: () => void;
  onEnquirySuccess: () => void;
  isAdminLoggedIn?: boolean;
  onDeletePackage?: (id: string) => void;
  onPackageSaved?: () => void;
  wishlistPackageIds?: string[];
  onToggleWishlist?: (pkg: TravelPackage) => void;
  onNavigate?: (view: string, packageId?: string | null) => void;
  packages?: TravelPackage[];
  websiteCMS?: WebsiteCMSSettings;
  googleReviews?: GoogleReviewsCache | null;
}

const getMatchingListItems = (items: string[] | undefined, terms: string[]) => {
  return (items || []).filter((item) => {
    const normalized = item.toLowerCase();
    return terms.some((term) => normalized.includes(term));
  });
};

export default function PackageDetailView({
  pkg,
  onBack,
  onEnquirySuccess,
  isAdminLoggedIn = false,
  onDeletePackage,
  onPackageSaved,
  wishlistPackageIds = [],
  onToggleWishlist,
  onNavigate,
  packages = [],
  websiteCMS = DEFAULT_WEBSITE_CMS,
  googleReviews = null,
}: PackageDetailViewProps) {
  const business = useMemo(() => resolveBusinessProfile(websiteCMS), [websiteCMS]);
  // Accordion state for itinerary days
  const [activeDay, setActiveDay] = useState<number | null>(1);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  
  // Local editable itinerary for custom sorting/swapping (Drag and Drop)
  const [localItinerary, setLocalItinerary] = useState<any[]>([]);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Sync with package when it changes
  useEffect(() => {
    if (pkg && pkg.itinerary) {
      setLocalItinerary([...pkg.itinerary]);
    }
  }, [pkg]);

  // Form submission state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    travelDate: '',
    travelers: 2,
    budget: '₹20,000 - ₹50,000',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [saveNotice, setSaveNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [savingPackage, setSavingPackage] = useState(false);
  const [publicPackageReviews, setPublicPackageReviews] = useState<Review[]>([]);
  const [publicReviewsLoading, setPublicReviewsLoading] = useState(false);

  // Scroll to top when package changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pkg]);

  useEffect(() => {
    setSelectedGalleryImage(0);
    setActiveFaq(null);
  }, [pkg.id]);

  useEffect(() => {
    let cancelled = false;

    const fetchPackageReviews = async () => {
      setPublicReviewsLoading(true);
      try {
        const reviewsSnapshot = await getDocs(query(collection(db, 'reviews'), orderBy('createdAt', 'desc')));
        const fetchedReviews = reviewsSnapshot.docs
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as Review & { packageId?: string; packageName?: string })
          .filter((review) => {
            const status = review.status || 'Approved';
            if (status !== 'Approved') return false;

            const packageId = String(review.packageId || '').trim();
            const packageName = String(review.packageName || '').trim().toLowerCase();
            const destination = String(review.destination || '').trim().toLowerCase();
            const currentDestination = String(pkg.destination || '').trim().toLowerCase();
            const currentTitle = String(pkg.title || '').trim().toLowerCase();

            return packageId === pkg.id ||
              Boolean(packageName && packageName === currentTitle) ||
              Boolean(destination && currentDestination && (
                destination === currentDestination ||
                destination.includes(currentDestination) ||
                currentDestination.includes(destination)
              ));
          });

        if (!cancelled) {
          setPublicPackageReviews(fetchedReviews);
        }
      } catch (error) {
        console.error('Error fetching package reviews:', error);
        if (!cancelled) {
          setPublicPackageReviews([]);
        }
      } finally {
        if (!cancelled) {
          setPublicReviewsLoading(false);
        }
      }
    };

    void fetchPackageReviews();

    return () => {
      cancelled = true;
    };
  }, [pkg.destination, pkg.id, pkg.title]);

  // Booking Request State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingForm, setBookingForm] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    email: '',
    destination: pkg?.destination || '',
    packageTitle: pkg?.title || '',
    travelDate: '',
    adults: 2,
    children: 0,
    pickupCity: '',
    budget: pkg ? `₹${pkg.price?.toLocaleString('en-IN') || '20,000'}` : '₹20,000 - ₹50,000',
    specialRequests: ''
  });
  const [leadTraveller, setLeadTraveller] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    gender: 'Prefer not to say',
    dob: '',
    nationality: 'Indian'
  });
  const [travellerList, setTravellerList] = useState<Array<{ id: string; name: string; age: string; gender: string; idType: string; idNumber: string }>>([]);
  const [emergencyContact, setEmergencyContact] = useState({
    name: '',
    phone: '',
    relationship: ''
  });
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; label: string; type: 'percent' | 'flat'; value: number } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cash' | 'bank' | 'pay-later'>('razorpay');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [selectedGuests, setSelectedGuests] = useState<number>(2);
  const [submittedBooking, setSubmittedBooking] = useState<any | null>(null);

  // Prefill logged in user details when booking modal opens
  useEffect(() => {
    if (isBookingModalOpen) {
      const user = auth.currentUser;
      if (user) {
        setBookingForm(prev => ({
          ...prev,
          name: user.displayName || prev.name || '',
          email: user.email || prev.email || '',
        }));
        setLeadTraveller(prev => ({
          ...prev,
          firstName: user.displayName?.split(' ')[0] || prev.firstName,
          email: user.email || prev.email,
          phone: prev.phone || ''
        }));
      }
      setBookingForm(prev => ({
        ...prev,
        adults: selectedGuests,
      }));
      setBookingStep(1);
      setBookingError('');
      setBookingSuccess(false);
    }
  }, [isBookingModalOpen, selectedGuests]);

  const handleBookingInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBookingForm((prev) => ({
      ...prev,
      [name]: name === 'adults' || name === 'children' ? parseInt(value) || 0 : value
    }));
  };

  const updateLeadTraveller = (field: keyof typeof leadTraveller, value: string) => {
    setLeadTraveller((prev) => ({ ...prev, [field]: value }));
  };

  const addTraveller = () => {
    setTravellerList((prev) => ([...prev, { id: `traveller-${Date.now()}-${prev.length}`, name: '', age: '', gender: 'Prefer not to say', idType: 'Passport', idNumber: '' }]));
  };

  const updateTraveller = (id: string, field: 'name' | 'age' | 'gender' | 'idType' | 'idNumber', value: string) => {
    setTravellerList((prev) => prev.map((traveller) => traveller.id === id ? { ...traveller, [field]: value } : traveller));
  };

  const removeTraveller = (id: string) => {
    setTravellerList((prev) => prev.filter((traveller) => traveller.id !== id));
  };

  const handleApplyCoupon = () => {
    const normalizedCode = couponCode.trim().toUpperCase();
    if (!normalizedCode) {
      setAppliedCoupon(null);
      return;
    }

    if (normalizedCode === 'WELCOME10') {
      setAppliedCoupon({ code: normalizedCode, label: '10% welcome discount', type: 'percent', value: 10 });
      return;
    }

    if (normalizedCode === 'FLAT5000') {
      setAppliedCoupon({ code: normalizedCode, label: '₹5,000 flat discount', type: 'flat', value: 5000 });
      return;
    }

    setAppliedCoupon({ code: normalizedCode, label: 'Coupon applied', type: 'percent', value: 5 });
  };

  const getBookingBreakdown = () => {
    const travelers = Math.max(1, Number(bookingForm.adults || 1) + Number(bookingForm.children || 0));
    const packagePrice = (pkg.offerPrice || pkg.price || 0) * travelers;
    const taxes = Math.round(packagePrice * 0.05);
    let discount = 0;

    if (appliedCoupon) {
      discount = appliedCoupon.type === 'percent' ? Math.round(packagePrice * (appliedCoupon.value / 100)) : appliedCoupon.value;
    }

    const bookingAmount = Math.max(0, packagePrice + taxes - discount);
    const remainingAmount = Math.round(bookingAmount * 0.5);

    return { travelers, packagePrice, taxes, discount, bookingAmount, remainingAmount, grandTotal: bookingAmount };
  };

  const bookingBreakdown = getBookingBreakdown();

  const downloadBookingDocument = (type: 'voucher' | 'invoice') => {
    const bookingNumber = submittedBooking?.bookingId || bookingForm.packageTitle || 'booking';
    const content = `${type === 'voucher' ? 'VOUCHER' : 'INVOICE'}\nBooking ID: ${bookingNumber}\nPackage: ${bookingForm.packageTitle}\nTraveler: ${`${leadTraveller.firstName || bookingForm.name} ${leadTraveller.lastName || ''}`.trim() || bookingForm.name}\nTravel Date: ${bookingForm.travelDate}\nAmount: ${formatPrice(bookingBreakdown.bookingAmount)}`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}-${bookingNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSubmitting(true);
    setBookingError('');

    if (!bookingForm.name || !bookingForm.phone || !bookingForm.whatsapp || !bookingForm.email || !bookingForm.travelDate) {
      setBookingError('Please complete the lead traveller details before confirming your booking.');
      setBookingSubmitting(false);
      return;
    }

    try {
      const user = auth.currentUser;
      const currentYear = new Date().getFullYear();
      const prefix = `PRV-${currentYear}-`;
      const latestBookingQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(1));
      const latestBookingSnapshot = await getDocs(latestBookingQuery);
      let nextSequence = 1;

      if (!latestBookingSnapshot.empty) {
        const latestBooking = latestBookingSnapshot.docs[0].data() as { bookingId?: string };
        const latestBookingId = String(latestBooking.bookingId || '').trim();
        const latestSequence = Number(latestBookingId.replace(prefix, '').replace(/[^0-9]/g, ''));
        if (!Number.isNaN(latestSequence) && latestSequence >= 1) {
          nextSequence = latestSequence + 1;
        }
      }

      const bookingId = `${prefix}${String(nextSequence).padStart(4, '0')}`;
      const guests = Number(bookingForm.adults) + Number(bookingForm.children);
      const totalPrice = (pkg.offerPrice || pkg.price || 0) * guests;
      const bookingAmount = bookingBreakdown.bookingAmount;
      const remainingAmount = bookingBreakdown.remainingAmount;
      const paymentStatus = paymentMethod === 'pay-later' ? 'Pending' : 'Unpaid';
      const bookingTimeline = [
        { title: 'Booking initiated', note: 'Booking request captured successfully', status: 'Completed', createdAt: new Date().toISOString() },
        { title: 'Traveller profile finalized', note: `${leadTraveller.firstName || bookingForm.name} ${leadTraveller.lastName || ''}`.trim(), status: 'Completed', createdAt: new Date().toISOString() },
      ];

      const bookingData = {
        bookingId,
        customerId: user ? user.uid : 'guest',
        userId: user ? user.uid : 'guest',
        customerName: `${leadTraveller.firstName || bookingForm.name} ${leadTraveller.lastName || ''}`.trim() || bookingForm.name,
        email: bookingForm.email,
        phone: bookingForm.phone,
        packageId: pkg.id,
        packageTitle: bookingForm.packageTitle,
        travelDate: bookingForm.travelDate,
        guests,
        totalPrice,
        bookingStatus: 'Pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customerPhone: bookingForm.phone,
        customerWhatsApp: bookingForm.whatsapp,
        customerEmail: bookingForm.email,
        destination: bookingForm.destination,
        adults: Number(bookingForm.adults),
        children: Number(bookingForm.children),
        pickupCity: bookingForm.pickupCity,
        budget: bookingForm.budget,
        price: bookingAmount,
        specialRequests: bookingForm.specialRequests,
        status: 'Pending',
        paymentStatus,
        notes: [],
        internalNotes: [],
        assignedStaff: '',
        followUpDate: '',
        paymentMethod,
        couponCode: appliedCoupon?.code || '',
        appliedCoupon: appliedCoupon ? { code: appliedCoupon.code, label: appliedCoupon.label, type: appliedCoupon.type, value: appliedCoupon.value } : null,
        bookingTimeline,
        travellerList,
        leadTraveller,
        emergencyContact,
        priceBreakdown: {
          packagePrice: bookingBreakdown.packagePrice,
          taxes: bookingBreakdown.taxes,
          discount: bookingBreakdown.discount,
          bookingAmount,
          remainingAmount,
          grandTotal: bookingBreakdown.grandTotal,
        },
        invoice: { generated: true, invoiceNumber: `INV-${bookingId}` },
        voucher: { generated: true, voucherCode: `VOU-${bookingId}` },
        paymentHistory: [{ method: paymentMethod, amount: bookingAmount, status: paymentStatus, createdAt: new Date().toISOString() }],
        cancelRequested: false,
        rescheduleRequested: false,
      };

      const createdBookingRef = await addDoc(collection(db, 'bookings'), bookingData);

      setSubmittedBooking({
        id: createdBookingRef.id,
        bookingId,
        packageTitle: bookingForm.packageTitle,
        travelDate: bookingForm.travelDate,
        guests,
        status: 'Pending',
        paymentStatus,
        bookingAmount,
      });

      triggerSystemEmail('booking-received', bookingForm.email, {
        customerName: bookingData.customerName,
        customerEmail: bookingForm.email,
        customerPhone: bookingForm.phone,
        packageTitle: pkg.title,
        travelDate: bookingForm.travelDate,
        adults: Number(bookingForm.adults),
        children: Number(bookingForm.children),
        pickupCity: bookingForm.pickupCity,
        budget: formatPrice(bookingAmount),
        specialRequests: bookingForm.specialRequests
      });

      triggerSystemEmail('new-booking', 'yash.km06@gmail.com', {
        customerName: bookingData.customerName,
        customerEmail: bookingForm.email,
        customerPhone: bookingForm.phone,
        customerWhatsApp: bookingForm.whatsapp,
        packageTitle: pkg.title,
        travelDate: bookingForm.travelDate,
        adults: Number(bookingForm.adults),
        children: Number(bookingForm.children),
        pickupCity: bookingForm.pickupCity,
        budget: formatPrice(bookingAmount),
        specialRequests: bookingForm.specialRequests
      });

      setBookingSuccess(true);
      if (onEnquirySuccess) onEnquirySuccess();
    } catch (err: any) {
      console.error('Error submitting booking request:', err);
      setBookingError(`Submission failed: ${err.message || String(err)}`);
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleSavePackage = async () => {
    if (!onToggleWishlist) return;
    setSavingPackage(true);
    setSaveNotice(null);
    onToggleWishlist(pkg);
    setSaveNotice({
      type: 'success',
      message: Array.isArray(wishlistPackageIds) && wishlistPackageIds.includes(String(pkg.id ?? '')) ? 'Removed from Wishlist' : 'Package added to Wishlist ❤️',
    });
    setSavingPackage(false);
    if (onPackageSaved) {
      onPackageSaved();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'travelers' ? parseInt(value) || 1 : value
    }));
  };

  const toggleDay = (day: number) => {
    setActiveDay((prev) => (prev === day ? null : day));
  };

  // Reordering functions for Drag and Drop
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    const reordered = [...localItinerary];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(index, 0, removed);
    
    // Re-index days sequentially
    const updated = reordered.map((item, idx) => ({
      ...item,
      day: idx + 1
    }));
    
    setLocalItinerary(updated);
    setDraggedIndex(null);
    setActiveDay(index + 1);

    // Update enquiry form text
    setFormData(prev => ({
      ...prev,
      message: `Hi, I have customized the plan for the "${pkg.title}". Here is my custom day order:\n` + 
        updated.map(d => `Day ${d.day}: ${d.title}`).join('\n')
    }));
  };

  // Mobile reorder click assistants
  const moveDay = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= localItinerary.length) return;

    const reordered = [...localItinerary];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const updated = reordered.map((item, idx) => ({
      ...item,
      day: idx + 1
    }));

    setLocalItinerary(updated);
    setActiveDay(targetIndex + 1);

    setFormData(prev => ({
      ...prev,
      message: `Hi, I have customized the plan for the "${pkg.title}". Here is my custom day order:\n` + 
        updated.map(d => `Day ${d.day}: ${d.title}`).join('\n')
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    // Basic Validation
    if (!formData.name || !formData.phone || !formData.email || !formData.travelDate) {
      setErrorMsg('Please fill in all required fields marked with *');
      setSubmitting(false);
      return;
    }

    try {
      const enquiryPayload: Omit<Enquiry, 'id'> = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        destination: pkg.destination,
        travelDate: formData.travelDate,
        travelers: formData.travelers,
        budget: formData.budget,
        message: formData.message || `Hi, I am interested in booking the "${pkg.title}" package. Please share details.`,
        packageId: pkg.id,
        packageName: pkg.title,
        status: 'New',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'enquiries'), enquiryPayload);

      // Trigger automated email notifications
      triggerSystemEmail('enquiry-received', formData.email, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        destination: pkg.destination,
        travelDate: formData.travelDate,
        travelers: formData.travelers,
        budget: formData.budget,
        message: formData.message || `Hi, I am interested in booking the "${pkg.title}" package. Please share details.`
      });

      triggerSystemEmail('new-enquiry', 'yash.km06@gmail.com', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        destination: pkg.destination,
        travelDate: formData.travelDate,
        travelers: formData.travelers,
        budget: formData.budget,
        message: formData.message || `Hi, I am interested in booking the "${pkg.title}" package. Please share details.`
      });

      setSubmitSuccess(true);
      onEnquirySuccess();
    } catch (error) {
      console.error('Error creating enquiry:', error);
      setErrorMsg('Something went wrong. Please check your internet connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const packageGalleryImages = [
    pkg.packageBannerUrl || pkg.imageUrl,
    ...(pkg.galleryImages || [])
  ].filter(Boolean);
  const uniquePackageGalleryImages = Array.from(new Set(packageGalleryImages));
  const displayGalleryImages = uniquePackageGalleryImages.length > 0 ? uniquePackageGalleryImages : [DEFAULT_TRAVEL_IMAGE];
  const visibleGalleryImages = displayGalleryImages.slice(0, 6);
  const embeddedPackageReviews = Array.isArray((pkg as any).reviews) ? (pkg as any).reviews : [];
  const packageReviews = useMemo(() => {
    const reviewMap = new Map<string, any>();
    [...publicPackageReviews, ...embeddedPackageReviews].forEach((review: any, index) => {
      const key = String(review.id || `${review.name || 'review'}-${review.createdAt || index}`);
      reviewMap.set(key, review);
    });
    return Array.from(reviewMap.values());
  }, [embeddedPackageReviews, publicPackageReviews]);
  const hotelItems = getMatchingListItems(pkg.inclusions, ['hotel', 'stay', 'accommodation', 'resort', 'camp', 'lodge']);
  const transportationItems = getMatchingListItems(pkg.inclusions, ['transport', 'transfer', 'cab', 'vehicle', 'car', 'bus', 'tempo', 'traveller']);
  const mealPlanItems = getMatchingListItems(pkg.inclusions, ['meal', 'breakfast', 'lunch', 'dinner', 'food']);
  const averageRating = packageReviews.length > 0 ? packageReviews.reduce((sum: number, review: any) => sum + (Number(review.rating) || 0), 0) / packageReviews.length : null;
  const quickInfoItems = [
    { label: 'Destination', value: pkg.destination, icon: MapPin },
    { label: 'Duration', value: pkg.duration, icon: Calendar },
    { label: 'Group Size', value: pkg.maxGuests ? `Up to ${pkg.maxGuests}` : 'Flexible group size', icon: Users },
    { label: 'Accommodation', value: hotelItems[0] || 'Not specified', icon: BedDouble },
    { label: 'Meals', value: mealPlanItems[0] || 'Not specified', icon: Utensils },
    { label: 'Transport', value: transportationItems[0] || 'Not specified', icon: Car },
    { label: 'Rating', value: averageRating ? `${averageRating.toFixed(1)} / 5` : 'No reviews yet', icon: Star },
    { label: 'Starting Price', value: formatPackagePrice(pkg.offerPrice || pkg.price), icon: Check },
  ];
  const includedItems = (pkg.inclusions || []).filter(Boolean).slice(0, 8);
  const excludedItems = (pkg.exclusions || []).filter(Boolean).slice(0, 8);
  const highlightItems = (pkg.highlights || []).filter(Boolean).slice(0, 8);
  const packingItems = (pkg.thingsToCarry || []).filter(Boolean).slice(0, 6);
  const departureWindowItems = (pkg.departureDates || []).filter(Boolean).slice(0, 6);
  const policyItems = (pkg.policies || []).filter(Boolean).slice(0, 6);
  const faqItems = (pkg.faqs || []).slice(0, 6);
  const mapQuery = (pkg as any).latitude && (pkg as any).longitude ? `${(pkg as any).latitude},${(pkg as any).longitude}` : pkg.destination;
  const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=12&output=embed`;
  const displayedRelatedPackages = useMemo(() => {
    return packages
      .filter((item) => item.active && item.id !== pkg.id)
      .filter((item) => (
        item.category === pkg.category ||
        String(item.location || '').toLowerCase() === String(pkg.location || '').toLowerCase() ||
        String(item.destination || '').toLowerCase() === String(pkg.destination || '').toLowerCase() ||
        Boolean(item.activityId && item.activityId === pkg.activityId)
      ))
      .slice(0, 3);
  }, [packages, pkg.activityId, pkg.category, pkg.destination, pkg.id, pkg.location]);
  const packageWhatsAppUrl = business.whatsappUrl(`Hello ${business.companyName},\nI am interested in the ${pkg.title} package.\nPlease send complete details.`);

  return (
    <div id="package-detail-view" className="animate-fade-in overflow-hidden bg-[#fffaf1]">
      <section className="relative overflow-hidden bg-stone-950 pt-28 text-white sm:pt-32">
        <img
          src={getTravelImage(pkg.packageBannerUrl || pkg.imageUrl)}
          alt={pkg.title}
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          onError={handleTravelImageError}
        />
        <div className="absolute inset-0 bg-linear-to-r from-stone-950/92 via-stone-950/70 to-stone-950/20" />
        <div className="absolute inset-0 bg-linear-to-t from-stone-950/86 via-transparent to-stone-950/20" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-[#fffaf1] to-transparent" />

        <div className="relative z-10 mx-auto flex min-h-[520px] max-w-[1320px] flex-col justify-end px-4 pb-24 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-center gap-3 text-[12px] font-bold uppercase tracking-[0.14em] text-white/75">
            <button type="button" onClick={onBack} className="inline-flex cursor-pointer items-center gap-2 transition hover:text-[#4DA528]">
              <ArrowLeft className="h-4 w-4" />
              <span>Packages</span>
            </button>
            <span className="h-px w-8 bg-white/45" />
            <span className="text-[#4DA528]">Tour Single</span>
          </div>

          <div className="inner-heading-wrap flex-two grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
            <div className="inner-heading max-w-4xl">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span className="feature rounded-[5px] bg-[#4DA528] px-4 py-2 text-[12px] font-bold uppercase tracking-[0.16em] text-white">
                  {pkg.category}
                </span>
                <span className="inline-flex items-center gap-2 rounded-[5px] border border-white/20 bg-white/10 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-md">
                  <MapPin className="h-4 w-4 text-[#4DA528]" />
                  {pkg.destination}
                </span>
              </div>
              <h1 className="title max-w-5xl text-[46px] font-extrabold leading-[1.04] tracking-tight text-white sm:text-[64px] lg:text-[82px]">
                {pkg.title}
              </h1>
              <p className="des mt-6 max-w-3xl text-[16px] leading-8 text-white/82">
                {pkg.shortDescription}
              </p>
              <ul className="list-wrap-heading flex-three mt-8 flex flex-wrap gap-4 text-[14px] font-semibold text-white/86">
                <li className="flex-three inline-flex items-center gap-2 rounded-[5px] border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
                  <Calendar className="h-4 w-4 text-[#4DA528]" />
                  <span>{pkg.duration}</span>
                </li>
                <li className="flex-three inline-flex items-center gap-2 rounded-[5px] border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
                  <Users className="h-4 w-4 text-[#4DA528]" />
                  <span>{pkg.maxGuests ? `Max Guests: ${pkg.maxGuests}` : 'Flexible group size'}</span>
                </li>
                <li className="flex-three inline-flex items-center gap-2 rounded-[5px] border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
                  <MapPin className="h-4 w-4 text-[#4DA528]" />
                  <span>{pkg.destination}</span>
                </li>
              </ul>
            </div>

            <div className="inner-price rounded-[14px] border border-white/18 bg-white/12 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl">
              <div className="start flex-three flex items-center gap-1 text-[#FF970D]">
                {[...Array(5)].map((_, index) => (
                  <Star key={index} className={`h-4 w-4 ${averageRating && index < Math.round(averageRating) ? 'fill-current' : 'text-white/35'}`} />
                ))}
                <span className="review ml-2 text-[13px] font-semibold text-white/78">
                  {packageReviews.length > 0 ? `(${packageReviews.length} Review${packageReviews.length === 1 ? '' : 's'})` : '(No reviews yet)'}
                </span>
              </div>
              <p className="price-sale text-main mt-4 text-[34px] font-extrabold text-[#4DA528]">
                {formatPackagePrice(pkg.offerPrice || pkg.price)}
                {pkg.offerPrice && <span className="price ml-3 text-[18px] font-semibold text-white/58 line-through">{formatPrice(pkg.price)}</span>}
              </p>
              <p className="mt-2 text-[13px] leading-6 text-white/72">Starting price per person. Final quote depends on route, dates, hotels, and group size.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1320px] space-y-12 px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">

        {/* Main Content & Sticky Form Split */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* Left: General Details, Itinerary, Inclusions */}
          <div className="space-y-8 lg:col-span-2">

            <div className="rounded-[28px] border border-stone-200/80 bg-gradient-to-br from-white via-[#fffdf8] to-[#f7f2e7] p-4 shadow-[0_30px_80px_rgba(18,38,32,0.08)] sm:p-6" id="package-gallery">
              <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                <div className="space-y-4">
                  <div className="group relative aspect-[4/3] overflow-hidden rounded-[18px] bg-stone-100">
                    <img
                      src={getTravelImage(visibleGalleryImages[selectedGalleryImage] || visibleGalleryImages[0] || DEFAULT_TRAVEL_IMAGE)}
                      alt={`${pkg.title} gallery lead`}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      onError={handleTravelImageError}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-stone-950/55 via-stone-950/10 to-transparent" />
                    <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white backdrop-blur-md">
                      <Camera className="h-3.5 w-3.5" />
                      Premium Gallery
                    </div>
                    <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">{pkg.destination}</p>
                        <h3 className="mt-1 text-2xl font-semibold text-white">{pkg.title}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsLightboxOpen(true)}
                        className="rounded-full border border-white/30 bg-white/15 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-md transition hover:bg-white/25"
                      >
                        View Lightbox
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {visibleGalleryImages.map((imageUrl, idx) => {
                      const isSelected = idx === selectedGalleryImage;
                      return (
                        <button
                          key={`${imageUrl}-${idx}`}
                          type="button"
                          onClick={() => setSelectedGalleryImage(idx)}
                          className={`group relative aspect-[4/3] overflow-hidden rounded-[14px] border transition ${isSelected ? 'border-[#4DA528] ring-2 ring-[#4DA528]/20' : 'border-stone-200 hover:border-[#4DA528]/50'}`}
                        >
                          <img
                            src={getTravelImage(imageUrl)}
                            alt={`${pkg.title} thumbnail ${idx + 1}`}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                            onError={handleTravelImageError}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[22px] border border-stone-200 bg-white/90 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
                  <span className="inline-flex items-center rounded-full bg-[#4DA528]/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Journey Snapshot</span>
                  <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-stone-950">A premium travel experience</h3>
                  <p className="mt-4 text-sm leading-7 text-stone-600">{pkg.shortDescription}</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {quickInfoItems.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <div key={`${item.label}-${idx}`} className="rounded-[14px] border border-stone-200 bg-white p-3 shadow-sm transition hover:-translate-y-1">
                          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-stone-500">
                            <Icon className="h-3.5 w-3.5 text-[#4DA528]" />
                            {item.label}
                          </div>
                          <p className="mt-2 text-sm font-semibold text-stone-900">{item.value}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="information-content-tour rounded-[24px] border border-stone-200/80 bg-gradient-to-br from-white via-[#fffdf8] to-[#fcf6e8] p-6 shadow-[0_24px_70px_rgba(18,38,32,0.08)] md:p-8">
              <div className="description-wrap mb-8 rounded-[18px] border border-stone-200/70 bg-white/80 p-5">
                <span className="inline-flex rounded-full bg-[#4DA528]/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">About this package</span>
                <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-stone-950">A closer look at this journey</h3>
                <p className="des mt-5 whitespace-pre-line text-sm leading-8 text-stone-600">
                  {pkg.fullDescription || pkg.shortDescription}
                </p>
              </div>

              <div className="description-wrap mb-8 rounded-[18px] border border-stone-200/70 bg-white/80 p-5">
                <div className="mb-5 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#FF970D]" />
                  <span className="text-[13px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Highlights</span>
                </div>
                {highlightItems.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {highlightItems.map((item, idx) => (
                      <div key={`${item}-${idx}`} className="flex items-center gap-3 rounded-[12px] border border-stone-200 bg-[#fffaf1] p-4 text-sm font-medium text-stone-700 transition hover:-translate-y-1">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4DA528]/10 text-[#4DA528]">
                          <Compass className="h-4 w-4" />
                        </div>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[12px] border border-dashed border-stone-300 bg-[#fffaf1] p-5 text-sm leading-7 text-stone-500">
                    Highlights have not been published for this package yet.
                  </div>
                )}
              </div>

              <div className="expect-wrap rounded-[18px] border border-stone-200/70 bg-white/80 p-5">
                <h4 className="title mb-5 text-2xl font-extrabold text-stone-950">Quick Facts</h4>
                {[
                  ['Departure/Return Location', pkg.pickup || pkg.destination],
                  ['Tour Duration', pkg.duration],
                  ['Travel Category', pkg.category],
                  ['Package Code', pkg.packageCode || pkg.id],
                ].map(([label, value]) => (
                  <div key={label} className="expect flex-three flex flex-col gap-1 border-t border-stone-100 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-[13px] font-bold uppercase tracking-[0.12em] text-stone-500">{label}</span>
                    <p className="text-sm font-semibold text-stone-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-stone-200/80 bg-gradient-to-br from-white via-[#fffdf8] to-[#f7f2e7] p-4 shadow-[0_24px_70px_rgba(18,38,32,0.08)]">
              <div className="mb-4 px-2 pt-2">
                <span className="text-[13px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Location</span>
                <h3 className="mt-2 text-3xl font-extrabold tracking-tight text-stone-950">Route and destination map</h3>
              </div>
              <div className="mb-6 overflow-hidden rounded-[14px] border border-stone-200">
                <iframe
                  title={`${pkg.destination} map`}
                  src={mapEmbedUrl}
                  className="h-[320px] w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <InteractiveRouteMap 
                itinerary={localItinerary} 
                destination={pkg.destination} 
                category={pkg.category}
                activeDay={activeDay}
                onDayClick={(day) => setActiveDay(day)}
              />
            </div>

            {/* Day Wise Itinerary */}
            <div className="space-y-6 rounded-[24px] border border-stone-200/80 bg-gradient-to-br from-white via-[#fffdf8] to-[#fcf6e8] p-6 shadow-[0_24px_70px_rgba(18,38,32,0.08)] md:p-8" id="custom-itinerary-section">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="space-y-2">
                  <span className="text-[13px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Tour Planing</span>
                  <h3 className="text-3xl font-extrabold tracking-tight text-stone-950">Interactive itinerary</h3>
                  <p className="text-sm leading-6 text-stone-500">Click a day to focus its spot coordinate on the map above.</p>
                </div>
                
                {/* Drag-and-Drop / Interactive Toggle */}
                <button
                  type="button"
                  onClick={() => setIsCustomizing(!isCustomizing)}
                  className={`flex cursor-pointer items-center gap-2 rounded-full border px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.14em] transition ${
                    isCustomizing 
                      ? 'border-amber-600 bg-amber-500 text-white shadow-md' 
                      : 'border-stone-200 bg-[#fffaf1] text-stone-700 hover:border-[#4DA528] hover:text-[#4DA528]'
                  }`}
                >
                  <Sliders className="h-4 w-4" />
                  <span>{isCustomizing ? 'Lock Customized Order' : 'Customize Plan (Drag-n-Drop)'}</span>
                </button>
              </div>
              
              {isCustomizing && (
                <div className="flex animate-fade-in items-start gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-stone-700">
                  <Sparkles className="mt-1 h-4 w-4 shrink-0 text-amber-500" />
                  <div>
                    <strong>Interactive Drag & Drop Mode Active:</strong> Rearrange your travel days! 
                    Hover over a day card and drag it using the <strong>Grip Vertical</strong> handles, or click the 
                    <strong> Up/Down</strong> keys. The coordinate lines on the map above will re-route instantly!
                  </div>
                </div>
              )}

              <div className="relative space-y-5 before:absolute before:bottom-6 before:left-[22px] before:top-6 before:w-px before:bg-stone-200 sm:before:left-[28px]">
                {localItinerary && localItinerary.length > 0 ? (
                  localItinerary.map((dayItem, index) => {
                    const isOpen = activeDay === dayItem.day;
                    return (
                      <div 
                        key={dayItem.day}
                        draggable={isCustomizing}
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(index)}
                        className={`relative ml-12 rounded-[14px] border transition-all duration-300 sm:ml-16 ${
                          isCustomizing 
                            ? 'border-amber-300 bg-[#fffaf1] shadow-sm hover:border-amber-500 hover:shadow-md' 
                            : isOpen 
                              ? 'border-[#4DA528]/60 shadow-sm ring-1 ring-[#4DA528]/10'
                              : 'border-stone-200 bg-white'
                        }`}
                      >
                        <span className={`absolute -left-[49px] top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border-4 border-white text-[12px] font-extrabold shadow-md sm:-left-[61px] ${
                          isOpen ? 'bg-[#4DA528] text-white' : 'bg-stone-100 text-stone-600'
                        }`}>
                          {dayItem.day}
                        </span>
                        <div
                          className={`flex w-full items-center justify-between p-4 text-left transition sm:p-5 ${
                            isCustomizing ? 'cursor-grab' : 'cursor-pointer hover:bg-[#fffaf1]'
                          }`}
                          onClick={() => {
                            if (!isCustomizing) {
                              toggleDay(dayItem.day);
                              setActiveDay(dayItem.day);
                            }
                          }}
                        >
                          <div className="flex items-center gap-4">
                            {/* Drag Handle or Index marker */}
                            {isCustomizing ? (
                              <div className="cursor-grab p-1 text-amber-500 hover:text-amber-700 active:cursor-grabbing">
                                <GripVertical className="h-4.5 w-4.5" />
                              </div>
                            ) : (
                              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border font-mono text-[10px] font-extrabold shadow-sm transition-colors ${
                                isOpen ? 'border-transparent bg-[#4DA528] text-white' : 'border-stone-200 bg-[#fffaf1] text-stone-600'
                              }`}>
                                D{dayItem.day}
                              </span>
                            )}
                            
                            <span className="text-sm font-semibold leading-snug text-stone-900 sm:text-base">
                              {dayItem.title}
                            </span>
                          </div>

                          {/* Control arrows for mobile / non-drag reordering */}
                          {isCustomizing ? (
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => moveDay(index, 'up')}
                                className="cursor-pointer rounded-full border border-stone-200 bg-white p-1 text-stone-500 hover:bg-stone-50 hover:text-[#4DA528] disabled:opacity-30"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={index === localItinerary.length - 1}
                                onClick={() => moveDay(index, 'down')}
                                className="cursor-pointer rounded-full border border-stone-200 bg-white p-1 text-stone-500 hover:bg-stone-50 hover:text-[#4DA528] disabled:opacity-30"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div>
                              {isOpen ? <ChevronUp className="h-4 w-4 text-[#4DA528]" /> : <ChevronDown className="h-4 w-4 text-stone-400" />}
                            </div>
                          )}
                        </div>
                        
                        {isOpen && !isCustomizing && (
                          <div className="animate-fade-in border-t border-stone-100 bg-[#fffaf1] p-5 text-sm leading-8 text-stone-600">
                            {dayItem.description}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm italic text-stone-400">No itinerary has been entered for this package.</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-5 rounded-[24px] border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 to-white p-6 shadow-[0_18px_50px_rgba(18,38,32,0.08)] md:p-8">
                <h4 className="flex items-center gap-2 text-xl font-semibold text-[#0f766e]">
                  <Check className="h-5 w-5 text-[#0f766e]" />
                  <span>Included</span>
                </h4>
                {includedItems.length > 0 ? (
                  <ul className="space-y-3">
                    {includedItems.map((item, idx) => (
                      <li key={`${item}-${idx}`} className="flex items-start gap-3 rounded-2xl bg-emerald-50/70 p-3 text-sm leading-6 text-stone-700">
                        <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-[#0f766e]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-2xl border border-dashed border-emerald-200 bg-white/70 p-4 text-sm leading-7 text-stone-500">Inclusions have not been published for this package yet.</p>
                )}
              </div>

              <div className="space-y-5 rounded-[24px] border border-rose-200/80 bg-gradient-to-br from-rose-50/80 to-white p-6 shadow-[0_18px_50px_rgba(18,38,32,0.08)] md:p-8">
                <h4 className="flex items-center gap-2 text-xl font-semibold text-rose-700">
                  <X className="h-5 w-5 text-rose-600" />
                  <span>Excluded</span>
                </h4>
                {excludedItems.length > 0 ? (
                  <ul className="space-y-3">
                    {excludedItems.map((item, idx) => (
                      <li key={`${item}-${idx}`} className="flex items-start gap-3 rounded-2xl bg-rose-50/70 p-3 text-sm leading-6 text-stone-700">
                        <X className="mt-1 h-3.5 w-3.5 shrink-0 text-rose-600" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-2xl border border-dashed border-rose-200 bg-white/70 p-4 text-sm leading-7 text-stone-500">Exclusions have not been published for this package yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-[24px] border border-stone-200/80 bg-gradient-to-br from-white via-[#fffdf8] to-[#fcf6e8] p-6 shadow-[0_18px_50px_rgba(18,38,32,0.08)] md:p-8" id="trip-essentials">
              <div className="mb-6">
                <span className="text-[13px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Stay, transfer & meals</span>
                <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-stone-950">Package logistics</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { label: 'Hotels', icon: BedDouble, items: hotelItems },
                  { label: 'Transportation', icon: Car, items: transportationItems },
                  { label: 'Meal Plan', icon: Utensils, items: mealPlanItems },
                ].map((section) => {
                  const Icon = section.icon;
                  return (
                    <div key={section.label} className="rounded-[18px] border border-stone-200/70 bg-white/80 p-5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#4DA528]/10 text-[#4DA528]">
                          <Icon className="h-5 w-5" />
                        </span>
                        <h4 className="text-lg font-extrabold text-stone-950">{section.label}</h4>
                      </div>
                      {section.items.length > 0 ? (
                        <ul className="mt-4 space-y-2">
                          {section.items.slice(0, 3).map((item, idx) => (
                            <li key={`${section.label}-${item}-${idx}`} className="rounded-[12px] border border-stone-200 bg-[#fffaf1] p-3 text-sm leading-6 text-stone-700">{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-4 rounded-[12px] border border-dashed border-stone-300 bg-[#fffaf1] p-3 text-sm leading-6 text-stone-500">Not specified in package inclusions.</p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
                <div className="rounded-[18px] border border-stone-200/70 bg-white/80 p-5">
                  <span className="text-[13px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Pack smart</span>
                  <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-stone-950">Travel essentials</h3>
                  {packingItems.length > 0 ? (
                    <ul className="mt-5 space-y-3">
                      {packingItems.map((item, idx) => (
                        <li key={`${item}-${idx}`} className="flex items-start gap-3 rounded-[12px] border border-stone-200 bg-[#fffaf1] p-3 text-sm leading-6 text-stone-700">
                          <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-[#4DA528]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-5 rounded-[12px] border border-dashed border-stone-300 bg-[#fffaf1] p-4 text-sm leading-7 text-stone-500">Travel essentials have not been published for this package yet.</p>
                  )}
                </div>

                <div className="rounded-[18px] border border-stone-200/70 bg-white/80 p-5">
                  <span className="text-[13px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Departure & planning</span>
                  <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-stone-950">Flexible booking support</h3>
                  <div className="mt-5 space-y-4">
                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-stone-500">Departure windows</p>
                      {departureWindowItems.length > 0 ? (
                        <ul className="mt-2 space-y-2">
                          {departureWindowItems.map((item, idx) => (
                            <li key={`${item}-${idx}`} className="rounded-[10px] border border-stone-200 bg-[#fffaf1] px-3 py-2 text-sm text-stone-700">{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 rounded-[10px] border border-dashed border-stone-300 bg-[#fffaf1] px-3 py-2 text-sm text-stone-500">Departure windows are not listed yet.</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-stone-500">Planning notes</p>
                      {policyItems.length > 0 ? (
                        <ul className="mt-2 space-y-2">
                          {policyItems.map((item, idx) => (
                            <li key={`${item}-${idx}`} className="rounded-[10px] border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 rounded-[10px] border border-dashed border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-500">Planning notes are not listed yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-stone-200/80 bg-gradient-to-br from-white via-[#fffdf8] to-[#fcf6e8] p-6 shadow-[0_18px_50px_rgba(18,38,32,0.08)] md:p-8" id="package-faqs">
              <span className="text-[13px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">FAQ</span>
              <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-stone-950">Questions before you go</h3>
              <div className="mt-6 space-y-3">
                {faqItems.length > 0 ? (
                  faqItems.map((faq, idx) => {
                    const isOpen = activeFaq === idx;
                    return (
                      <div key={`${faq.question}-${idx}`} className="rounded-[12px] border border-stone-200 bg-[#fffaf1] p-0 transition hover:shadow-sm">
                        <button
                          type="button"
                          onClick={() => setActiveFaq(isOpen ? null : idx)}
                          className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left"
                          aria-expanded={isOpen}
                        >
                          <span className="flex items-start gap-3">
                            <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#4DA528]" />
                            <span className="text-sm font-extrabold text-stone-950">{faq.question}</span>
                          </span>
                          {isOpen ? <ChevronUp className="h-4 w-4 shrink-0 text-[#4DA528]" /> : <ChevronDown className="h-4 w-4 shrink-0 text-stone-400" />}
                        </button>
                        {isOpen && <p className="px-5 pb-5 pl-8 text-sm leading-7 text-stone-600">{faq.answer}</p>}
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-[12px] border border-dashed border-stone-300 bg-[#fffaf1] p-6 text-sm leading-7 text-stone-500">
                    FAQs have not been published for this package yet.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right: Sticky Enquiry Form */}
          <div className="lg:col-span-1">
            <div className="side-bar-right sticky top-28 space-y-6 rounded-[24px] border border-stone-200/80 bg-gradient-to-br from-white via-[#fffdf8] to-[#f7f2e7] p-6 shadow-[0_24px_70px_rgba(18,38,32,0.14)]" id="detail-enquiry-card">
              <div className="sidebar-widget space-y-4 border-b border-stone-100 pb-5">
                <div className="flex items-center justify-between">
                  <h6 className="block-heading text-2xl font-extrabold text-stone-950">Book This Tour</h6>
                  <span className="rounded-full bg-[#4DA528]/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Best Price</span>
                </div>
                <div className="rounded-[14px] bg-[#fffaf1] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500">Starting from</div>
                    {pkg.offerPrice && pkg.offerPrice < (pkg.price || 0) ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-amber-700">Save {formatPrice((pkg.price || 0) - pkg.offerPrice)}</span>
                    ) : null}
                  </div>
                  <div className="total text-main mt-1 text-3xl font-extrabold text-[#4DA528]">{formatPackagePrice(pkg.offerPrice || pkg.price)}</div>
                  <div className="mt-4 space-y-3 text-sm text-stone-600">
                    <div className="flex-two flex items-center justify-between gap-4">
                      <span className="label font-semibold">Duration:</span>
                      <span>{pkg.duration}</span>
                    </div>
                    <div className="flex-two flex items-center justify-between gap-4">
                      <span className="label font-semibold">Destination:</span>
                      <span className="text-right">{pkg.destination}</span>
                    </div>
                  </div>
                </div>
                <label className="block text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-500">
                  Guests
                  <select
                    value={selectedGuests}
                    onChange={(e) => setSelectedGuests(Number(e.target.value))}
                    className="mt-2 w-full rounded-[12px] border border-stone-200 bg-[#fffaf1] px-3 py-3 text-sm font-semibold text-stone-800 focus:border-[#4DA528] focus:outline-none"
                  >
                    {[1,2,3,4,5,6,8,10,12].map((guestCount) => (
                      <option key={guestCount} value={guestCount}>{guestCount} Guest{guestCount > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setBookingSuccess(false);
                    setBookingError('');
                    setIsBookingModalOpen(true);
                  }}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[12px] bg-[#4DA528] px-5 py-4 text-[12px] font-extrabold uppercase tracking-[0.14em] text-white shadow-[0_16px_35px_rgba(77,165,40,0.25)] transition hover:-translate-y-0.5 hover:bg-[#FF970D]"
                >
                  <Compass className="h-4 w-4" />
                  <span>Book Now</span>
                </button>
                <a
                  href={packageWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[12px] border border-emerald-200 bg-emerald-50 px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] text-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffaf1]"
                  aria-label={`Ask on WhatsApp about ${pkg.title}`}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>WhatsApp Details</span>
                </a>
                <button
                  type="button"
                  onClick={() => void handleSavePackage()}
                  disabled={savingPackage}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[12px] border border-[#4DA528]/20 bg-[#fffaf1] px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#4DA528] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#f3f7eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DA528]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffaf1] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Heart className={`h-4 w-4 transition ${Array.isArray(wishlistPackageIds) && wishlistPackageIds.includes(String(pkg.id ?? '')) ? 'fill-rose-600 text-rose-600' : ''}`} />
                  <span>{savingPackage ? 'Saving...' : Array.isArray(wishlistPackageIds) && wishlistPackageIds.includes(String(pkg.id ?? '')) ? 'Remove from Wishlist' : 'Add to Wishlist'}</span>
                </button>
                {saveNotice && (
                  <div className={`rounded-[12px] border px-3 py-3 text-sm ${saveNotice.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                    {saveNotice.message}
                  </div>
                )}
                {isAdminLoggedIn && onDeletePackage && (
                  <button
                    onClick={() => onDeletePackage(pkg.id)}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[12px] bg-red-600 px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Package</span>
                  </button>
                )}
                <div className="category-confidence space-y-3 pt-2 text-sm text-stone-600">
                  <div className="flex-three flex items-center gap-3">
                    <Phone className="h-4 w-4 text-[#4DA528]" />
                    <span>Customer care available for planning support</span>
                  </div>
                  <div className="flex-three flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-[#4DA528]" />
                    <span>Hand-picked tours and stays</span>
                  </div>
                </div>
                <div className="pt-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#4DA528]">Plan with us</span>
                  <p className="mt-2 text-sm leading-7 text-stone-500">
                    Enquire today, and get a customized draft itinerary within 24 hours.
                  </p>
                </div>
              </div>

              {submitSuccess ? (
                <div className="animate-fade-in space-y-4 rounded-3xl border border-[#0f766e]/20 bg-[#0f766e]/10 p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#0f766e] text-white shadow-sm">
                    <Check className="h-5 w-5" />
                  </div>
                  <h4 className="text-lg font-semibold text-stone-950">Enquiry submitted</h4>
                  <p className="text-sm leading-7 text-stone-600">
                    Thank you for reaching out to {business.companyName}. Our travel expert will call you shortly on the provided contact number.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitSuccess(false);
                      setFormData({
                        name: '',
                        phone: '',
                        email: '',
                        travelDate: '',
                        travelers: 2,
                        budget: '₹20,000 - ₹50,000',
                        message: ''
                      });
                    }}
                    className="w-full rounded-full bg-[#0f766e] py-3 text-[10px] font-extrabold uppercase tracking-wider text-white transition-all duration-200 hover:bg-[#0d5f59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffaf1]"
                  >
                    Submit Another Enquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  {errorMsg && (
                    <div role="alert" className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm font-semibold text-rose-700 shadow-sm">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Name */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Your Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="E.g. Yash Kumar"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-stone-200 bg-[#fffaf1] px-4 py-3 text-sm font-medium text-stone-800 focus:border-[#0f766e] focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* Phone */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        placeholder="E.g. +91 98765..."
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full rounded-2xl border border-stone-200 bg-[#fffaf1] px-4 py-3 text-sm font-medium text-stone-800 focus:border-[#0f766e] focus:bg-white focus:outline-none"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Email ID *</label>
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full rounded-2xl border border-stone-200 bg-[#fffaf1] px-4 py-3 text-sm font-medium text-stone-800 focus:border-[#0f766e] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Date & Travelers */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Travel Date *</label>
                      <input
                        type="date"
                        name="travelDate"
                        required
                        value={formData.travelDate}
                        onChange={handleInputChange}
                        className="w-full cursor-pointer rounded-2xl border border-stone-200 bg-[#fffaf1] px-4 py-3 text-sm font-medium text-stone-800 focus:border-[#0f766e] focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Travelers *</label>
                      <input
                        type="number"
                        name="travelers"
                        required
                        min="1"
                        max="100"
                        value={formData.travelers}
                        onChange={handleInputChange}
                        className="w-full rounded-2xl border border-stone-200 bg-[#fffaf1] px-4 py-3 text-sm font-medium text-stone-800 focus:border-[#0f766e] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Budget */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Est. Budget per Person</label>
                    <select
                      name="budget"
                      value={formData.budget}
                      onChange={handleInputChange}
                      className="w-full cursor-pointer rounded-2xl border border-stone-200 bg-[#fffaf1] px-4 py-3 text-sm font-medium text-stone-800 focus:border-[#0f766e] focus:bg-white focus:outline-none"
                    >
                      <option value="Under ₹20,000">Under ₹20,000</option>
                      <option value="₹20,000 - ₹50,000">₹20,000 - ₹50,000</option>
                      <option value="₹50,000 - ₹1,00,000">₹50,000 - ₹1,00,000</option>
                      <option value="₹1,00,000 - ₹2,00,000">₹1,00,000 - ₹2,00,000</option>
                      <option value="₹2,00,000+">₹2,00,000+ (Premium Custom)</option>
                    </select>
                  </div>

                  {/* Note */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Special Requests</label>
                    <textarea
                      name="message"
                      rows={2}
                      placeholder="Any specific hotel category, dietary preference..."
                      value={formData.message}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-stone-200 bg-[#fffaf1] px-4 py-3 text-sm font-medium text-stone-800 focus:border-[#0f766e] focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#f97350] py-3.5 text-xs font-extrabold uppercase tracking-[0.14em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#ea5f3c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97350]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffaf1] disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="h-4 w-4 animate-spin rounded-full border border-white border-t-transparent" />
                    ) : (
                      <>
                        <span>Submit Holiday Enquiry</span>
                        <Send className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>

        <NearbyPlacesSection
          destination={pkg.destination}
          packageTitle={pkg.title}
        />

        <GoogleReviews data={googleReviews} />

        <section className="review-content-tour rounded-[24px] border border-stone-200/80 bg-gradient-to-br from-white via-[#fffdf8] to-[#fcf6e8] p-6 shadow-[0_24px_70px_rgba(18,38,32,0.08)] md:p-8" id="package-reviews">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-[13px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Reviews</span>
              <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-stone-950">Guest feedback</h3>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-stone-200 bg-[#fffaf1] px-4 py-2">
              <div className="flex items-center gap-1 text-[#FF970D]">
                {[...Array(5)].map((_, index) => (
                  <Star key={index} className={`h-4 w-4 ${averageRating && index < Math.round(averageRating) ? 'fill-current' : 'text-stone-200'}`} />
                ))}
              </div>
              <span className="text-sm font-semibold text-stone-700">
                {averageRating ? `${averageRating.toFixed(1)} average` : publicReviewsLoading ? 'Loading reviews' : 'No rating yet'} • {packageReviews.length || 0} review{(packageReviews.length || 0) === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {publicReviewsLoading ? (
            <div className="rounded-[14px] border border-stone-200 bg-[#fffaf1] p-8 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#4DA528] border-t-transparent" />
              <p className="mt-3 text-sm leading-7 text-stone-500">Loading verified reviews...</p>
            </div>
          ) : packageReviews.length > 0 ? (
            <div className="client-review-list grid gap-5 md:grid-cols-2">
              {packageReviews.map((review: any, index: number) => (
                <article key={review.id || `${review.name || 'review'}-${index}`} className="client-review-item flex gap-4 rounded-[14px] border border-stone-200 bg-[#fffaf1] p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-sm">
                  <img src={getTravelImage(review.imageUrl)} alt={review.name || 'Traveler'} className="h-14 w-14 shrink-0 rounded-full object-cover" referrerPolicy="no-referrer" loading="lazy" decoding="async" onError={handleTravelImageError} />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-extrabold text-stone-950">{review.name || 'Traveler'}</h4>
                      {review.verified && <span className="rounded bg-[#4DA528]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#4DA528]">Verified</span>}
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-[#FF970D]">
                      {[...Array(Math.max(1, Math.min(5, Number(review.rating) || 5)))].map((_, starIndex) => (
                        <Star key={starIndex} className="h-3.5 w-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="mt-3 text-sm leading-7 text-stone-600">{review.comment || review.review}</p>
                    {review.destination && <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-stone-400">{review.destination}</p>}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[14px] border border-dashed border-stone-300 bg-[#fffaf1] p-8 text-center">
              <p className="text-sm leading-7 text-stone-500">No package-specific reviews are attached to this package yet.</p>
            </div>
          )}
        </section>

        <section className="rounded-[24px] border border-stone-200/80 bg-gradient-to-br from-white via-[#fffdf8] to-[#fcf6e8] p-6 shadow-[0_24px_70px_rgba(18,38,32,0.08)] md:p-8" id="related-packages">
          <div className="mb-8">
            <span className="text-[13px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Explore more</span>
            <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-stone-950">Related Packages</h3>
          </div>

          {displayedRelatedPackages.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {displayedRelatedPackages.map((related: TravelPackage, index: number) => (
                <article key={related.id || `${related.title || 'related'}-${index}`} className="tour-listing group overflow-hidden rounded-[14px] border border-stone-200 bg-white shadow-[0_12px_35px_rgba(18,38,32,0.08)] transition duration-300 hover:-translate-y-2 hover:shadow-[0_24px_55px_rgba(18,38,32,0.16)]">
                  <div className="tour-listing-image relative block aspect-[1.22/1] w-full overflow-hidden bg-stone-100 text-left">
                    <img src={getTravelImage(related.imageUrl || pkg.imageUrl)} alt={related.title || 'Related package'} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" referrerPolicy="no-referrer" loading="lazy" decoding="async" onError={handleTravelImageError} />
                    <span className="feature absolute left-4 top-4 rounded bg-[#4DA528] px-3 py-1 text-[12px] font-bold text-white">{related.category || 'Tour'}</span>
                  </div>
                  <div className="tour-listing-content p-5">
                    {related.destination && (
                      <p className="map flex items-center gap-2 text-[13px] font-semibold text-stone-500">
                        <MapPin className="h-4 w-4 text-[#4DA528]" />
                        {related.destination}
                      </p>
                    )}
                    <h4 className="title-tour-list mt-3 line-clamp-2 text-[20px] font-extrabold leading-tight text-stone-950">{related.title}</h4>
                    <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-4">
                      <span className="text-sm text-stone-500">{related.duration}</span>
                      <span className="font-extrabold text-[#4DA528]">{formatPrice(related.price)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate && openPackage(onNavigate, related)}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[5px] bg-stone-950 px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white transition hover:bg-[#4DA528]"
                    >
                      View Similar Tour
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[14px] border border-dashed border-stone-300 bg-[#fffaf1] p-8 text-center">
              <p className="text-sm leading-7 text-stone-500">No related package data is attached to this package yet.</p>
            </div>
          )}
        </section>

      </div>

      {isLightboxOpen && visibleGalleryImages.length > 0 && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-stone-950/85 p-4 backdrop-blur-sm" onClick={() => setIsLightboxOpen(false)}>
          <div className="relative w-full max-w-5xl overflow-hidden rounded-[24px] border border-white/10 bg-stone-950 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Close gallery lightbox"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={getTravelImage(visibleGalleryImages[selectedGalleryImage] || visibleGalleryImages[0])}
              alt={`${pkg.title} lightbox view`}
              className="max-h-[80vh] w-full object-contain"
              referrerPolicy="no-referrer"
              loading="lazy"
              decoding="async"
              onError={handleTravelImageError}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-stone-950/90 to-transparent p-6 text-white">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">{pkg.destination}</p>
                  <h3 className="text-xl font-semibold">{pkg.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {visibleGalleryImages.map((imageUrl, idx) => (
                    <button
                      key={`${imageUrl}-${idx}-thumb`}
                      type="button"
                      onClick={() => setSelectedGalleryImage(idx)}
                      className={`h-2.5 w-2.5 rounded-full transition ${idx === selectedGalleryImage ? 'bg-[#4DA528]' : 'bg-white/40'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-[9000] border-t border-stone-200 bg-white/95 p-3 shadow-[0_-8px_25px_rgba(18,38,32,0.10)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-stone-500">Starting from</p>
            <p className="text-base font-extrabold text-[#4DA528]">{formatPackagePrice(pkg.offerPrice || pkg.price)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleSavePackage()}
              disabled={savingPackage}
              className="flex items-center justify-center gap-2 rounded-full border border-[#4DA528]/20 bg-[#fffaf1] px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#4DA528]"
            >
              <Heart className={`h-4 w-4 transition ${Array.isArray(wishlistPackageIds) && wishlistPackageIds.includes(String(pkg.id ?? '')) ? 'fill-rose-600 text-rose-600' : ''}`} />
              {Array.isArray(wishlistPackageIds) && wishlistPackageIds.includes(String(pkg.id ?? '')) ? 'Saved' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => {
                setBookingSuccess(false);
                setBookingError('');
                setIsBookingModalOpen(true);
              }}
              className="w-full rounded-full bg-[#4DA528] px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white sm:w-auto"
            >
              Book Now
            </button>
            <a
              href={packageWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-emerald-700"
              aria-label={`Ask on WhatsApp about ${pkg.title}`}
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* BOOKING REQUEST MODAL (12 Fields, No Payment Gateway) */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 bg-[#000000]/65 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in" id="booking-request-modal">
          <div className="bg-[#fcfbf9] border border-stone-250 rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto font-sans flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-[#4DA528] text-white p-6 relative shrink-0">
              <button
                onClick={() => setIsBookingModalOpen(false)}
                className="absolute top-5 right-5 text-white/80 hover:text-white hover:rotate-90 transition-all duration-300 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#FF970D] bg-white/10 px-2 py-0.5 rounded-sm">Step-Free Offline Coordination</span>
              <h3 className="text-xl font-serif italic text-white mt-2">Book Your Holiday</h3>
              <p className="text-xs text-stone-100 font-light mt-1">
                Request custom travel planning for <strong className="font-bold">{pkg.title}</strong>. No payment/deposit is required to book.
              </p>
            </div>

            {bookingSuccess ? (
              <div className="p-8 text-center space-y-4 animate-fade-in flex-1 flex flex-col justify-center items-center">
                <div className="w-16 h-16 bg-[#4DA528]/10 text-[#4DA528] rounded-full flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="text-xl font-extrabold text-stone-950">Booking Request Submitted</h4>
                <p className="max-w-md text-sm leading-7 text-stone-600">Thank you, <strong className="font-semibold text-stone-900">{bookingForm.name}</strong>. Your request has been received and is being reviewed by our travel desk.</p>
                <div className="w-full rounded-[18px] border border-stone-200 bg-white p-4 text-left shadow-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-3">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Booking ID</p>
                      <p className="mt-1 text-lg font-bold text-stone-950">{submittedBooking?.bookingId || 'PRV-2026-0001'}</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-amber-700">Pending</span>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-stone-600 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-400">Package</p>
                      <p className="mt-1 font-semibold text-stone-900">{submittedBooking?.packageTitle || bookingForm.packageTitle}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-400">Travel Date</p>
                      <p className="mt-1 font-semibold text-stone-900">{submittedBooking?.travelDate || bookingForm.travelDate}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-400">Guests</p>
                      <p className="mt-1 font-semibold text-stone-900">{submittedBooking?.guests || Number(bookingForm.adults) + Number(bookingForm.children)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-400">Status</p>
                      <p className="mt-1 font-semibold text-stone-900">Pending</p>
                    </div>
                  </div>
                </div>
                <p className="max-w-md text-sm leading-7 text-stone-600">Our team will contact you shortly to confirm your booking.</p>
                <div className="flex w-full flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => {
                      setBookingSuccess(false);
                      setIsBookingModalOpen(false);
                      onNavigate?.('portal');
                    }}
                    className="flex-1 rounded-[5px] bg-[#4DA528] px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.16em] text-white transition hover:bg-[#3f8f21]"
                  >
                    View My Bookings
                  </button>
                  <button
                    onClick={() => {
                      setBookingSuccess(false);
                      setIsBookingModalOpen(false);
                      onNavigate?.('packages');
                    }}
                    className="flex-1 rounded-[5px] border border-stone-200 bg-white px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.16em] text-stone-700 transition hover:border-[#4DA528] hover:text-[#4DA528]"
                  >
                    Continue Exploring
                  </button>
                </div>
                <a
                  href={business.whatsappUrl(`Hello ${business.companyName},\nI have submitted my booking.\nBooking ID: ${submittedBooking?.bookingId || 'PRV-2026-0001'}\nPackage: ${submittedBooking?.packageTitle || bookingForm.packageTitle}\nPlease confirm my booking.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-700"
                >
                  <Phone className="h-4 w-4" />
                  Contact on WhatsApp
                </a>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="p-6 space-y-5">
                {bookingError && (
                  <div role="alert" className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm font-semibold text-rose-700 shadow-sm">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                <div className="rounded-[16px] border border-stone-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Professional Booking Engine</p>
                      <h4 className="mt-1 text-lg font-extrabold text-stone-950">Step {bookingStep} of 8</h4>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: 8 }).map((_, index) => (
                        <span key={index} className={`h-2.5 w-2.5 rounded-full ${index + 1 <= bookingStep ? 'bg-[#4DA528]' : 'bg-stone-200'}`} />
                      ))}
                    </div>
                  </div>
                </div>

                {bookingStep === 1 && (
                  <div className="space-y-4">
                    <div className="rounded-[16px] border border-stone-200 bg-stone-50 p-4">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-400">Package Summary</p>
                      <div className="mt-3 space-y-3 text-sm text-stone-700">
                        <div className="flex items-start justify-between gap-3"><span className="font-semibold">Package</span><span className="text-right font-semibold text-stone-950">{bookingForm.packageTitle}</span></div>
                        <div className="flex items-start justify-between gap-3"><span className="font-semibold">Price</span><span className="text-right font-semibold text-stone-950">{formatPrice(pkg.offerPrice || pkg.price)}</span></div>
                        <div className="flex items-start justify-between gap-3"><span className="font-semibold">Selected Date</span><span className="text-right font-semibold text-stone-950">{bookingForm.travelDate || 'Flexible'}</span></div>
                        <div className="flex items-start justify-between gap-3"><span className="font-semibold">Travellers</span><span className="text-right font-semibold text-stone-950">{Number(bookingForm.adults) + Number(bookingForm.children)} travellers</span></div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Your Full Name *</label>
                        <input type="text" name="name" required value={bookingForm.name} onChange={handleBookingInputChange} className="w-full rounded-[12px] border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 focus:border-[#4DA528] focus:outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Email Address *</label>
                        <input type="email" name="email" required value={bookingForm.email} onChange={handleBookingInputChange} className="w-full rounded-[12px] border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 focus:border-[#4DA528] focus:outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Mobile Number *</label>
                        <input type="tel" name="phone" required value={bookingForm.phone} onChange={handleBookingInputChange} className="w-full rounded-[12px] border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 focus:border-[#4DA528] focus:outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">WhatsApp Number *</label>
                        <input type="tel" name="whatsapp" required value={bookingForm.whatsapp} onChange={handleBookingInputChange} className="w-full rounded-[12px] border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 focus:border-[#4DA528] focus:outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Travel Date *</label>
                        <input type="date" name="travelDate" required value={bookingForm.travelDate} onChange={handleBookingInputChange} className="w-full cursor-pointer rounded-[12px] border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 focus:border-[#4DA528] focus:outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Travellers</label>
                        <div className="grid grid-cols-2 gap-3">
                          <input type="number" name="adults" min="1" value={bookingForm.adults} onChange={handleBookingInputChange} className="w-full rounded-[12px] border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 focus:border-[#4DA528] focus:outline-none" />
                          <input type="number" name="children" min="0" value={bookingForm.children} onChange={handleBookingInputChange} className="w-full rounded-[12px] border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 focus:border-[#4DA528] focus:outline-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {bookingStep === 2 && (
                  <div className="space-y-4">
                    <div className="rounded-[16px] border border-stone-200 bg-stone-50 p-4">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-400">Lead Traveller</p>
                      <p className="mt-1 text-sm text-stone-600">Primary traveller details will be used for booking records and coordination.</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1"><label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">First Name *</label><input value={leadTraveller.firstName} onChange={(e) => updateLeadTraveller('firstName', e.target.value)} className="w-full rounded-[12px] border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 focus:border-[#4DA528] focus:outline-none" /></div>
                      <div className="space-y-1"><label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Last Name *</label><input value={leadTraveller.lastName} onChange={(e) => updateLeadTraveller('lastName', e.target.value)} className="w-full rounded-[12px] border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 focus:border-[#4DA528] focus:outline-none" /></div>
                      <div className="space-y-1"><label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Phone *</label><input value={leadTraveller.phone} onChange={(e) => updateLeadTraveller('phone', e.target.value)} className="w-full rounded-[12px] border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 focus:border-[#4DA528] focus:outline-none" /></div>
                      <div className="space-y-1"><label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Email *</label><input type="email" value={leadTraveller.email} onChange={(e) => updateLeadTraveller('email', e.target.value)} className="w-full rounded-[12px] border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 focus:border-[#4DA528] focus:outline-none" /></div>
                      <div className="space-y-1"><label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Gender</label><select value={leadTraveller.gender} onChange={(e) => updateLeadTraveller('gender', e.target.value)} className="w-full rounded-[12px] border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 focus:border-[#4DA528] focus:outline-none"><option>Prefer not to say</option><option>Male</option><option>Female</option><option>Other</option></select></div>
                      <div className="space-y-1"><label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">DOB</label><input type="date" value={leadTraveller.dob} onChange={(e) => updateLeadTraveller('dob', e.target.value)} className="w-full rounded-[12px] border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 focus:border-[#4DA528] focus:outline-none" /></div>
                      <div className="space-y-1 sm:col-span-2"><label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Nationality</label><input value={leadTraveller.nationality} onChange={(e) => updateLeadTraveller('nationality', e.target.value)} className="w-full rounded-[12px] border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 focus:border-[#4DA528] focus:outline-none" /></div>
                    </div>
                  </div>
                )}

                {bookingStep === 3 && (
                  <div className="space-y-4">
                    <div className="rounded-[16px] border border-stone-200 bg-stone-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-400">Other Travellers</p>
                          <p className="mt-1 text-sm text-stone-600">Add companion details as needed for the booking file.</p>
                        </div>
                        <button type="button" onClick={addTraveller} className="rounded-[8px] border border-[#4DA528]/20 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#4DA528]">+ Add Traveller</button>
                      </div>
                    </div>
                    {travellerList.length === 0 ? (
                      <div className="rounded-[14px] border border-dashed border-stone-300 bg-white p-4 text-sm text-stone-500">No other travellers added yet. You can continue without adding any companion details.</div>
                    ) : (
                      <div className="space-y-3">
                        {travellerList.map((traveller) => (
                          <div key={traveller.id} className="rounded-[14px] border border-stone-200 bg-white p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <p className="text-sm font-semibold text-stone-900">Traveller</p>
                              <button type="button" onClick={() => removeTraveller(traveller.id)} className="text-[10px] font-bold uppercase tracking-[0.16em] text-rose-600">Remove</button>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <input value={traveller.name} onChange={(e) => updateTraveller(traveller.id, 'name', e.target.value)} placeholder="Name" className="rounded-[10px] border border-stone-200 px-3 py-2 text-sm focus:border-[#4DA528] focus:outline-none" />
                              <input value={traveller.age} onChange={(e) => updateTraveller(traveller.id, 'age', e.target.value)} placeholder="Age" className="rounded-[10px] border border-stone-200 px-3 py-2 text-sm focus:border-[#4DA528] focus:outline-none" />
                              <select value={traveller.gender} onChange={(e) => updateTraveller(traveller.id, 'gender', e.target.value)} className="rounded-[10px] border border-stone-200 px-3 py-2 text-sm focus:border-[#4DA528] focus:outline-none"><option>Prefer not to say</option><option>Male</option><option>Female</option><option>Other</option></select>
                              <select value={traveller.idType} onChange={(e) => updateTraveller(traveller.id, 'idType', e.target.value)} className="rounded-[10px] border border-stone-200 px-3 py-2 text-sm focus:border-[#4DA528] focus:outline-none"><option>Passport</option><option>Aadhaar</option><option>Driving License</option><option>Other</option></select>
                              <input value={traveller.idNumber} onChange={(e) => updateTraveller(traveller.id, 'idNumber', e.target.value)} placeholder="ID Number" className="rounded-[10px] border border-stone-200 px-3 py-2 text-sm focus:border-[#4DA528] focus:outline-none sm:col-span-2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {bookingStep === 4 && (
                  <div className="space-y-4">
                    <div className="rounded-[16px] border border-stone-200 bg-stone-50 p-4">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-400">Emergency Contact</p>
                      <p className="mt-1 text-sm text-stone-600">This information helps us respond quickly in case of an urgent travel need.</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1 sm:col-span-2"><label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Name *</label><input value={emergencyContact.name} onChange={(e) => setEmergencyContact((prev) => ({ ...prev, name: e.target.value }))} className="w-full rounded-[12px] border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 focus:border-[#4DA528] focus:outline-none" /></div>
                      <div className="space-y-1"><label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Phone *</label><input value={emergencyContact.phone} onChange={(e) => setEmergencyContact((prev) => ({ ...prev, phone: e.target.value }))} className="w-full rounded-[12px] border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 focus:border-[#4DA528] focus:outline-none" /></div>
                      <div className="space-y-1"><label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Relationship *</label><input value={emergencyContact.relationship} onChange={(e) => setEmergencyContact((prev) => ({ ...prev, relationship: e.target.value }))} className="w-full rounded-[12px] border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 focus:border-[#4DA528] focus:outline-none" /></div>
                    </div>
                  </div>
                )}

                {bookingStep === 5 && (
                  <div className="space-y-4">
                    <div className="rounded-[16px] border border-stone-200 bg-stone-50 p-4">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-400">Coupons</p>
                      <p className="mt-1 text-sm text-stone-600">Apply a coupon to unlock an auto discount before final payment.</p>
                    </div>
                    <div className="rounded-[16px] border border-stone-200 bg-white p-4">
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Enter coupon code" className="flex-1 rounded-[12px] border border-stone-200 px-3 py-2.5 text-sm focus:border-[#4DA528] focus:outline-none" />
                        <button type="button" onClick={handleApplyCoupon} className="rounded-[10px] bg-[#4DA528] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white">Apply Coupon</button>
                      </div>
                      <div className="mt-3 rounded-[12px] border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">{appliedCoupon ? `Applied: ${appliedCoupon.label}` : 'Auto discount available for eligible bookings and first-time travellers.'}</div>
                    </div>
                  </div>
                )}

                {bookingStep === 6 && (
                  <div className="space-y-4">
                    <div className="rounded-[16px] border border-stone-200 bg-stone-50 p-4">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-400">Price Summary</p>
                      <p className="mt-1 text-sm text-stone-600">Estimated charges for your selected package and travellers.</p>
                    </div>
                    <div className="rounded-[16px] border border-stone-200 bg-white p-4 text-sm text-stone-700">
                      <div className="flex items-center justify-between border-b border-stone-100 py-2"><span>Package Price</span><span>{formatPrice(bookingBreakdown.packagePrice)}</span></div>
                      <div className="flex items-center justify-between border-b border-stone-100 py-2"><span>Taxes</span><span>{formatPrice(bookingBreakdown.taxes)}</span></div>
                      <div className="flex items-center justify-between border-b border-stone-100 py-2"><span>Discount</span><span>- {formatPrice(bookingBreakdown.discount)}</span></div>
                      <div className="flex items-center justify-between border-b border-stone-100 py-2"><span>Booking Amount</span><span className="font-semibold text-stone-950">{formatPrice(bookingBreakdown.bookingAmount)}</span></div>
                      <div className="flex items-center justify-between border-b border-stone-100 py-2"><span>Remaining Amount</span><span>{formatPrice(bookingBreakdown.remainingAmount)}</span></div>
                      <div className="flex items-center justify-between py-2"><span>Grand Total</span><span className="font-extrabold text-[#4DA528]">{formatPrice(bookingBreakdown.grandTotal)}</span></div>
                    </div>
                  </div>
                )}

                {bookingStep === 7 && (
                  <div className="space-y-4">
                    <div className="rounded-[16px] border border-stone-200 bg-stone-50 p-4">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-400">Payment</p>
                      <p className="mt-1 text-sm text-stone-600">Choose how you would like to secure your booking.</p>
                    </div>
                    <div className="grid gap-3">
                      {[
                        { id: 'razorpay', label: 'Razorpay Placeholder', description: 'Secure online payment gateway' },
                        { id: 'cash', label: 'Cash', description: 'Pay at the agency office' },
                        { id: 'bank', label: 'Bank Transfer', description: 'Transfer to the registered account' },
                        { id: 'pay-later', label: 'Pay Later', description: 'Reserve now and pay later' },
                      ].map((option) => (
                        <button key={option.id} type="button" onClick={() => setPaymentMethod(option.id as typeof paymentMethod)} className={`rounded-[14px] border px-4 py-3 text-left ${paymentMethod === option.id ? 'border-[#4DA528] bg-[#f5fbef]' : 'border-stone-200 bg-white'}`}>
                          <div className="text-sm font-semibold text-stone-900">{option.label}</div>
                          <div className="mt-1 text-xs text-stone-500">{option.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {bookingStep === 8 && (
                  <div className="space-y-4">
                    <div className="rounded-[16px] border border-stone-200 bg-stone-50 p-4">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-400">Confirmation</p>
                      <p className="mt-1 text-sm text-stone-600">Review the booking details and confirm the reservation.</p>
                    </div>
                    <div className="rounded-[16px] border border-stone-200 bg-white p-4 text-sm text-stone-700">
                      <div className="flex items-center justify-between border-b border-stone-100 py-2"><span>Booking ID</span><span className="font-semibold text-stone-950">{submittedBooking?.bookingId || 'PRV-2026-0001'}</span></div>
                      <div className="flex items-center justify-between border-b border-stone-100 py-2"><span>Package</span><span>{bookingForm.packageTitle}</span></div>
                      <div className="flex items-center justify-between border-b border-stone-100 py-2"><span>Travel Date</span><span>{bookingForm.travelDate}</span></div>
                      <div className="flex items-center justify-between border-b border-stone-100 py-2"><span>Travellers</span><span>{Number(bookingForm.adults) + Number(bookingForm.children)}</span></div>
                      <div className="flex items-center justify-between py-2"><span>Grand Total</span><span className="font-extrabold text-[#4DA528]">{formatPrice(bookingBreakdown.grandTotal)}</span></div>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button type="button" onClick={() => downloadBookingDocument('voucher')} className="flex-1 rounded-[10px] border border-stone-200 bg-white px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-700">Download Voucher</button>
                      <button type="button" onClick={() => downloadBookingDocument('invoice')} className="flex-1 rounded-[10px] border border-stone-200 bg-white px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-700">Download Invoice</button>
                    </div>
                    <a href={business.whatsappUrl(`Hello ${business.companyName}, I have booked ${bookingForm.packageTitle}. Booking ID: ${submittedBooking?.bookingId || 'PRV-2026-0001'}`)} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-[10px] border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">WhatsApp Confirmation</a>
                  </div>
                )}

                <div className="flex flex-col gap-3 border-t border-stone-200 pt-3 font-sans sm:flex-row sm:justify-between">
                  {bookingStep > 1 ? (
                    <button type="button" onClick={() => { setBookingError(''); setBookingStep((prev) => Math.max(1, prev - 1)); }} className="px-4 py-2 border border-stone-250 hover:bg-stone-50 rounded text-stone-600 text-xs font-bold transition-all duration-200">Back</button>
                  ) : <div />}
                  {bookingStep < 8 ? (
                    <button type="button" onClick={() => {
                      if (!bookingForm.name || !bookingForm.phone || !bookingForm.whatsapp || !bookingForm.email || !bookingForm.travelDate) {
                        setBookingError('Please complete the required package details before continuing.');
                        return;
                      }
                      if (bookingStep === 2 && (!leadTraveller.firstName || !leadTraveller.lastName || !leadTraveller.phone || !leadTraveller.email)) {
                        setBookingError('Please complete the lead traveller details before continuing.');
                        return;
                      }
                      if (bookingStep === 4 && (!emergencyContact.name || !emergencyContact.phone || !emergencyContact.relationship)) {
                        setBookingError('Please complete the emergency contact details before continuing.');
                        return;
                      }
                      setBookingError('');
                      setBookingStep((prev) => Math.min(8, prev + 1));
                    }} className="px-6 py-2 bg-[#4DA528] hover:bg-[#3f8f21] text-white text-xs font-bold rounded shadow-sm hover:shadow transition-all duration-200 flex items-center gap-1.5">Continue</button>
                  ) : (
                    <button type="submit" disabled={bookingSubmitting} className="px-6 py-2 bg-[#4DA528] hover:bg-[#3f8f21] text-white text-xs font-bold rounded shadow-sm hover:shadow transition-all duration-200 disabled:opacity-60 flex items-center gap-1.5">
                      {bookingSubmitting ? (<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />) : (<><Check className="w-4 h-4" /><span>Confirm Booking</span></>) }
                    </button>
                  )}
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
