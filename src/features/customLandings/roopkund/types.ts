/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface Artist {
  id: string;
  name: string;
  genre: string;
  bio: string;
  image: string;
  day: string;
}

export interface ExpeditionPackage {
  id?: string;
  title?: string;
  name?: string;
  slug?: string;
  subtitle?: string;
  tagline?: string;
  region?: string;
  state?: string;
  country?: string;
  duration?: string;
  altitude?: string;
  difficulty?: string;
  bestSeason?: string;
  startingPoint?: string;
  endingPoint?: string;
  pricePerPerson?: number;
  maxBatchSize?: number;
  overview?: string;
  description?: string;
  highlights?: string[];
  heroImage?: string;
  badge?: string;
  grade?: string;
  durationDays?: number;
  durationNights?: number;
  maxAltitudeFeet?: number;
  maxAltitudeMeters?: number;
  totalDistanceKm?: number;
  trailLengthKm?: number;
  baseCamp?: string;
  nearestRailhead?: string;
  nearestAirport?: string;
  idealFor?: string;
}

export interface ItineraryDay {
  dayNumber?: number;
  day?: number;
  title: string;
  route?: string;
  subtitle?: string;
  elevationGain?: string;
  distance?: string;
  distanceKm?: number | string;
  duration?: string;
  trekkingTime?: string;
  altitudeStartFeet?: number;
  altitudeEndFeet?: number;
  altitudeGainLossFeet?: string;
  altitudeNote?: string;
  difficulty?: 'Easy' | 'Moderate' | 'Challenging' | 'Strenuous' | string;
  terrain?: string;
  campsite?: string;
  stay?: string;
  stayType?: string;
  meals?: string;
  mealsIncluded?: string[];
  startPoint?: string;
  endPoint?: string;
  highlights?: string[];
  description?: string;
  expertTip?: string;
  image?: string;
  locationId?: string;
}

export interface ElevationPoint {
  id?: string;
  name: string;
  location?: string;
  day: number;
  altitudeFeet: number;
  distanceKm: number;
  zone: string;
  isPeak?: boolean;
}

export interface TrailLocation {
  id: string;
  name: string;
  dayNumber?: number;
  day?: number;
  localName?: string;
  altitudeFeet: number;
  altitudeMeters?: number;
  highlight: string;
  shortDescription?: string;
  detailedDescription?: string;
  description?: string;
  distanceFromStartKm?: number;
  terrain?: string;
  terrainType?: string;
  stayType?: string;
  coordinates: {
    lat: number;
    lng: number;
    elevationZ?: number;
  };
  image: string;
  bestViewTime?: string;
  culturalNote?: string;
}

export interface BrandDifferentiator {
  id?: string;
  title: string;
  headline?: string;
  pillar?: string;
  keyAspect?: string;
  highlight?: string;
  description: string;
  stats?: string;
  icon?: string;
  iconName?: string;
  deliverables?: string[];
}

export interface ExperienceHighlight {
  id: string;
  title: string;
  subtitle?: string;
  category?: string;
  description: string;
  image: string;
  location?: string;
  elevation?: string;
  tag?: string;
}

export interface PackingItem {
  id: string;
  name: string;
  category: 'Clothing' | 'Footwear' | 'Gear' | 'Medical' | 'Documents' | 'Trek Gear' | 'Personal' | 'Health' | 'Electronics' | string;
  essential?: boolean;
  isMandatory?: boolean;
  rentalAvailable?: boolean;
  notes?: string;
  description?: string;
}

export interface PackingCategory {
  id?: string;
  name?: string;
  category?: string;
  description?: string;
  icon?: string;
  iconName?: string;
  items: PackingItem[];
}

export interface InclusionItem {
  id?: string;
  category?: string;
  title: string;
  description: string;
  iconName?: string;
}

export interface ExclusionItem {
  id?: string;
  title: string;
  description: string;
}

export interface SafetyRule {
  id?: string;
  title?: string;
  protocol?: string;
  equipment?: string;
  icon?: string;
  summary?: string;
  detail?: string;
}

export interface WhoIsThisForCriterion {
  id?: string;
  category?: 'Ideal For' | 'Not Recommended For' | string;
  title?: string;
  reason?: string;
  icon?: string;
  description?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
  category: 'Safety & AMS' | 'Fitness & Prep' | 'Logistics & Season' | 'Permits & Environment' | string;
}

export interface TravellerReview {
  id?: string;
  name?: string;
  author?: string;
  role?: string;
  location: string;
  trip?: string;
  quote?: string;
  review?: string;
  text?: string;
  avatar?: string;
  trekDate?: string;
  date?: string;
  verified?: boolean;
  rating: number;
}

export interface Testimonial extends TravellerReview {}
