/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ChevronDown, Compass, Mountain, Shield, Calendar, ArrowRight, Sparkles, Share2 } from 'lucide-react';
import { ROOPKUND_PACKAGE } from '../data/roopkundData';

interface RoopkundHeroProps {
  onExploreTrail: () => void;
  onOpenEnquiry: () => void;
  onOpenShare?: () => void;
}

export const RoopkundHero: React.FC<RoopkundHeroProps> = ({ onExploreTrail, onOpenEnquiry, onOpenShare }) => {
  const [scrollY, setScrollY] = useState(0);
  const heroImageSrc = ROOPKUND_PACKAGE.heroImage || '/images/roopkund/mount-trishul.jpg';

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-[#0B131F] text-white">
      {/* Cinematic High-Altitude Mountain Environment with Layered Atmospheric Depth */}
      <div
        className="absolute inset-0 bg-cover bg-center will-change-transform scale-105 transition-transform duration-1000 ease-out"
        style={{
          backgroundImage: `url('${heroImageSrc}')`,
          backgroundColor: '#0B131F',
          transform: `translateY(${scrollY * 0.25}px) scale(1.05)`,
        }}
      />

      {/* Atmospheric Mist, Gradient Vignette & Dark Overlay Layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#09110D]/85 via-[#0B131F]/55 to-[#0B131F]" />
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#09110D]/40 to-[#09110D]/90" />

      {/* Subtle Mist Particle / Topographic Grid Lines Overlay */}
      <div className="absolute inset-0 bg-dark-noise opacity-30 mix-blend-overlay pointer-events-none" />

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36 lg:pt-44 pb-12 flex-1 flex flex-col justify-center items-center text-center">
        
        {/* Editorial Top Field Metadata Strip */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] sm:text-xs font-oswald tracking-[0.25em] text-[#E5C378] uppercase mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom-3 duration-700">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E5C378] animate-pulse" />
            <span>ROOPKUND • UTTARAKHAND • INDIA</span>
          </div>
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/70">
            <Compass className="w-3 h-3 text-[#E5C378]" />
            <span>30°15′36″ N • 79°43′48″ E</span>
          </div>
        </div>

        {/* Primary Hero Headlines */}
        <h1 className="font-playfair text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-[0.04em] text-white uppercase max-w-5xl leading-[1.08] drop-shadow-2xl">
          THE MYSTERY <span className="text-[#E5C378]">TRAIL</span>
        </h1>

        <p className="mt-4 sm:mt-6 text-lg sm:text-2xl md:text-3xl font-garamond italic text-white/90 max-w-3xl tracking-wide font-normal">
          Explore the unseen with Pravaah Travels.
        </p>

        <p className="mt-4 sm:mt-6 text-xs sm:text-sm md:text-base font-nunito text-white/80 max-w-2xl font-light leading-relaxed text-pretty">
          High in the Garhwal Himalayas lies Roopkund — a remote glacial lake surrounded by dramatic mountains and one of the Himalayas’ most intriguing archaeological mysteries.
        </p>

        {/* Expedition Telemetry Badges - Bespoke Archival Ledger */}
        <div className="mt-8 sm:mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full max-w-3xl">
          <div className="relative p-3.5 sm:p-4 rounded-xl bg-black/45 backdrop-blur-md border border-white/15 text-left group hover:border-[#E5C378]/50 transition-colors">
            <div className="absolute top-2 right-2 text-[8px] font-oswald text-[#E5C378]/60 uppercase">01</div>
            <div className="text-[10px] font-oswald tracking-widest text-[#E5C378] uppercase">MAX ALTITUDE</div>
            <div className="text-base sm:text-lg font-oswald font-bold text-white mt-0.5 tracking-wider">~15,750 FT</div>
            <div className="text-[11px] font-nunito text-white/60">4,800m Glacial Basin</div>
          </div>
          
          <div className="relative p-3.5 sm:p-4 rounded-xl bg-black/45 backdrop-blur-md border border-white/15 text-left group hover:border-[#E5C378]/50 transition-colors">
            <div className="absolute top-2 right-2 text-[8px] font-oswald text-[#E5C378]/60 uppercase">02</div>
            <div className="text-[10px] font-oswald tracking-widest text-[#E5C378] uppercase">DURATION</div>
            <div className="text-base sm:text-lg font-oswald font-bold text-white mt-0.5 tracking-wider">{ROOPKUND_PACKAGE.duration.toUpperCase()}</div>
            <div className="text-[11px] font-nunito text-white/60">Rishikesh to Rishikesh</div>
          </div>

          <div className="relative p-3.5 sm:p-4 rounded-xl bg-black/45 backdrop-blur-md border border-white/15 text-left group hover:border-[#E5C378]/50 transition-colors">
            <div className="absolute top-2 right-2 text-[8px] font-oswald text-[#E5C378]/60 uppercase">03</div>
            <div className="text-[10px] font-oswald tracking-widest text-[#E5C378] uppercase">TERRAIN</div>
            <div className="text-base sm:text-lg font-oswald font-bold text-white mt-0.5 tracking-wider">BUGYALS & ICE</div>
            <div className="text-[11px] font-nunito text-white/60">Forest to Glacial Moraine</div>
          </div>

          <div className="relative p-3.5 sm:p-4 rounded-xl bg-black/45 backdrop-blur-md border border-white/15 text-left group hover:border-[#E5C378]/50 transition-colors">
            <div className="absolute top-2 right-2 text-[8px] font-oswald text-[#E5C378]/60 uppercase">04</div>
            <div className="text-[10px] font-oswald tracking-widest text-[#E5C378] uppercase">EXPEDITION TYPE</div>
            <div className="text-base sm:text-lg font-oswald font-bold text-white mt-0.5 tracking-wider">ARCHAEOLOGY</div>
            <div className="text-[11px] font-nunito text-white/60">9th-Century Glacial Tarn</div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
          <button
            onClick={onOpenEnquiry}
            className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#134E35] hover:bg-[#185F41] text-white text-xs font-raleway font-bold tracking-[0.2em] uppercase transition-all duration-300 shadow-xl hover:scale-105 active:scale-95 border border-emerald-400/40 cursor-pointer"
          >
            START YOUR EXPEDITION
          </button>
          
          <button
            onClick={onExploreTrail}
            className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-raleway font-bold tracking-[0.2em] uppercase transition-all duration-300 border border-white/25 flex items-center justify-center gap-2 group hover:scale-105 cursor-pointer"
          >
            <span>EXPLORE THE TRAIL</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-[#E5C378]" />
          </button>

          {onOpenShare && (
            <button
              onClick={onOpenShare}
              className="w-full sm:w-auto px-5 py-3.5 rounded-full bg-white/5 hover:bg-white/15 backdrop-blur-md text-white/90 hover:text-white text-xs font-raleway font-bold tracking-wider uppercase transition-all duration-300 border border-white/15 flex items-center justify-center gap-2 cursor-pointer"
              title="Share Expedition Link"
            >
              <Share2 className="w-3.5 h-3.5 text-[#E5C378]" />
              <span>SHARE</span>
            </button>
          )}
        </div>
      </div>

      {/* Subtle Scroll Indicator */}
      <div className="relative z-10 pb-8 flex flex-col items-center justify-center text-center">
        <button
          onClick={onExploreTrail}
          className="group flex flex-col items-center gap-2 text-white/60 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
        >
          <span className="text-[10px] font-oswald tracking-[0.3em] uppercase text-white/80 group-hover:text-[#E5C378]">
            BEGIN THE TRAIL
          </span>
          <ChevronDown className="w-4 h-4 animate-bounce text-[#E5C378]" />
        </button>
      </div>

      {/* Bottom Subtle Gradient Transition to Dark Mystery Section */}
      <div className="h-16 w-full bg-gradient-to-b from-transparent to-[#0B131F]" />
    </section>
  );
};

export default RoopkundHero;
