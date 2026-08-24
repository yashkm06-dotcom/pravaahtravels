import type { TravelPackage } from '../types';

// Generic bucket labels that are never a real destination name.
const GENERIC_DESTINATION_LABELS = new Set([
  'international',
  'international trips',
  'international trip',
  'overseas',
  'abroad',
  'other',
]);

// Region qualifiers stripped so "Northern and Central Vietnam" resolves to "Vietnam".
const DESTINATION_QUALIFIER_WORDS = new Set([
  'north', 'northern', 'south', 'southern', 'east', 'eastern', 'west', 'western',
  'central', 'coast', 'coastal', 'region', 'regions', 'the', 'trip', 'trips',
  'tour', 'tours', 'holiday', 'holidays', 'package', 'packages',
]);

const cleanDestinationSegment = (segment: string) => segment
  .split(/\s+/)
  .filter((word) => {
    const normalized = word.toLowerCase().replace(/[^a-z]/g, '');
    return normalized.length > 0 && !DESTINATION_QUALIFIER_WORDS.has(normalized);
  })
  .join(' ')
  .trim();

// Reduces a stored destination/location value ("Bali, Indonesia", "Dubai and Abu Dhabi")
// down to the leading place name used for the second level navigation and Master Data usage counts.
export const deriveDestinationLabel = (rawValue?: string | null) => {
  const raw = String(rawValue ?? '').replace(/\s+/g, ' ').trim();
  if (!raw || GENERIC_DESTINATION_LABELS.has(raw.toLowerCase())) return '';

  const segments = raw.split(/\s*(?:[,/|;]|&|\band\b|\bwith\b|\bplus\b)\s*/i);
  for (const segment of segments) {
    const cleaned = cleanDestinationSegment(segment);
    if (cleaned && !GENERIC_DESTINATION_LABELS.has(cleaned.toLowerCase())) return cleaned;
  }
  return '';
};

// Destination names are derived from the package documents already loaded in memory,
// so admin edits to a package immediately add/update/remove a destination button.
export const getPackageDestinationLabel = (pkg: Pick<TravelPackage, 'location' | 'destination' | 'destinations'>) => {
  const candidates = [pkg.location, pkg.destination, ...(pkg.destinations || [])];
  for (const candidate of candidates) {
    const label = deriveDestinationLabel(candidate);
    if (label) return label;
  }
  return 'Other';
};

export const getDestinationKey = (label: string) => label.toLowerCase();
