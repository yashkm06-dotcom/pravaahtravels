/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * The Gemini export's data structure and visual slot counts are preserved here.
 * Unsupported route, medical, legal, permit, certification, availability and
 * operational claims are intentionally neutral until Pravaah verifies them.
 */

import type {
  BrandDifferentiator,
  ElevationPoint,
  ExclusionItem,
  ExpeditionPackage,
  ExperienceHighlight,
  InclusionItem,
  ItineraryDay,
  PackingCategory,
  SafetyRule,
  TrailLocation,
  WhoIsThisForCriterion,
} from '../types';

const TO_BE_CONFIRMED = 'To be confirmed by Pravaah Travels';
const SUBJECT_TO_CONFIRMATION = 'Subject to final expedition confirmation';

export const ROOPKUND_PACKAGE: ExpeditionPackage = {
  title: 'ROOPKUND TREK',
  slug: 'roopkund-trek',
  subtitle: 'The Mystery Trail',
  tagline: 'A visual expedition preview while factual operating details are reviewed.',
  region: TO_BE_CONFIRMED,
  state: 'Uttarakhand',
  country: 'India',
  duration: TO_BE_CONFIRMED,
  durationDays: 0,
  difficulty: TO_BE_CONFIRMED,
  maxAltitudeFeet: 0,
  maxAltitudeMeters: 0,
  totalDistanceKm: 0,
  bestSeason: SUBJECT_TO_CONFIRMATION,
  startingPoint: TO_BE_CONFIRMED,
  endingPoint: TO_BE_CONFIRMED,
  heroImage: '/images/roopkund/hero-roopkund-mystery-lake.jpg',
  description: 'The final route, duration, distance, altitude, dates and operating plan are under factual review.',
};

