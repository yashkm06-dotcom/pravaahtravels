/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ExpeditionPackage {
  title: string;
  slug: string;
  subtitle: string;
  region: string;
  state: string;
  country: string;
  duration: string;
  durationDays: number;
  difficulty: string;
  maxAltitudeFeet: number;
  maxAltitudeMeters: number;
  totalDistanceKm: number;
  bestSeason: string;
  startingPoint: string;
  endingPoint: string;
  heroImage: string;
  description: string;
  tagline: string;
}

export interface TrailLocation {
  id: string;
  name: string;
  localName?: string;
  dayNumber: number;
  altitudeFeet: number;
  altitudeMeters: number;
  distanceFromStartKm: number;
  terrain: string;
  coordinates: {
    lat: number;
    lng: number;
    elevationZ?: number;
  };
  shortDescription: string;
  detailedDescription: string;
  highlight: string;
  image: string;
  stayType?: string;
}

export interface ItineraryDay {
  dayNumber: number;
  title: string;
  route: string;
  startPoint: string;
  endPoint: string;
  distanceKm: number | string;
  trekkingTime: string;
  altitudeStartFeet: number;
  altitudeEndFeet: number;
  altitudeGainLossFeet?: string;
  terrain: string;
  stay: string;
  meals: string;
  description: string;
  highlights: string[];
  image: string;
  locationId: string;
  altitudeNote?: string;
}

export interface ElevationPoint {
  id: string;
  name: string;
  day: number;
  altitudeFeet: number;
  distanceKm: number;
  zone: string;
  isPeak?: boolean;
}

export interface PackingItem {
  id: string;
  name: string;
  category: 'Clothing' | 'Footwear' | 'Trek Gear' | 'Personal' | 'Health' | 'Documents' | 'Electronics';
  essential: boolean;
  notes?: string;
}

export interface PackingCategory {
  id: string;
  name: string;
  iconName: string;
  description: string;
  items: PackingItem[];
}

export interface InclusionItem {
  title: string;
  description: string;
  category?: string;
}

export interface ExclusionItem {
  title: string;
  description: string;
  category?: string;
}

export interface SafetyRule {
  title: string;
  summary: string;
  detail: string;
  icon: string;
}

export interface WhoIsThisForCriterion {
  category: 'ideal' | 'notIdeal';
  title: string;
  description: string;
}

export interface BrandDifferentiator {
  title: string;
  headline: string;
  description: string;
  keyAspect: string;
  icon: string;
}

export interface ExperienceHighlight {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  tag: string;
}

export interface EnquiryFormData {
  fullName: string;
  phone: string;
  email: string;
  preferredMonth: string;
  groupSize: string;
  trekkingExperience: string;
  message: string;
  contactPreference?: string;
}
