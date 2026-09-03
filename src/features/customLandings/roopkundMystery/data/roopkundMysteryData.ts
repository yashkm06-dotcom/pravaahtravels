// This page intentionally mirrors the existing Pravaah Roopkund itinerary in
// `customLandings/roopkund/data/roopkundData.ts`, while keeping its presentation
// and supporting content independent from the original landing page.

export interface MysteryItineraryDay {
  day: number;
  title: string;
  route: string;
  distance: string;
  elevation: string;
  time: string;
  stay: string;
  meals: string;
  terrain: string;
  description: string;
  highlights: string[];
  image: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  note?: string;
  essential?: boolean;
}

export interface ChecklistGroup {
  id: string;
  title: string;
  intro: string;
  items: ChecklistItem[];
}

export const ROOPKUND_MYSTERY_META = {
  title: 'The Lake of Mysteries',
  subtitle: 'Roopkund Trek',
  description: 'A seven-day high-altitude journey from Rishikesh through Garhwal forests, alpine meadows and the legendary Roopkund basin.',
  priceLabel: 'Price on request',
  facts: [
    ['07', 'days / 06 nights'],
    ['15,750 ft', 'approx. high point'],
    ['Demanding', 'conditions-led terrain'],
    ['39 km', 'walking distance approx.'],
  ],
  route: 'Rishikesh → Lohajung / Wan → Rishikesh',
  heroImage: '/images/roopkund/hero-roopkund-mystery-lake.jpg',
};

export const ROOPKUND_MYSTERY_IMAGES = [
  { src: '/images/roopkund/hero-roopkund-mystery-lake.jpg', alt: 'A high Himalayan lake beneath snow peaks' },
  { src: '/images/roopkund/ghairoli-forest.jpg', alt: 'Oak and rhododendron forest on the Roopkund trail' },
  { src: '/images/roopkund/ali-bugyal.jpg', alt: 'Open alpine meadow at Ali Bugyal' },
  { src: '/images/roopkund/patar-nauchni.jpg', alt: 'Wind-shaped high ridge near Patar Nauchni' },
  { src: '/images/roopkund/bhagwabasa.jpg', alt: 'Rugged high-altitude terrain near Bhagwabasa' },
  { src: '/images/roopkund/mount-trishul.jpg', alt: 'Mount Trishul in evening mountain light' },
  { src: '/images/roopkund/bedni-bugyal.jpg', alt: 'Bedni Bugyal meadow and Himalayan ridgeline' },
  { src: '/images/roopkund/return-valley.jpg', alt: 'The return valley descending toward Wan' },
];

