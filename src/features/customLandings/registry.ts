import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { TravelPackage } from '../../types';
import type { BusinessProfile } from '../../utils/businessProfile';

export interface CustomLandingPageProps {
  pkg: TravelPackage;
  business: BusinessProfile;
  onNavigate: (view: string, packageId?: string | null) => void;
  onOpenEnquiry: (pkg: TravelPackage) => void;
}

export interface CustomLandingRegistration {
  path: string;
  shell: 'immersive' | 'standard';
  component: LazyExoticComponent<ComponentType<CustomLandingPageProps>>;
}

const RoopkundLandingPage = lazy(() => import('./roopkund/RoopkundLandingPage'));

export const CUSTOM_LANDING_REGISTRY = {
  '/roopkund-trek': {
    path: '/roopkund-trek',
    shell: 'immersive',
    component: RoopkundLandingPage,
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
