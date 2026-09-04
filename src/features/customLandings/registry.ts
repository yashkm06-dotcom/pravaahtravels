import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { TravelPackage } from '../../types';
import type { BusinessProfile } from '../../utils/businessProfile';

export interface CustomLandingPageProps {
  pkg?: TravelPackage;
  business: BusinessProfile;
  onNavigate: (view: string, packageId?: string | null) => void;
  onOpenEnquiry: (pkg?: TravelPackage) => void;
}

export interface CustomLandingRegistration {
  path: string;
  shell: 'immersive' | 'standard';
  seoImagePath?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  allowWithoutPackage?: boolean;
  packageMatchPaths?: readonly string[];
  component: LazyExoticComponent<ComponentType<CustomLandingPageProps>>;
}

const RoopkundLandingPage = lazy(() => import('./roopkund/RoopkundLandingPage'));
const BuranGhatiLandingPage = lazy(() => import('./buranGhati/BuranGhatiLandingPage'));
const RoopkundMysteryLandingPage = lazy(() => import('./roopkundMystery/RoopkundMysteryLandingPage'));
const LadakhLandingPage = lazy(() => import('./ladakh/LadakhLandingPage'));
const HimachalLandingPage = lazy(() => import('./himachal/HimachalLandingPage'));

export const CUSTOM_LANDING_REGISTRY = {
  '/roopkund-trek': {
    path: '/roopkund-trek',
    shell: 'immersive',
    seoImagePath: '/images/roopkund/hero-roopkund-mystery-lake.jpg',
    seoTitle: 'Roopkund Trek | High-Altitude Glacial Lake Expedition',
    seoDescription: 'Explore the legendary Roopkund Trek in Uttarakhand. Trek through Garhwal forests, Bedni Bugyal meadows, and high-altitude alpine terrain beneath Mount Trishul.',
    seoKeywords: 'Roopkund trek, Roopkund itinerary, Uttarakhand high altitude trek, Bedni Bugyal, Trishul expedition',
    allowWithoutPackage: true,
    component: RoopkundLandingPage,
  },
  '/buran-ghati-trek': {
    path: '/buran-ghati-trek',
    shell: 'immersive',
    seoImagePath: '/images/buran-ghati/hero-buran-ghati.webp',
    seoTitle: 'Buran Ghati Trek | Himalayan Pass Expedition',
    seoDescription: 'Cross the Buran Ghati pass from Janglik to Barua through Himachal Pradesh forests, meadows, glacial lakes, and high-altitude terrain.',
    seoKeywords: 'Buran Ghati trek, Himachal Pradesh trek, Janglik Dayara Litham Chandernahan Barua',
    allowWithoutPackage: true,
    component: BuranGhatiLandingPage,
  },
  '/ladakh': {
    path: '/ladakh',
    shell: 'immersive',
    seoImagePath: '/images/ladakh/hero-ladakh-expedition.jpg',
    seoTitle: 'Ladakh Trans-Himalayan Expedition | Beyond the Last Horizon',
    seoDescription: 'An overland expedition across Ladakh. Traverse Khardung La at 17,582 ft, Nubra Valley sand dunes, Pangong Tso celestial waters, and ancient monasteries.',
    seoKeywords: 'Ladakh expedition, Leh Ladakh itinerary, Khardung La pass, Nubra Valley, Pangong Tso lake, Hemis monastery',
    allowWithoutPackage: true,
    component: LadakhLandingPage,
  },
  '/himachal-trek': {
    path: '/himachal-trek',
    shell: 'immersive',
    seoImagePath: '/images/himachal/hero-himachal-sanctuary.jpg',
    seoTitle: 'Himachal Trek | Alpine Sanctuary Expedition | Pravaah Travels',
    seoDescription: 'A slow mountain retreat and alpine trek in Tirthan Valley and Jibhi. Riverside cedar chalets, crystal trout streams, Jalori Pass at 10,800 ft, and Serolsar sacred lake.',
    seoKeywords: 'Himachal trek, Tirthan Valley trek, Jibhi chalets, Jalori Pass trek, Serolsar lake, Himachal Pradesh alpine retreat',
    allowWithoutPackage: true,
    component: HimachalLandingPage,
  },
  '/himachal': {
    path: '/himachal',
    shell: 'immersive',
    seoImagePath: '/images/himachal/hero-himachal-sanctuary.jpg',
    seoTitle: 'Himachal Trek | Alpine Sanctuary Expedition | Pravaah Travels',
    seoDescription: 'A slow mountain retreat and alpine trek in Tirthan Valley and Jibhi. Riverside cedar chalets, crystal trout streams, Jalori Pass, and Serolsar sacred lake.',
    seoKeywords: 'Himachal trek, Tirthan Valley, Jibhi chalets, Jalori Pass, Serolsar lake, slow mountain life',
    allowWithoutPackage: true,
    packageMatchPaths: ['/himachal-trek'],
    component: HimachalLandingPage,
  },
  '/roopkund-mystery': {
    path: '/roopkund-mystery',
    shell: 'immersive',
    seoImagePath: '/images/roopkund/hero-roopkund-mystery-lake.jpg',
    seoTitle: 'The Lake of Mysteries | Roopkund Trek | Pravaah Travels',
    seoDescription: 'Walk the seven-day Roopkund Trek from Rishikesh through Garhwal forests, alpine meadows and the high glacial basin beneath Trishul.',
    seoKeywords: 'Roopkund trek, Roopkund mystery, Uttarakhand trek, Garhwal Himalaya expedition, high altitude trek',
    allowWithoutPackage: true,
    packageMatchPaths: ['/roopkund-trek'],
    component: RoopkundMysteryLandingPage,
  },
} as const satisfies Record<string, CustomLandingRegistration>;

export type RegisteredCustomLandingPath = keyof typeof CUSTOM_LANDING_REGISTRY;

export const getCustomLandingRegistration = (value: unknown): CustomLandingRegistration | null => {
  if (typeof value !== 'string' || value !== value.trim()) return null;
  return Object.prototype.hasOwnProperty.call(CUSTOM_LANDING_REGISTRY, value)
    ? CUSTOM_LANDING_REGISTRY[value as RegisteredCustomLandingPath]
    : null;
};

export const getRegisteredCustomLandingPath = (value: unknown): RegisteredCustomLandingPath | null => {
  const registration = getCustomLandingRegistration(value);
  return registration?.path as RegisteredCustomLandingPath | null;
};
