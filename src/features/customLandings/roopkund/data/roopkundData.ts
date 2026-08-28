/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ExpeditionPackage,
  TrailLocation,
  ItineraryDay,
  ElevationPoint,
  PackingCategory,
  InclusionItem,
  ExclusionItem,
  SafetyRule,
  WhoIsThisForCriterion,
  BrandDifferentiator,
  TravellerReview,
  ExperienceHighlight
} from '../types';

export const ROOPKUND_PACKAGE: ExpeditionPackage = {
  title: 'ROOPKUND TREK',
  slug: 'roopkund-trek',
  subtitle: 'The Mystery Trail in the Garhwal Himalayas',
  tagline: 'A high-altitude Himalayan expedition through dense forests, alpine meadows, dramatic mountain terrain and the legendary Roopkund region.',
  region: 'Chamoli Garhwal',
  state: 'Uttarakhand',
  country: 'India',
  duration: '7 Days / 6 Nights',
  durationDays: 7,
  difficulty: 'Demanding',
  maxAltitudeFeet: 15750,
  maxAltitudeMeters: 4800,
  totalDistanceKm: 39,
  bestSeason: 'May – June & September – October',
  startingPoint: 'Rishikesh',
  endingPoint: 'Rishikesh',
  heroImage: '/images/roopkund/mount-trishul.jpg',
  description: 'High in the Garhwal Himalayas lies Roopkund — a remote glacial lake surrounded by dramatic mountains and one of the Himalayas\' most intriguing archaeological mysteries. Starting from Rishikesh to Lohajung / Wan, the route traverses dense oak and rhododendron forests, the expansive alpine meadows of Ali Bugyal, rugged high-altitude staging at Bhagwabasa, and the defining Roopkund summit objective.'
};

export const TRAIL_LOCATIONS: TrailLocation[] = [
  {
    id: 'rishikesh',
    name: 'Rishikesh',
    localName: 'ऋषिकेश (The Gateway)',
    dayNumber: 1,
    altitudeFeet: 1120,
    altitudeMeters: 340,
    distanceFromStartKm: 0,
    terrain: 'Foothills & River Valleys',
    coordinates: { lat: 30.0869, lng: 78.2676, elevationZ: 0.1 },
    shortDescription: 'The sacred gateway along the Ganges where the expedition begins and concludes.',
    detailedDescription: 'The expedition begins with an early departure from Rishikesh. Travel through the Garhwal Himalayas toward Lohajung / Wan, passing through winding mountain roads, river valleys and traditional Himalayan settlements.',
    highlight: 'Sacred river confluence and gateway departure',
    image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?q=80&w=1200&auto=format&fit=crop',
    stayType: 'Expedition Gateway'
  },
  {
    id: 'lohajung-wan',
    name: 'Lohajung / Wan',
    localName: 'लोहाजंग / वां (Base Station)',
    dayNumber: 1,
    altitudeFeet: 7600,
    altitudeMeters: 2316,
    distanceFromStartKm: 210,
    terrain: 'Mountain Valley & Terraced Slopes',
    coordinates: { lat: 30.0766, lng: 79.5786, elevationZ: 0.8 },
    shortDescription: 'The staging base where the expedition briefing, gear inspection, and safety preparations take place.',
    detailedDescription: 'As the route climbs higher, the landscape gradually changes from the lower Himalayan valleys to the remote mountain terrain of Chamoli. The evening is dedicated to complete route briefing, gear audit, weather review, and altitude-awareness preparation.',
    highlight: 'Expedition briefing and mountain gear inspection',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop',
    stayType: 'Lohajung / Wan Lodge'
  },
  {
    id: 'wan',
    name: 'Wan Village',
    localName: 'वां गाँव (Trailhead)',
    dayNumber: 2,
    altitudeFeet: 7800,
    altitudeMeters: 2377,
    distanceFromStartKm: 210,
    terrain: 'Traditional Village & Forest Trailhead',
    coordinates: { lat: 30.0984, lng: 79.6105, elevationZ: 0.9 },
    shortDescription: 'The traditional Himalayan mountain village where the walking journey begins and concludes.',
    detailedDescription: 'After breakfast, the actual trekking journey begins from Wan Village. The trail gradually leaves the village behind and enters the quiet, ancient oak and rhododendron forest.',
    highlight: 'Stepping onto the foot trail into dense Himalayan canopy',
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1200&auto=format&fit=crop',
    stayType: 'Trailhead Departure / Wan Stay'
  },
  {
    id: 'ghairoli-patal',
    name: 'Ghairoli Patal',
    localName: 'गैरोली पाताल (Forest Camp)',
    dayNumber: 2,
    altitudeFeet: 10000,
    altitudeMeters: 3048,
    distanceFromStartKm: 218,
    terrain: 'Dense Oak & Rhododendron Woods',
    coordinates: { lat: 30.1450, lng: 79.6010, elevationZ: 1.8 },
    shortDescription: 'Secluded forest campsite nestled in ancient oak and rhododendron canopies.',
    detailedDescription: 'The route takes you through beautiful oak and rhododendron forests, where the atmosphere becomes quieter and more remote with every step. Ghairoli Patal is the first real introduction to the rhythm of the expedition, focusing on controlled pacing, hydration, and acclimatization.',
    highlight: 'Tranquil evening camp amidst ancient Himalayan woodland',
    image: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?q=80&w=1200&auto=format&fit=crop',
    stayType: 'Ghairoli Patal Camp'
  },
  {
    id: 'ali-bugyal',
    name: 'Ali Bugyal',
    localName: 'आली बुग्याल (The Great Meadow)',
    dayNumber: 3,
    altitudeFeet: 11320,
    altitudeMeters: 3450,
    distanceFromStartKm: 224,
    terrain: 'Vast Open High-Altitude Alpine Meadow',
    coordinates: { lat: 30.1704, lng: 79.6208, elevationZ: 2.3 },
    shortDescription: 'One of Asia\'s most dramatic velvet alpine meadows opening above the tree line.',
    detailedDescription: 'The dense forest gives way to the wide-open alpine terrain of Ali Bugyal. The enormous meadow landscape creates a dramatic contrast with the forest trails of the previous day, offering expansive mountain ridges and Himalayan panoramas.',
    highlight: 'Sudden emergence from dense forest into vast velvet meadows',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop',
    stayType: 'High Alpine Passage'
  },
  {
    id: 'patar-nauchni',
    name: 'Patar Nauchni',
    localName: 'पातर नचौणी (High Ridge Camp)',
    dayNumber: 3,
    altitudeFeet: 12820,
    altitudeMeters: 3907,
    distanceFromStartKm: 228,
    terrain: 'Exposed High-Altitude Mountain Plateau',
    coordinates: { lat: 30.2201, lng: 79.6802, elevationZ: 3.4 },
    shortDescription: 'A windswept high-altitude plateau with dramatic ridge vistas.',
    detailedDescription: 'As the altitude increases toward Patar Nauchni, the terrain becomes more exposed and weather conditions can change quickly. The evening is kept relaxed to allow the group to recover and prepare for higher-altitude sections ahead.',
    highlight: 'High mountain ridge scenery under an incandescent night sky',
    image: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?q=80&w=1200&auto=format&fit=crop',
    stayType: 'Patar Nauchni Camp'
  },
  {
    id: 'bhagwabasa',
    name: 'Bhagwabasa',
    localName: 'भगवाबासा (Summit Staging Camp)',
    dayNumber: 4,
    altitudeFeet: 14120,
    altitudeMeters: 4303,
    distanceFromStartKm: 235,
    terrain: 'Glacial Moraine, Boulders & Cold High-Altitude Zone',
    coordinates: { lat: 30.2523, lng: 79.7215, elevationZ: 4.5 },
    shortDescription: 'The high-altitude staging point for the Roopkund summit objective.',
    detailedDescription: 'The trail becomes increasingly rugged as elevation increases, with less vegetation, more exposed terrain, colder temperatures, and rocky sections. In the evening, the expedition team conducts the final summit briefing and gear readiness checks.',
    highlight: 'Staging camp at 14,120 ft beneath towering Himalayan faces',
    image: 'https://images.unsplash.com/photo-1465919292275-c60ba49da6ae?q=80&w=1200&auto=format&fit=crop',
    stayType: 'Bhagwabasa Base Camp'
  },
  {
    id: 'roopkund',
    name: 'Roopkund Summit',
    localName: 'रूपकुंड (The Mystery Trail)',
    dayNumber: 5,
    altitudeFeet: 15750,
    altitudeMeters: 4800,
    distanceFromStartKm: 242,
    terrain: 'Steep Rocky & Snow Slopes, Glacial Cirque',
    coordinates: { lat: 30.2651, lng: 79.7329, elevationZ: 5.0 },
    shortDescription: 'The legendary high-altitude glacial lake cupped beneath Mt. Trishul.',
    detailedDescription: 'The defining day of the expedition. An early start from Bhagwabasa climbs through high-altitude terrain, cold winds, and steep sections. As morning light spreads across the Himalayas, the surrounding peaks emerge, revealing the legendary Roopkund lake.',
    highlight: 'Standing at the enigmatic high glacial tarn beneath Mt. Trishul',
    image: 'https://upload.wikimedia.org/wikipedia/commons/0/03/Human_Skeletons_in_Roopkund_Lake.jpg',
    stayType: 'Summit Objective / Base Camp'
  },
  {
    id: 'bedni-bugyal',
    name: 'Bedni Bugyal',
    localName: 'वेदनी बुग्याल (Himalayan Meadows)',
    dayNumber: 6,
    altitudeFeet: 11540,
    altitudeMeters: 3517,
    distanceFromStartKm: 252,
    terrain: 'Rolling Alpine Meadows & Mountain Viewpoints',
    coordinates: { lat: 30.1872, lng: 79.6453, elevationZ: 2.7 },
    shortDescription: 'Expansive meadow landscapes and viewpoints explored at a recovery pace.',
    detailedDescription: 'During the descent toward Wan Village, the group explores the Bedni side of the trail and surrounding landscape. Unlike summit day, this provides an opportunity to slow down, appreciate the mountains, and take photographs.',
    highlight: 'Panoramic viewpoints and peaceful meadow exploration',
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop',
    stayType: 'Meadow Exploration'
  }
];

