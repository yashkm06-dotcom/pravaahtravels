import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { TravelPackage } from '../../../../types';
import type { BusinessProfile } from '../../../../utils/businessProfile';
import {
  submitRoopkundEnquiry,
  type RoopkundEnquiryInput,
} from '../submitRoopkundEnquiry';

interface RoopkundIntegrationValue {
  pkg: TravelPackage;
  business: BusinessProfile;
  onNavigate: (view: string, packageId?: string | null) => void;
  submitEnquiry: (input: RoopkundEnquiryInput) => Promise<string>;
}

const RoopkundIntegrationContext = createContext<RoopkundIntegrationValue | null>(null);

interface RoopkundIntegrationProviderProps {
  pkg: TravelPackage;
  business: BusinessProfile;
  onNavigate: (view: string, packageId?: string | null) => void;
  children: ReactNode;
}

export function RoopkundIntegrationProvider({
  pkg,
  business,
  onNavigate,
  children,
}: RoopkundIntegrationProviderProps) {
  const value = useMemo<RoopkundIntegrationValue>(() => ({
    pkg,
    business,
    onNavigate,
    submitEnquiry: (input) => submitRoopkundEnquiry(pkg, input),
  }), [business, onNavigate, pkg]);

  return (
    <RoopkundIntegrationContext.Provider value={value}>
      {children}
    </RoopkundIntegrationContext.Provider>
  );
}

export function useRoopkundIntegration() {
  const value = useContext(RoopkundIntegrationContext);
  if (!value) {
    throw new Error('Roopkund integration context is unavailable.');
  }
  return value;
}
