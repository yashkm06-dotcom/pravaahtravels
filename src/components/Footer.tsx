import { Compass, Mail, Phone, MapPin, Shield } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string, packageId?: string | null) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-[#24413b] bg-[#102b2a] pt-16 text-white" id="main-footer">
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#f59e0b]/70 to-transparent" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#0f766e]/18 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-56 w-56 rounded-full bg-[#f59e0b]/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
        
        {/* Brand Column */}
        <div className="space-y-5">
          <div 
            onClick={() => onNavigate('home')} 
            className="group flex w-fit cursor-pointer items-center gap-3"
            id="footer-logo"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0f766e] font-bold text-white shadow-[0_12px_30px_rgba(15,118,110,0.28)] ring-1 ring-white/10 transition-transform group-hover:-translate-y-0.5">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-white">
                Pravaah <span className="text-[#7dd3fc]">Travels</span>
              </h2>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.24em] text-[#f59e0b]">
                Flow into journeys
              </p>
            </div>
          </div>
          <p className="max-w-xs text-sm font-light leading-7 text-stone-300">
            Crafting hand-picked, premium holidays for families, friends, and solo travelers. Flow with us into journeys that rejuvenate the soul.
          </p>
        </div>

        {/* Quick Links Column */}
        <div>
          <h3 className="mb-6 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#f59e0b]">
            Quick Navigation
          </h3>
          <ul className="space-y-3 text-sm font-light text-stone-300">
            <li>
              <button 
                onClick={() => onNavigate('home')} 
                className="cursor-pointer text-left transition hover:translate-x-1 hover:text-white"
              >
                Home
              </button>
            </li>
            <li>
              <button 
                onClick={() => onNavigate('destinations')} 
                className="cursor-pointer text-left transition hover:translate-x-1 hover:text-white"
              >
                Destinations
              </button>
            </li>
            <li>
              <button 
                onClick={() => onNavigate('packages')} 
                className="cursor-pointer text-left transition hover:translate-x-1 hover:text-white"
              >
                Curated Packages
              </button>
            </li>
            <li>
              <button 
                onClick={() => onNavigate('gallery')} 
                className="cursor-pointer text-left transition hover:translate-x-1 hover:text-white"
              >
                Media Gallery
              </button>
            </li>
            <li>
              <button 
                onClick={() => onNavigate('about')} 
                className="cursor-pointer text-left transition hover:translate-x-1 hover:text-white"
              >
                About Our Vision
              </button>
            </li>
          </ul>
        </div>

        {/* Categories Column */}
        <div>
          <h3 className="mb-6 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#f59e0b]">
            Travel Styles
          </h3>
          <ul className="space-y-3 text-sm font-light text-stone-300">
            <li>
              <button 
                onClick={() => onNavigate('packages')} 
                className="cursor-pointer text-left transition hover:translate-x-1 hover:text-white"
              >
                Mountain Treks & Peaks
              </button>
            </li>
            <li>
              <button 
                onClick={() => onNavigate('packages')} 
                className="cursor-pointer text-left transition hover:translate-x-1 hover:text-white"
              >
                Coastal Sun & Sand Retreats
              </button>
            </li>
            <li>
              <button 
                onClick={() => onNavigate('packages')} 
                className="cursor-pointer text-left transition hover:translate-x-1 hover:text-white"
              >
                UNESCO Heritage Expeditions
              </button>
            </li>
            <li>
              <button 
                onClick={() => onNavigate('packages')} 
                className="cursor-pointer text-left transition hover:translate-x-1 hover:text-white"
              >
                Scenic Honeymoon Getaways
              </button>
            </li>
            <li>
              <button 
                onClick={() => onNavigate('packages')} 
                className="cursor-pointer text-left transition hover:translate-x-1 hover:text-white"
              >
                Weekend Refresh Trips
              </button>
            </li>
          </ul>
        </div>

        {/* Contact Info Column */}
        <div className="space-y-4">
          <h3 className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#f59e0b]">
            Connect With Us
          </h3>
          <ul className="space-y-4 text-sm font-light text-stone-300">
            <li className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#5eead4]" />
              <span>402, Signature Towers, Sector 30, Gurugram, HR - 122001, India</span>
            </li>
            <li className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <Phone className="h-4 w-4 shrink-0 text-[#5eead4]" />
              <a href="tel:+919876543210" className="transition hover:text-white">+91 98765 43210</a>
            </li>
            <li className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <Mail className="h-4 w-4 shrink-0 text-[#5eead4]" />
              <a href="mailto:info@pravaahtravels.com" className="transition hover:text-white">info@pravaahtravels.com</a>
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="relative mx-auto mt-14 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-white/10 px-4 py-7 text-[11px] font-light text-stone-400 sm:px-6 md:flex-row lg:px-8">
        <p>© {currentYear} Pravaah Travels Private Limited. All rights reserved.</p>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <button 
            onClick={() => onNavigate('admin-login')} 
            className="flex cursor-pointer items-center gap-1.5 font-semibold text-stone-400 transition hover:text-[#f59e0b]"
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Admin Gateway</span>
          </button>
          <span className="text-white/15">|</span>
          <span>Terms of Service</span>
          <span className="text-white/15">|</span>
          <span>Privacy Policy</span>
        </div>
      </div>
    </footer>
  );
}
