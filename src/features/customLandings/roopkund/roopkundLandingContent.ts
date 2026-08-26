/**
 * Presentation-only copy for the Roopkund custom landing page.
 * Package facts (duration, distance, altitude, price, itinerary and operations)
 * must come from Firestore and are intentionally not duplicated here.
 */
export const ROOPKUND_EDITORIAL = {
  eyebrow: 'The mystery trail',
  titleAccent: 'Walk beyond the familiar',
  introduction:
    'A cinematic expedition preview shaped around silence, changing mountain textures and the anticipation of a trail whose verified operating details are still being reviewed.',
  mysteryChapters: [
    {
      number: '01',
      title: 'A trail framed by questions',
      description:
        'The experience begins with atmosphere rather than answers: forest light, open horizons and a route that reveals itself one chapter at a time.',
    },
    {
      number: '02',
      title: 'Landscape as the narrator',
      description:
        'The custom page keeps the visual rhythm of the original concept while leaving distances, elevations and route claims to the verified package record.',
    },
    {
      number: '03',
      title: 'Prepared, never improvised',
      description:
        'Final dates, inclusions, fitness guidance and operating protocols will be published only after the expedition team completes its factual review.',
    },
  ],
  experiences: [
    { title: 'Forest light', label: 'The approach' },
    { title: 'Open horizons', label: 'The transition' },
    { title: 'Camp rhythm', label: 'The pause' },
    { title: 'Mountain textures', label: 'The memory' },
  ],
  principles: [
    {
      title: 'One verified itinerary',
      description: 'Route and day-wise information is rendered directly from the canonical Firestore package.',
    },
    {
      title: 'Clear operating details',
      description: 'Anything not yet confirmed is labelled as under review rather than presented as a promise.',
    },
    {
      title: 'A conversation before booking',
      description: 'The enquiry flow captures your dates and group details so the team can respond with current information.',
    },
  ],
} as const;

export const ROOPKUND_FACTS_AWAITING_REVIEW = [
  'Final duration and night count',
  'Total walking distance and stage distances',
  'Altitude profile and acclimatization schedule',
  'Seasonal operating windows and access conditions',
  'Medical, evacuation and emergency protocols',
  'Guide certifications, group ratios and equipment claims',
  'Permit, court, forest-department and conservation statements',
  'Any success-rate, response-time or operational guarantee',
  'Testimonials or claims of verified traveller status',
] as const;
