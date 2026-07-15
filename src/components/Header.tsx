import { useState } from 'react';
import { Compass, Menu, X, ShieldAlert } from 'lucide-react';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, packageId?: string | null) => void;
  isAdminLoggedIn: boolean;
  currentUser: any;
  onAdminLogout: () => void;
}

export default function Header({
  currentView,
  onNavigate,
  isAdminLoggedIn,
  currentUser,
  onAdminLogout,
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-[#fffaf1]/92 shadow-[0_16px_40px_rgba(18,38,32,0.08)] backdrop-blur-xl" id="main-header">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-6">
          {/* Logo */}
          <div 
            onClick={() => handleNavClick('home')} 
            className="group flex cursor-pointer items-center gap-3"
            id="logo-container"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0f766e] text-white shadow-[0_12px_28px_rgba(15,118,110,0.28)] ring-1 ring-white/70 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:bg-[#0d5f59]">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-[1.35rem] font-extrabold leading-none tracking-tight text-[#123c3c]">
                Pravaah <span className="font-semibold text-[#0f766e]">Travels</span>
              </h1>
              <p className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.3em] text-[#d97706]">
                Flow into journeys
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 rounded-full border border-stone-200/80 bg-white/80 p-1.5 shadow-sm md:flex" id="desktop-nav">
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => handleNavClick(item.view)}
                className={`relative cursor-pointer rounded-full px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.14em] transition-all duration-200 hover:bg-[#f8f0df] hover:text-[#0f766e] ${
                  currentView === item.view
                    ? 'bg-[#123c3c] text-white shadow-[0_8px_18px_rgba(18,60,60,0.18)]'
                    : 'text-stone-600'
                }`}
              >
                {item.label}
                {currentView === item.view && (
                  <span className="absolute inset-x-5 -bottom-1 h-1 rounded-full bg-[#f59e0b]" />
                )}
              </button>
            ))}

            {/* Admin/Customer Dashboard Quick Link or Login */}
            {isAdminLoggedIn ? (
              <div className="ml-2 flex items-center gap-2 border-l border-stone-200 pl-3">
                <button
                  onClick={() => handleNavClick('admin-dashboard')}
                  className="cursor-pointer rounded-full bg-[#0f766e] px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-[0_10px_22px_rgba(15,118,110,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0d5f59]"
                >
                  Admin Panel
                </button>
                <button
                  onClick={onAdminLogout}
                  className="cursor-pointer rounded-full bg-stone-900 px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-stone-800"
                >
                  Logout
                </button>
              </div>
            ) : currentUser ? (
              <div className="ml-2 flex items-center gap-2 border-l border-stone-200 pl-3">
                <button
                  onClick={() => handleNavClick('portal')}
                  className="cursor-pointer rounded-full bg-[#0f766e] px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-[0_10px_22px_rgba(15,118,110,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0d5f59]"
                >
                  My Dashboard
                </button>
                <button
                  onClick={onAdminLogout}
                  className="cursor-pointer rounded-full bg-stone-900 px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-stone-800"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNavClick('admin-login')}
                className="ml-2 cursor-pointer rounded-full border border-[#0f766e]/30 bg-[#0f766e] px-5 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-[0_10px_22px_rgba(15,118,110,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0d5f59]"
              >
                Login / Signup
              </button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            {isAdminLoggedIn && (
              <button
                onClick={() => handleNavClick('admin-dashboard')}
                className="rounded-full bg-teal-50 p-2 text-[#0f766e] ring-1 ring-teal-100 transition hover:bg-teal-100"
                title="Admin Dashboard"
              >
                <ShieldAlert className="w-5 h-5" />
              </button>
            )}
            {currentUser && !isAdminLoggedIn && (
              <button
                onClick={() => handleNavClick('portal')}
                className="rounded-full bg-teal-50 p-2 text-[#0f766e] ring-1 ring-teal-100 transition hover:bg-teal-100"
                title="My Dashboard"
              >
                <ShieldAlert className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="rounded-full border border-stone-200 bg-white p-2 text-stone-700 shadow-sm transition hover:text-[#0f766e] focus:outline-none"
              id="mobile-menu-btn"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMenuOpen && (
        <div className="space-y-2 border-b border-stone-200 bg-[#fffaf1] px-4 pb-6 pt-2 shadow-[0_18px_36px_rgba(18,38,32,0.08)] md:hidden" id="mobile-nav-drawer">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => handleNavClick(item.view)}
              className={`block w-full rounded-2xl px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wider transition-colors ${
                currentView === item.view
                  ? 'bg-[#123c3c] text-white'
                  : 'text-stone-700 hover:bg-white hover:text-[#0f766e]'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="flex flex-col gap-2 border-t border-stone-200 px-4 pt-4">
            {isAdminLoggedIn ? (
              <>
                <button
                  onClick={() => handleNavClick('admin-dashboard')}
                  className="w-full rounded-full bg-[#0f766e] py-3 text-center text-xs font-extrabold uppercase tracking-wider text-white transition-all hover:bg-[#0d5f59]"
                >
                  Go to Admin Dashboard
                </button>
                <button
                  onClick={() => {
                    onAdminLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full rounded-full bg-stone-900 py-3 text-center text-xs font-extrabold uppercase tracking-wider text-white transition-all hover:bg-stone-800"
                >
                  Logout
                </button>
              </>
            ) : currentUser ? (
              <>
                <button
                  onClick={() => handleNavClick('portal')}
                  className="w-full rounded-full bg-[#0f766e] py-3 text-center text-xs font-extrabold uppercase tracking-wider text-white transition-all hover:bg-[#0d5f59]"
                >
                  Go to My Dashboard
                </button>
                <button
                  onClick={() => {
                    onAdminLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full rounded-full bg-stone-900 py-3 text-center text-xs font-extrabold uppercase tracking-wider text-white transition-all hover:bg-stone-800"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => handleNavClick('admin-login')}
                className="w-full rounded-full bg-[#0f766e] py-3 text-center text-xs font-extrabold uppercase tracking-wider text-white transition-all hover:bg-[#0d5f59]"
              >
                Login / Signup
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