export const ITINERARY_DAYS: ItineraryDay[] = [
  {
    dayNumber: 1,
    title: 'RISHIKESH → LOHAJUNG / WAN',
    route: 'Rishikesh → Garhwal Himalayas → Lohajung / Wan',
    startPoint: 'Rishikesh (1,120 ft)',
    endPoint: 'Lohajung / Wan (7,600 – 7,800 ft)',
    distanceKm: 'Road Journey',
    trekkingTime: 'Scenic Mountain Drive',
    altitudeStartFeet: 1120,
    altitudeEndFeet: 7600,
    altitudeGainLossFeet: '+6,480 ft gain (Drive)',
    terrain: 'Winding mountain roads, river valleys and traditional Himalayan settlements',
    stay: 'Lohajung / Wan',
    meals: 'Dinner',
    description: 'The expedition begins with an early departure from Rishikesh. Travel through the Garhwal Himalayas toward Lohajung / Wan, passing through winding mountain roads, river valleys and traditional Himalayan settlements. As the route climbs higher, the landscape gradually changes from the lower Himalayan valleys to the remote mountain terrain of Chamoli. On arrival, the group settles into the designated accommodation.\n\nExpedition Briefing: The evening is dedicated to preparing for the trek with an introduction to the expedition leader and support team, complete route briefing, weather and trail briefing, gear inspection, packing check, altitude-awareness briefing, group safety instructions, and next-day trek preparation.',
    highlights: [
      'Scenic mountain drive through river valleys and Garhwal settlements',
      'Landscape transition into the remote mountain terrain of Chamoli',
      'Comprehensive evening expedition briefing and gear inspection'
    ],
    image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?q=80&w=1200&auto=format&fit=crop',
    locationId: 'lohajung-wan',
    altitudeNote: 'Gradual motor ascent to base. Rest well and hydrate during briefing.'
  },
  {
    dayNumber: 2,
    title: 'WAN → GHAIROLI PATAL',
    route: 'Wan Village → Oak & Rhododendron Forest → Ghairoli Patal',
    startPoint: 'Wan Village (7,800 ft)',
    endPoint: 'Ghairoli Patal (10,000 ft)',
    distanceKm: 'Approx. 8 KM',
    trekkingTime: '4 – 5 hours',
    altitudeStartFeet: 7800,
    altitudeEndFeet: 10000,
    altitudeGainLossFeet: '+2,200 ft steady forest climb',
    terrain: 'Quiet, ancient oak and rhododendron forest trails',
    stay: 'Ghairoli Patal Camp',
    meals: 'Breakfast, Lunch & Dinner',
    description: 'After breakfast, the actual trekking journey begins from Wan Village. The trail gradually leaves the village behind and enters the dense Himalayan forest. The route takes you through beautiful oak and rhododendron forests, where the atmosphere becomes quieter and more remote with every step. As the trail continues, the group moves toward the Ghairoli Patal region.\n\nThis is the first real introduction to the rhythm of the expedition, focusing on controlled pace, hydration, comfortable breathing, getting accustomed to sustained mountain walking, and enjoying the changing forest landscape. The evening is spent at camp preparing for the ascent toward alpine meadows.',
    highlights: [
      'Step on foot from Wan Village into ancient Himalayan forests',
      'Walk through peaceful oak and rhododendron forest canopies',
      'Establish expedition rhythm: controlled pacing, hydration, and breathing'
    ],
    image: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?q=80&w=1200&auto=format&fit=crop',
    locationId: 'ghairoli-patal',
    altitudeNote: 'First day on foot. Maintain steady breathing and hydration.'
  },
  {
    dayNumber: 3,
    title: 'GHAIROLI PATAL → PATAR NAUCHNI VIA ALI BUGYAL',
    route: 'Ghairoli Patal → Ali Bugyal → Patar Nauchni',
    startPoint: 'Ghairoli Patal (10,000 ft)',
    endPoint: 'Patar Nauchni (12,820 ft)',
    distanceKm: 'Approx. 10 KM',
    trekkingTime: '5 – 6 hours',
    altitudeStartFeet: 10000,
    altitudeEndFeet: 12820,
    altitudeGainLossFeet: '+2,820 ft ascent across high meadows',
    terrain: 'Forest trail opening into wide-open alpine meadows and exposed mountain ridges',
    stay: 'Patar Nauchni Camp',
    meals: 'Breakfast, Lunch & Dinner',
    description: 'Today is one of the most spectacular days of the expedition. After breakfast, the trail continues upward through the forest before gradually opening into the high-altitude meadows. The dense forest gives way to the wide-open alpine terrain of Ali Bugyal.\n\nThe enormous meadow landscape creates a dramatic contrast with the forest trails of the previous day. Take time to experience the changing landscape, mountain views and expansive Himalayan surroundings before continuing toward Patar Nauchni. As the altitude increases, the terrain becomes more exposed and weather conditions can change quickly. The evening is kept relaxed to allow the group to recover and prepare for higher-altitude sections.',
    highlights: [
      'Dramatic transition from dense forest into the boundless meadows of Ali Bugyal',
      'Expansive Himalayan surroundings and mountain ridge views',
      'Arrival at the high-altitude camp of Patar Nauchni'
    ],
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop',
    locationId: 'patar-nauchni',
    altitudeNote: 'Transition to alpine zone (>11,000 ft). Keep warm layers accessible.'
  },
  {
    dayNumber: 4,
    title: 'PATAR NAUCHNI → BHAGWABASA',
    route: 'Patar Nauchni → Rugged High Altitude Trail → Bhagwabasa',
    startPoint: 'Patar Nauchni (12,820 ft)',
    endPoint: 'Bhagwabasa (14,120 ft)',
    distanceKm: 'Approx. 7 KM',
    trekkingTime: '4 – 5 hours',
    altitudeStartFeet: 12820,
    altitudeEndFeet: 14120,
    altitudeGainLossFeet: '+1,300 ft climb into glacial zone',
    terrain: 'Rugged high-altitude terrain, rocky and potentially snow-covered sections, exposed slopes',
    stay: 'Bhagwabasa Base Camp',
    meals: 'Breakfast, Lunch & Dinner',
    description: 'Today the expedition moves deeper into the high-altitude zone. After breakfast, the group begins the climb toward Bhagwabasa. The trail becomes increasingly rugged as the elevation increases, with less vegetation, more exposed terrain, stronger mountain winds, colder temperatures, and rocky or snow-covered sections depending on conditions.\n\nThe route takes the group toward the high-altitude Bhagwabasa area, the staging point for the next day\'s Roopkund summit objective. Once the group reaches camp, the expedition team conducts the final summit briefing, checking weather conditions, trail conditions, individual health, warm clothing, headlamps, water, and essential summit gear.',
    highlights: [
      'Climb deeper into the rugged high-altitude periglacial terrain',
      'Arrival at Bhagwabasa high staging camp at 14,120 ft',
      'Evening summit preparation and comprehensive gear readiness check'
    ],
    image: 'https://images.unsplash.com/photo-1465919292275-c60ba49da6ae?q=80&w=1200&auto=format&fit=crop',
    locationId: 'bhagwabasa',
    altitudeNote: 'High staging base at 14,120 ft. Early rest enforced before early summit start.'
  },
  {
    dayNumber: 5,
    title: 'BHAGWABASA → ROOPKUND SUMMIT → BASE CAMP',
    route: 'Bhagwabasa → Roopkund Summit (~15,750 ft) → Base Camp',
    startPoint: 'Bhagwabasa (14,120 ft)',
    endPoint: 'Roopkund Summit (15,750 ft) → Base Camp',
    distanceKm: 'Approx. 7 KM',
    trekkingTime: '6 – 8 hours',
    altitudeStartFeet: 14120,
    altitudeEndFeet: 15750,
    altitudeGainLossFeet: '+1,630 ft summit climb / descent to base camp',
    terrain: 'High-altitude terrain, rocky sections, snow / ice, steep slopes, glacial cirque',
    stay: 'Base Camp',
    meals: 'Breakfast, Lunch & Dinner',
    description: 'This is the defining day of the Pravaah Roopkund Expedition. The group starts early from Bhagwabasa, often before sunrise depending on the final operating plan and conditions. The trail becomes increasingly challenging as the expedition moves toward the Roopkund summit, with rocky sections, snow/ice where conditions permit, strong winds, cold temperatures, steep sections, and reduced oxygen at altitude.\n\nThe group moves together under the guidance of the expedition team. As light spreads across the Himalayas, surrounding peaks slowly emerge from darkness before reaching Roopkund — the legendary high-altitude lake. After spending appropriate time at the summit objective, return to Base Camp for recovery, hydration, warm food, and rest.',
    highlights: [
      'Early morning alpine push under guidance of the expedition team',
      'Sunrise unfolding over surrounding Himalayan peaks',
      'The objective: Standing at the legendary Roopkund lake'
    ],
    image: 'https://upload.wikimedia.org/wikipedia/commons/0/03/Human_Skeletons_in_Roopkund_Lake.jpg',
    locationId: 'roopkund',
    altitudeNote: 'Summit objective ~15,750 ft. Move at measured pace and follow leader instructions.'
  },
  {
    dayNumber: 6,
    title: 'BASE CAMP → WAN VILLAGE / BEDNI EXPLORE',
    route: 'Base Camp → Bedni Bugyal Landscapes → Wan Village',
    startPoint: 'Base Camp',
    endPoint: 'Wan Village (7,800 ft)',
    distanceKm: 'Descent & Exploration Day',
    trekkingTime: '5 – 6 hours descent & exploration',
    altitudeStartFeet: 14120,
    altitudeEndFeet: 7800,
    altitudeGainLossFeet: 'Gradual descent to Wan',
    terrain: 'Alpine meadow paths, Himalayan viewpoints, descending forest trails',
    stay: 'Wan',
    meals: 'Breakfast, Lunch & Dinner',
    description: 'After the intensity of the summit day, Day 6 is designed around recovery, exploration and experiencing the Himalayan landscape at a slower pace. The group begins its descent toward Wan Village.\n\nDuring the route, the group gets time to explore the Bedni side of the trail and surrounding landscape. Unlike summit day, this is an opportunity to slow down and appreciate the mountains with Bedni Bugyal landscapes, mountain photography, Himalayan viewpoints, meadow exploration, and quiet time in the mountains. Continue toward Wan Village for an evening of rest and recovery.',
    highlights: [
      'Relaxed descent pace allowing deep recovery after summit day',
      'Bedni Bugyal landscape exploration and mountain photography',
      'Return to Wan Village to celebrate completing the high-altitude objective'
    ],
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop',
    locationId: 'bedni-bugyal',
    altitudeNote: 'Comfortable descent into oxygen-rich lower elevations.'
  },
  {
    dayNumber: 7,
    title: 'WAN → RISHIKESH',
    route: 'Wan → Mountain Valleys → Rishikesh',
    startPoint: 'Wan Village (7,800 ft)',
    endPoint: 'Rishikesh (1,120 ft)',
    distanceKm: 'Road Journey Home',
    trekkingTime: 'Return Drive',
    altitudeStartFeet: 7800,
    altitudeEndFeet: 1120,
    altitudeGainLossFeet: 'Descent to plains',
    terrain: 'Mountain highway descending through Garhwal valleys',
    stay: 'Expedition Concludes at Rishikesh',
    meals: 'Breakfast',
    description: 'After breakfast, the group begins the return journey from Wan to Rishikesh. The vehicle descends through the Garhwal Himalayas, taking you back through the mountain valleys toward the plains.\n\nThe final day is intentionally kept flexible to accommodate mountain-road travel conditions. On reaching Rishikesh, the Pravaah Roopkund Expedition officially concludes.',
    highlights: [
      'Scenic return drive through the mountain valleys of Garhwal',
      'Group reflections on the Roopkund mystery trail and high-altitude achievements',
      'Expedition officially concludes on arrival in Rishikesh'
    ],
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
    locationId: 'rishikesh'
  }
];

