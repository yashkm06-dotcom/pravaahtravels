import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { TravelPackage } from '../types';
import { getTravelImage } from '../utils/imageFallback';
import TravelMedia from './TravelMedia';

interface GlobalSearchProps {
  packages: TravelPackage[];
  onNavigate: (view: string, packageId?: string | null) => void;
  onClose: () => void;
}

const slugifyPackageTitle = (value: string) => String(value ?? '')
  .toLowerCase()
  .trim()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const getPackageRouteSegment = (pkg: Pick<TravelPackage, 'id' | 'title'>) => {
  const slug = slugifyPackageTitle(pkg.title);
  return slug ? `${slug}-${pkg.id}` : String(pkg.id);
};

// Site-wide search over the already-loaded package catalogue — no extra Firestore reads.
export default function GlobalSearch({ packages, onNavigate, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return [];
    return packages
      .filter((pkg) => pkg.active !== false)
      .filter((pkg) => [pkg.title, pkg.destination, pkg.category, pkg.location]
        .some((field) => String(field ?? '').toLowerCase().includes(normalizedQuery)))
      .slice(0, 8);
  }, [packages, query]);

  const handleSelect = (pkg: TravelPackage) => {
    onNavigate('package-detail', getPackageRouteSegment(pkg));
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-start justify-center bg-stone-950/60 px-4 pt-24 backdrop-blur-sm sm:pt-32"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search packages and destinations"
        className="w-full max-w-xl overflow-hidden rounded-[16px] bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-stone-100 px-5 py-4">
          <Search className="h-5 w-5 shrink-0 text-stone-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search packages, destinations, categories..."
            className="min-w-0 flex-1 text-sm text-stone-900 outline-none placeholder:text-stone-400"
          />
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
            aria-label="Close search"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[26rem] overflow-y-auto p-2">
          {!query.trim() ? (
            <p className="px-4 py-12 text-center text-sm text-stone-400">Start typing to search packages and destinations.</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-stone-400">No packages found for &quot;{query}&quot;.</p>
          ) : (
            results.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                onClick={() => handleSelect(pkg)}
                className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left transition hover:bg-stone-50"
              >
                <TravelMedia
                  src={getTravelImage(pkg.imageUrl)}
                  alt={pkg.title}
                  className="h-12 w-12 shrink-0 rounded-md object-cover"
                  loading="lazy"
                  disableFallback={false}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-stone-900">{pkg.title}</p>
                  <p className="truncate text-xs text-stone-500">{pkg.destination}{pkg.category ? ` • ${pkg.category}` : ''}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
