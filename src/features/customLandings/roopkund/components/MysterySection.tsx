/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, Compass, Search, BookOpen, ShieldAlert, History } from 'lucide-react';
import { MYSTERY_FACTS } from '../data/roopkundData';

export const MysterySection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0);

  const authenticRoopkundPhotos = [
    {
      id: 'skeletons',
      title: 'Original Skeletons in Roopkund Lake',
      category: 'ARCHAEOLOGICAL REMAINS',
      src: 'https://upload.wikimedia.org/wikipedia/commons/0/03/Human_Skeletons_in_Roopkund_Lake.jpg',
      caption: 'Ancient human bones and skulls visible along the shoreline and shallow glacial ice water of Roopkund during summer thaw.',
      tag: '💀 Archival Record'
    },
    {
      id: 'lake-cirque',
      title: 'The Glacial Tarn at 15,750 FT',
      category: 'HIGH HIMALAYAN CIRQUE',
      src: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Roopkund_-_The_Mystery_Lake.jpg',
      caption: 'The enigmatic glacial tarn cupped in steep rocky scree and permafrost moraine at 4,800m altitude.',
      tag: '🏔️ Glacial Tarn'
    },
    {
      id: 'mt-trishul',
      title: 'Mt. Trishul & Glacial Massif',
      category: 'SANCTUARY WALL (7,120M)',
      src: 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Roopkund%2C_Trishul%2C_Himalayas-1.jpg',
      caption: 'The sheer colossal massif of Mount Trishul towering directly over the high Roopkund basin.',
      tag: '❄️ Peak Massif'
    }
  ];

  const currentPhoto = authenticRoopkundPhotos[activePhotoIdx];

  return (
    <section id="mystery" className="relative py-24 sm:py-32 bg-[#0B131F] text-white overflow-hidden">
      {/* Background Topographic Texture & Atmospheric Glow */}
      <div className="absolute inset-0 bg-dark-noise opacity-20 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#134E35]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#C5A880]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Archaeological Documentary Vibe */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-oswald tracking-[0.28em] text-[#E5C378] uppercase mb-4">
            <Sparkles className="w-3 h-3 text-[#E5C378]" />
            <span>ARCHAEOLOGICAL ENIGMA • GARHWAL HIMALAYAS</span>
          </div>

          <h2 className="font-playfair text-3xl sm:text-5xl md:text-6xl font-bold tracking-[0.03em] uppercase text-white leading-tight">
            A LAKE WITH <span className="text-[#E5C378]">A STORY</span>
          </h2>

          <div className="mt-4 text-base sm:text-xl font-garamond italic text-white/80 max-w-2xl mx-auto">
            “Where high-altitude wilderness, ancient lore, and unsolved human history collide.”
          </div>

          <p className="mt-4 text-xs sm:text-sm md:text-base text-white/70 font-nunito leading-relaxed max-w-2xl mx-auto text-pretty">
            High in the Himalayas, Roopkund is more than a destination. It is a place where landscape, history and mystery meet. Hundreds of ancient skeletal remains were preserved around the lake, creating one of the Himalayas’ most enduring mysteries.
          </p>
        </div>

        {/* Visual Storytelling Grid: Documentary Visual + Archival Narrative */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Documentary Visual Representation with Archival Mount */}
          <div className="lg:col-span-6 relative group">
            {/* Photo Selector Switcher */}
            <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-none">
              {authenticRoopkundPhotos.map((photo, idx) => (
                <button
                  key={photo.id}
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-oswald tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                    activePhotoIdx === idx
                      ? 'bg-[#E5C378] text-[#0B131F] font-bold shadow-md'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/10'
                  }`}
                >
                  {photo.tag}
                </button>
              ))}
            </div>

            {/* Archival Mount Outer Frame */}
            <div className="relative p-2 rounded-2xl bg-white/[0.04] border border-white/15 shadow-2xl backdrop-blur-sm">
              
              {/* Four Corner Crop-Marks for Archival Feel */}
              <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-[#E5C378]/70 pointer-events-none z-20" />
              <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-[#E5C378]/70 pointer-events-none z-20" />
              <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-[#E5C378]/70 pointer-events-none z-20" />
              <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-[#E5C378]/70 pointer-events-none z-20" />

              <div className="relative overflow-hidden rounded-xl bg-black/60 min-h-[380px] sm:min-h-[460px]">
                <img
                  src={currentPhoto.src}
                  alt={currentPhoto.title}
                  className="w-full h-[380px] sm:h-[460px] object-cover filter brightness-95 contrast-105 transition-all duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B131F] via-[#0B131F]/30 to-black/40" />

                {/* Documentary Caption Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0B131F] via-[#0B131F]/95 to-transparent">
                  <div className="flex items-center justify-between text-[11px] font-oswald tracking-widest text-[#E5C378] uppercase mb-1">
                    <span>{currentPhoto.category}</span>
                    <span>ALT: 4,800M / 15,750 FT</span>
                  </div>
                  <h3 className="font-playfair text-lg sm:text-xl font-semibold text-white">
                    {currentPhoto.title}
                  </h3>
                  <p className="text-xs text-white/80 mt-1 font-nunito leading-relaxed text-pretty">
                    {currentPhoto.caption}
                  </p>
                </div>
              </div>
            </div>

            {/* Floating Scientific Fact Pill with Stamp Border */}
            <div className="absolute -top-4 -right-4 sm:top-14 sm:-right-6 bg-[#0B131F]/95 backdrop-blur-md border border-[#E5C378]/40 rounded-xl p-4 shadow-2xl max-w-[220px] hidden sm:block z-30">
              <div className="flex items-center gap-2 text-[10px] font-oswald text-[#E5C378] uppercase tracking-wider">
                <History className="w-3.5 h-3.5" />
                <span>GENOMIC FINDING</span>
              </div>
              <div className="text-xs font-nunito text-white/90 mt-1 font-medium leading-snug">
                Nature 2019 study confirmed DNA traces from both South Asia and the Eastern Mediterranean.
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Archaeological Timeline Tabs */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/15 pb-2 mb-4">
              <div className="text-xs font-oswald text-[#E5C378] tracking-[0.2em] uppercase font-bold">
                HISTORICAL & SCIENTIFIC MILESTONES
              </div>
              <div className="text-[10px] font-oswald text-white/50 tracking-wider">
                CHRONICLE 1942 – PRESENT
              </div>
            </div>

            <div className="space-y-3">
              {MYSTERY_FACTS.map((fact, index) => {
                const isSelected = activeTab === index;
                return (
                  <div
                    key={fact.year}
                    onClick={() => setActiveTab(index)}
                    className={`cursor-pointer rounded-xl p-5 transition-all duration-300 border ${
                      isSelected
                        ? 'bg-white/10 border-[#E5C378] shadow-lg translate-x-1.5 ring-1 ring-[#E5C378]/30'
                        : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded bg-[#E5C378]/20 text-[#E5C378] text-xs font-oswald font-bold tracking-wider">
                          {fact.year}
                        </span>
                        <h4 className="font-raleway text-sm sm:text-base font-bold text-white tracking-wide">
                          {fact.title}
                        </h4>
                      </div>
                      <span className={`text-xs font-oswald transition-transform ${isSelected ? 'rotate-90 text-[#E5C378]' : 'text-white/40'}`}>
                        →
                      </span>
                    </div>

                    <p className={`text-xs sm:text-sm font-nunito mt-3 leading-relaxed transition-all text-pretty ${
                      isSelected ? 'block text-white/90 font-normal' : 'line-clamp-2 text-white/60'
                    }`}>
                      {fact.detail}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Respectful Archival Note */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-white/70 font-nunito flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-[#E5C378] shrink-0" />
              <span className="text-pretty">
                Pravaah adheres to strict archaeological ethics. The lake is a protected ecological sanctuary. Touching or disturbing historical artifacts is strictly prohibited.
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Transition to Next Section */}
      <div className="h-12 w-full bg-gradient-to-b from-transparent to-[#FAF8F3] mt-16" />
    </section>
  );
};

export default MysterySection;
