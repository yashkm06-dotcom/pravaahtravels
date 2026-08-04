export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  location?: string;
  images?: string[];
}

export const DEFAULT_DESTINATION_CATEGORIES = [
  'Pilgrimage',
  'Treks',
  'Adventure',
  'Himachal',
  'Ladakh',
  'Uttarakhand',
] as const;

export type DestinationCategory = (typeof DEFAULT_DESTINATION_CATEGORIES)[number] | (string & {});

export const PACKAGE_LOCATIONS = [
  'Uttarakhand',
  'Himachal Pradesh',
  'Ladakh',
  'Kashmir',
  'Nepal',
  'Bhutan',
  'International Trips',
] as const;

export type PackageLocation = (typeof PACKAGE_LOCATIONS)[number];

export interface TravelPackage {
  id: string;
  title: string;
  slug?: string;
  destination: string;
  destinations?: string[];
  location: PackageLocation | string;
  bookingType?: string;
  maxGuests?: number;
  category: DestinationCategory;
  // Master Data driven classification fields (all additive/optional — old packages work unchanged).
  country?: string;
  city?: string;
  activityTypes?: string[];
  tags?: string[];
  difficultyLabel?: string;
  mealPlans?: string[];
  transportType?: string;
  // Which Master Data "Homepage Category" tab (Domestic, International, Weekend Trips...)
  // this package appears under. Additive/optional — old packages fall back to text matching.
  homepageCategory?: string;
  // Admin-controlled sort priority for Homepage / Category / Destination listings.
  // Additive/optional — packages without it keep their existing createdAt-based order.
  displayOrder?: number;
  // Phase 2 additions — all additive/optional, old packages work unchanged.
  hotelIds?: string[];
  departures?: PackageDeparture[];
  duration: string; // e.g., "5 Days / 4 Nights"
  price: number;
  offerPrice?: number;
  pickup?: string;
  packageCode?: string;
  activityId?: string;
  seoTitle?: string;
  seoDescription?: string;
  shortDescription: string;
  fullDescription: string; // long description
  highlights?: string[];
  itinerary: ItineraryDay[];
  inclusions: string[];
  exclusions: string[];
  packageOptions?: {
    title: string;
    description?: string;
    price?: number | null;
    originalPrice?: number | null;
    inclusions?: string[];
  }[];
  knowBeforeYouGo?: string[];
  thingsToCarry?: string[];
  difficultyLevel?: number | null;
  departureDates?: string[];
  faqs?: { question: string; answer: string }[];
  policies?: string[];
  imageUrl: string; // primary image/banner thumbnail
  packageBannerUrl?: string; // high-res banner image
  galleryImages?: string[]; // multiple images
  featured: boolean;
  active: boolean; // mapped to Publish/Draft
  status?: 'Publish' | 'Draft';
  cmsStatus?: 'draft' | 'published' | 'archived' | 'deleted';
  version?: number;
  sourceUrl?: string | null;
  sourceDomain?: string | null;
  parserVersion?: string;
  importQuality?: {
    score: number;
    status: 'excellent' | 'good' | 'needs_review' | 'poor';
    warnings: string[];
    missing: string[];
    passed: string[];
  } | null;
  hotels?: { city: string | null; hotel: string | null; nights: number | null }[];
  pricing?: {
    currency?: string | null;
    price?: number | null;
    originalPrice?: number | null;
    discount?: number | null;
    priceType?: string | null;
    occupancy?: string | null;
  } | null;
  gallery?: string[];
  heroImage?: string | null;
  overview?: string | null;
  archivedAt?: string | null;
  deletedAt?: string | null;
  publishedAt?: string | null;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
}

// ----------------------------------------------------
// PHASE 2 — HOTEL CMS
// ----------------------------------------------------
export type HotelCategory = '3 Star' | '4 Star' | '5 Star';
export type HotelStatus = 'Active' | 'Inactive';

export interface Hotel {
  id: string;
  name: string;
  slug: string;
  destination: string;
  country?: string;
  city?: string;
  category: HotelCategory;
  starRating: number;
  shortDescription?: string;
  fullDescription?: string;
  address?: string;
  googleMapsLink?: string;
  contactNumber?: string;
  email?: string;
  website?: string;
  amenities: string[];
  mealPlans: string[];
  roomTypes: string[];
  checkInTime?: string;
  checkOutTime?: string;
  heroImage?: string;
  bannerImage?: string;
  galleryImages?: string[];
  featured: boolean;
  displayOrder?: number;
  status: HotelStatus;
  createdAt: string;
  updatedAt?: string;
}

// ----------------------------------------------------
// PHASE 2 — DEPARTURE MANAGEMENT (stored as pkg.departures[], additive on TravelPackage)
// ----------------------------------------------------
export type DepartureStatus = 'Scheduled' | 'Guaranteed' | 'Sold Out' | 'Cancelled';

