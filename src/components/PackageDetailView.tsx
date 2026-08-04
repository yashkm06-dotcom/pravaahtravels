import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, Calendar, MapPin, Check, X, Send, Users, 
  ChevronDown, ChevronUp, Trash2, Sparkles, Phone, Compass, HelpCircle, CheckCircle2, Heart,
  Star, Camera, ChevronRight, AlertCircle, MessageCircle, BedDouble, Car, Utensils, Flame,
  Instagram, Youtube
} from 'lucide-react';
import { TravelPackage, Enquiry, Review, WebsiteCMSSettings, DEFAULT_WEBSITE_CMS, Hotel, PackageDeparture, formatPrice } from '../types';
import { db, collection, addDoc, auth, getDocs, query, where, orderBy, limit } from '../lib/firebase';
import { triggerSystemEmail } from '../lib/emailClient';
import { getTravelImage, handleTravelImageError } from '../utils/imageFallback';
import { SkeletonCard } from './SkeletonLoader';
import NearbyPlacesSection from './NearbyPlacesSection';
import TravelMedia from './TravelMedia';

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
  hotels?: Hotel[];
  // When true (admin Preview), blocks real enquiry/booking submissions — Firestore writes
  // and outbound emails — since a preview must never "publish" side effects.
  previewMode?: boolean;
}

const slugifyPackageTitle = (value: string) => String(value ?? '')
  .toLowerCase()
  .trim()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const getPackageRouteSegment = (pkg: Pick<TravelPackage, 'id' | 'title'>) => {
  const slug = slugifyPackageTitle(pkg.title);
  return slug ? `${slug}-${pkg.id}` : String(pkg.id);
};

const sanitizeWhatsAppPhone = (value?: string) => {
  const digits = String(value ?? '').replace(/[^\d]/g, '');
  if (!digits) return '';
  const trimmed = digits.replace(/^0+/, '');
  // Only treat the number as already carrying the "91" country code at the full 12-digit
  // length — a raw 10-digit Indian mobile number that happens to start with "91" (e.g.
  // 9198765432) was previously misdetected as already coded, producing a broken wa.me link.
  return trimmed.length === 12 && trimmed.startsWith('91') ? trimmed : `91${trimmed}`;
};

const getValidExternalUrl = (value?: string) => {
  if (!value || value === '#') return null;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
};

const getMatchingListItems = (items: string[] | undefined, terms: string[]) => {
  return (items || []).filter((item) => {
    const normalized = item.toLowerCase();
    return terms.some((term) => normalized.includes(term));
  });
};

const clampDifficultyLevel = (value?: number | null) => {
  const level = Number(value || 0);
  if (!Number.isFinite(level) || level <= 0) return null;
  return Math.max(1, Math.min(10, Math.round(level)));
};