export const ROOPKUND_ITINERARY: MysteryItineraryDay[] = [
  {
    day: 1,
    title: 'Rishikesh → Lohajung / Wan',
    route: 'Rishikesh → Garhwal Himalayas → Lohajung / Wan',
    distance: 'Road journey',
    elevation: '1,120 ft → 7,600–7,800 ft',
    time: 'Scenic mountain drive',
    stay: 'Lohajung / Wan',
    meals: 'Dinner',
    terrain: 'Winding roads, river valleys and mountain settlements',
    description: 'The expedition begins with an early departure from Rishikesh. The road climbs through Garhwal valleys toward the Chamoli highlands. On arrival, settle into the designated accommodation and meet the expedition team for a route, weather, gear and altitude-awareness briefing.',
    highlights: ['Scenic drive through Garhwal valleys', 'Landscape transition into Chamoli mountain terrain', 'Evening briefing and gear inspection'],
    image: '/images/roopkund/lohajung-village.jpg',
  },
  {
    day: 2,
    title: 'Wan → Ghairoli Patal',
    route: 'Wan Village → Oak & Rhododendron Forest → Ghairoli Patal',
    distance: 'Approx. 8 km',
    elevation: '7,800 ft → 10,000 ft',
    time: '4–5 hours',
    stay: 'Ghairoli Patal Camp',
    meals: 'Breakfast, lunch & dinner',
    terrain: 'Quiet forest trails beneath oak and rhododendron canopy',
    description: 'The walking journey starts from Wan Village. The trail gradually leaves the settlement behind and enters dense Himalayan forest. This is the day to establish an even pace, practise steady breathing and let the expedition rhythm settle in.',
    highlights: ['First steps from Wan into old forest', 'Rhododendron and oak canopy', 'Controlled pace, hydration and acclimatisation'],
    image: '/images/roopkund/ghairoli-forest.jpg',
  },
  {
    day: 3,
    title: 'Ghairoli Patal → Patar Nauchni via Ali Bugyal',
    route: 'Ghairoli Patal → Ali Bugyal → Patar Nauchni',
    distance: 'Approx. 10 km',
    elevation: '10,000 ft → 12,820 ft',
    time: '5–6 hours',
    stay: 'Patar Nauchni Camp',
    meals: 'Breakfast, lunch & dinner',
    terrain: 'Forest trail opening into exposed alpine meadows and ridges',
    description: 'The forest gives way to the wide-open terrain of Ali Bugyal. Continue across the high meadow before climbing toward Patar Nauchni. Weather changes quickly in this exposed zone, so the evening is deliberately unhurried.',
    highlights: ['Forest-to-meadow transition', 'Wide Himalayan ridge views', 'Arrival at a high alpine camp'],
    image: '/images/roopkund/ali-bugyal.jpg',
  },
  {
    day: 4,
    title: 'Patar Nauchni → Bhagwabasa',
    route: 'Patar Nauchni → rugged high-altitude trail → Bhagwabasa',
    distance: 'Approx. 7 km',
    elevation: '12,820 ft → 14,120 ft',
    time: '4–5 hours',
    stay: 'Bhagwabasa Base Camp',
    meals: 'Breakfast, lunch & dinner',
    terrain: 'Rocky, exposed and potentially snow-covered sections',
    description: 'Vegetation thins as the expedition moves into colder, more exposed terrain. Reach Bhagwabasa, the staging point for the following day, then review the weather, trail conditions and personal readiness with the team.',
    highlights: ['Deeper entry into the high zone', 'Bhagwabasa staging camp at 14,120 ft', 'Final summit-day gear and weather check'],
    image: '/images/roopkund/bhagwabasa.jpg',
  },
  {
    day: 5,
    title: 'Bhagwabasa → Roopkund Summit → Base Camp',
    route: 'Bhagwabasa → Roopkund objective (~15,750 ft) → Base Camp',
    distance: 'Approx. 7 km',
    elevation: '14,120 ft → 15,750 ft',
    time: '6–8 hours',
    stay: 'Base Camp',
    meals: 'Breakfast, lunch & dinner',
    terrain: 'Steep rocky and snow / ice sections, glacial basin',
    description: 'The defining day begins early, at a time set by the team and conditions. Move together across steep, cold terrain toward the Roopkund objective. After an appropriate, conditions-led stay at the high basin, return to Base Camp for warm food and recovery.',
    highlights: ['Measured early-morning alpine push', 'Sunrise over the surrounding peaks', 'The expedition objective at Roopkund'],
    image: '/images/roopkund/mystery-roopkund-trishul.jpg',
  },
  {
    day: 6,
    title: 'Base Camp → Wan / Bedni explore',
    route: 'Base Camp → Bedni Bugyal landscapes → Wan Village',
    distance: 'Descent & exploration day',
    elevation: 'High camp → 7,800 ft',
    time: '5–6 hours descent and exploration',
    stay: 'Wan',
    meals: 'Breakfast, lunch & dinner',
    terrain: 'Meadow paths, viewpoints and descending forest trails',
    description: 'After the summit objective, the pace softens. Descend through Bedni Bugyal landscapes with time for mountain photography and quiet observation before returning to Wan for a restorative evening.',
    highlights: ['Recovery-led descent', 'Bedni Bugyal landscape time', 'Return to Wan and expedition reflection'],
    image: '/images/roopkund/bedni-bugyal.jpg',
  },
  {
    day: 7,
    title: 'Wan → Rishikesh',
    route: 'Wan → Garhwal valleys → Rishikesh',
    distance: 'Road journey home',
    elevation: '7,800 ft → 1,120 ft',
    time: 'Return drive',
    stay: 'Expedition concludes at Rishikesh',
    meals: 'Breakfast',
    terrain: 'Mountain highway descending through river valleys',
    description: 'After breakfast, descend by road through the Garhwal Himalayas. The final timing remains flexible for mountain-road conditions. The expedition concludes on arrival in Rishikesh.',
    highlights: ['Scenic return through Garhwal valleys', 'Time for group reflection', 'Arrival back in Rishikesh'],
    image: '/images/roopkund/return-valley.jpg',
  },
];

