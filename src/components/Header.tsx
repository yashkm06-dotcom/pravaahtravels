import { useEffect, useState } from 'react';
import { ArrowUpRight, Compass, Mail, Menu, Phone, Search, ShieldCheck, UserCircle, X } from 'lucide-react';
import { TravelPackage, WebsiteCMSSettings } from '../types';
import { resolveBusinessProfile } from '../utils/businessProfile';
import GlobalSearch from './GlobalSearch';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, packageId?: string | null) => void;
  isAdminLoggedIn: boolean;
  currentUser: any;
  onAdminLogout: () => void;
  websiteCMS: WebsiteCMSSettings;
  packages?: TravelPackage[];
}

const navItems = [
  { label: 'Destinations', view: 'destinations' },
  { label: 'Journeys', view: 'packages' },
  { label: 'Journal', view: 'blogs' },
  { label: 'The gallery', view: 'gallery' },
  { label: 'About', view: 'about' },
];

export default function Header({ currentView, onNavigate, isAdminLoggedIn, currentUser, onAdminLogout, websiteCMS, packages = [] }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [openNav, setOpenNav] = useState<string | null>(null);
  const [closingNav, setClosingNav] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const business = resolveBusinessProfile(websiteCMS);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 18);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      setMenuVisible(true);
      return undefined;
    }
    if (!menuVisible) return undefined;
    const timer = window.setTimeout(() => setMenuVisible(false), 320);
    return () => window.clearTimeout(timer);
  }, [menuOpen, menuVisible]);

  useEffect(() => {
    const menuActive = menuOpen || menuVisible;
    if (!menuActive) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [menuOpen, menuVisible]);

  useEffect(() => {
    if (searchOpen) {
      setSearchVisible(true);
      return undefined;
    }
    if (!searchVisible) return undefined;
    const timer = window.setTimeout(() => setSearchVisible(false), 260);
    return () => window.clearTimeout(timer);
  }, [searchOpen, searchVisible]);

  const closeNav = () => {
    if (!openNav) return;
    const current = openNav;
    setOpenNav(null);
    setClosingNav(current);
    window.setTimeout(() => setClosingNav((value) => value === current ? null : value), 220);
  };

  const showNav = (view: string) => {
    setClosingNav(null);
    setOpenNav(view);
  };

  const navigate = (view: string) => {
    onNavigate(view);
    setMenuOpen(false);
    setSearchOpen(false);
    setOpenNav(null);
    setClosingNav(null);
  };

  const logoMark = business.logoUrl && !logoFailed ? (
    <img src={business.logoUrl} alt={`${business.companyName} logo`} className="h-full w-full object-contain" referrerPolicy="no-referrer" onError={() => setLogoFailed(true)} />
  ) : <Compass className="h-6 w-6" aria-hidden="true" />;

  return (
    <>
      <header className={`pravaah-header ${scrolled ? 'is-scrolled' : ''}`} id="main-header">
        <div className="pravaah-header__utility">
          <div className="pravaah-shell pravaah-header__utility-inner">
            <span>Independent travel curation from the Himalaya</span>
            <div className="pravaah-header__utility-contact">
              <a href={`mailto:${business.email}`}><Mail className="h-3.5 w-3.5" aria-hidden="true" />{business.email}</a>
              <a href={business.phoneHref}><Phone className="h-3.5 w-3.5" aria-hidden="true" />{business.phone}</a>
            </div>
          </div>
        </div>

        <div className="pravaah-shell pravaah-header__main">
          <button type="button" className="pravaah-wordmark" onClick={() => navigate('home')} aria-label="Go to Pravaah home">
            <span className="pravaah-wordmark__mark">{logoMark}</span>
            <span className="pravaah-wordmark__text"><strong>{business.companyName}</strong><small>Travel with intention</small></span>
          </button>

          <nav className="pravaah-header__nav" aria-label="Primary navigation" onMouseLeave={closeNav}>
            <button type="button" className={currentView === 'home' ? 'is-active' : ''} onClick={() => navigate('home')}>Home</button>
            {navItems.map((item) => (
              <div key={item.view} className="pravaah-header__nav-item" onMouseEnter={() => showNav(item.view)}>
                <button type="button" className={currentView === item.view || (item.view === 'blogs' && currentView === 'blog-detail') ? 'is-active' : ''} onClick={() => navigate(item.view)} onFocus={() => showNav(item.view)} aria-expanded={openNav === item.view}>{item.label}</button>
                {(openNav === item.view || closingNav === item.view) && <div className={`pravaah-header__dropdown ${openNav === item.view ? 'is-open' : 'is-closing'}`} role="menu">
                  <button type="button" role="menuitem" onClick={() => navigate(item.view)}>{item.label === 'About' ? 'Our approach' : item.label === 'The gallery' ? 'Open the gallery' : `Browse ${item.label.toLowerCase()}`} <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button>
                  {item.view === 'packages' && <button type="button" role="menuitem" onClick={() => navigate('contact')}>Plan with a curator <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button>}
                  {item.view === 'destinations' && <button type="button" role="menuitem" onClick={() => navigate('packages')}>View all journeys <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button>}
                </div>}
              </div>
            ))}
          </nav>

          <div className="pravaah-header__actions">
            <button type="button" className="pravaah-icon-button" onClick={() => setSearchOpen(true)} aria-label="Search journeys and destinations" title="Search"><Search className="h-4 w-4" aria-hidden="true" /></button>
            {isAdminLoggedIn ? (
              <><button type="button" className="pravaah-header__account" onClick={() => navigate('admin-dashboard')}><ShieldCheck className="h-4 w-4" aria-hidden="true" />Operations</button><button type="button" className="pravaah-header__logout" onClick={onAdminLogout}>Log out</button></>
            ) : currentUser ? (
              <><button type="button" className="pravaah-header__account" onClick={() => navigate('portal')}><UserCircle className="h-4 w-4" aria-hidden="true" />My travel desk</button><button type="button" className="pravaah-header__logout" onClick={onAdminLogout}>Log out</button></>
            ) : <button type="button" className="pravaah-header__account" onClick={() => navigate('admin-login')}>Sign in <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button>}
            <button type="button" className="pravaah-header__cta" onClick={() => navigate('contact')}>Plan a trip <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button>
          </div>

          <div className="pravaah-header__mobile-actions">
            <button type="button" className="pravaah-icon-button" onClick={() => setSearchOpen(true)} aria-label="Search journeys and destinations"><Search className="h-5 w-5" aria-hidden="true" /></button>
            <button type="button" className="pravaah-icon-button" onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen}>{menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}</button>
          </div>
        </div>
      </header>
      {menuVisible && (
        <div className={`pravaah-mobile-menu-layer ${menuOpen ? 'is-open' : 'is-closing'}`}>
          <button type="button" className="pravaah-mobile-menu__backdrop" onClick={() => setMenuOpen(false)} aria-label="Close navigation menu" />
          <div className="pravaah-mobile-menu" role="dialog" aria-modal="true" aria-label="Mobile navigation">
            <div className="pravaah-shell pravaah-mobile-menu__inner">
              <span className="pravaah-kicker">The way through</span>
              <button type="button" className={currentView === 'home' ? 'is-active' : ''} onClick={() => navigate('home')}>Home</button>
              {navItems.map((item) => <button key={item.view} type="button" className={currentView === item.view ? 'is-active' : ''} onClick={() => navigate(item.view)}>{item.label}</button>)}
              <button type="button" className="pravaah-mobile-menu__cta" onClick={() => navigate('contact')}>Plan a trip <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button>
            </div>
          </div>
        </div>
      )}
      {searchVisible && <GlobalSearch isClosing={!searchOpen} onClose={() => setSearchOpen(false)} packages={packages} onNavigate={onNavigate} />}
    </>
  );
}
