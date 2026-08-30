/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Mountain, Compass } from 'lucide-react';

interface TrailMilestone {
  sectionId: string;
  name: string;
  altitude: string;
  percentage: number;
}

const MILESTONES: TrailMilestone[] = [
  { sectionId: 'hero', name: 'Expedition Preview', altitude: 'DETAILS TBC', percentage: 0 },
  { sectionId: 'mystery', name: 'The Mystery & Context', altitude: 'UNDER REVIEW', percentage: 10 },
  { sectionId: 'why-roopkund', name: 'Trail Highlights', altitude: 'UNDER REVIEW', percentage: 20 },
  { sectionId: 'expedition-route', name: 'Expedition Pipeline', altitude: 'ROUTE TBC', percentage: 32 },
  { sectionId: 'places', name: 'Places & Stages', altitude: 'ROUTE TBC', percentage: 44 },
  { sectionId: 'itinerary', name: 'Expedition Chapters', altitude: 'PLAN TBC', percentage: 55 },
  { sectionId: 'elevation', name: 'Elevation Profile', altitude: 'ILLUSTRATIVE', percentage: 66 },
  { sectionId: 'experience', name: 'Sensory Chapters', altitude: 'DETAILS TBC', percentage: 76 },
  { sectionId: 'packing', name: 'Expedition Gear', altitude: 'LIST TBC', percentage: 84 },
  { sectionId: 'faq', name: 'Advisory & FAQs', altitude: 'UNDER REVIEW', percentage: 90 },
  { sectionId: 'why-pravaah', name: 'Why Pravaah', altitude: 'DETAILS TBC', percentage: 95 },
  { sectionId: 'booking', name: 'Expedition Enquiry', altitude: 'ENQUIRE', percentage: 100 },
];

export const ScrollProgressIndicator: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [currentMilestone, setCurrentMilestone] = useState<TrailMilestone>(MILESTONES[0]);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) return;

      const currentScroll = window.scrollY;
      const scrollPct = Math.min(Math.max((currentScroll / totalHeight) * 100, 0), 100);
      setProgress(scrollPct);

      setIsScrolling(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 1400);

      // Determine active section / milestone
      const scrollPos = currentScroll + 260;
      for (let i = MILESTONES.length - 1; i >= 0; i--) {
        const milestone = MILESTONES[i];
        const el = document.getElementById(milestone.sectionId);
        if (el && scrollPos >= el.offsetTop) {
          setCurrentMilestone(milestone);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      const stagingOffset = document.querySelector('.roopkund-landing')?.getAttribute('data-staging') === 'true' ? 24 : 0;
      const headerOffset = 65 + stagingOffset;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const showTelemetryPill = (isScrolling || isHovered) && progress > 3;

  return (
    <div
      className="roopkund-scroll-progress fixed top-0 left-0 right-0 z-[100] group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-hidden="true"
    >
      {/* Background Track */}
      <div className="w-full h-[3px] bg-black/40 backdrop-blur-sm relative overflow-hidden">
        {/* Fill Bar with High-Altitude Gradient */}
        <div
          className="h-full bg-gradient-to-r from-[#134E35] via-[#1E7450] to-[#E5C378] transition-[width] duration-100 ease-out relative"
          style={{ width: `${progress}%` }}
        >
          {/* Subtle Leading Spark / Edge Glow */}
          <div className="absolute top-0 right-0 bottom-0 w-3 bg-[#E5C378] shadow-[0_0_8px_#E5C378] rounded-full opacity-90" />
        </div>
      </div>

      {/* Discreet, Elegant Floating Telemetry Pill */}
      <div
        className={`roopkund-progress-telemetry fixed top-3 right-4 sm:right-8 transition-all duration-300 pointer-events-auto ${
          showTelemetryPill
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#0D1812]/95 text-white backdrop-blur-md border border-[#253D30] shadow-xl">
          <div className="flex items-center gap-1.5 text-[#E5C378]">
            <Mountain className="w-3.5 h-3.5" />
            <span className="text-[10px] font-oswald tracking-widest uppercase font-bold">
              {currentMilestone.altitude}
            </span>
          </div>

          <div className="w-[1px] h-3 bg-white/20" />

          <span className="text-[11px] font-nunito text-white/80 font-medium truncate max-w-[130px] sm:max-w-[200px]">
            {currentMilestone.name}
          </span>

          <div className="w-[1px] h-3 bg-white/20" />

          <span className="text-[10px] font-oswald text-[#E5C378] tracking-wider font-semibold">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {/* Interactive Milestone Tick marks when hovered */}
      {isHovered && (
        <div className="absolute top-[3px] left-0 right-0 bg-[#0D1812]/95 border-b border-[#253D30] backdrop-blur-md px-4 py-2 hidden md:flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-200 shadow-2xl">
          <div className="flex items-center gap-2 text-[10px] font-oswald tracking-[0.2em] text-[#E5C378] uppercase">
            <Compass className="w-3.5 h-3.5" />
            <span>EXPEDITION PAGE TIMELINE</span>
          </div>

          <div className="flex items-center gap-4">
            {MILESTONES.slice(1, 9).map((m) => (
              <button
                key={m.sectionId}
                onClick={() => scrollToSection(m.sectionId)}
                className={`text-[10px] font-nunito transition-colors ${
                  currentMilestone.sectionId === m.sectionId
                    ? 'text-[#E5C378] font-bold underline underline-offset-4'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>

          <div className="text-[10px] font-oswald text-white/40 tracking-wider">
            {Math.round(progress)}% EXPLORED
          </div>
        </div>
      )}
    </div>
  );
};

export default ScrollProgressIndicator;