export const ROOPKUND_MYSTERY_EVIDENCE = {
  science: [
    'Roopkund is a high-altitude glacial lake in Uttarakhand’s Garhwal Himalaya.',
    'A 2019 Nature Communications study found that the skeletons came from multiple genetically distinct groups and were deposited at different times, rather than in one single event.',
  ],
  uncertainty: [
    'The evidence does not establish one definitive cause for every individual at the lake.',
    'Weather, access and conservation conditions can change what is visible at the basin; the expedition never treats the lake as a spectacle.',
  ],
  folklore: [
    'Local traditions connect the lake with Nanda Devi and a divine storm. We share this as living folklore, separate from archaeological evidence.',
    'Stories of a sudden hailstorm are part of the region’s oral tradition; they should not be presented as a proven historical explanation.',
  ],
  sourceUrl: 'https://www.nature.com/articles/s41467-019-11357-9',
};

export const ROOPKUND_LANDSCAPE_STAGES = [
  ['01', 'River gateway', 'Rishikesh begins and ends the route, where the Ganges valley gives way to Garhwal roads.', '/images/roopkund/rishikesh-valley.jpg'],
  ['02', 'Forest threshold', 'Wan and Ghairoli Patal bring the first steady walking days beneath oak and rhododendron.', '/images/roopkund/ghairoli-forest.jpg'],
  ['03', 'Open bugyal', 'Ali and Bedni Bugyal open the horizon, trading canopy for wind-shaped meadow.', '/images/roopkund/ali-bugyal.jpg'],
  ['04', 'Cold staging ground', 'Patar Nauchni and Bhagwabasa are exposed, weather-led camps above the tree line.', '/images/roopkund/bhagwabasa.jpg'],
  ['05', 'The basin', 'The Roopkund objective sits beneath the Trishul massif: quiet, high and approached with care.', '/images/roopkund/mount-trishul.jpg'],
];

export const ROOPKUND_CHECKLIST: ChecklistGroup[] = [
  { id: 'documents', title: 'Documents', intro: 'Keep originals dry and copies accessible.', items: [
    { id: 'doc-id', label: 'Government photo ID / passport', essential: true },
    { id: 'doc-insurance', label: 'Travel and trekking insurance details', essential: true },
    { id: 'doc-contacts', label: 'Emergency contacts and itinerary copy', essential: true },
  ] },
  { id: 'clothing', title: 'Clothing', intro: 'Layer for sun, wind, rain and cold camps.', items: [
    { id: 'cloth-shell', label: 'Waterproof windproof shell', essential: true },
    { id: 'cloth-warm', label: 'Warm insulated jacket and fleece', essential: true },
    { id: 'cloth-base', label: 'Thermals, quick-dry tops and trekking trousers', essential: true },
    { id: 'cloth-head', label: 'Warm hat, sun hat, gloves and buff', essential: true },
  ] },
  { id: 'gear', title: 'Trekking gear', intro: 'Break in boots and check every buckle before departure.', items: [
    { id: 'gear-boots', label: 'Broken-in high-ankle trekking boots', essential: true },
    { id: 'gear-pack', label: 'Trek backpack with rain cover', essential: true },
    { id: 'gear-poles', label: 'Trekking poles and headlamp', essential: true },
    { id: 'gear-bottle', label: 'Two reusable water bottles / insulated flask', essential: true },
  ] },
  { id: 'camp', title: 'Camp essentials', intro: 'Small comforts make cold evenings easier.', items: [
    { id: 'camp-sleep', label: 'Sleeping liner and ear plugs' },
    { id: 'camp-dry', label: 'Dry bags for clothing and sleeping kit', essential: true },
    { id: 'camp-seat', label: 'Small sit mat and compact towel' },
  ] },
  { id: 'personal', title: 'Personal items', intro: 'Pack light, pack what you will actually use.', items: [
    { id: 'personal-sun', label: 'Sunscreen, lip balm and sunglasses', essential: true },
    { id: 'personal-hygiene', label: 'Biodegradable toiletries and tissue', essential: true },
    { id: 'personal-snack', label: 'Personal snacks in reusable packaging' },
  ] },
  { id: 'health', title: 'Health & medication', intro: 'Bring your own supplies and follow clinician guidance.', items: [
    { id: 'health-prescription', label: 'Personal prescriptions in original packaging', note: 'Carry a clinician note where relevant.', essential: true },
    { id: 'health-firstaid', label: 'Personal first-aid and blister care', essential: true },
    { id: 'health-electrolyte', label: 'Electrolytes you already use safely' },
  ] },
  { id: 'electronics', title: 'Electronics', intro: 'Protect batteries from cold and moisture.', items: [
    { id: 'electronics-power', label: 'Power bank and charging cable', essential: true },
    { id: 'electronics-camera', label: 'Camera, spare batteries and dry pouch' },
  ] },
  { id: 'optional', title: 'Optional items', intro: 'Only add these if they support your way of travelling.', items: [
    { id: 'optional-binoculars', label: 'Compact binoculars' },
    { id: 'optional-journal', label: 'Field notebook and pencil' },
    { id: 'optional-multitool', label: 'Small personal multitool' },
  ] },
];

