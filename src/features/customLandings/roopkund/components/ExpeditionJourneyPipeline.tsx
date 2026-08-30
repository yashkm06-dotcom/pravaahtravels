/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowDown, Mountain, Compass, MapPin, Sparkles } from 'lucide-react';
import { TRAIL_LOCATIONS } from '../data/roopkundData';

interface ExpeditionJourneyPipelineProps {
  onSelectLocation?: (locationId: string) => void;
}

export const ExpeditionJourneyPipeline: React.FC<ExpeditionJourneyPipelineProps> = ({ onSelectLocation }) => {
  const routeStages = [
    { name: 'Rishikesh', alt: '1,120 FT', type: 'Gateway & Departure', day: 'DAY 01', id: 'rishikesh', isKey: false },
    { name: 'Lohajung / Wan', alt: '7,600 FT', type: 'Base Camp & Route Briefing', day: 'DAY 01', id: 'lohajung-wan', isKey: true },
    { name: 'Wan Village', alt: '7,800 FT', type: 'Mountain Village Trailhead', day: 'DAY 02', id: 'wan', isKey: false },
    { name: 'Ghairoli Patal', alt: '10,000 FT', type: 'Oak & Rhododendron Forest', day: 'DAY 02', id: 'ghairoli-patal', isKey: true },
    { name: 'Ali Bugyal', alt: '11,320 FT', type: 'Great Alpine Meadow', day: 'DAY 03', id: 'ali-bugyal', isKey: true },
    { name: 'Patar Nauchni', alt: '12,820 FT', type: 'High Mountain Ridge Camp', day: 'DAY 03', id: 'patar-nauchni', isKey: false },
    { name: 'Bhagwabasa', alt: '14,120 FT', type: 'High Staging & Summit Prep', day: 'DAY 04', id: 'bhagwabasa', isKey: true },
    { name: 'Roopkund Summit', alt: '15,750 FT', type: 'Glacial Objective & Mystery', day: 'DAY 05', id: 'roopkund', isKey: true, isSummit: true },
    { name: 'Base Camp', alt: '14,120 FT', type: 'Post-Summit Recovery', day: 'DAY 05', id: 'bhagwabasa', isKey: false },
    { name: 'Bedni Explore', alt: '11,540 FT', type: 'Meadow Exploration & Views', day: 'DAY 06', id: 'bedni-bugyal', isKey: true },
    { name: 'Wan Village', alt: '7,800 FT', type: 'Return Mountain Village', day: 'DAY 06', id: 'wan', isKey: false },
    { name: 'Rishikesh', alt: '1,120 FT', type: 'Expedition Concludes', day: 'DAY 07', id: 'rishikesh', isKey: false },
  ];

  return (
    <section id="expedition-route" className="py-24 sm:py-32 bg-[#F4EFE6] text-[#1D2530] relative overflow-hidden border-t border-[#E2DDD3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Headline */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-oswald tracking-[0.25em] text-[#134E35] uppercase font-bold">
            PROGRESSION OF ALTITUDE & TERRAIN
          </span>
          
          <h2 className="font-playfair text-3xl sm:text-5xl md:text-6xl font-bold tracking-[0.03em] uppercase text-[#1D2530] mt-2">
            NOT A TOUR. <br className="hidden sm:inline" />
            <span className="text-[#8F4F38]">AN EXPEDITION.</span>
          </h2>

          <p className="mt-4 text-base sm:text-lg font-garamond italic text-[#4A5568] max-w-2xl mx-auto">
            “Roopkund is not meant to be rushed. The trail unfolds gradually — from river valleys and mountain roads to forests, alpine meadows and the high-altitude landscape surrounding Roopkund.”
          </p>
        </div>

        {/* Visual Route Pipeline Flow (Desktop Horizontal / Mobile Vertical) */}
        <div className="mt-16 bg-[#FAF8F3] rounded-3xl p-6 sm:p-10 border border-[#E2DDD3] shadow-md relative overflow-hidden">
          
          {/* Subtle Topo line decoration */}
          <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-4 mb-8">
            <div className="flex items-center gap-2 text-xs font-oswald uppercase tracking-wider text-[#134E35] font-bold">
              <Compass className="w-4 h-4 text-[#134E35]" />
              <span>THE 12-STAGE EXPEDITION CORRIDOR • ELEVATION PROFILE</span>
            </div>
            <div className="text-[11px] font-oswald text-[#64748B] tracking-wider">
              TOTAL ~48 KM ON FOOT + 420 KM MOUNTAIN DRIVE • 1,120M → 4,800M
            </div>
          </div>

          {/* Connected Grid Flow with Elevation Stepper */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 relative">
            {routeStages.map((stage, idx) => (
              <div
                key={`${stage.id}-${idx}`}
                onClick={() => onSelectLocation && onSelectLocation(stage.id)}
                className={`relative rounded-2xl p-4 sm:p-5 transition-all duration-300 cursor-pointer border flex flex-col justify-between group ${
                  stage.isSummit
                    ? 'bg-[#0B131F] text-white border-[#C5A880] shadow-xl scale-105 z-10 hover:shadow-2xl ring-2 ring-[#E5C378]/40'
                    : stage.isKey
                    ? 'bg-white text-[#1D2530] border-[#134E35]/40 shadow-sm hover:border-[#134E35] hover:shadow-md hover:-translate-y-0.5'
                    : 'bg-white/80 text-[#1D2530] border-[#E2DDD3] hover:bg-white hover:border-[#C5A880]/50 hover:shadow-sm hover:-translate-y-0.5'
                }`}
              >
                {/* Elevation Marker Top Corner */}
                <div>
                  <div className="flex items-center justify-between text-[10px] font-oswald tracking-wider mb-2">
                    <span className={stage.isSummit ? 'text-[#E5C378] font-bold' : 'text-[#8F4F38] font-bold'}>
                      {stage.day}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-oswald ${stage.isSummit ? 'bg-[#E5C378]/20 text-[#E5C378] font-bold' : 'bg-[#F4EFE6] text-[#1D2530] font-semibold'}`}>
                      {stage.alt}
                    </span>
                  </div>

                  <h3 className={`font-playfair text-base font-bold tracking-wide uppercase ${stage.isSummit ? 'text-white' : 'text-[#1D2530] group-hover:text-[#134E35]'}`}>
                    {stage.name}
                  </h3>

                  <p className={`text-xs mt-1.5 leading-snug font-nunito ${stage.isSummit ? 'text-white/80' : 'text-[#64748B]'}`}>
                    {stage.type}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-dashed border-[#E2DDD3] flex items-center justify-between text-[10px] font-oswald">
                  <span className={stage.isSummit ? 'text-[#E5C378] font-bold' : 'text-[#64748B]'}>
                    {stage.isSummit ? '★ SUMMIT' : `STAGE ${idx + 1}`}
                  </span>
                  <span className={`transition-transform group-hover:translate-x-1 ${stage.isSummit ? 'text-[#E5C378] font-bold' : 'text-[#134E35] font-bold'}`}>
                    {stage.isSummit ? '15,750 FT' : '→'}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};

export default ExpeditionJourneyPipeline;
