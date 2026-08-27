/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckCircle2, XCircle, Shield, Info } from 'lucide-react';
import { INCLUSIONS, EXCLUSIONS } from '../data/roopkundData';

export const InclusionsExclusions: React.FC = () => {
  return (
    <section id="inclusions" className="py-24 sm:py-32 bg-[#FAF8F3] text-[#1D2530] relative overflow-hidden border-t border-[#E2DDD3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-oswald tracking-[0.25em] text-[#134E35] uppercase font-bold">
            TRANSPARENT EXPEDITION CHARTER
          </span>
          <h2 className="font-playfair text-4xl sm:text-5xl md:text-6xl font-bold tracking-[0.03em] uppercase text-[#1D2530] mt-2">
            INCLUSIONS & <span className="text-[#8F4F38]">EXCLUSIONS</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg font-garamond italic text-[#4A5568]">
            “No hidden clauses, no unexpected surprise charges. Everything required for a self-sufficient, high-altitude mountain expedition is laid out clearly.”
          </p>
        </div>

        {/* Side-by-Side Comparison Container with Asymmetric Weighting */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          
          {/* INCLUDED COLUMN (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-8 sm:p-10 border border-[#E2DDD3] shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center gap-4 border-b border-[#E2DDD3] pb-6 mb-6">
                <div className="p-3 rounded-2xl bg-[#EAF5EE] text-[#134E35] border border-[#134E35]/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-oswald text-[#134E35] font-bold uppercase tracking-widest">
                    PROVIDED BY PRAVAAH EXPEDITIONS
                  </span>
                  <h3 className="font-playfair text-2xl sm:text-3xl font-bold text-[#1D2530] uppercase">
                    WHAT IS INCLUDED
                  </h3>
                </div>
              </div>

              <div className="space-y-5">
                {INCLUSIONS.map((inc, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-[#EAF5EE] text-[#134E35] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs border border-[#134E35]/20">
                      ✓
                    </div>
                    <div>
                      <h4 className="font-oswald text-base font-bold text-[#1D2530] uppercase tracking-wide">
                        {inc.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-[#4A5568] mt-1 leading-relaxed font-nunito text-pretty">
                        {inc.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#E2DDD3] text-[11px] font-oswald text-[#134E35] font-bold uppercase flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#134E35]" />
              <span>COMMITTED TO UNCOMPROMISING EXPEDITION QUALITY & SAFETY</span>
            </div>
          </div>

          {/* NOT INCLUDED COLUMN (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-8 sm:p-10 border border-[#E2DDD3] shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center gap-4 border-b border-[#E2DDD3] pb-6 mb-6">
                <div className="p-3 rounded-2xl bg-[#F4EFE6] text-[#8F4F38] border border-[#8F4F38]/20">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-oswald text-[#8F4F38] font-bold uppercase tracking-widest">
                    PERSONAL & DISCRETIONARY
                  </span>
                  <h3 className="font-playfair text-2xl sm:text-3xl font-bold text-[#1D2530] uppercase">
                    WHAT IS NOT INCLUDED
                  </h3>
                </div>
              </div>

              <div className="space-y-5">
                {EXCLUSIONS.map((exc, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-[#F4EFE6] text-[#8F4F38] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs border border-[#8F4F38]/20">
                      ✕
                    </div>
                    <div>
                      <h4 className="font-oswald text-base font-bold text-[#1D2530] uppercase tracking-wide">
                        {exc.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-[#4A5568] mt-1 leading-relaxed font-nunito text-pretty">
                        {exc.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#E2DDD3] text-[11px] font-oswald text-[#8F4F38] font-bold uppercase flex items-center gap-2">
              <Info className="w-4 h-4 text-[#8F4F38]" />
              <span>OPTIONAL GEAR RENTAL & PORTERAGE AVAILABLE ON REQUEST</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default InclusionsExclusions;
