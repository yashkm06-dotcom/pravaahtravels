/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  MapPin, 
  Users, 
  ClipboardCheck, 
  TreePine, 
  Headphones, 
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  Camera,
  Activity,
  Layers
} from 'lucide-react';
import { BRAND_DIFFERENTIATORS } from '../data/roopkundData';
import { BrandDifferentiator } from '../types';
import { WhyPravaahModal } from './WhyPravaahModal';

interface WhyPravaahProps {
  onOpenEnquiry?: () => void;
}

// The original six-card visual is retained while operational claims remain under review.
const PILLAR_FIELD_ASSETS: Record<number, {
  image: string;
  fieldBenchmark: string;
  protocolBadge: string;
  auditStat: string;
}> = {
  0: {
    image: '/images/roopkund/why-route.jpg',
    fieldBenchmark: 'Route profile and pacing to be confirmed',
    protocolBadge: 'ROUTE REVIEW IN PROGRESS',
    auditStat: 'Details Under Review'
  },
  1: {
    image: '/images/roopkund/why-ground-team.jpg',
    fieldBenchmark: 'Ground-team details to be confirmed',
    protocolBadge: 'PARTNER REVIEW IN PROGRESS',
    auditStat: 'Details Under Review'
  },
  2: {
    image: '/images/roopkund/why-community.jpg',
    fieldBenchmark: 'Group size and staffing to be confirmed',
    protocolBadge: 'GROUP PLAN IN REVIEW',
    auditStat: 'Details Under Review'
  },
  3: {
    image: '/images/roopkund/why-preparation.jpg',
    fieldBenchmark: 'Preparation information to be confirmed',
    protocolBadge: 'PREPARATION UNDER REVIEW',
    auditStat: 'Details Under Review'
  },
  4: {
    image: '/images/roopkund/why-stewardship.jpg',
    fieldBenchmark: 'Conservation procedures to be confirmed',
    protocolBadge: 'STEWARDSHIP UNDER REVIEW',
    auditStat: 'Details Under Review'
  },
  5: {
    image: '/images/roopkund/why-support.jpg',
    fieldBenchmark: 'Support arrangements to be confirmed',
    protocolBadge: 'SUPPORT PLAN IN REVIEW',
    auditStat: 'Verified Contacts Only'
  }
};

