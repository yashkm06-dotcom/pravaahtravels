export const COOKIE_CONSENT_EVENT = 'pravaah:cookie-consent-change';

const COOKIE_CONSENT_NAME = 'pravaah_cookie_consent';
const COOKIE_CONSENT_VERSION = 1;
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export interface CookieConsentPreferences {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  version: number;
  updatedAt: string;
}

export type OptionalCookieCategory = 'analytics' | 'marketing';

const isCookieConsentPreferences = (value: unknown): value is CookieConsentPreferences => {
  if (!value || typeof value !== 'object') return false;

  const preferences = value as Partial<CookieConsentPreferences>;
  return preferences.necessary === true
    && typeof preferences.analytics === 'boolean'
    && typeof preferences.marketing === 'boolean'
    && preferences.version === COOKIE_CONSENT_VERSION
    && typeof preferences.updatedAt === 'string';
};

export const getCookieConsent = (): CookieConsentPreferences | null => {
  if (typeof document === 'undefined') return null;

  const cookiePrefix = `${COOKIE_CONSENT_NAME}=`;
  const storedCookie = document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(cookiePrefix));

  if (!storedCookie) return null;

  try {
    const parsedValue: unknown = JSON.parse(
      decodeURIComponent(storedCookie.slice(cookiePrefix.length)),
    );
    return isCookieConsentPreferences(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
};

export const saveCookieConsent = (
  preferences: Pick<CookieConsentPreferences, 'analytics' | 'marketing'>,
): CookieConsentPreferences => {
  const savedPreferences: CookieConsentPreferences = {
    necessary: true,
    analytics: Boolean(preferences.analytics),
    marketing: Boolean(preferences.marketing),
    version: COOKIE_CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
  };

  if (typeof document !== 'undefined') {
    const secureAttribute = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${COOKIE_CONSENT_NAME}=${encodeURIComponent(JSON.stringify(savedPreferences))}; Max-Age=${ONE_YEAR_IN_SECONDS}; Path=/; SameSite=Lax${secureAttribute}`;
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<CookieConsentPreferences>(COOKIE_CONSENT_EVENT, {
      detail: savedPreferences,
    }));
  }

  return savedPreferences;
};

export const hasCookieConsent = (category: OptionalCookieCategory): boolean => (
  getCookieConsent()?.[category] === true
);
