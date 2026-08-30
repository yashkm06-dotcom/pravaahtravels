/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ChevronDown, 
  HeartPulse, 
  Activity, 
  Leaf, 
  HelpCircle, 
  ArrowUpRight, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2,
  Sparkles,
  Share2
} from 'lucide-react';

export interface FAQItem {
  id: string;
  category: 'altitude' | 'fitness' | 'sustainability' | 'logistics';
  question: string;
  answer: string;
  keyTakeaway: string;
  actionTip?: string;
  tag: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 'ams-symptoms',
    category: 'altitude',
    question: 'What health and altitude information will be provided for this trek?',
    answer: 'The final route altitude, acclimatization plan, monitoring arrangements and emergency procedures are under review. Pravaah Travels will confirm the applicable operating brief before accepting an expedition booking. This page does not provide medical advice, diagnosis, treatment instructions or personal suitability guidance.',
    keyTakeaway: 'Health, monitoring and emergency details are subject to final expedition confirmation.',
    actionTip: 'Discuss personal health or medication questions with an appropriately qualified clinician.',
    tag: 'HEALTH REVIEW'
  },
  {
    id: 'diamox-protocol',
    category: 'altitude',
    question: 'Does Pravaah provide medication guidance for the expedition?',
    answer: 'No medication protocol is published on this page. Personal medication decisions require individual clinical assessment and should be discussed with an appropriately qualified clinician. Any expedition documentation or declarations that may be required will be confirmed only after the operating plan is verified.',
    keyTakeaway: 'Medication and personal medical decisions are outside the scope of this preview.',
    actionTip: 'Wait for the confirmed participant brief before preparing any expedition-specific documents.',
    tag: 'MEDICAL NOTICE'
  },
  {
    id: 'altitude-vs-cold',
    category: 'altitude',
    question: 'What weather and temperature conditions should travellers expect?',
    answer: 'Seasonal weather, temperatures, camp locations and the final route profile are still being confirmed. Conditions in mountain environments can change, so the specific clothing and equipment brief will be issued only after the expedition plan and season are verified.',
    keyTakeaway: 'Weather and cold-condition details are to be confirmed for the final operating window.',
    actionTip: 'Use the final Pravaah packing brief rather than relying on unverified temperature estimates.',
    tag: 'WEATHER REVIEW'
  },
  {
    id: 'fitness-benchmark',
    category: 'fitness',
    question: 'What fitness level will be required for the confirmed itinerary?',
    answer: 'A route-specific difficulty assessment and preparation brief are not yet verified. Pravaah Travels will publish the applicable terrain, daily effort and preparation information with the final expedition plan. No exercise benchmark on this preview should be treated as an eligibility test.',
    keyTakeaway: 'Fitness and preparation details are subject to the confirmed route and operating plan.',
    actionTip: 'Seek qualified professional advice if you need a personal fitness or health assessment.',
    tag: 'FITNESS REVIEW'
  },
  {
    id: 'first-time-trekkers',
    category: 'fitness',
    question: 'Is the final expedition expected to suit first-time trekkers?',
    answer: 'Suitability cannot be confirmed until the route, access, duration, difficulty and support arrangements have been verified. Pravaah Travels can discuss the published itinerary with prospective travellers once those details are available, but this page does not make a personal medical or fitness determination.',
    keyTakeaway: 'Beginner suitability is under review and must not be assumed from this preview.',
    actionTip: 'Share relevant experience and questions through the enquiry form for a factual follow-up.',
    tag: 'SUITABILITY'
  },
  {
    id: 'backpack-offloading',
    category: 'fitness',
    question: 'Will baggage support or offloading be available?',
    answer: 'Baggage limits, porter or animal support, daypack requirements and any additional charges are to be confirmed with the final logistics plan. Availability is not guaranteed by this preview.',
    keyTakeaway: 'Baggage-support arrangements remain subject to final expedition confirmation.',
    actionTip: 'Confirm the written baggage policy before making equipment or travel arrangements.',
    tag: 'LOGISTICS'
  },
  {
    id: 'leave-no-trace',
    category: 'sustainability',
    question: 'What conservation practices will apply to the expedition?',
    answer: 'The applicable access restrictions, waste procedures, campsite rules and conservation requirements are under review. Pravaah Travels will publish the confirmed participant responsibilities and operating procedures before any expedition is offered.',
    keyTakeaway: 'Conservation and waste procedures are to be confirmed against current requirements.',
    actionTip: 'Follow the final participant brief and current instructions from the relevant authorities.',
    tag: 'CONSERVATION'
  },
  {
    id: 'local-economy',
    category: 'sustainability',
    question: 'Will local community partners be involved?',
    answer: 'Ground-team identities, suppliers, accommodation partners and local economic arrangements have not yet been verified for publication. Pravaah Travels will describe the confirmed operating partners without making unsupported impact or sourcing claims.',
    keyTakeaway: 'Community-partner details will be added only after verification.',
    actionTip: 'Ask Pravaah for the current partner and sourcing details when the expedition plan is released.',
    tag: 'COMMUNITY REVIEW'
  },
  {
    id: 'permits-and-regulations',
    category: 'sustainability',
    question: 'What forest permits and identity documents are required for Roopkund?',
    answer: 'Current legal access, permit availability, issuing authorities, identity requirements and any supporting documents are to be confirmed. This preview does not guarantee access, permits or a particular document process.',
    keyTakeaway: 'Do not submit documents or assume permit approval until Pravaah provides a verified written requirement.',
    actionTip: 'Use only the confirmed Pravaah channel shown on this page for current documentation information.',
    tag: 'PERMIT REVIEW'
  }
];