export const WhyPravaah: React.FC<WhyPravaahProps> = ({ onOpenEnquiry }) => {
  const [selectedPillar, setSelectedPillar] = useState<BrandDifferentiator | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const handlePlanExpedition = () => {
    if (onOpenEnquiry) {
      onOpenEnquiry();
    } else {
      const bookingEl = document.getElementById('booking');
      bookingEl?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleMouseEnter = (index: number) => {
    setHoveredIdx(index);
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Compass': return <Compass className="w-5 h-5" />;
      case 'MapPin': return <MapPin className="w-5 h-5" />;
      case 'Users': return <Users className="w-5 h-5" />;
      case 'ClipboardCheck': return <ClipboardCheck className="w-5 h-5" />;
      case 'TreePine': return <TreePine className="w-5 h-5" />;
      case 'Headphones': return <Headphones className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <section id="why-pravaah" className="py-24 sm:py-32 bg-[#FAF8F3] text-[#1D2530] relative overflow-hidden border-t border-[#E2DDD3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Editorial Section Header with Asymmetrical Split */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16 sm:mb-20 pb-8 border-b border-[#E2DDD3]">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#134E35]/10 border border-[#134E35]/20 text-[10px] font-oswald tracking-[0.25em] text-[#134E35] uppercase font-bold mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-[#134E35]" />
              <span>THE HIMALAYAN EXPEDITION DIFFERENCE</span>
            </div>
            <h2 className="font-playfair text-4xl sm:text-5xl md:text-6xl font-bold tracking-[0.03em] uppercase text-[#1D2530] mt-1 leading-[1.06]">
              WHY <span className="text-[#8F4F38] italic font-normal">PRAVAAH?</span>
            </h2>
          </div>

          <div className="max-w-md lg:text-right flex flex-col justify-end">
            <p className="text-base sm:text-lg font-garamond italic text-[#4A5568] leading-relaxed">
              “The same six-pillar expedition story is preserved while its route, team, group, preparation, stewardship and support details are verified.”
            </p>
            <div className="mt-3 flex items-center lg:justify-end gap-2 text-xs font-nunito text-[#134E35] uppercase tracking-wider font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#134E35] animate-ping" />
              <span>Hover for review notes • Click any pillar for current details</span>
            </div>
          </div>
        </div>

        {/* Bespoke Asymmetrical Editorial Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {BRAND_DIFFERENTIATORS.map((diff, index) => {
            const isHovered = hoveredIdx === index;
            const fieldAsset = PILLAR_FIELD_ASSETS[index] || {
              image: '/images/roopkund/why-route.jpg',
              fieldBenchmark: 'Details to be confirmed',
              protocolBadge: 'EXPEDITION REVIEW',
              auditStat: 'Under Review'
            };

            // Bespoke asymmetrical grid distribution:
            // Pillar 0 (Acclimatization): 8 Cols (Dominant Feature Card)
            // Pillar 1 (Garhwali Heritage): 4 Cols (Tall Portrait Card)
            // Pillar 2 (Small Batches): 4 Cols (Offset Card)
            // Pillar 3 (Readiness Audit): 4 Cols (Central Anchor Card)
            // Pillar 4 (Eco-Ethics): 4 Cols (Offset Card)
            // Pillar 5 (Safety & Rescue): 12 Cols (Expansive Telemetry Banner Spread)
            let colSpanClass = 'lg:col-span-4';
            let offsetClass = '';
            let cornerStyle = 'rounded-2xl';

            if (index === 0) {
              colSpanClass = 'lg:col-span-8';
              cornerStyle = 'rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-2xl rounded-bl-2xl';
            } else if (index === 1) {
              colSpanClass = 'lg:col-span-4';
              cornerStyle = 'rounded-tr-[2.5rem] rounded-bl-[2.5rem] rounded-tl-2xl rounded-br-2xl';
            } else if (index === 2) {
              colSpanClass = 'lg:col-span-4';
              offsetClass = 'lg:translate-y-2';
              cornerStyle = 'rounded-bl-[2.5rem] rounded-tr-[2.5rem] rounded-tl-2xl rounded-br-2xl';
            } else if (index === 3) {
              colSpanClass = 'lg:col-span-4';
              offsetClass = 'lg:-translate-y-2';
              cornerStyle = 'rounded-2xl';
            } else if (index === 4) {
              colSpanClass = 'lg:col-span-4';
              offsetClass = 'lg:translate-y-2';
              cornerStyle = 'rounded-br-[2.5rem] rounded-tl-[2.5rem] rounded-tr-2xl rounded-bl-2xl';
            } else if (index === 5) {
              colSpanClass = 'lg:col-span-12';
              cornerStyle = 'rounded-[2rem]';
            }

            return (
              <motion.div
                key={index}
                onClick={() => setSelectedPillar(diff)}
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedPillar(diff);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`View protocols and standards for ${diff.headline}`}
                animate={{
                  y: isHovered ? -8 : 0,
                  scale: isHovered ? 1.012 : 1,
                  boxShadow: isHovered 
                    ? "0 30px 60px -15px rgba(19, 78, 53, 0.18)" 
                    : "0 4px 20px -2px rgba(0, 0, 0, 0.04)"
                }}
                whileTap={{ scale: 0.985 }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className={`${colSpanClass} ${offsetClass} bg-white ${cornerStyle} p-6 sm:p-8 border transition-colors duration-300 flex flex-col justify-between cursor-pointer group focus:outline-none focus:ring-2 focus:ring-[#134E35] focus:ring-offset-2 relative overflow-hidden ${
                  isHovered ? 'border-[#134E35]' : 'border-[#E2DDD3]'
                }`}
              >
                {/* Accent Top Border Bar with Framer Motion Origin Animation */}
                <motion.div 
                  className="absolute top-0 left-0 right-0 h-1 bg-[#134E35]"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: isHovered ? 1 : 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  style={{ transformOrigin: "left" }}
                />

                <div className={index === 5 ? 'lg:flex lg:items-center lg:justify-between lg:gap-12' : ''}>
                  <div className={index === 5 ? 'lg:max-w-2xl' : ''}>
                    {/* Top Bar with Icon, Index, and Animated Protocol Tag */}
                    <div className="flex items-center justify-between mb-6">
                      <motion.div 
                        className={`p-3.5 rounded-2xl border transition-colors duration-300 shadow-sm ${
                          isHovered
                            ? 'bg-[#134E35] text-white border-[#134E35]'
                            : 'bg-[#EAF5EE] text-[#134E35] border-[#134E35]/20'
                        }`}
                        animate={{
                          scale: isHovered ? 1.08 : 1,
                          rotate: isHovered ? -3 : 0
                        }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      >
                        {getIcon(diff.icon)}
                      </motion.div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-oswald uppercase tracking-wider text-[#64748B] bg-[#FAF8F3] px-3 py-1 rounded-full border border-[#E2DDD3] font-bold">
                          PILLAR 0{index + 1}
                        </span>
                        <span className="text-xs font-oswald text-[#64748B] group-hover:text-[#134E35] font-bold tracking-widest">
                          //
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-oswald uppercase text-[#8F4F38] font-bold tracking-widest block mb-1">
                      {diff.title}
                    </span>

                    <h3 className={`font-playfair font-bold text-[#1D2530] group-hover:text-[#134E35] transition-colors leading-snug ${
                      index === 0 ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
                    }`}>
                      {diff.headline}
                    </h3>

                    <p className="mt-3 text-xs sm:text-sm text-[#4A5568] leading-relaxed font-nunito font-normal text-pretty">
                      {diff.description}
                    </p>
                  </div>

                  {/* Photography Overlay & Field Protocol Preview (Revealed on Hover or Inline for Featured Card) */}
                  <div className={index === 5 ? 'mt-6 lg:mt-0 lg:w-96 shrink-0' : 'mt-4'}>
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ height: 0, opacity: 0, marginTop: 0 }}
                          animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                          exit={{ height: 0, opacity: 0, marginTop: 0 }}
                          transition={{ duration: 0.28, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <div className="relative rounded-2xl overflow-hidden border border-[#134E35]/30 shadow-md">
                            {/* Photo Backdrop */}
                            <div className={`${index === 0 ? 'h-36 sm:h-44' : 'h-28 sm:h-32'} w-full relative bg-black/20`}>
                              <motion.img
                                src={fieldAsset.image}
                                alt={diff.title}
                                className="w-full h-full object-cover filter contrast-105"
                                referrerPolicy="no-referrer"
                                initial={{ scale: 1.0 }}
                                animate={{ scale: 1.06 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/25" />

                              {/* Badge on Photo */}
                              <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md border border-white/20 text-[9px] font-oswald text-[#E5C378] uppercase tracking-wider font-bold">
                                {fieldAsset.protocolBadge}
                              </div>

                              <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white text-[10px] font-nunito leading-tight">
                                <span className="text-[#E5C378] font-bold font-oswald block text-[9px] uppercase tracking-wider">
                                  CURRENT STATUS:
                                </span>
                                <span className="line-clamp-1 text-white/95">{fieldAsset.fieldBenchmark}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Tactile Bottom Action Bar with Framer Motion Arrow */}
                <div className="mt-7 pt-4 border-t border-[#E2DDD3] flex items-center justify-between text-xs font-oswald tracking-wider uppercase transition-colors">
                  <div className="flex flex-col">
                    <span className="text-[#134E35] font-bold group-hover:text-[#8F4F38] flex items-center gap-1.5">
                      <span>{diff.keyAspect}</span>
                    </span>
                    <span className="text-[10px] text-[#64748B] font-nunito normal-case">
                      Click to inspect current review details
                    </span>
                  </div>

                  <motion.div 
                    className="w-8 h-8 rounded-full bg-[#FAF8F3] group-hover:bg-[#134E35] group-hover:text-white flex items-center justify-center transition-colors border border-[#E2DDD3] group-hover:border-[#134E35] shadow-xs"
                    animate={{ rotate: isHovered ? 45 : 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ArrowUpRight className="w-4 h-4 text-current" />
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>

      {/* Deep Dive Modal */}
      <WhyPravaahModal
        pillar={selectedPillar}
        onClose={() => setSelectedPillar(null)}
        onPlanExpedition={handlePlanExpedition}
      />
    </section>
  );
};

export default WhyPravaah;
