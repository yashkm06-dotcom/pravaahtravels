export const getMediaExtension = (value?: string | null) => {
  const rawValue = String(value || '').trim();
  if (!rawValue) return '';

  const lowerValue = rawValue.toLowerCase();
  if (lowerValue.startsWith('data:video/webm')) return 'webm';

  try {
    const url = new URL(rawValue);
    return decodeURIComponent(url.pathname).split('.').pop()?.toLowerCase() || '';
  } catch {
    return lowerValue.split('#')[0].split('?')[0].split('.').pop() || '';
  }
};

export const isWebmMediaUrl = (value?: string | null) => getMediaExtension(value) === 'webm';
