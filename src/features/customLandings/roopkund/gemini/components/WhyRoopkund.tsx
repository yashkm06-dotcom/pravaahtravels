/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Mountain, Wind, Eye, Compass, ArrowUpRight } from 'lucide-react';

interface EditorialCardProps {
  number: string;
  tag: string;
  title: string;
  description: string;
  image: string;
  aspect: string;
}

export const WhyRoopkund: React.FC = () => {
  const pillars: EditorialCardProps[] = [
    {
      number: '01',
      tag: 'MOUNTAIN LANDSCAPES',
      title: 'THE HIGH HIMALAYAS',
      description: 'The approved visual frames a dramatic mountain setting. Peak identities, elevations, viewpoints and visibility are to be confirmed.',
      image: '/images/roopkund/why-community.jpg',
      aspect: 'Mountain views subject to final route confirmation'
    },
    {
      number: '02',
      tag: 'OPEN LANDSCAPES',
      title: 'THE BUGYALS',
      description: 'The page preserves the original meadow imagery while route access, place sequence, altitude and seasonal ecology remain under review.',
      image: '/images/roopkund/why-preparation.jpg',
      aspect: 'Meadow context and altitude to be confirmed'
    },
    {
      number: '03',
      tag: 'HISTORY UNDER REVIEW',
      title: 'THE MYSTERY',
      description: 'The mystery remains part of the visual narrative. Dates, artefact descriptions and historical interpretations require source verification.',
      image: '/images/roopkund/mystery-skeletons.jpg',
      aspect: 'Historical and altitude details to be confirmed'
    },
    {
      number: '04',
      tag: 'CHALLENGING JOURNEY',
      title: 'THE EXPEDITION',
      description: 'The visual journey crosses changing mountain textures. Difficulty, route order, terrain, snow and operating conditions are to be confirmed.',
      image: '/images/roopkund/why-roopkund-rare.jpg',
      aspect: 'Route and ecological sequence under review'
    }
  ];

  return (
    <section id="why-roopkund" className="py-24 sm:py-32 bg-[#FAF8F3] text-[#1D2530] relative overflow-hidden">
      {/* Editorial Background Subtle Texture */}
      <div className="absolute inset-0 bg-noise opacity-40 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Editorial Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-[#E2DDD3] pb-10">
          <div className="max-w-2xl">
            <span className="text-xs font-oswald tracking-[0.25em] text-[#134E35] uppercase font-bold">
              EXPEDITION PILLARS • THE ROOPKUND TRAIL
            </span>
            <h2 className="font-playfair text-4xl sm:text-5xl md:text-6xl font-bold tracking-[0.03em] uppercase text-[#1D2530] mt-2 leading-[1.05]">
              WHY THIS <span className="text-[#8F4F38] italic font-normal">TRAIL?</span>
            </h2>
          </div>

          <div className="max-w-md text-sm sm:text-base font-garamond italic text-[#4A5568] lg:text-right">
            “Roopkund is presented here as a visual story while the expedition facts are being verified.”
          </div>
        </div>

        {/* Asymmetrical Editorial Magazine Spread with Organic Framing */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          
          {/* Card 01 - Featured Large Alpine Panorama (Span 7) */}
          <div className="lg:col-span-7 group relative bg-white rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-2xl rounded-bl-2xl overflow-hidden border border-[#E2DDD3] shadow-sm hover:shadow-xl hover:border-[#134E35]/40 transition-all duration-500 flex flex-col justify-between">
            {/* Passe-partout inner padding */}
            <div className="p-3 sm:p-4 pb-0 flex-1 flex flex-col">
              <div className="relative h-72 sm:h-84 md:h-96 w-full overflow-hidden rounded-tl-[2.2rem] rounded-br-[2.2rem] rounded-tr-xl rounded-bl-xl bg-black/10 shadow-inner">
                {/* Corner brackets */}
                <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-white/85 z-10 pointer-events-none" />
                <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-white/85 z-10 pointer-events-none" />
                <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-white/85 z-10 pointer-events-none" />
                <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-white/85 z-10 pointer-events-none" />
                
                <img
                  src={pillars[0].image}
                  alt={pillars[0].title}
                  className="w-full h-full object-cover filter contrast-105 transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/20" />
                
                {/* Number Badge */}
                <div className="absolute top-4 left-4 px-3.5 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/20 text-white font-oswald text-xs font-bold tracking-widest flex items-center gap-1.5 shadow-md">
                  <span className="text-[#E5C378] font-bold">{pillars[0].number}</span>
                  <span className="text-white/60">/ 04</span>
                </div>

                <div className="absolute top-4 right-4 px-3.5 py-1.5 rounded-full bg-[#134E35] text-white border border-white/20 font-oswald text-[10px] font-bold tracking-widest uppercase shadow-md">
                  {pillars[0].tag}
                </div>

                <div className="absolute bottom-4 left-6 right-6 text-white text-[11px] font-oswald tracking-widest uppercase flex items-center justify-between">
                  <span>MOUNTAIN LANDSCAPE</span>
                  <span className="text-[#E5C378] font-bold">PEAK DETAILS TBC</span>
                </div>
              </div>

              {/* Editorial Card Body */}
              <div className="p-4 sm:p-6 sm:pb-8 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-oswald tracking-widest text-[#8F4F38] uppercase font-bold mb-1.5">
                    {pillars[0].aspect}
                  </div>
                  <h3 className="font-playfair text-2xl sm:text-3xl font-bold text-[#1D2530] tracking-wide uppercase group-hover:text-[#134E35] transition-colors leading-tight">
                    {pillars[0].title}
                  </h3>
                  <p className="mt-3 text-sm sm:text-base font-nunito text-[#4A5568] leading-relaxed font-normal text-pretty">
                    {pillars[0].description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E2DDD3] flex items-center justify-between text-xs font-oswald text-[#134E35] font-bold tracking-wider uppercase group-hover:text-[#8F4F38] transition-colors">
                  <span>EXPEDITION ESSENCE</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 text-[#134E35]" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 02 - The High Bugyals (Span 5, Staggered Offset) */}
          <div className="lg:col-span-5 lg:translate-y-4 group relative bg-white rounded-tr-[2.5rem] rounded-bl-[2.5rem] rounded-tl-2xl rounded-br-2xl overflow-hidden border border-[#E2DDD3] shadow-sm hover:shadow-xl hover:border-[#134E35]/40 transition-all duration-500 flex flex-col justify-between">
            <div className="p-3 sm:p-4 pb-0 flex-1 flex flex-col">
              <div className="relative h-64 sm:h-72 md:h-80 w-full overflow-hidden rounded-tr-[2.2rem] rounded-bl-[2.2rem] rounded-tl-xl rounded-br-xl bg-black/10 shadow-inner">
                <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-white/85 z-10 pointer-events-none" />
                <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-white/85 z-10 pointer-events-none" />
                <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-white/85 z-10 pointer-events-none" />
                <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-white/85 z-10 pointer-events-none" />

                <img
                  src={pillars[1].image}
                  alt={pillars[1].title}
                  className="w-full h-full object-cover filter contrast-105 transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/20" />
                
                <div className="absolute top-4 left-4 px-3.5 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/20 text-white font-oswald text-xs font-bold tracking-widest flex items-center gap-1.5 shadow-md">
                  <span className="text-[#E5C378] font-bold">{pillars[1].number}</span>
                  <span className="text-white/60">/ 04</span>
                </div>

                <div className="absolute top-4 right-4 px-3.5 py-1.5 rounded-full bg-[#134E35] text-white border border-white/20 font-oswald text-[10px] font-bold tracking-widest uppercase shadow-md">
                  {pillars[1].tag}
                </div>

                <div className="absolute bottom-4 left-6 right-6 text-white text-[11px] font-oswald tracking-widest uppercase flex items-center justify-between">
                  <span>MEADOW LANDSCAPE</span>
                  <span className="text-[#E5C378] font-bold">ALTITUDE TBC</span>
                </div>
              </div>

              <div className="p-4 sm:p-6 sm:pb-8 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-oswald tracking-widest text-[#8F4F38] uppercase font-bold mb-1.5">
                    {pillars[1].aspect}
                  </div>
                  <h3 className="font-playfair text-2xl sm:text-3xl font-bold text-[#1D2530] tracking-wide uppercase group-hover:text-[#134E35] transition-colors leading-tight">
                    {pillars[1].title}
                  </h3>
                  <p className="mt-3 text-sm sm:text-base font-nunito text-[#4A5568] leading-relaxed font-normal text-pretty">
                    {pillars[1].description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E2DDD3] flex items-center justify-between text-xs font-oswald text-[#134E35] font-bold tracking-wider uppercase group-hover:text-[#8F4F38] transition-colors">
                  <span>EXPEDITION ESSENCE</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 text-[#134E35]" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 03 - The Mystery Enigma (Span 5, Staggered Inset) */}
          <div className="lg:col-span-5 lg:-translate-y-2 group relative bg-white rounded-bl-[2.5rem] rounded-tr-[2.5rem] rounded-tl-2xl rounded-br-2xl overflow-hidden border border-[#E2DDD3] shadow-sm hover:shadow-xl hover:border-[#134E35]/40 transition-all duration-500 flex flex-col justify-between">
            <div className="p-3 sm:p-4 pb-0 flex-1 flex flex-col">
              <div className="relative h-64 sm:h-72 md:h-80 w-full overflow-hidden rounded-bl-[2.2rem] rounded-tr-[2.2rem] rounded-tl-xl rounded-br-xl bg-black/10 shadow-inner">
                <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-white/85 z-10 pointer-events-none" />
                <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-white/85 z-10 pointer-events-none" />
                <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-white/85 z-10 pointer-events-none" />
                <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-white/85 z-10 pointer-events-none" />

                <img
                  src={pillars[2].image}
                  alt={pillars[2].title}
                  className="w-full h-full object-cover filter contrast-105 transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/20" />
                
                <div className="absolute top-4 left-4 px-3.5 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/20 text-white font-oswald text-xs font-bold tracking-widest flex items-center gap-1.5 shadow-md">
                  <span className="text-[#E5C378] font-bold">{pillars[2].number}</span>
                  <span className="text-white/60">/ 04</span>
                </div>

                <div className="absolute top-4 right-4 px-3.5 py-1.5 rounded-full bg-[#8F4F38] text-white border border-white/20 font-oswald text-[10px] font-bold tracking-widest uppercase shadow-md">
                  {pillars[2].tag}
                </div>

                <div className="absolute bottom-4 left-6 right-6 text-white text-[11px] font-oswald tracking-widest uppercase flex items-center justify-between">
                  <span>HISTORICAL REVIEW</span>
                  <span className="text-[#E5C378] font-bold">DETAILS TBC</span>
                </div>
              </div>

              <div className="p-4 sm:p-6 sm:pb-8 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-oswald tracking-widest text-[#8F4F38] uppercase font-bold mb-1.5">
                    {pillars[2].aspect}
                  </div>
                  <h3 className="font-playfair text-2xl sm:text-3xl font-bold text-[#1D2530] tracking-wide uppercase group-hover:text-[#134E35] transition-colors leading-tight">
                    {pillars[2].title}
                  </h3>
                  <p className="mt-3 text-sm sm:text-base font-nunito text-[#4A5568] leading-relaxed font-normal text-pretty">
                    {pillars[2].description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E2DDD3] flex items-center justify-between text-xs font-oswald text-[#134E35] font-bold tracking-wider uppercase group-hover:text-[#8F4F38] transition-colors">
                  <span>EXPEDITION ESSENCE</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 text-[#134E35]" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 04 - The 5 Ecological Zones Expedition (Span 7) */}
          <div className="lg:col-span-7 group relative bg-white rounded-br-[2.5rem] rounded-tl-[2.5rem] rounded-tr-2xl rounded-bl-2xl overflow-hidden border border-[#E2DDD3] shadow-sm hover:shadow-xl hover:border-[#134E35]/40 transition-all duration-500 flex flex-col justify-between">
            <div className="p-3 sm:p-4 pb-0 flex-1 flex flex-col">
              <div className="relative h-72 sm:h-84 md:h-96 w-full overflow-hidden rounded-br-[2.2rem] rounded-tl-[2.2rem] rounded-tr-xl rounded-bl-xl bg-black/10 shadow-inner">
                <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-white/85 z-10 pointer-events-none" />
                <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-white/85 z-10 pointer-events-none" />
                <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-white/85 z-10 pointer-events-none" />
                <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-white/85 z-10 pointer-events-none" />

                <img
                  src={pillars[3].image}
                  alt={pillars[3].title}
                  className="w-full h-full object-cover filter contrast-105 transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/20" />
                
                <div className="absolute top-4 left-4 px-3.5 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/20 text-white font-oswald text-xs font-bold tracking-widest flex items-center gap-1.5 shadow-md">
                  <span className="text-[#E5C378] font-bold">{pillars[3].number}</span>
                  <span className="text-white/60">/ 04</span>
                </div>

                <div className="absolute top-4 right-4 px-3.5 py-1.5 rounded-full bg-[#134E35] text-white border border-white/20 font-oswald text-[10px] font-bold tracking-widest uppercase shadow-md">
                  {pillars[3].tag}
                </div>

                <div className="absolute bottom-4 left-6 right-6 text-white text-[11px] font-oswald tracking-widest uppercase flex items-center justify-between">
                  <span>FINAL ROUTE UNDER REVIEW</span>
                  <span className="text-[#E5C378] font-bold">DISTANCE TBC</span>
                </div>
              </div>

              <div className="p-4 sm:p-6 sm:pb-8 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-oswald tracking-widest text-[#8F4F38] uppercase font-bold mb-1.5">
                    {pillars[3].aspect}
                  </div>
                  <h3 className="font-playfair text-2xl sm:text-3xl font-bold text-[#1D2530] tracking-wide uppercase group-hover:text-[#134E35] transition-colors leading-tight">
                    {pillars[3].title}
                  </h3>
                  <p className="mt-3 text-sm sm:text-base font-nunito text-[#4A5568] leading-relaxed font-normal text-pretty">
                    {pillars[3].description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E2DDD3] flex items-center justify-between text-xs font-oswald text-[#134E35] font-bold tracking-wider uppercase group-hover:text-[#8F4F38] transition-colors">
                  <span>EXPEDITION ESSENCE</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 text-[#134E35]" />
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default WhyRoopkund;
