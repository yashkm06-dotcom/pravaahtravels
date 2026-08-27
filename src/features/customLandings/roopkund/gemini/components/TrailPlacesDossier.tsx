/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { 
  Mountain, 
  MapPin, 
  Thermometer, 
  Wind, 
  Compass, 
  Calendar, 
  Sparkles, 
  ArrowRight, 
  ChevronRight, 
  Eye, 
  CheckCircle2, 
  Info,
  Clock,
  Layers,
  Footprints,
  ShieldAlert,
  Flower2,
  TreePine,
  Tent
} from 'lucide-react';
import { TRAIL_LOCATIONS } from '../data/roopkundData';
import type { TrailLocation } from '../types';

interface TrailPlacesDossierProps {
  initialLocationId?: string;
  onExploreDay?: (dayNumber: number) => void;
}

export const TrailPlacesDossier: React.FC<TrailPlacesDossierProps> = ({
  initialLocationId = 'ali-bugyal',
  onExploreDay,
}) => {
  // Filter out Rishikesh gateway to focus on the authentic high-altitude trek places
  const mountainPlaces = TRAIL_LOCATIONS.filter((loc) => loc.id !== 'rishikesh');
  
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>(initialLocationId);
  const [activeZoneFilter, setActiveZoneFilter] = useState<'all' | 'forest' | 'meadow' | 'high-ridge' | 'summit'>('all');

  type PlaceDeepProfile = {
    ecosystem: string;
    zone: "forest" | "meadow" | "high-ridge" | "summit";
    nightTemp: string;
    oxygenLevel: string;
    folklore: string;
    floraFauna: string;
    campsiteAtmosphere: string;
    mountaineerTip: string;
    walkingStats: string;
  };

  const reviewProfile = (zone: PlaceDeepProfile["zone"]): PlaceDeepProfile => ({
    ecosystem: "Ecosystem details to be confirmed",
    zone,
    nightTemp: "To be confirmed",
    oxygenLevel: "To be confirmed",
    folklore: "Historical and cultural details are under review.",
    floraFauna: "Flora and fauna information is to be confirmed.",
    campsiteAtmosphere: "Camp availability and conditions are to be confirmed.",
    mountaineerTip: "Follow the final Pravaah brief and seek qualified medical advice for personal health questions.",
    walkingStats: "Distance and walking time to be confirmed",
  });

  const placeDeepProfiles: Record<string, PlaceDeepProfile> = {
    "lohajung-wan": reviewProfile("forest"),
    lohajung: reviewProfile("forest"),
    wan: reviewProfile("forest"),
    "ghairoli-patal": reviewProfile("forest"),
    "ali-bugyal": reviewProfile("meadow"),
    "patar-nauchni": reviewProfile("high-ridge"),
    "patar-nachauni": reviewProfile("high-ridge"),
    bhagwabasa: reviewProfile("high-ridge"),
    roopkund: reviewProfile("summit"),
    "bedni-bugyal": reviewProfile("meadow"),
  };

  useEffect(() => {
    setSelectedPlaceId(initialLocationId);
  }, [initialLocationId]);

  const handleZoneFilterChange = (zoneId: 'all' | 'forest' | 'meadow' | 'high-ridge' | 'summit') => {
    setActiveZoneFilter(zoneId);
    if (zoneId !== 'all') {
      const matching = mountainPlaces.filter((place) => {
        const profile = placeDeepProfiles[place.id];
        return profile?.zone === zoneId;
      });
      if (matching.length > 0 && !matching.some((p) => p.id === selectedPlaceId)) {
        setSelectedPlaceId(matching[0].id);
      }
    }
  };

  const filteredPlaces = mountainPlaces.filter((place) => {
    if (activeZoneFilter === 'all') return true;
    const profile = placeDeepProfiles[place.id];
    return profile?.zone === activeZoneFilter;
  });

  const selectedPlace = mountainPlaces.find((p) => p.id === selectedPlaceId) || filteredPlaces[0] || mountainPlaces[0];
  const currentProfile = placeDeepProfiles[selectedPlace.id] || placeDeepProfiles['ali-bugyal'];
  const isSummit = selectedPlace.id === 'roopkund';

  return (
    <section id="places" className="py-24 sm:py-32 bg-[#FAF8F3] text-[#1D2530] relative overflow-hidden border-t border-[#E2DDD3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="max-w-3xl">
            <span className="text-xs font-oswald tracking-[0.25em] text-[#134E35] uppercase font-bold flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#134E35]" />
              <span>THE EXPEDITION SANCTUARIES & WAYPOINTS</span>
            </span>
            <h2 className="font-playfair text-3xl sm:text-5xl md:text-6xl font-bold tracking-[0.03em] uppercase text-[#1D2530] mt-2">
              PLACES THAT <span className="text-[#8F4F38]">DEFINE THE TRAIL</span>
            </h2>
            <p className="mt-3 text-base sm:text-lg font-garamond italic text-[#4A5568]">
              The nine-stage visual is preserved while place names, route order, altitude, access, stays and ecological details are being verified.
            </p>
          </div>

          {/* Ecosystem Zone Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-[#E2DDD3] shadow-sm self-start lg:self-end text-xs font-raleway">
            {[
              { id: 'all', label: 'All 9 Stages' },
              { id: 'forest', label: 'Forest Stages (Altitude TBC)' },
              { id: 'meadow', label: 'Meadow Stages (Altitude TBC)' },
              { id: 'high-ridge', label: 'High Ridge Stages (Altitude TBC)' },
              { id: 'summit', label: 'Objective Stage (Altitude TBC)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleZoneFilterChange(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl transition-all duration-200 font-semibold tracking-wider ${
                  activeZoneFilter === tab.id
                    ? 'bg-[#134E35] text-white shadow-sm'
                    : 'text-[#4A5568] hover:text-[#1D2530] hover:bg-[#F4EFE6]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Place Selection Strip (Thumbnails) */}
        <div className="flex gap-3 overflow-x-auto pb-4 mb-10 scrollbar-none snap-x">
          {filteredPlaces.map((place) => {
            const isSelected = selectedPlace.id === place.id;
            const profile = placeDeepProfiles[place.id];
            
            return (
              <button
                key={place.id}
                onClick={() => setSelectedPlaceId(place.id)}
                className={`shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-200 snap-start text-left ${
                  isSelected
                    ? 'bg-[#134E35] text-white border-[#134E35] shadow-md scale-[1.02]'
                    : 'bg-white hover:bg-[#F4EFE6] text-[#1D2530] border-[#E2DDD3]'
                }`}
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/20">
                  <img
                    src={place.image}
                    alt={place.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-oswald tracking-wider font-bold ${isSelected ? 'text-[#E5C378]' : 'text-[#8F4F38]'}`}>
                      STAGE 0{place.dayNumber}
                    </span>
                    {place.id === 'roopkund' && (
                      <span className="text-[9px] font-oswald bg-red-600 text-white px-1.5 py-0.5 rounded font-bold tracking-wider">★ OBJECTIVE</span>
                    )}
                  </div>
                  <div className={`font-playfair font-bold text-sm leading-tight mt-0.5 ${isSelected ? 'text-white' : 'text-[#1D2530]'}`}>
                    {place.name}
                  </div>
                  <div className={`text-[11px] font-oswald tracking-wide ${isSelected ? 'text-white/80' : 'text-[#64748B]'}`}>
                    ALTITUDE TBC
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* COMPREHENSIVE DOSSIER SHOWCASE FOR THE SELECTED TRAIL LOCATION */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl border border-[#E2DDD3] shadow-xl overflow-hidden transition-all duration-300">
          
          {/* Hero Banner Grid (Split Visual + Key Metrics) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-b border-[#E2DDD3]">
            
            {/* Left Col: Cinematic Photo Showcase with Archival Mount */}
            <div className="lg:col-span-7 relative min-h-[380px] sm:min-h-[460px] overflow-hidden group bg-black/20">
              <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-white/80 z-20 pointer-events-none" />
              <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-white/80 z-20 pointer-events-none" />

              <img
                src={selectedPlace.image}
                alt={selectedPlace.name}
                className="w-full h-full object-cover filter contrast-105 transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

              {/* Badges Over Image */}
              <div className="absolute top-6 left-6 flex flex-wrap items-center gap-2 z-10">
                <span className="px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-white font-oswald text-xs font-bold uppercase tracking-wider">
                  STAGE {selectedPlace.dayNumber} OF EXPEDITION
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-[#134E35] text-white font-oswald text-xs font-bold uppercase tracking-wider">
                  {currentProfile.ecosystem}
                </span>
              </div>

              {/* Bottom Details Over Image */}
              <div className="absolute bottom-6 left-6 right-6 text-white z-10">
                <span className="text-sm font-garamond italic text-[#E5C378]">
                  {selectedPlace.localName || 'Details to be confirmed'}
                </span>
                <h3 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-wide mt-1 text-white">
                  {selectedPlace.name}
                </h3>
                <p className="mt-2 text-xs sm:text-sm font-nunito text-white/90 max-w-xl leading-relaxed text-pretty">
                  {selectedPlace.detailedDescription}
                </p>
              </div>
            </div>

            {/* Right Col: High-Altitude Technical Telemetry Matrix */}
            <div className="lg:col-span-5 p-6 sm:p-8 bg-[#FAF8F3] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-4 mb-6">
                  <span className="text-xs font-oswald font-bold uppercase tracking-widest text-[#134E35]">
                    FIELD DETAILS & CONDITIONS
                  </span>
                  <span className="text-xs font-oswald font-bold bg-[#134E35] text-white px-2.5 py-1 rounded-lg tracking-wider">
                    ALTITUDE TO BE CONFIRMED
                  </span>
                </div>

                {/* 4 Telemetry Spec Cards */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-3.5 rounded-2xl bg-white border border-[#E2DDD3]">
                    <div className="flex items-center gap-1.5 text-xs text-[#8F4F38] font-oswald font-bold tracking-wider mb-1">
                      <Thermometer className="w-3.5 h-3.5" />
                      <span>NIGHT TEMP</span>
                    </div>
                    <div className="text-xs sm:text-sm font-nunito font-bold text-[#1D2530]">
                      {currentProfile.nightTemp}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-[#E2DDD3]">
                    <div className="flex items-center gap-1.5 text-xs text-[#8F4F38] font-oswald font-bold tracking-wider mb-1">
                      <Wind className="w-3.5 h-3.5" />
                      <span>AIR CONDITIONS</span>
                    </div>
                    <div className="text-xs sm:text-sm font-nunito font-bold text-[#1D2530]">
                      {currentProfile.oxygenLevel}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-[#E2DDD3]">
                    <div className="flex items-center gap-1.5 text-xs text-[#8F4F38] font-oswald font-bold tracking-wider mb-1">
                      <Footprints className="w-3.5 h-3.5" />
                      <span>TERRAIN TYPE</span>
                    </div>
                    <div className="text-xs sm:text-sm font-nunito font-bold text-[#1D2530] line-clamp-1">
                      {selectedPlace.terrain}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-[#E2DDD3]">
                    <div className="flex items-center gap-1.5 text-xs text-[#8F4F38] font-oswald font-bold tracking-wider mb-1">
                      <Tent className="w-3.5 h-3.5" />
                      <span>ACCOMMODATION</span>
                    </div>
                    <div className="text-xs sm:text-sm font-nunito font-bold text-[#1D2530] line-clamp-1">
                      {selectedPlace.stayType}
                    </div>
                  </div>
                </div>

                {/* Trail Stage Highlights Box */}
                <div className="p-4 rounded-2xl bg-[#EAF5EE] border border-[#134E35]/20 mb-6">
                  <div className="text-xs font-oswald font-bold text-[#134E35] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#134E35]" />
                    <span>TRAIL SIGNATURE HIGHLIGHT</span>
                  </div>
                  <p className="text-xs sm:text-sm font-nunito text-[#134E35] font-medium">
                    "{selectedPlace.highlight}"
                  </p>
                </div>
              </div>

              {/* Action Button: Jump to Itinerary Day */}
              <button
                onClick={() => {
                  if (onExploreDay) {
                    onExploreDay(selectedPlace.dayNumber);
                  } else {
                    const itEl = document.getElementById('itinerary');
                    itEl?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#134E35] hover:bg-[#185F41] text-white text-xs font-raleway uppercase font-bold tracking-widest flex items-center justify-center gap-3 transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                <span>Read Full Chapter {selectedPlace.dayNumber} Expedition Journal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom Deep Dive Details: Folklore, Flora/Fauna & Mountaineer Advice */}
          <div className="p-6 sm:p-10 grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#FAF8F3]">
            
            {/* 1. Cultural Lore & Mythology */}
            <div className="bg-white p-6 rounded-2xl border border-[#E2DDD3] shadow-sm">
              <div className="flex items-center gap-2 text-xs font-oswald font-bold uppercase tracking-wider text-[#8F4F38] mb-2.5">
                <Layers className="w-4 h-4 text-[#8F4F38]" />
                <span>CULTURAL CONTEXT REVIEW</span>
              </div>
              <p className="text-xs sm:text-sm font-nunito text-[#4A5568] leading-relaxed">
                {currentProfile.folklore}
              </p>
            </div>

            {/* 2. Flora, Fauna & Microclimate */}
            <div className="bg-white p-6 rounded-2xl border border-[#E2DDD3] shadow-sm">
              <div className="flex items-center gap-2 text-xs font-oswald font-bold uppercase tracking-wider text-[#134E35] mb-2.5">
                <TreePine className="w-4 h-4 text-[#134E35]" />
                <span>BOTANICAL & WILDLIFE REVIEW</span>
              </div>
              <p className="text-xs sm:text-sm font-nunito text-[#4A5568] leading-relaxed">
                {currentProfile.floraFauna}
              </p>
            </div>

            {/* 3. Campsite Atmosphere & Mountaineering Tip */}
            <div className="bg-white p-6 rounded-2xl border border-[#E2DDD3] shadow-sm">
              <div className="flex items-center gap-2 text-xs font-oswald font-bold uppercase tracking-wider text-[#8F4F38] mb-2.5">
                <ShieldAlert className="w-4 h-4 text-[#8F4F38]" />
                <span>PREPARATION NOTE</span>
              </div>
              <p className="text-xs sm:text-sm font-nunito text-[#4A5568] leading-relaxed">
                {currentProfile.mountaineerTip}
              </p>
              <div className="mt-3 pt-3 border-t border-[#E2DDD3] text-xs font-garamond italic text-[#134E35] font-semibold">
                📍 {currentProfile.walkingStats}
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default TrailPlacesDossier;