export const TRAIL_LOCATIONS: TrailLocation[] = [
  {
    id: 'rishikesh', name: 'Expedition Gateway', localName: TO_BE_CONFIRMED, dayNumber: 1,
    altitudeFeet: 0, altitudeMeters: 0, distanceFromStartKm: 0,
    terrain: TO_BE_CONFIRMED, coordinates: { lat: 0, lng: 0, elevationZ: 0.1 },
    shortDescription: 'The confirmed expedition gateway will be published after route review.',
    detailedDescription: 'Transfer details, meeting point and departure plan remain subject to final expedition confirmation.',
    highlight: SUBJECT_TO_CONFIRMATION, image: '/images/roopkund/rishikesh-valley.jpg', stayType: TO_BE_CONFIRMED,
  },
  {
    id: 'lohajung-wan', name: 'Base Stage', localName: TO_BE_CONFIRMED, dayNumber: 1,
    altitudeFeet: 0, altitudeMeters: 0, distanceFromStartKm: 0,
    terrain: TO_BE_CONFIRMED, coordinates: { lat: 0, lng: 0, elevationZ: 0.8 },
    shortDescription: 'The base-stage location and briefing plan are under review.',
    detailedDescription: 'Accommodation, briefing, gear-check and operating arrangements will be confirmed in writing by Pravaah Travels.',
    highlight: SUBJECT_TO_CONFIRMATION, image: '/images/roopkund/lohajung-village.jpg', stayType: TO_BE_CONFIRMED,
  },
  {
    id: 'wan', name: 'Trailhead Stage', localName: TO_BE_CONFIRMED, dayNumber: 2,
    altitudeFeet: 0, altitudeMeters: 0, distanceFromStartKm: 0,
    terrain: TO_BE_CONFIRMED, coordinates: { lat: 0, lng: 0, elevationZ: 0.9 },
    shortDescription: 'The confirmed trailhead and access plan are under review.',
    detailedDescription: 'Current trail access, transfers and route sequence will be published only after verification.',
    highlight: SUBJECT_TO_CONFIRMATION, image: '/images/roopkund/wan-forest.jpg', stayType: TO_BE_CONFIRMED,
  },
  {
    id: 'ghairoli-patal', name: 'Forest Stage', localName: TO_BE_CONFIRMED, dayNumber: 2,
    altitudeFeet: 0, altitudeMeters: 0, distanceFromStartKm: 0,
    terrain: TO_BE_CONFIRMED, coordinates: { lat: 0, lng: 0, elevationZ: 1.8 },
    shortDescription: 'Forest-stage route information remains to be confirmed.',
    detailedDescription: 'Distance, walking time, terrain, camp and seasonal conditions are under factual review.',
    highlight: SUBJECT_TO_CONFIRMATION, image: '/images/roopkund/ghairoli-forest.jpg', stayType: TO_BE_CONFIRMED,
  },
  {
    id: 'ali-bugyal', name: 'Meadow Stage', localName: TO_BE_CONFIRMED, dayNumber: 3,
    altitudeFeet: 0, altitudeMeters: 0, distanceFromStartKm: 0,
    terrain: TO_BE_CONFIRMED, coordinates: { lat: 0, lng: 0, elevationZ: 2.3 },
    shortDescription: 'The meadow-stage route and access details are under review.',
    detailedDescription: 'Place names, access, distance, altitude and camp arrangements will be confirmed by Pravaah Travels.',
    highlight: SUBJECT_TO_CONFIRMATION, image: '/images/roopkund/ali-bugyal.jpg', stayType: TO_BE_CONFIRMED,
  },
  {
    id: 'patar-nauchni', name: 'High Ridge Stage', localName: TO_BE_CONFIRMED, dayNumber: 3,
    altitudeFeet: 0, altitudeMeters: 0, distanceFromStartKm: 0,
    terrain: TO_BE_CONFIRMED, coordinates: { lat: 0, lng: 0, elevationZ: 3.4 },
    shortDescription: 'High-ridge route details are awaiting factual confirmation.',
    detailedDescription: 'Terrain, weather exposure, timing and camp information are subject to final expedition confirmation.',
    highlight: SUBJECT_TO_CONFIRMATION, image: '/images/roopkund/patar-nauchni.jpg', stayType: TO_BE_CONFIRMED,
  },
  {
    id: 'bhagwabasa', name: 'Upper Trail Stage', localName: TO_BE_CONFIRMED, dayNumber: 4,
    altitudeFeet: 0, altitudeMeters: 0, distanceFromStartKm: 0,
    terrain: TO_BE_CONFIRMED, coordinates: { lat: 0, lng: 0, elevationZ: 4.5 },
    shortDescription: 'The upper-trail stage is included as an editorial preview only.',
    detailedDescription: 'Access, altitude, distance, camp, equipment and safety arrangements are all under review.',
    highlight: SUBJECT_TO_CONFIRMATION, image: '/images/roopkund/bhagwabasa.jpg', stayType: TO_BE_CONFIRMED,
  },
  {
    id: 'roopkund', name: 'Roopkund Objective', localName: 'The Mystery Trail', dayNumber: 5,
    altitudeFeet: 0, altitudeMeters: 0, distanceFromStartKm: 0,
    terrain: TO_BE_CONFIRMED, coordinates: { lat: 0, lng: 0, elevationZ: 5 },
    shortDescription: 'Current access and the final objective are subject to verification.',
    detailedDescription: 'No summit, lake-edge, snow, permit or access claim is made until Pravaah confirms the operating plan.',
    highlight: SUBJECT_TO_CONFIRMATION, image: '/images/roopkund/mystery-skeletons.jpg', stayType: TO_BE_CONFIRMED,
  },
  {
    id: 'bedni-bugyal', name: 'Return Landscape', localName: TO_BE_CONFIRMED, dayNumber: 6,
    altitudeFeet: 0, altitudeMeters: 0, distanceFromStartKm: 0,
    terrain: TO_BE_CONFIRMED, coordinates: { lat: 0, lng: 0, elevationZ: 2.7 },
    shortDescription: 'The return route and landscape sequence are under review.',
    detailedDescription: 'The final descent, visits, distance, timing and stay plan will be confirmed in the approved itinerary.',
    highlight: SUBJECT_TO_CONFIRMATION, image: '/images/roopkund/bedni-bugyal.jpg', stayType: TO_BE_CONFIRMED,
  },
];

