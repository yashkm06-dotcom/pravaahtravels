/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Compass, 
  MapPin, 
  Users, 
  ClipboardCheck, 
  TreePine, 
  Headphones, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  PhoneCall
} from 'lucide-react';
import type { BrandDifferentiator } from '../types';

interface ExtendedPillarDetail {
  operationalStandard: string;
  fieldProtocols: string[];
  whyItMattersForYou: string;
  nativeInsight: string;
  statisticalBenchmark: string;
}

const PILLAR_DEEP_DATA: Record<string, ExtendedPillarDetail> = {
  'CURATED HIMALAYAN ROUTES': {
    operationalStandard: 'Route and operating plan under review',
    fieldProtocols: [
      'Final access, route stages and camp plan are to be confirmed.',
      'Distance, altitude and daily timing claims are not presented as verified here.',
      'Seasonal and weather contingencies will be included in the final brief.',
      'The published plan will replace these review notes once verified.'
    ],
    whyItMattersForYou: 'A traveller should be able to review current, internally consistent route information before deciding whether to enquire.',
    nativeInsight: 'Route context will be added only after source and operating verification.',
    statisticalBenchmark: 'No success-rate, altitude or timing benchmark is claimed on this preview.'
  },
  'GROUND PARTNERS': {
    operationalStandard: 'Partner details awaiting confirmation',
    fieldProtocols: [
      'Ground-team identities and responsibilities are being verified.',
      'Employment, insurance and equipment claims are not made on this preview.',
      'Supplier and accommodation arrangements remain to be confirmed.',
      'Any local-partner information will be published only with factual support.'
    ],
    whyItMattersForYou: 'Clear partner information helps travellers understand who is responsible for the final operating plan.',
    nativeInsight: 'Local and cultural claims remain under review until the relevant details are verified.',
    statisticalBenchmark: 'No staffing or local-economic percentage is claimed on this preview.'
  },
  'GROUP FORMAT': {
    operationalStandard: 'Group and staffing details awaiting confirmation',
    fieldProtocols: [
      'Final batch size is to be confirmed in writing.',
      'Staffing, qualifications and supervision ratios remain under review.',
      'No medical-monitoring protocol is represented as confirmed here.',
      'Accommodation and equipment arrangements are to be confirmed.'
    ],
    whyItMattersForYou: 'Written group and staffing details prevent an illustrative design from being mistaken for an operating guarantee.',
    nativeInsight: 'The final group format will be shared after the operating plan is verified.',
    statisticalBenchmark: 'No group cap or guide-to-traveller ratio is claimed on this preview.'
  },
  'PRE-TRIP PREPARATION': {
    operationalStandard: 'Preparation brief awaiting confirmation',
    fieldProtocols: [
      'Route-specific preparation information is still being reviewed.',
      'Any gear-review process will be stated in the final participant brief.',
      'This page does not promise clinical review or provide medical advice.',
      'Communication and coordination arrangements are to be confirmed.'
    ],
    whyItMattersForYou: 'The final preparation information should match the confirmed route, season and operating requirements.',
    nativeInsight: 'Use only the final written brief for expedition-specific preparation decisions.',
    statisticalBenchmark: 'No training duration, assessment or inspection rate is claimed on this preview.'
  },
  'RESPONSIBLE TRAVEL': {
    operationalStandard: 'Stewardship procedures awaiting confirmation',
    fieldProtocols: [
      'Waste and sanitation procedures are being reviewed.',
      'Plastic, water and campsite practices are to be confirmed.',
      'No cleanup quantity or environmental outcome is claimed here.',
      'Current conservation and access requirements will govern the final plan.'
    ],
    whyItMattersForYou: 'Specific environmental promises should be published only when the operating practice and applicable requirements are verified.',
    nativeInsight: 'Stewardship details remain subject to final expedition confirmation.',
    statisticalBenchmark: 'No zero-waste or cleanup-performance benchmark is claimed on this preview.'
  },
  'HUMAN SUPPORT': {
    operationalStandard: 'Verified Pravaah contact channels',
    fieldProtocols: [
      'Use the phone, WhatsApp and email details supplied by the Pravaah CMS.',
      'Mountain communication arrangements are not represented as confirmed here.',
      'Family updates and emergency liaison procedures are to be confirmed.',
      'Transport and accommodation coordination remain subject to the final plan.'
    ],
    whyItMattersForYou: 'Verified contact channels let travellers request current information without an unsupported response-time or availability promise.',
    nativeInsight: 'Contact and support details will follow the confirmed operating plan.',
    statisticalBenchmark: 'No round-the-clock availability or response-time benchmark is claimed.'
  }
};

interface WhyPravaahModalProps {
  pillar: BrandDifferentiator | null;
  onClose: () => void;
  onPlanExpedition: () => void;
}

