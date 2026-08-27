/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Check, AlertCircle, Compass, Users } from 'lucide-react';
import { WHO_IS_THIS_FOR } from '../data/roopkundData';

export const WhoIsThisFor: React.FC = () => {
  const idealCriteria = WHO_IS_THIS_FOR.filter((c) => c.category === 'ideal');
  const notIdealCriteria = WHO_IS_THIS_FOR.filter((c) => c.category === 'notIdeal');

  return (
    <section id="suitability" className="py-24 sm:py-32 bg-[#F4EFE6] text-[#1D2530] relative overflow-hidden border-t border-[#E2DDD3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header with Asymmetrical Layout */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16 sm:mb-20 pb-8 border-b border-[#E2DDD3]">
          <div className="max-w-2xl">
            <span className="text-xs font-oswald tracking-[0.25em] text-[#134E35] uppercase font-bold">
              EXPEDITION FIT & PHYSICAL SUITABILITY
            </span>
            <h2 className="font-playfair text-4xl sm:text-5xl md:text-6xl font-bold tracking-[0.03em] uppercase text-[#1D2530] mt-2 leading-[1.05]">
              WHO SHOULD DO <span className="text-[#8F4F38] italic font-normal">THIS TREK?</span>
            </h2>
          </div>

          <div className="max-w-md text-sm sm:text-base font-garamond italic text-[#4A5568] lg:text-right">
            “An honest appraisal of fitness, expectations, and mountain temperament ensures the journey remains profound and joyful for every expedition member.”
          </div>
        </div>

        {/* 2 Column Comparison Grid with Editorial Contrast & Organic Asymmetry */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          
          {/* GOOD FOR (7 Cols on desktop with organic framing) */}
          <div className="lg:col-span-7 bg-white rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-2xl rounded-bl-2xl p-8 sm:p-12 border border-[#E2DDD3] shadow-sm hover:shadow-xl hover:border-[#134E35]/40 transition-all duration-500 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#EAF5EE] rounded-bl-full pointer-events-none opacity-60" />
            
            <div>
              <div className="flex items-center gap-4 border-b border-[#E2DDD3] pb-6 mb-8">
                <div className="p-3.5 rounded-2xl bg-[#EAF5EE] text-[#134E35] border border-[#134E35]/20 shadow-xs">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-oswald text-[#134E35] font-bold uppercase tracking-widest block">
                    EXPEDITION CANDIDACY
                  </span>
                  <h3 className="font-playfair text-2xl sm:text-3xl font-bold text-[#1D2530] uppercase leading-tight">
                    IDEAL FOR YOU IF
                  </h3>
                </div>
              </div>

              <div className="space-y-6">
                {idealCriteria.map((item, i) => (
                  <div key={i} className="flex items-start gap-4 group">
                    <div className="w-6 h-6 rounded-full bg-[#EAF5EE] text-[#134E35] flex items-center justify-center shrink-0 mt-1 font-bold text-xs border border-[#134E35]/20 group-hover:bg-[#134E35] group-hover:text-white transition-colors shadow-xs">
                      ✓
                    </div>
                    <div>
                      <h4 className="font-oswald text-base font-bold text-[#1D2530] uppercase tracking-wide group-hover:text-[#134E35] transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-[#4A5568] mt-1.5 leading-relaxed font-nunito text-pretty">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-[#E2DDD3] text-[11px] font-oswald text-[#134E35] font-bold uppercase flex items-center gap-2.5">
              <Compass className="w-4 h-4 text-[#134E35]" />
              <span>PRAVAAH PROVIDES AN 8-WEEK PERSONALIZED TRAINING & ALTITUDE GUIDE</span>
            </div>
          </div>

          {/* NOT IDEAL FOR (5 Cols on desktop, staggered vertical offset) */}
          <div className="lg:col-span-5 lg:translate-y-4 bg-white rounded-tr-[2.5rem] rounded-bl-[2.5rem] rounded-tl-2xl rounded-br-2xl p-8 sm:p-10 border border-[#E2DDD3] shadow-sm hover:shadow-xl hover:border-[#8F4F38]/40 transition-all duration-500 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-[#FBF0EC] rounded-bl-full pointer-events-none opacity-60" />
            
            <div>
              <div className="flex items-center gap-4 border-b border-[#E2DDD3] pb-6 mb-8">
                <div className="p-3.5 rounded-2xl bg-[#FBF0EC] text-[#8F4F38] border border-[#8F4F38]/20 shadow-xs">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-oswald text-[#8F4F38] font-bold uppercase tracking-widest block">
                    CAUTIONARY APPRAISAL
                  </span>
                  <h3 className="font-playfair text-2xl sm:text-3xl font-bold text-[#1D2530] uppercase leading-tight">
                    NOT SUITABLE FOR
                  </h3>
                </div>
              </div>

              <div className="space-y-6">
                {notIdealCriteria.map((item, i) => (
                  <div key={i} className="flex items-start gap-4 group">
                    <div className="w-6 h-6 rounded-full bg-[#FBF0EC] text-[#8F4F38] flex items-center justify-center shrink-0 mt-1 font-bold text-xs border border-[#8F4F38]/20 group-hover:bg-[#8F4F38] group-hover:text-white transition-colors shadow-xs">
                      ✕
                    </div>
                    <div>
                      <h4 className="font-oswald text-base font-bold text-[#1D2530] uppercase tracking-wide group-hover:text-[#8F4F38] transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-[#4A5568] mt-1.5 leading-relaxed font-nunito text-pretty">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-[#E2DDD3] text-[11px] font-oswald text-[#8F4F38] font-bold uppercase flex items-center gap-2.5">
              <Users className="w-4 h-4 text-[#8F4F38]" />
              <span>CONSULT OUR MOUNTAIN LEADERS FOR CUSTOM GRADED ALTERNATIVES</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default WhoIsThisFor;
