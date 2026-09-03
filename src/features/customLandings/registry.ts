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

export const CUSTOM_LANDING_REGISTRY = {
  '/roopkund-trek': {
    path: '/roopkund-trek',
    shell: 'immersive',
    seoImagePath: '/images/roopkund/hero-roopkund-mystery-lake.jpg',
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
