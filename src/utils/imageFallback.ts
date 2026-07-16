import type React from 'react';
import vitourTravelPlaceholder from '../assets/vitour-travel-placeholder.jpg';

export const DEFAULT_TRAVEL_IMAGE = vitourTravelPlaceholder;

export const getTravelImage = (imageUrl?: string | null) => {
  const trimmedUrl = typeof imageUrl === 'string' ? imageUrl.trim() : '';
  return trimmedUrl || DEFAULT_TRAVEL_IMAGE;
};

export const handleTravelImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
  const image = event.currentTarget;
  image.onerror = null;
  if (image.src !== DEFAULT_TRAVEL_IMAGE) {
    image.src = DEFAULT_TRAVEL_IMAGE;
  }
};
