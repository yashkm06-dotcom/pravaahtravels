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

export interface TravelPackage {
  id: string;
  title: string;
  destination: string;
  category: DestinationCategory;
  duration: string; // e.g., "5 Days / 4 Nights"
  price: number;
  offerPrice?: number;
  pickup?: string;
  packageCode?: string;
  seoTitle?: string;
  seoDescription?: string;
  shortDescription: string;
  fullDescription: string; // long description
  highlights?: string[];
  itinerary: ItineraryDay[];
  inclusions: string[];
  exclusions: string[];
  thingsToCarry?: string[];
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

export type EnquiryStatus = 'New' | 'Contacted' | 'Converted' | 'Closed';

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
  createdAt: string;
}

export interface GalleryImage {
  id: string;
  title: string;
  category: string;
  album?: string; // New: Album grouping support
  imageUrl: string;
  createdAt: string;
}

export type BookingStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Unpaid' | 'Paid' | 'Refunded';

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
