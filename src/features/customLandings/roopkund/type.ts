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

export interface ItineraryDay {
  day: number;
  title: string;
  subtitle: string;
  elevationGain: string;
  distance: string;
  duration: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging' | 'Strenuous';
  terrain: string;
  campsite: string;
  highlights: string[];
  description: string;
  mealsIncluded: string[];
  stayType: string;
  expertTip: string;
  image: string;
}

export interface ElevationPoint {
  location: string;
  day: number;
  altitudeFeet: number;
  distanceKm: number;
  zone: string;
  isPeak?: boolean;
}

export interface PackingItem {
  id: string;
  name: string;
  category: 'Clothing' | 'Footwear' | 'Gear' | 'Medical' | 'Documents';
  isMandatory: boolean;
  rentalAvailable: boolean;
  description: string;
}

export interface FAQItem {
  question: string;
  answer: string;
  category: 'Safety & AMS' | 'Fitness & Prep' | 'Logistics & Season' | 'Permits & Environment';
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  location: string;
  quote: string;
  avatar: string;
  trekDate: string;
  rating: number;
}

export interface ExperienceHighlight {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  description: string;
  image: string;
  location: string;
  elevation: string;
  tag: string;
}

export interface TrailLocation {
  id: string;
  name: string;
  altitudeFeet: number;
  day: number;
  highlight: string;
  description: string;
  terrainType: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  image: string;
  bestViewTime: string;
  culturalNote?: string;
}

export interface BrandDifferentiator {
  id: string;
  title: string;
  pillar: string;
  highlight: string;
  description: string;
  stats: string;
  iconName: string;
  deliverables: string[];
}