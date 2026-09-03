import React, { useEffect, useRef, useState } from 'react';
import { ImageOff } from 'lucide-react';

interface PackageImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  containerClassName?: string;
  loading?: 'eager' | 'lazy';
  decoding?: 'async' | 'sync' | 'auto';
}

/**
 * Package-owned image surface. It reserves the caller's aspect ratio, fades
 * images in after they load, and never swaps a broken package image for an
 * unrelated stock image.
 */
export default function PackageImage({
  src,
  alt,
  className = 'h-full w-full object-cover',
  containerClassName = '',
  loading = 'lazy',
  decoding = 'async',
}: PackageImageProps) {
  const normalizedSrc = typeof src === 'string' ? src.trim() : '';
  const [loadState, setLoadState] = useState<{ source: string; status: 'idle' | 'loading' | 'loaded' | 'error' }>({
    source: normalizedSrc,
    status: normalizedSrc ? 'loading' : 'idle',
  });
  const activeSourceRef = useRef(normalizedSrc);
  activeSourceRef.current = normalizedSrc;

  useEffect(() => {
    setLoadState({ source: normalizedSrc, status: normalizedSrc ? 'loading' : 'idle' });
  }, [normalizedSrc]);

  const status = loadState.source === normalizedSrc ? loadState.status : normalizedSrc ? 'loading' : 'idle';
  const showImage = Boolean(normalizedSrc) && status !== 'error';
  const imageLoaded = status === 'loaded';

  return (
    <span className={`relative block h-full w-full overflow-hidden bg-stone-100 ${containerClassName}`}>
      {showImage && (
        <img
          key={normalizedSrc}
          src={normalizedSrc}
          alt={alt}
          className={`${className} transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          referrerPolicy="no-referrer"
          loading={loading}
          decoding={decoding}
          onLoad={async (event) => {
            // Decode before revealing the image so a successful network load
            // cannot still paint as a blank frame during the fade-in.
            try {
              await event.currentTarget.decode?.();
            } catch {
              // Browsers may reject decode for an already-decoded image.
            }
            if (activeSourceRef.current === normalizedSrc) {
              setLoadState({ source: normalizedSrc, status: 'loaded' });
            }
          }}
          onError={() => {
            if (activeSourceRef.current === normalizedSrc) {
              setLoadState({ source: normalizedSrc, status: 'error' });
            }
          }}
        />
      )}

      {(status === 'loading' || status === 'idle') && normalizedSrc && (
        <span className="absolute inset-0 animate-pulse bg-stone-200/80" aria-hidden="true" />
      )}

      {(status === 'idle' || status === 'error') && (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-stone-100 px-4 text-center text-stone-500">
          <ImageOff className="h-6 w-6 text-stone-400" aria-hidden="true" />
          <span className="text-xs font-semibold tracking-wide">Package image unavailable</span>
        </span>
      )}
    </span>
  );
}
