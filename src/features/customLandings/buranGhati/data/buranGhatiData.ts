export interface BuranImage {
  src: string;
  alt: string;
  credit?: string;
}

export interface BuranChapter {
  id: string;
  eyebrow: string;
  title: string;
  copy: string;
  image: BuranImage;
  terrain: string;
  accent: string;
}

export interface BuranItineraryDay {
  day: number;
  place: string;
  title: string;
  summary: string;
  terrain: string;
  duration: string;
  elevation: string;
  stay?: string;
  meals?: string;
  highlights?: string[];
  note?: string;
}

export const BURAN_GHATI_IMAGES = {
  hero: {
    src: '/images/buran-ghati/hero-buran-ghati.webp',
    alt: 'Trekkers crossing a high Himalayan landscape near Buran Ghati',
    credit: 'Original Pravaah Travels visual',
  },
  forest: {
    src: '/images/buran-ghati/janglik-forest.webp',
    alt: 'Pine forest trail on the Buran Ghati route',
    credit: 'Original Pravaah Travels visual',
  },
  meadow: {
    src: '/images/buran-ghati/dayara-meadow.webp',
    alt: 'Open alpine meadow beneath the Buran Ghati ridgeline',
    credit: 'Original Pravaah Travels visual',
  },
  lake: {
    src: '/images/buran-ghati/chandernahan-lake.webp',
    alt: 'A high-altitude lake on the Buran Ghati approach',
    credit: 'Original Pravaah Travels visual',
  },
  pass: {
    src: '/images/buran-ghati/pass-crossing.webp',
    alt: 'Snow-lined Buran Ghati pass crossing',
    credit: 'Original Pravaah Travels visual',
  },
  gallery: [
    {
      src: '/images/buran-ghati/hero-buran-ghati.webp',
      alt: 'Layered Himalayan valleys viewed from the Buran Ghati trail',
      credit: 'Original Pravaah Travels visual',
    },
    {
      src: '/images/buran-ghati/janglik-forest.webp',
      alt: 'Forest light along the Janglik approach',
      credit: 'Original Pravaah Travels visual',
    },
    {
      src: '/images/buran-ghati/dayara-meadow.webp',
      alt: 'Green summer meadow below the pass',
      credit: 'Original Pravaah Travels visual',
    },
    {
      src: '/images/buran-ghati/chandernahan-lake.webp',
      alt: 'Quiet alpine water and glacial terrain',
      credit: 'Original Pravaah Travels visual',
    },
    {
      src: '/images/buran-ghati/pass-crossing.webp',
      alt: 'The Buran Ghati pass in changing mountain light',
      credit: 'Original Pravaah Travels visual',
    },
  ],
} as const;

export const BURAN_CHAPTERS: BuranChapter[] = [
  {
    id: 'forest',
    eyebrow: '01 / FOREST',
    title: 'Janglik keeps the first morning quiet.',
    copy: 'The trail leaves the road behind under old deodar and pine. Expect soft earth, village edges, and a gradual rhythm before the valley opens.',
    image: BURAN_GHATI_IMAGES.forest,
    terrain: 'Pine & deodar',
    accent: 'moss',
  },
  {
    id: 'meadow',
    eyebrow: '02 / MEADOW',
    title: 'Dayara is where the horizon arrives.',
    copy: 'A long meadow bench makes space for the Pabbar Valley. Camp light, high grass, and a clean line to the ridges turn the walk into a landscape lesson.',
    image: BURAN_GHATI_IMAGES.meadow,
    terrain: 'Open bugyal',
    accent: 'sun',
  },
  {
    id: 'lake',
    eyebrow: '03 / HIGH ALTITUDE',
    title: 'Litham slows the expedition down.',
    copy: 'At the head of the valley, the air thins and the trail becomes more deliberate. This is the base for the Chandernahan excursion and pass day.',
    image: BURAN_GHATI_IMAGES.lake,
    terrain: 'Glacial basin',
    accent: 'ice',
  },
  {
    id: 'pass',
    eyebrow: '04 / THE CROSSING',
    title: 'Buran Ghati changes the language of the trail.',
    copy: 'A steep snow approach, a fixed-rope descent when conditions demand it, and the first views into Kinnaur. The reward is a passage, not a pose.',
    image: BURAN_GHATI_IMAGES.pass,
    terrain: 'Pass & snow',
    accent: 'gold',
  },
];