const itineraryChapter = (
  dayNumber: number,
  image: string,
  locationId: string,
): ItineraryDay => ({
  dayNumber,
  title: `ROUTE CHAPTER ${String(dayNumber).padStart(2, '0')} — TO BE CONFIRMED`,
  route: TO_BE_CONFIRMED,
  startPoint: TO_BE_CONFIRMED,
  endPoint: TO_BE_CONFIRMED,
  distanceKm: TO_BE_CONFIRMED,
  trekkingTime: TO_BE_CONFIRMED,
  altitudeStartFeet: 0,
  altitudeEndFeet: 0,
  altitudeGainLossFeet: TO_BE_CONFIRMED,
  terrain: TO_BE_CONFIRMED,
  stay: TO_BE_CONFIRMED,
  meals: TO_BE_CONFIRMED,
  description: 'This journal card preserves the approved visual narrative. The final day-wise route, distance, time, altitude, stay, meals and operating sequence are still under factual review.',
  highlights: [
    'Route details to be confirmed',
    'Stage timing to be confirmed',
    'Support arrangements to be confirmed',
  ],
  image,
  locationId,
  altitudeNote: SUBJECT_TO_CONFIRMATION,
});

export const ITINERARY_DAYS: ItineraryDay[] = [
  itineraryChapter(1, '/images/roopkund/rishikesh-valley.jpg', 'lohajung-wan'),
  itineraryChapter(2, '/images/roopkund/ghairoli-forest.jpg', 'ghairoli-patal'),
  itineraryChapter(3, '/images/roopkund/ali-bugyal.jpg', 'patar-nauchni'),
  itineraryChapter(4, '/images/roopkund/bhagwabasa.jpg', 'bhagwabasa'),
  itineraryChapter(5, '/images/roopkund/mystery-skeletons.jpg', 'roopkund'),
  itineraryChapter(6, '/images/roopkund/bedni-bugyal.jpg', 'bedni-bugyal'),
  itineraryChapter(7, '/images/roopkund/return-valley.jpg', 'rishikesh'),
];

// Normalized, plot-only values retain the Gemini chart silhouette without
// embedding or publishing unverified altitude, distance, or duration claims.
export const ELEVATION_PROFILE_DATA: ElevationPoint[] = [
  { id: '1', name: 'Stage 01', day: 1, altitudeFeet: 6.588235, distanceKm: 0, zone: TO_BE_CONFIRMED },
  { id: '2', name: 'Stage 02', day: 2, altitudeFeet: 45.882353, distanceKm: 1, zone: TO_BE_CONFIRMED },
  { id: '3', name: 'Stage 03', day: 3, altitudeFeet: 45.882353, distanceKm: 2, zone: TO_BE_CONFIRMED },
  { id: '4', name: 'Stage 04', day: 4, altitudeFeet: 58.823529, distanceKm: 3, zone: TO_BE_CONFIRMED },
  { id: '5', name: 'Stage 05', day: 5, altitudeFeet: 66.588235, distanceKm: 4, zone: TO_BE_CONFIRMED },
  { id: '6', name: 'Stage 06', day: 6, altitudeFeet: 75.411765, distanceKm: 5, zone: TO_BE_CONFIRMED },
  { id: '7', name: 'Stage 07', day: 7, altitudeFeet: 83.058824, distanceKm: 6, zone: TO_BE_CONFIRMED },
  { id: '8', name: 'Objective', day: 8, altitudeFeet: 92.647059, distanceKm: 7, zone: TO_BE_CONFIRMED, isPeak: true },
  { id: '9', name: 'Stage 09', day: 9, altitudeFeet: 83.058824, distanceKm: 8, zone: TO_BE_CONFIRMED },
  { id: '10', name: 'Stage 10', day: 10, altitudeFeet: 67.882353, distanceKm: 9, zone: TO_BE_CONFIRMED },
  { id: '11', name: 'Stage 11', day: 11, altitudeFeet: 45.882353, distanceKm: 10, zone: TO_BE_CONFIRMED },
  { id: '12', name: 'Stage 12', day: 12, altitudeFeet: 6.588235, distanceKm: 11, zone: TO_BE_CONFIRMED },
];

