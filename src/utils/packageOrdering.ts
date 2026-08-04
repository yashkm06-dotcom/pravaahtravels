import type { TravelPackage } from '../types';

// Featured packages first, then admin-set Display Order (ascending), then the caller's
// existing order (typically createdAt desc from the Firestore query) as the final tiebreak
// for packages without an explicit Display Order — so untouched packages keep behaving
// exactly as they did before Display Order existed.
export const comparePackagesForDisplay = (a: TravelPackage, b: TravelPackage, aIndex: number, bIndex: number): number => {
  const featuredDiff = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
  if (featuredDiff !== 0) return featuredDiff;

  const aOrder = Number.isFinite(a.displayOrder) ? Number(a.displayOrder) : Number.MAX_SAFE_INTEGER;
  const bOrder = Number.isFinite(b.displayOrder) ? Number(b.displayOrder) : Number.MAX_SAFE_INTEGER;
  if (aOrder !== bOrder) return aOrder - bOrder;

  return aIndex - bIndex;
};

export const sortPackagesForDisplay = (packages: TravelPackage[]): TravelPackage[] => (
  packages
    .map((pkg, index) => ({ pkg, index }))
    .sort((a, b) => comparePackagesForDisplay(a.pkg, b.pkg, a.index, b.index))
    .map((entry) => entry.pkg)
);
