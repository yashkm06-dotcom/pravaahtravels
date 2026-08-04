import { useEffect, useState, type ImgHTMLAttributes } from 'react';
import { getTravelImage, handleTravelImageError } from '../utils/imageFallback';
import { isWebmMediaUrl } from '../utils/media';

interface TravelMediaProps {
  src?: string | null;
  alt: string;
  className?: string;
  loading?: ImgHTMLAttributes<HTMLImageElement>['loading'];
  decoding?: ImgHTMLAttributes<HTMLImageElement>['decoding'];
  referrerPolicy?: ImgHTMLAttributes<HTMLImageElement>['referrerPolicy'];
  width?: number | string;
  height?: number | string;
  disableFallback?: boolean;
}

export default function TravelMedia({
  src,
  alt,
  className = '',
  loading = 'lazy',
  decoding = 'async',
  referrerPolicy = 'no-referrer',
  width,
  height,
  disableFallback = false,
}: TravelMediaProps) {
  const trimmedSrc = typeof src === 'string' ? src.trim() : '';
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [disableFallback, trimmedSrc]);

  if (disableFallback && (!trimmedSrc || hasError)) return null;

  const mediaUrl = disableFallback ? trimmedSrc : getTravelImage(src);

  if (isWebmMediaUrl(trimmedSrc)) {
    return (
      <video
        src={mediaUrl}
        className={className}
        autoPlay
        muted
        loop
        playsInline
        preload={loading === 'eager' ? 'auto' : 'metadata'}
        aria-label={alt}
        title={alt}
        onError={disableFallback ? () => setHasError(true) : undefined}
      />
    );
  }

  return (
    <img
      src={mediaUrl}
      alt={alt}
      className={className}
      referrerPolicy={referrerPolicy}
      loading={loading}
      decoding={decoding}
      width={width}
      height={height}
      onError={disableFallback ? () => setHasError(true) : handleTravelImageError}
    />
  );
}
