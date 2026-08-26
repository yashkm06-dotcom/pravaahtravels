import type { TravelPackage } from '../types';
import { getRegisteredCustomLandingPath } from '../features/customLandings/registry';

export interface PackageNavigationTarget {
  view: 'package-detail' | 'custom-landing';
  packageId: string;
  path: string;
}

export const slugifyPackageTitle = (value: string) => String(value ?? '')
  .toLowerCase()
  .trim()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

export const getPackageRouteSegment = (pkg: Pick<TravelPackage, 'id' | 'title'>) => {
  const slug = slugifyPackageTitle(pkg.title);
  return slug ? `${slug}-${pkg.id}` : String(pkg.id);
};

export const getPackageNavigationTarget = (
  pkg: Pick<TravelPackage, 'id' | 'title' | 'customLandingPage'>,
): PackageNavigationTarget => {
  const customPath = getRegisteredCustomLandingPath(pkg.customLandingPage);
  if (customPath) {
    return {
      view: 'custom-landing',
      packageId: customPath,
      path: customPath,
    };
  }

  const routeSegment = getPackageRouteSegment(pkg);
  return {
    view: 'package-detail',
    packageId: routeSegment,
    path: `/packages/${routeSegment}`,
  };
};

export const openPackage = (
  onNavigate: (view: string, packageId?: string | null) => void,
  pkg: Pick<TravelPackage, 'id' | 'title' | 'customLandingPage'>,
) => {
  const target = getPackageNavigationTarget(pkg);
  onNavigate(target.view, target.packageId);
};

export const packageMatchesRouteSegment = (
  pkg: Pick<TravelPackage, 'id' | 'title'>,
  routeSegment: string,
) => String(pkg.id) === routeSegment
  || getPackageRouteSegment(pkg) === routeSegment
  || slugifyPackageTitle(pkg.title) === routeSegment;