export const PACKING_CATEGORIES: PackingCategory[] = [
  {
    id: 'clothing', name: 'Clothing & Layering', iconName: 'Shirt',
    description: 'The final clothing checklist will be confirmed for the approved operating plan.',
    items: [
      { id: 'c1', name: 'Outer weather layer — details to be confirmed', category: 'Clothing', essential: false, notes: SUBJECT_TO_CONFIRMATION },
      { id: 'c2', name: 'Insulation layer — details to be confirmed', category: 'Clothing', essential: false, notes: SUBJECT_TO_CONFIRMATION },
      { id: 'c3', name: 'Mid layer — details to be confirmed', category: 'Clothing', essential: false, notes: SUBJECT_TO_CONFIRMATION },
      { id: 'c4', name: 'Base layers — details to be confirmed', category: 'Clothing', essential: false, notes: SUBJECT_TO_CONFIRMATION },
      { id: 'c5', name: 'Trekking tops — details to be confirmed', category: 'Clothing', essential: false, notes: SUBJECT_TO_CONFIRMATION },
      { id: 'c6', name: 'Trekking trousers — details to be confirmed', category: 'Clothing', essential: false, notes: SUBJECT_TO_CONFIRMATION },
      { id: 'c7', name: 'Rain protection — details to be confirmed', category: 'Clothing', essential: false, notes: SUBJECT_TO_CONFIRMATION },
    ],
  },
  {
    id: 'footwear', name: 'Footwear & Socks', iconName: 'Footprints',
    description: 'Footwear specifications remain subject to route and season confirmation.',
    items: [
      { id: 'f1', name: 'Trekking footwear — details to be confirmed', category: 'Footwear', essential: false, notes: SUBJECT_TO_CONFIRMATION },
      { id: 'f2', name: 'Trekking socks — details to be confirmed', category: 'Footwear', essential: false, notes: SUBJECT_TO_CONFIRMATION },
      { id: 'f3', name: 'Camp footwear — details to be confirmed', category: 'Footwear', essential: false, notes: SUBJECT_TO_CONFIRMATION },
      { id: 'f4', name: 'Additional protection — details to be confirmed', category: 'Footwear', essential: false, notes: SUBJECT_TO_CONFIRMATION },
    ],
  },
  {
    id: 'trek-gear', name: 'Trek Gear & Hardware', iconName: 'Compass',
    description: 'Hardware requirements will be confirmed against the final itinerary.',
    items: [
      { id: 't1', name: 'Main backpack — capacity to be confirmed', category: 'Trek Gear', essential: false, notes: SUBJECT_TO_CONFIRMATION },
      { id: 't2', name: 'Daypack — details to be confirmed', category: 'Trek Gear', essential: false, notes: SUBJECT_TO_CONFIRMATION },
      { id: 't3', name: 'Trekking poles — details to be confirmed', category: 'Trek Gear', essential: false, notes: SUBJECT_TO_CONFIRMATION },
      { id: 't4', name: 'Headlamp — specification to be confirmed', category: 'Trek Gear', essential: false, notes: SUBJECT_TO_CONFIRMATION },
      { id: 't5', name: 'Eye protection — details to be confirmed', category: 'Trek Gear', essential: false, notes: SUBJECT_TO_CONFIRMATION },
      { id: 't6', name: 'Water containers — details to be confirmed', category: 'Trek Gear', essential: false, notes: SUBJECT_TO_CONFIRMATION },
    ],
  },
  {
    id: 'personal', name: 'Personal Warmth & Hygiene', iconName: 'Shield',
    description: 'Personal equipment will be confirmed when season and conditions are verified.',
    items: [
      { id: 'p1', name: 'Hand protection — details to be confirmed', category: 'Personal', essential: false, notes: SUBJECT_TO_CONFIRMATION },
      { id: 'p2', name: 'Head and neck protection — details to be confirmed', category: 'Personal', essential: false, notes: SUBJECT_TO_CONFIRMATION },
      { id: 'p3', name: 'Sun hat — details to be confirmed', category: 'Personal', essential: false, notes: SUBJECT_TO_CONFIRMATION },
      { id: 'p4', name: 'Sun care — discuss with a qualified professional', category: 'Personal', essential: false, notes: SUBJECT_TO_CONFIRMATION },
      { id: 'p5', name: 'Personal hygiene supplies — details to be confirmed', category: 'Personal', essential: false, notes: SUBJECT_TO_CONFIRMATION },
      { id: 'p6', name: 'Travel towel — details to be confirmed', category: 'Personal', essential: false, notes: SUBJECT_TO_CONFIRMATION },
    ],
  },
  {
    id: 'health', name: 'Health & First Aid', iconName: 'HeartPulse',
    description: 'No medical guidance is provided here. Discuss personal health needs with a qualified clinician.',
    items: [
      { id: 'h1', name: 'Personal prescriptions — follow your clinician’s advice', category: 'Health', essential: false, notes: 'Do not start or change medication based on this page.' },
      { id: 'h2', name: 'Altitude medication — consult a qualified clinician', category: 'Health', essential: false, notes: 'No medicine or dosage is recommended here.' },
      { id: 'h3', name: 'Hydration supplies — details to be confirmed', category: 'Health', essential: false, notes: 'Individual needs vary.' },
      { id: 'h4', name: 'Personal first-aid supplies — details to be confirmed', category: 'Health', essential: false, notes: SUBJECT_TO_CONFIRMATION },
      { id: 'h5', name: 'Pain medication — consult a qualified clinician', category: 'Health', essential: false, notes: 'No medicine or dosage is recommended here.' },
    ],
  },
  {
    id: 'documents', name: 'Documents & Verification', iconName: 'FileCheck',
    description: 'Permit, identity, insurance and form requirements remain to be confirmed.',
    items: [
      { id: 'd1', name: 'Identity document requirements — to be confirmed', category: 'Documents', essential: false, notes: SUBJECT_TO_CONFIRMATION },
      { id: 'd2', name: 'Health documentation — to be confirmed', category: 'Documents', essential: false, notes: SUBJECT_TO_CONFIRMATION },
      { id: 'd3', name: 'Participant forms — to be confirmed', category: 'Documents', essential: false, notes: SUBJECT_TO_CONFIRMATION },
      { id: 'd4', name: 'Additional permit materials — to be confirmed', category: 'Documents', essential: false, notes: SUBJECT_TO_CONFIRMATION },
    ],
  },
  {
    id: 'electronics', name: 'Power & Electronics', iconName: 'Zap',
    description: 'Power and electronics guidance will be confirmed for the operating plan.',
    items: [
      { id: 'e1', name: 'Power bank — specification to be confirmed', category: 'Electronics', essential: false, notes: SUBJECT_TO_CONFIRMATION },
      { id: 'e2', name: 'Camera power — details to be confirmed', category: 'Electronics', essential: false, notes: SUBJECT_TO_CONFIRMATION },
      { id: 'e3', name: 'Weather protection — details to be confirmed', category: 'Electronics', essential: false, notes: SUBJECT_TO_CONFIRMATION },
    ],
  },
];

