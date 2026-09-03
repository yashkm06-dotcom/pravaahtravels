import { ArrowUpRight, Compass, Mail, MapPin, Phone } from 'lucide-react';
import { GalleryImage, WebsiteCMSSettings } from '../types';
import { handleTravelImageError } from '../utils/imageFallback';
import { resolveBusinessProfile } from '../utils/businessProfile';

interface FooterProps {
  onNavigate: (view: string, packageId?: string | null) => void;
  websiteCMS: WebsiteCMSSettings;
  gallery: GalleryImage[];
  loading?: boolean;
}

export default function Footer({ onNavigate, websiteCMS, gallery, loading = false }: FooterProps) {
  const business = resolveBusinessProfile(websiteCMS);
  const year = new Date().getFullYear();
  const galleryImages = Array.from(new Set(gallery.map((item) => item.imageUrl).filter(Boolean))).slice(0, 4);

  return (
    <footer className="pravaah-footer" id="main-footer">
      <div className="pravaah-shell">
        <div className="pravaah-footer__lead">
          <div><span className="pravaah-kicker pravaah-kicker--light">Keep moving slowly</span><h2>There is more world<br />to meet.</h2></div>
          <button type="button" className="pravaah-footer__enquiry" onClick={() => onNavigate('contact')}>Start a conversation <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button>
        </div>

        <div className="pravaah-footer__grid">
          <div className="pravaah-footer__brand">
            <button type="button" className="pravaah-wordmark pravaah-wordmark--footer" onClick={() => onNavigate('home')}>
              <span className="pravaah-wordmark__mark"><Compass className="h-6 w-6" aria-hidden="true" /></span>
              <span className="pravaah-wordmark__text"><strong>{business.companyName}</strong><small>Travel with intention</small></span>
            </button>
            <p>{business.tagline}</p>
            <div className="pravaah-footer__contact-list">
              <a href={`mailto:${business.email}`}><Mail className="h-4 w-4" aria-hidden="true" />{business.email}</a>
              <a href={business.phoneHref}><Phone className="h-4 w-4" aria-hidden="true" />{business.phone}</a>
              <span><MapPin className="h-4 w-4" aria-hidden="true" />{business.address}</span>
            </div>
          </div>

          <div><span className="pravaah-footer__label">Navigate</span><div className="pravaah-footer__links">
            <button type="button" onClick={() => onNavigate('destinations')}>Destinations</button>
            <button type="button" onClick={() => onNavigate('packages')}>Journeys</button>
            <button type="button" onClick={() => onNavigate('blogs')}>Journal</button>
            <button type="button" onClick={() => onNavigate('about')}>About Pravaah</button>
            <button type="button" onClick={() => onNavigate('portal')}>Travel desk</button>
          </div></div>

          <div className="pravaah-footer__journal"><span className="pravaah-footer__label">From the field</span>
            <button type="button" onClick={() => onNavigate('gallery')} className="pravaah-footer__gallery-link">Open the photo journal <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button>
            <div className="pravaah-footer__gallery">
              {loading ? [1, 2, 3, 4].map((item) => <span key={item} className="pravaah-footer__gallery-placeholder" />) : galleryImages.length > 0 ? galleryImages.map((src, index) => (
                <button type="button" key={src} onClick={() => onNavigate('gallery')} aria-label={`Open travel photo ${index + 1}`}><img src={src} alt="" loading="lazy" onError={handleTravelImageError} /></button>
              )) : <p>No photographs have been published yet.</p>}
            </div>
          </div>
        </div>

        <div className="pravaah-footer__bottom"><span>© {year} {business.companyName}. All rights reserved.</span><span>Routes chosen with care from Rishikesh, Uttarakhand.</span></div>
      </div>
    </footer>
  );
}