export const ELEVATION_PROFILE_DATA: ElevationPoint[] = [
  { id: '1', name: 'Rishikesh', day: 1, altitudeFeet: 1120, distanceKm: 0, zone: 'Gateway Valley' },
  { id: '2', name: 'Lohajung / Wan', day: 1, altitudeFeet: 7800, distanceKm: 210, zone: 'Base Station' },
  { id: '3', name: 'Wan Village', day: 2, altitudeFeet: 7800, distanceKm: 210, zone: 'Trailhead' },
  { id: '4', name: 'Ghairoli Patal', day: 2, altitudeFeet: 10000, distanceKm: 218, zone: 'Oak & Rhododendron Forest' },
  { id: '5', name: 'Ali Bugyal', day: 3, altitudeFeet: 11320, distanceKm: 224, zone: 'Alpine Meadow (Bugyal)' },
  { id: '6', name: 'Patar Nauchni', day: 3, altitudeFeet: 12820, distanceKm: 228, zone: 'High Mountain Ridge' },
  { id: '7', name: 'Bhagwabasa', day: 4, altitudeFeet: 14120, distanceKm: 235, zone: 'Glacial Moraine & Staging' },
  { id: '8', name: 'Roopkund Summit', day: 5, altitudeFeet: 15750, distanceKm: 242, zone: 'Glacial Basin (Summit)', isPeak: true },
  { id: '9', name: 'Base Camp', day: 5, altitudeFeet: 14120, distanceKm: 246, zone: 'High Altitude Base Camp' },
  { id: '10', name: 'Bedni Bugyal', day: 6, altitudeFeet: 11540, distanceKm: 252, zone: 'Meadow Exploration' },
  { id: '11', name: 'Wan Village', day: 6, altitudeFeet: 7800, distanceKm: 260, zone: 'Traditional Mountain Village' },
  { id: '12', name: 'Rishikesh', day: 7, altitudeFeet: 1120, distanceKm: 470, zone: 'Gateway Valley' }
];