export const INCLUSIONS: InclusionItem[] = [
  { title: 'Expedition Accommodation', description: 'Accommodation details will be confirmed in the final written itinerary and quote.' },
  { title: 'Meals', description: 'Meal plan, service days and dietary arrangements are to be confirmed.' },
  { title: 'Mountain Leadership', description: 'Guide identities, qualifications and staffing arrangements are to be confirmed.' },
  { title: 'Expedition Logistics', description: 'Camping, equipment, crew and load-support arrangements are to be confirmed.' },
  { title: 'Field Support', description: 'Medical and emergency support arrangements are to be confirmed; no capability is promised on this preview.' },
  { title: 'Permits & Fees', description: 'Current permit availability, fees and legal access requirements are to be confirmed.' },
  { title: 'Ground Transportation', description: 'Transfer points, vehicle type and included sectors are to be confirmed.' },
  { title: 'Pre-Expedition Briefing', description: 'Preparation and briefing services are to be confirmed.' },
];

export const EXCLUSIONS: ExclusionItem[] = [
  { title: 'Travel To The Meeting Point', description: 'The confirmed meeting point and excluded travel sectors will appear in the final written quote.' },
  { title: 'Personal Porterage', description: 'Availability, limits and charges are to be confirmed.' },
  { title: 'Personal Trekking Gear', description: 'Required personal gear and any rental availability are to be confirmed.' },
  { title: 'Emergency & Medical Costs', description: 'Coverage, evacuation and medical-cost responsibilities are to be confirmed in writing.' },
  { title: 'Travel & Trekking Insurance', description: 'Insurance requirements and coverage levels are to be confirmed.' },
  { title: 'Personal Expenses', description: 'Personal purchases and discretionary expenses are not included unless stated in writing.' },
  { title: 'Changes & Delays', description: 'Terms for route changes, delays and additional costs are to be confirmed.' },
];

