/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, MapPin, Compass, Mountain, Camera, Sun, ShieldCheck, ArrowRight, Eye, Layers } from 'lucide-react';
import type { ExperienceHighlight } from '../types';

interface ExtendedExperienceDetail {
  sensorySights: string;
  sensorySounds: string;
  sensoryScents: string;
  bestSeason: string;
  altitudeContext: string;
  photographyTip: string;
  loreOrEtiquette: string;
  quote: string;
}

const REVIEWED_EXPERIENCE_DETAIL: ExtendedExperienceDetail = {
  quote: "Visual story preserved; factual details are under review.",
  sensorySights: "The exact landscape, visibility and environmental details are to be confirmed.",
  sensorySounds: "Soundscape details are illustrative and subject to final route confirmation.",
  sensoryScents: "Atmospheric details are to be confirmed.",
  bestSeason: "To be confirmed by Pravaah Travels.",
  altitudeContext: "Altitude, distance and sector are to be confirmed.",
  photographyTip: "The original image and crop are preserved; current access and photography conditions are to be confirmed.",
  loreOrEtiquette: "Cultural, legal, conservation and visitor-conduct guidance will be published after authoritative verification.",
};

const EXPERIENCE_DEEP_DATA: Record<string, ExtendedExperienceDetail> = {
  "exp-1": REVIEWED_EXPERIENCE_DETAIL,
  "exp-2": REVIEWED_EXPERIENCE_DETAIL,
  "exp-3": REVIEWED_EXPERIENCE_DETAIL,
  "exp-4": REVIEWED_EXPERIENCE_DETAIL,
  "exp-5": REVIEWED_EXPERIENCE_DETAIL,
  "exp-6": REVIEWED_EXPERIENCE_DETAIL,
  "exp-7": REVIEWED_EXPERIENCE_DETAIL,
  "exp-8": REVIEWED_EXPERIENCE_DETAIL,
};

interface ExperienceModalProps {
  experience: ExperienceHighlight | null;
  onClose: () => void;
  onPlanExpedition: () => void;
}