export const PACKING_CATEGORIES: PackingCategory[] = [
  {
    id: 'clothing',
    name: 'Clothing & Layering',
    iconName: 'Shirt',
    description: 'High-altitude mountain weather changes swiftly. The 3-layer system is essential.',
    items: [
      { id: 'c1', name: 'Waterproof & Windproof Breathable Trekking Jacket (10,000mm+)', category: 'Clothing', essential: true, notes: 'Gore-Tex or equivalent outer shell' },
      { id: 'c2', name: 'Heavy Down Jacket (-10°C rated)', category: 'Clothing', essential: true, notes: 'For evening camps at Bhagwabasa & summit morning' },
      { id: 'c3', name: 'Fleece / Mid-layer Jacket (200-300 GSM)', category: 'Clothing', essential: true, notes: 'Ideal for active trekking in chilly mornings' },
      { id: 'c4', name: 'Merino Wool or Synthetic Thermal Tops & Bottoms (2 pairs)', category: 'Clothing', essential: true, notes: 'Keep one pair exclusively dry for sleeping' },
      { id: 'c5', name: 'Quick-dry Trekking T-shirts (3-4 full sleeve)', category: 'Clothing', essential: true, notes: 'UV protection & sweat-wicking properties' },
      { id: 'c6', name: 'Quick-dry Trekking Trousers / Cargo Pants (2-3 pairs)', category: 'Clothing', essential: true, notes: 'Water-resistant, stretchable fabric' },
      { id: 'c7', name: 'Waterproof Rain Pants / Poncho', category: 'Clothing', essential: true, notes: 'Essential for unexpected Himalayan showers' }
    ]
  },
  {
    id: 'footwear',
    name: 'Footwear & Socks',
    iconName: 'Footprints',
    description: 'Your feet are your primary vehicle. Break in your boots prior to departure.',
    items: [
      { id: 'f1', name: 'Waterproof High-Ankle Trekking Boots with Deep Lug Vibram Sole', category: 'Footwear', essential: true, notes: 'Well broken in; minimum 2 weeks of prior usage' },
      { id: 'f2', name: 'Heavy Merino Wool Trekking Socks (4-5 pairs)', category: 'Footwear', essential: true, notes: 'Cushioned heel and toe for blister prevention' },
      { id: 'f3', name: 'Camp Slip-ons / Lightweight Sandal or Crocs', category: 'Footwear', essential: false, notes: 'For letting feet breathe around the campsite' },
      { id: 'f4', name: 'Waterproof Snow Gaiters', category: 'Footwear', essential: true, notes: 'Prevents scree, snow, and mud entering boots' }
    ]
  },
  {
    id: 'trek-gear',
    name: 'Trek Gear & Hardware',
    iconName: 'Compass',
    description: 'Hardware and stability gear tested for sub-zero alpine conditions.',
    items: [
      { id: 't1', name: '50-60L Ergonomic Expedition Backpack with Rain Cover', category: 'Trek Gear', essential: true, notes: 'Adjustable torso harness and padded hip-belt' },
      { id: 't2', name: '20-30L Daypack (if offloading main luggage)', category: 'Trek Gear', essential: false, notes: 'For water, jacket, and camera on the trail' },
      { id: 't3', name: 'Pair of Telescopic Anti-Shock Trekking Poles', category: 'Trek Gear', essential: true, notes: 'Crucial for knee protection during 5,000ft descents' },
      { id: 't4', name: 'High-Lumen LED Headlamp (200+ lumens) with Extra Lithium Batteries', category: 'Trek Gear', essential: true, notes: 'Mandatory for 3:30 AM summit push' },
      { id: 't5', name: 'Cat 3/4 Polarized UV400 Glacier Sunglasses', category: 'Trek Gear', essential: true, notes: 'Protects against snow blindness and high UV glare' },
      { id: 't6', name: 'Thermal Insulated Water Flask (1L) + Hydration Bottle (1L)', category: 'Trek Gear', essential: true, notes: 'Insulated flask prevents water freezing at 14,000 ft' }
    ]
  },
  {
    id: 'personal',
    name: 'Personal Warmth & Hygiene',
    iconName: 'Shield',
    description: 'Extreme cold protection for extremities and sustainable mountain hygiene.',
    items: [
      { id: 'p1', name: 'Waterproof Insulated Ski Gloves with Inner Fleece Liners', category: 'Personal', essential: true, notes: 'Windproof shell with touchscreen fingertips' },
      { id: 'p2', name: 'Thermal Wool Balaclava & Fleece Beanie', category: 'Personal', essential: true, notes: 'Covers neck, ears, and head from biting wind' },
      { id: 'p3', name: 'Wide-Brim Sun Hat / UPF Cap', category: 'Personal', essential: true, notes: 'Shields face and neck during meadow trekking' },
      { id: 'p4', name: 'High-SPF 50+ Sunscreen & Zinc Oxide Lip Balm', category: 'Personal', essential: true, notes: 'Himalayan altitude intensifies UV rays by 30%' },
      { id: 'p5', name: 'Biodegradable Wet Wipes & Toilet Paper Roll', category: 'Personal', essential: true, notes: 'Leave No Trace standard: pack-it-out trash bag included' },
      { id: 'p6', name: 'Quick-Dry Microfiber Towel', category: 'Personal', essential: true, notes: 'Compact and ultra-absorbent' }
    ]
  },
  {
    id: 'health',
    name: 'Health & First Aid',
    iconName: 'HeartPulse',
    description: 'Personal medication kit supplementary to Pravaah\'s expedition medical chest.',
    items: [
      { id: 'h1', name: 'Personal Prescription Medications with Medical Doctor Note', category: 'Health', essential: true, notes: 'Carry sufficient supply for 10 days' },
      { id: 'h2', name: 'Acetazolamide (Diamox) for Altitude Acclimatization', category: 'Health', essential: true, notes: 'Consult your physician prior to trip' },
      { id: 'h3', name: 'Electrolyte Powder Sachets (ORS / Enerzal - 10 packets)', category: 'Health', essential: true, notes: 'Drink 1 packet daily to maintain mineral balance' },
      { id: 'h4', name: 'Blister Relief Kit (Compeed, Zinc Oxide Tape, Bandages)', category: 'Health', essential: true, notes: 'Apply tape immediately at the first hot spot' },
      { id: 'h5', name: 'Pain Relief (Ibuprofen / Paracetamol)', category: 'Health', essential: true, notes: 'For exertion-induced muscle soreness' }
    ]
  },
  {
    id: 'documents',
    name: 'Documents & Verification',
    iconName: 'FileCheck',
    description: 'Forest department permits and local administration check-in papers.',
    items: [
      { id: 'd1', name: 'Original Government Photo ID (Aadhaar / Passport / Voter Card)', category: 'Documents', essential: true, notes: 'Required for forest checkposts' },
      { id: 'd2', name: 'Medical Fitness Certificate signed by a Registered MBBS Doctor', category: 'Documents', essential: true, notes: 'Format provided upon expedition confirmation' },
      { id: 'd3', name: 'Signed Expedition Risk & Indemnity Declaration Form', category: 'Documents', essential: true, notes: 'Pravaah standard protocol' },
      { id: 'd4', name: 'Passport Size Photographs (4 copies)', category: 'Documents', essential: true, notes: 'For local forest administration permits' }
    ]
  },
  {
    id: 'electronics',
    name: 'Power & Electronics',
    iconName: 'Zap',
    description: 'Sub-zero temperatures drain lithium-ion batteries rapidly.',
    items: [
      { id: 'e1', name: 'High-Capacity Power Bank (20,000mAh with Fast Charge)', category: 'Electronics', essential: true, notes: 'Keep wrapped inside a wool sock inside your sleeping bag' },
      { id: 'e2', name: 'Camera with Extra Batteries & Insulated Pouch', category: 'Electronics', essential: false, notes: 'Cold reduces battery capacity by up to 50%' },
      { id: 'e3', name: 'Universal Waterproof Dry Bags for Electronics', category: 'Electronics', essential: true, notes: 'Keeps phones and power banks dry in any weather' }
    ]
  }
];