const getPolicyGroups = (items: string[]) => {
  const groups = [
    { title: 'Confirmation Policy', terms: ['confirm', 'voucher', 'booking confirmation', 'email confirmation'], items: [] as string[] },
    { title: 'Refund Policy', terms: ['refund', 'wallet', 'processed'], items: [] as string[] },
    { title: 'Cancellation Policy', terms: ['cancel', 'cancellation'], items: [] as string[] },
    { title: 'Payment Terms', terms: ['payment', 'paid', 'advance', 'balance'], items: [] as string[] },
    { title: 'Travel Policies', terms: [] as string[], items: [] as string[] },
  ];

  items.forEach((item) => {
    const normalized = item.toLowerCase();
    const matched = groups.find((group) => group.terms.length && group.terms.some((term) => normalized.includes(term)));
    (matched || groups[groups.length - 1]).items.push(item);
  });

  return groups.filter((group) => group.items.length > 0);
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
  hotels = [],
  previewMode = false,
}: PackageDetailViewProps) {
  // Accordion state for itinerary days
  const [activeDay, setActiveDay] = useState<number | null>(1);
  const [allItineraryExpanded, setAllItineraryExpanded] = useState(false);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isKnowBeforeExpanded, setIsKnowBeforeExpanded] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [hasSummaryOverflow, setHasSummaryOverflow] = useState(false);
  const summaryTextRef = useRef<HTMLParagraphElement>(null);
  const summaryText = String(pkg.shortDescription || '').trim();
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [hasOverviewOverflow, setHasOverviewOverflow] = useState(false);
  const overviewTextRef = useRef<HTMLParagraphElement>(null);
  const overviewText = String(pkg.fullDescription || pkg.shortDescription || '').trim();
  
  // Local editable itinerary for custom sorting/swapping (Drag and Drop)
  const [localItinerary, setLocalItinerary] = useState<any[]>([]);

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
    setActiveDay(1);
    setAllItineraryExpanded(false);
    setIsKnowBeforeExpanded(false);
    setIsSummaryExpanded(false);
    setIsOverviewExpanded(false);
    setLightboxImages([]);
    setIsLightboxOpen(false);
  }, [pkg.id]);

  useEffect(() => {
    if (isSummaryExpanded) return;

    const measureSummary = () => {
      const summaryElement = summaryTextRef.current;
      if (!summaryElement) return;
      setHasSummaryOverflow(summaryElement.scrollHeight > summaryElement.clientHeight + 1);
    };

    const animationFrame = window.requestAnimationFrame(measureSummary);
    window.addEventListener('resize', measureSummary);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', measureSummary);
    };
  }, [isSummaryExpanded, summaryText]);

  useEffect(() => {
    if (isOverviewExpanded) return;

    const measureOverview = () => {
      const overviewElement = overviewTextRef.current;
      if (!overviewElement) return;
      setHasOverviewOverflow(overviewElement.scrollHeight > overviewElement.clientHeight + 1);
    };

    const animationFrame = window.requestAnimationFrame(measureOverview);
    window.addEventListener('resize', measureOverview);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', measureOverview);
    };
  }, [isOverviewExpanded, overviewText]);

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

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
    setBookingError('');
  };

  useEffect(() => {
    if (!isBookingModalOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeBookingModal();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isBookingModalOpen]);

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
    if (previewMode) {
      setBookingError('This is a preview — booking requests are not submitted here.');
      return;
    }
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
    setAllItineraryExpanded(false);
    setActiveDay((prev) => (prev === day ? null : day));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (previewMode) {
      setErrorMsg('This is a preview — enquiries are not submitted here.');
      return;
    }
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
        source: 'Package Enquiry',
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
  const visibleGalleryImages = uniquePackageGalleryImages.slice(0, 6);
  const hasPackageImages = visibleGalleryImages.length > 0;
  const primaryPackageImage = visibleGalleryImages[0] || '';
  const openLightbox = (images: string[], imageIndex = 0) => {
    const cleanImages = Array.from(new Set(
      images
        .map((imageUrl) => String(imageUrl || '').trim())
        .filter(Boolean)
    ));
    if (!cleanImages.length) return;
    setLightboxImages(cleanImages);
    setSelectedGalleryImage(Math.min(Math.max(imageIndex, 0), cleanImages.length - 1));
    setIsLightboxOpen(true);
  };
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
    { label: 'Starting Price', value: formatPrice(pkg.offerPrice || pkg.price), icon: Check },
  ];
  const includedItems = (pkg.inclusions || []).filter(Boolean).slice(0, 8);
  const excludedItems = (pkg.exclusions || []).filter(Boolean).slice(0, 8);
  const highlightItems = (pkg.highlights || []).filter(Boolean).slice(0, 8);
  const packingItems = (pkg.thingsToCarry || []).filter(Boolean);
  const knowBeforeItems = (pkg.knowBeforeYouGo || []).filter(Boolean);
  const departureWindowItems = (pkg.departureDates || []).filter(Boolean).slice(0, 6);
  const policyItems = (pkg.policies || []).filter(Boolean);
  const policyGroups = getPolicyGroups(policyItems);
  const faqItems = (pkg.faqs || []).slice(0, 6);
  const difficultyLevel = clampDifficultyLevel(pkg.difficultyLevel);
  const packageOptions = (pkg.packageOptions && pkg.packageOptions.length > 0 ? pkg.packageOptions : [{
    title: pkg.title,
    description: pkg.shortDescription || pkg.fullDescription,
    price: pkg.offerPrice || pkg.price,
    originalPrice: pkg.offerPrice ? pkg.price : null,
    inclusions: [...hotelItems, ...transportationItems, ...mealPlanItems].slice(0, 5),
  }]).filter((option) => option.title);
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

  const recommendedHotels = useMemo(() => {
    const hotelIds = pkg.hotelIds || [];
    if (hotelIds.length === 0) return [];
    return hotels.filter((hotel) => hotel.status === 'Active' && hotelIds.includes(hotel.id));
  }, [hotels, pkg.hotelIds]);

  const upcomingDepartures = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return (pkg.departures || [])
      .filter((departure) => departure.status !== 'Cancelled')
      .filter((departure) => {
        const date = new Date(departure.departureDate);
        return !Number.isNaN(date.getTime()) && date >= todayStart;
      })
      .sort((a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime());
  }, [pkg.departures]);

  const companyName = websiteCMS.companyName || DEFAULT_WEBSITE_CMS.companyName || 'Pravaah Travels';
  const whatsappPhone = (
    sanitizeWhatsAppPhone(websiteCMS.whatsappNumber) ||
    sanitizeWhatsAppPhone(websiteCMS.primaryPhone) ||
    sanitizeWhatsAppPhone(websiteCMS.footerPhone) ||
    sanitizeWhatsAppPhone(DEFAULT_WEBSITE_CMS.whatsappNumber) ||
    sanitizeWhatsAppPhone(DEFAULT_WEBSITE_CMS.footerPhone)
  );
  const packageWhatsAppUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Hello,\nI am interested in the ${pkg.title} Package.\nPlease send complete details.`)}`;
  const instagramUrl = getValidExternalUrl(websiteCMS.socialInstagram) || DEFAULT_WEBSITE_CMS.socialInstagram;
  const youtubeUrl = getValidExternalUrl(websiteCMS.socialLinkedIn) || DEFAULT_WEBSITE_CMS.socialLinkedIn;
  const openBookingModal = (prefillDeparture?: PackageDeparture) => {
    setBookingSuccess(false);
    setBookingError('');
    if (prefillDeparture?.departureDate) {
      setBookingForm((prev) => ({ ...prev, travelDate: prefillDeparture.departureDate }));
    }
    setIsBookingModalOpen(true);
  };

  return (
    <div id="package-detail-view" className="animate-fade-in overflow-x-clip bg-[#f3f6f8] text-stone-900">
      <section className="relative pt-24 sm:pt-28">
        <div className="mx-auto max-w-[1500px] px-3 sm:px-5 lg:px-8">
          <div className="mb-4 flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
            <button type="button" onClick={onBack} className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm transition hover:text-[#4DA528]">
              <ArrowLeft className="h-4 w-4" />
              <span>Packages</span>
            </button>
            <span className="h-px w-8 bg-stone-300" />
            <span>{pkg.destination}</span>
          </div>

          <div className="grid min-h-[380px] overflow-hidden rounded-[8px] bg-stone-200 shadow-[0_24px_80px_rgba(15,23,42,0.16)] lg:grid-cols-[1.48fr_1fr]">
            {hasPackageImages ? (
              <>
                <button type="button" onClick={() => openLightbox(visibleGalleryImages, 0)} className="group relative min-h-[320px] overflow-hidden text-left lg:min-h-[520px]">
                  <TravelMedia
                    src={primaryPackageImage}
                    alt={pkg.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    loading="eager"
                    decoding="async"
                    disableFallback
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-stone-950/60 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 max-w-xl text-white">
                    <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] backdrop-blur-md">{pkg.category}</span>
                    <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-4xl">{pkg.destination}</h2>
                  </div>
                </button>

                <div className="grid grid-cols-2 gap-1 bg-white/70 p-1">
                  {visibleGalleryImages.slice(1, 5).map((imageUrl, idx) => (
                    <button
                      key={`${imageUrl}-${idx}`}
                      type="button"
                      onClick={() => openLightbox(visibleGalleryImages, idx + 1)}
                      className="group relative min-h-[150px] overflow-hidden bg-stone-200 text-left"
                    >
                      <TravelMedia
                        src={imageUrl}
                        alt={`${pkg.title} gallery ${idx + 2}`}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        loading={idx === 0 ? 'eager' : 'lazy'}
                        decoding="async"
                        disableFallback
                      />
                      {idx === Math.min(3, visibleGalleryImages.slice(1, 5).length - 1) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-stone-950/36 text-white">
                          <span className="inline-flex items-center gap-2 rounded-full bg-stone-950/70 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.16em] backdrop-blur-md">
                            <Camera className="h-4 w-4" />
                            Gallery
                          </span>
                        </div>
                      )}
                    </button>
                  ))}
                  {visibleGalleryImages.length === 1 && (
                    <div className="col-span-2 flex min-h-[260px] items-center justify-center bg-[#f8f7f4] p-6 text-center text-sm font-semibold text-stone-400">
                      Additional gallery images have not been uploaded yet.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="col-span-full flex min-h-[380px] flex-col items-center justify-center gap-4 bg-[#f8f7f4] p-8 text-center lg:min-h-[520px]">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-stone-300 bg-white text-stone-300">
                  <Camera className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">{pkg.category}</p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">{pkg.destination}</h2>
                  <p className="mt-3 text-sm font-medium text-stone-500">Package images have not been uploaded yet.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1500px] space-y-8 px-3 py-6 sm:px-5 sm:py-8 lg:px-8 lg:py-10">
        <section className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="rounded-[6px] border border-stone-200 bg-white p-6 shadow-[0_16px_45px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded bg-[#ff5a1f] px-1 py-8 text-[0px]" aria-hidden="true" />
              <h1 className="max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-stone-900 sm:text-4xl lg:text-[42px]">
                {pkg.title}
              </h1>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm font-semibold text-stone-500">
              <span className="inline-flex items-center rounded-[6px] bg-[#10a31a] px-4 py-2 text-lg font-extrabold text-white">
                {averageRating ? averageRating.toFixed(1) : '4.8'} / 5
              </span>
              <span>({packageReviews.length || 0} Reviews)</span>
              <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" />{pkg.duration}</span>
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{pkg.destination}</span>
            </div>
            <p
              ref={summaryTextRef}
              id="package-summary-description"
              className={`mt-5 max-w-4xl whitespace-pre-line text-[15px] leading-8 text-stone-600 ${isSummaryExpanded ? '' : 'line-clamp-3'}`}
            >
              {summaryText}
            </p>
            {hasSummaryOverflow && (
              <button
                type="button"
                onClick={() => setIsSummaryExpanded((current) => !current)}
                className="mt-3 inline-flex items-center gap-2 text-sm font-extrabold text-[#ff5a1f] transition hover:text-[#4DA528]"
                aria-expanded={isSummaryExpanded}
                aria-controls="package-summary-description"
              >
                {isSummaryExpanded ? 'Read less' : 'Read full'}
                {isSummaryExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            )}
            <div className="mt-6 flex flex-col gap-4 rounded-[8px] border border-sky-200 bg-sky-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold leading-6 text-sky-800">
                Talk to a destination expert for custom hotels, routes, transfers and group discounts.
              </p>
              <div className="flex shrink-0 flex-wrap gap-2">
                <a
                  href={packageWhatsAppUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center gap-2 rounded-[6px] bg-[#0f9f72] px-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white transition hover:-translate-y-0.5 hover:bg-[#0b805c]"
                  aria-label={`Ask about ${pkg.title} on WhatsApp`}
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[6px] bg-[#d94680] text-white transition hover:-translate-y-0.5 hover:bg-[#be185d]"
                  aria-label="Open Pravaah Travels on Instagram"
                  title="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[6px] bg-[#ef1b1b] text-white transition hover:-translate-y-0.5 hover:bg-[#c81717]"
                  aria-label="Find Pravaah Travels on YouTube"
                  title="YouTube"
                >
                  <Youtube className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-[8px] border border-stone-200 bg-white p-6 shadow-[0_16px_45px_rgba(15,23,42,0.08)]">
            <p className="text-sm text-stone-500">Starting from {pkg.offerPrice && <span className="ml-1 text-stone-400 line-through">{formatPrice(pkg.price)}</span>}</p>
            <div className="mt-2 text-4xl font-extrabold tracking-tight text-[#ff5a1f]">{formatPrice(pkg.offerPrice || pkg.price)}</div>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-stone-500">per person</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {pkg.offerPrice && <span className="rounded bg-amber-100 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-amber-700">Best offer</span>}
              <span className="rounded bg-[#4DA528]/10 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#4DA528]">Custom quote</span>
            </div>
            <button
              type="button"
              onClick={() => openBookingModal()}
              className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-[6px] bg-[#ff5a1f] px-5 py-4 text-[12px] font-extrabold uppercase tracking-[0.14em] text-white shadow-[0_14px_30px_rgba(255,90,31,0.24)] transition hover:-translate-y-0.5 hover:bg-[#e64a14]"
            >
              <Compass className="h-4 w-4" />
              Send Booking Request
            </button>
          </div>
        </section>

        <section className="rounded-[6px] border border-stone-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
          <div className="grid gap-4 text-center sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: hotelItems.length ? 'Stay Included' : 'Premium Stay', icon: BedDouble },
              { label: transportationItems.length ? 'Transport Included' : 'Private Transfers', icon: Car },
              { label: mealPlanItems.length ? 'Meals Included' : 'Meal Plan', icon: Utensils },
              { label: 'Expert Support', icon: Phone },
              { label: 'Handpicked Route', icon: Compass },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-[6px] border border-stone-100 bg-[#fcfbf9] px-4 py-5">
                  <Icon className="mx-auto h-8 w-8 text-[#ff5a1f]" />
                  <p className="mt-3 text-sm font-bold text-stone-700">{item.label}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Main Content & Sticky Form Split */}
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_400px]">
          
          {/* Left: General Details, Itinerary, Inclusions */}
          <div className="space-y-7">
            <nav className="hidden overflow-hidden rounded-[6px] border border-stone-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)] lg:block">
              <div className="grid grid-cols-7 text-center text-sm font-bold text-stone-600">
                {[
                  ['Overview', '#tour-overview'],
                  ['Itinerary', '#custom-itinerary-section'],
                  ['Options', '#package-options'],
                  ['Inclusions', '#tour-inclusions'],
                  ['Map', '#tour-map'],
                  ['Reviews', '#package-reviews'],
                  ['Policies', '#tour-policies'],
                ].map(([label, href]) => (
                  <a key={href} href={href} className="border-r border-stone-100 px-3 py-4 transition hover:bg-[#fff4ec] hover:text-[#ff5a1f] last:border-r-0">{label}</a>
                ))}
              </div>
            </nav>

            <section className="rounded-[6px] border border-stone-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)] md:p-8" id="tour-highlights">
              <div className="border-l-4 border-[#ff5a1f] pl-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#FF970D]" />
                  <span className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Highlights</span>
                </div>
                <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-stone-950 sm:text-3xl">{pkg.title} Highlights</h3>
              </div>
              {highlightItems.length > 0 ? (
                <div className="mt-6 grid gap-3 xl:grid-cols-2">
                  {highlightItems.map((item, idx) => (
                    <div key={`${item}-${idx}`} className="flex h-full items-start gap-3 rounded-[6px] border border-stone-100 bg-[#fcfbf9] p-4 text-sm font-medium leading-7 text-stone-700">
                      <Compass className="mt-1 h-4 w-4 shrink-0 text-[#ff5a1f]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-[6px] border border-dashed border-stone-300 bg-[#fcfbf9] p-5 text-sm leading-7 text-stone-500">
                  Highlights have not been published for this package yet.
                </div>
              )}
            </section>

            <section className="information-content-tour rounded-[6px] border border-stone-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)] md:p-8" id="tour-overview">
              <div className="border-l-4 border-[#ff5a1f] pl-5">
                <span className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Overview</span>
                <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-stone-950 sm:text-3xl">{pkg.title} Overview</h3>
              </div>
              <p
                ref={overviewTextRef}
                id="package-overview-description"
                className={`mt-6 whitespace-pre-line text-[15px] leading-8 text-stone-600 ${isOverviewExpanded ? '' : 'line-clamp-6'}`}
              >
                {overviewText || 'Overview has not been published for this package yet.'}
              </p>
              {hasOverviewOverflow && (
                <button
                  type="button"
                  onClick={() => setIsOverviewExpanded((current) => !current)}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[#ff5a1f] transition hover:text-[#4DA528]"
                  aria-expanded={isOverviewExpanded}
                  aria-controls="package-overview-description"
                >
                  {isOverviewExpanded ? 'Read less' : 'Read full'}
                  {isOverviewExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              )}
            </section>

            <section className="rounded-[6px] border border-stone-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)] md:p-8">
              <div className="border-l-4 border-[#ff5a1f] pl-5">
                <span className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">At a glance</span>
                <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-stone-950">Quick Info</h3>
              </div>
              <div className="mt-6 grid gap-x-8 sm:grid-cols-2">
                {[
                  ['Departure/Return Location', pkg.pickup || pkg.destination],
                  ['Tour Duration', pkg.duration],
                  ['Travel Category', pkg.category],
                  ['Package Code', pkg.packageCode || pkg.id],
                ].map(([label, value]) => (
                  <div key={label} className="flex min-h-20 flex-col justify-center gap-1 border-t border-stone-100 py-4">
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-stone-500">{label}</span>
                    <p className="text-sm font-semibold text-stone-900">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="rounded-[6px] border border-stone-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]" id="tour-map">
              <div className="mb-4 px-2 pt-2">
                <span className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Map</span>
                <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-stone-950 sm:text-3xl">Route and destination map</h3>
              </div>
              <div className="mb-6 overflow-hidden rounded-[6px] border border-stone-200">
                <iframe
                  title={`${pkg.destination} map`}
                  src={mapEmbedUrl}
                  className="h-[320px] w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ['Route', pkg.destination],
                  ['Duration', pkg.duration],
                  ['Pickup', pkg.pickup || 'As per package plan'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[6px] border border-stone-200 bg-[#fcfbf9] p-4">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-400">{label}</p>
                    <p className="mt-1 text-sm font-bold text-stone-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Day Wise Itinerary */}
            <div className="space-y-6 rounded-[6px] border border-stone-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)] md:p-8" id="custom-itinerary-section">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="space-y-2">
                  <span className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Itinerary</span>
                  <h3 className="text-2xl font-extrabold tracking-tight text-stone-950 sm:text-3xl">{pkg.title} Itinerary</h3>
                  <p className="text-sm leading-6 text-stone-500">Day-wise route, stays and travel plan.</p>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    if (allItineraryExpanded) {
                      setAllItineraryExpanded(false);
                      setActiveDay(null);
                    } else {
                      setAllItineraryExpanded(true);
                      setActiveDay(null);
                    }
                  }}
                  className="flex cursor-pointer items-center gap-2 rounded-[6px] border border-stone-200 bg-[#fcfbf9] px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-stone-700 transition hover:border-[#ff5a1f] hover:text-[#ff5a1f]"
                >
                  {allItineraryExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  <span>{allItineraryExpanded ? 'Collapse All' : 'Expand All'}</span>
                </button>
              </div>

              <div className="relative space-y-5 before:absolute before:bottom-6 before:left-[22px] before:top-6 before:w-px before:bg-stone-200 sm:before:left-[28px]">
                {localItinerary && localItinerary.length > 0 ? (
                  localItinerary.map((dayItem) => {
                    const isOpen = allItineraryExpanded || activeDay === dayItem.day;
                    return (
                      <div 
                        key={dayItem.day}
                        className={`relative ml-12 rounded-[6px] border transition-all duration-300 sm:ml-16 ${
                          isOpen
                            ? 'border-[#4DA528]/60 shadow-sm ring-1 ring-[#4DA528]/10'
                            : 'border-stone-200 bg-white'
                        }`}
                      >
                        <span className={`absolute -left-[49px] top-4 z-10 flex h-11 w-11 items-center justify-center rounded-[6px] border-4 border-white text-[12px] font-extrabold shadow-md sm:-left-[61px] ${
                          isOpen ? 'bg-[#ff5a1f] text-white' : 'bg-stone-100 text-stone-600'
                        }`}>
                          {dayItem.day}
                        </span>
                        <div
                          className="flex w-full cursor-pointer items-center justify-between p-4 text-left transition hover:bg-[#fffaf1] sm:p-5"
                          onClick={() => {
                            toggleDay(dayItem.day);
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border font-mono text-[10px] font-extrabold shadow-sm transition-colors ${
                              isOpen ? 'border-transparent bg-[#ff5a1f] text-white' : 'border-stone-200 bg-[#fcfbf9] text-stone-600'
                            }`}>
                              D{dayItem.day}
                            </span>
                            
                            <span className="text-sm font-semibold leading-snug text-stone-900 sm:text-base">
                              {dayItem.title}
                            </span>
                          </div>

                          <div>
                            {isOpen ? <ChevronUp className="h-4 w-4 text-[#4DA528]" /> : <ChevronDown className="h-4 w-4 text-stone-400" />}
                          </div>
                        </div>
                        
                        {isOpen && (
                          <div className="animate-fade-in border-t border-stone-100 bg-[#fcfbf9] p-5 text-sm leading-8 text-stone-600">
                            {dayItem.location && (
                              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
                                <MapPin className="h-3.5 w-3.5 text-[#ff5a1f]" />
                                {dayItem.location}
                              </div>
                            )}
                            <p className="whitespace-pre-line">{dayItem.description}</p>
                            {(() => {
                              const dayImages = Array.from(new Set(((dayItem.images || []) as string[]))).filter(Boolean).slice(0, 3);
                              if (!dayImages.length) return null;
                              return (
                                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                                  {dayImages.map((imageUrl, imageIndex) => (
                                    <button
                                      key={`${dayItem.day}-${imageUrl}-${imageIndex}`}
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        openLightbox(dayImages, imageIndex);
                                      }}
                                      className="group relative aspect-[1.45/1] overflow-hidden rounded-[6px] bg-stone-200"
                                    >
                                      <TravelMedia
                                        src={imageUrl}
                                        alt={`${pkg.title} day ${dayItem.day} visual ${imageIndex + 1}`}
                                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                        loading="lazy"
                                        decoding="async"
                                        disableFallback
                                      />
                                    </button>
                                  ))}
                                </div>
                              );
                            })()}
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

            <div className="rounded-[6px] border border-stone-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)] md:p-8" id="package-options">
              <div className="mb-6 border-l-4 border-[#ff5a1f] pl-5">
                <span className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Package Options</span>
                <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-stone-950 sm:text-3xl">Available Package</h3>
              </div>
              <div className="space-y-4">
                {packageOptions.map((option, index) => (
                  <article key={`${option.title}-${index}`} className="rounded-[8px] border border-stone-200 bg-[#fcfbf9] p-5 sm:p-6">
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                      <div className="max-w-3xl">
                        <h4 className="text-xl font-extrabold leading-snug text-stone-950">{option.title}</h4>
                        {option.description && <p className="mt-3 text-sm leading-7 text-stone-600">{option.description}</p>}
                        <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-stone-500">
                          <Calendar className="h-4 w-4 text-[#ff5a1f]" />
                          {pkg.duration}
                        </p>
                      </div>
                      <div className="shrink-0 border-t border-stone-200 pt-4 text-left md:min-w-44 md:border-l md:border-t-0 md:pl-6 md:pt-0 md:text-right">
                        {option.originalPrice ? <p className="text-sm font-semibold text-stone-400 line-through">{formatPrice(option.originalPrice)}</p> : null}
                        <p className="mt-1 text-2xl font-extrabold text-[#ff5a1f]">{formatPrice(option.price || pkg.offerPrice || pkg.price)}</p>
                        <p className="mt-1 text-xs font-semibold text-stone-400">per person</p>
                        <button
                          type="button"
                          onClick={() => openBookingModal()}
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[6px] bg-[#ff5a1f] px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-[#df4512]"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Enquire now
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2" id="tour-inclusions">
              <div className="space-y-5 rounded-[6px] border border-emerald-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)] md:p-7">
                <h4 className="flex items-center gap-2 text-xl font-extrabold text-[#0f766e]">
                  <Check className="h-5 w-5 text-[#0f766e]" />
                  <span>Included</span>
                </h4>
                {includedItems.length > 0 ? (
                  <ul className="space-y-3">
                    {includedItems.map((item, idx) => (
                      <li key={`${item}-${idx}`} className="flex items-start gap-3 border-b border-stone-100 pb-3 text-sm leading-6 text-stone-700 last:border-0 last:pb-0">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0f766e]" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm leading-7 text-stone-500">Inclusions have not been published for this package yet.</p>
                )}
              </div>

              <div className="space-y-5 rounded-[6px] border border-rose-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)] md:p-7">
                <h4 className="flex items-center gap-2 text-xl font-extrabold text-rose-700">
                  <X className="h-5 w-5 text-rose-600" />
                  <span>Excluded</span>
                </h4>
                {excludedItems.length > 0 ? (
                  <ul className="space-y-3">
                    {excludedItems.map((item, idx) => (
                      <li key={`${item}-${idx}`} className="flex items-start gap-3 border-b border-stone-100 pb-3 text-sm leading-6 text-stone-700 last:border-0 last:pb-0">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-600" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm leading-7 text-stone-500">Exclusions have not been published for this package yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-[6px] border border-stone-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)] md:p-8" id="trip-essentials">
              <div className="mb-8 border-l-4 border-[#ff5a1f] pl-5">
                <span className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">More Details</span>
                <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-stone-950 sm:text-3xl">More details about {pkg.title}</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { label: 'Hotels', icon: BedDouble, items: hotelItems },
                  { label: 'Transfers', icon: Car, items: transportationItems },
                  { label: 'Meals', icon: Utensils, items: mealPlanItems },
                ].map((section) => {
                  const Icon = section.icon;
                  return (
                    <div key={section.label} className="rounded-[6px] border border-stone-200 bg-[#fcfbf9] p-5">
                      <Icon className="h-8 w-8 text-[#ff5a1f]" />
                      <h4 className="mt-3 text-base font-extrabold text-stone-950">{section.label}</h4>
                      <p className="mt-2 text-sm leading-6 text-stone-600">{section.items[0] || 'Details will be confirmed by our travel desk.'}</p>
                    </div>
                  );
                })}
              </div>

              {(knowBeforeItems.length > 0 || packingItems.length > 0) && (
                <div className="mt-8 space-y-6">
                  {knowBeforeItems.length > 0 && (
                    <div className="rounded-[6px] border border-stone-200 bg-white p-5">
                      <h4 className="text-xl font-extrabold text-stone-950">Know Before You Go</h4>
                      <ul className="mt-5 space-y-3">
                        {(isKnowBeforeExpanded ? knowBeforeItems : knowBeforeItems.slice(0, 5)).map((item, idx) => (
                          <li key={`${item}-${idx}`} className="flex items-start gap-3 text-sm leading-7 text-stone-600">
                            <AlertCircle className="mt-1 h-4 w-4 shrink-0 text-[#ff5a1f]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                      {knowBeforeItems.length > 5 && (
                        <button
                          type="button"
                          onClick={() => setIsKnowBeforeExpanded((current) => !current)}
                          aria-expanded={isKnowBeforeExpanded}
                          className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[#ff5a1f] transition hover:text-[#d9480f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5a1f]/30"
                        >
                          {isKnowBeforeExpanded ? 'Show less' : `View all ${knowBeforeItems.length} notes`}
                          {isKnowBeforeExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  )}

                  {packingItems.length > 0 && (
                    <div className="rounded-[6px] border border-stone-200 bg-[#fcfbf9] p-5">
                      <h4 className="text-xl font-extrabold text-stone-950">Things To Carry</h4>
                      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                        {packingItems.map((item, idx) => (
                          <li key={`${item}-${idx}`} className="flex items-center gap-3 text-sm font-semibold text-stone-600">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#ff5a1f]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {difficultyLevel && (
                <div className="mt-6 rounded-[6px] border border-stone-200 bg-white p-5">
                  <h4 className="text-xl font-extrabold text-stone-700 sm:text-2xl">Tour Difficulty for {pkg.title}</h4>
                  <div className="mt-7 max-w-2xl px-2 sm:px-4">
                    <div
                      className="relative h-[88px]"
                      role="img"
                      aria-label={`Tour difficulty ${difficultyLevel} out of 10`}
                    >
                      <div className="absolute left-5 right-5 top-10 h-[3px] rounded-full bg-stone-300" />
                      <div
                        className="absolute top-0 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-white text-[#ff5a1f] shadow-[0_4px_14px_rgba(255,90,31,0.16)]"
                        style={{ left: `calc(20px + ${((difficultyLevel - 1) / 9) * 100}% * (100% - 40px) / 100%)` }}
                      >
                        <Flame className="h-9 w-9 fill-[#ff7a2a] stroke-[#ff7a2a]" />
                      </div>
                      <div className="absolute inset-x-0 top-14 grid grid-cols-10">
                        {Array.from({ length: 10 }).map((_, index) => {
                          const step = index + 1;
                          return (
                            <span key={step} className={`text-center text-sm font-bold sm:text-base ${step === difficultyLevel ? 'text-[#ff5a1f]' : 'text-stone-500'}`}>
                              {step}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-[6px] border border-stone-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)] md:p-8" id="tour-policies">
              <div className="mb-6 border-l-4 border-[#ff5a1f] pl-5">
                <span className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Policies</span>
                <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-stone-950 sm:text-3xl">{pkg.title} Policies</h3>
              </div>
              {policyGroups.length > 0 ? (
                <div className="space-y-5">
                  {policyGroups.map((group) => (
                    <div key={group.title} className="rounded-[6px] border border-stone-200 bg-[#fcfbf9] p-5">
                      <h4 className="text-lg font-extrabold text-stone-950">{group.title}</h4>
                      <ul className="mt-4 space-y-3">
                        {group.items.map((item, idx) => (
                          <li key={`${group.title}-${item}-${idx}`} className="flex items-start gap-3 text-sm leading-7 text-stone-600">
                            <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-[#ff5a1f]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-[6px] border border-dashed border-stone-300 bg-[#fcfbf9] p-5 text-sm leading-7 text-stone-500">Policies have not been published for this package yet.</p>
              )}
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
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="side-bar-right space-y-5 rounded-[8px] border border-stone-200 bg-white p-6 shadow-[0_22px_60px_rgba(15,23,42,0.14)] lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:[scrollbar-width:thin]" id="detail-enquiry-card">
              <div className="sidebar-widget space-y-4 border-b border-stone-100 pb-5">
                <div className="flex items-center justify-between">
                  <h6 className="block-heading text-xl font-extrabold text-stone-950">Get Free Quote</h6>
                  <span className="rounded bg-[#fff4ec] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#ff5a1f]">Best Price</span>
                </div>
                <div className="rounded-[6px] border border-stone-200 bg-[#fcfbf9] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500">Starting from</div>
                    {pkg.offerPrice && pkg.offerPrice < (pkg.price || 0) ? (
                      <span className="rounded bg-amber-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-amber-700">Save {formatPrice((pkg.price || 0) - pkg.offerPrice)}</span>
                    ) : null}
                  </div>
                  <div className="total text-main mt-1 text-3xl font-extrabold text-[#ff5a1f]">{formatPrice(pkg.offerPrice || pkg.price)}</div>
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
                    className="mt-2 w-full rounded-[6px] border border-stone-200 bg-[#fcfbf9] px-3 py-3 text-sm font-semibold text-stone-800 focus:border-[#ff5a1f] focus:outline-none"
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
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[6px] bg-[#ff5a1f] px-5 py-4 text-[12px] font-extrabold uppercase tracking-[0.14em] text-white shadow-[0_16px_35px_rgba(255,90,31,0.22)] transition hover:-translate-y-0.5 hover:bg-[#e64a14]"
                >
                  <Compass className="h-4 w-4" />
                  <span>Send Booking Request</span>
                </button>
                <a
                  href={packageWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[6px] border border-emerald-200 bg-emerald-50 px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] text-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/25 focus-visible:ring-offset-2"
                  aria-label={`Ask on WhatsApp about ${pkg.title}`}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>WhatsApp Details</span>
                </a>
                <button
                  type="button"
                  onClick={() => void handleSavePackage()}
                  disabled={savingPackage}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[6px] border border-[#4DA528]/20 bg-[#f4fbef] px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#4DA528] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#edf8e5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DA528]/25 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Heart className={`h-4 w-4 transition ${Array.isArray(wishlistPackageIds) && wishlistPackageIds.includes(String(pkg.id ?? '')) ? 'fill-rose-600 text-rose-600' : ''}`} />
                  <span>{savingPackage ? 'Saving...' : Array.isArray(wishlistPackageIds) && wishlistPackageIds.includes(String(pkg.id ?? '')) ? 'Remove from Wishlist' : 'Add to Wishlist'}</span>
                </button>
                {saveNotice && (
                  <div className={`rounded-[6px] border px-3 py-3 text-sm ${saveNotice.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                    {saveNotice.message}
                  </div>
                )}
                {isAdminLoggedIn && onDeletePackage && (
                  <button
                    onClick={() => onDeletePackage(pkg.id)}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[6px] bg-red-600 px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-red-700"
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
                    Thank you for reaching out to {companyName}. Our travel expert will call you shortly on the provided contact number.
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
                      className="w-full rounded-[6px] border border-stone-200 bg-[#fcfbf9] px-4 py-3 text-sm font-medium text-stone-800 focus:border-[#ff5a1f] focus:bg-white focus:outline-none"
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
                        className="w-full rounded-[6px] border border-stone-200 bg-[#fcfbf9] px-4 py-3 text-sm font-medium text-stone-800 focus:border-[#ff5a1f] focus:bg-white focus:outline-none"
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
                        className="w-full rounded-[6px] border border-stone-200 bg-[#fcfbf9] px-4 py-3 text-sm font-medium text-stone-800 focus:border-[#ff5a1f] focus:bg-white focus:outline-none"
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
                        className="w-full cursor-pointer rounded-[6px] border border-stone-200 bg-[#fcfbf9] px-4 py-3 text-sm font-medium text-stone-800 focus:border-[#ff5a1f] focus:bg-white focus:outline-none"
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
                        className="w-full rounded-[6px] border border-stone-200 bg-[#fcfbf9] px-4 py-3 text-sm font-medium text-stone-800 focus:border-[#ff5a1f] focus:bg-white focus:outline-none"
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
                      className="w-full cursor-pointer rounded-[6px] border border-stone-200 bg-[#fcfbf9] px-4 py-3 text-sm font-medium text-stone-800 focus:border-[#ff5a1f] focus:bg-white focus:outline-none"
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
                      className="w-full rounded-[6px] border border-stone-200 bg-[#fcfbf9] px-4 py-3 text-sm font-medium text-stone-800 focus:border-[#ff5a1f] focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[6px] bg-[#ff5a1f] py-3.5 text-xs font-extrabold uppercase tracking-[0.14em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e64a14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5a1f]/40 focus-visible:ring-offset-2 disabled:opacity-50"
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
          </aside>

        </div>

        <NearbyPlacesSection
          destination={pkg.destination}
          packageTitle={pkg.title}
        />

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

        {recommendedHotels.length > 0 && (
          <section className="rounded-[24px] border border-stone-200/80 bg-white p-6 shadow-[0_24px_70px_rgba(18,38,32,0.06)] md:p-8" id="recommended-hotels">
            <div className="mb-8">
              <span className="text-[13px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Where you'll stay</span>
              <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-stone-950">Recommended Hotels</h3>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recommendedHotels.map((hotel) => (
                <article key={hotel.id} className="overflow-hidden rounded-[16px] border border-stone-200 bg-white shadow-[0_12px_35px_rgba(18,38,32,0.06)]">
                  <div className="relative h-44 bg-stone-100">
                    {hotel.heroImage ? (
                      <TravelMedia src={hotel.heroImage} alt={hotel.name} className="h-full w-full object-cover" loading="lazy" decoding="async" disableFallback />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-stone-300"><BedDouble className="h-8 w-8" /></div>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-700 shadow">{hotel.category}</span>
                  </div>
                  <div className="p-4">
                    <h4 className="text-sm font-bold leading-snug text-stone-950">{hotel.name}</h4>
                    <div className="mt-1 flex items-center gap-1 text-amber-500">
                      {Array.from({ length: hotel.starRating }).map((_, idx) => <Star key={idx} className="h-3 w-3 fill-current" />)}
                    </div>
                    {(hotel.city || hotel.destination) && (
                      <p className="mt-2 flex items-center gap-1 text-[11px] text-stone-500"><MapPin className="h-3 w-3 text-[#4DA528]" />{[hotel.city, hotel.destination].filter(Boolean).join(', ')}</p>
                    )}
                    {hotel.shortDescription && <p className="mt-2 line-clamp-2 text-xs leading-5 text-stone-500">{hotel.shortDescription}</p>}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {upcomingDepartures.length > 0 && (
          <section className="rounded-[24px] border border-stone-200/80 bg-white p-6 shadow-[0_24px_70px_rgba(18,38,32,0.06)] md:p-8" id="upcoming-departures">
            <div className="mb-8">
              <span className="text-[13px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Plan your dates</span>
              <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-stone-950">Upcoming Departures</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="border-b border-stone-200 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    <th className="pb-3 pr-4">Departure Date</th>
                    <th className="pb-3 pr-4">Duration</th>
                    <th className="pb-3 pr-4">Available Seats</th>
                    <th className="pb-3 pr-4">Price</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-sm">
                  {upcomingDepartures.map((departure) => {
                    const availableSeats = Math.max(0, (departure.totalSeats || 0) - (departure.bookedSeats || 0));
                    const isSoldOut = availableSeats <= 0;
                    const displayPrice = departure.priceOverride ?? pkg.offerPrice ?? pkg.price;
                    return (
                      <tr key={departure.id}>
                        <td className="py-4 pr-4">
                          <span className="font-bold text-stone-900">{new Date(departure.departureDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          {departure.guaranteedDeparture && <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700">Guaranteed</span>}
                        </td>
                        <td className="py-4 pr-4 text-stone-500">{departure.duration || pkg.duration}</td>
                        <td className="py-4 pr-4">
                          {isSoldOut ? (
                            <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-700">Sold Out</span>
                          ) : (
                            <span className="font-semibold text-stone-800">{availableSeats} seats</span>
                          )}
                        </td>
                        <td className="py-4 pr-4 font-bold text-[#4DA528]">{formatPrice(displayPrice)}</td>
                        <td className="py-4 text-right">
                          <button
                            type="button"
                            disabled={isSoldOut}
                            onClick={() => openBookingModal(departure)}
                            className="rounded-[6px] bg-[#4DA528] px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider text-white transition hover:bg-[#3d8a20] disabled:cursor-not-allowed disabled:bg-stone-300"
                          >
                            {isSoldOut ? 'Sold Out' : 'Book Now'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="rounded-[24px] border border-stone-200/80 bg-gradient-to-br from-white via-[#fffdf8] to-[#fcf6e8] p-6 shadow-[0_24px_70px_rgba(18,38,32,0.08)] md:p-8" id="related-packages">
          <div className="mb-8">
            <span className="text-[13px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Explore more</span>
            <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-stone-950">Related Packages</h3>
          </div>

          {displayedRelatedPackages.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {displayedRelatedPackages.map((related: TravelPackage, index: number) => {
                const relatedImage = String(related.imageUrl || related.packageBannerUrl || '').trim();

                return (
                  <article key={related.id || `${related.title || 'related'}-${index}`} className="tour-listing group overflow-hidden rounded-[14px] border border-stone-200 bg-white shadow-[0_12px_35px_rgba(18,38,32,0.08)] transition duration-300 hover:-translate-y-2 hover:shadow-[0_24px_55px_rgba(18,38,32,0.16)]">
                    <div className="tour-listing-image relative block aspect-[1.22/1] w-full overflow-hidden bg-stone-100 text-left">
                      {relatedImage ? (
                        <TravelMedia src={relatedImage} alt={related.title || 'Related package'} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" decoding="async" disableFallback />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#f8f7f4] px-5 text-center text-xs font-semibold text-stone-400">
                          Package image not uploaded
                        </div>
                      )}
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
                        onClick={() => onNavigate?.('package-detail', getPackageRouteSegment(related))}
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[5px] bg-stone-950 px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white transition hover:bg-[#4DA528]"
                      >
                        View Similar Tour
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[14px] border border-dashed border-stone-300 bg-[#fffaf1] p-8 text-center">
              <p className="text-sm leading-7 text-stone-500">No related package data is attached to this package yet.</p>
            </div>
          )}
        </section>

      </div>

      {isLightboxOpen && lightboxImages.length > 0 && (
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
            <TravelMedia
              src={lightboxImages[selectedGalleryImage] || lightboxImages[0]}
              alt={`${pkg.title} lightbox view`}
              className="max-h-[80vh] w-full object-contain"
              loading="lazy"
              decoding="async"
              disableFallback
            />
            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-stone-950/90 to-transparent p-6 text-white">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">{pkg.destination}</p>
                  <h3 className="text-xl font-semibold">{pkg.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {lightboxImages.map((imageUrl, idx) => (
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
            <p className="text-base font-extrabold text-[#4DA528]">{formatPrice(pkg.offerPrice || pkg.price)}</p>
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

      {!isBookingModalOpen && (
        <button
          type="button"
          onClick={() => {
            setBookingSuccess(false);
            setBookingError('');
            setIsBookingModalOpen(true);
          }}
          className="fixed right-0 top-1/2 z-[8900] hidden -translate-y-1/2 flex-col items-start rounded-l-[10px] border border-r-0 border-white/20 bg-[#ff5a1f] px-5 py-4 text-left text-white shadow-[0_20px_55px_rgba(255,90,31,0.34)] transition hover:bg-[#e64a14] min-[1700px]:flex"
        >
          <span className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em]">
            <Send className="h-4 w-4" />
            Get Free Quote
          </span>
          <span className="mt-1 text-[10px] font-semibold normal-case tracking-normal text-white/80">From {formatPrice(pkg.offerPrice || pkg.price)}</span>
        </button>
      )}

      {/* BOOKING REQUEST MODAL */}
      {isBookingModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-stone-950/70 p-3 backdrop-blur-sm animate-fade-in sm:p-4"
          id="booking-request-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-request-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeBookingModal();
          }}
        >
          <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[10px] border border-white/10 bg-white shadow-2xl lg:grid lg:grid-cols-[0.9fr_1.1fr]">
            <button
              type="button"
              onClick={closeBookingModal}
              className="absolute right-3 top-3 z-30 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/70 bg-stone-950 text-white shadow-[0_8px_24px_rgba(0,0,0,0.28)] transition hover:scale-105 hover:bg-[#ff5a1f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5a1f] focus-visible:ring-offset-2 sm:right-4 sm:top-4"
              aria-label="Close booking request"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="relative min-h-[220px] overflow-hidden bg-stone-950 text-white lg:min-h-full">
              {primaryPackageImage && (
                <TravelMedia
                  src={primaryPackageImage}
                  alt={pkg.title}
                  className="absolute inset-0 h-full w-full object-cover opacity-70"
                  loading="lazy"
                  decoding="async"
                  disableFallback
                />
              )}
              <div className="absolute inset-0 bg-linear-to-t from-stone-950 via-stone-950/55 to-stone-950/10" />
              <div className="relative z-10 flex h-full min-h-[220px] flex-col justify-end p-6 lg:min-h-[680px] lg:p-8">
                <span className="inline-flex w-fit rounded bg-white/12 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/78 backdrop-blur">Booking Request</span>
                <h3 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight">{pkg.title}</h3>
                <div className="mt-5 grid gap-3 text-sm text-white/82">
                  <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-[#ff5a1f]" />{pkg.destination}</span>
                  <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4 text-[#ff5a1f]" />{pkg.duration}</span>
                  <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-[#ff5a1f]" />{selectedGuests} guest{selectedGuests > 1 ? 's' : ''}</span>
                </div>
                <div className="mt-6 rounded-[8px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-white/60">Starting from</p>
                  <p className="mt-1 text-3xl font-extrabold text-white">{formatPrice(pkg.offerPrice || pkg.price)}</p>
                </div>
              </div>
            </div>

            <div className="max-h-[92vh] overflow-y-auto">
              {bookingSuccess ? (
              <div className="flex min-h-[620px] flex-col items-center justify-center space-y-5 p-8 text-center animate-fade-in">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#4DA528]/10 text-[#4DA528] shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="text-xl font-extrabold text-stone-950">Booking Request Submitted</h4>
                <p className="max-w-md text-sm leading-7 text-stone-600">Thank you, <strong className="font-semibold text-stone-900">{bookingForm.name}</strong>. Your request has been received and is being reviewed by our travel desk.</p>
                <div className="w-full rounded-[8px] border border-stone-200 bg-[#fcfbf9] p-4 text-left shadow-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-3">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Booking ID</p>
                      <p className="mt-1 text-lg font-bold text-stone-950">{submittedBooking?.bookingId || 'PRV-2026-0001'}</p>
                    </div>
                    <span className="rounded bg-amber-100 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-amber-700">Pending</span>
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
                    className="flex-1 rounded-[6px] bg-[#4DA528] px-4 py-3 text-xs font-extrabold uppercase tracking-[0.16em] text-white transition hover:bg-[#3f8f21]"
                  >
                    View My Bookings
                  </button>
                  <button
                    onClick={() => {
                      setBookingSuccess(false);
                      setIsBookingModalOpen(false);
                      onNavigate?.('packages');
                    }}
                    className="flex-1 rounded-[6px] border border-stone-200 bg-white px-4 py-3 text-xs font-extrabold uppercase tracking-[0.16em] text-stone-700 transition hover:border-[#4DA528] hover:text-[#4DA528]"
                  >
                    Continue Exploring
                  </button>
                </div>
                <a
                  href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Hello ${companyName},\nI have submitted my booking.\nBooking ID: ${submittedBooking?.bookingId || 'PRV-2026-0001'}\nPackage: ${submittedBooking?.packageTitle || bookingForm.packageTitle}\nPlease confirm my booking.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-[6px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-700"
                >
                  <Phone className="h-4 w-4" />
                  Contact on WhatsApp
                </a>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-5 p-6 sm:p-8">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#ff5a1f]">No payment required</span>
                  <h3 id="booking-request-title" className="mt-2 text-2xl font-extrabold tracking-tight text-stone-950">Request a custom booking</h3>
                  <p className="mt-2 text-sm leading-7 text-stone-500">Share your basic travel details. Our team will verify availability, hotel options and route before confirming.</p>
                </div>

                {bookingError && (
                  <div role="alert" className="flex items-start gap-2 rounded-[6px] border border-rose-200 bg-rose-50 px-3 py-3 text-sm font-semibold text-rose-700 shadow-sm">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                <div className="rounded-[8px] border border-stone-200 bg-[#fcfbf9] p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-400">Package Summary</p>
                  <div className="mt-3 space-y-3 text-sm text-stone-700">
                    <div className="flex items-start justify-between gap-3"><span className="font-semibold">Package</span><span className="text-right font-semibold text-stone-950">{bookingForm.packageTitle}</span></div>
                    <div className="flex items-start justify-between gap-3"><span className="font-semibold">Price</span><span className="text-right font-semibold text-[#ff5a1f]">{formatPrice(pkg.offerPrice || pkg.price)}</span></div>
                    <div className="flex items-start justify-between gap-3"><span className="font-semibold">Destination</span><span className="text-right font-semibold text-stone-950">{pkg.destination}</span></div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Full Name *</span>
                    <input type="text" name="name" required value={bookingForm.name} onChange={handleBookingInputChange} className="w-full rounded-[6px] border border-stone-200 bg-white px-3 py-3 text-sm text-stone-800 focus:border-[#ff5a1f] focus:outline-none" />
                  </label>
                  <label className="space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Email Address *</span>
                    <input type="email" name="email" required value={bookingForm.email} onChange={handleBookingInputChange} className="w-full rounded-[6px] border border-stone-200 bg-white px-3 py-3 text-sm text-stone-800 focus:border-[#ff5a1f] focus:outline-none" />
                  </label>
                  <label className="space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Mobile Number *</span>
                    <input type="tel" name="phone" required value={bookingForm.phone} onChange={handleBookingInputChange} className="w-full rounded-[6px] border border-stone-200 bg-white px-3 py-3 text-sm text-stone-800 focus:border-[#ff5a1f] focus:outline-none" />
                  </label>
                  <label className="space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">WhatsApp Number *</span>
                    <input type="tel" name="whatsapp" required value={bookingForm.whatsapp} onChange={handleBookingInputChange} className="w-full rounded-[6px] border border-stone-200 bg-white px-3 py-3 text-sm text-stone-800 focus:border-[#ff5a1f] focus:outline-none" />
                  </label>
                  <label className="space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Travel Date *</span>
                    <input type="date" name="travelDate" required value={bookingForm.travelDate} onChange={handleBookingInputChange} className="w-full cursor-pointer rounded-[6px] border border-stone-200 bg-white px-3 py-3 text-sm text-stone-800 focus:border-[#ff5a1f] focus:outline-none" />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="space-y-1">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Adults</span>
                      <input type="number" name="adults" min="1" value={bookingForm.adults} onChange={handleBookingInputChange} className="w-full rounded-[6px] border border-stone-200 bg-white px-3 py-3 text-sm text-stone-800 focus:border-[#ff5a1f] focus:outline-none" />
                    </label>
                    <label className="space-y-1">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Children</span>
                      <input type="number" name="children" min="0" value={bookingForm.children} onChange={handleBookingInputChange} className="w-full rounded-[6px] border border-stone-200 bg-white px-3 py-3 text-sm text-stone-800 focus:border-[#ff5a1f] focus:outline-none" />
                    </label>
                  </div>
                  <label className="space-y-1 sm:col-span-2">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Pickup City</span>
                    <input type="text" name="pickupCity" value={bookingForm.pickupCity} onChange={handleBookingInputChange} placeholder="Delhi, Dehradun, Chandigarh..." className="w-full rounded-[6px] border border-stone-200 bg-white px-3 py-3 text-sm text-stone-800 focus:border-[#ff5a1f] focus:outline-none" />
                  </label>
                  <label className="space-y-1 sm:col-span-2">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Message</span>
                    <textarea name="specialRequests" rows={4} value={bookingForm.specialRequests} onChange={handleBookingInputChange} placeholder="Hotel category, food preference, pickup needs..." className="w-full rounded-[6px] border border-stone-200 bg-white px-3 py-3 text-sm text-stone-800 focus:border-[#ff5a1f] focus:outline-none" />
                  </label>
                </div>

                <div className="rounded-[8px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-7 text-emerald-800">
                  We will confirm route availability, hotels and final pricing before any payment is collected.
                </div>

                <button type="submit" disabled={bookingSubmitting} className="flex w-full items-center justify-center gap-2 rounded-[6px] bg-[#ff5a1f] px-6 py-4 text-xs font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_14px_30px_rgba(255,90,31,0.22)] transition hover:bg-[#e64a14] disabled:opacity-60">
                  {bookingSubmitting ? (<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />) : (<><Check className="h-4 w-4" /><span>Submit Booking Request</span></>)}
                </button>
              </form>
            )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