export const WhyPravaahModal: React.FC<WhyPravaahModalProps> = ({
  pillar,
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

    if (pillar) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [pillar, onClose]);

  const deepData = pillar ? (PILLAR_DEEP_DATA[pillar.title] || {
    operationalStandard: pillar.headline,
    fieldProtocols: [
      'The relevant operating details are under review.',
      'No staffing, certification or group-format claim is made here.',
      'The final written plan will replace these review notes.'
    ],
    whyItMattersForYou: pillar.description,
    nativeInsight: 'Details to be confirmed by Pravaah Travels.',
    statisticalBenchmark: 'No performance benchmark is claimed on this preview.'
  }) : null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Compass': return <Compass className="w-8 h-8" />;
      case 'MapPin': return <MapPin className="w-8 h-8" />;
      case 'Users': return <Users className="w-8 h-8" />;
      case 'ClipboardCheck': return <ClipboardCheck className="w-8 h-8" />;
      case 'TreePine': return <TreePine className="w-8 h-8" />;
      case 'Headphones': return <Headphones className="w-8 h-8" />;
      default: return <Sparkles className="w-8 h-8" />;
    }
  };

  return (
    <AnimatePresence>
      {pillar && deepData && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-black/75 backdrop-blur-md overflow-y-auto"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pillar-modal-title"
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
            className="relative w-full max-w-3xl bg-[#FAF8F3] text-[#1D2530] rounded-3xl overflow-hidden shadow-2xl border border-[#E2DDD3] my-auto z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button Top Right */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 z-20 p-2.5 rounded-full bg-[#1D2530]/5 hover:bg-[#134E35] text-[#1D2530] hover:text-white transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm border border-[#E2DDD3] cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header with Warm Editorial Tint */}
            <div className="p-6 sm:p-8 md:p-10 bg-white border-b border-[#E2DDD3]">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 rounded-2xl bg-[#134E35] text-white shadow-md">
                  {getIcon(pillar.icon)}
                </div>
                <div>
                  <span className="text-xs font-oswald tracking-[0.25em] text-[#134E35] uppercase font-bold">
                    THE PRAVAAH DIFFERENCE
                  </span>
                  <div className="text-xs font-nunito text-[#8F4F38] uppercase font-semibold tracking-wider">
                    {pillar.keyAspect}
                  </div>
                </div>
              </div>

              <h3 id="pillar-modal-title" className="font-playfair text-2xl sm:text-3xl font-bold text-[#1D2530] leading-tight">
                {pillar.headline}
              </h3>
              <p className="mt-2 text-xs sm:text-sm font-oswald tracking-wide text-[#134E35] uppercase font-bold">
                STATUS: {deepData.operationalStandard}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 md:p-10 space-y-8 max-h-[55vh] overflow-y-auto">
              
              {/* Main Description */}
              <div>
                <h4 className="text-xs font-oswald tracking-[0.2em] text-[#8F4F38] uppercase font-bold mb-2">
                  WHY THIS REVIEW MATTERS
                </h4>
                <p className="text-sm sm:text-base font-nunito text-[#4A5568] leading-relaxed text-pretty">
                  {deepData.whyItMattersForYou}
                </p>
              </div>

              {/* Operational Protocols Checklist */}
              <div className="p-6 rounded-2xl bg-white border border-[#E2DDD3] shadow-sm">
                <h4 className="text-xs font-oswald tracking-[0.2em] text-[#1D2530] uppercase font-bold mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#134E35]" />
                  <span>DETAILS UNDER REVIEW</span>
                </h4>
                <div className="space-y-3">
                  {deepData.fieldProtocols.map((protocol, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#134E35] shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm text-[#4A5568] font-nunito leading-relaxed">
                        {protocol}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Native Quote & Statistical Benchmark */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-[#E2DDD3] shadow-sm">
                  <div className="text-[11px] font-oswald text-[#8F4F38] uppercase font-bold tracking-wider mb-1">
                    CURRENT REVIEW NOTE
                  </div>
                  <p className="font-garamond italic text-xs sm:text-sm text-[#134E35] leading-relaxed font-semibold">
                    {deepData.nativeInsight}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-[#E2DDD3] shadow-sm">
                  <div className="text-[11px] font-oswald text-[#134E35] uppercase font-bold tracking-wider mb-1">
                    PUBLISHED BENCHMARK
                  </div>
                  <p className="font-nunito font-semibold text-xs sm:text-sm text-[#1D2530] leading-relaxed">
                    {deepData.statisticalBenchmark}
                  </p>
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-6 border-t border-[#E2DDD3] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-[#4A5568] font-nunito">
                  <PhoneCall className="w-4 h-4 text-[#134E35]" />
                  <span>Use the verified Pravaah contact channels for current details</span>
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
                    <span>PLAN YOUR EXPEDITION</span>
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

export default WhyPravaahModal;
