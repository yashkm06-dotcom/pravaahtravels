import { useState } from 'react';
import { CalendarDays, Compass, Mail, Menu, Phone, Search, ShieldAlert, UserCircle, X } from 'lucide-react';
import { WebsiteCMSSettings } from '../types';
import { handleTravelImageError } from '../utils/imageFallback';
import { resolveBusinessProfile } from '../utils/businessProfile';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, packageId?: string | null) => void;
  isAdminLoggedIn: boolean;
  currentUser: any;
  onAdminLogout: () => void;
  websiteCMS: WebsiteCMSSettings;
}

export default function Header({
  currentView,
  onNavigate,
  isAdminLoggedIn,
  currentUser,
  onAdminLogout,
  websiteCMS,
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const business = resolveBusinessProfile(websiteCMS);

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
    { label: 'Destinations', view: 'destinations' },
    { label: 'Packages', view: 'packages' },
    { label: 'Gallery', view: 'gallery' },
    { label: 'About Us', view: 'about' },
  ];

  const handleNavClick = (view: string) => {
    onNavigate(view);
    setIsMenuOpen(false);
  };

  const currentDateLabel = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const logoMark = business.logoUrl ? (
    <img src={business.logoUrl} alt={`${business.companyName} logo`} className="h-full w-full object-contain" referrerPolicy="no-referrer" onError={handleTravelImageError} />
  ) : (
    <Compass className="h-7 w-7" />
  );

  const socialDots = [
    { href: business.socialLinks.find((item) => item.label === 'Facebook')?.href, label: 'Facebook', className: 'bg-[#4DA528]' },
    { href: business.socialLinks.find((item) => item.label === 'Instagram')?.href, label: 'Instagram', className: 'bg-[#FF970D]' },
    { href: business.socialLinks.find((item) => item.label === 'LinkedIn')?.href, label: 'LinkedIn', className: 'bg-stone-900' },
  ].filter((item) => isValidSocialUrl(item.href));

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
              <span>{business.email}</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#4DA528]" />
              <span>{business.phone}</span>
            </li>
          </ul>
          <div className="flex items-center gap-7">
            <button onClick={() => handleNavClick('contact')} className="flex cursor-pointer items-center gap-2 font-bold text-[#4DA528] transition hover:text-[#FF970D]">
              <Compass className="h-4 w-4" />
              <span>Booking Now</span>
            </button>
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
          <button
            type="button"
            onClick={() => handleNavClick('home')}
            className="group flex cursor-pointer items-center gap-3"
            id="logo-container"
          >
            <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#4DA528] p-2 text-white shadow-[0_12px_28px_rgba(77,165,40,0.28)] transition group-hover:bg-[#FF970D]">
              {logoMark}
            </span>
            <span className="text-left">
              <span className="block text-[18px] font-extrabold leading-none text-stone-950 sm:text-2xl">{business.companyName}</span>
            </span>
          </button>

          <nav className="hidden items-center gap-8 lg:flex" id="desktop-nav">
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => handleNavClick(item.view)}
                className={`relative cursor-pointer py-9 text-[15px] font-semibold transition ${
                  currentView === item.view ? 'text-[#4DA528]' : 'text-stone-900 hover:text-[#4DA528]'
                }`}
              >
                {item.label}
                {currentView === item.view && (
                  <span className="absolute inset-x-0 bottom-6 h-[3px] rounded-full bg-[#4DA528]" />
                )}
              </button>
            ))}
            <button onClick={() => handleNavClick('contact')} className="cursor-pointer py-9 text-[15px] font-semibold text-stone-900 transition hover:text-[#4DA528]">
              Contact
            </button>
          </nav>

          <div className="hidden items-center gap-5 lg:flex">
            <button className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 text-stone-900 transition hover:border-[#4DA528] hover:text-[#4DA528]" type="button">
              <Search className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3">{dashboardButton}</div>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            {(isAdminLoggedIn || currentUser) && (
              <button
                onClick={() => handleNavClick(isAdminLoggedIn ? 'admin-dashboard' : 'portal')}
                className="rounded-full bg-[#4DA528]/10 p-2 text-[#4DA528] ring-1 ring-[#4DA528]/15"
                title={isAdminLoggedIn ? 'Admin Dashboard' : 'My Dashboard'}
              >
                {isAdminLoggedIn ? <ShieldAlert className="h-5 w-5" /> : <UserCircle className="h-5 w-5" />}
              </button>
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
            <button
              key={item.view}
              onClick={() => handleNavClick(item.view)}
              className={`block w-full px-4 py-3 text-left text-sm font-bold transition-colors ${
                currentView === item.view
                  ? 'bg-[#4DA528] text-white'
                  : 'text-stone-800 hover:bg-stone-50 hover:text-[#4DA528]'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="flex flex-col gap-2 border-t border-stone-100 px-4 pt-4">
            {isAdminLoggedIn ? (
              <>
                <button
                  onClick={() => handleNavClick('admin-dashboard')}
                  className="w-full bg-[#4DA528] py-3 text-center text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-[#FF970D]"
                >
                  Admin Dashboard
                </button>
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
                <button
                  onClick={() => handleNavClick('portal')}
                  className="w-full bg-[#4DA528] py-3 text-center text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-[#FF970D]"
                >
                  My Account
                </button>
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
              <button
                onClick={() => handleNavClick('admin-login')}
                className="w-full bg-[#4DA528] py-3 text-center text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-[#FF970D]"
              >
                Login
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
