/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { BrandDifferentiator } from '../types';

interface ExtendedPillarDetail {
  operationalStandard: string;
  fieldProtocols: string[];
  whyItMattersForYou: string;
  nativeInsight: string;
  statisticalBenchmark: string;
}

const PILLAR_DEEP_DATA: Record<string, ExtendedPillarDetail> = {
  'CURATED HIMALAYAN ROUTES': {
    operationalStandard: 'Conservative Altitude Profile & Sanctuary Campsites',
    fieldProtocols: [
      'Daily altitude gain strictly capped at 2,000–2,500 ft once crossing 10,000 ft threshold.',
      'Camp locations placed at peaceful meadow edges away from high-density commercial trekking clusters.',
      'Built-in buffer weather margins and acclimatization hikes to Bedni Top (12,500 ft) before the high summit push.',
      'Paced daily trekking windows (4-6 hours max) allowing ample recovery, hydration, and photography time.'
    ],
    whyItMattersForYou: 'Most altitude sickness (AMS) in the Himalayas happens not because mountains are too high, but because operators rush itineraries to save cost. Our paced design gives your body the biological time to synthesize red blood cells naturally.',
    nativeInsight: 'Our elders say: “In the mountains, walk like an elephant and sleep like a child.” Pacing is our foundational safety principle.',
    statisticalBenchmark: '96.4% Summit Success Rate via acclimatized pacing vs. ~68% on rushed 6-day itineraries.'
  },
  'AUTHENTIC GARHWAL GROUND NETWORK': {
    operationalStandard: '100% Local Native Garhwali Mountain Leaders & Crew',
    fieldProtocols: [
      'Every trek leader, head cook, scout, and muleteer is a born resident of Wan, Didna, or Lohajung valleys.',
      'Fair high-altitude living wages, comprehensive medical insurance, and premium cold-weather gear provided to all ground staff.',
      'Lifelong intuitive micro-weather reading skills passed down through generations of Himalayan pastoralists.',
      'Deep cultural ties to local village councils (Panchayats) and the sacred Nanda Devi shrine keepers.'
    ],
    whyItMattersForYou: 'When unpredicted weather rolls over the high ridges, city-based freelance guides panic. Native Garhwali leaders know every cave, shepherd shelter, and wind shift like their own backyard.',
    nativeInsight: 'We do not view Roopkund as a commercial asset; it is our ancestral homeland and sacred pilgrimage corridor.',
    statisticalBenchmark: '100% local economic retention — over 80% of your expedition fee directly enriches local Garhwali families.'
  },
  'SMALL-GROUP EXPEDITIONS (MAX 12-14)': {
    operationalStandard: 'Strict 1:6 Mountain Leader-to-Trekker Ratio',
    fieldProtocols: [
      'Batches strictly limited to a maximum of 12 to 14 participants (never combined with other agencies).',
      'Minimum of 2 certified Wilderness First Responders (WFR) / High Altitude Trek Leaders with every team.',
      'Individual twice-daily health telemetry monitoring (Pulse, SpO2 %, Lung Sound Auscultation, Lake Louise Score).',
      'Spacious 4-season alpine tents assigned on a comfortable twin-sharing basis with thick insulated EVA foam mattresses.'
    ],
    whyItMattersForYou: 'Mass-market trekking companies herd 35-40 people in a single batch, leading to chaotic dining, long toilet lines, neglected sick trekkers, and an impersonal tourist vibe. Pravaah offers a boutique family expedition feel.',
    nativeInsight: 'A small group treads like a quiet whisper through the bugyals, allowing you to hear the silence of the snow.',
    statisticalBenchmark: '1 Leader for every 6 trekkers — compared to the industry standard of 1 leader per 18-20 people.'
  },
  'METICULOUS PRE-TRIP PREPARATION': {
    operationalStandard: '8-Week Conditioning Matrix & 1-on-1 Gear Verification',
    fieldProtocols: [
      'Tailored 8-week cardio & leg endurance fitness blueprint sent immediately upon enrollment.',
      'Video-call gear check with your lead guide to verify boot waterproofness, down jacket warmth, and layering.',
      'Dedicated expedition medical questionnaire reviewed by our high-altitude sports physician.',
      'Private batch cohort WhatsApp circle for pre-trek icebreaking, packing advice, and carpooling from Rishikesh.'
    ],
    whyItMattersForYou: 'You will never arrive at the trailhead feeling anxious, underprepared, or missing essential gear. We eliminate the guesswork weeks before you leave home.',
    nativeInsight: 'Preparation in the city creates freedom on the mountain. When your body is strong, your mind is free to absorb the beauty.',
    statisticalBenchmark: '100% of participants undergo medical triage and gear inspection prior to flag-off.'
  },
  'RESPONSIBLE & LEAVE-NO-TRACE TRAVEL': {
    operationalStandard: 'Certified Eco-Ethical Mountain Stewardship',
    fieldProtocols: [
      'Eco-friendly deep-dry pit toilet tents with sawdust and natural microbial decomposition — no chemical toilet waste.',
      'Zero single-use plastics policy across all campsites; personal hydration refilled with filtered boiled mountain spring water.',
      'Weekly “Clean the Trail” initiatives carrying 50–100 kg of commercial trash left by other operators back to Rishikesh for recycling.',
      'Strict adherence to Uttarakhand High Court regulations on fragile Bugyal turf preservation.'
    ],
    whyItMattersForYou: 'You can travel with a clean conscience knowing that your presence leaves the high alpine sanctuaries cleaner and more protected than you found them.',
    nativeInsight: 'The bugyals are living carpets. If we hurt their roots today, our children will inherit bare rocks tomorrow.',
    statisticalBenchmark: '100% waste audit — 0 kg of non-biodegradable waste left behind on the mountain.'
  },
  'DEDICATED HUMAN SUPPORT': {
    operationalStandard: '24/7 Real Human Expedition Concierge Desk',
    fieldProtocols: [
      'Direct phone & WhatsApp access to senior expedition founders and trail leaders (no automated bots or call centers).',
      'Real-time satellite & VHF radio relay from high camps back to the Lohajung base operations desk.',
      'Automated daily progress SMS updates sent to designated family emergency contacts back home.',
      'Seamless logistics coordination from Dehradun/Rishikesh airport transfers to post-trek homestays.'
    ],
    whyItMattersForYou: 'Whether you need advice on booking flight connections, dietary requirements, or emergency family liaison, you have a dedicated human specialist answering within minutes.',
    nativeInsight: 'Hospitality (Atithi Devo Bhava) in the mountains is sacred. You are not a booking number; you are our honored guest.',
    statisticalBenchmark: '< 15 minute average response time on WhatsApp throughout your preparation journey.'
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

    if (pillar) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [pillar, onClose]);

  const deepData = pillar ? (PILLAR_DEEP_DATA[pillar.title] || {
    operationalStandard: pillar.headline,
    fieldProtocols: [
      'Comprehensive safety check and high-altitude protocol execution.',
      'Experienced Garhwali trail leadership and small-group camaraderie.',
      'Meticulous equipment and nutritional provisions on the trail.'
    ],
    whyItMattersForYou: pillar.description,
    nativeInsight: 'The mountains demand respect, preparation, and humility.',
    statisticalBenchmark: 'Pravaah Gold Standard in Himalayan Mountaineering.'
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
                STANDARD: {deepData.operationalStandard}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 md:p-10 space-y-8 max-h-[55vh] overflow-y-auto">
              
              {/* Main Description */}
              <div>
                <h4 className="text-xs font-oswald tracking-[0.2em] text-[#8F4F38] uppercase font-bold mb-2">
                  WHY THIS MATTERS FOR YOUR EXPEDITION
                </h4>
                <p className="text-sm sm:text-base font-nunito text-[#4A5568] leading-relaxed text-pretty">
                  {deepData.whyItMattersForYou}
                </p>
              </div>

              {/* Operational Protocols Checklist */}
              <div className="p-6 rounded-2xl bg-white border border-[#E2DDD3] shadow-sm">
                <h4 className="text-xs font-oswald tracking-[0.2em] text-[#1D2530] uppercase font-bold mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#134E35]" />
                  <span>FIELD PROTOCOLS & IMPLEMENTATION</span>
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
                    GARHWALI TRAIL INSIGHT
                  </div>
                  <p className="font-garamond italic text-xs sm:text-sm text-[#134E35] leading-relaxed font-semibold">
                    {deepData.nativeInsight}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-[#E2DDD3] shadow-sm">
                  <div className="text-[11px] font-oswald text-[#134E35] uppercase font-bold tracking-wider mb-1">
                    MEASURABLE BENCHMARK
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
                  <span>Direct access to our expedition leadership team</span>
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

