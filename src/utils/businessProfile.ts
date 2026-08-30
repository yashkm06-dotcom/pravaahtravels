import { DEFAULT_WEBSITE_CMS, type WebsiteCMSSettings } from '../types';

export interface BusinessSocialLink {
  label: 'Facebook' | 'Instagram' | 'LinkedIn' | 'X' | 'YouTube';
  href: string;
}

export interface BusinessProfile {
  companyName: string;
  tagline: string;
  phone: string;
  phoneHref: string;
  whatsapp: string;
  whatsappDigits: string;
  email: string;
  supportEmail: string;
  address: string;
  logoUrl: string;
  websiteUrl: string;
  workingHours: string;
  socialLinks: BusinessSocialLink[];
  whatsappUrl: (message?: string) => string;
}

const firstText = (...values: unknown[]) => {
  for (const value of values) {
    const normalized = String(value ?? '').trim();
    if (normalized) return normalized;
  }
  return '';
};

export const normalizePhoneDigits = (value?: string) => {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('91')) return digits;
  return `91${digits.replace(/^0+/, '')}`;
};

export const normalizePublicUrl = (value?: string) => {
  const candidate = String(value ?? '').trim();
  if (!candidate || candidate === '#') return '';
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : '';
  } catch {
    return '';
  }
};

const buildAddress = (settings: Partial<WebsiteCMSSettings>) => {
  const explicit = firstText(settings.footerAddress, settings.officeAddress);
  if (explicit) return explicit;

  return [settings.city, settings.state, settings.country, settings.postalCode]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
    .join(', ');
};

export const resolveBusinessProfile = (
  settings: Partial<WebsiteCMSSettings> = {},
): BusinessProfile => {
  const companyName = firstText(settings.companyName, DEFAULT_WEBSITE_CMS.companyName, 'Pravaah Travels');
  const phone = firstText(
    settings.primaryPhone,
    settings.footerPhone,
    DEFAULT_WEBSITE_CMS.primaryPhone,
    DEFAULT_WEBSITE_CMS.footerPhone,
  );
  const whatsapp = firstText(
    settings.whatsappNumber,
    settings.primaryPhone,
    settings.footerPhone,
    DEFAULT_WEBSITE_CMS.whatsappNumber,
    DEFAULT_WEBSITE_CMS.footerPhone,
  );
  const whatsappDigits = normalizePhoneDigits(whatsapp);
  const email = firstText(
    settings.primaryEmail,
    settings.footerEmail,
    DEFAULT_WEBSITE_CMS.primaryEmail,
    DEFAULT_WEBSITE_CMS.footerEmail,
  );
  const supportEmail = firstText(settings.supportEmail, email);
  const address = buildAddress(settings) || buildAddress(DEFAULT_WEBSITE_CMS);

  const socialCandidates: Array<[BusinessSocialLink['label'], string | undefined]> = [
    ['Facebook', settings.socialFacebook],
    ['Instagram', settings.socialInstagram],
    ['LinkedIn', settings.socialLinkedIn],
    ['X', settings.socialX],
    ['YouTube', settings.socialYoutube],
  ];

  const socialLinks = socialCandidates.flatMap(([label, value]) => {
    const href = normalizePublicUrl(value);
    return href ? [{ label, href }] : [];
  });

  return {
    companyName,
    tagline: firstText(settings.companyTagline, settings.footerContactInfo, DEFAULT_WEBSITE_CMS.footerContactInfo),
    phone,
    phoneHref: phone ? `tel:${phone.replace(/[^+\d]/g, '')}` : '',
    whatsapp,
    whatsappDigits,
    email,
    supportEmail,
    address,
    logoUrl: firstText(settings.logoUrl),
    websiteUrl: normalizePublicUrl(settings.websiteUrl) || 'https://pravaahtravels.com/',
    workingHours: firstText(settings.officeWorkingHours, settings.weekendHours),
    socialLinks,
    whatsappUrl: (message = '') => {
      if (!whatsappDigits) return '';
      const suffix = message ? `?text=${encodeURIComponent(message)}` : '';
      return `https://wa.me/${whatsappDigits}${suffix}`;
    },
  };
};