export interface PackageDeparture {
  id: string;
  departureDate: string;
  returnDate?: string;
  duration?: string;
  totalSeats: number;
  bookedSeats: number;
  bookingCutoffDate?: string;
  guaranteedDeparture: boolean;
  priceOverride?: number | null;
  hotelOverrideIds?: string[];
  status: DepartureStatus;
  createdAt: string;
  updatedAt?: string;
}

export type EnquiryStatus =
  | 'New'
  | 'Contacted'
  | 'Follow-up'
  | 'Quote Sent'
  | 'Booking Confirmed'
  | 'Cancelled'
  | 'Lost'
  | 'Completed'
  | 'Converted'
  | 'Closed';

export type EnquiryPriority = 'Low' | 'Medium' | 'High';
export type EnquiryPaymentStatus = 'Pending' | 'Partial' | 'Paid';
// Which form on the public site created this lead — additive, older enquiries have none.
export type EnquirySource = 'Contact Form' | 'Package Enquiry' | 'AI Planner' | 'AI Curator' | 'Premium Enquiry';

export interface EnquiryNote {
  id: string;
  text: string;
  createdAt: string;
  author?: string;
}

export interface EnquiryTimelineItem {
  id: string;
  label: string;
  note?: string;
  createdAt: string;
  author?: string;
}

export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  destination: string;
  travelDate: string;
  travelers: number;
  budget: string;
  message: string;
  packageId?: string;
  packageName?: string; // Cache for easy dashboard view
  status: EnquiryStatus;
  adults?: number;
  children?: number;
  travelType?: string;
  preferredContactMethod?: string;
  preferredContact?: string;
  priority?: EnquiryPriority;
  followUpDate?: string;
  followUpTime?: string;
  reminderDate?: string;
  source?: EnquirySource;
  assignedTo?: string;
  packagePrice?: number;
  advanceReceived?: number;
  paymentStatus?: EnquiryPaymentStatus;
  adminNotes?: EnquiryNote[];
  statusTimeline?: EnquiryTimelineItem[];
  convertedBookingId?: string;
  convertedBookingNumber?: string;
  bookingId?: string;
  conversion?: {
    packageId?: string;
    packageTitle?: string;
    departureDate?: string;
    travellers?: number;
    totalCost?: number;
    advancePaid?: number;
    remainingBalance?: number;
    assignedTripManager?: string;
    internalNotes?: string;
    convertedAt?: string;
    convertedBy?: string;
  };
  updatedAt?: string;
  createdAt: string;
}

export interface GalleryImage {
  id: string;
  title: string;
  category: string;
  album?: string; // New: Album grouping support
  imageUrl: string;
  order?: number;
  createdAt: string;
}

export interface CustomerProfile {
  id: string;
  displayName?: string;
  name?: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  preferredDestinations?: string;
  photoURL?: string;
  provider?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  category: DestinationCategory;
  location?: string;
  enabled: boolean;
  order: number;
  createdAt: string;
}

export interface ActivityChildItem {
  id: string;
  activityId: string;
  title: string;
  subtitle?: string;
  description: string;
  thumbnailUrl?: string;
  startingPrice: number;
  linkedPackageId?: string;
  enabled: boolean;
  order: number;
  createdAt: string;
}

export interface ActivityRecommendation {
  id: string;
  activityId: string;
  title: string;
  subtitle?: string;
  description: string;
  thumbnailUrl?: string;
  linkedPackageId?: string;
  enabled: boolean;
  order: number;
  createdAt: string;
  price?: number;
  duration?: string;
  location?: string;
  badge?: string;
  rating?: number;
}

export interface FeaturedCategoryItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  imageUrl: string;
  category?: DestinationCategory;
  location?: string;
  packageIds?: string[];
  enabled: boolean;
  order: number;
  createdAt: string;
}

export interface WebsiteCMSSettings {
  heroBackgroundImageUrl?: string;
  logoUrl?: string;
  companyName?: string;
  companyTagline?: string;
  heroTitle: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  heroCtaText: string;
  heroCtaLink: string;
  officeName?: string;
  officeAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  primaryPhone?: string;
  secondaryPhone?: string;
  whatsappNumber?: string;
  primaryEmail?: string;
  secondaryEmail?: string;
  googleMapsEmbedUrl?: string;
  officeWorkingHours?: string;
  weekendHours?: string;
  contactHeading?: string;
  contactDescription?: string;
  footerContactInfo: string;
  footerText?: string;
  footerEmail: string;
  footerPhone: string;
  footerAddress: string;
  socialFacebook: string;
  socialX: string;
  socialLinkedIn: string;
  socialInstagram: string;
  copyrightText?: string;
  gstNumber?: string;
  panNumber?: string;
  supportEmail?: string;
  bookingEmail?: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  ogImageUrl?: string;
  twitterImageUrl?: string;
  faviconUrl?: string;
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  facebookPixelId?: string;
  // Mirrors the admin-only Master Data "Featured" + Display Order for Country/Destination
  // items onto this already-public document, since the homepage cannot read settings/general.
  featuredCountryOrder?: string[];
  featuredDestinationOrder?: string[];
  // Mirrors the admin-only Master Data "Homepage Category" active list (Display Order
  // respected) onto this public document, so the homepage tabs can render without ever
  // reading the isAdmin()-only settings/general document.
  homepageCategoryOrder?: string[];
  updatedAt?: string;
}

