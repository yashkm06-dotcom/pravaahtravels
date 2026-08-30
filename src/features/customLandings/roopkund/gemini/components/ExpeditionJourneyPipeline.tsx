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
    { name: 'Gateway Stage', alt: 'ALT TBC', type: 'Departure details to be confirmed', day: 'STAGE 01', id: 'rishikesh', isKey: false },
    { name: 'Base Stage', alt: 'ALT TBC', type: 'Base details to be confirmed', day: 'STAGE 02', id: 'lohajung-wan', isKey: true },
    { name: 'Trailhead Stage', alt: 'ALT TBC', type: 'Trailhead details to be confirmed', day: 'STAGE 03', id: 'wan', isKey: false },
    { name: 'Forest Stage', alt: 'ALT TBC', type: 'Forest route to be confirmed', day: 'STAGE 04', id: 'ghairoli-patal', isKey: true },
    { name: 'Meadow Stage', alt: 'ALT TBC', type: 'Meadow route to be confirmed', day: 'STAGE 05', id: 'ali-bugyal', isKey: true },
    { name: 'High Ridge Stage', alt: 'ALT TBC', type: 'Ridge details to be confirmed', day: 'STAGE 06', id: 'patar-nauchni', isKey: false },
    { name: 'Upper Trail Stage', alt: 'ALT TBC', type: 'Upper route to be confirmed', day: 'STAGE 07', id: 'bhagwabasa', isKey: true },
    { name: 'Roopkund Objective', alt: 'ALT TBC', type: 'Access and objective under review', day: 'STAGE 08', id: 'roopkund', isKey: true, isSummit: true },
    { name: 'Return Stage One', alt: 'ALT TBC', type: 'Return plan to be confirmed', day: 'STAGE 09', id: 'bhagwabasa', isKey: false },
    { name: 'Return Landscape', alt: 'ALT TBC', type: 'Landscape sequence to be confirmed', day: 'STAGE 10', id: 'bedni-bugyal', isKey: true },
    { name: 'Return Stage Two', alt: 'ALT TBC', type: 'Return route to be confirmed', day: 'STAGE 11', id: 'wan', isKey: false },
    { name: 'Journey Close', alt: 'ALT TBC', type: 'End point to be confirmed', day: 'STAGE 12', id: 'rishikesh', isKey: false },
  ];

  return (
    <section id="expedition-route" className="py-24 sm:py-32 bg-[#F4EFE6] text-[#1D2530] relative overflow-hidden border-t border-[#E2DDD3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Headline */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-oswald tracking-[0.25em] text-[#134E35] uppercase font-bold">
            ILLUSTRATIVE ROUTE & TERRAIN PROGRESSION
          </span>
          
          <h2 className="font-playfair text-3xl sm:text-5xl md:text-6xl font-bold tracking-[0.03em] uppercase text-[#1D2530] mt-2">
            NOT A TOUR. <br className="hidden sm:inline" />
            <span className="text-[#8F4F38]">AN EXPEDITION.</span>
          </h2>

          <p className="mt-4 text-base sm:text-lg font-garamond italic text-[#4A5568] max-w-2xl mx-auto">
            “The approved twelve-stage visual is preserved while the final route, access, distance, altitude and terrain are being verified.”
          </p>
        </div>

        {/* Visual Route Pipeline Flow (Desktop Horizontal / Mobile Vertical) */}
        <div className="mt-16 bg-[#FAF8F3] rounded-3xl p-6 sm:p-10 border border-[#E2DDD3] shadow-md relative overflow-hidden">
          
          {/* Subtle Topo line decoration */}
          <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-4 mb-8">
            <div className="flex items-center gap-2 text-xs font-oswald uppercase tracking-wider text-[#134E35] font-bold">
              <Compass className="w-4 h-4 text-[#134E35]" />
              <span>THE 12-STAGE EXPEDITION CORRIDOR • ILLUSTRATIVE PROFILE</span>
            </div>
            <div className="text-[11px] font-oswald text-[#64748B] tracking-wider">
              DISTANCE • TRANSFERS • ALTITUDE — TO BE CONFIRMED
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
                    {stage.isSummit ? '★ OBJECTIVE' : `STAGE ${idx + 1}`}
                  </span>
                  <span className={`transition-transform group-hover:translate-x-1 ${stage.isSummit ? 'text-[#E5C378] font-bold' : 'text-[#134E35] font-bold'}`}>
                    {stage.isSummit ? 'TBC' : '→'}
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