export const INCLUSIONS: InclusionItem[] = [
  {
    title: 'Expedition Accommodation',
    description: '7 nights accommodation: Premium guest lodges in Lohajung/Didna and heavy-duty 4-season high-altitude mountain tents during camping days (twin/triple share with sub-zero sleeping mats).'
  },
  {
    title: 'All High-Nutrition Meals',
    description: 'Freshly prepared, balanced, energy-dense vegetarian and egg meals designed by nutritionists for high altitude (Breakfast, packed trail lunch/hot lunch, evening appetizers & tea, 3-course dinner).'
  },
  {
    title: 'Certified Himalayan Mountain Leadership',
    description: 'Experienced, certified Trek Leaders (NIM / HMI Advanced Mountaineering graduates) backed by seasoned local Garhwali mountain guides with Wilderness First Aid (WAFA) credentials.'
  },
  {
    title: 'Expedition Logistics & Safety Infrastructure',
    description: 'Complete camping equipment (tents, sub-zero down sleeping bags tested to -15°C, fleece liners, toilet tents, dining marquee), kitchen crew, porters, and mules for logistical gear.'
  },
  {
    title: 'Comprehensive High-Altitude Medical Support',
    description: 'Expedition medical kit, daily twice-a-day pulse oximeter & blood pressure logs, emergency portable medical oxygen cylinders, and stretcher mobilization capability.'
  },
  {
    title: 'Forest & Eco-Permits',
    description: 'All mandatory Uttarakhand Forest Department entry permits, national park camping royalties, and trail environmental clearance fees.'
  },
  {
    title: 'Scheduled Ground Transportation',
    description: 'Dedicated private mountain vehicles (Tempo Traveller / Bolero) for transfers between Rishikesh and Lohajung (both ways).'
  },
  {
    title: 'Pre-Expedition Training & Briefing',
    description: 'Personalized 8-week cardio & strength conditioning schedule, live video briefing with expedition directors, and complete gear audit.'
  }
];