export const BURAN_ITINERARY: BuranItineraryDay[] = [
  {
    day: 1,
    place: 'Shimla → Janglik',
    title: 'The road to the trailhead',
    summary: 'Leave Shimla behind for the remote Pabbar Valley, winding through mountain villages, apple-growing regions and the valleys surrounding the Pabbar River before reaching Janglik.',
    terrain: 'Mountain road',
    duration: 'Approx. 147 km · 8 hours',
    elevation: 'Night: Janglik',
    stay: 'Janglik',
    meals: 'Dinner',
    highlights: ['Trek introduction and route briefing', 'Weather, gear, safety and altitude briefing'],
    note: 'The road ends here. The trail begins tomorrow.',
  },
  {
    day: 2,
    place: 'Janglik → Dayara',
    title: 'Where the forest meets the sky',
    summary: 'Climb out of Janglik through pine and oak forest, cross small streams, and emerge onto Dayara’s vast alpine meadow beneath the Himalayan ridges.',
    terrain: 'Forest → meadow',
    duration: 'Approx. 7–8 km · 5–6 hours',
    elevation: '~9,400 ft → ~11,100 ft',
    stay: 'Dayara Camp',
    meals: 'Breakfast, Lunch & Dinner',
  },
  {
    day: 3,
    place: 'Dayara → Litham',
    title: 'Into the high Himalayan valley',
    summary: 'Continue through open meadows and forest as the mountains grow larger, following the upper Pabbar Valley towards Litham and its increasingly alpine terrain.',
    terrain: 'Meadow → moraine',
    duration: 'Approx. 6 km · 3–4 hours',
    elevation: '~11,100 ft → ~11,500 ft',
    stay: 'Litham Camp',
    meals: 'Breakfast, Lunch & Dinner',
  },
  {
    day: 4,
    place: 'Litham → Chandranahan Lake → Litham',
    title: 'The hidden lake',
    summary: 'Leave the heavy backpacks at camp and climb into the Chandranahan Valley. The trail turns steeper and more rugged before reaching the high-altitude glacial lake, then descends to Litham.',
    terrain: 'Glacial basin',
    duration: 'Approx. 6–7 km return · 4–5 hours',
    elevation: '~11,500 ft → ~13,000 ft → ~11,500 ft',
    stay: 'Litham Camp',
    meals: 'Breakfast, Lunch & Dinner',
    highlights: ['Chandranahan Lake excursion', 'Acclimatisation before the pass crossing'],
    note: 'Rest, hydrate and prepare for the higher camps.',
  },
  {
    day: 5,
    place: 'Litham → Dhunda',
    title: 'The pass comes into view',
    summary: 'Climb steadily from Litham towards Dhunda as vegetation thins, the terrain turns rocky, and Buran Ghati begins to dominate the horizon.',
    terrain: 'High camp',
    duration: 'Approx. 4–5 km · 4–5 hours',
    elevation: '~11,500 ft → ~13,400 ft',
    stay: 'Dhunda Camp',
    meals: 'Breakfast, Lunch & Dinner',
    highlights: ['Weather, snow and trail assessment', 'Group fitness, rope and equipment briefing'],
    note: 'Get an early dinner and rest. Tomorrow is the longest day.',
  },
  {
    day: 6,
    place: 'Dhunda → Buran Ghati Pass → River Camp',
    title: 'The crossing',
    summary: 'Start early for Buran Ghati, cross the pass at around 15,000 ft, and descend from the Pabbar Valley towards the Barua and Kinnaur side. Snow, ice, scree and rope-assisted movement depend on live trail conditions.',
    terrain: 'Snow, pass & descent',
    duration: 'Approx. 8–9 km · 9–10 hours',
    elevation: '~13,400 ft → 15,000 ft → ~10,700 ft',
    stay: 'River Camp / Munirang side',
    meals: 'Breakfast, Packed Lunch & Dinner',
    highlights: ['15,000-ft Buran Ghati Pass crossing', 'Conditions-led descent towards the Kinnaur side'],
    note: 'One trail. Two valleys. The defining day of the expedition.',
  },
  {
    day: 7,
    place: 'River Camp → Barua → Shimla',
    title: 'From the high mountains back to civilisation',
    summary: 'Descend through changing forests, streams, waterfalls and orchards to Barua Village, then take the return road to Shimla and close the expedition.',
    terrain: 'Alpine → village',
    duration: 'Approx. 7 km trek · 5 hours + 6–7 hours drive',
    elevation: '15,000 ft pass → Barua village',
    stay: 'Expedition concludes in Shimla',
    meals: 'Breakfast & Lunch',
    highlights: ['Pine forests, streams and apple orchards', 'Barua village and return transfer to Shimla'],
  },
];

export const BURAN_FAQS = [
  {
    question: 'When is the Buran Ghati trek usually possible?',
    answer: 'The commonly planned windows are late spring to early summer and post-monsoon, but snow, road access, and local permissions can change the operating window. We confirm conditions before every departure.',
  },
  {
    question: 'How difficult is the crossing?',
    answer: 'It is a hard, conditions-dependent Himalayan trek. The pass day includes steep snow or scree and may use fixed ropes under an experienced team. Prior multi-day trekking and strong fitness are recommended.',
  },
  {
    question: 'Is this a fixed group departure?',
    answer: 'The route can be planned as a private expedition or aligned to a group departure. Share your dates and group size and our coordinator will recommend the safest format.',
  },
  {
    question: 'What should I expect from the altitude?',
    answer: 'The itinerary builds gradually towards the pass, with an acclimatisation excursion at Chandernahan. Hydration, pacing, and a conservative turnaround decision are part of the operating plan.',
  },
];

export const BURAN_PRACTICAL_POINTS = [
  ['Route', 'Janglik → Dayara → Litham → Chandranahan Lake → Dhunda → Buran Ghati → River Camp → Barua'],
  ['Duration', '7 days / 6 nights on the standard line'],
  ['High point', '15,000 ft approx. at Buran Ghati Pass'],
  ['Difficulty', 'Hard · snow and weather dependent'],
  ['Operating window', 'Commonly May–June and September–October; confirm locally'],
  ['Best for', 'Experienced trekkers, private groups, and expedition-minded travellers'],
] as const;