export const SAFETY_RULES: SafetyRule[] = [
  { title: 'Acclimatization Planning', summary: 'The final ascent and rest plan is under review.', detail: 'No ascent schedule, altitude threshold or medical protocol is represented as confirmed on this preview.', icon: 'Activity' },
  { title: 'Health Monitoring', summary: 'Any monitoring process is to be confirmed.', detail: 'This page does not provide SpO₂ thresholds, AMS diagnosis, treatment guidance or medical guarantees.', icon: 'HeartPulse' },
  { title: 'Mountain Team', summary: 'Staffing, qualifications and ratios are to be confirmed.', detail: 'Guide certifications, group ratios and supervision arrangements will be published only after verification.', icon: 'ShieldCheck' },
  { title: 'Route Decision Points', summary: 'Timing and turnaround decisions are to be confirmed.', detail: 'No cutoff time or safe-descent guarantee is made on this preview.', icon: 'Clock' },
  { title: 'Emergency Planning', summary: 'Emergency resources and response arrangements are to be confirmed.', detail: 'No oxygen, hyperbaric, evacuation, communication or rescue capability is promised here.', icon: 'Flame' },
  { title: 'Environmental Stewardship', summary: 'The final stewardship plan is under review.', detail: 'Specific waste, camp and conservation practices will be published after operational verification.', icon: 'Leaf' },
];

export const WHO_IS_THIS_FOR: WhoIsThisForCriterion[] = [
  { category: 'ideal', title: 'Travellers Ready To Discuss Preparation', description: 'Personal preparation expectations will be confirmed after the route and operating plan are reviewed.' },
  { category: 'ideal', title: 'Travellers Comfortable With Uncertainty', description: 'Mountain plans can change; final suitability and current conditions require a direct conversation with Pravaah.' },
  { category: 'ideal', title: 'Curious Landscape Explorers', description: 'This editorial preview is intended for travellers interested in the Roopkund story and mountain landscapes.' },
  { category: 'ideal', title: 'Travellers Seeking Current Information', description: 'Contact Pravaah for verified access, difficulty, preparation and operating details.' },
  { category: 'notIdeal', title: 'Anyone Treating This Preview As A Confirmed Booking', description: 'Dates, route, duration, price and availability are not confirmed by this page.' },
  { category: 'notIdeal', title: 'Anyone Seeking Personal Medical Advice Here', description: 'This page does not assess medical suitability. Consult an appropriately qualified clinician.' },
  { category: 'notIdeal', title: 'Anyone Unable To Complete A Pre-Trip Review', description: 'Final participation requirements and preparation steps are still to be confirmed.' },
  { category: 'notIdeal', title: 'Anyone Unwilling To Follow The Final Operating Brief', description: 'The applicable brief, rules and conditions will be shared only after they are verified.' },
];