export const EXCLUSIONS: ExclusionItem[] = [
  {
    title: 'Transit to Rishikesh',
    description: 'Travel from your home city to Rishikesh and back (flights, train tickets, or inter-city road travel).'
  },
  {
    title: 'Personal Porterage (Offloading)',
    description: 'Offloading of personal rucksack (available as an optional add-on with advance booking for ₹3,500 for the entire trek up to 10kg).'
  },
  {
    title: 'Personal Trekking Gear',
    description: 'Personal boots, jackets, trekking poles, and backpack (rental gear available on prior reservation from Pravaah base).'
  },
  {
    title: 'Emergency Medical Evacuation',
    description: 'Helicopter evacuation, hospital admission costs, or medical treatment beyond field first aid (mandatory adventure insurance required).'
  },
  {
    title: 'Travel & Trekking Insurance',
    description: 'Personal travel insurance covering high-altitude hiking up to 5,000 meters (Pravaah assists with curated adventure policy options).'
  },
  {
    title: 'Personal Snacks & Discretionary Expenses',
    description: 'Personal packaged snacks, soft drinks, bottled mineral water, tipping for local crew, and any items of personal nature.'
  },
  {
    title: 'Force Majeure Delays',
    description: 'Additional hotel or transport costs incurred due to road blockages, extreme weather, landslides, or early itinerary exits.'
  }
];

export const SAFETY_RULES: SafetyRule[] = [
  {
    title: 'Scientific Acclimatization Matrix',
    summary: 'Calculated ascent rate with built-in height thresholds to allow the body natural adaptation.',
    detail: 'Our 8-day itinerary builds elevation progressively: Day 1 (7,600 ft), Day 3 (11,320 ft), Day 4 (12,820 ft), Day 5 (14,120 ft) before the summit push at ~15,750 ft. We follow the golden mountaineering principle: "Climb high, sleep low."',
    icon: 'Activity'
  },
  {
    title: 'Twice-Daily Medical Telemetry',
    summary: 'Non-invasive biometric monitoring at dawn and dusk for every team member.',
    detail: 'Our leaders record your Blood Oxygen Saturation (SpO2), Resting Heart Rate, and Lake Louise AMS score twice daily. Trends are analyzed to detect early onset of acute mountain sickness hours before symptoms become acute.',
    icon: 'HeartPulse'
  },
  {
    title: 'Certified Mountain Guides & 1:6 Leader Ratio',
    summary: 'High leader-to-trekker ratio ensuring close supervision on tricky terrain.',
    detail: 'Every expedition is steered by certified leaders trained at India\'s premier mountaineering institutes (NIM/HMI/ABVIMAS) with WAFA (Wilderness Advanced First Aid) credentials, supported by local Garhwali guides who grew up on these ridges.',
    icon: 'ShieldCheck'
  },
  {
    title: 'Strict Turn-Around Time (TAT) Policy',
    summary: 'Non-negotiable 9:00 AM summit cut-off ensuring daylight descent safety.',
    detail: 'Weather at 15,000+ feet deteriorates rapidly after mid-day. Our strict 9:00 AM turnaround time at Roopkund guarantees the entire team descends safely through the snow gullies well before afternoon cloud and wind pick up.',
    icon: 'Clock'
  },
  {
    title: 'Oxygen & Emergency Field Protocols',
    summary: 'Full medical oxygen cylinders and evacuation mobilization protocols.',
    detail: 'High-altitude camps are equipped with portable oxygen cylinders, specialized high-altitude medical kits, hyperbaric treatment protocols, and established communication links with the local administration for emergency mule or helicopter evacuation.',
    icon: 'Flame'
  },
  {
    title: 'Leave No Trace & Environmental Stewardship',
    summary: 'Zero-waste footprint protecting the fragile Himalayan meadows and water bodies.',
    detail: 'We adhere strictly to Leave No Trace principles. All non-biodegradable waste is sorted and packed back to the plains. We strictly prohibit walking on delicate non-trail bugyal patches or littering the sacred lake basin.',
    icon: 'Leaf'
  }
];

