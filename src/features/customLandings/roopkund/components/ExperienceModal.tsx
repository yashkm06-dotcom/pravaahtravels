/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, MapPin, Compass, Mountain, Camera, Sun, ShieldCheck, ArrowRight, Eye, Layers } from 'lucide-react';
import { ExperienceHighlight } from '../types';

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

const EXPERIENCE_DEEP_DATA: Record<string, ExtendedExperienceDetail> = {
  'exp-1': {
    quote: '“Under the canopy of ancient oaks, light filters through moss like emerald dust, and the roar of the Neel Ganga echoes through the valley.”',
    sensorySights: 'Moss-bearded brown oaks, blooming scarlet rhododendrons (Buransh) in spring, golden sunlight slicing through primeval mist.',
    sensorySounds: 'The rushing torrent of the Neel Ganga river below, calling Himalayan whistling thrushes, and dry leaves crunching underfoot.',
    sensoryScents: 'Earthy petrichor, damp oak moss, wild Himalayan thyme, and woodsmoke from stone shepherd huts.',
    bestSeason: 'Late April to June (for full scarlet bloom) and September to November (for crystal-clear autumn canopies).',
    altitudeContext: '7,600 FT (Lohajung) to 8,040 FT (Didna Village) — 6.5 km through deep gorge and ascending forest ridge.',
    photographyTip: 'Use a wide aperture (f/2.8) for atmospheric backlit portraits of moss-draped branches; capture the contrasting scarlet flowers against dark bark.',
    loreOrEtiquette: 'Local Garhwalis consider the oak (Banj) sacred for holding the mountain water table. Avoid snapping branches; stay on the designated mule trail.'
  },
  'exp-2': {
    quote: '“Ali Bugyal does not begin or end with a line. It simply swells up into the sky, a green ocean rolling beneath giant snow peaks.”',
    sensorySights: 'Unbroken rolling velvet grasslands stretching for miles, horses grazing freely against the colossal backdrop of Mt. Trishul and Chaukhamba.',
    sensorySounds: 'Gentle high-altitude mountain winds whistling through the grass, horse bells chiming in the distance, absolute silence at dawn.',
    sensoryScents: 'Crisp, razor-sharp high-altitude air scented with wild alpine clover and dried pasture grasses.',
    bestSeason: 'May to June for lush fluorescent emerald velvet; September to October for golden autumn hues.',
    altitudeContext: '11,600 FT (Ali Bugyal Ridge) to 11,800 FT (Bedni Top) — Asia’s largest high-altitude meadows.',
    photographyTip: 'Arrive at the meadow crest early morning for soft directional sunlight that creates long shadows across the undulating contours.',
    loreOrEtiquette: 'Camping directly on the fragile Bugyal turf is strictly prohibited by high court ecological mandates. Pravaah camps strictly in designated fringe zones.'
  },
  'exp-3': {
    quote: '“At 5:45 AM, the summit pyramid of Trishul ignites in liquid gold before the valleys below even know the night has ended.”',
    sensorySights: 'The 7,120m sheer western face of Trishul and Nanda Ghunti glowing rose-gold, mirrored in the crystalline pool of Bedni Kund.',
    sensorySounds: 'The soft flutter of sacred Buddhist & Garhwali prayer flags in the pre-dawn alpine breeze.',
    sensoryScents: 'Pure, freezing mountain ozone and burning juniper incense at the ancient stone temple on the lake shore.',
    bestSeason: 'September to November offers 100% cloud-free morning horizons with razor-sharp mountain clarity.',
    altitudeContext: '11,800 FT (Bedni Kund Basin) directly facing the Nanda Devi Sanctuary massif.',
    photographyTip: 'Set up your tripod 20 minutes before sunrise facing East-North-East. Use graduated neutral density filters to balance the bright peaks with foreground reflections.',
    loreOrEtiquette: 'Bedni Kund is considered the sacred bathing tarn of Goddess Nanda Devi. Trekkers must remove shoes before stepping onto the temple stones.'
  },
  'exp-4': {
    quote: '“In just seven days, you walk from humid subtropical river valleys to frozen Arctic moonscapes. It is like traversing a continent on foot.”',
    sensorySights: 'Rapid transitions: roaring rivers → dense temperate oak forest → boundless subalpine bugyals → scree slopes → black basalt cliffs & glacial snow.',
    sensorySounds: 'From singing cicadas and rushing streams on Day 1 to the stark, chilling whistling wind of the high glacial cirques on Day 5.',
    sensoryScents: 'Subtropical pines giving way to alpine moss, then sterile, clean cold rock and glacier ice.',
    bestSeason: 'Both Spring (May-June) with snowfields and Autumn (Sept-Oct) with dramatic high contrast offer distinct geological spectacles.',
    altitudeContext: 'Spans 1,120 FT (Rishikesh) to 15,750 FT (Roopkund Glacier) across distinct bioclimatic zones.',
    photographyTip: 'Carry both a wide-angle lens (16-35mm) for sweeping landscape shifts and a 70-200mm telephoto to compress distant moraine layers.',
    loreOrEtiquette: 'Layering is critical. You will experience temperatures from +24°C at the trailhead to -8°C at high camps. Adjust garments proactively.'
  },
  'exp-5': {
    quote: '“Cupped within stone amphitheaters at 15,750 feet, the lake holds secrets that have defied archaeologists and geneticists for nearly a century.”',
    sensorySights: 'The jade-green glacial tarn surrounded by snowfields and shattered shale, with preserved human skeletal remains and ancient artifacts visible during thaw.',
    sensorySounds: 'The solemn, deafening silence of the high Himalayas broken only by sudden gusts of wind whistling off the Junargali ridge.',
    sensoryScents: 'Freezing, mineral-dense glacial air with zero organic moisture.',
    bestSeason: 'June (early thaw) or late September-October (clear skies, post-monsoon melt revealing shoreline artifacts).',
    altitudeContext: '15,750 FT (4,800m) at the base of Mt. Trishul (7,120m).',
    photographyTip: 'Polarizing filters cut through the glacial glare and allow you to capture details beneath the water surface of the shallow tarn.',
    loreOrEtiquette: 'STRICT ARTIFACT INTEGRITY: Roopkund is a protected archaeological sanctuary. Touching, removing, or disturbing any bone or artifact is illegal and desecrates the memorial.'
  },
  'exp-6': {
    quote: '“Unzip your tent at midnight and you will see the Milky Way arching across the sky like a river of diamond dust.”',
    sensorySights: 'The cosmic belt of the Milky Way stretching unbroken from Trishul to Chaukhamba with zero artificial light pollution.',
    sensorySounds: 'Taut canvas rustling gently in sub-zero wind, followed by complete stillness under a dome of stars.',
    sensoryScents: 'Hot ginger-cardamom tea brewing in the mess tent and the clean scent of high-altitude frost.',
    bestSeason: 'September – November (crystal clear new moon nights) and May – June.',
    altitudeContext: 'Wilderness camps at Didna (8,040 ft), Ali Bugyal (11,600 ft), Bedni (11,800 ft), and Bhagwabasa (14,100 ft).',
    photographyTip: 'Use a fast wide-angle lens (f/1.4 - f/2.8), ISO 3200-6400, and 20-25 second exposures on a sturdy tripod with a remote shutter.',
    loreOrEtiquette: 'All Pravaah camps enforce a strict 9:00 PM quiet-hours rule to ensure restorative sleep before alpine acclimatization hikes.'
  },
  'exp-7': {
    quote: '“Walking the narrow skyline spine with the valley plunging 4,000 feet on either side makes you feel suspended between heaven and earth.”',
    sensorySights: 'Knife-edge trails winding along ridge crests, with dramatic sea-of-clouds inversions below and snow peaks standing sharp above.',
    sensorySounds: 'Wind buffeting against your windcheater, trekking pole clicks on stone slate, and synchronized breathing.',
    sensoryScents: 'Dry mountain shale and wild high-altitude gentian flowers.',
    bestSeason: 'Autumn for crisp, cloudless horizon views spanning over 100 kilometers across Uttarakhand.',
    altitudeContext: '12,500 FT to 14,100 FT between Bedni Bugyal, Ghora Lotani, and Kalu Vinayak temple ridge.',
    photographyTip: 'Position your trekking companions as scale figures against the monumental mountain drop-offs to convey real Himalayan scale.',
    loreOrEtiquette: 'Maintain single-file discipline on exposed ridge sections. Yield right-of-way to ascending hikers and pack mules on the mountain side.'
  },
  'exp-8': {
    quote: '“Time slows down in the slate-roofed hamlets of Didna and Wan, where life still moves to the rhythm of season, sheep, and sacred bells.”',
    sensorySights: 'Traditional Garhwali multi-story stone houses with intricate Deodar wood carvings, women spinning sheep wool, and terraced barley fields.',
    sensorySounds: 'Temple bells ringing in Wan village, children laughing, Garhwali folk chants, and cowbells.',
    sensoryScents: 'Freshly baked Madua (finger millet) rotis, smoking deodar firewood, and sun-dried mountain herbs.',
    bestSeason: 'Spring and Autumn when village life is in full agrarian rhythm.',
    altitudeContext: 'Wan Village (8,000 ft) and Didna Village (8,040 ft).',
    photographyTip: 'Always greet locals with a warm “Namaste” and ask for permission before photographing village elders or sacred shrine interiors.',
    loreOrEtiquette: 'Support the local economy by appreciating Garhwali food, hiring native muleteers, and respecting village customs and sacred groves.'
  }
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

    if (experience) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [experience, onClose]);

  const deepData = experience ? (EXPERIENCE_DEEP_DATA[experience.id] || {
    quote: `“${experience.description}”`,
    sensorySights: 'Spectacular panoramic perspectives of the Greater Garhwal Himalayas.',
    sensorySounds: 'Glacial winds, rushing river streams, and mountain silence.',
    sensoryScents: 'Clean alpine ozone, wild herbs, and pine forest petrichor.',
    bestSeason: 'May–June and September–October.',
    altitudeContext: 'High-Altitude Himalayan Wilderness.',
    photographyTip: 'Take advantage of early morning alpenglow and late afternoon golden hour.',
    loreOrEtiquette: 'Tread lightly and practice Leave No Trace principles.'
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
                  {experience.description} Every step of this route has been refined over decades of Himalayan guiding to ensure you experience the full emotional and environmental depth of the Garhwal mountains.
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
                      OPTIMAL EXPEDITION SEASON
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
                      MOUNTAIN LORE & SANCTUARY ETHICS
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
                  Part of Pravaah’s handcrafted 7-day Roopkund Expedition.
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

