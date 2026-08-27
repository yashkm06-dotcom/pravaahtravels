/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowUpRight, Compass, Shield, MapPin, Calendar, FileText, Share2 } from 'lucide-react';
import PravaahLogo from './PravaahLogo';
import AudioAmbiance from './AudioAmbiance';

interface NavbarProps {
  onOpenEnquiry: () => void;
  onOpenBrochure: () => void;
  onOpenShare?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenEnquiry, onOpenBrochure, onOpenShare }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);

      // Section tracking
      const sections = ['mystery', 'why-roopkund', 'expedition-route', 'places', 'itinerary', 'elevation', 'experience', 'packing', 'safety', 'why-pravaah', 'faq'];
      const scrollPos = window.scrollY + 200;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setCurrentSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 70;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const navLinks = [
    { name: 'THE STORY', id: 'mystery' },
    { name: 'ROUTE', id: 'expedition-route' },
    { name: 'SANCTUARIES', id: 'places' },
    { name: 'ITINERARY', id: 'itinerary' },
    { name: 'ELEVATION', id: 'elevation' },
    { name: 'PACKING', id: 'packing' },
    { name: 'SAFETY', id: 'safety' },
    { name: 'FAQS', id: 'faq' },
    { name: 'WHY PRAVAAH', id: 'why-pravaah' },
  ];

  // Check if we are on dark mystery section or hero
  const isDarkNavbar = true;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#0B131F]/95 backdrop-blur-md py-3 border-b border-white/10 shadow-2xl text-white'
            : 'bg-gradient-to-b from-black/80 via-black/30 to-transparent py-5 text-white'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Logo */}
          <div onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <PravaahLogo theme="dark" />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7">
            {navLinks.map((link) => {
              const isActive = currentSection === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className={`text-[11px] xl:text-xs font-raleway tracking-[0.16em] font-semibold transition-all duration-200 uppercase relative py-1 ${
                    isActive
                      ? 'text-[#E5C378] font-bold'
                      : 'text-white/75 hover:text-white'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E5C378] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Suite */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Share Expedition Button */}
            {onOpenShare && (
              <button
                onClick={onOpenShare}
                className="p-2 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 border text-white/90 bg-white/10 hover:bg-white/20 border-white/20"
                title="Share Expedition Dossier"
                aria-label="Share Expedition"
              >
                <Share2 className="w-4 h-4 text-[#E5C378]" />
              </button>
            )}

            {/* Audio Ambiance Synthesizer */}
            <AudioAmbiance theme="dark" />

            {/* Plan Expedition Action Button (Pravaah Brand Forest Green) */}
            <button
              onClick={onOpenEnquiry}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs font-raleway font-bold tracking-wider uppercase transition-all duration-300 bg-[#134E35] hover:bg-[#185F41] text-white active:scale-95 shadow-lg border border-emerald-400/30"
            >
              <span>PLAN YOUR EXPEDITION</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Menu & Audio Toggle */}
          <div className="flex items-center gap-2 lg:hidden">
            {onOpenShare && (
              <button
                onClick={onOpenShare}
                className="p-2 rounded-lg transition-colors text-white hover:bg-white/10"
                aria-label="Share Expedition"
              >
                <Share2 className="w-5 h-5 text-[#E5C378]" />
              </button>
            )}

            <AudioAmbiance theme="dark" />
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg transition-colors text-white hover:bg-white/10"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#0B131F]/98 backdrop-blur-xl flex flex-col justify-between p-6 sm:p-8 pt-20 text-white lg:hidden animate-in fade-in duration-200 overflow-y-auto border-b border-white/10">
          <div className="space-y-3">
            <div className="text-[10px] tracking-[0.3em] uppercase text-[#E5C378] font-oswald border-b border-white/10 pb-2">
              ROOPKUND EXPEDITION • NAVIGATION
            </div>
            <div className="grid grid-cols-1 gap-1.5 pt-1">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg text-left text-sm tracking-[0.15em] font-playfair font-semibold hover:bg-white/10 hover:text-[#E5C378] transition-colors"
                >
                  <span>{link.name}</span>
                  <ArrowUpRight className="w-4 h-4 text-[#E5C378]" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 pt-4 border-t border-white/10">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenEnquiry();
              }}
              className="w-full py-3.5 rounded-xl bg-[#134E35] hover:bg-[#185F41] text-white text-xs font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-2 shadow-lg"
            >
              <span>PLAN YOUR EXPEDITION</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenBrochure();
                }}
                className="w-full py-2.5 rounded-xl border border-white/20 text-white/90 text-[11px] font-semibold tracking-wider uppercase flex items-center justify-center gap-1.5 hover:bg-white/5"
              >
                <FileText className="w-3.5 h-3.5 text-[#E5C378]" />
                <span>GEAR BRIEF</span>
              </button>

              {onOpenShare && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenShare();
                  }}
                  className="w-full py-2.5 rounded-xl border border-white/20 text-white/90 text-[11px] font-semibold tracking-wider uppercase flex items-center justify-center gap-1.5 hover:bg-white/5"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#E5C378]" />
                  <span>SHARE TREK</span>
                </button>
              )}
            </div>
            <div className="text-center text-[10px] text-white/50 tracking-wider font-oswald pt-1">
              PRAVAAH TRAVELS • GARHWAL HIMALAYAS
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