export const WHO_IS_THIS_FOR: WhoIsThisForCriterion[] = [
  {
    category: 'ideal',
    title: 'Physically Active & Prepared Travellers',
    description: 'Individuals with good cardiovascular endurance who can comfortably jog 5km in under 35 minutes or perform regular strength and aerobic training.'
  },
  {
    category: 'ideal',
    title: 'Adventure Seekers with Mountain Humility',
    description: 'Trekkers eager to experience raw Himalayan wilderness, dramatic weather changes, high-altitude camping, and authentic Garhwali culture.'
  },
  {
    category: 'ideal',
    title: 'Curious Explorers & Photography Enthusiasts',
    description: 'Those fascinated by the archaeological mystery of Roopkund, astrophotography, dramatic mountain light, and the boundless alpine bugyals.'
  },
  {
    category: 'ideal',
    title: 'Graduating Trekkers Ready for 15,000+ FT',
    description: 'Trekkers who have completed moderate trails (like Kedarkantha, Brahmatal, or Har Ki Dun) and are ready to step into high-altitude terrain.'
  },
  {
    category: 'notIdeal',
    title: 'Those Seeking a Relaxed Sightseeing Resort Holiday',
    description: 'Roopkund is an authentic alpine expedition involving steep climbs, freezing night temperatures, basic dry toilet tents, and zero luxury amenities.'
  },
  {
    category: 'notIdeal',
    title: 'Individuals with Severe Untreated Respiratory/Cardiac Ailments',
    description: 'Conditions such as severe asthma, heart disease, or uncontrolled hypertension require formal written clearance from a cardiologist/pulmonologist.'
  },
  {
    category: 'notIdeal',
    title: 'Travellers Unwilling to Prepare Physically in Advance',
    description: 'Attempting a 15,750 ft trek without prior cardiovascular conditioning increases the risk of exhaustion and acute mountain sickness.'
  },
  {
    category: 'notIdeal',
    title: 'People Unwilling to Adhere to Expedition Safety Rules',
    description: 'Mountain safety requires strict adherence to leader directives, turnaround times, hydration benchmarks, and trail discipline.'
  }
];

export const BRAND_DIFFERENTIATORS: BrandDifferentiator[] = [
  {
    title: 'CURATED HIMALAYAN ROUTES',
    headline: 'Designed for the Journey, Not Just the Checkpoint',
    description: 'We do not rush through the mountains to check off a destination. Our itineraries are engineered with generous acclimatization margins, slower pacing across the Bugyals, and quiet camp locations away from crowded commercial clusters.',
    keyAspect: 'Paced Acclimatization & Serene Camping',
    icon: 'Compass'
  },
  {
    title: 'AUTHENTIC GARHWAL GROUND NETWORK',
    headline: 'Rooted Deeply in Uttarakhand Mountains',
    description: 'Our ground teams, cook staff, muleteers, and trail scouts are born and raised in the Wan, Didna, and Lohajung valleys. They possess generations of intimate weather knowledge, local folklore, and sacred reverence for Nanda Devi.',
    keyAspect: '100% Native Local Expertise',
    icon: 'MapPin'
  },
  {
    title: 'SMALL-GROUP EXPEDITIONS (MAX 12-14)',
    headline: 'Intimate, Controlled, and Immersive',
    description: 'While mass-market operators herd 30 to 40 people per batch, Pravaah strictly caps teams at 12–14 trekkers. This ensures personalized leader attention, superior safety monitoring, low environmental impact, and real camaraderie.',
    keyAspect: '1:6 Leader to Trekker Ratio',
    icon: 'Users'
  },
  {
    title: 'METICULOUS PRE-TRIP PREPARATION',
    headline: 'Ready Long Before You Reach the Trailhead',
    description: 'From customized 8-week physical conditioning routines to 1-on-1 gear audits and medical consultations with our expedition doctor, we prepare you thoroughly so you feel confident and empowered in the mountains.',
    keyAspect: 'Personalized Conditioning & Briefing',
    icon: 'ClipboardCheck'
  },
  {
    title: 'RESPONSIBLE & LEAVE-NO-TRACE TRAVEL',
    headline: 'Protecting the Fragile Garhwal Ecosystem',
    description: 'We tread lightly on the sacred bugyals. We implement clean solar energy at base, use eco-friendly pit toilets, eliminate single-use plastics, and conduct weekly trail clean-up drives, carrying hundreds of kilograms of commercial waste back.',
    keyAspect: 'Eco-Ethical Mountain Stewardship',
    icon: 'TreePine'
  },
  {
    title: 'DEDICATED HUMAN SUPPORT',
    headline: 'A Real Expedition Team Standing Beside You',
    description: 'No automated bots or indifferent call centers. You have direct access to our expedition leaders and operations directors before, during, and after your trek for complete peace of mind.',
    keyAspect: 'Round-the-Clock Specialist Support',
    icon: 'Headphones'
  }
];

