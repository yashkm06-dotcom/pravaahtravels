import { Compass, Mail, Phone, MapPin, Shield } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string, packageId?: string | null) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-stone-900 text-white pt-16 pb-8 border-t border-stone-800" id="main-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Brand Column */}
        <div className="space-y-4">
          <div 
            onClick={() => onNavigate('home')} 
            className="flex items-center gap-3 cursor-pointer group w-fit"
            id="footer-logo"
          >
            <div className="w-9 h-9 bg-[#008080] rounded-sm flex items-center justify-center text-stone-900 font-bold shadow-md group-hover:scale-102 transition-transform">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-normal tracking-tight text-white">
                Pravaah <span className="text-[#008080]">Travels</span>
              </h2>
              <p className="text-[9px] text-[#F4C430] font-bold tracking-[0.2em] uppercase">
                Flow into journeys
              </p>
            </div>
          </div>
          <p className="text-stone-400 text-xs leading-relaxed font-light">
            Crafting hand-picked, premium holidays for families, friends, and solo travelers. Flow with us into journeys that rejuvenate the soul.
          </p>
        </div>

        {/* Quick Links Column */}
        <div>
          <h3 className="text-xs font-bold text-[#F4C430] uppercase tracking-wider mb-6">
            Quick Navigation
          </h3>
          <ul className="space-y-3 text-stone-400 text-xs font-light">
            <li>
              <button 
                onClick={() => onNavigate('home')} 
                className="hover:text-white hover:underline transition cursor-pointer text-left"
              >
                Home
              </button>
            </li>
            <li>
              <button 
                onClick={() => onNavigate('destinations')} 
                className="hover:text-white hover:underline transition cursor-pointer text-left"
              >
                Destinations
              </button>
            </li>
            <li>
              <button 
                onClick={() => onNavigate('packages')} 
                className="hover:text-white hover:underline transition cursor-pointer text-left"
              >
                Curated Packages
              </button>
            </li>
            <li>
              <button 
                onClick={() => onNavigate('gallery')} 
                className="hover:text-white hover:underline transition cursor-pointer text-left"
              >
                Media Gallery
              </button>
            </li>
            <li>
              <button 
                onClick={() => onNavigate('about')} 
                className="hover:text-white hover:underline transition cursor-pointer text-left"
              >
                About Our Vision
              </button>
            </li>
          </ul>
        </div>

        {/* Categories Column */}
        <div>
          <h3 className="text-xs font-bold text-[#F4C430] uppercase tracking-wider mb-6">
            Travel Styles
          </h3>
          <ul className="space-y-3 text-stone-400 text-xs font-light">
            <li>
              <button 
                onClick={() => onNavigate('packages')} 
                className="hover:text-white hover:underline transition cursor-pointer text-left"
              >
                Mountain Treks & Peaks
              </button>
            </li>
            <li>
              <button 
                onClick={() => onNavigate('packages')} 
                className="hover:text-white hover:underline transition cursor-pointer text-left"
              >
                Coastal Sun & Sand Retreats
              </button>
            </li>
            <li>
              <button 
                onClick={() => onNavigate('packages')} 
                className="hover:text-white hover:underline transition cursor-pointer text-left"
              >
                UNESCO Heritage Expeditions
              </button>
            </li>
            <li>
              <button 
                onClick={() => onNavigate('packages')} 
                className="hover:text-white hover:underline transition cursor-pointer text-left"
              >
                Scenic Honeymoon Getaways
              </button>
            </li>
            <li>
              <button 
                onClick={() => onNavigate('packages')} 
                className="hover:text-white hover:underline transition cursor-pointer text-left"
              >
                Weekend Refresh Trips
              </button>
            </li>
          </ul>
        </div>

        {/* Contact Info Column */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-[#F4C430] uppercase tracking-wider mb-2">
            Connect With Us
          </h3>
          <ul className="space-y-4 text-stone-400 text-xs font-light">
            <li className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[#008080] shrink-0 mt-0.5" />
              <span>402, Signature Towers, Sector 30, Gurugram, HR - 122001, India</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-[#008080] shrink-0" />
              <a href="tel:+919876543210" className="hover:text-white transition">+91 98765 43210</a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-[#008080] shrink-0" />
              <a href="mailto:info@pravaahtravels.com" className="hover:text-white transition">info@pravaahtravels.com</a>
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-stone-800 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-stone-500 font-light">
        <p>© {currentYear} Pravaah Travels Private Limited. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => onNavigate('admin-login')} 
            className="flex items-center gap-1.5 hover:text-[#F4C430] transition text-stone-500 font-medium cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Gateway</span>
          </button>
          <span className="text-stone-800">|</span>
          <span>Terms of Service</span>
          <span className="text-stone-800">|</span>
          <span>Privacy Policy</span>
        </div>
      </div>
    </footer>
  );
}
