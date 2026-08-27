/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Square, 
  Download, 
  Shirt, 
  Footprints, 
  Compass, 
  Shield, 
  HeartPulse, 
  FileCheck, 
  Zap,
  RotateCcw,
  Sparkles,
  Printer
} from 'lucide-react';
import { PACKING_CATEGORIES } from '../data/roopkundData';
import type { PackingItem } from '../types';

export const PackingChecklist: React.FC = () => {
  const [checkedItems, setCheckedItems] = useState<{ [id: string]: boolean }>({});
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Load persistence
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pravaah_roopkund_packing');
      if (saved) {
        setCheckedItems(JSON.parse(saved));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('pravaah_roopkund_packing', JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });
  };

  const resetChecklist = () => {
    setCheckedItems({});
    try {
      localStorage.removeItem('pravaah_roopkund_packing');
    } catch (e) {
      // ignore
    }
  };

  // Count total items
  const allItems: PackingItem[] = PACKING_CATEGORIES.flatMap((c) => c.items);
  const totalCount = allItems.length;
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const progressPercent = Math.round((checkedCount / totalCount) * 100);

  // Category Icon Map
  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'clothing': return <Shirt className="w-4 h-4" />;
      case 'footwear': return <Footprints className="w-4 h-4" />;
      case 'trek-gear': return <Compass className="w-4 h-4" />;
      case 'personal': return <Shield className="w-4 h-4" />;
      case 'health': return <HeartPulse className="w-4 h-4" />;
      case 'documents': return <FileCheck className="w-4 h-4" />;
      case 'electronics': return <Zap className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const handlePrintDownload = () => {
    window.print();
  };

  return (
    <section id="packing" className="py-24 sm:py-32 bg-[#F4EFE6] text-[#1D2530] relative overflow-hidden border-t border-[#E2DDD3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-xs font-oswald tracking-[0.25em] text-[#134E35] uppercase font-bold">
              EXPEDITION CHECKLIST • DETAILS UNDER REVIEW
            </span>
            <h2 className="font-playfair text-4xl sm:text-5xl md:text-6xl font-bold tracking-[0.03em] uppercase text-[#1D2530] mt-2">
              PACK FOR THE <span className="text-[#8F4F38]">MOUNTAIN</span>
            </h2>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrintDownload}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#134E35] text-white hover:bg-[#0E3B28] text-xs font-oswald uppercase font-bold tracking-wider transition-all shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>PRINT / SAVE CHECKLIST</span>
            </button>

            {checkedCount > 0 && (
              <button
                onClick={resetChecklist}
                className="p-2.5 rounded-full bg-white hover:bg-[#FAF8F3] border border-[#E2DDD3] text-[#64748B] text-xs transition-colors shadow-sm"
                title="Reset Packing State"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Tracker Card with Field Ledger Framing */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2DDD3] shadow-sm mb-10 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="text-[10px] font-oswald uppercase text-[#134E35] font-bold tracking-widest">
                CHECKLIST MATRIX // REVIEW STATUS
              </div>
              <div className="font-playfair text-2xl font-bold text-[#1D2530] uppercase mt-0.5">
                {checkedCount} OF {totalCount} ITEMS READY ({progressPercent}%)
              </div>
            </div>

            <div className="text-xs font-nunito text-[#4A5568] max-w-sm text-pretty">
              {progressPercent === 100
                ? 'All preview rows checked. This does not replace the final confirmed packing brief.'
                : 'Use these rows as placeholders until Pravaah issues the final confirmed packing brief.'}
            </div>
          </div>

          {/* Progress Bar with Alpine Gradient */}
          <div className="w-full h-2.5 rounded-full bg-[#FAF8F3] border border-[#E2DDD3] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#134E35] via-[#8F4F38] to-[#134E35] transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-full text-xs font-oswald uppercase tracking-wider whitespace-nowrap transition-all ${
              activeCategory === 'all'
                ? 'bg-[#134E35] text-white font-bold shadow-sm'
                : 'bg-white border border-[#E2DDD3] text-[#4A5568] hover:bg-[#FAF8F3]'
            }`}
          >
            ALL CATEGORIES ({totalCount})
          </button>

          {PACKING_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-oswald uppercase tracking-wider whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-[#134E35] text-white font-bold shadow-sm'
                  : 'bg-white border border-[#E2DDD3] text-[#4A5568] hover:bg-[#FAF8F3]'
              }`}
            >
              {getCategoryIcon(cat.id)}
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Packing Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PACKING_CATEGORIES.filter(
            (cat) => activeCategory === 'all' || activeCategory === cat.id
          ).map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-3xl p-6 border border-[#E2DDD3] shadow-sm flex flex-col justify-between"
            >
              <div>
                {/* Category Header */}
                <div className="flex items-center gap-3 border-b border-[#E2DDD3] pb-4 mb-4">
                  <div className="p-2.5 rounded-xl bg-[#EAF5EE] text-[#134E35] border border-[#134E35]/20">
                    {getCategoryIcon(category.id)}
                  </div>
                  <div>
                    <h3 className="font-playfair text-lg font-bold text-[#1D2530] uppercase">
                      {category.name}
                    </h3>
                    <p className="text-[11px] text-[#64748B] line-clamp-1 font-nunito">
                      {category.description}
                    </p>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  {category.items.map((item) => {
                    const isChecked = !!checkedItems[item.id];

                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        className={`p-3 rounded-2xl cursor-pointer transition-all duration-200 border flex items-start gap-3 select-none ${
                          isChecked
                            ? 'bg-[#FAF8F3] border-[#E2DDD3] opacity-60'
                            : 'bg-white border-[#E2DDD3] hover:border-[#134E35]/50'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0 text-[#134E35]">
                          {isChecked ? (
                            <CheckSquare className="w-5 h-5 text-[#134E35]" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </div>

                        <div className="flex-1">
                          <div
                            className={`text-xs font-semibold leading-snug ${
                              isChecked ? 'line-through text-[#64748B]' : 'text-[#1D2530]'
                            }`}
                          >
                            {item.name}
                          </div>

                          {item.notes && (
                            <div className="text-[10px] text-[#64748B] font-nunito mt-0.5">
                              {item.notes}
                            </div>
                          )}
                        </div>

                        {item.essential && !isChecked && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-oswald uppercase bg-[#EAF5EE] text-[#134E35] font-bold shrink-0">
                            MUST
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-[#E2DDD3] text-[10px] font-oswald text-[#64748B] uppercase flex items-center justify-between">
                <span>{category.items.length} ITEMS IN THIS SECTION</span>
                <span className="text-[#134E35] font-semibold">
                  {category.items.filter((i) => checkedItems[i.id]).length} PACKED
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default PackingChecklist;