interface ExpeditionFAQProps {
  onOpenEnquiry?: () => void;
  onOpenShare?: () => void;
}

export const ExpeditionFAQ: React.FC<ExpeditionFAQProps> = ({
  onOpenEnquiry,
  onOpenShare
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'altitude' | 'fitness' | 'sustainability'>('all');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'ams-symptoms': true, // Open by default for immediate value
    'fitness-benchmark': true,
    'leave-no-trace': false,
  });

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredFaqs = activeCategory === 'all' 
    ? FAQ_DATA 
    : FAQ_DATA.filter(item => item.category === activeCategory);

  return (
    <section id="faq" className="py-20 sm:py-28 bg-[#FAF8F3] text-[#1D2530] relative border-t border-[#E2DDD3]">
      
      {/* Background Subtle Mountain Watermark */}
      <div className="absolute top-10 right-0 w-96 h-96 opacity-5 pointer-events-none select-none">
        <svg viewBox="0 0 200 200" fill="currentColor" className="text-[#134E35] w-full h-full">
          <path d="M100 20 L160 140 L40 140 Z" />
          <path d="M140 70 L190 150 L90 150 Z" />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF5EE] border border-[#134E35]/20 text-[11px] font-oswald tracking-[0.25em] text-[#134E35] uppercase font-bold mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>EXPEDITION ADVISORY & FAQS</span>
          </div>

          <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-bold text-[#1D2530] leading-tight">
            ESSENTIAL <span className="text-[#8F4F38]">TRAIL INTELLIGENCE</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg font-nunito text-[#4A5568] leading-relaxed text-pretty">
            Route, health, preparation, conservation and permit details are under review. This preview avoids medical guidance and unsupported operating guarantees.
          </p>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-8">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-full text-xs font-oswald tracking-wider uppercase font-semibold transition-all duration-200 ${
                activeCategory === 'all'
                  ? 'bg-[#134E35] text-white shadow-sm font-bold'
                  : 'bg-white text-[#4A5568] border border-[#E2DDD3] hover:bg-[#FAF8F3]'
              }`}
            >
              ALL QUERIES ({FAQ_DATA.length})
            </button>

            <button
              onClick={() => setActiveCategory('altitude')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-oswald tracking-wider uppercase font-semibold transition-all duration-200 ${
                activeCategory === 'altitude'
                  ? 'bg-[#134E35] text-white shadow-sm font-bold'
                  : 'bg-white text-[#4A5568] border border-[#E2DDD3] hover:bg-[#FAF8F3]'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5" />
              <span>ALTITUDE & HEALTH (3)</span>
            </button>

            <button
              onClick={() => setActiveCategory('fitness')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-oswald tracking-wider uppercase font-semibold transition-all duration-200 ${
                activeCategory === 'fitness'
                  ? 'bg-[#134E35] text-white shadow-sm font-bold'
                  : 'bg-white text-[#4A5568] border border-[#E2DDD3] hover:bg-[#FAF8F3]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>FITNESS & TRAINING (3)</span>
            </button>

            <button
              onClick={() => setActiveCategory('sustainability')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-oswald tracking-wider uppercase font-semibold transition-all duration-200 ${
                activeCategory === 'sustainability'
                  ? 'bg-[#134E35] text-white shadow-sm font-bold'
                  : 'bg-white text-[#4A5568] border border-[#E2DDD3] hover:bg-[#FAF8F3]'
              }`}
            >
              <Leaf className="w-3.5 h-3.5" />
              <span>SUSTAINABILITY & PERMITS (3)</span>
            </button>
          </div>
        </div>

        {/* Accordion FAQ List */}
        <div className="space-y-4 max-w-4xl mx-auto">
          {filteredFaqs.map((faq) => {
            const isOpen = !!openItems[faq.id];
            return (
              <div
                key={faq.id}
                className={`rounded-2xl transition-all duration-300 border overflow-hidden ${
                  isOpen
                    ? 'bg-white border-[#134E35]/60 shadow-lg ring-1 ring-[#134E35]/20'
                    : 'bg-white hover:bg-[#FAF8F3] border-[#E2DDD3] shadow-sm'
                }`}
              >
                {/* Accordion Header / Trigger */}
                <button
                  onClick={() => toggleItem(faq.id)}
                  className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <span className="shrink-0 text-[10px] font-oswald tracking-widest px-2.5 py-1 rounded-md bg-[#EAF5EE] text-[#134E35] border border-[#134E35]/20 font-bold uppercase mt-0.5 sm:mt-0">
                      {faq.tag}
                    </span>

                    <h3 className="font-playfair text-base sm:text-lg font-bold text-[#1D2530] leading-snug group-hover:text-[#134E35] transition-colors">
                      {faq.question}
                    </h3>
                  </div>

                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                      isOpen
                        ? 'bg-[#134E35] text-white rotate-180 shadow-md'
                        : 'bg-[#FAF8F3] text-[#1D2530] border border-[#E2DDD3]'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {/* Accordion Expanded Body */}
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 border-t border-[#E2DDD3] animate-in fade-in duration-200">
                    {/* Detailed Answer */}
                    <p className="text-sm sm:text-base font-nunito text-[#4A5568] leading-relaxed text-pretty">
                      {faq.answer}
                    </p>

                    {/* Key Takeaway Callout Box */}
                    <div className="mt-4 p-4 rounded-xl bg-[#FAF8F3] border border-[#E2DDD3] flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-[#134E35] shrink-0 mt-0.5" />
                      <div className="min-w-0 text-xs sm:text-sm font-nunito">
                        <span className="font-oswald font-bold uppercase text-[#134E35] tracking-wider block mb-0.5">
                          PRAVAAH PROTOCOL TAKEAWAY:
                        </span>
                        <span className="text-[#1D2530] font-medium leading-relaxed">
                          {faq.keyTakeaway}
                        </span>
                      </div>
                    </div>

                    {/* Action Tip if present */}
                    {faq.actionTip && (
                      <div className="mt-2.5 flex items-center gap-2 text-xs font-nunito text-[#134E35]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#134E35] shrink-0" />
                        <span><strong className="font-semibold text-[#1D2530]">Pro Tip:</strong> {faq.actionTip}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Box: Ask Custom Question or Share Expedition */}
        <div className="mt-14 max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl bg-[#0B131F] text-white shadow-xl border border-[#C5A880]/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 text-[#E5C378] text-[10px] font-oswald uppercase tracking-widest font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>HAVE A ROUTE, PREPARATION OR GEAR QUERY?</span>
            </div>
            <h3 className="font-playfair text-xl sm:text-2xl font-bold text-white">
              TALK DIRECTLY WITH PRAVAAH TRAVELS
            </h3>
            <p className="text-xs sm:text-sm font-nunito text-white/70 max-w-xl">
              Ask about the information currently available. Personal medical and fitness assessments should come from appropriately qualified professionals.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            {onOpenShare && (
              <button
                onClick={onOpenShare}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-full text-xs font-oswald font-bold tracking-wider uppercase transition-all duration-200 bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:scale-105 active:scale-95 shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5 text-[#E5C378]" />
                <span>SHARE EXPEDITION</span>
              </button>
            )}

            {onOpenEnquiry && (
              <button
                onClick={onOpenEnquiry}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-oswald font-bold tracking-wider uppercase transition-all duration-200 bg-[#8F4F38] hover:bg-[#7A3F2C] text-white hover:scale-105 active:scale-95 shadow-lg"
              >
                <span>SEND INQUIRY</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </section>
  );
};

export default ExpeditionFAQ;
