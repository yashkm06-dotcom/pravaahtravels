import { ArrowRight, Check, Compass, Mail, MapPin, Phone, Send, Shield } from 'lucide-react';
import { DEFAULT_WEBSITE_CMS, GalleryImage, WebsiteCMSSettings } from '../types';
import { handleTravelImageError } from '../utils/imageFallback';

interface FooterProps {
  onNavigate: (view: string, packageId?: string | null) => void;
  websiteCMS: WebsiteCMSSettings;
  gallery: GalleryImage[];
  loading?: boolean;
}

export default function Footer({ onNavigate, websiteCMS, gallery, loading = false }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const isValidUrl = (url?: string) => {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };
  const uniqueGalleryUrls = Array.from(
    new Set(gallery.map((item) => item.imageUrl).filter((src): src is string => Boolean(src)))
  );
  const footerGallery = uniqueGalleryUrls.slice(0, 6);
  const safeFooterPhone = String(websiteCMS?.footerPhone ?? '');
  const socialLinks = [
    ['f', websiteCMS.socialFacebook],
    ['x', websiteCMS.socialX],
    ['in', websiteCMS.socialLinkedIn],
    ['ig', websiteCMS.socialInstagram],
  ].filter(([, href]) => isValidUrl(href));
  const companyName = websiteCMS.companyName || DEFAULT_WEBSITE_CMS.companyName;
  const companyTagline = websiteCMS.companyTagline || DEFAULT_WEBSITE_CMS.companyTagline;
  const logoMark = websiteCMS.logoUrl ? (
    <img src={websiteCMS.logoUrl} alt={`${companyName} logo`} className="h-full w-full object-contain" referrerPolicy="no-referrer" loading="lazy" decoding="async" onError={handleTravelImageError} />
  ) : (
    <Compass className="h-7 w-7" />
  );

  return (
    <footer className="relative bg-[#081E2A] pt-24 text-white" id="main-footer">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 border-b border-white/10 pb-16 sm:grid-cols-2 lg:grid-cols-[1.1fr_0.7fr_0.9fr_1fr]">
          <div className="space-y-7">
            <a
              href="/"
              onClick={(event) => { event.preventDefault(); onNavigate('home'); }}
              className="group flex cursor-pointer items-center gap-3"
              id="footer-logo"
            >
              <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#4DA528] p-2 text-white transition group-hover:bg-[#FF970D]">
                {logoMark}
              </span>
              <span className="text-left">
                <span className="block text-2xl font-extrabold leading-none">{companyName}</span>
                <span className="mt-1 block text-[11px] font-bold uppercase tracking-[0.24em] text-[#4DA528]">{companyTagline}</span>
              </span>
            </a>
            <p className="max-w-sm text-[15px] font-light leading-8 text-white/70">
              {websiteCMS.footerContactInfo}
            </p>
            <ul className="space-y-4 text-[15px] text-white/78">
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[#4DA528]" />
                <a href={`mailto:${websiteCMS.footerEmail}`} className="transition hover:text-[#FF970D]">{websiteCMS.footerEmail}</a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-[#4DA528]" />
                <a href={`tel:${safeFooterPhone.replace(/[^0-9+]/g, '')}`} className="transition hover:text-[#FF970D]">{safeFooterPhone}</a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-[#4DA528]" />
                <span>{websiteCMS.footerAddress}</span>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="mb-8 text-[20px] font-bold">Services Req</h5>
            <ul className="space-y-4 text-[15px] text-white/70">
              {[
                ['About Us', 'about'],
                ['Gallery', 'gallery'],
                ['Packages', 'packages'],
                ['Contact', 'contact'],
                ['Customer Portal', 'portal'],
              ].map(([label, view]) => (
                <li key={view}>
                  <a href={view === 'home' ? '/' : `/${view}`} onClick={(event) => { event.preventDefault(); onNavigate(view); }} className="group flex cursor-pointer items-center gap-2 transition hover:text-[#4DA528] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DA528]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[#081E2A]">
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
                    <span>{label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="mb-8 text-[20px] font-bold">Gallery</h5>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="aspect-square animate-pulse rounded-md bg-white/10" />
                ))
              ) : footerGallery.length > 0 ? (
                footerGallery.map((src, idx) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => onNavigate('gallery')}
                    className="group aspect-square cursor-pointer overflow-hidden rounded-md bg-white/10"
                  >
                    <img
                      src={src}
                      alt={`Travel gallery ${idx + 1}`}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                      onError={handleTravelImageError}
                    />
                  </button>
                ))
              ) : (
                <div className="col-span-2 rounded-md border border-white/10 bg-white/5 p-3 text-sm text-white/70 sm:col-span-3">
                  No gallery images have been published yet.
                </div>
              )}
            </div>
          </div>

          <div>
            <h5 className="mb-8 text-[20px] font-bold">Newsletter</h5>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="space-y-5"
              aria-disabled="true"
            >
              <div className="flex flex-col gap-2 rounded-md bg-white/70 sm:flex-row sm:overflow-hidden">
                <input
                  type="email"
                  placeholder="Enter Email Address"
                  disabled
                  className="min-w-0 flex-1 px-5 py-4 text-sm font-medium text-stone-900 outline-none"
                />
                <button type="submit" disabled className="flex h-12 w-full cursor-not-allowed items-center justify-center bg-white/20 text-white/50 sm:w-14">
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-3 text-[13px] text-white/70">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-white/70">
                  <Check className="h-3 w-3" />
                </span>
                <p>Newsletter signup is currently unavailable.</p>
              </div>
            </form>
            {socialLinks.length > 0 && <ul className="mt-8 flex gap-3">
              {socialLinks.map(([item, href]) => (
                <li key={item}>
                  <a href={href} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 text-[12px] font-bold uppercase text-white/70 transition hover:border-[#4DA528] hover:bg-[#4DA528] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DA528]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#081E2A]">
                    {item}
                  </a>
                </li>
              ))}
            </ul>}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-5 py-8 text-[14px] text-white/62 md:flex-row">
          <p>{websiteCMS.copyrightText || `Copyright © ${currentYear} by ${companyName}. All Rights Reserved`}</p>
          <div className="flex flex-wrap items-center justify-center gap-5">
            <a href="/admin-dashboard" onClick={(event) => { event.preventDefault(); onNavigate('admin-dashboard'); }} className="flex cursor-pointer items-center gap-2 transition hover:text-[#4DA528]">
              <Shield className="h-4 w-4" />
              <span>Admin Gateway</span>
            </a>
            <span>Terms</span>
            <span>Privacy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
