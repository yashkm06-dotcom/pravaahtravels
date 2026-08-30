/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ShieldCheck, 
  Activity, 
  HeartPulse, 
  Clock, 
  Flame, 
  Leaf, 
  AlertOctagon,
  CheckCircle2
} from 'lucide-react';
import { SAFETY_RULES } from '../data/roopkundData';

export const SafetySection: React.FC = () => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Activity': return <Activity className="w-6 h-6" />;
      case 'HeartPulse': return <HeartPulse className="w-6 h-6" />;
      case 'ShieldCheck': return <ShieldCheck className="w-6 h-6" />;
      case 'Clock': return <Clock className="w-6 h-6" />;
      case 'Flame': return <Flame className="w-6 h-6" />;
      case 'Leaf': return <Leaf className="w-6 h-6" />;
      default: return <ShieldCheck className="w-6 h-6" />;
    }
  };

  return (
    <section id="safety" className="py-24 sm:py-32 bg-[#FAF8F3] text-[#1D2530] relative overflow-hidden border-t border-[#E2DDD3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF5EE] text-[#134E35] text-[10px] font-oswald uppercase tracking-widest font-bold mb-3 border border-[#134E35]/20">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>HIGH ALTITUDE EXPEDITION PROTOCOL</span>
          </div>

          <h2 className="font-playfair text-4xl sm:text-5xl md:text-6xl font-bold tracking-[0.03em] uppercase text-[#1D2530]">
            RESPECT THE <span className="text-[#8F4F38]">ALTITUDE</span>
          </h2>

          <div className="mt-4 text-lg sm:text-xl font-garamond italic text-[#134E35] font-semibold">
            “Your safety comes before reaching the destination.”
          </div>

          <p className="mt-4 text-xs sm:text-sm md:text-base text-[#4A5568] font-nunito leading-relaxed">
            Roopkund is a serious high-altitude expedition culminating at 15,750 ft (4,800m). Mountain wilderness demands preparation, humility, and disciplined physiological monitoring.
          </p>
        </div>

        {/* Safety Pillars 6-Card Grid with Field Protocol Styling */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {SAFETY_RULES.map((rule, index) => (
            <div
              key={index}
              className="bg-white rounded-3xl p-7 border border-[#E2DDD3] shadow-sm hover:shadow-xl hover:border-[#134E35]/40 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="p-3 rounded-2xl bg-[#EAF5EE] text-[#134E35] border border-[#134E35]/20 group-hover:bg-[#134E35] group-hover:text-white transition-colors">
                    {getIcon(rule.icon)}
                  </div>
                  <span className="text-[10px] font-oswald text-[#8F4F38] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-[#F4EFE6]">
                    STANDARD // 0{index + 1}
                  </span>
                </div>

                <h3 className="font-playfair text-xl font-bold text-[#1D2530] uppercase leading-snug group-hover:text-[#134E35] transition-colors">
                  {rule.title}
                </h3>

                <p className="mt-2 text-xs font-bold text-[#134E35] font-nunito leading-snug">
                  {rule.summary}
                </p>

                <p className="mt-3 text-xs text-[#4A5568] leading-relaxed font-nunito font-normal text-pretty">
                  {rule.detail}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#E2DDD3] flex items-center gap-2 text-[10px] font-oswald text-[#134E35] uppercase font-bold tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#134E35]" />
                <span>ACTIVE FIELD PROTOCOL</span>
              </div>
            </div>
          ))}
        </div>

        {/* Emergency Readiness Banner */}
        <div className="mt-12 bg-[#0B131F] text-white rounded-3xl p-8 sm:p-10 border border-[#C5A880]/40 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center lg:text-left">
            <div className="text-xs font-oswald uppercase tracking-widest text-[#E5C378] font-bold">
              ZERO COMPROMISE PHILOSOPHY
            </div>
            <h3 className="font-playfair text-2xl sm:text-3xl font-bold text-white uppercase">
              The Mountain Will Always Be There.
            </h3>
            <p className="text-xs sm:text-sm text-white/70 max-w-2xl font-nunito leading-relaxed">
              If at any stage our expedition leader or medical telemetry indicates acute altitude discomfort, fatigue, or unseasonal weather risk, the team respects the mountain and initiates a controlled, safe descent.
            </p>
          </div>

          <div className="px-6 py-4 rounded-2xl bg-white/10 border border-white/20 text-center shrink-0">
            <div className="text-2xl font-oswald font-bold text-[#E5C378]">100%</div>
            <div className="text-[10px] font-oswald uppercase tracking-wider text-white/70">
              SAFETY COMPLIANCE FOCUS
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default SafetySection;