export const ExperienceModal: React.FC<ExperienceModalProps> = ({
  experience,
  onClose,
  onPlanExpedition
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    if (experience) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [experience, onClose]);

  const deepData = experience ? (EXPERIENCE_DEEP_DATA[experience.id] || {
    quote: `“${experience.description}”`,
    sensorySights: 'Landscape details to be confirmed.',
    sensorySounds: 'Soundscape details to be confirmed.',
    sensoryScents: 'Atmospheric details to be confirmed.',
    bestSeason: 'To be confirmed by Pravaah Travels.',
    altitudeContext: 'Altitude and route sector to be confirmed.',
    photographyTip: 'Access and photography conditions are to be confirmed.',
    loreOrEtiquette: 'Current cultural, legal and conservation guidance is under review.'
  }) : null;

  return (
    <AnimatePresence>
      {experience && deepData && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-black/75 backdrop-blur-md overflow-y-auto"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="experience-modal-title"
        >
          {/* Backdrop Clickable Dimmer Layer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0"
            aria-hidden="true"
          />

          {/* Centered Modal Content Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.45, bounce: 0.15 }}
            className="relative w-full max-w-4xl bg-[#FAF8F3] text-[#1D2530] rounded-3xl overflow-hidden shadow-2xl border border-[#E2DDD3] my-auto z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button Top Right */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/60 hover:bg-[#134E35] text-white backdrop-blur-md transition-all duration-200 border border-white/25 hover:scale-105 active:scale-95 shadow-xl cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Hero Image Section */}
            <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden bg-black">
              <img
                src={experience.image}
                alt={experience.title}
                className="w-full h-full object-cover filter contrast-105 brightness-95"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/50" />

              {/* Floating Badges */}
              <div className="absolute top-5 left-5 flex flex-wrap gap-2 z-10">
                <span className="px-3 py-1.5 rounded-full bg-[#134E35] text-white text-xs font-oswald tracking-widest uppercase font-semibold shadow-md">
                  {experience.tag}
                </span>
                <span className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[#E5C378] text-xs font-oswald tracking-wider uppercase font-medium">
                  {experience.category}
                </span>
              </div>

              {/* Title on Image */}
              <div className="absolute bottom-6 left-6 right-6 z-10">
                <div className="flex items-center gap-2 text-xs font-oswald tracking-widest text-[#E5C378] uppercase mb-1.5 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>SENSORY FIELD DOSSIER</span>
                </div>
                <h3 id="experience-modal-title" className="font-playfair text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                  {experience.title}
                </h3>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 md:p-10 space-y-8 max-h-[60vh] overflow-y-auto">
              
              {/* Poetic Quote */}
              <div className="p-5 rounded-2xl bg-white border-l-4 border-[#134E35] text-[#1D2530] shadow-sm">
                <p className="font-garamond italic text-base sm:text-lg leading-relaxed text-[#134E35] font-medium">
                  {deepData.quote}
                </p>
              </div>

              {/* Full Narrative */}
              <div>
                <h4 className="text-xs font-oswald tracking-[0.2em] text-[#8F4F38] uppercase font-bold mb-2">
                  THE EXPEDITION SENSORY CHAPTER
                </h4>
                <p className="text-sm sm:text-base font-nunito text-[#4A5568] leading-relaxed text-pretty">
                  {experience.description} The approved visual narrative remains unchanged while route access, timing and environmental details are being verified.
                </p>
              </div>

              {/* 3 Sensory Dimensions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-[#E2DDD3] shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-oswald tracking-wider text-[#134E35] uppercase font-bold mb-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>WHAT YOU WILL SEE</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#4A5568] leading-relaxed font-nunito">
                    {deepData.sensorySights}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#E2DDD3] shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-oswald tracking-wider text-[#134E35] uppercase font-bold mb-1.5">
                    <Compass className="w-4 h-4" />
                    <span>WHAT YOU WILL HEAR</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#4A5568] leading-relaxed font-nunito">
                    {deepData.sensorySounds}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#E2DDD3] shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-oswald tracking-wider text-[#134E35] uppercase font-bold mb-1.5">
                    <Sun className="w-4 h-4" />
                    <span>AROMATIC ATMOSPHERE</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#4A5568] leading-relaxed font-nunito">
                    {deepData.sensoryScents}
                  </p>
                </div>
              </div>

              {/* Key Expedition Telemetry & Logistics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-[#E2DDD3] shadow-sm">
                  <Mountain className="w-5 h-5 text-[#134E35] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] font-oswald text-[#134E35] uppercase font-bold tracking-wider">
                      ALTITUDE & SECTOR
                    </div>
                    <div className="text-xs sm:text-sm text-[#1D2530] font-nunito font-medium mt-0.5">
                      {deepData.altitudeContext}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-[#E2DDD3] shadow-sm">
                  <Sun className="w-5 h-5 text-[#134E35] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] font-oswald text-[#134E35] uppercase font-bold tracking-wider">
                      EXPEDITION SEASON
                    </div>
                    <div className="text-xs sm:text-sm text-[#1D2530] font-nunito font-medium mt-0.5">
                      {deepData.bestSeason}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-[#E2DDD3] shadow-sm">
                  <Camera className="w-5 h-5 text-[#134E35] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] font-oswald text-[#134E35] uppercase font-bold tracking-wider">
                      PHOTOGRAPHER'S MEMORANDUM
                    </div>
                    <div className="text-xs sm:text-sm text-[#4A5568] font-nunito mt-0.5 leading-relaxed">
                      {deepData.photographyTip}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-[#E2DDD3] shadow-sm">
                  <ShieldCheck className="w-5 h-5 text-[#134E35] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] font-oswald text-[#134E35] uppercase font-bold tracking-wider">
                      CULTURAL & ACCESS REVIEW
                    </div>
                    <div className="text-xs sm:text-sm text-[#4A5568] font-nunito mt-0.5 leading-relaxed">
                      {deepData.loreOrEtiquette}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-6 border-t border-[#E2DDD3] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-[#4A5568] font-nunito text-center sm:text-left">
                  Duration and operating details are subject to final expedition confirmation.
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={onClose}
                    className="flex-1 sm:flex-none px-6 py-3 rounded-full border border-[#E2DDD3] hover:bg-white text-xs font-oswald font-bold tracking-wider uppercase transition-colors text-[#1D2530] cursor-pointer"
                  >
                    CLOSE
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onPlanExpedition();
                    }}
                    className="flex-1 sm:flex-none px-7 py-3 rounded-full bg-[#8F4F38] hover:bg-[#7A3F2C] text-white text-xs font-oswald font-bold tracking-wider uppercase transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>PLAN EXPEDITION</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ExperienceModal;