export const DEFAULT_WEBSITE_CMS: WebsiteCMSSettings = {
  companyName: 'Pravaah Travels',
  companyTagline: 'Premium Himalayan holiday experiences',
  heroTitle: 'Tour Travel & adventure',
  heroTitleAccent: 'Camping',
  heroSubtitle: 'Explore Uttarakhand with guides who respect the mountains.',
  heroCtaText: 'Let,s get started',
  heroCtaLink: 'packages',
  officeName: 'Pravaah Headquarters',
  officeAddress: '402, Signature Towers, Sector 30, Gurugram, Haryana - 122001, India',
  city: 'Gurugram',
  state: 'Haryana',
  country: 'India',
  postalCode: '122001',
  primaryPhone: '+91 91231 36692',
  secondaryPhone: '+91 124 4098765',
  whatsappNumber: '+91 91231 36692',
  primaryEmail: 'pravaahtravels@gmail.com',
  secondaryEmail: 'bookings@pravaahtravels.com',
  googleMapsEmbedUrl: 'https://www.google.com/maps?q=402,%20Signature%20Towers,%20Sector%2030,%20Gurugram,%20Haryana%20122001,%20India&output=embed',
  officeWorkingHours: '09:00 AM - 07:00 PM',
  weekendHours: '10:00 AM - 04:00 PM',
  contactHeading: 'Initiate Your Custom Holiday Flow',
  contactDescription: 'Fill out our structured holiday planner form, and get assigned to a dedicated travel curator within hours.',
  footerContactInfo: 'Premium Himalayan journeys, slow travel, sacred valleys, adventure routes, and tailor-made comfort handled by local curators.',
  footerText: 'Premium Himalayan journeys, slow travel, sacred valleys, adventure routes, and tailor-made comfort handled by local curators.',
  footerEmail: 'pravaahtravels@gmail.com',
  footerPhone: '+91 91231 36692',
  footerAddress: '402, Signature Towers, Sector 30, Gurugram, HR - 122001, India',
  socialFacebook: '#',
  socialX: '#',
  socialLinkedIn: '#',
  socialInstagram: '#',
  copyrightText: 'Copyright © 2026 by Pravaah Travels. All Rights Reserved',
  gstNumber: '06AAHCPXXXXXX',
  panNumber: 'AAHCPXXXXX',
  supportEmail: 'support@pravaahtravels.com',
  bookingEmail: 'bookings@pravaahtravels.com',
  seoTitle: 'Pravaah Travels',
  seoDescription: 'Premium Himalayan journeys, sacred valleys, adventure routes, and tailor-made comfort handled by local curators.',
  seoKeywords: 'Pravaah Travels, Himalayan tours, Uttarakhand travel, Himachal packages, Kedarnath yatra, luxury travel India',
  ogImageUrl: 'https://images.unsplash.com/photo-1516690561799-46d8f74f90f6?auto=format&fit=crop&q=80&w=1700',
  twitterImageUrl: 'https://images.unsplash.com/photo-1516690561799-46d8f74f90f6?auto=format&fit=crop&q=80&w=1700',
  faviconUrl: '/favicon.svg',
  googleAnalyticsId: '',
  googleTagManagerId: '',
  facebookPixelId: '',
};

export type BookingStatus = 'Pending' | 'Contacted' | 'Confirmed' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Unpaid' | 'Paid' | 'Refunded';
export type BookingDocumentType = 'Passport' | 'Aadhaar' | 'Visa' | 'Medical Certificate' | 'Travel Insurance' | 'Emergency Contact';
export type BookingDocumentStatus = 'Pending' | 'Verified' | 'Rejected';
export type TripCustomerStatus = 'Upcoming' | 'Ready To Travel' | 'In Progress' | 'Completed' | 'Cancelled';
export type TripOperationDocumentType = 'Final Itinerary' | 'Hotel Voucher' | 'Transport Voucher' | 'Meeting Instructions';
export type TripChecklistKey =
  | 'bookingConfirmed'
  | 'advancePaymentVerified'
  | 'remainingPaymentReceived'
  | 'documentsVerified'
  | 'hotelAssigned'
  | 'vehicleAssigned'
  | 'driverAssigned'
  | 'coordinatorAssigned'
  | 'itineraryShared'
  | 'customerBriefed'
  | 'tripCompleted';