export const BRAND_DIFFERENTIATORS: BrandDifferentiator[] = [
  { title: 'CURATED HIMALAYAN ROUTES', headline: 'The Route Is Reviewed Before It Is Promised', description: 'The final route, pacing and camp plan will be published only after current access and operating details are verified.', keyAspect: 'Current Route Review', icon: 'Compass' },
  { title: 'GROUND PARTNERS', headline: 'Local Arrangements To Be Confirmed', description: 'Ground-team identities, local partnerships and operating responsibilities are being verified before publication.', keyAspect: 'Verified Partner Details', icon: 'MapPin' },
  { title: 'GROUP FORMAT', headline: 'Group Details In The Final Plan', description: 'Batch size, staffing and guide-to-traveller ratios will be confirmed in the written expedition plan.', keyAspect: 'Written Group Confirmation', icon: 'Users' },
  { title: 'PRE-TRIP PREPARATION', headline: 'Preparation Details Before Departure', description: 'Briefing, gear review, fitness information and any health requirements will be confirmed without providing medical advice here.', keyAspect: 'Confirmed Preparation Brief', icon: 'ClipboardCheck' },
  { title: 'RESPONSIBLE TRAVEL', headline: 'Stewardship Claims Require Verification', description: 'Specific camp, waste, plastic, energy and conservation practices will be published only after operational confirmation.', keyAspect: 'Stewardship Review', icon: 'TreePine' },
  { title: 'HUMAN SUPPORT', headline: 'Speak Directly With Pravaah Travels', description: 'Use the verified contact details on this page for current information; no response-time or round-the-clock guarantee is made.', keyAspect: 'Verified Contact Channels', icon: 'Headphones' },
];

export const EXPERIENCE_HIGHLIGHTS: ExperienceHighlight[] = [
  { id: 'exp-1', title: 'Walk Through Forest Landscapes', category: 'Woodland Atmosphere', description: 'The exact forest route, ecology and seasonal conditions are to be confirmed.', image: '/images/roopkund/wan-forest.jpg', tag: 'Forest Story' },
  { id: 'exp-2', title: 'Cross Open Mountain Landscapes', category: 'Meadow Atmosphere', description: 'The final route through open landscapes and all altitude claims are to be confirmed.', image: '/images/roopkund/ali-bugyal.jpg', tag: 'Open Horizons' },
  { id: 'exp-3', title: 'Watch Mountain Light Change', category: 'Himalayan Light', description: 'Peak names, viewpoints, timing and visibility are subject to final confirmation.', image: '/images/roopkund/mount-trishul.jpg', tag: 'First Light' },
  { id: 'exp-4', title: 'Experience Changing Terrain', category: 'Landscape Transitions', description: 'Terrain sequence, access and seasonal conditions remain under factual review.', image: '/images/roopkund/patar-nauchni.jpg', tag: 'Terrain Story' },
  { id: 'exp-5', title: 'Encounter The Roopkund Mystery', category: 'Historical Context', description: 'Historical and archaeological details will be published after source verification.', image: '/images/roopkund/mystery-skeletons.jpg', tag: 'Mystery Context' },
  { id: 'exp-6', title: 'Experience Camp Atmosphere', category: 'Mountain Evenings', description: 'Camp availability, location, equipment and night-sky conditions are to be confirmed.', image: '/images/roopkund/experience-camp.jpg', tag: 'Camp Story' },
  { id: 'exp-7', title: 'Walk Mountain Ridge Landscapes', category: 'Ridge Atmosphere', description: 'Ridge access, route geometry, distance and views remain subject to confirmation.', image: '/images/roopkund/experience-ridge.jpg', tag: 'Ridge Story' },
  { id: 'exp-8', title: 'Approach Himalayan Villages', category: 'Living Landscapes', description: 'Village route, hosts, cultural details and operating relationships are to be confirmed.', image: '/images/roopkund/lohajung-village.jpg', tag: 'Village Story' },
];

export const MYSTERY_FACTS = [
  { year: 'ARCHIVE 01', title: 'Historical Detail Under Review', detail: 'Discovery dates, identities, quantities and altitude claims are being checked against reliable sources.' },
  { year: 'ARCHIVE 02', title: 'Interpretations Under Review', detail: 'Scientific and folklore explanations will not be presented as settled fact until sources are verified.' },
  { year: 'ARCHIVE 03', title: 'Research Context Under Review', detail: 'Genomic-study dates, populations and conclusions require careful source review before publication.' },
  { year: 'PRESENT', title: 'A Story Awaiting Verification', detail: 'The visual mystery narrative remains while historical claims are prepared for factual review.' },
];
