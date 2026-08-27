/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
import { TrailLocation } from '../types';

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

  // Extended botanical, folkloric and tactical data for each place
  const placeDeepProfiles: Record<string, {
    ecosystem: string;
    zone: 'forest' | 'meadow' | 'high-ridge' | 'summit';
    nightTemp: string;
    oxygenLevel: string;
    folklore: string;
    floraFauna: string;
    campsiteAtmosphere: string;
    mountaineerTip: string;
    walkingStats: string;
  }> = {
    'lohajung-wan': {
      ecosystem: 'Sub-Alpine Conifer & Oak Foothills',
      zone: 'forest',
      nightTemp: '8°C to 12°C (Autumn) / 4°C to 8°C (May-June)',
      oxygenLevel: '78% of sea level',
      folklore: 'The historic mountain outpost overlooking the deep Wan river canyon where expeditions prepare for the high Himalayas.',
      floraFauna: 'Himalayan cedar (Deodar), banj oak, red-billed blue magpies, barking deer in lower slopes.',
      campsiteAtmosphere: 'Traditional Garhwali stone village lodges, steam rising from spiced ginger tea, comprehensive route briefing, gear audit, and altitude preparation.',
      mountaineerTip: 'Hydrate continuously. Test your trekking poles, inspect all layers, and participate actively in the route and safety briefing.',
      walkingStats: 'Basecamp • 210 km scenic mountain drive from Rishikesh'
    },
    lohajung: {
      ecosystem: 'Sub-Alpine Conifer & Oak Foothills',
      zone: 'forest',
      nightTemp: '8°C to 12°C (Autumn) / 4°C to 8°C (May-June)',
      oxygenLevel: '78% of sea level',
      folklore: 'Named after the fierce battle ("Jung") where Goddess Parvati defeated the demon Lohasur.',
      floraFauna: 'Himalayan cedar (Deodar), banj oak, red-billed blue magpies.',
      campsiteAtmosphere: 'Traditional Garhwali stone lodges and expedition staging grounds.',
      mountaineerTip: 'Hydrate continuously and double check your cold weather packing list.',
      walkingStats: 'Basecamp • Gateway from Rishikesh'
    },
    wan: {
      ecosystem: 'Lower Temperate Valley & Giant Himalayan Cypress Groves',
      zone: 'forest',
      nightTemp: '7°C to 11°C',
      oxygenLevel: '78% of sea level',
      folklore: 'The historic cultural village of Wan houses the sacred temple of Latu Devta (brother-deity of Nanda Devi), shaded by centuries-old giant Cypress trees.',
      floraFauna: 'Ancient Cupressus torulosa (Himalayan cypress), oak canopies, mountain orchards, domestic sheep flocks.',
      campsiteAtmosphere: 'Quiet mountain village where the foot journey begins and concludes. Traditional wood-and-stone houses and deep valley views.',
      mountaineerTip: 'Maintain a calm and steady walking pace from the trailhead as the trail transitions into the quiet ancient forest.',
      walkingStats: 'Trailhead Departure / Return • 7,800 FT'
    },
    'ghairoli-patal': {
      ecosystem: 'Temperate Broadleaf & Dense Oak / Rhododendron Canopy',
      zone: 'forest',
      nightTemp: '4°C to 8°C (Autumn) / 2°C to 6°C (Spring)',
      oxygenLevel: '72% of sea level',
      folklore: 'A deeply serene forest clearing tucked away in the dense woodlands, revered by local shepherds for its pristine natural springs.',
      floraFauna: 'Towering Rhododendron arboreum (scarlet blossoms in spring), chir pine, moss-draped evergreen oaks, monal pheasants.',
      campsiteAtmosphere: 'Tranquil woodland camp, cool mountain breeze filtering through towering branches, warm dining tent, and stars twinkling through the canopy.',
      mountaineerTip: 'The initial ascent into the forest requires controlled pacing and disciplined hydration. Settle into your walking rhythm.',
      walkingStats: '8 km from Wan Trailhead • 4 to 5 hours steady forest ascent'
    },
    'ali-bugyal': {
      ecosystem: 'High Altitude Undulating Alpine Grassland (Bugyal)',
      zone: 'meadow',
      nightTemp: '0°C to 4°C (Autumn) / -2°C to 2°C (Spring)',
      oxygenLevel: '68% of sea level',
      folklore: 'Regarded as sacred grazing meadows of Nanda Devi. Local graziers take their shoes off out of spiritual reverence when crossing the velvet expanse.',
      floraFauna: 'Velveteen alpine grass varieties, creeping gentians, Himalayan yellow poppy, grazing horses and mountain sheep herds.',
      campsiteAtmosphere: 'Expedition tents pitched on boundless rolling green carpets. Sunset paints the towering wall of Mt. Trishul (7,120 m) in shades of molten orange.',
      mountaineerTip: 'Take a gentle acclimatization walk on the soft meadow turf in the evening to let your breathing adjust to 11,300+ feet.',
      walkingStats: 'Transition from Ghairoli Patal • Boundless alpine meadow expanse'
    },
    'patar-nauchni': {
      ecosystem: 'Alpine Tundra & Exposed High Mountain Plateau',
      zone: 'high-ridge',
      nightTemp: '-5°C to -1°C (Autumn) / -8°C to -3°C (Spring)',
      oxygenLevel: '63% of sea level',
      folklore: 'According to Garhwal folklore, a high-altitude natural mountain plateau situated along the ancient pilgrimage route toward the sacred heights.',
      floraFauna: 'Low-growing cushion plants, alpine lichens, snow finches, hardy high-altitude choughs.',
      campsiteAtmosphere: 'A dramatic, windswept plateau boxed between sheer ridges. Under the inky black night sky, the Milky Way stretches in high-definition brilliance.',
      mountaineerTip: 'The temperature plummets quickly once the sun drops behind the ridge. Put on your thermal layers and fleece beanie before sunset.',
      walkingStats: '10 km from Ghairoli Patal via Ali Bugyal • 5 to 6 hours climb'
    },
    'patar-nachauni': {
      ecosystem: 'Alpine Tundra & Exposed High Mountain Plateau',
      zone: 'high-ridge',
      nightTemp: '-5°C to -1°C (Autumn) / -8°C to -3°C (Spring)',
      oxygenLevel: '63% of sea level',
      folklore: 'According to Garhwal folklore, a high-altitude natural mountain plateau situated along the ancient pilgrimage route.',
      floraFauna: 'Low-growing cushion plants, alpine lichens, snow finches.',
      campsiteAtmosphere: 'A dramatic windswept shelf under high-altitude starry skies.',
      mountaineerTip: 'Layer up early and drink plenty of warm fluids.',
      walkingStats: 'High Plateau Camp • 12,820 FT'
    },
    bhagwabasa: {
      ecosystem: 'Periglacial Boulder Field & Cold High-Altitude Staging',
      zone: 'high-ridge',
      nightTemp: '-10°C to -4°C (Autumn) / -14°C to -6°C (Spring)',
      oxygenLevel: '59% of sea level',
      folklore: 'Bhagwabasa translates to "The Abode of the Tiger" (the mount of Goddess Nanda Devi). This is the final staging camp before the summit assault.',
      floraFauna: 'Habitat of the mystical Brahma Kamal (Saussurea obvallata) — the revered sacred lotus of the gods that blooms between rocks in late monsoon.',
      campsiteAtmosphere: 'Tents pitched on rocky stone clearings amid giant talus boulders. The air is razor-thin, cold, and electric with summit anticipation.',
      mountaineerTip: 'Summit assault begins in the early pre-dawn hours. Pack your summit daypack, headlamp, microspikes, and insulated warm flask before sleeping.',
      walkingStats: '7 km from Patar Nauchni • 4 to 5 hours rugged ascent • 14,120 FT'
    },
    roopkund: {
      ecosystem: 'Glacial Tarn & High Himalayan Cirque (4,800 M)',
      zone: 'summit',
      nightTemp: '-15°C to -8°C (Extreme sub-zero winds)',
      oxygenLevel: '54% of sea level',
      folklore: 'The Mystery Skeleton Lake. An ancient 9th-century entourage was preserved in the glacial permafrost, creating one of the Himalayas\' most fascinating archaeological mysteries.',
      floraFauna: 'Permanent snowfields, blue ice tarn, microscopic cryophilic algae.',
      campsiteAtmosphere: 'Surreal, sacred, and deeply humbling. The glacial tarn sits nestled directly below the colossal ice-draped headwall of Mt. Trishul.',
      mountaineerTip: 'Maintain steady, deep rhythmic breaths. Do not touch or disturb any archaeological artifacts or skeletal remains. Leave no trace.',
      walkingStats: 'Summit Goal • ~8 km round-trip climb from Bhagwabasa • 5 to 7 hrs'
    },
    'bedni-bugyal': {
      ecosystem: 'Sub-Alpine Ridge & Glacial Lake Basin',
      zone: 'meadow',
      nightTemp: '-2°C to 2°C (Autumn) / -4°C to 0°C (Spring)',
      oxygenLevel: '67% of sea level',
      folklore: 'The historic meadow exploration ground offering iconic 360-degree vistas of Mt. Trishul and Nanda Ghunti over shimmering reflection tarns.',
      floraFauna: 'Alpine sedges, alpine buttercups, potentilla, Himalayan griffon vultures and golden eagles soaring along the ridge updrafts.',
      campsiteAtmosphere: 'Expansive alpine panorama with golden light spreading across the Garhwal peaks during sunset and sunrise.',
      mountaineerTip: 'Enjoy the descent through Bedni Bugyal and savor the expansive mountain panoramas before dropping back toward Wan Village.',
      walkingStats: 'Return exploration traverse on Day 6 • ~10 km descent toward Wan'
    }
  };

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
              Every stop on the Roopkund corridor is a distinct world — transitioning across five elevation zones from ancient oak canopies and velvet alpine bugyals to mystical permafrost tarns.
            </p>
          </div>

          {/* Ecosystem Zone Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-[#E2DDD3] shadow-sm self-start lg:self-end text-xs font-raleway">
            {[
              { id: 'all', label: 'All 9 Stages' },
              { id: 'forest', label: 'Oak & Village (7,600-8,050 FT)' },
              { id: 'meadow', label: 'High Bugyals (11,320-11,540 FT)' },
              { id: 'high-ridge', label: 'Pass & High Ridge (12,820-14,120 FT)' },
              { id: 'summit', label: 'Summit Basin (15,750 FT)' },
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
                      DAY 0{place.dayNumber}
                    </span>
                    {place.id === 'roopkund' && (
                      <span className="text-[9px] font-oswald bg-red-600 text-white px-1.5 py-0.5 rounded font-bold tracking-wider">★ SUMMIT</span>
                    )}
                  </div>
                  <div className={`font-playfair font-bold text-sm leading-tight mt-0.5 ${isSelected ? 'text-white' : 'text-[#1D2530]'}`}>
                    {place.name}
                  </div>
                  <div className={`text-[11px] font-oswald tracking-wide ${isSelected ? 'text-white/80' : 'text-[#64748B]'}`}>
                    {place.altitudeFeet.toLocaleString()} FT
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
                  DAY {selectedPlace.dayNumber} OF EXPEDITION
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-[#134E35] text-white font-oswald text-xs font-bold uppercase tracking-wider">
                  {currentProfile.ecosystem}
                </span>
              </div>

              {/* Bottom Details Over Image */}
              <div className="absolute bottom-6 left-6 right-6 text-white z-10">
                <span className="text-sm font-garamond italic text-[#E5C378]">
                  {selectedPlace.localName || 'Garhwal Himalayan Sanctuary'}
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
                    FIELD TELEMETRY & CONDITIONS
                  </span>
                  <span className="text-xs font-oswald font-bold bg-[#134E35] text-white px-2.5 py-1 rounded-lg tracking-wider">
                    {selectedPlace.altitudeFeet.toLocaleString()} FT / {selectedPlace.altitudeMeters} M
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
                      <span>OXYGEN RATIO</span>
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
                <span>Read Full Day {selectedPlace.dayNumber} Expedition Journal</span>
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
                <span>MYTHOLOGY & FOLKLORE</span>
              </div>
              <p className="text-xs sm:text-sm font-nunito text-[#4A5568] leading-relaxed">
                {currentProfile.folklore}
              </p>
            </div>

            {/* 2. Flora, Fauna & Microclimate */}
            <div className="bg-white p-6 rounded-2xl border border-[#E2DDD3] shadow-sm">
              <div className="flex items-center gap-2 text-xs font-oswald font-bold uppercase tracking-wider text-[#134E35] mb-2.5">
                <TreePine className="w-4 h-4 text-[#134E35]" />
                <span>BOTANICAL & WILDLIFE PROFILE</span>
              </div>
              <p className="text-xs sm:text-sm font-nunito text-[#4A5568] leading-relaxed">
                {currentProfile.floraFauna}
              </p>
            </div>

            {/* 3. Campsite Atmosphere & Mountaineering Tip */}
            <div className="bg-white p-6 rounded-2xl border border-[#E2DDD3] shadow-sm">
              <div className="flex items-center gap-2 text-xs font-oswald font-bold uppercase tracking-wider text-[#8F4F38] mb-2.5">
                <ShieldAlert className="w-4 h-4 text-[#8F4F38]" />
                <span>MOUNTAINEER ADVISORY</span>
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
