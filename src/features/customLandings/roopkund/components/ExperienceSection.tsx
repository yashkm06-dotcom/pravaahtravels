/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  ArrowUpRight, 
  Eye, 
  Mountain, 
  Compass, 
  Camera, 
  Layers, 
  Maximize2,
  Volume2,
  Crosshair,
  Aperture,
  MapPin
} from 'lucide-react';
import { EXPERIENCE_HIGHLIGHTS } from '../data/roopkundData';
import { ExperienceHighlight } from '../types';
import { ExperienceModal } from './ExperienceModal';

interface ExperienceSectionProps {
  onOpenEnquiry?: () => void;
}

// Editorial photography & telemetry metadata for each sensory chapter
const CHAPTER_PHOTO_TELEMETRY: Record<string, {
  altitude: string;
  lensSetup: string;
  lightingZone: string;
  sensoryFocus: string;
  fieldCoordinate: string;
}> = {
  'exp-1': {
    altitude: '11,320 FT – 11,540 FT',
    lensSetup: '24mm Ultra-Wide • f/8.0 • 1/320s',
    lightingZone: 'Boundless Alpine Meadow (Bugyal)',
    sensoryFocus: 'Velvet grass carpets & grazing flocks',
    fieldCoordinate: '30.2642° N, 79.7128° E'
  },
  'exp-2': {
    altitude: '11,540 FT • Sacred Tarn Basin',
    lensSetup: '70-200mm Telephoto • f/5.6 • 1/500s',
    lightingZone: 'Molten Alpenglow on Mt. Trishul (7,120m)',
    sensoryFocus: 'Mirror reflection & sacred dawn silence',
    fieldCoordinate: '30.2711° N, 79.7205° E'
  },
  'exp-3': {
    altitude: '12,820 FT – 14,120 FT',
    lensSetup: '14mm Astro Lens • f/2.8 • 25s • ISO 3200',
    lightingZone: 'Bortle Class 1 Dark Sky • Zero Light Pollution',
    sensoryFocus: 'Milky Way core & silent glacial winds',
    fieldCoordinate: '30.2814° N, 79.7312° E'
  },
  'exp-4': {
    altitude: '1,120 FT → 15,750 FT Continuum',
    lensSetup: '35mm Prime Documentary • f/4.0 • 1/400s',
    lightingZone: '5 Distinct Himalayan Bioclimatic Zones',
    sensoryFocus: 'Pines to rhododendrons to glacier rock',
    fieldCoordinate: '30.2915° N, 79.7420° E'
  }
};

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({ onOpenEnquiry }) => {
  const [selectedExperience, setSelectedExperience] = useState<ExperienceHighlight | null>(null);
  const [hoveredExpId, setHoveredExpId] = useState<string | null>(null);

  const handlePlanExpedition = () => {
    if (onOpenEnquiry) {
      onOpenEnquiry();
    } else {
      const bookingEl = document.getElementById('booking');
      bookingEl?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleMouseEnter = (id: string) => {
    setHoveredExpId(id);
  };

  const handleMouseLeave = () => {
    setHoveredExpId(null);
  };

  return (
    <section id="experience" className="py-24 sm:py-32 bg-[#F4EFE6] text-[#1D2530] relative overflow-hidden border-t border-[#E2DDD3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Editorial Section Header with Asymmetrical Split Layout */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16 sm:mb-20 pb-8 border-b border-[#E2DDD3]">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#134E35]/10 border border-[#134E35]/20 text-[10px] font-oswald tracking-[0.25em] text-[#134E35] uppercase font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#134E35]" />
              <span>IMMERSIVE HIMALAYAN SENSORY JOURNEY</span>
            </div>
            <h2 className="font-playfair text-4xl sm:text-5xl md:text-6xl font-bold tracking-[0.03em] uppercase text-[#1D2530] mt-1 leading-[1.05]">
              MORE THAN THE <span className="text-[#8F4F38] italic font-normal">DESTINATION</span>
            </h2>
          </div>

          <div className="max-w-md lg:text-right flex flex-col justify-end">
            <p className="text-base sm:text-lg font-garamond italic text-[#4A5568] leading-relaxed">
              “The true reward of the Roopkund trail lies in the thousand subtle transformations between the river gorges and the eternal snows.”
            </p>
            <div className="mt-3 flex items-center lg:justify-end gap-2 text-xs font-nunito text-[#134E35] uppercase tracking-wider font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#134E35] animate-ping" />
              <span>Hover for photo telemetry • Click for full field dossiers</span>
            </div>
          </div>
        </div>

        {/* Asymmetrical Editorial Mosaic Grid with Handcrafted Archival Framing */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {EXPERIENCE_HIGHLIGHTS.map((exp, idx) => {
            const isHovered = hoveredExpId === exp.id;
            const telemetry = CHAPTER_PHOTO_TELEMETRY[exp.id] || {
              altitude: 'Himalayan Ridge',
              lensSetup: 'Documentary Master',
              lightingZone: 'High Altitude Light',
              sensoryFocus: 'Alpine Wilderness',
              fieldCoordinate: 'Garhwal Himalayas'
            };

            // Bespoke asymmetrical spans and vertical staggered offsets
            // Item 0: 7 Cols (Expansive Landscape Panorama)
            // Item 1: 5 Cols (Tall Vertical Alpenglow Portrait)
            // Item 2: 5 Cols (Celestial Night Dark Luxury Frame, offset down)
            // Item 3: 7 Cols (Bioclimatic Continuum Wide Spread)
            const isLargeSpan = idx === 0 || idx === 3;
            const colSpanClass = isLargeSpan ? 'lg:col-span-7' : 'lg:col-span-5';
            const offsetClass = idx === 1 
              ? 'lg:translate-y-4' 
              : idx === 2 
                ? 'lg:-translate-y-2' 
                : '';

            // Organic asymmetrical corner styling
            const cornerStyle = idx === 0 
              ? 'rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-2xl rounded-bl-2xl'
              : idx === 1
                ? 'rounded-tr-[2.5rem] rounded-bl-[2.5rem] rounded-tl-2xl rounded-br-2xl'
                : idx === 2
                  ? 'rounded-bl-[2.5rem] rounded-tr-[2.5rem] rounded-tl-2xl rounded-br-2xl'
                  : 'rounded-br-[2.5rem] rounded-tl-[2.5rem] rounded-tr-2xl rounded-bl-2xl';

            const imageHeightClass = idx === 0 
              ? 'h-72 sm:h-84 md:h-96' 
              : idx === 1 
                ? 'h-80 sm:h-96 md:h-[28rem]' 
                : idx === 2 
                  ? 'h-72 sm:h-80 md:h-[22rem]' 
                  : 'h-64 sm:h-80 md:h-92';

            return (
              <motion.div
                key={exp.id}
                onClick={() => setSelectedExperience(exp)}
                onMouseEnter={() => handleMouseEnter(exp.id)}
                onMouseLeave={handleMouseLeave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedExperience(exp);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Discover sensory details and field notes for ${exp.title}`}
                animate={{
                  y: isHovered ? -8 : 0,
                  scale: isHovered ? 1.012 : 1,
                  boxShadow: isHovered 
                    ? "0 30px 60px -15px rgba(19, 78, 53, 0.18)" 
                    : "0 4px 20px -2px rgba(0, 0, 0, 0.04)"
                }}
                whileTap={{ scale: 0.985 }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className={`${colSpanClass} ${offsetClass} group relative ${cornerStyle} overflow-hidden bg-white border transition-colors duration-300 flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#134E35] focus:ring-offset-2 ${
                  isHovered ? 'border-[#134E35]' : 'border-[#E2DDD3]'
                }`}
              >
                {/* Handcrafted Passe-Partout Inner Matte Border */}
                <div className="p-3 sm:p-4 pb-0 flex-1 flex flex-col">
                  
                  {/* Image Container with Deckle Framing & Archival Coordinates */}
                  <div className={`relative ${imageHeightClass} w-full overflow-hidden ${cornerStyle} bg-black/10 shadow-inner`}>
                    
                    {/* Archival Museum Mount Corners */}
                    <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-white/90 z-20 pointer-events-none transition-transform duration-300 group-hover:scale-110" />
                    <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-white/90 z-20 pointer-events-none transition-transform duration-300 group-hover:scale-110" />
                    <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-white/90 z-20 pointer-events-none transition-transform duration-300 group-hover:scale-110" />
                    <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-white/90 z-20 pointer-events-none transition-transform duration-300 group-hover:scale-110" />

                    <motion.img
                      src={exp.image}
                      alt={exp.title}
                      className="w-full h-full object-cover filter contrast-105"
                      referrerPolicy="no-referrer"
                      animate={{ scale: isHovered ? 1.08 : 1.0 }}
                      transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
                    />

                    {/* Gradient Backdrops */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/35 pointer-events-none" />

                    {/* Top Floating Archival Badges */}
                    <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
                      <span className="px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-white font-oswald text-[10px] uppercase tracking-widest font-bold shadow-md">
                        {exp.tag}
                      </span>
                      <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-[#134E35]/80 backdrop-blur-md border border-white/15 text-[#E5C378] font-oswald text-[9px] uppercase tracking-wider font-semibold">
                        {telemetry.altitude}
                      </span>
                    </div>

                    <div className="absolute top-4 right-4 z-10 text-[10px] font-oswald text-[#E5C378] bg-black/75 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 font-bold tracking-widest">
                      CHAPTER 0{idx + 1}
                    </div>

                    {/* Permanent Field Coordinate Ribbon along Image Bottom */}
                    <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between text-[10px] font-oswald tracking-widest text-white/80 uppercase pointer-events-none">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-[#E5C378]" />
                        <span>{telemetry.fieldCoordinate}</span>
                      </span>
                      <span className="text-[#E5C378] font-bold">CLICK TO EXPAND</span>
                    </div>

                    {/* Interactive Photography Telemetry Overlay (Revealed on Hover via Framer Motion) */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                          animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
                          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                          transition={{ duration: 0.28 }}
                          className="absolute inset-0 bg-black/65 p-6 flex flex-col justify-between z-20 pointer-events-none"
                        >
                          {/* Telemetry Header */}
                          <motion.div
                            initial={{ y: -8, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -8, opacity: 0 }}
                            transition={{ duration: 0.25, delay: 0.05 }}
                            className="flex items-center justify-between text-[10px] font-oswald tracking-widest text-[#E5C378] uppercase"
                          >
                            <span className="flex items-center gap-1.5">
                              <Camera className="w-3.5 h-3.5 text-[#E5C378]" />
                              <span>FIELD ARCHIVE DOSSIER</span>
                            </span>
                            <span className="text-white/80">{telemetry.fieldCoordinate}</span>
                          </motion.div>

                          {/* Central Viewfinder Crosshair */}
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col items-center justify-center text-center my-auto"
                          >
                            <div className="relative mb-3">
                              <Crosshair className="w-10 h-10 text-[#E5C378]/80 animate-pulse" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#E5C378]" />
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#134E35] text-white text-xs font-oswald font-bold tracking-widest uppercase shadow-2xl border border-white/30">
                              <Eye className="w-3.5 h-3.5 text-[#E5C378]" />
                              <span>VIEW FULL FIELD DOSSIER</span>
                            </span>
                          </motion.div>

                          {/* Telemetry Footer Card */}
                          <motion.div
                            initial={{ y: 8, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 8, opacity: 0 }}
                            transition={{ duration: 0.25, delay: 0.08 }}
                            className="bg-black/75 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 text-[10px] font-oswald text-white/95 space-y-1"
                          >
                            <div className="flex justify-between text-[#E5C378]">
                              <span>ALTITUDE TELEMETRY:</span>
                              <span className="text-white font-medium">{telemetry.altitude}</span>
                            </div>
                            <div className="flex justify-between text-[#E5C378]">
                              <span>OPTICAL CONFIGURATION:</span>
                              <span className="text-white/90">{telemetry.lensSetup}</span>
                            </div>
                            <div className="flex justify-between text-[#E5C378]">
                              <span>LIGHTING ENVIRONMENT:</span>
                              <span className="text-white/90">{telemetry.lightingZone}</span>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Editorial Text Body with Varied Breathing Room */}
                  <div className="p-4 sm:p-6 sm:pb-8 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-oswald tracking-[0.2em] text-[#8F4F38] uppercase font-bold">
                          {exp.category}
                        </span>
                        <span className="text-[10px] font-nunito text-[#64748B] flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-[#134E35]" />
                          <span>Himalayan Dossier</span>
                        </span>
                      </div>

                      <h3 className="font-playfair text-xl sm:text-2xl font-bold text-[#1D2530] leading-snug group-hover:text-[#134E35] transition-colors">
                        {exp.title}
                      </h3>
                      
                      <p className="mt-3 text-xs sm:text-sm font-nunito text-[#4A5568] leading-relaxed text-pretty">
                        {exp.description}
                      </p>

                      {/* Sensory Note Capsule */}
                      <div className="mt-4 p-3 rounded-2xl bg-[#FAF8F3] border border-[#E2DDD3] text-xs font-nunito text-[#134E35] italic flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-[#8F4F38] shrink-0 mt-0.5" />
                        <span>{telemetry.sensoryFocus}</span>
                      </div>
                    </div>

                    {/* Tactile Interactive Action Footer with Explicit Discover / View Details Button */}
                    <div className="mt-6 pt-4 border-t border-[#E2DDD3] flex items-center justify-between gap-3 text-xs font-oswald tracking-wider uppercase transition-colors">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-oswald text-[#8F4F38] uppercase font-bold tracking-widest">
                          SENSORY CHAPTER 0{idx + 1}
                        </span>
                        <span className="text-xs font-oswald text-[#1D2530] font-bold group-hover:text-[#134E35] transition-colors">
                          FIELD JOURNAL
                        </span>
                      </div>

                      {/* Interactive Discover Button Trigger */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedExperience(exp);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#EAF5EE] group-hover:bg-[#134E35] text-[#134E35] group-hover:text-white font-oswald text-xs font-bold tracking-wider uppercase border border-[#134E35]/25 group-hover:border-[#134E35] transition-all duration-300 shadow-xs hover:shadow-md active:scale-95 cursor-pointer"
                        aria-label={`Discover full details for ${exp.title}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>DISCOVER DETAILS</span>
                        <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </button>
                    </div>
                  </div>

                </div>
              </motion.div>
            );
          })}
        </div>

      </div>

      {/* Deep Dive Modal */}
      <ExperienceModal
        experience={selectedExperience}
        onClose={() => setSelectedExperience(null)}
        onPlanExpedition={handlePlanExpedition}
      />
    </section>
  );
};

export default ExperienceSection;