export const TRAVELLER_REVIEWS: TravellerReview[] = [
  {
    id: 'rev-1',
    author: 'Vikramaditya Sengupta',
    location: 'Bengaluru, India',
    trip: 'Roopkund Expedition • Autumn Batch',
    rating: 5,
    date: 'October 2025',
    verified: true,
    text: 'I have done several treks across Himachal and Ladakh, but Pravaah’s execution of the Roopkund trail was on another level. The sunrise over Trishul from Bedni Bugyal will remain etched in my memory forever. The leaders knew every contour of the mountain, monitored our SpO2 like clockwork, and made sure our small group of 11 felt like family. This is how high-altitude mountaineering should be done.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 'rev-2',
    author: 'Ananya Deshmukh',
    location: 'Pune, India',
    trip: 'Roopkund Expedition • Summer Batch',
    rating: 5,
    date: 'June 2025',
    verified: true,
    text: 'Standing at the threshold of Roopkund lake at dawn with Mt. Trishul towering right above us is an experience that words cannot capture. The archaeological narrative shared by our Garhwali guide Kundan Singh gave goosebumps to everyone. Pravaah’s small-batch format made a massive difference — delicious hot meals at 14,000 ft, zero chaos, and impeccable safety standards.',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 'rev-3',
    author: 'Dr. Siddharth Mehrotra',
    location: 'New Delhi, India',
    trip: 'Roopkund Expedition • Autumn Batch',
    rating: 5,
    date: 'September 2025',
    verified: true,
    text: 'As a physician, I paid close attention to how Pravaah handled altitude acclimatization and emergency readiness. Their conservative pacing between Ali Bugyal and Bhagwabasa was textbook precision. Not a single person in our batch suffered acute mountain sickness. The respect they show for the mountain culture and fragile bugyals earned my deepest respect.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 'rev-4',
    author: 'Rohan & Maya Kapur',
    location: 'Mumbai, India',
    trip: 'Roopkund Expedition • Spring Batch',
    rating: 5,
    date: 'May 2025',
    verified: true,
    text: 'Ali Bugyal was like stepping into an oil painting that stretched forever. We were nervous about the 3:30 AM summit climb from Bhagwabasa, but our trek leader Rohan was calmly guiding our foot placement step-by-step through the snow. Returning to Lohajung with the certificate and lifelong memories was the highlight of our year.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop'
  }
];

export const EXPERIENCE_HIGHLIGHTS: ExperienceHighlight[] = [
  {
    id: 'exp-1',
    title: 'Walk Through Ancient Oak & Rhododendron Forests',
    category: 'Primeval Woodland',
    description: 'Centuries-old brown oak, moss-draped conifers, and flaming red rhododendron blossoms canopy the climb from the roaring Neel Ganga river up to Didna.',
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1200&auto=format&fit=crop',
    tag: 'Forest Sanctuary'
  },
  {
    id: 'exp-2',
    title: 'Cross the Legendary Himalayan Bugyals',
    category: 'Alpine Velvet Meadows',
    description: 'Traverse Ali Bugyal and Bedni Bugyal — among Asia\'s highest and most expansive undulating alpine grasslands, stretching endlessly above 11,000 feet.',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop',
    tag: 'Boundless Horizons'
  },
  {
    id: 'exp-3',
    title: 'Watch Sunrise Illuminate Mt. Trishul',
    category: 'Himalayan Alpenglow',
    description: 'Watch the first golden rays of dawn strike the sheer 7,120m ice face of Mt. Trishul and Nanda Ghunti, casting crystalline reflections into Bedni Kund.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Mount_Trishul.jpg',
    tag: 'First Light'
  },
  {
    id: 'exp-4',
    title: 'Experience the Dramatic Changing Mountain Terrain',
    category: 'Ecological Zones',
    description: 'Witness an entire geographical continuum unfold across the expedition: rushing river gorges, dense oak woods, velvet bugyals, rocky moonscapes, and frozen glacial cirques.',
    image: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?q=80&w=1200&auto=format&fit=crop',
    tag: 'Ecological Marvel'
  },
  {
    id: 'exp-5',
    title: 'Explore the Roopkund Archaeological Mystery',
    category: 'Historical Riddle',
    description: 'Stand at the edge of the ancient high tarn where hundreds of 9th-century skeletons and artifacts were preserved beneath glacial ice, baffling science for decades.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/0/03/Human_Skeletons_in_Roopkund_Lake.jpg',
    tag: 'Living History'
  },
  {
    id: 'exp-6',
    title: 'High-Altitude Wilderness Camping',
    category: 'Alpine Living',
    description: 'Sleep beneath a brilliant carpet of the Milky Way at 12,800 feet in robust 4-season alpine tents, listening to mountain breezes in complete silence.',
    image: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?q=80&w=1200&auto=format&fit=crop',
    tag: 'Zero Light Pollution'
  },
  {
    id: 'exp-7',
    title: 'Walk Dramatic Mountain Ridge Lines',
    category: 'Panoramic Traverses',
    description: 'Trek along narrow, sweeping high ridges between Bedni and Patar Nachauni with panoramic 360-degree vistas of the Greater Garhwal range.',
    image: 'https://images.unsplash.com/photo-1545652985-5edd365b12eb?q=80&w=1200&auto=format&fit=crop',
    tag: 'Skyline Traverse'
  },
  {
    id: 'exp-8',
    title: 'Spend Time in Traditional Himalayan Villages',
    category: 'Living Heritage',
    description: 'Immerse in the timeless rhythms of Didna and Wan villages — carved wooden doorways, slate roofs, terraced barley fields, and sacred village deities.',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop',
    tag: 'Garhwali Culture'
  }
];

export const MYSTERY_FACTS = [
  {
    year: '1942',
    title: 'The Accidental Discovery',
    detail: 'During World War II, a Nanda Devi game reserve ranger named H.K. Madhwal stumbled upon hundreds of human bones emerging from the melting ice of Roopkund tarn at 15,750 ft.'
  },
  {
    year: '1950s – 1960s',
    title: 'The Sudden Hailstorm Hypothesis',
    detail: 'Anthropological analyses revealed unhealed compression fractures on skulls caused by cricket-ball-sized hail, giving weight to local folklore of Goddess Nanda Devi’s wrath upon an arrogant king.'
  },
  {
    year: '2019',
    title: 'The Modern Genomic Revelation',
    detail: 'A landmark international Nature Communications DNA study revealed that the remains belong to multiple distinct groups spanning a millennium — including 9th-century South Asian pilgrims and a mysterious 1800s group with eastern Mediterranean genetics.'
  },
  {
    year: 'Present Day',
    title: 'An Unfinished Chapter in Human History',
    detail: 'Why diverse groups journeyed to this remote, inhospitable high-altitude glacial basin across centuries remains one of the Himalayas’ most evocative and unsolved archaeological mysteries.'
  }
];
