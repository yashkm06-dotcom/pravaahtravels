import { useState } from 'react';
import { BadgeDollarSign, CalendarDays, Compass, Languages, Mail, Menu, Phone, Search, ShieldAlert, UserCircle, X } from 'lucide-react';
import { CurrencyCode, DEFAULT_WEBSITE_CMS, SUPPORTED_CURRENCIES, TravelPackage, WebsiteCMSSettings } from '../types';
import { handleTravelImageError } from '../utils/imageFallback';
import GlobalSearch from './GlobalSearch';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, packageId?: string | null) => void;
  isAdminLoggedIn: boolean;
  currentUser: any;
  onAdminLogout: () => void;
  websiteCMS: WebsiteCMSSettings;
  selectedCurrency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  packages?: TravelPackage[];
}

const SITE_LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'es', label: 'Spanish' },
  { code: 'ar', label: 'Arabic' },
];

export default function Header({
  currentView,
  onNavigate,
  isAdminLoggedIn,
  currentUser,
  onAdminLogout,
  websiteCMS,
  selectedCurrency,
  onCurrencyChange,
  selectedLanguage,
  onLanguageChange,
  packages = [],
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const isValidSocialUrl = (url?: string) => {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const navItems = [
    { label: 'Home', view: 'home' },
    { label: 'Packages', view: 'packages' },
    { label: 'Gallery', view: 'gallery' },
    { label: 'Blog', view: 'blogs' },
    { label: 'About Us', view: 'about' },
  ];

  const handleNavClick = (view: string) => {
    onNavigate(view);
    setIsMenuOpen(false);
  };

  const getViewHref = (view: string) => (view === 'home' ? '/' : `/${view}`);

  const currentDateLabel = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const companyName = websiteCMS.companyName || DEFAULT_WEBSITE_CMS.companyName;
  const companyTagline = websiteCMS.companyTagline || DEFAULT_WEBSITE_CMS.companyTagline;
  const logoMark = websiteCMS.logoUrl ? (
    <img src={websiteCMS.logoUrl} alt={`${companyName} logo`} className="h-full w-full object-contain" referrerPolicy="no-referrer" onError={handleTravelImageError} />
  ) : (
    <Compass className="h-7 w-7" />
  );

  const socialDots = [
    { href: websiteCMS.socialFacebook, label: 'Facebook', className: 'bg-[#4DA528]' },
    { href: websiteCMS.socialInstagram, label: 'Instagram', className: 'bg-[#FF970D]' },
    { href: websiteCMS.socialLinkedIn, label: 'LinkedIn', className: 'bg-stone-900' },
  ].filter((item) => isValidSocialUrl(item.href));

  const currencyOptions = Object.entries(SUPPORTED_CURRENCIES) as [CurrencyCode, (typeof SUPPORTED_CURRENCIES)[CurrencyCode]][];
  const preferenceControls = (
    <>
      <label className="flex items-center gap-2 rounded-full border border-stone-200 bg-[#fffaf1] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-stone-700">
        <Languages className="h-4 w-4 text-[#4DA528]" />
        <select
          value={selectedLanguage}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="cursor-pointer bg-transparent text-[11px] font-extrabold uppercase outline-none"
          aria-label="Translate website"
        >
          {SITE_LANGUAGE_OPTIONS.map((language) => (
            <option key={language.code} value={language.code}>{language.label}</option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 rounded-full border border-stone-200 bg-[#fffaf1] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-stone-700">
        <BadgeDollarSign className="h-4 w-4 text-[#4DA528]" />
        <select
          value={selectedCurrency}
          onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
          className="cursor-pointer bg-transparent text-[11px] font-extrabold uppercase outline-none"
          aria-label="Choose display currency"
        >
          {currencyOptions.map(([code, currency]) => (
            <option key={code} value={code}>{currency.label}</option>
          ))}
        </select>
      </label>
    </>
  );

  const dashboardButton = isAdminLoggedIn ? (
    <>
      <button
        onClick={() => handleNavClick('admin-dashboard')}
        className="cursor-pointer bg-[#4DA528] px-5 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-white transition hover:bg-[#FF970D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DA528]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        Admin Dashboard
      </button>
      <button
        onClick={onAdminLogout}
        className="cursor-pointer border border-stone-200 px-5 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-stone-900 transition hover:border-[#4DA528] hover:text-[#4DA528]"
      >
        Logout
      </button>
    </>
  ) : currentUser ? (
    <>
      <button
        onClick={() => handleNavClick('portal')}
        className="cursor-pointer bg-[#4DA528] px-5 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-white transition hover:bg-[#FF970D]"
      >
        My Account
      </button>
      <button
        onClick={onAdminLogout}
        className="cursor-pointer border border-stone-200 px-5 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-stone-900 transition hover:border-[#4DA528] hover:text-[#4DA528]"
      >
        Logout
      </button>
    </>
  ) : (
    <button
      onClick={() => handleNavClick('admin-login')}
      className="cursor-pointer bg-[#4DA528] px-5 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-white transition hover:bg-[#FF970D]"
    >
      Login
    </button>
  );

  return (
    <header className="relative z-50 w-full bg-white font-sans shadow-[0_8px_30px_rgba(0,0,0,0.05)]" id="main-header">
      <div className="hidden border-b border-stone-100 bg-white lg:block">
        <div className="mx-auto flex max-w-[1530px] items-center justify-between px-8 py-3 text-[13px] font-medium text-stone-700">
          <ul className="flex items-center gap-8">
            <li className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#4DA528]" />
              <span>{currentDateLabel}</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#4DA528]" />
              <span>{websiteCMS.footerEmail}</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#4DA528]" />
              <span>{websiteCMS.footerPhone}</span>
            </li>
          </ul>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">{preferenceControls}</div>
            <a href="/contact" onClick={(event) => { event.preventDefault(); handleNavClick('contact'); }} className="flex cursor-pointer items-center gap-2 font-bold text-[#4DA528] transition hover:text-[#FF970D]">
              <Compass className="h-4 w-4" />
              <span>Booking Now</span>
            </a>
            <div className="flex items-center gap-3 text-stone-500">
              {socialDots.length > 0 && <span>Follow Us :</span>}
              {socialDots.map((item) => (
                <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className={`h-2 w-2 rounded-full ${item.className}`} aria-label={item.label} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-0 top-0 hidden h-full w-48 rounded-r-full bg-[#4DA528]/10 lg:block" />
        <div className="mx-auto flex h-[88px] max-w-[1530px] items-center justify-between gap-3 px-4 sm:h-[92px] sm:px-6 lg:px-8 xl:pl-[120px]">
          <a
            href="/"
            onClick={(event) => { event.preventDefault(); handleNavClick('home'); }}
            className="group flex cursor-pointer items-center gap-3"
            id="logo-container"
          >
            <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#4DA528] p-2 text-white shadow-[0_12px_28px_rgba(77,165,40,0.28)] transition group-hover:bg-[#FF970D]">
              {logoMark}
            </span>
            <span className="text-left">
              <span className="block text-[18px] font-extrabold leading-none text-stone-950 sm:text-2xl">{companyName}</span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.24em] text-[#4DA528] sm:text-[11px]">{companyTagline}</span>
            </span>
          </a>

          <nav className="hidden items-center gap-8 lg:flex" id="desktop-nav">
            {navItems.map((item) => (
              <a
                key={item.view}
                href={getViewHref(item.view)}
                onClick={(event) => { event.preventDefault(); handleNavClick(item.view); }}
                className={`relative cursor-pointer py-9 text-[15px] font-semibold transition ${
                  currentView === item.view ? 'text-[#4DA528]' : 'text-stone-900 hover:text-[#4DA528]'
                }`}
              >
                {item.label}
                {currentView === item.view && (
                  <span className="absolute inset-x-0 bottom-6 h-[3px] rounded-full bg-[#4DA528]" />
                )}
              </a>
            ))}
            <a href="/contact" onClick={(event) => { event.preventDefault(); handleNavClick('contact'); }} className="cursor-pointer py-9 text-[15px] font-semibold text-stone-900 transition hover:text-[#4DA528]">
              Contact
            </a>
          </nav>

          <div className="hidden items-center gap-5 lg:flex">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 text-stone-900 transition hover:border-[#4DA528] hover:text-[#4DA528]"
              type="button"
              aria-label="Search packages and destinations"
            >
              <Search className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3">{dashboardButton}</div>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="rounded-full border border-stone-200 bg-white p-2 text-stone-800 shadow-sm transition hover:border-[#4DA528] hover:text-[#4DA528]"
              type="button"
              aria-label="Search packages and destinations"
            >
              <Search className="h-5 w-5" />
            </button>
            {(isAdminLoggedIn || currentUser) && (
              <a
                href={isAdminLoggedIn ? '/admin-dashboard' : '/portal'}
                onClick={(event) => { event.preventDefault(); handleNavClick(isAdminLoggedIn ? 'admin-dashboard' : 'portal'); }}
                className="rounded-full bg-[#4DA528]/10 p-2 text-[#4DA528] ring-1 ring-[#4DA528]/15"
                title={isAdminLoggedIn ? 'Admin Dashboard' : 'My Dashboard'}
              >
                {isAdminLoggedIn ? <ShieldAlert className="h-5 w-5" /> : <UserCircle className="h-5 w-5" />}
              </a>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="rounded-full border border-stone-200 bg-white p-2 text-stone-800 shadow-sm transition hover:border-[#4DA528] hover:text-[#4DA528] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DA528]/35 focus-visible:ring-offset-2"
              id="mobile-menu-btn"
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="space-y-2 border-t border-stone-100 bg-white px-4 pb-6 pt-4 shadow-[0_18px_36px_rgba(18,38,32,0.08)] lg:hidden" id="mobile-nav-drawer">
          {navItems.map((item) => (
            <a
              key={item.view}
              href={getViewHref(item.view)}
              onClick={(event) => { event.preventDefault(); handleNavClick(item.view); }}
              className={`block w-full px-4 py-3 text-left text-sm font-bold transition-colors ${
                currentView === item.view
                  ? 'bg-[#4DA528] text-white'
                  : 'text-stone-800 hover:bg-stone-50 hover:text-[#4DA528]'
              }`}
            >
              {item.label}
            </a>
          ))}
          <div className="grid grid-cols-1 gap-2 border-t border-stone-100 px-4 pt-4 sm:grid-cols-2">
            {preferenceControls}
          </div>
          <div className="flex flex-col gap-2 border-t border-stone-100 px-4 pt-4">
            {isAdminLoggedIn ? (
              <>
                <a
                  href="/admin-dashboard"
                  onClick={(event) => { event.preventDefault(); handleNavClick('admin-dashboard'); }}
                  className="w-full bg-[#4DA528] py-3 text-center text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-[#FF970D]"
                >
                  Admin Dashboard
                </a>
                <button
                  onClick={() => {
                    onAdminLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full bg-stone-900 py-3 text-center text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-stone-800"
                >
                  Logout
                </button>
              </>
            ) : currentUser ? (
              <>
                <a
                  href="/portal"
                  onClick={(event) => { event.preventDefault(); handleNavClick('portal'); }}
                  className="w-full bg-[#4DA528] py-3 text-center text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-[#FF970D]"
                >
                  My Account
                </a>
                <button
                  onClick={() => {
                    onAdminLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full bg-stone-900 py-3 text-center text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-stone-800"
                >
                  Logout
                </button>
              </>
            ) : (
              <a
                href="/admin-login"
                onClick={(event) => { event.preventDefault(); handleNavClick('admin-login'); }}
                className="w-full bg-[#4DA528] py-3 text-center text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-[#FF970D]"
              >
                Login
              </a>
            )}
          </div>
        </div>
      )}

      {isSearchOpen && (
        <GlobalSearch
          packages={packages}
          onNavigate={(view, packageId) => {
            setIsSearchOpen(false);
            onNavigate(view, packageId);
          }}
          onClose={() => setIsSearchOpen(false)}
        />
      )}
    </header>
  );
}
