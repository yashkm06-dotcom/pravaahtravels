import { TravelPackage } from '../types';

const usable = (value: unknown) => {
  const source = String(value || '').trim();
  return /^(https?:\/\/|\/|data:image\/)/i.test(source) && !/vitour-travel-placeholder|placeholder\.(jpg|jpeg|png|webp)/i.test(source);
};

/** Keeps authored route photography ahead of generic or stale stored image URLs. */
export const getPackageVisual = (pkg: Pick<TravelPackage, 'title' | 'location' | 'destination' | 'category' | 'imageUrl' | 'packageBannerUrl' | 'heroImage'>) => {
  const route = `${pkg.title} ${pkg.location} ${pkg.destination} ${pkg.category}`.toLowerCase();
  if (/roopkund/.test(route)) return '/images/roopkund/hero-roopkund-mystery-lake.jpg';
  if (/buran\s*ghati/.test(route)) return '/images/buran-ghati/hero-buran-ghati.webp';
  if (/valley\s*of\s*flowers|hemkund/.test(route)) return '/images/roopkund/ali-bugyal.jpg';
  if (/ladakh|pangong|nubra/.test(route)) return '/images/roopkund/mount-trishul.jpg';
  return [pkg.imageUrl, pkg.packageBannerUrl, pkg.heroImage].find(usable) || '/images/buran-ghati/hero-buran-ghati.webp';
};
