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
    <header className="sticky top-0 z-50 bg-[#f8f7f4]/95 backdrop-blur-md border-b border-stone-200 shadow-sm" id="main-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div 
            onClick={() => handleNavClick('home')} 
            className="flex items-center gap-3 cursor-pointer group"
            id="logo-container"
          >
            <div className="w-10 h-10 bg-[#008080] rounded-full flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-all duration-300">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#008080] leading-none uppercase">
                Pravaah <span className="font-light text-[#333333]">Travels</span>
              </h1>
              <p className="text-[9px] text-[#F4C430] font-bold tracking-[0.3em] uppercase mt-1">
                Flow into journeys
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6" id="desktop-nav">
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => handleNavClick(item.view)}
                className={`text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-200 relative py-1 hover:text-[#008080] cursor-pointer ${
                  currentView === item.view
                    ? 'text-[#008080]'
                    : 'text-[#333333]'
                }`}
              >
                {item.label}
                {currentView === item.view && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#F4C430]" />
                )}
              </button>
            ))}

            {/* Admin/Customer Dashboard Quick Link or Login */}
            {isAdminLoggedIn ? (
              <div className="flex items-center gap-3 pl-4 border-l border-stone-200">
                <button
                  onClick={() => handleNavClick('admin-dashboard')}
                  className="px-4 py-2 bg-[#008080] text-white hover:bg-[#006666] text-[10px] font-bold uppercase tracking-wider rounded transition-all duration-200 shadow-sm cursor-pointer"
                >
                  Admin Panel
                </button>
                <button
                  onClick={onAdminLogout}
                  className="px-4 py-2 bg-[#333333] text-white hover:bg-stone-800 text-[10px] font-bold uppercase tracking-wider rounded transition-all duration-200 cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : currentUser ? (
              <div className="flex items-center gap-3 pl-4 border-l border-stone-200">
                <button
                  onClick={() => handleNavClick('portal')}
                  className="px-4 py-2 bg-[#008080] text-white hover:bg-[#006666] text-[10px] font-bold uppercase tracking-wider rounded transition-all duration-200 shadow-sm cursor-pointer"
                >
                  My Dashboard
                </button>
                <button
                  onClick={onAdminLogout}
                  className="px-4 py-2 bg-[#333333] text-white hover:bg-stone-800 text-[10px] font-bold uppercase tracking-wider rounded transition-all duration-200 cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNavClick('admin-login')}
                className="px-4 py-2 border border-[#008080] text-[#008080] hover:bg-[#008080] hover:text-white text-[10px] font-bold uppercase tracking-wider rounded transition-all duration-200 cursor-pointer"
              >
                Login / Signup
              </button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {isAdminLoggedIn && (
              <button
                onClick={() => handleNavClick('admin-dashboard')}
                className="p-2 text-[#008080] bg-teal-50 rounded-lg hover:bg-teal-100"
                title="Admin Dashboard"
              >
                <ShieldAlert className="w-5 h-5" />
              </button>
            )}
            {currentUser && !isAdminLoggedIn && (
              <button
                onClick={() => handleNavClick('portal')}
                className="p-2 text-[#008080] bg-teal-50 rounded-lg hover:bg-teal-100"
                title="My Dashboard"
              >
                <ShieldAlert className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-stone-600 hover:text-stone-900 focus:outline-none"
              id="mobile-menu-btn"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#f8f7f4] border-b border-stone-200 shadow-inner px-4 pt-2 pb-6 space-y-2" id="mobile-nav-drawer">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => handleNavClick(item.view)}
              className={`block w-full text-left px-4 py-3 rounded text-xs font-bold uppercase tracking-wider transition-colors ${
                currentView === item.view
                  ? 'bg-[#008080]/10 text-[#008080]'
                  : 'text-[#333333] hover:bg-stone-100'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-4 border-t border-stone-200 px-4 flex flex-col gap-2">
            {isAdminLoggedIn ? (
              <>
                <button
                  onClick={() => handleNavClick('admin-dashboard')}
                  className="w-full text-center py-2.5 bg-[#008080] hover:bg-[#006666] text-white font-bold uppercase tracking-wider text-xs rounded transition-all"
                >
                  Go to Admin Dashboard
                </button>
                <button
                  onClick={() => {
                    onAdminLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-center py-2.5 bg-[#333333] hover:bg-stone-800 text-white font-bold uppercase tracking-wider text-xs rounded transition-all"
                >
                  Logout
                </button>
              </>
            ) : currentUser ? (
              <>
                <button
                  onClick={() => handleNavClick('portal')}
                  className="w-full text-center py-2.5 bg-[#008080] hover:bg-[#006666] text-white font-bold uppercase tracking-wider text-xs rounded transition-all"
                >
                  Go to My Dashboard
                </button>
                <button
                  onClick={() => {
                    onAdminLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-center py-2.5 bg-[#333333] hover:bg-stone-800 text-white font-bold uppercase tracking-wider text-xs rounded transition-all"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => handleNavClick('admin-login')}
                className="w-full text-center py-2.5 border border-[#008080] text-[#008080] hover:bg-[#008080] hover:text-white font-bold uppercase tracking-wider text-xs rounded transition-all"
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
