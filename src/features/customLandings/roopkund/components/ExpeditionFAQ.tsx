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
  // Category 1: Altitude Sickness (AMS, HAPE, HACE) & Acclimatization
  {
    id: 'ams-symptoms',
    category: 'altitude',
    question: 'How do you monitor and manage Acute Mountain Sickness (AMS) at 15,750 FT?',
    answer: 'Roopkund reaches a maximum summit altitude of 15,750 FT (4,800m) at the glacial crater. To prevent AMS, Pravaah enforces a gradual ascent profile spanning 7 days (6 nights) with a dedicated acclimatization schedule. Every expedition leader carries medical-grade pulse oximeters, portable emergency oxygen cylinders (Oxy500), and a comprehensive High-Altitude Medical Kit with Diamox, Dexamethasone, and Nifedipine. We record biometric logs (SpO2 saturation and resting heart rate) for every trekker twice daily at breakfast and dinner. If SpO2 drops below 75% or resting heart rate spikes dangerously with unyielding headache/nausea, the trekker is placed on supplemental oxygen and safely descended immediately with a dedicated rescue porter.',
    keyTakeaway: 'Twice-daily SpO2 telemetry logs + strict altitude gain pacing + mandatory emergency descent protocol.',
    actionTip: 'Hydrate with at least 3.5 to 4 liters of warm water daily and avoid sleeping immediately upon reaching camp.',
    tag: 'MEDICAL SAFETY'
  },
  {
    id: 'diamox-protocol',
    category: 'altitude',
    question: 'Should I take Diamox (Acetazolamide) before or during the Roopkund trek?',
    answer: 'Diamox is a carbonic anhydrase inhibitor that acidifies the blood, stimulating your brain’s respiratory center to breathe deeper during rest and sleep. While many seasoned mountaineers prefer natural acclimatization, preventive Diamox (125mg to 250mg twice daily starting 24 hours prior to ascending past Lohajung at 7,600 FT) is recommended for trekkers with a history of altitude sensitivity or those residing at sea level. However, Diamox is a sulfa-based diuretic and is contraindicated for individuals with sulfa allergies. Always consult your personal physician prior to departure.',
    keyTakeaway: 'Diamox aids acclimatization but does not replace the fundamental rule: climb high, sleep low, and ascend gradually.',
    actionTip: 'Carry an approved medical certificate and declare any sulfa-drug or aspirin allergies to your Pravaah expedition leader during the base briefing.',
    tag: 'PHARMACOLOGY'
  },
  {
    id: 'altitude-vs-cold',
    category: 'altitude',
    question: 'What are the temperature variations between the lower base and high camps?',
    answer: 'The Roopkund trail spans multiple bioclimatic zones: Lohajung (7,600 FT) and Didna Village experience pleasant autumn/spring daytime temperatures around 14°C to 18°C. However, once you cross the treeline into Ali Bugyal (11,000 FT), Bedni Kund (12,550 FT), and the high moraine camp at Bhagwabasa (14,100 FT), nighttime temperatures drop drastically between -2°C and -8°C (with wind chill pushing it lower). At Roopkund crater during dawn summit pushes, temperatures frequently hover around -5°C to -10°C.',
    keyTakeaway: 'Expect a 25°C temperature swing from daytime sunny trekking to sub-zero high-camp nights.',
    actionTip: 'Employ a 4-layer technical clothing system: moisture-wicking base, 200gsm fleece mid-layer, 700+ fill-power down jacket, and wind/waterproof hardshell.',
    tag: 'WEATHER & COLD'
  },

  // Category 2: Physical Fitness & Conditioning
  {
    id: 'fitness-benchmark',
    category: 'fitness',
    question: 'What exact physical endurance benchmark is required to complete this trek comfortably?',
    answer: 'Roopkund is graded as "Demanding / Moderate to Difficult". You will be trekking 6 to 9 km daily over 6 consecutive days on steep forest ascents, sprawling alpine gradients, and treacherous boulder-strewn moraine with a 9–10 kg backpack. The target fitness benchmark is being able to jog 5 km in under 32 minutes comfortably, or walk 10 km continuously on rolling terrain without shortness of breath. Strengthening your quadriceps, hamstrings, calves, and core is vital to handle the knee impact during the 5,000 FT descent from Bedni back to Wan.',
    keyTakeaway: 'Target Benchmark: 5 km jog in <32 mins + 40 bodyweight squats + 2-minute wall-sit before your expedition departure.',
    actionTip: 'Start training 6 to 8 weeks in advance with 4 days of cardio (running/swimming/cycling) and 2 days of functional stair climbing with a weighted pack.',
    tag: 'TRAINING METRICS'
  },
  {
    id: 'first-time-trekkers',
    category: 'fitness',
    question: 'Can a fit beginner or first-time high-altitude trekker attempt Roopkund?',
    answer: 'Yes, provided you possess above-average baseline cardiovascular stamina, discipline, and no underlying cardio-respiratory conditions. Many dedicated individuals have completed Roopkund as their maiden high-altitude trek because Pravaah provides a 1:6 leader-to-trekker ratio, experienced local Garhwali route guides, and generous acclimatization pacing. However, you must commit seriously to the 8-week physical training regimen we furnish upon registration.',
    keyTakeaway: 'First-timers with disciplined 8-week conditioning and strong mental endurance can successfully summit.',
    actionTip: 'Schedule a free 1-on-1 fitness assessment call with a Pravaah lead mountaineer to customize your training plan.',
    tag: 'SUITABILITY'
  },
  {
    id: 'backpack-offloading',
    category: 'fitness',
    question: 'Can I offload my backpack to a mule or support porter during the trek?',
    answer: 'We strongly encourage all adventurers to carry their own gear (60L backpack weighing 8–10 kg) as self-reliance is intrinsic to authentic alpine trekking. However, in cases of unexpected fatigue, sudden joint sprains, or medical necessity, backpack offloading can be arranged in advance with local village muleteers or porters. Offloading requests must be registered before leaving the Lohajung base camp.',
    keyTakeaway: 'Self-carrying is encouraged, but ethical local porter assistance is always available for medical comfort.',
    actionTip: 'Always carry a compact 20L daypack with your water, fleece, rain poncho, headlamp, and personal medicines even if offloading your main duffel.',
    tag: 'LOGISTICS'
  },

  // Category 3: Sustainable Travel & Himalayan Conservation
  {
    id: 'leave-no-trace',
    category: 'sustainability',
    question: 'How does Pravaah enforce Leave No Trace (LNT) & protect delicate Bugyals (meadows)?',
    answer: 'The high alpine meadows of Ali Bugyal and Bedni Bugyal are sensitive ecological sanctuaries protected by Uttarakhand Forest Department and High Court directives. Pravaah practices strict Zero-Waste Expedition Protocols: All single-use plastics are strictly banned. We pack out 100% of non-biodegradable waste generated by our teams and conduct trail-cleanup drives ("Bag Cleanliness Audits") collecting discarded debris left by casual travelers. At high camps, we set up eco-friendly dry pit cat-holes with organic sawdust to prevent water-table contamination.',
    keyTakeaway: 'Zero single-use plastics + 100% waste pack-out + biodegradable camp sanitation that preserves fragile alpine flora.',
    actionTip: 'Bring two reusable insulated water bottles and a lightweight mesh pouch to carry back your own snack wrappers.',
    tag: 'ECOLOGY'
  },
  {
    id: 'local-economy',
    category: 'sustainability',
    question: 'How does this expedition support local Garhwali mountain communities?',
    answer: 'Pravaah operates on a direct hyper-local community model. 100% of our mountain guides, camp cooks, muleteers, and homestay hosts are indigenous Garhwalis from Lohajung, Didna, Wan, and Kuling villages. We pay fair above-market wages, ensure comprehensive high-altitude insurance for our mountain crew, and source fresh organic vegetables, Pahadi lentils, and dairy directly from village households along the trail.',
    keyTakeaway: 'Your expedition directly funds village micro-economies and preserves indigenous mountain folklore traditions.',
    actionTip: 'Enjoy traditional Garhwali dishes like Mandua (finger millet) rotis, Jhangora kheer, and Gahat dal prepared fresh by local camp chefs.',
    tag: 'COMMUNITY IMPACT'
  },

  // Category 4: Permits, Toilets & Connectivity
  {
    id: 'permits-and-regulations',
    category: 'sustainability',
    question: 'What forest permits and identity documents are required for Roopkund?',
    answer: 'The trail traverses the Nanda Devi Biosphere Reserve buffer zone. Pravaah secures all mandatory Uttarakhand Forest Department permits, eco-development committee (EDC) camp permissions, and high-altitude trail passes. To process these, we require a government-issued photo ID (Aadhaar / Passport / Voter ID) and a Medical Fitness Certificate signed by a registered MBBS physician stating you are fit for high-altitude trekking up to 16,000 FT.',
    keyTakeaway: 'Pravaah handles 100% of Forest Department permits; you only need to submit your Govt ID and Medical Certificate.',
    actionTip: 'Submit your digital documents at least 14 days prior to departure to avoid Forest Department gate delays at Wan / Lohajung.',
    tag: 'DOCUMENTATION'
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
            Rigorous answers regarding high-altitude physiology, physical conditioning benchmarks, and our zero-trace Garhwali conservation protocols.
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
              <span>HAVE A UNIQUE MEDICAL OR GEAR QUERY?</span>
            </div>
            <h3 className="font-playfair text-xl sm:text-2xl font-bold text-white">
              TALK DIRECTLY WITH A LEAD EXPEDITION GUIDE
            </h3>
            <p className="text-xs sm:text-sm font-nunito text-white/70 max-w-xl">
              Our high-altitude mountaineering leaders personally evaluate custom fitness routines, gear compatibility, and dietary preferences.
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
