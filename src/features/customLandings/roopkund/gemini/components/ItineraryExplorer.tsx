/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Mountain, 
  ChevronDown, 
  ChevronUp, 
  Utensils, 
  Home, 
  Sparkles, 
  ArrowRight,
  Compass
} from 'lucide-react';
import { ITINERARY_DAYS } from '../data/roopkundData';
import type { ItineraryDay } from '../types';

interface ItineraryExplorerProps {
  selectedDay?: number;
  onSelectDay?: (dayNumber: number) => void;
}

export const ItineraryExplorer: React.FC<ItineraryExplorerProps> = ({
  selectedDay = 1,
  onSelectDay,
}) => {
  const [openDays, setOpenDays] = useState<{ [day: number]: boolean }>({
    1: true,
    3: true,
    5: true, // Key milestone days open by default (Summit is Day 5)
  });

  useEffect(() => {
    setOpenDays((previous) => ({ ...previous, [selectedDay]: true }));
  }, [selectedDay]);

  const toggleDay = (dayNum: number) => {
    setOpenDays((prev) => ({
      ...prev,
      [dayNum]: !prev[dayNum],
    }));
    if (onSelectDay) onSelectDay(dayNum);
  };

  const expandAll = () => {
    const all: { [day: number]: boolean } = {};
    ITINERARY_DAYS.forEach((d) => (all[d.dayNumber] = true));
    setOpenDays(all);
  };

  const collapseAll = () => {
    setOpenDays({});
  };

  return (
    <section id="itinerary" className="py-24 sm:py-32 bg-[#FAF8F3] text-[#1D2530] relative overflow-hidden border-t border-[#E2DDD3]">
      {/* Background Subtle Texture */}
      <div className="absolute inset-0 bg-noise opacity-40 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#E2DDD3] pb-8 mb-12">
          <div>
            <span className="text-xs font-oswald tracking-[0.25em] text-[#134E35] uppercase font-bold">
              EXPEDITION CHRONICLE • ROUTE DETAILS UNDER REVIEW
            </span>
            <h2 className="font-playfair text-4xl sm:text-5xl md:text-6xl font-bold tracking-[0.03em] uppercase text-[#1D2530] mt-2">
              THE EXPEDITION <span className="text-[#8F4F38]">JOURNAL</span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={expandAll}
              className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-[#F4EFE6] border border-[#E2DDD3] text-[#134E35] text-xs font-oswald uppercase font-semibold transition-colors shadow-sm"
            >
              EXPAND ALL
            </button>
            <button
              onClick={collapseAll}
              className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-[#F4EFE6] border border-[#E2DDD3] text-[#64748B] text-xs font-oswald uppercase font-semibold transition-colors shadow-sm"
            >
              COLLAPSE ALL
            </button>
          </div>
        </div>

        {/* Vertical Timeline / Expedition Chapters */}
        <div className="space-y-6">
          {ITINERARY_DAYS.map((day) => {
            const isOpen = !!openDays[day.dayNumber];
            const isSummitDay = day.dayNumber === 5;

            return (
              <div
                key={day.dayNumber}
                className={`rounded-3xl border transition-all duration-300 overflow-hidden ${
                  isSummitDay
                    ? 'bg-[#0B131F] text-white border-[#C5A880] shadow-xl'
                    : 'bg-white text-[#1D2530] border-[#E2DDD3] shadow-sm hover:shadow-md'
                }`}
              >
                {/* Chapter Header (Always Visible Clickable Area) */}
                <div
                  onClick={() => toggleDay(day.dayNumber)}
                  className={`p-6 sm:p-8 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-colors ${
                    isSummitDay ? 'hover:bg-white/[0.04]' : 'hover:bg-[#FAF8F3]'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-4 sm:gap-6">
                    {/* Day Number Badge */}
                    <div
                      className={`flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shrink-0 font-oswald border ${
                        isSummitDay
                          ? 'bg-[#8F4F38] text-white border-[#C5A880]/40 font-bold shadow-md'
                          : 'bg-[#EAF5EE] text-[#134E35] border-[#134E35]/20 font-bold'
                      }`}
                    >
                      <span className="text-[10px] uppercase tracking-wider">CHAPTER</span>
                      <span className="text-xl sm:text-2xl font-bold leading-none">
                        {String(day.dayNumber).padStart(2, '0')}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-3 text-[10px] sm:text-xs font-oswald uppercase tracking-widest">
                        <span className={isSummitDay ? 'text-[#E5C378]' : 'text-[#8F4F38] font-bold'}>
                          {day.route}
                        </span>
                        {isSummitDay && (
                          <span className="px-2 py-0.5 rounded-full bg-[#E5C378]/20 text-[#E5C378] font-bold text-[9px]">
                            ★ OBJECTIVE REVIEW
                          </span>
                        )}
                      </div>

                      <h3
                        className={`font-playfair text-xl sm:text-2xl lg:text-3xl font-bold tracking-wide uppercase mt-1 ${
                          isSummitDay ? 'text-white' : 'text-[#1D2530]'
                        }`}
                      >
                        {day.title}
                      </h3>
                    </div>
                  </div>

                  {/* Summary Metric Chips & Accordion Toggle */}
                  <div className="flex items-center justify-between lg:justify-end gap-4 sm:gap-6 pt-4 lg:pt-0 border-t lg:border-t-0 border-[#E2DDD3]">
                    <div className="grid grid-cols-2 sm:flex items-center gap-3 text-xs font-oswald">
                      <div className={`px-3 py-1.5 rounded-xl ${isSummitDay ? 'bg-white/10 text-white/90' : 'bg-[#FAF8F3] text-[#4A5568]'}`}>
                        <span className="text-[9px] block text-[#64748B]">DISTANCE</span>
                        <span className="font-semibold">
                          {typeof day.distanceKm === 'number' ? `${day.distanceKm} km` : day.distanceKm}
                        </span>
                      </div>

                      <div className={`px-3 py-1.5 rounded-xl ${isSummitDay ? 'bg-white/10 text-white/90' : 'bg-[#FAF8F3] text-[#4A5568]'}`}>
                        <span className="text-[9px] block text-[#64748B]">TIME</span>
                        <span className="font-semibold">{day.trekkingTime}</span>
                      </div>

                      <div className={`px-3 py-1.5 rounded-xl col-span-2 sm:col-span-1 ${isSummitDay ? 'bg-[#E5C378]/20 text-[#E5C378]' : 'bg-[#EAF5EE] text-[#134E35]'}`}>
                        <span className="text-[9px] block text-[#64748B]">ELEVATION</span>
                        <span className="font-semibold">{day.altitudeEndFeet > 0 ? `${day.altitudeEndFeet.toLocaleString()} FT` : 'TO BE CONFIRMED'}</span>
                      </div>
                    </div>

                    <div className={`p-2 rounded-full ${isSummitDay ? 'bg-white/10 text-white' : 'bg-[#FAF8F3] text-[#134E35]'}`}>
                      {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Chapter Content */}
                {isOpen && (
                  <div className={`p-6 sm:p-8 pt-2 border-t ${isSummitDay ? 'border-white/15' : 'border-[#E2DDD3]'}`}>
                    
                    {/* Key Daily Parameters Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
                      <div className={`p-3.5 rounded-xl ${isSummitDay ? 'bg-white/5' : 'bg-[#FAF8F3] border border-[#E2DDD3]'}`}>
                        <div className="flex items-center gap-1.5 text-[10px] font-oswald text-[#8F4F38] uppercase">
                          <Mountain className="w-3.5 h-3.5 text-[#8F4F38]" />
                          <span>TERRAIN</span>
                        </div>
                        <div className={`text-xs font-nunito font-semibold mt-1 ${isSummitDay ? 'text-white' : 'text-[#1D2530]'}`}>
                          {day.terrain}
                        </div>
                      </div>

                      <div className={`p-3.5 rounded-xl ${isSummitDay ? 'bg-white/5' : 'bg-[#FAF8F3] border border-[#E2DDD3]'}`}>
                        <div className="flex items-center gap-1.5 text-[10px] font-oswald text-[#8F4F38] uppercase">
                          <Home className="w-3.5 h-3.5 text-[#8F4F38]" />
                          <span>OVERNIGHT STAY</span>
                        </div>
                        <div className={`text-xs font-nunito font-semibold mt-1 ${isSummitDay ? 'text-white' : 'text-[#1D2530]'}`}>
                          {day.stay}
                        </div>
                      </div>

                      <div className={`p-3.5 rounded-xl ${isSummitDay ? 'bg-white/5' : 'bg-[#FAF8F3] border border-[#E2DDD3]'}`}>
                        <div className="flex items-center gap-1.5 text-[10px] font-oswald text-[#8F4F38] uppercase">
                          <Utensils className="w-3.5 h-3.5 text-[#8F4F38]" />
                          <span>MEALS PROVIDED</span>
                        </div>
                        <div className={`text-xs font-nunito font-semibold mt-1 ${isSummitDay ? 'text-white' : 'text-[#1D2530]'}`}>
                          {day.meals}
                        </div>
                      </div>

                      <div className={`p-3.5 rounded-xl ${isSummitDay ? 'bg-white/5' : 'bg-[#FAF8F3] border border-[#E2DDD3]'}`}>
                        <div className="flex items-center gap-1.5 text-[10px] font-oswald text-[#134E35] uppercase">
                          <Compass className="w-3.5 h-3.5 text-[#134E35]" />
                          <span>ALTITUDE GAIN</span>
                        </div>
                        <div className={`text-xs font-oswald font-semibold mt-1 ${isSummitDay ? 'text-[#E5C378]' : 'text-[#134E35]'}`}>
                          {day.altitudeGainLossFeet || `${day.altitudeStartFeet} → ${day.altitudeEndFeet} FT`}
                        </div>
                      </div>
                    </div>

                    {/* Detailed Day Narrative & High-Res Photograph */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      
                      {/* Left: What Happens Today Narrative */}
                      <div className="lg:col-span-7 space-y-4">
                        <div className={`text-xs font-oswald uppercase tracking-widest font-bold ${isSummitDay ? 'text-[#E5C378]' : 'text-[#134E35]'}`}>
                          WHAT HAPPENS TODAY
                        </div>

                        <p className={`text-sm sm:text-base font-nunito leading-relaxed ${isSummitDay ? 'text-white/80 font-light' : 'text-[#4A5568]'}`}>
                          {day.description}
                        </p>

                        {/* Daily Highlights Checklist */}
                        <div className="mt-4 space-y-2">
                          <div className={`text-[11px] font-oswald uppercase tracking-wider font-bold ${isSummitDay ? 'text-[#E5C378]' : 'text-[#8F4F38]'}`}>
                            KEY CHAPTER DETAILS:
                          </div>
                          {day.highlights.map((h, i) => (
                            <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm font-nunito">
                              <span className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${isSummitDay ? 'bg-[#E5C378]' : 'bg-[#134E35]'}`} />
                              <span className={isSummitDay ? 'text-white/90' : 'text-[#4A5568]'}>{h}</span>
                            </div>
                          ))}
                        </div>

                        {day.altitudeNote && (
                          <div className={`mt-4 p-3 rounded-xl border text-xs font-nunito ${isSummitDay ? 'bg-white/10 border-white/20 text-[#E5C378]' : 'bg-[#FAF8F3] border-[#E2DDD3] text-[#8F4F38]'}`}>
                            ⚠️ EXPEDITION NOTE: {day.altitudeNote}
                          </div>
                        )}
                      </div>

                      {/* Right: Visual Photography Card with Archival Mount Frame */}
                      <div className="lg:col-span-5 relative group">
                        <div className="relative p-1.5 rounded-2xl bg-white/[0.04] border border-[#E2DDD3] shadow-md overflow-hidden">
                          {/* Archival corner crop markers */}
                          <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[#E5C378]/80 pointer-events-none z-10" />
                          <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[#E5C378]/80 pointer-events-none z-10" />
                          <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-[#E5C378]/80 pointer-events-none z-10" />
                          <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[#E5C378]/80 pointer-events-none z-10" />

                          <div className="relative overflow-hidden rounded-xl bg-black/20">
                            <img
                              src={day.image}
                              alt={day.title}
                              className="w-full h-56 sm:h-72 object-cover filter contrast-105 transition-transform duration-700 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                            <div className="absolute bottom-3 left-4 right-4 text-white text-[11px] font-oswald tracking-wider uppercase flex items-center justify-between">
                              <span className="font-semibold">{day.endPoint}</span>
                              <span className="text-[#E5C378] font-bold">{day.altitudeEndFeet > 0 ? `${day.altitudeEndFeet.toLocaleString()} FT` : 'ALTITUDE TBC'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default ItineraryExplorer;