export interface BookingPaymentHistoryItem {
  id: string;
  label: string;
  amount: number;
  status: string;
  createdAt: string;
  method?: string;
  receivedBy?: string;
}

export interface TripManagerContact {
  name?: string;
  phone?: string;
  email?: string;
  emergencyContact?: string;
}

export interface TripOperations {
  coordinatorName?: string;
  coordinatorPhone?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleDetails?: string;
  hotelName?: string;
  roomAllocation?: string;
  pickupLocation?: string;
  pickupTime?: string;
  emergencyContact?: string;
  guideName?: string;
  guidePhone?: string;
  internalNotes?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface TripOperationDocument {
  id: string;
  type: TripOperationDocumentType;
  title: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  uploadedBy?: string;
}

export interface TripDocument {
  id: string;
  userId: string;
  bookingId: string;
  bookingNumber?: string;
  documentType: BookingDocumentType;
  documentStatus: BookingDocumentStatus;
  title?: string;
  content?: string;
  category?: PrivateVaultDoc['category'];
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  uploadedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
  _path?: string;
}

export interface CustomerBooking {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  packageId?: string;
  packageTitle: string;
  destination: string;
  price: number;
  travelDate: string;
  travelers: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  bookingId?: string;
  bookingStatus?: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  imageUrl?: string;
  packageImageUrl?: string;
  duration?: string;
  guests?: number;
  totalPrice?: number;
  advancePaid?: number;
  advanceReceived?: number;
  remainingBalance?: number;
  paymentDueDate?: string;
  paymentHistory?: BookingPaymentHistoryItem[];
  bookingTimeline?: Array<{ title?: string; label?: string; note?: string; createdAt?: string; status?: string }>;
  tripManager?: TripManagerContact;
  tripOperations?: TripOperations;
  tripChecklist?: Partial<Record<TripChecklistKey, boolean>>;
  operationDocuments?: TripOperationDocument[];
  tripStatus?: TripCustomerStatus;
  tripStatusOverride?: TripCustomerStatus | '';
  assignedTripManager?: string;
  assignedStaff?: string;
  documentStatus?: Partial<Record<BookingDocumentType, BookingDocumentStatus>>;
  enquiryId?: string;
  convertedFromEnquiryId?: string;
  reviewSubmitted?: boolean;
  specialRequests?: string;
  createdAt: string;
}

export interface PrivateVaultDoc {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: 'Passport' | 'Insurance' | 'Emergency' | 'Checklist' | 'Other';
  createdAt: string;
  updatedAt: string;
}

export interface AIPersonalizedPackage {
  id: string;
  userId: string;
  title: string;
  destination: string;
  duration: string;
  budget: number;
  vibe: string;
  itinerary: ItineraryDay[];
  inclusions: string[];
  exclusions: string[];
  tips: string[];
  createdAt: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  destination: string;
  imageUrl?: string;
  verified?: boolean;
  createdAt: string;
  status?: 'Pending' | 'Approved' | 'Rejected'; // Only Approved reviews appear publicly
  reply?: string; // Admin reply content
  replyAuthor?: string; // Name of replying admin
  replyAt?: string; // Reply timestamp
  featured?: boolean; // Toggled featured review status
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  seoDescription: string;
  seoKeywords: string;
  featuredImageUrl: string;
  content: string;
  tags: string[];
  category: string;
  author: string;
  status: 'Publish' | 'Draft';
  createdAt: string;
  updatedAt?: string;
}

export const SUPPORTED_CURRENCIES = {
  INR: { label: 'INR', locale: 'en-IN', rate: 1 },
  USD: { label: 'USD', locale: 'en-US', rate: 0.012 },
  EUR: { label: 'EUR', locale: 'de-DE', rate: 0.011 },
  GBP: { label: 'GBP', locale: 'en-GB', rate: 0.0095 },
  AED: { label: 'AED', locale: 'en-AE', rate: 0.044 },
} as const;

export type CurrencyCode = keyof typeof SUPPORTED_CURRENCIES;

let activeDisplayCurrency: CurrencyCode = 'INR';

export const isCurrencyCode = (value: unknown): value is CurrencyCode => {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(SUPPORTED_CURRENCIES, value);
};

export const setDisplayCurrency = (currency: CurrencyCode) => {
  activeDisplayCurrency = currency;
};

export const getDisplayCurrency = () => activeDisplayCurrency;

export const formatPrice = (price: number | undefined | null) => {
  if (price === undefined || price === null) return '';
  const currency = SUPPORTED_CURRENCIES[activeDisplayCurrency];
  const convertedPrice = price * currency.rate;

  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: activeDisplayCurrency,
    maximumFractionDigits: 0,
  }).format(convertedPrice);
};
