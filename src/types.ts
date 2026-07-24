export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
}

export type DestinationCategory =
  | 'Pilgrimage'
  | 'Treks'
  | 'Adventure'
  | 'Himachal'
  | 'Ladakh'
  | 'Uttarakhand';

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
  destination: string;
  location: PackageLocation | string;
  bookingType?: string;
  maxGuests?: number;
  category: DestinationCategory;
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
  thingsToCarry?: string[];
  departureDates?: string[];
  faqs?: { question: string; answer: string }[];
  policies?: string[];
  imageUrl: string; // primary image/banner thumbnail
  packageBannerUrl?: string; // high-res banner image
  galleryImages?: string[]; // multiple images
  featured: boolean;
  active: boolean; // mapped to Publish/Draft
  status?: 'Publish' | 'Draft';
  createdAt: string;
}

export type EnquiryStatus =
  | 'New'
  | 'Contacted'
  | 'Quote Sent'
  | 'Booking Confirmed'
  | 'Cancelled'
  | 'Completed'
  | 'Converted'
  | 'Closed';

export type EnquiryPriority = 'Low' | 'Medium' | 'High';
export type EnquiryPaymentStatus = 'Pending' | 'Partial' | 'Paid';

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
  heroTitle: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  heroCtaText: string;
  heroCtaLink: string;
  footerContactInfo: string;
  footerEmail: string;
  footerPhone: string;
  footerAddress: string;
  socialFacebook: string;
  socialX: string;
  socialLinkedIn: string;
  socialInstagram: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  updatedAt?: string;
}

export const DEFAULT_WEBSITE_CMS: WebsiteCMSSettings = {
  heroTitle: 'Tour Travel & adventure',
  heroTitleAccent: 'Camping',
  heroSubtitle: 'Explore Uttarakhand with guides who respect the mountains.',
  heroCtaText: 'Let,s get started',
  heroCtaLink: 'packages',
  footerContactInfo: 'Premium Himalayan journeys, slow travel, sacred valleys, adventure routes, and tailor-made comfort handled by local curators.',
  footerEmail: 'pravaahtravels@gmail.com',
  footerPhone: '+91 91231 36692',
  footerAddress: '402, Signature Towers, Sector 30, Gurugram, HR - 122001, India',
  socialFacebook: '#',
  socialX: '#',
  socialLinkedIn: '#',
  socialInstagram: '#',
  seoTitle: 'Pravaah Travels',
  seoDescription: 'Premium Himalayan journeys, sacred valleys, adventure routes, and tailor-made comfort handled by local curators.',
  seoKeywords: 'Pravaah Travels, Himalayan tours, Uttarakhand travel, Himachal packages, Kedarnath yatra, luxury travel India',
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

export const formatPrice = (price: number | undefined | null) => {
  if (price === undefined || price === null) return '';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};
