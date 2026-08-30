/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PravaahLogo } from './PravaahLogo';
import { Compass, Phone, Mail, MapPin, MessageSquare, Shield, ArrowUp } from 'lucide-react';
import { useRoopkundIntegration } from '../RoopkundIntegrationContext';

interface FooterProps {
  onOpenShare?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenShare }) => {
  const { business } = useRoopkundIntegration();
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#0D1812] text-white border-t border-[#1C3326] pt-20 pb-12 relative overflow-hidden">
      {/* Background Topographic Texture */}
      <div className="absolute inset-0 bg-dark-noise opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-16 border-b border-[#1C3326]">
          
          {/* Brand Col */}
          <div className="lg:col-span-5 space-y-4">
            <PravaahLogo variant="light" />
            
            <div className="text-sm font-garamond italic text-white/80 max-w-sm">
              “{business.tagline || 'Explore the unseen with Pravaah Travels.'}”
            </div>

            <div className="pt-4 flex flex-col gap-2 text-xs font-oswald tracking-wider text-white/60">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#E5C378]" />
                <span>CONTACT ADDRESS: {business.address || 'Details to be confirmed'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#E5C378]" />
                <span>CONTACT PHONE: {business.phone || 'Details to be confirmed'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#E5C378]" />
                <span>CONTACT EMAIL: {business.email || 'Details to be confirmed'}</span>
              </div>
            </div>
          </div>

          {/* Quick Nav Links */}
          <div className="lg:col-span-3 space-y-3">
            <div className="text-xs font-oswald uppercase tracking-widest text-[#E5C378] font-bold">
              EXPEDITION NAVIGATION
            </div>
            <ul className="space-y-2 text-xs font-nunito text-white/70">
              <li>
                <a href="#hero" className="hover:text-[#E5C378] transition-colors">Overview & Key Facts</a>
              </li>
              <li>
                <a href="#mystery" className="hover:text-[#E5C378] transition-colors">Historical Context Under Review</a>
              </li>
              <li>
                <a href="#why-roopkund" className="hover:text-[#E5C378] transition-colors">Why This Trail</a>
              </li>
              <li>
                <a href="#expedition-route" className="hover:text-[#E5C378] transition-colors">Expedition Route</a>
              </li>
              <li>
                <a href="#itinerary" className="hover:text-[#E5C378] transition-colors">Expedition Journal</a>
              </li>
              <li>
                <a href="#elevation" className="hover:text-[#E5C378] transition-colors">Elevation Profile</a>
              </li>
              <li>
                <a href="#places" className="hover:text-[#E5C378] transition-colors">Key Trail Places</a>
              </li>
            </ul>
          </div>

          {/* Expedition Resources */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-oswald uppercase tracking-widest text-[#E5C378] font-bold">
              PREPARATION & ETHICS
            </div>
            <ul className="space-y-2 text-xs font-nunito text-white/70">
              <li>
                <a href="#packing" className="hover:text-[#E5C378] transition-colors">Gear & Packing Checklist</a>
              </li>
              <li>
                <a href="#inclusions" className="hover:text-[#E5C378] transition-colors">Inclusions & Exclusions Charter</a>
              </li>
              <li>
                <a href="#safety" className="hover:text-[#E5C378] transition-colors">Expedition Safety Review</a>
              </li>
              <li>
                <a href="#faq" className="hover:text-[#E5C378] transition-colors">Expedition Advisory & FAQs</a>
              </li>
              <li>
                <a href="#suitability" className="hover:text-[#E5C378] transition-colors">Expedition Suitability Guide</a>
              </li>
              <li>
                <a href="#why-pravaah" className="hover:text-[#E5C378] transition-colors">The Pravaah Difference</a>
              </li>
              <li>
                <a href="#booking" className="hover:text-[#E5C378] transition-colors">Expedition Enquiry</a>
              </li>
            </ul>

            {onOpenShare && (
              <div className="pt-2">
                <button
                  onClick={onOpenShare}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-[#134E35] text-white text-xs font-oswald font-semibold tracking-wider uppercase border border-white/20 transition-all hover:scale-105"
                >
                  <Compass className="w-3.5 h-3.5 text-[#E5C378]" />
                  <span>SHARE EXPEDITION DOSSIER</span>
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Legal Advisory & Environmental Disclaimer */}
        <div className="py-8 text-[11px] font-nunito text-white/50 space-y-3 leading-relaxed border-b border-[#1C3326]">
          <div className="flex items-center gap-2 text-[#E5C378] font-oswald uppercase font-semibold tracking-wider">
            <Shield className="w-3.5 h-3.5" />
            <span>EXPEDITION INFORMATION NOTICE</span>
          </div>
          <p>
            * Route access, permits, conservation requirements, camp locations and operating conditions are under review and will be confirmed by Pravaah Travels before any expedition is offered.
          </p>
          <p>
            * Duration, difficulty, altitude, trail timings and the final day-wise plan remain subject to factual and operational confirmation. This page does not constitute a booking or operating guarantee.
          </p>
        </div>

        {/* Copyright & Scroll to Top */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-oswald tracking-wider text-white/40">
          <div>
            © {new Date().getFullYear()} {business.companyName.toUpperCase()}. ALL RIGHTS RESERVED. CRAFTED FOR HIMALAYAN PURISTS.
          </div>

          <button
            onClick={scrollToTop}
            className="inline-flex items-center gap-2 hover:text-[#E5C378] transition-colors"
          >
            <span>RETURN TO SUMMIT</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