export const ROOPKUND_BEFORE_LEAVE = [
  'Walk in your boots and test your pack on consecutive days.',
  'Share allergies, prescriptions and relevant medical history privately with the expedition team.',
  'Download offline maps and save the meeting-point details.',
  'Check the weather-led operating plan during the final briefing.',
  'Plan your onward travel from Rishikesh with a little buffer.',
];

export const ROOPKUND_KNOW_BEFORE = [
  ['Best windows', 'May–June and September–October are the usual planning windows; final operations follow weather and local permissions.'],
  ['Starting point', 'Rishikesh is the gateway. The group transfers to Lohajung / Wan before walking.'],
  ['Effort', 'This is a demanding high-altitude trek with long days, cold camps and uneven ground.'],
  ['Weather', 'Conditions can change quickly above the tree line. The leader may alter pace, route or objective for safety.'],
  ['Connectivity', 'Mobile coverage is intermittent. Tell family your route and expected check-in rhythm before departure.'],
  ['Access', 'The lake basin is approached with respect for local rules and conservation guidance.'],
];

export const ROOPKUND_WHY_WALK = [
  ['A route with a rhythm', 'Seven days lets the landscape change gradually: river valley, forest, bugyal, high camp and basin.'],
  ['A mystery with evidence', 'Archaeology, local tradition and uncertainty can sit together without turning the lake into a myth machine.'],
  ['A prepared crossing', 'Pravaah’s existing itinerary, briefing and enquiry support give the journey a clear operational frame.'],
];

export const ROOPKUND_INCLUSIONS = [
  ['Accommodation and camps', 'Lodging and camp stays listed in the confirmed itinerary.'],
  ['Meals on route', 'Meals listed for each itinerary day, with trail food planned for long walking days.'],
  ['Ground transfers', 'Scheduled transfers between Rishikesh and Lohajung / Wan, as confirmed.'],
  ['Expedition leadership', 'Mountain leadership, local route support and a pre-departure briefing.'],
  ['Permits and logistics', 'Applicable forest / route permissions and expedition logistics arranged by Pravaah.'],
];

export const ROOPKUND_EXCLUSIONS = [
  ['Travel to Rishikesh', 'Flights, trains and inter-city travel to the gateway are not included.'],
  ['Personal gear', 'Boots, clothing, backpack and personal electronics unless specifically confirmed.'],
  ['Insurance and evacuation', 'Travel insurance and costs beyond field support remain the traveller’s responsibility.'],
  ['Personal expenses', 'Snacks, beverages, tips and discretionary purchases.'],
];

export const ROOPKUND_SAFETY = [
  ['Progressive pacing', 'The itinerary gains height in stages and includes a deliberate staging day before the summit objective.'],
  ['Conditions first', 'Weather, trail condition and group readiness guide each day’s final call.'],
  ['Turn-around discipline', 'The leader may shorten or turn around the objective when daylight, weather or health requires it.'],
  ['Speak early', 'Tell the team promptly about headache, breathlessness, nausea, injury or unusual fatigue.'],
];

export const ROOPKUND_RESPONSIBLE = [
  'Carry reusable bottles and pack out non-biodegradable waste.',
  'Stay on established trails and respect the fragile bugyal grasses.',
  'Do not remove, touch or photograph sensitive archaeological material.',
  'Keep camps quiet and respect villages, guides and local customs.',
];

export const ROOPKUND_FAQS = [
  ['Is Roopkund suitable for a first trek?', 'It is better suited to travellers who are already comfortable with sustained mountain walking. A private readiness conversation can help us assess the route honestly.'],
  ['What is the exact price?', 'This page intentionally shows Price on request. Dates, group size, permits and operating conditions affect the confirmed quote.'],
  ['Can the itinerary change?', 'Yes. Weather, trail conditions, local permissions and group readiness can change timings or the summit objective. Safety takes priority.'],
  ['What happens if I feel unwell?', 'Tell the expedition leader immediately. The team will assess the situation and may rest, descend or end the objective according to the operating plan.'],
  ['Can I bring a camera?', 'Yes, with spare batteries and a dry pouch. Please follow the team’s guidance around sensitive sites and other travellers.'],
  ['How do I enquire?', 'Use the enquiry button on this page. It opens Pravaah’s existing enquiry flow so the team can respond with current dates and inclusions.'],
];
